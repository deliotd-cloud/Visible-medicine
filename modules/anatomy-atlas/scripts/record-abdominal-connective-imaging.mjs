import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {beforeGenicularImaging} from './genicular-imaging-history.mjs';
import {beforeTransverseMesocolonMri} from './transverse-mesocolon-mri-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {execFileSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/abdominal-connective-imaging-pins.json' with {type:'json'};
import savedTransition from '../content/abdominal-connective-imaging.transition.json' with {type:'json'};
const current=await context({current:true});
const originalParent=await exactSourceHistoryApi(pins.sourceCommit);
const api=await exactSourceHistoryApi('b5f13fd7b4aefb432eea63774917c46feacac9f6');
const sourceCatalog=JSON.parse(execFileSync('git',['show',pins.sourceCommit+':public/models/bodyparts3d/full-body/catalog.json'],{encoding:'utf8',maxBuffer:16000000}));
const display=originalParent.bodyDisplayCatalog(sourceCatalog),prior=new Map();
assert.deepEqual(api.bodyDisplayCatalog(sourceCatalog),display,'Original before/after geometry is exact');
assert.equal(hash(snapshot(originalParent,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(api,display)),savedTransition.currentAllLessonsAndRecipesHash);
// The new MRI edit is removed only through its own exact recorded transition.
// Keep a separate complete current-era comparison; no newer baseline is accepted.
const currentBase=beforeTransverseMesocolonMri(current.api);
const currentParent=await exactSourceHistoryApi('1af9a485525fa130842bd5c77afa9429d2930f9a');
assert.deepEqual(currentParent.bodyDisplayCatalog(current.catalog),current.display);
assert.deepEqual(snapshot(currentBase,current.display),snapshot(currentParent,current.display));
const scopedCurrent=beforeGenicularImaging(currentBase),scopedParent=beforeGenicularImaging(currentParent);
assert.deepEqual(snapshot(scopedCurrent,current.display),snapshot(scopedParent,current.display));
const entries=pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>{const lesson=api.bodyLesson(e.identity,t);assert.equal(lesson.readiness,'draft');assert.equal(e.previous[t].readiness,'pending');prior.set(e.identity.id+'|'+t,e.previous[t]);return[t,hash(lesson)];}))}));
const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Unrelated teaching/recipes changed');
let currentChanged=0,currentUnchanged=0;
const scopedBefore={...scopedCurrent,bodyLesson(s,t){
 const e=pins.entries.find(e=>e.identity.id===s.id&&e.topics.includes(t));
 return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.previous[t]):scopedCurrent.bodyLesson(s,t);
}};
for(const s of current.display.structures)for(const t of current.api.contentTabs){
 const e=pins.entries.find(e=>e.identity.id===s.id&&e.topics.includes(t));
 if(e){assert.deepEqual(s,e.identity);assert.deepEqual(scopedCurrent.bodyLesson(s,t),api.bodyLesson(s,t));assert.deepEqual(scopedBefore.bodyLesson(s,t),e.previous[t]);currentChanged++;}
 else{assert.deepEqual(scopedCurrent.bodyLesson(s,t),scopedBefore.bodyLesson(s,t));currentUnchanged++;}
}
assert.equal(currentChanged,4);assert.equal(currentUnchanged,9932);
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/abdominal-connective-imaging.transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{await assert.rejects(access(path),'Do not overwrite recorded teaching');await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),afterHash:transition.currentAllLessonsAndRecipesHash,placements:prior.size,historicalUnchangedTopics:9923,currentUnchangedTopics:currentUnchanged}));
