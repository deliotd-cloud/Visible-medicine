// Main-owned mechanical composition; no normal-preview or production cutover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';

const root='F:/VisibleMedicine/staging/20261023-release-epoch-successor',site=root+'/website';
const previousReceipt='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json';
const terminalPath='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/complete-release-run/TERMINAL.json';
assert.equal(sha(read(previousReceipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');
assert.equal(sha(read(terminalPath)),'093db68490d36f3f6b49d660279f7bbe0f03af98fa2a653ce60f715042479fa7');
const previous=json(previousReceipt),terminal=json(terminalPath);
assert.equal(terminal.terminal,true);assert.equal(terminal.code,1);assert.deepEqual(terminal.sourceDrift,[]);
assert.deepEqual(terminal.counts,{tests:6044,pass:5934,fail:107,cancelled:0,skipped:3,todo:0});
assert.equal(sha(read(terminal.stockReceipt)),terminal.stockReceiptSha256);
const stock=json(terminal.stockReceipt);assert.equal(stock.testInputDrift,false);assert.equal(stock.publicPreviewAssetDrift,false);
const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.goal.status,'active');
assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',previous.atlas,'rev-parse','HEAD']).toString().trim(),previous.atlasHead);
assert.equal(runGit(['-C',previous.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),previous.atlasTree);
assert.equal(runGit(['-C',previous.atlas,'status','--porcelain']).toString().trim(),'');

const proposals=[
 ['F:/VisibleMedicine/staging/20261023-ae84-metadata-closure','b08c2d6372f1cb0be80a8a6c3be75cb7eb359f4dadff2805a0706f9efdd09c00','F:/VisibleMedicine/recovery/checkpoints/20261023-release-epoch-repairs/checkpoint.json'],
 ['F:/VisibleMedicine/staging/20261023-renal-epoch-repair','527ddab067d9724fa0623e3a55a624b381fb1a1730a096eb7d4551d5941971d8','F:/VisibleMedicine/recovery/checkpoints/20261023-renal-epoch-repair/checkpoint.json'],
 ['F:/VisibleMedicine/staging/20261023-loader-preservation','4fa4ccd14572ca9bdc05d0e95dbdd921ebb91925fb7f2f99d7173c9a6a1912e1','F:/VisibleMedicine/recovery/checkpoints/20261023-loader-preservation/checkpoint.json'],
];
const overlays=new Map(),evidence=[];
for(const [stage,expected,checkpoint]of proposals){
 assert.equal(sha(read(checkpoint)),expected);const saved=json(checkpoint);
 assert.equal(sha(read(saved.mainReview)),saved.mainReviewSha256);const review=json(saved.mainReview);
 assert.equal(review.sourceReceiptSha256,sha(read(previousReceipt)));
 for(const row of saved.sourceRows){assert(row.path.startsWith('tests/'));assert(!overlays.has(row.path));
  const from=stage+'/website/'+row.path;assert.equal(sha(read(from)),row.sha256,row.path);overlays.set(row.path,{...row,from});}
 evidence.push({stage,checkpoint,checkpointSha256:expected,mainReview:saved.mainReview,mainReviewSha256:saved.mainReviewSha256});
}
const arterialPath='F:/VisibleMedicine/staging/20261022-arterial-current-role-followup/RESULT.json';
assert.equal(sha(read(arterialPath)),'5ad2ce6ebc27779da29b4dad6cce49085a9000d1ec2e62bb9ff545d1575bbabc');
const arterial=json(arterialPath);assert.equal(arterial.parentSourceReceiptSha256,sha(read(previousReceipt)));
assert.equal(sha(read(arterial.proposed)),arterial.afterSha256);assert(!overlays.has(arterial.target));
overlays.set(arterial.target,{path:arterial.target,from:arterial.proposed,bytes:read(arterial.proposed).length,sha256:arterial.afterSha256});
evidence.push({result:arterialPath,resultSha256:sha(read(arterialPath))});assert.equal(overlays.size,30);

// Bounded-memory hashing keeps the 912MB local delivery copy out of JS heap.
const slab=Buffer.alloc(65536);
function fileSha(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
function editsFor(a,b){const dp=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,start=null;const out=[];const close=()=>{if(start){out.push({...start,before:a.slice(start.i,i),after:b.slice(start.j,j)});start=null;}};while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){close();i++;j++;}else{start??={i,j};if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))i++;else j++;}}close();return out;}
const oldRows=new Map(previous.sourceRows.map(r=>[r.path,r]));
const inverses=[];
for(const row of overlays.values()){
 const old=oldRows.get(row.path);if(!old)continue;
 const before=read(previous.website+'/'+row.path),after=read(row.from);assert.equal(sha(before),old.sha256);
 assert.notEqual(sha(before),sha(after),'Overlay must change its declared old input');
 const edits=editsFor(before.toString().split('\n'),after.toString().split('\n')),restored=after.toString().split('\n');
 for(const e of [...edits].reverse()){assert.deepEqual(restored.slice(e.j,e.j+e.after.length),e.after);restored.splice(e.j,e.after.length,...e.before);}
 assert.deepEqual(Buffer.from(restored.join('\n')),before);
 inverses.push({path:row.path,before:old.sha256,after:row.sha256,edits,original:'tests/fixtures/release-epoch-before/'+path.basename(row.path)+'.raw'});
}
assert.equal(inverses.length,12);assert.equal(overlays.size-inverses.length,18);
assert(!fs.existsSync(root));fs.mkdirSync(root);
runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const expected=new Map(),held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of previous.sourceRows){
 const original=previous.website+'/'+row.path;assert.equal(fs.statSync(original).size,row.bytes);assert.equal(fileSha(original),row.sha256,row.path);
 if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const dest=containedTarget(site,row.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(original,dest,fs.constants.COPYFILE_EXCL);expected.set(row.path,row);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(previous.atlas,root+'/atlas','junction');
const added=[];
function put(relative,bytes){const dest=containedTarget(site,relative),old=expected.get(relative);if(old)assert.equal(fileSha(dest),old.sha256);else{assert(!fs.existsSync(dest));added.push(relative);}fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);expected.set(relative,{path:relative,bytes:bytes.length,sha256:sha(bytes)});}
for(const row of overlays.values()){assert.equal(fileSha(row.from),row.sha256);put(row.path,read(row.from));}
for(const row of inverses)put(row.original,read(previous.website+'/'+row.path));
const preservation=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=${JSON.stringify(inverses,null,2)},sha=b=>createHash('sha256').update(b).digest('hex');
function inverse(row,bytes){assert.equal(sha(bytes),row.after,'Exact reviewed composed source');const lines=bytes.toString().split('\\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\\n'));}
test('all twelve composed repairs retain complete original tests and helpers',()=>{for(const row of rows){const before=readFileSync(new URL('../'+row.original,import.meta.url)),after=readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(inverse(row,after),before);}});
test('unknown bytes, removed assertions and source-witness mutation refuse every composed inverse',()=>{for(const row of rows){const after=readFileSync(new URL('../'+row.path,import.meta.url));assert.throws(()=>inverse(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const forged=Buffer.from(after);forged[0]^=1;assert.throws(()=>inverse(row,forged));const before=readFileSync(new URL('../'+row.original,import.meta.url)),changed=Buffer.from(before);changed[0]^=1;assert.notEqual(sha(changed),row.before);}});
`;
put('tests/release-epoch-composition-preservation.test.mjs',Buffer.from(preservation));
const sourceRows=[...expected.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(sourceRows.length,6457);
for(const row of sourceRows)assert.equal(fileSha(site+'/'+row.path),row.sha256,row.path);
for(const row of previous.sourceRows)assert.equal(fileSha(previous.website+'/'+row.path),row.sha256,'Predecessor source drift: '+row.path);
const changedPaths=sourceRows.filter(r=>oldRows.has(r.path)&&oldRows.get(r.path).sha256!==r.sha256).map(r=>r.path).sort();
assert.deepEqual(changedPaths,inverses.map(r=>r.path).sort());assert(changedPaths.every(p=>p.startsWith('tests/')));
for(const row of previous.sourceRows.filter(r=>!r.path.startsWith('tests/')))assert.equal(expected.get(row.path).sha256,row.sha256);
const source={...previous,at:new Date().toISOString(),website:site,previousSource:previousReceipt,previousSourceSha256:sha(read(previousReceipt)),sourceRows,sourcePaths:sourceRows.length,changedPaths,addedPaths:added.sort(),allProductAndBindingsByteIdentical:true,ownerPreviewChanged:false,canonicalInstalled:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const composed={at:new Date().toISOString(),sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),terminal:terminalPath,terminalSha256:sha(read(terminalPath)),priorFailedCounts:terminal.counts,evidence,overlays:[...overlays.values()].map(({from,...row})=>row),inverses,changedPaths,addedPaths:source.addedPaths,sourcePaths:sourceRows.length,wholeOriginalInverses:12,predecessorDrift:[],allProductAndBindingsByteIdentical:true,nativeAcceptance:false,fullAffectedFeatureRootsPending:8,wholeSuitePassing:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/COMPOSED.json',JSON.stringify(composed,null,2)+'\n',{flag:'wx'});
fs.copyFileSync(new URL(import.meta.url),root+'/compose-release-epoch-successor-20261023.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({source:root+'/SOURCE.json',sha256:composed.sourceReceiptSha256,paths:sourceRows.length,changed:changedPaths.length,added:added.length,wholeOriginalInverses:12,productChanged:false,previewChanged:false,nativeAcceptance:false}));
