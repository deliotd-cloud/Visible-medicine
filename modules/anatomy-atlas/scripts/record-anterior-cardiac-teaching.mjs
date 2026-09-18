import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforePalmarArterialImaging} from './palmar-arterial-imaging-history.mjs';
import pins from '../content/anterior-cardiac-teaching-pins.json' with {type:'json'};

// This historical transition remains pinned; the later palmar suite checks its own live payloads.
const current=await context({current:true}),api=beforePalmarArterialImaging(current.api),display=current.display;
const savedApi=await exactSourceHistoryApi(pins.sourceCommit);
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const savedDisplay=savedApi.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);
assert.equal(hash(snapshot(savedApi,savedDisplay)),pins.previousAllLessonsAndRecipesHash);
const prior=new Map(),sections={};
for(const topic of pins.entry.topics){
 const lesson=api.bodyLesson(pins.entry.identity,topic);
 assert.notDeepEqual(lesson,pins.entry.previous[topic]);
 sections[topic]=hash(lesson);
 prior.set(pins.entry.identity.id+'|'+topic,pins.entry.previous[topic]);
}
const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Only the six declared payloads may change');
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entry:{id:pins.entry.identity.id,sections}};
const path='content/anterior-cardiac-teaching-transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{await assert.rejects(access(path),'Do not overwrite recorded teaching');await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),beforeHash:transition.previousAllLessonsAndRecipesHash,afterHash:transition.currentAllLessonsAndRecipesHash,changedPayloads:prior.size}));
