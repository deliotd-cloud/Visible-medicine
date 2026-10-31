import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const posteriorParent='3e66d2a7cb1807f792929cbe292a4cfc81e4e79e';
const posteriorEpoch='7b3e678ae4b8059aadb84459048ebd05f7abe7b9';
const posteriorTree='de883b9d6bccb3b4403256e42fabc7471e0ea8c9';
const sharedPath='content/nested-teaching.ts';
const historicalSharedSha='f2a7ecde336041cefeafe33611969f3e49f8f92db58891ee3a121d1e9526f568';
const currentSharedSha='0769d902cf0973cc84229061440fde4e26ccb29442ed16c28f801fcd35193bad';
const posteriorConcepts=['brainstem-midbrain','brainstem-pons','brainstem-medulla','brainstem-cerebellum'];
const posteriorReferences=['posteriorFossaNeonatalUS2024','posteriorFossaBrainstemMorphometry','posteriorFossaUltrasoundMRI'];
const previous='d4016ff9988064552e464980aaea1913b25d5114';
const frozen='F:/VisibleMedicine/recovery/checkpoints/20261014-coronary-sinus-website-before/source';
const previousIntegration='9802c7d95eff99f8732f27f19964362f74d580113952b3a6cf6e3f60c9df2597';
const sourcePaths=['content/coronary-venous-teaching.ts','content/nested-teaching.ts','lib/nested-teaching.ts'];
const referenceKey='coronarySinusVenography',referenceUrl='https://pubmed.ncbi.nlm.nih.gov/17765613/';
const parentId='vm:anatomy:body:thorax:unpaired:organ:heart';
const sourceFrame='bodyparts3d:4.0:0a3a8b065445d573419e3948b2d4bbcc28d1c7b506514dc5f99a20a4e7007a56';
const expectedSourceHashes={FMA4706:'67291c05cafa50c94e6a162c6091c8b01bca0c54e1b399b139a2096d6fda74fb',
 FMA4714:'1e55364de5f07ae05d818422d07d4b83345bb111e7161fffb21f994df82c3e5e'};
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const canonical=(value:any):string=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:
 value&&typeof value==='object'?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`:JSON.stringify(value);
const digest=(value:unknown)=>sha(canonical(wire(value)));
const git=(commit:string,path:string)=>execFileSync('git',['--no-replace-objects','show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6});
const entry=[
 "export * from './atlas-review/content/nested-teaching';",
 "export * from './atlas-review/lib/nested-teaching';",
 "export * from './atlas-review/lib/nested-anatomy';",
 "export * from './atlas-review/lib/nested-review-material';",
 "export * from './atlas-review/lib/nested-review-client';",
 "export * from './atlas-review/lib/nested-review-api';",
 "export * from './atlas-review/lib/nested-review';",
 "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 "export {contentTabs} from './atlas-review/lib/content-types';",
].join('\n');
async function imported(){
 const compiled=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
async function importedFrozen(){
 const compiled=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  nodePaths:[resolve(process.cwd(),'node_modules')],plugins:[{name:'frozen-review-only',setup(api){
   api.onResolve({filter:/^\.\/atlas-review\//},args=>{
    const stem=resolve(frozen,args.path.slice(2));
    for(const suffix of ['.ts','.tsx','.js','.json'])if(existsSync(stem+suffix))return {path:stem+suffix};
    throw Error('Missing frozen Review module: '+args.path);
   });
  }}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('one coronary-sinus X-ray draft reaches exact learner and protected Review imports',
 {timeout:240000},async()=>{
 const currentRevision=admitPreservedClinicalReview({revision,sourceHashes:{
  'content/coronary-venous-teaching.ts':'4b4e26e170b17d6cd6bdbb42dccf1860eaa185517cf312038b0cfec83da349b3',
  'lib/nested-teaching.ts':'3fe0bbfd7078554e013c00e2e58c70aa96af34074540bf4e959b8269941a356f',
 },learnerModules:['head-neck']});
 const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),currentRevision);
 assert.equal(execFileSync('git',['rev-parse',`${posteriorEpoch}^`],{cwd:atlas,windowsHide:true}).toString().trim(),posteriorParent);
 assert.equal(execFileSync('git',['rev-parse',`${posteriorEpoch}^{tree}`],{cwd:atlas,windowsHide:true}).toString().trim(),posteriorTree);
 assert.equal(execFileSync('git',['merge-base',posteriorEpoch,currentRevision],{cwd:atlas,windowsHide:true}).toString().trim(),posteriorEpoch);
 assert.equal(sha(git(revision,sharedPath)),historicalSharedSha);
 assert.deepEqual(git(revision,sharedPath),git(posteriorParent,sharedPath),'historical shared teaching survives to genuine later parent');
 assert.equal(sha(git(posteriorEpoch,sharedPath)),currentSharedSha);
 assert.deepEqual(git(posteriorEpoch,sharedPath),git(currentRevision,sharedPath),'genuine later teaching survives to current source');
 const review=json('atlas-review/manifest.json'),viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 const modules=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>({name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 assert.equal(review.revision,currentRevision);assert.equal(viewer.sourceCommit,currentRevision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);assert.notEqual(review.websiteIntegrationSha256,previousIntegration);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const {name,base,manifest} of modules){
  assert.equal(manifest.sourceCommit,runtimeSources[name],name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);
  assert.equal(manifest.standaloneReviewConnection,false,name);
  const input=json(base+'source-inputs.json').find((file:any)=>file.path==='content/coronary-venous-teaching.ts');
  if(name==='head-neck')assert.equal(input?.sha256,sha(git(revision,'content/coronary-venous-teaching.ts')));
  else assert.equal(input,undefined,`${name}: unrelated runtime did not import nested coronary source`);
 }
 const sharedInputs=json(modules[0].base+'source-inputs.json');
 assert.equal(sharedInputs.find((file:any)=>file.path===sharedPath)?.sha256,currentSharedSha,
  'head-neck learner includes exact current shared nested teaching');
 for(const path of sourcePaths){
  const expected=sha(git(path===sharedPath?currentRevision:revision,path)),record=review.files.find((file:any)=>file.path===path);
  assert(record,`${path}: Review import missing`);assert.equal(record.sourceSha256,expected);assert.equal(record.importedSha256,expected);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected);
  // Git object bytes are the source identity; a checkout may materialize CRLF.
  assert.equal(sha(Buffer.from(readFileSync(atlas+'/'+path).toString().replaceAll('\r\n','\n'))),expected);
  for(const base of ['public/atlas-review/',viewerBase,...modules.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: no raw teaching source exposed`);
 }
 const rendererPath='content/body-renderer-revision.json',sourceRenderer=JSON.parse(git(currentRevision,rendererPath).toString());
 const featureRenderer=JSON.parse(git(revision,rendererPath).toString());
 const boundRenderer=json('atlas-review/'+rendererPath),oldSourceRenderer=JSON.parse(git(previous,rendererPath).toString());
 assert.notEqual(sourceRenderer.sha256,oldSourceRenderer.sha256);
 assert.notEqual(sourceRenderer.sha256,featureRenderer.sha256,'later renderer source is separately pinned');
 const rendererRecord=review.files.find((file:any)=>file.path===rendererPath);assert(rendererRecord);
 assert.equal(rendererRecord.sourceSha256,sha(git(currentRevision,rendererPath)));
 assert.equal(rendererRecord.importedSha256,sha(readFileSync('atlas-review/'+rendererPath)));
 assert.equal(boundRenderer.sourceRendererSha256,sourceRenderer.sha256);assert.equal(boundRenderer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(boundRenderer.sha256,sha(JSON.stringify({source:sourceRenderer.sha256,website:review.websiteIntegrationSha256})));
 for(const path of ['public/models/bodyparts3d/full-body/catalog.json','public/models/bodyparts3d/coronary-venous/catalog.json',
  'content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json']){
  assert.deepEqual(git(revision,path),git(previous,path),`${path}: source identity preserved`);
  assert.deepEqual(readFileSync('atlas-review/'+path),git(revision,path),`${path}: imported source identity`);
 }
 const oldManifest=json(frozen+'/atlas-review/manifest.json'),oldRenderer=json(frozen+'/atlas-review/'+rendererPath);
 assert.equal(oldManifest.revision,previous);assert.equal(oldManifest.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldManifest.files.length,1447,'Exact frozen prior Review closure');
 for(const file of oldManifest.files)
  assert.equal(sha(readFileSync(frozen+'/atlas-review/'+file.path)),file.importedSha256,`${file.path}: frozen manifest byte check before compile`);
 assert.equal(oldRenderer.sourceRendererSha256,oldSourceRenderer.sha256);assert.equal(oldRenderer.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldRenderer.sha256,sha(JSON.stringify({source:oldSourceRenderer.sha256,website:previousIntegration})));
 const live=await imported(),before=await importedFrozen();
 const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const sourceBefore=await history.exactSourceHistoryApi(previous,'nested-review-security');
 const catalog=live.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(catalog,before.bodyDisplayCatalog(json(frozen+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
 assert.deepEqual(live.nestedReviewRows,before.nestedReviewRows);
 assert.deepEqual(live.nestedStudyTargets(catalog),before.nestedStudyTargets(catalog));
 assert.deepEqual(before.nestedTeachingReferences,sourceBefore.nestedTeachingReferences);
 assert.deepEqual(before.nestedConcepts,sourceBefore.nestedConcepts);
 const introduced=await history.exactSourceHistoryApi(revision,'nested-review-security');
 const posteriorBefore=await history.exactSourceHistoryApi(posteriorParent,'nested-review-security');
 const posteriorAt=await history.exactSourceHistoryApi(posteriorEpoch,'nested-review-security');
 const proveOneModality=(earlier:any[],later:any[],expected:Map<string,string>,label:string)=>{
  assert.equal(earlier.length,76,`${label}: complete original concept population`);
  assert.deepEqual(later.map(row=>row.id),earlier.map(row=>row.id),`${label}: ordered identity population`);
  assert.equal(new Set(earlier.map(row=>row.id)).size,76,`${label}: unique concept identities`);
  const changed:string[]=[];
  for(let i=0;i<earlier.length;i++){
   const prior=wire(earlier[i]),next=wire(later[i]);
   const tab=expected.get(prior.id);
   if(tab){
    assert.equal(prior.imaging[tab],undefined,`${label}/${prior.id}: genuine absent predecessor`);
    assert.equal(next.imaging[tab].readiness,'draft',`${label}/${prior.id}: introduced draft`);
    delete next.imaging[tab];
    assert.deepEqual(next,prior,`${label}/${prior.id}: all other concept fields preserved`);
    changed.push(prior.id);
   }else assert.deepEqual(next,prior,`${label}/${prior.id}: unchanged concept`);
  }
  assert.deepEqual(changed,[...expected.keys()],`${label}: exactly named concept changes`);
 };
 const proveReferences=(earlier:any,later:any,added:string[],label:string)=>{
  assert.deepEqual(Object.keys(later).filter(key=>!Object.hasOwn(earlier,key)).sort(),
   [...added].sort(),`${label}: exact added references`);
  assert.deepEqual(Object.fromEntries(Object.entries(later).filter(([key])=>!added.includes(key))),
   earlier,`${label}: every prior reference preserved`);
 };
 proveOneModality(before.nestedConcepts,introduced.nestedConcepts,
  new Map([['coronary-sinus','xray']]),'genuine coronary introduction');
 assert.deepEqual(introduced.nestedConcepts,posteriorBefore.nestedConcepts,
  'all 76 coronary-era concepts survive to the posterior-fossa parent');
 proveOneModality(posteriorBefore.nestedConcepts,posteriorAt.nestedConcepts,
  new Map(posteriorConcepts.map(id=>[id,'ultrasound'])),'genuine posterior-fossa introduction');
 // Later cardiac teaching is an explicit six-section extension, not a change
 // to the coronary-sinus or posterior-fossa lesson under test.
 const cardiacEpoch='d5c86abea551c92a4e59be57059e6b652fa01bde';
 assert.equal(execFileSync('git',['merge-base',cardiacEpoch,currentRevision],{cwd:atlas,windowsHide:true}).toString().trim(),cardiacEpoch);
 assert.deepEqual(git(cardiacEpoch,'content/cardiac-teaching.ts'),git(currentRevision,'content/cardiac-teaching.ts'),'Current cardiac teaching retains its exact introduction');
 const currentAt=await history.exactSourceHistoryApi(currentRevision,'nested-review-security');
 assert.deepEqual(live.nestedConcepts,currentAt.nestedConcepts,'Every current imported concept matches the exact current Atlas source');
 assert.deepEqual(live.nestedConcepts.map((row:any)=>row.id),posteriorAt.nestedConcepts.map((row:any)=>row.id),'All 76 ordered concept identities survive');
 const restored=wire(live.nestedConcepts),changed:string[]=[];
 const cardiacUpdates=new Map([
  ['cardiac-right-atrium',['mri','ultrasound']],['cardiac-left-atrium',['mri']],
  ['cardiac-right-ventricle',['mri','ultrasound']],['cardiac-left-ventricle',['mri']],
 ]);
 for(let index=0;index<restored.length;index++){
  const row=restored[index],prior=posteriorAt.nestedConcepts[index];
  for(const tab of cardiacUpdates.get(row.id)??[]){
   assert.notDeepEqual(row.imaging[tab],prior.imaging[tab],row.id+':'+tab+' later cardiac section');
   assert.equal(row.imaging[tab].readiness,'draft');
   row.imaging[tab]=wire(prior.imaging[tab]);changed.push(row.id+':'+tab);
  }
 }
 assert.equal(changed.length,6);
 assert.deepEqual(restored,posteriorAt.nestedConcepts,'All other concept fields, questions and original lessons survive byte-for-value');
 const oldRefs=before.nestedTeachingReferences,refs=live.nestedTeachingReferences;
 proveReferences(oldRefs,introduced.nestedTeachingReferences,[referenceKey],
  'genuine coronary reference introduction');
 assert.deepEqual(introduced.nestedTeachingReferences,posteriorBefore.nestedTeachingReferences,
  'coronary references survive to the posterior-fossa parent');
 proveReferences(posteriorBefore.nestedTeachingReferences,posteriorAt.nestedTeachingReferences,
  posteriorReferences,'genuine posterior-fossa reference introduction');
 assert.deepEqual(refs,currentAt.nestedTeachingReferences,'Every current reference matches the exact current Atlas source');
 proveReferences(posteriorAt.nestedTeachingReferences,refs,['cardiacRightHeart2025'],
  'All posterior-fossa references survive the one later cardiac reference');
 assert.equal(refs[referenceKey].url,referenceUrl);assert.equal(refs[referenceKey].scopedToConcept,true);
 assert.deepEqual(Object.fromEntries(Object.entries(introduced.nestedTeachingReferences).filter(([key])=>key!==referenceKey)),oldRefs);
 const emitted=[emittedTeaching(modules[0].base,modules[0].manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 for(const id of posteriorConcepts){
  const concept=posteriorAt.nestedConcepts.find((row:any)=>row.id===id);assert(concept,id);
  const section=concept.imaging.ultrasound;assert.equal(section.readiness,'draft',id);
  for(const code of emitted)for(const value of [section.body,
   ...section.references.flatMap((key:string)=>[refs[key].title,refs[key].url])])
   assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),
    `${id}: exact later ultrasound teaching/reference emitted`);
 }
 const rendered=await build({stdin:{contents:[
  "import {NestedTeaching} from './atlas-review/app/nested-teaching';",
  "import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';",
  "export const render=(parent,study,selected)=>renderToStaticMarkup(React.createElement(NestedTeaching,{parent,study,selected,initialTopic:'xray'}));",
 ].join('\n'),resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',
  loader:{'.css':'empty'},banner:{js:`import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd()+'/package.json')});`}});
 const ssr=await import('data:text/javascript;base64,'+Buffer.from(rendered.outputFiles[0].text).toString('base64'));
 const group=live.nestedReviewRows.find((row:any)=>row.parentId===parentId&&row.study==='coronary-venous');assert(group);
 const parent=catalog.structures.find((structure:any)=>structure.id===parentId);assert(parent);
 const selections=live.nestedStudyTargets(catalog).filter((target:any)=>target.study==='coronary-venous');
 assert.deepEqual(selections.map((target:any)=>target.structure.fmaId),['FMA4706','FMA4714']);
 let drafts=0,pending=0,staleRejected=0,unsupportedRejected=0,storageCalls=0;
 const storage=new Proxy({},{get(){storageCalls++;throw Error('Rejected save reached storage');}});
 for(const target of selections){
  const sinus=target.structure.fmaId==='FMA4706';
  const concept=live.nestedTeachingFor(parent,target.study,target.structure),prior=before.nestedTeachingFor(parent,target.study,target.structure);
  assert(concept&&prior);assert.equal(concept.id,sinus?'coronary-sinus':'small-cardiac-vein');
  const projected=wire(concept);if(sinus){assert.equal(projected.imaging.xray.readiness,'draft');assert.deepEqual(projected.imaging.xray.references,[referenceKey]);delete projected.imaging.xray;}
  assert.deepEqual(projected,wire(prior),'All other concept fields, modelLimit and quiz exact');
  for(const topic of live.contentTabs){const actual=live.nestedTopicLesson(concept,topic),old=before.nestedTopicLesson(prior,topic);
   if(sinus&&topic==='xray'){
    assert.equal(old.readiness,'pending');assert.equal(actual.readiness,'draft');assert.deepEqual(actual.citations,[referenceUrl]);
    assert.equal(actual.body,concept.imaging.xray.body);assert.match(actual.note,/specialist review pending/);
    const html=ssr.render(parent,target.study,target.structure);
    assert(html.includes('X-ray · teaching draft'));assert(html.includes(actual.body.replaceAll('&','&amp;')));
    assert(html.includes('Teaching references'));assert(html.includes(refs[referenceKey].title));assert(html.includes(referenceUrl));
    for(const code of emitted)for(const value of [actual.body,actual.note,refs[referenceKey].title,referenceUrl])
     assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`Reachable emitted ${value}`);
    drafts++;
   }else assert.deepEqual(actual,old,`${target.structure.fmaId}/${topic}`);
  }
  const packet=await live.nestedReviewMaterial(group.key,target.structureId);
  const oldPacket=await before.nestedReviewMaterial(group.key,target.structureId);
  const oldSource=await sourceBefore.nestedReviewMaterial(group.key,target.structureId);
  assert(packet&&oldPacket&&oldSource);
  assert.deepEqual(oldPacket.source,oldSource.source);assert.deepEqual(oldPacket.teaching,oldSource.teaching);
  const c=packet.context,p=oldPacket.context,s=oldSource.context;
  assert.equal(c.sourceHash,expectedSourceHashes[target.structure.fmaId as keyof typeof expectedSourceHashes]);
  assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.sourceFrame,sourceFrame);assert.equal(p.sourceFrame,sourceFrame);
  assert.deepEqual(packet.source,oldPacket.source);assert.deepEqual(packet.atlasLink,oldPacket.atlasLink);
  assert.deepEqual(c.checklists,p.checklists);assert.deepEqual(c.blockers,p.blockers);assert.equal(c.revisions.imaging,null);
  assert.equal(c.rendererHash,boundRenderer.sha256);assert.equal(p.rendererHash,oldRenderer.sha256);
  assert.equal(p.sourceHash,s.sourceHash);assert.equal(p.teachingHash,s.teachingHash);
  const oldBound={catalogScope:p.catalogScope,nestedKey:p.nestedKey,sourceFrame:p.sourceFrame,structureId:p.structureId,checklistVersion:p.checklistVersion};
  assert.equal(p.materialHash,digest({identity:oldBound,sourceHash:p.sourceHash,teachingHash:p.teachingHash,renderer:p.rendererHash,checklist:p.checklists}));
  const bound={catalogScope:c.catalogScope,nestedKey:c.nestedKey,sourceFrame:c.sourceFrame,structureId:c.structureId,checklistVersion:c.checklistVersion};
  assert.equal(c.sourceHash,digest(packet.source));assert.equal(c.teachingHash,digest(packet.teaching));
  assert.equal(c.materialHash,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,renderer:c.rendererHash,checklist:c.checklists}));
  assert.equal(c.revisions.geometry,digest({identity:bound,sourceHash:c.sourceHash,renderer:c.rendererHash,checklist:c.checklists.geometry}));
  assert.equal(c.revisions.teaching,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,checklist:c.checklists.teaching}));
  if(sinus){
   assert.notEqual(c.teachingHash,p.teachingHash);assert.notEqual(c.revisions.teaching,p.revisions.teaching);
   assert.deepEqual(packet.teaching.topics.filter((item:any)=>item.tab!=='xray'),oldPacket.teaching.topics.filter((item:any)=>item.tab!=='xray'));
   assert.deepEqual(packet.teaching.lesson,oldPacket.teaching.lesson);
   assert.deepEqual(packet.teaching.concept.modelLimit,oldPacket.teaching.concept.modelLimit);
   assert.deepEqual(packet.teaching.concept.quiz,oldPacket.teaching.concept.quiz);
   const projectedTeaching=wire(packet.teaching),priorTeaching=wire(oldPacket.teaching);
   Object.assign(projectedTeaching.topics.find((item:any)=>item.tab==='xray'),priorTeaching.topics.find((item:any)=>item.tab==='xray'));
   delete projectedTeaching.concept.imaging.xray;delete projectedTeaching.referenceTitles;delete priorTeaching.referenceTitles;
   assert.deepEqual(projectedTeaching,priorTeaching);
   assert.deepEqual(Object.keys(packet.teaching.referenceTitles).filter(url=>!Object.hasOwn(oldPacket.teaching.referenceTitles,url)),[referenceUrl]);
   assert(c.teachingTabs.includes('xray'));assert(!p.teachingTabs.includes('xray'));
  }else{
   assert.deepEqual(packet.teaching,oldPacket.teaching);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);
   assert.equal(live.nestedTopicLesson(concept,'xray').readiness,'pending');assert.equal(live.nestedTopicLesson(concept,'ultrasound').readiness,'pending');pending++;
  }
  assert.equal((await live.nestedReviewSelection(group.key,target.structureId,c.sourceHash))?.context.sourceHash,c.sourceHash);
  assert.equal(await live.nestedReviewSelection(group.key,target.structureId,'f'.repeat(64)),null);
  if(!sinus)continue;
  const request=(track:string,delta:any,draft:any)=>new Request('https://review.test/api/nested-review',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SINUS_XRAY'},
   body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
    materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft,...delta})});
  for(const track of ['geometry','teaching']){
   for(const delta of [{materialHash:p.materialHash},{revisionHash:p.revisions[track]},
    {materialHash:s.materialHash},{revisionHash:s.revisions[track]},
    {materialHash:'f'.repeat(64),revisionHash:'f'.repeat(64)}]){
    const response=await live.postNestedReview(request(track,delta,live.blankNestedReview(c,track)),storage);
    assert.equal(response.status,409);staleRejected++;
   }
   const rejected=await live.postNestedReview(request(track,{}, {...live.blankNestedReview(c,track),status:'approved',attested:true}),storage);
   assert.equal(rejected.status,422);unsupportedRejected++;
  }
  for(const mutation of [
   (item:any)=>{item.sources[0].sha256='f'.repeat(64);},
   (item:any)=>{item.fmaId='FMA4714';},
   (item:any)=>{item.parentId+='-foreign';},
  ]){const bad=wire(target.structure);mutation(bad);assert.equal(live.nestedTeachingFor(parent,target.study,bad),null);}
  const badParent=wire(parent);badParent.id+='-foreign';assert.equal(live.nestedTeachingFor(badParent,target.study,target.structure),null);
 }
 assert.deepEqual({drafts,pending,staleRejected,unsupportedRejected,storageCalls},{drafts:1,pending:1,staleRejected:10,unsupportedRejected:2,storageCalls:0});
});
