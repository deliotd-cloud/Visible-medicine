import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';
import pins from '../content/lacrimal-drainage-imaging-pins.json' with { type: 'json' };
import transition from '../content/lacrimal-drainage-imaging.transition.json' with { type: 'json' };
const compiled = await build({ stdin: { contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data'; export {sourceCanonical} from './lib/body-source-additions'; export {lacrimalDrainageImagingLesson} from './lib/lacrimal-drainage-imaging'; export * from './content/lacrimal-drainage-imaging';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = api.bodyDisplayCatalog(raw), original = JSON.stringify(catalog);
const sha = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const exact = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.equal(pins.entries.length, 6); assert.equal(transition.parentCommit, pins.sourceCommit);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId).sort(), ['FMA59545', 'FMA59546', 'FMA59555', 'FMA59556', 'FMA59582', 'FMA59583']);
assert.deepEqual(pins.entries.map(e => e.identity.sources[0].file).sort(), ['FJ1298', 'FJ1302', 'FJ1309', 'FJ1349', 'FJ1353', 'FJ1360']);
let changed = 0, unchanged = 0, rejected = 0;
for (const e of pins.entries) {
  const current = catalog.structures.filter(s => s.id === e.identity.id);
  assert.equal(current.length, 1); assert.deepEqual(current[0], e.identity);
  assert.deepEqual(api.bodyLesson(e.identity, 'anatomy'), e.anatomy);
  assert.equal(e.identity.system, 'organs'); assert.equal(e.identity.category, 'organ');
  assert.deepEqual(e.identity.regions, ['head-neck']);
  for (const t of ['ct', 'mri']) assert.equal(e.previous[t].readiness, 'pending');
}
const previous = (s, t) => {
  const e = exact.get(s.id);
  return e && api.sourceCanonical(s) === api.sourceCanonical(e.identity) && Object.hasOwn(e.previous, t) ? structuredClone(e.previous[t]) : api.bodyLesson(s, t);
};
assert.equal(sha({ body: catalog.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, previous(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles }), pins.previousAllLessonsAndRecipesHash, 'Previous lessons and recipes changed');
for (const s of catalog.structures) for (const t of api.contentTabs) {
  const lesson = api.bodyLesson(s, t), topic = api.lacrimalDrainageImagingLesson(s, t), prior = previous(s, t);
  if (!topic) { assert.deepEqual(lesson, prior); unchanged++; continue; }
  assert.equal(prior.readiness, 'pending'); assert.equal(lesson.readiness, 'draft'); assert.deepEqual(lesson, topic);
  assert.equal(sha(lesson), transition.entries.find(e => e.id === s.id).sections[t]);
  assert.match(lesson.note, /review pending/); assert.match(lesson.note, /access remain independent/);
  assert(lesson.citations.includes(api.lacrimalDrainageReferences.crossSection));
  changed++;
}
assert.equal(changed, 12); assert.equal(unchanged, catalog.structures.length * api.contentTabs.length - 12);
for (const { identity: s } of pins.entries) for (const mutate of [
  x => x.laterality = x.laterality === 'left' ? 'right' : 'left',
  x => x.id = pins.entries.find(e => e.identity.id !== s.id).identity.id,
  x => x.fmaId = 'FMA000', x => x.bundle = 'foreign', x => x.nodeName = 'foreign',
  x => x.sources[0].file = 'foreign', x => x.sources[0].sha256 = 'foreign',
  x => x.anchor[0] += .01, x => x.bounds.min[0] += .01,
]) {
  const bad = structuredClone(s); mutate(bad);
  for (const t of ['ct', 'mri']) { assert.equal(api.lacrimalDrainageImagingLesson(bad, t), undefined); rejected++; }
}
assert.equal(rejected, 108);
for (const e of pins.entries) { assert.equal(api.lacrimalDrainageImagingLesson(e.identity, 'ultrasound'), undefined); assert.equal(api.bodyLesson(e.identity, 'ultrasound').readiness, 'pending'); }
for (const b of pins.bundles) assert.equal(createHash('sha256').update(await readFile('public' + b.url.split('?')[0])).digest('hex'), b.sha256);
assert.equal(JSON.stringify(catalog), original);
const report = { baselineSource: pins.sourceCommit, sourceSelections: 6, addedDraftPlacements: changed, modalities: { ct: 6, mri: 6, ultrasound: 0 }, unchangedTopics: unchanged, rejectedSourceTopicCombinations: rejected, sourceGeometryChanged: false, clinicalApproval: false, imagingConnected: false };
await writeFile('docs/lacrimal-drainage-imaging-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
