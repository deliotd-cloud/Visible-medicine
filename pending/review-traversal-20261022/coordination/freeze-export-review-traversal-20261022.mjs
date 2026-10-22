// Source-bound review safeguard, committed/exported without changing model anatomy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-traversal-candidate',prep=json(root+'/PREPARATION.json'),atlas=prep.atlas,gate=json(root+'/source-verification/TERMINAL.json');
assert.equal(gate.code,0);assert.deepEqual(gate.sourceDrift,[]);assert(gate.commands.every(c=>c.code===0));assert.equal(gate.commands[0].counts.pass,5);
const files=['app/review/review-dashboard.tsx','lib/review-history-navigation.ts','scripts/test-review-history-navigation.mjs'].sort(),git=args=>runGit(['-C',atlas,...args]).toString().trim();
assert.equal(git(['rev-parse','HEAD']),prep.baseAtlas);assert.deepEqual(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trimEnd().split('\n').map(l=>l.slice(3)).sort(),files);
const sourceRows=files.map(path=>({path,sha256:sha(read(atlas+'/'+path))}));git(['add','--',...files]);assert.deepEqual(git(['diff','--cached','--name-only']).split('\n').sort(),files);git(['commit','-m','Protect unsaved shoulder review drafts during supported history traversal']);
const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']);assert.equal(git(['status','--porcelain']),'');assert.equal(git(['rev-parse','HEAD^']),prep.baseAtlas);
const source={at:new Date().toISOString(),atlas,base:prep.baseAtlas,head,tree,sourceRows,hostChanges:[],sourceChecksReceipt:root+'/source-verification/TERMINAL.json',sourceChecksSha256:sha(read(root+'/source-verification/TERMINAL.json')),originalDashboardSha256:sha(read(root+'/before/app/review/review-dashboard.tsx')),fullOriginalDashboardPreservedByInverse:true,
 typesPassed:true,atlasProductionBuildPassed:true,modelsChanged:false,medicalContentChanged:false,permissionsChanged:false,privateDataChanged:false,websiteImportPending:true,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const out=root+'/contained-export',target=out+'/export/public/atlas-runtime/head-neck';fs.mkdirSync(out);const commands=[];let failure=null;
try{for(const[label,args]of [['build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],['export',['scripts/export-head-neck-module.mjs',target]]]){
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'}),child=spawn(process.execPath,args,{cwd:atlas,env:nativeAtlasEnvironment({atlas,revision:head,tree}),windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));commands.push({label,args,...outcome,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});assert.equal(outcome.code,0,label);
}
const manifest=json(target+'/manifest.json'),prior=json(json(prep.sourceReceipt).website+'/public/atlas-runtime/head-neck/manifest.json');assert.equal(manifest.sourceCommit,head);
for(const key of ['regionalScopes','modelBundles','regionalIds','nestedTargets'])assert.deepEqual(manifest[key],prior[key],key);
for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false,key);
assert.deepEqual(manifest.files.filter(r=>r.path.endsWith('.glb')),prior.files.filter(r=>r.path.endsWith('.glb')));
for(const row of manifest.files)assert.equal(sha(read(target+'/'+row.path)),row.sha256,row.path);for(const row of json(target+'/source-inputs.json'))assert.equal(sha(runGit(['-C',atlas,'show',head+':'+row.path])),row.sha256,row.path);
assert.equal(git(['status','--porcelain']),'');for(const row of sourceRows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256);
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),code:failure?1:0,failure,commands,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),atlas,source:head,tree,target,manifestSha256:fs.existsSync(target+'/manifest.json')?sha(read(target+'/manifest.json')):null,geometryAndCoverageUnchanged:!failure,websiteImportPending:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/RUNTIME_EXPORT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/RUNTIME_EXPORT.json',sha256:sha(read(root+'/RUNTIME_EXPORT.json')),head,tree,code:result.code,failure}));if(failure)process.exitCode=1;
