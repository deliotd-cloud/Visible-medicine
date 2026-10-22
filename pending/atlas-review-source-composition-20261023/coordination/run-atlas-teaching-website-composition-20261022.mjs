import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition';
const prep=json(root+'/PREPARATION.json'),phase=process.argv[2];
const groups={
 import:[['scripts/import-clinical-review.mjs',prep.atlas]],
 coverage:[['scripts/generate-anatomy-coverage.mjs','--source-root',prep.atlas,'--revision',prep.atlasHead,'--output-root',root+'/coverage']],
 bind:[['scripts/bind-clinical-review.mjs']],
 proof:[['scripts/check-anatomy-coverage.mjs','--source-root',prep.atlas,'--check'],
   ['--test','--test-concurrency=1','--test-reporter=tap',path.resolve('test-atlas-teaching-website-composition-20261022.mjs')]],
 ui:[['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',
   'tests/head-practice-review-commit-controls.test.mjs','tests/head-practice-focused-review-ui.test.ts',
   'tests/head-review-study-set-ui.test.ts','tests/head-practice-review.test.ts','tests/head-practice-review-filters.test.ts',
   'tests/head-practice-focused-review.test.ts','tests/head-practice-commit-lifecycle.test.ts','tests/head-atlas-practice.test.ts',
   'tests/arterial-history-preservation.test.mjs']],
};
// Preserve the failed mixed-delivery check under ui/. This is a separate,
// explicitly UI-only confirmation, not a replacement for release admission.
groups['ui-only']=[groups.ui[0].slice(0,-1)];
assert(groups[phase]);const output=root+'/evidence/'+phase;fs.mkdirSync(output,{recursive:true});const rows=[];
for(const[index,args]of groups[phase].entries()){
 const log=path.join(output,`${index+1}.log`);assert(!fs.existsSync(log));const startedAt=new Date().toISOString();
 const result=spawnSync(process.execPath,['--max-old-space-size=256',...args],{cwd:prep.website,windowsHide:true,encoding:'utf8',maxBuffer:32e6,
  env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
 const raw=(result.stdout??'')+(result.stderr??'')+(result.error?'\n'+String(result.error):'');fs.writeFileSync(log,raw,{flag:'wx'});
 rows.push({command:[process.execPath,'--max-old-space-size=256',...args],startedAt,finishedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal,log,logSha256:sha(raw)});
 console.log(JSON.stringify(rows.at(-1)));if(result.status!==0){console.log(raw.slice(-9000));break;}
}
const result={at:new Date().toISOString(),phase,website:prep.website,atlas:prep.atlas,atlasHead:prep.atlasHead,checks:rows,success:rows.length===groups[phase].length&&rows.every(r=>r.exitCode===0),previewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(output+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});if(!result.success)process.exitCode=1;
