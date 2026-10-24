// Retain the pre-test recipe failure and restore only two main-owned inputs.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-adjacent-regression-current',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),attempt=process.argv[2]??'1';assert(['1','2'].includes(attempt));const out=stage+'/failed-main-integration-'+attempt;
assert(!fs.existsSync(stage+'/MAIN_TRANSITION.json'));assert(!fs.existsSync(site+'/tests/adjacent-current-role-inverse.mjs'));
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions.length,0);
fs.mkdirSync(out);const rows=[];
for(const name of ['tests/arterial-history-preservation.test.mjs','tests/arterial-current-role-inverse.mjs','tests/tour-playback-source-role.mjs','tests/tour-playback-role-inverse.mjs','tests/clinical-review-continuous-guided-playback.test.ts','tests/renal-tour-epoch-admission.mjs','tests/renal-tour-epoch-admission.test.mjs','tests/release-epoch-composition-preservation.test.mjs']){
 const to=out+'/'+path.basename(name)+'.raw';fs.copyFileSync(site+'/'+name,to,fs.constants.COPYFILE_EXCL);rows.push({path:name,sha256:hash(to),saved:to});
}
for(const name of ['tests/tour-playback-source-role.mjs','tests/renal-tour-epoch-admission.mjs']){
 const r=parent.sourceRows.find(r=>r.path===name);assert.equal(hash(parent.website+'/'+name),r.sha256);
 assert.equal(hash(site+'/'+name),rows.find(r=>r.path===name).sha256);
 fs.copyFileSync(parent.website+'/'+name,site+'/'+name);
}
fs.writeFileSync(stage+'/FAILED_INTEGRATION_'+attempt+'.json',JSON.stringify({at:new Date().toISOString(),classification:attempt==='1'?'Pre-test recipe evidence-name collision: multiple exact historical epochs of one helper attempted to use one immutable preimage basename. Corrected recipe keys by exact SHA; no product edits or test weakening.':'Pre-test inverse-seam guard rejected a CRLF assumption. Observed source is LF throughout; recipe now removes exact LF imports and requires complete bb89 equality, without normalization or relaxed checks.',rows,restoredOnly:['tests/tour-playback-source-role.mjs','tests/renal-tour-epoch-admission.mjs'],testsHadNotStarted:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({retained:rows.length,restoredMainInputs:2,productChanged:false}));
