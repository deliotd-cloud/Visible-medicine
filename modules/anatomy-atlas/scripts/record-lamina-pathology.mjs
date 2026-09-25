import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const parentCommit='e7e6b197e0cd25c1a9160b69f93fbe673192c755';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const path='content/lamina-pathology';
const {api,catalog}=await contentContext();
if(process.argv.includes('--before')){
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
  const pins=JSON.parse(await readFile('content/cranial-boundary-clinical-pins.json'));
  const display=api.bodyDisplayCatalog(catalog);
  const matches=pins.entries.filter(e=>e.identity.fmaId==='FMA61975');
  assert.equal(matches.length,1);
  const identity=matches[0].identity;
  assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
  const entries=['clinical','pathology'].map(tab=>({identity,tab,previous:api.bodyLesson(identity,tab)}));
  assert.equal(entries[0].previous.readiness,'draft');
  assert.equal(entries[1].previous.readiness,'pending');
  const before={parentCommit,catalogHash:hash(display),originalPinsHash:hash(pins),previousAllLessonsAndRecipesHash:hash(wholeBodyTeachingSnapshot(api,catalog)),entries};
  await writeFile(path+'.before.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({topics:entries.length,beforeHash:hash(before)}));
}else{
  const before=JSON.parse(await readFile(path+'.before.json'));
  assert.equal(before.parentCommit,parentCommit);
  const transition={parentCommit,beforeHash:hash(before),entries:before.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,e.tab);assert.equal(lesson.readiness,'draft');
    assert.deepEqual(lesson,api.laminaPathologyLesson(e.identity,e.tab));
    return {id:e.identity.id,tab:e.tab,lessonHash:hash(lesson)};
  })};
  const text=JSON.stringify(transition,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal((await readFile(path+'.transition.json','utf8')).replace(/\r\n/g,'\n'),text);
  else await writeFile(path+'.transition.json',text,{flag:'wx'});
  console.log(JSON.stringify({topics:2,transitionHash:hash(transition)}));
}
