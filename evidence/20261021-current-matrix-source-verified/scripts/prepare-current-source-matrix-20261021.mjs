import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const batch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v8',prep=json(batch+'/PREPARATION.json');
const stage='F:/VisibleMedicine/staging/20261021-current-source-matrix',site=stage+'/native-check';
const full='F:/VisibleMedicine/staging/20261021-source190-complete-suite';
const native=prep.site+'/.local/website-test-runs/2026-10-21T05-37-11-497Z-a5ab569e-0361-46d1-91d6-64fd8586c1c0';
const terminal=json(full+'/TERMINAL.json'),receipt=json(native+'/receipt.json');
assert.equal(terminal.code,1);assert.equal(terminal.signal,null);assert.deepEqual(terminal.originalNamedInputDrift,[]);
assert.equal(sha(read(full+'/RUNNER.log')),terminal.logSha256);
assert.equal(receipt.child.exitCode,1);assert.equal(receipt.child.signal,null);
assert.deepEqual(receipt.counts,{tests:5547,pass:5408,fail:136,cancelled:0,skipped:3,todo:0});
assert.equal(receipt.testInputDrift,false);assert.equal(receipt.publicPreviewAssetDrift,false);
const frozen=json(full+'/SOURCE_INPUTS.json');assert.equal(frozen.length,5107);
for(const row of frozen)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.inputs.length,1710);assert.equal(bound.sha256,prep.review);
for(const row of bound.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const readOnlyDirectories=['app','atlas-review','components','db','docs','drizzle','lib','LICENSES','public','scripts','types','worker','node_modules'];
assert(!fs.existsSync(stage));fs.mkdirSync(stage);fs.mkdirSync(site);
for(const folder of readOnlyDirectories){assert(fs.statSync(prep.site+'/'+folder).isDirectory());fs.symlinkSync(prep.site+'/'+folder,site+'/'+folder,'junction');}
let copied=0;
for(const row of frozen){
 if(readOnlyDirectories.includes(row.path.split('/')[0]))continue;
 assert(!row.path.startsWith('.local/')&&!row.path.startsWith('.env')&&!row.path.includes('..'));
 const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(prep.site+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),row.sha256);copied++;
}
const effective=new Map(frozen.map(row=>[row.path,row.sha256]));
for(const row of prep.changes){
 assert(row.path.startsWith('tests/'));assert.equal(sha(read(row.from)),row.sha256,row.path);
 const dest=site+'/'+row.path;
 assert.equal(row.beforeSha256?sha(read(dest)):fs.existsSync(dest),row.beforeSha256??false,row.path);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(row.from,dest);assert.equal(sha(read(dest)),row.sha256);effective.set(row.path,row.sha256);
}
const effectiveInputs=[...effective].map(([path,sha256])=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(effectiveInputs.length,5146);
for(const row of effectiveInputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
for(const row of bound.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
assert.equal(prep.actualCurrentModules.length,20);for(const p of prep.actualCurrentModules)assert(fs.existsSync(site+'/'+p),p);
fs.writeFileSync(stage+'/EFFECTIVE_INPUTS.json',JSON.stringify(effectiveInputs,null,2)+'\n',{flag:'wx'});
const next={stage,site,atlas:prep.atlas,sourceSite:prep.site,source:prep.source,review:prep.review,batch,batchSha256:sha(read(batch+'/PREPARATION.json')),frozenSnapshot:full+'/SOURCE_INPUTS.json',frozenSnapshotSha256:sha(read(full+'/SOURCE_INPUTS.json')),effectiveSnapshot:stage+'/EFFECTIVE_INPUTS.json',effectiveSnapshotSha256:sha(read(stage+'/EFFECTIVE_INPUTS.json')),copiedFiles:copied,readOnlyJunctions:readOnlyDirectories,actualCurrentModules:prep.actualCurrentModules,fullSuiteTerminal:full+'/TERMINAL.json',fullSuiteTerminalSha256:sha(read(full+'/TERMINAL.json')),fullNativeReceipt:native+'/receipt.json',fullNativeReceiptSha256:sha(read(native+'/receipt.json')),scope:'Focused20actual current/historical teaching and Review test modules only, not a complete suite, production build/types/browser/clinical/spatial/public-release result. No source checkout modified. Read-only junction harness must never be recursively deleted, packaged or uploaded; no private DB/env/scans/masks copied.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,copiedFiles:copied,effectiveNamedInputs:5146,sourceCandidateInputs:5107,reviewBindings:1710,modules:20,sourceInstalled:false}));
