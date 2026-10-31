// Test-only reconstruction: no runtime data or approval is migrated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const lobarIds = ['frontal', 'parietal', 'temporal', 'occipital'];
export const neonatalLobarIds = ['frontal', 'parietal'];
export const posteriorLobarIds = ['temporal', 'occipital'];
export const neonatalLobarReferenceKeys = ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'];
// Remove the later posterior pair first. The earlier inverse below still pins
// the original frontal/parietal payload and both shared references verbatim.
export function nestedBeforePosteriorLobarUltrasound(api) {
  const additions = Object.fromEntries(posteriorLobarIds.map(id => {
    const matches = api.nestedConcepts.filter(c => c.id === 'cerebral-' + id);
    assert.equal(matches.length, 1, 'Expected one posterior lobe concept');
    assert(Object.hasOwn(matches[0].imaging ?? {}, 'ultrasound'), 'Missing posterior ultrasound section');
    return [id, matches[0].imaging.ultrasound];
  }));
  assert.equal(hash(additions), '025f3c49d376ea04ac9bafd5c0bd898bcbd629a2aa25414ecb13fd7ac95bd9ab',
    'Unrecorded posterior ultrasound change');
  return {...api, nestedConcepts: api.nestedConcepts.map(c => {
    if (!posteriorLobarIds.some(id => c.id === 'cerebral-' + id)) return c;
    const {ultrasound: _added, ...imaging} = c.imaging;
    return {...c, imaging};
  })};
}
// Reverse only the neonatal ultrasound epoch before replaying the older CT/MRI
// inverse. Exact value hashes reject missing, changed, or extended payloads.
export function nestedBeforeNeonatalLobarUltrasound(api) {
  const additions = Object.fromEntries(neonatalLobarIds.map(id => {
    const matches = api.nestedConcepts.filter(c => c.id === 'cerebral-' + id);
    assert.equal(matches.length, 1, 'Expected one neonatal lobe concept');
    assert(Object.hasOwn(matches[0].imaging ?? {}, 'ultrasound'), 'Missing neonatal ultrasound section');
    return [id, matches[0].imaging.ultrasound];
  }));
  assert.equal(hash(additions), '8deadee64a4a71b5c140794752b59f89f6d1e8943bafddb437cee2eac7b03098', 'Unrecorded neonatal ultrasound change');
  for (const id of ['temporal', 'occipital']) {
    const matches = api.nestedConcepts.filter(c => c.id === 'cerebral-' + id);
    assert.equal(matches.length, 1, 'Expected one unchanged lobe concept');
    assert(!Object.hasOwn(matches[0].imaging ?? {}, 'ultrasound'), 'Unexpected neonatal ultrasound scope');
  }
  const refs = Object.fromEntries(neonatalLobarReferenceKeys.map(key => {
    assert(Object.hasOwn(api.nestedTeachingReferences, key), 'Missing neonatal ultrasound reference');
    return [key, api.nestedTeachingReferences[key]];
  }));
  assert.equal(hash(refs), '7e0255d7596b727a1ba24540bbf2b0fd34f3bb340e4827efb45797b80bc2c13c', 'Unrecorded neonatal reference change');
  return {...api,
    nestedConcepts: api.nestedConcepts.map(c => {
      if (!neonatalLobarIds.some(id => c.id === 'cerebral-' + id)) return c;
      const {ultrasound: _added, ...imaging} = c.imaging;
      return {...c, imaging};
    }),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences)
      .filter(([key]) => !neonatalLobarReferenceKeys.includes(key))),
  };
}
export function nestedBeforeLobarImaging(api) {
  const additions = Object.fromEntries(lobarIds.map(id => {
    const concept = api.nestedConcepts.find(c => c.id === 'cerebral-' + id);
    assert(concept, 'Missing lobe concept');
    return [id, concept.imaging];
  }));
  assert.equal(hash(additions), '065fc2e6e642fce7041254746aa7cc1c8ac4a9d2dfa66186450152d587c40898', 'Unrecorded lobar imaging change');
  const keys = ['cerebralLobarCT', 'cerebralLobarMRI'];
  const refs = Object.fromEntries(keys.map(key => [key, api.nestedTeachingReferences[key]]));
  assert.equal(hash(refs), '39acd48fb9d3a5d90f78841fb2f27a93b1defa1674d6e797e83dae5c05637408', 'Unrecorded reference change');
  return {...api,
    nestedConcepts: api.nestedConcepts.map(c => {
      if (!lobarIds.some(id => c.id === 'cerebral-' + id)) return c;
      const {imaging, ...before} = c;
      return before;
    }),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([key]) => !keys.includes(key))),
  };
}
