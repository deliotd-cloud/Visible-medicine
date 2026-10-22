// Reviewed overlays only: the active complete-run source remains frozen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-complete-release-followup-proposals',receipt='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/SOURCE_V2.json';
assert.equal(sha(read(receipt)),'92403824dc9ebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07');const source=json(receipt),website=source.website;
const arterial='F:/VisibleMedicine/staging/20261022-complete-arterial-followup',wrapper='F:/VisibleMedicine/staging/20261022-complete-body-wrapper-followup',licence='F:/VisibleMedicine/staging/20261022-complete-cervical-licence-followup';
const a=json(arterial+'/RESULT.json'),w=json(wrapper+'/RESULT.json'),l=json(licence+'/RESULT.json');
assert.equal(a.parent.sourceManifestSha256,sha(read(receipt)));assert.equal(w.candidate.sourceReceiptSha256,sha(read(receipt)));assert.equal(l.parent.sourceManifestSha256,sha(read(receipt)));
assert.equal(sha(read(wrapper+'/MAIN_SOURCE_PROOF.json')),'fa6bf16b7b7a253a4021be6c2e3d0b17b271caf217094c9bfb87baabfed04e50');
assert.equal(sha(read(wrapper+'/RESULT.json')),'1b93cdac758ee053ef71d9520784b208c9a5c7a5f67f52355fd1387bd8d6fa2b');
const rows=[{path:'tests/atlas-arterial-evidence-limits.test.mjs',from:a.change.proposal,before:a.change.sourceSha256,after:a.change.proposalSha256},
 {path:'tests/atlas-body-learning-component.test.mjs',from:wrapper+'/'+w.proposal.test,before:w.proposal.testBeforeSha256,after:w.proposal.testAfterSha256},
 {path:'tests/atlas-cervical-epoch-preservation.test.mjs',from:l.change.proposal,before:l.change.sourceSha256,after:l.change.proposalSha256}];
assert(!fs.existsSync(root));fs.mkdirSync(root);const files=[],proof=[];
const put=(relative,bytes)=>{assert(!path.isAbsolute(relative)&&!relative.split('/').some(p=>p==='..'));const target=root+'/website/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});files.push({path:relative,bytes:bytes.length,sha256:sha(bytes)});};
function editsFor(a,b){const dp=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,start=null;const out=[];const close=()=>{if(start){out.push({...start,before:a.slice(start.i,i),after:b.slice(start.j,j)});start=null;}};while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){close();i++;j++;}else{start??={i,j};if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))i++;else j++;}}close();return out;}
for(const row of rows){const before=read(website+'/'+row.path),after=read(row.from);assert.equal(sha(before),row.before);assert.equal(source.sourceRows.find(r=>r.path===row.path).sha256,row.before);assert.equal(sha(after),row.after);
 const a=before.toString().split('\n'),b=after.toString().split('\n'),edits=editsFor(a,b),inverse=[...b];for(const e of [...edits].reverse()){assert.deepEqual(inverse.slice(e.j,e.j+e.after.length),e.after);inverse.splice(e.j,e.after.length,...e.before);}assert.deepEqual(inverse,a);
 const original='tests/fixtures/complete-release-before/'+path.basename(row.path)+'.raw';put(row.path,after);put(original,before);proof.push({...row,from:undefined,original,edits});
}
const helper=read(wrapper+'/'+w.proposal.newPureHelper);assert.equal(sha(helper),'791a0329dd4589749b72f087d042b314d2d314b41edc72fbb05879e860226fb1');assert(!source.sourceRows.some(r=>r.path==='tests/head-access-wrapper-inverse.mjs'));put('tests/head-access-wrapper-inverse.mjs',helper);
const witness=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=${JSON.stringify(proof,null,2)},sha=b=>createHash('sha256').update(b).digest('hex');
function original(row,bytes){assert.equal(sha(bytes),row.after);const lines=bytes.toString().split('\\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\\n'));}
test('complete source/history and refusal assertions survive the three reviewed release follow-up seams',()=>{for(const row of rows){const before=readFileSync(new URL('../'+row.original,import.meta.url)),after=readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(original(row,after),before);}});
test('missing assertions and foreign additions cannot pass the complete original-source inverse',()=>{for(const row of rows){const after=readFileSync(new URL('../'+row.path,import.meta.url));assert.throws(()=>original(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const changed=Buffer.from(after);changed[0]^=1;assert.throws(()=>original(row,changed));}});
`;
put('tests/complete-release-followup-preservation.test.mjs',Buffer.from(witness));
const plan={at:new Date().toISOString(),status:'reviewed-source-only-overlays-not-installed-or-native-accepted',sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,
 sourceRows:files,changedPaths:rows.map(r=>r.path),addedPaths:files.map(r=>r.path).filter(p=>!rows.some(r=>r.path===p)),proposalReceipts:[arterial,wrapper,licence].map(p=>({path:p+'/RESULT.json',sha256:sha(read(p+'/RESULT.json'))})),
 independentMainWrapperProof:{path:wrapper+'/MAIN_SOURCE_PROOF.json',sha256:sha(read(wrapper+'/MAIN_SOURCE_PROOF.json')),completeWrappers:3,mutationsRejected:12},
 licenceProductAndOriginalFixtureUnchanged:true,allOriginalRefusalIntentRetained:true,fullFileSourceInversesPassed:true,pureOnly:true,nativeTestsRun:false,productChanged:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 admission:'Do not apply into the running frozen candidate. After the complete release suite is terminal, compose these overlays with all other main-reviewed final diagnostics into one isolated successor. Run affected native roots, exact preservation tests and types as appropriate, then the complete applicable final gate. Neither this plan nor a partial TAP marker proves native acceptance or final suite totals.'};
fs.writeFileSync(root+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PLAN.json',sha256:sha(read(root+'/PLAN.json')),overlayPaths:files.length,roots:rows.length,pureOnly:true,ownerPreviewChanged:false}));
