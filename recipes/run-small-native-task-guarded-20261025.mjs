import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {finished} from 'node:stream/promises';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
export async function guarded({site,dir,command,heap=1536,aggregate=2048,minimum=4096,extraEnv={}}){
 const memory=memoryGate(minimum);assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
 const save=(p,v)=>fs.writeFileSync(dir+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
 const base='F:/VisibleMedicine/staging/20261025-wave4-memory-repro-v2-proposal/supervise.ps1';
 assert.equal(hash(base),'1239eab31096552e7f78b508b58b873ea85d1bb3d8f3ee8ac4e4cfe7039bd2ee');
 let supervisor=fs.readFileSync(base,'utf8');function change(a,b){assert.equal(supervisor.split(a).length,2,a);supervisor=supervisor.replace(a,b);}
 change('scripts/run-website-tests.mjs --run',command);
 change("command=@('node.exe','scripts/run-website-tests.mjs','--run')",'command='+JSON.stringify(['node.exe',...command.split(' ')]));
 // PowerShell accepts an array literal here, not JSON.
 supervisor=supervisor.replace('command='+JSON.stringify(['node.exe',...command.split(' ')]),"command=@("+['node.exe',...command.split(' ')].map(x=>"'"+x+"'").join(',')+")");
 change("$_.CommandLine -match 'run-website-tests\\.mjs'","$_.CommandLine -match 'scripts[/\\\\]run-website-tests[.]mjs|types-full-attempt-1[/\\\\]checker[.]mjs|build-attempt-1[/\\\\]checker[.]mjs|scripts[/\\\\]build-clinical-review-viewer[.]mjs'");
 change('An existing stock runner is active; leave it alone and do not launch another','An existing broad runner/type checker/build is active; leave it alone and do not duplicate');
 if(aggregate!==2048){assert([768,1024,3072,4096].includes(aggregate));change('2UL*1024UL*1024UL*1024UL',String(aggregate)+'UL*1024UL*1024UL');change('jobMemoryMiB=2048','jobMemoryMiB='+aggregate);}
 if(minimum!==4096){assert([2816,3072,5120,6144].includes(minimum));change('$before.availableMiB -lt 4096','$before.availableMiB -lt '+minimum);change('require available >=4096 MiB','require available >='+minimum+' MiB');}
 assert(minimum>=aggregate+2048,'Admit the complete maximum job plus the unchanged2GiB free reserve');
 fs.writeFileSync(dir+'/supervise.ps1',supervisor,{flag:'wx'});
 const envBase=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(k)));
 const environment={...envBase,NODE_OPTIONS:'--max-old-space-size='+heap,GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1',NO_COLOR:'1',WRANGLER_SEND_METRICS:'false',NEXT_TELEMETRY_DISABLED:'1',...extraEnv};
 save('CONFIGURATION.json',{node:process.execPath,site,evidence:dir,environment,maxMinutes:30});
 save('PREPARATION.json',{at:new Date().toISOString(),memory,baseSupervisorSha256:hash(base),supervisorSha256:hash(dir+'/supervise.ps1'),command,heapMiB:heap,aggregateNativeJobMiB:aggregate,minimumFreeMiB:minimum,freeFloorMiB:2048,commitCeilingPercent:90,killOnCloseSuspendedAssignResumeUnchanged:true,ownerPreviewChanged:false});
 const out=fs.createWriteStream(dir+'/supervisor.stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/supervisor.stderr.log',{flags:'wx'});
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',dir+'/supervise.ps1','-Configuration',dir+'/CONFIGURATION.json'],{env:envBase,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 save('SUPERVISOR-HANDLE.json',{at:new Date().toISOString(),pid:child.pid,parentPid:process.pid});console.log(JSON.stringify({started:true,supervisorPid:child.pid,evidence:dir}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([finished(out),finished(err)]);
 const terminal=fs.existsSync(dir+'/PROCESS-TERMINAL.json')?json(dir+'/PROCESS-TERMINAL.json'):null;
 return {supervisor:result,process:terminal,passing:result.code===0&&!result.error&&!result.signal&&terminal?.terminalObserved&&!terminal.interrupted&&terminal.exitCode===0};
}
