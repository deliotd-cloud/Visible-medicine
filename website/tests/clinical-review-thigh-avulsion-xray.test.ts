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
const baseline='280c701c9cc21c540b7b496f58e2d1c4214e7865';
const completedEpoch='363dc85cf12b07b380ba5da3b91031dbddc6bd02';
const liveCommit=CURRENT_ATLAS_REVISION; // Exact committed, integrated source.
const pinsPath='content/hip-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[pinsPath,'content/thigh-avulsion-xray.ts','lib/thigh-avulsion-xray.ts','app/body-content.ts'];
const expected=new Map<string,{id:string;side:string;kind:string}>([
 ['FMA38928',{id:'vm:anatomy:body:thigh:right:muscle:right-rectus-femoris',side:'right',kind:'rectus'}],
 ['FMA38929',{id:'vm:anatomy:body:thigh:left:muscle:left-rectus-femoris',side:'left',kind:'rectus'}],
 ['FMA22322',{id:'vm:anatomy:body:thigh:right:muscle:right-iliacus',side:'right',kind:'iliacus'}],
 ['FMA22323',{id:'vm:anatomy:body:thigh:left:muscle:left-iliacus',side:'left',kind:'iliacus'}],
 ['FMA22448',{id:'vm:anatomy:body:thigh:right:muscle:right-semimembranosus',side:'right',kind:'semimembranosus'}],
 ['FMA22449',{id:'vm:anatomy:body:thigh:left:muscle:left-semimembranosus',side:'left',kind:'semimembranosus'}],
 ['FMA22358',{id:'vm:anatomy:body:thigh:right:muscle:right-semitendinosus',side:'right',kind:'semitendinosus'}],
 ['FMA22359',{id:'vm:anatomy:body:thigh:left:muscle:left-semitendinosus',side:'left',kind:'semitendinosus'}],
 ['FMA45888',{id:'vm:anatomy:body:thigh:right:muscle:long-head-of-right-biceps-femoris',side:'right',kind:'bicepsLong'}],
 ['FMA45889',{id:'vm:anatomy:body:thigh:left:muscle:long-head-of-left-biceps-femoris',side:'left',kind:'bicepsLong'}],
]);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {thighAvulsionXrayLesson} from './atlas-review/lib/thigh-avulsion-xray';",
  "export * from './atlas-review/content/thigh-avulsion-xray';",
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

test('ten exact hip-pinned thigh structures receive unsigned source-bound X-ray drafts',
 {timeout:180000},async()=>{
 assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must pin __ATLAS_COMMIT__');
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 for(const path of ['content/thigh-avulsion-xray.ts','lib/thigh-avulsion-xray.ts',pinsPath])
  assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path),'Retain exact authored feature input: '+path);
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
  name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`),
 }));
 const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,runtimeSources[name],name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
 assert.deepEqual(committed(liveCommit,pinsPath),committed(baseline,pinsPath),'Original hip pins');
 assert.deepEqual(committed(liveCommit,catalogPath),committed(baseline,catalogPath),'Original geometry catalogue');
 for(const path of sourcePaths){
  const bytes=committed(liveCommit,path),digest=sha(bytes);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,path);assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,`${path}: imported`);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,`${path}: source checkout`);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
   if(name==='head-neck'||name==='shoulder')assert.equal(input?.sha256,sha(committed(runtimeSources[name],path)),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: source closure`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source publicly exposed`);
 }
 // The independent normal modules retain baseline source inputs and model bytes.
 for(const {name,base,manifest} of learners.filter(item=>
  item.name==='lower-limb'||item.name==='female-pelvis')){
  for(const input of json(base+'source-inputs.json'))
   assert.equal(input.sha256,sha(committed(runtimeSources[name],input.path)),`${name}: family source ${input.path}`);
  for(const file of manifest.files.filter((item:{path:string})=>item.path.startsWith('models/'))){
   assert.equal(file.sha256,sha(readFileSync(base+file.path)),`${name}: delivered ${file.path}`);
   assert.equal(file.sha256,sha(committed(baseline,'public/'+file.path)),`${name}: original ${file.path}`);
  }
 }
 const pins=json('atlas-review/'+pinsPath);
 const entries=pins.entries.filter((entry:any)=>expected.has(entry.identity?.fmaId));
 assert.equal(entries.length,10);assert.equal(new Set(entries.map((entry:any)=>entry.identity.id)).size,10);
 assert.deepEqual(new Set(entries.map((entry:any)=>entry.identity.fmaId)),new Set(expected.keys()));
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
  .map(item=>emittedTeaching(item.base,item.manifest.files,true));
 const selected=new Set<string>();
 for(const {identity,group} of entries){
  const binding=expected.get(identity.fmaId)!;selected.add(identity.id);
  assert.equal(group,binding.kind==='rectus'?'rectus':binding.kind==='iliacus'?'iliopsoas':'hamstrings');
  assert.equal(identity.id,binding.id);assert.equal(identity.laterality,binding.side);
  assert.equal(identity.region,'thigh');assert.equal(identity.system,'muscles');
  assert.equal(identity.category,'muscle');assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  const teaching=api.thighAvulsionXrayTeaching[binding.kind];assert(teaching);
  const lesson=api.thighAvulsionXrayLesson(identity,'xray');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · ${teaching.landmark} on X-ray · draft`);
  assert.equal(lesson.body,teaching.body);
  assert.deepEqual(lesson.bullets,[
   `Orient the ${binding.side} reference structure at the ${teaching.landmark.toLowerCase()}. Verify the actual study's side marker and projection; the reference side is not a patient-side match.`,
   teaching.anatomy,teaching.limits,api.thighAvulsionXrayLimits.cohort,
   api.thighAvulsionXrayLimits.comparison]);
  assert.deepEqual(lesson.citations,[...teaching.citations]);
  assert(lesson.citations.length>=2&&lesson.citations.every((url:string)=>url.startsWith('https://pubmed.ncbi.nlm.nih.gov/')));
  assert.equal(lesson.note,api.thighAvulsionXrayLimits.note);
  const {readiness,...content}=lesson;assert.deepEqual(api.bodyContent(identity,'xray'),content);
  const prose=[lesson.title,lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/indirect bony attachment landmark/i);
  assert.match(prose,/does not outline the selected individual (?:iliacus )?muscle/i);
  assert.match(prose,/selected adolescent athletic injury cohorts/i);
  assert.match(prose,/No acquired image/i);
  assert.match(prose,/patient registration/i);
  assert.match(prose,/radiology review pending for this exact source and teaching revision/i);
  assert.match(prose,/Atlas, imaging-case and paid-lecture access remain independent/i);
  if(binding.kind==='rectus')assert.match(prose,/direct.head AIIS attachment distinct from the reflected\/indirect origin/i);
  if(binding.kind==='iliacus')assert.match(prose,/shared iliopsoas insertion region[\s\S]*cannot identify isolated iliacus/i);
  if(binding.kind==='semimembranosus'||binding.kind==='semitendinosus'||binding.kind==='bicepsLong')
   assert.match(prose,/ischial fragment cannot distinguish which proximal hamstring|ischial fragment cannot isolate|do not make an ischial fragment specific/i);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets.slice(1),...lesson.citations,lesson.note,
   'reference structure at the','on X-ray · draft'])
   assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.thighAvulsionXrayLesson(identity,'xray'),clean,'Fresh lesson arrays');
  for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
   assert.equal(api.thighAvulsionXrayLesson(identity,tab),undefined,`${identity.id}:${tab}`);
  for(const mutate of [(bad:any)=>{bad.name+=' foreign';},
   (bad:any)=>{bad.sources[0].sha256='0'.repeat(64);},
   (bad:any)=>{bad.bounds.min[0]+=1;},
   (bad:any)=>{bad.validation.anatomicalReview=true;},
   (bad:any)=>{bad.sources.push(wire(bad.sources[0]));}]){
   const bad=wire(identity);mutate(bad);
   assert.equal(api.thighAvulsionXrayLesson(bad,'xray'),undefined,`${identity.id}: altered identity`);
  }
  assert.equal(api.thighAvulsionXrayLesson({id:identity.id},'xray'),undefined,'ID alone is insufficient');
 }
 for(const structure of catalog.structures)if(!selected.has(structure.id))
  assert.equal(api.thighAvulsionXrayLesson(structure,'xray'),undefined,structure.id);
});

test('all 9,936 teaching placements and 1,104 Review packets preserve the other source epochs',
 {timeout:300000},async()=>{
 assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must pin __ATLAS_COMMIT__');
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const feature=await exactSourceHistoryApi(completedEpoch,'review-security');
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);
 // Preserve the complete original thigh transition, then check the later authored
 // shoulder teaching epoch independently instead of treating it as a thigh edit.
 assert.deepEqual(feature.structures,old.structures,'Thigh authoring retained the preceding shoulder structure content');
 const shoulderEpoch='7978478992f54ea68e0f53c3d195c459c7b80068';
 assert.equal(git(['merge-base',completedEpoch,shoulderEpoch]).toString().trim(),completedEpoch);
 assert.equal(git(['merge-base',shoulderEpoch,liveCommit]).toString().trim(),shoulderEpoch);
 for(const row of [{"path":"app/anatomy-data.ts","sha256":"7cff871e9791c438ceca79b3d6645b2e933d9ab45c2429525f9d707ee5b2f78e"},{"path":"lib/legacy-shoulder-references.ts","sha256":"d7de7f5ffae34b845092277b75e4ec555bf493be36768bb15a5a73b4b7770f82"},{"path":"lib/legacy-shoulder-bone-references.ts","sha256":"11283e70f46cb8e63d0a3acba1bf8c2e9e9699a2d9e88ddc332e0b97857ba649"},{"path":"lib/legacy-shoulder-muscle-references.ts","sha256":"283ec0d7d4fabb4477539ea3a35c08dcea1500e0e59ba7bd078dc6770dbbfc5d"}]){
  assert.equal(sha(committed(shoulderEpoch,row.path)),row.sha256,'Authenticated later shoulder source');
  assert.deepEqual(committed(liveCommit,row.path),committed(shoulderEpoch,row.path),'Current source retains the later shoulder references: '+row.path);
 }
 const referencedShoulder=await exactSourceHistoryApi(shoulderEpoch,'review-security');
 assert.deepEqual(live.structures,referencedShoulder.structures,'Current full shoulder objects match the separately authored source epoch');
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(feature.regionalTours,old.regionalTours,'historical thigh X-ray leaves tours unchanged');
 assert.deepEqual(current.contentTabs,live.contentTabs);
 assert.deepEqual(live.contentTabs,old.contentTabs);assert.equal(current.contentTabs.length,9);
 const ids=new Set(json('atlas-review/'+pinsPath).entries.filter((entry:any)=>
  expected.has(entry.identity?.fmaId)).map((entry:any)=>entry.identity.id));
 assert.equal(ids.size,10);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_THIGH_AVULSION_REVIEWER'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=feature.bodyLesson(structure,tab),after=live.bodyLesson(structure,tab);
   const imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus source`);
   placements++;
   if(!ids.has(structure.id)||tab!=='xray'){
    assert.deepEqual(historical,before,`${structure.id}:${tab}: historical transition preserved`);
    assert.equal(current.thighAvulsionXrayLesson(structure,tab),undefined);
   } else {
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,historical,`${structure.id}:${tab}: current authored target retained`);
    assert.deepEqual(after,current.thighAvulsionXrayLesson(structure,tab));
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await feature.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&historical&&after,structure.id);packets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,`${structure.id}: complete current imported/source packet equality`);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(historical,before,`${structure.id}: historical root Review packet preserved`);
   continue;
  }
  changedPackets++;
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: current target teaching retained`);
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after);
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}: historical ${key}`);
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
   {tab:'xray',...live.bodyLesson(structure,'xray')});
  assert.equal(historical.fingerprints.source,before.fingerprints.source);
  assert.notEqual(historical.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(historical.materialHash,before.materialHash);
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
  assert.equal(historicalContext.sourceHash,previousContext.sourceHash);
  assert.notEqual(historicalContext.revisions.teaching,previousContext.revisions.teaching);
  assert.equal(context.rendererHash,json('atlas-review/content/body-renderer-revision.json').sha256);
  assert.equal(context.revisions.geometry,sha(JSON.stringify({catalogScope:context.catalogScope,structureId:structure.id,
   checklistVersion:context.checklistVersion,source:context.sourceHash,renderer:context.rendererHash,checks:context.checklists.geometry})));
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
  {placements:9936,changed:10,preserved:9926,packets:1104,changedPackets:10,
   preservedPackets:1094,storageCalls:0});
});
