import assert from 'node:assert/strict';
import {prePICANestedPlugin,mcaImportMilestone} from './atlas-pica-history.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const revision='6e134825dd189873d60846cacdc98a11983d6d16';
const baseline='a8349b2fefbe8be1403c78822487ba7eb95d7d8c';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const old=(path:string)=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6});
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const ids=['mca-source-fj1662','mca-source-fj1663','mca-source-fj1692'];
async function load(previous=false){
 const compiled=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export * from './atlas-review/lib/nested-teaching';
 export {mcaSourceConcepts,mcaSourceTeachingReferences} from './atlas-review/content/mca-source-teaching';
 import {NestedTeaching} from './atlas-review/app/nested-teaching';
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 export const renderTopic=(parent,study,selected,topic)=>renderToStaticMarkup(React.createElement(NestedTeaching,{parent,study,selected,initialTopic:topic}));`,
 resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',loader:{'.css':'empty'},
 banner:{js:`import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd()+'/package.json')});`},
 plugins:previous?[{name:'exact-pre-mca-import',setup(api){
  for(const path of ['lib/nested-teaching.ts','content/nested-teaching.ts','content/body-renderer-revision.json'])
   api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:old('atlas-review/'+path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]:[prePICANestedPlugin()]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('three source-file MCA drafts and full credits reach local learners/review, without new models or rights',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),prior=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.equal(review.files.length,990);
 assert.deepEqual(review.packages,prior.packages);
 const milestone=mcaImportMilestone();
 assert.deepEqual(milestone.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/mca-source-teaching-bindings.v1.json','content/mca-source-teaching.ts']);
 assert(prior.files.every((p:any)=>review.files.some((f:any)=>f.path===p.path)));
 assert.deepEqual(milestone.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['content/body-renderer-revision.json','content/nested-teaching.ts','lib/nested-teaching.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(api.mcaSourceConcepts.map((c:any)=>c.id),ids);
 const questions=new Set(api.mcaSourceConcepts.map((c:any)=>c.quiz.question));assert.equal(questions.size,3);
 for(const [folder,protectedViewer]of [['public/atlas-runtime/head-neck/',false],['public/atlas-review-viewer/',true]]as const){
  const manifest=json(folder+'manifest.json');assert.equal(manifest.sourceCommit,revision);
  assert.equal(manifest[protectedViewer?'personalRecordsIncluded':'patientDataIncluded'],false);
  if(protectedViewer)assert.equal(manifest.mode,'production');else{
   for(const flag of ['clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),JSON.parse(old(folder+'manifest.json')).files.filter((f:any)=>f.path.startsWith('models/')));
   const inputs=json(folder+'source-inputs.json');
   for(const path of ['content/mca-source-teaching.ts','content/mca-source-teaching-bindings.v1.json'])
    assert.equal(inputs.find((f:any)=>f.path===path).sha256,review.files.find((f:any)=>f.path===path).sourceSha256,path+' exact delivered source');
  }
  for(const f of manifest.files)assert.equal(sha(readFileSync(folder+f.path)),f.sha256,f.path);
  const bundle=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(folder+f.path,'utf8')).join('\n');
  const contains=(value:string)=>assert(bundle.includes(value)||bundle.includes(JSON.stringify(value).slice(1,-1)),value);
  for(const c of api.mcaSourceConcepts){
   // Production preserves template interpolation rather than flattening every
   // body. Exact source-input hashes plus rendered full bodies below bind the
   // complete content; also check its static sentences in both delivered bundles.
   for(const note of [c.sections.anatomy,c.imaging.ct,c.imaging.mri]){
    assert.equal(note.readiness,'draft');
    for(const sentence of note.body.split('. ').filter((s:string)=>! /FJ\d{4}|Source part 0\d/.test(s)))contains(sentence);
   }
   contains(c.quiz.question);contains(c.quiz.answer);
   for(const note of [c.sections.function,c.sections.clinical,c.sections.pathology])assert.equal(note.readiness,'pending');
  }
  for(const ref of Object.values(api.mcaSourceTeachingReferences)as any[])for(const value of [ref.title,ref.url])contains(value);
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const path of ['content/nested-review-bindings.json','content/nested-teaching-bindings.v1.json','app/fitted-camera.tsx','LICENSES/THIRD_PARTY_NOTICES.md'])
  assert.equal(readFileSync('atlas-review/'+path,'utf8'),old('atlas-review/'+path),path+' preserved');
 assert.equal(json('lib/optic-comparison-manifest.json').atlasInspectorRevision,'d9cd141f1fefae6842754e134a1ef18d5661c727');
 assert.equal(json('lib/disc-comparison-manifest.json').atlasInspectorRevision,'952d758104102f5853e00e846cb3448511daa960');
});

test('historical MCA epoch: three teaching contexts advance; 105 remain exact, identity/imaging stay blocked and stale submissions never reach storage',async()=>{
 const previous=await load(true),current=await load(),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 assert.deepEqual(current.nestedReviewRows,previous.nestedReviewRows);
 let changed=0,unchanged=0,pica=0,geometryExpired=0,rejected=0;
 for(const group of current.nestedReviewRows)for(const surface of group.surfaces){
  const a=await previous.nestedReviewMaterial(group.key,surface.id),b=await current.nestedReviewMaterial(group.key,surface.id);
  assert(a&&b);assert.deepEqual(b.source,a.source);assert.equal(b.atlasLink,a.atlasLink);assert.equal(b.context.sourceHash,a.context.sourceHash);
  assert.deepEqual(b.context.checklists,a.context.checklists);assert.deepEqual(b.context.blockers.geometry,a.context.blockers.geometry);
  assert.deepEqual(b.context.blockers.imaging,a.context.blockers.imaging);assert.equal(b.context.revisions.imaging,null);
  assert.notEqual(b.context.rendererHash,a.context.rendererHash);assert.notEqual(b.context.revisions.geometry,a.context.revisions.geometry);geometryExpired++;
  const c=b.context;
  const post=async(track:string,delta:any)=>{
   const response=await current.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_MCA_REVIEW'},
    body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
     materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,
     draft:current.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(response.status,409);rejected++;
  };
  await post('geometry',{revisionHash:a.context.revisions.geometry});
  if(!ids.includes(b.teaching.concept?.id)){
   unchanged++;assert.deepEqual(b.teaching,a.teaching);assert.equal(b.context.teachingHash,a.context.teachingHash);
   assert.equal(b.context.revisions.teaching,a.context.revisions.teaching);assert.deepEqual(b.context.blockers,a.context.blockers);
   if(group.study==='cranial-artery-components'){assert.equal(b.teaching.concept,null);pica++;}
   continue;
  }
  changed++;assert.equal(a.teaching.concept,null);assert.notEqual(b.context.teachingHash,a.context.teachingHash);
  assert.notEqual(c.revisions.teaching,a.context.revisions.teaching);
  assert.deepEqual(c.teachingTabs,['anatomy','ct','mri','self-check']);assert.equal(c.blockers.teaching.length,3);
  assert.deepEqual(a.context.blockers.teaching.slice(1),c.blockers.teaching);
  assert.deepEqual(b.teaching.topics.filter((t:any)=>t.readiness==='pending').map((t:any)=>t.tab),['function','xray','ultrasound','pathology','clinical']);
  for(const topic of ['anatomy','ct','mri']as const){
   const lesson=current.nestedTopicLesson(b.teaching.concept,topic),rendered=current.renderTopic(b.source.parent,group.study,b.source.structure,topic);
   assert.equal(lesson.readiness,'draft');assert.match(rendered,/Teaching draft/i);
   const escaped=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
   assert(rendered.includes(escaped(lesson.body)),topic+' complete rendered body');
   for(const url of lesson.citations)assert(rendered.includes(url));
  }
  for(const mutate of [(s:any)=>s.laterality='unknown',(s:any)=>s.fmaId='FMA0',(s:any)=>s.sources[0].sha256='0'.repeat(64),(s:any)=>s.sources[0].file='FJ0000']){
   const foreign=structuredClone(b.source.structure);mutate(foreign);assert.equal(current.nestedTeachingFor(b.source.parent,group.study,foreign),null);
  }
  for(const delta of [{materialHash:a.context.materialHash},{revisionHash:a.context.revisions.teaching},{sourceFrame:'foreign-frame'}])await post('teaching',delta);
 }
 assert.deepEqual({changed,unchanged,pica,geometryExpired,rejected},{changed:3,unchanged:105,pica:26,geometryExpired:108,rejected:117});
});
