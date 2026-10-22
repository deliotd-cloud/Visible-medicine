// Main-reviewed, exact producer/host source admission only, before regeneration/builds.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',prepared=json(root+'/PREPARATION.json');
const proposal='F:/VisibleMedicine/staging/20261022-head-model-access-source-proposal';
const hashes={
 'lib/head-selection-channel.ts':'2b9d5fc64b459fb6a6b2abd9fef95f19450b390e3632fd889321412343ac1212',
 'app/body-explorer.tsx':'1a549c87f016b9246edb7e6c80ffa7b5f874ea59ff87dacd99d109e79dcb7e29',
 'app/ventricles.tsx':'010f2c495e5c3fa290935d673531d2ca3049bee215abb22d2b88016e9a98d07e',
 'app/eye-layers.tsx':'3350a55d8162226b400cc8ed2ad3a28e4fcf323ced4ae7a7ec38d43d2437930d',
};
assert.equal(runGit(['-C',prepared.atlas,'rev-parse','HEAD']).toString().trim(),prepared.baseAtlas);
assert.equal(runGit(['-C',prepared.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),prepared.baseTree);
assert.equal(prepared.baseTree,'64f085e1f8b63b5f17daf8b107efcbe40bb7596c');
assert.equal(runGit(['-C',prepared.atlas,'status','--porcelain']).toString().trim(),'');
const proofPath=proposal+'/evidence/test-source-proposal.mjs';
const output=execFileSync(process.execPath,[proofPath],{windowsHide:true});
assert(JSON.parse(output).passed);fs.mkdirSync(root+'/source-admission');
fs.writeFileSync(root+'/source-admission/worker-proof.stdout.log',output,{flag:'wx'});
const changed=[];
for(const[p,h]of Object.entries(hashes)){
 const current=read(prepared.atlas+'/'+p),next=read(proposal+'/'+p);assert.equal(sha(next),h,p);
 const committed=runGit(['-C',prepared.atlas,'show',prepared.baseAtlas+':'+p]);assert.deepEqual(current,committed);
 const before=root+'/before/atlas/'+p;fs.mkdirSync(path.dirname(before),{recursive:true});fs.writeFileSync(before,current,{flag:'wx'});
 fs.copyFileSync(proposal+'/'+p,prepared.atlas+'/'+p);assert.equal(sha(read(prepared.atlas+'/'+p)),h);
 changed.push({path:p,beforeSha256:sha(current),afterSha256:h});
}
fs.writeFileSync(root+'/source-admission/RESULT.json',JSON.stringify({at:new Date().toISOString(),baseAtlas:prepared.baseAtlas,baseTree:prepared.baseTree,changed,
 workerProof:{path:proofPath,sha256:sha(read(proofPath)),mainExecuted:true,exitCode:0,stdoutSha256:sha(output)},
 workerHandoffErratum:'Worker RESULT.md incorrectly names389bd0as the Git tree. Authoritative rev-parse and complete preimage blobs verify64f085e1;389bd0is an earlier source commit, not this tree.',
 scope:'Advisory same-origin model-resource causes only; no access grants, scans, coordinates, medical facts, geometry, dependencies, approval or installation.',hostIntegrationPending:true,typesBuildAndReviewPending:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,sourceChanges:changed.length,mainProofPassed:true,typesBuildAndReviewPending:true,ownerPreviewChanged:false}));
