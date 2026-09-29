// Test-only reconstruction: no runtime data or approval is migrated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const lobarIds = ['frontal', 'parietal', 'temporal', 'occipital'];
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
