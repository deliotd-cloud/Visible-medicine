// Exact inverse of the two proposed adrenal ultrasound drafts. No clinical state is changed.
import assert from 'node:assert/strict';

export const adrenalUltrasoundIds = Object.freeze([
  'renal-inferior-suprarenal-artery',
  'renal-suprarenal-veins',
]);
export const adrenalUltrasoundReferenceKeys = Object.freeze([
  'renalFetalAdrenalDoppler',
  'renalAdrenalVeinLaparoscopicUltrasound',
]);

const additions = Object.freeze({
  'renal-inferior-suprarenal-artery': {
    study: 'renal', fmaIds: ['FMA69265'],
    ultrasound: {
      body: 'Fetal Doppler example: Xu and colleagues followed the inferior adrenal artery along the upper kidney pole using colour Doppler and recorded flow-velocity waveforms. Their low-risk pregnancy study does not establish routine adult visibility or adult reference ranges. This adult mesh supplies no waveform, perfusion measurement or fetal model; the defective left arterial surface remains withheld. Summary adapted from Xu et al. (2020), CC BY 4.0.',
      references: ['renalFetalAdrenalDoppler', 'renalReuseLicense'], readiness: 'draft',
    },
  },
  'renal-suprarenal-veins': {
    study: 'renal', fmaIds: ['FMA14343', 'FMA14349'],
    ultrasound: {
      body: 'Intraoperative ultrasound example: an older adrenal-tumour series demonstrated the gland’s relationship to the kidney and nearby vessels during laparoscopic surgery, but the adrenal vein was seen in only six of 28 operations. This describes a selected surgical setting, not a routine abdominal-ultrasound detection rate or a side-specific normal standard. On acquired images, establish continuity with adjacent vessels; these paired source surfaces provide neither an ultrasound view nor a validated venous junction.',
      references: ['renalAdrenalVeinLaparoscopicUltrasound'], readiness: 'draft',
    },
  },
});

const newReferences = Object.freeze({
  renalFetalAdrenalDoppler: {
    title: 'Xu et al. · Fetal adrenal artery Doppler (2020; CC BY 4.0)',
    url: 'https://doi.org/10.1186/s12884-020-03480-z', scopedToConcept: true,
  },
  renalAdrenalVeinLaparoscopicUltrasound: {
    title: 'Brunt et al. · Laparoscopic ultrasound of adrenal tumours (1999; abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10670859/', scopedToConcept: true,
  },
});
const reusedLicense = Object.freeze({
  title: 'Creative Commons Attribution 4.0 licence',
  url: 'https://creativecommons.org/licenses/by/4.0/',
});

export function nestedBeforeAdrenalUltrasound(api) {
  assert(Array.isArray(api?.nestedConcepts), 'Nested concepts required');
  assert(api?.nestedTeachingReferences && typeof api.nestedTeachingReferences === 'object', 'Nested references required');
  const concepts = adrenalUltrasoundIds.map(id => {
    const matches = api.nestedConcepts.filter(concept => concept.id === id);
    assert.equal(matches.length, 1, `Exactly one ${id} required`);
    const concept = matches[0], expected = additions[id];
    assert.equal(concept.study, expected.study, `Changed ${id} study`);
    assert.deepEqual(Array.from(concept.fmaIds), expected.fmaIds, `Changed ${id} FMA IDs`);
    assert.deepEqual(Array.from(Object.keys(concept.sections || {})).sort(),
      ['anatomy', 'clinical', 'function', 'pathology'], `Changed ${id} section keys`);
    assert(concept.imaging && typeof concept.imaging === 'object', `Missing ${id} imaging`);
    assert(Object.hasOwn(concept.imaging, 'ct') && Object.hasOwn(concept.imaging, 'mri'),
      `Missing ${id} predecessor imaging`);
    return concept;
  });
  assert.deepEqual({ ...api.nestedTeachingReferences.renalReuseLicense }, reusedLicense, 'Changed reused renal licence');
  const sectionPresent = concepts.map(concept => Object.hasOwn(concept.imaging, 'ultrasound'));
  const referencePresent = adrenalUltrasoundReferenceKeys.map(key => Object.hasOwn(api.nestedTeachingReferences, key));
  const all = [...sectionPresent, ...referencePresent];
  assert(all.every(Boolean) || all.every(value => !value), 'Partial adrenal ultrasound addition');
  if (all.every(value => !value)) return api;

  for (const concept of concepts) {
    assert.deepEqual(structuredClone({ ...concept.imaging.ultrasound,
      references: Array.from(concept.imaging.ultrasound.references) }), additions[concept.id].ultrasound,
      `Changed ${concept.id} ultrasound draft`);
  }
  for (const key of adrenalUltrasoundReferenceKeys) {
    assert.deepEqual({ ...api.nestedTeachingReferences[key] }, newReferences[key], `Changed ${key} reference`);
  }
  const predecessor = { ...api,
    nestedConcepts: structuredClone(api.nestedConcepts),
    nestedTeachingReferences: structuredClone(api.nestedTeachingReferences),
  };
  for (const concept of predecessor.nestedConcepts) {
    if (adrenalUltrasoundIds.includes(concept.id)) delete concept.imaging.ultrasound;
  }
  for (const key of adrenalUltrasoundReferenceKeys) delete predecessor.nestedTeachingReferences[key];
  return predecessor;
}
