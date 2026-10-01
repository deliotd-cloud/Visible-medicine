// Test-only reconstruction. No current teaching, review or approval is migrated.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const eyeCrossSectionalScope = {
  'eye-cornea': ['ct', 'mri'], 'eye-iris': ['ct', 'mri'],
  'eye-lens': ['mri'], 'eye-zonule': ['ct', 'mri'],
  'eye-vitreous': ['ct', 'mri'], 'eye-choroid': ['ct'],
  'eye-chamber': ['ct', 'mri'],
};
export function nestedBeforeEyeCrossSectional(api) {
  const additions = Object.fromEntries(Object.entries(eyeCrossSectionalScope).map(([id, topics]) => {
    const c = api.nestedConcepts.find(c => c.id === id);
    assert(c, 'Missing eye concept');
    return [id, Object.fromEntries(topics.map(topic => [topic, c.imaging?.[topic]]))];
  }));
  const populated = Object.values(additions).flatMap(value => Object.values(value));
  if (populated.every(value => value === undefined)) return api;
  assert.equal(hash(additions), 'bb3a86b02541c371b8e6b98215fc14c603f98dc31ac047ae09430e5825d294e8', 'Unrecorded eye cross-sectional teaching change');
  const keys = ['eyeCrossSectionalMRAnatomy', 'eyeCrossSectionalPosteriorAnatomy'];
  assert.equal(hash(Object.fromEntries(keys.map(key => [key, api.nestedTeachingReferences[key]]))),
    '7ea85c4f0e65723720a8d86fbc7c7c190644054e7467de7a1919a53e413fc881', 'Unrecorded eye cross-sectional reference change');
  return { ...api,
    nestedConcepts: api.nestedConcepts.map(c => {
      if (!Object.hasOwn(eyeCrossSectionalScope, c.id)) return c;
      return { ...c, imaging: Object.fromEntries(Object.entries(c.imaging)
        .filter(([topic]) => !eyeCrossSectionalScope[c.id].includes(topic))) };
    }),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences)
      .filter(([key]) => !keys.includes(key))),
  };
}
