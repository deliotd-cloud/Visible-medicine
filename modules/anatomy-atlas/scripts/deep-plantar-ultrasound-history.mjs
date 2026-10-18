// Exact test-only reversal; never imported by learners or decision handlers.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import pins from '../content/deep-plantar-ultrasound-pins.json' with {type:'json'};
import transition from '../content/deep-plantar-ultrasound-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const transitionHash='75123a2558a647826293dd1bc24f29fb9fbeffdf04516b0661c224acbdef3957';
export function beforeDeepPlantarUltrasound(api){
 if(typeof api?.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'ultrasound')===undefined))return api;
 assert.equal(hash(pins),'8d0491edb994897c63a32dfb2aeefc380890af3356531ec2623e7848dab5c1a3');
 assert.equal(hash(transition),transitionHash);
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(transition.entries.length,2);assert.equal(pins.entries.length,2);
 const originals=new Map();let previous=0,current=0;
 for(const entry of pins.entries){
  const rows=transition.entries.filter(row=>row.id===entry.identity.id&&row.tab==='ultrasound');assert.equal(rows.length,1);
  assert.equal(rows[0].fmaId,entry.identity.fmaId);assert.equal(rows[0].previousHash,hash(entry.previous));
  const shown=api.bodyLesson(entry.identity,'ultrasound');
  if(isDeepStrictEqual(shown,entry.previous))previous++;
  else{assert.equal(hash(shown),rows[0].currentHash,'Unrecorded deep plantar ultrasound');current++;}
  if(typeof api.deepPlantarUltrasoundLesson==='function')
   assert.equal(hash(api.deepPlantarUltrasoundLesson(entry.identity,'ultrasound')),rows[0].currentHash,'Unrecorded deep plantar helper');
  originals.set(entry.identity.id,entry);
 }
 assert(previous===2||current===2,'Mixed deep plantar ultrasound history');
 if(previous===2)return api;
 const bodyLesson=(structure,tab)=>{
  const entry=tab==='ultrasound'&&originals.get(structure.id);
  if(!entry)return api.bodyLesson(structure,tab);
  assert.deepEqual(structure,entry.identity,'Historical deep plantar ultrasound requires exact source identity');
  return structuredClone(entry.previous);
 };
 return {...api,bodyLesson,bodyContent(structure,tab){
  if(tab!=='ultrasound'||!originals.has(structure.id))return api.bodyContent(structure,tab);
  const{readiness,...shown}=bodyLesson(structure,tab);return shown;
 }};
}
