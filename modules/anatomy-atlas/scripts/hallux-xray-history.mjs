// Offline editorial replay only; never imported by the viewer or used as approval.
import assert from 'node:assert/strict';
import {beforeMediastinalXray} from './mediastinal-xray-history.mjs';
import {createHash} from 'node:crypto';
import before from '../content/hallux-xray.before.json' with {type:'json'};
import transition from '../content/hallux-xray.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeHalluxXray(api){
  api=beforeMediastinalXray(api);
  assert.equal(hash(before),'87be38cc4d239d46054ffd930fffbffe4032cbfb80e7ee162f5e27c85c4269e3');
  assert.equal(hash(transition),'24d52dd395bf534ead3b526e18d5e2c32c9984f3db43904cdd3f789dc1d08ae1');
  assert.equal(before.parentCommit,'2902cc420d3a4730c3472a0c501fb83ba2bbdc98');
  assert.equal(transition.parentCommit,before.parentCommit);assert.equal(transition.beforeHash,hash(before));
  assert.deepEqual(transition.entries.map(e=>e.id),before.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(hash(api.halluxXrayLesson(e.identity,'xray')),transition.entries[i].lessonHash,'Unrecorded hallux X-ray draft');
    const lesson=api.bodyLesson(e.identity,'xray');
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded hallux X-ray change');old++;}
  }
  assert(old===4||current===4,'Mixed hallux X-ray history');
  if(old===4)return api;
  const bindings=new Map(before.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='xray')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another hallux source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
