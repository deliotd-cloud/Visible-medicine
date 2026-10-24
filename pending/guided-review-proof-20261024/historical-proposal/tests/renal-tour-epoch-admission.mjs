// Closed 389 -> 4f20 renal source admission. Historical tour bytes stay historical.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertHistoricalRenalTourEpoch,assertHistoricalRenalPortalPrefixEpoch,
 assertLatestTourDelivery} from './tour-playback-source-role.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const before='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const introduced='4f20ae0b62b9e0dab5936b430575a983dcdd934e';
const current='2381efe43b75f8a7fb768a069eecd7268c508dac';
const latest='5e75b9ce7e46fed291748108edd7565c97dee101';
const latestTree='005b7656f517efbd86e32a282e3d7880fc052bfe';
const hamstringIntroduction='7978478992f54ea68e0f53c3d195c459c7b80068';
const latestRegionalSha='b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d';
const latestRegionalBlob='3c5647f29383ba5699b6d387ff528f6b0f8f57b9';
const oldRevision='renal-organs-arteries-orientation-v1';
const newRevision='renal-organs-arteries-orientation-20261022-source-bound-draft';
const oldTourSha='57bd87627a189b7d3b50621b08b18c13b0b43e705c57dfa05c9d6f248cd34041';
const newTourSha='446f2e8e18a60fee7a1e98281263c090a2e3f45109e94531ea055471fd28bc75';
const portalTourSha='2766dbafed9e364bffc3c37aa52c1f0e3b7d92e0bb46c62f250d247ae0442b3f';
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
