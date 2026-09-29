// Test-only prior-state reconstruction; no review record or runtime is migrated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cerebralTeaching} from '../content/cerebral-teaching.ts';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function nestedBeforeSuperiorTemporalMRI(api){
 const keys=['superiorTemporalLandmarks','temporalMultiplanarMRI'];
 if(keys.every(k=>!api.nestedTeachingReferences[k]))return api;
 const lessons=Object.fromEntries(['anterior','posterior'].map(id=>[id,api.nestedConcepts.find(c=>c.id==='cerebral-superior-temporal-'+id)?.imaging?.mri]));
 assert.equal(hash(lessons),'90f721cf3d855f7224e81470849827a8b02552502bfe2fb6a464be8e8e8473d8');
 assert.equal(hash(Object.fromEntries(keys.map(k=>[k,api.nestedTeachingReferences[k]]))),'ad836758b63d99ecc7546f922ac98b0e2320bac549fa81cc186df14be30541ec');
 return {...api,nestedConcepts:api.nestedConcepts.map(c=>{
  if(c.id==='cerebral-superior-temporal-anterior')return {...c,imaging:cerebralTeaching.anteriorSuperiorTemporal.imaging};
  if(c.id==='cerebral-superior-temporal-posterior'){const {imaging,...prior}=c;return prior;}
  return c;
 }),nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([k])=>!keys.includes(k)))};
}
