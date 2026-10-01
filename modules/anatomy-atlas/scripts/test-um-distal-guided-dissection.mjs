import assert from 'node:assert/strict';
import test from 'node:test';
import { umDistalGuideSteps } from '../lib/um-distal-guided-dissection.ts';
import { limbDefinitions } from '../lib/um-limb-studies.ts';

const expected = {
  calf: [
    ['um-calf-overview', 'soleus', 'posterior'],
    ['um-calf-superficial', 'gastrocnemius-medial', 'posterior'],
    ['um-calf-soleus', 'soleus', 'posterior'],
    ['um-calf-deep-posterior', 'tibialis-posterior', 'posterior'],
    ['um-calf-anterior', 'tibialis-anterior', 'anterior'],
    ['um-calf-fibularis', 'peroneus-longus', 'right'],
    ['um-calf-calcaneal-tendon', 'achilles-tendon', 'posterior'],
  ],
  foot: [
    ['um-foot-bones', 'talus', 'superior'],
    ['um-foot-ankle-extensors', 'tibialis-anterior', 'anterior'],
    ['um-foot-plantar', 'flexor-digitorum-brevis', 'inferior'],
    ['um-foot-quadratus', 'quadratus-plantae', 'inferior'],
    ['um-foot-dorsal', 'extensor-digitorum-brevis', 'superior'],
    ['um-foot-long-flexors', 'tibialis-posterior', 'posterior'],
    ['um-foot-fibularis', 'peroneus-longus', 'right'],
    ['um-foot-calcaneal-tendon', 'achilles-tendon', 'posterior'],
  ],
};

for (const scope of ['calf', 'foot']) {
  void test(`${scope} has ordered unique source steps and visible selected structures`, () => {
    const steps = umDistalGuideSteps(scope);
    const admitted = new Set(limbDefinitions[scope].surfaces.map(surface => surface.slug));
    assert.deepEqual(steps.map(({ id, selected, view }) => [id, selected, view]), expected[scope]);
    assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
    for (const step of steps) {
      assert.ok(step.title.length > 0 && step.title.length <= 36);
      assert.ok(step.caption.length > 30);
      assert.ok(step.slugs.length > 0);
      assert.equal(new Set(step.slugs).size, step.slugs.length);
      assert.ok(step.slugs.every(slug => admitted.has(slug)), `${step.id} contains an unadmitted slug`);
      assert.ok(step.slugs.includes(step.selected), `${step.id} selects a hidden slug`);
    }
  });
}

void test('calf steps progress from gastrocnemius to soleus and deep source surfaces', () => {
  const steps = umDistalGuideSteps('calf');
  const slugs = index => new Set(steps[index].slugs);
  assert.deepEqual(slugs(0), new Set(limbDefinitions.calf.surfaces.map(surface => surface.slug)));
  assert.ok(slugs(1).has('gastrocnemius-medial') && slugs(1).has('gastrocnemius-lateral'));
  assert.ok(!slugs(2).has('gastrocnemius-medial') && !slugs(2).has('gastrocnemius-lateral'));
  assert.ok(slugs(2).has('soleus') && slugs(2).has('achilles-tendon'));
  assert.ok(['popliteus', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus'].every(slug => slugs(3).has(slug)));
  assert.ok(['tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus'].every(slug => slugs(4).has(slug)));
  assert.ok(slugs(5).has('peroneus-longus'));
  assert.ok(!steps.some(step => step.slugs.includes('peroneus-brevis')));
  assert.ok(steps.every(step => step.slugs.includes('tibia') && step.slugs.includes('fibula')));
});

void test('foot comparisons preserve the source Phalanges group and partial plantar scope', () => {
  const steps = umDistalGuideSteps('foot');
  const slugs = index => new Set(steps[index].slugs);
  const sourceBones = limbDefinitions.foot.surfaces.filter(surface => surface.tissue === 'skeleton' && surface.region === 'foot').map(surface => surface.slug);
  assert.deepEqual(slugs(0), new Set(sourceBones));
  assert.ok([0, 2, 3, 4].every(index => slugs(index).has('foot-bone-group')));
  assert.ok(slugs(2).has('flexor-digitorum-brevis'));
  assert.ok(!slugs(3).has('flexor-digitorum-brevis') && slugs(3).has('quadratus-plantae'));
  assert.ok(slugs(4).has('extensor-digitorum-brevis'));
  assert.ok(slugs(5).has('flexor-digitorum-longus') && slugs(5).has('flexor-hallucis-longus'));
  assert.ok(slugs(6).has('peroneus-longus'));
  assert.ok(slugs(7).has('achilles-tendon'));
  assert.deepEqual(new Set(steps.flatMap(step => step.slugs)), new Set(limbDefinitions.foot.surfaces.map(surface => surface.slug)));
  assert.ok(!steps.some(step => step.slugs.some(slug => /^(?:[1-5]-(?:proximal|middle|distal)-phalanx|medial-phalanges|lateral-phalanges)$/.test(slug))));
  assert.match(steps[0].caption, /one foot-bone group.*without digit or bone numbering/i);
});

void test('each call returns detached plans and leaves the source definitions unchanged', () => {
  const source = Object.fromEntries(['calf', 'foot'].map(scope => [scope, structuredClone(limbDefinitions[scope])]));
  for (const scope of ['calf', 'foot']) {
    const first = umDistalGuideSteps(scope);
    const pristine = structuredClone(first);
    first[0].slugs.pop();
    first[0].title = 'changed';
    first[1].caption = 'changed';
    first.reverse();
    assert.deepEqual(umDistalGuideSteps(scope), pristine);
    assert.deepEqual(limbDefinitions[scope], source[scope]);
  }
});
