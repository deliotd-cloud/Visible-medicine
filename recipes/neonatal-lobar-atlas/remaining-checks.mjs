import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',site=root+'/atlas';
const baseline=json(root+'/BASELINE.json');
const commands=['scripts/validate-nested-review.mjs','scripts/validate-hippocampal-teaching.mjs'];
const results=[];
for(const [i,script] of commands.entries()){
 const resultPath=root+'/REMAINING-'+i+'.json';
 if(fs.existsSync(resultPath)){
  const saved=json(resultPath);assert(saved.status===0&&saved.sourceSha256===hash(site+'/'+script));results.push(saved);continue;
 }
 const available=Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1024)'],{encoding:'utf8',windowsHide:true}).trim());
 if(available<4096){console.log(JSON.stringify({deferred:script,availableMiB:available,requiredMiB:4096}));process.exitCode=2;break;}
 const sourceSha256=hash(site+'/'+script);
 const run=spawnSync(process.execPath,['--max-old-space-size=384','--import','tsx',script],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024,
  env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_ROOT:site}});
 const log=root+'/REMAINING-'+i+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});
 const result={at:new Date().toISOString(),script,sourceSha256,availableMiB:available,heapMiB:384,status:run.status,signal:run.signal,error:run.error?.message??null,log:{path:log,sha256:hash(log)}};
 fs.writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push(result);console.log(JSON.stringify({script,status:run.status}));
 if(run.status!==0||run.signal||run.error){process.exitCode=1;break;}
}
for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256,'Canonical source changed: '+row.path);
if(results.length===2&&results.every(r=>r.status===0&&!r.signal&&!r.error)){
 const out={at:new Date().toISOString(),passed:true,results,canonicalUnchanged:true,installed:false,clinicalApproval:false};
 fs.writeFileSync(root+'/REMAINING.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
}
