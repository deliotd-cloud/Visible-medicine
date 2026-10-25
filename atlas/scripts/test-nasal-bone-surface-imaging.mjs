import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';

const pins = JSON.parse(readFileSync('content/cranial-bone-imaging-pins.json', 'utf8'));
const raw = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const expected = new Map([
  ['vm:anatomy:body:head-neck:right:bone:right-nasal-bone', ['FMA53647', 'right', 'FJ3378', '933e8c8de3b4eaa2a4d784862388cac53da48309a29fd3ae04e9ac10da543c5f']],
  ['vm:anatomy:body:head-neck:left:bone:left-nasal-bone', ['FMA53648', 'left', 'FJ3272', '43a73088376ae4179e8edd2f5d296d5c573cd1078379a0e3e8eeb90920ba9dc5']],
]);
const built = await build({
  stdin: {contents: [
    "export {nasalBoneSurfaceImagingLesson} from './lib/nasal-bone-surface-imaging';",
    "export {nasalBoneSurfaceImagingTopics,nasalBoneSurfaceImagingReferences} from './content/nasal-bone-surface-imaging';",
    "export {sourceCanonical} from './lib/body-source-additions';",
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    "export {bodyLesson,bodyContent} from './app/body-content';",
  ].join(''), resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const displayed = api.bodyDisplayCatalog(raw);
const tabs = ['xray', 'ultrasound'];
let drafts = 0;
for (const [id, [fma, side, file, sha]] of expected) {
  const matches = pins.entries.filter(e => e.identity.id === id);
  assert.equal(matches.length, 1);
  const pinned = matches[0].identity;
  const source = raw.structures.find(s => s.id === id);
  const shown = displayed.structures.find(s => s.id === id);
  assert(source && shown, `${id}: raw and display selections exist`);
  assert.equal(api.sourceCanonical(source), api.sourceCanonical(pinned));
  assert.equal(api.sourceCanonical(shown), api.sourceCanonical(pinned));
  assert.equal(pinned.fmaId, fma);
  assert.equal(pinned.laterality, side);
  assert.deepEqual(pinned.sources, [{file, sha256: sha}]);
  assert.equal(pinned.validation.status, 'unvalidated');
  assert.equal(pinned.validation.anatomicalReview, false);
  for (const tab of tabs) {
    const direct = api.nasalBoneSurfaceImagingLesson(shown, tab);
    assert.equal(direct?.readiness, 'draft');
    assert.deepEqual(api.bodyLesson(shown, tab), direct, `${id}:${tab} application resolver`);
    const {readiness: _readiness, ...content} = direct;
    assert.deepEqual(api.bodyContent(shown, tab), content);
    assert.match(direct.note, /revision-bound radiologist sign-off is pending/i);
    assert.match(direct.note, /anatomically unvalidated/i);
    assert(!/approved|diagnostic result is supplied/i.test(direct.title));
    for (const url of direct.citations) assert(/^https:\/\/(pubmed\.ncbi\.nlm\.nih\.gov)\/\d+\/$/.test(url));
    drafts++;
  }
  for (const tab of ['anatomy','function','clinical','pathology','ct','mri','quiz'])
    assert.equal(api.nasalBoneSurfaceImagingLesson(shown, tab), undefined, `${id}:${tab} refused`);
  const edits = [
    s => {s.id += '-foreign';},
    s => {s.fmaId = 'FMA0';},
    s => {s.laterality = s.laterality === 'left' ? 'right' : 'left';},
    s => {s.name += ' foreign';},
    s => {s.bundle = 'foreign';},
    s => {s.sourceTree = 'partof';},
    s => {s.sources[0].file = 'FJ0';},
    s => {s.sources[0].sha256 = '0'.repeat(64);},
    s => {s.validation.status = 'validated';},
    s => {s.validation.anatomicalReview = true;},
    s => {s.bounds.min[0] += 0.001;},
    s => {s.unexpected = true;},
  ];
  for (const edit of edits) {
    const foreign = structuredClone(shown); edit(foreign);
    for (const tab of tabs) assert.equal(api.nasalBoneSurfaceImagingLesson(foreign, tab), undefined);
  }
}
assert.equal(drafts, 4);
for (const s of displayed.structures) if (!expected.has(s.id))
  for (const tab of tabs) assert.equal(api.nasalBoneSurfaceImagingLesson(s, tab), undefined, `${s.id}:${tab}`);
assert.equal(Object.keys(api.nasalBoneSurfaceImagingTopics).length, 2);
console.log(JSON.stringify({admittedSources: expected.size, draftPlacements: drafts, clinicalApproval: false, patientRegistration: false, newAssets: false}));
