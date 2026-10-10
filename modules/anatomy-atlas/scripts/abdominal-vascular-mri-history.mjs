// Exact offline editorial replay only. Never shipped or used to transfer approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/abdominal-vascular-mri-pins.json' with {type:'json'};
import transition from '../content/abdominal-vascular-mri-transition.json' with {type:'json'};
import {beforeShoulderGirdleImaging} from './shoulder-girdle-imaging-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeAbdominalVascularMri(api){
 api=beforeShoulderGirdleImaging(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'mri')===undefined))return api;
 assert.equal(hash(pins),'40b5d68a52b2e7b2bc7c61be943c626318838ac2655231fa3a43c16f4b072367');
 assert.equal(hash(transition),'54561201add95e72c2a5d3385c8a758e4f81d8923f2ea28670b7a5b154293916');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 const rows=new Map(transition.entries.map(row=>[row.id+'|'+row.tab,row]));assert.equal(rows.size,18);assert.equal(transition.entries.length,18);
 let old=0,current=0;
 for(const e of pins.entries){
  const row=rows.get(e.identity.id+'|mri');assert(row);assert.equal(hash(e.previous.mri),row.previousHash);
  const now=hash(api.bodyLesson(e.identity,'mri'));
  if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded abdominal vascular MRI teaching');current++;}
 }
 assert(old===18||current===18,'Mixed abdominal vascular MRI history');if(old===18)return api;
 const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,tab)=>{
  const e=entries.get(s.id);if(!e||tab!=='mri')return api.bodyLesson(s,tab);
  assert.equal(JSON.stringify(s),JSON.stringify(e.identity),'Another abdominal vascular source cannot be replayed');
  return structuredClone(e.previous.mri);
 };
 return{...api,bodyLesson,bodyContent(s,tab){const{readiness:_r,...shown}=bodyLesson(s,tab);return shown;}};
}
