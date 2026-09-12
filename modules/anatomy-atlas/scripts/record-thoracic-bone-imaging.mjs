import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const pins=JSON.parse(await readFile('content/thoracic-bone-imaging-pins.json'));
const {api}=await contentContext();
const record={sourceCommit:pins.sourceCommit,entries:pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>{const lesson=api.thoracicBoneImagingLesson(e.identity,t);assert.equal(lesson?.readiness,'draft');assert.deepEqual(api.bodyLesson(e.identity,t),lesson);return[t,hash(lesson)];}))}))};
const path='content/thoracic-bone-imaging.transition.json';
if(process.argv.includes('--check')) assert.deepEqual(JSON.parse(await readFile(path)),record);
else {await assert.rejects(access(path));await writeFile(path,JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({pinsHash:hash(pins),transitionHash:hash(record),selections:record.entries.length}));
