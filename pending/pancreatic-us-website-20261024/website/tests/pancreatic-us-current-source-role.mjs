// Proposed test-only admission for one pancreatic venous US Website successor.
// Main replaces the capture digest after sealing CAPTURE.json and copies this
// file into the candidate Website tests directory. No previous role is repinned.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertReviewPagerCurrentDisplay} from
 'file:///F:/VisibleMedicine/staging/20261024-review-pager-website/website/tests/review-pager-ui-source-role.mjs';

const source='6e810b188dde401f6c19a970928f316a479696df';
const tree='90afe5163dbd9386aa37c93d525fa4c70e8c1b9e';
const parent='b8ec59eeb0ec554b86d7ce01be992967e203b6a5';
const nativeRoot='F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas';
const nativeReceipt='F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/SOURCE_BOUND.json';
const nativeReceiptSha='b7f04acd1800aa5a01712923159ea26638bdd63f35cb2c9f29ba8ac3ba120c71';
const parentNativeReceipt='F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/SOURCE_BOUND.json';
const parentNativeReceiptSha='f93d90a9a91462c4f706a9613800c221a59432a34630f4b6af495b6d8d2d0af2';
const site='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const capturePath='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/CAPTURE.json';
const captureSha='e47f7aefcca5040b515c7710328f47730b2b1af203bff6eb6f85e87a0d980c2e';
const parentSite='F:/VisibleMedicine/staging/20261024-review-pager-website/website';
const parentWebsiteReceipt='F:/VisibleMedicine/staging/20261024-review-pager-website/SOURCE_BOUND.json';
const parentWebsiteReceiptSha='4058a3a368dc9573efc74c16d3b7e636057566bebfbb88232095322a459d21ea';
const changed=['LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts',
 'content/body-renderer-revision.json','content/body-review-display-pins.json',
 'content/regional-teaching/abdomen.json','lib/body-pancreatic-venous-us.ts',
 'package.json','scripts/test-body-pancreatic-venous-us.mjs',
 'scripts/test-pancreatic-venous-us-cohort.mjs','scripts/test-pancreatic-venous-us-unit.mjs'];
const historicalTour=['lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts',
 'lib/posterior-calf-tour.ts','lib/shoulder-tours.ts','lib/body-review-context.ts'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{
 windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const parse=(read,path)=>JSON.parse(read(path));

export function assertPancreaticUsCurrentSource({atlasRoot=nativeRoot,sourceCommit=source}={}){
 assert.equal(resolve(atlasRoot),resolve(nativeRoot),'Only the exact native checkout');
 assert.equal(sourceCommit,source,'Only the exact new native revision');
 assert.equal(git(atlasRoot,'rev-parse','HEAD').toString().trim(),source);
 assert.equal(git(atlasRoot,'rev-parse','HEAD^{tree}').toString().trim(),tree);
 assert.equal(git(atlasRoot,'status','--porcelain=v1').toString().trim(),'');
 assert.equal(git(atlasRoot,'merge-base',parent,source).toString().trim(),parent);
 assert.deepEqual(git(atlasRoot,'diff','--name-only',parent,source).toString().trim().split(/\r?\n/),changed);
 assert.equal(sha(readFileSync(parentNativeReceipt)),parentNativeReceiptSha);
 const bytes=readFileSync(nativeReceipt);assert.equal(sha(bytes),nativeReceiptSha);
 const receipt=JSON.parse(bytes);
 assert.equal(receipt.atlasRoot??receipt.atlas,nativeRoot);
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.parentHead,parent);assert.equal(receipt.parentReceipt,parentNativeReceipt);
 assert.equal(receipt.parentReceiptSha256,parentNativeReceiptSha);
 const rows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
 assert.equal(rows.size,receipt.sourceRows.length);
 for(const path of changed){
  const row=rows.get(path);assert(row,path);
  const bytes=readFileSync(atlasRoot+'/'+path);
  assert.equal(bytes.length,row.bytes,path);assert.equal(sha(bytes),row.sha256,path);
  assert.deepEqual(git(atlasRoot,'show',source+':'+path),bytes,path);
 }
 for(const path of [...historicalTour,'lib/body-orbital-ct.ts','components/ui/button.tsx',
  'app/body-explorer.css','content/regional-teaching/head-neck.json']){
  const bytes=git(atlasRoot,'show',source+':'+path);
  assert.deepEqual(bytes,git(atlasRoot,'show',parent+':'+path),path);
  assert.equal(sha(bytes),rows.get(path)?.sha256,path);
 }
 const body=git(atlasRoot,'show',source+':app/body-content.ts').toString();
 const importLine="import { bodyPancreaticVenousUsLesson } from '../lib/body-pancreatic-venous-us';\n";
 const branch="  const pancreaticVenousUs = bodyPancreaticVenousUsLesson(s, tab);\n  if (pancreaticVenousUs) return pancreaticVenousUs;\n";
 assert.equal(body.split(importLine).length,2);assert.equal(body.split(branch).length,2);
 assert.deepEqual(Buffer.from(body.replace(importLine,'').replace(branch,'')),
  git(atlasRoot,'show',parent+':app/body-content.ts'),
  'Whole previous body resolver survives one exact early source route');
 return {source,tree,parent,changed:changed.length};
}

export function assertPancreaticUsCurrentDisplay({root=site,
 read=p=>readFileSync(root+'/'+p),manifest=parse(read,'atlas-review/manifest.json'),
 binding=parse(read,'atlas-review/integration-inputs.json')}={}){
 assert.equal(resolve(root),resolve(site),'Only the exact new Website checkout');
 assert.match(captureSha,/^[a-f0-9]{64}$/,'Main must pin CAPTURE.json SHA256');
 const captureBytes=readFileSync(capturePath);assert.equal(sha(captureBytes),captureSha);
 assert.equal(sha(readFileSync(parentWebsiteReceipt)),parentWebsiteReceiptSha);
 const parentProof=JSON.parse(readFileSync(parentWebsiteReceipt));
 assert.equal(parentProof.website,parentSite);assert.equal(parentProof.atlasHead,parent);
 const prior=assertReviewPagerCurrentDisplay({root:parentSite});
 assert.equal(prior.source,parent);
 const capture=JSON.parse(captureBytes);
 assert.equal(capture.previewChanged,false);
 assert.equal(capture.pin.source,source);assert.equal(capture.pin.sourceTree,tree);
 assert.equal(capture.pinSha256,sha(read('tests/fixtures/current-atlas-delivery.json')));
 assert.equal(capture.binding,binding.sha256);
 const pin=parse(read,'tests/fixtures/current-atlas-delivery.json');
 assert.deepEqual(pin,capture.pin,'Only exact main-captured pin');
 assert.deepEqual(validateCurrentAtlasDelivery({pin,root,read}),pin,
  'Run the unchanged current-delivery contract');
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,binding.sha256);
 assert.deepEqual(pin.runtimeSources,{'head-neck':source,shoulder:source,
  'lower-limb':source,'female-pelvis':source});
 assert.equal(manifest.revision,source);
 assert.equal(manifest.websiteIntegrationSha256,binding.sha256);
 assert.equal(binding.sourceCommit,source);
 assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 assert.equal(manifest.files.length,pin.reviewSourceFiles);
 assert.equal(binding.inputs.length,capture.inputs);
 assert.equal(manifest.files.length,capture.sourceFiles);
 for(const [path,digest] of Object.entries(pin.documents))assert.equal(sha(read(path)),digest,path);
 for(const row of binding.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 for(const row of manifest.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 for(const path of ['app/body-content.ts','lib/body-pancreatic-venous-us.ts',
  'content/regional-teaching/abdomen.json'])
  assert.deepEqual(read('atlas-review/'+path),readFileSync(nativeRoot+'/'+path),
   path+': protected Review must import exact new native source');
 const viewer=parse(read,'public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,pin.viewerFiles);assert.equal(viewer.packages.length,pin.viewerPackages);
 for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
 for(const name of Object.keys(pin.runtimeSources)){
  const base='public/atlas-runtime/'+name+'/';
  const module=parse(read,base+'manifest.json');
  assert.equal(module.sourceCommit,source);assert.equal(module.patientDataIncluded,false);
  for(const key of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])
   assert(module[key]===false||module[key]===undefined,name+':'+key);
  const rows=parse(read,base+'source-inputs.json');
  for(const row of rows)assert.equal(sha(readFileSync(nativeRoot+'/'+row.path)),row.sha256,row.path);
  for(const row of module.files)assert.equal(sha(read(base+row.path)),row.sha256,base+row.path);
 }
 const inventory=parse(read,'lib/atlas-model-inventory.json');
 assert.equal(inventory.models.length,137);
 for(const entry of inventory.sources){
  assert.equal(entry.sourceCommit,source);
  assert.equal(entry.manifestSha256,sha(read('public/atlas-runtime/'+entry.module+'/manifest.json')));
 }
 assert.equal(sha(read('components/ClinicalReviewInbox.tsx')),
  'c80e693ec12ceae85f959563d1ee1746d4b543bc78ebf03c909bf6eb6e2a7897',
  'Review pager source stays byte-exact');
 return {source,tree,integration:binding.sha256,inputs:binding.inputs.length,sourceFiles:manifest.files.length};
}
