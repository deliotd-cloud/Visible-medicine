import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=(value:unknown):string=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rawSha=(bytes:Buffer):string=>createHash('sha256').update(bytes).digest('hex');
const tabs=['anatomy','function','quiz'] as const;
const branch=JSON.parse(readFileSync('atlas-review/content/abdominal-branch-imaging-pins.json','utf8'));
const central=JSON.parse(readFileSync('atlas-review/content/central-vessel-imaging-pins.json','utf8'));
const branchPins:any[]=branch.entries.filter((entry:any)=>entry.identity.bundle==='abdomen-vessels-mesenteric');
const veinPins:any[]=central.entries.filter((entry:any)=>entry.identity.fmaId==='FMA14332');
assert.equal(branchPins.length,13);
assert.equal(veinPins.length,1);
assert.equal(veinPins[0].identity.bundle,'abdomen-vessels-mesenteric');
assert.deepEqual(veinPins[0].identity.sources.map((source:any)=>source.file),['FJ3647']);
const identities:any[]=[...branchPins,...veinPins].map(entry=>entry.identity);
assert.equal(identities.length,14);
assert.equal(new Set(identities.map(identity=>identity.id)).size,14);
assert.equal(new Set(identities.map(identity=>identity.fmaId)).size,14);

const bundled=build({stdin:{contents:[
 "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
 "export {mesentericVesselTeachingLesson} from './atlas-review/lib/mesenteric-vessel-teaching';",
 "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
 "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
 "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})
 .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('all 14 imported mesenteric identities bind 42 source-specific draft topics and Review packets',async()=>{
 const api=await bundled;
 const renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 const questions=new Set<string>(),answerPositions=new Set<number>();
 let changed=0,forged=0;
 for(const identity of identities){
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
   const lesson=api.mesentericVesselTeachingLesson(identity,tab);
   assert(lesson,identity.id+'|'+tab);
   assert.equal(lesson.readiness,'draft');
   assert.deepEqual(api.bodyLesson(identity,tab),lesson);
   const {readiness,...shown}=lesson;
   assert.deepEqual(api.bodyContent(identity,tab),shown);
   assert.deepEqual(snapshot.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert.deepEqual(material.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert(context.teachingTabs.includes(tab));
   assert.match(lesson.note,/review pending/i);
   assert.equal(lesson.citations.length,1);
   assert.match(lesson.citations[0],/^https:\/\//);
   if(tab==='quiz'){
    questions.add(lesson.body);
    assert.equal(lesson.bullets.length,4);
    assert.equal(new Set(lesson.bullets.map((choice:string)=>choice.trim())).size,4);
    assert(lesson.bullets.every((choice:string)=>choice.trim()));
    assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1);
    answerPositions.add(lesson.bullets.indexOf(lesson.correctAnswer));
    assert(lesson.explanation?.trim());
   }
   for(const mutate of [
    (topic:any)=>{topic.body+=' foreign';},
    (topic:any)=>{topic.bullets[0]+=' foreign';},
    (topic:any)=>{topic.citations[0]='https://foreign.example/';},
    (topic:any)=>{topic.note+=' foreign';},
   ]){
    const stale=structuredClone(material);
    mutate(stale.topics.find((topic:any)=>topic.tab===tab));
    assert.equal(await api.parseBodyReviewResponse(stale,identity.id),null,'Foreign teaching cannot reuse a current Review packet');forged++;
   }
   changed++;
  }
  for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},
   {sources:[...identity.sources,...identity.sources]},{foreign:true}])
   for(const tab of tabs)assert.equal(api.mesentericVesselTeachingLesson({...identity,...patch},tab),undefined);
  for(const tab of ['xray','ct','mri','ultrasound'])assert.equal(api.mesentericVesselTeachingLesson(identity,tab),undefined);
  const staleIdentity=structuredClone(material);
  staleIdentity.source.structure={...identity,name:'Foreign'};
  assert.equal(await api.parseBodyReviewResponse(staleIdentity,identity.id),null);
 }
 assert.equal(changed,42);
 assert.equal(forged,168);
 assert.equal(questions.size,14,'Each identity has a distinct self-check question');
 assert.deepEqual([...answerPositions].sort(),[0,1,2,3],'Correct options vary across positions');
});

test('head-neck and shoulder learners contain the exact imported mesenteric teaching source',async()=>{
 const api=await bundled;
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,current.source);
 assert.match(review.revision,/^[a-f0-9]{40}$/);
 const paths=['content/abdominal-branch-imaging-pins.json','content/central-vessel-imaging-pins.json',
  'content/mesenteric-vessel-teaching.ts','lib/mesenteric-vessel-teaching.ts','app/body-content.ts'];
 for(const name of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${name}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(learner.sourceCommit,review.revision);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  for(const path of paths){
   const record=review.files.find((file:any)=>file.path===path);
   assert(record,path);
   const imported=readFileSync('atlas-review/'+path);
   assert.equal(rawSha(imported),record.importedSha256,path);
   // The historical Windows checkout used CRLF for this exact JSON input.
   // Preserve that byte proof, then bind the current LF source to current delivery.
   let learnerSourceSha=record.sourceSha256;
   if(path==='content/abdominal-branch-imaging-pins.json'){
    assert.equal(rawSha(imported),record.sourceSha256,'Pin JSON has no import adaptation');
    const text=new TextDecoder('utf-8',{fatal:true}).decode(imported);
    assert(!text.includes('\r'),'Immutable pin JSON uses LF');
    assert.equal(rawSha(Buffer.from(text.replaceAll('\n','\r\n'))),
     '735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1',
     'exact former CRLF checkout representation');
    assert.equal(record.sourceSha256,'5daaecd50fae68d64ef88d39237b6700b9f2bac3fa84f1a4792cbc05b3228d61');
    learnerSourceSha=rawSha(imported);
   }
   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,learnerSourceSha,name+' '+path);
  }
  const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(rawSha(bytes),file.sha256);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const identity of identities)for(const tab of tabs){
   const lesson=api.bodyLesson(identity,tab);
   for(const marker of [lesson.body,...(tab==='quiz'?[lesson.explanation]:[])])
    assert(js.includes(marker),name+' '+identity.id+'|'+tab);
  }
 }
});
