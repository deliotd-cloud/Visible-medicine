import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const parentCommit='5e3667fe3c9f012cbc21e679ba2e834f527dcc3f';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const path='content/mediastinal-xray';
const {api,catalog}=await contentContext();
if(process.argv.includes('--before')){
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
  // Must run before the new lesson is wired into the viewer.
  const pins=JSON.parse(await readFile('content/central-vessel-imaging-pins.json'));
  const display=api.bodyDisplayCatalog(catalog);
  const entries=pins.entries.filter(e=>['FMA3736','FMA3768','FMA87217','FMA4720','FMA4838'].includes(e.identity.fmaId)).map(({identity,group})=>{
    assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
    const previous=api.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');
    return {identity,group,previous};
  });
  assert.equal(entries.length,5);
  const before={parentCommit,catalogHash:hash(display),originalPinsHash:hash(pins),previousAllLessonsAndRecipesHash:hash(wholeBodyTeachingSnapshot(api,catalog)),entries};
  await writeFile(path+'.before.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({selections:entries.length,beforeHash:hash(before)}));
}else{
  const before=JSON.parse(await readFile(path+'.before.json'));
  assert.equal(before.parentCommit,parentCommit);
  const transition={parentCommit,beforeHash:hash(before),entries:before.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,'xray');assert.equal(lesson.readiness,'draft');
    assert.deepEqual(lesson,api.mediastinalXrayLesson(e.identity,'xray'));
    return {id:e.identity.id,lessonHash:hash(lesson)};
  })};
  const text=JSON.stringify(transition,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal((await readFile(path+'.transition.json','utf8')).replace(/\r\n/g,'\n'),text);
  else await writeFile(path+'.transition.json',text,{flag:'wx'});
  console.log(JSON.stringify({topics:5,transitionHash:hash(transition)}));
}
