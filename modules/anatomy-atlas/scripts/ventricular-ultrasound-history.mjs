// Test-only reconstruction of the prior corpus; never migrates clinical records.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nestedBeforeCardiacXray} from './cardiac-xray-history.mjs';
import {nestedBeforeSuperiorTemporalMRI} from './superior-temporal-mri-history.mjs';
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const ventricularUltrasoundIds = ['lateral','third','fourth'];
export function nestedBeforeVentricularUltrasound(api) {
  api = nestedBeforeCardiacXray(nestedBeforeSuperiorTemporalMRI(api));
  const additions = Object.fromEntries(ventricularUltrasoundIds.map(id => {
    const c = api.nestedConcepts.find(c => c.id === 'ventricular-' + id);
    assert(c);return [id,c.imaging.ultrasound];
  }));
  assert.equal(hash(additions),'6494987144061d92e06505bcf882dc244e56eb575f6e86977f63faab5cf318e3','Unrecorded ventricular ultrasound change');
  const keys=['ventricularNeonatalUS','ventricularPosteriorFossaUS'];
  const refs=Object.fromEntries(keys.map(k=>[k,api.nestedTeachingReferences[k]]));
  assert.equal(hash(refs),'b3383b8f3403128e1363edb6f4602b621857ac96c3d01b1353d81b06863e091b','Unrecorded ventricular ultrasound references');
  return {...api,
    nestedConcepts: api.nestedConcepts.map(c=>{
      if(!ventricularUltrasoundIds.some(id=>c.id==='ventricular-'+id))return c;
      const {ultrasound,...imaging}=c.imaging;return {...c,imaging};
    }),
    nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([key])=>!keys.includes(key))),
  };
}
