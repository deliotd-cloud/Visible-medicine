// Integrate reviewed test-only role composition; all product, pin and validator bytes stay exact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261022-head-tools-wider-role-proposal',follow='F:/VisibleMedicine/staging/20261022-head-tools-wider-consumers',root='F:/VisibleMedicine/staging/20261022-head-tools-wider-combined';
const sourcePath='F:/VisibleMedicine/staging/20261022-studio-focus-runtime-admission/APPLIED_SOURCE.json',source=json(sourcePath),website=source.website;
assert.equal(sha(read(sourcePath)),'1fc7563d97f2d14682050059f177ee84d768d9eb072a062b309018acdf35da6a');assert(!fs.existsSync(root));
const quality=json('F:/VisibleMedicine/staging/20261022-studio-focus-runtime-admission/quality-build/TERMINAL.json');assert.equal(quality.code,0);assert.deepEqual(quality.sourceDrift,[]);assert.equal(quality.sourceReceiptSha256,sha(read(sourcePath)));
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const originalFailure=json('F:/VisibleMedicine/staging/20261022-head-tools-consumer-admission/native-wider/TERMINAL.json');assert.equal(originalFailure.counts.fail,8);assert.deepEqual(originalFailure.sourceDrift,[]);
const core=json(base+'/HANDOFF.json'),consumers=json(follow+'/HANDOFF.json'),selected=new Map();
for(const [stage,hashes] of [[base,core.codeSha256],[follow,consumers.codeSha256]])for(const [name,digest] of Object.entries(hashes)){
 assert(/^tests\/(?:[a-z0-9-]+(?:\.test)?\.mjs|fixtures\/(?:current-delivery-before-head-tools-20261022\.json|head-tools-prior-integration-inputs-20261022\.json\.raw|head-tools-wider-consumer\/[a-z0-9-]+\.test\.mjs\.raw))$/.test(name));
 assert(!['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs'].includes(name));
 const from=stage+'/CODE/'+name,bytes=read(from);assert.equal(sha(bytes),digest,name);assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);
 const old=source.sourceRows.find(row=>row.path===name);if(old?.sha256===digest){assert.equal(sha(read(website+'/'+name)),digest);continue;}
 assert(!selected.has(name));
 if(old){const before=stage+'/RAW/'+name;assert.equal(sha(read(before)),old.sha256);assert.deepEqual(read(before),read(website+'/'+name));}
 else assert(!fs.existsSync(website+'/'+name));
 selected.set(name,{path:name,from,sha256:digest,beforeSha256:old?.sha256??null});
}
assert.equal(selected.size,19);assert.equal(sha(read(base+'/CODE/tests/fixtures/head-tools-prior-integration-inputs-20261022.json.raw')),'58b0fd76cdfd582e1485403d15723ea0171c4a362b4ee1b65d1a2e5e4140380e');
fs.mkdirSync(root);fs.mkdirSync(root+'/RAW');
for(const row of selected.values()){const target=website+'/'+row.path;fs.mkdirSync(path.dirname(target),{recursive:true});if(row.beforeSha256){const saved=root+'/RAW/'+row.path;fs.mkdirSync(path.dirname(saved),{recursive:true});fs.copyFileSync(target,saved,fs.constants.COPYFILE_EXCL);}fs.copyFileSync(row.from,target,row.beforeSha256?0:fs.constants.COPYFILE_EXCL);assert.equal(sha(read(target)),row.sha256);}
const sourceRows=[...new Set([...source.sourceRows.map(row=>row.path),...selected.keys()])].sort().map(path=>({path,bytes:read(website+'/'+path).length,sha256:sha(read(website+'/'+path))}));
const product=rows=>rows.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));assert.deepEqual(product(sourceRows),product(source.sourceRows));
for(const name of ['tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json'])assert.equal(sha(read(website+'/'+name)),source.sourceRows.find(row=>row.path===name).sha256);
const result={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,review:source.review,previousSource:sourcePath,previousSourceSha256:sha(read(sourcePath)),changedTestPaths:[...selected.keys()],nonTestProductBytesChanged:0,currentValidatorOrPinChanged:false,
 preservedOriginalWiderCounts:originalFailure.counts,headToolbarProductBuildUnchanged:true,studioProductBuildUnchanged:true,nativeAccepted:false,ownerPreviewChanged:false,canonicalInstalled:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/APPLIED_SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const names=['current-delivery-admission-485','desktop-learning-row-history','drawable-epoch-current-admission','expanded-review-delivery-admission','head-manual-recovery-54-to-55-closed','head-native-history-current-transition','review-navigation-delivery-preservation','ui-teaching-admission-contract','head-tools-wider-role-preservation','colic-adapter-inverse','closed54-55-provider-preservation','head-history-role-preservation','head-tools-wider-consumer-source-preservation','admission485-final-role-transition-20261021','colic-fa1-historical-closure','drawable-epoch-historical-closure','head-manual-recovery-migration','drawable-epoch-adapter-inverse','current-head-index-whole-role-transition-20261021','head-review-compact-preservation','tongue-palate-a247-inverse'];
for(const kind of ['native','types'])fs.writeFileSync(root+'/'+kind.toUpperCase()+'_PLAN.json',JSON.stringify({kind,sourceReceipt:root+'/APPLIED_SOURCE.json',sourceReceiptSha256:sha(read(root+'/APPLIED_SOURCE.json')),tests:kind==='native'?names.map(name=>'tests/'+name+'.test.mjs'):[],evidence:root+'/'+(kind==='native'?'native-focused':'types-final'),scope:kind==='native'?'Eight original failed roots, exact binding/source proof and all named direct/whole-source consumers; keep669/661/8 separately, not a combined whole-suite pass.':'Full types for final combined test-only role overlay, unchanged product build.'},null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current,{currentCandidate:website,sourceReceipt:root+'/APPLIED_SOURCE.json',sourceReceiptSha256:sha(read(root+'/APPLIED_SOURCE.json')),sourcePaths:sourceRows.length});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({sourceReceipt:root+'/APPLIED_SOURCE.json',sha256:sha(read(root+'/APPLIED_SOURCE.json')),sourcePaths:sourceRows.length,changedTestPaths:selected.size,productChanged:false,nativeRoots:names.length}));
