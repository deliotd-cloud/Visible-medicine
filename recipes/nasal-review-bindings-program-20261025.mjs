import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const {build}=await import(pathToFileURL(root+'/scripts/workspace-test-build.mjs'));
const {exactSourceHistoryApi}=await import(pathToFileURL(root+'/scripts/exact-source-history-api.mjs'));
const parent='27b341001718b7d5bb4f45aad0c8d8784e287c3b';
const before=await exactSourceHistoryApi(parent,'review-security');
const built=await build({stdin:{contents:"export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const after=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const pins=JSON.parse(fs.readFileSync(root+'/content/cranial-bone-imaging-pins.json'));
const selected=pins.entries.filter(r=>['FMA53647','FMA53648'].includes(r.identity.fmaId));assert.equal(selected.length,2);
let stale=0,forged=0,placements=0;
for(const {identity:s}of selected){
 const prior=await before.bodyReviewMaterial(s.id),current=await after.bodyReviewMaterial(s.id);assert(prior&&current);assert.equal(current.approval,false);
 for(const tab of ['xray','ultrasound']){assert.equal(prior.topics.find(t=>t.tab===tab).readiness,'pending');assert.equal(current.topics.find(t=>t.tab===tab).readiness,'draft');placements++;}
 for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])assert.deepEqual(current[key],prior[key],s.id+':'+key);
 assert.equal(current.fingerprints.source,prior.fingerprints.source);assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);assert.notEqual(current.materialHash,prior.materialHash);
 assert.deepEqual(await after.parseBodyReviewResponse(current,s.id),current);assert.equal(await after.parseBodyReviewResponse(prior,s.id),null);stale++;
 for(const tab of ['xray','ultrasound'])for(const change of [v=>{v.topics.find(t=>t.tab===tab).body+=' foreign';},v=>{v.topics.find(t=>t.tab===tab).citations=['https://example.invalid/foreign'];},v=>{v.topics.find(t=>t.tab===tab).readiness='approved';}]){const changed=structuredClone(current);change(changed);assert.equal(await after.parseBodyReviewResponse(changed,s.id),null);forged++;}
}
console.log(JSON.stringify({actualBeforeCommit:parent,selected:2,draftPlacements:placements,stalePacketsRefused:stale,forgedPacketsRefused:forged,sourceReasoningToursAndClinicalChecklistUnchanged:true,privateRecordsReadOrMigrated:false,clinicalApproval:false}));
