// Rebuild the existing shared regional/whole-body learner from the verified Atlas.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate';
const receipt='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/READY_ATLAS_SOURCE.json',source=json(receipt),atlas=source.atlas;
assert.equal(sha(read(receipt)),'37d75d615323263f62ee41763a8c686f969d2e4767c2dd1b7b592987edcae464');
assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(root+'/runtime-build');
const environment=nativeAtlasEnvironment({atlas,revision:source.head,tree:source.tree});
const target=root+'/export/public/atlas-runtime/head-neck';
const verify=()=>{for(const row of source.sourceRows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,row.path);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');};
verify();const commands=[];let failure=null;
try{for(const [label,args]of [['build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],['export',['scripts/export-head-neck-module.mjs',target]]]){
 const out=fs.createWriteStream(root+'/runtime-build/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/runtime-build/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 commands.push({label,args,...result,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(result.code,0,label);
 }
 const manifest=json(target+'/manifest.json'),before=json('F:/VisibleMedicine/staging/20261022-review-return-refresh-successor/website/public/atlas-runtime/head-neck/manifest.json');
 assert.equal(manifest.sourceCommit,source.head);assert.equal(before.sourceCommit,source.baseline);
 for(const key of ['regionalScopes','modelBundles','regionalIds','nestedTargets'])assert.deepEqual(manifest[key],before[key],key);
 for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false,key);
 for(const row of manifest.files)assert.equal(sha(read(target+'/'+row.path)),row.sha256,row.path);
 assert.deepEqual(manifest.files.filter(row=>row.path.endsWith('.glb')),before.files.filter(row=>row.path.endsWith('.glb')));
 const inputs=json(target+'/source-inputs.json');
 for(const p of ['app/body-content.ts','content/neck-landmark-xray.ts','lib/neck-landmark-xray.ts','content/regional-teaching/head-neck.json'])assert(inputs.some(row=>row.path===p),p);
 verify();
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),code:failure?1:0,failure,commands,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),source:source.head,tree:source.tree,atlas,target,
 manifestSha256:fs.existsSync(target+'/manifest.json')?sha(read(target+'/manifest.json')):null,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/RUNTIME_EXPORT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));if(failure)process.exitCode=1;
