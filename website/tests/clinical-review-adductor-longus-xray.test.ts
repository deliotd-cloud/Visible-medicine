import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const currentPin=validateCurrentAtlasDelivery();
const baseline='8bfca8e7204843a681303b153e30c6105f9da7ba';
const completedEpoch='af90b4afc38d4f18e0ab1d9ac9ef16277761b355';
const liveCommit=CURRENT_ATLAS_REVISION;
const pinsPath='content/hip-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const helperPath='lib/adductor-longus-xray.ts';
const sourcePaths=[pinsPath,helperPath,'app/body-content.ts'];
const caseReport='https://pmc.ncbi.nlm.nih.gov/articles/PMC4397006/';
const expected=new Map<string,{id:string;side:string;file:string}>([
 ['FMA22456',{id:'vm:anatomy:body:thigh:right:muscle:right-adductor-longus',side:'right',file:'FJ1402'}],
 ['FMA22457',{id:'vm:anatomy:body:thigh:left:muscle:left-adductor-longus',side:'left',file:'FJ1402M'}],
]);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(part:any)=>boolean,path:(string|number)[]=[]):
 (string|number)[][]=>[
 ...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value:any,path:(string|number)[])=>path.reduce((part,key)=>part[key],value);

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {adductorLongusXrayLesson} from './atlas-review/lib/adductor-longus-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export * from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm',metafile:true});
 for(const path of sourcePaths)assert(Object.keys(built.metafile.inputs).some(input=>
  input.replaceAll('\\','/').endsWith(path)),`Imported closure omits ${path}`);
 return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('two exact adductor-longus X-ray drafts reach both learner modules and protected Review',
 {timeout:180000},async()=>{
 assert.equal(currentPin.source,liveCommit);
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 assert.deepEqual(committed(liveCommit,helperPath),committed(completedEpoch,helperPath),
  'Exact authored helper bytes retained');
 assert.deepEqual(committed(liveCommit,pinsPath),committed(baseline,pinsPath),'Canonical hip pins unchanged');
 assert.deepEqual(committed(liveCommit,catalogPath),committed(baseline,catalogPath),'Geometry catalogue unchanged');
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
  name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`),
 }));
 const inventory=json('lib/atlas-model-inventory.json');
 for(const {name,base,manifest} of learners){
  const runtimeSource=currentPin.runtimeSources[name];
  assert.equal(manifest.sourceCommit,runtimeSource,name);
  const inventorySource=inventory.sources.find((row:{module:string})=>row.module===name);assert(inventorySource,name);
  assert.equal(inventorySource.sourceCommit,runtimeSource,`${name}: inventory source`);
  assert.equal(inventorySource.manifestSha256,sha(readFileSync(base+'manifest.json')),`${name}: inventory manifest`);
  for(const file of manifest.files.filter((row:{path:string})=>
   /(?:^|\/)(?:LICENSE(?:S)?(?:\/|$)|[^/]*NOTICE[^/]*)/i.test(row.path)))
   assert.equal(sha(readFileSync(base+file.path)),file.sha256,`${name}: notice ${file.path}`);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
 for(const path of sourcePaths){
  const digest=sha(committed(liveCommit,path));
  const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
   if(name==='head-neck'||name==='shoulder'){
    assert(input,`${name}: ${path}`);
    assert.equal(input.sha256,sha(committed(currentPin.runtimeSources[name],path)),`${name}: family ${path}`);
    if(name==='head-neck')assert.equal(input.sha256,digest,`${name}: Review ${path}`);
   }
   else assert.equal(input,undefined,`${name}: independent closure`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 for(const {name,base,manifest} of learners.filter(item=>
  item.name==='lower-limb'||item.name==='female-pelvis')){
  for(const input of json(base+'source-inputs.json'))
   assert.equal(input.sha256,sha(committed(currentPin.runtimeSources[name],input.path)),`${name}: ${input.path}`);
  for(const file of manifest.files.filter((item:{path:string})=>item.path.startsWith('models/'))){
   assert.equal(file.sha256,sha(readFileSync(base+file.path)),`${name}: delivered model`);
   assert.equal(file.sha256,sha(committed(baseline,'public/'+file.path)),`${name}: original model`);
  }
 }
 const pins=json('atlas-review/'+pinsPath);
 const entries=pins.entries.filter((entry:any)=>expected.has(entry.identity?.fmaId));
 assert.equal(entries.length,2);
 assert.deepEqual(new Set(entries.map((entry:any)=>entry.identity.fmaId)),new Set(expected.keys()));
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
  .map(item=>emittedTeaching(item.base,item.manifest.files,true));
 const selected=new Set<string>();
 for(const {identity} of entries){
  const binding=expected.get(identity.fmaId)!;selected.add(identity.id);
  assert.equal(identity.id,binding.id);assert.equal(identity.laterality,binding.side);
  assert.equal(identity.region,'thigh');assert.equal(identity.system,'muscles');
  assert.equal(identity.category,'muscle');assert.equal(identity.sourceTree,'isa');
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[binding.file]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((s:{id:string})=>s.id===identity.id),identity);
  const lesson=api.adductorLongusXrayLesson(identity,'xray');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;
  assert.equal(readiness,'draft');assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert.deepEqual(lesson.citations,[caseReport]);
  assert.match(lesson.body,/single-adult case report/i);
  assert.match(lesson.body,/intramuscular adductor longus rupture without retraction/i);
  assert.match(lesson.body,/does not estimate X-ray sensitivity/i);
  assert.match(lesson.bullets.join(' '),/side marker and projection/i);
  assert.match(lesson.bullets.join(' '),/does not outline this individual muscle or prove tendon continuity/i);
  assert.match(lesson.bullets.join(' '),/No acquired X-ray.*patient registration/i);
  assert.match(lesson.note,/exact source and teaching revision/i);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/i);
  assert.doesNotMatch(JSON.stringify(lesson),/approved for clinical use|registered to a patient/i);
  for(const code of emitted)for(const value of [lesson.body,...lesson.citations,lesson.note,...lesson.bullets])
   assert(visible(code,value),`${identity.id}: emitted teaching`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.adductorLongusXrayLesson(identity,'xray'),clean,'Fresh detached lesson');
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.adductorLongusXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.adductorLongusXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.adductorLongusXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.adductorLongusXrayLesson(omitted,'xray'),undefined,
     `${identity.id}:${[...path,key].join('.')} omitted`);
   }
  }
  assert.equal(api.adductorLongusXrayLesson({id:identity.id},'xray'),undefined);
 }
 for(const structure of catalog.structures)if(!selected.has(structure.id))
  assert.equal(api.adductorLongusXrayLesson(structure,'xray'),undefined);
});

test('immutable 9,936 placement and 1,104 packet transition survives beside current imported delivery',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const feature=await exactSourceHistoryApi(completedEpoch,'review-security');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(feature.structures,old.structures,'Historical adductor admission preserves every structure');
 assert.deepEqual(current.structures,live.structures,'Current Review matches the exact live anatomy source');
 assert.deepEqual(live.structures.map((structure:any)=>structure.id),
  feature.structures.map((structure:any)=>structure.id),'All structure identities and order persist');
 const anatomyPath='app/anatomy-data.ts',anatomyBytes=committed(liveCommit,anatomyPath);
 assert.equal(sha(anatomyBytes),'7cff871e9791c438ceca79b3d6645b2e933d9ab45c2429525f9d707ee5b2f78e',
  'Exact current canonical anatomy source');
 assert.deepEqual(readFileSync('atlas-review/'+anatomyPath),anatomyBytes,
  'Protected Review imports the complete current anatomy source');
 const anatomyRecord=json('atlas-review/manifest.json').files.find((file:{path:string})=>file.path===anatomyPath);
 assert(anatomyRecord);
 assert.equal(anatomyRecord.sourceSha256,sha(anatomyBytes));
 assert.equal(anatomyRecord.importedSha256,sha(anatomyBytes));
 assert.equal(json('atlas-review/integration-inputs.json').inputs.find((file:{path:string})=>
  file.path==='atlas-review/'+anatomyPath)?.sha256,sha(anatomyBytes));
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(feature.regionalTours,old.regionalTours,'historical tour catalogue retained');
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const ids=new Set(json('atlas-review/'+pinsPath).entries.filter((entry:any)=>
  expected.has(entry.identity?.fmaId)).map((entry:any)=>entry.identity.id));
 assert.equal(ids.size,2);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_ADDUCTOR_LONGUS_REVIEWER'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=feature.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus exact current source`);
   placements++;
   if(!ids.has(structure.id)||tab!=='xray'){
    assert.deepEqual(historical,before,`${structure.id}:${tab}: historical placement preserved`);
    assert.equal(current.adductorLongusXrayLesson(structure,tab),undefined);
   }else{
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,historical,`${structure.id}:${tab}: authored content stable`);
    assert.deepEqual(after,current.adductorLongusXrayLesson(structure,tab));
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await feature.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&historical&&after,structure.id);packets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,
   `${structure.id}: complete imported/source Review packet`);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(historical,before,`${structure.id}: historical packet preserved`);
   continue;
  }
  changedPackets++;
  assert.deepEqual(await feature.parseBodyReviewResponse(historical,structure.id),historical);
  assert.equal(await feature.parseBodyReviewResponse(before,structure.id),null);
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
   historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: authored X-ray topic stable`);
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}: historical ${key}`);
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
   {tab:'xray',...live.bodyLesson(structure,'xray')});
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray').citations,[caseReport]);
  assert.match(after.topics.find((row:any)=>row.tab==='xray').body,
   /intramuscular adductor longus rupture without retraction/i);
  assert.equal(historical.fingerprints.source,before.fingerprints.source);
  assert.notEqual(historical.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(historical.materialHash,before.materialHash);
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(after.materialHash,before.materialHash);
  assert.deepEqual(await live.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await live.parseBodyReviewResponse(before,structure.id),null);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations[0]='https://forged.example';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const forged=wire(after);mutate(forged);
   assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);
   assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);
  }
  const previousContext=await old.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  const historicalContext=await feature.bodyReviewContext(structure.id);
  assert.equal(historicalContext.sourceHash,previousContext.sourceHash,
   `${structure.id}: historical source context retained`);
  assert.notEqual(historicalContext.revisions.teaching,previousContext.revisions.teaching);
  assert.equal(context.rendererHash,json('atlas-review/content/body-renderer-revision.json').sha256);
  assert.equal(context.revisions.geometry,sha(JSON.stringify({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,source:context.sourceHash,
   renderer:context.rendererHash,checks:context.checklists.geometry})));
  assert.deepEqual(await current.bodyReviewContext(structure.id),context);
  assert.equal(context.sourceHash,previousContext.sourceHash);
  assert.notEqual(context.revisions.teaching,previousContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(current.bodyReviewStale({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,
   revisionHash:previousContext.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:structure.id,
   track:'teaching',expectedVersion:0,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:current.blankBodyReview(context,'teaching')};
  for(const patch of [{materialHash:previousContext.materialHash},
   {revisionHash:previousContext.revisions.teaching},
   {materialHash:previousContext.materialHash,revisionHash:previousContext.revisions.teaching}])
   assert.equal((await current.postBodyDecision(request({...decision,...patch}),storage)).status,409);
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await current.postBodyDecision(request(forged),storage)).status,422);
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,storageCalls},
  {placements:9936,changed:2,preserved:9934,packets:1104,changedPackets:2,
   preservedPackets:1102,storageCalls:0});
});
