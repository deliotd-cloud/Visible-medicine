import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-neonatal-current-epoch',prep=json(stage+'/PREPARATION.json'),phase=process.argv[2];
const support=['tests/cranial-tour-current-epoch.test.mjs','tests/neonatal-inbox-contexts.test.mjs'];
const feature=['tests/clinical-review-neonatal-cranial-us.test.ts'];
const entries={support,'support-v2':support,feature,inbox:feature,'inbox-v2':feature,'inbox-v3':feature,'inbox-v4':feature,'inbox-budget-256':feature,'inbox-budget-256-v2':feature,'anatomy-budget-256':feature,'anatomy-budget-256-v2':feature};assert(entries[phase]);
const files=['tests/clinical-review-neonatal-cranial-us.test.ts','tests/cranial-tour-current-epoch.mjs','tests/cranial-tour-current-epoch.test.mjs','tests/neonatal-inbox-contexts.mjs','tests/neonatal-inbox-contexts.test.mjs','tests/atlas-emitted-teaching.ts'];
const rows=files.map(path=>({path,sha256:sha(read(prep.website+'/'+path))}));
const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const heap=phase.includes('budget-256')?256:128;
let budgetEvidence;
if(heap===256){
 const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
 budgetEvidence=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"$vmOs=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{freePhysicalKiB=$vmOs.FreePhysicalMemory;freeCommitKiB=$vmOs.FreeVirtualMemory;fFreeBytes=(Get-PSDrive F).Free}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
 assert(budgetEvidence.freeCommitKiB>8*1024*1024&&budgetEvidence.fFreeBytes>1024**3);fs.mkdirSync(dir+'/memory');
}
const args=['--max-old-space-size='+heap,...(heap===256?['--import',pathToFileURL(prep.website+'/tests/neonatal-native-memory.mjs').href]:[]),'--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',...(phase.startsWith('inbox')?['--test-name-pattern=private inbox shows ten new teaching revisions']:phase.startsWith('anatomy')?['--test-name-pattern=ten exact infant cranial Ultrasound drafts']:[]),...entries[phase]];
fs.writeFileSync(dir+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),args,cwd:prep.website,rows,heapMiB:heap,budgetEvidence,reason:heap===256?'Measured bounded functional verification of the legacy source/history or all-inbox fixture after retention diagnosis; not a128MiB pass or live application performance result':undefined,previewChanged:false},null,2)+'\n',{flag:'wx'});
const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
const r=spawnSync(process.execPath,args,{cwd:prep.website,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas,NODE_OPTIONS:'--max-old-space-size='+heap,...(heap===256?{VM_NEONATAL_MEMORY_DIR:dir+'/memory'}:{}),RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err]});fs.closeSync(out);fs.closeSync(err);
const stdout=read(dir+'/stdout.log'),stderr=read(dir+'/stderr.log');
const counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(stdout.toString().match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
const t={at:new Date().toISOString(),phase,exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,rows,counts,resourceFailure:/heap out of memory|Reached heap limit/i.test(stdout+'\n'+stderr),stdoutSha256:sha(stdout),stderrSha256:sha(stderr),previewChanged:false,productChanged:false};
fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(t,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase,exitCode:r.status,counts,resourceFailure:t.resourceFailure}));process.exitCode=r.status===0?0:1;
