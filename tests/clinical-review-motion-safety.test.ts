import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { build, type Plugin } from 'esbuild';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

const priorWebsite = 'a0df5f3d4df65f6d45ea6e6d71d6a196c22b51ef';
const featureWebsite = '6ed9828fa45c415075e1a57b1ea922347e2a7b02';
const priorSource = '0e988a782fb3e6f71bb9220b53aebeedbadd30f9';
const atlasRepo = currentAtlasDeliveryRoot();
const gitOptions = { maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } };
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const json = (path: string): any => JSON.parse(readFileSync(path, 'utf8'));
const priorCache = new Map<string, Buffer>();
const featureCache = new Map<string, Buffer>();
function feature(path:string):Buffer{
 if(!featureCache.has(path))featureCache.set(path,execFileSync('git',['show',featureWebsite+':'+path],gitOptions));
 return featureCache.get(path)!;
}
function prior(path: string): Buffer {
  if (!priorCache.has(path)) priorCache.set(path,
    execFileSync('git', ['show', `${priorWebsite}:${path}`], gitOptions));
  return priorCache.get(path)!;
}
function priorPlugin(): Plugin { return { name: 'immutable-prior-review', setup(api) {
  api.onLoad({ filter: /(?:^|[\\/])atlas-review[\\/]/ }, args => {
    const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
    assert(path.startsWith('atlas-review/') && !path.split('/').includes('..'));
    return { contents: prior(path).toString(),
      loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'ts' : 'js',
      resolveDir: dirname(args.path) };
  });
} }; }
function featurePlugin():Plugin{return {name:'immutable-motion-feature-review',setup(api){
 api.onLoad({filter:/(?:^|[\\/])atlas-review[\\/]/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');
  assert(path.startsWith('atlas-review/')&&!path.split('/').includes('..'));
  return {contents:feature(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':path.endsWith('.ts')?'ts':'js',resolveDir:dirname(args.path)};
 });
}};}
function mutationPlugin(data: any): Plugin { return { name: 'mutated-csf-only', setup(api) {
  api.onLoad({ filter: /[\\/]content[\\/]csf-motion\.v1\.json$/ },
    () => ({ contents: JSON.stringify(data), loader: 'json' }));
} }; }
async function load(previous = false, mutation?: any, featureEpoch = false): Promise<any> {
  const result = await build({ stdin: { contents: [
    "export * from './atlas-review/lib/nested-review-material';",
    "export * from './atlas-review/lib/nested-review';",
    "export * from './atlas-review/lib/nested-review-api';",
    "export * from './atlas-review/lib/csf-motion';",
    "export { ventricleCatalog } from './atlas-review/lib/ventricles';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'esm', plugins: [
    ...(mutation ? [mutationPlugin(mutation)] : []), ...(previous ? [priorPlugin()] : []), ...(featureEpoch ? [featurePlugin()] : []),
  ] });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const request = (payload: unknown) => new Request('https://review.test/api/atlas-review/nested-review', {
  method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_MOTION_SAFETY_TEST' }, body: JSON.stringify(payload),
});

test('current CSF record identity and renderer changes require fresh protected review',
  { timeout: 120000 }, async () => {
    const review = json('atlas-review/manifest.json');
    const previousManifest = JSON.parse(prior('atlas-review/manifest.json').toString());
    assert.equal(previousManifest.revision, priorSource);
    const sourceRevision = review.revision;
    assert.match(sourceRevision, /^[a-f0-9]{40}$/);
    assert.notEqual(sourceRevision, priorSource);
    assert.equal(sourceRevision,CURRENT_ATLAS_REVISION);
    assert.equal(json('atlas-review/integration-inputs.json').sourceCommit, sourceRevision);
    for (const path of ['lib/csf-motion.ts', 'app/regional-guided-learning.tsx',
      'content/body-renderer-revision.json', 'lib/nested-review-material.ts']) {
      const entry = review.files.find((item: any) => item.path === path);
      assert(entry, `${path}: protected import entry`);
      const source = execFileSync('git', ['show', `${sourceRevision}:${path}`],
        { ...gitOptions, cwd: atlasRepo });
      assert.equal(entry.sourceSha256, sha(source), `${path}: exact new Atlas Git blob`);
      assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)),
        `${path}: imported bytes`);
    }
    const motion = json('atlas-review/content/csf-motion.v1.json');
    const now = await load(), featureNow=await load(false,undefined,true), before = await load(true), catalog = now.ventricleCatalog;
    assert.deepEqual(motion.records.map((item: any) => item.structure.id), catalog.ventricularIds);
    assert.equal(catalog.structures.length, 9);
    assert.equal(now.csfMotionFor(catalog.parent)?.status, 'draft');
    const context = catalog.structures.find((item: any) => item.id === catalog.contextIds[0]);
    assert(context);
    const substitute = structuredClone(motion);
    substitute.records[0].structure = context; // Real catalog context, unchanged 40 tracks.
    const reordered = structuredClone(motion);
    [reordered.records[0], reordered.records[1]] = [reordered.records[1], reordered.records[0]];
    for (const mutation of [substitute, reordered]) {
      const hardened = await load(false, mutation);
      const featureHardened=await load(false,mutation,true);
      assert.equal(featureHardened.csfMotionFor(catalog.parent),null);
      for(const record of motion.records)assert.deepEqual(featureHardened.csfTracksFor(record.structure,motion.bundle.sha256),[]);
      assert.deepEqual(featureHardened.csfTracksFor(context,motion.bundle.sha256),[]);
      assert.equal(hardened.csfMotionFor(catalog.parent), null);
      for (const record of motion.records)
        assert.deepEqual(hardened.csfTracksFor(record.structure, motion.bundle.sha256), []);
      assert.deepEqual(hardened.csfTracksFor(context, motion.bundle.sha256), []);
    }
    // The immutable prior runtime demonstrates that these inputs exercised the old gap.
    for (const mutation of [substitute, reordered])
      assert((await load(true, mutation)).csfMotionFor(catalog.parent));

    const storage = new Proxy({}, { get() { throw Error('Stale review reached storage'); } });
    let contexts = 0, refusals = 0;
    for (const group of now.nestedReviewRows) for (const row of group.surfaces) {
      const a = await featureNow.nestedReviewMaterial(group.key, row.id);
      const live=await now.nestedReviewMaterial(group.key,row.id);
      const b = await before.nestedReviewMaterial(group.key, row.id);
      assert(a && b && live); contexts++;
      assert.deepEqual(live.source,a.source);
      const c = a.context, p = b.context, l=live.context;
      assert.deepEqual(a.source, b.source);
      assert.deepEqual(a.teaching, b.teaching);
      assert.equal(c.sourceHash, p.sourceHash);
      assert.equal(c.sourceFrame, p.sourceFrame);
      assert.equal(c.teachingHash, p.teachingHash);
      assert.equal(c.revisions.teaching, p.revisions.teaching);
      assert.deepEqual(c.teachingTabs, p.teachingTabs);
      assert.deepEqual(c.checklists, p.checklists);
      assert.equal(c.revisions.imaging, null);
      assert.notEqual(c.rendererHash, p.rendererHash);
      assert.notEqual(c.materialHash, p.materialHash);
      assert.notEqual(c.revisions.geometry, p.revisions.geometry);
      if (group.study !== 'ventricles') continue;
      assert.equal(l.revisions.imaging,null);
      for (const track of ['geometry', 'teaching']) {
        const payload = { catalogScope: l.catalogScope, nestedKey: l.nestedKey,
          structureId: l.structureId, sourceFrame: l.sourceFrame, track,
          materialHash: l.materialHash, revisionHash: l.revisions[track],
          checklistVersion: l.checklistVersion, expectedVersion: 0,
          draft: now.blankNestedReview(l, track) };
        assert.equal(payload.draft.status, 'draft');
        assert.equal(payload.draft.attested, false);
        const patches = [{ materialHash: p.materialHash }, { sourceFrame: 'foreign-frame' },
          ...(track === 'geometry' ? [{ revisionHash: p.revisions.geometry }] : [])];
        for (const patch of patches) {
          assert.equal((await now.postNestedReview(request({ ...payload, ...patch }), storage)).status, 409);
          refusals++;
        }
      }
    }
    assert.deepEqual({ contexts, refusals }, { contexts: 108, refusals: 20 });
    console.log(JSON.stringify({ previousWebsite: priorWebsite, sourceRevision,
      featureSourceAndTeachingPacketsExact: contexts, currentSourcePacketsExact: contexts, staleOrForeignRefusedBeforeStorage: refusals,
      contextSubstitutionDenied: true, recordReorderDenied: true, clinicalApproved: false }));
  });

test('current delivery source admission matches Atlas HEAD',()=>{assert(currentAtlasDeliveryRoot());});
