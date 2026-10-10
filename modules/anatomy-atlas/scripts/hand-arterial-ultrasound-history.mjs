// Test-only immutable editorial replay; never used to migrate approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/hand-arterial-ultrasound-pins.json' with {type:'json'};
import transition from '../content/hand-arterial-ultrasound-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeHandArterialUltrasound(api){
 if(typeof api.bodyLesson!=='function')return api;
 assert.equal(hash(pins),'db442edf449e00d45221ad819360b7ca6fbfe551df485bd4d0df0b7a561b170b');
 assert.equal(hash(transition),'dfa9bb0056622b38883c27edde9c1ff37ef9293836fa5415482807749fdde517');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 const rows=new Map(transition.entries.map(e=>[e.id+'|'+e.tab,e]));
 assert.equal(rows.size,28);assert.equal(transition.entries.length,28);
 let old=0,current=0;
 for(const e of pins.entries){
  assert.deepEqual(e.topics,['ultrasound']);const row=rows.get(e.identity.id+'|ultrasound');assert(row);
  assert.equal(row.previousHash,hash(e.previous.ultrasound));const now=hash(api.bodyLesson(e.identity,'ultrasound'));
  if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded hand ultrasound draft');current++;}
 }
 assert(old===28||current===28,'Mixed hand ultrasound history');if(old===28)return api;
 const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,tab)=>{
  const entry=entries.get(s.id);if(!entry||tab!=='ultrasound')return api.bodyLesson(s,tab);
  assert.equal(JSON.stringify(s),JSON.stringify(entry.identity),'Foreign hand source cannot replay');
  return structuredClone(entry.previous.ultrasound);
 };
 return{...api,bodyLesson,bodyContent(s,tab){const{readiness:_r,...shown}=bodyLesson(s,tab);return shown;}};
}
