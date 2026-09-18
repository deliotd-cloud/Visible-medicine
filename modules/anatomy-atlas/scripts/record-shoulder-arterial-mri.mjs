import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/shoulder-arterial-mri-pins.json' with {type:'json'};
const {api,display}=await context({current:true});
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const savedApi=await exactSourceHistoryApi(pins.sourceCommit),savedDisplay=savedApi.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);assert.equal(hash(snapshot(savedApi,savedDisplay)),pins.previousAllLessonsAndRecipesHash);
const prior=new Map(),entries=pins.entries.map(e=>{
 const lesson=api.bodyLesson(e.identity,'mri');assert.equal(lesson.readiness,'draft');assert.equal(e.previous.mri.readiness,'pending');
 prior.set(e.identity.id,e.previous.mri);return {id:e.identity.id,sections:{mri:hash(lesson)}};
});
const before={...api,bodyLesson:(s,t)=>t==='mri'&&prior.has(s.id)?prior.get(s.id):api.bodyLesson(s,t)};
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Only six declared MRI lessons may change');
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/shoulder-arterial-mri-transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{await assert.rejects(access(path));await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),changedPayloads:6,afterHash:transition.currentAllLessonsAndRecipesHash}));
