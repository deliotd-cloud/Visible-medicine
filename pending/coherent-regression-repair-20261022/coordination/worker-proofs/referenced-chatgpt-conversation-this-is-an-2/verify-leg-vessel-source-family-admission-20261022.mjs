// Source/Git checks only. No validator, website module, native test or compiler.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const stage='F:/VisibleMedicine/staging/20261022-leg-vessel-source-family-admission';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(p);
const planBytes=read(stage+'/SOURCE_PLAN.json');
assert.equal(sha(planBytes),'a69d532085e4e25612e7ea68b9f14fe27e3d8f24bdad791570e5852441a5e9c0');
const plan=JSON.parse(planBytes);
const expected=[
 ['tests/clinical-review-leg-arterial-xray.test.ts','0b33848d2f97a5139053eb7b47cb241f42174c42a0ec2e1ec07e7456c4a59b55','73d3cb14dae874d61dca88b640db5dd88b402c0cc304159cb490eaa194ca7c91'],
 ['tests/clinical-review-leg-venous-xray.test.ts','d92eb50850865b6a6f1d6705a60829bec310cdc31ba5274bd57ead8445cea3cc','093925455c0b1fc5a19163502341d783f8597ffda2db00419f65cad96a68e999'],
];
assert.equal(plan.rows.length,2);assert.equal(plan.edits.length,3);
function restore(bytes,row){
 assert.equal(sha(bytes),row[2],'Only the complete authored proposal admitted');
 let text=bytes.toString();assert.deepEqual(Buffer.from(text),bytes,'Lossless UTF8');
 for(const [before,after] of [...plan.edits].reverse()){
  assert.equal(text.split(after).length,2,'Each exact seam must occur once');text=text.replace(after,before);
 }
 assert.equal(sha(Buffer.from(text)),row[1],'Complete original source digest');return Buffer.from(text);
}
for(const row of expected){
 const raw=read(stage+'/RAW/'+row[0]),code=read(stage+'/CODE/'+row[0]);
 assert.equal(sha(raw),row[1]);assert.equal(sha(code),row[2]);
 assert.deepEqual(raw,read(plan.website+'/'+row[0]),'Running candidate remains original');
 assert.deepEqual(restore(code,row),raw,'All original historical/clinical/refusal assertions survive');
 for(const mutant of [Buffer.concat([code,Buffer.from('foreign')]),Buffer.from(code.toString().replace('runtimeSources[name]','runtimeSources.shoulder')),Buffer.from(code.toString().replace('validateCurrentAtlasDelivery();','validateCurrentAtlasDelivery();\nvalidateCurrentAtlasDelivery();'))])
  assert.throws(()=>restore(mutant,row),'Unknown, substituted and duplicated source refused');
}
const pin=JSON.parse(read(plan.website+'/tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,plan.source);
for(const [name,revision] of Object.entries(pin.runtimeSources))
 assert.equal(JSON.parse(read(plan.website+'/public/atlas-runtime/'+name+'/manifest.json')).sourceCommit,revision);
const git=(revision,p)=>execFileSync('git',['--no-replace-objects','-C','F:/VisibleMedicine/atlas','show',revision+':'+p],{windowsHide:true,maxBuffer:32e6});
for(const row of plan.gitProof){
 assert.equal(sha(git(pin.source,row.path)),row.currentSha256);
 assert.equal(sha(git(pin.runtimeSources.shoulder,row.path)),row.familySha256);
 assert.equal(row.currentSha256,row.familySha256);
}
const result={at:new Date().toISOString(),plan:stage+'/SOURCE_PLAN.json',planSha256:sha(planBytes),wholeOriginalInverses:2,mutationRefusals:6,exactUnchangedFamilyGitInputs:8,frozenManifestRoles:true,nativeExecuted:false,canonicalOrRunningCandidateEdited:false};
assert(!existsSync(stage+'/SOURCE_PROOF_RESULT.json'));
writeFileSync(stage+'/SOURCE_PROOF_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
