import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {atlas9fReviewHistory,FIRST_DELIVERY} from './atlas9f-review-history.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const historicalRevision=FIRST_DELIVERY;
const revision=CURRENT_ATLAS_REVISION;
const parent='a6797b2b0c850edc5f50918c9352c887209eac94';
const ringDelivery='f3d6966a040b69a375f6bbfa2a8c502b8c8492e4';
const ringTourBlob='c832b8cafa2a53a79d244dfa223288b7fd255be6';
const firstDeliveryTourBlob='fb65a9c68d8753fc1789c7e6281e36c2889e0136';
const currentTourBlob='d7ba177194a8d8671c7e3c8f6336e169e4ca2be6';
const sourcePaths=['content/orbital-ring-ct.ts','lib/orbital-ring-ct.ts'];
const pinPath='content/orbital-support-mri-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const expected=new Map([
 ['vm:anatomy:body:head-neck:left:tendon:left-common-tendinous-ring',
  {fma:'FMA49073',file:'FJ1291',side:'left',material:'2980ba38b1acbeef89920fe9d4f0669fd564e2e5f1b962413d5d90998aa8890e'}],
 ['vm:anatomy:body:head-neck:right:tendon:right-common-tendinous-ring',
  {fma:'FMA49072',file:'FJ1342',side:'right',material:'55551c727af64d4002f2920d086721ce78eceeb7d8b4a59199684c623bcd976c'}],
]);
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

async function imported(){
 const compiled=await build({stdin:{contents:[
  "export {orbitalRingCtLesson} from './atlas-review/lib/orbital-ring-ct';",
  "export {orbitalRingCtTopic,orbitalRingCtReferences,orbitalRingCtScope,orbitalRingCtNote} from './atlas-review/content/orbital-ring-ct';",
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

test('two exact orbital-ring CT drafts reach learner and private Review bindings',
 {timeout:180000},async()=>{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 assert.equal(execFileSync('git',['merge-base',historicalRevision,revision],{cwd:atlas,windowsHide:true}).toString().trim(),historicalRevision);
 assert.equal(execFileSync('git',['rev-parse',ringDelivery+'^'],{cwd:atlas,windowsHide:true}).toString().trim(),parent);
 assert.equal(execFileSync('git',['merge-base',ringDelivery,historicalRevision],{cwd:atlas,windowsHide:true}).toString().trim(),ringDelivery);
 for(const [commit,blob] of [[parent,ringTourBlob],[ringDelivery,ringTourBlob],
  [historicalRevision,firstDeliveryTourBlob],[revision,currentTourBlob]])
  assert.equal(execFileSync('git',['rev-parse',commit+':lib/regional-tours.ts'],{cwd:atlas,windowsHide:true}).toString().trim(),blob);
 assert.notEqual(currentTourBlob,firstDeliveryTourBlob,'Later current tours have their own source epoch');
 const review=json('atlas-review/manifest.json'),viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(review.revision,revision);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
  manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 for(const learner of learners){
  assert.equal(learner.manifest.sourceCommit,runtimeSources[learner.name],learner.name);
  assert.equal(learner.manifest.patientDataIncluded,false,learner.name);
  assert.equal(learner.manifest.clinicalApproved,false,learner.name);
 }
 for(const path of [...sourcePaths,pinPath]){
  const digest=sha(git(revision,path));
  assert.deepEqual(git(revision,path),git(historicalRevision,path),`${path}: first-delivery source retained`);
  assert.deepEqual(git(revision,path),git(ringDelivery,path),`${path}: ring-introduction source retained`);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
   assert.equal(input?.sha256,sha(git(runtimeSources[name],path)),`${name}: ${path}`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
 }
 assert.deepEqual(git(revision,pinPath),git(parent,pinPath),'Immutable MRI identity pins');
 assert.deepEqual(git(revision,catalogPath),git(parent,catalogPath),'Source geometry catalogue');
 const pins=json('atlas-review/'+pinPath);
 const selected=new Map<string,any>();
 for(const entry of pins.entries.filter((row:any)=>row.family==='ring')){
  const identity=entry.identity,required=expected.get(identity.id);
  assert(required,identity.id);
  assert.equal(identity.fmaId,required.fma);
  assert.equal(identity.nodeName,required.fma);
  assert.equal(identity.laterality,required.side);
  assert.equal(identity.region,'head-neck');
  assert.equal(identity.category,'tendon');
  assert.equal(identity.system,'connective');
  assert.deepEqual(identity.sources.map((row:any)=>row.file),[required.file]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  selected.set(identity.id,identity);
 }
 assert.equal(selected.size,2);
 assert.deepEqual(new Set(selected.keys()),new Set(expected.keys()));
 const current=await imported(),firstDelivery=await atlas9fReviewHistory();
 const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await history.exactSourceHistoryApi(parent,'review-security');
 const ringEpoch=await history.exactSourceHistoryApi(ringDelivery,'review-security');
 // The complete original transition is parent -> ring introduction, not 9f -> 190.
 // The five ring-specific exports are byte-identical across ring, 9f and current190.
 const live={...ringEpoch,
  orbitalRingCtLesson:current.orbitalRingCtLesson,
  orbitalRingCtNote:current.orbitalRingCtNote,
  orbitalRingCtReferences:current.orbitalRingCtReferences,
  orbitalRingCtScope:current.orbitalRingCtScope,
  orbitalRingCtTopic:current.orbitalRingCtTopic};
 for(const name of ['bodyContent','bodyDisplayCatalog','bodyLesson','bodyReviewContext',
  'bodyReviewMaterial','parseBodyReviewResponse','postBodyDecision','blankBodyReview',
  'regionalTours','structures','dissectionProfiles','contentTabs'])
  for(const [epoch,api] of [['ring',ringEpoch],['first delivery',firstDelivery]] as const)
   assert(Object.hasOwn(api,name),`${epoch} Review replay supplies ${name}`);
 assert.equal(ringEpoch.regionalTours.length,48);
 assert.equal(ringEpoch.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),290);
 assert.equal(firstDelivery.regionalTours.length,51);
 assert.equal(firstDelivery.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),309);
 for(const identity of selected.values()){
  for(const patch of [{name:'Forged ring'},{fmaId:'FMA0'},
   {sources:[...identity.sources,...identity.sources]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(live.orbitalRingCtLesson({...identity,...patch},'ct'),undefined,
    `${identity.id}: exact source identity required`);
  for(const tab of ['mri','xray','ultrasound','clinical','pathology'])
   assert.equal(live.orbitalRingCtLesson(identity,tab),undefined,`${identity.id}: CT only`);
 }
 const catalog=live.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 assert.equal(live.contentTabs.length,9);
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(git(parent,catalogPath).toString())));
 assert.deepEqual(live.structures,old.structures);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(live.regionalTours,old.regionalTours);
 assert.deepEqual(live.contentTabs,old.contentTabs);
 const emitted=[...learners.map(({base,manifest})=>emittedTeaching(base,manifest.files,true)),
  emittedTeaching(viewerBase,viewer.files,true)];
 const topic=live.orbitalRingCtTopic;
 assert.equal(topic.readiness,'draft');
 assert.deepEqual(topic.citations,Object.values(live.orbitalRingCtReferences));
 let changed=0,preserved=0,changedPackets=0,preservedPackets=0;
 let malformed=0,stale=0,forgedSaves=0,forgedApprovals=0,storageCalls=0;
 for(const structure of catalog.structures){
  const selectedIdentity=selected.get(structure.id);
  if(selectedIdentity)assert.deepEqual(structure,selectedIdentity,`${structure.id}: complete source identity`);
  for(const tab of live.contentTabs){
   const previous=old.bodyLesson(structure,tab),lesson=live.bodyLesson(structure,tab);
   if(selectedIdentity&&tab==='ct'){
    assert.equal(previous.readiness,'pending');
    assert.deepEqual(lesson,live.orbitalRingCtLesson(structure,tab));
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${structure.name} · CT orientation · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets,[live.orbitalRingCtScope,...topic.bullets]);
    assert.deepEqual(lesson.citations,topic.citations);
    assert.equal(lesson.note,live.orbitalRingCtNote);
    assert.deepEqual(live.bodyContent(structure,tab),((({readiness,...shown}:any)=>shown)(lesson)));
    const prose=[lesson.title,lesson.body,...lesson.bullets,lesson.note].join(' ');
    assert.match(prose,/optic canal/i);
    assert.match(prose,/optic strut/i);
    assert.match(prose,/superior orbital fissure/i);
    assert.match(prose,/direct.*CT|CT.*direct/i);
    assert.match(prose,/disput|disagree|variab/i);
    assert.match(prose,/revision-bound radiologist review and sign-off are pending/i);
    assert.match(prose,/Atlas, imaging-case and paid-lecture access remain independent/i);
    assert.doesNotMatch(prose,/approved for clinical use|routine CT (?:shows|depicts|resolves|visualizes) the ring/i);
    for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
     assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${structure.id}: emitted ${value}`);
    changed++;
   }else{
    assert.deepEqual(lesson,previous,`${structure.id}|${tab}: preserved`);
    assert.equal(live.orbitalRingCtLesson(structure,tab),undefined);
    preserved++;
   }
  }
  const previousPacket=wire(await old.bodyReviewMaterial(structure.id));
  const packet=wire(await live.bodyReviewMaterial(structure.id));
  const priorContext=await old.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.equal(context.sourceHash,priorContext.sourceHash);
  assert.notEqual(context.rendererHash,priorContext.rendererHash,`${structure.id}: renderer epoch advanced`);
  assert.notEqual(context.revisions.geometry,priorContext.revisions.geometry,`${structure.id}: geometry worksheet epoch advanced`);
  assert.equal(context.revisions.imaging,null);
  if(!selectedIdentity){
   assert.deepEqual(packet,previousPacket,`${structure.id}: complete preserved Review packet`);
   assert.equal(context.teachingHash,priorContext.teachingHash);
   assert.equal(context.revisions.teaching,priorContext.revisions.teaching);
   preservedPackets++;
   continue;
  }
  const id=structure.id,required=expected.get(id)!;
  assert.equal(packet.materialHash,required.material,`${id}: exact source-derived worksheet hash`);
  assert.deepEqual(Object.keys(packet).sort(),Object.keys(previousPacket).sort());
  for(const key of Object.keys(previousPacket).filter(key=>!['topics','fingerprints','materialHash'].includes(key)))
   assert.deepEqual(packet[key],previousPacket[key],`${id}:${key}`);
  for(const key of Object.keys(previousPacket.fingerprints).filter(key=>key!=='teaching'))
   assert.deepEqual(packet.fingerprints[key],previousPacket.fingerprints[key],`${id}:fingerprints.${key}`);
  assert.deepEqual(packet.topics,previousPacket.topics.map((row:any)=>row.tab==='ct'
   ?{tab:'ct',...live.bodyLesson(structure,'ct')}:row));
  assert.notEqual(packet.fingerprints.teaching,previousPacket.fingerprints.teaching);
  assert.notEqual(packet.materialHash,previousPacket.materialHash);
  assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.deepEqual(await live.parseBodyReviewResponse(packet,id),packet);
  assert.equal(await live.parseBodyReviewResponse(previousPacket,id),null);
  for(const edit of [
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').body+=' forged';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').bullets[0]+=' forged';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').citations[0]='https://forged.invalid';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').readiness='approved';},
   (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='ct'),1);},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){
   const bad=wire(packet);edit(bad);
   assert.equal(await live.parseBodyReviewResponse(bad,id),null);
   malformed++;
  }
  const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,
   checklistVersion:context.checklistVersion,draft:live.blankBodyReview(context,'teaching')};
  const save=async(input:unknown)=>live.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
    'oai-authenticated-user-id':'synthetic-orbital-ring-ct-reviewer'},body:JSON.stringify(input)}),
   {prepare(){storageCalls++;throw Error('Rejected decision reached private storage');}});
  const anonymous=new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json'},
   body:JSON.stringify(decision)});
  assert.equal((await live.postBodyDecision(anonymous,
   {prepare(){storageCalls++;throw Error('Anonymous decision reached private storage');}})).status,401);
  for(const hashes of [
   {materialHash:priorContext.materialHash,revisionHash:priorContext.revisions.teaching},
   {materialHash:priorContext.materialHash},{revisionHash:priorContext.revisions.teaching},
  ]){assert.equal((await save({...decision,...hashes})).status,409);stale++;}
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await save(forged)).status,422);forgedSaves++;
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await save(approval)).status,422);forgedApprovals++;
  changedPackets++;
 }
 assert.deepEqual([changed,preserved,changedPackets,preservedPackets],[2,9934,2,1102]);
 assert.deepEqual([malformed,stale,forgedSaves,forgedApprovals,storageCalls],[12,6,2,2,0]);
 const oldPins=JSON.parse(git(parent,'content/body-review-display-pins.json').toString());
 const newPins=JSON.parse(git(ringDelivery,'content/body-review-display-pins.json').toString());
 const firstDeliveryPins=JSON.parse(git(historicalRevision,'content/body-review-display-pins.json').toString());
 const currentPins=json('atlas-review/content/body-review-display-pins.json');
 assert.equal(sha(readFileSync('atlas-review/content/body-review-display-pins.json')),
  sha(git(revision,'content/body-review-display-pins.json')),'Current imported display pins match committed source');
 const oldById=new Map(oldPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 const newById=new Map(newPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 assert.equal(oldById.size,1104);assert.equal(newById.size,1104);
 assert.deepEqual(new Set(newById.keys()),new Set(oldById.keys()));
 const changedPins=[...newById].filter(([id,digest])=>digest!==oldById.get(id)).map(([id])=>id);
 assert.deepEqual(new Set(changedPins),new Set(selected.keys()),'Exactly two CT display pins change');
 const currentById=new Map(currentPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 const firstDeliveryById=new Map(firstDeliveryPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
 for(const id of selected.keys()){
  assert.equal(firstDeliveryById.get(id),newById.get(id),`${id}: first delivery retains ring pin`);
  assert.equal(currentById.get(id),newById.get(id),`${id}: current190 retains ring pin`);
 }
 const currentSource=await boundLiveAtlasHistory(revision);
 assert.deepEqual(current.regionalTours,currentSource.regionalTours,'Current imported Review tours match the bound current source');
 for(const id of selected.keys()){
  const identity=selected.get(id)!;
  assert.deepEqual(firstDelivery.bodyLesson(identity,'ct'),live.bodyLesson(identity,'ct'),
   `${id}: first-delivery ring lesson retained`);
  const firstPacket=wire(await firstDelivery.bodyReviewMaterial(id));
  assert.equal(firstPacket.approval,false);
  assert.deepEqual(await firstDelivery.parseBodyReviewResponse(firstPacket,id),firstPacket,
   `${id}: independent 9f-bound packet accepted`);
  assert.deepEqual(current.bodyLesson(identity,'ct'),currentSource.bodyLesson(identity,'ct'),`${id}: current lesson`);
  assert.deepEqual(current.bodyLesson(identity,'ct'),live.bodyLesson(identity,'ct'),`${id}: historic ring CT retained`);
  assert.deepEqual(wire(await current.bodyReviewMaterial(id)),wire(await currentSource.bodyReviewMaterial(id)),
   `${id}: current Review packet`);
 }
 const headNeck=learners.find(item=>item.name==='head-neck')!;
 for(const bundle of catalog.bundles){
  const sourcePath='public'+bundle.url.split('?')[0];
  const emittedPath=bundle.url.split('?')[0].slice(1);
  const record=headNeck.manifest.files.find((file:{path:string})=>file.path===emittedPath);
  assert(record,`${emittedPath}: registered in head-neck learner`);
  const bytes=readFileSync(headNeck.base+emittedPath);
  assert.equal(sha(bytes),record.sha256,emittedPath);
  assert.equal(record.sha256,bundle.sha256,emittedPath);
  assert.deepEqual(bytes,git(revision,sourcePath),`${emittedPath}: GLB unchanged`);
 }
});
