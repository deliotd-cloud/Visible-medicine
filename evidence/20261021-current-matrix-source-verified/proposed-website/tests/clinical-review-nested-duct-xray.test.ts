import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const atlas=currentAtlasDeliveryRoot();
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const revision=CURRENT_ATLAS_REVISION;
const completed='d4016ff9988064552e464980aaea1913b25d5114';
const completedWebsite='F:/VisibleMedicine/recovery/checkpoints/20261014-coronary-sinus-website-before/source';
const completedIntegration='9802c7d95eff99f8732f27f19964362f74d580113952b3a6cf6e3f60c9df2597';
const previous='f3d6966a040b69a375f6bbfa2a8c502b8c8492e4';
const previousWebsite='F:/VisibleMedicine/recovery/checkpoints/20261014-nested-duct-website-before/source';
const previousIntegration='78775a68bd4639a060e9b04271f8d1e4d6e9e3bf179dda55524e679da22edccf';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=['content/nested-duct-xray.ts','content/nested-teaching.ts','lib/nested-teaching.ts'];
const selected=new Map([
 ['pancreatic:FMA10419',['pancreatic-ductal-system','ductXrayErcp']],
 ['pancreatic:FMA63103',['pancreatic-ductal-system','ductXrayErcp']],
 ['hepatic:FMA71857',['hepatic-biliary','ductXrayErcp','ductXrayPtc']],
 ['hepatic:FMA71858',['hepatic-biliary','ductXrayErcp','ductXrayPtc']],
]);
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const canonical=(value:any):string=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:
 value&&typeof value==='object'?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`:JSON.stringify(value);
const digest=(value:unknown)=>sha(canonical(wire(value)));
const git=(commit:string,path:string)=>execFileSync('git',['--no-replace-objects','show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6});
function exactPosteriorFossaInverse(current:Buffer){
 let restored=current.toString('utf8');
 assert.deepEqual(Buffer.from(restored),current,'Lossless current nested source');
 const seams:[string,string][]=[
  ["import { posteriorFossaUltrasoundTeaching, posteriorFossaUltrasoundReferences } from './posterior-fossa-ultrasound.ts';\n",''],
  ['  ...posteriorFossaUltrasoundReferences,\n',''],
  ...(['midbrain','pons','medulla','cerebellum'] as const).map(name=>[
   `imaging: { ...brainImagingTeaching.${name}, ultrasound: posteriorFossaUltrasoundTeaching.${name} },`,
   `imaging: brainImagingTeaching.${name},`,
  ] as [string,string]),
 ];
 for(const [after,before] of seams){assert.equal(restored.split(after).length,2,`One posterior-fossa seam: ${after}`);restored=restored.replace(after,before);}
 assert.deepEqual(Buffer.from(restored),git(historicalRevision,'content/nested-teaching.ts'),
  'Entire old9f nested source restored after six exact current inverses');
}

async function imported(){
 const exports=[
  "export * from './atlas-review/content/nested-teaching';",
  "export * from './atlas-review/lib/nested-teaching';",
  "export * from './atlas-review/lib/nested-anatomy';",
  "export * from './atlas-review/lib/nested-review-material';",
  "export * from './atlas-review/lib/nested-review-client';",
  "export * from './atlas-review/lib/nested-review-api';",
  "export * from './atlas-review/lib/nested-review';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
 ];
 const compiled=await build({stdin:{contents:exports.join('\n'),resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

async function importedFrozenWebsite(root:string){
 const exports=[
  "export * from './atlas-review/content/nested-teaching';",
  "export * from './atlas-review/lib/nested-teaching';",
  "export * from './atlas-review/lib/nested-anatomy';",
  "export * from './atlas-review/lib/nested-review-material';",
  "export * from './atlas-review/lib/nested-review-client';",
  "export * from './atlas-review/lib/nested-review-api';",
  "export * from './atlas-review/lib/nested-review';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
 ];
 const compiled=await build({stdin:{contents:exports.join('\n'),resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm',nodePaths:[resolve(process.cwd(),'node_modules')],
  plugins:[{name:'frozen-website-review',setup(api){
   api.onResolve({filter:/^\.\/atlas-review\//},args=>{
    const stem=resolve(root,args.path.slice(2));
    for(const suffix of ['.ts','.tsx','.js','.json'])if(existsSync(stem+suffix))return {path:stem+suffix};
    throw Error('Missing frozen Review module: '+args.path);
   });
  }}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('current four nested duct X-ray drafts and exact completed-era corpus replay',
 {timeout:240000},async()=>{
 assert.equal(checkedAtlasHistoryRepo(historicalRevision),atlas);
 assert.equal(execFileSync('git',['merge-base',historicalRevision,revision],{cwd:atlas,windowsHide:true}).toString().trim(),historicalRevision);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 const review=json('atlas-review/manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 const learners=['head-neck','shoulder'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
  manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 assert.equal(review.revision,revision);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,revision,name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
  if(name==='head-neck')assert.equal(manifest.imagingConnection,false,name);
  else assert.equal(Object.hasOwn(manifest,'imagingConnection'),false,'Shoulder manifest has no imaging connection field');
  assert.equal(manifest.standaloneReviewConnection,false,name);
 }
 for(const path of sourcePaths){
  const expected=sha(git(revision,path));
  if(path==='content/nested-teaching.ts')exactPosteriorFossaInverse(git(revision,path));
  else assert.deepEqual(git(revision,path),git(historicalRevision,path),`${path}: immutable duct source`);
  const record=review.files.find((file:any)=>file.path===path);
  assert(record,`${path}: Review import missing`);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
  assert.equal(sha(readFileSync(atlas+'/'+path)),expected,path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:any)=>file.path===path);
   if(name==='head-neck')assert.equal(input?.sha256,expected,`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: unrelated regional runtime must not import nested duct source`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 const sourceRendererPath='content/body-renderer-revision.json';
 const sourceRenderer=JSON.parse(git(revision,sourceRendererPath).toString());
 const boundRenderer=json('atlas-review/'+sourceRendererPath);
 const rendererRecord=review.files.find((file:any)=>file.path===sourceRendererPath);
 assert(rendererRecord);
 assert.equal(rendererRecord.sourceSha256,sha(git(revision,sourceRendererPath)));
 assert.equal(rendererRecord.importedSha256,sha(readFileSync('atlas-review/'+sourceRendererPath)));
 assert.equal(boundRenderer.sourceRendererSha256,sourceRenderer.sha256);
 assert.equal(boundRenderer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(boundRenderer.sha256,sha(JSON.stringify({source:sourceRenderer.sha256,website:review.websiteIntegrationSha256})));
 const authorPath='content/nested-duct-xray.ts';
 assert.equal(review.files.filter((file:any)=>file.path===authorPath).length,1);
 assert.equal(execFileSync('git',['--no-replace-objects','ls-tree','--name-only',previous,'--',authorPath],
  {cwd:atlas,windowsHide:true}).toString().trim(),'','Authored module must be new');
 assert.deepEqual(git(revision,catalogPath),git(previous,catalogPath),'Source geometry catalog');
 for(const path of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json',
  'content/femoral-component-teaching-bindings.v1.json','content/mca-source-teaching-bindings.v1.json',
  'content/pica-source-teaching-bindings.v1.json']){
  assert.deepEqual(git(revision,path),git(previous,path),`${path}: source binding identity`);
  assert.deepEqual(readFileSync('atlas-review/'+path),git(revision,path),`${path}: imported binding`);
 }
 const delivered=await imported();
 const completedManifest=json(completedWebsite+'/atlas-review/manifest.json');
 const completedRenderer=json(completedWebsite+'/atlas-review/content/body-renderer-revision.json');
 assert.equal(completedManifest.revision,completed);
 assert.equal(completedManifest.websiteIntegrationSha256,completedIntegration);
 assert.equal(completedManifest.files.length,1447,'Frozen completed Review source inventory');
 for(const file of completedManifest.files)
  assert.equal(sha(readFileSync(completedWebsite+'/atlas-review/'+file.path)),file.importedSha256,
   `${file.path}: completed Review import must match its frozen manifest`);
 const completedSourceRendererPath='content/body-renderer-revision.json';
 const completedRendererRecord=completedManifest.files.find((file:any)=>file.path===completedSourceRendererPath);
 const completedSourceRenderer=JSON.parse(git(completed,completedSourceRendererPath).toString());
 assert(completedRendererRecord);
 assert.equal(completedRendererRecord.sourceSha256,sha(git(completed,completedSourceRendererPath)));
 assert.equal(completedRendererRecord.importedSha256,sha(readFileSync(completedWebsite+'/atlas-review/'+completedSourceRendererPath)));
 assert.equal(completedRenderer.sourceRendererSha256,completedSourceRenderer.sha256);
 assert.equal(completedRenderer.websiteIntegrationSha256,completedIntegration);
 assert.equal(completedRenderer.sha256,sha(JSON.stringify({source:completedSourceRenderer.sha256,website:completedIntegration})));
 const live=await importedFrozenWebsite(completedWebsite);
 const oldWebsiteManifest=json(previousWebsite+'/atlas-review/manifest.json');
 const oldWebsiteRenderer=json(previousWebsite+'/atlas-review/content/body-renderer-revision.json');
 const oldWebsiteRecord=oldWebsiteManifest.files.find((file:any)=>file.path===sourceRendererPath);
 const immutableRenderer=JSON.parse(git(previous,sourceRendererPath).toString());
 assert.equal(oldWebsiteManifest.revision,previous);
 assert.equal(oldWebsiteManifest.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldWebsiteManifest.files.length,1443,'Frozen previous Review source inventory');
 for(const file of oldWebsiteManifest.files)
  assert.equal(sha(readFileSync(previousWebsite+'/atlas-review/'+file.path)),file.importedSha256,
   `${file.path}: frozen Review import must match its prior manifest`);
 assert(oldWebsiteRecord);
 assert.equal(oldWebsiteRecord.sourceSha256,sha(git(previous,sourceRendererPath)));
 assert.equal(oldWebsiteRecord.importedSha256,sha(readFileSync(previousWebsite+'/atlas-review/'+sourceRendererPath)));
 assert.equal(oldWebsiteRenderer.sourceRendererSha256,immutableRenderer.sha256);
 assert.equal(oldWebsiteRenderer.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldWebsiteRenderer.sha256,sha(JSON.stringify({source:immutableRenderer.sha256,website:previousIntegration})));
 assert.notEqual(oldWebsiteRenderer.sha256,immutableRenderer.sha256,'Old website binding differs from Atlas source');
 const boundBefore=await importedFrozenWebsite(previousWebsite);
 const rendered=await build({stdin:{contents:[
  "import {NestedTeaching} from './atlas-review/app/nested-teaching';",
  "import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';",
  "export const render=(parent,study,selected)=>renderToStaticMarkup(React.createElement(NestedTeaching,{parent,study,selected,initialTopic:'xray'}));",
 ].join('\n'),resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',
  jsx:'automatic',loader:{'.css':'empty'},
  banner:{js:`import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd()+'/package.json')});`}});
 const ssr=await import('data:text/javascript;base64,'+Buffer.from(rendered.outputFiles[0].text).toString('base64'));
 const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await history.exactSourceHistoryApi(previous,'nested-review-security');
 // All-corpus and stale-save comparisons below replay the completed d401 epoch.
 // Current delivered coverage remains in the four selected SSR/emitted assertions.
 const catalog=live.bodyDisplayCatalog(json(completedWebsite+'/atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(git(previous,catalogPath).toString())));
 assert.deepEqual(boundBefore.bodyDisplayCatalog(json(previousWebsite+'/atlas-review/'+catalogPath)),catalog);
 assert.deepEqual(delivered.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
 assert.deepEqual(live.contentTabs,old.contentTabs);
 const renderer=completedRenderer;
 const oldRenderer=JSON.parse(git(previous,'content/body-renderer-revision.json').toString());
 assert.notEqual(renderer.sha256,oldRenderer.sha256);
 const refs=live.nestedTeachingReferences,oldRefs=old.nestedTeachingReferences;
 const added=['ductXrayErcp','ductXrayPtc'];
 assert.deepEqual(Object.keys(refs).filter(key=>!Object.hasOwn(oldRefs,key)).sort(),added);
 assert.deepEqual(Object.fromEntries(Object.entries(refs).filter(([key])=>!added.includes(key))),oldRefs);
 for(const key of added){assert.equal(refs[key].scopedToConcept,true);assert.match(refs[key].url,/^https:\/\//);}
 assert.equal(new Set(added.map(key=>refs[key].url)).size,2);
 assert.match(refs.ductXrayErcp.url,/^https:\/\/www\.niddk\.nih\.gov\//);
 assert.match(refs.ductXrayPtc.url,/^https:\/\/www\.radiologyinfo\.org\//);
 const emitted=[...learners.filter(item=>item.name==='head-neck').map(({base,manifest})=>emittedTeaching(base,manifest.files,true)),
  emittedTeaching(viewerBase,viewer.files,true)];
 const rootGlbs=execFileSync('git',['ls-files','-z'],{cwd:atlas,windowsHide:true}).toString().split('\0').filter(path=>path.endsWith('.glb'));
 assert.equal(rootGlbs.length,146);
 for(const path of rootGlbs){assert.equal(sha(readFileSync(atlas+'/'+path)),sha(git(previous,path)),path);}
 const targets=live.nestedStudyTargets(catalog);
 assert.equal(targets.length,108);
 assert.deepEqual(targets,old.nestedStudyTargets(catalog));
 assert.deepEqual(live.nestedReviewRows,old.nestedReviewRows);
 let drafts=0,otherTopics=0,nestedPackets=0,unchangedPackets=0,changedTeaching=0;
 let changedContexts=0,identityRejected=0,staleRejected=0,unsupportedRejected=0,storageCalls=0;
 const storage=new Proxy({},{get(){storageCalls++;throw Error('Rejected save reached storage');}});
 for(const target of targets){
  const parent=catalog.structures.find((structure:any)=>structure.id===target.parentId);
  assert(parent);
  const id=target.study+':'+target.structure.fmaId;
  const chosen=selected.get(id);
  const concept=live.nestedTeachingFor(parent,target.study,target.structure);
  const beforeConcept=old.nestedTeachingFor(parent,target.study,target.structure);
  assert.equal(Boolean(concept),Boolean(beforeConcept),id);
  if(concept)for(const topic of live.contentTabs){
   const lesson=live.nestedTopicLesson(concept,topic);
   const prior=old.nestedTopicLesson(beforeConcept,topic);
   if(chosen&&topic==='xray'){
    assert.equal(concept.id,chosen[0]);
    assert.equal(prior.readiness,'pending');
    assert.equal(lesson.readiness,'draft');
    assert.deepEqual(lesson.citations,chosen.slice(1).map(key=>refs[key].url));
    assert.equal(lesson.body,concept.imaging.xray.body);
    assert.match(lesson.note,/specialist review pending/);
    assert.match(lesson.note,/No scan access or synchronization/);
   const currentConcept=delivered.nestedTeachingFor(parent,target.study,target.structure);
   assert(currentConcept,`${id}: currently delivered duct concept`);
   assert.deepEqual(delivered.nestedTopicLesson(currentConcept,topic),lesson,
    `${id}: currently delivered original duct lesson remains exact`);
    const html=ssr.render(parent,target.study,target.structure);
    assert(html.includes('X-ray · teaching draft'),`${id}: SSR draft`);
    assert(html.includes(lesson.body.replaceAll('&','&amp;')),`${id}: SSR body`);
    assert(html.includes('Teaching references'),`${id}: SSR credits`);
    for(const key of chosen.slice(1)){
     assert(html.includes(refs[key].title),`${id}: SSR reference title`);
     assert(html.includes(refs[key].url.replaceAll('&','&amp;')),`${id}: SSR reference URL`);
    }
    for(const code of emitted)for(const value of [lesson.body,lesson.note,...chosen.slice(1).flatMap(key=>[refs[key].url,refs[key].title])])
     assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${id}: reachable emitted ${value}`);
    drafts++;
   }else{assert.deepEqual(lesson,prior,`${id}/${topic}`);otherTopics++;}
  }
  else assert(!chosen,`${id}: selected concept must resolve`);
  const row=live.nestedReviewRows.find((entry:any)=>entry.parentId===target.parentId&&entry.study===target.study);
  assert(row,id);
  const packet=await live.nestedReviewMaterial(row.key,target.structureId);
  const before=await old.nestedReviewMaterial(row.key,target.structureId);
  const beforeWebsite=await boundBefore.nestedReviewMaterial(row.key,target.structureId);
  assert(packet&&before&&beforeWebsite,id);nestedPackets++;
  assert.deepEqual(beforeWebsite.source,before.source,`${id}: frozen website source`);
  assert.deepEqual(beforeWebsite.teaching,before.teaching,`${id}: frozen website teaching`);
  const c=packet.context,p=before.context,w=beforeWebsite.context;
  const previousBound={catalogScope:p.catalogScope,nestedKey:p.nestedKey,sourceFrame:p.sourceFrame,
   structureId:p.structureId,checklistVersion:p.checklistVersion};
  assert.equal(w.rendererHash,oldWebsiteRenderer.sha256,`${id}: actual prior website renderer`);
  assert.equal(w.sourceHash,p.sourceHash);
  assert.equal(w.teachingHash,p.teachingHash);
  assert.equal(w.materialHash,digest({identity:previousBound,sourceHash:p.sourceHash,
   teachingHash:p.teachingHash,renderer:oldWebsiteRenderer.sha256,checklist:p.checklists}));
  assert.equal(w.revisions.geometry,digest({identity:previousBound,sourceHash:p.sourceHash,
   renderer:oldWebsiteRenderer.sha256,checklist:p.checklists.geometry}));
  const projectedSource=wire(p);projectedSource.rendererHash=w.rendererHash;
  projectedSource.materialHash=w.materialHash;
  projectedSource.revisions.geometry=w.revisions.geometry;
  assert.deepEqual(projectedSource,wire(w),`${id}: exact prior website context from three renderer fields`);
  assert.deepEqual(packet.source,before.source);
  assert.deepEqual(packet.atlasLink,before.atlasLink);
  assert.equal(c.sourceHash,p.sourceHash);
  assert.equal(c.sourceFrame,p.sourceFrame);
  assert.deepEqual(c.checklists,p.checklists);
  assert.deepEqual(c.blockers,p.blockers);
  assert.equal(c.revisions.imaging,null);
  assert.equal(c.rendererHash,renderer.sha256);
  assert.equal(p.rendererHash,oldRenderer.sha256);
  assert.notEqual(c.rendererHash,p.rendererHash);
  assert.notEqual(c.materialHash,p.materialHash);
  assert.notEqual(c.revisions.geometry,p.revisions.geometry);
  const bound={catalogScope:c.catalogScope,nestedKey:c.nestedKey,sourceFrame:c.sourceFrame,
   structureId:c.structureId,checklistVersion:c.checklistVersion};
  assert.equal(c.sourceHash,digest(packet.source));
  assert.equal(c.teachingHash,digest(packet.teaching));
  assert.equal(c.materialHash,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,renderer:c.rendererHash,checklist:c.checklists}));
  assert.equal(c.revisions.geometry,digest({identity:bound,sourceHash:c.sourceHash,renderer:c.rendererHash,checklist:c.checklists.geometry}));
  assert.equal(c.revisions.teaching,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,checklist:c.checklists.teaching}));
  changedContexts++;
  if(!chosen){
   assert.deepEqual(packet.teaching,before.teaching,id);
   assert.equal(c.teachingHash,p.teachingHash);
   assert.equal(c.revisions.teaching,p.revisions.teaching);
   const projected=wire(c);projected.rendererHash=p.rendererHash;projected.materialHash=p.materialHash;
   projected.revisions.geometry=p.revisions.geometry;
   assert.deepEqual(projected,wire(p),`${id}: only proven renderer fields vary`);
   unchangedPackets++;
   continue;
  }
  changedTeaching++;
  assert.notDeepEqual(packet.teaching,before.teaching);
  assert.notEqual(c.teachingHash,p.teachingHash);
  assert.notEqual(c.revisions.teaching,p.revisions.teaching);
  assert.deepEqual(packet.teaching.topics.filter((topic:any)=>topic.tab!=='xray'),before.teaching.topics.filter((topic:any)=>topic.tab!=='xray'));
  assert.deepEqual(packet.teaching.lesson,before.teaching.lesson);
  assert.deepEqual(packet.teaching.concept.modelLimit,before.teaching.concept.modelLimit);
  assert.deepEqual(packet.teaching.concept.quiz,before.teaching.concept.quiz);
  const projected=wire(packet.teaching),oldProjected=wire(before.teaching);
  Object.assign(projected.topics.find((topic:any)=>topic.tab==='xray'),oldProjected.topics.find((topic:any)=>topic.tab==='xray'));
  delete projected.concept.imaging.xray;
  delete projected.referenceTitles;delete oldProjected.referenceTitles;
  assert.deepEqual(projected,oldProjected,`${id}: only X-ray teaching varies`);
  assert.deepEqual(Object.keys(packet.teaching.referenceTitles).filter(url=>!Object.hasOwn(before.teaching.referenceTitles,url)).sort(),
   chosen.slice(1).map(key=>refs[key].url).sort());
  assert(c.teachingTabs.includes('xray'));
  assert(!p.teachingTabs.includes('xray'));
  const request=(track:string,delta:any,draft:any)=>new Request('https://review.test/api/nested-review',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_DUCT_XRAY'},
   body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,
    sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],
    checklistVersion:c.checklistVersion,track,expectedVersion:0,draft,...delta})});
  for(const track of ['geometry','teaching']){
   for(const delta of [{materialHash:p.materialHash},{revisionHash:p.revisions[track]},
    {materialHash:w.materialHash},{revisionHash:w.revisions[track]},
    {materialHash:'f'.repeat(64),revisionHash:'f'.repeat(64)}]){
    const response=await live.postNestedReview(request(track,delta,live.blankNestedReview(c,track)),storage);
    assert.equal(response.status,409);
    staleRejected++;
   }
   assert.equal((await live.postNestedReview(request(track,{},
    {...live.blankNestedReview(c,track),status:'approved',attested:true}),storage)).status,422);
   unsupportedRejected++;
  }
  const paths=(value:any,path:(string|number)[]=[]):Array<(string|number)[]>=>[
   path,...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,item])=>paths(item,[...path,key])):[])];
  for(const identity of [parent,target.structure])for(const path of paths(identity)){
   const parentIdentity=identity===parent;
   const bind=(changed:any)=>parentIdentity?live.nestedTeachingFor(changed,target.study,target.structure):
    live.nestedTeachingFor(parent,target.study,changed);
   const node=path.reduce((value:any,key)=>value[key],identity);
   const changed=wire(identity),copy=path.reduce((value:any,key)=>value[key],changed);
   if(node&&typeof node==='object'){
    if(Array.isArray(copy))copy.push('unexpected');else copy.unexpected=true;
   }else{
    const holder=path.slice(0,-1).reduce((value:any,key)=>value[key],changed);
    const key=path.at(-1)!;const value=holder[key];
    holder[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:value===null?'foreign':!value;
   }
   assert.equal(bind(changed),null,`${id}: mutated ${path.join('.')}`);identityRejected++;
   if(path.length){
    const omitted=wire(identity),holder=path.slice(0,-1).reduce((value:any,key)=>value[key],omitted),key=path.at(-1)!;
    if(Array.isArray(holder))holder.splice(Number(key),1);else delete holder[key];
    assert.equal(bind(omitted),null,`${id}: omitted ${path.join('.')}`);identityRejected++;
   }
  }
 }
 assert.deepEqual([nestedPackets,drafts,otherTopics,unchangedPackets,changedTeaching,changedContexts],
  [108,4,968,104,4,108]);
 assert.equal(storageCalls,0);
 assert(identityRejected>0&&staleRejected===40&&unsupportedRejected===8);
 let rootLessons=0,rootPackets=0,rootGeometryContexts=0;
 for(const structure of catalog.structures){
  for(const tab of live.contentTabs){assert.deepEqual(live.bodyLesson(structure,tab),old.bodyLesson(structure,tab));rootLessons++;}
  const material=await live.bodyReviewMaterial(structure.id);
  const beforeMaterial=await boundBefore.bodyReviewMaterial(structure.id);
  assert.deepEqual(material,await old.bodyReviewMaterial(structure.id));
  assert.deepEqual(material,beforeMaterial,`${structure.id}: exact root Review packet`);rootPackets++;
  const context=await live.bodyReviewContext(structure.id);
  const prior=await boundBefore.bodyReviewContext(structure.id);
  assert(context&&prior&&material&&beforeMaterial,structure.id);
  assert.equal(context.sourceHash,material.fingerprints.source);
  assert.equal(context.teachingHash,material.fingerprints.teaching);
  assert.equal(context.materialHash,material.materialHash);
  assert.equal(prior.sourceHash,beforeMaterial.fingerprints.source);
  assert.equal(prior.teachingHash,beforeMaterial.fingerprints.teaching);
  assert.equal(prior.materialHash,beforeMaterial.materialHash);
  assert.equal(context.rendererHash,renderer.sha256);
  assert.equal(prior.rendererHash,oldWebsiteRenderer.sha256);
  assert.notEqual(context.rendererHash,prior.rendererHash);
  assert.equal(context.sourceHash,prior.sourceHash);
  assert.equal(context.teachingHash,prior.teachingHash);
  assert.equal(context.materialHash,prior.materialHash);
  assert.deepEqual(context.checklists,prior.checklists);
  assert.deepEqual(context.blockers,prior.blockers);
  assert.deepEqual(context.teachingTabs,prior.teachingTabs);
  assert.equal(context.revisions.imaging,null);
  assert.equal(context.revisions.teaching,prior.revisions.teaching);
  for(const state of [context,prior]){
   const scope={catalogScope:state.catalogScope,structureId:state.structureId,
    checklistVersion:state.checklistVersion};
   assert.equal(state.revisions.geometry,sha(JSON.stringify({...scope,source:state.sourceHash,
    renderer:state.rendererHash,checks:state.checklists.geometry})),`${structure.id}: root geometry formula`);
  }
  assert.notEqual(context.revisions.geometry,prior.revisions.geometry);
  const projected=wire(context);projected.rendererHash=prior.rendererHash;
  projected.revisions.geometry=prior.revisions.geometry;
  assert.deepEqual(projected,wire(prior),`${structure.id}: only root renderer and geometry revision advance`);
  rootGeometryContexts++;
 }
 assert.deepEqual([rootLessons,rootPackets,rootGeometryContexts],[9936,1104,1104]);
 for(const bundle of catalog.bundles){
  const path='public'+bundle.url.split('?')[0];
  assert.equal(sha(readFileSync(atlas+'/'+path)),bundle.sha256,path);
  assert.deepEqual(readFileSync(atlas+'/'+path),git(previous,path),path);
 }
});
