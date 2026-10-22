// Export the verified renal guard through the established contained module pipeline.
// This creates an isolated export only, never an owner-preview installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-tour-runtime-candidate';
const receipt='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-verified/SOURCE.json';
assert.equal(sha(read(receipt)),'b594ff4d1008a6368c52f50054eb817b590e1b372db66f55625a49dc1d07e014');
const source=json(receipt),atlas=source.atlas;
const nativePath='F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-successor/native-integration/TERMINAL.json';
// This terminal is a serial-execution witness, not a passing acceptance gate.
// Its one failure is retained: the new neck test row has the wrong wrapper.
// The separately authenticated Atlas source gate is green; exporting that source
// does not claim the website's outstanding consumer regressions are resolved.
const native=json(nativePath);assert.equal(native.terminal,true);assert.equal(native.code,1);assert.equal(native.counts.fail,1);assert.equal(native.counts.pass,53);assert.deepEqual(native.sourceDrift,[]);
assert.equal(native.sourceReceiptSha256,'ff37b7b498682fed64b4a593a91bdc0584757a6dff208b844345cf5748c49f8e');
assert(read('F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-successor/native-integration/child.tap').toString().includes("Cannot read properties of undefined (reading 'id')"));
assert.equal(json(source.finalVerification.path).code,0);
assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(root+'/runtime-build');
const verify=()=>{for(const r of source.sourceRows)assert.equal(sha(read(atlas+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),source.head);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.tree);
 assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');};
const environment=nativeAtlasEnvironment({atlas,revision:source.head,tree:source.tree});
const target=root+'/export/public/atlas-runtime/head-neck',commands=[];let failure=null;
verify();
try{for(const[label,args]of [['build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],['export',['scripts/export-head-neck-module.mjs',target]]]){
 const out=fs.createWriteStream(root+'/runtime-build/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/runtime-build/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 commands.push({label,args,...outcome,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(outcome.code,0,label);
 }
 const manifest=json(target+'/manifest.json'),previous=json('F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/website/public/atlas-runtime/head-neck/manifest.json');
 assert.equal(manifest.sourceCommit,source.head);assert.equal(previous.sourceCommit,source.baseline);
 for(const key of ['regionalScopes','modelBundles','regionalIds','nestedTargets'])assert.deepEqual(manifest[key],previous[key],key);
 for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false,key);
 for(const row of manifest.files)assert.equal(sha(read(target+'/'+row.path)),row.sha256,row.path);
 assert.deepEqual(manifest.files.filter(row=>row.path.endsWith('.glb')),previous.files.filter(row=>row.path.endsWith('.glb')));
 const inputs=json(target+'/source-inputs.json');
 for(const p of ['lib/renal-tour.ts','lib/regional-tours.ts','content/renal-tour-pins.json'])assert(inputs.some(row=>row.path===p),p);
 verify();
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),code:failure?1:0,failure,commands,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),source:source.head,tree:source.tree,atlas,target,
 manifestSha256:fs.existsSync(target+'/manifest.json')?sha(read(target+'/manifest.json')):null,priorSerialNative:{receipt:nativePath,sha256:sha(read(nativePath))},
 websiteImportPending:true,outstandingConsumerFailureRetained:true,websiteNativeAcceptance:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/RUNTIME_EXPORT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));if(failure)process.exitCode=1;
