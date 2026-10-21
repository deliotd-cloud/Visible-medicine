import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',stage=base+'plexus-historical-eol-retry';
const site=base.replace('20261021-','20261020-')+'combined-website-ui/website';
const result=json(stage+'/RESULT.json'),inputs=json(stage+'/source-inputs-after.json'),change=json(stage+'/CHANGE.json');
assert(result.actualPlexusHistoryPass&&result.code===0&&!result.inputDrift);assert.equal(inputs.length,5087);
assert.equal(change.sha256,'9875e06880ed2d9a78d45eef70a95b45276b1de6d39fa0209288f68ff9422a11');
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-plexus-history-verified';
const source=base+'atlas-combined-source';
const verify=()=>{
 for(const row of inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
 assert.equal(sha(read(site+'/'+change.path)),change.sha256);
 assert.equal(sha(read(stage+'/ACTUAL_PLEXUS_EOL.json')),result.receiptSha256);
 const receipt=json(stage+'/ACTUAL_PLEXUS_EOL.json');assert.equal(receipt.code,0);assert.equal(receipt.signal,null);assert.equal(sha(read(receipt.log)),receipt.logSha256);
 assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(runGit(['-C',source,'status','--porcelain=v1','--untracked-files=all']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){const bytes=read(from),to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});assert.equal(sha(read(to)),sha(bytes));}
for(const p of ['.gitattributes','tests/plexus-dependency-rebind.test.mjs','tests/plexus-presentation-rebind.test.mjs','tests/plexus-historical-source.mjs','tests/fixtures/plexus-dependency-rebind.test.mjs.raw','tests/fixtures/plexus-presentation-rebind.test.mjs.raw'])copy(site+'/'+p,'website/'+p);
for(const p of ['RESULT.json','CHANGE.json','ACTUAL_PLEXUS_EOL.json'])copy(stage+'/'+p,'evidence/'+p);
copy(stage+'/originals/tests/plexus-historical-source.mjs','preimages/tests/plexus-historical-source.mjs');
for(const p of ['admit-and-test-plexus-history-20261021.mjs','retry-plexus-historical-eol-20261021.mjs','checkpoint-plexus-history-verified-20261021.mjs'])copy(p,'scripts/'+p);
const summary={at:new Date().toISOString(),sourceCommit:'190a63238eadcf906abe89dcbb6a67c88afe70b9',siteHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',siteInputCount:inputs.length,
 progress:'Actual7/7plexus provenance/refusal cases PASS,0skip,no5087input drift. All6original registrations/assertions preserved plus separate current16-to18source transition theorem. Historical source reads immutable b953/treeb13f8121 with strict recorded pins.22source rows retain exact Git bytes;only app/chatgpt-auth.ts reconstructs the exact historically recorded CRLF bytes from an exact pinned LF preimage. No auth/runtime/importer/private manifest/model bytes changed.',
 limits:'Missing or foreign historical checkpoint fails setup; no skip or current-state fallback. Historical private manifest/module stays local and external,not copied into fixtures or backup. Initial5pass/2fail results retained;final narrow reconstruction is not generic newline tolerance,rights clearance or clinical acceptance. Other original full-suite failures still require work.',
 prior:'Source190 clean,4stock module builds/exports pass; owner3000/forms/canonical98d7 remain unchanged. Review/Website import of190 remains next,not installed. Filtered prior ede7c5d5/979blobs remains verified.',
 canonicalInstalled:false,websiteImported:false,fullWebsiteSuitePass:false,rightsApproval:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});copy(root+'/MAIN_REVIEW.json','evidence/MAIN_REVIEW.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-four-modules-verified-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'ede7c5d56d0885d24fbd596f68da492a83249352');
const old=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json');
const values=new Map(old.files.map(row=>{const bytes=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(bytes),row.sha256);return[row.path,bytes];}));
for(const row of selected)values.set('evidence/20261021-plexus-history-verified/'+row.path,read(root+'/'+row.path));
const remoteRoot=root+'-backup';
backup({root:remoteRoot,repo:'F:/VisibleMedicine/history/website-work/github-plexus-history-verified-20261021.git',branch:'backup/plexus-history-verified-20261021',
 files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:summary.sourceCommit,website:summary.siteHead,inputCount:5087},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{actualTests:7,passed:7,skipped:0,inputDrift:false,pinnedHistoricalSource:true,originalAssertionsPreserved:true,noRuntimeEdits:true,noPrivateArtifactCopied:true},
 scope:'Selected test/helper/original-test fixtures,scoped attributes,small result/proof/control scripts on prior filtered source-only ancestry. No private historical manifest/module,scans,masks,review decisions,inbox,geometry,dependencies,raw canonical ancestry,browser pixels/DOM or long failed logs. Not a complete runnable/private-data backup,public deployment or clinical/rights acceptance.'});
const remote=json(remoteRoot+'/github-backup.json');
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify({...summary,selectedFiles:selected,backup:{receipt:remoteRoot+'/github-backup.json',receiptSha256:sha(read(remoteRoot+'/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selectedNewPaths:selected.length,backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths,receiptSha256:sha(read(remoteRoot+'/github-backup.json'))}));
