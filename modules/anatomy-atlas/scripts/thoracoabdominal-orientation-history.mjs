// Exact editorial rollback for historical tests only, never an approval transfer.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/thoracoabdominal-orientation-pins.json' with {type:'json'};
import transition from '../content/thoracoabdominal-orientation-transition.json' with {type:'json'};
import {beforeTarsalBoneQuiz} from './tarsal-bone-quiz-history.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeThoracoabdominalOrientation(api){
 api=beforeTarsalBoneQuiz(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>e.topics.every(tab=>api.bodyLesson(e.identity,tab)===undefined)))return api;
 assert.equal(hash(pins),'79d77062dcb4edc4b3f0633b569a7148657a04e8c10653bd0ffe734a359fcfa6');
 assert.equal(hash(transition),'e28a43290bc57dc97d6acc05632200458b14d18e7444f231a6f5762900ad01dd');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 const rows=new Map(transition.entries.map(row=>[row.id+'|'+row.tab,row]));assert.equal(rows.size,9);assert.equal(transition.entries.length,9);
 let old=0,current=0;
 for(const entry of pins.entries)for(const tab of entry.topics){const row=rows.get(entry.identity.id+'|'+tab);assert(row);assert.equal(hash(entry.previous[tab]),row.previousHash);const now=hash(api.bodyLesson(entry.identity,tab));if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded thoracoabdominal orientation teaching');current++;}}
 assert(old===9||current===9,'Mixed thoracoabdominal orientation history');if(old===9)return api;
 const entries=new Map(pins.entries.map(entry=>[entry.identity.id,entry]));
 const bodyLesson=(s,tab)=>{const entry=entries.get(s.id);if(!entry||!entry.topics.includes(tab))return api.bodyLesson(s,tab);assert.equal(JSON.stringify(s),JSON.stringify(entry.identity),'Foreign source identity cannot be replayed');return structuredClone(entry.previous[tab]);};
 return{...api,bodyLesson,bodyContent(s,tab){const{readiness:_r,...content}=bodyLesson(s,tab);return content;}};
}
