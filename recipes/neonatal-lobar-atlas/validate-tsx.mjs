import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',site=root+'/atlas',baseline=json(root+'/BASELINE.json');
assert.equal(hash(root+'/BASELINE.json'),'6ecf989740821d2e6247020a0018daf9ae89590435656667f293b6a18485cf60');
const freeMiB=()=>Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1024)'],{encoding:'utf8',windowsHide:true}).trim());
const commands=[['scripts/pin-nested-teaching.mjs','--check'],['scripts/generate-nested-review-bindings.mjs','--check'],['scripts/review-revisions.mjs','--check'],['scripts/body-renderer-revisions.mjs'],['scripts/body-renderer-revisions.mjs','--check'],['scripts/regional-teaching-snapshots.mjs','--check'],['scripts/validate-cerebral-lobar-imaging.mjs'],['scripts/validate-nested-teaching.mjs'],['scripts/validate-nested-review.mjs'],['scripts/validate-hippocampal-teaching.mjs']];
const results=[],at=new Date().toISOString(),beforeRenderer=hash(site+'/content/body-renderer-revision.json');
for(const [i,args]of commands.entries()){
 const available=freeMiB();if(available<4096){results.push({args,launched:false,availableMiB:available,requiredMiB:4096});break;}
 const run=spawnSync(process.execPath,['--max-old-space-size=384','--import','tsx',...args],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024,
  env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_ROOT:site}});
 const log=root+'/CHECK-TSX-'+String(i+1).padStart(2,'0')+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});
 const result={args,launched:true,availableMiB:available,heapMiB:384,status:run.status,signal:run.signal,error:run.error?.message??null,log:{path:log,sha256:hash(log)}};results.push(result);console.log(JSON.stringify({step:i+1,status:run.status,script:args[0]}));if(run.status!==0||run.signal||run.error)break;
}
for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256,'Canonical source changed: '+row.path);
const changed=baseline.sourceRows.filter(row=>hash(site+'/'+row.path)!==row.sha256).map(row=>({path:row.path,beforeSha256:row.sha256,sha256:hash(site+'/'+row.path)}));
const allowed=['content/cerebral-lobar-imaging.ts','content/body-renderer-revision.json','scripts/cerebral-lobar-imaging-history.mjs','scripts/validate-cerebral-lobar-imaging.mjs','scripts/validate-nested-teaching.mjs'];
for(const row of changed)assert(allowed.includes(row.path),'Unexpected change: '+row.path);
const passed=results.length===commands.length&&results.every(r=>r.launched&&r.status===0&&!r.signal&&!r.error);
const result={at,passed,runtimeLoader:"tsx (existing dependency; native Node extensionless TS resolution failed before assertions)",results,changed,beforeRenderer,afterRenderer:hash(site+'/content/body-renderer-revision.json'),canonicalUnchanged:true,fullBuildPassed:false,wholeSuitePassing:false,installed:false,clinicalApproval:false};
fs.writeFileSync(root+'/VALIDATION-TSX.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed,steps:results.length,changed:changed.map(r=>r.path)}));if(!passed)process.exitCode=1;
