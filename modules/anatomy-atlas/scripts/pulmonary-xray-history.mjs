// Offline exact editorial reconstruction; never a runtime or approval migration.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import transition from '../content/pulmonary-xray.transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const keys=['pulmonaryChestXray','pulmonaryLobarProjection'];
export function nestedBeforePulmonaryXray(api){
 assert.equal(transition.sourceCommit,'77eaf754b12e039abc710f2fab21db28b2385f2f');
 assert.equal(hash(transition),'d3eaccd78a1369f74023a85067759755d160f12fe1bc1eacf4d0e92c7cbb1b43','Pulmonary X-ray history record changed');
 const current=JSON.parse(JSON.stringify(api.nestedConcepts.filter(c=>c.study==='pulmonary')));
 const references=Object.fromEntries(keys.filter(k=>Object.hasOwn(api.nestedTeachingReferences,k)).map(k=>[k,api.nestedTeachingReferences[k]]));
 if(isDeepStrictEqual(current,transition.beforePulmonary)){
  assert.deepEqual(references,{},'Mixed pulmonary X-ray references');return api;
 }
 assert.deepEqual(current,transition.afterPulmonary,'Unrecorded pulmonary X-ray teaching');
 assert.deepEqual(JSON.parse(JSON.stringify(references)),transition.references,'Mixed pulmonary X-ray references');
 return {...api,nestedConcepts:api.nestedConcepts.map(c=>c.study==='pulmonary'?structuredClone(transition.beforePulmonary.find(p=>p.id===c.id)):c),nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([k])=>!keys.includes(k)))};
}
