import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import pins from '../content/spinal-disc-function.before.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api}=await contentContext();
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),entries:pins.entries.map(e=>{
  const lesson=api.bodyLesson(e.identity,'function');
  assert.equal(lesson.readiness,'draft');assert.notDeepEqual(lesson,e.previous.function);
  assert.deepEqual(lesson,api.spinalDiscFunctionLesson(e.identity,'function'));
  return {id:e.identity.id,functionHash:hash(lesson)};
})};
const path='content/spinal-disc-function.transition.json',text=JSON.stringify(transition,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({topics:22,transitionHash:hash(transition)}));
