import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readRevision50,revision50,validateRevision50Delivery} from './historical-lacrimal-delivery-50.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(new URL('../'+path,import.meta.url)),json=path=>JSON.parse(read(path));
const source='c5a09df8939dfaeaf76119ba5507c552721c3a30';

test('closed50 keeps every original proof byte and only declared test seams change',()=>{
 assert.equal(revision50.files.length,31);
 for(const row of revision50.files)assert.equal(sha(readRevision50(row.path)),row.sha256,row.path);
 const oldDeep=readRevision50('tests/deep-plantar-current-transition.test.mjs').toString();
 const expectedDeep=oldDeep
  .replace("import {build} from 'esbuild';","import {readRevision50,validateRevision50Delivery} from './historical-lacrimal-delivery-50.mjs';")
  .replace("import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';")
  .replace("const read=path=>readFileSync(new URL('../'+path,import.meta.url)),json=path=>JSON.parse(read(path));","const read=path=>readRevision50(path),json=path=>JSON.parse(read(path));\nconst validateCurrentAtlasDelivery=validateRevision50Delivery;")
  .replace(" const compiled=await build({stdin:{contents:`export {bodyLesson} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';\nexport {contentTabs} from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';\nexport * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});\n const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));"," const now=await exactSourceHistoryApi(source,'review-security');");
 assert.notEqual(expectedDeep,oldDeep);assert.deepEqual(read('tests/deep-plantar-current-transition.test.mjs'),Buffer.from(expectedDeep));
 const oldCerebral=readRevision50('tests/atlas-cerebral-lobar-imaging.test.ts').toString();
 const expectedCerebral=oldCerebral.replace('./fixtures/current-source-checkout-representations-deep-plantar.json','./fixtures/current-source-checkout-representations-lacrimal.json')
  .replace('7e9fdec2a03e766f11cba59c2d86ead8708774a9e894752a2c5a1449a46106e7','89246aed66c49d55226320e25afb106255db219c5e0afcc85423d5e81392f510');
 assert.notEqual(expectedCerebral,oldCerebral);assert.deepEqual(read('tests/atlas-cerebral-lobar-imaging.test.ts'),Buffer.from(expectedCerebral));
 let expectedAdmission=readRevision50('tests/current-atlas-delivery.test.mjs').toString();
 for(const[old,next]of [[revision50.source,source],[revision50.sourceTree,'dbc2f38825775991ea4d9428a33ce9375699280a'],
  [revision50.review,'a579079a911086426577e20d111350dfd054d6b6fcaecdf069458282007dd5aa'],
  ['assert.equal(sourceFiles,1523);','assert.equal(sourceFiles,1526);']]){
  assert.equal(expectedAdmission.split(old).length,2);expectedAdmission=expectedAdmission.replace(old,next);
 }
 assert.deepEqual(read('tests/current-atlas-delivery.test.mjs'),Buffer.from(expectedAdmission));
 const oldPolicy=readRevision50('.gitattributes'),policy=read('.gitattributes');assert(policy.subarray(0,oldPolicy.length).equals(oldPolicy));
 assert.equal(policy.subarray(oldPolicy.length).toString(),'# Exact closed pre-lacrimal delivery50 proof, independent of platform EOL.\r\n'+'tests/fixtures/lacrimal-50/** -text\r\n'+'tests/fixtures/current-source-checkout-representations-lacrimal.json -text\r\n');
 const paths=['.gitattributes','tests/fixtures/current-source-checkout-representations-lacrimal.json',...revision50.files.map(row=>'tests/fixtures/lacrimal-50/'+row.storagePath),'tests/fixtures/lacrimal-50/epoch.json'];
 const attributes=execFileSync('git',['check-attr','-z','--stdin','text'],{input:Buffer.from(paths.join('\0')+'\0'),windowsHide:true}).toString().split('\0');
 for(let index=0;index<paths.length;index++)assert.deepEqual(attributes.slice(index*3,index*3+3),[paths[index],'text','unset']);
 assert.equal(validateRevision50Delivery().reviewIntegration,revision50.review);assert.throws(()=>validateCurrentAtlasDelivery({pin:validateRevision50Delivery()}));
});

test('current51 retains 71 required and eight optional scopes with unchanged owners and acceptance',()=>{
 const before=validateChecklist(JSON.parse(readRevision50('docs/completion-checklist.json'))),now=validateChecklist(json('docs/completion-checklist.json'));
 const current=validateCurrentAtlasDelivery();assert.equal(current.source,source);
 assert.equal(before.revision,50);assert.equal(now.revision,51);assert.equal(now.items.length,71);assert.equal(now.items.filter(i=>i.scope==='optional').length,8);
 for(const key of ['items','statusDefinitions','rules','roots'])assert.deepEqual(now[key],before[key],key);
 assert.deepEqual(now.changeLog.slice(1),before.changeLog);
 const changedBaseline=new Set(['atlasCommit','atlasTree','reviewIntegration','reviewSourceFiles','rootDraftPlacements','rootPendingPlacements']);
 for(const[key,value]of Object.entries(before.baseline))if(!changedBaseline.has(key))assert.deepEqual(now.baseline[key],value,key);
 assert.equal(now.baseline.atlasCommit,source);assert.equal(now.baseline.atlasTree,current.sourceTree);
 assert.equal(now.baseline.reviewIntegration,current.reviewIntegration);assert.equal(now.baseline.reviewSourceFiles,current.reviewSourceFiles);
 assert.deepEqual([now.baseline.rootDraftPlacements,now.baseline.rootPendingPlacements,now.baseline.rootGeneratedIdentificationPlacements],[9322,575,39]);
 assert.equal(now.baseline.privateClinicalDecisionCounts,null);assert.equal(now.baseline.publicReleaseApproval,null);
 const oldInputs=JSON.parse(readRevision50('atlas-review/integration-inputs.json')),inputs=json('atlas-review/integration-inputs.json');
 const old=new Map(oldInputs.inputs.map(row=>[row.path,row.sha256]));
 assert.deepEqual(inputs.inputs.filter(row=>!old.has(row.path)).map(row=>row.path),[
  'atlas-review/content/lacrimal-drainage-ultrasound-pins.json','atlas-review/content/lacrimal-drainage-ultrasound.ts','atlas-review/lib/lacrimal-drainage-ultrasound.ts']);
 assert.deepEqual(inputs.inputs.filter(row=>old.has(row.path)&&old.get(row.path)!==row.sha256).map(row=>row.path),[
  'atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/regional-teaching/head-neck.json',
  'docs/anatomy-coverage/index.json','lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs']);
 assert(oldInputs.inputs.every(row=>inputs.inputs.some(r=>r.path===row.path)));
 assert.equal(sha(Buffer.from(JSON.stringify(inputs.inputs))),current.reviewIntegration);
 for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(readRevision50('lib/atlas-model-inventory.json')).models);
 const checkoutBytes=read('tests/fixtures/current-source-checkout-representations-lacrimal.json');
 assert.equal(sha(checkoutBytes),'89246aed66c49d55226320e25afb106255db219c5e0afcc85423d5e81392f510');
 const checkout=JSON.parse(checkoutBytes),prior=JSON.parse(readRevision50('tests/fixtures/current-source-checkout-representations-deep-plantar.json'));
 assert.equal(checkout.source,source);assert.equal(checkout.sourceInputManifestSha256,sha(read('public/atlas-runtime/head-neck/source-inputs.json')));
 assert.deepEqual(checkout.records,prior.records);assert.equal(checkout.records.length,9);
});

test('actual Review resolver changes exactly four lacrimal US lessons and refuses 12 stale saves',async()=>{
 const atlas=currentAtlasDeliveryRoot();
 const{exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs'));
 const before=await exactSourceHistoryApi(revision50.source,'review-security');
 const compiled=await build({stdin:{contents:`export {bodyLesson} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
export {contentTabs} from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';
export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 const display=now.bodyDisplayCatalog(catalog),oldDisplay=before.bodyDisplayCatalog(catalog);
 assert.deepEqual(display,oldDisplay);assert.equal(display.structures.length,1104);
 const pins=json('atlas-review/content/lacrimal-drainage-ultrasound-pins.json'),targets=new Set(pins.entries.map(e=>e.identity.id));
 assert.equal(targets.size,4);let changed=0,preserved=0,stale=0,storage=0;
 for(const structure of display.structures)for(const tab of now.contentTabs){
  const prior=before.bodyLesson(structure,tab),current=now.bodyLesson(structure,tab);
  if(targets.has(structure.id)&&tab==='ultrasound'){
   assert.equal(prior.readiness,'pending');assert.equal(current.readiness,'draft');assert.match(current.note,/radiologist review/);changed++;
  }else{assert.deepEqual(current,prior,structure.id+'|'+tab);preserved++;}
 }
 assert.equal(changed,4);assert.equal(preserved,9932);
 for(const{identity}of pins.entries){
  const structure=display.structures.find(s=>s.id===identity.id);assert(structure);assert.equal(structure.fmaId,identity.fmaId);
  const prior=await before.bodyReviewMaterial(identity.id),current=await now.bodyReviewMaterial(identity.id);
  assert.equal(current.approval,false);assert.equal(current.fingerprints.source,prior.fingerprints.source);
  assert.equal(current.fingerprints.checklist,prior.fingerprints.checklist);assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
  assert.deepEqual(await now.parseBodyReviewResponse(current,identity.id),current);
  const context=await now.bodyReviewContext(identity.id),oldContext=await before.bodyReviewContext(identity.id);
  assert.equal(context.revisions.imaging,null);assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
  const packet={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
  for(const hashes of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},{materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){
   const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_WEBSITE_LACRIMAL'},body:JSON.stringify({...packet,...hashes})}),{prepare(){storage++;throw Error('Stale submission reached storage');}});
   assert.equal(response.status,409);stale++;
  }
 }
 assert.equal(stale,12);assert.equal(storage,0);
 for(const fma of ['FMA59555','FMA59556'])assert.equal(now.bodyLesson(display.structures.find(s=>s.fmaId===fma),'ultrasound').readiness,'pending');
});
