// Test-only inverse for the exact cricothyroid ultrasound draft. Historical
// corpus proofs must see the 7b epoch; runtime teaching keeps the current source.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const cricothyroidUltrasoundReferenceKeys = [
  'cricothyroidUltrasoundEMG',
  'cricothyroidAirwaySonography',
];
const fieldHash = 'bc1dfe7f2c1740d02281fbb2a1f4e9d194aefa90ac620951823b4c26efcaffa3';
const referenceHashes = {
  cricothyroidUltrasoundEMG: '875a5a4d418e3db9d08b646cad44f82b6dd741f4ed318c8b767ed47d9d2a40e2',
  cricothyroidAirwaySonography: '41dfb630a5b20045560d8be1b8f35f67ef031a7187381c61fe516b0ca8f832ab',
};
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function nestedBeforeCricothyroidUltrasound(api) {
  const matches = api.nestedConcepts.filter(concept => concept.id === 'cricothyroid-source-parts');
  assert.equal(matches.length, 1, 'Exactly one cricothyroid source-parts concept');
  assert.equal(matches[0].study, 'cricothyroid');
  assert.equal(digest(matches[0].imaging?.ultrasound), fieldHash,
    'Exact proposed cricothyroid ultrasound field required');
  for (const key of cricothyroidUltrasoundReferenceKeys) {
    assert(Object.hasOwn(api.nestedTeachingReferences, key), `Missing new ultrasound reference ${key}`);
    assert.equal(digest(api.nestedTeachingReferences[key]), referenceHashes[key],
      `Exact proposed cricothyroid ultrasound reference required: ${key}`);
  }
  return {
    ...api,
    nestedConcepts: api.nestedConcepts.map(concept => {
      if (concept.id !== 'cricothyroid-source-parts') return concept;
      const { ultrasound: _newUltrasound, ...imaging } = concept.imaging;
      return { ...concept, imaging };
    }),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences)
      .filter(([key]) => !cricothyroidUltrasoundReferenceKeys.includes(key))),
  };
}
