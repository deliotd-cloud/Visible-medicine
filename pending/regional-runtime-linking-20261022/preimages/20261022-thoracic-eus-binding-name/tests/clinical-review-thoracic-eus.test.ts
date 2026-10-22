import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const historicalRuntimeRevision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const priorRevision='b03ba458907946c1b1c152149ee5867f8d6a62df';
const baseline='c3593e6664e8572d882bd19d4525dea0f3d00d17';
const id='vm:anatomy:body:thorax:unspecified:vessel:azygos-vein';
const hemiazygosId='vm:anatomy:body:thorax:midline:vessel:hemiazygos-vein';
const sourceFile='FJ3416';
const sourceSha='88b374af13155c62ea5bcaad554a699d1d95e23948eeb810b62edb7467789dde';
const bundleSha='0c82e1cb2960c6f2474f2b4759974adab5871d8074a2f4e3712e1c3a37a48ca7';
const sourcePaths=['content/thoracic-eus-orientation.ts','lib/thoracic-eus-orientation.ts'] as const;
const sourceHashes:Record<string,string>={
 'content/central-vessel-imaging-pins.json':'29610e12ec6864a4131874e0d3f6520597af3e65179fd0f009b216aff1371a63',
 'content/thoracic-eus-orientation.ts':'d45a5ff866014539224a80ab3183f4737f72ca098f6c003fe0ef0ded92678b92',
 'lib/thoracic-eus-orientation.ts':'7ccab068671c7eea2eb05ce1bc62ed88e686d7d6336017b94a0c3048841b425e',
};
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{
 const pin=validateCurrentAtlasDelivery(),currentSource=CURRENT_ATLAS_REVISION;
 assert.equal(pin.source,currentSource);
 const sourceRoot=checkedAtlasSourceRepo(currentSource);
 const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(currentSource);
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,currentSource);
 assert.notEqual(review.revision,priorRevision);
 for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);
  assert.equal(sha(execFileSync('git',['show',historicalRuntimeRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact 190a source '+path);
  assert.equal(sha(execFileSync('git',['show',currentSource+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact current source '+path);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder'){
    assert.equal(input?.sha256,digest,`${module}: ${path}`);
   }else assert.equal(input,undefined,`${module}: unexpected EUS dependency ${path}`);
  }
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,currentSource);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of ['public/atlas-review',
  ...['head-neck','shoulder'].flatMap(module=>sourcePaths.map(source=>`public/atlas-runtime/${module}/${source}`)),
  ...sourcePaths.map(source=>`public/atlas-review-viewer/${source}`)])
  assert.equal(existsSync(path),false,`${path}: held source must not be public`);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {thoracicEusOrientationLesson} from './atlas-review/lib/thoracic-eus-orientation';",
  "export {thoracicDetailUltrasoundLesson} from './atlas-review/lib/thoracic-detail-ultrasound';",
  "export {thoracicEusTopics} from './atlas-review/content/thoracic-eus-orientation';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(new Set(Object.keys(api.thoracicEusTopics)),new Set(['FMA4838']));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pin=json('atlas-review/content/central-vessel-imaging-pins.json');
 assert.equal(pin.sourceVersion,catalog.sourceVersion);
 assert.deepEqual(pin.coordinateSystem,catalog.coordinateSystem);
 const selected=pin.entries.filter((entry:{identity:{fmaId:string}})=>entry.identity.fmaId==='FMA4838');
 assert.equal(selected.length,1);
 const identity=selected[0].identity;
 assert.equal(identity.id,id);
 assert.equal(identity.region,'thorax');
 assert.equal(identity.category,'vessel');
 assert.equal(identity.system,'vessels');
 assert.equal(identity.laterality,'unspecified');
 assert.equal(identity.bundle,'thorax-vessels-recovery');
 assert.equal(identity.nodeName,'FMA4838');
 assert.deepEqual(identity.sources,[{file:sourceFile,sha256:sourceSha}]);
 assert.equal(identity.validation.status,'unvalidated');
 assert.equal(identity.validation.anatomicalReview,false);
 assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='thorax');
 assert(scope?.regionalIds.includes(id),'shared thorax learner scope');
 assert.equal(learner.regionalScopes.filter((item:{region:string})=>item.region==='thorax').length,1);
 const topic=api.thoracicEusTopics.FMA4838;
 const lesson=api.thoracicEusOrientationLesson(identity,'ultrasound');
 assert(lesson,id);
 assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,'learner dispatch');
 assert.equal(lesson.readiness,'draft');
 assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
 assert.equal(lesson.body,topic.body);
 assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
 assert.deepEqual(lesson.citations,[...topic.citations]);
 assert.match(lesson.title,/Endoscopic ultrasound \(EUS\)/);
 assert.match(lesson.note,/revision-bound radiologist review pending/i);
 assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/);
 for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
  assert(visible(code,value),`emitted teaching missing ${value}`);
 for(const tab of ['ct','mri','xray','quiz','clinical'])
  assert.equal(api.thoracicEusOrientationLesson(identity,tab),undefined,tab);
 for(const change of [{id:id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
  {laterality:'right'},{sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
  {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'Foreign'}])
  assert.equal(api.thoracicEusOrientationLesson({...identity,...change},'ultrasound'),undefined,
   `changed identity: ${Object.keys(change)[0]}`);
 const hemiazygos=pin.entries.find((entry:{identity:{id:string}})=>entry.identity.id===hemiazygosId)?.identity;
 assert(hemiazygos,'existing hemiazygos pin');
 assert.equal(hemiazygos.laterality,'midline');
 assert.equal(api.thoracicEusOrientationLesson(hemiazygos,'ultrasound'),undefined);
 // Retain the original pending assertion at its exact completed source epoch.
 // The new hemiazygos draft must be admitted independently, never through azygos.
 const historical=JSON.parse(execFileSync('git',['show',`${baseline}:content/regional-teaching/thorax.json`],{
  cwd:sourceRoot,windowsHide:true,maxBuffer:8e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
 }).toString());
 const previous=historical.entries.filter((entry:{identity:string})=>JSON.parse(entry.identity).id===hemiazygosId);
 assert.equal(previous.length,1);
 assert.equal(previous[0].lessons.ultrasound.readiness,'pending');
 const separateDraft=api.thoracicDetailUltrasoundLesson(hemiazygos,'ultrasound');
 assert(separateDraft);
 assert.equal(separateDraft.readiness,'draft');
 assert.deepEqual(api.bodyLesson(hemiazygos,'ultrasound'),separateDraft);
 assert.notEqual(separateDraft.body,lesson.body);
 assert.equal(api.thoracicDetailUltrasoundLesson(identity,'ultrasound'),undefined);
 assert.equal(api.thoracicDetailUltrasoundLesson({...hemiazygos,id:id},'ultrasound'),undefined);
 const packet=wire(await api.bodyReviewMaterial(id));
 const context=await api.bodyReviewContext(id);
 assert(packet&&context,id);
 assert.equal(packet.approval,false);
 assert.equal(packet.status,'worksheet-not-submitted');
 assert.deepEqual(packet.source.structure,identity);
 assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='ultrasound'),{tab:'ultrasound',...lesson});
 const authoredPacket=wire(await authored.bodyReviewMaterial(id));assert.equal(authoredPacket.approval,false);assert.equal(authoredPacket.status,'worksheet-not-submitted');
 assert.deepEqual(authoredPacket.topics.find((item:{tab:string})=>item.tab==='ultrasound'),{tab:'ultrasound',...lesson},'Exact authored EUS topic');
 assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(id)),'Complete current packet equals independently renderer-bound Atlas replay');
 assert.equal(context.structureId,id);
 assert.equal(context.materialHash,packet.materialHash);
 assert.equal(context.sourceHash,packet.fingerprints.source);
 assert.equal(context.teachingHash,packet.fingerprints.teaching);
 assert(context.teachingTabs.includes('ultrasound'));
 assert.equal(context.revisions.imaging,null);
 assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
 for(const mutate of [
  (bad:any)=>{bad.topics.find((item:any)=>item.tab==='ultrasound').body+=' foreign';},
  (bad:any)=>{bad.topics.find((item:any)=>item.tab==='ultrasound').bullets[0]+=' foreign';},
  (bad:any)=>{bad.topics.find((item:any)=>item.tab==='ultrasound').citations[0]+='?foreign=1';},
  (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
 ]){const bad=wire(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,id),null);}
 for(const claim of ['materialHash','revisionHash'] as const){
  let storageCalls=0;
  const payload={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,
   checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
  payload[claim]='0'.repeat(64);
  const response=await api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
   body:JSON.stringify(payload),
  }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
  assert.equal(response.status,409,`stale ${claim}`);
  assert.equal(storageCalls,0);
 }
 const bundle=catalog.bundles.find((item:{id:string})=>item.id==='thorax-vessels-recovery');
 assert(bundle);
 assert.equal(bundle.sha256,bundleSha);
 const modelPath=bundle.url.replace(/^\//,'').split('?')[0];
 const record=learner.files.find((file:{path:string})=>file.path===modelPath);
 assert(record);
 assert.equal(record.bytes,bundle.bytes);
 assert.equal(record.sha256,bundleSha);
 assert.equal(sha(readFileSync(learnerBase+modelPath)),bundleSha);
 assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===bundle.id&&item.sha256===bundleSha));
});
