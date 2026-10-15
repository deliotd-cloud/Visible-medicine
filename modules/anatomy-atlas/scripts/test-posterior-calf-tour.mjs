import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline='38f225ff2d4b6cd0f2e4434c0a2d3a759f1af875';
const helperPath='lib/posterior-calf-tour.ts';
const registryPath='lib/regional-tours.ts';
const pinPath='content/posterior-calf-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const working=process.argv.length===3&&process.argv[2]==='--working-transition';
assert(working||process.argv.length===2,'Only --working-transition is accepted');
const git=args=>execFileSync('git',args,{windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const gitBytes=(commit,path)=>git(['show',`${commit}:${path}`]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(git(['rev-parse',`${baseline}^{commit}`]).toString().trim(),baseline);
let introduction;
if(working){
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),baseline,'Working transition requires exact baseline HEAD');
  assert.equal(git(['ls-files','--others','--exclude-standard','--',helperPath]).toString().trim(),helperPath,
    'Working helper must be untracked');
}else{
  introduction=git(['log','--diff-filter=A','--format=%H','--',helperPath]).toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(introduction??'',/^[a-f0-9]{40}$/,'Immutable helper introduction commit');
  assert.equal(git(['merge-base',baseline,introduction]).toString().trim(),baseline);
  assert.equal(git(['merge-base',introduction,'HEAD']).toString().trim(),introduction);
  for(const path of [helperPath,pinPath])
    assert.deepEqual(readFileSync(path),gitBytes(introduction,path),`${path}: immutable introduced source`);
}
const pinBytes=readFileSync(pinPath);
const pins=JSON.parse(pinBytes);
assert.equal(sha(Buffer.from(JSON.stringify(pins))),
  '1f38b42ba1fc54fdb58a90ebcbae64b77bdcf6227794e64f2dfb43e2764cb41f');
assert.equal(pins.schemaVersion,1);
assert.equal(pins.baseline,baseline);
assert.equal(pins.tourRevision,'right-posterior-calf-20261015-r1');
assert.deepEqual(pins.scopeRegions,['leg','foot']);
assert.deepEqual(pins.entries.map(x=>[x.fmaId,x.sources[0].file]),[
  ['FMA45957','FJ1397'],['FMA45960','FJ1394'],['FMA22558','FJ1437'],
  ['FMA258847','FJ1405'],['FMA24497','FJ3360']]);
assert.deepEqual(pins.contextEntries.map(x=>[x.fmaId,x.sources[0].file]),
  [['FMA24477','FJ3387'],['FMA24480','FJ3366']]);
assert.deepEqual(pins.bundles.map(x=>x.id).sort(),
  ['foot-skeleton','leg-connective-gaps','leg-muscles','leg-muscles-dissection','leg-skeleton']);
const selected=pins.entries,context=pins.contextEntries,records=[...selected,...context];
const resolvedRecords=[...context,...selected]; // Resolver includes faded context before step targets.
const participants=new Set(records.map(x=>x.id));
assert.equal(participants.size,7);
assert.equal(selected[4].region,'foot');
assert.deepEqual(selected[4].regions,['foot']);
assert(records.every(x=>x.laterality==='right'&&x.validation.status==='unvalidated'&&
  x.validation.anatomicalReview===false));
assert.deepEqual(readFileSync(catalogPath),gitBytes(baseline,catalogPath),'No catalog replacement');
for(const bundle of pins.bundles){
  const path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(sha(bytes),bundle.sha256);
  assert.deepEqual(bytes,gitBytes(baseline,path),`${bundle.id}: baseline geometry bytes`);
}

const entry=`export * from './lib/posterior-calf-tour';
export {bodyLesson,bodyContent} from './app/body-content';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export * from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';
export const catalog=bodyDisplayCatalog(raw as any);`;
const compiled=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm'});
const live=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old=await exactSourceHistoryApi(baseline,'regional-tour-review');
const feature=working?live:await exactSourceHistoryApi(introduction,'regional-tour-review');
const wholeEpoch=working||git(['rev-parse','HEAD']).toString().trim()===introduction;
const tour=feature.regionalTours.find(x=>x.id==='right-posterior-calf-achilles-orientation');
assert(tour,'posteriorCalfTour must be registered');
assert.deepEqual(tour,live.posteriorCalfTour,'Immutable introduced tour matches the current helper');
assert.equal(tour.id,'right-posterior-calf-achilles-orientation');
assert.equal(tour.title,'Right calf to heel: Achilles complex');
assert.equal(tour.revision,pins.tourRevision);
assert.equal(tour.region,'whole-body');
assert.deepEqual(tour.scopeRegions,['leg','foot']);
assert.equal(tour.status,'draft');
assert.equal(tour.steps.length,5);
assert.deepEqual(tour.contextIds,context.map(x=>x.id));
assert.deepEqual(tour.steps.map(x=>x.selectedId),selected.map(x=>x.id));
assert.deepEqual(tour.steps.map(x=>x.view),['left','posterior','posterior','posterior','left']);
assert.deepEqual(tour.steps.map(x=>x.frameIds),selected.map(x=>[x.id]));
assert.equal(new Set(tour.steps.map(x=>x.id)).size,5);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(records.map(x=>[x.id,x.bundle])));
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/';
const refs=new Set(tour.steps.flatMap(x=>x.references));
assert(refs.has(anatomy+'muscles_lowerlimb.html'));
assert(refs.has(anatomy+'bones_lowerlimb.html'));
for(const step of tour.steps){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert(step.title.trim()&&step.caption.trim()&&step.references.length);
  assert(step.references.every(x=>x.startsWith('https://')));
}
assert.match(tour.limitations,/radiologist.*(sign.off|review)|revision.bound.*radiologist/i);
assert.match(tour.limitations,/registration/i);
assert.match(tour.limitations,/subtendon/i);
assert.doesNotMatch([tour.description,...tour.steps.map(x=>x.caption)].join(' '),
  /approved for clinical|patient.registered|connected subtendon|contract(?:ion|ing) simulated/i);

const sourceCatalog=feature.catalog;
assert.equal(sourceCatalog.structures.length,1104);
assert.equal(sourceCatalog.structures.length*feature.contentTabs.length,9936);
assert.deepEqual(sourceCatalog,old.catalog);
assert.deepEqual(feature.structures,old.structures);
assert.deepEqual(feature.dissectionProfiles,old.dissectionProfiles);
assert.deepEqual(feature.contentTabs,old.contentTabs);
assert.deepEqual(sourceCatalog.structures.filter(x=>participants.has(x.id)).sort((a,b)=>a.id.localeCompare(b.id)),
  [...records].sort((a,b)=>a.id.localeCompare(b.id)));
assert.deepEqual(feature.regionalTours.filter(x=>x.id!==tour.id),old.regionalTours);
assert.deepEqual(feature.regionalTours.slice(0,50),old.regionalTours);
assert.equal(old.regionalTours.length,50);
assert.equal(old.regionalTours.reduce((n,x)=>n+x.steps.length,0),304);
assert.equal(feature.regionalTours.length,51);
assert.equal(feature.regionalTours.reduce((n,x)=>n+x.steps.length,0),309);
assert.deepEqual(feature.regionalToursFor('whole-body').filter(x=>x.id===tour.id),[tour]);
assert.deepEqual(feature.regionalToursFor('leg').filter(x=>x.id===tour.id),[]);
assert.deepEqual(feature.regionalToursFor('foot').filter(x=>x.id===tour.id),[],
  'A cross-region tour is selected from whole-body, not by relabeling the foot');
for(const region of sourceCatalog.regions)
  assert.equal(feature.regionalTourFor(region.id)?.id,old.regionalTourFor(region.id)?.id);
assert.equal(live.posteriorCalfTourMatches(sourceCatalog,tour),true);
assert.deepEqual(feature.regionalTourStructures(sourceCatalog,tour),resolvedRecords);
if(wholeEpoch){
  assert.deepEqual(live.regionalTours,feature.regionalTours);
  assert.deepEqual(live.catalog,sourceCatalog);
  assert.deepEqual(live.structures,feature.structures);
  assert.deepEqual(live.dissectionProfiles,feature.dissectionProfiles);
  assert.deepEqual(live.contentTabs,feature.contentTabs);
}
const frames=feature.regionalTourStepFrames(sourceCatalog,tour);
assert.equal(frames.length,5);
for(const [index,step] of tour.steps.entries()){
  assert.deepEqual(feature.regionalTourFrame(sourceCatalog,tour,index),frames[index]);
  const bounds=selected[index].bounds,frame=frames[index];
  assert(frame.min.every(Number.isFinite)&&frame.max.every(Number.isFinite));
  assert(bounds.min.every((v,axis)=>v>=frame.min[axis]&&bounds.max[axis]<=frame.max[axis]));
}

let sourceRefusals=0;
const refuse=(catalog=sourceCatalog,candidate=tour)=>{
  assert.equal(live.posteriorCalfTourMatches(catalog,candidate),false);
  assert.throws(()=>feature.regionalTourStructures(catalog,candidate));
  sourceRefusals++;
};
const pathsWhere=(value,predicate,path=[])=>[
  ...(predicate(value)?[path]:[]),
  ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
    pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value,path)=>path.reduce((part,key)=>part[key],value);
for(const record of records){
  refuse({...sourceCatalog,structures:sourceCatalog.structures.filter(x=>x.id!==record.id)});
  refuse({...sourceCatalog,structures:[...sourceCatalog.structures,record]});
  refuse({...sourceCatalog,structures:[...sourceCatalog.structures,{...record,id:record.id+'-alias'}]});
  for(const path of pathsWhere(record,value=>value===null||typeof value!=='object')){
    const bad=structuredClone(record),parent=at(bad,path.slice(0,-1)),key=path.at(-1),value=parent[key];
    parent[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:
      value===null?'foreign':!value;
    refuse({...sourceCatalog,structures:sourceCatalog.structures.map(x=>x.id===record.id?bad:x)});
  }
  for(const path of pathsWhere(record,Array.isArray)){
    const bad=structuredClone(record);at(bad,path).push('foreign');
    refuse({...sourceCatalog,structures:sourceCatalog.structures.map(x=>x.id===record.id?bad:x)});
  }
  for(const path of pathsWhere(record,value=>value&&typeof value==='object'&&!Array.isArray(value))){
    const bad=structuredClone(record);at(bad,path).unexpected=true;
    refuse({...sourceCatalog,structures:sourceCatalog.structures.map(x=>x.id===record.id?bad:x)});
    for(const key of Object.keys(at(record,path))){
      const omitted=structuredClone(record);delete at(omitted,path)[key];
      refuse({...sourceCatalog,structures:sourceCatalog.structures.map(x=>x.id===record.id?omitted:x)});
    }
  }
  for(const path of pathsWhere(record,value=>Array.isArray(value)&&value.length>1)){
    const values=at(record,path),second=values.findIndex((x,i)=>i>0&&JSON.stringify(x)!==JSON.stringify(values[0]));
    if(second<0)continue;
    const bad=structuredClone(record),array=at(bad,path);
    [array[0],array[second]]=[array[second],array[0]];
    refuse({...sourceCatalog,structures:sourceCatalog.structures.map(x=>x.id===record.id?bad:x)});
  }
}
for(const bundle of pins.bundles){
  refuse({...sourceCatalog,bundles:sourceCatalog.bundles.filter(x=>x.id!==bundle.id)});
  refuse({...sourceCatalog,bundles:[...sourceCatalog.bundles,bundle]});
  refuse({...sourceCatalog,bundles:sourceCatalog.bundles.map(x=>x.id===bundle.id?{...x,sha256:'0'.repeat(64)}:x)});
}
for(const patch of [{sourceVersion:'foreign'},{license:'foreign'},
  {coordinateSystem:{...sourceCatalog.coordinateSystem,unitsPerMillimetre:1}}])
  refuse({...sourceCatalog,...patch});
for(const mutate of [x=>x.steps.reverse(),x=>{x.title+=' forged';},
  x=>{x.steps[0].caption+=' forged';},x=>{x.steps[0].references=['https://example.invalid/'];},
  x=>{x.steps[0].view='anterior';},x=>{x.steps[0].durationMs=1;},
  x=>{x.steps[0].frameIds=[context[0].id];},x=>{x.steps[0].selectedId=context[0].id;},
  x=>{x.contextIds=[];},x=>{x.requiredDisplayBundles[selected[0].id]='foreign';},
  x=>{x.revision+='-forged';}]){
  const candidate=structuredClone(tour);mutate(candidate);refuse(sourceCatalog,candidate);
}

let changed=0,unchanged=0,topics=0,packetRefusals=0,stale=0,forgedSave=0,forgedApproval=0,storageCalls=0;
const request=value=>new Request('https://atlas.test/api/body-decisions',{method:'POST',
  headers:{origin:'https://atlas.test','content-type':'application/json',
    'oai-authenticated-user-id':'SYNTHETIC_POSTERIOR_CALF_TOUR'},body:JSON.stringify(value)});
const storage={prepare(){storageCalls++;throw Error('Rejected decision reached storage');}};
for(const structure of sourceCatalog.structures){
  const prior=await old.bodyReviewMaterial(structure.id);
  const now=await feature.bodyReviewMaterial(structure.id);
  const previous=await old.bodyReviewContext(structure.id);
  const current=await feature.bodyReviewContext(structure.id);
  assert.equal(now.approval,false);
  assert.deepEqual(now.source,prior.source);
  assert.deepEqual(now.topics,prior.topics);
  assert.deepEqual(now.reasoning,prior.reasoning);
  assert.deepEqual(now.guidedTours.filter(x=>x.tour.id!==tour.id),prior.guidedTours);
  assert.deepEqual(now.guidedTours,feature.regionalTourEvidence(sourceCatalog,structure.id));
  assert.deepEqual(await feature.parseBodyReviewResponse(now,structure.id),now);
  topics+=now.topics.length;
  if(wholeEpoch&&!working)assert.deepEqual(await live.bodyReviewMaterial(structure.id),now);
  if(!participants.has(structure.id)){
    assert.deepEqual(now,prior);
    assert.equal(current.teachingHash,previous.teachingHash);
    assert.equal(current.revisions.teaching,previous.revisions.teaching);
    unchanged++;continue;
  }
  changed++;
  assert.equal(now.guidedTours.length,prior.guidedTours.length+1);
  assert.equal(current.sourceHash,previous.sourceHash);
  assert.notEqual(current.teachingHash,previous.teachingHash);
  assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
  const index=now.guidedTours.findIndex(x=>x.tour.id===tour.id),evidence=now.guidedTours[index];
  assert(index>=0);
  assert.deepEqual(evidence.tour,tour);
  assert.deepEqual(evidence.structures,resolvedRecords);
  assert.deepEqual(evidence.stepFrames,frames);
  assert.deepEqual(Object.fromEntries(evidence.bundles.map(x=>[x.id,x])),
    Object.fromEntries(pins.bundles.map(x=>[x.id,x])));
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  for(const mutate of [x=>x.guidedTours.splice(index,1),
    x=>x.guidedTours.push(structuredClone(evidence)),x=>x.guidedTours[index].tour.steps.reverse(),
    x=>{x.guidedTours[index].tour.steps[0].caption+=' forged';},
    x=>{x.guidedTours[index].tour.steps[0].frameIds=[context[0].id];},
    x=>{x.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64);},
    x=>{x.guidedTours[index].bundles[0].sha256='0'.repeat(64);},
    x=>{x.guidedTours[index].stepFrames[0].min[0]-=1;},
    x=>{x.guidedTours[index].transition='linear';},
    x=>{x.guidedTours[index].transitionMs=0;},x=>{x.guidedTours[index].separation=1;}]){
    const forged=structuredClone(now);mutate(forged);
    assert.equal(await feature.parseBodyReviewResponse(forged,structure.id),null);packetRefusals++;
  }
  const livePacket=await live.bodyReviewMaterial(structure.id);
  const liveContext=await live.bodyReviewContext(structure.id);
  const liveEvidence=livePacket.guidedTours.find(x=>x.tour.id===tour.id);
  assert(liveEvidence,'Current selected source remains bound to the tour');
  assert.deepEqual(liveEvidence.tour,live.posteriorCalfTour);
  assert.deepEqual(liveEvidence.structures,resolvedRecords);
  assert.deepEqual(liveEvidence.stepFrames,live.regionalTourStepFrames(live.catalog,live.posteriorCalfTour));
  assert.deepEqual(await live.parseBodyReviewResponse(livePacket,structure.id),livePacket);
  assert.equal(await live.parseBodyReviewResponse(prior,structure.id),null);
  for(const mutate of [x=>x.guidedTours.splice(x.guidedTours.findIndex(e=>e.tour.id===tour.id),1),
    x=>{x.guidedTours.find(e=>e.tour.id===tour.id).tour.revision+='-forged';},
    x=>{x.guidedTours.find(e=>e.tour.id===tour.id).structures[0].bounds.min[0]-=1;},
    x=>{x.guidedTours.find(e=>e.tour.id===tour.id).bundles[0].sha256='0'.repeat(64);},
    x=>{x.guidedTours.find(e=>e.tour.id===tour.id).stepFrames[0].max[0]+=1;}]){
    const forged=structuredClone(livePacket);mutate(forged);
    assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);packetRefusals++;
  }
  const payload={catalogScope:liveContext.catalogScope,structureId:structure.id,track:'teaching',
    expectedVersion:0,materialHash:previous.materialHash,revisionHash:previous.revisions.teaching,
    checklistVersion:liveContext.checklistVersion,draft:live.blankBodyReview(liveContext,'teaching')};
  assert.equal((await live.postBodyDecision(request(payload),storage)).status,409);stale++;
  payload.materialHash=liveContext.materialHash;
  payload.revisionHash=liveContext.revisions.teaching;
  const foreign=structuredClone(payload);foreign.draft.checks.foreign=true;
  assert.equal((await live.postBodyDecision(request(foreign),storage)).status,422);forgedSave++;
  payload.draft.status='approved';
  assert.equal((await live.postBodyDecision(request(payload),storage)).status,422);forgedApproval++;
}
for(const structure of live.catalog.structures){
  const packet=await live.bodyReviewMaterial(structure.id);
  assert.deepEqual(await live.parseBodyReviewResponse(packet,structure.id),packet,
    `${structure.id}: current parser accepts current source`);
}
assert.deepEqual({changed,unchanged,topics},{changed:7,unchanged:1097,topics:9936});
assert.deepEqual({stale,forgedSave,forgedApproval,storageCalls},{stale:7,forgedSave:7,forgedApproval:7,storageCalls:0});
console.log(JSON.stringify({baseline,introduction,working,wholeEpoch,tours:51,stops:309,
  participants:7,unchangedPackets:unchanged,unchangedTopics:topics,sourceRefusals,packetRefusals,
  staleRefusalsBeforeStorage:stale,forgedSaveRefusalsBeforeStorage:forgedSave,
  forgedApprovalRefusalsBeforeStorage:forgedApproval,storageCalls,clinicalApproval:false}));
