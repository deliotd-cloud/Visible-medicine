// Test-only correction with exact unchanged-production closure and serial gates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate',source=json(root+'/SOURCE.json'),site=source.website;
const evidence=root+'/verification-v2';assert(!fs.existsSync(evidence));assert(!fs.existsSync(root+'/SOURCE_V2.json'));
const expected=process.argv[2];assert.match(expected??'',/^[a-f0-9]{64}$/);
const p='tests/atlas-neck-landmark-xray.test.mjs',proposal='F:/VisibleMedicine/staging/20261022-neck-xray-delivery-check-proposal/CODE/'+p;
assert.equal(sha(read(proposal)),expected);assert.notEqual(expected,'7bab52a8598eb7430f6c8bae3042f3da65726b23975b4934253ec1273f2656b3');
assert.equal(sha(read(site+'/'+p)),'7bab52a8598eb7430f6c8bae3042f3da65726b23975b4934253ec1273f2656b3');
for(const row of source.sourceRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
const first=json(root+'/verification/TERMINAL.json'),tap=read(root+'/verification/current-native.stdout.log').toString();
assert.equal(first.code,1);const originalNative=first.commands.find(row=>row.label==='current-native');
assert.deepEqual(originalNative.counts,{tests:178,pass:177,fail:1,cancelled:0,skipped:0,todo:0});
assert.equal([...tap.matchAll(/^not ok /gm)].length,1);assert(tap.includes('head-neck source input content/body-renderer-revision.json'));
assert.equal(first.commands.find(row=>row.label==='original-current-native').counts.pass,41);
assert.deepEqual(first.sourceDrift,[]);assert.deepEqual(first.priorSourceDrift,[]);
fs.mkdirSync(evidence);fs.copyFileSync(site+'/'+p,evidence+'/original-integration-test.mjs');fs.copyFileSync(proposal,site+'/'+p);
const rows=source.sourceRows.map(row=>row.path===p?{path:p,bytes:read(proposal).length,sha256:expected}:row);
const next={...source,at:new Date().toISOString(),sourceRows:rows,previousVerificationSource:root+'/SOURCE.json',previousVerificationSourceSha256:sha(read(root+'/SOURCE.json')),
 testOnlyCorrection:{path:p,beforeSha256:'7bab52a8598eb7430f6c8bae3042f3da65726b23975b4934253ec1273f2656b3',afterSha256:expected,reason:'Keep exact protected Review graph separate from actual learner module graph; no product source or validator changed.'}};
fs.writeFileSync(root+'/SOURCE_V2.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
const environment=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
const jobs=[['corrected-integration',['--test','--experimental-strip-types','--test-reporter=tap',p]],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['review',['scripts/verify-clinical-review.mjs']],
 ['models',['scripts/atlas-model-inventory.mjs','--check']],['policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']],
 ['catalog',['scripts/lecture-body-catalog.mjs','--check']],['coverage',['scripts/check-anatomy-coverage.mjs','--source-root',source.atlas,'--check']],
 ['website',['node_modules/vinext/dist/cli.js','build']]];
const commands=[];let failure=null;
try{for(const[label,args]of jobs){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:site,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.neckXrayWebsiteRun,{at:new Date().toISOString(),sourceReceipt:root+'/SOURCE_V2.json',sourceReceiptSha256:sha(read(root+'/SOURCE_V2.json')),label,pid:child.pid,terminal:false});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 const counts=Object.fromEntries([...read(out.path).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
 const result={label,args,...outcome,counts,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))};commands.push(result);
 fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));assert.equal(outcome.code,0,label);
 if(label==='corrected-integration')assert.deepEqual(counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
 }}catch(error){failure=String(error);}
const drift=rows.filter(row=>sha(read(site+'/'+row.path))!==row.sha256).map(row=>row.path);
const old=json(source.previousSource),priorDrift=old.sourceRows.filter(row=>sha(read(old.website+'/'+row.path))!==row.sha256).map(row=>row.path);
if(drift.length||priorDrift.length)failure??='Source drift';assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceReceipt:root+'/SOURCE_V2.json',sourceReceiptSha256:sha(read(root+'/SOURCE_V2.json')),
 sourcePaths:rows.length,sourceDrift:drift,priorSourceDrift:priorDrift,review:source.review,allNamedChecksPassed:!failure,
 preservedPriorCases:{receipt:root+'/verification/TERMINAL.json',sha256:sha(read(root+'/verification/TERMINAL.json')),tests:178,pass:177,fail:1,
 onlyChangedInput:p,allProductionAndAllOtherSelectedTestInputsUnchanged:true,notANewCombined178PassRun:true},
 wholeSuitePassing:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.neckXrayWebsiteRun,{pid:null,terminal:true,code:result.code,result:evidence+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',code:result.code,failure,sourceDrift:drift}));if(failure)process.exitCode=1;
