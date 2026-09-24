import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import pins from '../content/pulmonary-vein-ultrasound.before.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api}=await contentContext();
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),entries:pins.entries.map(e=>{
  const lesson=api.bodyLesson(e.identity,'ultrasound');
  assert.equal(lesson.readiness,'draft');assert.notDeepEqual(lesson,e.previous);
  assert.deepEqual(lesson,api.centralVesselImagingLesson(e.identity,'ultrasound'));
  return {id:e.identity.id,lessonHash:hash(lesson),focusHash:hash(api.centralVesselImagingGroups[e.group].focus.ultrasound)};
})};
const text=JSON.stringify(transition,null,2)+'\n',path='content/pulmonary-vein-ultrasound.transition.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({topics:4,transitionHash:hash(transition)}));
