// Exact offline editorial replay only. Never shipped or used to transfer approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/colic-arterial-mri-pins.json' with {type:'json'};
import transition from '../content/colic-arterial-mri-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeColicArterialMri(api){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'mri')===undefined))return api;
 assert.equal(hash(pins),'4bb38246d0454cd6705dd953aa2fdfdb2a2a396b922ec5d20b176ca3e3d035ad');
 assert.equal(hash(transition),'26676260176d0b5f0761c8218194b2d4a981b18efc11bb61aefb962ed321a7be');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 const rows=new Map(transition.entries.map(row=>[row.id+'|'+row.tab,row]));assert.equal(rows.size,9);assert.equal(transition.entries.length,9);
 let old=0,current=0;
 for(const e of pins.entries){
  const row=rows.get(e.identity.id+'|mri');assert(row);assert.equal(hash(e.previous.mri),row.previousHash);
  const now=hash(api.bodyLesson(e.identity,'mri'));
  if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded colic MRI teaching');current++;}
 }
 assert(old===9||current===9,'Mixed colic MRI history');if(old===9)return api;
 const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,tab)=>{
  const e=entries.get(s.id);if(!e||tab!=='mri')return api.bodyLesson(s,tab);
  assert.equal(JSON.stringify(s),JSON.stringify(e.identity),'Another colic source cannot be replayed');
  return structuredClone(e.previous.mri);
 };
 return{...api,bodyLesson,bodyContent(s,tab){const{readiness:_r,...shown}=bodyLesson(s,tab);return shown;}};
}
