// Exact offline editorial replay only. Never shipped or used to transfer approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/interosseous-membrane-projection-pins.json' with {type:'json'};
import transition from '../content/interosseous-membrane-projection-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeInterosseousMembraneProjection(api){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>e.topics.every(tab=>api.bodyLesson(e.identity,tab)===undefined)))return api;
 assert.equal(hash(pins),'28ac5dd4dfc7b7a47d67815bc3a893e9bfb2be25b82310b9b58e1c62c73d33b8');
 assert.equal(hash(transition),'c1b9315bd75943488eaf7764d6ecf123dbbf5627d573011779e4ef284cf9debf');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 const rows=new Map(transition.entries.map(row=>[row.id+'|'+row.tab,row]));assert.equal(rows.size,8);
 let old=0,current=0;
 for(const e of pins.entries)for(const tab of e.topics){
  const row=rows.get(e.identity.id+'|'+tab);assert(row);assert.equal(hash(e.previous[tab]),row.previousHash);
  const now=hash(api.bodyLesson(e.identity,tab));
  if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded membrane projection teaching');current++;}
 }
 assert(old===8||current===8,'Mixed membrane projection history');if(old===8)return api;
 const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,tab)=>{
  const e=entries.get(s.id);if(!e||!e.topics.includes(tab))return api.bodyLesson(s,tab);
  assert.equal(JSON.stringify(s),JSON.stringify(e.identity),'Another membrane source cannot be replayed');
  return structuredClone(e.previous[tab]);
 };
 return{...api,bodyLesson,bodyContent(s,tab){const{readiness:_r,...shown}=bodyLesson(s,tab);return shown;}};
}
