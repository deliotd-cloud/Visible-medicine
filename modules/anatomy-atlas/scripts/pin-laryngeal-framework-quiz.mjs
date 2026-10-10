import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const parentCommit = '662a1e8c45673c15d7ed3acbebebe912cb0db9b8';
assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Exact names, side, source files and source class come from the retained catalogue.
const groups = {
  thyroid: [['FMA55099', 'Thyroid cartilage', 'midline', 'cartilage', 'head-neck-connective-recovery', 'FJ2808']],
  cricoid: [['FMA9615', 'Cricoid cartilage', 'midline', 'cartilage', 'head-neck-connective-recovery', 'FJ2440', 'FJ2769']],
  arytenoid: [['FMA55113', 'Right arytenoid cartilage', 'right', 'cartilage', 'head-neck-connective-recovery', 'FJ2792'], ['FMA55114', 'Left arytenoid cartilage', 'left', 'cartilage', 'head-neck-connective-recovery', 'FJ2775']],
  corniculate: [['FMA55115', 'Right corniculate cartilage', 'right', 'cartilage', 'head-neck-connective-gaps', 'FJ2793'], ['FMA55116', 'Left corniculate cartilage', 'left', 'cartilage', 'head-neck-connective-gaps', 'FJ2776']],
  cuneiform: [['FMA55117', 'Right cuneiform cartilage', 'right', 'cartilage', 'head-neck-connective-gaps', 'FJ2795'], ['FMA55118', 'Left cuneiform cartilage', 'left', 'cartilage', 'head-neck-connective-gaps', 'FJ2773']],
  epiglottis: [['FMA55130', 'Epiglottis', 'unpaired', 'organ', 'head-neck-organs-visceral-detail', 'FJ2770']],
  medianThyrohyoid: [['FMA55138', 'Median thyrohyoid ligament', 'midline', 'ligament', 'head-neck-connective-gaps', 'FJ2790']],
  lateralThyrohyoid: [['FMA55140', 'Right lateral thyrohyoid ligament', 'right', 'ligament', 'head-neck-connective-gaps', 'FJ2797'], ['FMA55141', 'Left lateral thyrohyoid ligament', 'left', 'ligament', 'head-neck-connective-gaps', 'FJ2779']],
  hyoepiglottic: [['FMA55227', 'Hyo-epiglottic ligament', 'unspecified', 'ligament', 'head-neck-connective-gaps', 'FJ2771']],
  thyroepiglottic: [['FMA55230', 'Thyro-epiglottic ligament', 'midline', 'ligament', 'head-neck-connective-gaps', 'FJ2807']],
  medianCricothyroid: [['FMA55237', 'Median cricothyroid ligament', 'midline', 'ligament', 'head-neck-connective-gaps', 'FJ2789']],
  vocal: [['FMA55245', 'Right vocal ligament', 'right', 'ligament', 'head-neck-connective-gaps', 'FJ2805'], ['FMA55246', 'Left vocal ligament', 'left', 'ligament', 'head-neck-connective-gaps', 'FJ2787']],
  thyrohyoidMembrane: [['FMA55133', 'Right thyrohyoid membrane', 'right', 'membrane', 'head-neck-connective-laryngeal-detail', 'FJ2804'], ['FMA55134', 'Left thyrohyoid membrane', 'left', 'membrane', 'head-neck-connective-laryngeal-detail', 'FJ2786']],
};
const expected = new Map(Object.entries(groups).flatMap(([group, records]) => records.map(([fmaId, name, laterality, category, bundle, ...files]) => [fmaId, {group, name, laterality, category, bundle, files}])));
assert.equal(expected.size, 19);
assert.equal(Object.keys(groups).length, 13);
const {api, catalog} = await contentContext(), before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const spec = expected.get(identity.fmaId);
  if (!spec) return [];
  assert.equal(identity.system, spec.category === 'organ' ? 'organs' : 'connective');
  assert.equal(identity.category, spec.category);
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.bundle, spec.bundle);
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.name, spec.name);
  assert.equal(identity.laterality, spec.laterality);
  assert.deepEqual(identity.sources.map(source => source.file), spec.files);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification');
  assert.equal(previous.correctAnswer, undefined);
  return [{identity, group: spec.group, previous}];
});
assert.equal(entries.length, 19);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 19);
for (const [fmaId, spec] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fmaId && e.group === spec.group).length, 1);
const bundles = display.bundles.filter(bundle => entries.some(e => e.identity.bundle === bundle.id));
assert.equal(bundles.length, 4);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = {parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries};
const path = new URL('../content/laryngeal-framework-quiz-pins.json', import.meta.url), output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, groups: Object.keys(groups).length, bundles: bundles.length, pinsHash: hash(record), clinicalApproval: false}));
