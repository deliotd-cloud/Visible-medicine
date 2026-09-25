import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/lesser-toe-xray-pins.json' with {type:'json'};

const {api:liveApi,display:liveDisplay}=await context({current:true});
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
// Compare the original two Git trees, not an incomplete rollback of later work.
// Live selections below must still match the exact recorded after lessons.
const api=await exactSourceHistoryApi('717fa28a3c345dca935e2b9476890b91fbcbb488'),display=api.bodyDisplayCatalog(raw);
const savedApi=await exactSourceHistoryApi(pins.sourceCommit),savedDisplay=savedApi.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);assert.equal(hash(snapshot(savedApi,savedDisplay)),pins.previousAllLessonsAndRecipesHash);
const prior=new Map(),entries=pins.entries.map(entry=>({id:entry.identity.id,sections:Object.fromEntries(entry.topics.map(topic=>{
 const lesson=api.bodyLesson(entry.identity,topic);assert.equal(lesson.readiness,'draft');assert.equal(entry.previous[topic].readiness,'pending');
 assert.deepEqual(liveDisplay.structures.find(s=>s.id===entry.identity.id),entry.identity);
 assert.deepEqual(liveApi.bodyLesson(entry.identity,topic),lesson,'Live lesser-toe X-ray teaching drift');
 prior.set(entry.identity.id+'|'+topic,entry.previous[topic]);return [topic,hash(lesson)];
}))}));
const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Only declared lesser-toe payloads may change');
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/lesser-toe-xray-transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{await assert.rejects(access(path),'Do not overwrite recorded teaching');await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),beforeHash:transition.previousAllLessonsAndRecipesHash,afterHash:transition.currentAllLessonsAndRecipesHash,changedPayloads:prior.size}));
