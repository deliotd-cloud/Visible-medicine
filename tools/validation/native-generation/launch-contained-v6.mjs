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
 const parsed=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-File','G:/VisibleMedicine-temp/staging/20261029-native-successor-generation/parse-supervisor.ps1','-Path',dir+'/supervise.ps1'],{encoding:'utf8',windowsHide:true});save('SUPERVISOR_SYNTAX.json',JSON.parse(parsed));
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

const exactSite='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor/atlas';
const evidenceRoot='G:/VisibleMedicine-temp/staging/20261029-native-successor-generation';
const allowedCommands=Object.freeze([
 'scripts/regional-teaching-snapshots.mjs',
 'scripts/regional-teaching-snapshots.mjs --check',
 'scripts/generate-body-review-display-pins.mjs',
 'scripts/generate-body-review-display-pins.mjs --check',
 'scripts/review-revisions.mjs',
 'scripts/review-revisions.mjs --check',
 'scripts/body-renderer-revisions.mjs',
 'scripts/body-renderer-revisions.mjs --check',
 'scripts/generate-nested-review-bindings.mjs',
 'scripts/generate-nested-review-bindings.mjs --check',
]);
function validateRequest({site,command,attempt}) {
 assert.equal(site,exactSite,'Only the isolated teaching candidate is admitted');
 assert(allowedCommands.includes(command),'Only exact stock generator tuples are admitted');
 assert.match(attempt,/^[a-z][a-z0-9-]{1,63}$/);
 assert.equal(fs.realpathSync.native(site).replaceAll('\\','/').toLowerCase(),site.toLowerCase(),'Candidate must not escape through a junction');
 return {site,command,dir:evidenceRoot+'/'+attempt};
}
async function guardedGenerator(request) {
 const verified=validateRequest(request);
 const lock=evidenceRoot+'/GENERATOR.lock';
 const fd=fs.openSync(lock,'wx');
 try {
  fs.writeSync(fd,JSON.stringify({pid:process.pid,at:new Date().toISOString(),...verified}));fs.fsyncSync(fd);
  verifySource();for(const d of pinnedDependencies)assert.equal(hash(d.path),d.sha256,d.path);
  return await guarded({...verified,heap:384,aggregate:1024,minimum:3072,maxMinutes:10,
   extraEnv:{TEMP:evidenceRoot+'/temp',TMP:evidenceRoot+'/temp'}});
 } finally {fs.closeSync(fd);fs.unlinkSync(lock);}
}

import path from 'node:path';
import {createRequire} from 'node:module';
const stage='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor';
const site=stage+'/atlas',root='G:/VisibleMedicine-temp/staging/20261029-native-successor-generation';
const save=(p,v)=>fs.writeFileSync(root+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash(stage+'/PREPARATION.json'),'f1ae317be0b5b862225f47eb1907cdc0378f4a6891e4c779ff0b38b13e1f15ee','Exact independently verified successor preparation');
assert.equal(hash(root+'/parse-supervisor.ps1'),'d17c4bea3a7a44315d166aa6c2c79971a56bb2999a81381f78b5f52dda14f0c7','Exact parser source');
const source=json(stage+'/PREPARATION.json');assert.equal(hash(source.parent.path),source.parent.sha256);
const parent=json(source.parent.path),expected=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));
for(const r of source.changes)expected.set(r.path,r.sha256);
assert.equal(expected.size,6484);
assert.equal(new Set(source.sourceRows.map(r=>r.path)).size,6484);
assert.deepEqual([...expected].sort(([a],[b])=>a.localeCompare(b)),source.sourceRows.map(r=>[r.path,r.sha256]).sort(([a],[b])=>a.localeCompare(b)),'Complete successor manifest accounting');
assert.equal(expected.get("scripts/regional-teaching-snapshots.mjs"),"38c74f4dc3d1ef6e95030c34d00b046b15ace38e928d7e42d8a7772920cae316");
const commands=[
 ['regional-write','scripts/regional-teaching-snapshots.mjs'],
 ['regional-check','scripts/regional-teaching-snapshots.mjs --check'],
 ['display-write-v6','scripts/generate-body-review-display-pins.mjs'],
 ['display-check-v6','scripts/generate-body-review-display-pins.mjs --check'],
 ['reviews-write','scripts/review-revisions.mjs'],
 ['reviews-check','scripts/review-revisions.mjs --check'],
 ['renderer-write','scripts/body-renderer-revisions.mjs'],
 ['renderer-check','scripts/body-renderer-revisions.mjs --check'],
 ['nested-write','scripts/generate-nested-review-bindings.mjs'],
 ['nested-check','scripts/generate-nested-review-bindings.mjs --check'],
];
const permitted=new Set([...expected.keys()].filter(p=>p.startsWith('content/regional-teaching/')&&p.endsWith('.json')));
for(const p of ['lib/regional-teaching-imports.ts','content/body-review-display-pins.json','content/review-revisions.json','content/body-renderer-revision.json','content/nested-review-bindings.json'])permitted.add(p);
const prior=[];
// Main may add literal hashes only after observing and checkpointing completed
// steps. A receipt's own `passing` flag is never authority to resume it.
const pinnedResumeReceipts=Object.freeze([{"attempt":"regional-write","sha256":"e498f144bd9b286a32eefe2e712aa1ec024deb3278e95b4f0e831c5ac9e53879"},{"attempt":"regional-check","sha256":"54829150465e26932ae5fbe126418d18a523342c1da5d0bb7859b32feb13c8ff"}]);
assert.equal(hash("F:/VisibleMedicine/recovery/checkpoints/20261029-native-regional-generated/checkpoint.json"),"4150f7ad9b70d240b378fdb58a3326edc17d781a6a599c8d8e7bc990d654c08b","Main-verified completed generation checkpoint");
assert.equal(hash(root+"/display-write/RESULT.json"),"2b0e51e9ff9928b166c0b29d8e0fc29d733162cfceda9ee5caa004bf4f8c716e","Original failed attempt preserved");
for(const [attempt,command]of commands){
 const f=root+'/'+attempt+'/RESULT.json';if(!fs.existsSync(f))break;
 const pin=pinnedResumeReceipts.find(row=>row.attempt===attempt);
 assert(pin&&/^[a-f0-9]{64}$/.test(pin.sha256),'Existing step needs an independently verified resume pin: '+attempt);
 assert.equal(hash(f),pin.sha256,'Pinned resume receipt changed');
 const r=json(f);assert(r.passing&&r.command===command&&r.supervisor?.code===0&&r.process?.terminalObserved&&r.process.exitCode===0&&!r.process.interrupted,'Completed exact stock command required');
 assert(Array.isArray(r.generated));const seen=new Set();
 for(const row of r.generated){assert(row&&permitted.has(row.path)&&expected.has(row.path)&&!seen.has(row.path),'Resume may change only known generated outputs');seen.add(row.path);assert.equal(row.beforeSha256,expected.get(row.path),'Resume source chain mismatch');assert(/^[a-f0-9]{64}$/.test(row.sha256)&&Number.isSafeInteger(row.bytes)&&row.bytes>=0);expected.set(row.path,row.sha256);}
 prior.push(attempt);
}
// No arbitrary commands, scopes, shell tokens, or unchecked caller environments.
for(const c of allowedCommands)validateRequest({site,command:c,attempt:'scope-check'});
for(const command of ['scripts/build-clinical-review-viewer.mjs','scripts/run-website-tests.mjs --run','scripts/export-content.mjs','scripts/pin-nested-teaching.mjs','scripts/regional-teaching-snapshots.mjs; whoami'])assert.throws(()=>validateRequest({site,command,attempt:'bad-request'}));
assert.throws(()=>validateRequest({site:'F:/VisibleMedicine/atlas',command:allowedCommands[0],attempt:'bad-request'}));
assert.throws(()=>validateRequest({site,command:allowedCommands[0],attempt:'../../escape'}));
function verifySource(){for(const [p,sha]of expected){const file=site+'/'+p;assert.equal(fs.realpathSync.native(file).toLowerCase(),path.resolve(file).toLowerCase(),'Source cannot be a junction/symlink escape: '+p);assert.equal(hash(file),sha,p);}const untracked=execFileSync('git',['-C',site,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert(untracked.every(p=>expected.has(p)),'Unexpected untracked source before generation');}
verifySource();
const req=createRequire(site+'/package.json');
assert.equal(hash('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json'),'cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56','Exact independent dependency receipt');
const pinnedDependencies=json('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json').dependencyFiles;
const deps=[process.execPath,req.resolve('esbuild/package.json'),req.resolve('esbuild'),req.resolve('@esbuild/win32-x64/esbuild.exe'),req.resolve('typescript/package.json'),req.resolve('typescript')].map(p=>({path:fs.realpathSync.native(p),sha256:hash(p)}));
assert.deepEqual(deps,pinnedDependencies,'Executable dependency identity changed since the separately recorded admission');
const tsconfig=json(site+'/tsconfig.json');assert(!tsconfig.extends,'Unreviewed parent tsconfig');
const identity={at:new Date().toISOString(),site,parent:source.parent,sourceFiles:expected.size,authored:source.changes,dependencyFiles:deps,node:process.version,tsconfigSha256:hash(site+'/tsconfig.json'),profileSha256:hash(root+'/launch-contained-v6.mjs'),fullBuildGuardSha256:hash('G:/VisibleMedicine-temp/guard-g-v1.mjs'),nativeJobMiB:1024,heapMiB:384,minimumMiB:3072,freeFloorMiB:2048,checks:9,fullBuildPassed:false,installed:false};
assert.equal(identity.fullBuildGuardSha256,'f008679d73d32101e93fa5272d954282975c85725054de24065769b60818db82');
save('ADMISSION-'+Date.now()+'.json',identity);
console.log(JSON.stringify({verifiedSourceFiles:expected.size,dependencyFiles:deps.length,resumeAfter:prior}));
if(process.argv[2]==='--verify-only'){console.log(JSON.stringify({verified:true,generationStarted:false}));process.exit(0);}
for(const[attempt,command]of commands){
 if(prior.includes(attempt))continue;
 for(const d of deps)assert.equal(hash(d.path),d.sha256);
 verifySource();
 let r;
 try{r=await guardedGenerator({site,attempt,command});}catch(e){save('REFUSAL-'+Date.now()+'.json',{at:new Date().toISOString(),attempt,command,message:e.message,memory:e.memory??null,minimum:e.minimum??null,admissionRefused:e.admissionRefused===true});console.log(JSON.stringify({stopped:true,attempt,message:e.message,memory:e.memory??null}));process.exitCode=75;break;}
 const changes=[];
 for(const[p,sha]of expected){const current=hash(site+'/'+p);if(current!==sha){assert(permitted.has(p),'Unexpected stock generator write: '+p);changes.push({path:p,beforeSha256:sha,sha256:current,bytes:fs.statSync(site+'/'+p).size});}}
 const untracked=execFileSync('git',['-C',site,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);
 assert(untracked.every(p=>expected.has(p)),'Unexpected generated source path');
 const result={...r,at:new Date().toISOString(),command,generated:changes,fullBuildPassed:false,installed:false};
 save(attempt+'/RESULT.json',result);
 console.log(JSON.stringify({attempt,passing:r.passing,changedFiles:changes.length,exit:r.process?.exitCode}));
 if(!r.passing){process.exitCode=1;break;}
 for(const row of changes)expected.set(row.path,row.sha256);
}
