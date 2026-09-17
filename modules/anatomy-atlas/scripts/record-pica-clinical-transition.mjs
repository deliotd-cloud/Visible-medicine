import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/pica-clinical-pins.json' with {type:'json'};
const {api,display}=await context();
const result={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>{const lesson=api.bodyLesson(e.identity,t);assert.equal(lesson.readiness,'draft');assert.notDeepEqual(lesson,e.previous[t]);return[t,hash(lesson)];}))}))};
const file='content/pica-clinical.transition.json',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(file,'utf8')).replace(/\r\n/g,'\n'),text);else await writeFile(file,text,{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),transitionHash:hash(result),afterHash:result.currentAllLessonsAndRecipesHash}));
