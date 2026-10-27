import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-website';
const nativeFile='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-native/SOURCE_CANDIDATE.json';
const parentFile='F:/VisibleMedicine/staging/20261027-inbox-deferred-return-v2/SOURCE_CANDIDATE.json';
const sourceFile=stage+'/SOURCE_CANDIDATE.json';
const nativeSha='ce861516a2c68803726f9b1222fdf8d403a714960fea67ca8f2fe0e5d66b871a';
const parentSha='fbc8b1cf903fa4e0dc967f4ae66135ed4f5512660113688dc82d82f786fe4a27';
const head='a28d03acf07da97a927073d4794abf3b5ce907f7';
const buffer=Buffer.alloc(65536);
const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const wire=value=>JSON.parse(JSON.stringify(value));
const norm=value=>value.replaceAll('\\','/').replace(/\/$/,'');
assert.equal(hash(nativeFile),nativeSha);
assert.equal(hash(parentFile),parentSha);
const native=json(nativeFile),parent=json(parentFile),source=json(sourceFile);
const site=stage+'/website';
assert.equal(native.head,head);
assert.equal(native.websiteParent.path,parentFile);
assert.equal(native.websiteParent.sha256,parentSha);
assert.equal(source.website,site);
assert.equal(source.atlas,native.atlas);
assert.equal(source.atlasHead,head);
assert.equal(source.parent,parentFile);
assert.equal(source.parentSha256,parentSha);
assert.equal(norm(process.cwd()),site);
assert.equal(execFileSync('git',['-C',native.atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
assert.equal(execFileSync('git',['-C',native.atlas,'status','--porcelain'],{encoding:'utf8',windowsHide:true}).trim(),'');
for(const [root,rows] of [[native.atlas,native.sourceRows],[parent.website,parent.sourceRows],[site,source.sourceRows]])
  for(const row of rows)assert.equal(hash(root+'/'+row.path),row.sha256,root+'/'+row.path);

const {build}=createRequire(site+'/package.json')('esbuild');
async function apiAt(root,current){
  const exports=[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    ...(current?[
      "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
      "export {contentTabs} from './atlas-review/lib/content-types';",
      "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
      "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
      "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
    ]:[]),
  ].join('\n');
  const built=await build({stdin:{contents:exports,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
async function nativeLessonApi(){
  const {build:nativeBuild}=await import(pathToFileURL(native.atlas+'/scripts/workspace-test-build.mjs'));
  const built=await nativeBuild({stdin:{contents:"export {bodyLesson} from './app/body-content';",resolveDir:native.atlas,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const before=await apiAt(parent.website,false),now=await apiAt(site,true),nativeApi=await nativeLessonApi();
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs'));
assert.equal(validateCurrentAtlasDelivery().source,head);
assert.equal(norm(currentAtlasDeliveryRoot()),norm(native.atlas));
const pins=json(native.atlas+'/content/forehead-nerve-ultrasound-pins.json');
assert.deepEqual(json(site+'/atlas-review/content/forehead-nerve-ultrasound-pins.json'),pins);
assert.equal(pins.entries.length,4);
const catalog=now.bodyDisplayCatalog(json(site+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(catalog.structures.length,1104);
assert.equal(now.contentTabs.length,9);
const targets=new Set(pins.entries.map(e=>e.identity.id));assert.equal(targets.size,4);
let unchanged=0;
for(const structure of catalog.structures){
  for(const tab of now.contentTabs){
    if(targets.has(structure.id)&&tab==='ultrasound')continue;
    assert.deepEqual(now.bodyLesson(structure,tab),before.bodyLesson(structure,tab),structure.id+'/'+tab);
    unchanged++;
  }
}
assert.equal(unchanged,9932);
const {emittedTeaching}=await import(pathToFileURL(site+'/tests/atlas-emitted-teaching.ts'));
const emitted=['public/atlas-runtime/head-neck/','public/atlas-review-viewer/'].map(base=>{
  const manifest=json(site+'/'+base+'manifest.json');assert.equal(manifest.sourceCommit,head);
  return emittedTeaching(site+'/'+base,manifest.files,true);
});
const visible=(code,value)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
let worksheets=0,tampered=0,stale=0,storageCalls=0;
for(const {identity} of pins.entries){
  const structure=catalog.structures.find(s=>s.id===identity.id);assert.deepEqual(structure,identity);
  const lesson=now.bodyLesson(structure,'ultrasound');
  assert.equal(before.bodyLesson(structure,'ultrasound').readiness,'pending');
  assert.deepEqual(lesson,nativeApi.bodyLesson(structure,'ultrasound'));
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.citations.length,2);
  assert.match(lesson.note,/revision-bound radiologist sign-off remains pending/i);
  for(const code of emitted)for(const value of [lesson.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
    assert(visible(code,value),identity.id+': emitted lesson missing');
  const old=wire(await before.bodyReviewMaterial(identity.id));
  const packet=wire(await now.bodyReviewMaterial(identity.id));
  const oldContext=await before.bodyReviewContext(identity.id),context=await now.bodyReviewContext(identity.id);
  assert(packet&&old&&context&&oldContext);
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  for(const key of ['source','reasoning','guidedTours','checklist'])assert.deepEqual(packet[key],old[key]);
  assert.equal(packet.fingerprints.source,old.fingerprints.source);
  assert.equal(packet.fingerprints.checklist,old.fingerprints.checklist);
  assert.notEqual(packet.fingerprints.teaching,old.fingerprints.teaching);
  assert.notEqual(packet.materialHash,old.materialHash);
  assert.deepEqual(packet.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  assert.equal(context.sourceHash,oldContext.sourceHash);
  assert.notEqual(context.teachingHash,oldContext.teachingHash);
  assert.notEqual(context.materialHash,oldContext.materialHash);
  assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await now.parseBodyReviewResponse(packet,identity.id),packet);worksheets++;
  assert.equal(await now.parseBodyReviewResponse(old,identity.id),null);
  for(const mutate of [
    p=>{p.topics.find(t=>t.tab==='ultrasound').body+=' altered';},
    p=>{p.topics.find(t=>t.tab==='ultrasound').readiness='approved';},
    p=>{p.source.structure.sources[0].sha256='foreign';},
    p=>{p.fingerprints.teaching='0'.repeat(64);},
    p=>{p.materialHash='0'.repeat(64);},
    p=>{p.approval=true;},
  ]){const forged=wire(packet);mutate(forged);assert.equal(await now.parseBodyReviewResponse(forged,identity.id),null);tampered++;}
  const request={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
    draft:now.blankBodyReview(context,'teaching')};
  for(const changed of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},
    {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){
    const response=await now.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
      body:JSON.stringify({...request,...changed}),
    }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
    assert.equal(response.status,409);assert.equal(storageCalls,0);stale++;
  }
}
assert.equal(worksheets,4);assert.equal(tampered,24);assert.equal(stale,12);
for(const [root,rows] of [[native.atlas,native.sourceRows],[parent.website,parent.sourceRows],[site,source.sourceRows]])
  for(const row of rows)assert.equal(hash(root+'/'+row.path),row.sha256,root+'/'+row.path);
const result={at:new Date().toISOString(),passing:true,source:{path:sourceFile,sha256:hash(sourceFile)},
  native:{path:nativeFile,sha256:nativeSha},parent:{path:parentFile,sha256:parentSha},
  importedLessonsMatchNative:4,otherPlacementsPreserved:unchanged,emittedSurfaces:2,
  currentWorksheetsParsed:worksheets,oldWorksheetsRefused:worksheets,tamperedPacketsRefused:tampered,
  staleDecisionsRefusedBeforeStorage:stale,storageCalls,allSourceBytesUnchanged:true,
  syntheticHandlersOnly:true,clinicalApproval:false,realAccountAcceptance:false,patientSpaceRegistration:false,
  normalPreviewChanged:false};
const out=stage+'/CONTENT_QA.json';fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passing:true,contentQA:out,sha256:hash(out),worksheets,unchanged,tampered,stale}));
