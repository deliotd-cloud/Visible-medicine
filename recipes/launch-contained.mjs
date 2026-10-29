import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {finished} from 'node:stream/promises';
import {createHash} from 'node:crypto';
const buffer=Buffer.alloc(65536);
function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const json=file=>JSON.parse(fs.readFileSync(file));
assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--verify-only'),'Only the optional --verify-only argument is supported');
function memoryGate(minimum) {
 const m=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
 assert(Number.isFinite(m?.AvailableMBytes)&&Number.isFinite(m?.PercentCommittedBytesInUse),'Memory telemetry unavailable');
 if(m.AvailableMBytes<minimum||m.PercentCommittedBytesInUse>90)throw Object.assign(new Error('Generator memory admission refused'),{memory:m,minimum,admissionRefused:true});
 return m;
}
function durationPlan({command,maxMinutes=30}) {
 assert.equal(typeof command,'string');assert(command.length>0);
 assert(Number.isSafeInteger(maxMinutes)&&maxMinutes>=1&&maxMinutes<=180,'maxMinutes must be an integer from 1 to 180');
 return {command,maxMinutes};
}
async function guarded({site,dir,command,heap=384,aggregate=1024,minimum=3072,extraEnv={},maxMinutes=10}){
 ({command,maxMinutes}=durationPlan({command,maxMinutes}));
 assert.equal(hash('C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs'),'502efcbb1d5cd629fe54c7094dc5ec3fd96adba019f67389f2c110ce54801755');
 assert.equal(hash('C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/seal-simple-website-successor.mjs'),'8e15dcfed86a8c97ed6ed558b891908acfef767c05a80947361876ad82b2d0c7');
 assert.equal(hash('C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/native-website-integration-stage-20261025.mjs'),'6d090826c5c74de71e9f3da52622397ce18ea461a8587b3d3cd1de6516ee3186');
 assert(site.replaceAll('\\','/').startsWith('G:/VisibleMedicine-temp/staging/'));assert(dir.replaceAll('\\','/').startsWith('G:/VisibleMedicine-temp/'));assert(json('C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/CURRENT_CHECKPOINT.json').activeWork.current.currentCapacityDecision.useGAuthorized);
 const disk=fs.statfsSync('G:/');assert(disk.bavail*disk.bsize>=384*1048576,'Full suite needs384MiB free disk before launch');
 const memory=memoryGate(minimum);assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
 const save=(p,v)=>fs.writeFileSync(dir+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
 const base='F:/VisibleMedicine/staging/20261025-wave4-memory-repro-v2-proposal/supervise.ps1';
 assert.equal(hash(base),'1239eab31096552e7f78b508b58b873ea85d1bb3d8f3ee8ac4e4cfe7039bd2ee');
 let supervisor=fs.readFileSync(base,'utf8');function change(a,b){assert.equal(supervisor.split(a).length,2,a);supervisor=supervisor.replace(a,b);}
 change('scripts/run-website-tests.mjs --run',command);
 change("command=@('node.exe','scripts/run-website-tests.mjs','--run')",'command='+JSON.stringify(['node.exe',...command.split(' ')]));
 // PowerShell accepts an array literal here, not JSON.
 supervisor=supervisor.replace('command='+JSON.stringify(['node.exe',...command.split(' ')]),"command=@("+['node.exe',...command.split(' ')].map(x=>"'"+x+"'").join(',')+")");
 change("$_.CommandLine -match 'run-website-tests\\.mjs'","$_.CommandLine -match 'scripts[/\\\\]run-website-tests[.]mjs|types-full-attempt-1[/\\\\]checker[.]mjs|build-attempt-1[/\\\\]checker[.]mjs|scripts[/\\\\](?:build-clinical-review-viewer|regional-teaching-snapshots|generate-body-review-display-pins|review-revisions|body-renderer-revisions|generate-nested-review-bindings)[.]mjs'");
 change('An existing stock runner is active; leave it alone and do not launch another','An existing broad runner/type checker/build is active; leave it alone and do not duplicate');
 change("$m=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory", "$m=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory\n if($null -eq $m -or $null -eq $m.AvailableMBytes -or $null -eq $m.PercentCommittedBytesInUse){throw 'Memory telemetry unavailable'}");
 change("$before=Observe-Memory", "$before=Observe-Memory\nif([System.IO.DriveInfo]::new('G:\\').AvailableFreeSpace -lt 402653184){throw 'Disk preflight refused: need384MiB free on G'}");
 change("  if($m.commitPercent -gt 90", "  $diskFree=[System.IO.DriveInfo]::new('G:\\').AvailableFreeSpace\n  @{at=$m.at;freeBytes=$diskFree}|ConvertTo-Json -Compress|Add-Content -LiteralPath \"$($c.evidence)/storage.jsonl\"\n  if($diskFree -lt 268435456){$reason='disk-resource-stop';$job.Stop();break}\n  if($m.commitPercent -gt 90");
 if(aggregate!==2048){assert.equal(aggregate,1024);change('2UL*1024UL*1024UL*1024UL',String(aggregate)+'UL*1024UL*1024UL');change('jobMemoryMiB=2048','jobMemoryMiB='+aggregate);}
 if(minimum!==4096){assert.equal(minimum,3072);change('$before.availableMiB -lt 4096','$before.availableMiB -lt '+minimum);change('require available >=4096 MiB','require available >='+minimum+' MiB');}
 assert(minimum>=aggregate+2048,'Admit the complete maximum job plus the unchanged2GiB free reserve');
 fs.writeFileSync(dir+'/supervise.ps1',supervisor,{flag:'wx'});
 const parsed=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-File','G:/VisibleMedicine-temp/staging/20261029-mandible-combined-generation/parse-supervisor.ps1','-Path',dir+'/supervise.ps1'],{encoding:'utf8',windowsHide:true});save('SUPERVISOR_SYNTAX.json',JSON.parse(parsed));
 const envBase=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(k)));
 const environment={...envBase,NODE_OPTIONS:'--max-old-space-size='+heap,GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1',NO_COLOR:'1',WRANGLER_SEND_METRICS:'false',NEXT_TELEMETRY_DISABLED:'1',...extraEnv};
 save('CONFIGURATION.json',{node:process.execPath,site,evidence:dir,environment,maxMinutes});
 save('PREPARATION.json',{at:new Date().toISOString(),memory,baseSupervisorSha256:hash(base),supervisorSha256:hash(dir+'/supervise.ps1'),command,maxMinutes,heapMiB:heap,aggregateNativeJobMiB:aggregate,minimumFreeMiB:minimum,minimumDiskMiB:384,reserveDiskMiB:256,diskVolume:"G:",freeFloorMiB:2048,commitCeilingPercent:90,killOnCloseSuspendedAssignResumeUnchanged:true,ownerPreviewChanged:false});
 const out=fs.createWriteStream(dir+'/supervisor.stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/supervisor.stderr.log',{flags:'wx'});
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',dir+'/supervise.ps1','-Configuration',dir+'/CONFIGURATION.json'],{env:envBase,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 save('SUPERVISOR-HANDLE.json',{at:new Date().toISOString(),pid:child.pid,parentPid:process.pid});console.log(JSON.stringify({started:true,supervisorPid:child.pid,evidence:dir}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([finished(out),finished(err)]);
 const terminal=fs.existsSync(dir+'/PROCESS-TERMINAL.json')?json(dir+'/PROCESS-TERMINAL.json'):null;
 return {supervisor:result,process:terminal,passing:result.code===0&&!result.error&&!result.signal&&terminal?.terminalObserved&&!terminal.interrupted&&terminal.exitCode===0};
}


import path from 'node:path';
import {createRequire} from 'node:module';
const stage='G:/VisibleMedicine-temp/staging/20261029-mandible-combined-native',site=stage+'/atlas';
const root='G:/VisibleMedicine-temp/staging/20261029-mandible-combined-generation';
// Record this launch's terminal status without keeping an extra shell or Node
// wrapper alive. Source checks, native job limits and admission are unchanged.
const launchStartedAt=new Date().toISOString();
const launchTerminal=root+'/LAUNCH_TERMINAL-'+Date.now()+'-'+process.pid+'.json';
process.once('exit',code=>fs.writeFileSync(launchTerminal,JSON.stringify({schema:'vm-generator-launch-terminal/1',pid:process.pid,mode:process.argv[2]==='--verify-only'?'verify-only':'generate',startedAt:launchStartedAt,endedAt:new Date().toISOString(),exitCode:code,profile:process.argv[1],profileSha256:hash(process.argv[1])},null,2)+'\n',{flag:'wx'}));

const save=(p,v)=>fs.writeFileSync(root+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash('G:/VisibleMedicine-temp/staging/20261029-mandible-combined-generation/parse-supervisor.ps1'),'d4461f174b8b0388087eb06185f634016d61c27d24ffeb4a20c9abeaf3d23e8f');
assert.equal(hash(stage+'/PREPARATION.json'),'5e9a87958998c7b6f386d7d1c789e0c0ed9a3a70b8de135b4fc1f1c1e4b71fcf');
const source=json(stage+'/PREPARATION.json');assert.equal(hash(source.parent.path),source.parent.sha256);
const parent=json(source.parent.path),expected=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));
for(const r of source.changes){assert.equal(expected.get(r.path)??null,r.beforeSha256);expected.set(r.path,r.sha256);}
assert.equal(expected.size,6500);assert.deepEqual([...expected].sort(([a],[b])=>a.localeCompare(b)),source.sourceRows.map(r=>[r.path,r.sha256]).sort(([a],[b])=>a.localeCompare(b)));
const commands=[
 ['regional-write','scripts/regional-teaching-snapshots.mjs'],['regional-check','scripts/regional-teaching-snapshots.mjs --check'],
 ['display-write','scripts/generate-body-review-display-pins.mjs'],['display-check','scripts/generate-body-review-display-pins.mjs --check'],
 ['reviews-write','scripts/review-revisions.mjs'],['reviews-check','scripts/review-revisions.mjs --check'],
 ['renderer-write','scripts/body-renderer-revisions.mjs'],['renderer-check','scripts/body-renderer-revisions.mjs --check'],
 ['nested-write','scripts/generate-nested-review-bindings.mjs'],['nested-check','scripts/generate-nested-review-bindings.mjs --check'],
];
const permitted=new Set([...expected.keys()].filter(p=>p.startsWith('content/regional-teaching/')&&p.endsWith('.json')));
for(const p of ['lib/regional-teaching-imports.ts','content/body-review-display-pins.json','content/review-revisions.json','content/body-renderer-revision.json','content/nested-review-bindings.json'])permitted.add(p);
const pinnedResumeReceipts=Object.freeze([]);
const prior=[];
for(const [attempt,command]of commands){
 const f=root+'/'+attempt+'/RESULT.json';if(!fs.existsSync(f))break;
 const pin=pinnedResumeReceipts.find(r=>r.attempt===attempt);assert(pin&&/^[a-f0-9]{64}$/.test(pin.sha256),'Existing step requires an independently verified resume pin: '+attempt);assert.equal(hash(f),pin.sha256);
 const r=json(f);assert(r.passing&&r.command===command&&r.supervisor?.code===0&&r.process?.terminalObserved&&r.process.exitCode===0&&!r.process.interrupted);
 const seen=new Set();for(const row of r.generated){assert(permitted.has(row.path)&&expected.has(row.path)&&!seen.has(row.path));seen.add(row.path);assert.equal(expected.get(row.path),row.beforeSha256);assert(/^[a-f0-9]{64}$/.test(row.sha256));expected.set(row.path,row.sha256);}prior.push(attempt);
}
function validateRequest({site:requested,command,attempt}){assert.equal(requested,site);assert(commands.some(row=>row[1]===command));assert.match(attempt,/^[a-z][a-z0-9-]{1,63}$/);assert.equal(fs.realpathSync.native(site).replaceAll('\\','/').toLowerCase(),site.toLowerCase());return{site,command,dir:root+'/'+attempt};}
for(const[,command]of commands)validateRequest({site,command,attempt:'scope-check'});
for(const command of ['scripts/build-clinical-review-viewer.mjs','scripts/run-website-tests.mjs --run','scripts/regional-teaching-snapshots.mjs; whoami'])assert.throws(()=>validateRequest({site,command,attempt:'bad-command'}));
assert.throws(()=>validateRequest({site:'F:/VisibleMedicine/atlas',command:commands[0][1],attempt:'bad-site'}));assert.throws(()=>validateRequest({site,command:commands[0][1],attempt:'../../escape'}));
function verifySource(){for(const[p,h]of expected){const file=site+'/'+p;assert.equal(fs.realpathSync.native(file).toLowerCase(),path.resolve(file).toLowerCase(),'Source escape: '+p);assert.equal(hash(file),h,p);}const extra=execFileSync('git',['-C',site,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert(extra.every(p=>expected.has(p)),'Unexpected source');}
const req=createRequire(site+'/package.json');
assert.equal(hash('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json'),'cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56');
const pinnedDependencies=json('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json').dependencyFiles;
const deps=[process.execPath,req.resolve('esbuild/package.json'),req.resolve('esbuild'),req.resolve('@esbuild/win32-x64/esbuild.exe'),req.resolve('typescript/package.json'),req.resolve('typescript')].map(p=>({path:fs.realpathSync.native(p),sha256:hash(p)}));assert.deepEqual(deps,pinnedDependencies);
assert(!json(site+'/tsconfig.json').extends);verifySource();
save('ADMISSION-'+Date.now()+'.json',{at:new Date().toISOString(),site,sourcePreparation:{path:stage+'/PREPARATION.json',sha256:hash(stage+'/PREPARATION.json')},sourceFiles:expected.size,dependencyFiles:deps,profileSha256:hash(process.argv[1]),nativeJobMiB:1024,heapMiB:384,minimumMiB:3072,freeFloorMiB:2048,prior,fullBuildPassed:false,installed:false});
console.log(JSON.stringify({verifiedSourceFiles:expected.size,dependencyFiles:deps.length,resumeAfter:prior}));
if(process.argv[2]==='--verify-only'){console.log(JSON.stringify({verified:true,generationStarted:false}));process.exit(0);}
async function run(request){const verified=validateRequest(request),lock=root+'/GENERATOR.lock',fd=fs.openSync(lock,'wx');try{fs.writeSync(fd,JSON.stringify({pid:process.pid,at:new Date().toISOString(),...verified}));fs.fsyncSync(fd);verifySource();for(const d of deps)assert.equal(hash(d.path),d.sha256);return await guarded({...verified,heap:384,aggregate:1024,minimum:3072,maxMinutes:10,extraEnv:{TEMP:root+'/temp',TMP:root+'/temp'}});}finally{fs.closeSync(fd);fs.unlinkSync(lock);}}
for(const[attempt,command]of commands){
 if(prior.includes(attempt))continue;
 let r;try{r=await run({site,attempt,command});}catch(e){save('REFUSAL-'+Date.now()+'.json',{at:new Date().toISOString(),attempt,command,message:e.message,memory:e.memory??null,minimum:e.minimum??null});console.log(JSON.stringify({stopped:true,attempt,message:e.message,memory:e.memory??null}));process.exitCode=75;break;}
 const changes=[];for(const[p,h]of expected){const current=hash(site+'/'+p);if(current!==h){assert(permitted.has(p),'Unexpected generator write: '+p);changes.push({path:p,beforeSha256:h,sha256:current,bytes:fs.statSync(site+'/'+p).size});}}
 const extra=execFileSync('git',['-C',site,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert(extra.every(p=>expected.has(p)));
 save(attempt+'/RESULT.json',{...r,at:new Date().toISOString(),command,generated:changes,fullBuildPassed:false,installed:false});console.log(JSON.stringify({attempt,passing:r.passing,changedFiles:changes.length,exit:r.process?.exitCode}));if(!r.passing){process.exitCode=1;break;}for(const row of changes)expected.set(row.path,row.sha256);
}
