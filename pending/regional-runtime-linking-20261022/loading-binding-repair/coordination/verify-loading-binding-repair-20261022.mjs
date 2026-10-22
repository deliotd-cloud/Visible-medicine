import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor';
const sourcePath=root+'/BUILT_SOURCE.json',source=json(sourcePath),website=source.website;
assert.equal(sha(read(sourcePath)),'71e82a29361978611b111b1bc0d19556e61a182d73295e895edeef2602b9d816');
assert.equal(source.allBuildStepsPassed,true);assert.equal(source.actualBinderIdempotence,true);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Source after real build: '+row.path);
const relative='tests/review-loading-bind-completeness.test.mjs';
const authored='F:/VisibleMedicine/staging/20261022-review-loading-completeness/CODE/'+relative;
assert(!source.sourceRows.some(row=>row.path===relative));
fs.copyFileSync(authored,website+'/'+relative,fs.constants.COPYFILE_EXCL);
const rows=[...source.sourceRows,{path:relative,bytes:read(authored).length,sha256:sha(read(authored))}].sort((a,b)=>a.path.localeCompare(b.path));
const ready={...source,at:new Date().toISOString(),sourceRows:rows,sourcePaths:rows.length,builtSource:sourcePath,builtSourceSha256:sha(read(sourcePath)),
 testOnlyAddition:relative,nativeRegressionAccepted:false};
fs.writeFileSync(root+'/TEST_READY_SOURCE.json',JSON.stringify(ready,null,2)+'\n',{flag:'wx'});
const evidence=root+'/native-loading-binding';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const tests=['tests/head-practice-binding.test.mjs',relative,'tests/tongue-palate-delivery.test.ts'];
const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests];
const inputs={at:new Date().toISOString(),sourceReceipt:root+'/TEST_READY_SOURCE.json',sourceReceiptSha256:sha(read(root+'/TEST_READY_SOURCE.json')),args,
 tests:tests.map(path=>({path,sha256:sha(read(website+'/'+path))})),scope:'Original binder/history/mutation checks, new native-route completeness and exact tongue-palate source delivery. Not whole-suite acceptance.'};
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const out=fs.createWriteStream(evidence+'/child.tap',{flags:'wx'}),err=fs.createWriteStream(evidence+'/child.stderr',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:website,env:nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2'}),windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(out);child.stderr.pipe(err);
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.bindingRepair,{phase:'native-loading-binding-running',pid:child.pid,heavyJobRunning:true,nativeEvidence:evidence});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');console.log(JSON.stringify({phase:'native-running',pid:child.pid,tests}));
const outcome=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
const tap=read(evidence+'/child.tap').toString(),counts={};
for(const name of ['tests','pass','fail','cancelled','skipped','todo'])counts[name]=Number(tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'))?.[1]??NaN);
const sourceDrift=rows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
const terminal={at:new Date().toISOString(),terminal:true,...outcome,counts,sourceDrift,inputsSha256:sha(read(evidence+'/INPUTS.json')),
 sourceReceipt:inputs.sourceReceipt,sourceReceiptSha256:inputs.sourceReceiptSha256,tapSha256:sha(read(evidence+'/child.tap')),stderrSha256:sha(read(evidence+'/child.stderr')),
 original29NativeFailuresRetained:true,wholeSuitePassing:false,clinicalApproval:false,ownerPreviewChanged:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current.bindingRepair,{phase:'native-loading-binding-terminal',pid:null,heavyJobRunning:false,
 nativeTerminal:evidence+'/TERMINAL.json',nativeCounts:counts,nativeAcceptance:outcome.code===0&&counts.fail===0&&counts.skipped===0&&sourceDrift.length===0});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');console.log(JSON.stringify(terminal));
process.exitCode=outcome.code===0&&counts.fail===0&&counts.cancelled===0&&counts.skipped===0&&sourceDrift.length===0?0:1;
