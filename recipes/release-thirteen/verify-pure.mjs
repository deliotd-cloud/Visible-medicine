import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs',source=json(root+'/SOURCE.json');
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);};verify();
const tests=['body-learning-current-admission.test.mjs','current-head-index-whole-role-transition-20261021.test.mjs','elbow-current-lifecycle-preservation.test.mjs','head-linked-expansion.test.mjs','tour-playback-source-role-inverse.test.mjs','studio-history-proof-current.test.mjs','local-font-distribution.test.mjs'];
const args=['--max-old-space-size=64','--test','--test-concurrency=1','--test-reporter=tap',...tests.map(p=>'tests/'+p)];
const result=spawnSync(process.execPath,args,{cwd:source.website,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=64',VM_WEBSITE_ROOT:source.website,TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(root+'/PURE_CHECKS.tap',(result.stdout??'')+(result.stderr??''),{flag:'wx'});verify();
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const rows=[...(result.stdout??'').matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];counts[key]=rows.length===1?Number(rows[0][1]):null;}
const passing=result.status===0&&!result.signal&&!result.error&&counts.tests===31&&counts.pass===31&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
const evidence={at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},args,heapMiB:64,counts,status:result.status,signal:result.signal,error:result.error?.message??null,log:{path:root+'/PURE_CHECKS.tap',sha256:hash(root+'/PURE_CHECKS.tap')},sourceUnchanged:true,passing,fullPartitionRun:false,installed:false};
fs.writeFileSync(root+'/PURE_CHECKS.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing,counts,status:result.status}));process.exitCode=passing?0:1;
