import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',proposal='F:/VisibleMedicine/staging/20261021-pelvic-portal-epoch-proposal',stage='F:/VisibleMedicine/staging/20261021-pelvic-portal-epoch-application';
const evidence=json(proposal+'/STAGING_EVIDENCE.json'),previous='F:/VisibleMedicine/staging/20261021-checklist-import-state/SOURCE_INPUTS_AFTER.json';
const paths=evidence.applyPaths;assert.equal(paths.length,2);assert(paths.every(p=>/^tests\/clinical-review-(pelvic-venous|portal-hepatic)-tour\.test\.ts$/.test(p)));
const verify=rows=>{for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);};
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(stage));verify(json(previous));for(const p of paths){assert.equal(sha(read(site+'/'+p)),evidence.files[p].preSha256);assert.equal(sha(read(proposal+'/'+p)),evidence.files[p].postSha256);}
 const r=spawnSync(process.execPath,[proposal+'/verify-stage.mjs'],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0);fs.mkdirSync(stage);fs.writeFileSync(stage+'/pure-before.log',r.stdout+r.stderr,{flag:'wx'});
 fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),site,proposal,previous,previousSha256:sha(read(previous)),changes:evidence.files,nativeRun:false},null,2)+'\n',{flag:'wx'});console.log('Prepared two exact, independently reversible test-only changes; no application yet.');
}else{
 assert.equal(process.argv[2],'verify');const prior=json(previous),rows=new Map(prior.map(r=>[r.path,r]));
 for(const p of paths){const target=site+'/'+p,actual=read(target).toString(),expected=read(proposal+'/'+p).toString();assert.equal(actual.replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));if(sha(read(target))!==evidence.files[p].postSha256)fs.writeFileSync(target,read(proposal+'/'+p));rows.set(p,{path:p,bytes:read(target).length,sha256:sha(read(target))});assert.equal(rows.get(p).sha256,evidence.files[p].postSha256);}
 assert.equal(rows.size,5151);verify([...rows.values()]);const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.inputs.length,1710);verify(bound.inputs);process.kill(266712,0);
 const receipts=[];
 for(const[label,args]of [['native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...paths]],['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']]]){
  console.log('Running '+label+'; no preview restart.');const r=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'},encoding:'utf8',windowsHide:true,maxBuffer:12e6}),log=stage+'/'+label+'.log';fs.writeFileSync(log,r.stdout+r.stderr,{flag:'wx'});const receipt={at:new Date().toISOString(),args,code:r.status,signal:r.signal,log,logSha256:sha(read(log))};receipts.push(receipt);fs.writeFileSync(stage+'/'+label+'.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});assert.equal(r.status,0,label+' actual failure; inspect retained log');if(label==='native'){assert.match(r.stdout,/# tests 3\r?\n/);assert.match(r.stdout,/# pass 3\r?\n/);assert.match(r.stdout,/# fail 0\r?\n/);assert.match(r.stdout,/# skipped 0\r?\n/);}verify([...rows.values()]);
 }
 verify(bound.inputs);fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify([...rows.values()],null,2)+'\n',{flag:'wx'});
 const result={at:new Date().toISOString(),canonicalInstalled:true,changes:paths,source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:bound.sha256,controlledInputs:5151,preservedSourceInputs:7,namedInputs:5158,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),originalCasesRetained:3,actualNativePasses:3,fullTypesPassed:true,receipts,allOtherSourceInputsUnchanged:true,reviewBindingsUnchanged:1710,previewRestarted:false,clinicalApproval:false,fullSuitePassingClaim:false};fs.writeFileSync(stage+'/APPLICATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
}
