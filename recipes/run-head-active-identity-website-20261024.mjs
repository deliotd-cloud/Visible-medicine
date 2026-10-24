// Twenty whole roots against the exact complete6672source candidate; no overlays.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/staging/20261024-head-active-identity-website',attempt=root+'/checks/focused-352-attempt-1';
const prepFile=root+'/PREPARATION.json',prepHash='327c71c66e4cbd2f2483bb19047241cc7224a321542131f037e312e05db18ce2';
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<1024||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory}));process.exit(75);}
assert.equal(hash(prepFile),prepHash);const prep=json(prepFile),site=prep.website;assert.equal(prep.sourcePaths,6672);assert(!fs.existsSync(attempt));fs.mkdirSync(attempt,{recursive:true});
const save=(name,v)=>fs.writeFileSync(attempt+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const drift=()=>prep.sourceRows.flatMap(r=>{try{return hash(site+'/'+r.path)===r.sha256&&fs.statSync(site+'/'+r.path).size===r.bytes?[]:[r.path];}catch(error){return[{path:r.path,error:error.code}];}});
try{
 assert.deepEqual(drift(),[]);assert.equal(process.env.PAGE_SOURCE,undefined);const requireSite=createRequire(site+'/package.json'),dependencies=[];
 for(const name of ['react','react-dom','typescript','@noble/hashes']){const file=site+'/node_modules/'+name+'/package.json',entry=requireSite.resolve(name==='@noble/hashes'?'@noble/hashes/sha2.js':name);dependencies.push({name,version:json(file).version,file,sha256:hash(file),entry,entrySha256:hash(entry)});}
 const tests=['atlas-runtime-expansion-binding.test.mjs','studio-course-draft-discard.test.mjs','studio-draft-scope.test.mjs','head-gap-concept-teaching.test.ts','head-guided-3d-fallback.test.ts','head-separate-comparison-test-source.test.ts','head-guided-steps.test.ts','studio-membership-pages.test.mjs','release-diagnostic-context-inverse.test.mjs','head-image-history.test.ts','head-image-document-host.test.ts','head-ct-route-gates.test.mjs','head-mri-comparison-page.test.ts','head-guided-review-page-history.test.mjs','head-guided-review-current-page.test.ts','head-review-historical-source.test.mjs',
  'head-comparison-active-identity.test.ts','head-active-identity-history.test.mjs','head-comparison-active-identity-current.test.ts','head-active-identity-historical-source.test.mjs'];
 assert.equal(tests.length,20);assert.equal(new Set(tests).size,20);const args=['--max-old-space-size=128','--test','--test-concurrency=1','--test-reporter=tap',...tests.map(n=>'tests/'+n)];
 save('STARTED.json',{at:new Date().toISOString(),memory,minimumMiB:1024,args,cwd:site,preparationSha256:prepHash,dependencies,sourcePaths:6672,expectedReportedTests:352,notAllReportedTestsDistinct:true,historicalReviewCases:14,historicalActiveIdentityCases:5,historicalCollectorEntriesPerFamily:2,plainNode:true,scope:'20complete unfiltered selected roots in the full source candidate, zero source overlays. Full stock/strict/build/native/browser remain separate.'});
 const out=fs.openSync(attempt+'/child.tap','wx'),err=fs.openSync(attempt+'/stderr.log','wx');let result;try{result=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,STUDIO_TEST_PACKAGE:site+'/package.json'},windowsHide:true,stdio:['ignore',out,err],timeout:120000});}finally{fs.closeSync(out);fs.closeSync(err);}
 const sourceDrift=drift(),dependencyDrift=[];for(const d of dependencies)if(hash(d.file)!==d.sha256||hash(d.entry)!==d.entrySha256)dependencyDrift.push(d.name);if(hash(prepFile)!==prepHash)sourceDrift.push('preparation');
 const tap=fs.readFileSync(attempt+'/child.tap','utf8'),counts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const m=tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=m?Number(m[1]):null;}
 const passing=result.status===0&&counts.tests===352&&counts.pass===352&&['fail','skipped','cancelled','todo'].every(n=>counts[n]===0)&&!sourceDrift.length&&!dependencyDrift.length;
 save('TERMINAL.json',{at:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,sourceDrift,dependencyDrift,preparationSha256:prepHash,tapSha256:hash(attempt+'/child.tap'),stderrSha256:hash(attempt+'/stderr.log'),completeSourceCandidate:true,selectedWholeRoots:20,plainNode:true,historicalReviewCases:14,historicalActiveIdentityCases:5,historicalCollectorEntriesPerFamily:2,allReportedCasesDistinct:false,fullStockRun:false,strictRun:false,buildRun:false,nativeGraphRun:false,browserAcceptance:false,installed:false,previewChanged:false});console.log(JSON.stringify({attempt,counts,passing,sourceDrift,dependencyDrift}));process.exitCode=passing?0:1;
}catch(error){save('FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,passing:false});throw error;}
