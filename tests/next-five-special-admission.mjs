// Exact admissions for two historical tests that do not fit the shared feature helper.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const old='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const oldTree='1bd327fb20a52b35bec584675c457173c548e24b';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(site+'/'+path));
const exact={
 'content/circle-willis-imaging-pins.json':'8891733101134e78fad8a36d1fd8b7387ea64b20ed2c2d36f3a20e978d6deece',
 'content/coronary-arterial-us-pins.json':'9277caac4d2b97c75fced2f393b481f0c84800897a9faa9b28bd9c12e8854a18',
 'content/coronary-arterial-xray.ts':'e85cae9bfeb23f0b5b4dd619eb13c38d73743ef9a7a1c43f91bba84b5bcc2ef8',
 'lib/coronary-arterial-xray.ts':'399c041f58d26fbd9af7628dc7e18daea97f8a2e234961a08a4f699148274c16',
};

function admit(historical,paths){
 assert.equal(historical,old,'Literal historical feature epoch');
 const pin=validateCurrentAtlasDelivery();
 assert.notEqual(pin.source,old,'Only a later checked delivery needs admission');
 const atlas=currentAtlasDeliveryRoot();
 const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(git('rev-parse',old+'^{tree}').toString().trim(),oldTree);
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,pin.source);
 assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
 const learners=['head-neck','shoulder'].map(name=>({name,
  inputs:json('public/atlas-runtime/'+name+'/source-inputs.json')}));
 for(const path of paths){
  const digest=exact[path];assert(digest,path+': exact admitted path');
  const before=git('show',old+':'+path);
  const now=git('show',pin.source+':'+path);
  assert.equal(sha(before),digest,path+': original Git source');
  assert.deepEqual(now,before,path+': changed across epochs');
  const record=review.files.find(file=>file.path===path);assert(record,path+': Review record');
  assert.equal(record.sourceSha256,digest,path+': Review source');
  assert.equal(record.importedSha256,digest,path+': Review imported');
  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),digest,path+': Review bytes');
  for(const {name,inputs}of learners){
   // The original coronary US JSON learner audit uses CRLF checkout bytes.
   const learnerDigest=path==='content/coronary-arterial-us-pins.json'
    ?sha(Buffer.from(before.toString('utf8').replace(/\n/g,'\r\n'))):digest;
   assert.equal(inputs.find(row=>row.path===path)?.sha256,learnerDigest,name+': '+path);
  }
 }
 return pin.source;
}

export function admitCircleWillis(historical){
 return admit(historical,['content/circle-willis-imaging-pins.json']);
}
export function admitCoronaryXray(historical){
 return admit(historical,[
  'content/coronary-arterial-us-pins.json',
  'content/coronary-arterial-xray.ts',
  'lib/coronary-arterial-xray.ts',
 ]);
}
