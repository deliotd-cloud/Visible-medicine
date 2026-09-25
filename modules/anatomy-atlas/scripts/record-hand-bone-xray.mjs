import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const parentCommit='5f5a839b9c528d50ae67bd58c226bcfd3b69e6cd';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const path='content/hand-bone-xray';
if(process.argv.includes('--before')){
  const api=await exactSourceHistoryApi(parentCommit);
  const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
  const display=api.bodyDisplayCatalog(catalog);
  const originalPins=JSON.parse(await readFile('content/acral-bone-imaging-pins.json'));
  const entries=originalPins.entries.filter(e=>e.identity.region==='hand').map(({identity,group})=>{
    assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
    const previous=api.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');
    return {identity,group,previous};
  });
  assert.equal(entries.length,38);
  const before={parentCommit,catalogHash:hash(display),originalPinsHash:hash(originalPins),previousAllLessonsAndRecipesHash:hash(wholeBodyTeachingSnapshot(api,catalog)),entries};
  await writeFile(path+'.before.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({selections:38,beforeHash:hash(before)}));
}else{
  const {api}=await contentContext(),before=JSON.parse(await readFile(path+'.before.json'));
  assert.equal(before.parentCommit,parentCommit);
  const transition={parentCommit,beforeHash:hash(before),entries:before.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,'xray');assert.equal(lesson.readiness,'draft');
    assert.deepEqual(lesson,api.handBoneXrayLesson(e.identity,'xray'));
    return {id:e.identity.id,lessonHash:hash(lesson)};
  })};
  const text=JSON.stringify(transition,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal((await readFile(path+'.transition.json','utf8')).replace(/\r\n/g,'\n'),text);
  else await writeFile(path+'.transition.json',text,{flag:'wx'});
  console.log(JSON.stringify({topics:38,transitionHash:hash(transition)}));
}
