import assert from 'node:assert/strict';
import {readFileSync, realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const historicalCervicalSite='F:/VisibleMedicine/staging/20261024-cervical-vascular-website/website';
const historicalParent='F:/VisibleMedicine/staging/20261024-guided-review-navigation/website';
export const cervicalHistoryNativeRoot=process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas';
const native=cervicalHistoryNativeRoot;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path));
const options={windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:256e6};
const git=(...args)=>execFileSync('git',['-C',native,...args],options);
assert.equal(realpathSync(native),realpathSync(git('rev-parse','--show-toplevel').toString().trim()),'Historical native repository root, never the website repository');

// Source is read only from named Git objects. The checkout is not substituted
// for historical bytes; one batch verifies the full declared source closure.
function verifyGitRows(requests){
 const unique=new Map();
 for(const row of requests){const key=row.source+':'+row.path;
  if(unique.has(key))assert.equal(unique.get(key).sha256,row.sha256,'Cross-manifest source identity: '+key);
  else unique.set(key,row);
 }
 const rows=[...unique.values()];
 const bytes=execFileSync('git',['-C',native,'cat-file','--batch'],{...options,input:rows.map(row=>row.source+':'+row.path+'\n').join('')});
 let offset=0;
 for(const row of rows){
  const end=bytes.indexOf(10,offset);assert(end>=offset);
  const header=bytes.subarray(offset,end).toString();
  assert.match(header,/^[a-f0-9]{40} blob \d+$/,'Committed source exists: '+row.source+':'+row.path);
  const size=Number(header.split(' ')[2]);offset=end+1;
  assert.equal(sha(bytes.subarray(offset,offset+size)),row.sha256,'Native source '+row.source+':'+row.path);
  offset+=size;assert.equal(bytes[offset++],10);
 }
 assert.equal(offset,bytes.length,'Complete Git batch consumed');
}

export function verifyCervicalDeliveryClosure(root){
 const review=json(resolve(root,'atlas-review/manifest.json'));
 const binding=json(resolve(root,'atlas-review/integration-inputs.json'));
 const viewer=json(resolve(root,'public/atlas-review-viewer/manifest.json'));
 assert.equal(binding.sourceCommit,review.revision);
 assert.equal(viewer.sourceCommit,review.revision);
 assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
 assert.equal(review.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 const requests=[];
 for(const row of review.files){
  assert.equal(sha(readFileSync(resolve(root,'atlas-review',row.path))),row.importedSha256,'Every imported Review file: '+row.path);
  requests.push({source:review.revision,path:row.path,sha256:row.sourceSha256});
 }
 for(const row of binding.inputs)assert.equal(sha(readFileSync(resolve(root,row.path))),row.sha256,'Every bound input: '+row.path);
 for(const row of viewer.files)assert.equal(sha(readFileSync(resolve(root,'public/atlas-review-viewer',row.path))),row.sha256,'Every protected runtime file: '+row.path);
 const sources={};
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base=resolve(root,'public/atlas-runtime',name),manifest=json(resolve(base,'manifest.json'));
  sources[name]=manifest.sourceCommit;
  assert.equal(manifest.patientDataIncluded,false);
  for(const field of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])assert(manifest[field]===false||manifest[field]===undefined,field);
  for(const row of manifest.files)assert.equal(sha(readFileSync(resolve(base,row.path))),row.sha256,'Every learner runtime file: '+name+'/'+row.path);
  const inputs=json(resolve(base,'source-inputs.json'));
  for(const row of inputs)requests.push({source:manifest.sourceCommit,...row});
 }
 assert.equal(sources['head-neck'],review.revision,'Review and root learner share source identity');
 verifyGitRows(requests);
 return {source:review.revision,runtimeSources:sources};
}

function sealedWebsite(root,receiptPath,expected){
 const bytes=readFileSync(receiptPath);assert.equal(sha(bytes),expected,'Retained historical receipt');
 const receipt=JSON.parse(bytes);
 for(const row of receipt.sourceRows)assert.equal(sha(readFileSync(resolve(root,row.path))),row.sha256,'Every sealed historical website file: '+row.path);
 const closure=verifyCervicalDeliveryClosure(root);assert.equal(closure.source,receipt.atlasHead);
 return receipt;
}
sealedWebsite(historicalCervicalSite,'F:/VisibleMedicine/staging/20261024-cervical-vascular-website/SOURCE_BOUND.json','d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
sealedWebsite(historicalParent,'F:/VisibleMedicine/staging/20261024-guided-review-navigation/SOURCE_BOUND.json','c5fceb2bc64d8b0d4464b3da940bd3721111657d9a4d57f2dbf5b8b30fe0b6f3');
// This is the original hash-sealed 54-file validator in its original historical
// root. It is imported once and registers no test cases. Current validation is
// independently imported by the caller from the current website.
const validator=resolve(historicalCervicalSite,'tests/current-atlas-delivery.mjs');
assert.equal(sha(readFileSync(validator)),'02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e');
export const validateHistoricalCervicalDelivery=(await import(pathToFileURL(validator).href)).validateCurrentAtlasDelivery;
