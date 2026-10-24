import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const stage='F:/VisibleMedicine/staging/20261024-head-review-portable-main-v2';
const prepFile=stage+'/PREPARATION.json',prepHash='b51c7ed2d3082fe26aed5bf1aa410eae130a9b979fa6ad23364b18381f54e77b';
const read=file=>fs.readFileSync(file),json=file=>JSON.parse(read(file)),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const kind=process.argv[2];assert(['controls','all'].includes(kind));const minimum=kind==='all'?1024:512;
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<minimum||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,kind,memory,minimumMiB:minimum}));process.exit(75);}
assert.equal(sha(read(prepFile)),prepHash);const prep=json(prepFile),root=prep.root,attempt=stage+'/checks/'+kind+'-attempt-1';assert(!fs.existsSync(attempt));fs.mkdirSync(attempt,{recursive:true});
const save=(name,value)=>fs.writeFileSync(attempt+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function drift(){const changed=[];for(const row of prep.files)try{if(sha(read(root+'/'+row.path))!==row.sha256||fs.statSync(root+'/'+row.path).size!==row.bytes)changed.push(row.path);}catch(error){changed.push({path:row.path,error:error.code});}return changed;}
try{
  assert.deepEqual(drift(),[]);assert.equal(process.env.PAGE_SOURCE,undefined);
  const tests=kind==='controls'?['tests/head-review-historical-source.test.mjs']:[
    'tests/head-review-historical-source.test.mjs','tests/head-mri-comparison-page.test.ts',
    'tests/head-guided-review-page-history.test.mjs','tests/head-guided-review-current-page.test.ts'];
  const args=['--max-old-space-size='+ (kind==='all'?128:64),'--test','--test-concurrency=1','--test-reporter=tap',...tests];
  save('STARTED.json',{at:new Date().toISOString(),memory,minimumMiB:minimum,args,cwd:root,preparationSha256:prepHash,expectedCases:kind==='all'?45:4,runtime:process.version,
    scope:'Finite physical test surface, no source overlays; frozen original14 scenarios via each unchanged collector role, four integrity controls, and whole current13 scenarios. Not whole Website/app/browser acceptance.'});
  const out=fs.openSync(attempt+'/child.tap','wx'),err=fs.openSync(attempt+'/stderr.log','wx');let result;
  try{result=spawnSync(process.execPath,args,{cwd:root,windowsHide:true,stdio:['ignore',out,err],timeout:60000});}finally{fs.closeSync(out);fs.closeSync(err);}
  const changes=drift();if(sha(read(prepFile))!==prepHash)changes.push('preparation');
  const text=read(attempt+'/child.tap').toString(),counts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const match=text.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=match?Number(match[1]):null;}
  const expected=kind==='all'?45:4;
  const passing=result.status===0&&counts.tests===expected&&counts.pass===expected&&['fail','skipped','cancelled','todo'].every(name=>counts[name]===0)&&changes.length===0;
  save('TERMINAL.json',{at:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,sourceDrift:changes,
    preparationSha256:prepHash,tapSha256:sha(read(attempt+'/child.tap')),stderrSha256:sha(read(attempt+'/stderr.log')),originalBodiesPreserved:true,currentTargetsUnfiltered:true,
    originalHistoricalCasesDistinct:kind==='all'?14:null,historicalCollectorEntryPoints:kind==='all'?2:null,
    fullWebsiteRun:false,nativeGraphRun:false,browserAcceptance:false,installed:false,previewChanged:false});
  console.log(JSON.stringify({attempt,counts,passing,sourceDrift:changes}));process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,passing:false});throw error;}
