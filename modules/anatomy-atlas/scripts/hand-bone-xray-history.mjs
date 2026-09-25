// Offline editorial replay only; never imported by the viewer or used as approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import before from '../content/hand-bone-xray.before.json' with {type:'json'};
import transition from '../content/hand-bone-xray.transition.json' with {type:'json'};
import {beforeHalluxXray} from './hallux-xray-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeHandBoneXray(api){
  api=beforeHalluxXray(api);
  assert.equal(hash(before),'5461b6c93d7eb8225d8619e2a3cc86f1470e5eef651a143c3af4566c7579c5af');
  assert.equal(hash(transition),'d4f8ede9a7111b3046c54f5bd4c173ca3357cfb3344b0a00ff6033664c2d122b');
  assert.equal(before.parentCommit,'5f5a839b9c528d50ae67bd58c226bcfd3b69e6cd');
  assert.equal(transition.parentCommit,before.parentCommit);assert.equal(transition.beforeHash,hash(before));
  assert.deepEqual(transition.entries.map(e=>e.id),before.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(hash(api.handBoneXrayLesson(e.identity,'xray')),transition.entries[i].lessonHash,'Unrecorded hand bone X-ray draft');
    const lesson=api.bodyLesson(e.identity,'xray');
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded hand bone X-ray change');old++;}
  }
  assert(old===38||current===38,'Mixed hand bone X-ray history');
  if(old===38)return api;
  const bindings=new Map(before.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='xray')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another hand bone source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
