import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-final',sourcePath=root+'/SOURCE.json';
assert.equal(hash(sourcePath),'c0c16e3aeee38b41e1796237be9c8d0bc24ad651965803b4913d0996c9c6b75c');
const source=json(sourcePath),verify=()=>{for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);};
const dir=root+'/light-checks';assert(!fs.existsSync(dir));verify();fs.mkdirSync(dir);
// These three roots only inspect source/fixtures; they do not invoke bundlers,
// the website test runner, browsers, generation or builds. Heavy jobs retain
// their unchanged 4096 MiB admission guard.
const roots=['tests/head-filtered-layout.test.mjs','tests/complete-release-followup-preservation.test.mjs','tests/complete-release-five-followups-preservation.test.mjs'];
const args=['--max-old-space-size=64','--test','--test-concurrency=1','--test-reporter=tap',...roots];
const run=spawnSync(process.execPath,args,{cwd:source.website,windowsHide:true,encoding:'utf8',maxBuffer:1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=64',TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(dir+'/stdout.log',run.stdout??'',{flag:'wx'});fs.writeFileSync(dir+'/stderr.log',run.stderr??'',{flag:'wx'});verify();
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...(run.stdout??'').matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,key);counts[key]=Number(matches[0][1]);}
const passed=run.status===0&&!run.signal&&!run.error&&counts.tests>0&&counts.tests===counts.pass&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
const result={at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},args,status:run.status,signal:run.signal,error:run.error?.message??null,counts,passed,sourceUnchanged:true,wholeSuitePassing:false,installed:false,stdout:{path:dir+'/stdout.log',sha256:hash(dir+'/stdout.log')},stderr:{path:dir+'/stderr.log',sha256:hash(dir+'/stderr.log')}};
fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));process.exitCode=passed?0:1;
