// Offline exact replay only; never clinical approval or runtime content.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/pelvic-tributary-imaging.before.json' with {type:'json'};
import transition from '../content/pelvic-tributary-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforePelvicTributaryImaging(api){
  assert.equal(hash(pins),'766c52cb536f096e22ceb3637f340318596051e7f811fb8e341650b954b96e31');
  assert.equal(hash(transition),'98e8434f4e4ed00f6320220bb68e7ad502643c1b9be198e4068530bab1398ffc');
  assert.equal(pins.parentCommit,'7aa5f4452a487f2abd0d0545edad0bcb233ad1bf');
  assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
  assert.deepEqual(transition.entries.map(e=>[e.id,e.topic]),pins.entries.map(e=>[e.identity.id,e.topic]));
  let old=0,current=0;
  for(const [i,e]of pins.entries.entries()){
    const lesson=api.bodyLesson(e.identity,e.topic);
    if(hash(lesson)===transition.entries[i].lessonHash){
      current++;
      assert.equal(hash(api.pelvicVeinTeaching[e.group][e.topic]),transition.entries[i].teachingHash);
    }else{assert.deepEqual(lesson,e.previous,'Unrecorded pelvic tributary imaging');old++;}
  }
  assert(old===11||current===11,'Mixed pelvic tributary imaging history');
  if(old===11)return api;
  const bindings=new Map(pins.entries.map(e=>[e.identity.id+'|'+e.topic,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id+'|'+t);if(!e)return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another pelvic vein source');return structuredClone(e.previous);
  };
  const teaching=structuredClone(api.pelvicVeinTeaching);
  for(const e of pins.entries)delete teaching[e.group][e.topic];
  return {...api,bodyLesson,pelvicVeinTeaching:teaching,
    bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;},
    pelvicVeinLesson(s,t){return bindings.has(s.id+'|'+t)?bodyLesson(s,t):api.pelvicVeinLesson(s,t);}};
}
