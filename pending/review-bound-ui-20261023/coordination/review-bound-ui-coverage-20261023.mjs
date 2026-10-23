// Main-only exact producer output integration into an unserved successor.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildCoverageIndex} from 'file:///F:/VisibleMedicine/staging/20261023-review-bound-ui-website/website/scripts/build-anatomy-coverage-index.mjs';
const root='F:/VisibleMedicine/staging/20261023-review-bound-ui-website',site=root+'/website';
const candidate='F:/VisibleMedicine/staging/20261023-coverage-9e14-replay/candidate';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const prep=json(root+'/PREPARATION.json'),manifest=json(candidate+'/candidate-manifest.json');
assert.equal(sha(read(candidate+'/candidate-manifest.json')),'15855ce2c1bc01223ab42a9a4a4efca2c0744e0fcaae7cef05d0ffddfffce058');
assert.equal(manifest.sourceRevision,prep.atlasHead);assert.equal(manifest.sourceInputs,171);
assert.equal(manifest.canonicalSnapshotsInstalled,false);assert.equal(manifest.clinicalApproval,false);
assert.equal(manifest.originalModelsOrObjRead,false);assert.equal(manifest.patientRegistration,false);
for(const p of manifest.producerInputs)assert.equal(sha(read(site+'/'+p.path)),p.sha256);
for(const receipt of manifest.receipts){assert.equal(receipt.status,0);assert.equal(sha(read(candidate+'/'+receipt.scope+'.log')),receipt.logSha256);}
const git=(...a)=>execFileSync('git',['-C',prep.atlas,...a],{encoding:'utf8',windowsHide:true});
assert.equal(git('rev-parse','HEAD').trim(),prep.atlasHead);assert.equal(git('status','--porcelain').trim(),'');
function differences(a,b,p=''){
  if(JSON.stringify(a)===JSON.stringify(b))return [];
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return[p];
  return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>differences(a[k],b[k],p+'/'+k));
}
const artifacts=manifest.sourceArtifacts.map(a=>({...a,bytes:read(candidate+'/'+a.scope+'.json')}));
assert.deepEqual(buildCoverageIndex(artifacts),json(candidate+'/index.json'));
assert.equal(sha(read(candidate+'/index.json')),manifest.indexSha256);
const index=json(candidate+'/index.json');
for(const[p,digest]of Object.entries(index.evidence.sourceInputs))assert.equal(sha(read(prep.atlas+'/'+p)),digest,p);
const comparison=[];
for(const scope of ['root','nested','independent','reference','index']){
  const path='docs/anatomy-coverage/'+scope+'.json',before=read(site+'/'+path),after=read(candidate+'/'+scope+'.json');
  const a=JSON.parse(before),b=JSON.parse(after),actual=differences(a,b);
  const expected=['/sourceRevision','/evidence/sourceInputs/package.json'];
  if(scope==='reference')expected.push('/evidence/committedSourceInputs/package.json','/evidence/commitReadback/revision');
  if(scope==='index')expected.push(...[0,1,2,3].map(i=>'/sourceArtifacts/'+i+'/sha256'));
  assert.deepEqual(actual.sort(),expected.sort(),scope+' substantive inventory changed');
  assert.equal(a.sourceRevision,'7978478992f54ea68e0f53c3d195c459c7b80068');assert.equal(b.sourceRevision,prep.atlasHead);
  comparison.push({path,beforeSha256:sha(before),afterSha256:sha(after),changedLeaves:actual});
}
const evidence=root+'/coverage-transition';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
for(const p of ['lib/anatomy-coverage-view.ts','scripts/check-anatomy-coverage.mjs']){
  fs.writeFileSync(evidence+'/'+p.replaceAll('/','__')+'.before.raw',read(site+'/'+p),{flag:'wx'});
}
for(const row of comparison){
  fs.writeFileSync(evidence+'/'+row.path.split('/').at(-1)+'.before.raw',read(site+'/'+row.path),{flag:'wx'});
  fs.copyFileSync(candidate+'/'+row.path.split('/').at(-1),site+'/'+row.path);
  assert.equal(sha(read(site+'/'+row.path)),row.afterSha256);
}
const byPath=new Map(json(site+'/atlas-review/manifest.json').files.map(f=>[f.path,f]));
const imported=Object.keys(index.evidence.sourceInputs).sort().flatMap(path=>{const f=byPath.get(path);return f?[{path,sourceSha256:f.sourceSha256,importedSha256:f.importedSha256}]:[];});
assert.equal(imported.length,145);assert.equal(Object.keys(index.evidence.sourceInputs).length-imported.length,26);
const proof={at:new Date().toISOString(),source:prep.atlasHead,candidateManifestSha256:sha(read(candidate+'/candidate-manifest.json')),comparison,
  snapshotDigest:sha(JSON.stringify(index)),importedDigest:sha(JSON.stringify(imported)),packageDigest:index.evidence.sourceInputs['package.json'],
  substantiveContentCountsAndHoldsUnchanged:true,producerInputsAndCurrentSourceHashesVerified:true,originalModelsOrObjRead:false,
  clinicalApproval:false,patientRegistration:false,previewChanged:false,installed:false};
fs.writeFileSync(evidence+'/TRANSITION.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:evidence+'/TRANSITION.json',sha256:sha(read(evidence+'/TRANSITION.json')),snapshotDigest:proof.snapshotDigest,packageDigest:proof.packageDigest,importedDigest:proof.importedDigest}));
