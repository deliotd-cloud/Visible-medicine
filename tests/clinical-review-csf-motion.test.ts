import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { build, type Plugin } from 'esbuild';

const sourceRevision = '420f4025b156ecc8f8cf5a864f60876c1fd0c56b';
const websiteBaseline = '44f543d655c787abae0a71764900ab631167c727';
const atlasRepo = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const gitOptions = { maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } };
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const json = (path: string): any => JSON.parse(readFileSync(path, 'utf8'));
const source = (path: string) => execFileSync('git', ['show', `${sourceRevision}:${path}`], { ...gitOptions, cwd: atlasRepo });
const cache = new Map<string, Buffer>();
const prior = (path: string): Buffer => {
  if (!cache.has(path)) cache.set(path, execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions));
  return cache.get(path)!;
};
const priorReviewPlugin: Plugin = { name: 'exact-prior-website-review', setup(api) {
  api.onLoad({ filter: /(?:^|[\\/])atlas-review[\\/]/ }, args => {
    const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
    assert(path.startsWith('atlas-review/') && !path.split('/').includes('..'));
    return { contents: prior(path).toString(),
      loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'ts' : 'js',
      resolveDir: dirname(args.path) };
  });
} };
async function load(previous = false): Promise<any> {
  const result = await build({ stdin: { contents: [
    "export * from './atlas-review/lib/nested-review-material';",
    "export * from './atlas-review/lib/nested-review';",
    "export * from './atlas-review/lib/nested-review-api';",
    "export * from './atlas-review/lib/csf-motion';",
    "export { ventricleCatalog } from './atlas-review/lib/ventricles';",
  ].filter(line => !previous || !line.includes("lib/csf-motion") && !line.includes('ventricleCatalog')).join('\n'),
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false,
    platform: 'node', format: 'esm', plugins: previous ? [priorReviewPlugin] : [] });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const reviewRequest = (body: unknown) => new Request('https://review.test/api/atlas-review/nested-review', {
  method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_CSF_WEBSITE_TEST' }, body: JSON.stringify(body),
});

test('schematic CSF import keeps four source spaces and requires fresh protected review',
  { timeout: 120000 }, async () => {
    const now = await load(), before = await load(true);
    const review = json('atlas-review/manifest.json');
    const receipt = json('atlas-review/integration-inputs.json');
    assert.equal(review.revision, sourceRevision);
    assert.equal(receipt.sourceCommit, sourceRevision);
    for (const path of ['app/csf-motion.tsx', 'app/body-scene.tsx', 'app/ventricles.tsx',
      'lib/csf-motion.ts', 'lib/ventricular-guide.ts', 'lib/nested-review-material.ts',
      'content/csf-motion.v1.json', 'content/body-renderer-revision.json']) {
      const entry = review.files.find((item: any) => item.path === path);
      assert(entry, `${path}: protected import entry`);
      assert.equal(entry.sourceSha256, sha(source(path)), `${path}: exact Atlas source`);
      assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: imported hash`);
      if (path !== 'content/body-renderer-revision.json') assert.equal(
        receipt.inputs.find((item: any) => item.path === 'atlas-review/' + path)?.sha256,
        entry.importedSha256, `${path}: protected receipt`);
    }
    const motion = json('atlas-review/content/csf-motion.v1.json');
    const catalog = now.ventricleCatalog;
    assert.equal(catalog.structures.length, 9, 'Four spaces and five separate context structures');
    assert.equal(catalog.ventricularIds.length, 4);
    assert.deepEqual(motion.records.map((item: any) => item.structure.id), catalog.ventricularIds);
    assert.equal(motion.records.reduce((count: number, item: any) => count + item.tracks.length, 0), 160);
    for (const item of motion.records) assert.equal(item.tracks.length, 40);
    assert.deepEqual(motion.axis, [0, 1, 0]);
    assert.equal(motion.periodSeconds, 4);
    assert.equal(motion.bundle.sha256, catalog.bundles.find((item: any) => item.id === 'ventricles').sha256);
    assert.equal(now.csfTracksFor(catalog.structures.find((item: any) => item.id === catalog.contextIds[0]), motion.bundle.sha256).length, 0);
    assert.equal(now.csfTracksFor(motion.records[0].structure, 'foreign-bundle').length, 0);
    assert.equal(now.csfMotionFor({ ...catalog.parent, name: 'foreign' }), null);
    const allowed = { requested: true, reducedMotion: false, pageHidden: false,
      ready: true, explode: 0, cut: false, exam: false };
    assert.equal(now.csfMotionAllowed(allowed), true);
    for (const change of [{ requested: false }, { reducedMotion: true }, { pageHidden: true },
      { ready: false }, { explode: 1 }, { cut: true }, { exam: true }])
      assert.equal(now.csfMotionAllowed({ ...allowed, ...change }), false);

    const storage = new Proxy({}, { get() { throw Error('Stale review reached storage'); } });
    let contexts = 0, changed = 0, unchanged = 0, refused = 0;
    for (const group of now.nestedReviewRows) for (const row of group.surfaces) {
      const current = await now.nestedReviewMaterial(group.key, row.id);
      const previous = await before.nestedReviewMaterial(group.key, row.id);
      assert(current && previous);
      contexts++;
      const c = current.context, p = previous.context;
      assert.deepEqual(current.source, previous.source);
      assert.equal(c.sourceHash, p.sourceHash);
      assert.equal(c.sourceFrame, p.sourceFrame);
      assert.equal(c.revisions.imaging, null);
      if (group.study !== 'ventricles') {
        unchanged++;
        assert.deepEqual(c.teachingTabs, p.teachingTabs);
        assert.deepEqual(current.teaching, previous.teaching);
        assert.equal(c.revisions.teaching, p.revisions.teaching);
        assert.deepEqual(c.checklists, p.checklists);
        continue;
      }
      changed++;
      assert.deepEqual(c.teachingTabs, [...p.teachingTabs, 'guided-learning']);
      assert.equal(c.teachingTabs.length, 9);
      assert.equal(current.teaching.guidedLearning.steps.length, 5);
      assert.equal(current.teaching.csfMotion.markerCount, 160);
      assert.equal(current.teaching.csfMotion.periodSeconds, 4);
      assert.equal(current.teaching.csfMotion.sourceBundleHash, motion.bundle.sha256);
      assert.match(current.teaching.csfMotion.limitation, /no flow through unsegmented foramina, aqueduct, outlets or subarachnoid spaces/iu);
      assert.match(current.teaching.csfMotion.limitation, /not measured physiology, net circulation or a fluid-dynamics simulation/iu);
      assert(current.teaching.csfMotion.references.some((item: any) => item.url === 'https://pubmed.ncbi.nlm.nih.gov/26241682/'));
      for (const field of ['topics', 'lesson', 'concept']) assert.deepEqual(current.teaching[field], previous.teaching[field]);
      for (const [url, title] of Object.entries(previous.teaching.referenceTitles))
        assert.equal(current.teaching.referenceTitles[url], title);
      assert.notEqual(c.revisions.teaching, p.revisions.teaching);
      for (const track of ['geometry', 'teaching']) {
        const draft = now.blankNestedReview(c, track);
        assert.equal(draft.attested, false);
        assert.equal(draft.checks['csf-motion'], false);
        if (track === 'teaching') assert.equal(draft.checks['guided-learning'], false);
        const body = { catalogScope: c.catalogScope, nestedKey: c.nestedKey,
          structureId: c.structureId, sourceFrame: c.sourceFrame, materialHash: c.materialHash,
          revisionHash: c.revisions[track], checklistVersion: c.checklistVersion, track,
          expectedVersion: 0, draft };
        for (const patch of [{ revisionHash: p.revisions[track] }, { materialHash: p.materialHash },
          { sourceFrame: 'foreign-frame' }]) {
          assert.equal((await now.postNestedReview(reviewRequest({ ...body, ...patch }), storage)).status, 409);
          refused++;
        }
      }
    }
    assert.deepEqual({ contexts, changed, unchanged, refused },
      { contexts: 108, changed: 4, unchanged: 104, refused: 24 });
    for (const folder of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis']) {
      const base = `public/atlas-runtime/${folder}/`;
      const manifest = json(base + 'manifest.json');
      assert.equal(manifest.sourceCommit, sourceRevision);
      assert.equal(manifest.patientDataIncluded, false);
      assert.equal(manifest.clinicalApproved, false);
      for (const file of manifest.files) assert.equal(sha(readFileSync(base + file.path)), file.sha256);
      const inputs = json(base + 'source-inputs.json');
      if (folder !== 'shoulder') for (const path of
        ['lib/csf-motion.ts', 'app/csf-motion.tsx', 'content/csf-motion.v1.json'])
        assert.equal(inputs.find((item: any) => item.path === path)?.sha256, sha(source(path)),
          `${folder}/${path}: exact source input`);
    }
    console.log(JSON.stringify({ sourcePackets: contexts, revisedVentricularTeaching: changed,
      otherTeachingExact: unchanged, priorRequestsRefusedBeforeStorage: refused,
      markers: 160, spaces: 4, clinicalApproved: false }));
  });
