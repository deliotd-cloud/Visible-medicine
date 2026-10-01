import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = '944f57b801471c3b005a64ec83314188b2f06cf5';
const historical = execFileSync('git', ['show', `${baseline}:content/hra-pelvic-teaching.ts`], { encoding: 'utf8' });
const load = async (contents, resolveDir) => {
  const built = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
};
const current = await load(
  "export {hraPelvisDefinition} from './lib/hra-pelvis'; export {hraPelvicTeaching} from './lib/hra-pelvis-teaching'; export {hraPelvicConcepts, hraPelvicLessonBindings, hraPelvicReferences, hraPelvicReferenceTitles, authoredHraPelvicLesson} from './content/hra-pelvic-teaching';",
  process.cwd(),
);
const previous = await load(historical, resolve('content'));
const normalize = bytes => bytes.toString().replace(/\r\n/g, '\n');
for (const path of ['lib/hra-pelvis.ts', 'lib/hra-pelvis-teaching.ts', 'lib/hra-renal.ts', 'lib/hra-renal-teaching.ts', 'content/hra-renal-teaching.ts', 'content/hra-renal-clinical.ts', 'public/models/hra-pelvis/catalog.json', 'public/models/hra-renal/catalog.json']) {
  assert.equal(normalize(readFileSync(path)), normalize(execFileSync('git', ['show', `${baseline}:${path}`])), `${path}: source geometry or binding changed`);
}
assert.equal(current.hraPelvisDefinition.surfaces.length, 43);
assert.equal(current.hraPelvisDefinition.studies.length, 11);
assert.equal(Object.keys(current.hraPelvicLessonBindings).length, 41);
assert.deepEqual(current.hraPelvicConcepts, previous.hraPelvicConcepts);
assert.deepEqual(current.hraPelvicLessonBindings, previous.hraPelvicLessonBindings);
for (const [key, value] of Object.entries(previous.hraPelvicReferences))
  assert.deepEqual(current.hraPelvicReferences[key], value, `${key}: prior reference changed`);
assert.deepEqual(Object.keys(current.hraPelvicReferences).filter(key => !Object.hasOwn(previous.hraPelvicReferences, key)).sort(),
  ['abdominalCt', 'abdominalXray', 'pelvicUltrasound']);
const referenceUrls = new Set(Object.values(current.hraPelvicReferences).map(ref => ref.url));
const topicKeys = ['clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'];
const expected = [
  'adnexalSupport/ct', 'adnexalSupport/xray', 'cardinal/ct', 'cardinal/xray',
  'cervix/ct', 'cervix/xray', 'fundus/ct', 'fundus/xray', 'junction/xray',
  'ovary/xray', 'peritoneal/ct', 'peritoneal/xray', 'pouch/ct', 'pouch/xray',
  'rectum/xray', 'sacrum/ultrasound', 'tube/ct', 'tube/xray',
  'uterineArtery/xray', 'uterineVein/xray', 'uterus/ct', 'uterus/xray',
  'uterosacral/ct', 'uterosacral/xray', 'vagina/ct', 'vagina/ultrasound', 'vagina/xray',
];
let added = 0, retained = 0, foreignRejected = 0;
const byModality = { ct: 0, xray: 0, ultrasound: 0 };
const newNotes = new Map();
const definitionBefore = JSON.stringify(current.hraPelvisDefinition);
for (const surface of current.hraPelvisDefinition.surfaces) {
  const concept = current.hraPelvicLessonBindings[surface.id];
  const lesson = current.hraPelvicTeaching(current.hraPelvisDefinition, surface);
  assert(lesson, `${surface.id}: missing lesson`);
  if (!concept) {
    assert(['VH_F_right_ureter', 'VH_F_left_ureter'].includes(surface.sourceName));
    assert.deepEqual(Object.keys(lesson.extended.topics).sort(), [...topicKeys].sort());
    retained += topicKeys.length;
    for (const field of ['id', 'name', 'nodeName', 'laterality', 'sourceOntologyId', 'sourcePart', 'tissue']) {
      assert.equal(current.hraPelvicTeaching(current.hraPelvisDefinition, { ...surface, [field]: 'foreign' }), null);
      foreignRejected++;
    }
    continue;
  }
  const before = previous.authoredHraPelvicLesson(concept);
  assert.deepEqual({ anatomy: lesson.anatomy, function: lesson.function, references: lesson.references, modelLimit: lesson.extended.modelLimit },
    { anatomy: before.anatomy, function: before.function, references: before.references, modelLimit: before.extended.modelLimit }, `${surface.id}: core lesson or limit changed`);
  assert.deepEqual(lesson.extended.selfCheck, before.extended.selfCheck, `${surface.id}: complete self-check evidence retained`);
  assert.deepEqual(Object.keys(lesson.extended.topics).sort(), [...topicKeys].sort(), `${surface.id}: incomplete topic set`);
  for (const topic of topicKeys) {
    const note = lesson.extended.topics[topic];
    const oldNote = before.extended.topics[topic];
    if (oldNote) {
      assert.deepEqual(note, oldNote, `${surface.id}/${topic}: authored topic changed`);
      retained++;
    } else {
      added++;
      byModality[topic]++;
      assert.equal(note.readiness, 'draft');
      assert(note.body.length >= 100, `${surface.id}/${topic}: incomplete text`);
      assert(note.references.length > 0, `${surface.id}/${topic}: no references`);
      for (const url of note.references)
        assert(referenceUrls.has(url) && current.hraPelvicReferenceTitles[url], `${surface.id}/${topic}: unlisted reference`);
      const key = `${current.hraPelvicConcepts[concept].family}/${topic}`;
      assert(!newNotes.has(key) || newNotes.get(key) === note.body, `${key}: inconsistent family note`);
      newNotes.set(key, note.body);
    }
  }
  lesson.extended.topics.xray.body = 'changed';
  lesson.extended.topics.xray.references.push('https://invalid.example/');
  lesson.extended.selfCheck.answer = 'changed';
  const again = current.hraPelvicTeaching(current.hraPelvisDefinition, surface);
  assert.notEqual(again.extended.topics.xray.body, 'changed');
  assert(!again.extended.topics.xray.references.includes('https://invalid.example/'));
  assert.equal(again.extended.selfCheck.answer, before.extended.selfCheck.answer);
  for (const field of ['id', 'name', 'nodeName', 'laterality', 'sourceOntologyId', 'sourcePart', 'tissue']) {
    assert.equal(current.hraPelvicTeaching(current.hraPelvisDefinition, { ...surface, [field]: 'foreign' }), null);
    foreignRejected++;
  }
}
assert.deepEqual([...newNotes.keys()].sort(), expected.sort());
assert.equal(new Set(newNotes.values()).size, expected.length);
assert.equal(added, 68);
assert.equal(retained, 190);
assert.deepEqual(byModality, { ct: 29, xray: 37, ultrasound: 2 });
for (const mutate of [d => { d.source.version = 'foreign'; }, d => { d.catalog.bundles[0].sha256 = '0'.repeat(64); }, d => { d.studies[0].ids.pop(); }]) {
  const foreign = JSON.parse(definitionBefore);
  mutate(foreign);
  for (const surface of current.hraPelvisDefinition.surfaces) {
    assert.equal(current.hraPelvicTeaching(foreign, surface), null);
    foreignRejected++;
  }
}
assert.equal(JSON.stringify(current.hraPelvisDefinition), definitionBefore);
console.log(JSON.stringify({ surfaces: 43, pelvicBindings: 41, renalUreters: 2, newPlacements: added, byModality, retainedPlacements: retained, distinctNewNotes: newNotes.size, foreignRejected }));
