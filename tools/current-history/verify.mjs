import {inspectCurrentRelease} from 'file:///G:/VisibleMedicine-temp/proposals/20261031-current-queue-admission/current-queue.mjs';
import {availablePhysicalMiB} from 'file:///G:/VisibleMedicine-temp/proposals/20261031-admission-retry/native-memory.mjs';
import {waitForAvailableMemory} from 'file:///G:/VisibleMedicine-temp/proposals/20261031-admission-retry/memory-admission.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready',site=root+'/atlas',pin=root+'/SOURCE_PREPARED_CURRENT_HISTORY.json';
const prepared=json(pin),baseline=json(root+'/BASELINE.json');
const stateFile=root+'/VERIFICATION_CURRENT_HISTORY_STATE.json';
const commands=[
 ['scripts/pin-nested-teaching.mjs','--check'],['scripts/generate-nested-review-bindings.mjs','--check'],
 ['scripts/review-revisions.mjs','--check'],['scripts/body-renderer-revisions.mjs'],['scripts/body-renderer-revisions.mjs','--check'],
 ['scripts/regional-teaching-snapshots.mjs','--check'],['--test','--test-reporter=tap','scripts/test-nested-visual-ct-guidance.mjs'],
 ['scripts/validate-nested-ct-orientation.mjs'],['scripts/validate-collicular-teaching.mjs'],
 ['scripts/validate-superior-temporal-mri.mjs'],['scripts/validate-nested-teaching.mjs'],
 ['scripts/validate-nested-review.mjs'],[root+'/review-impact.mjs'],
];
const generatedPaths=['content/body-renderer-revision.json','docs/nested-review-validation.json'];
const verify=()=>{for(const r of prepared.sourceRows)if(!generatedPaths.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+r.path),r.sha256,r.path);};
const available=()=>availablePhysicalMiB();
const websiteAdmission=()=>inspectCurrentRelease(json('C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/CURRENT_CHECKPOINT.json'));
const firstAdmission=websiteAdmission();
if(!firstAdmission.available){console.log(JSON.stringify({deferred:true,...firstAdmission}));process.exit(2);}
verify();
const state=fs.existsSync(stateFile)?json(stateFile):{source:{path:pin,sha256:hash(pin)},completed:[],generated:Object.fromEntries(generatedPaths.map(path=>[path,prepared.sourceRows.find(row=>row.path===path).sha256])),terminal:false,passed:false};
assert(!fs.existsSync(stateFile)||state.terminal,'Inspect the prior execution handle before attempting to resume');
assert.equal(state.source.sha256,hash(pin));
assert(!state.failure,'Inspect a failed result before any retry');
for(const row of state.completed){assert.equal(row.status,0);assert.equal(hash(row.log.path),row.log.sha256);assert.deepEqual(commands[row.index],row.args);}
for(const path of generatedPaths)assert.equal(hash(site+'/'+path),state.generated[path],'Generated output changed outside recorded verification: '+path);
state.pid=process.pid;state.terminal=false;state.state='starting';
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2)+'\n');save();
try {
for(let index=state.completed.length;index<commands.length;index++){
 verify();const admission=await waitForAvailableMemory({sample:available,onWait:({availableMiB,attempt})=>{state.state='awaiting-memory';state.current={index,args:commands[index],availableMiB,attempt,maximumWaitMs:60000};save();if(attempt===1)console.log(JSON.stringify({waitingForMemory:true,index:index+1,availableMiB,requiredMiB:4096,maximumWaitMs:60000}));}});const free=admission.availableMiB;
 if(free<4096){state.state='memory-deferred';state.availableMiB=free;state.requiredMiB=4096;state.terminal=true;save();console.log(JSON.stringify({deferred:true,availableMiB:free,requiredMiB:4096,completed:state.completed.length}));process.exitCode=2;break;}
 const lane=websiteAdmission();if(!lane.available){state.state='website-deferred';state.websiteAdmission=lane;state.terminal=true;save();console.log(JSON.stringify({deferred:true,...lane}));process.exitCode=2;break;}
 const args=commands[index];state.state='running';state.current={index,args,availableMiB:free,started:new Date().toISOString()};save();
 console.log(JSON.stringify({starting:index+1,args}));
 const run=spawnSync(process.execPath,['--max-old-space-size=384','--import','tsx',...args],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_ROOT:site}});
 const log=root+'/CURRENT-HISTORY-CHECK-'+String(index+1).padStart(2,'0')+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});verify();
 for(const path of generatedPaths){const current=hash(site+'/'+path);if(!((index===3&&path===generatedPaths[0])||(index===11&&path===generatedPaths[1])))assert.equal(current,state.generated[path],'Unexpected generated output change: '+path);state.generated[path]=current;}
 const result={index,args,status:run.status,signal:run.signal,error:run.error?.message??null,availableMiB:free,heapMiB:384,log:{path:log,sha256:hash(log)},at:new Date().toISOString()};
 fs.writeFileSync(root+'/CURRENT-HISTORY-CHECK-'+String(index+1).padStart(2,'0')+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 delete state.current;
 if(run.status!==0||run.signal||run.error){state.failure=result;state.state='failed';state.terminal=true;save();process.exitCode=1;break;}
 state.completed.push(result);save();console.log(JSON.stringify({finished:index+1,status:run.status}));
}
if(state.completed.length===commands.length){state.state='passed';state.terminal=true;state.passed=true;state.finished=new Date().toISOString();save();console.log(JSON.stringify({passed:true,checks:commands.length,installed:false,clinicalApproval:false}));}
} catch(error) {
 state.state='failed';state.terminal=true;state.failure={...(state.failure??{}),error:String(error)};state.finished=new Date().toISOString();save();throw error;
}
