import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-release-context-repairs',recipes='F:/VisibleMedicine/staging/20261028-release-repair-recipes',sf=stage+'/SOURCE_CANDIDATE_V3.json',sourceSha='758432a0d2836fc574bf19c61a11b28da64f606bab25586008e52dabff7c3c81';
assert.equal(hash(sf),sourceSha);const script=recipes+'/check-v5.mjs';
const jobs=[['arterial','3'],['cervical','2'],['core','3'],['foot','4'],['reviewHistory','2'],['noticeHistory','2']];
const prefix=stage+'/VERIFICATION_V3_';const start={at:new Date().toISOString(),pid:process.pid,jobs,source:{path:sf,sha256:sourceSha},script:{path:script,sha256:hash(script)}};
fs.writeFileSync(prefix+'STARTED.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});
const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);i.activeWork.current.pendingReleaseContextRepairs.focusDriver={pid:process.pid,started:prefix+'STARTED.json',terminal:prefix+'TERMINAL.json'};saveIndex(i);
const terminal={completed:[],focusedPassing:false,typesPassing:false};
async function execute(name,args){
 const child=spawn(process.execPath,['--expose-gc','--max-old-space-size=512',...args],{windowsHide:true,shell:false,stdio:['ignore','inherit','inherit']});
 fs.writeFileSync(prefix+'ACTIVE.json',JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,name,childPid:child.pid},null,2)+'\n');
 const status=await new Promise(resolve=>{child.once('error',e=>resolve({error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 if(status.code!==0||status.signal||status.error){terminal.failed={name,status};throw Error('Verification stopped at '+name);}
}
try{
 for(const [group,attempt]of jobs){
  await execute(group,[script,group,attempt]);const receipt=json(stage+'/ACCEPTED.json')[group];assert.equal(hash(receipt.path),receipt.sha256);const result=json(receipt.path);assert(result.passing);assert.equal(result.source.sha256,sourceSha);terminal.completed.push({group,...receipt,counts:result.counts});
 }
 terminal.focusedPassing=true;
 await execute('full-types',[recipes+'/types.mjs',sf,sourceSha,'1']);
 const file=stage+'/checks/types-1/RESULT.json';assert(json(file).passing);terminal.types={path:file,sha256:hash(file)};terminal.typesPassing=true;
}finally{
 terminal.at=new Date().toISOString();terminal.source=start.source;fs.writeFileSync(prefix+'TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
 const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.pendingReleaseContextRepairs.focusDriver?.pid===process.pid)i.activeWork.current.pendingReleaseContextRepairs.focusDriver.terminalObserved=true;saveIndex(i);
}
