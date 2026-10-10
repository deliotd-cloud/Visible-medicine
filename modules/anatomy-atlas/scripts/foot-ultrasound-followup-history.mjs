// Test-only bounded reversal; never a learner fallback or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/foot-ultrasound-followup-pins.json' with {type:'json'};
import transition from '../content/foot-ultrasound-followup.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeFootUltrasoundFollowup({api,catalog}){
 assert.equal(pins.baseline,'ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb');
 assert.equal(hash(pins),'87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d');assert.equal(hash(transition),'f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193');
 assert.equal(transition.sourcePinsHash,hash(pins));assert.equal(transition.baseline,pins.baseline);
 const display=api.bodyDisplayCatalog(catalog),originals=new Map();let drafts=0,previous=0;
 for(const entry of pins.entries){
  assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity,'Unrecorded foot-ultrasound followup identity');
  for(const[tab,lesson]of Object.entries(entry.previous)){
   assert.equal(lesson.readiness,entry.family==='halluxNote'?'draft':'pending');
   const recorded=transition.entries.find(e=>e.id===entry.identity.id&&e.tab===tab);assert(recorded);assert.equal(recorded.fmaId,entry.identity.fmaId);
   assert.equal(hash(api.footUltrasoundFollowupLesson(entry.identity,tab)),recorded.draftHash,'Unrecorded foot-ultrasound followup draft');
   const current=api.bodyLesson(entry.identity,tab);
   if(hash(current)===recorded.draftHash)drafts++;else{assert.deepEqual(current,lesson,'Unrecorded foot-ultrasound followup history');previous++;}
   const{readiness,...shown}=current;assert.deepEqual(api.bodyContent(entry.identity,tab),shown);
   originals.set(entry.identity.id+':'+tab,{identity:entry.identity,lesson});
  }
 }
 assert.equal(originals.size,12);assert(drafts===12||previous===12,'Mixed foot-ultrasound followup history');
 if(previous===12)return api;
 const bodyLesson=(structure,tab)=>{const entry=originals.get(structure.id+':'+tab);if(!entry)return api.bodyLesson(structure,tab);assert.deepEqual(structure,entry.identity,'Historical foot-ultrasound followup lesson requires exact source identity');return structuredClone(entry.lesson);};
 const bodyContent=(structure,tab)=>{if(!originals.has(structure.id+':'+tab))return api.bodyContent(structure,tab);const{readiness,...shown}=bodyLesson(structure,tab);return shown;};
 return {...api,bodyLesson,bodyContent};
}
