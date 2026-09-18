import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/metatarsal-surface-imaging-pins.json' with {type:'json'};

const {api,display}=await context({current:true});
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const savedApi=await exactSourceHistoryApi(pins.sourceCommit),savedDisplay=savedApi.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);assert.equal(hash(snapshot(savedApi,savedDisplay)),pins.previousAllLessonsAndRecipesHash);
const prior=new Map(),entries=pins.entries.map(entry=>({id:entry.identity.id,sections:Object.fromEntries(entry.topics.map(topic=>{
 const lesson=api.bodyLesson(entry.identity,topic);assert.equal(lesson.readiness,'draft');assert.equal(entry.previous[topic].readiness,'pending');
 prior.set(entry.identity.id+'|'+topic,entry.previous[topic]);return [topic,hash(lesson)];
}))}));
const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Only declared metatarsal payloads may change');
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/metatarsal-surface-imaging-transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{await assert.rejects(access(path),'Do not overwrite recorded teaching');await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),beforeHash:transition.previousAllLessonsAndRecipesHash,afterHash:transition.currentAllLessonsAndRecipesHash,changedPayloads:prior.size}));
