import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {readRevision50,validateRevision50Delivery} from './historical-lacrimal-delivery-50.mjs';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {readRevision49,revision49,validateRevision49Delivery} from './historical-deep-plantar-delivery-49.mjs';
import {readRevision53} from './historical-head-manual-recovery-delivery-53.mjs';
import {beforeReviewSuccessorSource} from './review-successor-source-role.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const historicalCssPath='app/atlas/head-neck-3d/head-learning.css';
const inputHashes=new Map(JSON.parse(readRevision50('atlas-review/integration-inputs.json')).inputs.map(row=>[row.path,row.sha256]));
const read=path=>{
 const prior=readRevision50(path),expected=inputHashes.get(path);
 if(!expected||sha(prior)===expected)return prior;
 const historical=readRevision53(path);
 assert.equal(sha(historical),expected,path+' exact delivery50 input');
 if(path===historicalCssPath){
  const later=readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(sha(later),'cb2a52345e8b88978c0b94685775488468321b1f2a2d551c904c913ed813a591','Exact current CSS source');
  const current=beforeReviewSuccessorSource(path,later);
  assert.equal(sha(current),'70eb06e2246820bf4b752aa857a4ddeb67f105bfe31361469bd9cb81afd5db83','Exact later CSS source');
  assert.deepEqual(current.subarray(0,historical.length),historical,'Exact later-to-delivery50 CSS inverse');
  assert.match(current.subarray(historical.length).toString(),/^\r?\n\/\* Append to head-learning\.css after source-bound integration checks\./);
  const forged=Buffer.from(later);forged[0]^=1;
  assert.throws(()=>beforeReviewSuccessorSource(path,forged),'Foreign CSS source refused');
 }
 return historical;
};
const json=path=>JSON.parse(read(path));
const validateCurrentAtlasDelivery=validateRevision50Delivery;
const source='70260f13b1878272c6b0797dd72395ed10bc4f29',review='5c0b739fa617913952bc42dc5a828f5115b4690b5fb118a6e00d8054bd256d39';

test('closed49 retains every original proof body; only the named read seams change',()=>{
 assert.equal(revision49.files.length,23);for(const row of revision49.files)assert.equal(sha(readRevision49(row.path)),row.sha256);
 const head=readRevision49('tests/head-client-current-transition.test.mjs').toString();
 const expectedHead=head.replace("import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {validateRevision49Delivery as validateCurrentAtlasDelivery,readRevision49} from './historical-deep-plantar-delivery-49.mjs';")
  .replace('const read=path=>readFileSync(new URL(path,root));','const read=path=>readRevision49(path);');
 assert.notEqual(expectedHead,head);assert.deepEqual(read('tests/head-client-current-transition.test.mjs'),Buffer.from(expectedHead));
 const guard=readRevision49('tests/current-proof-corrections-preservation.test.mjs').toString();
 const expectedGuard=guard.replace("import test from 'node:test';","import test from 'node:test';\nimport {readRevision49} from './historical-deep-plantar-delivery-49.mjs';")
  .replace("const read=name=>readFileSync(new URL('./'+name,import.meta.url));","const read=name=>readRevision49('tests/'+name);");
 assert.notEqual(expectedGuard,guard);assert.deepEqual(read('tests/current-proof-corrections-preservation.test.mjs'),Buffer.from(expectedGuard));
 const cerebral=readRevision49('tests/atlas-cerebral-lobar-imaging.test.ts').toString();
 const expectedCerebral=cerebral.replace("./fixtures/current-source-checkout-representations.json","./fixtures/current-source-checkout-representations-deep-plantar.json")
  .replace('39691c1dec4dbd1b2dc2d9c38c43002f93dcd4c132c06e6229493c6c6ba24b97','7e9fdec2a03e766f11cba59c2d86ead8708774a9e894752a2c5a1449a46106e7');
 assert.notEqual(expectedCerebral,cerebral);assert.deepEqual(read('tests/atlas-cerebral-lobar-imaging.test.ts'),Buffer.from(expectedCerebral));
 let current=readRevision49('tests/current-atlas-delivery.test.mjs').toString();
 for(const[old,next]of [[revision49.source,source],[revision49.sourceTree,'ee3e9bfdf528c40bbd7049145e88cdf08e7c5076'],[revision49.review,review],['assert.equal(sourceFiles,1520);','assert.equal(sourceFiles,1523);']]){
  assert.equal(current.split(old).length,2);current=current.replace(old,next);
 }
 assert.deepEqual(read('tests/current-atlas-delivery.test.mjs'),Buffer.from(current));
 const policy=read('.gitattributes'),oldPolicy=readRevision49('.gitattributes');assert(policy.subarray(0,oldPolicy.length).equals(oldPolicy));
 assert.equal(policy.subarray(oldPolicy.length).toString(),'# Exact closed pre-deep-plantar delivery49 proof, independent of platform EOL.\r\ntests/fixtures/deep-plantar-49/** -text\r\ntests/fixtures/current-source-checkout-representations-deep-plantar.json -text\r\n.gitattributes -text\r\n');
 assert.deepEqual(read('tests/exact-test-fixture-eol.test.mjs'),readRevision49('tests/exact-test-fixture-eol.test.mjs'));
 const paths=['.gitattributes','tests/fixtures/current-source-checkout-representations-deep-plantar.json',...revision49.files.map(row=>'tests/fixtures/deep-plantar-49/'+row.storagePath),'tests/fixtures/deep-plantar-49/epoch.json'];
 const attributes=execFileSync('git',['check-attr','-z','--stdin','text'],{input:Buffer.from(paths.join('\0')+'\0'),windowsHide:true}).toString().split('\0');
 for(let index=0;index<paths.length;index++)assert.deepEqual(attributes.slice(index*3,index*3+3),[paths[index],'text','unset']);
 assert.equal(validateRevision49Delivery().reviewIntegration,revision49.review);assert.throws(()=>validateCurrentAtlasDelivery({pin:validateRevision49Delivery()}));
});

test('current50 source, register, exact input changes and unchanged model rights stay bounded',()=>{
 const current=validateCurrentAtlasDelivery();assert.equal(current.source,source);assert.equal(current.reviewIntegration,review);
 const before=validateChecklist(JSON.parse(readRevision49('docs/completion-checklist.json'))),now=validateChecklist(json('docs/completion-checklist.json'));
 assert.equal(before.revision,49);assert.equal(now.revision,50);assert.equal(now.items.length,71);assert.equal(now.items.filter(i=>i.scope==='optional').length,8);
 for(const key of ['items','statusDefinitions','rules','roots'])assert.deepEqual(now[key],before[key]);assert.deepEqual(now.changeLog.slice(1),before.changeLog);
 const changedBaseline=new Set(['atlasCommit','atlasTree','reviewIntegration','reviewSourceFiles','rootDraftPlacements','rootPendingPlacements']);
 for(const[key,value]of Object.entries(before.baseline))if(!changedBaseline.has(key))assert.deepEqual(now.baseline[key],value,key);
 assert.equal(now.baseline.atlasCommit,source);assert.equal(now.baseline.atlasTree,current.sourceTree);assert.equal(now.baseline.reviewIntegration,review);
 assert.deepEqual([now.baseline.rootDraftPlacements,now.baseline.rootPendingPlacements,now.baseline.rootGeneratedIdentificationPlacements],[9318,579,39]);
 assert.equal(now.baseline.privateClinicalDecisionCounts,null);assert.equal(now.baseline.publicReleaseApproval,null);
 const oldInputs=JSON.parse(readRevision49('atlas-review/integration-inputs.json')),inputs=json('atlas-review/integration-inputs.json'),old=new Map(oldInputs.inputs.map(row=>[row.path,row.sha256]));
 assert.equal(oldInputs.inputs.length,1649);assert.equal(inputs.inputs.length,1652);
 assert.deepEqual(inputs.inputs.filter(row=>!old.has(row.path)).map(row=>row.path),[
  'atlas-review/content/deep-plantar-ultrasound-pins.json','atlas-review/content/deep-plantar-ultrasound.ts','atlas-review/lib/deep-plantar-ultrasound.ts']);
 assert.deepEqual(inputs.inputs.filter(row=>old.has(row.path)&&old.get(row.path)!==row.sha256).map(row=>row.path),[
  'atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/regional-teaching/foot.json',
  'docs/anatomy-coverage/index.json','lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs']);
 assert(oldInputs.inputs.every(row=>inputs.inputs.some(r=>r.path===row.path)));
 assert.equal(sha(Buffer.from(JSON.stringify(inputs.inputs))),review);for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(readRevision49('lib/atlas-model-inventory.json')).models);
 const checkoutBytes=read('tests/fixtures/current-source-checkout-representations-deep-plantar.json');assert.equal(sha(checkoutBytes),'7e9fdec2a03e766f11cba59c2d86ead8708774a9e894752a2c5a1449a46106e7');
 const checkout=JSON.parse(checkoutBytes),oldCheckout=JSON.parse(readRevision49('tests/fixtures/current-source-checkout-representations.json'));
 assert.equal(checkout.source,source);assert.equal(checkout.sourceInputManifestSha256,sha(read('public/atlas-runtime/head-neck/source-inputs.json')));assert.deepEqual(checkout.records,oldCheckout.records);assert.equal(checkout.records.length,9);
});

test('actual imported resolver changes only two US placements and rejects stale teaching',async()=>{
 const atlas=currentAtlasDeliveryRoot();
 const{exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs'));
 const before=await exactSourceHistoryApi(revision49.source,'review-security');
 const now=await exactSourceHistoryApi(source,'review-security');
 const display=now.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/deep-plantar-ultrasound-pins.json'),targets=new Set(pins.entries.map(e=>e.identity.id));
 assert.deepEqual(display,before.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
 assert.equal(display.structures.length,1104);let changed=0,preserved=0,stale=0,storage=0;
 for(const structure of display.structures)for(const tab of now.contentTabs){
  const old=before.bodyLesson(structure,tab),current=now.bodyLesson(structure,tab);
  if(targets.has(structure.id)&&tab==='ultrasound'){assert.equal(old.readiness,'pending');assert.equal(current.readiness,'draft');assert.match(current.note,/radiologist review/);changed++;}
  else{assert.deepEqual(current,old,structure.id+'|'+tab);preserved++;}
 }
 assert.equal(changed,2);assert.equal(preserved,9934);
 for(const{identity}of pins.entries){
  const old=await before.bodyReviewMaterial(identity.id),current=await now.bodyReviewMaterial(identity.id);
  assert.equal(current.approval,false);assert.equal(current.fingerprints.source,old.fingerprints.source);assert.equal(current.fingerprints.checklist,old.fingerprints.checklist);assert.notEqual(current.fingerprints.teaching,old.fingerprints.teaching);
  assert.deepEqual(await now.parseBodyReviewResponse(current,identity.id),current);
  const context=await now.bodyReviewContext(identity.id),prior=await before.bodyReviewContext(identity.id);assert.equal(context.revisions.imaging,null);
  const packet={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
  for(const hashes of [{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching},{materialHash:prior.materialHash,revisionHash:prior.revisions.teaching}]){
   const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_WEBSITE_DEEP_PLANTAR'},body:JSON.stringify({...packet,...hashes})}),{prepare(){storage++;throw Error('Stale submission reached storage');}});
   assert.equal(response.status,409);stale++;
  }
 }
 assert.equal(stale,6);assert.equal(storage,0);
 for(const fma of ['FMA43937','FMA43938'])assert.equal(now.bodyLesson(display.structures.find(s=>s.fmaId===fma),'ultrasound').readiness,'pending');
});
