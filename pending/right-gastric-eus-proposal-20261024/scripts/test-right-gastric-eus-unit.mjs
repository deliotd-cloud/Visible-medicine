import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build as currentBuild } from './workspace-test-build.mjs';

const currentRoot = fileURLToPath(new URL('../', import.meta.url));
const parentRoot = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas';
const { build: parentBuild } = await import(pathToFileURL(resolve(parentRoot, 'scripts/workspace-test-build.mjs')).href);
const entry = "export { abdominalEusOrientationLesson as lesson } from './lib/abdominal-eus-orientation'; export { abdominalEusTopics as topics } from './content/abdominal-eus-orientation';";
async function load(build, root) {
  const compiled = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
  });
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const current = await load(currentBuild, currentRoot);
const parent = await load(parentBuild, parentRoot);
const currentPins = JSON.parse(readFileSync(resolve(currentRoot, 'content/abdominal-branch-imaging-pins.json'), 'utf8'));
const parentPins = JSON.parse(readFileSync(resolve(parentRoot, 'content/abdominal-branch-imaging-pins.json'), 'utf8'));
const currentCentral = JSON.parse(readFileSync(resolve(currentRoot, 'content/central-vessel-imaging-pins.json'), 'utf8'));
const parentCentral = JSON.parse(readFileSync(resolve(parentRoot, 'content/central-vessel-imaging-pins.json'), 'utf8'));
const row = (pins, fmaId) => pins.entries.find(entry => entry.identity.fmaId === fmaId)?.identity;
const target = row(currentPins, 'FMA15400');

test('complete retained right gastric donor selection receives the EUS draft alone', () => {
  assert.equal(target.id, 'vm:anatomy:body:abdomen:right:vessel:right-gastric-vein');
  assert.deepEqual(target.sources, [{ file: 'FJ3595', sha256: 'a2a2bd3aadf7027de43cb57c0a33b17b3ce3a35c9f495f5fc010486c2b39494d' }]);
  assert.deepEqual(target.validation, { status: 'unvalidated', anatomicalReview: false });
  const output = current.lesson(target, 'ultrasound');
  assert.equal(output.readiness, 'draft');
  assert.equal(output.title, 'Right gastric vein · Linear endoscopic ultrasound (EUS) · draft');
  for (const tab of ['anatomy', 'function', 'ct', 'mri', 'xray', 'pathology', 'clinical', 'quiz'])
    assert.equal(current.lesson(target, tab), undefined, tab);
});

test('other donor selections and nearby gastric vessels cannot receive this lesson', () => {
  for (const entry of currentPins.entries) {
    if (entry.identity.id !== target.id && !['FMA76574', 'FMA15391'].includes(entry.identity.fmaId))
      assert.equal(current.lesson(entry.identity, 'ultrasound'), undefined, entry.identity.id);
  }
  const leftArtery = row(currentCentral, 'FMA14768');
  assert.notDeepEqual(current.lesson(leftArtery, 'ultrasound'), current.lesson(target, 'ultrasound'));
  for (const name of ['left-gastric-vein', 'right-gastroepiploic-vein']) {
    const wrong = structuredClone(target);
    wrong.id = wrong.id.replace('right-gastric-vein', name);
    wrong.name = name;
    assert.equal(current.lesson(wrong, 'ultrasound'), undefined);
  }
});

test('whole-record admission rejects changed identity, source, geometry, provenance and unknown fields', () => {
  const changes = [
    s => s.id += '-other', s => s.fmaId = 'FMA15391', s => s.name += ' other', s => s.sourceName += ' other',
    s => s.system = 'arteries', s => s.category = 'organ', s => s.laterality = 'left',
    s => s.region = 'thorax', s => s.regions.push('thorax'), s => s.bundle += '-other',
    s => s.nodeName += '-other', s => s.sourceTree = 'partof',
    s => s.sources[0].file = 'FJ3499', s => s.sources[0].sha256 += '-other',
    s => s.sources.push({ ...s.sources[0] }), s => s.sources.pop(),
    s => s.bounds.min[0]--, s => s.bounds.max[1]++, s => s.center[2]++, s => s.anchor[0]++,
    s => s.coverageNote += ' other', s => s.provenance.method += '-other',
    s => s.provenance.license += '-other', s => s.provenance.sourceVersion += '-other',
    s => s.provenance.recovered = true, s => s.validation.status = 'approved',
    s => s.validation.anatomicalReview = true, s => s.unknownApproval = true,
  ];
  for (const change of changes) {
    const altered = structuredClone(target); change(altered);
    assert.equal(current.lesson(altered, 'ultrasound'), undefined);
  }
  assert.deepEqual(current.lesson(Object.fromEntries(Object.entries(target).reverse()), 'ultrasound'), current.lesson(target, 'ultrasound'));
});

test('the original three topics and returned lessons remain exactly the parent outputs', () => {
  for (const [fmaId, currentSource, oldSource] of [
    ['FMA76574', currentPins, parentPins],
    ['FMA15391', currentPins, parentPins],
    ['FMA14768', currentCentral, parentCentral],
  ]) {
    assert.deepEqual(current.topics[fmaId], parent.topics[fmaId], fmaId + ' topic');
    const a = row(currentSource, fmaId), b = row(oldSource, fmaId);
    assert.deepEqual(a, b, fmaId + ' source');
    for (const tab of ['ultrasound', 'anatomy', 'ct', 'mri', 'xray'])
      assert.deepEqual(current.lesson(a, tab), parent.lesson(b, tab), fmaId + ':' + tab);
  }
  assert.deepEqual(Object.keys(current.topics).sort(), [...Object.keys(parent.topics), 'FMA15400'].sort());
});

test('teaching distinguishes EUS observation, routine ultrasound and unvalidated mesh', () => {
  const output = current.lesson(target, 'ultrasound');
  assert.match(output.body, /front of the portal vein near the liver hilum/);
  assert.match(output.body, /small calibre makes identification difficult/);
  assert.match(output.body, /not a routine transabdominal detection rate/);
  assert.match(output.bullets.join(' '), /left gastric vein and right gastroepiploic vein/);
  assert.match(output.bullets.join(' '), /nearby venous signal alone does not establish a named vessel identity/);
  assert.match(output.bullets.join(' '), /unvalidated/);
  assert.match(output.bullets.join(' '), /no probe station, patient confluence or correspondence/);
  assert.match(output.bullets.join(' '), /EUS uses an internal acoustic window/);
  assert.equal(output.body.includes('Figure 33A'), false);
  assert.equal(output.body.includes('Figure 33B'), false);
  assert([current.topics.FMA15400.body, ...current.topics.FMA15400.bullets].join(' ').trim().split(/\s+/).length < 140);
});

test('citation and shared safety note do not assert approval or procedural detail', () => {
  const output = current.lesson(target, 'ultrasound');
  assert.deepEqual(output.citations, ['https://pubmed.ncbi.nlm.nih.gov/24949362/']);
  assert.match(output.note, /revision-bound radiologist review pending/);
  assert.match(output.note, /No diagnostic threshold, procedural route or clinical approval/);
  assert.match(output.note, /Atlas, imaging-case and paid-lecture access remain independent/);
  assert.doesNotMatch([output.body, ...output.bullets].join(' '), /\b(?:needle|puncture|diameter|sensitivity|specificity)\b/i);
});

test('returned bullet and citation arrays are fresh', () => {
  const first = current.lesson(target, 'ultrasound');
  const second = current.lesson(target, 'ultrasound');
  assert.notStrictEqual(first.bullets, second.bullets);
  assert.notStrictEqual(first.citations, second.citations);
  first.bullets.push('foreign'); first.citations.push('https://foreign.example');
  assert.deepEqual(current.lesson(target, 'ultrasound'), second);
});
