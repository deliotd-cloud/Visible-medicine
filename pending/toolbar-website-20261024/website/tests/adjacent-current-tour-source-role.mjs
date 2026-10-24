import {assertToolbarCurrentSource,assertToolbarCurrentDisplay} from './toolbar-current-source-role.mjs';
// Separate b79 admission. Never relabel the original 66ac/5e75 theorem.
import {assertOrbitalCtCurrentTourSource,assertOrbitalCtCurrentDisplay} from './orbital-ct-current-source-role.mjs';
import assert from 'node:assert/strict';
import {assertNativeSliceCurrentDisplay} from './native-slice-current-display.mjs';
import {assertHeadStudySetCurrentDisplay} from './head-study-set-current-display.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {assertLatestTourDelivery} from './tour-playback-source-role.mjs';
export {assertCompleteGuidedReview} from './guided-review-completeness.mjs';
const current='b79e110d2d28f18993263926ba35aa7a3f478b20';
const tree='0dd97cc55ef9aff3493b91752309d1d661c0b0c8';
const historical='5e75b9ce7e46fed291748108edd7565c97dee101';
const site=fileURLToPath(new URL('../',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
let sourceVerified=false;
export function assertCurrentTourSource({atlasRoot=currentAtlasDeliveryRoot(),sourceCommit=validateCurrentAtlasDelivery().source}={}){
 if(sourceCommit==='b8ec59eeb0ec554b86d7ce01be992967e203b6a5'){
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,sourceCommit);
  assertToolbarCurrentSource({atlasRoot,sourceCommit});
  assertToolbarCurrentDisplay({root:site,manifest:JSON.parse(readFileSync(site+'/atlas-review/manifest.json')),binding:JSON.parse(readFileSync(site+'/atlas-review/integration-inputs.json'))});
  return {sha256:'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d',gitBlob:'3c5647f29383ba5699b6d387ff528f6b0f8f57b9',oldSha256:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',oldGitBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136'};
 }
 if(sourceCommit==='80d323ec504afc7867e3e716bf735681a29ab5bc'){
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,sourceCommit);
  assertOrbitalCtCurrentTourSource({atlasRoot,sourceCommit});
  assertOrbitalCtCurrentDisplay({root:site,manifest:JSON.parse(readFileSync(site+'/atlas-review/manifest.json')),binding:JSON.parse(readFileSync(site+'/atlas-review/integration-inputs.json'))});
  return {sha256:'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d',gitBlob:'3c5647f29383ba5699b6d387ff528f6b0f8f57b9',oldSha256:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',oldGitBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136'};
 }
 assert.equal(sourceCommit,current,'Only exact b79 Website delivery is current');
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,current);assert.equal(pin.sourceTree,tree);
 const git=(...a)=>execFileSync('git',['-C',atlasRoot,...a],{windowsHide:true,maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(git('rev-parse','HEAD').toString().trim(),current);
 assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),tree);
 assert.equal(git('status','--porcelain').toString().trim(),'');
 if(!sourceVerified){
  const raw=readFileSync('F:/VisibleMedicine/staging/20261024-cervical-vascular-website/SOURCE_BOUND.json');
  assert.equal(sha(raw),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
  const proof=JSON.parse(raw);assert.equal(proof.atlasHead,current);assert.equal(proof.atlasTree,tree);
  const byPath=new Map(proof.sourceRows.map(row=>[row.path,row]));
  const manifest=JSON.parse(readFileSync(site+'/atlas-review/manifest.json'));
  const binding=JSON.parse(readFileSync(site+'/atlas-review/integration-inputs.json'));
  if(binding.sha256==='e5e71eaee78003764fd2fdc9e7a85907751ef44c566cf2ac953318c1937c9969'){
  assert.equal(sha(readFileSync(site+'/atlas-review/manifest.json')),byPath.get('atlas-review/manifest.json').sha256);
  assert.equal(sha(readFileSync(site+'/atlas-review/integration-inputs.json')),byPath.get('atlas-review/integration-inputs.json').sha256);
  assert.equal(binding.sha256,'e5e71eaee78003764fd2fdc9e7a85907751ef44c566cf2ac953318c1937c9969');
  assert.equal(binding.sourceCommit,current);assert.equal(binding.inputs.length,1806);assert.equal(manifest.files.length,1603);
  for(const row of manifest.files){const file='atlas-review/'+row.path;assert.equal(sha(readFileSync(site+'/'+file)),byPath.get(file)?.sha256,file);}
  }else if(binding.sha256==='bc4cc568418147387cfeccf649c743256a9c936279bed16cec3f7eed2712f75e')assertNativeSliceCurrentDisplay({root:site,manifest,binding});
  else assertHeadStudySetCurrentDisplay({root:site,manifest,binding});
  for(const row of binding.inputs)assert.equal(sha(readFileSync(site+'/'+row.path)),row.sha256,row.path);
  for(const path of ['lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts','lib/posterior-calf-tour.ts','lib/shoulder-tours.ts','lib/body-review-context.ts','app/body-content.ts'])
   assert.deepEqual(git('show',current+':'+path),git('show',historical+':'+path),path+': complete unchanged historical tour source');
  // body-review-material has later source-bound reasoning additions; it is
  // authenticated by the full b79 import/binding above, never compared as old.
  sourceVerified=true;
 }
 return {sha256:'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d',gitBlob:'3c5647f29383ba5699b6d387ff528f6b0f8f57b9',oldSha256:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',oldGitBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136'};
}
export function assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot,sourceCommit}){
 assertCurrentTourSource({atlasRoot,sourceCommit});
 // Retain and execute every original historical bank/parent/blob/array check.
 return assertLatestTourDelivery(renalEra,currentTours,{atlasRoot,sourceCommit:historical});
}
