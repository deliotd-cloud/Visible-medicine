// Mechanical, byte-exact staged test repair; never mutates the running website.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const stage='F:/VisibleMedicine/staging/20261022-leg-vessel-source-family-admission';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const queuePath='F:/VisibleMedicine/staging/20261022-regional-imaging-history-consolidated/QUEUE.json';
const read=p=>readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
assert(!existsSync(stage));
assert.equal(sha(read(queuePath)),'69bf8a07fe2b7bee6357169d4ae03127c59958290784ec0de2588eb4795f602b');
const queue=JSON.parse(read(queuePath));
const names=['clinical-review-leg-arterial-xray.test.ts','clinical-review-leg-venous-xray.test.ts'];
const base=JSON.parse(read(website+'/../VERIFIED_SOURCE.json'));
assert.equal(sha(read(website+'/../VERIFIED_SOURCE.json')),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const edits=[
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';", "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
 ["  assert.equal(revision,liveCommit,'Exact pinned current Review source');", "  assert.equal(revision,liveCommit,'Exact pinned current Review source');\n  const deliveryPin=validateCurrentAtlasDelivery();\n  assert.equal(revision,deliveryPin.source,'Review retains the strict current-source contract');"],
 ['    assert.equal(manifest.sourceCommit,revision,name);','    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);'],
];
const git=(revision,p)=>execFileSync('git',['--no-replace-objects','-C','F:/VisibleMedicine/atlas','show',revision+':'+p],{windowsHide:true,maxBuffer:32e6});
const family='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const gitProof=[];
for(const p of ['content/popliteal-vessel-study-pins.json','content/limb-vascular-study-pins.json','content/genicular-imaging-pins.json','content/lower-venous-imaging-pins.json','content/leg-arterial-xray.ts','lib/leg-arterial-xray.ts','content/leg-venous-xray.ts','lib/leg-venous-xray.ts']){
 const current=git(queue.source,p),prior=git(family,p);assert.deepEqual(current,prior,p+': teaching geometry and assertions remain exact across families');
 gitProof.push({path:p,currentSha256:sha(current),familySha256:sha(prior)});
}
mkdirSync(stage+'/RAW/tests',{recursive:true});mkdirSync(stage+'/CODE/tests',{recursive:true});
const rows=[];
for(const name of names){
 const path='tests/'+name;assert(!queue.repairs.some(row=>row.path===path),'No duplicate assignment');
 const raw=read(website+'/'+path);assert.equal(sha(raw),base.sourceRows.find(row=>row.path===path)?.sha256);
 assert(!raw.includes(13),'Preserve the authentic LF-only buffer');let text=raw.toString();
 for(const [before,after] of edits){assert.equal(text.split(before).length,2,'Unique exact forward hunk');text=text.replace(before,after);}
 let restored=text;
 for(const [before,after] of [...edits].reverse()){assert.equal(restored.split(after).length,2,'Unique exact inverse hunk');restored=restored.replace(after,before);}
 assert.deepEqual(Buffer.from(restored),raw,'Complete original source, not assertion counts');
 writeFileSync(stage+'/RAW/'+path,raw,{flag:'wx'});writeFileSync(stage+'/CODE/'+path,text,{flag:'wx'});
 rows.push({path,beforeSha256:sha(raw),proposalSha256:sha(Buffer.from(text))});
}
writeFileSync(stage+'/SOURCE_PLAN.json',JSON.stringify({at:new Date().toISOString(),website,source:queue.source,review:queue.review,rows,edits,gitProof,nativeExecuted:false,canonicalOrRunningCandidateEdited:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,rows,wholeOriginalInverses:rows.length,exactGitTeachingInputs:gitProof.length,nativeExecuted:false}));
