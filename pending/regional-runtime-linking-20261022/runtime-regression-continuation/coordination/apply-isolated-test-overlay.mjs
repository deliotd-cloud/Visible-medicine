// Reusable main-owned test-only overlay. It cannot write product/generated sources.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const planPath=process.argv[2];assert(planPath&&path.isAbsolute(planPath));
const plan=json(planPath),source=json(plan.sourceReceipt),website=source.website;
assert.equal(sha(read(plan.sourceReceipt)),plan.sourceReceiptSha256);
assert(website.startsWith('F:/VisibleMedicine/staging/')&&website.endsWith('/website'));
assert(!fs.lstatSync(website).isSymbolicLink());
assert(plan.rows.length>0&&plan.rows.length<=40);
assert.equal(new Set(plan.rows.map(row=>row.path)).size,plan.rows.length);
assert(!fs.existsSync(plan.receipt));
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Exact source preflight: '+row.path);
for(const row of plan.rows){
 assert(/^tests\/[a-zA-Z0-9-]+\.(?:test\.)?(?:mjs|ts)$/.test(row.path),'Only explicit test source files');
 assert(row.code.startsWith('F:/VisibleMedicine/staging/')&&row.code.includes('/CODE/'));
 assert.equal(sha(read(row.code)),row.sha256,'Reviewed CODE: '+row.path);
 const prior=source.sourceRows.find(r=>r.path===row.path);
 if(prior){assert.equal(prior.sha256,row.beforeSha256);assert.equal(sha(read(row.before)),row.beforeSha256);assert.deepEqual(read(row.before),read(website+'/'+row.path));}
 else{assert.equal(row.beforeSha256,null);assert(!fs.existsSync(website+'/'+row.path));}
}
for(const row of plan.rows)fs.copyFileSync(row.code,website+'/'+row.path,row.beforeSha256?0:fs.constants.COPYFILE_EXCL);
const names=new Set([...source.sourceRows.map(row=>row.path),...plan.rows.map(row=>row.path)]);
const sourceRows=[...names].sort().map(path=>({path,bytes:read(website+'/'+path).length,sha256:sha(read(website+'/'+path))}));
const product=rows=>rows.filter(r=>!r.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(product(sourceRows),product(source.sourceRows),'No product bytes changed');
const receipt={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,review:source.review,
 previousSource:plan.sourceReceipt,previousSourceSha256:plan.sourceReceiptSha256,overlayPlan:planPath,overlayPlanSha256:sha(read(planPath)),
 changedTestPaths:plan.rows.map(row=>row.path),nonTestProductBytesChanged:0,currentValidatorOrPinChanged:false,
 nativeAccepted:false,typesForNewTestOverlayPassed:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(plan.receipt,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current,{currentCandidate:website,sourceReceipt:plan.receipt,sourceReceiptSha256:sha(read(plan.receipt)),sourcePaths:sourceRows.length});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:plan.receipt,sha256:sha(read(plan.receipt)),sourcePaths:sourceRows.length,changedTestPaths:receipt.changedTestPaths,nonTestProductBytesChanged:0}));
