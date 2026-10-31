import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {exactDisplayPinHistory} from './lower-limb-display-pin-history.mjs';

const atlas=currentAtlasDeliveryRoot();
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const priorRevision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const displayHistoryTerminal='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const revision=CURRENT_ATLAS_REVISION;
const reviewIntegration='34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f';
const connectiveIntroduction='0f8944603ba440a4d859f95015e328394c089925';
const connectiveEpoch='a6797b2b0c850edc5f50918c9352c887209eac94';
const connectiveIntegration='f5fcf51b2eaa8cce712e957dc741543146a1ff091cdbd809355439bb5d3a13cf';
const connectiveRenderer='a38b1836eeeaf121b617e357fcb121dd300222a3a639642b1dd75ad04b04ff9e';
const anatomyRevision='0f8944603ba440a4d859f95015e328394c089925';
const parent='c57599c400e5145f16c819b7cb6d9720df989ecf';
const sourcePaths=['content/lower-limb-connective-xray.before.json',
 'content/lower-limb-connective-xray.ts','lib/lower-limb-connective-xray.ts'];
const transitionPath='content/lower-limb-connective-xray.transition.json';
const displayPins='content/body-review-display-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const laterInputs=[
 ['app/body-content.ts','36ea0e11817656450fac642df5594b159bb7531f','3a32173687b094d8a5e5979f7c083869286d87d6'],
 ['lib/body-review-material.ts','5ff48fba8124a45d98fc494ab0253060b7ac2176','3aac9dc280d460249b23ce59ba60ffa8584f9831'],
 ['lib/regional-tours.ts','c832b8cafa2a53a79d244dfa223288b7fd255be6','fb65a9c68d8753fc1789c7e6281e36c2889e0136'],
 ['content/body-review-display-pins.json','3e4081bc0ce0ec8d4eaf73b0a28f78f3e0d0b31c','a7cdda7902c5b3d36d3543643f972ddabbd6e87f'],
] as const;
const expected=new Map([
 ['FMA258847',['achilles','right','leg','FJ1405']],
 ['FMA264844',['achilles','left','leg','FJ1405M']],
 ['FMA58776',['iliotibial','right','thigh','FJ1423']],
 ['FMA58777',['iliotibial','left','thigh','FJ1423M']],
]);
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const hash=(value:unknown)=>sha(JSON.stringify(value));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(commit:string,path:string,cwd=atlas)=>execFileSync('git',['show',`${commit}:${path}`],
 {cwd,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

async function imported(){
 const compiled=await build({stdin:{contents:[
  "export {lowerLimbConnectiveXrayLesson} from './atlas-review/lib/lower-limb-connective-xray';",
  "export {lowerLimbConnectiveXrayTeaching} from './atlas-review/content/lower-limb-connective-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-decisions';",
  "export * from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('four source-bound connective X-ray drafts reach current learner and Review imports',
 {timeout:180000},async()=>{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 const review=json('atlas-review/manifest.json'),viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 const currentPin=validateCurrentAtlasDelivery();
 assert.equal(currentPin.source,revision);
 assert.equal(currentPin.runtimeSources['head-neck'],revision,'Current head runtime follows the exact current Atlas source');
 assert.equal(json('public/atlas-runtime/shoulder/manifest.json').sourceCommit,currentPin.runtimeSources.shoulder,'Shoulder follows its own exact admitted source');
 const originalBytes=readFileSync(new URL('./fixtures/connective-xray-9f-original.test.ts.raw',import.meta.url));
 assert.equal(sha(originalBytes),'45edaee10adc1dd2bcd5da4461832a4878431ac0c3cfca18624c84bf95fcc074','Exact archived connective feature test');
 const priorDeliveryBytes=readFileSync(new URL('./fixtures/review-navigation-delivery/current-atlas-delivery.json.raw',import.meta.url));
 assert.equal(sha(priorDeliveryBytes),'b6301e20b714a67df82575f9f9b75f642fbf44310560444cfb537692bf5cef1f');
 const priorDelivery=JSON.parse(priorDeliveryBytes.toString());
 assert.equal(priorDelivery.source,priorRevision);
 assert.equal(priorDelivery.reviewIntegration,reviewIntegration,'Exact historical190 website binding remains retained');
 assert.equal(review.revision,revision);
 assert.equal(review.websiteIntegrationSha256,currentPin.reviewIntegration);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const [path,oldBlob,currentBlob] of laterInputs){
  assert.equal(execFileSync('git',['rev-parse',`${connectiveEpoch}:${path}`],{cwd:atlas,windowsHide:true}).toString().trim(),oldBlob,path);
  assert.equal(execFileSync('git',['rev-parse',`${priorRevision}:${path}`],{cwd:atlas,windowsHide:true}).toString().trim(),currentBlob,path+' exact historical190 blob');
  const digest=sha(git(revision,path));
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing current ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const learners=['head-neck','shoulder'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
  manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 for(const learner of learners){
  assert.equal(learner.manifest.sourceCommit,currentPin.runtimeSources[learner.name],learner.name);
  assert.equal(learner.manifest.patientDataIncluded,false,learner.name);
  assert.equal(learner.manifest.clinicalApproved,false,learner.name);
 }
 for(const path of sourcePaths){
  const digest=sha(git(revision,path));
  assert.equal(digest,sha(git(connectiveIntroduction,path)),`${path}: original four-draft source retained`);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
   assert.equal(input?.sha256,digest,`${name}: ${path}`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
 }
 assert.deepEqual(git(revision,catalogPath),git(parent,catalogPath),'Source geometry catalogue');
 const before=json('atlas-review/'+sourcePaths[0]),transition=JSON.parse(git(revision,transitionPath).toString());
 assert.equal(sha(readFileSync(atlas+'/'+transitionPath)),sha(git(revision,transitionPath)));
 assert.equal(existsSync('atlas-review/'+transitionPath),false,'Git provenance is not a runtime import');
 assert.equal(hash(before),'33d97db4dafd3d936b2ed517a3db93c4cd3d2772fa209cc7d4d9eedd4930b66d');
 assert.equal(before.parentCommit,parent);
 assert.equal(transition.parentCommit,parent);
 assert.equal(transition.beforeHash,hash(before));
 assert.equal(before.otherPlacements,9932);
 assert.equal(transition.otherPlacements,9932);
 for(const flag of ['clinicalApproval','imagesImported','patientRegistration'])
  assert.equal(transition[flag],false,flag);
 assert.equal(before.entries.length,4);
 assert.equal(transition.entries.length,4);
 const selected=new Map<string,any>();
 for(const entry of before.entries){
  const [group,side,region,file]=expected.get(entry.identity.fmaId)??[];
  assert.equal(entry.group,group,entry.identity.fmaId);
  assert.equal(entry.identity.laterality,side);
  assert.equal(entry.identity.region,region);
  assert.equal(entry.identity.sources[0].file,file);
  assert.equal(entry.identity.validation.status,'unvalidated');
  assert.equal(entry.identity.validation.anatomicalReview,false);
  assert.equal(entry.previous.readiness,'pending');
  selected.set(entry.identity.id,entry);
 }
 assert.equal(selected.size,4);
 assert.deepEqual(new Set(before.entries.map((entry:any)=>entry.identity.fmaId)),new Set(expected.keys()));
 const live=await imported();
 const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await history.exactSourceHistoryApi(parent,'review-security');
 assert.equal(execFileSync('git',['rev-parse',`${connectiveIntroduction}^`],{cwd:atlas,windowsHide:true}).toString().trim(),parent);
 assert.equal(execFileSync('git',['rev-parse',`${connectiveEpoch}^`],{cwd:atlas,windowsHide:true}).toString().trim(),connectiveIntroduction);
 assert.equal(execFileSync('git',['merge-base',historicalRevision,revision],{cwd:atlas,windowsHide:true}).toString().trim(),historicalRevision);
 const rendererPath='content/body-renderer-revision.json';
 const sourceRenderer=JSON.parse(git(connectiveEpoch,rendererPath).toString());
 assert.equal(hash({source:sourceRenderer.sha256,website:connectiveIntegration}),connectiveRenderer);
 const boundRenderer={...sourceRenderer,sha256:connectiveRenderer,
  sourceRendererSha256:sourceRenderer.sha256,websiteIntegrationSha256:connectiveIntegration};
 const epoch=await history.exactSourceHistoryApi(connectiveEpoch,'review-security',
  {[rendererPath]:JSON.stringify(boundRenderer)});
 const catalog=live.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 assert.equal(live.contentTabs.length,9);
 assert.equal(hash(catalog),before.catalogHash);
 assert.equal(hash(epoch.structures),before.shoulderHash,'Historical structure identity remains exact at the connective epoch');
 assert.equal(hash(epoch.dissectionProfiles),before.dissectionHash,'Historical dissection profiles remain exact at the connective epoch');
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(git(parent,catalogPath).toString())));
 assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.deepEqual(epoch.bodyDisplayCatalog(JSON.parse(git(connectiveEpoch,catalogPath).toString())),catalog);
 assert.deepEqual(epoch.contentTabs,old.contentTabs);
 assert.deepEqual(epoch.regionalTours,old.regionalTours);
 assert.notDeepEqual(live.regionalTours,epoch.regionalTours,'Later guided tours are current source changes');
 const teaching=live.lowerLimbConnectiveXrayTeaching;
 const emitted=[...learners.map(({base,manifest})=>emittedTeaching(base,manifest.files,true)),
  emittedTeaching(viewerBase,viewer.files,true)];
 let changed=0,changedPackets=0,preservedPackets=0;
 const unchanged:any[]=[];
 for(const structure of catalog.structures){
  const entry=selected.get(structure.id);
  if(entry)assert.deepEqual(structure,entry.identity,`${structure.id}: complete source identity`);
  for(const tab of live.contentTabs){
   const previous=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);
   if(!entry||tab!=='xray'){
    assert.deepEqual(historical,previous,`${structure.id}|${tab}: preserved at connective epoch`);
    assert.equal(live.lowerLimbConnectiveXrayLesson(structure,tab),undefined);
    unchanged.push([structure.id,tab,historical]);
    continue;
   }
   const lesson=live.bodyLesson(structure,tab);
   changed++;
   assert.deepEqual(previous,entry.previous,structure.id);
   assert.deepEqual(lesson,historical,`${structure.id}: current X-ray lesson retained`);
   assert.equal(lesson.readiness,'draft');
   assert.deepEqual(lesson,live.lowerLimbConnectiveXrayLesson(structure,tab));
   assert.equal(hash(lesson),transition.entries.find((row:any)=>row.id===structure.id)?.lessonHash);
   assert.equal(lesson.body,teaching[entry.group].body);
   assert.deepEqual(lesson.bullets,teaching[entry.group].bullets);
   assert.deepEqual(lesson.citations,teaching[entry.group].references);
   assert.deepEqual(live.bodyContent(structure,tab),((({readiness,...shown}:any)=>shown)(lesson)));
   assert.match(lesson.note,/revision-bound radiologist review pending/i);
   assert.match(lesson.note,/unvalidated/i);
   assert.match(lesson.note,/No X-ray image, patient-space registration, validated projection or linked imaging study/i);
   assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/i);
   for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
    assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${structure.id}: emitted ${value}`);
  }
  const previous=wire(await old.bodyReviewMaterial(structure.id));
  const historicalPacket=wire(await epoch.bodyReviewMaterial(structure.id));
  const packet=entry?wire(await live.bodyReviewMaterial(structure.id)):historicalPacket;
  const priorContext=await old.bodyReviewContext(structure.id);
  const historicalContext=await epoch.bodyReviewContext(structure.id);
  const context=entry?await live.bodyReviewContext(structure.id):historicalContext;
  if(entry){
   assert.deepEqual(historicalPacket.topics.find((topic:any)=>topic.tab==='xray'),
    {tab:'xray',...epoch.bodyLesson(structure,'xray')},`${structure.id}: introduction-era X-ray topic`);
   assert.equal(historicalPacket.approval,false);
   assert.equal(historicalPacket.status,'worksheet-not-submitted');
   assert.deepEqual(packet.topics.find((topic:any)=>topic.tab==='xray'),
    historicalPacket.topics.find((topic:any)=>topic.tab==='xray'),`${structure.id}: retained current X-ray topic`);
   assert.equal(packet.materialHash,context.materialHash);
   assert.equal(historicalPacket.materialHash,historicalContext.materialHash);
  }
  assert.equal(context.sourceHash,priorContext.sourceHash);
  assert.notEqual(context.rendererHash,priorContext.rendererHash,`${structure.id}: renderer advanced`);
  assert.notEqual(context.revisions.geometry,priorContext.revisions.geometry,
   `${structure.id}: geometry worksheet advanced with renderer`);
  assert.equal(context.revisions.imaging,null);
  if(!entry){
   assert.deepEqual(historicalPacket,previous,`${structure.id}: complete unchanged worksheet packet at connective epoch`);
   for(const key of ['source','topics','reasoning','guidedTours','checklist','atlasLink','limits'])
    assert.deepEqual(packet[key],previous[key],`${structure.id}: preserved ${key}`);
   assert.equal(packet.fingerprints.source,previous.fingerprints.source);
   assert.equal(packet.fingerprints.teaching,previous.fingerprints.teaching);
   assert.equal(packet.materialHash,previous.materialHash);
   assert.equal(context.teachingHash,priorContext.teachingHash);
   assert.equal(context.revisions.teaching,priorContext.revisions.teaching);
   preservedPackets++;continue;
  }
  changedPackets++;
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historicalPacket[key],previous[key],`${structure.id}: introduction ${key}`);
  assert.deepEqual(historicalPacket.topics.filter((topic:any)=>topic.tab!=='xray'),
   previous.topics.filter((topic:any)=>topic.tab!=='xray'));
  assert.deepEqual(historicalPacket.topics.find((topic:any)=>topic.tab==='xray'),
   {tab:'xray',...epoch.bodyLesson(structure,'xray')});
  assert.deepEqual(packet.topics.find((topic:any)=>topic.tab==='xray'),
   {tab:'xray',...live.bodyLesson(structure,'xray')});
  assert.equal(historicalPacket.fingerprints.source,previous.fingerprints.source);
  assert.notEqual(historicalPacket.fingerprints.teaching,previous.fingerprints.teaching);
  assert.notEqual(historicalPacket.materialHash,previous.materialHash);
  assert.equal(packet.fingerprints.source,previous.fingerprints.source);
  assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching);
  assert.notEqual(packet.materialHash,previous.materialHash);
  assert.deepEqual(await epoch.parseBodyReviewResponse(historicalPacket,structure.id),historicalPacket);
  assert.equal(await epoch.parseBodyReviewResponse(previous,structure.id),null,'Old packet refused at introduction epoch');
  assert.deepEqual(await live.parseBodyReviewResponse(packet,structure.id),packet);
  assert.equal(await live.parseBodyReviewResponse(previous,structure.id),null,'Old packet refused');
  for(const mutate of [
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').citations[0]='https://forged.invalid';},
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').readiness='approved';},
   (bad:any)=>{bad.source.structure.sources=[];},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await live.parseBodyReviewResponse(bad,structure.id),null);}
  assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  const storage={prepare(){throw Error('Rejected request reached private storage');}};
  const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,
   checklistVersion:context.checklistVersion,draft:live.blankBodyReview(context,'teaching')};
  const request=(payload:unknown)=>new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
    'oai-authenticated-user-id':'synthetic-connective-xray-reviewer'},body:JSON.stringify(payload)});
  assert.equal((await live.postBodyDecision(request({...decision,materialHash:priorContext.materialHash}),storage)).status,409);
  assert.equal((await live.postBodyDecision(request({...decision,revisionHash:priorContext.revisions.teaching}),storage)).status,409);
  const forged=wire(decision);forged.draft.status='approved';
  assert.equal((await live.postBodyDecision(request(forged),storage)).status,422);
 }
 assert.equal(changed,4);
 assert.equal(unchanged.length,9932);
 assert.equal(hash(unchanged),before.otherTeachingHash,'All other teaching placements exact');
 assert.equal(changedPackets,4);
 assert.equal(preservedPackets,1100);
 const oldPins=JSON.parse(git(parent,displayPins).toString());
 const pins=json('atlas-review/'+displayPins);
  assert.deepEqual(git(connectiveEpoch,displayPins),git(anatomyRevision,displayPins),
   'UI renderer epoch preserves the anatomy milestone display pins');
  assert.equal(sha(readFileSync('atlas-review/'+displayPins)),sha(git(revision,displayPins)),
   'Imported display pins match current Atlas source');
 const epochPins=JSON.parse(git(connectiveEpoch,displayPins).toString());
 const oldById=new Map(oldPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 const epochById=new Map(epochPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 const newById=new Map(pins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 assert.equal(oldById.size,1104);assert.equal(epochById.size,1104);assert.equal(newById.size,1104);
 assert.deepEqual(new Set(epochById.keys()),new Set(oldById.keys()));
 assert.deepEqual(new Set(newById.keys()),new Set(epochById.keys()));
 const changedPins=[...epochById].filter(([id,digest])=>digest!==oldById.get(id)).map(([id])=>id);
 assert.deepEqual(new Set(changedPins),new Set(selected.keys()),'Exactly four regenerated display pins');
 const priorPins=JSON.parse(git(priorRevision,displayPins).toString());
 const priorById=new Map(priorPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 assert.equal(priorById.size,1104);
 assert.deepEqual(new Set(priorById.keys()),new Set(newById.keys()));
 // Preserve the original587-pin theorem at its exact190a source, not today's source.
 const currentChangedPins=[...priorById].filter(([id,digest])=>digest!==epochById.get(id)).map(([id])=>id).sort();
 assert.equal(currentChangedPins.length,587,'Later source history changes 587 display pins');
 assert.equal(hash(currentChangedPins),'822b7c8cf271907325f6d90e1f0499fd1d4affe5c144a8fef95c4480065c22ef',
  'Exact later changed-pin ID set');
 const terminalPins=git(displayHistoryTerminal,displayPins);
 assert.deepEqual(git(revision,displayPins),terminalPins,'Current source retains the exact authenticated terminal display-pin document');
 assert.deepEqual(readFileSync('atlas-review/'+displayPins),terminalPins,'Current Review import retains the exact authenticated terminal display pins');
 const displayHistory=exactDisplayPinHistory({readGit:git,revision:displayHistoryTerminal,currentBytes:terminalPins});
 assert.deepEqual(displayHistory.currentById,newById,'Current imported display pins retain their complete exact source history');
 const sincePrior=[...displayHistory.colicById].filter(([id,digest])=>digest!==priorById.get(id)).map(([id])=>id).sort();
 assert.deepEqual(sincePrior,[
  'vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery',
  'vm:anatomy:body:abdomen:right:vessel:right-colic-artery',
 ],'Only the two exact later colic teaching display pins differ from historical190');
 assert.equal(hash(sincePrior),'67764eea6c280f5875a97203563de86019840415d92a80dc1ce97d8bb0486ff9');
});
