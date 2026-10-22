import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition';
const prep=json(stage+'/PREPARATION.json'),site=prep.website,atlas=prep.atlas;
const previous=json(prep.sourceReceipt),beforeSite=previous.website;
const manifest=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json');
const originalManifest=json(beforeSite+'/atlas-review/manifest.json');
const {build,transform}=createRequire(site+'/package.json')('esbuild');
const generated=new Set(['content/body-renderer-revision.json','content/review-revisions.json']);
const shaJson=v=>sha(JSON.stringify(v));
await test('every generated Review source/import byte is bound to the exact new Atlas Git revision',()=>{
  assert.equal(manifest.revision,prep.atlasHead);assert.equal(inputs.sourceCommit,prep.atlasHead);
  assert.equal(manifest.files.length,originalManifest.files.length+5);
  assert.equal(new Set(manifest.files.map(f=>f.path)).size,manifest.files.length);
  const packages=new Set(originalManifest.packages);for(const name of manifest.packages)assert(packages.has(name));
  assert.deepEqual([...manifest.packages].sort(),[...originalManifest.packages].sort());
  for(let i=0;i<manifest.files.length;i+=24){
    const batch=manifest.files.slice(i,i+24);
    for(const f of batch)assert(/^[A-Za-z0-9_./-]+$/.test(f.path)&&!f.path.split('/').some(s=>s==='..'||s==='.'||!s));
    const bytes=runGit(['-C',atlas,'cat-file','--batch'],Buffer.from(batch.map(f=>prep.atlasHead+':'+f.path).join('\n')+'\n'));
    let cursor=0;
    for(const row of batch){
      const end=bytes.indexOf(10,cursor);assert(end>cursor);const[,kind,size]=bytes.subarray(cursor,end).toString().split(' ');assert.equal(kind,'blob');cursor=end+1;
      const source=bytes.subarray(cursor,cursor+Number(size));cursor+=Number(size);assert.equal(bytes[cursor++],10);
      assert.equal(sha(source),row.sourceSha256,row.path+': immutable source');
      assert.equal(sha(read(site+'/atlas-review/'+row.path)),row.importedSha256,row.path+': actual imported bytes');
    }assert.equal(cursor,bytes.length);
  }
  assert.equal(inputs.sha256,shaJson(inputs.inputs));assert.equal(manifest.websiteIntegrationSha256,inputs.sha256);
  assert.equal(new Set(inputs.inputs.map(f=>f.path)).size,inputs.inputs.length);
  for(const row of inputs.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
  assert(!inputs.inputs.some(row=>generated.has(row.path.replace(/^atlas-review\//,''))),'Self-referential revision files remain excluded');
});
await test('new website renderer/shoulder fingerprints derive from exact source revisions, without migrating approvals',()=>{
  const body=json(site+'/atlas-review/content/body-renderer-revision.json'),sourceBody=json(atlas+'/content/body-renderer-revision.json');
  assert.equal(body.sourceRendererSha256,sourceBody.sha256);assert.equal(body.websiteIntegrationSha256,inputs.sha256);
  assert.equal(body.sha256,shaJson({source:sourceBody.sha256,website:inputs.sha256}));
  const shoulder=json(site+'/atlas-review/content/review-revisions.json'),sourceShoulder=json(atlas+'/content/review-revisions.json');
  assert.deepEqual(shoulder.sourceRevisions,sourceShoulder.revisions);
  assert.equal(shoulder.modelHash,sourceShoulder.modelHash);assert.equal(shoulder.websiteIntegrationSha256,inputs.sha256);
  assert.equal(Object.keys(shoulder.revisions).length,9);
  for(const[id,tracks]of Object.entries(sourceShoulder.revisions)){
    for(const track of ['geometry','teaching'])assert.equal(shoulder.revisions[id][track],shaJson({source:tracks[track],website:inputs.sha256}));
    assert.equal(shoulder.revisions[id].imaging,null);
  }
  assert.notEqual(body.sha256,json(beforeSite+'/atlas-review/content/body-renderer-revision.json').sha256);
});
async function api(root,prefix){
  const result=await build({stdin:{contents:`export * from './${prefix}lib/body-review-material';export {contentTabs} from './${prefix}lib/content-types';`,resolveDir:root,loader:'ts'},
    bundle:true,write:false,platform:'node',format:'esm',alias:{'@':root},tsconfigRaw:{},plugins:[{name:'no-image-or-model-imports',setup(api){api.onLoad({filter:/\.(?:glb|dcm|nii|nrrd|png|jpe?g|webp)$/i},()=>{throw Error('Binary input refused');});}}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const before=await api(beforeSite,'atlas-review/'),current=await api(site,'atlas-review/'),direct=await api(atlas,'');
let changed=0,unchanged=0,changedTopics=0,pendingTopics=0;const changedIds=[];
await test('all 1104 imported worksheets exactly match direct Atlas source; only 22 snapshots and 89 topics change',()=>{
  assert.deepEqual(current.bodyReviewSummaries,direct.bodyReviewSummaries);assert.deepEqual(current.bodyReviewSummaries,before.bodyReviewSummaries);
  assert.equal(current.bodyReviewSummaries.length,1104);
  for(const row of current.bodyReviewSummaries){
    const old=before.bodyReviewSnapshot(row.id),actual=current.bodyReviewSnapshot(row.id),source=direct.bodyReviewSnapshot(row.id);
    assert.deepEqual(actual,source,row.id+': website versus direct source');
    assert.deepEqual(actual.source,old.source,row.id+': source identity');
    for(const [i,topic]of actual.topics.entries()){
      assert.equal(topic.readiness,old.topics[i].readiness);if(topic.readiness==='pending')pendingTopics++;
      if(JSON.stringify(topic)!==JSON.stringify(old.topics[i]))changedTopics++;
    }
    const priorTours=actual.guidedTours.filter(e=>!['right-hamstring-orientation','left-hamstring-orientation'].includes(e.tour.id));
    assert.deepEqual(priorTours,old.guidedTours,row.id+': prior evidence');
    if(JSON.stringify(actual)!==JSON.stringify(old)){changed++;changedIds.push(row.id);}else unchanged++;
  }
  assert.equal(changed,22);assert.equal(unchanged,1082);assert.equal(changedTopics,89);assert.equal(pendingTopics,525);
});
await test('changed imported materials retain source hashes and receive new teaching hashes, never approval or a signed decision',async()=>{
  const unaffected=current.bodyReviewSummaries.find(s=>s.region==='foot'&&!changedIds.includes(s.id));assert(unaffected);
  for(const id of [...changedIds,unaffected.id]){
    const old=await before.bodyReviewMaterial(id),actual=await current.bodyReviewMaterial(id),source=await direct.bodyReviewMaterial(id);
    assert.deepEqual(actual,source,id);assert.equal(actual.status,'worksheet-not-submitted');assert.equal(actual.approval,false);
    assert.equal(actual.fingerprints.source,old.fingerprints.source);assert.deepEqual(actual.reviewerNotes,old.reviewerNotes);
    if(id===unaffected.id)assert.deepEqual(actual,old);else{assert.notEqual(actual.fingerprints.teaching,old.fingerprints.teaching);assert.notEqual(actual.materialHash,old.materialHash);}
  }
});
await test('actual coverage projection accepts only its fresh source/import inventory and refuses stale or altered data',async()=>{
  const {code}=await transform(read(site+'/lib/anatomy-coverage-view.ts').toString(),{loader:'ts',format:'esm',target:'es2022'});
  const {projectCoverageView}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const snapshot=json(site+'/docs/anatomy-coverage/index.json');
  const result=await projectCoverageView(snapshot,manifest);assert(result);assert.equal(result.sourceRevision,prep.atlasHead);
  assert.equal(result.counts.root,1104);assert.equal(result.counts.nested,108);
  assert.equal(snapshot.assessment.clinicalApprovalAsserted,false);assert.equal(snapshot.assessment.anatomicalCompletenessProven,false);
  assert.equal(await projectCoverageView(json(beforeSite+'/docs/anatomy-coverage/index.json'),manifest),null);
  assert.equal(await projectCoverageView(snapshot,originalManifest),null);
  for(const mutate of [s=>s.sourceRevision=previous.atlasHead,s=>s.assessment.clinicalApprovalAsserted=true,
    s=>s.assessment.anatomicalCompletenessProven=true,s=>s.scopedCounts.root.rootRepresentations++,s=>delete s.evidence.sourceInputs['package.json']]){
    const copy=structuredClone(snapshot);mutate(copy);assert.equal(await projectCoverageView(copy,manifest),null);
  }
  for(const mutate of [m=>m.revision=previous.atlasHead,m=>m.files.push(m.files[0]),m=>m.files.find(f=>Object.hasOwn(snapshot.evidence.sourceInputs,f.path)).sourceSha256='0'.repeat(64)]){
    const copy=structuredClone(manifest);mutate(copy);assert.equal(await projectCoverageView(snapshot,copy),null);
  }
});
console.log(JSON.stringify({atlasRevision:prep.atlasHead,sourceFiles:manifest.files.length,reviewBindings:inputs.inputs.length,
  integrationSha256:inputs.sha256,rootSnapshots:1104,changedSnapshots:changed,unchangedSnapshots:unchanged,
  changedTopics,pendingTopics,sourceRegistration:'semantic identities only',normalPreviewChanged:false,
  limits:'Metadata and pure imported-material/projection checks. No built viewer/runtime, full types/build, browser, clinical or public acceptance.'}));
