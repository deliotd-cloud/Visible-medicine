import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

// Copy this file into Atlas/scripts; all inputs then resolve within that checkout.
const atlas = fileURLToPath(new URL('../', import.meta.url));
assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const pins = JSON.parse(readFileSync(resolve(atlas, 'content/superficial-medial-plantar-ultrasound-pins.json')));
assert.equal(pins.parentCommit, '6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
assert.equal(pins.entries.length, 2);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), ['FMA43937', 'FMA43938']);
assert.deepEqual(pins.entries.map(e => e.identity.id), [
  'vm:anatomy:body:foot:right:vessel:right-superficial-medial-plantar-artery',
  'vm:anatomy:body:foot:left:vessel:left-superficial-medial-plantar-artery',
]);
assert.deepEqual(pins.entries.map(e => e.identity.sources.map(s => s.file)), [['FJ2179'], ['FJ2089']]);
assert.deepEqual(pins.references, [
  'https://doi.org/10.1590/1677-5449.200068',
  'https://doi.org/10.20517/2347-9264.2023.19',
]);
assert.equal(pins.clinicalApproval, false);
assert.equal(pins.patientSpaceRegistration, false);
assert.equal(pins.newAssetAdmission, false);
const { build } = await import(pathToFileURL(resolve(atlas, 'scripts/workspace-test-build.mjs')));
const compiled = await build({
  stdin: {
    contents: "export {superficialMedialPlantarUltrasoundLesson} from './lib/superficial-medial-plantar-ultrasound.ts'; export {superficialMedialPlantarUltrasoundTopic} from './content/superficial-medial-plantar-ultrasound.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {contentTabs} from './lib/content-types.ts';",
    resolveDir: atlas,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(readFileSync(resolve(atlas, 'public/models/bodyparts3d/full-body/catalog.json')));
const display = api.bodyDisplayCatalog(raw);
assert(api.contentTabs.includes('ultrasound'));
assert.equal(display.sourceVersion, pins.sourceVersion);
assert.equal(display.license, pins.license);
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(display.bundles.filter(b => b.id === 'foot-vessels-foot-vascular'), pins.bundles);
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.equal(targets.size, 2);
let refusedOther = 0;
for (const structure of display.structures) {
  const entry = targets.get(structure.id);
  if (entry) {
    assert.deepEqual(structure, entry.identity);
    continue;
  }
  assert.equal(api.superficialMedialPlantarUltrasoundLesson(structure, 'ultrasound'), undefined, structure.id);
  refusedOther++;
}
assert.equal(refusedOther, display.structures.length - 2);
let refusedTabs = 0, refusedMutations = 0;
function* leaves(value, path = []) {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) yield* leaves(value[key], [...path, key]);
  } else yield path;
}
for (const { identity } of pins.entries) {
  assert.equal(identity.bundle, 'foot-vessels-foot-vascular');
  assert.equal(identity.sources.length, 1);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  const lesson = api.superficialMedialPlantarUltrasoundLesson(identity, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.equal(lesson.body, api.superficialMedialPlantarUltrasoundTopic.body);
  assert.deepEqual(lesson.citations, pins.references);
  assert.match(lesson.note, /radiologist review/i);
  assert.match(lesson.note, /No figures or source media imported/i);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://example.invalid');
  assert.deepEqual(api.superficialMedialPlantarUltrasoundLesson(identity, 'ultrasound').citations, pins.references);
  assert(!api.superficialMedialPlantarUltrasoundLesson(identity, 'ultrasound').bullets.includes('foreign'));
  for (const tab of api.contentTabs.filter(tab => tab !== 'ultrasound')) {
    assert.equal(api.superficialMedialPlantarUltrasoundLesson(identity, tab), undefined);
    refusedTabs++;
  }
  for (const path of leaves(identity)) {
    const changed = structuredClone(identity);
    let cursor = changed;
    for (const key of path.slice(0, -1)) cursor = cursor[key];
    const key = path.at(-1);
    cursor[key] = typeof cursor[key] === 'number' ? cursor[key] + 1 :
      typeof cursor[key] === 'boolean' ? !cursor[key] : `${cursor[key]} foreign`;
    assert.equal(api.superficialMedialPlantarUltrasoundLesson(changed, 'ultrasound'), undefined, path.join('.'));
    refusedMutations++;
  }
  const otherSource = pins.entries.find(e => e.identity.id !== identity.id).identity.sources[0];
  for (const sources of [[], [identity.sources[0], identity.sources[0]], [otherSource]]) {
    const changed = structuredClone(identity);
    changed.sources = structuredClone(sources);
    assert.equal(api.superficialMedialPlantarUltrasoundLesson(changed, 'ultrasound'), undefined);
    refusedMutations++;
  }
}
assert.equal(refusedTabs, 2 * (api.contentTabs.length - 1));
assert(refusedMutations >= 72);
assert.equal(api.superficialMedialPlantarUltrasoundLesson({ id: 'foreign' }, 'ultrasound'), undefined);
console.log(JSON.stringify({ mode: 'current-atlas-source', draftLessons: 2, otherDisplayedIdentitiesRefused: refusedOther, otherTabsRefused: refusedTabs, sourceMutationsRefused: refusedMutations, clinicalApproval: false, patientSpaceRegistration: false, newAssetAdmission: false }));
