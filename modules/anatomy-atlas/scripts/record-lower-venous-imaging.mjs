import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/lower-venous-imaging-pins.json' with {type:'json'};
const {api,display}=await context({current:true}),prior=new Map();
const entries=pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>{const lesson=api.bodyLesson(e.identity,t);assert.equal(lesson.readiness,'draft');assert.equal(e.previous[t].readiness,'pending');prior.set(e.identity.id+'|'+t,e.previous[t]);return[t,hash(lesson)];}))}));
const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Unrelated teaching/recipes changed');
const transition={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/lower-venous-imaging.transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{await assert.rejects(access(path),'Do not overwrite recorded teaching');await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),afterHash:transition.currentAllLessonsAndRecipesHash,placements:prior.size}));
