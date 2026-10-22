// Build and export the committed head access protocol through the established regional pipeline.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',receipt=root+'/SOURCE.json',source=json(receipt),atlas=source.atlas,out=root+'/contained-export';
assert.equal(sha(read(receipt)),'dd4c0fcaab9e53178ffba2d50e081420e0f01519a87ea71f69d2cb7c7ee1677a');assert(!fs.existsSync(out));fs.mkdirSync(out);
const verify=()=>{assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),source.head);assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.tree);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');for(const row of source.sourceRows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,row.path);};verify();
const target=out+'/export/public/atlas-runtime/head-neck',commands=[];let failure=null;
try{for(const[label,args]of [['build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],['export',['scripts/export-head-neck-module.mjs',target]]]){
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env:nativeAtlasEnvironment({atlas,revision:source.head,tree:source.tree}),windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.headModelAccessRun={at:new Date().toISOString(),stage:root,label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));commands.push({label,args,...outcome,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});assert.equal(outcome.code,0,label);
 }
 const manifest=json(target+'/manifest.json'),prior=json(root+'/website/public/atlas-runtime/head-neck/manifest.json');assert.equal(manifest.sourceCommit,source.head);assert.equal(prior.sourceCommit,source.base);
 for(const key of ['regionalScopes','modelBundles','regionalIds','nestedTargets'])assert.deepEqual(manifest[key],prior[key],key);
 for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false,key);
 for(const row of manifest.files)assert.equal(sha(read(target+'/'+row.path)),row.sha256,row.path);
 assert.deepEqual(manifest.files.filter(r=>r.path.endsWith('.glb')),prior.files.filter(r=>r.path.endsWith('.glb')));
 const inputs=json(target+'/source-inputs.json');for(const row of inputs)assert.equal(sha(runGit(['-C',atlas,'show',source.head+':'+row.path])),row.sha256,row.path+' actual committed source bytes');
 verify();
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),atlas,source:source.head,tree:source.tree,target,
 manifestSha256:fs.existsSync(target+'/manifest.json')?sha(read(target+'/manifest.json')):null,websiteImportAndReviewRebindPending:true,modelsAndCoverageUnchanged:!failure,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/RUNTIME_EXPORT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headModelAccessRun,{pid:null,terminal:true,code:result.code,result:root+'/RUNTIME_EXPORT.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/RUNTIME_EXPORT.json',sha256:sha(read(root+'/RUNTIME_EXPORT.json')),code:result.code,failure,source:source.head,ownerPreviewChanged:false}));if(failure)process.exitCode=1;
