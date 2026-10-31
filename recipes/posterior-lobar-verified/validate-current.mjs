import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us',site=root+'/atlas';
const ref=p=>({path:p,sha256:hash(p)});
assert(json(root+'/GENERATION-THIRD.json').passed);
assert.equal(hash(site+'/content/cerebral-lobar-imaging.ts'),'44d14e43fe2c3b3bd07cac9d25d9379e144deeb54f602ccc5e4ec678b73e646b');
const sourcePaths=['content/cerebral-lobar-imaging.ts','content/body-renderer-revision.json','scripts/cerebral-lobar-imaging-history.mjs','scripts/test-neonatal-lobar-ultrasound-history.mjs','scripts/validate-cerebral-lobar-imaging.mjs','scripts/validate-nested-teaching.mjs'];
const source=sourcePaths.map(p=>ref(site+'/'+p));
const verify=()=>source.forEach(r=>assert.equal(hash(r.path),r.sha256));
const available=()=>Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[math]::Round((Get-Counter '\\Memory\\Available MBytes').CounterSamples.CookedValue)"],{encoding:'utf8',windowsHide:true}).trim());
const scripts=['scripts/test-neonatal-lobar-ultrasound-history.mjs','scripts/validate-cerebral-lobar-imaging.mjs','scripts/validate-nested-teaching.mjs','scripts/validate-nested-review.mjs',root+'/review-impact.mjs'];
const results=[];
for(const [i,script] of scripts.entries()){
 verify();
 const resultPath=root+'/FULL-CHECK-'+i+'.json';
 if(fs.existsSync(resultPath)){
  const saved=json(resultPath);assert.equal(saved.status,0);assert.deepEqual(saved.source,source);assert.equal(hash(saved.log.path),saved.log.sha256);results.push(saved);continue;
 }
 const free=available();if(free<4096){console.log(JSON.stringify({deferred:script,availableMiB:free,requiredMiB:4096}));process.exitCode=2;break;}
 const run=spawnSync(process.execPath,['--max-old-space-size=384','--import','tsx',script],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',TEMP:root+'/tmp',TMP:root+'/tmp',VM_ATLAS_SOURCE_ROOT:site}});
 const log=root+'/FULL-CHECK-'+i+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});verify();
 const result={at:new Date().toISOString(),script,source,availableMiB:free,heapMiB:384,status:run.status,signal:run.signal,error:run.error?.message??null,log:ref(log)};
 fs.writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push(result);console.log(JSON.stringify({script,status:run.status}));
 if(run.status!==0||run.signal||run.error){process.exitCode=1;break;}
}
if(results.length===scripts.length&&results.every(r=>r.status===0&&!r.signal&&!r.error)){
 const baseline=json(root+'/BASELINE.json');for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256,row.path);
 const out={at:new Date().toISOString(),passed:true,source,results,parentUnchanged:true,installed:false,clinicalApproval:false};
 fs.writeFileSync(root+'/FULL_VALIDATION.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,checks:results.length,reviewImpact:ref(root+'/REVIEW_IMPACT.json')}));
}
