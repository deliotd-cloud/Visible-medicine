import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261027-tour-step-website',site=stage+'/website',attempt=process.argv[2]??'1';
assert(/^[1-9][0-9]*$/.test(attempt));
const dir=stage+'/navigation-checks-'+attempt;
const prep=json(stage+'/PREPARATION.json');assert.equal(hash(prep.parent.path),prep.parent.sha256);
const parent=json(prep.parent.path),changed=new Set(['components/RegionalLearningCatalogue.tsx','components/regional-learning-catalogue.css','lib/regional-tour-entry-navigation.ts','tests/regional-learning-discovery-ui.test.mjs']);
const rows=parent.sourceRows.map(r=>{const sha256=hash(site+'/'+r.path);if(!changed.has(r.path))assert.equal(sha256,r.sha256,r.path);return{path:r.path,sha256};});
rows.push({path:'tests/regional-tour-step-navigation.test.mjs',sha256:hash(site+'/tests/regional-tour-step-navigation.test.mjs')});
const roots=['tests/regional-tour-entry-navigation.test.mjs','tests/regional-tour-step-navigation.test.mjs','tests/regional-learning-discovery-ui.test.mjs','tests/regional-learning-catalogue-ui.test.mjs'];
memoryGate(4096);
const ix=json('CURRENT_CHECKPOINT.json');assert.deepEqual(ix.activeWork.current.activeExecutionSessions,[]);
ix.activeWork.current.activeExecutionSessions=[{kind:'tour-step-website-navigation',driverPid:process.pid,evidence:dir}];
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
try {
  const result=await guarded({site,dir,command:'--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' '),heap:1024});
  for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
  const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');
  const counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
  const passing=result.passing&&counts.tests>0&&counts.pass===counts.tests&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0;
  fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),passing,result,roots,counts,sourceRows:rows,nativeStepRuntimeImported:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({dir,passing,counts}));process.exitCode=passing?0:1;
} finally {
  const current=json('CURRENT_CHECKPOINT.json');assert.equal(current.activeWork.current.activeExecutionSessions[0]?.driverPid,process.pid);current.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(current,null,2)+'\n');
}
