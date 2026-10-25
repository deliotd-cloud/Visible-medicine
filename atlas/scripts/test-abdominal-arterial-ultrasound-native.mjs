import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: `export {abdominalArterialUltrasoundLesson} from './lib/abdominal-arterial-ultrasound';
export {abdominalArterialUltrasoundTopics} from './content/abdominal-arterial-ultrasound';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const runtime = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const pins = JSON.parse(readFileSync('content/abdominal-branch-imaging-pins.json', 'utf8'));
const raw = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const catalog = runtime.bodyDisplayCatalog(raw);
const selected = new Map([
  ['FMA14805', ['FJ3446', 'unspecified', 'abdomen-vessels-visceral-detail', 'EUS', '4145479']],
  ['FMA14784', ['FJ3557', 'unspecified', 'abdomen-vessels-visceral-detail', 'EUS', '6032695']],
  ['FMA14826', ['FJ3494', 'left', 'abdomen-vessels-mesenteric', 'intraoperative', '29943055']],
  ['FMA14824', ['FJ2025', 'midline', 'abdomen-vessels-mesenteric', 'intraoperative', '03037-8']],
]);
assert.equal(Object.keys(runtime.abdominalArterialUltrasoundTopics).length, 4);
assert.equal(selected.size, 4);
let checked = 0;

for (const [fmaId, [file, laterality, bundle, method, citation]] of selected) {
  const pinned = pins.entries.filter(row => row.identity.fmaId === fmaId);
  const shown = catalog.structures.filter(row => row.fmaId === fmaId);
  assert.equal(pinned.length, 1, `${fmaId}: raw pin count`);
  assert.equal(shown.length, 1, `${fmaId}: displayed source count`);
  const source = pinned[0].identity;
  assert.deepEqual(shown[0], source, `${fmaId}: display identity`);
  const rawMatches=raw.structures.filter(row=>row.id===source.id);
  assert.equal(rawMatches.length,1);
  assert.deepEqual(rawMatches[0],source,`${fmaId}: actual raw catalogue identity`);
  assert.equal(source.sources.length, 1);
  assert.equal(source.sources[0].file, file);
  assert.equal(source.laterality, laterality);
  assert.equal(source.bundle, bundle);
  const lesson = runtime.abdominalArterialUltrasoundLesson(shown[0], 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.title, new RegExp(method, 'i'));
  assert(lesson.citations.some(url => url.includes(citation)));
  assert(lesson.body.length > 150 && lesson.bullets.length >= 2);
  assert.match(lesson.note, /radiologist review pending/i);
  assert.match(lesson.note, /unvalidated/i);
  assert(!Object.hasOwn(lesson, 'approval'));
  for (const tab of runtime.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(runtime.abdominalArterialUltrasoundLesson(shown[0], tab), undefined, `${fmaId}: wrong tab ${tab}`);
  const again = runtime.abdominalArterialUltrasoundLesson(shown[0], 'ultrasound');
  assert.notEqual(again, lesson);
  assert.notEqual(again.bullets, lesson.bullets);
  assert.notEqual(again.citations, lesson.citations);
  lesson.bullets.push('local mutation');
  lesson.citations.push('https://example.invalid/local');
  assert(!runtime.abdominalArterialUltrasoundLesson(shown[0], 'ultrasound').bullets.includes('local mutation'));
  assert(!runtime.abdominalArterialUltrasoundLesson(shown[0], 'ultrasound').citations.includes('https://example.invalid/local'));
  for (const mutate of [
    value => { value.sources[0].sha256 = '0'.repeat(64); },
    value => { value.sources[0].file = 'FJ0000'; },
    value => { value.laterality = 'right'; },
    value => { value.bundle = 'other'; },
    value => { value.bounds.min[0] += 1; },
    value => { value.coverageNote = 'foreign'; },
  ]) {
    const changed = structuredClone(shown[0]); mutate(changed);
    assert.equal(runtime.abdominalArterialUltrasoundLesson(changed, 'ultrasound'), undefined, `${fmaId}: altered whole identity`);
  }
  checked++;
}

const chosenIds = new Set(pins.entries.filter(row => selected.has(row.identity.fmaId)).map(row => row.identity.id));
assert.equal(chosenIds.size, 4);
let held = 0;
for (const row of pins.entries.filter(row => !chosenIds.has(row.identity.id))) {
  const displayed = catalog.structures.find(structure => structure.id === row.identity.id);
  assert.deepEqual(displayed, row.identity);
  assert.equal(runtime.abdominalArterialUltrasoundLesson(displayed, 'ultrasound'), undefined, `held ${row.identity.fmaId}`);
  held++;
}
assert(held >= 12);
for(const structure of catalog.structures.filter(row=>!chosenIds.has(row.id)))
  assert.equal(runtime.abdominalArterialUltrasoundLesson(structure,'ultrasound'),undefined,'All unrelated current roots refuse this lesson');
console.log(JSON.stringify({schema:'vm-abdominal-arterial-us-proposal-test/1',checked,held,sourceIdentityTamperCases:checked*6,wrongTabCases:checked*(runtime.contentTabs.length-1),clinicalApproval:false}));
