import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import pins from '../content/orbital-ultrasound.before.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api}=await contentContext();
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),modeHash:hash(api.orbitalUltrasoundMode),entries:pins.entries.map(e=>{
 const lesson=api.bodyLesson(e.identity,'ultrasound');
 assert.equal(lesson.readiness,'draft');assert.notDeepEqual(lesson,e.previous);
 assert.deepEqual(lesson,api.orbitalNeckMuscleImagingLesson(e.identity,'ultrasound'));
 return {id:e.identity.id,lessonHash:hash(lesson),focusHash:hash(api.orbitalNeckMuscleImagingGroups[e.group].focus.ultrasound)};
})};
const text=JSON.stringify(transition,null,2)+'\n',path='content/orbital-ultrasound.transition.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({topics:transition.entries.length,transitionHash:hash(transition)}));
