// Test-only restoration of the exact prior teaching corpus, never approvals.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const cardiacXrayIds=['right-atrium','left-atrium','right-ventricle','left-ventricle'];
export function nestedBeforeCardiacXray(api){
 const keys=['cardiacRadiographicContours','cardiacProjectionQuality'];
 const additions=Object.fromEntries(cardiacXrayIds.map(id=>[id,api.nestedConcepts.find(c=>c.id==='cardiac-'+id)?.imaging?.xray]));
 const refs=Object.fromEntries(keys.map(k=>[k,api.nestedTeachingReferences[k]]));
 if(Object.values(additions).every(v=>!v)&&Object.values(refs).every(v=>!v))return api;
 assert.equal(hash(additions),'eb3de2c35ec15afc343fd2e016d947d194fd654076829bee67c6b14657641b00','Unrecorded cardiac X-ray teaching');
 assert.equal(hash(refs),'e799f11eab409b171f42d2701a671222cb3cd3a7fea49ec730243a79f44e56fd','Unrecorded cardiac X-ray references');
 return {...api,nestedConcepts:api.nestedConcepts.map(c=>{
  if(!cardiacXrayIds.some(id=>c.id==='cardiac-'+id))return c;
  const {xray,...imaging}=c.imaging;return {...c,imaging};
 }),nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([k])=>!keys.includes(k)))};
}
