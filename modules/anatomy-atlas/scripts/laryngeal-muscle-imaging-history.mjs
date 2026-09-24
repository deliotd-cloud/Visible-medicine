// Offline replay only, never runtime teaching or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/laryngeal-muscle-imaging.before.json' with {type:'json'};
import transition from '../content/laryngeal-muscle-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeLaryngealMuscleImaging(api){
  assert.equal(hash(pins),'2eb8b64869ada10a5d6db7a8d432de4ba0534b89752ed6fdee394c4969801fc6');
  assert.equal(hash(transition),'f8cee667c86802d1fe62672a0d27132565783a48e4067648fd60fb0cd9f887c2');
  assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
  assert.deepEqual(transition.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e]of pins.entries.entries())for(const t of ['ct','mri']){
    const lesson=api.bodyLesson(e.identity,t);
    if(hash(lesson)===transition.entries[i].topics[t])current++;
    else {assert.deepEqual(lesson,e.previous[t],'Unrecorded laryngeal muscle imaging');old++;}
  }
  assert(old===14||current===14,'Mixed laryngeal muscle imaging history');
  if(old===14)return api;
  const bindings=new Map(pins.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const entry=bindings.get(s.id);
    if(!entry||!['ct','mri'].includes(t))return api.bodyLesson(s,t);
    assert.deepEqual(s,entry.identity,'Cannot replay another laryngeal source');
    return structuredClone(entry.previous[t]);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;}};
}
