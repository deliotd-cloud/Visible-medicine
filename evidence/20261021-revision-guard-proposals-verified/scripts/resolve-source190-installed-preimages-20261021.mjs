import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-cutover-inventory';
const prior=json(stage+'/PREIMAGE_CLASSIFICATION.json');
const installed='F:/VisibleMedicine/recovery/checkpoints/20261020-local-review-cutover';
const checkpoint=json(installed+'/checkpoint.json');
assert.equal(checkpoint.review,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
assert(checkpoint.ownerConfirmedDraftsSaved&&checkpoint.ownerAuthorizedSwitch&&checkpoint.canonicalInstalled);
const installation=checkpoint.receipts.find(r=>r.to===installed+'/evidence/INSTALLATION.json');assert(installation);
assert.equal(sha(read(installation.to)),installation.sha256);
const plan=json(installed+'/PLAN.json');
const inventory='F:/VisibleMedicine/staging/20261020-review-form-followup/SOURCE_INPUTS_AFTER.json';
assert.equal(plan.inventory,inventory);assert.equal(sha(read(inventory)),plan.inventorySha256);
const byPath=new Map(json(inventory).map(r=>[r.path,r.sha256]));
const installationReceipt=json(installation.to);
assert.equal(installationReceipt.review,checkpoint.review);
const preserved=new Set(installationReceipt.preserved);
const rows=prior.classifications.map(row=>{
 assert.equal(sha(read('F:/VisibleMedicine/website/'+row.path)),row.beforeSha256,row.path);
 if(row.provenance!=='unresolved-overlap')return row;
 if(!preserved.has(row.path)&&byPath.get(row.path)===row.beforeSha256)
  return {...row,provenance:'exact-owner-authorized-installed-b2bd-inventory'};
 return row;
});
const counts={};for(const row of rows)counts[row.provenance]=(counts[row.provenance]??0)+1;
const unresolved=rows.filter(row=>row.provenance==='unresolved-overlap');
const result={at:new Date().toISOString(),existingPaths:rows.length,counts,unresolved,classifications:rows,
 installedCheckpoint:installed+'/checkpoint.json',installedCheckpointSha256:sha(read(installed+'/checkpoint.json')),
 installedSourceInventory:inventory,installedSourceInventorySha256:sha(read(inventory)),
 currentManifestSource:'98d7f17e2d120b031633e59e47fc50c82d44b2d0',currentReview:checkpoint.review,
 preservedAtPriorCutover:[...preserved],canonicalChanged:false,candidateChanged:false,
 limits:'Read-only provenance proof, not new overwrite/publication/clinical authority. Recheck exact current bytes and specialist ownership before cutover. Preserve or merge remaining unresolved paths. No private data copied.'};
fs.writeFileSync(stage+'/PREIMAGE_CLASSIFICATION_V2.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({existingPaths:rows.length,counts,unresolved:unresolved.map(r=>r.path),canonicalChanged:false}));
