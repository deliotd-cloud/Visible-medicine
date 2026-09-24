// Offline replay only; never runtime teaching or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/orbital-ultrasound.before.json' with {type:'json'};
import transition from '../content/orbital-ultrasound.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeOrbitalUltrasound(api){
 assert.equal(hash(pins),'1b3a483a274bb0ba6d6a4b2c3e91115df7a2755acea0a7e2d22e2772195fbdd1');
 assert.equal(hash(transition),'8ddf885be2b34c663f1200739c279ea3ed411133b52e7773da6eed9c978f77e8');
 assert.equal(pins.parentCommit,'8b73216dd8f4b4e8b40eb0ba77fe9dde1bca569f');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.deepEqual(transition.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
 let old=0,current=0;
 for(const [i,e]of pins.entries.entries()){
  const lesson=api.bodyLesson(e.identity,'ultrasound');
  if(hash(lesson)===transition.entries[i].lessonHash){
   current++;
   assert.equal(hash(api.orbitalNeckMuscleImagingGroups[e.group].focus.ultrasound),transition.entries[i].focusHash);
  }else{assert.deepEqual(lesson,e.previous,'Unrecorded orbital ultrasound');old++;}
 }
 assert(old===14||current===14,'Mixed orbital ultrasound history');
 if(old===14)return api;
 assert.equal(hash(api.orbitalUltrasoundMode),transition.modeHash);
 const bindings=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,t)=>{
  const e=bindings.get(s.id);if(!e||t!=='ultrasound')return api.bodyLesson(s,t);
  assert.deepEqual(s,e.identity,'Cannot replay another orbital muscle source');return structuredClone(e.previous);
 };
 const groups=structuredClone(api.orbitalNeckMuscleImagingGroups);
 for(const e of pins.entries)delete groups[e.group].focus.ultrasound;
 const references={...api.orbitalNeckMuscleImagingReferences};
 assert.equal(references.orbitalUS,'https://pmc.ncbi.nlm.nih.gov/articles/PMC4250497/');
 assert.equal(references.obliqueUS,'https://pubmed.ncbi.nlm.nih.gov/3062525/');
 delete references.orbitalUS;delete references.obliqueUS;
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;},
  orbitalNeckMuscleImagingGroups:groups,orbitalNeckMuscleImagingReferences:references,
  orbitalNeckMuscleImagingLesson(s,t){if(bindings.has(s.id)&&t==='ultrasound')return undefined;return api.orbitalNeckMuscleImagingLesson(s,t);}};
}
