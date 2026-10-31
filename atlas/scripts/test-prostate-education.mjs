import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const built = await build({ stdin: {
  contents: "export * from './lib/prostate-education-binding'; export * from './lib/prostate-zones'; export * from './lib/learning-resources'; export * from './lib/imaging-sync'; export * from './lib/didanix-atlas-adapter';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const wrong = 'b'.repeat(64);
// Local source metadata only. Resource/annotation and viewer state below are synthetic.
const catalog = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));
const parent = catalog.structures.find(s => s.id === api.PROSTATE_PARENT_ID);
assert(parent);
const parentBundle = catalog.bundles.find(b => b.id === parent.bundle);
assert(parentBundle);
const binding = api.prostateEducationBinding(catalog, parent);
assert.equal(binding.records.length, 4);
assert.deepEqual(binding.records.map(r => r.structureId), api.prostateZones.map(z => z.id));
assert.deepEqual(binding.entries.map(e => e.id), api.prostateZones.map(z => z.id));
for (const [index, record] of binding.records.entries()) {
  assert.deepEqual(record.sources, [{ file: 'vm-prostate-zones', sha256: api.PROSTATE_ZONE_REVISION }]);
  assert.deepEqual(record.nested, { study: 'prostate-zones', parentId: parent.id,
    parentSources: parent.sources, parentBundleSha256: parentBundle.sha256, bundleSha256: api.PROSTATE_ZONE_REVISION });
  assert.equal(binding.entries[index].reference, null);
  assert(!('center' in binding.entries[index]));
}
const empty = (c, p) => assert.deepEqual(api.prostateEducationBinding(c, p), { records: [], entries: [] });
empty(undefined, parent);
empty(catalog, { ...parent, sources: [{ file: parent.sources[0].file, sha256: wrong }] });
empty(catalog, { ...parent, bundle: 'stale-bundle' });
empty({ ...catalog, structures: [parent, parent] }, parent);
empty({ ...catalog, bundles: [] }, parent);
empty({ ...catalog, bundles: [...catalog.bundles, ...catalog.bundles] }, parent);
empty({ ...catalog, bundles: [{ ...catalog.bundles[0], sha256: 'not-a-hash' }] }, parent);
empty({ ...catalog, sourceVersion: 'stale' }, parent);
empty({ ...catalog, structures: [{ ...parent, sources: [{ file: parent.sources[0].file, sha256: wrong }] }] }, parent);

const resource = { id: 'vm:resource:prostate-synthetic', revision: 1, kind: 'mri', title: 'Synthetic fixture',
  ageGroup: 'adult', laterality: 'midline', regionIds: ['pelvis'], material: { sha256: wrong, origin: 'synthetic' },
  anchors: binding.records.map((_, i) => ({ type: 'volume', id: `zone-${i}`, seriesId: 'synthetic-series',
    frameId: 'synthetic-frame', annotationId: `annotation-${i}`, geometry: 'region' })) };
const links = binding.records.map((anatomy, i) => ({ id: `vm:link:prostate-zone-${i}`, revision: 1,
  anatomy, resourceId: resource.id, resourceRevision: 1, materialSha256: wrong,
  anchorId: resource.anchors[i].id, relation: 'exact' }));
const document = { schemaVersion: 2, resources: [resource], links };
let access = true, study = { resourceId: resource.id, revision: 1, materialSha256: wrong };
const policy = { canNavigate: () => access, canAccessAnatomy: () => access, canAccess: () => access,
  resourceCleared: () => access, correspondenceCleared: () => access };
const registry = api.createLearningRegistry(document, binding.records, policy);
assert.equal(registry.related('nested', binding.records[0].structureId).length, 1);
assert.equal(registry.anatomyFor(resource.id, resource.anchors[0].id).length, 1);
assert.throws(() => api.createLearningRegistry({ ...document, links: [{ ...links[0], anatomy: {
  ...links[0].anatomy, nested: { ...links[0].anatomy.nested, bundleSha256: wrong } } }] }, binding.records, policy), /stale anatomical/);
assert.throws(() => api.createLearningRegistry({ ...document, links: [{ ...links[0], anatomy: {
  ...links[0].anatomy, sources: [{ file: 'vm-prostate-zones', sha256: wrong }] } }] }, binding.records, policy), /stale anatomical/);
assert.throws(() => api.createLearningRegistry({ ...document, links: [{ ...links[0], anatomy: {
  ...links[0].anatomy, nested: { ...links[0].anatomy.nested, parentBundleSha256: wrong } } }] }, binding.records, policy), /stale anatomical/);
assert.equal(api.parseLearningDocument({ ...document, schemaVersion: 1 }), null);
assert.equal(api.parseLearningDocument({ ...document, links: [{ ...links[0], anatomy: {
  ...links[0].anatomy, nested: { ...links[0].anatomy.nested, study: 'unknown' } } }] }), null);
const second = { ...links[0], id: 'vm:link:prostate-ambiguous', anchorId: resource.anchors[1].id };
const ambiguous = api.createLearningRegistry({ ...document, links: [links[0], second] }, binding.records, policy);
assert.equal(ambiguous.related('nested', binding.records[0].structureId).length, 2);

const bridge = api.createImagingBridge();
let incoming, context, reveals = 0, selected = [];
const detach = bridge.attachAtlas(api.createAtlasReceiver(() => ({ enabled: true, disabled: false,
  entries: binding.entries, allowedIds: binding.entries.map(e => e.id), onSelect: id => selected.push(id) }), () => {}));
const viewer = { getStudy: () => study, canNavigate: () => access,
  async reveal(_match, guard) { if (guard.isCurrent()) reveals++; },
  subscribeSelection(listener) { incoming = listener; return () => { incoming = null; }; },
  subscribeContext(listener) { context = listener; return () => { context = null; }; } };
const adapter = api.connectDidanixEducation({ bridge, registry, viewer, scope: 'nested' });
adapter.setEnabled(true);
assert(bridge.publish(binding.entries[0]));
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(reveals, 1);
assert.equal(selected.length, 0, 'programmatic reveal must not echo into Atlas');
assert.equal(incoming({ messageId: 'user-1', locator: registry.related('nested', binding.records[1].structureId)[0].locator }).status, 'selected');
assert.deepEqual(selected, [binding.records[1].structureId]);
study = { ...study, revision: 2 };
assert.equal(incoming({ messageId: 'user-2', locator: registry.related('nested', binding.records[2].structureId)[0].locator }).status, 'paused');
study = { ...study, revision: 1 }; access = false;
assert.equal(registry.related('nested', binding.records[0].structureId).length, 0);
assert.equal(incoming({ messageId: 'user-3', locator: links[0] }).status, 'paused');
access = true; context();
assert.equal(incoming({ messageId: 'user-4', locator: registry.related('nested', binding.records[0].structureId)[0].locator }).status, 'paused');
adapter.dispose(); detach();
const choiceBridge = api.createImagingBridge();
let status;
const choiceAdapter = api.connectDidanixEducation({ bridge: choiceBridge, registry: ambiguous,
  viewer, scope: 'nested', onStatus: value => { status = value; } });
choiceAdapter.setEnabled(true);
assert(choiceBridge.publish(binding.entries[0]));
assert.equal(status, 'choice-required');
assert.equal(choiceAdapter.choices().length, 2);
choiceAdapter.dispose();
// A source or access change while reveal is in flight invalidates its guard.
for (const invalidate of [() => { study = { ...study, revision: 2 }; }, () => { access = false; }]) {
  study = { resourceId: resource.id, revision: 1, materialSha256: wrong }; access = true;
  const pendingBridge = api.createImagingBridge();
  let contextChanged, release, committed = false;
  const pendingViewer = { ...viewer, async reveal(_match, guard) {
    await new Promise(resolve => { release = resolve; });
    if (guard.isCurrent()) committed = true;
  }, subscribeContext(listener) { contextChanged = listener; return () => {}; } };
  const pending = api.connectDidanixEducation({ bridge: pendingBridge, registry, viewer: pendingViewer, scope: 'nested' });
  pending.setEnabled(true);
  assert(pendingBridge.publish(binding.entries[0]));
  invalidate(); contextChanged(); release();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(committed, false);
  pending.dispose();
}
console.log('Prostate Education binding: synthetic source, registry, and adapter checks passed');
