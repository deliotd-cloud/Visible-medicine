import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {authenticatedCurrentSource} from './neck-renal-original-context.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const currentReceipt=authenticatedCurrentSource();
const current=currentReceipt.source;
const currentTree=currentReceipt.tree;
const neck='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const renal='4f20ae0b62b9e0dab5936b430575a983dcdd934e';
const renalRevision='renal-organs-arteries-orientation-20261022-source-bound-draft';
const selected=new Map([
  ['vm:anatomy:body:head-neck:midline:bone:hyoid-bone','FMA52749'],
  ['vm:anatomy:body:head-neck:unpaired:organ:epiglottis','FMA55130'],
  ['vm:anatomy:body:head-neck:midline:cartilage:cricoid-cartilage','FMA9615'],
]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(site+'/'+path);
const json=path=>JSON.parse(read(path));
const same=(actual,expected,label)=>assert.deepEqual(structuredClone(actual),structuredClone(expected),label);
const git=(root,...args)=>execFileSync('git',['--no-replace-objects','-C',root,...args],{
  windowsHide:true,maxBuffer:64*1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});
function contract(){
  const pin=validateCurrentAtlasDelivery();
  assert.equal(CURRENT_ATLAS_REVISION,current);
  assert.equal(pin.source,current);assert.equal(pin.sourceTree,currentTree);
  assert.equal(pin.viewerFiles,54);assert.equal(pin.viewerPackages,24);
  const atlas=currentAtlasDeliveryRoot();
  assert.equal(git(atlas,'rev-parse','HEAD').toString().trim(),current,'Authenticated current Atlas HEAD');
  assert.equal(git(atlas,'rev-parse','HEAD^{tree}').toString().trim(),currentTree,'Authenticated current Atlas tree');
  assert.equal(git(atlas,'merge-base',neck,current).toString().trim(),neck,'Neck Atlas commit is an ancestor of current');
  assert.equal(git(atlas,'merge-base',renal,current).toString().trim(),renal,'Renal Atlas commit is an ancestor of current');
  return {pin,atlas};
}
function roleGraph(paths,{atlas}){
  const review=json('atlas-review/manifest.json');
  const binding=json('atlas-review/integration-inputs.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(review.revision,current);assert.equal(binding.sourceCommit,current);
  assert.equal(binding.sha256,validateCurrentAtlasDelivery().reviewIntegration);
  for(const [path,inReview,inRuntime] of paths){
    const record=review.files.filter(row=>row.path===path);
    assert.equal(record.length,1,path+' unique Review source');
    const committed=git(atlas,'show',`${current}:${path}`);
    assert.equal(record[0].sourceSha256,sha(committed),path+' exact Git source');
    assert.equal(record[0].importedSha256,sha(read('atlas-review/'+path)),path+' exact Review import');
    same(binding.inputs.filter(row=>row.path==='atlas-review/'+path),
      inReview?[{path:'atlas-review/'+path,sha256:record[0].importedSha256}]:[],path+' protected integration role');
    same(inputs.filter(row=>row.path===path),
      inRuntime?[{path,sha256:record[0].sourceSha256}]:[],path+' learner role');
  }
}
async function api(){
  const require=createRequire(site+'/package.json'),{build}=require('esbuild');
  const entry=[
    "export {neckLandmarkXrayLesson} from './atlas-review/lib/neck-landmark-xray';",
    "export {neckLandmarkXrayTopics} from './atlas-review/content/neck-landmark-xray';",
    "export {renalTour,renalTourMatches} from './atlas-review/lib/renal-tour';",
    "export {regionalTours,regionalTourStructures,regionalTourStepFrames} from './atlas-review/lib/regional-tours';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  ].join('');
  const built=await build({stdin:{contents:entry,resolveDir:site,loader:'ts'},
    bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
  const module={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,
    crypto,Request,Response,URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone});
  return module.exports;
}
function emitted(base,manifest){
  const files=new Map(manifest.files.map(row=>[row.path,row])),seen=new Set();
  function visit(path){
    if(seen.has(path))return;
    const row=files.get(path);assert(row,'Manifested emitted path '+path);
    const bytes=read(base+path);assert.equal(sha(bytes),row.sha256,path+' emitted bytes');
    seen.add(path);
    for(const match of bytes.toString().matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+match[1]);
  }
  visit('index.html');
  return [...seen].filter(path=>path.endsWith('.js')).map(path=>read(base+path).toString()).join('\n');
}
function hasEmitted(code,text,label){
  assert(code.includes(text)||code.includes(JSON.stringify(text).slice(1,-1)),label+' emitted');
}

test('receipt-bound current neck X-ray identities, source, emitted lessons and Review refusal gates',async()=>{
  const {atlas}=contract();
  roleGraph([
    ['app/body-content.ts',true,true],['lib/neck-landmark-xray.ts',true,true],
    ['content/neck-landmark-xray.ts',true,true],['content/regional-teaching/head-neck.json',true,true],
    ['content/body-review-display-pins.json',true,false],
    ['content/body-renderer-revision.json',false,false],
    ['content/review-revisions.json',false,true],
  ],{atlas});
  for(const path of ['lib/neck-landmark-xray.ts','content/neck-landmark-xray.ts'])
    assert.deepEqual(git(atlas,'show',`${current}:${path}`),git(atlas,'show',`${neck}:${path}`),path+' exact retained neck source');
  const actual=await api();
  const catalog=actual.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(catalog.structures.length,1104);
  same(Object.keys(actual.neckLandmarkXrayTopics).sort(),[...selected.values()].sort(),'Three exact FMA topics');
  const manifest=json('public/atlas-runtime/head-neck/manifest.json');assert.equal(manifest.sourceCommit,current);
  const code=emitted('public/atlas-runtime/head-neck/',manifest);
  let storageCalls=0;
  for(const [id,fma] of selected){
    const structure=catalog.structures.find(row=>row.id===id);assert(structure,id);
    assert.equal(structure.fmaId,fma);
    const lesson=actual.bodyLesson(structure,'xray');assert(lesson,id+' current lesson');
    same(lesson,actual.neckLandmarkXrayLesson(structure,'xray'),id+' exact resolver');
    assert.equal(lesson.readiness,'draft');
    for(const phrase of ['revision-bound radiologist review pending','not patient registration','access remain independent'])
      assert.match(lesson.note,new RegExp(phrase,'i'));
    const {readiness,...shown}=lesson;same(actual.bodyContent(structure,'xray'),shown,id+' rendered body');
    const topic=actual.neckLandmarkXrayTopics[fma];
    same({body:lesson.body,bullets:lesson.bullets,citations:lesson.citations},
      {body:topic.body,bullets:topic.bullets,citations:topic.citations},id+' source content');
    for(const text of [id,lesson.body,...lesson.bullets,...lesson.citations])
      hasEmitted(code,text,id);
    for(const tab of ['anatomy','ct','mri','ultrasound','quiz'])
      assert.equal(actual.neckLandmarkXrayLesson(structure,tab),undefined,id+'/'+tab+' refusal');
    for(const edit of [s=>{s.sources=[];},s=>{s.bounds.min[0]+=.01;},s=>{s.provenance.license='foreign';},
      s=>{s.regions.push('foreign');},s=>{s.laterality='left';}]){
      const forged=structuredClone(structure);edit(forged);
      assert.equal(actual.neckLandmarkXrayLesson(forged,'xray'),undefined,id+' forged identity');
    }
    const packet=await actual.bodyReviewMaterial(id);assert(packet);assert.equal(packet.approval,false);
    same(packet.topics.find(row=>row.tab==='xray'),{tab:'xray',...lesson},id+' Review worksheet');
    assert(await actual.parseBodyReviewResponse(packet,id));
    for(const edit of [p=>{p.approval=true;},p=>{p.topics.find(row=>row.tab==='xray').body+=' forged';}]){
      const forged=structuredClone(packet);edit(forged);
      assert.equal(await actual.parseBodyReviewResponse(forged,id),null,id+' Review tamper refusal');
    }
    const context=await actual.bodyReviewContext(id);
    for(const stale of [{materialHash:'0'.repeat(64)},{revisionHash:'0'.repeat(64)}]){
      const request=new Request('https://atlas.test/api/body-review/decisions',{method:'POST',headers:{
        origin:'https://atlas.test','content-type':'application/json',
        'oai-authenticated-user-id':'SYNTHETIC_NECK_REVIEWER'},body:JSON.stringify({
          catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
          materialHash:context.materialHash,revisionHash:context.revisions.teaching,
          checklistVersion:context.checklistVersion,...stale})});
      const response=await actual.postBodyDecision(request,{prepare(){storageCalls++;throw Error('stale reached storage');}});
      assert.equal(response.status,409,id+' stale before storage');
    }
  }
  assert.equal(storageCalls,0);
  for(const structure of catalog.structures.filter(row=>!selected.has(row.id)))
    assert.equal(actual.neckLandmarkXrayLesson(structure,'xray'),undefined,structure.id+' other-root refusal');
});

test('receipt-bound current renal source, five structures, Review packets, models and notices remain bound',async()=>{
  const {pin,atlas}=contract();
  roleGraph([
    ['lib/renal-tour.ts',true,true],['lib/regional-tours.ts',true,true],
    ['content/renal-tour-pins.json',true,true],['content/body-review-display-pins.json',true,false],
    ['content/body-renderer-revision.json',false,false],
  ],{atlas});
  for(const path of ['lib/renal-tour.ts','content/renal-tour-pins.json'])
    assert.deepEqual(git(atlas,'show',`${current}:${path}`),git(atlas,'show',`${renal}:${path}`),path+' exact retained renal source');
  const actual=await api();
  const catalog=actual.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(catalog.structures.length,1104);
  assert(actual.regionalTours.length>=51,'Current tours contain the 51-tour renal epoch');
  assert.equal(actual.regionalTours.slice(0,51).reduce((n,t)=>n+t.steps.length,0),309);
  assert.equal(actual.renalTour.revision,renalRevision);assert.equal(actual.renalTour.status,'draft');
  assert.equal(actual.renalTourMatches(catalog,actual.renalTour),true);
  const structures=actual.regionalTourStructures(catalog,actual.renalTour);
  assert.equal(structures.length,5);assert.equal(new Set(structures.map(row=>row.id)).size,5);
  assert.equal(actual.regionalTourStepFrames(catalog,actual.renalTour).length,actual.renalTour.steps.length);
  let substitutions=0,packetRefusals=0;
  for(const structure of structures){
    for(const patch of [{fmaId:'FMA-unrelated'},{bounds:{min:[0,0,0],max:[1,1,1]}},
      {sources:[{...structure.sources[0],sha256:'0'.repeat(64)}]}]){
      const forged={...catalog,structures:catalog.structures.map(row=>row.id===structure.id?{...row,...patch}:row)};
      assert.throws(()=>actual.regionalTourStructures(forged,actual.renalTour),/renal guided tour/);substitutions++;
    }
    const packet=await actual.bodyReviewMaterial(structure.id);assert(packet);assert.equal(packet.approval,false);
    assert(await actual.parseBodyReviewResponse(packet,structure.id));
    for(const topic of packet.topics){
      const lesson=actual.bodyLesson(structure,topic.tab);assert(lesson,structure.id+'/'+topic.tab+' rendered lesson');
      same(topic,{tab:topic.tab,...lesson},structure.id+'/'+topic.tab+' current Review body');
      const {readiness,...shown}=lesson;
      same(actual.bodyContent(structure,topic.tab),shown,structure.id+'/'+topic.tab+' current rendered body');
    }
    const index=packet.guidedTours.findIndex(row=>row.tour.id===actual.renalTour.id);assert(index>=0);
    const entry=packet.guidedTours[index];assert.equal(entry.transition,'quintic-orbit');assert.equal(entry.transitionMs,1800);
    for(const edit of [p=>{p.guidedTours[index].tour.revision='stale';},
      p=>{p.guidedTours[index].tour.steps[0].caption+=' altered';},
      p=>{p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64);},
      p=>{p.guidedTours[index].transitionMs=0;},p=>p.guidedTours.splice(index,1)]){
      const forged=structuredClone(packet);edit(forged);
      assert.equal(await actual.parseBodyReviewResponse(forged,structure.id),null,structure.id+' forged packet');packetRefusals++;
    }
  }
  assert.equal(substitutions,15);assert.equal(packetRefusals,25);
  for(const patch of [{license:'unlicensed'},{credit:'changed attribution'},{sourceVersion:'different-source'}])
    assert.equal(actual.renalTourMatches({...catalog,...patch},actual.renalTour),false,'Model/licence source refusal');
  const viewer=json('public/atlas-review-viewer/manifest.json');
  const runtime=json('public/atlas-runtime/head-neck/manifest.json');
  assert.equal(viewer.packages.length,24);assert.equal(viewer.files.length,54);
  assert.equal(viewer.sourceCommit,current);assert.equal(runtime.sourceCommit,current);
  assert.equal(viewer.personalRecordsIncluded,false);assert.equal(runtime.patientDataIncluded,false);
  assert.equal(runtime.clinicalApproved,false);
  const notice=viewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt');assert(notice);
  const noticeBytes=read('public/atlas-review-viewer/'+notice.path);
  assert.equal(sha(noticeBytes),notice.sha256,'All current notices exact bytes');
  const noticeText=noticeBytes.toString('utf8');
  for(const pkg of viewer.packages)
    assert(noticeText.includes(`## ${pkg.name} ${pkg.version} (${pkg.license})`),pkg.name+' licence notice');
  for(const [base,manifest] of [['public/atlas-runtime/head-neck/',runtime],['public/atlas-review-viewer/',viewer]]){
    const code=emitted(base,manifest);
    hasEmitted(code,renalRevision,base+' tour revision');
    hasEmitted(code,'The renal guided tour does not match the available anatomy source.',base+' refusal guard');
  }
  const inventory=json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(row=>row.paths).length,144);
  assert.equal(inventory.models.reduce((n,row)=>n+row.bytes,0),199072480);
  assert.equal(pin.documents['lib/atlas-model-inventory.json'],sha(read('lib/atlas-model-inventory.json')));
  for(const model of inventory.models)for(const path of model.paths){
    assert(path.startsWith('/atlas-runtime/'),'Only declared runtime model paths');
    const bytes=read('public'+path);
    assert.equal(bytes.length,model.bytes,path+' exact model size');
    assert.equal(sha(bytes),model.sha256,path+' exact model bytes');
  }
});
