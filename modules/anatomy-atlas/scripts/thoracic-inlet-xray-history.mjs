// Test-only editorial replay, never clinical approval or application content.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import before from '../content/thoracic-inlet-xray.before.json' with {type:'json'};
import transition from '../content/thoracic-inlet-xray.transition.json' with {type:'json'};
import {beforeEsophagusExternalUltrasound} from './esophagus-external-ultrasound-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeThoracicInletXray(api){
  api=beforeEsophagusExternalUltrasound({api}).api;
  assert.equal(hash(before),'fcbe16f258434417aba02c0f1b0a5e85010e4954cb6e8a3a14f5a365bba8a00b');
  assert.equal(hash(transition),'de808af35f01c54502f8cbdd79291f627fad368bdf291162cc0a93a807ca8e28');
  assert.equal(before.parentCommit,'03e05321688e893463e1a45547373b304cc9896e');
  assert.equal(transition.parentCommit,before.parentCommit);
  assert.equal(transition.beforeHash,hash(before));
  assert.deepEqual(transition.entries.map(e=>e.id),before.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(hash(api.thoracicInletXrayLesson(e.identity,'xray')),transition.entries[i].lessonHash,'Unrecorded thoracic-inlet draft');
    const lesson=api.bodyLesson(e.identity,'xray');
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded thoracic-inlet change');old++;}
  }
  assert(old===6||current===6,'Mixed thoracic-inlet history');
  if(old===6)return api;
  const bindings=new Map(before.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='xray')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another thoracic-inlet source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
