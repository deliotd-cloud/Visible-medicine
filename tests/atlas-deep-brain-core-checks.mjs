import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const baseline='3c0bf9383b9b1668bc51e39340c68d47850f0581';
const revision='6d5caefe7cc90c03c16775126c939ac31956d90e';
const sourceBaseline='398edc60a43f8d0235d9e6963c1ad56954b3fa98';
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const old=path=>execFileSync('git',['show',baseline+':'+path],{windowsHide:true,maxBuffer:32e6});
const common="export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before=await atlasExactGitApi(baseline,common);
const compiled=await build({stdin:{contents:common+"export * from './atlas-review/lib/deep-brain-core-teaching';export * from './atlas-review/content/deep-brain-core-teaching';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const pins=JSON.parse(readFileSync('atlas-review/content/deep-brain-core-teaching-pins.json'));
// Immutable acceptance fixture from Atlas 6d5caefe:content/deep-brain-core-teaching.transition.json.
// The transition is an audit-only source record, not a transitive Review import.
const transition={
 baseline:'398edc60a43f8d0235d9e6963c1ad56954b3fa98',
 sourcePinsHash:'9a054a45f4fc1237c806bcaed6c8df54386d74a06dc78cddb5fcd25fa70ce0ef',
 reason:'Ten exact-source deep-brain evidence-and-limits drafts; unsettled function and source scope remain explicit. No anatomical or clinical approval.',
 entries:[
  {id:'vm:anatomy:body:head-neck:midline:organ:commissure-of-fornix-of-forebrain',fmaId:'FMA61970',tab:'function',draftHash:'4dcc168bc5a79be699094b505a4a0649b9c3622103d41e78613b4d33df2c16ec'},
  {id:'vm:anatomy:body:head-neck:midline:organ:commissure-of-fornix-of-forebrain',fmaId:'FMA61970',tab:'clinical',draftHash:'ac33fec70ea1a47cb439a8a7e073506d754999911c56129cfc4c9a09d9d51bd8'},
  {id:'vm:anatomy:body:head-neck:midline:organ:commissure-of-fornix-of-forebrain',fmaId:'FMA61970',tab:'pathology',draftHash:'71fb08b1f7c6b54bf4e4034da7839f732a7f0edd8fba078648d688f106454864'},
  {id:'vm:anatomy:body:head-neck:midline:organ:septum-of-telencephalon',fmaId:'FMA61842',tab:'function',draftHash:'025ded88cbc8d0c863b6c3702c88ac1a133e71aef121e40c9bce2cd8d5a63e89'},
  {id:'vm:anatomy:body:head-neck:midline:organ:septum-of-telencephalon',fmaId:'FMA61842',tab:'clinical',draftHash:'334c14e879d270ef902e3aa8a4868f35f5455b01eaf2fec43bfbd5d37fa82b8b'},
  {id:'vm:anatomy:body:head-neck:midline:organ:septum-of-telencephalon',fmaId:'FMA61842',tab:'pathology',draftHash:'1204771bf53163795de77c8a0664557b1a024a4874156a9f3500ba94755c657d'},
  {id:'vm:anatomy:body:head-neck:left:organ:left-stria-medullaris-of-thalamus',fmaId:'FMA73414',tab:'clinical',draftHash:'0abfa1840e97bd829cb6917f4a2a2b9357a793324b0c9014633a77fdba3a0f4a'},
  {id:'vm:anatomy:body:head-neck:left:organ:left-stria-medullaris-of-thalamus',fmaId:'FMA73414',tab:'pathology',draftHash:'eb7437625b2a1ff45206139960447fcc27184b973254de4089708ddeb2e06769'},
  {id:'vm:anatomy:body:head-neck:right:organ:right-stria-medullaris-of-thalamus',fmaId:'FMA73413',tab:'clinical',draftHash:'789ab4acde4349e785bf1bb213cd90cc6c883ce33790dd0e72155afe4d4227d7'},
  {id:'vm:anatomy:body:head-neck:right:organ:right-stria-medullaris-of-thalamus',fmaId:'FMA73413',tab:'pathology',draftHash:'7fbad87ff5409fd6946899d280431e7127d0357ac2010fa689c7c3be634549a7'},
 ]
};
assert.equal(hash(pins),'9a054a45f4fc1237c806bcaed6c8df54386d74a06dc78cddb5fcd25fa70ce0ef');
assert.equal(hash(transition),'b44acdd2394354a6ded078668937a188309dc3d10e78eedd6a90818c01ee41c0');
assert.equal(pins.baseline,sourceBaseline);assert.equal(transition.baseline,sourceBaseline);assert.equal(transition.sourcePinsHash,hash(pins));
assert.equal(pins.entries.length,4);assert.equal(transition.entries.length,10);
assert.deepEqual(pins.entries.map(e=>[e.identity.fmaId,e.identity.sources[0].file,e.identity.laterality]),[
 ['FMA61970','FJ1741','midline'],['FMA61842','FJ1832','midline'],['FMA73414','FJ1777','left'],['FMA73413','FJ1824','right']]);

const catalog=now.bodyDisplayCatalog(JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length,1104);assert.equal(catalog.bundles.length,109);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for(const key of ['structures','dissectionProfiles','regionalTours'])assert.deepEqual(now[key],before[key],key);
assert.deepEqual(now.contentTabs,before.contentTabs);assert.equal(now.contentTabs.length,9);
const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));assert.equal(entries.size,4);
const transitions=new Map(transition.entries.map(e=>[e.id+':'+e.tab,e]));assert.equal(transitions.size,10);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(snapshot(before)),pins.beforeAllTeachingSnapshotHash);
const reconstructed=snapshot(now);let changed=0,preserved=0,refusals=0,malformed=0,stale=0,storageCalls=0,worksheets=0;
for(const row of reconstructed.body){
 const s=catalog.structures.find(x=>x.id===row.id),entry=entries.get(s.id);
 for(const tab of now.contentTabs){
  const prior=before.bodyLesson(s,tab),current=now.bodyLesson(s,tab);
  if(entry&&Object.hasOwn(entry.previous,tab)){
   assert.deepEqual(prior,entry.previous[tab]);assert.equal(prior.readiness,'pending');assert.equal(current.readiness,'draft');
   assert.deepEqual(current,now.deepBrainCoreLesson(s,tab));assert.equal(hash(current),transitions.get(s.id+':'+tab)?.draftHash);
   const {readiness,...shown}=current;assert.deepEqual(now.bodyContent(s,tab),shown);
   row.topics[tab]=prior;changed++;
  }else{assert.deepEqual(current,prior,s.id+':'+tab);preserved++;}
 }
}
assert.equal(changed,10);assert.equal(preserved,9926);assert.equal(hash(reconstructed),pins.beforeAllTeachingSnapshotHash);
assert.match(now.deepBrainCoreTeaching.septalSource.function.body,/animal work.*human function unresolved/);
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,part])=>leaves(part,[...path,key]));
for(const {identity,previous,family}of pins.entries){
 assert.deepEqual(catalog.structures.find(s=>s.id===identity.id),identity);
 for(const tab of Object.keys(previous)){
  const lesson=now.deepBrainCoreLesson(identity,tab),original=structuredClone(lesson);
  assert.equal(lesson.readiness,'draft');assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.match(lesson.note,/no patient registration/i);assert.match(lesson.note,/Atlas, case and paid-lecture access remain independent/);
  assert.equal(lesson.body,now.deepBrainCoreTeaching[family][tab].body);
  assert.deepEqual(lesson.citations,now.deepBrainCoreTeaching[family][tab].citations.map(key=>now.deepBrainCoreReferences[key].url));
  lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');assert.deepEqual(now.deepBrainCoreLesson(identity,tab),original);
  for(const path of leaves(identity)){
   const foreign=structuredClone(identity);let parent=foreign;for(const key of path.slice(0,-1))parent=parent[key];
   const key=path.at(-1),value=parent[key];parent[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+.01:value===null?'foreign':!value;
   assert.equal(now.deepBrainCoreLesson(foreign,tab),undefined,path.join('.'));refusals++;
  }
  for(const mutate of [s=>{s.unexpected=true;},s=>{s.sources=[];},s=>{s.sources.push({...s.sources[0]});},s=>{s.regions.push('foreign');}]){
   const foreign=structuredClone(identity);mutate(foreign);assert.equal(now.deepBrainCoreLesson(foreign,tab),undefined);refusals++;
  }
 }
 for(const tab of now.contentTabs.filter(t=>!Object.hasOwn(previous,t)))assert.equal(now.deepBrainCoreLesson(identity,tab),undefined);
 const material=await now.bodyReviewMaterial(identity.id);assert.equal(material.approval,false);assert(await now.parseBodyReviewResponse(material,identity.id));
 for(const tab of Object.keys(previous))assert.deepEqual(material.topics.find(t=>t.tab===tab),{tab,...now.deepBrainCoreLesson(identity,tab)});
 const tab=Object.keys(previous)[0];
 for(const mutate of [x=>{x.topics.find(t=>t.tab===tab).body+=' foreign';},x=>{x.topics.find(t=>t.tab===tab).readiness='approved';},x=>{x.topics.find(t=>t.tab===tab).citations=['https://foreign.example'];},x=>{x.source.structure.sources=[];},x=>{x.topics=x.topics.filter(t=>t.tab!==tab); }]){
  const foreign=structuredClone(material);mutate(foreign);assert.equal(await now.parseBodyReviewResponse(foreign,identity.id),null);malformed++;
 }
 const prior=await before.bodyReviewContext(identity.id),current=await now.bodyReviewContext(identity.id);
 assert.equal(current.sourceHash,prior.sourceHash);assert.notEqual(current.revisions.teaching,prior.revisions.teaching);assert.equal(current.revisions.imaging,null);
 const packet={catalogScope:current.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:current.materialHash,revisionHash:current.revisions.teaching,checklistVersion:current.checklistVersion,draft:now.blankBodyReview(current,'teaching')};
 for(const delta of [{materialHash:prior.materialHash,revisionHash:prior.revisions.teaching},{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching}]){
  const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_DEEP_BRAIN_DRAFT'},body:JSON.stringify({...packet,...delta})}),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
  assert.equal(response.status,409);stale++;
 }
}
assert.equal(refusals,370);assert.equal(malformed,20);assert.equal(stale,12);assert.equal(storageCalls,0);
for(const s of catalog.structures){
 const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 for(const key of ['source','reasoning','guidedTours'])assert.deepEqual(current[key],prior[key]);assert.equal(current.approval,false);
 if(entries.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheets++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);assert.equal(now.deepBrainCoreLesson(s,'clinical'),undefined);}
}
assert.equal(worksheets,4);
for(const bundle of catalog.bundles){const path='public/atlas-runtime/head-neck'+bundle.url.split('?')[0],bytes=readFileSync(path);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(path));}
for(const path of ['package-lock.json','public/atlas-runtime/head-neck/LICENSES/BODYPARTS3D_FULL_BODY.md','atlas-review/app/body-explorer.tsx','atlas-review/lib/imaging-sync.ts','atlas-review/lib/didanix-atlas-adapter.ts','atlas-review/lib/independent-study-links.ts','atlas-review/lib/body-review-context.ts','atlas-review/lib/body-review-api.ts'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
const notice=path=>readFileSync(path,'utf8').replaceAll('\r\n','\n');
const deepBrainNotice=`## Deep-brain teaching (3 October 2026)

Original factual drafts cite Akeret et al. (2022), Postans et al. (online 2019),
Bárány et al. (2024) and Hitti et al. (2022). Article licence declarations are
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); exact reading links and
scope appear in [the teaching record](../docs/DEEP_BRAIN_CORE_TEACHING.md).
No reference prose, image, scan, tractogram, table or dataset is redistributed.
No linked media are admitted. Independently authored wording retains MIT terms;
existing models retain their own unchanged licences. No dependency, font,
texture, geometry, service or mandatory fee is added. Radiologist approval
remains separate and revision-bound.`;
for(const path of ['atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','public/atlas-runtime/head-neck/LICENSES/THIRD_PARTY_NOTICES.md']){
 const beforeNotice=old(path).toString().replaceAll('\r\n','\n'),current=notice(path);
 assert.equal(current,'# Third-party notices\n\n'+deepBrainNotice+'\n\n'+beforeNotice.slice(beforeNotice.indexOf('## ')),path+' only original reference paragraph added');
}
const review=JSON.parse(readFileSync('atlas-review/manifest.json'));assert.equal(review.revision,revision);
const newInputs=['lib/deep-brain-core-teaching.ts','content/deep-brain-core-teaching.ts','content/deep-brain-core-teaching-pins.json'];
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base='public/atlas-runtime/'+name+'/',manifest=JSON.parse(readFileSync(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 for(const file of manifest.files){const bytes=readFileSync(base+file.path);assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
 const beforeInputs=JSON.parse(old(base+'source-inputs.json')),sourceInputs=JSON.parse(readFileSync(base+'source-inputs.json'));
 const added=sourceInputs.filter(x=>!beforeInputs.some(y=>y.path===x.path)).map(x=>x.path).sort();
 assert.deepEqual(added,['head-neck','shoulder'].includes(name)?[...newInputs].sort():[],name+' added inputs');
 for(const path of newInputs){
  const exported=sourceInputs.find(x=>x.path===path),imported=review.files.find(x=>x.path===path);
  assert.equal(Boolean(exported),['head-neck','shoulder'].includes(name),name+':'+path);
  if(exported){assert(imported);assert.equal(exported.sha256,imported.sourceSha256);}
 }
 assert(!sourceInputs.some(x=>x.path==='content/deep-brain-core-teaching.transition.json'));
 if(name==='head-neck'){
  const emitted=emittedTeaching(base,manifest.files,true);
  for(const lessons of Object.values(now.deepBrainCoreTeaching))for(const lesson of Object.values(lessons)){
   assert(emitted.includes(lesson.body));for(const bullet of lesson.bullets)assert(emitted.includes(bullet));
  }
  assert(emitted.includes(now.deepBrainCoreReviewNote));
  for(const ref of Object.values(now.deepBrainCoreReferences))assert(emitted.includes(ref.url));
 }
}
console.log(JSON.stringify({baseline,revision,changed,preserved,sourceMutationRefusals:refusals,malformedPacketsRefused:malformed,staleFingerprintsIndependentlyRefused:stale,storageCalls,changedTeachingWorksheets:worksheets,bundlesUnchanged:catalog.bundles.length,clinicalApproval:false,websiteIntegrated:true}));
