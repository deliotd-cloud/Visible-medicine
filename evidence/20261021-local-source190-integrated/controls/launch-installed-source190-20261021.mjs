import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared',installed=json(root+'/INSTALLATION.json'),site=installed.site;
assert(installed.applied&&installed.previewRestartPending);assert(!fs.existsSync(root+'/PREVIEW_STARTED.json'));
assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,installed.review);assert.equal(runGit(['-C',installed.atlas,'rev-parse','HEAD']).toString().trim(),installed.sourceAtlas);
const checks=[];
for(const script of ['scripts/verify-clinical-review.mjs','scripts/verify-atlas-delivery-policy.mjs']){
 const bytes=execFileSync(process.execPath,['--experimental-strip-types',script],{cwd:site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:installed.atlas,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},maxBuffer:3e6});
 const log=root+'/installed-'+script.split('/').at(-1)+'.log';fs.writeFileSync(log,bytes,{flag:'wx'});checks.push({script,code:0,logSha256:sha(bytes)});
}
await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(3000,'127.0.0.1',()=>server.close(resolve));});
const log=root+'/PREVIEW.log',stream=fs.createWriteStream(log,{flags:'wx'});
const child=spawn(process.execPath,['scripts/start-stable-preview.mjs'],{cwd:site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:installed.atlas,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
const started={at:new Date().toISOString(),pid:child.pid,launcherPid:process.pid,site,url:'http://127.0.0.1:3000',sourceAtlas:installed.sourceAtlas,review:installed.review,log,checks,openTabsReloaded:false,ownerDraftsPreserved:true,authenticationSourcesChanged:false,databaseMigrated:false,publicDeployment:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(root+'/PREVIEW_STARTED.json',JSON.stringify(started,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(started));
const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
await new Promise(resolve=>stream.end(resolve));fs.writeFileSync(root+'/PREVIEW_TERMINAL.json',JSON.stringify({...result,at:new Date().toISOString(),pid:child.pid,logSha256:sha(read(log))},null,2)+'\n',{flag:'wx'});process.exitCode=result.code??1;
