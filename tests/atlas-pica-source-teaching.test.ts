import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync as currentReadFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import type {Plugin,PluginBuild} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const picaWebsite='6d851df6891316da971430ca8ddf522d31df640b';
const revision='24d023f471d39d7d1e4660fb4f20264528bdd6fe';
const laterWebsite='452f36b1ca5d86bdac8b7ce4c2bfc42da22fb712';
const routedWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const baseline='2df4395d6df36a53da361e1ab3b6c07ddbb67e2a';
const picaBytes=(path:string)=>execFileSync('git',['show',picaWebsite+':'+path],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
function readFileSync(path:string,encoding:'utf8'):string;
function readFileSync(path:string):Buffer;
function readFileSync(path:string,encoding?:'utf8'):Buffer|string{const bytes=picaBytes(path);return encoding?bytes.toString():bytes;}
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const files=[...Array.from({length:12},(_,i)=>`FJ${1700+i}`),'FJ1715'];
const ids=[...files,...files.map(f=>f+'M')].map(f=>'pica-source-'+f.toLowerCase());
function exactPicaPlugin():Plugin{return{name:'exact-saved-pica-atlas',setup(api){
 api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');
  if(!path.startsWith('atlas-review/'))return;
  const loader=path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts';
  return{contents:picaBytes(path).toString(),loader,resolveDir:dirname(args.path)};
 });
}};}
async function load(previous=false){
 const entry=`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export * from './atlas-review/lib/nested-teaching';
 ${previous?'':"export * from './atlas-review/content/pica-source-teaching';"}
 import {NestedTeaching} from './atlas-review/app/nested-teaching';
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 export const renderTopic=(parent,study,selected,topic)=>renderToStaticMarkup(React.createElement(NestedTeaching,{parent,study,selected,initialTopic:topic}));`;
 const built=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',loader:{'.css':'empty'},
  banner:{js:`import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd()+'/package.json')});`},
  plugins:[...(previous?[{name:'exact-pre-pica-import',setup(api:PluginBuild){
   const paths=['lib/nested-teaching.ts','lib/nested-review-material.ts','content/nested-teaching.ts','content/body-renderer-revision.json'].map(p=>'atlas-review/'+p);
   api.onLoad({filter:/\.(?:ts|json)$/},args=>{
    const p=relative(process.cwd(),args.path).replaceAll('\\','/');if(!paths.includes(p))return;
    return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
   });
  }}]:[]),exactPicaPlugin()]});
 return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
test('26 exact source-part PICA drafts reach local learners and protected review, without new models or rights',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),prior=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.equal(review.files.length,964);assert.deepEqual(review.packages,prior.packages);
 // Freeze the original PICA transition; later root questions are audited separately.
 const epoch=JSON.parse(execFileSync('git',['show','6d851df6891316da971430ca8ddf522d31df640b:atlas-review/manifest.json'],{encoding:'utf8',maxBuffer:32e6}));
 assert.deepEqual(epoch.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/pica-source-teaching-bindings.v1.json','content/pica-source-teaching.ts']);
 assert.deepEqual(epoch.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),['content/body-renderer-revision.json','content/nested-teaching.ts','lib/nested-review-material.ts','lib/nested-teaching.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256);
 assert.deepEqual(api.picaSourceConcepts.map((c:any)=>c.id),ids);
 assert.equal(new Set(api.picaSourceConcepts.map((c:any)=>c.quiz.question)).size,26);
 assert.equal(json('atlas-review/content/pica-source-teaching-bindings.v1.json').bindings.length,26);
 for(const [folder,protectedViewer]of [['public/atlas-runtime/head-neck/',false],['public/atlas-review-viewer/',true]]as const){
  const manifest=json(folder+'manifest.json');assert.equal(manifest.sourceCommit,revision);
  assert.equal(manifest[protectedViewer?'personalRecordsIncluded':'patientDataIncluded'],false);
  if(protectedViewer)assert.equal(manifest.mode,'production');else{
   for(const flag of ['clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),JSON.parse(old(folder+'manifest.json')).files.filter((f:any)=>f.path.startsWith('models/')));
   const inputs=json(folder+'source-inputs.json');
   for(const p of ['content/pica-source-teaching.ts','content/pica-source-teaching-bindings.v1.json'])assert.equal(inputs.find((f:any)=>f.path===p).sha256,review.files.find((f:any)=>f.path===p).sourceSha256);
  }
  for(const f of manifest.files)assert.equal(sha(readFileSync(folder+f.path)),f.sha256);
  const bundle=protectedViewer?manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(folder+f.path,'utf8')).join('\n'):emittedTeaching(folder,manifest.files,true,picaBytes);
  const contains=(s:string)=>assert(bundle.includes(s)||bundle.includes(JSON.stringify(s).slice(1,-1)),s);
  const templates=[...readFileSync('atlas-review/content/pica-source-teaching.ts','utf8').matchAll(/body:\s*`([^`]+)`/g)];
  assert.equal(templates.length,3,'All authored Anatomy/CT/MRI templates are delivered');
  for(const template of templates)for(const part of template[1].split(/\$\{[^}]*\}/).filter(s=>s.length>10))contains(part);
  for(const c of api.picaSourceConcepts){
   contains(c.quiz.question.split(': ').slice(1).join(': '));contains(c.quiz.answer);
   // Template interpolation remains in production. Assert every exact static
   // segment, including each file-specific caution, plus complete SSR below.
   for(const note of [c.sections.anatomy,c.imaging.ct,c.imaging.mri]){
    assert.equal(note.readiness,'draft');
   }
   contains(c.sections.anatomy.body.split('not clinical branches. ')[1].split(' Parent-vessel context only:')[0]);
  }
  for(const ref of Object.values(api.picaSourceTeachingReferences)as any[])for(const s of [ref.title,ref.url])contains(s);
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const p of ['content/nested-review-bindings.json','content/nested-teaching-bindings.v1.json','app/fitted-camera.tsx','LICENSES/THIRD_PARTY_NOTICES.md'])assert.equal(readFileSync('atlas-review/'+p,'utf8'),old('atlas-review/'+p));
 assert.equal(json('lib/optic-comparison-manifest.json').atlasInspectorRevision,'d9cd141f1fefae6842754e134a1ef18d5661c727');
 assert.equal(json('lib/disc-comparison-manifest.json').atlasInspectorRevision,'952d758104102f5853e00e846cb3448511daa960');
});
test('26 PICA packets advance, all82 others and108 sources stay exact, blocked/stale approvals cannot reach storage',async()=>{
 const previous=await load(true),current=await load(),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 assert.deepEqual(current.nestedReviewRows,previous.nestedReviewRows);
 let changed=0,unchanged=0,geometryExpired=0,rejected=0;
 for(const group of current.nestedReviewRows)for(const surface of group.surfaces){
  const a=await previous.nestedReviewMaterial(group.key,surface.id),b=await current.nestedReviewMaterial(group.key,surface.id);
  assert(a&&b);assert.deepEqual(b.source,a.source);assert.equal(b.atlasLink,a.atlasLink);assert.equal(b.context.sourceHash,a.context.sourceHash);
  assert.deepEqual(b.context.checklists,a.context.checklists);assert.deepEqual(b.context.blockers.geometry,a.context.blockers.geometry);assert.deepEqual(b.context.blockers.imaging,a.context.blockers.imaging);
  assert.equal(b.context.revisions.imaging,null);assert.notEqual(b.context.rendererHash,a.context.rendererHash);assert.notEqual(b.context.revisions.geometry,a.context.revisions.geometry);geometryExpired++;
  const c=b.context,post=async(track:string,delta:any)=>{
   const r=await current.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_PICA_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:current.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(r.status,409);rejected++;
  };
  await post('geometry',{revisionHash:a.context.revisions.geometry});
  if(!ids.includes(b.teaching.concept?.id)){
   unchanged++;assert.deepEqual(b.teaching,a.teaching);assert.deepEqual(b.teaching.referenceTitles,a.teaching.referenceTitles);
   assert.equal(b.context.teachingHash,a.context.teachingHash);assert.equal(b.context.revisions.teaching,a.context.revisions.teaching);assert.deepEqual(b.context.blockers,a.context.blockers);continue;
  }
  changed++;assert.equal(a.teaching.concept,null);assert.notEqual(c.teachingHash,a.context.teachingHash);assert.notEqual(c.revisions.teaching,a.context.revisions.teaching);
  assert.equal(b.teaching.concept.id,'pica-source-'+b.source.structure.sources[0].file.toLowerCase());
  assert.equal(b.source.structure.laterality,b.source.structure.sources[0].file.endsWith('M')?'left':'right');
  for(const ref of Object.values(current.picaSourceTeachingReferences)as any[])assert.equal(b.teaching.referenceTitles[ref.url],ref.title);
  assert.deepEqual(c.teachingTabs,['anatomy','ct','mri','self-check']);assert.equal(c.blockers.teaching.length,3);
  assert.deepEqual(a.context.blockers.teaching.slice(1),c.blockers.teaching);
  assert.deepEqual(b.teaching.topics.filter((t:any)=>t.readiness==='pending').map((t:any)=>t.tab),['function','xray','ultrasound','pathology','clinical']);
  for(const topic of ['anatomy','ct','mri']as const){
   const lesson=current.nestedTopicLesson(b.teaching.concept,topic),rendered=current.renderTopic(b.source.parent,group.study,b.source.structure,topic);
   const escaped=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
   assert(rendered.includes(escaped(lesson.body)));for(const url of lesson.citations)assert(rendered.includes(url));
   if(topic==='anatomy')assert.match(rendered,/<details[^>]*class="nested-teaching"(?![^>]*\bopen\b)/);
   else assert.match(rendered,/<details[^>]*class="nested-teaching"[^>]*\bopen(?:="")?/);
  }
  for(const mutate of [(s:any)=>s.laterality='unknown',(s:any)=>s.fmaId='FMA0',(s:any)=>s.sources[0].sha256='0'.repeat(64),(s:any)=>s.sources[0].file='FJ0000',(s:any)=>s.sourceOrder+=1]){
   const foreign=structuredClone(b.source.structure);mutate(foreign);assert.equal(current.nestedTeachingFor(b.source.parent,group.study,foreign),null);
  }
  for(const delta of [{materialHash:a.context.materialHash},{revisionHash:a.context.revisions.teaching},{sourceFrame:'foreign-frame'}])await post('teaching',delta);
 }
 assert.deepEqual({changed,unchanged,geometryExpired,rejected},{changed:26,unchanged:82,geometryExpired:108,rejected:186});
});

test('later 1,018-input and routed 88cea admissions retain the exact PICA source in distinct exports',()=>{
 const atlas=currentAtlasDeliveryRoot();
 for(const [site,source,count] of [[laterWebsite,'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3',1018],[routedWebsite,'88cea927d48729769b96ad8fe680b0872b7e6687',1030]] as const){
  const at=(path:string)=>execFileSync('git',['show',`${site}:${path}`],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const manifest=JSON.parse(at('atlas-review/manifest.json').toString());
  assert.equal(manifest.revision,source);assert.equal(manifest.files.length,count);
  for(const path of ['content/pica-source-teaching.ts','content/pica-source-teaching-bindings.v1.json']){
   const file=manifest.files.find((f:any)=>f.path===path);assert(file,`${site}:${path}`);
   const bytes=execFileSync('git',['show',`${source}:${path}`],{cwd:atlas,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
   assert.deepEqual(bytes,picaBytes('atlas-review/'+path),`PICA source retained: ${site}:${path}`);
   assert.equal(file.sourceSha256,sha(bytes),`${site}: source ${path}`);
   assert.equal(file.importedSha256,sha(at('atlas-review/'+path)),`${site}: import ${path}`);
  }
 }
});

test('closed current delivery binds PICA source, reachable teaching, identity and stale Review gates',async()=>{
 const atlas=currentAtlasDeliveryRoot(),liveJson=(path:string)=>JSON.parse(currentReadFileSync(path,'utf8'));
 const review=liveJson('atlas-review/manifest.json');assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 const paths=['content/pica-source-teaching.ts','content/pica-source-teaching-bindings.v1.json'];
 for(const path of paths){
  const source=execFileSync('git',['show',`${CURRENT_ATLAS_REVISION}:${path}`],{cwd:atlas,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const file=review.files.find((f:any)=>f.path===path);assert(file,path);
  assert.deepEqual(source,picaBytes('atlas-review/'+path),`Current PICA source: ${path}`);
  assert.equal(file.sourceSha256,sha(source),`Current source hash: ${path}`);
  assert.equal(file.importedSha256,sha(currentReadFileSync('atlas-review/'+path)),`Current import hash: ${path}`);
 }
 const compiled=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export * from './atlas-review/lib/nested-teaching';
 export * from './atlas-review/content/pica-source-teaching';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',loader:{'.css':'empty'},
 banner:{js:`import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd()+'/package.json')});`}});
 const current=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerBase='public/atlas-runtime/head-neck/',learner=liveJson(learnerBase+'manifest.json');
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);
 const inputs=liveJson(learnerBase+'source-inputs.json');
 for(const path of paths)assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256,`Learner source: ${path}`);
 const learnerCode=emittedTeaching(learnerBase,learner.files,true);
 const viewerBase='public/atlas-review-viewer/',viewer=liveJson(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);assert.equal(viewer.personalRecordsIncluded,false);
 const reviewCode=emittedTeaching(viewerBase,viewer.files,true);
 for(const concept of current.picaSourceConcepts)for(const value of [concept.quiz.question.split(': ').slice(1).join(': '),concept.quiz.answer])
  for(const code of [learnerCode,reviewCode])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`Emitted PICA: ${value}`);
 let packets=0,identityRefusals=0,staleRefusals=0,storageCalls=0;
 for(const group of current.nestedReviewRows)for(const surface of group.surfaces){
  const material=await current.nestedReviewMaterial(group.key,surface.id);
  if(!ids.includes(material?.teaching.concept?.id))continue;
  packets++;assert.equal(material.context.revisions.imaging,null);assert.equal(material.context.blockers.teaching.length,3);
  for(const tab of ['anatomy','ct','mri']){
   const lesson=current.nestedTopicLesson(material.teaching.concept,tab);assert.equal(lesson.readiness,'draft');
   const foreign=structuredClone(material.source.structure);foreign.id+='-foreign';
   assert.equal(current.nestedTeachingFor(material.source.parent,group.study,foreign),null);identityRefusals++;
  }
  const context=material.context;
  const response=await current.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_PICA_CURRENT'},
   body:JSON.stringify({catalogScope:context.catalogScope,nestedKey:context.nestedKey,structureId:context.structureId,
    sourceFrame:'foreign-frame',materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,track:'teaching',expectedVersion:0,draft:current.blankNestedReview(context,'teaching')})}),
   {prepare(){storageCalls++;throw Error('Foreign PICA decision reached storage');}});
  assert.equal(response.status,409);staleRefusals++;
 }
 assert.equal(packets,26);assert.equal(identityRefusals,78);assert.equal(staleRefusals,26);assert.equal(storageCalls,0);
});
