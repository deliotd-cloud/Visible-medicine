// Admit only actual freshly generated inventories; unchanged scope is not completeness.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {buildCoverageIndex} from 'file:///F:/VisibleMedicine/staging/20261023-digital-vein-website/website/scripts/build-anatomy-coverage-index.mjs';
const stage='F:/VisibleMedicine/staging/20261023-digital-vein-website',site=stage+'/website',candidate=stage+'/coverage-candidate';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),manifest=json(candidate+'/candidate-manifest.json'),index=json(candidate+'/index.json');
assert.equal(manifest.sourceRevision,prep.atlasHead);assert.equal(manifest.clinicalApproval,false);assert.equal(manifest.patientRegistration,false);assert.equal(manifest.originalModelsOrObjRead,false);assert.equal(manifest.canonicalSnapshotsInstalled,false);
for(const r of manifest.producerInputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
for(const r of manifest.receipts){assert.equal(r.status,0);assert.equal(sha(read(candidate+'/'+r.scope+'.log')),r.logSha256);}
assert.deepEqual(buildCoverageIndex(manifest.sourceArtifacts.map(r=>({...r,bytes:read(candidate+'/'+r.scope+'.json')}))),index);assert.equal(sha(read(candidate+'/index.json')),manifest.indexSha256);
for(const[p,digest]of Object.entries(index.evidence.sourceInputs)){assert.equal(sha(read(prep.atlas+'/'+p)),digest);assert.equal(sha(execFileSync('git',['-C',prep.atlas,'show',prep.atlasHead+':'+p],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest);}
const changedSource=new Set(execFileSync('git',['-C',prep.atlas,'diff','--name-only',parent.atlasHead,prep.atlasHead],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/));
const transition=[];
for(const scope of ['root','nested','independent','reference','index']){
 const p='docs/anatomy-coverage/'+scope+'.json',a=json(site+'/'+p),b=json(candidate+'/'+scope+'.json'),inverse=structuredClone(b);assert.equal(a.sourceRevision,parent.atlasHead);assert.equal(b.sourceRevision,prep.atlasHead);inverse.sourceRevision=a.sourceRevision;
 const sourceDeltas=[];for(const k of new Set([...Object.keys(a.evidence.sourceInputs),...Object.keys(b.evidence.sourceInputs)])){if(a.evidence.sourceInputs[k]!==b.evidence.sourceInputs[k]){assert(changedSource.has(k),'Unknown coverage source delta '+k);sourceDeltas.push(k);}}
 inverse.evidence.sourceInputs=a.evidence.sourceInputs;
 if(scope==='reference'){inverse.evidence.committedSourceInputs=a.evidence.committedSourceInputs;assert.equal(b.evidence.commitReadback.revision,prep.atlasHead);inverse.evidence.commitReadback.revision=a.evidence.commitReadback.revision;}
 if(scope==='index')inverse.sourceArtifacts=a.sourceArtifacts;
 assert.deepEqual(inverse,a,'Only source/evidence identity changes; inventory counts, coverage gaps and holds must remain exact: '+scope);
 transition.push({path:p,beforeSha256:sha(read(site+'/'+p)),afterSha256:sha(read(candidate+'/'+scope+'.json')),sourceDeltas,scopeAndAllOtherFieldsUnchanged:true});
}
const history='tests/fixtures/digital-vein-delivery-before/';
for(const p of ['lib/anatomy-coverage-view.ts','scripts/check-anatomy-coverage.mjs',...transition.map(r=>r.path)]){const to=site+'/'+history+p+'.raw';assert(!fs.existsSync(to));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to,fs.constants.COPYFILE_EXCL);}
for(const r of transition)fs.copyFileSync(candidate+'/'+r.path.split('/').at(-1),site+'/'+r.path);
const byPath=new Map(json(site+'/atlas-review/manifest.json').files.map(r=>[r.path,r])),imported=Object.keys(index.evidence.sourceInputs).sort().flatMap(p=>{const r=byPath.get(p);return r?[{path:p,sourceSha256:r.sourceSha256,importedSha256:r.importedSha256}]:[];});
assert.equal(imported.length,145);assert.equal(Object.keys(index.evidence.sourceInputs).length-imported.length,26);
const report={at:new Date().toISOString(),source:prep.atlasHead,candidateManifestSha256:sha(read(candidate+'/candidate-manifest.json')),transition,snapshotDigest:sha(JSON.stringify(index)),importedDigest:sha(JSON.stringify(imported)),packageDigest:index.evidence.sourceInputs['package.json'],artifacts:manifest.sourceArtifacts,sourceInputs:Object.keys(index.evidence.sourceInputs).length,importedInputs:imported.length,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false};fs.writeFileSync(stage+'/COVERAGE_TRANSITION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
