import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const proposal='F:/VisibleMedicine/staging/20261021-buffer-type-proposal';
const stage='F:/VisibleMedicine/staging/20261021-buffer-type-application';
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';
const prior='F:/VisibleMedicine/staging/20261021-review-return-application/SOURCE_INPUTS_AFTER.json';
const evidence=json(proposal+'/STAGING_EVIDENCE.json');
const changes=[...evidence.rows.map(r=>({...r,from:proposal+'/'+r.path})),
 {path:'tests/fixtures/nested-duct-xray.delta.raw',preSha256:evidence.nested.deltaPreSha256,postSha256:evidence.nested.deltaPostSha256},
 {path:'tests/clinical-epoch-batch-e-preservation.test.mjs',preSha256:evidence.nested.guardPreSha256,postSha256:evidence.nested.guardPostSha256}].map(r=>({...r,from:r.from??proposal+'/'+r.path}));
const inputs=json(prior);assert.equal(inputs.length,5155);assert.equal(changes.length,6);
const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.inputs.length,1710);
for(const row of changes){assert.equal(sha(read(row.from)),row.postSha256);assert(!bound.inputs.some(b=>b.path===row.path));}
for(const row of bound.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
assert.equal(sha(read(site+'/tests/elbow-current-lifecycle-preservation.test.mjs')),evidence.excludedPreexistingElbowGuard.guardSha256);
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(stage));for(const r of inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 fs.mkdirSync(stage);for(const r of changes){assert.equal(sha(read(site+'/'+r.path)),r.preSha256);const p=stage+'/preimages/'+r.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,read(site+'/'+r.path),{flag:'wx'});}
 fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),stage,site,proposal,changes,prior,priorSha256:sha(read(prior)),review:bound.sha256,excludedPreexistingElbowGuard:evidence.excludedPreexistingElbowGuard},null,2)+'\n',{flag:'wx'});
 console.log('Six exact preimages saved; no source edited.');
}else{
 assert.equal(process.argv[2],'finish');const prep=json(stage+'/PREPARATION.json');assert.equal(prep.priorSha256,sha(read(prior)));
 const current=new Map(inputs.map(r=>[r.path,r]));
 for(const r of changes){
  const target=site+'/'+r.path,expected=read(r.from).toString(),actual=read(target).toString(),norm=s=>s.replaceAll('\r\n','\n');
  assert.equal(norm(actual),norm(expected),r.path+': only lossless EOL restoration permitted');
  const endings=expected.match(/\r?\n/g)??[],lines=norm(actual).split('\n');assert.equal(lines.pop(),'');assert.equal(lines.length,endings.length);
  const bytes=Buffer.from(lines.map((line,i)=>line+endings[i]).join(''));assert.equal(sha(bytes),r.postSha256);
  if(sha(read(target))!==r.postSha256)fs.writeFileSync(target,bytes);
  current.set(r.path,{path:r.path,bytes:bytes.length,sha256:r.postSha256});
 }
 for(const r of current.values())assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify([...current.values()].sort((a,b)=>a.path.localeCompare(b.path)),null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(stage+'/APPLICATION.json',JSON.stringify({at:new Date().toISOString(),paths:6,namedInputs:5155,reviewInputs:1710,review:bound.sha256,sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),excludedElbowGuardUnchanged:true,canonicalInstalled:false,ownerPreviewChanged:false,fullSuitePassingClaim:false},null,2)+'\n',{flag:'wx'});
 console.log('Six exact postimages verified, all 5155 inputs and 1710 Review bindings guarded.');
}
