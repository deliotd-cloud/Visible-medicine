import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {nativeCounts} from 'file:///F:/VisibleMedicine/staging/20261022-release-chunked-runner/scripts/website-test-chunks.mjs';
import {sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-release-chunked-runner/main-review';
const run=spawnSync(process.execPath,['--test','--test-reporter=spec','--test-reporter-destination=stdout','--test-reporter=tap','--test-reporter-destination='+stage+'/nested.tap',stage+'/nested-fixture.mjs'],{windowsHide:true,encoding:'utf8'});
fs.writeFileSync(stage+'/nested.spec.log',run.stdout,{flag:'wx'});fs.writeFileSync(stage+'/nested.stderr.log',run.stderr,{flag:'wx'});
let counts,error;try{counts=nativeCounts(fs.readFileSync(stage+'/nested.tap','utf8'),run.stdout);}catch(e){error=e.message;}
const result={at:new Date().toISOString(),exit:run.status,counts,error,tapSha256:sha(fs.readFileSync(stage+'/nested.tap')),specSha256:sha(run.stdout)};
fs.writeFileSync(stage+'/NATIVE_NESTED_PROBE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
