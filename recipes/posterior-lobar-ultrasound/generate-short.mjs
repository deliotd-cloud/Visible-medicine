import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us',site=root+'/atlas',baseline=json(root+'/BASELINE.json');
assert.equal(hash(root+'/BASELINE.json'),'1ed34e1e50535c126fdf24bf33cc5b6d5a739fc2fc29726daadcc349de6ee083');
assert.equal(hash(site+'/content/cerebral-lobar-imaging.ts'),'44d14e43fe2c3b3bd07cac9d25d9379e144deeb54f602ccc5e4ec678b73e646b');
const available=()=>Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[math]::Round((Get-Counter '\\Memory\\Available MBytes').CounterSamples.CookedValue)"],{encoding:'utf8',windowsHide:true}).trim());
const commands=[['scripts/pin-nested-teaching.mjs','--check'],['scripts/generate-nested-review-bindings.mjs','--check'],['scripts/review-revisions.mjs','--check'],['scripts/body-renderer-revisions.mjs'],['scripts/body-renderer-revisions.mjs','--check'],['scripts/regional-teaching-snapshots.mjs','--check']];
const results=[];
for(const [index,args] of commands.entries()){
 const free=available();if(free<4096){results.push({args,launched:false,availableMiB:free,requiredMiB:4096});break;}
 const run=spawnSync(process.execPath,['--max-old-space-size=384','--import','tsx',...args],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_ROOT:site}});
 const log=root+'/GEN-SHORT-'+(index+1)+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});
 results.push({args,launched:true,availableMiB:free,heapMiB:384,status:run.status,signal:run.signal,error:run.error?.message??null,log:{path:log,sha256:hash(log)}});
 console.log(JSON.stringify({step:index+1,status:run.status,script:args[0]}));if(run.status!==0||run.signal||run.error)break;
}
for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256,row.path);
const passed=results.length===commands.length&&results.every(r=>r.launched&&r.status===0&&!r.signal&&!r.error);
fs.writeFileSync(root+'/GENERATION-SHORT.json',JSON.stringify({at:new Date().toISOString(),passed,results,parentUnchanged:true,canonicalUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});if(!passed)process.exitCode=1;
