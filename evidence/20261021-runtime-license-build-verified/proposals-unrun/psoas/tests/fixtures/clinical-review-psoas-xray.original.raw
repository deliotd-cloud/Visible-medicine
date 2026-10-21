import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const atlas='F:/VisibleMedicine/atlas';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const baseline='2fd700948dfa10ec6b5a03c4ed4c6ff9443c387e';
const completedSource='5d34da55a8cab5a9a0751ac0afa56437bee79cb9';
const pinsPath='content/hip-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const teachingPaths=['content/psoas-xray.ts','lib/psoas-xray.ts'];
const sourcePaths=[pinsPath,...teachingPaths];
const expected=new Map([['FMA22342','right'],['FMA22343','left']]);
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const committed=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(value:any)=>boolean,path:string[]=[]):string[][]=>[
 ...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value:any,path:string[])=>path.reduce((part,key)=>part[key],value);

async function currentApi(){
 const compiled=await build({stdin:{contents:[
  "export {psoasXrayLesson} from './atlas-review/lib/psoas-xray';",
  "export * from './atlas-review/content/psoas-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export * from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('exact source psoas X-ray drafts reach the learner and protected Review',async()=>{
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,revision);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 const inputs=json(learnerBase+'source-inputs.json');
 assert.equal(learner.sourceCommit,revision);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(learner.patientDataIncluded,false);
 assert.equal(learner.clinicalApproved,false);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of sourcePaths){
  const bytes=committed(revision,path),digest=sha(bytes);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,`${path}: imported bytes`);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,`${path}: source checkout bytes`);
  assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,digest,
   `${path}: emitted learner source input`);
 }
 assert.deepEqual(committed(revision,pinsPath),committed(baseline,pinsPath),'Original hip pins changed');
 assert.deepEqual(committed(revision,catalogPath),committed(baseline,catalogPath),'Source catalogue changed');
 for(const path of teachingPaths)for(const base of ['public/atlas-review/',learnerBase,viewerBase])
  assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
 const pins=json('atlas-review/'+pinsPath);
 const entries=pins.entries.filter((entry:any)=>expected.has(entry.identity?.fmaId));
 assert.equal(entries.length,2);
 assert.equal(new Set(entries.map((entry:any)=>entry.identity.id)).size,2);
 const api=await currentApi();
 const catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='spine');
 assert(scope,'Spine learner scope');
 const emitted=[emittedTeaching(learnerBase,learner.files,true),
  emittedTeaching(viewerBase,viewer.files,true)];
 const bundles=new Set<string>();
 let refusedIdentities=0;
 for(const {identity,group} of entries){
  assert.equal(group,'iliopsoas');
  const side=expected.get(identity.fmaId);
  assert.equal(identity.name,`${side==='right'?'Right':'Left'} psoas major`);
  assert.equal(identity.id,`vm:anatomy:body:spine:${side}:muscle:${side}-psoas-major`);
  assert.equal(identity.laterality,side);
  assert.equal(identity.region,'spine');
  assert.equal(identity.system,'muscles');
  assert.equal(identity.category,'muscle');
  assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert(scope.regionalIds.includes(identity.id),`${identity.id}: learner scope`);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  bundles.add(identity.bundle);
  const lesson=api.psoasXrayLesson(identity,'xray');
  assert.equal(lesson.readiness,'draft');
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  assert.equal(lesson.title,`${identity.name} · Psoas margin on X-ray · draft`);
  assert.equal(lesson.body,api.psoasXrayTeaching.body);
  assert.deepEqual(lesson.bullets.slice(1),[api.psoasXrayTeaching.variability,
   api.psoasXrayTeaching.interpretation,api.psoasXrayTeaching.comparison]);
  assert.deepEqual(lesson.citations,[...api.psoasXrayReferences]);
  assert.deepEqual(api.bodyContent(identity,'xray'),((({readiness,...content})=>content)(lesson)));
  const prose=[lesson.title,lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/abdominal radiograph|X[- ]ray/i);
  assert.match(prose,/psoas/i);
  assert.match(prose,/fat/i);
  assert.match(prose,/projection/i);
  assert.match(prose,/normal nonvisuali[sz]ation/i);
  assert.match(prose,/missing margin alone does not establish/i);
  assert.match(prose,/preserved margin does not exclude/i);
  assert.match(prose,/cannot distinguish.{0,100}normal variation/i);
  assert.match(lesson.note,/review pending for this exact source and teaching revision/i);
  assert.match(lesson.note,/No imaging study loaded, patient registration or diagnostic decision is supplied/i);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/i);
  assert.doesNotMatch(prose,/approved for clinical use|diagnostic threshold is|registered to (?:a )?patient/i);
  const packet=wire(await api.bodyReviewMaterial(identity.id));
  assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='xray'),{tab:'xray',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,
   ...lesson.citations,lesson.note])assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
  const detached=wire(lesson);
  lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.psoasXrayLesson(identity,'xray'),detached,'Lesson must be detached');
  for(const tab of api.contentTabs)if(tab!=='xray')
   assert.equal(api.psoasXrayLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const changed=wire(identity),parent=at(changed,path.slice(0,-1));
   const key=path.at(-1)!;const original=parent[key];
   parent[key]=typeof original==='string'?original+'-foreign':
    typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.psoasXrayLesson(changed,'xray'),undefined,`${identity.id}: ${path.join('.')}`);
   refusedIdentities++;
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const changed=wire(identity);at(changed,path).push('foreign');
   assert.equal(api.psoasXrayLesson(changed,'xray'),undefined,`${identity.id}: ${path.join('.')}`);
   refusedIdentities++;
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const changed=wire(identity);at(changed,path).unexpected=true;
   assert.equal(api.psoasXrayLesson(changed,'xray'),undefined,`${identity.id}: ${path.join('.')||'<root>'}`);
   refusedIdentities++;
  }
 }
 assert(refusedIdentities>0);
 for(const bundleId of bundles){
  const descriptor=pins.bundles.find((bundle:{id:string})=>bundle.id===bundleId);
  assert(descriptor,`Existing bundle ${bundleId}`);
  const modelPath='public'+descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(atlas+'/'+modelPath),committed(baseline,modelPath),
   `${bundleId}: source model bytes unchanged`);
  const publishedPath=descriptor.url.replace(/^\//,'').split('?')[0];
  assert.equal(learner.files.find((file:{path:string})=>file.path===publishedPath)?.sha256,
   descriptor.sha256,`${bundleId}: learner model manifest`);
  assert.equal(sha(readFileSync(learnerBase+publishedPath)),descriptor.sha256,
   `${bundleId}: delivered model bytes`);
 }
});

test('9,936 placements and 1,104 Review packets change only for two psoas X-ray drafts',async()=>{
 const old=(await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href))
  .exactSourceHistoryApi(baseline,'review-security');
 const [previous,current]=await Promise.all([old,currentApi()]);
 const completed=(await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href))
  .exactSourceHistoryApi(completedSource,'review-security');
 for(const path of sourcePaths)assert.deepEqual(committed(revision,path),committed(completedSource,path),
  `${path}: current psoas source remains exact completed epoch`);
 // Preserve the original complete two-placement transition against its own epoch;
 // later unrelated teaching has its own current checks.
 const live=await completed;
 assert.deepEqual(current.regionalTours.slice(0,-1),live.regionalTours,'Exact completed 47-tour catalogue is the live prefix');
 assert.equal(live.regionalTours.length,47);
 assert.equal(live.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),282);
 assert.equal(current.regionalTours.length,48);
 assert.equal(new Set(current.regionalTours.map((tour:any)=>tour.id)).size,48);
 assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),290);
 assert.equal(current.regionalTours.at(-1).id,'portal-hepatic-venous-relationships');
 assert.equal(current.regionalTours.at(-1).revision,'portal-hepatic-venous-relationships-20261014-r1');
 const catalog=live.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(live.contentTabs,previous.contentTabs);
 assert.deepEqual(live.regionalTours,previous.regionalTours);
 assert.deepEqual(live.structures,previous.structures);
 assert.deepEqual(live.dissectionProfiles,previous.dissectionProfiles);
 assert.equal(catalog.structures.length,1104);
 assert.equal(live.contentTabs.length,9);
 const ids=new Set(json('atlas-review/'+pinsPath).entries.filter((entry:any)=>
  expected.has(entry.identity?.fmaId)).map((entry:any)=>entry.identity.id));
 assert.equal(ids.size,2);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_PSOAS_XRAY'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of live.contentTabs){
   const before=previous.bodyLesson(structure,tab),after=live.bodyLesson(structure,tab);
   placements++;
   if(!ids.has(structure.id)||tab!=='xray'){
    assert.deepEqual(after,before,`${structure.id}|${tab}`);
    assert.equal(current.psoasXrayLesson(structure,tab),undefined,`${structure.id}|${tab}: no leakage`);
    continue;
   }
   changed++;
   assert.equal(before.readiness,'pending',`${structure.id}: previous X-ray`);
   assert.equal(after.readiness,'draft',`${structure.id}: current X-ray`);
   assert.deepEqual(after,current.psoasXrayLesson(structure,tab));
  }
  const before=wire(await previous.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&after,structure.id);
  packets++;
  assert.equal(after.approval,false);
  assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(after,before,`${structure.id}: unrelated Review packet`);
   continue;
  }
  changedPackets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,
   `${structure.id}: current psoas packet preserved`);
  assert.deepEqual(current.bodyLesson(structure,'xray'),live.bodyLesson(structure,'xray'));
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(after[key],before[key],`${structure.id}: ${key}`);
  assert.deepEqual(after.topics.filter((topic:{tab:string})=>topic.tab!=='xray'),
   before.topics.filter((topic:{tab:string})=>topic.tab!=='xray'));
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(after.materialHash,before.materialHash);
  assert.deepEqual(await live.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await live.parseBodyReviewResponse(before,structure.id),null,
   `${structure.id}: old packet refused`);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').citations[0]='https://forged.example';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){
   const forged=wire(after);mutate(forged);
   assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null,
    `${structure.id}: forged packet refused`);
   assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null,
    `${structure.id}: current forged packet refused`);
  }
  const priorContext=await previous.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  const currentContext=await current.bodyReviewContext(structure.id);
  for(const key of ['sourceHash','teachingHash','materialHash','checklistVersion'])
   assert.equal(currentContext[key],context[key],`${structure.id}: current ${key}`);
  assert.equal(currentContext.revisions.teaching,context.revisions.teaching);
  assert(priorContext&&context,structure.id);
  assert.equal(context.sourceHash,priorContext.sourceHash);
  assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(live.bodyReviewStale({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,
   revisionHash:priorContext.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:structure.id,
   track:'teaching',expectedVersion:0,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:live.blankBodyReview(context,'teaching')};
  for(const patch of [{materialHash:priorContext.materialHash},
   {revisionHash:priorContext.revisions.teaching}])
   assert.equal((await live.postBodyDecision(request({...decision,...patch}),storage)).status,409,
    `${structure.id}: stale decision refused before storage`);
  for(const patch of [{materialHash:priorContext.materialHash},
   {revisionHash:priorContext.revisions.teaching}])
   assert.equal((await current.postBodyDecision(request({...decision,...patch}),storage)).status,409,
    `${structure.id}: current stale decision refused before storage`);
  const forgedApproval=wire(decision);forgedApproval.draft.status='approved';
  assert.equal((await live.postBodyDecision(request(forgedApproval),storage)).status,422,
   `${structure.id}: forged approval refused before storage`);
  assert.equal((await current.postBodyDecision(request(forgedApproval),storage)).status,422,
   `${structure.id}: current forged approval refused before storage`);
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,storageCalls},
  {placements:9936,changed:2,preserved:9934,packets:1104,changedPackets:2,
   preservedPackets:1102,storageCalls:0});
});
