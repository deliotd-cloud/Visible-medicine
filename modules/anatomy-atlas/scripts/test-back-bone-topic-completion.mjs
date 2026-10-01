import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = '7d3010368fc53e3433e8df4f9e9d4ddb67e786e8';
const historical = execFileSync('git', ['show', `${baseline}:content/back-bone-teaching.ts`], { encoding: 'utf8' });
const load = async (contents, resolveDir) => {
  const built = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
};
const current = await load(
  "export {backLayersDefinition} from './lib/back-layers'; export {backLayersTeachingFor} from './lib/back-layers-teaching'; export {backBoneBindings, backBoneConcepts, backBoneReferences} from './content/back-bone-teaching';",
  process.cwd(),
);
const previous = await load(historical, resolve('content'));
const copy = value => structuredClone(value);
const topics = ['clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'];
const bones = current.backLayersDefinition.surfaces.filter(surface => surface.tissue === 'skeleton');
assert.equal(bones.length, 34);
assert.deepEqual(current.backBoneBindings, previous.backBoneBindings);
assert.deepEqual(current.backBoneConcepts, previous.backBoneConcepts);
const addedTexts = new Map();
let added = 0, retained = 0;
for (const bone of bones) {
  const concept = current.backBoneBindings[bone.fmaId];
  assert(concept, `missing admitted concept: ${bone.id}`);
  const old = previous.authoredBackBoneLesson(concept);
  const now = current.backLayersTeachingFor(current.backLayersDefinition, bone);
  assert(now, `missing lesson: ${bone.id}`);
  assert.equal(now.anatomy, old.anatomy);
  assert.equal(now.function, old.function);
  assert.deepEqual(now.references, old.references);
  assert.deepEqual(now.extended.selfCheck, old.extended.selfCheck);
  assert.equal(now.extended.modelLimit, old.extended.modelLimit);
  for (const topic of topics) {
    const note = now.extended.topics[topic];
    assert(note, `${bone.id}: missing ${topic}`);
    if (old.extended.topics[topic]) {
      assert.equal(JSON.stringify(note), JSON.stringify(old.extended.topics[topic]), `${bone.id}: previous ${topic} changed`);
      retained++;
      continue;
    }
    added++;
    assert.equal(note.readiness, 'draft');
    assert(note.body.length >= 100, `${bone.id}: short ${topic}`);
    assert(note.references.length > 0, `${bone.id}: unreferenced ${topic}`);
    for (const url of note.references) {
      assert(Object.values(current.backBoneReferences).some(ref => ref.url === url), `${bone.id}: undeclared reference ${url}`);
      assert(!url.includes('openstax.org'), `${bone.id}: new topic uses OpenStax`);
    }
    const key = `${concept}/${topic}`;
    assert(!addedTexts.has(key) || addedTexts.get(key) === note.body, `${key}: inconsistent repeated concept`);
    addedTexts.set(key, note.body);
  }
  const detached = copy(now);
  detached.extended.topics.ultrasound.references.push('https://invalid.test/changed');
  assert.notDeepEqual(detached, current.backLayersTeachingFor(current.backLayersDefinition, bone));
}
assert.equal(added, 51);
assert.equal(retained, 153);
assert.equal(addedTexts.size, 23);
assert.equal(new Set(addedTexts.values()).size, addedTexts.size, 'Each new concept/topic needs its own draft');
const sample = bones[0];
assert.equal(current.backLayersTeachingFor({ ...current.backLayersDefinition, key: 'foreign-source' }, sample), null);
assert.equal(current.backLayersTeachingFor(current.backLayersDefinition, { ...sample, fmaId: 'foreign-surface' }), null);
assert.equal(current.backLayersTeachingFor(current.backLayersDefinition, { ...sample, sourceName: 'altered' }), null);
console.log(JSON.stringify({ bones: bones.length, newlyPopulated: added, retainedPopulated: retained, distinctNewDrafts: addedTexts.size, sourceGuards: 'pass' }));
