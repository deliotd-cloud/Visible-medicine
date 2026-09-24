import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import pins from '../content/proper-digital-teaching.before.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api}=await contentContext();
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),entries:pins.entries.map(e=>({id:e.identity.id,topics:Object.fromEntries(['anatomy','function'].map(t=>{
 const lesson=api.bodyLesson(e.identity,t);assert.equal(lesson.readiness,'draft');assert.notDeepEqual(lesson,e.previous[t]);
 assert.deepEqual(lesson,api.properDigitalTeachingLesson(e.identity,t));
 return [t,hash(lesson)];
}))}))};
const file='content/proper-digital-teaching.transition.json',text=JSON.stringify(transition,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(file,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(file,text,{flag:'wx'});
console.log(JSON.stringify({topics:20,transitionHash:hash(transition)}));
