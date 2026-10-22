import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',prep=json(root+'/PREPARED.json'),previous=json(prep.previousSource),mode=process.argv[2];
assert(['tongue-initial','combined','combined-v2'].includes(mode));const combined=mode!=='tongue-initial',composition=combined?json(root+'/COMPOSED.json'):null;
const paths=[...new Set([...previous.sourceRows.map(r=>r.path),...prep.addedPaths,...(composition?.addedPaths??[])])].sort();
const sourceRows=paths.map(p=>({path:p,bytes:read(prep.website+'/'+p).length,sha256:sha(read(prep.website+'/'+p))})),old=new Map(previous.sourceRows.map(r=>[r.path,r.sha256]));
const changed=sourceRows.filter(r=>old.has(r.path)&&old.get(r.path)!==r.sha256).map(r=>r.path);
assert.deepEqual(changed.sort(),['tests/tongue-palate-delivery.test.ts',...(combined?composition.changedPaths:[])].sort());
const source={at:new Date().toISOString(),website:prep.website,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,review:prep.review,boundInputs:1729,importedSources:1562,
 previousSource:prep.previousSource,previousSourceSha256:prep.previousSourceSha256,sourceRows,sourcePaths:sourceRows.length,changedPaths:changed,
 addedPaths:paths.filter(p=>!old.has(p)),allProductAndBindingsByteIdentical:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
const receipt=root+(mode==='combined-v2'?'/SOURCE_V2.json':combined?'/SOURCE.json':'/SOURCE_TONGUE.json'),evidence=root+'/'+mode;assert(!fs.existsSync(receipt));assert(!fs.existsSync(evidence));
fs.writeFileSync(receipt,JSON.stringify(source,null,2)+'\n',{flag:'wx'});fs.mkdirSync(evidence);
const tests=combined?composition.tests:['tests/tongue-palate-delivery.test.ts','tests/tongue-palate-neck-history.test.mjs'];
assert(tests.every(p=>p.startsWith('tests/')&&fs.existsSync(source.website+'/'+p)));
const commands=[['native',['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests]],...(combined?[['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']]]:[])];
const results=[],env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
for(const[label,args]of commands){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:source.website,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 console.log(JSON.stringify({mode,label,pid:child.pid}));fs.writeFileSync(evidence+'/'+label+'.STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,args,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt))},null,2)+'\n',{flag:'wx'});
 const outcome=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const text=read(out.path).toString(),counts=Object.fromEntries([...text.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
 const result={label,args,...outcome,counts,failed:[...text.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]),stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))};results.push(result);
 fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({mode,label,...outcome,counts,failed:result.failed}));if(outcome.code!==0)break;
}
const sourceDrift=sourceRows.filter(r=>sha(read(source.website+'/'+r.path))!==r.sha256).map(r=>r.path),previousSourceDrift=previous.sourceRows.filter(r=>sha(read(previous.website+'/'+r.path))!==r.sha256).map(r=>r.path);
const terminal={at:new Date().toISOString(),terminal:true,code:results.length===commands.length&&results.every(r=>r.code===0)&&!sourceDrift.length&&!previousSourceDrift.length?0:1,
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),commands:results,sourceDrift,previousSourceDrift,productChanged:false,wholeSuitePassing:false,newBuildOrBrowserAcceptance:false,
 ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',code:terminal.code,sourceDrift}));process.exitCode=terminal.code;
