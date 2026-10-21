import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-arterial-history-epoch-proposal';
const prep=json(stage+'/PREPARATION.json');
const guard='tests/arterial-history-preservation.test.mjs';
assert.equal(sha(read(stage+'/'+guard)),'df883d11222ff04c055769a7f6eca5526e0bbf16031cd5e974e2585aa4ee8fb4');
const files=[guard,...prep.copies.filter(r=>r.path.startsWith('tests/')).map(r=>r.path)];
const outcomes=[];
for(const [name,mutate,message]of [
 ['subject-drift','tests/atlas-arterial-evidence-limits.test.mjs','Exact current arterial whole-test bytes'],
 ['original-drift','tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt','Exact frozen original whole-test bytes'],
]){
 const root=stage+'/negative-'+name;assert(!fs.existsSync(root));fs.mkdirSync(root);
 for(const p of files){const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});const b=read(stage+'/'+p);
  fs.writeFileSync(to,p===mutate?Buffer.concat([b,Buffer.from('\n')]):b,{flag:'wx'});}
 const env={...process.env,NODE_OPTIONS:'--max-old-space-size=256'};delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--test','--test-reporter=tap',guard],{cwd:root,env,windowsHide:true,encoding:'utf8',maxBuffer:1e6});
 assert.equal(run.status,1,name);const log=run.stdout+run.stderr;assert(log.includes(message));
 const footer=new Map([...log.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$/gm)].map(([,k,v])=>[k,Number(v)]));
 assert.deepEqual(Object.fromEntries(footer),{tests:1,pass:0,fail:1,cancelled:0,skipped:0,todo:0});
 fs.writeFileSync(root+'/EXPECTED_REFUSAL.log',log,{flag:'wx'});
 outcomes.push({name,expectedRefusal:true,childStatus:run.status,footer:Object.fromEntries(footer),logSha256:sha(Buffer.from(log))});
}
const result={at:new Date().toISOString(),scope:'Isolated tiny history guard only; not the seven integrated arterial registrations or complete suite',
 outcomes,candidateEdited:false,canonicalEdited:false,sourceFilesReadOnly:true,privateDataCopied:false};
fs.writeFileSync(stage+'/NEGATIVE_GUARD_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
