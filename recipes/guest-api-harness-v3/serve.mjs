import fs from 'node:fs';
import assert from 'node:assert/strict';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import {spec,stage,suite,sourceFile,sourceSha,buildFile,json,writeNew,verifySourceBuild} from './common.mjs';

const mode=process.argv[2], s=spec(mode), dir=stage(mode);
const {site,buildSha,artifactReceiptSha}=verifySourceBuild();
assert(!fs.existsSync(dir),'Fresh create-only state required');
assert(fs.existsSync(suite)&&fs.statSync(suite).isDirectory(),'V2 suite evidence directory required');
const free=Number((await import('node:os')).freemem());
assert(free>=2*1024**3,'Require 2 GiB available memory before starting');
for(const p of ['.env','.env.local','.env.production','.dev.vars','.dev.vars.local'])
  assert(!fs.existsSync(site+'/'+p),'Private environment file in isolated source: '+p);
const config=json(site+'/dist/server/wrangler.json');
assert.equal(config.main,'index.js');assert.equal(config.no_bundle,true);
assert(![...(config.d1_databases??[]),...(config.r2_buckets??[])].some(x=>x.remote),'Remote binding prohibited');
assert.equal(config.ai,undefined);
const available=port=>new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(port,'127.0.0.1',()=>server.close(resolve));});
await available(s.port);await available(s.inspector);
fs.mkdirSync(dir,{recursive:false});
const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(k)));
Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=768',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',WRANGLER_SEND_METRICS:'false',NEXT_TELEMETRY_DISABLED:'1'});
const cli=site+'/node_modules/wrangler/bin/wrangler.js';assert(fs.existsSync(cli));
const args=['--max-old-space-size=768',cli,'dev','--config',site+'/dist/server/wrangler.json','--local','--no-bundle','--ip','127.0.0.1','--port',String(s.port),'--inspector-ip','127.0.0.1','--inspector-port',String(s.inspector),'--persist-to',dir+'/local-state','--live-reload=false','--show-interactive-dev-session=false','--types=false','--log-level','warn'];
const child=spawn(process.execPath,args,{cwd:site,env,windowsHide:true,shell:false,stdio:['ignore',out,err]});
try{
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
  const identity=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
    `$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${child.pid}'; if(-not $p){throw 'Driver not live'}; [ordered]@{pid=$p.ProcessId;parentPid=$p.ParentProcessId;created=$p.CreationDate.ToUniversalTime().ToString('o')} | ConvertTo-Json -Compress`],
    {encoding:'utf8',windowsHide:true}));
  assert.equal(identity.parentPid,process.pid);
  writeNew(dir+'/HANDLE.json',{at:new Date().toISOString(),mode,pid:child.pid,parentPid:process.pid,
    processCreated:identity.created,
    url:`http://127.0.0.1:${s.port}`,inspectorPort:s.inspector,args,source:{path:sourceFile,sha256:sourceSha},
    build:{path:buildFile,sha256:buildSha,artifactReceiptSha},privateStateCopied:false,ownerPreviewChanged:false});
  console.log(JSON.stringify({mode,handle:dir+'/HANDLE.json',pid:child.pid}));
}finally{fs.closeSync(out);fs.closeSync(err);}
const terminal=await new Promise(resolve=>{child.once('error',e=>resolve({error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
writeNew(dir+'/TERMINAL.json',{at:new Date().toISOString(),...terminal});
process.exitCode=terminal.code===0?0:1;
