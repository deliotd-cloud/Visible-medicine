import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {beforeThoracoabdominalOrientation} from './thoracoabdominal-orientation-history.mjs';
import pins from '../content/thoracoabdominal-orientation-pins.json' with {type:'json'};
const {api,catalog:raw}=await contentContext(),catalog=api.bodyDisplayCatalog(raw),hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const replay=beforeThoracoabdominalOrientation(api);assert.equal(beforeThoracoabdominalOrientation(replay),replay);
const restored=catalog.structures.map(s=>({id:s.id,topics:api.contentTabs.map(tab=>({tab,...replay.bodyLesson(s,tab)}))}));assert.equal(hash(restored),pins.previousAllTopicsHash);
let refusals=0;
for(const entry of pins.entries)for(const tab of entry.topics){
 assert.throws(()=>replay.bodyLesson({...entry.identity,name:'Foreign'},tab));refusals++;
 assert.throws(()=>beforeThoracoabdominalOrientation({...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===entry.identity.id&&t===tab?{...lesson,body:'Foreign'}:lesson;}}));refusals++;
 assert.throws(()=>beforeThoracoabdominalOrientation({...api,bodyLesson(s,t){return s.id===entry.identity.id&&t===tab?entry.previous[tab]:api.bodyLesson(s,t);}}));refusals++;
 const lesson=replay.bodyLesson(entry.identity,tab);lesson.body='Foreign';assert.equal(replay.bodyLesson(entry.identity,tab).readiness,'pending');assert.notEqual(replay.bodyLesson(entry.identity,tab).body,'Foreign');
}
assert.equal(refusals,27);console.log(JSON.stringify({historyRefusals:refusals,priorTopicHash:pins.previousAllTopicsHash,originalGoldenChanged:false,idempotent:true,clinicalApproval:false}));
