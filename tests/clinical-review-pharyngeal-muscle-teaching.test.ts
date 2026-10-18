import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';

const sha=(value:unknown):string=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rawSha=(bytes:Buffer):string=>createHash('sha256').update(bytes).digest('hex');
const parentCommit='ff8f76a80ad0b73a93421dac5431759ab96ea187';
const fmaIds=['FMA46631','FMA46632','FMA46635','FMA46636','FMA46667','FMA46668','FMA46669','FMA46670','FMA46671','FMA46672'];
const tabs=['anatomy','function','quiz'] as const;
const pins=JSON.parse(readFileSync('atlas-review/content/pharyngeal-muscle-teaching-pins.json','utf8'));
const entries:any[]=pins.entries;
assert.equal(entries.length,10);
assert.deepEqual(entries.map(entry=>entry.identity.fmaId).sort(),fmaIds);
assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,10);
const families=new Map<string,any[]>();
for(const entry of entries){
 const identity=entry.identity;
 assert.equal(identity.region,'head-neck');assert.equal(identity.system,'muscles');assert.equal(identity.category,'muscle');
 assert(['left','right'].includes(identity.laterality));
 assert(typeof entry.family==='string'&&entry.family.length>0);
 families.set(entry.family,[...(families.get(entry.family)??[]),identity]);
}
assert.equal(families.size,5);
for(const pair of families.values())assert.deepEqual(pair.map(identity=>identity.laterality).sort(),['left','right']);

const bundled=build({stdin:{contents:[
 "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
 "export {pharyngealMuscleTeachingLesson} from './atlas-review/lib/pharyngeal-muscle-teaching';",
 "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
 "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
 "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})
 .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('ten exact pharyngeal muscles bind 30 current draft lessons and Review topics',async()=>{
 const api=await bundled;
 const renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 const questions=new Map<string,string>();let changed=0,forged=0;
 for(const {identity,family}of entries){
  const snapshot=api.bodyReviewSnapshot(identity.id);
  const material=await api.bodyReviewMaterial(identity.id);
  const context=await api.bodyReviewContext(identity.id);
  assert(snapshot&&material&&context,identity.id);
  assert.equal(material.approval,false);
  assert.deepEqual(snapshot.source.structure,identity);
  assert.deepEqual(material.source.structure,identity);
  assert.deepEqual(await api.parseBodyReviewResponse(material,identity.id),material);
  assert.deepEqual(await api.parseBodyReviewResponse(JSON.parse(JSON.stringify(material)),identity.id),material);
  assert.equal(context.catalogScope,'body-display-catalog');
  assert.equal(context.structureId,identity.id);
  assert.equal(context.structureName,identity.name);
  assert.equal(context.materialHash,material.materialHash);
  assert.equal(context.sourceHash,material.fingerprints.source);
  assert.equal(context.teachingHash,material.fingerprints.teaching);
  assert.equal(context.rendererHash,renderer.sha256);
  assert.equal(context.revisions.imaging,null);
  assert.equal(context.revisions.teaching,sha({catalogScope:context.catalogScope,structureId:identity.id,
   checklistVersion:context.checklistVersion,source:context.sourceHash,teaching:context.teachingHash,checks:context.checklists.teaching}));
  for(const tab of tabs){
   const lesson=api.pharyngealMuscleTeachingLesson(identity,tab);
   assert(lesson,identity.id+'|'+tab);
   assert.equal(lesson.readiness,'draft');
   assert.deepEqual(api.bodyLesson(identity,tab),lesson);
   const {readiness,...shown}=lesson;
   assert.deepEqual(api.bodyContent(identity,tab),shown);
   assert.deepEqual(snapshot.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert.deepEqual(material.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert(context.teachingTabs.includes(tab));
   assert.match(lesson.title,new RegExp(identity.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   assert.match(lesson.note,/review pending/i);
   assert(lesson.citations.length>0);
   assert.equal(new Set(lesson.citations).size,lesson.citations.length);
   assert(lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
   if(tab!=='quiz')assert(lesson.bullets.some((bullet:string)=>bullet.includes(`Source identity: ${identity.fmaId} · ${identity.laterality} · ${identity.sources.map((source:any)=>source.file).join(', ')}`)));
   if(tab==='quiz'){
    assert.equal(lesson.bullets.length,4);
    assert.equal(new Set(lesson.bullets.map((choice:string)=>choice.trim())).size,4);
    assert(lesson.bullets.every((choice:string)=>choice.trim()));
    assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1);
    assert(lesson.explanation?.trim());
    if(questions.has(family))assert.equal(questions.get(family),lesson.body);
    else questions.set(family,lesson.body);
   }
   for(const mutate of [
    (topic:any)=>{topic.body+=' foreign';},
    (topic:any)=>{topic.bullets[0]+=' foreign';},
    (topic:any)=>{topic.citations[0]='https://foreign.example/';},
    (topic:any)=>{topic.note+=' foreign';},
   ]){
    const stale=structuredClone(material);
    mutate(stale.topics.find((topic:any)=>topic.tab===tab));
    assert.equal(await api.parseBodyReviewResponse(stale,identity.id),null,'Foreign teaching cannot reuse current Review material');forged++;
   }
   changed++;
  }
  for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},
   {sources:[...identity.sources,...identity.sources]},{foreign:true}])
   for(const tab of tabs)assert.equal(api.pharyngealMuscleTeachingLesson({...identity,...patch},tab),undefined);
  for(const tab of ['xray','ct','mri','ultrasound'])assert.equal(api.pharyngealMuscleTeachingLesson(identity,tab),undefined);
  const staleIdentity=structuredClone(material);staleIdentity.source.structure={...identity,name:'Foreign'};
  assert.equal(await api.parseBodyReviewResponse(staleIdentity,identity.id),null);
 }
 assert.equal(changed,30);assert.equal(forged,120);
 assert.equal(questions.size,5);assert.equal(new Set(questions.values()).size,5);
 for(const pair of families.values())for(const tab of tabs){
  const [a,b]=pair.map(identity=>api.bodyLesson(identity,tab));
  assert.equal(a.body,b.body);assert.deepEqual(a.citations,b.citations);
  if(tab==='quiz'){assert.deepEqual(a.bullets,b.bullets);assert.equal(a.correctAnswer,b.correctAnswer);assert.equal(a.explanation,b.explanation);}
 }
});

test('head-neck and shoulder learner bundles bind the imported pharyngeal source closure',async()=>{
 const api=await bundled;
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.match(review.revision,/^[a-f0-9]{40}$/);
 assert.notEqual(review.revision,parentCommit,'Teaching must advance beyond the immutable parent');
 const paths=['content/pharyngeal-muscle-teaching-pins.json','content/pharyngeal-muscle-teaching.ts',
  'lib/pharyngeal-muscle-teaching.ts','app/body-content.ts'];
 for(const name of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${name}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(learner.sourceCommit,review.revision);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  for(const path of paths){
   const record=review.files.find((file:any)=>file.path===path);assert(record,path);
   const imported=readFileSync('atlas-review/'+path);
   assert.equal(rawSha(imported),record.importedSha256,path);
   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,record.sourceSha256,name+' '+path);
   if(path==='content/pharyngeal-muscle-teaching-pins.json')assert.equal(record.importedSha256,record.sourceSha256,'New source pins remain byte-exact LF');
  }
  const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{
   const bytes=readFileSync(base+file.path);assert.equal(rawSha(bytes),file.sha256);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const {identity}of entries)for(const tab of tabs){
   const lesson=api.bodyLesson(identity,tab);
   for(const marker of [lesson.body,...(tab==='quiz'?[lesson.explanation]:[])])
    assert(js.includes(marker),name+' '+identity.id+'|'+tab);
  }
 }
});
