import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {currentCoverageApi,historicalCoverageContext,loadCoverageCodeFixture,assertCoverageCodeBytes} from './coverage-delivery-roles.mjs';
const api=await currentCoverageApi(),historical=historicalCoverageContext(),sha=b=>createHash('sha256').update(b).digest('hex');
const source='727ed5b451ae940a01e56272c8fbc703ea3b0095';
test('actual727coverage projects only from the exact current delivery, artifacts and imported-source identity',async()=>{
 const pin=api.validateCurrentAtlasDelivery();for(const value of [pin.source,api.CURRENT_ATLAS_REVISION,api.coverageRevision,api.COVERAGE_SOURCE_REVISION,api.index.sourceRevision,api.manifest.revision])assert.equal(value,source);
 assert.equal(sha(JSON.stringify(api.index)),api.COVERAGE_SNAPSHOT_REVISION);assert.deepEqual(api.index.sourceArtifacts,api.coverageArtifacts);
 for(const row of api.coverageArtifacts)assert.equal(sha(readFileSync(api.root+'/'+row.path)),row.sha256);
 const map=new Map(api.manifest.files.map(row=>[row.path,row]));assert.equal(map.size,api.manifest.files.length);let imported=0,metadata=0;
 for(const [path,digest]of Object.entries(api.index.evidence.sourceInputs)){const row=map.get(path);if(row){assert.equal(row.sourceSha256,digest);imported++;}else metadata++;}
 assert.equal(imported,145);assert.equal(metadata,26);
 const view=await api.projectCoverageView(api.index,api.manifest);assert(view);assert.equal(view.sourceRevision,source);assert.deepEqual(view.counts,{root:1104,nested:108,specimenViews:9,specimenMemberships:356,specimenSelections:267,shoulder:9});assert.equal(view.targets.length,7);
 for(const flag of ['anatomicalCompletenessProven','clinicalApprovalAsserted','patientRegistrationAsserted'])assert.equal(api.index.assessment[flag],false);
});
test('current727projector refuses mixed6dsource, forged input, missing imports and duplicate Review paths',async()=>{
 const project=api.projectCoverageView,old=historical.index;
 assert.equal(await project(old,api.manifest),null);assert.equal(await project(old,{...api.manifest,revision:old.sourceRevision}),null);assert.equal(await project(api.index,{...api.manifest,revision:old.sourceRevision}),null);
 const input=structuredClone(api.index);input.evidence.sourceInputs['package.json']='0'.repeat(64);assert.equal(await project(input,api.manifest),null);
 const path=Object.keys(api.index.evidence.sourceInputs).find(p=>api.manifest.files.some(row=>row.path===p));assert(path);
 for(const field of ['sourceSha256','importedSha256']){const manifest=structuredClone(api.manifest);manifest.files.find(row=>row.path===path)[field]='0'.repeat(64);assert.equal(await project(api.index,manifest),null);}
 const missing=structuredClone(api.manifest);missing.files=missing.files.filter(row=>row.path!==path);assert.equal(await project(api.index,missing),null);
 const duplicate=structuredClone(api.manifest);duplicate.files.push({...duplicate.files[0]});assert.equal(await project(api.index,duplicate),null);
 const forged=structuredClone(api.index);forged.assessment.clinicalApprovalAsserted=true;assert.equal(await project(forged,api.manifest),null);
});
test('authentic6d to727coverage changes exact source evidence while preserving all factual holds',()=>{
 const before=historical.index,now=api.index;
 for(const key of ['schema','scopedCounts','documentedRootTargetGroups','independentWithheldSourceCatalogs','referenceBacklog','assessment','remainingScope','countingRules'])assert.deepEqual(now[key],before[key],key);
 const a=before.evidence.sourceInputs,b=now.evidence.sourceInputs,sort=(x,y)=>x.path<y.path?-1:x.path>y.path?1:0;
 const delta={added:Object.keys(b).filter(p=>!Object.hasOwn(a,p)).map(p=>({path:p,sha256:b[p]})).sort(sort),removed:Object.keys(a).filter(p=>!Object.hasOwn(b,p)).map(p=>({path:p,sha256:a[p]})).sort(sort),changed:Object.keys(a).filter(p=>Object.hasOwn(b,p)&&a[p]!==b[p]).map(p=>({path:p,before:a[p],after:b[p]})).sort(sort)};
 assert.equal(delta.added.length,3);assert.equal(delta.removed.length,0);assert.equal(delta.changed.length,3);assert.equal(sha(JSON.stringify(delta)),'94ea5db52e9be2a83a7b4a23efe8d215555f23595dc89a9195043f8f88ea945c','Exact source-evidence delta; private path/hash rows remain local');
 historical.verify();
});
test('all six complete historical code modules remain fixed and altered or truncated sources are refused',()=>{
 const fixture=loadCoverageCodeFixture();assert.equal(fixture.code.size,6);
 for(const row of fixture.manifest.sourceRows){const bytes=fixture.code.get(row.path);assertCoverageCodeBytes(row,bytes);const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>assertCoverageCodeBytes(row,changed));assert.throws(()=>assertCoverageCodeBytes(row,bytes.subarray(1)));assert.throws(()=>assertCoverageCodeBytes(row,Buffer.concat([bytes,Buffer.from('foreign')])));}
});