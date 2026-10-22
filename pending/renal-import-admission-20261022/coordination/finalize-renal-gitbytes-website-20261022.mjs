// Finish the one proof-only correction; never relabel the original191/192run as green.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate',source=json(root+'/SOURCE.json'),site=source.website;
const evidence=root+'/verification-v2';assert(!fs.existsSync(evidence));assert(!fs.existsSync(root+'/SOURCE_V2.json'));
const serialPath='F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/native-integration/TERMINAL.json';
const serial=json(serialPath);assert.equal(serial.terminal,true);assert.deepEqual(serial.sourceDrift,[]);
const first=json(root+'/verification/TERMINAL.json'),native=first.commands.find(c=>c.label==='current-native');
assert.equal(first.code,1);assert.deepEqual(native.counts,{tests:192,pass:191,fail:1,cancelled:0,skipped:0,todo:0});assert.deepEqual(first.sourceDrift,[]);assert.deepEqual(first.priorSourceDrift,[]);
const tap=read(root+'/verification/current-native.stdout.log').toString();assert.equal([...tap.matchAll(/^not ok /gm)].length,1);assert(tap.includes('7 !== 2'));assert(tap.includes('renal delivery preserves every preceding'));
const p='tests/atlas-renal-delivery-transition.test.mjs',old=read(root+'/verification/renal-transition-test.before-unique-target.mjs'),current=read(site+'/'+p);
assert.equal(sha(old),'4fc9847b122a19e848babf70ee1a9ea7d34e34882fd781b7c79f4abf3e8f1248');
const from="['assert(artifacts>100)','assert(artifacts>0)']",to="['assert.equal(sourceFiles,1561);assert.equal(inputs,1728);assert(artifacts>100);','assert.equal(sourceFiles,1561);assert.equal(inputs,1728);assert(artifacts>0);']";
assert.equal(old.toString().split(from).length,2);assert.deepEqual(Buffer.from(old.toString().replace(from,to)),current,'Only the nonunique proof mutation target changes');
assert.deepEqual(current,read('renal-delivery-transition-20261022.test.mjs'));
for(const r of source.sourceRows)assert.equal(sha(r.path===p?old:read(site+'/'+r.path)),r.sha256,r.path);
fs.mkdirSync(evidence);
const rows=source.sourceRows.map(r=>r.path===p?{path:p,bytes:current.length,sha256:sha(current)}:r);
const next={...source,at:new Date().toISOString(),sourceRows:rows,previousVerificationSource:root+'/SOURCE.json',previousVerificationSourceSha256:sha(read(root+'/SOURCE.json')),
 testOnlyCorrection:{path:p,beforeSha256:sha(old),afterSha256:sha(current),reason:'Mutation target must use the unique complete source/count/assertion statement; all preceding delivery assertion bytes remain unchanged.'}};
fs.writeFileSync(root+'/SOURCE_V2.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree}),commands=[];let failure=null;
try{for(const[label,args]of [
 ['corrected-transition',['--test','--experimental-strip-types','--test-reporter=tap',p]],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['website',['node_modules/vinext/dist/cli.js','build']],
]){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.renalWebsiteRun,{at:new Date().toISOString(),sourceReceipt:root+'/SOURCE_V2.json',sourceReceiptSha256:sha(read(root+'/SOURCE_V2.json')),label,pid:child.pid,terminal:false});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const counts=Object.fromEntries([...read(out.path).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
 commands.push({label,args,...outcome,counts,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(outcome.code,0,label);
 if(label==='corrected-transition')assert.deepEqual(counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
}}catch(error){failure=String(error);}
const drift=rows.filter(r=>sha(read(site+'/'+r.path))!==r.sha256).map(r=>r.path),prior=json(source.previousSource);
const priorDrift=prior.sourceRows.filter(r=>sha(read(prior.website+'/'+r.path))!==r.sha256).map(r=>r.path);if(drift.length||priorDrift.length)failure??='Source drift';
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceReceipt:root+'/SOURCE_V2.json',sourceReceiptSha256:sha(read(root+'/SOURCE_V2.json')),sourcePaths:rows.length,
 sourceDrift:drift,priorSourceDrift:priorDrift,review:source.review,
 preservedPriorCases:{receipt:root+'/verification/TERMINAL.json',sha256:sha(read(root+'/verification/TERMINAL.json')),tests:192,pass:191,fail:1,onlyChangedInput:p,
  productionAndAllOtherSelectedInputsUnchanged:true,notANewCombined192PassRun:true},
 stockImportChecksUnchanged:{receipt:root+'/SOURCE_IMPORT.json',sha256:sha(read(root+'/SOURCE_IMPORT.json')),commands:10,allPassed:json(root+'/SOURCE_IMPORT.json').commands.every(c=>c.code===0)},
 serialPredecessor:{receipt:serialPath,sha256:sha(read(serialPath)),code:serial.code},allNamedChecksPassed:!failure,wholeSuitePassing:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.renalWebsiteRun,{pid:null,terminal:true,code:result.code,result:evidence+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),code:result.code,failure,sourcePaths:rows.length,sourceDrift:drift}));if(failure)process.exitCode=1;
