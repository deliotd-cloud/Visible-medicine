// Offline editorial replay only; never a viewer dependency or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/spinal-disc-function.before.json' with {type:'json'};
import transition from '../content/spinal-disc-function.transition.json' with {type:'json'};
import {beforeLaryngealMuscleImaging} from './laryngeal-muscle-imaging-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeSpinalDiscFunction(api){
  api=beforeLaryngealMuscleImaging(api);
  assert.equal(hash(pins),'a5f93dd31e317f74065f597b9c39a6c49f74b092605ee26aca6573d1a7917cfe');
  assert.equal(hash(transition),'ac8e123628ae180ce122a444f7b2ac1c6e916513a0ab11d647fd42a8800a5a9f');
  assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
  assert.deepEqual(transition.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of pins.entries.entries()){
    const lesson=api.bodyLesson(e.identity,'function');
    if(hash(lesson)===transition.entries[i].functionHash)current++;
    else {assert.deepEqual(lesson,e.previous.function,'Unrecorded spinal disc function');old++;}
  }
  assert(old===22||current===22,'Mixed spinal disc function history');
  if(old===22)return api;
  const bindings=new Map(pins.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const entry=bindings.get(s.id);
    if(!entry||t!=='function')return api.bodyLesson(s,t);
    assert.deepEqual(s,entry.identity,'Cannot replay another disc source');
    return structuredClone(entry.previous.function);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;}};
}
