import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-linked-tour-dismiss-successor',sourcePath=root+'/SOURCE.json',source=json(sourcePath);
assert.equal(source.previousSourceSha256,'f04f3dbcbb43ab16fdc3926c799f6a1d8b743e0a9b7f4ff1d6e557fd1aefccfd');assert.equal(source.sourcePaths,6111);assert.equal(source.reviewBindingUnchanged,true);
assert.deepEqual(source.changedProductPaths,['components/HeadAtlasLearningPicker.tsx']);assert.equal(source.sourceRows.find(row=>row.path==='components/HeadAtlasLearningPicker.tsx').sha256,'38f0385f393dc2e1a65c2af33c843cca0e25f4d4903bb3dcffc3866cdfbcd4a0');
const earlier='F:/VisibleMedicine/staging/20261022-head-manual-migration-history-proof',later='F:/VisibleMedicine/staging/20261022-migration-next-consumer-proposal';
const first=json(earlier+'/HANDOFF.json'),next=json(later+'/HANDOFF.json');assert.equal(sha(read(earlier+'/HANDOFF.json')),next.prerequisiteProposalSha256);assert.equal(next.sourceReceiptSha256,source.previousSourceSha256);
const rows=[];
for(const [stage,hashes] of [[earlier,first.codeSha256],[later,next.codeSha256]])for(const [path,digest] of Object.entries(hashes)){
 assert(/^tests\/[a-z0-9-]+(?:\.test)?\.mjs$/.test(path));assert(!['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs'].includes(path));
 const code=stage+'/CODE/'+path;assert.equal(sha(read(code)),digest);const prior=source.sourceRows.find(row=>row.path===path);
 const before=prior?(stage+'/RAW/'+path+(stage===later?'.raw':'')):null;
 if(prior){assert.equal(sha(read(before)),prior.sha256);assert.deepEqual(read(before),read(source.website+'/'+path));}
 rows.push({path,code,sha256:digest,before,beforeSha256:prior?.sha256??null});
}
assert.equal(rows.length,5);assert.equal(new Set(rows.map(row=>row.path)).size,5);
fs.writeFileSync(root+'/HISTORY_PLAN.json',JSON.stringify({sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),rows,receipt:root+'/TEST_READY_SOURCE.json',scope:'Exact source-only historical migration and its two whole-source consumers; no product/provider/pin/validator changes.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:root+'/HISTORY_PLAN.json',rows:rows.length,sourcePaths:source.sourcePaths,reviewBindingUnchanged:true}));
