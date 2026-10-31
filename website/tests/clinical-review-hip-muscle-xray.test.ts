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
const baseline='363dc85cf12b07b380ba5da3b91031dbddc6bd02';
const completedEpoch='6085187c9a8aa39e8e1e9d247bc49022c2b0e580';
const liveCommit=CURRENT_ATLAS_REVISION; // Exact committed, integrated source.
const pinsPath='content/hip-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[pinsPath,'lib/hip-muscle-xray.ts','app/body-content.ts'];
const expected=new Map<string,{id:string;side:string;slug:string}>([
 ['FMA22452',{id:'vm:anatomy:body:thigh:right:muscle:right-adductor-brevis',side:'right',slug:'adductor-brevis'}],
 ['FMA22454',{id:'vm:anatomy:body:thigh:left:muscle:left-adductor-brevis',side:'left',slug:'adductor-brevis'}],
 ['FMA22459',{id:'vm:anatomy:body:thigh:right:muscle:right-adductor-magnus',side:'right',slug:'adductor-magnus'}],
 ['FMA22460',{id:'vm:anatomy:body:thigh:left:muscle:left-adductor-magnus',side:'left',slug:'adductor-magnus'}],
 ['FMA43883',{id:'vm:anatomy:body:thigh:right:muscle:right-gracilis',side:'right',slug:'gracilis'}],
 ['FMA43884',{id:'vm:anatomy:body:thigh:left:muscle:left-gracilis',side:'left',slug:'gracilis'}],
 ['FMA22338',{id:'vm:anatomy:body:thigh:right:muscle:right-quadratus-femoris',side:'right',slug:'quadratus-femoris'}],
 ['FMA22339',{id:'vm:anatomy:body:thigh:left:muscle:left-quadratus-femoris',side:'left',slug:'quadratus-femoris'}],
]);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {hipMuscleXrayLesson} from './atlas-review/lib/hip-muscle-xray';",
  "export {umProximalTopicCompletion} from './atlas-review/content/um-proximal-topic-completion';",
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

test('eight exact hip-muscle X-ray drafts reach both learner modules and protected Review',
 {timeout:180000},async()=>{
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 for(const path of ['lib/hip-muscle-xray.ts','content/um-proximal-topic-completion.ts',pinsPath])
  assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path),'Retain exact authored feature input: '+path);
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:'public/atlas-runtime/'+name+'/',manifest:json('public/atlas-runtime/'+name+'/manifest.json')}));
 for(const item of learners){assert.equal(item.manifest.sourceCommit,runtimeSources[item.name]);assert.equal(item.manifest.patientDataIncluded,false);assert.equal(item.manifest.clinicalApproved,false);}
 assert.deepEqual(committed(liveCommit,pinsPath),committed(baseline,pinsPath));
 assert.deepEqual(committed(liveCommit,catalogPath),committed(baseline,catalogPath));
 const existingNotes='content/um-proximal-topic-completion.ts';
 assert.deepEqual(committed(liveCommit,existingNotes),committed(baseline,existingNotes),'Authored specimen notes remain byte-identical');
 for(const path of sourcePaths){
  const digest=sha(committed(liveCommit,path)),record=review.files.find((f:{path:string})=>f.path===path);assert(record,path);
  assert.equal(record.sourceSha256,digest);assert.equal(record.importedSha256,digest);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest);assert.equal(sha(readFileSync(atlas+'/'+path)),digest);
  for(const {name,base} of learners){const input=json(base+'source-inputs.json').find((f:{path:string})=>f.path===path);
   if(name==='head-neck'||name==='shoulder')assert.equal(input?.sha256,sha(committed(runtimeSources[name],path)),name+': '+path);else assert.equal(input,undefined,name+': closure');}
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])assert.equal(existsSync(base+path),false,'No raw source publicly exposed');
 }
 for(const {name,base,manifest} of learners.filter(item=>item.name==='lower-limb'||item.name==='female-pelvis')){
  for(const input of json(base+'source-inputs.json'))assert.equal(input.sha256,sha(committed(runtimeSources[name],input.path)),name+': family clean source input');
  for(const file of manifest.files.filter((f:{path:string})=>f.path.startsWith('models/'))){assert.equal(file.sha256,sha(readFileSync(base+file.path)));assert.equal(file.sha256,sha(committed(baseline,'public/'+file.path)));}
 }
 const api=await importedApi(),pins=json('atlas-review/'+pinsPath),entries=pins.entries.filter((e:any)=>expected.has(e.identity?.fmaId));
 assert.equal(entries.length,8);assert.deepEqual(new Set(entries.map((e:any)=>e.identity.fmaId)),new Set(expected.keys()));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(item=>emittedTeaching(item.base,item.manifest.files,true)),selected=new Set<string>();
 for(const {identity} of entries){
  const binding=expected.get(identity.fmaId)!;selected.add(identity.id);
  assert.equal(identity.id,binding.id);assert.equal(identity.laterality,binding.side);assert.equal(identity.region,'thigh');assert.equal(identity.system,'muscles');
  assert.equal(identity.validation.status,'unvalidated');assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((s:{id:string})=>s.id===identity.id),identity);
  const authored=api.umProximalTopicCompletion[binding.slug].xray,lesson=api.hipMuscleXrayLesson(identity,'xray');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);assert.equal(lesson.readiness,'draft');assert.equal(lesson.body,authored.body);
  assert.deepEqual(lesson.citations,[...authored.references,'https://acsearch.acr.org/docs/3082587/narrative']);
  assert.match(lesson.bullets.join(' '),/side marker and projection/);assert.match(lesson.bullets.join(' '),/does not establish intact muscle or tendon/);
  assert.match(lesson.bullets.join(' '),/No acquired X-ray.*patient registration/);assert.match(lesson.note,/exact source and teaching revision/);assert.match(lesson.note,/access remain independent/);
  for(const code of emitted)for(const value of [lesson.body,...lesson.citations,lesson.note,...lesson.bullets.slice(1)])assert(visible(code,value),identity.id+': emitted prose');
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');assert.deepEqual(api.hipMuscleXrayLesson(identity,'xray'),clean);
  for(const mutate of [(s:any)=>{s.name+=' foreign';},(s:any)=>{s.sources[0].sha256='0'.repeat(64);},(s:any)=>{s.validation.anatomicalReview=true;},(s:any)=>{delete s.sources;}]){
   const bad=wire(identity);mutate(bad);assert.equal(api.hipMuscleXrayLesson(bad,'xray'),undefined);}
  assert.equal(api.hipMuscleXrayLesson({id:identity.id},'xray'),undefined);
 }
 for(const s of catalog.structures)if(!selected.has(s.id))assert.equal(api.hipMuscleXrayLesson(s,'xray'),undefined);
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
 const shoulderPath='app/anatomy-data.ts',shoulderRecord=json('atlas-review/manifest.json').files.find((f:any)=>f.path===shoulderPath);
 assert(shoulderRecord,'Exact current shoulder teaching source role');
 assert.equal(git(['rev-parse',`${baseline}:${shoulderPath}`]).toString().trim(),
  '5b4ec4ab55685e03eca52a07e0a274ce1a0f9b6c');
 assert.equal(git(['rev-parse',`${completedEpoch}:${shoulderPath}`]).toString().trim(),
  '5b4ec4ab55685e03eca52a07e0a274ce1a0f9b6c','Hip epoch retains original shoulder source');
 assert.equal(git(['rev-parse',`${liveCommit}:${shoulderPath}`]).toString().trim(),
  '9bf87d0a040d909618fdc5b0de1cc85e15dd3292','Later shoulder source epoch');
 assert.equal(shoulderRecord.sourceSha256,sha(committed(liveCommit,shoulderPath)));
 assert.equal(shoulderRecord.importedSha256,sha(readFileSync('atlas-review/'+shoulderPath)));
 assert.deepEqual(readFileSync('atlas-review/'+shoulderPath),committed(liveCommit,shoulderPath),
  'Current shoulder source exactly imported');
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);
 assert.deepEqual(feature.structures,old.structures,'Historical hip X-ray epoch preserves complete original structures');
 assert.notDeepEqual(live.structures,feature.structures,'Later source-authored shoulder teaching is a separate epoch');
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(feature.regionalTours,old.regionalTours,'historical tour catalogue unchanged by hip X-ray');
 assert.deepEqual(current.contentTabs,live.contentTabs);
 assert.deepEqual(live.contentTabs,old.contentTabs);assert.equal(current.contentTabs.length,9);
 const ids=new Set(json('atlas-review/'+pinsPath).entries.filter((entry:any)=>
  expected.has(entry.identity?.fmaId)).map((entry:any)=>entry.identity.id));
 assert.equal(ids.size,8);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_HIP_MUSCLE_REVIEWER'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=feature.bodyLesson(structure,tab),after=live.bodyLesson(structure,tab);
   const imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus source`);
   placements++;
   if(!ids.has(structure.id)||tab!=='xray'){
    assert.deepEqual(historical,before,`${structure.id}:${tab}: historical transition preserved`);
    assert.equal(current.hipMuscleXrayLesson(structure,tab),undefined);
   } else {
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
  assert.deepEqual(after,historical,`${structure.id}:${tab}: current authored target retained`);
    assert.deepEqual(after,current.hipMuscleXrayLesson(structure,tab));
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
  {placements:9936,changed:8,preserved:9928,packets:1104,changedPackets:8,
   preservedPackets:1096,storageCalls:0});
});
