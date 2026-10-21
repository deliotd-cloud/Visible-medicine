// Isolated Atlas-source commit and genuine introduction replay; no owner cutover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',assembly=base+'atlas-source-assembly';
const stage=base+'committed-source-admission',queue=json(base+'after-suite-dental/state.json');
const source=queue.target,rows=queue.currentSourcePaths;assert.equal(rows.length,21);
const previous=json(base+'review-harness-and-elbow-application/RESULT.json');
assert([0,1].includes(previous.code));assert.equal(previous.signal,null);assert.equal(previous.inputDrift,false);
for(const label of ['QUEUED_DENTAL_FULL_TRANSITION','QUEUED_DENTAL_RENDERER_CHECK','ACTUAL_COMBINED_HIP','ACTUAL_COMBINED_TOUR_PLAYER','ACTUAL_COMBINED_TYPES']){
 const receipt=json(assembly+'/'+label+'.json');assert.equal(receipt.code,0,label);assert.equal(receipt.signal,null);assert.equal(sha(read(receipt.log)),receipt.logSha256);
}
const git=(...args)=>runGit(['-C',source,...args]);
assert.equal(git('rev-parse','HEAD').toString().trim(),queue.source);
assert.equal(queue.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');
assert.equal(git('diff','--cached','--name-only').toString(),'','No other staged work');
const status=git('-c','core.quotepath=false','status','--porcelain=v1','--untracked-files=all').toString().trimEnd().split(/\r?\n/).filter(Boolean);
assert(status.every(line=>/^(?: M|\?\?) /.test(line)),'Only expected modified/new source paths');
assert.deepEqual(status.map(line=>line.slice(3)).sort(),rows.map(row=>row.path).sort(),'Exact21 owned paths');
const verifyBytes=()=>{for(const row of rows)assert.equal(sha(read(source+'/'+row.path)),row.sha256,row.path);};verifyBytes();
const out=path.resolve(source,'.sites-runtime/head-neck-module');
assert(out.startsWith(path.resolve(source)+path.sep));assert(!fs.existsSync(out),'Preserve any existing module build');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
save('PREPARATION.json',{stage,site:source,atlas:source,source:queue.source,canonicalInstalled:false,scope:'Actual21path source commit, genuine dental introduction replay and isolated regional module build only.'});
save('PRE_COMMIT.json',{at:new Date().toISOString(),parent:queue.source,paths:rows,existingOutput:false,headTypecheckPass:true,tourCases:75,canonicalInstalled:false});
git('add','--',...rows.map(row=>row.path));
assert.deepEqual(git('diff','--cached','--name-only').toString().trim().split(/\r?\n/).sort(),rows.map(row=>row.path).sort());
for(const row of rows){
 const index=git('show',':'+row.path),live=read(source+'/'+row.path);
 assert(index.equals(live)||index.equals(Buffer.from(live.toString().replaceAll('\r\n','\n'))),'Only declared text EOL representation: '+row.path);
}
const tree=git('write-tree').toString().trim();
git('-c','user.name=Visible Medicine source coordination','-c','user.email=source-backup@users.noreply.github.com','commit','-m','Atlas: keyboard zoom, guided-start clarity and scoped dental MRI drafts');
const commit=git('rev-parse','HEAD').toString().trim();assert.match(commit,/^[a-f0-9]{40}$/);assert.notEqual(commit,queue.source);
assert.equal(git('show','-s','--format=%P',commit).toString().trim(),queue.source);assert.equal(git('show','-s','--format=%T',commit).toString().trim(),tree);
assert.equal(git('status','--porcelain=v1','--untracked-files=all').toString().trim(),'');verifyBytes();
save('COMMITTED.json',{at:new Date().toISOString(),commit,tree,parent:queue.source,paths:rows,canonicalInstalled:false,publicDeployment:false});
console.log(JSON.stringify({phase:'isolated-source-committed',commit,tree,paths:21,canonicalInstalled:false}));
const coordinator=path.dirname(fileURLToPath(import.meta.url)),steps=[];
for(const [label,args] of [
 ['ACTUAL_COMMITTED_DENTAL',['scripts/verify-dental-mri-transition.mjs']],
 ['ACTUAL_COMMITTED_REGIONAL_BUILD',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],
]){
 const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,label,process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
 save(label+'-STARTED.json',{at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,commit,label,args});
 const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 const receipt=json(stage+'/'+label+'.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
 verifyBytes();assert.equal(git('rev-parse','HEAD').toString().trim(),commit);assert.equal(git('status','--porcelain=v1','--untracked-files=all').toString().trim(),'');
 steps.push({label,...done,receiptSha256:sha(read(stage+'/'+label+'.json'))});
 if(done.code!==0||done.signal!==null){save('RESULT.json',{at:new Date().toISOString(),commit,tree,steps,passed:false,canonicalInstalled:false});process.exitCode=done.code??1;break;}
}
if(steps.length===2&&steps.every(step=>step.code===0&&step.signal===null)){
 const result={at:new Date().toISOString(),commit,tree,parent:queue.source,paths:21,steps,passed:true,canonicalInstalled:false,fullWebsiteSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
 save('RESULT.json',result);console.log(JSON.stringify(result));
}
