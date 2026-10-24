// Actual stock npm production build of the committed isolated native source.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {finished} from 'node:stream/promises';
import {hash,json} from './seal-simple-website-successor.mjs';
const sourceFile='F:/VisibleMedicine/recovery/checkpoints/20261024-native-verified-source/SOURCE_COMMITTED.json',sourceHash='18226a6f5e49d4e382e8c6a0397a1672be92af280bd0133a1de986b6d8d7fa38';
const attempt='F:/VisibleMedicine/staging/20261024-combined-atlas/checks/production-build-attempt-1';
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<6144||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory,minimumMiB:6144}));process.exit(75);}
assert.equal(hash(sourceFile),sourceHash);const source=json(sourceFile),atlas=source.atlas;assert.equal(source.head,'727ed5b451ae940a01e56272c8fbc703ea3b0095');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true}).trim();
const drift=()=>source.sourceRows.flatMap(r=>{try{return hash(atlas+'/'+r.path)===r.sha256&&fs.statSync(atlas+'/'+r.path).size===r.bytes?[]:[r.path];}catch(error){return[{path:r.path,error:error.code}];}});
assert.deepEqual(drift(),[]);assert.equal(git('status','--porcelain'),'');assert.equal(git('rev-parse','HEAD'),source.head);assert.equal(git('rev-parse','HEAD^{tree}'),source.tree);assert(!fs.existsSync(atlas+'/dist'),'First isolated build only; never empty unknown prior output');assert(!fs.existsSync(attempt));
for(const r of source.checks){assert.equal(hash(r.path),r.sha256);assert.equal(json(r.path).passing,true);}
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');assert(fs.statSync(npm).isFile());
const indexBefore=fs.readFileSync('CURRENT_CHECKPOINT.json'),index=json('CURRENT_CHECKPOINT.json');assert.equal(index.goal.status,'active');assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);
fs.mkdirSync(attempt,{recursive:true});const save=(name,v)=>fs.writeFileSync(attempt+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});fs.writeFileSync(attempt+'/CURRENT_INDEX_BEFORE.json',indexBefore,{flag:'wx'});
let child,spawnError=null,result=null;
function updateIndex(live,terminal=null){
 const p=json('CURRENT_CHECKPOINT.json'),before=structuredClone(p);assert.deepEqual(p.goal,index.goal);assert.deepEqual(p.safety,index.safety);assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,index.activeWork.current.ownerPreviewPolicy);
 p.activeWork.current.activeExecutionSessions=live?[{kind:'isolated-native-production-build',wrapperPid:process.pid,childPid:child.pid,started:startedAt,sourceHead:source.head,sourceSha256:sourceHash,attempt,installed:false,previewChanged:false}]:p.activeWork.current.activeExecutionSessions.filter(r=>r.wrapperPid!==process.pid);
 p.activeWork.current.pendingCombinedAtlas.sourceVerifiedCommit={head:source.head,tree:source.tree,receipt:sourceFile,sha256:sourceHash,sourceRows:6389,localOnly:true,buildRunning:live,built:terminal?.passing===true,notImportedIntoWebsite:true};
 if(terminal)p.activeWork.current.latestNativeBuild={terminal:attempt+'/TERMINAL.json',sha256:hash(attempt+'/TERMINAL.json'),passing:terminal.passing,head:source.head,sourceSha256:sourceHash,artifacts:terminal.passing?attempt+'/BUILD_ARTIFACTS.json':null,installed:false,previewChanged:false};
 assert.deepEqual(p.goal,before.goal);const b=Buffer.from(JSON.stringify(p,null,2)+'\n');assert(b.length<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',b);
}
const startedAt=new Date().toISOString();
try{
 const stdout=fs.createWriteStream(attempt+'/stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(attempt+'/stderr.log',{flags:'wx'});
 const args=['--max-old-space-size=3072',npm,'run','build'];
 child=spawn(process.execPath,args,{cwd:atlas,env:{...process.env,NODE_OPTIONS:((process.env.NODE_OPTIONS??'')+' --max-old-space-size=3072').trim(),GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',WRANGLER_SEND_METRICS:'false'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 const completion=new Promise(resolve=>{child.once('error',error=>{spawnError=error.message;});child.once('close',(exitCode,signal)=>resolve({exitCode,signal}));});
 await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
 save('STARTED.json',{at:startedAt,memory,minimumMiB:6144,wrapperPid:process.pid,childPid:child.pid,executable:process.execPath,args,cwd:atlas,npmCliSha256:hash(npm),sourceFile,sourceSha256:sourceHash,head:source.head,tree:source.tree,sourcePaths:6389,heapMiB:3072,goMemoryMiB:64,singleHeavyJob:true,noAutomaticTimeoutOrRestart:true,scope:'Exact stock npm build/prebuild/transport/source-archive exclusion. Local output only; no runtime source upload, preview change or clinical approval.'});updateIndex(true);console.log(JSON.stringify({started:true,wrapperPid:process.pid,childPid:child.pid,attempt,head:source.head}));
 result=await completion;await Promise.all([finished(stdout),finished(stderr)]);
 const sourceDrift=drift();if(git('status','--porcelain')!=='')sourceDrift.push('git-status');if(git('rev-parse','HEAD')!==source.head)sourceDrift.push('git-head');if(hash(sourceFile)!==sourceHash)sourceDrift.push('source-receipt');
 const passing=result.exitCode===0&&!result.signal&&!spawnError&&!sourceDrift.length;let files=[];
 if(passing){
  const dist=path.resolve(atlas,'dist');assert.equal(fs.realpathSync(dist).toLowerCase(),dist.toLowerCase());assert(!fs.lstatSync(dist).isSymbolicLink());
  function walk(dir,prefix=''){for(const item of fs.readdirSync(dir,{withFileTypes:true})){assert(!item.isSymbolicLink());const relative=prefix+item.name,file=path.resolve(dir,item.name);assert(file.startsWith(dist+path.sep));if(item.isDirectory())walk(file,relative+'/');else{assert(item.isFile());files.push({path:relative,bytes:fs.statSync(file).size,sha256:hash(file)});}}}walk(dist);files.sort((a,b)=>a.path.localeCompare(b.path));assert(files.length>0);
  save('BUILD_ARTIFACTS.json',{at:new Date().toISOString(),root:dist,files,head:source.head,tree:source.tree,sourceSha256:sourceHash,localOnly:true,privateReleaseClearanceNotInferred:true,clinicalApproval:false});
 }
 const terminal={at:new Date().toISOString(),started:startedAt,...result,spawnError,passing,sourceDrift,sourceSha256:sourceHash,head:source.head,tree:source.tree,sourcePathsChecked:6389,stdoutSha256:hash(attempt+'/stdout.log'),stderrSha256:hash(attempt+'/stderr.log'),actualStockNpmBuild:true,actualPrebuildPassed:passing,actualProductionBuildPassed:passing,buildFiles:files.length,artifacts:passing?attempt+'/BUILD_ARTIFACTS.json':null,artifactsSha256:passing?hash(attempt+'/BUILD_ARTIFACTS.json'):null,nativeAncestryUploaded:false,fullReleasePassed:false,browserAcceptance:false,clinicalApproval:false,spatialRegistration:false,installed:false,previewChanged:false};save('TERMINAL.json',terminal);updateIndex(false,terminal);console.log(JSON.stringify({attempt,passing,exitCode:result.exitCode,sourceDrift,buildFiles:files.length,artifactsSha256:terminal.artifactsSha256}));process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,childPid:child?.pid??null,result,spawnError,actualChildStateMustBeCheckedBeforeRetry:true});if(result)updateIndex(false);throw error;}
