// Original metadata freshness, complete regional/heading roots and full strict TS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const sourceFile='F:/VisibleMedicine/recovery/checkpoints/20261024-native-metadata-and-active-tests/NATIVE_SOURCE_POST_METADATA.json',sourceHash='cdf1e48cb8e5cecec02e6db51362053e266839b9c9caef08d3c8daa819e250ef';
const modes={freshness:[['--max-old-space-size=512','scripts/regional-teaching-snapshots.mjs','--check'],['--max-old-space-size=512','scripts/body-renderer-revisions.mjs','--check'],['--max-old-space-size=512','scripts/generate-body-review-display-pins.mjs','--check'],['--max-old-space-size=512','scripts/review-revisions.mjs','--check']],
 regional:[['--max-old-space-size=512','--import','tsx','--test','--test-concurrency=1','--test-reporter=tap','scripts/test-body-teaching-loader.mjs','scripts/test-regional-teaching.mjs','scripts/test-regional-teaching-freshness.mjs','scripts/test-teaching-heading.mjs']],
 strict:[['--max-old-space-size=3072','node_modules/typescript/bin/tsc','--noEmit','--incremental','false','--pretty','false']]};
const mode=process.argv[2],commands=modes[mode];assert(commands);assert.equal(mode,'strict','This successor is for the unchanged full strict scope only');const attempt='F:/VisibleMedicine/staging/20261024-combined-atlas/checks/generated-gates-v2/'+mode+'-attempt-1';
const resources=()=>JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
const admitted=m=>m.AvailableMBytes>=6144&&m.PercentCommittedBytesInUse<=90;const memory=resources();if(!admitted(memory)){console.log(JSON.stringify({admitted:false,mode,memory,minimumMiB:6144}));process.exit(75);}
assert.equal(hash(sourceFile),sourceHash);const source=json(sourceFile),atlas=source.atlas;assert(!fs.existsSync(attempt));fs.mkdirSync(attempt,{recursive:true});
const save=(name,v)=>fs.writeFileSync(attempt+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const drift=()=>source.sourceRows.flatMap(r=>{try{return hash(atlas+'/'+r.path)===r.sha256&&fs.statSync(atlas+'/'+r.path).size===r.bytes?[]:[r.path];}catch(error){return[{path:r.path,error:error.code}];}});
const status=()=>execFileSync('git',['-C',atlas,'-c','core.quotepath=false','status','--porcelain=v1','-z','--untracked-files=all'],{encoding:'utf8',windowsHide:true}).split('\0').filter(Boolean).map(s=>({path:s.slice(3),code:s.slice(0,2)})).sort((a,b)=>a.path.localeCompare(b.path));
const results=[];
try{
 assert.deepEqual(drift(),[]);assert.deepEqual(status(),source.dirty);save('STARTED.json',{at:new Date().toISOString(),mode,memory,minimumMiB:6144,cwd:atlas,commands,sourceFile,sourceSha256:sourceHash,sourcePaths:6389,expectedRegionalCases:mode==='regional'?27:null,typescriptVersion:json(atlas+'/node_modules/typescript/package.json').version,sourceOrPrivateDecisionWritesPermitted:false});
 for(let i=0;i<commands.length;i++){
  const measured=resources();if(!admitted(measured)){results.push({index:i,admitted:false,memory:measured,commandsNotRun:commands.length-i});break;}
  const stdout=i+'-stdout.log',stderr=i+'-stderr.log',out=fs.openSync(attempt+'/'+stdout,'wx'),err=fs.openSync(attempt+'/'+stderr,'wx');let result;const start=new Date().toISOString();
  try{result=spawnSync(process.execPath,commands[i],{cwd:atlas,env:{...process.env,GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore',out,err],timeout:mode==='strict'?300000:240000});}finally{fs.closeSync(out);fs.closeSync(err);}
  const sourceDrift=drift();if(JSON.stringify(status())!==JSON.stringify(source.dirty))sourceDrift.push('git-status');if(hash(sourceFile)!==sourceHash)sourceDrift.push('source-receipt');
  const text=fs.readFileSync(attempt+'/'+stdout,'utf8'),counts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const m=text.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=m?Number(m[1]):null;}
  const coverage=mode!=='regional'||counts.tests===27&&counts.pass===27&&['fail','skipped','cancelled','todo'].every(n=>counts[n]===0);
  const passing=result.status===0&&!result.signal&&!result.error&&!sourceDrift.length&&coverage;
  const row={index:i,start,end:new Date().toISOString(),args:commands[i],memory:measured,exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,sourceDrift,stdout,stdoutSha256:hash(attempt+'/'+stdout),stderr,stderrSha256:hash(attempt+'/'+stderr),passing};results.push(row);save(i+'-TERMINAL.json',row);console.log(JSON.stringify({mode,index:i,passing,exitCode:result.status,counts,sourceDrift}));if(!passing)break;
 }
 const passing=results.length===commands.length&&results.every(r=>r.passing===true);save('TERMINAL.json',{at:new Date().toISOString(),mode,passing,completedCommands:results.filter(r=>r.passing).length,requiredCommands:commands.length,results,sourceSha256:sourceHash,originalUnfilteredRoots:mode==='regional',fullNativeStrict:mode==='strict'&&passing,fullNativeBuildPassed:false,sourceRowsChecked:6389,clinicalApproval:false,installed:false,previewChanged:false});process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),mode,message:error.message,stack:error.stack,results,passing:false});throw error;}
