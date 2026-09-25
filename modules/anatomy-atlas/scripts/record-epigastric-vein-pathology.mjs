import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const parentCommit='0cdca340b7a4b67b387389a0fa794e5d36d547e7';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const path='content/epigastric-vein-pathology';
const {api,catalog}=await contentContext();
if(process.argv.includes('--before')){
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
  const display=api.bodyDisplayCatalog(catalog);
  const source=JSON.parse(await readFile('public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json'));
  const targets=source.structures.filter(s=>['FMA21164','FMA21163'].includes(s.fmaId));
  assert.equal(targets.length,2);
  const entries=targets.map(identity=>{
    assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
    const previous=api.bodyLesson(identity,'pathology');assert.equal(previous.readiness,'pending');
    return {identity,tab:'pathology',previous};
  });
  const before={parentCommit,catalogHash:hash(display),sourceHash:hash(source),previousAllLessonsAndRecipesHash:hash(wholeBodyTeachingSnapshot(api,catalog)),entries};
  await writeFile(path+'.before.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({topics:entries.length,beforeHash:hash(before)}));
}else{
  const before=JSON.parse(await readFile(path+'.before.json'));
  assert.equal(before.parentCommit,parentCommit);
  const transition={parentCommit,beforeHash:hash(before),entries:before.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,e.tab);assert.equal(lesson.readiness,'draft');
    assert.deepEqual(lesson,api.epigastricVeinPathologyLesson(e.identity,e.tab));
    return {id:e.identity.id,tab:e.tab,lessonHash:hash(lesson)};
  })};
  const text=JSON.stringify(transition,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal((await readFile(path+'.transition.json','utf8')).replace(/\r\n/g,'\n'),text);
  else await writeFile(path+'.transition.json',text,{flag:'wx'});
  console.log(JSON.stringify({topics:2,transitionHash:hash(transition)}));
}
