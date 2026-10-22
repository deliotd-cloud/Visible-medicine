// Serial stock quality gates for an exact unbound UI snapshot. Never installs it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment,nativeAtlasIdentityForSource} from './native-atlas-environment-20261022.mjs';
const sourcePath=process.argv[2];assert(path.isAbsolute(sourcePath));const source=json(sourcePath),website=source.website;
assert(website.startsWith('F:/VisibleMedicine/staging/')&&website.endsWith('/website'));
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const binding=json(website+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,source.review);
for(const changed of source.changedProductPaths??[])
 assert(!binding.inputs.some(row=>row.path===changed),'Bound changes require an actual producer/rebind workflow: '+changed);
const evidence=path.dirname(sourcePath)+'/quality-build';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const pin=json(website+'/tests/fixtures/current-atlas-delivery.json');
const environment=nativeAtlasEnvironment(nativeAtlasIdentityForSource(source,pin)),results=[];
const commands=[['review',['scripts/verify-clinical-review.mjs']],['models',['scripts/atlas-model-inventory.mjs','--check']],['delivery',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']],['lectures',['scripts/lecture-body-catalog.mjs','--check']],['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['website',['node_modules/vinext/dist/cli.js','build']]];
let failure=null;
try{for(const [label,args] of commands){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.studioFocusBuild={at:new Date().toISOString(),evidence,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),phase:label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');console.log(JSON.stringify({phase:label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,signal:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 const result={at:new Date().toISOString(),label,args,...outcome,stdoutSha256:sha(read(evidence+'/'+label+'.stdout.log')),stderrSha256:sha(read(evidence+'/'+label+'.stderr.log'))};results.push(result);fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));assert.equal(result.code,0,'Retain actual quality failure: '+label);
}}catch(error){failure=String(error);}
const sourceDrift=source.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
if(sourceDrift.length)failure??='Unexpected source drift';
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),website,review:source.review,sourcePaths:source.sourcePaths,sourceDrift,results,allStockGatesAndTypesAndWebsiteBuildPassed:!failure,reviewBindingUnchanged:sha(read(website+'/atlas-review/integration-inputs.json'))===source.sourceRows.find(row=>row.path==='atlas-review/integration-inputs.json').sha256,ownerPreviewChanged:false,canonicalInstalled:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.studioFocusBuild,{phase:failure?'failed-preserved':'verified-in-isolation',pid:null,terminal:true,result:evidence+'/TERMINAL.json',code:result.code});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),code:result.code,sourceDrift,ownerPreviewChanged:false}));if(failure)process.exitCode=1;
