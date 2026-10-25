import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision=CURRENT_ATLAS_REVISION;
assert(process.env.VM_ATLAS_SOURCE_REPO,'Current EUS requires an explicit current Atlas source root');
const atlas=currentAtlasDeliveryRoot();
// Separate current-role SHA-256 pins. The unchanged original case passed in its complete6e delivery.
const sourceHashes:Record<string,string>={
 'content/abdominal-branch-imaging-pins.json':'5daaecd50fae68d64ef88d39237b6700b9f2bac3fa84f1a4792cbc05b3228d61',
 'content/central-vessel-imaging-pins.json':'29610e12ec6864a4131874e0d3f6520597af3e65179fd0f009b216aff1371a63',
 'content/abdominal-eus-orientation.ts':'2bbcce6f530bfca6e1c5cf6733ed8c16d05f8b6b3e990f3724804fa408111431',
 'lib/abdominal-eus-orientation.ts':'18ad65fba17274ddc4f4f60699b88dd4aee88e8cbdeb17a25db0d6bdc0225100',
};
// The committed/Review pin is LF; the historical Windows working copy is CRLF.
// Both fixed identities remain admissible only when the exact Git blob proves
// the selected working file is unchanged or differs solely by LF-to-CRLF.
const branchPath='content/abdominal-branch-imaging-pins.json';
const branchBlob='35eba372769ec78877238f070263bb4177717782';
const branchCrlfHash='735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1';
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const checkedWorkingBranch=()=>{
 const blob=Buffer.from(git(['cat-file','blob',branchBlob]));
 assert.equal(sha(blob),sourceHashes[branchPath],'exact LF Git blob');
 for(const epoch of [revision,'b03ba458',CURRENT_ATLAS_REVISION])
  assert.equal(git(['rev-parse',`${epoch}:${branchPath}`]).toString().trim(),branchBlob,`${epoch}: same pin blob`);
 assert.equal(blob.includes(13),false,'committed pin has LF only');
 const crlf=Buffer.from(blob.toString('utf8').replaceAll('\n','\r\n'));
 assert.equal(sha(crlf),branchCrlfHash,'exact historical CRLF conversion');
 const working=Buffer.from(readFileSync(`${atlas}/${branchPath}`));
 assert(working.equals(blob)||working.equals(crlf),'working pin must equal LF blob or exact CRLF conversion');
 return sha(working);
};
const expected={
 FMA76574:{file:'FJ3432',side:'unspecified',id:'vm:anatomy:body:abdomen:unspecified:vessel:trunk-of-gastroduodenal-artery',bundle:'abdomen-vessels-visceral-detail',sha256:'520c5303adfa900e6eb905722207a127678ce0b60d3f763ed6e8be183519d6fd'},
 FMA15391:{file:'FJ3443',side:'unspecified',id:'vm:anatomy:body:abdomen:unspecified:vessel:inferior-mesenteric-vein',bundle:'abdomen-vessels-mesenteric',sha256:'59393e5b8a5cd62e7f2be2f8e36a7b0a41b103dd23a5eeae501e61f495c4df95'},
 FMA14768:{file:'FJ3499',side:'left',id:'vm:anatomy:body:abdomen:left:vessel:left-gastric-artery',bundle:'abdomen-vessels-recovery',sha256:'983a0580d4324a210eeb5671c4caf115c29ce13c0761e718102db8092a849ccf'},
 FMA15400:{file:'FJ3595',side:'right',id:'vm:anatomy:body:abdomen:right:vessel:right-gastric-vein',bundle:'portal-veins',sha256:'a2a2bd3aadf7027de43cb57c0a33b17b3ce3a35c9f495f5fc010486c2b39494d'},
} as const;
const bundles={
 'abdomen-vessels-visceral-detail':'be90ec41dc6046b820b337d986b6a67792a33ba33216db8aecb068fed4b85173',
 'abdomen-vessels-mesenteric':'d26bb01909128f5cd8a56fb410967a688801a22652305bb2656e04d3e7df2680',
 'abdomen-vessels-recovery':'e41d66684de08fd9bd7dfca340acb63cbf7714eb09a3ea9594184f497c509abe',
 'portal-veins':'583069160dbd753bb7f64b62667d20134ccbf7554b9bd4cf57b0de0a5a50ee53',
} as const;
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('four current EUS drafts preserve the original three and bind the exact right gastric vein',async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,'727ed5b451ae940a01e56272c8fbc703ea3b0095','Explicit current EUS delivery epoch');
 assert.equal(admission.source,CURRENT_ATLAS_REVISION);
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),
   digest,`${path}: 9f Git source`);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const workingBranchDigest=checkedWorkingBranch();
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceHashes)){
   const found=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder'){
    const working=readFileSync(`${atlas}/${path}`);
    assert.equal(sha(working),path===branchPath?workingBranchDigest:digest,`${path}: pinned working file`);
    assert.equal(found?.sha256,sha(working),`${module}: ${path}`);
   }
   else assert.equal(found,undefined,`${module}: unexpected EUS dependency ${path}`);
  }
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of ['public/atlas-review','public/atlas-runtime/head-neck/content/abdominal-eus-orientation.ts',
  'public/atlas-runtime/shoulder/content/abdominal-eus-orientation.ts',
  'public/atlas-review-viewer/content/abdominal-eus-orientation.ts'])
  assert.equal(existsSync(path),false,`${path}: held source must not be public`);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {abdominalEusOrientationLesson} from './atlas-review/lib/abdominal-eus-orientation';",
  "export {abdominalEusTopics} from './atlas-review/content/abdominal-eus-orientation';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pins=[json('atlas-review/content/abdominal-branch-imaging-pins.json'),
  json('atlas-review/content/central-vessel-imaging-pins.json')];
 for(const pin of pins){
  assert.equal(pin.sourceVersion,catalog.sourceVersion);
  assert.deepEqual(pin.coordinateSystem,catalog.coordinateSystem);
 }
 const selected=pins.flatMap(pin=>pin.entries.filter((entry:{identity:{fmaId:string}})=>Object.hasOwn(expected,entry.identity.fmaId)));
 assert.equal(selected.length,4);
 assert.deepEqual(new Set(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId)),new Set(Object.keys(expected)));
 const historicalBytes=git(['show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:content/abdominal-eus-orientation.ts']);
 assert.equal(sha(historicalBytes),'39ee4a18431a9dd36112ee95ba17a9ec47a135404372f690b646fb19e7937c37','Exact original three-topic source');
 const historicalContent=await build({stdin:{contents:Buffer.from(historicalBytes).toString('utf8'),loader:'ts'},write:false,platform:'node',format:'esm'});
 const historical=await import('data:text/javascript;base64,'+Buffer.from(historicalContent.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(historical.abdominalEusTopics).sort(),['FMA14768','FMA15391','FMA76574'].sort());
 for(const id of Object.keys(historical.abdominalEusTopics))assert.deepEqual(api.abdominalEusTopics[id],historical.abdominalEusTopics[id],'Original topic body, bullets, title and citations remain exact: '+id);
 assert.deepEqual(api.abdominalEusTopics.FMA15400.citations,['https://pubmed.ncbi.nlm.nih.gov/24949362/']);
 assert.match(api.abdominalEusTopics.FMA15400.body,/small calibre makes identification difficult/);
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='abdomen');
 assert(scope,'shared abdomen learner scope');
 assert.equal(learner.regionalScopes.filter((item:{region:string})=>item.region==='abdomen').length,1);
 assert.deepEqual(new Set(Object.keys(api.abdominalEusTopics)),new Set(Object.keys(expected)));
 for(const {identity} of selected){
  const bound=expected[identity.fmaId as keyof typeof expected],topic=api.abdominalEusTopics[identity.fmaId];
  assert.equal(identity.id,bound.id);
  assert.equal(identity.region,'abdomen');
  assert.equal(identity.category,'vessel');
  assert.equal(identity.system,'vessels');
  assert.equal(identity.laterality,bound.side);
  assert.equal(identity.bundle,bound.bundle);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  assert(scope.regionalIds.includes(identity.id),`${identity.id}: absent from abdomen scope`);
  const lesson=api.abdominalEusOrientationLesson(identity,'ultrasound');
  assert(lesson,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,`${identity.id}: dispatch`);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
  assert.equal(lesson.body,topic.body);
  assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
  assert.deepEqual(lesson.citations,[...topic.citations]);
  if(identity.fmaId==='FMA15400')assert.equal(lesson.title,'Right gastric vein · Linear endoscopic ultrasound (EUS) · draft');else assert.match(lesson.title,/Endoscopic ultrasound \(EUS\)/);
  assert.match(lesson.bullets.join(' '),/do not guarantee visibility on routine transabdominal ultrasound/);
  assert.match(lesson.bullets.join(' '),/no patient-space registration is provided/);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
  for(const tab of ['ct','mri','xray','quiz','clinical'])
   assert.equal(api.abdominalEusOrientationLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
  for(const change of [{id:identity.id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
   {laterality:'foreign'},{sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'Foreign'}])
   assert.equal(api.abdominalEusOrientationLesson({...identity,...change},'ultrasound'),undefined,
    `${identity.id}: changed identity`);
  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert(context.teachingTabs.includes('ultrasound'));
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='ultrasound').body+=' foreign';},
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='ultrasound').bullets[0]+=' foreign';},
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='ultrasound').citations[0]+='?foreign=1';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,identity.id);}
  for(const claim of ['materialHash','revisionHash'] as const){
   let storageCalls=0;
   const payload={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
   payload[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
    body:JSON.stringify(payload),
   }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
   assert.equal(response.status,409,`${identity.id}: stale ${claim}`);
   assert.equal(storageCalls,0,identity.id);
  }
 }
 for(const [id,digest] of Object.entries(bundles)){
  const bundle=catalog.bundles.find((item:{id:string})=>item.id===id);
  assert(bundle,id);
  assert.equal(bundle.sha256,digest,id);
  const modelPath=bundle.url.replace(/^\//,'').split('?')[0];
  const record=learner.files.find((file:{path:string})=>file.path===modelPath);
  assert(record,id);
  assert.equal(record.bytes,bundle.bytes,id);
  assert.equal(record.sha256,digest,id);
  assert.equal(sha(readFileSync(learnerBase+modelPath)),digest,id);
  assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===id&&item.sha256===digest));
 }
});
