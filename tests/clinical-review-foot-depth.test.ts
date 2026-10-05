import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const oldSource = '19f9a7fa02b98b3df8a71a645fe68d3894094178';
const newSource = '9fcf6007719b78c83979a1fbfbca0e4eadbcc42b';
const oldWebsite = 'e2812b54de7577ee3dad61ab9adcd32507fff666';
const fixturePath = 'tests/atlas-foot-depth-baseline.json';
const fixtureSha = 'cfcf0b365f0d7fc35120dee6eca0b5f3c361e76a985277c0004ba62dd77cae21';
const atlasRepo = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const footSlugs = ['abductor-hallucis', 'abductor-digiti-minimi', 'flexor-digitorum-brevis',
  'quadratus-plantae', 'extensor-digitorum-brevis'];
type Any = any;
const sha = (value: unknown): string => createHash('sha256').update(
  typeof value === 'string' || Buffer.isBuffer(value) ? value as string | Buffer : JSON.stringify(value) ?? 'undefined',
).digest('hex');
const json = (path: string): Any => JSON.parse(readFileSync(path, 'utf8'));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const source = (path: string): Buffer => execFileSync('git', ['show', `${newSource}:${path}`], {
  cwd: atlasRepo, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const noticePaths = (): string[] => execFileSync('git', ['ls-files', '-z']).toString().split('\0')
  .filter(path => /^(?:atlas-review|public\/atlas-runtime|public\/atlas-review-viewer|public\/media\/atlas)\//u.test(path)
    && /(?:NOTICE|LICENSE|LICENCE)/iu.test(path)).sort();

async function api(includeFoot = false): Promise<Any> {
  const bundled = await build({ stdin: { contents: [
    "export { specimenReviewRows, specimenReviewMaterial } from './atlas-review/lib/specimen-review-material';",
    "export { limbDefinitions } from './atlas-review/lib/um-limb-studies';",
    "export { specimenTeachingFor } from './atlas-review/lib/um-limb-teaching';",
    ...(includeFoot ? ["export { umFootDepth } from './atlas-review/content/um-foot-depth';"] : []),
    "export { umLimbGuidedDissection } from './atlas-review/lib/um-limb-guided-dissection';",
    "export { blankSpecimenReview } from './atlas-review/lib/specimen-review';",
    "export { postSpecimenReview } from './atlas-review/lib/specimen-review-api';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
}

if (process.argv.includes('--capture')) {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), oldWebsite);
  const manifestBytes = readFileSync('atlas-review/manifest.json');
  assert.equal(JSON.parse(manifestBytes.toString()).revision, oldSource);
  const current = await api();
  const packets: Any[] = [];
  for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
    const packet = await current.specimenReviewMaterial(row.key, surface.id);
    assert.ok(packet);
    const c = packet.context;
    packets.push({ key: `${row.key}|${surface.id}`, slug: packet.source.structure.slug,
      sourceSha: sha(packet.source), structureSha: sha(packet.source.structure), sourceHash: c.sourceHash,
      sourceFrame: c.sourceFrame, atlasLink: packet.atlasLink, atlasPath: packet.atlasPath,
      teachingSha: sha(packet.teaching), teachingHash: c.teachingHash, materialHash: c.materialHash,
      teachingRevision: c.revisions.teaching, geometryRevision: c.revisions.geometry,
      imagingRevision: c.revisions.imaging, teachingTabs: clone(c.teachingTabs),
      teachingChecklistSha: sha(c.checklists.teaching), blockersSha: sha(c.blockers) });
  }
  assert.equal(packets.length, 356);
  const bindingsBytes = readFileSync('atlas-review/content/um-limb-teaching-bindings.v1.json');
  const bindings = JSON.parse(bindingsBytes.toString()).bindings;
  assert.equal(bindings.length, 67);
  const pins = bindings.map((pin: Any) => ({ id: pin.surface.id, slug: pin.surface.slug,
    surfaceSha: sha(pin.surface), bundleSha: pin.bundleSha256, lessonSha: sha(pin.lesson) }));
  const guides = Object.fromEntries(Object.entries(current.limbDefinitions).map(([scope, definition]) =>
    [scope, current.umLimbGuidedDissection(definition)]));
  assert.equal(guides.knee.steps.length, 7);
  const baseline = { schema: 1, provenance: { atlasSourceCommit: oldSource, websiteCommit: oldWebsite,
    manifestSha: sha(manifestBytes), capture: 'Hash-only public source/review metadata; no histories, scans or identifiers' },
    packets, pins, bindingsSha: sha(bindingsBytes), guides: clone(guides),
    modelRecordsSha: sha(json('lib/atlas-model-inventory.json').models),
    packages: ['package.json', 'package-lock.json'].map(path => ({ path, sha256: sha(readFileSync(path)) })),
    notices: noticePaths().map(path => ({ path, sha256: sha(readFileSync(path)) })),
    privatePlexusManifestSha: sha(readFileSync('lib/plexus-review-manifest.json')) };
  writeFileSync(fixturePath, JSON.stringify(baseline));
  console.log(JSON.stringify({ fixturePath, sha256: sha(readFileSync(fixturePath)), packets: packets.length,
    pins: pins.length, guides: Object.keys(guides).length, notices: baseline.notices.length,
    source: oldSource, website: oldWebsite }));
} else {
  test('foot depth import adds five source-bound drafts and preserves earlier public review material',
    { timeout: 120000 }, async () => {
    const fixtureBytes = readFileSync(fixturePath);
    assert.equal(sha(fixtureBytes), fixtureSha, 'immutable pre-import fixture');
    const before = JSON.parse(fixtureBytes.toString());
    assert.equal(before.schema, 1);
    assert.equal(before.provenance.atlasSourceCommit, oldSource);
    assert.equal(before.provenance.websiteCommit, oldWebsite);
    assert.equal(before.packets.length, 356);
    assert.equal(before.pins.length, 67);
    const review = json('atlas-review/manifest.json');
    const receipt = json('atlas-review/integration-inputs.json');
    assert.equal(review.revision, newSource);
    assert.equal(review.files.length, 1073, 'one new protected foot-depth source');
    assert.equal(receipt.sourceCommit, newSource);
    for (const path of ['content/um-foot-depth.ts', 'content/um-limb-teaching.ts',
      'content/um-limb-teaching-bindings.v1.json', 'lib/specimen-depth-scope.ts',
      'lib/specimen-review-material.ts', 'lib/specimen-review.ts', 'content/body-renderer-revision.json']) {
      const entry = review.files.find((item: Any) => item.path === path);
      assert.ok(entry, `${path}: protected import entry`);
      assert.equal(entry.sourceSha256, sha(source(path)), `${path}: canonical source blob`);
      assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: imported bytes`);
      if (path !== 'content/body-renderer-revision.json') assert.equal(
        receipt.inputs.find((item: Any) => item.path === 'atlas-review/' + path)?.sha256,
        entry.importedSha256, `${path}: receipt input`);
    }
    for (const folder of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis']) {
      const base = `public/atlas-runtime/${folder}/`;
      const manifest = json(base + 'manifest.json');
      assert.equal(manifest.sourceCommit, newSource, folder);
      assert.equal(manifest.patientDataIncluded, false);
      assert.equal(manifest.clinicalApproved, false);
      const inputs = json(base + 'source-inputs.json');
      if (folder !== 'shoulder') {
        const path = 'content/um-limb-teaching-bindings.v1.json';
        assert.equal(inputs.find((entry: Any) => entry.path === path)?.sha256,
          sha(source(path)), `${folder}/${path}`);
      }
      for (const file of manifest.files) assert.equal(sha(readFileSync(base + file.path)), file.sha256);
    }
    const viewerBase = 'public/atlas-review-viewer/';
    const viewer = json(viewerBase + 'manifest.json');
    assert.equal(viewer.sourceCommit, newSource);
    assert.equal(viewer.websiteIntegrationSha256, receipt.sha256);
    assert.equal(viewer.personalRecordsIncluded, false);
    for (const file of viewer.files) assert.equal(sha(readFileSync(viewerBase + file.path)), file.sha256);
    assert.equal(sha(readFileSync('lib/plexus-review-manifest.json')), before.privatePlexusManifestSha);
    const inventory = json('lib/atlas-model-inventory.json');
    assert.equal(inventory.models.length, 137);
    assert.equal(sha(inventory.models), before.modelRecordsSha);
    for (const model of inventory.models) for (const path of model.paths) {
      const bytes = readFileSync('public' + path);
      assert.equal(bytes.length, model.bytes, `${path}: model bytes`);
      assert.equal(sha(bytes), model.sha256, `${path}: model payload`);
    }
    for (const item of before.packages) assert.equal(sha(readFileSync(item.path)), item.sha256);
    assert.deepEqual(noticePaths(), before.notices.map((item: Any) => item.path));
    for (const item of before.notices) {
      const bytes = readFileSync(item.path);
      if (item.path === 'public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt') {
        const text = bytes.toString();
        assert.match(text, new RegExp(`^Atlas source: ${newSource}$`, 'mu'));
        assert.equal(sha(text.replace(`Atlas source: ${newSource}`, `Atlas source: ${oldSource}`)), item.sha256);
      } else assert.equal(sha(bytes), item.sha256, item.path);
    }
    const current = await api(true);
    for (const [scope, guide] of Object.entries(before.guides))
      assert.deepEqual(current.umLimbGuidedDissection(current.limbDefinitions[scope]), guide);
    const oldPackets = new Map<string, Any>(before.packets.map((item: Any) => [item.key, item]));
    assert.equal(oldPackets.size, 356);
    const renderer = json('atlas-review/content/body-renderer-revision.json');
    const forbidden = { prepare() { throw Error('Stale review reached storage'); } };
    let changed = 0, unchanged = 0, staleRejected = 0, calf = 0, thigh = 0;
    for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
      const packet = await current.specimenReviewMaterial(row.key, surface.id);
      const previous = oldPackets.get(`${row.key}|${surface.id}`);
      assert.ok(packet && previous);
      const c = packet.context;
      assert.equal(sha(packet.source), previous.sourceSha);
      assert.equal(sha(packet.source.structure), previous.structureSha);
      assert.equal(c.sourceHash, previous.sourceHash);
      assert.equal(c.sourceFrame, previous.sourceFrame);
      assert.equal(packet.atlasLink, previous.atlasLink);
      assert.equal(packet.atlasPath, previous.atlasPath);
      assert.equal(sha(c.blockers), previous.blockersSha);
      assert.equal(c.revisions.imaging, previous.imagingRevision);
      assert.equal(c.rendererHash, renderer.sha256);
      assert.notEqual(c.revisions.geometry, previous.geometryRevision, 'display review expires conservatively');
      assert.notEqual(c.materialHash, previous.materialHash);
      if (c.teachingTabs.includes('calf-depth')) calf++;
      if (c.teachingTabs.includes('thigh-depth')) thigh++;
      const affected = ['foot', 'whole'].some(scope => row.key === current.limbDefinitions[scope].key)
        && footSlugs.includes(packet.source.structure.slug);
      if (affected) {
        changed++;
        assert.deepEqual(c.teachingTabs, [...previous.teachingTabs, 'foot-depth']);
        assert.equal(c.teachingTabs.length, 11);
        assert.equal(sha(c.checklists.teaching.slice(0, -1)), previous.teachingChecklistSha);
        assert.equal(c.checklists.teaching.at(-1)?.id, 'foot-depth');
        assert.equal(current.blankSpecimenReview(c, 'teaching').checks['foot-depth'], false);
        const retained = clone(packet.teaching);
        assert.equal(retained.lesson.depth.status, 'draft');
        assert.equal(retained.lesson.depth.revision, 'um-foot-depth-20261005-v1');
        assert.equal(retained.lesson.depth.reviewScope, 'foot-depth');
        assert.deepEqual(retained.lesson.depth, current.umFootDepth[packet.source.structure.slug]);
        delete retained.lesson.depth;
        assert.equal(sha(retained), previous.teachingSha);
        assert.notEqual(c.teachingHash, previous.teachingHash);
        assert.notEqual(c.revisions.teaching, previous.teachingRevision);
        const detached = clone(packet);
        packet.teaching.lesson.depth.relationships.body = 'Changed';
        assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), detached);
        for (const patch of [{ revisionHash: previous.teachingRevision },
          { materialHash: previous.materialHash }, { sourceFrame: 'foreign-frame' }]) {
          const request = new Request('https://review.test/api/specimen-review', { method: 'POST', headers: {
            origin: 'https://review.test', 'content-type': 'application/json',
            'oai-authenticated-user-id': 'SYNTHETIC_FOOT_DEPTH_WEBSITE',
          }, body: JSON.stringify({ catalogScope: c.catalogScope, specimenKey: c.specimenKey,
            structureId: c.structureId, sourceFrame: c.sourceFrame, materialHash: c.materialHash,
            revisionHash: c.revisions.teaching, checklistVersion: c.checklistVersion,
            track: 'teaching', expectedVersion: 0,
            draft: current.blankSpecimenReview(c, 'teaching'), ...patch }) });
          assert.equal((await current.postSpecimenReview(request, forbidden)).status, 409);
          staleRejected++;
        }
      } else {
        unchanged++;
        assert.equal(sha(packet.teaching), previous.teachingSha);
        assert.equal(c.teachingHash, previous.teachingHash);
        assert.equal(c.revisions.teaching, previous.teachingRevision);
        assert.deepEqual(c.teachingTabs, previous.teachingTabs);
        assert.equal(sha(c.checklists.teaching), previous.teachingChecklistSha);
      }
    }
    assert.deepEqual([changed, unchanged, staleRejected, calf, thigh], [10, 346, 30, 24, 32]);
    const bindingBytes = readFileSync('atlas-review/content/um-limb-teaching-bindings.v1.json');
    const bindings = JSON.parse(bindingBytes.toString()).bindings;
    assert.equal(bindings.length, 67);
    const oldPins = new Map<string, Any>(before.pins.map((item: Any) => [item.id, item]));
    let changedPins = 0, unchangedPins = 0, foreign = 0;
    for (const pin of bindings) {
      const old = oldPins.get(pin.surface.id);
      assert.ok(old);
      assert.equal(sha(pin.surface), old.surfaceSha);
      assert.equal(pin.bundleSha256, old.bundleSha);
      if (footSlugs.includes(pin.surface.slug)) {
        changedPins++;
        assert.equal(pin.lesson.depth.status, 'draft');
        assert.equal(pin.lesson.depth.revision, 'um-foot-depth-20261005-v1');
        assert.equal(pin.lesson.depth.reviewScope, 'foot-depth');
        assert.deepEqual(pin.lesson.depth, current.umFootDepth[pin.surface.slug]);
        const lesson = clone(pin.lesson);
        delete lesson.depth;
        assert.equal(sha(lesson), old.lessonSha);
      } else { unchangedPins++; assert.equal(sha(pin.lesson), old.lessonSha); }
    }
    for (const surface of current.limbDefinitions.whole.surfaces) {
      for (const patch of [{ name: 'Foreign' }, { slug: surface.slug + '-foreign' },
        { laterality: 'left' }, { sources: surface.sources.map((s: Any) => ({ ...s, sha256: 'foreign' })) },
        { bounds: { ...surface.bounds, min: [surface.bounds.min[0] + 1, ...surface.bounds.min.slice(1)] } }]) {
        assert.equal(current.specimenTeachingFor(current.limbDefinitions.whole, { ...surface, ...patch }), null);
        foreign++;
      }
      const altered = clone(current.limbDefinitions.whole);
      altered.catalog.bundles.find((b: Any) => b.id === surface.bundle).sha256 = 'foreign';
      assert.equal(current.specimenTeachingFor(altered, surface), null);
      foreign++;
    }
    assert.deepEqual([changedPins, unchangedPins, foreign], [5, 62, 402]);
    console.log(JSON.stringify({ sourcePackets: 356, changedTeachingContexts: changed,
      unchangedTeachingContexts: unchanged, footDepthContexts: changed, calfDepthContexts: calf,
      thighDepthContexts: thigh, changedPins, unchangedPins, foreignBindingRefusals: foreign,
      staleAffectedSavesRejectedBeforeStorage: staleRejected, guidesExact: Object.keys(before.guides).length,
      clinicalApproved: false }));
  });
}
