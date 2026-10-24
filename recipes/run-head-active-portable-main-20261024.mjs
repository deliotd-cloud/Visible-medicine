// Plain-Node finite historical/current integration; no source overlay or filters.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261024-head-active-identity-portable-main',attempt=root+'/runtime-attempt-1';
const prepFile=root+'/PREPARATION.json',prepHash='7c0f819b45e087ace937e7944bdfc607e6d8b11380a66844bd9a18d5ae392ef0';
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<1024||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory}));process.exit(75);}
assert.equal(sha(read(prepFile)),prepHash);const prep=json(prepFile),site=prep.root;assert(!fs.existsSync(attempt));fs.mkdirSync(attempt);
const save=(name,v)=>fs.writeFileSync(attempt+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const drift=()=>prep.files.flatMap(r=>{try{const b=read(site+'/'+r.path);return b.length===r.bytes&&sha(b)===r.sha256?[]:[r.path];}catch(error){return[{path:r.path,error:error.code}];}});
try{
 assert.deepEqual(drift(),[]);const requireSite=createRequire(site+'/package.json'),deps=[];
 for(const name of ['react','react-dom','typescript','@noble/hashes']){const file=site+'/node_modules/'+name+'/package.json',entry=requireSite.resolve(name==='@noble/hashes'?'@noble/hashes/sha2.js':name);deps.push({name,version:json(file).version,file,sha256:sha(read(file)),entry,entrySha256:sha(read(entry))});}
 const tests=['tests/head-comparison-active-identity.test.ts','tests/head-active-identity-history.test.mjs','tests/head-comparison-active-identity-current.test.ts','tests/head-active-identity-historical-source.test.mjs'];
 const args=['--max-old-space-size=128','--test','--test-concurrency=1','--test-reporter=tap',...tests];
 save('STARTED.json',{at:new Date().toISOString(),memory,minimumMiB:1024,args,cwd:site,preparationSha256:prepHash,dependencies:deps,sourcePaths:67,plainNode:true,scope:'Four complete unfiltered roots:5historical through two collector entries,5current,6integrity controls. Not21distinct scenarios or a full Website/build/browser check.'});
 const out=fs.openSync(attempt+'/child.tap','wx'),err=fs.openSync(attempt+'/stderr.log','wx');let result;try{result=spawnSync(process.execPath,args,{cwd:site,env:process.env,windowsHide:true,stdio:['ignore',out,err],timeout:60000});}finally{fs.closeSync(out);fs.closeSync(err);}
 const sourceDrift=drift(),dependencyDrift=[];for(const d of deps)if(sha(read(d.file))!==d.sha256||sha(read(d.entry))!==d.entrySha256)dependencyDrift.push(d.name);if(sha(read(prepFile))!==prepHash)sourceDrift.push('preparation');
 const tap=read(attempt+'/child.tap').toString(),counts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const m=tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=m?Number(m[1]):null;}
 const passing=result.status===0&&counts.tests===21&&counts.pass===21&&['fail','skipped','cancelled','todo'].every(n=>counts[n]===0)&&!sourceDrift.length&&!dependencyDrift.length;
 save('TERMINAL.json',{at:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,sourceDrift,dependencyDrift,tapSha256:sha(read(attempt+'/child.tap')),stderrSha256:sha(read(attempt+'/stderr.log')),historicalDistinctCases:5,historicalCollectorEntries:2,currentCases:5,controls:6,plainNode:true,fullWebsiteRun:false,nativeGraphRun:false,installed:false,previewChanged:false});console.log(JSON.stringify({attempt,counts,passing,sourceDrift,dependencyDrift}));process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,passing:false});throw error;}
