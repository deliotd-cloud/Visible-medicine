import assert from 'node:assert/strict';
import test from 'node:test';
import { limbDefinitions } from '../lib/um-limb-studies.ts';
import { umLimbGuidedDissection } from '../lib/um-limb-guided-dissection.ts';
import { guidedDissectionAction } from '../lib/specimen-guided-dissection.ts';
import { initialSpecimen, reduceSpecimen } from '../lib/independent-specimen.ts';

const counts = { knee: 6, 'hip-thigh': 9, calf: 7, foot: 8, whole: 16 };
const wholeOrder = ['whole-source-skeleton', 'whole-gluteal', 'whole-hip-cartilage', 'whole-short-rotators',
  'whole-hip-flexors', 'whole-medial-thigh', 'whole-extensor', 'whole-posterior-thigh',
  'whole-articular-knee', 'whole-knee', 'whole-calf', 'whole-deep-calf', 'whole-fibularis',
  'whole-foot-bones', 'whole-plantar', 'whole-dorsal'];

for (const [scope, definition] of Object.entries(limbDefinitions)) {
  void test(`${scope} guide binds exact admitted source and covers every regional surface`, () => {
    const before = structuredClone(definition), guide = umLimbGuidedDissection(definition);
    assert(guide); assert.equal(guide.status, 'draft');
    assert.equal(guide.specimenKey, definition.key);
    assert.equal(guide.sourceFrame, 'um-5t6tz7-v1-2:source-lps');
    assert.equal(guide.steps.length, counts[scope]);
    assert.equal(new Set(guide.steps.map(step => step.id)).size, counts[scope]);
    assert.deepEqual(new Set(guide.steps.flatMap(step => step.ids)), new Set(definition.surfaces.map(s => s.id)));
    if (scope === 'whole') assert.deepEqual(guide.steps.map(step => step.id), wholeOrder);
    for (const [index, step] of guide.steps.entries()) {
      const action = guidedDissectionAction(definition, guide, index);
      assert(action); assert(step.ids.includes(step.selectedId));
      assert.equal(step.ids.length, new Set(step.ids).size);
      const state = reduceSpecimen(definition, initialSpecimen(definition), action);
      assert.equal(state.selectedId, step.selectedId);
      assert.deepEqual(new Set(definition.surfaces.filter(s => !state.hidden.includes(s.id)).map(s => s.id)), new Set(step.ids));
      assert(step.caption.length > 30 && step.title.length < 45);
    }
    assert.equal(guidedDissectionAction(definition, guide, -1), null);
    assert.equal(guidedDissectionAction(definition, guide, 0.5), null);
    assert.equal(guidedDissectionAction(definition, guide, guide.steps.length), null);
    assert.deepEqual(definition, before);
  });
}

void test('whole-limb knee and foot camera targets reuse exact admitted regional bounds', () => {
  const guide = umLimbGuidedDissection(limbDefinitions.whole);
  for (const id of ['whole-knee', 'whole-articular-knee'])
    assert.deepEqual(guide.steps.find(s => s.id === id).cameraBounds, limbDefinitions.knee.closeUp);
  for (const id of ['whole-foot-bones', 'whole-plantar', 'whole-dorsal'])
    assert.deepEqual(guide.steps.find(s => s.id === id).cameraBounds, limbDefinitions.foot.closeUp);
  assert.equal(guide.steps[0].cameraBounds, undefined);
  for (const malformed of [
    {min: [NaN, 0, 0], max: [1, 1, 1]}, {min: [0, 0, 0], max: [0, 1, 1]},
    {min: [0, 0], max: [1, 1, 1]}, {min: [0, 0, 0], max: [1, 1, Infinity]},
  ]) {
    const changed = structuredClone(guide); changed.steps[0].cameraBounds = malformed;
    assert.equal(guidedDissectionAction(limbDefinitions.whole, changed, 0), null);
  }
});

void test('changed geometry, frame, study, source identity or bundle rejects a guide', () => {
  const changes = [
    d => { d.key = 'foreign'; }, d => { d.source.version = 'foreign'; },
    d => { d.source.license = 'unknown'; }, d => { d.source.credit = 'foreign'; },
    d => { d.catalog.coordinateSystem.unitsPerMillimetre *= 2; },
    d => { d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] += 1; },
    d => { d.catalog.bundles[0].sha256 = 'foreign'; },
    d => { d.catalog.structures[0].id = 'foreign'; },
    d => { d.surfaces[0].id = 'foreign'; }, d => { d.surfaces[0].slug = 'foreign'; },
    d => { d.surfaces[0].center[0] += 1; }, d => { d.surfaces[0].laterality = 'left'; },
    d => { d.surfaces[0].sources[0].sha256 = 'foreign'; },
    d => { d.studies[0].ids.pop(); }, d => { d.limitations = 'approved'; },
  ];
  for (const definition of Object.values(limbDefinitions)) for (const change of changes) {
    const altered = structuredClone(definition); change(altered);
    assert.equal(umLimbGuidedDissection(altered), null);
  }
});

void test('whole-limb camera bounds cannot be changed through another mutable regional definition', () => {
  const before = structuredClone(limbDefinitions.knee.closeUp);
  try {
    limbDefinitions.knee.closeUp.min[0] -= 100;
    assert.equal(umLimbGuidedDissection(limbDefinitions.knee), null);
    const whole = umLimbGuidedDissection(limbDefinitions.whole);
    assert.deepEqual(whole.steps.find(s => s.id === 'whole-knee').cameraBounds, before);
  } finally {
    limbDefinitions.knee.closeUp = before;
  }
});

void test('returned guides are independent and cannot introduce absent or numbered structures', () => {
  for (const definition of Object.values(limbDefinitions)) {
    const original = umLimbGuidedDissection(definition), altered = umLimbGuidedDissection(definition);
    altered.steps.reverse(); altered.steps[0].ids.pop(); altered.steps[0].caption = 'modified';
    assert.deepEqual(umLimbGuidedDissection(definition), original);
    assert(original.steps.every(step => step.ids.every(id => definition.surfaces.some(s => s.id === id))));
    assert.match(original.limitation, /scan registration/);
    assert.match(original.limitation, /Radiologist review remains required/);
  }
});
