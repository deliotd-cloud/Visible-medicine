import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {hash, json} from './bounded-source-hash-20261026.mjs';
const atlas = 'F:/VisibleMedicine/staging/20261026-quick-check-focus-native/atlas';
const stage = 'F:/VisibleMedicine/staging/20261026-spine-hand-teaching-audit';
const git = (...args) => execFileSync('git', ['-C', atlas, ...args], {encoding:'utf8', windowsHide:true}).trim();
const head = '643fd47491a41a0207f106806c17035cb938048b';
assert.equal(git('rev-parse','HEAD'), head);
assert.equal(git('status','--porcelain'), '');
const output = stage + '/CURRENT_ROOT_REPORT.json';
assert(!fs.existsSync(output));
const started = new Date().toISOString();
const result = spawnSync(process.execPath, ['--max-old-space-size=256','scripts/report-teaching-gaps.mjs','--limit=1000'], {
  cwd: atlas, windowsHide:true, timeout:60000, maxBuffer:8e6,
  env:{...process.env,GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_OPTIONAL_LOCKS:'0'}
});
fs.writeFileSync(output,result.stdout ?? '',{flag:'wx'});
fs.writeFileSync(stage+'/CURRENT_ROOT_REPORT.stderr.log',result.stderr ?? '',{flag:'wx'});
const receipt = {started,finished:new Date().toISOString(),status:result.status,signal:result.signal,error:result.error?.message,
  source:head,sourceUnchanged:git('rev-parse','HEAD')===head && git('status','--porcelain')==='',output:{path:output,sha256:hash(output)}};
fs.writeFileSync(stage+'/CURRENT_ROOT_RUN.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
assert.equal(result.status,0); assert(receipt.sourceUnchanged);
const report=json(output); assert.equal(report.evidence.workingTreeDirty,false);
console.log(JSON.stringify({receipt:stage+'/CURRENT_ROOT_RUN.json',structures:report.structureCount,totals:report.totals,byTopic:report.byTopic}));
