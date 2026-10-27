import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded as small} from './run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from './run-native-build-balanced-guarded-20261025.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const phase=process.argv[2], attempt=process.argv[3]??'1';
assert(['tests','metadata','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const stage='F:/VisibleMedicine/staging/20261027-cardiac-imaging-native',site=stage+'/atlas',dir=stage+'/checks/'+phase+'-'+attempt;
assert(!fs.existsSync(dir));let command,heap=512,aggregate=2048,minimum=4096;
const authored=['content/cardiac-teaching.ts','content/cardiac-imaging-recognition-pins.json','scripts/test-cardiac-imaging-recognition.mjs','scripts/test-cardiac-imaging-review.mjs','docs/CARDIAC_IMAGING_RECOGNITION.md'];
const sourceInputs=authored.map(path=>({path,sha256:hash(site+'/'+path)}));
if(['tests','metadata'].includes(phase)){
 const actions=phase==='tests'?[
  ['--test','--test-reporter=tap','--test-concurrency=1','scripts/test-cardiac-imaging-recognition.mjs','scripts/test-cardiac-imaging-review.mjs','scripts/test-cardiac-cavity-guide.mjs','scripts/test-cardiac-cavity-component.mjs']
 ]:[['scripts/regional-teaching-snapshots.mjs','--check'],['scripts/generate-body-review-display-pins.mjs'],['scripts/review-revisions.mjs'],['scripts/body-renderer-revisions.mjs'],['scripts/generate-nested-review-bindings.mjs','--check'],['scripts/audit-requirements.mjs']];
 for(const args of actions)for(const arg of args.filter(x=>x.startsWith('scripts/')))assert(fs.existsSync(site+'/'+arg),arg);
 const runner=stage+'/'+phase+'-'+attempt+'-runner.mjs';
 fs.writeFileSync(runner,`import fs from 'node:fs';import {spawnSync} from 'node:child_process';const rows=[];for(const args of ${JSON.stringify(actions)}){console.log('ACTUAL_STEP '+args.join(' '));const r=spawnSync(process.execPath,['--max-old-space-size=512',...args],{windowsHide:true,stdio:'inherit'});rows.push({args,code:r.status,signal:r.signal,error:r.error?.message});if(r.status!==0||r.signal||r.error)break;}fs.writeFileSync(new URL('./${phase.toUpperCase()}_${attempt}_STEPS.json',import.meta.url),JSON.stringify(rows,null,2)+String.fromCharCode(10),{flag:'wx'});process.exitCode=rows.length===${actions.length}&&rows.every(r=>r.code===0&&!r.signal&&!r.error)?0:1;`,{flag:'wx'});
 command='--max-old-space-size=256 '+runner;
}else if(phase==='types'){
 const to=stage+'/full-types-native-'+attempt+'.mjs';fs.writeFileSync(to,fs.readFileSync('F:/VisibleMedicine/staging/20261025-regional-title-native/full-types-native.mjs','utf8').replace('FULL_TYPE_RESULT_native.json','FULL_TYPE_RESULT_native_'+attempt+'.json'),{flag:'wx'});
 command='--max-old-space-size=3072 '+to;heap=3072;aggregate=3584;minimum=5632;
}else{
 assert(json(stage+'/checks/types-1/RESULT.json').passing);
 const to=stage+'/build-stock-balanced-'+attempt+'.mjs';fs.copyFileSync('F:/VisibleMedicine/staging/20261025-regional-title-native/build-stock-balanced.mjs',to,fs.constants.COPYFILE_EXCL);
 command='--max-old-space-size=256 '+to;heap=768;aggregate=3584;minimum=5632;
}
memoryGate(minimum);
const ix=json('CURRENT_CHECKPOINT.json');assert.deepEqual(ix.activeWork.current.activeExecutionSessions,[]);
ix.activeWork.current.activeExecutionSessions=[{kind:'cardiac-imaging-native-'+phase,driverPid:process.pid,evidence:dir}];
ix.activeWork.current.pendingCardiacImaging.state='Reviewed six drafted lessons; native '+phase+' in progress; not integrated';
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
function retire(){const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}}
process.on('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))retire();});
try{
 const run=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum});
 for(const row of sourceInputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');
 const counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const passing=run.passing&&(!counts||(counts.tests>0&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0));
 fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),passing,phase,run,counts,sourceInputs,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({phase,passing,counts,result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json')}));if(!passing)process.exitCode=1;
}finally{retire();}
