import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-learner-checks';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const runs=[];
for(const[name,args]of [
 ['before',['render.mjs','before']],['after',['render.mjs','after']],
 ['tests',['--test','--test-reporter=tap','verify.test.mjs']],
]){
 const result=spawnSync(process.execPath,['--max-old-space-size=512',...args],{cwd:own,encoding:'utf8',windowsHide:true,maxBuffer:2e6});
 const log=Buffer.from((result.stdout??'')+(result.stderr??''));
 fs.writeFileSync(own+'/evidence/'+name+'.log',log,{flag:'wx'});
 const terminal={name,at:new Date().toISOString(),status:result.status,signal:result.signal,error:result.error?String(result.error):null,logSha256:hash(log)};
 fs.writeFileSync(own+'/evidence/'+name+'-terminal.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
 assert.equal(result.status,0,name+' failed; preserve evidence');assert(!result.signal&&!result.error);runs.push(terminal);
}
const totals=Object.fromEntries([...fs.readFileSync(own+'/evidence/tests.log','utf8').matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(([,k,v])=>[k,Number(v)]));
assert.deepEqual(totals,{tests:6,pass:6,fail:0,cancelled:0,skipped:0,todo:0});
const result={at:new Date().toISOString(),runs,totals,actualComponent:true,browserVerified:false,fullTypes:false,build:false,installed:false};
fs.writeFileSync(own+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
