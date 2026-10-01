import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from './workspace-test-build.mjs';

const compiled = await build({ stdin: { contents: "export * from './lib/abdominal-wall.ts'; export * from './lib/abdominal-wall-teaching.ts'; export * from './content/abdominal-wall-teaching.ts'; export * from './content/abdominal-bone-teaching.ts'; export { kneeDefinition } from './lib/um-limb-studies.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const def = api.abdominalWallDefinition;
const copy = value => JSON.parse(JSON.stringify(value));
const bones = def.surfaces.filter(surface => surface.tissue === 'skeleton');
const muscles = def.surfaces.filter(surface => surface.tissue === 'muscle');
const referenceUrls = new Set(Object.values(api.abdominalBoneTeachingReferences).map(reference => reference.url));
const topics = ['clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'];
assert.ok([...referenceUrls].every(url => !url.includes('openstax.org')));

test('all 21 exact skeletal selections receive complete draft teaching', () => {
  assert.equal(bones.length, 21);
  assert.deepEqual(Object.keys(api.abdominalBoneLessonBindings).sort(), bones.map(surface => surface.id).sort());
  for (const surface of bones) {
    const lesson = api.abdominalTeachingFor(def, surface);
    assert.ok(lesson, surface.id);
    assert.ok(lesson.anatomy.length > 80);
    assert.ok(lesson.function.length > 70);
    assert.ok(lesson.extended.modelLimit.includes('version-3'));
    assert.deepEqual(Object.keys(lesson.extended.topics).sort(), topics.sort());
    assert.ok(lesson.references.length);
    for (const entry of Object.values(lesson.extended.topics)) {
      assert.equal(entry.readiness, 'draft');
      assert.ok(entry.body.length > 80);
      assert.ok(entry.references.length);
      assert.ok(entry.references.every(url => referenceUrls.has(url) && api.abdominalBoneReferenceTitles[url]));
    }
    assert.ok(lesson.extended.selfCheck.question.length > 25);
    assert.ok(lesson.extended.selfCheck.answer.length > 25);
    assert.ok(lesson.extended.selfCheck.references.every(url => referenceUrls.has(url)));
    assert.ok(lesson.references.every(url => referenceUrls.has(url)));
  }
});

test('level, laterality and rib class remain explicit', () => {
  for (const surface of bones) {
    const lesson = api.abdominalTeachingFor(def, surface);
    const binding = api.abdominalBoneLessonBindings[surface.id];
    assert.equal(binding.side, surface.laterality);
    if (binding.level) assert.ok(lesson.anatomy.includes(`${binding.concept === 'lumbar' ? 'L' : 'rib '}${binding.level}`));
    if (binding.concept === 'rib7') assert.match(lesson.anatomy, /true rib.*directly/);
    if (binding.concept === 'rib8to10') assert.match(lesson.anatomy, /false rib.*next higher/);
    if (binding.concept === 'rib11to12') assert.match(lesson.anatomy, /floating false rib.*without a sternal attachment/);
    if (binding.concept === 'rib11to12') assert.match(lesson.anatomy, /does not form a costotransverse articulation/);
    assert.doesNotMatch(JSON.stringify(lesson), /uninjured reference|healthy source/i);
    assert.ok(lesson.extended.topics.mri.references.some(url => /radiologyinfo|39488356/.test(url)));
    assert.ok(lesson.extended.topics.ultrasound.references.includes(api.abdominalBoneTeachingReferences.ultrasound.url));
  }
});

test('old muscle lesson output remains identical', () => {
  assert.equal(muscles.length, 8);
  for (const surface of muscles) {
    const binding = api.abdominalLessonBindings[surface.id];
    assert.deepEqual(api.abdominalTeachingFor(def, surface), api.authoredAbdominalLesson(binding.family, binding.side));
  }
});

test('source, frame, selection and foreign specimens fail closed', () => {
  const bone = bones[0];
  const mutations = [
    d => { d.key = 'foreign'; },
    d => { d.source.version = '4.0'; },
    d => { d.source.license = 'MIT'; },
    d => { d.source.registration = 'patient'; },
    d => { d.catalog.coordinateSystem.sourceToSceneColumnMajor[12] += 1; },
    d => { d.catalog.bundles[0].sha256 = '0'.repeat(64); },
    d => { d.surfaces[0].sources[0].sha256 = '0'.repeat(64); },
    d => { d.surfaces[0].coverageNote = 'validated'; },
    d => { d.studies[0].ids.pop(); },
  ];
  for (const mutate of mutations) { const altered = copy(def); mutate(altered); assert.equal(api.abdominalTeachingFor(altered, bone), null); }
  for (const field of ['id', 'fmaId', 'name', 'sourceName', 'laterality', 'tissue', 'bundle', 'nodeName'])
    assert.equal(api.abdominalTeachingFor(def, { ...bone, [field]: 'forged' }), null);
  assert.equal(api.abdominalTeachingFor(def, { ...bone, sources: [{ ...bone.sources[0], sha256: '0'.repeat(64) }] }), null);
  assert.equal(api.abdominalTeachingFor(api.kneeDefinition, bone), null);
  assert.equal(api.abdominalTeachingFor(def, api.kneeDefinition.surfaces[0]), null);
});

test('returned lessons and references are detached from later mutation', () => {
  const bone = bones[0];
  const original = api.abdominalTeachingFor(def, bone);
  const expected = copy(original);
  original.anatomy = 'mutated';
  original.references.push('https://example.invalid');
  original.extended.topics.ct.body = 'mutated';
  original.extended.selfCheck.answer = 'mutated';
  assert.deepEqual(api.abdominalTeachingFor(def, bone), expected);
});
