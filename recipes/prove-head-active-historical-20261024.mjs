import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const output='F:/VisibleMedicine/staging/20261024-head-active-identity-historical-proof';
const beforeFile='F:/VisibleMedicine/staging/20261023-tour-replay-website/SOURCE_BOUND.json',beforeHash='c292417e48c6e36666bcb0bf29f250e944bbb8b5c037948e6c0a3d1af4074129';
const prepFile='F:/VisibleMedicine/staging/20261024-portable-head-review-website/PREPARATION.json',prepHash='4254380b3a9ff660e07244b39838b47fa71b480f759ae98e5c582d7dece793f6';
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<1024||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory,minimumMiB:1024}));process.exit(75);}
assert(!fs.existsSync(output));fs.mkdirSync(output);const save=(name,v)=>fs.writeFileSync(output+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
try{
 assert.equal(sha(read(beforeFile)),beforeHash);assert.equal(sha(read(prepFile)),prepHash);const before=json(beforeFile),prep=json(prepFile),site=prep.website,beforeRows=new Map(before.sourceRows.map(r=>[r.path,r]));
 const rows=new Map(prep.sourceRows.map(r=>[r.path,r])),viewer='components/HeadAtlasViewer.tsx',test='tests/head-comparison-active-identity.test.ts';
 assert.equal(beforeRows.get(viewer)?.sha256,'8fa8cc8d613812c1a426f29007f4b48b293c81cc13a1353b69a5987c9150118b');assert.equal(rows.get(viewer)?.sha256,'9797cd2ce54405d0909d125f38fa4ea0184f367b7ac772406952f6dacd0b7ae5');
 assert.equal(beforeRows.get(test)?.sha256,'fc657ede570acaed1729aa9d47cc89b9bb23388701f4ac9a706fae94f7395aac');assert.equal(sha(read(site+'/'+test)),beforeRows.get(test).sha256);assert.equal(sha(read(before.website+'/'+viewer)),beforeRows.get(viewer).sha256);
 assert.equal(beforeRows.get('package-lock.json')?.sha256,rows.get('package-lock.json')?.sha256,'Locked third-party ABI must match');
 const loader=path.resolve('source-test-overlay-20261024.mjs'),auditor=path.resolve('audit-head-active-historical-io-20261024.mjs');assert.equal(sha(read(loader)),'bfcf7aeadc08796421f30831853af066d8c85f6112959fea1e5dba50b7489708');
 const drift=()=>prep.sourceRows.flatMap(r=>{const b=read(site+'/'+r.path);return b.length===r.bytes&&sha(b)===r.sha256?[]:[r.path];});assert.deepEqual(drift(),[]);
 const dependencies=[],requireSite=createRequire(site+'/package.json');for(const name of ['typescript','react','react-dom']){const file=requireSite.resolve(name+'/package.json'),entry=requireSite.resolve(name);dependencies.push({name,version:json(file).version,file,sha256:sha(read(file)),entry,entrySha256:sha(read(entry))});}
 const readRedirects=[{from:site+'/'+viewer,to:before.website+'/'+viewer,currentSha256:rows.get(viewer).sha256,savedSha256:beforeRows.get(viewer).sha256,savedBytes:beforeRows.get(viewer).bytes}];
 save('IO_CONFIG.json',{receipt:beforeFile,receiptSha256:beforeHash,currentWebsite:site,readRedirects,output});save('LOAD_CONFIG.json',{website:site,sourceReceipt:beforeFile,sourceReceiptSha256:beforeHash,evidenceDirectory:output,overrides:[]});
 const args=['--max-old-space-size=128','--import',pathToFileURL(auditor).href,'--import',pathToFileURL(loader).href,'--test','--test-concurrency=1','--test-reporter=tap',site+'/'+test];
 save('STARTED.json',{at:new Date().toISOString(),memory,minimumMiB:1024,args,cwd:site,sourceRows:6639,preparationSha256:prepHash,beforeReceiptSha256:beforeHash,loaderSha256:sha(read(loader)),auditorSha256:sha(read(auditor)),readRedirects,dependencies,originalTestUnchanged:true});
 const out=fs.openSync(output+'/child.tap','wx'),err=fs.openSync(output+'/stderr.log','wx');let result;try{result=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,VM_TEST_SOURCE_OVERLAY:output+'/LOAD_CONFIG.json',VM_HEAD_ACTIVE_IO:output+'/IO_CONFIG.json'},windowsHide:true,stdio:['ignore',out,err],timeout:60000});}finally{fs.closeSync(out);fs.closeSync(err);}
 const sourceDrift=drift(),dependencyDrift=[];for(const d of dependencies)if(sha(read(d.file))!==d.sha256||sha(read(d.entry))!==d.entrySha256)dependencyDrift.push(d.name);
 const loads=fs.readdirSync(output).filter(n=>/^loaded-\d+\.json$/.test(n)),ios=fs.readdirSync(output).filter(n=>/^io-\d+\.json$/.test(n)),violations=[];
 for(const file of loads)sourceDrift.push(...json(output+'/'+file).sourceDrift);for(const file of ios){sourceDrift.push(...json(output+'/'+file).drift);violations.push(...json(output+'/'+file).violations);}
 for(const [file,hash]of [[beforeFile,beforeHash],[prepFile,prepHash],[before.website+'/'+viewer,beforeRows.get(viewer).sha256]])if(sha(read(file))!==hash)sourceDrift.push(file);
 const tap=read(output+'/child.tap').toString(),counts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const m=tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=m?Number(m[1]):null;}
 const passing=result.status===0&&counts.tests===5&&counts.pass===5&&['fail','skipped','cancelled','todo'].every(n=>counts[n]===0)&&loads.length===1&&ios.length===1&&!sourceDrift.length&&!dependencyDrift.length&&!violations.length;
 save('TERMINAL.json',{at:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,sourceDrift,dependencyDrift,violations,loads,ios,tapSha256:sha(read(output+'/child.tap')),stderrSha256:sha(read(output+'/stderr.log')),unmodifiedOriginalTest:true,wholeHistoricalViewerSource:true,onlyExtractedComparisonRuntime:true,fullApplicationOrStockRun:false,previewChanged:false,installed:false});console.log(JSON.stringify({output,counts,passing,sourceDrift,dependencyDrift,violations}));process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,passing:false});throw error;}
