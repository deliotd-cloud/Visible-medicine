// Exact Studio test-adapter integration. No current Review validator/pin or product edit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-studio-details-focus-successor',priorPath=root+'/SOURCE.json',prior=json(priorPath),website=prior.website;
assert.equal(sha(read(priorPath)),'ac4654d3c76ba13b449be34be5502f372ebf13f286c60e100d5933e221e41965');
for(const name of ['native-focus','types-focus']){const terminal=json(root+'/'+name+'/TERMINAL.json');assert.equal(terminal.code,0);assert.deepEqual(terminal.sourceDrift,[]);assert.equal(terminal.sourceReceiptSha256,sha(read(priorPath)));}
for(const row of prior.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const stage='F:/VisibleMedicine/staging/20261022-studio-focus-harness-admission',main='F:/VisibleMedicine/staging/20261022-studio-focus-main-admission',role='F:/VisibleMedicine/staging/20261022-studio-focus-content-role';
const handoff=json(stage+'/HANDOFF.json'),rows=[];
assert.equal(handoff.files.length,10);assert.equal(handoff.baselineSourceReceiptSha256,'52a09799b2f12607f66bcf750d750531ce7119949717a525ff673d105e836f85');
for(const [name,beforeSha256,afterSha256] of handoff.files){
 assert(/^studio-course-[a-z-]+\.test\.mjs$/.test(name));assert.equal(sha(read(stage+'/CODE/tests/'+name)),afterSha256);assert.equal(sha(read(stage+'/RAW/preimages/'+name)),beforeSha256);
 rows.push({path:'tests/'+name,from:name==='studio-course-details-content.test.mjs'?main+'/CODE/tests/'+name:stage+'/CODE/tests/'+name,beforeSha256});
}
assert.equal(sha(read(main+'/CODE/tests/studio-course-details-content.test.mjs')),'ed1502dad49b818f9f698dacbf1d7a5ba2c6990119aef9d8a9333fcc510b401b');
for(const name of ['studio-course-details-content-role-proof.test.mjs','studio-course-details-content-history.test.mjs'])rows.push({path:'tests/'+name,from:main+'/CODE/tests/'+name,beforeSha256:null});
rows.push({path:'tests/fixtures/studio-course-editor-prefocus.tsx.raw',from:role+'/CODE/tests/fixtures/studio-course-editor-prefocus.tsx',beforeSha256:null},
 {path:'tests/fixtures/studio-course-details-content-prefocus.test.mjs.raw',from:role+'/RAW/studio-course-details-content.original.test.mjs',beforeSha256:null});
assert.equal(sha(read(rows.at(-2).from)),'e6d0c653f7c18ea6e99afc98a2c8674de056757e7afea0a94a3edbb3fc3140e8');assert.equal(sha(read(rows.at(-1).from)),'d84c858a85405a80282cac15b02d4ee790cab21bee38fe456920bdbe8405ab32');
assert.equal(new Set(rows.map(row=>row.path)).size,14);
for(const row of rows){const before=prior.sourceRows.find(item=>item.path===row.path);if(row.beforeSha256)assert.equal(before.sha256,row.beforeSha256);else assert(!before&&!fs.existsSync(website+'/'+row.path));row.sha256=sha(read(row.from));}
assert(!fs.existsSync(root+'/TEST_READY_SOURCE.json'));assert(!fs.existsSync(main+'/RAW'));fs.mkdirSync(main+'/RAW');
for(const row of rows){const target=website+'/'+row.path;fs.mkdirSync(path.dirname(target),{recursive:true});if(row.beforeSha256)fs.copyFileSync(target,main+'/RAW/'+path.basename(row.path),fs.constants.COPYFILE_EXCL);fs.copyFileSync(row.from,target,row.beforeSha256?0:fs.constants.COPYFILE_EXCL);assert.equal(sha(read(target)),row.sha256);}
const sourceRows=[...new Set([...prior.sourceRows.map(row=>row.path),...rows.map(row=>row.path)])].sort().map(path=>({path,bytes:read(website+'/'+path).length,sha256:sha(read(website+'/'+path))}));
const product=list=>list.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));assert.deepEqual(product(sourceRows),product(prior.sourceRows));
const result={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,review:prior.review,previousSource:priorPath,previousSourceSha256:sha(read(priorPath)),changedTestPaths:rows.map(row=>row.path),nonTestProductBytesChanged:0,
 authenticHistoricalComponentRaw:true,allFiveHistoricalBehaviorTestsRetained:true,currentRoleRequiresTitleFocus:true,nativeAccepted:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/TEST_READY_SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const tests=['studio-course-switch-details','studio-course-search','studio-course-recovery-notice','studio-course-popstate-focus','studio-course-outline-link-names','studio-course-options','studio-course-history','studio-course-history-controller','studio-course-editor-keyboard','studio-course-draft-discard','studio-course-details','studio-course-details-form','studio-course-details-content','studio-course-details-focus','studio-course-details-content-role-proof','studio-course-details-content-history'].map(name=>'tests/'+name+'.test.mjs');
fs.writeFileSync(root+'/INTEGRATION_PLAN.json',JSON.stringify({sourceReceipt:root+'/TEST_READY_SOURCE.json',sourceReceiptSha256:sha(read(root+'/TEST_READY_SOURCE.json')),tests,evidence:root+'/native-studio-integration',scope:'All13 existing Studio course roots, six new focus behaviors, complete original test/source-role proof and explicit five-behavior historical execution; no broad/full-suite certification.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/TEST_READY_SOURCE.json',sha256:sha(read(root+'/TEST_READY_SOURCE.json')),sourcePaths:sourceRows.length,tests:tests.length,productUnchanged:true}));
