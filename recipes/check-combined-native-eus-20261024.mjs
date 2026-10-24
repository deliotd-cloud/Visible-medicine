// Original unit/integration roots, serial; storage assertions use synthetic stubs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const sourceFile='F:/VisibleMedicine/recovery/checkpoints/20261024-native-metadata-and-active-tests/NATIVE_SOURCE_POST_METADATA.json',sourceHash='cdf1e48cb8e5cecec02e6db51362053e266839b9c9caef08d3c8daa819e250ef';
const attempt='F:/VisibleMedicine/staging/20261024-combined-atlas/checks/right-gastric-eus-attempt-1';
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<4096||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory,minimumMiB:4096}));process.exit(75);}
assert.equal(hash(sourceFile),sourceHash);const source=json(sourceFile),atlas=source.atlas;assert(!fs.existsSync(attempt));fs.mkdirSync(attempt,{recursive:true});
const save=(name,v)=>fs.writeFileSync(attempt+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const drift=()=>source.sourceRows.flatMap(r=>{try{return hash(atlas+'/'+r.path)===r.sha256&&fs.statSync(atlas+'/'+r.path).size===r.bytes?[]:[r.path];}catch(error){return[{path:r.path,error:error.code}];}});
const status=()=>execFileSync('git',['-C',atlas,'-c','core.quotepath=false','status','--porcelain=v1','-z','--untracked-files=all'],{encoding:'utf8',windowsHide:true}).split('\0').filter(Boolean).map(s=>({path:s.slice(3),code:s.slice(0,2)})).sort((a,b)=>a.path.localeCompare(b.path));
try{
 assert.deepEqual(drift(),[]);assert.deepEqual(status(),source.dirty);
 const args=['--max-old-space-size=512','--test','--test-concurrency=1','--test-reporter=tap','scripts/test-right-gastric-eus-unit.mjs','scripts/test-right-gastric-eus-integration.mjs'];
 save('STARTED.json',{at:new Date().toISOString(),memory,minimumMiB:4096,args,cwd:atlas,sourceFile,sourceSha256:sourceHash,sourcePaths:6389,expectedCases:13,env:{GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1'},scope:'Unmodified seven unit/six complete integration cases. Includes all9936lessons/all1104worksheet comparisons, stale/forged packet and pre-storage409 refusals. No real account or decision writes.'});
 const out=fs.openSync(attempt+'/child.tap','wx'),err=fs.openSync(attempt+'/stderr.log','wx');let result;try{result=spawnSync(process.execPath,args,{cwd:atlas,env:{...process.env,GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore',out,err],timeout:240000});}finally{fs.closeSync(out);fs.closeSync(err);}
 const sourceDrift=drift(),dirty=status();if(JSON.stringify(dirty)!==JSON.stringify(source.dirty))sourceDrift.push('git-status');if(hash(sourceFile)!==sourceHash)sourceDrift.push('source-receipt');
 const text=fs.readFileSync(attempt+'/child.tap','utf8'),counts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const m=text.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=m?Number(m[1]):null;}
 const passing=result.status===0&&counts.tests===13&&counts.pass===13&&['fail','skipped','cancelled','todo'].every(n=>counts[n]===0)&&!sourceDrift.length;
 save('TERMINAL.json',{at:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,sourceDrift,dirty,sourceSha256:sourceHash,tapSha256:hash(attempt+'/child.tap'),stderrSha256:hash(attempt+'/stderr.log'),wholeOriginalRoots:true,sourcePathsChecked:6389,nativeBuildPassed:false,clinicalApproval:false,patientSpaceRegistration:false,installed:false,previewChanged:false});console.log(JSON.stringify({attempt,counts,passing,sourceDrift}));process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,passing:false});throw error;}
