// Main-only serial preflight/build of the exact isolated Atlas source.
// No Website server, source change, dependency installation or public deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-atlas-runtime-preflight';
const materialized='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/MATERIALIZED.json';
assert.equal(sha(read(materialized)),'2ad32ac583cf72d59abdcefabbfe03d79ddf5378aaec825067d6dc60748bfa2f');
const source=json(materialized),atlas=source.atlas;
const website='F:/VisibleMedicine/staging/20261023-atlas-review-9e14-import/website';
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),source.head);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const observe=()=>JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"$vmOs=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');freePhysicalKiB=$vmOs.FreePhysicalMemory;freeCommitKiB=$vmOs.FreeVirtualMemory;fFreeBytes=(Get-PSDrive F).Free}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
if(process.argv.includes('--verify-exports')){
 assert.equal(json(root+'/module-export/TERMINAL.json').code,0);
 const inventoryPath='F:/VisibleMedicine/staging/20261023-release-epoch-successor/website/lib/atlas-model-inventory.json';
 assert.equal(sha(read(inventoryPath)),'2e5accc6d2a6c749bbacdfc5721b841a57a6cce715be6c3bd300870b28680284');
 const expected=new Map(json(inventoryPath).models.map(r=>[r.sha256,r.bytes])),models=new Map(),modules=[];
 for(const name of ['head-neck','shoulder']){
  const base=website+'/public/atlas-runtime/'+name,manifest=json(base+'/manifest.json');
  assert.equal(manifest.sourceCommit,source.head);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);assert.equal(manifest.standaloneReviewConnection,false);
  if(name==='head-neck')assert.equal(manifest.imagingConnection,false);
  assert.equal(new Set(manifest.files.map(r=>r.path)).size,manifest.files.length);
  for(const row of manifest.files){assert(!row.path.includes('..')&&!row.path.includes('\\')&&!row.path.startsWith('/')&&!row.path.includes(':'));const file=base+'/'+row.path;assert(fs.lstatSync(file).isFile()&&!fs.lstatSync(file).isSymbolicLink());const bytes=read(file);assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256,row.path);if(/\.glb$/.test(row.path)){assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(expected.get(row.sha256),row.bytes,'Only existing staged model bytes: '+row.path);models.set(row.sha256,row.bytes);}}
  const inputs=json(base+'/source-inputs.json');for(const row of inputs){assert(!row.path.includes('..')&&!row.path.includes('\\')&&!row.path.startsWith('/')&&!row.path.includes(':'));assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,name+': fresh source '+row.path);}
  const dependencies=json(base+'/bundled-dependencies.json'),notices=read(base+'/BUNDLED_NOTICES.txt').toString();assert(dependencies.length>0);for(const d of dependencies){assert(['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','CC0-1.0','0BSD'].includes(d.license));assert(notices.includes(d.name+'@'+d.version),'Retain full bundled notices: '+d.name);}
  modules.push({name,root:base,sourceCommit:manifest.sourceCommit,manifestSha256:sha(read(base+'/manifest.json')),files:manifest.files.length,bytes:manifest.files.reduce((n,r)=>n+r.bytes,0),sourceInputs:inputs.length,bundledPackages:dependencies.length,regions:manifest.regionalScopes?.map(r=>({region:r.region,structures:r.regionalIds.length,nested:r.nestedTargets.length})),patientDataIncluded:false,clinicalApproved:false});
 }
 assert.equal(models.size,137);assert.deepEqual([...models].sort(),[...expected].sort(),'Complete unchanged staged137model byte union');
 const report={at:new Date().toISOString(),source:source.head,sourceTree:source.tree,modules,uniqueModelByteIdentities:models.size,completeExistingInventoryByteUnionRetained:true,inventorySha256:sha(read(inventoryPath)),freshFileHashesSourceInputsAndNoticesVerified:true,newModelAdmission:false,physicalSourceCoordinatesNotRegisteredToPatients:true,protectedReviewBound:false,fullWebsiteTypesBuildBrowserAndReleasePending:true,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
 fs.writeFileSync(root+'/EXPORT_VERIFICATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/EXPORT_VERIFICATION.json',sha256:sha(read(root+'/EXPORT_VERIFICATION.json')),modules:modules.map(r=>({name:r.name,files:r.files,sourceInputs:r.sourceInputs,packages:r.bundledPackages})),uniqueModels:models.size,previewChanged:false,installed:false}));process.exit(0);
}
const shoulderBuild=process.argv.includes('--shoulder-build'),regionalBuild=process.argv.includes('--regional-build'),exporting=process.argv.includes('--export');
assert(!(shoulderBuild&&regionalBuild),'One actual build at a time');
const build=shoulderBuild||regionalBuild,phase=exporting?'module-export':shoulderBuild?'shoulder-build':regionalBuild?'regional-build':'source-checks';
if(!fs.existsSync(root))fs.mkdirSync(root);
const folder=root+'/'+phase;assert(!fs.existsSync(folder),'Create-only evidence; never restart from a timeout');fs.mkdirSync(folder);
if(build){
 const previous=json(root+'/source-checks/TERMINAL.json');assert.equal(previous.code,0,'All unchanged source/model preflights must succeed before compilation');
 assert(!fs.existsSync(atlas+'/.sites-runtime/'+(shoulderBuild?'shoulder-module':'head-neck-module')),'Build output must be new, not emptied or overwritten');
}
if(exporting){for(const mode of ['source-checks','shoulder-build','regional-build'])assert.equal(json(root+'/'+mode+'/TERMINAL.json').code,0);for(const name of ['head-neck','shoulder'])assert(!fs.existsSync(website+'/public/atlas-runtime/'+name),'Create-only unserved runtime target');assert.equal(json(website+'/atlas-review/manifest.json').revision,source.head);}
const initial=observe();assert(initial.freeCommitKiB>8*1024*1024&&initial.fFreeBytes>4*1024**3,'Insufficient bounded-job virtual-memory/disk headroom');
const commands=exporting?[['regional',['scripts/export-head-neck-module.mjs',website+'/public/atlas-runtime/head-neck'],128],['shoulder',['scripts/export-shoulder-module.mjs',website+'/public/atlas-runtime/shoulder'],128]]:build?[[shoulderBuild?'shoulder':'regional',['node_modules/vite/bin/vite.js','build','--config',shoulderBuild?'integration/shoulder/vite.config.mjs':'integration/head-neck/vite.config.mjs'],384]]:
 [['source-holds',['scripts/validate-source-holds.mjs'],128],['geometry-screen',['scripts/validate-source-geometry-screen.mjs'],128],['regional-model-inputs',['scripts/head-neck-module-inputs.mjs','--audit'],128]];
const results=[];
const pointer='CURRENT_CHECKPOINT.json';
const state=(value)=>{
 const p=json(pointer);p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='atlas-runtime-preflight');
 if(value.live)p.activeWork.current.activeExecutionSessions.push({role:'atlas-runtime-preflight',driverPid:process.pid,pid:value.pid,phase:value.label,evidence:folder,source:source.head,ownerPreviewChanged:false});
 p.activeWork.current.pendingAtlasRuntimeRollforward.preflight={phase,folder,source:source.head,...value};p.activeWork.updated=new Date().toISOString();const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync(pointer,text);
};
for(const[label,options,heap]of commands){
 const args=['--max-old-space-size='+heap,...options],out=fs.createWriteStream(folder+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(folder+'/'+label+'.stderr.log',{flags:'wx'});
 const env={...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'};
 const child=spawn(process.execPath,args,{cwd:atlas,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 fs.writeFileSync(folder+'/'+label+'.STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,driverPid:process.pid,args,heapMiB:heap,initialObservation:initial,source:source.head,sourceTree:source.tree,previewChanged:false},null,2)+'\n',{flag:'wx'});state({live:true,pid:child.pid,label});console.log(JSON.stringify({phase,label,pid:child.pid,heapMiB:heap}));
 const outcome=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const stdout=read(out.path),stderr=read(err.path),text=stdout.toString()+'\n'+stderr.toString();
 const result={label,args,heapMiB:heap,...outcome,stdout:out.path,stderr:err.path,stdoutSha256:sha(stdout),stderrSha256:sha(stderr),resourceFailure:/heap out of memory|Reached heap limit|not enough memory/i.test(text)};results.push(result);fs.writeFileSync(folder+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({label,...outcome,resourceFailure:result.resourceFailure}));if(outcome.code!==0)break;
}
const dirty=runGit(['-C',atlas,'status','--porcelain']).toString().trim();
const terminal={at:new Date().toISOString(),phase,source:source.head,sourceTree:source.tree,materialized,materializedSha256:sha(read(materialized)),commands:results,code:results.length===commands.length&&results.every(r=>r.code===0)&&!dirty?0:1,trackedSourceDirty:dirty,finalObservation:observe(),fullTypesBuildBrowserPending:true,wholeSuitePassing:false,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(folder+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});state({live:false,terminal:folder+'/TERMINAL.json',terminalSha256:sha(read(folder+'/TERMINAL.json')),code:terminal.code});console.log(JSON.stringify({receipt:folder+'/TERMINAL.json',code:terminal.code,trackedSourceDirty:dirty,previewChanged:false}));process.exitCode=terminal.code;
