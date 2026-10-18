// Test-only exact reverse transition; it does not migrate a review record.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const posteriorFossaUltrasoundIds = [
  'brainstem-midbrain', 'brainstem-pons', 'brainstem-medulla', 'brainstem-cerebellum',
];
export const posteriorFossaUltrasoundReferenceKeys = [
  'posteriorFossaNeonatalUS2024', 'posteriorFossaBrainstemMorphometry',
  'posteriorFossaUltrasoundMRI',
];

// Recorded from the four-field/three-reference transition before older assertions.
const additionsHash = 'ab968a1c953c687eb8831b2311c477745d1c85cbf8037054b1ba8d834b6ced58';
const referencesHash = '43fca8520f8afc31333ffe9715b0f8c5b397da424f2b4d52131b7aa8d125fde8';

export function nestedBeforePosteriorFossaUltrasound(api) {
  const additions = Object.fromEntries(posteriorFossaUltrasoundIds.map(id => {
    const concept = api.nestedConcepts.find(item => item.id === id);
    assert(concept, `Missing posterior-fossa concept ${id}`);
    return [id, concept.imaging?.ultrasound];
  }));
  const references = Object.fromEntries(posteriorFossaUltrasoundReferenceKeys.map(key =>
    [key, api.nestedTeachingReferences[key]]));
  const values = [...Object.values(additions), ...Object.values(references)];
  if (values.every(value => value === undefined)) return api;
  assert(values.every(value => value !== undefined),
    'Incomplete posterior-fossa ultrasound addition');
  assert.equal(hash(additions), additionsHash, 'Unrecorded posterior-fossa ultrasound teaching change');
  assert.equal(hash(references), referencesHash, 'Unrecorded posterior-fossa ultrasound reference change');
  const ids = new Set(posteriorFossaUltrasoundIds);
  const keys = new Set(posteriorFossaUltrasoundReferenceKeys);
  return {
    ...api,
    nestedConcepts: api.nestedConcepts.map(concept => {
      if (!ids.has(concept.id)) return concept;
      const { ultrasound: _addition, ...imaging } = concept.imaging;
      return { ...concept, imaging };
    }),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences)
      .filter(([key]) => !keys.has(key))),
  };
}
