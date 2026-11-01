// Admission for the exact native toolbar successor; older tour epochs stay in
// their existing helpers. Main must pin the captured Website digest below.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const source='b8ec59eeb0ec554b86d7ce01be992967e203b6a5';
const tree='777e90bcf7448bf530ce381f401d71739b0019c5';
const parent='80d323ec504afc7867e3e716bf735681a29ab5bc';
const immediate='7751722a33a3b6772f42839e7888ba9a240c8944';
const historical='5e75b9ce7e46fed291748108edd7565c97dee101';
const sourceReceipt='F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/SOURCE_BOUND.json';
const sourceReceiptSha='f93d90a9a91462c4f706a9613800c221a59432a34630f4b6af495b6d8d2d0af2';
const parentReceipt='F:/VisibleMedicine/staging/20261024-orbital-ct-draft/SOURCE_BOUND.json';
const parentReceiptSha='b7b656f8419b42e26ea239e821f0b4726e6b673f2460834a52fec1d962231029';
const changed=[
 'app/body-explorer.css','components/ui/button.tsx','content/body-renderer-revision.json',
 'content/review-revisions.json','package.json','scripts/test-toolbar-contrast.mjs',
];
const oldTours=[
 'lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts',
 'lib/posterior-calf-tour.ts','lib/shoulder-tours.ts','lib/body-review-context.ts',
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{
 windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});

export function assertToolbarCurrentSource({atlasRoot,sourceCommit}={}){
 assert.equal(sourceCommit,source,'Only native b8ec toolbar source is admitted');
 assert.equal(typeof atlasRoot,'string');
 assert.equal(git(atlasRoot,'rev-parse','HEAD').toString().trim(),source);
 assert.equal(git(atlasRoot,'rev-parse','HEAD^{tree}').toString().trim(),tree);
 assert.equal(git(atlasRoot,'status','--porcelain=v1').toString().trim(),'');
 assert.equal(git(atlasRoot,'rev-parse','HEAD^').toString().trim(),immediate);
 assert.equal(git(atlasRoot,'rev-parse','HEAD^^').toString().trim(),parent);
 assert.equal(git(atlasRoot,'merge-base',historical,source).toString().trim(),historical);
 assert.deepEqual(git(atlasRoot,'diff','--name-only',parent,source).toString().trim().split(/\r?\n/),changed);
 assert.equal(sha(readFileSync(parentReceipt)),parentReceiptSha);
 const bytes=readFileSync(sourceReceipt);
 assert.equal(sha(bytes),sourceReceiptSha,'Sealed native toolbar receipt');
 const receipt=JSON.parse(bytes);
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.parentHead,parent);assert.equal(receipt.parentReceipt,parentReceipt);
 assert.equal(receipt.parentReceiptSha256,parentReceiptSha);
 const rows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
 assert.equal(rows.size,receipt.sourceRows.length,'Unique native source rows');
 for(const path of changed){
  const row=rows.get(path);assert(row,path);
  const native=readFileSync(atlasRoot+'/'+path);
  assert.equal(native.length,row.bytes,path);assert.equal(sha(native),row.sha256,path);
  assert.deepEqual(git(atlasRoot,'show',source+':'+path),native,path);
 }
 for(const path of [...oldTours,'app/body-content.ts','content/regional-teaching/head-neck.json',
  'lib/body-orbital-ct.ts','lib/body-display-catalog.ts','lib/body-review-material.ts']){
  const native=git(atlasRoot,'show',source+':'+path);
  assert.deepEqual(native,git(atlasRoot,'show',parent+':'+path),path+': 80d unchanged');
  assert.equal(sha(native),rows.get(path)?.sha256,path+': sealed native byte');
 }
 for(const path of oldTours)assert.deepEqual(git(atlasRoot,'show',source+':'+path),
  git(atlasRoot,'show',historical+':'+path),path+': genuine 5e75 tour source');
 return {source,tree,immediate,parent,historical,changed:changed.length,oldTours:oldTours.length};
}

const capturePath='F:/VisibleMedicine/staging/20261024-toolbar-website/CAPTURE.json';
const captureSha='cb99c351f291bed941e96d7b219aadc569be1b2d0d1609b9be5d5ca00ce21798';
const websiteRoot='F:/VisibleMedicine/staging/20261024-toolbar-website/website';
const fixturePath='tests/fixtures/current-atlas-delivery.json';
const toolbarWebsiteReceipt='F:/VisibleMedicine/staging/20261024-toolbar-website/SOURCE_BOUND.json';
const toolbarWebsiteReceiptSha='f03b2e81719843b3d62f6089d3362bb20404751f8f85f9f3525c85d386014ea1';
const historicalValidatorSha='02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e';
function validateToolbarCapturedDelivery(options){
 const receiptBytes=readFileSync(toolbarWebsiteReceipt);
 assert.equal(sha(receiptBytes),toolbarWebsiteReceiptSha,'Sealed toolbar Website source receipt');
 const receipt=JSON.parse(receiptBytes);
 const row=receipt.sourceRows.find(item=>item.path==='tests/current-atlas-delivery.mjs');
 assert.equal(row?.sha256,historicalValidatorSha,'Receipt binds the historical validator');
 const bytes=readFileSync(new URL('./fixtures/toolbar-current-atlas-delivery-54.mjs.raw',import.meta.url));
 assert.equal(bytes.length,row.bytes,'Complete historical validator preimage');
 assert.equal(sha(bytes),row.sha256,'Exact source-bound historical validator preimage');
 const source=bytes.toString('utf8');
 const constants=source.indexOf('const modules=');
 const start=source.indexOf('export function validateCurrentAtlasDelivery(');
 const end=source.indexOf('// Consumers cannot silently accept',start);
 assert(constants>=0&&start>constants&&end>start,'Complete historical validator body');
 const historical=new Function('assert','createHash','readFileSync','websiteRoot','defaultPin',
  `${source.slice(constants,start)}\n${source.slice(start,end).replace(/^export function /,'function ')}\nreturn validateCurrentAtlasDelivery;`)(assert,createHash,readFileSync,'',null);
 return historical(options);
}
const parentWebsiteReceipt='F:/VisibleMedicine/staging/20261024-orbital-ct-website/SOURCE_BOUND.json';
const parentWebsiteReceiptSha='bdbb6eada06ea817ec27ef1da386563be94c5a417a140b03e37c54bf17e0a758';
export function assertToolbarCurrentDisplay({root,manifest,binding,read=p=>readFileSync(root+'/'+p)}){
 assert.equal(resolve(root),resolve(websiteRoot),'Only the exact toolbar Website successor is admitted');
 assert.match(captureSha,/^[a-f0-9]{64}$/,'Main must pin the exact sealed CAPTURE.json SHA256');
 const captureBytes=readFileSync(capturePath);
 assert.equal(sha(captureBytes),captureSha,'Only the main-captured successor is admitted');
 assert.equal(sha(readFileSync(parentWebsiteReceipt)),parentWebsiteReceiptSha);
 const capture=JSON.parse(captureBytes);
 assert.equal(capture.previewChanged,false);
 assert.equal(capture.pin.source,source);assert.equal(capture.pin.sourceTree,tree);
 assert.equal(capture.pinSha256,sha(read(fixturePath)));
 assert.equal(capture.binding,binding.sha256);
 assert.equal(capture.sourceFiles,1604);assert.equal(capture.inputs,1807);
 assert.equal(capture.viewerFiles,54);assert.equal(capture.viewerPackages,24);
 assert.equal(capture.sourceFiles,manifest.files.length);
 assert.equal(capture.inputs,binding.inputs.length);
 const pin=JSON.parse(read(fixturePath));
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.deepEqual(pin,capture.pin,'Only captured delivery pin');
 assert.deepEqual(validateToolbarCapturedDelivery({pin,root,read}),pin,
  'Exact source-bound 54-file delivery validator admits the captured candidate');
 assert.equal(pin.reviewIntegration,binding.sha256);
 assert.equal(pin.reviewSourceFiles,manifest.files.length);
 assert.equal(pin.viewerFiles,capture.viewerFiles);assert.equal(pin.viewerPackages,capture.viewerPackages);
 assert.deepEqual(pin.runtimeSources,{
  'head-neck':source,shoulder:source,'lower-limb':source,'female-pelvis':source,
 });
 for(const [path,digest] of Object.entries(pin.documents))assert.equal(sha(read(path)),digest,path);
 assert.equal(manifest.revision,source);assert.equal(manifest.websiteIntegrationSha256,binding.sha256);
 assert.equal(binding.sourceCommit,source);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 for(const row of binding.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 for(const row of manifest.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,capture.viewerFiles);assert.equal(viewer.packages.length,capture.viewerPackages);
 for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
 return {source,integration:binding.sha256,imported:manifest.files.length,inputs:binding.inputs.length};
}
