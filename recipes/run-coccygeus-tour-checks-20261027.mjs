import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded as small} from './run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from './run-native-build-balanced-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261027-coccygeus-tour-native',site=stage+'/atlas';
const phase=process.argv[2],attempt=Number(process.argv[3]??1);
assert(['tests','metadata','types','build','module'].includes(phase));
assert(Number.isInteger(attempt)&&attempt>0&&attempt<5);
const dir=stage+'/checks/'+phase+'-'+attempt;
assert(!fs.existsSync(dir));
let command,heap=512,aggregate=2048,minimum=4096;
if(['tests','metadata'].includes(phase)){
  const actions=phase==='tests'?
    (attempt===1?[['--import','tsx','scripts/pin-coccygeus-tour.mjs','--check'],['--import','tsx','scripts/test-coccygeus-tour.mjs'],['scripts/test-coccygeus-tour-transition.mjs'],['scripts/test-regional-tour-player.mjs'],['scripts/test-whole-body-guided-learning.mjs'],['scripts/test-regional-tour-review.mjs'],['scripts/test-tour-camera.mjs']]:[['scripts/test-coccygeus-tour-transition.mjs'],['scripts/test-whole-body-guided-learning.mjs'],['scripts/test-regional-tour-review.mjs'],['scripts/test-tour-camera.mjs']]):
    [['scripts/regional-teaching-snapshots.mjs','--check'],['scripts/generate-body-review-display-pins.mjs'],['scripts/review-revisions.mjs'],['scripts/body-renderer-revisions.mjs'],['scripts/generate-nested-review-bindings.mjs','--check'],['scripts/audit-requirements.mjs']];
  for(const a of actions)for(const script of a.filter(x=>x.startsWith('scripts/')))assert(fs.existsSync(site+'/'+script),script);
  const runner=stage+'/'+phase+'-'+attempt+'-runner.mjs';
  fs.writeFileSync(runner,`import fs from 'node:fs';import {spawnSync} from 'node:child_process';const rows=[];for(const args of ${JSON.stringify(actions)}){console.log('ACTUAL_STEP '+args.join(' '));const r=spawnSync(process.execPath,['--max-old-space-size=512',...args],{windowsHide:true,stdio:'inherit'});rows.push({args,code:r.status,signal:r.signal,error:r.error?.message});if(r.status!==0||r.signal||r.error)break;}fs.writeFileSync(new URL('./${phase.toUpperCase()}_${attempt}_STEPS.json',import.meta.url),JSON.stringify(rows,null,2)+'\\n',{flag:'wx'});process.exitCode=rows.length===${actions.length}&&rows.every(r=>r.code===0&&!r.signal&&!r.error)?0:1;`,{flag:'wx'});
  command='--max-old-space-size=256 '+runner;
}else if(phase==='types'){
  const to=stage+'/full-types-native-'+attempt+'.mjs';fs.copyFileSync('F:/VisibleMedicine/staging/20261025-regional-title-native/full-types-native.mjs',to,fs.constants.COPYFILE_EXCL);
  command='--max-old-space-size=3072 '+to;heap=3072;aggregate=3584;minimum=5632;
}else if(phase==='build'){
  assert(json(stage+'/checks/types-1/RESULT.json').passing);
  const to=stage+'/build-stock-balanced-'+attempt+'.mjs';fs.copyFileSync('F:/VisibleMedicine/staging/20261025-regional-title-native/build-stock-balanced.mjs',to,fs.constants.COPYFILE_EXCL);
  command='--max-old-space-size=256 '+to;heap=768;aggregate=3584;minimum=5632;
}else{
  command='--max-old-space-size=1536 node_modules/vite/bin/vite.js build --config integration/head-neck/vite.config.mjs';heap=1536;aggregate=3584;minimum=5632;
}
const ix=json('CURRENT_CHECKPOINT.json');assert.deepEqual(ix.activeWork.current.activeExecutionSessions,[]);
ix.activeWork.current.activeExecutionSessions=[{kind:'coccygeus-tour-'+phase,driverPid:process.pid,evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
try{
  const result=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum});
  fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({...result,at:new Date().toISOString(),phase,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({phase,passing:result.passing,result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json')}));if(!result.passing)process.exitCode=1;
}finally{
  const current=json('CURRENT_CHECKPOINT.json');assert.equal(current.activeWork.current.activeExecutionSessions[0]?.driverPid,process.pid);
  current.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(current,null,2)+'\n');
}
