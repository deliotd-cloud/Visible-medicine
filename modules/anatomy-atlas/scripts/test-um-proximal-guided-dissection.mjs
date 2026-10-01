import assert from 'node:assert/strict';
import test from 'node:test';
import { umProximalGuideSteps } from '../lib/um-proximal-guided-dissection.ts';
import { limbDefinitions } from '../lib/um-limb-studies.ts';

const expected = {
  'hip-thigh': [
    ['um-hip-bone-cartilage', 'femoral-head-cartilage', 'anterior'],
    ['um-hip-gluteal-surface', 'gluteus-maximus', 'posterior'],
    ['um-hip-gluteal-compare', 'gluteus-medius', 'posterior'],
    ['um-hip-short-rotators', 'piriformis', 'posterior'],
    ['um-hip-flexors', 'iliacus', 'anterior'],
    ['um-thigh-medial', 'adductor-longus', 'anterior'],
    ['um-thigh-anterior', 'rectus-femoris', 'anterior'],
    ['um-thigh-vasti', 'vastus-intermedius', 'anterior'],
    ['um-thigh-posterior', 'biceps-femoris-long-head', 'posterior'],
  ],
  knee: [
    ['um-knee-overview', 'patella', 'anterior'],
    ['um-knee-extensor', 'quadriceps-tendon', 'anterior'],
    ['um-knee-collateral', 'mcl', 'anterior'],
    ['um-knee-articular', 'meniscus-group', 'superior'],
    ['um-knee-cruciate', 'acl', 'anterior'],
    ['um-knee-posterior', 'popliteus', 'posterior'],
  ],
};

for (const scope of ['hip-thigh', 'knee']) {
  void test(`${scope} has ordered, unique steps with admitted visible selections`, () => {
    const steps = umProximalGuideSteps(scope);
    const admitted = new Set(limbDefinitions[scope].surfaces.map(surface => surface.slug));
    assert.deepEqual(steps.map(({ id, selected, view }) => [id, selected, view]), expected[scope]);
    assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
    for (const step of steps) {
      assert.ok(step.title.length > 0 && step.title.length <= 36);
      assert.ok(step.caption.length > 30);
      assert.ok(step.slugs.length > 0);
      assert.equal(new Set(step.slugs).size, step.slugs.length);
      assert.ok(step.slugs.every(slug => admitted.has(slug)), `${step.id} contains an unadmitted source slug`);
      assert.ok(step.slugs.includes(step.selected), `${step.id} selects a hidden slug`);
    }
  });
}

void test('hip comparisons remove the named superficial selections and keep whole bones', () => {
  const steps = umProximalGuideSteps('hip-thigh');
  const slugs = index => new Set(steps[index].slugs);
  assert.ok(slugs(1).has('gluteus-maximus'));
  assert.ok(!slugs(2).has('gluteus-maximus'));
  assert.ok(slugs(2).has('gluteus-medius') && slugs(2).has('gluteus-minimus'));
  assert.ok(slugs(6).has('rectus-femoris'));
  assert.ok(!slugs(7).has('rectus-femoris'));
  assert.ok(slugs(7).has('vastus-intermedius'));
  assert.ok(steps.every(step => step.slugs.includes('femur')));
  assert.ok(steps.slice(0, 6).every(step => step.slugs.includes('pelvis-group')));
  assert.ok(slugs(8).has('biceps-femoris-long-head') && slugs(8).has('biceps-femoris-short-head'));
});

void test('knee comparisons retain grouped menisci and only admitted source surfaces', () => {
  const steps = umProximalGuideSteps('knee');
  const admitted = limbDefinitions.knee.surfaces.map(surface => surface.slug);
  assert.deepEqual(new Set(steps[0].slugs), new Set(admitted));
  assert.deepEqual(steps[3].slugs, ['femoral-cartilage', 'tibial-cartilage', 'patellar-cartilage', 'meniscus-group']);
  assert.ok(steps[4].slugs.includes('meniscus-group'));
  assert.ok(!steps[4].slugs.includes('femur'));
  assert.ok(!steps[5].slugs.includes('meniscus-group'));
  assert.ok(steps[5].slugs.includes('popliteus'));
  assert.ok(!steps.some(step => step.slugs.some(slug => /^(?:medial|lateral)-meniscus$/.test(slug))));
});

void test('returned plans are detached from future calls and source definitions', () => {
  const originalHip = structuredClone(limbDefinitions['hip-thigh']);
  const originalKnee = structuredClone(limbDefinitions.knee);
  for (const scope of ['hip-thigh', 'knee']) {
    const first = umProximalGuideSteps(scope);
    const pristine = structuredClone(first);
    first[0].slugs.pop();
    first[0].title = 'changed';
    first[1].caption = 'changed';
    first.reverse();
    assert.deepEqual(umProximalGuideSteps(scope), pristine);
  }
  assert.deepEqual(limbDefinitions['hip-thigh'], originalHip);
  assert.deepEqual(limbDefinitions.knee, originalKnee);
});
