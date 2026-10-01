// Exact test-only replay; never imported by learner or clinical approval code.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {beforeCerebellarMcaImaging} from './cerebellar-mca-imaging-history.mjs';
import pins from '../content/foot-sesamoid-teaching-pins.json' with {type:'json'};
import transition from '../content/foot-sesamoid-teaching-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeFootSesamoidTeaching(api){
 api=beforeCerebellarMcaImaging(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>e.topics.every(t=>api.bodyLesson(e.identity,t)===undefined)))return api;
 assert.equal(hash(pins),'dfb15a8f599b38965484b3e9ae4779ad5538660b4f005636b1a467440d31ccaf');
 assert.equal(hash(transition),'9e30ae68475ddb93f4abc52e5fba09a4f98507b5172eb600dcfa3fdfad0efa89');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(transition.entries.length,18);const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,18);
 let old=0,current=0;const previous=new Map();
 for(const e of pins.entries)for(const tab of e.topics){const key=e.identity.id+'|'+tab,row=rows.get(key);assert(row);assert.equal(row.previousHash,hash(e.previous[tab]));const now=api.bodyLesson(e.identity,tab);if(isDeepStrictEqual(now,e.previous[tab]))old++;else{assert.equal(hash(now),row.currentHash,'Unrecorded foot-sesamoid teaching');current++;}previous.set(key,{identity:e.identity,lesson:e.previous[tab]});}
 assert(old===18||current===18,'Mixed foot-sesamoid teaching history');if(old===18)return api;
 const matches=(s,t)=>isDeepStrictEqual(s,previous.get(s.id+'|'+t)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id+'|'+t).lesson):api.bodyLesson(s,t);
 return {...api,bodyLesson,footSesamoidLesson(s,t){return matches(s,t)?undefined:api.footSesamoidLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
