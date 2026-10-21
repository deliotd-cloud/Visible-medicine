import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-cutover-inventory';
const plan=json(stage+'/NAMED_PATHS.json');
const target='F:/VisibleMedicine/website';
const closed=json('F:/VisibleMedicine/staging/20261021-source190-website/ORIGINAL_485_INPUTS.json');
const byPath=new Map(closed.map(r=>[r.path,r.sha256]));
const review=json(target+'/atlas-review/manifest.json');
const generatedReview=new Map(review.files.map(r=>['atlas-review/'+r.path,r.importedSha256]));
const runtime=new Map();
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base='public/atlas-runtime/'+name+'/';const manifest=json(target+'/'+base+'manifest.json');
 for(const row of manifest.files)runtime.set(base+row.path,row.sha256);
}
const classifications=[];
for(const row of plan.filter(r=>r.exists&&r.disposition==='requires-exact-preimage-admission')){
 const bytes=read(target+'/'+row.path);assert.equal(sha(bytes),row.beforeSha256,'Canonical path changed: '+row.path);
 let provenance='unresolved-overlap';
 if(byPath.get(row.path)===row.beforeSha256)provenance='exact-closed485-owned-preimage';
 else if(generatedReview.get(row.path)===row.beforeSha256)provenance='exact-installed-review-producer';
 else if(runtime.get(row.path)===row.beforeSha256)provenance='exact-installed-runtime-producer';
 else {
  let historical=null;try{historical=runGit(['-C',target,'show','HEAD:'+row.path]);}catch{}
  if(historical&&sha(historical)===row.beforeSha256)provenance='unchanged-canonical-HEAD-path';
 }
 classifications.push({path:row.path,beforeSha256:row.beforeSha256,provenance});
}
const counts={};for(const r of classifications)counts[r.provenance]=(counts[r.provenance]??0)+1;
const unresolved=classifications.filter(r=>r.provenance==='unresolved-overlap');
const result={at:new Date().toISOString(),existingPaths:classifications.length,counts,unresolved,
 classifications,canonicalChanged:false,candidateChanged:false,
 limits:'Read-only known-byte classification, not overwrite approval, clinical/rights clearance, complete transitive producer verification or a substitute for current specialist-state checks. Exact target preimages and full applicable gates must be rechecked at cutover. Unresolved overlap must be preserved and assessed, not overwritten.'};
fs.writeFileSync(stage+'/PREIMAGE_CLASSIFICATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({existingPaths:result.existingPaths,counts,unresolved:unresolved.map(r=>r.path),canonicalChanged:false}));
