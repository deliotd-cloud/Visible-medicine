// Offline editorial replay only; never imported by the viewer or used as approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import before from '../content/hip-abductor-xray.before.json' with {type:'json'};
import transition from '../content/hip-abductor-xray.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeHipAbductorXray(api){
  assert.equal(hash(before),'74480a7567f56ba64e4b3d0057aadb79ad76e9cd8ddcc4e1a136d8e201370710');
  assert.equal(hash(transition),'808b8ecab7b6cd0efacf3b429064d662b7f3f89fe0ffd0e84199a99988679d51');
  assert.equal(before.parentCommit,'885ea54f69991f0e2d265bcde0e6580ecdb13653');
  assert.equal(transition.parentCommit,before.parentCommit);assert.equal(transition.beforeHash,hash(before));
  assert.deepEqual(transition.entries.map(e=>e.id),before.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(hash(api.hipAbductorXrayLesson(e.identity,'xray')),transition.entries[i].lessonHash,'Unrecorded hip abductor X-ray draft');
    const lesson=api.bodyLesson(e.identity,'xray');
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded hip abductor X-ray change');old++;}
  }
  assert(old===4||current===4,'Mixed hip abductor X-ray history');
  if(old===4)return api;
  const bindings=new Map(before.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='xray')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another hip abductor source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
