// Test-only editorial replay, never clinical approval or application content.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import before from '../content/mediastinal-xray.before.json' with {type:'json'};
import transition from '../content/mediastinal-xray.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeMediastinalXray(api){
  assert.equal(hash(before),'43074d111ee8e330fd27b5010b0ce2d27755181653e6eb623917fcce06166c9f');
  assert.equal(hash(transition),'16a870325a20cd2301540e5cd34461e3195f99d6861122f69b758d46a7858ba9');
  assert.equal(before.parentCommit,'5e3667fe3c9f012cbc21e679ba2e834f527dcc3f');
  assert.equal(transition.parentCommit,before.parentCommit);
  assert.equal(transition.beforeHash,hash(before));
  assert.deepEqual(transition.entries.map(e=>e.id),before.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(hash(api.mediastinalXrayLesson(e.identity,'xray')),transition.entries[i].lessonHash,'Unrecorded mediastinal draft');
    const lesson=api.bodyLesson(e.identity,'xray');
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded mediastinal change');old++;}
  }
  assert(old===5||current===5,'Mixed mediastinal history');
  if(old===5)return api;
  const bindings=new Map(before.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='xray')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another mediastinal source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
