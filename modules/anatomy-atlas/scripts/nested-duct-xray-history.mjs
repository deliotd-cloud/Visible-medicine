// Offline exact editorial reconstruction, never runtime or approval migration.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import transition from '../content/nested-duct-xray.transition.json' with {type:'json'};

const ids=['pancreatic-ductal-system','hepatic-biliary'];
const keys=['ductXrayErcp','ductXrayPtc'];
const copy=value=>JSON.parse(JSON.stringify(value));
export function nestedBeforeDuctXray(api){
  assert.equal(transition.sourceCommit,'f3d6966a040b69a375f6bbfa2a8c502b8c8492e4');
  assert.equal(createHash('sha256').update(JSON.stringify(transition)).digest('hex'),'b9da014fa642bbb62d2ce39df715114660d04d6c2c95af22e3a3b67318fac75c','Duct X-ray history record changed');
  assert.equal(api.nestedConcepts.filter(c=>ids.includes(c.id)).length,2,'Missing or duplicate duct concepts');
  const current=ids.map(id=>copy(api.nestedConcepts.find(c=>c.id===id)));
  const references=copy(Object.fromEntries(keys.filter(k=>Object.hasOwn(api.nestedTeachingReferences,k)).map(k=>[k,api.nestedTeachingReferences[k]])));
  if(isDeepStrictEqual(current,transition.beforeConcepts)){
    assert.deepEqual(references,{},'Mixed duct X-ray references');return api;
  }
  assert.deepEqual(current,transition.afterConcepts,'Unrecorded duct X-ray teaching');
  assert.deepEqual(references,transition.references,'Mixed duct X-ray references');
  return {...api,nestedConcepts:api.nestedConcepts.map(c=>ids.includes(c.id)?structuredClone(transition.beforeConcepts.find(p=>p.id===c.id)):c),nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([key])=>!keys.includes(key)))};
}
