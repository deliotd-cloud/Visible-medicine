import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {withoutNestedCTOrientationNotice} from './atlas-nested-ct-notice-history.ts';
import {desktopLayoutImportMilestone} from './atlas-cubital-ultrasound-history.ts';
const source='acd99b11e279a0525f1488456c0a8adf2abb2cf7';
const before='c3fb787a9811bf0ef9c3bd130f7a0534d49db9ad';
const previousBytes=(path:string)=>Buffer.from(execFileSync('git',['show',before+':'+path],{maxBuffer:32e6}));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const ids=['inferior-collicular-brachia','cerebral-superior-temporal-anterior',
 'cerebral-superior-temporal-posterior','visual-optic-chiasm','visual-optic-tracts'];
const keys=['nestedCTAuditory','nestedCTTemporal','nestedCTVisual','nestedCTReuseLicense'];
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export * from './atlas-review/lib/nested-teaching';
 export {nestedConcepts,nestedTeachingReferences} from './atlas-review/content/nested-teaching';
 export {nestedCTOrientation,nestedCTOrientationReferences} from './atlas-review/content/nested-ct-orientation';
 import {NestedTeaching} from './atlas-review/app/nested-teaching';
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 export const renderCT=(parent,study,selected)=>renderToStaticMarkup(React.createElement(NestedTeaching,{parent,study,selected,initialTopic:'ct'}));`,
 resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',loader:{'.css':'empty'},
 banner:{js:`import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd()+'/package.json')});`},
 plugins:previous?[{name:'exact-imported-pre-ct-baseline',setup(api){
  for(const path of ['content/nested-teaching.ts','content/body-renderer-revision.json'])
   api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:previousBytes('atlas-review/'+path).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('complete named CT drafts and credited sources reach learners and protected review without changing models or rights',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),oldReview=JSON.parse(previousBytes('atlas-review/manifest.json').toString('utf8'));
 assert.equal(review.revision,source);assert.equal(review.files.length,954);
 assert.deepEqual(review.packages,oldReview.packages);
 const milestone=desktopLayoutImportMilestone();
 assert.deepEqual(milestone.files.filter((f:any)=>!oldReview.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/nested-ct-orientation.ts','content/nested-guided-learning-bindings.v1.json','lib/eye-layer-guide.ts','lib/nested-guided-learning.ts','lib/nested-review-queue.ts']);
 assert(oldReview.files.every((p:any)=>review.files.some((f:any)=>f.path===p.path)));
 assert.deepEqual(milestone.files.filter((f:any)=>oldReview.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['LICENSES/THIRD_PARTY_NOTICES.md','app/atlas-workspace.css','app/eye-layers.css','app/eye-layers.tsx','app/review/nested/nested-review.css','app/review/nested/page.tsx','app/review/nested/workspace.tsx','app/whole-body-guided-learning.css','app/whole-body-guided-learning.tsx','content/body-renderer-revision.json','content/nested-teaching.ts','lib/nested-review-material.ts','lib/nested-review.ts']);
 for(const file of review.files)assert.equal(sha(readFileSync('atlas-review/'+file.path)),file.importedSha256,file.path);
 assert.deepEqual(Object.keys(api.nestedCTOrientation),ids);
 assert.deepEqual(Object.keys(api.nestedCTOrientationReferences),keys);
 for(const [folder,protectedViewer]of [['public/atlas-runtime/head-neck/',false],['public/atlas-review-viewer/',true]]as const){
  const manifest=json(folder+'manifest.json');assert.equal(manifest.sourceCommit,source);
  assert.equal(manifest[protectedViewer?'personalRecordsIncluded':'patientDataIncluded'],false);
  if(protectedViewer)assert.equal(manifest.mode,'production');else{
   for(const flag of ['clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
   const prior=JSON.parse(previousBytes(folder+'manifest.json').toString('utf8'));
   assert.deepEqual(manifest.modelBundles,prior.modelBundles);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),prior.files.filter((f:any)=>f.path.startsWith('models/')));
  }
  for(const file of manifest.files)assert.equal(sha(readFileSync(folder+file.path)),file.sha256,file.path);
  const bundle=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(folder+f.path,'utf8')).join('\n');
  for(const note of Object.values(api.nestedCTOrientation)as any[]){
   assert.equal(note.readiness,'draft');assert(bundle.includes(note.body)||bundle.includes(JSON.stringify(note.body).slice(1,-1)));
  }
  for(const ref of Object.values(api.nestedCTOrientationReferences)as any[])for(const text of [ref.url,ref.title])
   assert(bundle.includes(text)||bundle.includes(JSON.stringify(text).slice(1,-1)),'Complete credit missing');
  const notice=readFileSync(folder+(protectedViewer?'THIRD_PARTY_NOTICES.txt':'LICENSES/THIRD_PARTY_NOTICES.md'),'utf8');
  assert(notice.includes('Named nested CT orientation'));assert(notice.includes('Mendoza, Shotbolt, Faiq, Parra and Chan'));
 }
 const inventory=json('lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
 assert.deepEqual(inventory.models,JSON.parse(previousBytes('lib/atlas-model-inventory.json').toString('utf8')).models);
 for(const path of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','content/femoral-component-teaching-bindings.v1.json',
  'content/eye-cross-sectional-teaching.ts','content/visual-pathway-teaching.ts','content/collicular-brachia-teaching.ts'])
  assert.deepEqual(readFileSync('atlas-review/'+path),previousBytes('atlas-review/'+path),path+' preserved');
 const notice=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 assert.equal(withoutNestedCTOrientationNotice(notice),previousBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8').replaceAll('\r',''));
 assert.throws(()=>withoutNestedCTOrientationNotice(notice.replace('10.3390/biology11030454','10.3390/altered')));
});

test('nine named CT teaching revisions change; all source and held teaching remain exact, and stale approvals fail before storage',async()=>{
 const current=await load(),previous=await load(true),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 const restored=current.nestedConcepts.map((c:any)=>{
  if(!ids.includes(c.id))return c;
  const copy=structuredClone(c);delete copy.imaging.ct;return copy;
 });
 assert.deepEqual(restored,previous.nestedConcepts);
 assert.deepEqual(Object.fromEntries(Object.entries(current.nestedTeachingReferences).filter(([key])=>!keys.includes(key))),previous.nestedTeachingReferences);
 let contexts=0,changed=0,unchanged=0,teachingRejected=0,geometryRejected=0,pending=0,unnamed=0,remainders=0;
 const placements=Object.fromEntries(ids.map(id=>[id,0]));
 const renderer=json('atlas-review/content/body-renderer-revision.json');
 for(const group of current.nestedReviewRows)for(const surface of group.surfaces){
  const old=await previous.nestedReviewMaterial(group.key,surface.id),now=await current.nestedReviewMaterial(group.key,surface.id);
  assert(old&&now);contexts++;assert.deepEqual(now.source,old.source);assert.equal(now.context.sourceHash,old.context.sourceHash);
  assert.equal(now.context.rendererHash,renderer.sha256);assert.notEqual(now.context.rendererHash,old.context.rendererHash);
  assert.notEqual(now.context.revisions.geometry,old.context.revisions.geometry);assert.notEqual(now.context.materialHash,old.context.materialHash);
  assert.deepEqual(now.context.blockers,old.context.blockers);assert.equal(now.context.revisions.imaging,null);
  pending+=now.teaching.topics.filter((t:any)=>t.readiness==='pending').length;
  const c=now.context;
  const post=async(track:string,delta:any)=>{
   const response=await current.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CT_REVIEW'},
    body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
     materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,
     draft:current.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(response.status,409);
  };
  await post('geometry',{revisionHash:old.context.revisions.geometry});geometryRejected++;
  const concept=now.teaching.concept;
  if(!ids.includes(concept?.id)){
   unchanged++;assert.deepEqual(now.teaching,old.teaching);assert.equal(now.context.teachingHash,old.context.teachingHash);
   assert.equal(now.context.revisions.teaching,old.context.revisions.teaching);assert.deepEqual(now.context.teachingTabs,old.context.teachingTabs);
   if(group.study==='cranial-artery-components'){assert.equal(concept,null);assert.equal(now.teaching.topics.find((t:any)=>t.tab==='ct').readiness,'pending');unnamed++;}
   if(group.study==='femoral-components'&&/remainder/i.test(surface.name)){assert.equal(now.teaching.topics.find((t:any)=>t.tab==='ct').readiness,'pending');remainders++;}
   continue;
  }
  changed++;placements[concept.id]++;assert.equal(old.teaching.concept.imaging.ct,undefined);
  assert.notEqual(c.teachingHash,old.context.teachingHash);assert.notEqual(c.revisions.teaching,old.context.revisions.teaching);
  const lesson=current.nestedTopicLesson(concept,'ct');assert.equal(lesson.readiness,'draft');assert.match(lesson.note,/No scan access or synchronization/);
  assert.deepEqual(concept.imaging.ct,current.nestedCTOrientation[concept.id]);assert(c.teachingTabs.includes('ct'));
  assert.equal(now.teaching.topics.find((t:any)=>t.tab==='ct').body,lesson.body);
  const {parent,structure:selected}=now.source;
  assert.deepEqual(current.nestedTeachingFor(parent,group.study,selected),concept);
  const rendered=current.renderCT(parent,group.study,selected);
  for(const url of lesson.citations)assert(rendered.includes(url));assert(rendered.includes('teaching draft'));
  for(const mutate of [(s:any)=>s.laterality='unknown',(s:any)=>s.fmaId='FMA0',(s:any)=>s.sources[0].sha256='0'.repeat(64)]){
   const foreign=structuredClone(selected);mutate(foreign);assert.equal(current.nestedTeachingFor(parent,group.study,foreign),null);
  }
  for(const delta of [{materialHash:old.context.materialHash},{revisionHash:old.context.revisions.teaching},{sourceFrame:'foreign-frame'}]){
   await post('teaching',delta);teachingRejected++;
  }
 }
 assert.deepEqual(placements,Object.fromEntries(ids.map((id,index)=>[id,index===3?1:2])));
 assert.deepEqual({contexts,changed,unchanged,teachingRejected,geometryRejected,pending,unnamed,remainders},
  {contexts:108,changed:9,unchanged:99,teachingRejected:27,geometryRejected:108,pending:347,unnamed:29,remainders:2});
});
