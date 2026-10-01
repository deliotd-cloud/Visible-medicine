// Test-only reconstruction of the exact pre-CT authored state. No review is migrated.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const nestedCTOrientationIds = [
  'inferior-collicular-brachia',
  'cerebral-superior-temporal-anterior',
  'cerebral-superior-temporal-posterior',
  'visual-optic-chiasm',
  'visual-optic-tracts',
];
export const nestedCTOrientationReferenceKeys = [
  'nestedCTAuditory', 'nestedCTTemporal', 'nestedCTVisual', 'nestedCTReuseLicense',
];

export function nestedBeforeCTOrientation(api) {
  const additions = Object.fromEntries(nestedCTOrientationIds.map(id => {
    const concept = api.nestedConcepts.find(c => c.id === id);
    assert(concept, `Missing nested concept ${id}`);
    return [id, concept.imaging?.ct];
  }));
  const references = Object.fromEntries(nestedCTOrientationReferenceKeys.map(key =>
    [key, api.nestedTeachingReferences[key]]));
  const values = [...Object.values(additions), ...Object.values(references)];
  if (values.every(value => value === undefined)) return api;
  assert(values.every(value => value !== undefined), 'Incomplete nested CT orientation addition');
  assert.equal(hash(additions), '6b84fa0222f4fa7675166f662924a4c0fb3eb3aa14aa4def64e8fcbcc998a86e',
    'Unrecorded nested CT orientation teaching change');
  assert.equal(hash(references), '3f663ab919e4ad8805821f8a1d183c7e174129c413cbf18c579e9bb472880d67',
    'Unrecorded nested CT orientation reference change');
  const ids = new Set(nestedCTOrientationIds);
  const keys = new Set(nestedCTOrientationReferenceKeys);
  return {
    ...api,
    nestedConcepts: api.nestedConcepts.map(concept => {
      if (!ids.has(concept.id)) return concept;
      const { ct: _newCT, ...oldImaging } = concept.imaging;
      return { ...concept, imaging: oldImaging };
    }),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences)
      .filter(([key]) => !keys.has(key))),
  };
}
