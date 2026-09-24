// Offline replay only; never imported by runtime or approval code.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/pulmonary-vein-ultrasound.before.json' with {type:'json'};
import transition from '../content/pulmonary-vein-ultrasound.transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforePulmonaryVeinUltrasound(api){
  assert.equal(hash(pins),'276b7f9cdf8d84550b812aaa4f62261e95e50317bf02be19031146c98dc89bb9');
  assert.equal(hash(transition),'4b69bbf324b699894b2e877fe65e69077680f882c5599330bbdb5671663900e7');
  assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
  assert.deepEqual(transition.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
  let old=0,current=0;
  for(const [i,e] of pins.entries.entries()){
    const lesson=api.bodyLesson(e.identity,'ultrasound');
    if(hash(lesson)===transition.entries[i].lessonHash){
      current++;
      assert.equal(hash(api.centralVesselImagingGroups[e.group].focus.ultrasound),transition.entries[i].focusHash);
    }else{assert.deepEqual(lesson,e.previous,'Unrecorded pulmonary-vein ultrasound');old++;}
  }
  assert(old===4||current===4,'Mixed pulmonary-vein ultrasound history');
  if(old===4)return api;
  const bindings=new Map(pins.entries.map(e=>[e.identity.id,e]));
  const bodyLesson=(s,t)=>{
    const e=bindings.get(s.id);if(!e||t!=='ultrasound')return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another pulmonary-vein source');return structuredClone(e.previous);
  };
  const groups=structuredClone(api.centralVesselImagingGroups);
  for(const e of pins.entries)delete groups[e.group].focus.ultrasound;
  const references={...api.centralVesselImagingReferences};
  assert.equal(references.echoTEE,'https://www.asecho.org/wp-content/uploads/2014/05/2013_Performing-Comprehensive-TEE.pdf');
  delete references.echoTEE;
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;},
    centralVesselImagingGroups:groups,centralVesselImagingReferences:references,
    centralVesselImagingLesson(s,t){if(bindings.has(s.id)&&t==='ultrasound')return undefined;return api.centralVesselImagingLesson(s,t);}};
}
