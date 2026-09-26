// Test-only editorial replay, never clinical approval or application content.
import assert from 'node:assert/strict';
import {beforeThoracicInletXray} from './thoracic-inlet-xray-history.mjs';
import {createHash} from 'node:crypto';
import before from '../content/hilar-vessel-xray.before.json' with {type:'json'};
import transition from '../content/hilar-vessel-xray.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeHilarVesselXray(api){
  api=beforeThoracicInletXray(api);
  assert.equal(hash(before),'483e52caf562c361d6bc6606b81aeaf6c48ca32e9b7738c0d24daaa73362c5d4');
  assert.equal(hash(transition),'3294d9d33357b3580ad5f926bcb16e70db17bda9f59dc7e8f03a7f67ede68a53');
  assert.equal(before.parentCommit,'d8ac584897df09fa0001d51c0d3830acf3904f22');
  assert.equal(transition.parentCommit,before.parentCommit);
  assert.equal(transition.beforeHash,hash(before));
  assert.deepEqual(transition.entries.map(e=>e.id),before.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(hash(api.hilarVesselXrayLesson(e.identity,'xray')),transition.entries[i].lessonHash,'Unrecorded hilar-vessel draft');
    const lesson=api.bodyLesson(e.identity,'xray');
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded hilar-vessel change');old++;}
  }
  assert(old===6||current===6,'Mixed hilar-vessel history');
  if(old===6)return api;
  const bindings=new Map(before.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='xray')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another hilar-vessel source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
