import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final',site=root+'/website';
const parent=json(root+'/PARENT_SOURCE.json');
const imports=[
 ['20261031-head-colic-epoch-fix','tests/head-feature-roles-preservation.test.mjs','0f12788dd960912498c3fa611dd36e867cc38198b2b2b0bd144a1e7c4e597cc9'],
 ['20261031-shoulder-review-epoch-fix','tests/clinical-review-shoulder-muscle-xray.test.ts','c1697ea9605ba5c15517b33145f9699511f4c8c81483978d7decfebaeafaad9b'],
];
for(const [proposal,path,sha256] of imports){
 assert([parent.sourceRows.find(row=>row.path===path).sha256,sha256].includes(hash(site+'/'+path)),'Only parent or exact already-copied proposal');
 const from='G:/VisibleMedicine-temp/proposals/'+proposal+'/'+path;assert.equal(hash(from),sha256);
 fs.copyFileSync(from,site+'/'+path);
}
// Retain the current packet's original fingerprint assertions as well as the historical assertions.
const file=site+'/tests/clinical-review-shoulder-muscle-xray.test.ts';
let source=fs.readFileSync(file,'utf8');
const anchor='  assert.notEqual(historical.materialHash,before.materialHash);';assert.equal(source.split(anchor).length,2);
source=source.replace(anchor,anchor+'\n  assert.equal(after.fingerprints.source,before.fingerprints.source);\n  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);\n  assert.notEqual(after.materialHash,before.materialHash);');
fs.writeFileSync(file,source);
fs.writeFileSync(root+'/INTEGRATION.json',JSON.stringify({at:new Date().toISOString(),imports,mainRetainedCurrentFingerprintAssertions:true,workerMetadataCorrection:{proposal:'20261031-head-colic-epoch-fix',field:'beforeSha256',correct:parent.sourceRows.find(row=>row.path===imports[0][1]).sha256},installed:false},null,2)+'\n',{flag:'wx'});
console.log('Two reviewed test proposals integrated; current and historical packet assertions both retained.');
