// One-time teaching evidence, never a licence, source admission or clinical approval.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const path='content/hip-abductor-xray';
if(process.argv.includes('--before')){
  const parentCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.equal(parentCommit,'885ea54f69991f0e2d265bcde0e6580ecdb13653');
  const entries=['FMA22330','FMA22331','FMA22332','FMA22333'].map(fma=>{
    const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
    const identity=matches[0],previous=api.bodyLesson(identity,'xray');
    assert.equal(previous.readiness,'pending');return {identity,previous};
  });
  const originalPins=JSON.parse(await readFile('content/hip-imaging-pins.json','utf8'));
  for(const e of entries)assert.deepEqual(e.identity,originalPins.entries.find(p=>p.identity.id===e.identity.id)?.identity);
  const before={parentCommit,catalogHash:hash(display),originalPinsHash:hash(originalPins),previousAllLessonsAndRecipesHash:hash(wholeBodyTeachingSnapshot(api,catalog)),entries};
  await writeFile(path+'.before.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({topics:entries.length,beforeHash:hash(before)}));
}else{
  const before=JSON.parse(await readFile(path+'.before.json','utf8'));
  const transition={parentCommit:before.parentCommit,beforeHash:hash(before),entries:before.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,'xray');assert.equal(lesson.readiness,'draft');
    assert.deepEqual(lesson,api.hipAbductorXrayLesson(e.identity,'xray'));
    return {id:e.identity.id,lessonHash:hash(lesson)};
  })};
  const text=JSON.stringify(transition,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal((await readFile(path+'.transition.json','utf8')).replace(/\r\n/g,'\n'),text);
  else await writeFile(path+'.transition.json',text,{flag:'wx'});
  console.log(JSON.stringify({topics:transition.entries.length,transitionHash:hash(transition)}));
}
