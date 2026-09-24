import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/forearm-arterial-imaging-pins.json' with {type:'json'};
const {api,display}=await context({current:true}),prior=new Map();
const checking=process.argv.includes('--check');
const entries=pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>{const lesson=api.bodyLesson(e.identity,t);assert.equal(lesson.readiness,'draft');assert.equal(e.previous[t].readiness,'pending');prior.set(e.identity.id+'|'+t,e.previous[t]);return[t,hash(lesson)];}))}));
const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
if(!checking)assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Unrelated teaching/recipes changed');
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/forearm-arterial-imaging.transition.json';
let recorded=transition;
if(checking){
 const saved=JSON.parse(await readFile(path));recorded=saved;
 assert.equal(saved.parentCommit,pins.sourceCommit);
 assert.equal(saved.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.deepEqual(saved.entries,entries);
}
else{await assert.rejects(access(path),'Do not overwrite recorded teaching');await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(recorded),afterHash:recorded.currentAllLessonsAndRecipesHash,placements:prior.size}));
