import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {spec,stage,suite,sourceSha,sourceFile,hash,json,writeNew,verifySourceBuild} from './common.mjs';

const modes=['embed','pilot'];
const before=verifySourceBuild();
for(const mode of modes){spec(mode);assert(!fs.existsSync(stage(mode)),'Fresh create-only state required for '+mode);}
assert(!fs.existsSync(suite),'Suite evidence must be create-only');
fs.mkdirSync(suite);
const scriptDir=new URL('.',import.meta.url);
const run=(script,mode,timeoutMs)=>new Promise(resolve=>{
  const out=fs.openSync(`${suite}/${mode}-${script}.stdout.log`,'wx');
  const err=fs.openSync(`${suite}/${mode}-${script}.stderr.log`,'wx');
  const child=spawn(process.execPath,[fileURLToPath(new URL(script+'.mjs',scriptDir)),mode],{stdio:['ignore',out,err],windowsHide:true,shell:false});
  const timer=setTimeout(()=>{child.kill();},timeoutMs);
  child.once('close',(code,signal)=>{clearTimeout(timer);fs.closeSync(out);fs.closeSync(err);resolve({code,signal,pid:child.pid});});
  child.once('error',error=>{clearTimeout(timer);resolve({error:String(error),pid:child.pid});});
});
const cases=[];
let allPassing=true;
for(const mode of modes){
  const dir=stage(mode),item={mode,stage:dir,at:new Date().toISOString()};
  let driver,driverDone;
  try{
    const out=fs.openSync(`${suite}/${mode}-serve.stdout.log`,'wx');
    const err=fs.openSync(`${suite}/${mode}-serve.stderr.log`,'wx');
    driver=spawn(process.execPath,[fileURLToPath(new URL('serve.mjs',scriptDir)),mode],{stdio:['ignore',out,err],windowsHide:true,shell:false});
    driverDone=new Promise(resolve=>{driver.once('close',(code,signal)=>{fs.closeSync(out);fs.closeSync(err);resolve({code,signal,pid:driver.pid});});driver.once('error',error=>resolve({error:String(error),pid:driver.pid}));});
    let handleReady=false;
    for(let i=0;i<150;i++){
      if(fs.existsSync(dir+'/HANDLE.json')){handleReady=true;break;}
      if(driver.exitCode!==null)break;
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    assert(handleReady,'Owned HANDLE not created within 30 seconds');
    item.handle=json(dir+'/HANDLE.json');
    assert.equal(item.handle.parentPid,driver.pid,'Driver/handle parent PID mismatch');
    // No application HTTP request precedes inspect-first. Inspector discovery is separate.
    item.inspector=await run('inspect-first',mode,65000);
    item.firstRequest=fs.existsSync(dir+'/FIRST_REQUEST.json')?json(dir+'/FIRST_REQUEST.json'):null;
    assert.equal(item.inspector.code,0,'First-request inspector failed');
    assert.equal(item.firstRequest?.passing,true,'Negative probe failed');
  }catch(error){item.error=String(error);allPassing=false;}
  finally{
    try{
      if(fs.existsSync(dir+'/HANDLE.json'))item.cleanup=await run('cleanup',mode,30000);
      else item.cleanup={skipped:'No owned HANDLE was created'};
      if(item.cleanup.code!==0&&item.cleanup.skipped===undefined){item.error=(item.error??'')+' Cleanup failed';allPassing=false;}
    }catch(error){item.cleanupError=String(error);allPassing=false;}
    if(driverDone){
      item.driverTerminal=await Promise.race([driverDone,new Promise(resolve=>setTimeout(()=>resolve(null),15000))]);
      if(!item.driverTerminal){item.driverStillLive=true;allPassing=false;}
    }
    if(fs.existsSync(dir+'/TERMINAL.json'))item.terminal=json(dir+'/TERMINAL.json');
    if(fs.existsSync(dir+'/CLEANUP.json'))item.cleanupReceipt=json(dir+'/CLEANUP.json');
    if(!item.firstRequest?.passing||!item.cleanupReceipt||item.driverStillLive)allPassing=false;
    cases.push(item);
  }
  if(!allPassing)break;
}
const after=verifySourceBuild();
assert.equal(hash(sourceFile),sourceSha);
assert.equal(after.buildSha,before.buildSha);
const result={at:new Date().toISOString(),source:{path:sourceFile,sha256:sourceSha},build:{path:before.build?.path??'checks/build-attempt-1/RESULT.json',sha256:before.buildSha,artifactReceiptSha:before.artifactReceiptSha},
  sourceAndBuildRowsVerifiedBeforeAndAfter:true,sequential:true,firstRequestOnly:true,cases,
  passing:allPassing&&cases.length===modes.length,ownerPreviewChanged:false};
writeNew(suite+'/RESULT.json',result);
console.log(JSON.stringify({result:suite+'/RESULT.json',passing:result.passing,cases:cases.map(x=>({mode:x.mode,passing:x.firstRequest?.passing,cleanup:x.cleanup?.code,error:x.error}))}));
if(!result.passing)process.exitCode=1;
