import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc';
const historical = execFileSync('git', ['show', `${baseline}:content/hra-renal-clinical.ts`], { encoding: 'utf8' });
const load = async (contents, resolveDir) => {
  const built = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
};
const current = await load(
  "export {hraRenalDefinition} from './lib/hra-renal'; export {hraRenalTeaching} from './lib/hra-renal-teaching'; export {authoredHraRenalLesson, hraRenalReferenceTitles} from './content/hra-renal-teaching'; export {hraRenalTopicFamilies, hraRenalClinicalConcepts, hraRenalClinicalReferences} from './content/hra-renal-clinical';",
  process.cwd(),
);
const previous = await load(historical, resolve('content'));
const topics = ['clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'];
const expectedNew = ['capsule/xray', 'hilum/xray', 'hilum/ultrasound', 'parenchyma/xray', 'column/xray', 'papilla/mri', 'papilla/xray', 'papilla/ultrasound', 'vein/xray', 'vein/ultrasound'];
const normalize = bytes => bytes.toString().replace(/\r\n/g, '\n');
for (const path of ['lib/hra-renal.ts', 'lib/hra-renal-teaching.ts', 'content/hra-renal-teaching.ts', 'public/models/hra-renal/catalog.json']) {
  assert.equal(normalize(readFileSync(path)), normalize(execFileSync('git', ['show', `${baseline}:${path}`])), `${path}: source or core teaching changed`);
}
assert.equal(current.hraRenalDefinition.surfaces.length, 82);
assert.equal(Object.keys(current.hraRenalTopicFamilies).length, 9);
assert.deepEqual(current.hraRenalClinicalConcepts, previous.hraRenalClinicalConcepts);
for (const [key, oldRef] of Object.entries(previous.hraRenalClinicalReferences)) {
  assert.deepEqual(current.hraRenalClinicalReferences[key], oldRef, `${key}: prior reference changed`);
}
assert.deepEqual(Object.keys(current.hraRenalClinicalReferences).filter(key => !Object.hasOwn(previous.hraRenalClinicalReferences, key)).sort(), ['abdominalUltrasound', 'abdominalXray']);
const knownUrls = new Set(Object.values(current.hraRenalClinicalReferences).map(ref => ref.url));
const newNotes = new Map();
let added = 0, retained = 0, rejections = 0;
const definitionBefore = JSON.stringify(current.hraRenalDefinition);
for (const surface of current.hraRenalDefinition.surfaces) {
  const oldCore = current.authoredHraRenalLesson(surface.concept);
  const oldExtended = previous.authoredHraRenalClinical(surface.concept);
  const now = current.hraRenalTeaching(current.hraRenalDefinition, surface);
  assert(now, `${surface.id}: missing lesson`);
  assert.deepEqual({ anatomy: now.anatomy, function: now.function, references: now.references },
    { anatomy: oldCore.anatomy, function: oldCore.function, references: oldCore.references }, `${surface.id}: core lesson changed`);
  assert.equal(now.extended.modelLimit, oldExtended.modelLimit, `${surface.id}: model limit changed`);
  assert.deepEqual(now.extended.selfCheck, oldExtended.selfCheck, `${surface.id}: self-check changed`);
  const family = current.hraRenalClinicalConcepts[surface.concept].family;
  assert.deepEqual(now.extended.topics, current.hraRenalTopicFamilies[family]);
  assert.deepEqual(Object.keys(now.extended.topics).sort(), [...topics].sort(), `${surface.id}: incomplete topic set`);
  for (const topic of topics) {
    const note = now.extended.topics[topic];
    const before = oldExtended.topics[topic];
    if (before) {
      assert.equal(JSON.stringify(note), JSON.stringify(before), `${surface.id}: prior ${topic} changed`);
      retained++;
    } else {
      added++;
      assert.equal(note.readiness, 'draft');
      assert(note.body.length >= 100, `${surface.id}: ${topic} is too short`);
      assert(note.references.length > 0, `${surface.id}: ${topic} is unreferenced`);
      for (const url of note.references) {
        assert(knownUrls.has(url) && current.hraRenalReferenceTitles[url], `${surface.id}: undeclared or untitled reference`);
        assert(!url.includes('openstax.org'), `${surface.id}: disallowed new reference`);
      }
      const key = `${family}/${topic}`;
      assert(!newNotes.has(key) || newNotes.get(key) === note.body, `${key}: inconsistent family note`);
      newNotes.set(key, note.body);
    }
  }
  now.extended.topics.ultrasound.body = 'changed';
  now.extended.topics.ultrasound.references.push('https://invalid.example/');
  now.extended.selfCheck.answer = 'changed';
  assert.deepEqual(current.hraRenalTeaching(current.hraRenalDefinition, surface).extended.selfCheck, oldExtended.selfCheck);
  assert.notEqual(current.hraRenalTeaching(current.hraRenalDefinition, surface).extended.topics.ultrasound.body, 'changed');
  assert(!current.hraRenalTeaching(current.hraRenalDefinition, surface).extended.topics.ultrasound.references.includes('https://invalid.example/'));
  for (const field of ['id', 'name', 'nodeName', 'laterality', 'concept', 'sourceOntologyId', 'sourcePart', 'tissue']) {
    assert.equal(current.hraRenalTeaching(current.hraRenalDefinition, { ...surface, [field]: 'foreign' }), null);
    rejections++;
  }
}
assert.deepEqual([...newNotes.keys()].sort(), expectedNew.sort());
assert.equal(new Set(newNotes.values()).size, 10);
assert.equal(added, 94);
assert.equal(retained, 82 * topics.length - 94);
for (const mutate of [d => d.source.version = 'foreign', d => d.catalog.bundles[0].sha256 = '0'.repeat(64), d => d.studies[0].ids.pop()]) {
  const foreign = JSON.parse(definitionBefore);
  mutate(foreign);
  for (const surface of current.hraRenalDefinition.surfaces) {
    assert.equal(current.hraRenalTeaching(foreign, surface), null);
    rejections++;
  }
}
assert.equal(JSON.stringify(current.hraRenalDefinition), definitionBefore);
console.log(JSON.stringify({ surfaces: 82, topicsPerSurface: 6, newPlacements: added, retainedPlacements: retained, distinctNewNotes: newNotes.size, rejectedForeignBindings: rejections }));
