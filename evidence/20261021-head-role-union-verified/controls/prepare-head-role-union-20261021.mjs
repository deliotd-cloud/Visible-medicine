import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const sources=[
 ['F:/VisibleMedicine/staging/20261021-head-disclosure-role-proposal','e4c5dd447aad2a17e97bf573a9ae56c30f669fff61b4829852cfd8926067a666'],
 ['F:/VisibleMedicine/staging/20261021-craniofacial-tour-role-proposal','ca202054f20b5e353a9729d0576a927833b2ed7d57ee75fb4a0226c7e95b04ae'],
];
const out='F:/VisibleMedicine/staging/20261021-head-role-union-proposal';
assert(!fs.existsSync(out));const paths=[],witnesses=[
 ['tests/fixtures/craniofacial-ct-current-atlas-3dc.mjs.raw','F:/VisibleMedicine/recovery/checkpoints/20261019-craniofacial-ct-website-import/after-current/tests/current-atlas-delivery.test.mjs'],
 ['tests/fixtures/craniofacial-ct-portal-3dc.mjs.raw','F:/VisibleMedicine/recovery/checkpoints/20261019-craniofacial-ct-website-import/after-current/tests/clinical-review-portal-venous-current-admission.test.mjs'],
 ['tests/fixtures/tour-discovery-corpus-bd5465ee.mjs.raw','F:/VisibleMedicine/recovery/checkpoints/20261019-tour-discovery-keyboard/ready-source/website-delta/tests/corpus-xray-v2-current-delivery.test.mjs'],
];
for(const [root,digest] of sources){
 assert.equal(sha(read(root+'/PROPOSAL.json')),digest);const manifest=json(root+'/PROPOSAL.json');
 for(const row of manifest.proposedPaths){
  assert(!paths.some(r=>r.path===row.path));assert(/^tests\/[A-Za-z0-9_./-]+\.(?:mjs|raw)$/.test(row.path)&&!row.path.includes('..'));
  const b=read(root+'/'+row.path);assert.equal(sha(b),row.candidateSha256);assert.equal(b.length,row.candidateBytes);assert(!b.includes(Buffer.from('\r\n')));
  if(row.preimageSha256)assert.equal(sha(read('F:/VisibleMedicine/website/'+row.path)),row.preimageSha256);else assert(!fs.existsSync('F:/VisibleMedicine/website/'+row.path));
  paths.push({...row,workerStage:root});
 }
}
assert.equal(paths.length,10);assert.equal(paths.filter(r=>r.preimageSha256).length,3);
for(const [p,authentic]of witnesses){const row=paths.find(r=>r.path===p);assert(row);assert.equal(sha(read(authentic)),row.candidateSha256,p);}
fs.mkdirSync(out);
for(const r of paths){const to=out+'/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(r.workerStage+'/'+r.path,to,fs.constants.COPYFILE_EXCL);}
for(let i=0;i<sources.length;i++)fs.copyFileSync(sources[i][0]+'/PROPOSAL.json',out+'/worker-'+i+'-PROPOSAL.json',fs.constants.COPYFILE_EXCL);
const manifest={schema:'vm-main-reviewed-coupled-test-role-proposal/1',websiteHeadAtObservation:'b953ff3f5f1891599cb6e91cb91311d9d6006270',source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',sourceSnapshot:'F:/VisibleMedicine/staging/20261021-admission485-final-application/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:'4347d68eb5895f949bd061e1bcc007aa1a8e983efc28e97a7b1ac7af921a4a99',proposedPaths:paths,
 mainReview:{coupledBatch:true,authenticWitnesses:witnesses.map(([path,from])=>({path,from,sha256:sha(read(from))})),originalTeachingAndAll48IdentityModalityRefusalsUnchanged:true,authenticPortalAndDeliveryWholeForwardMatches:true,authenticTourAndCorpusWholeInverseMatches:true,currentHeadAsyncStockVerifierMutationRefusals:true,exactCurrentReviewBindingsCheckedIndependently:true,headWholeSourceUnknownAssertionGuard:true,sourceOnlyProofIsNotNativePass:true,remainingCurrentCorpusAndUiRootsNotDeclaredPassing:true,ownerPreviewOrFormsTouched:false,clinicalApproval:false,fullSuitePassingClaim:false}};
fs.writeFileSync(out+'/PROPOSAL.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:out,sha256:sha(read(out+'/PROPOSAL.json')),paths:paths.length,existing:3,new:7,canonicalChanged:false}));
