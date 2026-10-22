// Validate and export the same commit from an exact-Git-byte checkout.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-canonical-checkout',receipt=root+'/SOURCE.json';
assert.equal(sha(read(receipt)),'db474d250bf5a4f3a896d500cec2a0f2d344fc282aa1d1d2c9034e0b42f8ccbd');
const source=json(receipt),atlas=source.atlas,evidence=root+'/quality-build';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const verify=()=>{for(const r of source.sourceRows)assert.equal(sha(read(atlas+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),source.head);assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.tree);
 assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');};
verify();const env=nativeAtlasEnvironment({atlas,revision:source.head,tree:source.tree}),commands=[];
const target=root+'/export/public/atlas-runtime/head-neck';let failure=null,executableOutputEquivalence=null;
async function run(label,args){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 commands.push({label,args,...result,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(result.code,0,label);
}
try{
 for(const[label,args]of [
  ['pins',['scripts/pin-renal-tour.mjs','--check']],['source',['scripts/test-renal-tour-source.mjs']],
  ['registration',['scripts/test-renal-tour-registration.mjs']],['admission',['scripts/test-renal-tour-wholebody-admission.mjs']],
  ['source-holds',['scripts/validate-current-source-holds.mjs']],['renderer',['scripts/body-renderer-revisions.mjs','--check']],
  ['display',['scripts/generate-body-review-display-pins.mjs','--check']],['shoulder',['scripts/review-revisions.mjs','--check']],
  ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],
  ['build',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build']],
  ['contained-build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],
  ['export',['scripts/export-head-neck-module.mjs',target]],
 ])await run(label,args);
 const manifest=json(target+'/manifest.json'),oldRoot='F:/VisibleMedicine/staging/20261022-renal-tour-runtime-candidate/export/public/atlas-runtime/head-neck',previous=json(oldRoot+'/manifest.json');
 assert.equal(manifest.sourceCommit,source.head);assert.equal(previous.sourceCommit,source.head);
 for(const key of ['regionalScopes','modelBundles','regionalIds','nestedTargets'])assert.deepEqual(manifest[key],previous[key],key);
 for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false,key);
 for(const r of manifest.files)assert.equal(sha(read(target+'/'+r.path)),r.sha256,r.path);
 assert.deepEqual(manifest.files.filter(r=>r.path.endsWith('.glb')),previous.files.filter(r=>r.path.endsWith('.glb')));
 const executable=m=>m.files.filter(r=>/\.(?:js|css)$/.test(r.path)).map(r=>({path:r.path,sha256:r.sha256,bytes:r.bytes})).sort((a,b)=>a.path.localeCompare(b.path));
 const nextExecutable=executable(manifest),oldExecutable=executable(previous);
 executableOutputEquivalence={exactBytesAndNames:JSON.stringify(nextExecutable)===JSON.stringify(oldExecutable),current:nextExecutable,previous:oldExecutable,
  excludesNoticesAndSourceMetadata:true,notClinicalOrBrowserEvidence:true};
 // Re-run the actual player checks if build output is not byte-identical. Never
 // infer behavioral equivalence from a clean Git tree or LF normalization alone.
 if(!executableOutputEquivalence.exactBytesAndNames)await run('player',['scripts/test-regional-tour-player.mjs']);
 verify();
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),code:failure?1:0,failure,commands,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),source:source.head,tree:source.tree,atlas,target,
 executableOutputEquivalence,manifestSha256:fs.existsSync(target+'/manifest.json')?sha(read(target+'/manifest.json')):null,
 workingInputsExactGitBytes:true,originalCRLFCheckoutUnchanged:true,websiteImportPending:true,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/RUNTIME_EXPORT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/RUNTIME_EXPORT.json',sha256:sha(read(root+'/RUNTIME_EXPORT.json')),code:result.code,failure,commands:commands.map(c=>({label:c.label,code:c.code})),executableBytesIdentical:executableOutputEquivalence?.exactBytesAndNames,ownerPreviewChanged:false}));if(failure)process.exitCode=1;
