// Admit an unchanged historical teaching source to the checked current delivery.
// Historical feature hashes remain literal in their original tests.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,
 validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertCurrentRenalSourceBinding} from './renal-tour-epoch-admission.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const historicalTree='1bd327fb20a52b35bec584675c457173c548e24b';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(site+'/'+path));

export function admitPreservedClinicalReview({revision,sourceHashes,learnerModules}){
 assert.equal(revision,historical,'Original feature epoch must remain literal');
 assert(sourceHashes&&Object.keys(sourceHashes).length>=2,'Explicit historical feature paths');
 assert(Array.isArray(learnerModules)&&learnerModules.length>0,'Explicit learner scopes');
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,pin.source);
 assert.notEqual(pin.source,historical,'This seam is only for a later checked delivery');
 const root=currentAtlasDeliveryRoot();
 const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(git('rev-parse',historical+'^{tree}').toString().trim(),historicalTree);
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,pin.source);
 assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
 const learners=new Map(learnerModules.map(name=>{
  assert(['head-neck','shoulder','lower-limb','female-pelvis'].includes(name));
  const base='public/atlas-runtime/'+name+'/';
  const manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name);
  return [name,json(base+'source-inputs.json')];
 }));
 assert.equal(learners.size,learnerModules.length,'Unique learner scopes');
 for(const [path,expected] of Object.entries(sourceHashes)){
  assert(/^(?:content|lib)\/[a-z0-9-]+\.(?:ts|json)$/.test(path),'Explicit source text path');
  assert.match(expected,/^[a-f0-9]{64}$/);
  const old=git('show',historical+':'+path);
  const current=git('show',pin.source+':'+path);
  assert.equal(sha(old),expected,path+': original historical source');
  const currentExpected=path==='lib/regional-tours.ts'?
   assertCurrentRenalSourceBinding().sha256:expected;
  if(path==='lib/regional-tours.ts')assert.equal(sha(current),currentExpected,path+': exact later renal admission');
  else assert.deepEqual(current,old,path+': unchanged source across epochs');
  const record=review.files.find(file=>file.path===path);
  assert(record,path+': Review source record');
  assert.equal(record.sourceSha256,currentExpected,path+': Review source');
  assert.equal(record.importedSha256,currentExpected,path+': Review import');
  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),currentExpected,path+': Review bytes');
  for(const [name,inputs] of learners){
   const family=git('show',pin.runtimeSources[name]+':'+path);
   const familyExpected=path==='lib/regional-tours.ts'&&pin.runtimeSources[name]===pin.source?currentExpected:expected;
   assert.equal(sha(family),familyExpected,name+': exact source in admitted family '+path);
   assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(family),name+': '+path);
  }
 }
 return pin.source;
}
