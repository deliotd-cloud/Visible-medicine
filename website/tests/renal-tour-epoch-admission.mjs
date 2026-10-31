// Closed 389 -> 4f20 renal source admission. Historical tour bytes stay historical.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {assertCurrentTourSource,assertCurrentTourDelivery} from './adjacent-current-tour-source-role.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertHistoricalRenalTourEpoch,assertHistoricalRenalPortalPrefixEpoch,
 assertLatestTourDelivery} from './tour-playback-source-role.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const before='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const introduced='4f20ae0b62b9e0dab5936b430575a983dcdd934e';
const current='2381efe43b75f8a7fb768a069eecd7268c508dac';
const latest='5e75b9ce7e46fed291748108edd7565c97dee101';
const latestTree='005b7656f517efbd86e32a282e3d7880fc052bfe';
const nativeSuccessor='9cef8900417bf592d3130f6ff92bf3e748cb55fc';
const nativeSuccessorTree='3d71e1e991e8a6cb69e6fac6f085c87ede58afd0';
const nativeCurrent='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const nativeCurrentTree='d7ead7f3673ddf5c4b68db755b559b08b921eec6';
const quadricepsIntroduction='44516d0ab85be6c6d6a3accec42b1e7372a0886b';
const hamstringIntroduction='7978478992f54ea68e0f53c3d195c459c7b80068';
const latestRegionalSha='b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d';
const latestRegionalBlob='3c5647f29383ba5699b6d387ff528f6b0f8f57b9';
const oldRevision='renal-organs-arteries-orientation-v1';
const newRevision='renal-organs-arteries-orientation-20261022-source-bound-draft';
const oldTourSha='57bd87627a189b7d3b50621b08b18c13b0b43e705c57dfa05c9d6f248cd34041';
const newTourSha='446f2e8e18a60fee7a1e98281263c090a2e3f45109e94531ea055471fd28bc75';
const portalTourSha='2766dbafed9e364bffc3c37aa52c1f0e3b7d92e0bb46c62f250d247ae0442b3f';
const nativeToursSha='8f7ab1694b396ae24a8d2a56cd2968552b49c0509a6232b5538d8eb2f9a5b476';
const nativeAddedTours=[
 ['coccygeus-pelvic-landmarks','coccygeus-pelvic-landmarks-20261027-r1',4,'5a6f4fc4c5298d1e171863fd7e1a02809b7971d69ed9978df0792f087632222a'],
 ['right-knee-quadriceps-to-tibia','right-quadriceps-20261027-r1',6,'25e4c7532ccbcac9a5294baf8b4008796a4a8bcbdebb0b36a885d0b5efde7579'],
];
const sourcePins={
 'lib/regional-tours.ts':{old:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',
  current:'9123a100dd7693f99a7675b3f369803e4c788de5d6ed48a850e4be9caa8534cd',
  oldBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136',currentBlob:'e1adb96b7ad8ce835608991324af6f7547b9b266'},
 'lib/renal-tour.ts':{current:'e52cfc1830ccade4f2d6279fdc42555e950f1a9efc35856205c3d313fb879859'},
 'content/renal-tour-pins.json':{current:'083a3b264669a3bce4f55faee613385ca2e5c5a96064fc03081764c31afdf63c'},
};
const sha=value=>createHash('sha256').update(value).digest('hex');
const json=path=>JSON.parse(readFileSync(site+'/'+path));
const git=(root,...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:8e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

function assertNativeSuccessorRenalSourceBinding(){
 const pin=validateCurrentAtlasDelivery(),root=currentAtlasDeliveryRoot();
 assert([nativeSuccessor,nativeCurrent].includes(CURRENT_ATLAS_REVISION),'Only the two exact reviewed native deliveries are admitted');
 const delivery=CURRENT_ATLAS_REVISION,deliveryTree=delivery===nativeCurrent?nativeCurrentTree:nativeSuccessorTree;
 assert.equal(pin.source,delivery);assert.equal(pin.sourceTree,deliveryTree);
 assert.equal(pin.runtimeSources['head-neck'],delivery);
 assert.equal(git(root,'rev-parse','HEAD').toString().trim(),delivery);
 assert.equal(git(root,'rev-parse',`${delivery}^{tree}`).toString().trim(),deliveryTree);
 assert.equal(git(root,'merge-base',nativeSuccessor,delivery).toString().trim(),nativeSuccessor,
  'Current native delivery descends from the exact reviewed successor');
 assert.equal(git(root,'rev-parse',`${introduced}^`).toString().trim(),before);
 for(const ancestor of [introduced,current,hamstringIntroduction,latest,quadricepsIntroduction])
  assert.equal(git(root,'merge-base',ancestor,delivery).toString().trim(),ancestor,
   ancestor+': authenticated renal and hamstring ancestry');
 const review=json('atlas-review/manifest.json'),integration=json('atlas-review/integration-inputs.json');
 const runtime=json('public/atlas-runtime/head-neck/manifest.json');
 const runtimeInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,delivery);
 assert.equal(integration.sourceCommit,delivery);
 assert.equal(runtime.sourceCommit,delivery);
 const expected={
  'lib/regional-tours.ts':{sha:'3b46596734c29891b803db7f0448eff4a8cc803d615fd197f77591efe95cfd5c',
   blob:'d7ba177194a8d8671c7e3c8f6336e169e4ca2be6'},
  'lib/renal-tour.ts':{sha:sourcePins['lib/renal-tour.ts'].current,
   blob:'bedc47a7edcb0372aa7b85fb8fb44737a78b9ebe'},
  'content/renal-tour-pins.json':{sha:sourcePins['content/renal-tour-pins.json'].current,
   blob:'1b9cfc5f14f706de9ea9fefef925e0b521d74241'},
 };
 for(const [path,identity] of Object.entries(expected)){
  const original=git(root,'show',`${introduced}:${path}`);
  assert.equal(sha(original),sourcePins[path].current,path+': exact renal introduction');
  assert.deepEqual(git(root,'show',`${current}:${path}`),original,path+': reviewed renal era');
  const now=git(root,'show',`${delivery}:${path}`);
  assert.equal(sha(now),identity.sha,path+': exact native successor source');
  assert.deepEqual(now,git(root,'show',`${nativeSuccessor}:${path}`),path+': source unchanged from reviewed successor');
  assert.equal(git(root,'rev-parse',`${delivery}:${path}`).toString().trim(),identity.blob,
   path+': exact native successor blob');
  if(path==='lib/regional-tours.ts'){
   assert.equal(sha(git(root,'show',`${latest}:${path}`)),latestRegionalSha,
    'Reviewed hamstring tour source retained historically');
   assert.deepEqual(now,git(root,'show',`${quadricepsIntroduction}:${path}`),
    'Current regional tour source equals quadriceps introduction');
  }else assert.deepEqual(now,original,path+': unchanged renal source');
  assert.equal(sha(readFileSync(root+'/'+path)),identity.sha,path+': Atlas checkout');
  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),identity.sha,path+': Review import');
  const record=review.files.find(item=>item.path===path);assert(record,path+': Review source record');
  assert.equal(record.sourceSha256,identity.sha,path+': Review source hash');
  assert.equal(record.importedSha256,identity.sha,path+': Review import hash');
  assert.equal(integration.inputs.find(item=>item.path==='atlas-review/'+path)?.sha256,identity.sha,
   path+': Review integration input');
  assert.equal(runtimeInputs.find(item=>item.path===path)?.sha256,identity.sha,
   path+': head-neck runtime source input');
 }
 return {sha256:expected['lib/regional-tours.ts'].sha,gitBlob:expected['lib/regional-tours.ts'].blob,
  oldSha256:sourcePins['lib/regional-tours.ts'].old,
  oldGitBlob:sourcePins['lib/regional-tours.ts'].oldBlob};
}

function assertNativeSuccessorTourDelivery(renalEra,currentTours){
 assert(Array.isArray(currentTours));
 assert.equal(currentTours.length,55);assert.equal(currentTours.reduce((n,t)=>n+t.steps.length,0),327);
 assert.equal(sha(JSON.stringify(currentTours)),nativeToursSha,'Complete 55-tour native successor array');
 const root=currentAtlasDeliveryRoot();
 // Preserve the existing complete 51-tour theorem and both 5e75 hamstring
 // additions, then authenticate the two later append-only tours.
 assertLatestTourDelivery(renalEra,currentTours.slice(0,53),{atlasRoot:root,sourceCommit:latest});
 assert.deepEqual(currentTours.slice(51,53).map(t=>t.id),
  ['right-hamstring-orientation','left-hamstring-orientation']);
 assert.deepEqual(currentTours.slice(53).map(t=>
  [t.id,t.revision,t.steps.length,sha(JSON.stringify(t))]),nativeAddedTours,
  'Only exact coccygeus and quadriceps tours append');
}

function assertLatestRenalSourceBinding(){
 const pin=validateCurrentAtlasDelivery(),root=currentAtlasDeliveryRoot();
 assert.equal(CURRENT_ATLAS_REVISION,latest,'Only exact reviewed latest delivery is admitted');
 assert.equal(pin.source,latest);assert.equal(pin.sourceTree,latestTree);
 assert.equal(git(root,'rev-parse','HEAD').toString().trim(),latest);
 assert.equal(git(root,'rev-parse',`${latest}^{tree}`).toString().trim(),latestTree);
 assert.equal(git(root,'rev-parse',`${introduced}^`).toString().trim(),before);
 assert.equal(git(root,'merge-base',current,latest).toString().trim(),current);
 assert.equal(git(root,'merge-base',hamstringIntroduction,latest).toString().trim(),hamstringIntroduction);
 const review=json('atlas-review/manifest.json'),integration=json('atlas-review/integration-inputs.json');
 assert.equal(review.revision,latest);assert.equal(integration.sourceCommit,latest);
 for(const [path,identity] of Object.entries(sourcePins)){
  const historical=git(root,'show',`${current}:${path}`);
  assert.equal(sha(historical),identity.current,path+': exact historical renal source');
  assert.deepEqual(historical,git(root,'show',`${introduced}:${path}`),path+': original renal introduction retained');
  const expected=path==='lib/regional-tours.ts'?latestRegionalSha:identity.current;
  const now=git(root,'show',`${latest}:${path}`);
  assert.equal(sha(now),expected,path+': exact current source');
  if(path==='lib/regional-tours.ts'){
   assert.deepEqual(now,git(root,'show',`${hamstringIntroduction}:${path}`),path+': exact later tour introduction');
   assert.equal(git(root,'rev-parse',`${latest}:${path}`).toString().trim(),latestRegionalBlob);
  }else assert.deepEqual(now,historical,path+': retained renal source');
  assert.equal(sha(readFileSync(root+'/'+path)),expected,path+': Atlas checkout');
  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),expected,path+': Review import');
  const record=review.files.find(item=>item.path===path);assert(record,path+': Review source record');
  assert.equal(record.sourceSha256,expected,path+': Review source hash');
  assert.equal(record.importedSha256,expected,path+': Review import hash');
  assert.equal(integration.inputs.find(item=>item.path==='atlas-review/'+path)?.sha256,expected,
   path+': Review integration input');
 }
 const runtime=json('public/atlas-runtime/head-neck/manifest.json');
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(runtime.sourceCommit,latest);
 assert.equal(inputs.find(item=>item.path==='lib/regional-tours.ts')?.sha256,latestRegionalSha);
 return {sha256:latestRegionalSha,gitBlob:latestRegionalBlob,
  oldSha256:sourcePins['lib/regional-tours.ts'].old,
  oldGitBlob:sourcePins['lib/regional-tours.ts'].oldBlob};
}

export function assertCurrentRenalSourceBinding(){
 if([nativeSuccessor,nativeCurrent].includes(CURRENT_ATLAS_REVISION))return assertNativeSuccessorRenalSourceBinding();
 if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20')return assertCurrentTourSource();
 if(CURRENT_ATLAS_REVISION===latest)return assertLatestRenalSourceBinding();
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,current,'Only the reviewed 2381 delivery is admitted');
 assert.equal(pin.source,current,'Current Atlas source epoch');
 assert.equal(pin.runtimeSources['head-neck'],current,'Head-neck learner source epoch');
 const root=currentAtlasDeliveryRoot();
 assert.equal(git(root,'rev-parse','HEAD').toString().trim(),current,'Exact checked Atlas HEAD');
 assert.equal(git(root,'rev-parse',`${introduced}^`).toString().trim(),before,'Exact introduction parent');
 assert.equal(git(root,'merge-base',introduced,current).toString().trim(),introduced,'Introduction precedes current');
 const review=json('atlas-review/manifest.json');
 const integration=json('atlas-review/integration-inputs.json');
 const runtime=json('public/atlas-runtime/head-neck/manifest.json');
 const runtimeInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,current);assert.equal(integration.sourceCommit,current);
 assert.equal(runtime.sourceCommit,current);
 for(const [path,identity] of Object.entries(sourcePins)){
  const now=git(root,'show',`${current}:${path}`),introducedBytes=git(root,'show',`${introduced}:${path}`);
  assert.equal(sha(now),identity.current,path+': current exact source');
  assert.deepEqual(now,introducedBytes,path+': no later source change');
  assert.equal(sha(readFileSync(root+'/'+path)),identity.current,path+': Atlas checkout');
  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),identity.current,path+': Review imported bytes');
  const record=review.files.find(item=>item.path===path);
  assert(record,path+': Review source record');
  assert.equal(record.sourceSha256,identity.current,path+': Review source hash');
  assert.equal(record.importedSha256,identity.current,path+': Review import hash');
  assert.equal(integration.inputs.find(item=>item.path==='atlas-review/'+path)?.sha256,identity.current,
   path+': Review integration input');
  assert.equal(runtimeInputs.find(item=>item.path===path)?.sha256,identity.current,
   path+': head-neck source input');
  if(identity.old){
   assert.equal(sha(git(root,'show',`${before}:${path}`)),identity.old,path+': original exact source');
   assert.equal(git(root,'rev-parse',`${before}:${path}`).toString().trim(),identity.oldBlob);
   assert.equal(git(root,'rev-parse',`${introduced}:${path}`).toString().trim(),identity.currentBlob);
   assert.equal(git(root,'rev-parse',`${current}:${path}`).toString().trim(),identity.currentBlob);
  }
 }
 return {sha256:sourcePins['lib/regional-tours.ts'].current,
  gitBlob:sourcePins['lib/regional-tours.ts'].currentBlob,
  oldSha256:sourcePins['lib/regional-tours.ts'].old,
  oldGitBlob:sourcePins['lib/regional-tours.ts'].oldBlob};
}

export function assertRenalTourEpoch(historical,currentTours){
 if([nativeSuccessor,nativeCurrent].includes(CURRENT_ATLAS_REVISION)){
  assertNativeSuccessorRenalSourceBinding();
  const renalEra=currentTours.slice(0,51),root=currentAtlasDeliveryRoot();
  assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot:root,
   helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertNativeSuccessorTourDelivery(renalEra,currentTours);return;
 }
 if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20'){
  const root=currentAtlasDeliveryRoot(),renalEra=currentTours.slice(0,51);
  assertCurrentTourSource({atlasRoot:root});
  assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot:root,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:CURRENT_ATLAS_REVISION});return;
 }
 if(CURRENT_ATLAS_REVISION===latest){
  assertLatestRenalSourceBinding();
  const renalEra=currentTours.slice(0,51),root=currentAtlasDeliveryRoot();
  assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot:root,
   helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertLatestTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:latest});
  return;
 }
 assertCurrentRenalSourceBinding();
 assert(Array.isArray(historical)&&Array.isArray(currentTours));
 assert.equal(historical.length,51);assert.equal(currentTours.length,51);
 assert.equal(historical.reduce((sum,tour)=>sum+tour.steps.length,0),309);
 assert.equal(currentTours.reduce((sum,tour)=>sum+tour.steps.length,0),309);
 assert.equal(sha(JSON.stringify(historical)),oldTourSha,'Complete historical 51-tour array');
 assert.equal(sha(JSON.stringify(currentTours)),newTourSha,'Complete current 51-tour array');
 assert.equal(historical[19].id,'renal-organs-arteries-orientation');
 assert.equal(currentTours[19].id,historical[19].id);
 assert.equal(historical[19].revision,oldRevision);
 assert.equal(currentTours[19].revision,newRevision);
 assert.deepEqual(currentTours.slice(0,19),historical.slice(0,19),'All preceding tours exact');
 assert.deepEqual(currentTours[19],{...historical[19],revision:newRevision},'Only renal revision changes');
 assert.deepEqual(currentTours.slice(20),historical.slice(20),'All following tours exact');
}

export function assertRenalPortalPrefixEpoch(portal,currentTours){
 if([nativeSuccessor,nativeCurrent].includes(CURRENT_ATLAS_REVISION)){
  assertNativeSuccessorRenalSourceBinding();
  const renalEra=currentTours.slice(0,51),root=currentAtlasDeliveryRoot();
  assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot:root,
   helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertNativeSuccessorTourDelivery(renalEra,currentTours);return;
 }
 if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20'){
  const root=currentAtlasDeliveryRoot(),renalEra=currentTours.slice(0,51);
  assertCurrentTourSource({atlasRoot:root});
  assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot:root,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:CURRENT_ATLAS_REVISION});return;
 }
 if(CURRENT_ATLAS_REVISION===latest){
  assertLatestRenalSourceBinding();
  const renalEra=currentTours.slice(0,51),root=currentAtlasDeliveryRoot();
  assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot:root,
   helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertLatestTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:latest});
  return;
 }
 assertCurrentRenalSourceBinding();
 assert(Array.isArray(portal)&&Array.isArray(currentTours));
 assert.equal(portal.length,48);assert.equal(currentTours.length,51);
 assert.equal(sha(JSON.stringify(portal)),portalTourSha,'Complete portal historical array');
 assert.equal(sha(JSON.stringify(currentTours)),newTourSha,'Complete current 51-tour array');
 assert.equal(portal[19].id,'renal-organs-arteries-orientation');
 assert.equal(portal[19].revision,oldRevision);
 assert.equal(currentTours[19].revision,newRevision);
 assert.deepEqual(currentTours.slice(0,19),portal.slice(0,19),'Earlier historical prefix exact');
 assert.deepEqual(currentTours[19],{...portal[19],revision:newRevision},'Only renal revision changes');
 assert.deepEqual(currentTours.slice(20,27),portal.slice(20,27),'Later historical prefix exact');
}
