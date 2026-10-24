// New 80d orbital CT admission. The b79/5e75 tour theorem remains in its old helper.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const source='80d323ec504afc7867e3e716bf735681a29ab5bc';
const tree='6bef533e9242fbd33d8393cf62082030bf6e1042';
const parent='b79e110d2d28f18993263926ba35aa7a3f478b20';
const historical='5e75b9ce7e46fed291748108edd7565c97dee101';
const receiptPath='F:/VisibleMedicine/staging/20261024-orbital-ct-draft/SOURCE_BOUND.json';
const receiptSha='b7b656f8419b42e26ea239e821f0b4726e6b673f2460834a52fec1d962231029';
const changed=[
 'LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json',
 'content/body-review-display-pins.json','content/regional-teaching/head-neck.json',
 'lib/body-orbital-ct.ts','package.json','scripts/test-body-orbital-ct.mjs',
];
const oldTourFiles=[
 'lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts',
 'lib/posterior-calf-tour.ts','lib/shoulder-tours.ts','lib/body-review-context.ts',
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{
 windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});

export function assertOrbitalCtCurrentTourSource({atlasRoot,sourceCommit}={}){
 assert.equal(sourceCommit,source,'Only native 80d orbital CT source is admitted');
 assert.equal(typeof atlasRoot,'string');
 assert.equal(git(atlasRoot,'rev-parse','HEAD').toString().trim(),source);
 assert.equal(git(atlasRoot,'rev-parse','HEAD^{tree}').toString().trim(),tree);
 assert.equal(git(atlasRoot,'status','--porcelain=v1').toString().trim(),'');
 assert.equal(git(atlasRoot,'rev-parse','HEAD^').toString().trim(),parent);
 assert.equal(git(atlasRoot,'merge-base',historical,source).toString().trim(),historical);
 assert.deepEqual(git(atlasRoot,'diff','--name-only',parent,source).toString().trim().split(/\r?\n/),changed);

 const bytes=readFileSync(receiptPath);
 assert.equal(sha(bytes),receiptSha,'Sealed native source receipt');
 const receipt=JSON.parse(bytes);
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.parentHead,parent);
 const rows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
 assert.equal(rows.size,receipt.sourceRows.length,'Unique sealed source paths');
 for(const path of changed){
  const row=rows.get(path);assert(row,path);
  const native=readFileSync(atlasRoot+'/'+path);
  assert.equal(native.length,row.bytes,path);
  assert.equal(sha(native),row.sha256,path);
  assert.deepEqual(git(atlasRoot,'show',source+':'+path),native,path);
 }
 for(const path of oldTourFiles){
  const native=git(atlasRoot,'show',source+':'+path);
  assert.deepEqual(native,git(atlasRoot,'show',parent+':'+path),path+': b79');
  assert.deepEqual(native,git(atlasRoot,'show',historical+':'+path),path+': 5e75');
  assert.equal(sha(native),rows.get(path)?.sha256,path+': sealed native byte');
 }
 const body=git(atlasRoot,'show',source+':app/body-content.ts').toString();
 const importLine="import {bodyOrbitalCtLesson} from '../lib/body-orbital-ct';\n";
 const dispatch="  const orbitalCtOrientation = bodyOrbitalCtLesson(s, tab);\n  if (orbitalCtOrientation) return orbitalCtOrientation;\n";
 assert.equal(body.split(importLine).length,2,'One exact import seam');
 assert.equal(body.split(dispatch).length,2,'One exact lesson dispatch seam');
 const inverse=Buffer.from(body.replace(importLine,'').replace(dispatch,''));
 assert.deepEqual(inverse,git(atlasRoot,'show',parent+':app/body-content.ts'),
  'Only the exact CT dispatcher changes the complete b79 body source');
 assert.deepEqual(inverse,git(atlasRoot,'show',historical+':app/body-content.ts'),
  'Complete original 5e75 body source remains the authentic tour epoch');
 return {source,tree,parent,historical,changed:changed.length,unchangedTourFiles:oldTourFiles.length};
}

// Only the exact main-captured successor delivery is admitted.
const capturePath='F:/VisibleMedicine/staging/20261024-orbital-ct-website/CAPTURE.json';
const captureSha='b314194bbd05ce7c0a9a7f6771b9915b6f17be0124127c72b6d3454ad1f14027';
const websiteRoot='F:/VisibleMedicine/staging/20261024-orbital-ct-website/website';
const fixturePath='tests/fixtures/current-atlas-delivery.json';
const parentReceiptPath='F:/VisibleMedicine/staging/20261024-studio-route-website/SOURCE_BOUND.json';
const parentReceiptSha='3d9c3ca38a29d2f7320222711bca73d22f5c85771a28a3fe6c3219acd03ac4eb';
export function assertOrbitalCtCurrentDisplay({root,manifest,binding,read=p=>readFileSync(root+'/'+p)}){
 assert.equal(resolve(root),resolve(websiteRoot),'Only the isolated successor Website is admitted');
 assert.match(captureSha,/^[a-f0-9]{64}$/,'Main must pin the exact sealed CAPTURE.json digest');
 const captureBytes=readFileSync(capturePath);
 assert.equal(sha(captureBytes),captureSha,'Only the sealed main capture is admitted');
 const capture=JSON.parse(captureBytes);
 assert.equal(sha(readFileSync(parentReceiptPath)),parentReceiptSha);
 assert.equal(capture.previewChanged,false);
 assert.equal(capture.pin.source,source);assert.equal(capture.pin.sourceTree,tree);
 assert.equal(capture.pinSha256,sha(read(fixturePath)),'Exact captured current delivery fixture');
 assert.equal(capture.binding,binding.sha256);
 assert.equal(manifest.revision,source);assert.equal(manifest.websiteIntegrationSha256,binding.sha256);
 assert.equal(binding.sourceCommit,source);
 assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 assert.equal(capture.inputs,binding.inputs.length);
 assert.equal(capture.sourceFiles,manifest.files.length);
 const pin=JSON.parse(read(fixturePath));
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.deepEqual(pin,capture.pin,'Only main-captured delivery pins');
 for(const [path,digest] of Object.entries(pin.documents))assert.equal(sha(read(path)),digest,path);
 for(const row of binding.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 for(const row of manifest.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,capture.viewerFiles);assert.equal(viewer.packages.length,capture.viewerPackages);
 for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
 return {source,integration:binding.sha256,imported:manifest.files.length,inputs:binding.inputs.length};
}
