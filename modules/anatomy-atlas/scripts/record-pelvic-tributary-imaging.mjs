// Immutable, one-time evidence capture. Never updates an existing baseline.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog}=await contentContext();
const display=api.bodyDisplayCatalog(catalog),path='content/pelvic-tributary-imaging';
if(process.argv.includes('--before')){
  const parentCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.equal(parentCommit,'7aa5f4452a487f2abd0d0545edad0bcb233ad1bf');
  const entries=[];
  for(const [group,topics] of Object.entries({iliolumbar:['mri','ultrasound'],obturator:['mri','ultrasound'],lateralSacral:['ct','mri','ultrasound']}))
    for(const fma of api.pelvicVeinTeachingGroups[group]){
      const identity=display.structures.find(s=>s.fmaId===fma);assert(identity);
      for(const topic of topics){
        assert.equal(api.pelvicVeinTeaching[group][topic],undefined);
        const previous=api.bodyLesson(identity,topic);assert.equal(previous.readiness,'pending');
        entries.push({group,identity,topic,previous});
      }
    }
  assert.equal(entries.length,11);
  const pins={parentCommit,catalogHash:hash(display),previousAllLessonsAndRecipesHash:hash(wholeBodyTeachingSnapshot(api,catalog)),entries};
  await writeFile(path+'.before.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({topics:entries.length,pinsHash:hash(pins)}));
}else{
  const pins=JSON.parse(await readFile(path+'.before.json','utf8'));
  const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),entries:pins.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,e.topic);assert.equal(lesson.readiness,'draft');
    assert.notDeepEqual(lesson,e.previous);assert.deepEqual(lesson,api.pelvicVeinLesson(e.identity,e.topic));
    return {id:e.identity.id,topic:e.topic,lessonHash:hash(lesson),teachingHash:hash(api.pelvicVeinTeaching[e.group][e.topic])};
  })};
  const text=JSON.stringify(transition,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal((await readFile(path+'.transition.json','utf8')).replace(/\r\n/g,'\n'),text);
  else await writeFile(path+'.transition.json',text,{flag:'wx'});
  console.log(JSON.stringify({topics:transition.entries.length,transitionHash:hash(transition)}));
}
