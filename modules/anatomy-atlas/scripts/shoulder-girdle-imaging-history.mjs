// Exact offline editorial replay only. Never shipped or used to transfer approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/shoulder-girdle-imaging-pins.json' with {type:'json'};
import transition from '../content/shoulder-girdle-imaging-transition.json' with {type:'json'};
import {beforeThoracoabdominalOrientation} from './thoracoabdominal-orientation-history.mjs';

const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeShoulderGirdleImaging(api){
 api=beforeThoracoabdominalOrientation(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>e.topics.every(tab=>api.bodyLesson(e.identity,tab)===undefined)))return api;
 assert.equal(hash(pins),'f93a2d2efebd7619547c54f177a6046d8580ca36795818f006ce2ecc1cf2faa6');
 assert.equal(hash(transition),'2885a8033e40272188bc36f7418840b79485b6719ed7057e11d95af257d47d65');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(pins.entries.length,16);assert.equal(transition.entries.length,32);
 const rows=new Map(transition.entries.map(row=>[row.id+'|'+row.tab,row]));assert.equal(rows.size,32);
 let old=0,current=0;
 for(const e of pins.entries){
  for(const tab of e.topics){
   const row=rows.get(e.identity.id+'|'+tab);assert(row);assert.equal(hash(e.previous[tab]),row.previousHash);
   const now=hash(api.bodyLesson(e.identity,tab));
   if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded shoulder girdle imaging teaching');current++;}
  }
 }
 assert(old===32||current===32,'Mixed shoulder girdle imaging history');if(old===32)return api;
 const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,tab)=>{
  const e=entries.get(s.id);if(!e||!e.topics.includes(tab))return api.bodyLesson(s,tab);
  assert.equal(JSON.stringify(s),JSON.stringify(e.identity),'Another shoulder girdle source cannot be replayed');
  return structuredClone(e.previous[tab]);
 };
 return{...api,bodyLesson,bodyContent(s,tab){const{readiness:_r,...shown}=bodyLesson(s,tab);return shown;}};
}
