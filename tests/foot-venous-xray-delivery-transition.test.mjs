import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const oldPinBytes=read('./fixtures/current-atlas-delivery-before-foot-venous-xray.json.raw');
const oldContractBytes=read('./fixtures/current-atlas-delivery-before-foot-venous-xray.test.mjs.raw');
const oldChecklistBytes=read('./fixtures/completion-checklist-before-foot-venous-xray.json.raw');
const transitionBytes=read('./fixtures/foot-venous-xray-delivery-transition.json');
const introduction=JSON.parse(transitionBytes);
const oldPin=JSON.parse(oldPinBytes);
const prior=validateChecklist(JSON.parse(oldChecklistBytes));
const source='f5097af8493701d64a8e2a2b5797df380f3b348a';
const tree='fba69dff6f83e7f092ccdab4c9a37f05c090c98b';
const documentPaths=['atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 ...['head-neck','shoulder','lower-limb','female-pelvis'].flatMap(name=>
  ['manifest.json','source-inputs.json'].map(file=>`public/atlas-runtime/${name}/${file}`))];

test('f505 pin, whole contract and register66 remain exact immutable history',()=>{
 assert.equal(sha(oldPinBytes),'28b970fbc9e001504d09fef7e85199a5d2027df324ef767e982c309d9cc2a0c3');
 assert.equal(sha(oldContractBytes),'2860e5c1168bca1fc631d6a720357ed1eb5bbbb74a846b995012aae63321db13');
 assert.equal(sha(oldChecklistBytes),'7f800c3b9efd5cfe604c970ad32145efdc2dfc27bdcd1f6bb85fd5f0361a6c32');
 assert.equal(oldPin.source,'f5052a1906bf9b87e5235bda57d367b1103729db');
 assert.equal(oldPin.sourceTree,'36381d525f7c6886743bcec00fcee96931d65c58');
 assert.equal(oldPin.reviewIntegration,'8f8c9c87b7fc8642bcdf57304820b86cd8c814bfa6394ef8b277e143351d1896');
 assert.equal(oldPin.reviewSourceFiles,1538);
 assert.equal(prior.revision,66);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}));
});

test('f509 introduction is an exact three-literal contract and 12-document pin',()=>{
 assert.equal(sha(transitionBytes),'946a547dc183a1bcf394d8a448627ea51907fa5210f73b8ddde75ec9b505f2af');
 assert.equal(introduction.schema,'vm-foot-venous-xray-delivery-transition/1');
 assert.deepEqual(Object.keys(introduction).sort(),['schema','before','after'].sort());
 assert.deepEqual(introduction.before,{
  pinSha256:sha(oldPinBytes),contractSha256:sha(oldContractBytes),checklistSha256:sha(oldChecklistBytes),
 });
 const after=introduction.after;
 assert.deepEqual(Object.keys(after).sort(),['pin','pinSha256','contractSha256','checklistSha256','checklistDelta'].sort());
 assert.equal(sha(bytes(after.pin)),after.pinSha256);
 assert.equal(after.pin.schema,'vm-current-atlas-test-delivery-1');
 assert.deepEqual(Object.keys(after.pin).sort(),Object.keys(oldPin).sort());
 assert.equal(after.pin.source,source);
 assert.equal(after.pin.sourceTree,tree);
 assert.equal(after.pin.reviewSourceFiles,1541);
 assert.equal(after.pin.viewerFiles,46);
 assert.equal(after.pin.viewerPackages,22);
 assert.deepEqual(Object.keys(after.pin.documents).sort(),documentPaths.sort());
 for(const digest of Object.values(after.pin.documents))assert.match(digest,/^[a-f0-9]{64}$/);
 let contract=oldContractBytes.toString();
 for(const [before,replacement] of [
  ["CURRENT_ATLAS_REVISION,'f5052a1906bf9b87e5235bda57d367b1103729db'",`CURRENT_ATLAS_REVISION,'${source}'`],
  ["pin.sourceTree,'36381d525f7c6886743bcec00fcee96931d65c58'",`pin.sourceTree,'${tree}'`],
  ['sourceFiles,1538','sourceFiles,1541'],
 ]){
  assert.equal(contract.split(before).length,2,`unique historic contract literal ${before}`);
  contract=contract.replace(before,replacement);
 }
 assert.equal(sha(Buffer.from(contract)),after.contractSha256,'only three declared contract literals change');
});

test('register67 introduction is reconstructed solely from register66 and the sealed delta',()=>{
 const {after}=introduction,{checklistDelta:delta}=after;
 assert.deepEqual(Object.keys(delta).sort(),['revision','updatedAt','baseline','pendingAtlasSource','changeLogHead'].sort());
 assert.equal(delta.revision,67);
 assert.equal(delta.updatedAt,'2026-10-19');
 assert.deepEqual(Object.keys(delta.baseline).sort(),['atlasCommit','atlasTree','reviewIntegration','reviewSourceFiles','rootDraftPlacements','rootPendingPlacements'].sort());
 assert.equal(delta.baseline.atlasCommit,source);
 assert.equal(delta.baseline.atlasTree,tree);
 assert.equal(delta.baseline.reviewIntegration,after.pin.reviewIntegration);
 assert.equal(delta.baseline.reviewSourceFiles,1541);
 assert.equal(delta.baseline.rootDraftPlacements,9336);
 assert.equal(delta.baseline.rootPendingPlacements,561);
 assert.equal(delta.baseline.rootDraftPlacements-prior.baseline.rootDraftPlacements,2);
 assert.equal(delta.baseline.rootPendingPlacements-prior.baseline.rootPendingPlacements,-2);
 assert.equal(prior.baseline.rootTopicPlacements,9936);
 assert.equal(prior.baseline.rootGeneratedIdentificationPlacements,39);
 assert.equal(9336+561+39,9936);
 assert.deepEqual(Object.keys(delta.pendingAtlasSource).sort(),['commit','tree','rootDraftPlacements','rootPendingPlacements','rootGeneratedIdentificationPlacements','websiteImported','evidence','note'].sort());
 assert.equal(delta.pendingAtlasSource.commit,source);
 assert.equal(delta.pendingAtlasSource.tree,tree);
 assert.equal(delta.pendingAtlasSource.rootDraftPlacements,9336);
 assert.equal(delta.pendingAtlasSource.rootPendingPlacements,561);
 assert.equal(delta.pendingAtlasSource.rootGeneratedIdentificationPlacements,39);
 assert.equal(delta.pendingAtlasSource.websiteImported,true);
 assert.deepEqual(Object.keys(delta.changeLogHead).sort(),['date','revision','change'].sort());
 assert.equal(delta.changeLogHead.revision,67);
 assert.equal(delta.changeLogHead.date,'2026-10-19');
 const expected=structuredClone(prior);
 expected.revision=delta.revision;
 expected.updatedAt=delta.updatedAt;
 Object.assign(expected.baseline,delta.baseline);
 expected.pendingAtlasSource=delta.pendingAtlasSource;
 expected.changeLog=[delta.changeLogHead,...prior.changeLog];
 validateChecklist(expected);
 assert.equal(expected.items.length,71);
 assert.equal(expected.items.filter(item=>item.scope==='optional').length,8);
 for(const key of ['items','rules','statusDefinitions','roots'])assert.deepEqual(expected[key],prior[key],key);
 assert.equal(expected.baseline.privateClinicalDecisionCounts,null);
 assert.equal(expected.baseline.publicReleaseApproval,null);
 assert.equal(sha(bytes(expected)),after.checklistSha256,'only declared register67 delta changes');
});

test('the latest delivered Atlas binding remains independently valid',()=>{
 const live=validateCurrentAtlasDelivery();
 assert.notEqual(live.source,oldPin.source);
});
