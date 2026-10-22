// Main-owned mechanical composition; never changes the installed/held website.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';

const root='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor',site=root+'/website';
const previousReceipt='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/SOURCE_V2.json';
assert.equal(sha(read(previousReceipt)),'92403824dc9ebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07');
const previous=json(previousReceipt),overlayRoot='F:/VisibleMedicine/staging/20261022-complete-release-followup-proposals';
const overlay=json(overlayRoot+'/PLAN.json');
assert.equal(sha(read(overlayRoot+'/PLAN.json')),'7f762506cdb17f8f21f907f257fde7d857884d8d88f60229b6772cd259893a89');
const auditPath='F:/VisibleMedicine/recovery/checkpoints/20261022-interrupted-release-audit/AUDIT.json',audit=json(auditPath);
assert.equal(sha(read(auditPath)),'4f17ba9d44fcd12e9c0e4563db561105df8db43dcd0849a461fde611df9fc91e');
assert.equal(audit.completeSuiteFinished,false);assert.equal(audit.sourceDrift.length,0);
const hand='F:/VisibleMedicine/staging/20261022-hand-renderer-followup',h=json(hand+'/RESULT.json');
const cranial='F:/VisibleMedicine/staging/20261022-complete-cranial-quiz-asset-followup',c=json(cranial+'/RESULT.json');
assert.equal(h.parent.sourceManifestSha256,sha(read(previousReceipt)));
assert.equal(c.candidate.sourceReceiptSha256,sha(read(previousReceipt)));
assert.equal(sha(read(hand+'/prove-source-inverse.mjs')),h.proofHelperSha256);
await import('file:///'+hand+'/prove-source-inverse.mjs');

// Independently execute the actual proposed inverse, not a reimplementation of it.
const proposedHand=read(hand+'/atlas-hand-vessel-xray-preservation.test.mjs'),epoch=read(hand+'/atlas-hand-vessel-xray.renderer-epoch-a91e7a.mjs.raw');
const currentHand=read(previous.website+'/tests/atlas-hand-vessel-xray.test.mjs');
assert.equal(sha(proposedHand),h.preservationTestAfterSha256);assert.equal(sha(epoch),h.rendererEpochRawSha256);
const handText=proposedHand.toString(),begin=handText.indexOf('function inverseLaterSource(bytes){'),end=handText.indexOf('function verifyEpochMigration(bytes){',begin);
assert(begin>0&&end>begin);
const inverse=vm.runInNewContext(handText.slice(begin,end)+'\ninverseLaterSource',{
 assert,Buffer,sha,rendererEpoch:epoch,epochMigrationSha:h.rendererEpochRawSha256,laterSourceSha:h.currentHandSourceSha256,
});
assert.deepEqual(inverse(currentHand),epoch);
let refusals=0;
for(const[from,to]of [['const validatorFunctionEnd=','const validatorFunctionStop='],['Schema-1 history cannot be admitted','Schema-1 history was admitted'],['pin.runtimeSources[region]','pin.runtimeSources.head-neck']]){
 assert.equal(currentHand.toString().split(from).length,2);assert.throws(()=>inverse(Buffer.from(currentHand.toString().replace(from,to))));refusals++;
}

const slab=Buffer.alloc(65536);
function fileSha(file){const hash=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))hash.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return hash.digest('hex');}
function editsFor(a,b){const dp=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,start=null;const out=[];const close=()=>{if(start){out.push({...start,before:a.slice(start.i,i),after:b.slice(start.j,j)});start=null;}};while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){close();i++;j++;}else{start??={i,j};if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))i++;else j++;}}close();return out;}
const replacements=[...overlay.changedPaths.map(relative=>({path:relative,from:overlayRoot+'/website/'+relative})),
 {path:'tests/atlas-cranial-bone-quiz.test.ts',from:cranial+'/'+c.proposal.test},
 {path:'tests/atlas-hand-vessel-xray-preservation.test.mjs',from:hand+'/atlas-hand-vessel-xray-preservation.test.mjs'}];
assert.equal(replacements.length,5);const proof=[];
for(const row of replacements){const before=read(previous.website+'/'+row.path),after=read(row.from);assert.equal(sha(before),previous.sourceRows.find(r=>r.path===row.path).sha256);const edits=editsFor(before.toString().split('\n'),after.toString().split('\n')),restored=after.toString().split('\n');for(const edit of [...edits].reverse()){assert.deepEqual(restored.slice(edit.j,edit.j+edit.after.length),edit.after);restored.splice(edit.j,edit.after.length,...edit.before);}assert.deepEqual(Buffer.from(restored.join('\n')),before);proof.push({path:row.path,before:sha(before),after:sha(after),edits,original:'tests/fixtures/complete-release-before/'+path.basename(row.path)+'.raw'});}
assert.equal(proof[3].before,c.proposal.testBeforeSha256);assert.equal(proof[3].after,c.proposal.testAfterSha256);
assert.equal(proof[4].before,h.preservationTestBeforeSha256);assert.equal(proof[4].after,h.preservationTestAfterSha256);
assert(!fs.existsSync(root));fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of previous.sourceRows){const original=previous.website+'/'+row.path;assert.equal(fs.statSync(original).size,row.bytes);assert.equal(fileSha(original),row.sha256,row.path);if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));const dest=containedTarget(site,row.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(original,dest,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(previous.atlas,root+'/atlas','junction');
const added=new Set(),expected=new Map(previous.sourceRows.map(r=>[r.path,r]));
function put(relative,bytes){const target=containedTarget(site,relative),old=expected.get(relative);if(old)assert.equal(fileSha(target),old.sha256,relative);else{assert(!fs.existsSync(target));added.add(relative);}fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);expected.set(relative,{path:relative,bytes:bytes.length,sha256:sha(bytes)});}
for(const row of overlay.sourceRows){const bytes=read(overlayRoot+'/website/'+row.path);assert.equal(sha(bytes),row.sha256);put(row.path,bytes);}
for(const row of replacements.slice(3)){put(row.path,read(row.from));put('tests/fixtures/complete-release-before/'+path.basename(row.path)+'.raw',read(previous.website+'/'+row.path));}
put('tests/fixtures/atlas-hand-vessel-xray.renderer-epoch-a91e7a.mjs.raw',epoch);
const witness=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=${JSON.stringify(proof,null,2)},sha=b=>createHash('sha256').update(b).digest('hex');
function inverse(row,bytes){assert.equal(sha(bytes),row.after);const lines=bytes.toString().split('\\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\\n'));}
test('all five reviewed follow-ups retain every complete original test and refusal assertion',()=>{for(const row of rows){const before=readFileSync(new URL('../'+row.original,import.meta.url)),after=readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(inverse(row,after),before);}});
test('foreign additions and removed assertions cannot pass any of the five source inverses',()=>{for(const row of rows){const after=readFileSync(new URL('../'+row.path,import.meta.url));assert.throws(()=>inverse(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const changed=Buffer.from(after);changed[0]^=1;assert.throws(()=>inverse(row,changed));}});
`;
put('tests/complete-release-five-followups-preservation.test.mjs',Buffer.from(witness));
const sourceRows=[...expected.values()].sort((a,b)=>a.path.localeCompare(b.path));for(const row of sourceRows)assert.equal(fileSha(site+'/'+row.path),row.sha256,row.path);
const prior=new Map(previous.sourceRows.map(r=>[r.path,r.sha256])),changedPaths=sourceRows.filter(r=>prior.has(r.path)&&prior.get(r.path)!==r.sha256).map(r=>r.path).sort();
assert.deepEqual(changedPaths,replacements.map(r=>r.path).sort());assert(changedPaths.every(p=>p.startsWith('tests/')));
const source={at:new Date().toISOString(),website:site,atlas:previous.atlas,atlasHead:previous.atlasHead,atlasTree:previous.atlasTree,review:previous.review,boundInputs:1729,importedSources:1562,previousSource:previousReceipt,previousSourceSha256:sha(read(previousReceipt)),sourceRows,sourcePaths:sourceRows.length,changedPaths,addedPaths:[...added].sort(),allProductAndBindingsByteIdentical:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const composed={at:new Date().toISOString(),sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),proof,wholeOriginalInversesPassed:5,actualHandProposalInversePassed:true,actualHandMutationRefusals:refusals,interruptedAttempt:{path:auditPath,sha256:sha(read(auditPath)),wholeSuitePassing:false},
 tests:[...replacements.map(r=>r.path),'tests/complete-release-followup-preservation.test.mjs','tests/complete-release-five-followups-preservation.test.mjs','tests/atlas-cervical-projection-xray.test.mjs','tests/atlas-genicular-mri-checks.mjs','tests/atlas-hand-venous-tours-checks.mjs','tests/atlas-hand-vessel-xray.test.mjs','tests/atlas-hand-renderer-7b-historical.test.mjs','tests/current-atlas-delivery.test.mjs'],
 nativeAcceptance:false,productChanged:false,previewChanged:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/COMPOSED.json',JSON.stringify(composed,null,2)+'\n',{flag:'wx'});
fs.copyFileSync(new URL(import.meta.url),root+'/compose-release-diagnostic-successor-20261022.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({receipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),paths:sourceRows.length,changed:changedPaths.length,roots:composed.tests.length,pureProofOnly:true,ownerPreviewChanged:false}));
