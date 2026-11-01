// Test-only current delivery contract. Historical tests retain their own epochs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
const websiteRoot=fileURLToPath(new URL('../',import.meta.url));
const defaultPin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url)));
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 ...modules.flatMap(name=>['manifest.json','source-inputs.json'].map(file=>`public/atlas-runtime/${name}/${file}`))];

export function validateCurrentAtlasDelivery({pin=defaultPin,root=websiteRoot,read=(path)=>readFileSync(root+'/'+path)}={}){
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.deepEqual(Object.keys(pin).sort(),['schema','source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles','viewerFiles','viewerPackages','documents'].sort());
 assert.match(pin.source,/^[a-f0-9]{40}$/);assert.match(pin.sourceTree,/^[a-f0-9]{40}$/);assert.match(pin.reviewIntegration,/^[a-f0-9]{64}$/);
 assert(pin.runtimeSources&&typeof pin.runtimeSources==='object'&&!Array.isArray(pin.runtimeSources));
 assert.deepEqual(Object.keys(pin.runtimeSources).sort(),[...modules].sort());
 for(const name of modules)assert.match(pin.runtimeSources[name],/^[a-f0-9]{40}$/,'Exact runtime source: '+name);
 assert.equal(pin.runtimeSources['head-neck'],pin.source,'Review and regional root runtime share the current source');
 assert(Number.isSafeInteger(pin.reviewSourceFiles)&&pin.reviewSourceFiles>0);
 assert.equal(pin.viewerFiles,63);assert.equal(pin.viewerPackages,24);
 assert.deepEqual(Object.keys(pin.documents).sort(),[...paths].sort());
 const documents=new Map(paths.map(path=>{assert.match(pin.documents[path],/^[a-f0-9]{64}$/);const bytes=read(path);assert.equal(sha(bytes),pin.documents[path],'Current delivery changed: '+path);return[path,JSON.parse(bytes)];}));
 const review=documents.get('atlas-review/manifest.json'),inputs=documents.get('atlas-review/integration-inputs.json'),viewer=documents.get('public/atlas-review-viewer/manifest.json'),inventory=documents.get('lib/atlas-model-inventory.json');
 assert.equal(review.revision,pin.source);assert.equal(review.files.length,pin.reviewSourceFiles);
 assert.equal(new Set(review.files.map(f=>f.path)).size,review.files.length);
 assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(inputs.sourceCommit,pin.source);assert.equal(inputs.sha256,pin.reviewIntegration);assert.equal(sha(JSON.stringify(inputs.inputs)),pin.reviewIntegration);
 assert.equal(viewer.sourceCommit,pin.source);assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,pin.viewerFiles);assert.equal(viewer.packages.length,pin.viewerPackages);
 assert.equal(inventory.purpose,'licensed-atlas-model-staging-only');
 assert.deepEqual(new Set(inventory.sources.map(s=>s.module)),new Set(modules));
 assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(m=>m.paths).length,144);
 assert.equal(inventory.models.reduce((n,m)=>n+m.bytes,0),199072480);
 for(const name of modules){
  const base=`public/atlas-runtime/${name}/`,manifest=documents.get(base+'manifest.json'),sourceInputs=documents.get(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);assert.equal(manifest.patientDataIncluded,false);
  for(const key of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])assert(manifest[key]===false||manifest[key]===undefined,'No widened clearance: '+name+':'+key);
  assert.equal(new Set(manifest.files.map(f=>f.path)).size,manifest.files.length);
  assert.equal(new Set(sourceInputs.map(f=>f.path)).size,sourceInputs.length);
  const entry=inventory.sources.find(s=>s.module===name);assert.equal(entry.sourceCommit,pin.runtimeSources[name]);assert.equal(entry.manifestSha256,pin.documents[base+'manifest.json']);
 }
 return structuredClone(pin);
}

// Consumers cannot silently accept whatever revision happens to be on disk.
export const CURRENT_ATLAS_REVISION=validateCurrentAtlasDelivery().source;
export function currentAtlasDeliveryRoot({pin:requestedPin}={}){
 const pin=validateCurrentAtlasDelivery(requestedPin===undefined?{}:{pin:requestedPin}),root=checkedAtlasSourceRepo(pin.source);
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(git('rev-parse','HEAD^{tree}'),pin.sourceTree,'Exact current Atlas tree');
 assert.equal(git('status','--porcelain'),'','Current Atlas source changed');
 return root;
}
