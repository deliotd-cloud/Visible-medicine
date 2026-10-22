// Freeze the narrow test-only decoding repair, then run the actual full type/build gates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate';
const source=json(root+'/SOURCE_V2.json'),site=source.website,evidence=root+'/verification-v3';
assert(!fs.existsSync(evidence));assert(!fs.existsSync(root+'/SOURCE_V3.json'));
const previous=json(root+'/verification-v2/TERMINAL.json');
assert.equal(previous.code,1);assert.deepEqual(previous.sourceDrift,[]);
assert.equal(previous.commands.at(-1).label,'types');assert.equal(previous.commands.at(-1).code,2);
assert(read(root+'/verification-v2/types.stdout.log').toString().includes('clinical-review-median-cubital-xray.test.ts(128,48): error TS2554'));
const changes=new Map([
 ['tests/clinical-review-median-cubital-xray.test.ts','median.before-typed-decoding.ts'],
 ['tests/teaching-consumer-source-inverse.mjs','teaching-helper.before-typed-decoding.mjs'],
]);
for(const row of source.sourceRows)assert.equal(sha(changes.has(row.path)?read(root+'/verification-v2/'+changes.get(row.path)):read(site+'/'+row.path)),row.sha256,row.path);
const rows=source.sourceRows.map(row=>changes.has(row.path)?{path:row.path,bytes:read(site+'/'+row.path).length,sha256:sha(read(site+'/'+row.path))}:row);
const delta=rows.filter((row,i)=>row.sha256!==source.sourceRows[i].sha256).map(row=>({path:row.path,before:source.sourceRows.find(r=>r.path===row.path).sha256,after:row.sha256}));
assert.equal(delta.length,2);fs.mkdirSync(evidence);
fs.writeFileSync(root+'/SOURCE_V3.json',JSON.stringify({...source,at:new Date().toISOString(),sourceRows:rows,previousVerificationSource:root+'/SOURCE_V2.json',previousVerificationSourceSha256:sha(read(root+'/SOURCE_V2.json')),testOnlyTypedDecoding:delta},null,2)+'\n',{flag:'wx'});
const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree}),commands=[];let failure=null;
try{for(const[label,args,cwd]of [
 ['decoding-source-proof',['prove-renal-type-decoding-20261022.mjs'],process.cwd()],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false'],site],
 ['website',['node_modules/vinext/dist/cli.js','build'],site],
]){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.renalWebsiteRun,{at:new Date().toISOString(),sourceReceipt:root+'/SOURCE_V3.json',sourceReceiptSha256:sha(read(root+'/SOURCE_V3.json')),label,pid:child.pid,terminal:false});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 commands.push({label,args,cwd,...outcome,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(outcome.code,0,label);
}}catch(error){failure=String(error);}
const drift=rows.filter(r=>sha(read(site+'/'+r.path))!==r.sha256).map(r=>r.path);
if(drift.length)failure??='Source drift';
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceReceipt:root+'/SOURCE_V3.json',sourceReceiptSha256:sha(read(root+'/SOURCE_V3.json')),sourcePaths:rows.length,sourceDrift:drift,review:source.review,
 exactTestOnlyDelta:delta,previousTypeFailurePreserved:{receipt:root+'/verification-v2/TERMINAL.json',sha256:sha(read(root+'/verification-v2/TERMINAL.json'))},
 nativeEvidenceReuse:{original:root+'/verification/TERMINAL.json',correctedProof:root+'/verification-v2/TERMINAL.json',originalPassed:191,originalFailed:1,correctedProofPassed:1,noNewCombinedRun:true,selectedRootAndProductBytesUnchanged:true},
 wholeSuitePassing:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.renalWebsiteRun,{pid:null,terminal:true,code:result.code,result:evidence+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),code:result.code,failure,sourcePaths:rows.length,sourceDrift:drift}));if(failure)process.exitCode=1;
