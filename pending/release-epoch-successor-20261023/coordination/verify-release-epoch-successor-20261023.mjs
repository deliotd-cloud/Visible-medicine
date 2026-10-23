// Main verification of the completed gate and the isolated test-only successor.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import readline from 'node:readline';
import {spawnSync,execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';

const stage='F:/VisibleMedicine/staging/20261023-release-epoch-successor',site=stage+'/website';
const sourcePath=stage+'/SOURCE.json',source=json(sourcePath),composition=json(stage+'/COMPOSED.json');
assert.equal(sha(read(sourcePath)),'0dd282c43570998f10d8497fd32f6bcca12ea122f81aec8efd8cdc06379a1512');
assert.equal(composition.sourceReceiptSha256,sha(read(sourcePath)));
const classificationPath='F:/VisibleMedicine/staging/20261023-release-terminal-classification/CLASSIFICATION.json';
assert.equal(sha(read(classificationPath)),'02be716ed366985eff1e6dcd61a2bda65bdde908bf7c89c9107145818cfeb74b');
const classification=json(classificationPath),terminal=json(composition.terminal);
assert.equal(sha(read(composition.terminal)),composition.terminalSha256);
assert.equal(sha(read(terminal.stockReceipt)),terminal.stockReceiptSha256);
const stock=json(terminal.stockReceipt);assert.deepEqual(stock.counts,terminal.counts);
assert.deepEqual(terminal.sourceDrift,[]);assert.equal(stock.testInputDrift,false);assert.equal(stock.publicPreviewAssetDrift,false);
const tap=stock.output+'/child.tap',expectedEvents=classification.events;
assert.equal(expectedEvents.length,110);assert.equal(expectedEvents.filter(r=>r.status==='fail').length,107);
assert.equal(expectedEvents.filter(r=>r.status==='skip').length,3);
const indexed=new Map(expectedEvents.map(r=>[r.logLine,r]));assert.equal(indexed.size,110);
let line=0,top=0,pass=0,fail=0,skip=0,nestedPass=0;const observed=[],counts={},tapHash=createHash('sha256');
const stream=fs.createReadStream(tap);stream.on('data',b=>tapHash.update(b));
for await(const text of readline.createInterface({input:stream,crlfDelay:Infinity})){
 line++;
 const result=/^(ok|not ok) (\d+) - (.*)$/.exec(text);
 if(result){top++;const skipped=/ # SKIP(?: |$)/.test(result[3]);if(skipped)skip++;else if(result[1]==='not ok')fail++;else pass++;
  if(result[1]==='not ok'||skipped){const row=indexed.get(line);assert(row,'Unclassified native event at line '+line);assert.equal(row.tapNumber,+result[2]);assert.equal(row.title,result[3]);assert.equal(row.status,skipped?'skip':'fail');observed.push(row);}}
 if(/^\s+ok \d+ - /.test(text)&&!/ # SKIP(?: |$)/.test(text))nestedPass++;
 const summary=/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/.exec(text);if(summary)counts[summary[1]]=+summary[2];
}
assert.equal(fs.statSync(tap).size,15489549);assert.equal(tapHash.digest('hex'),'1628b01d03edec69e15c5b60a62cf10b4abf84549258b8ca83b0b09a68109172');
assert.equal(observed.length,110);assert.deepEqual({top,pass,fail,skip,nestedPass},{top:6037,pass:5927,fail:107,skip:3,nestedPass:7});
assert.deepEqual(counts,terminal.counts);assert.equal(top+nestedPass,counts.tests);assert.equal(pass+nestedPass,counts.pass);
const impact=observed.map(row=>{
 const roots=row.testRoots.map(p=>p.replaceAll('\\','/').replace(/\/+/g,'/'));
 for(const p of roots)assert(fs.existsSync(source.website+'/'+p),'Actual source root must exist: '+p);
 for(const location of row.sourceLocations){const p=location.file.replaceAll('\\','/').replace(/\/+/g,'/');assert(fs.existsSync(source.website+'/'+p));const lines=read(source.website+'/'+p).toString().split(/\r?\n/);assert(Number.isInteger(location.line)&&location.line>=1&&location.line<=lines.length);}
 const changed=roots.filter(p=>source.changedPaths.includes(p));
 const shared=roots.filter(p=>read(source.website+'/'+p).toString().includes("from './clinical-review-current-admission.mjs'"));
 return {tapNumber:row.tapNumber,logLine:row.logLine,status:row.status,roots,observedMechanism:row.observedMechanism,directlyChangedRoots:changed,importsChangedClinicalAdmission:shared.length>0,scope:changed.length||shared.length?'Candidate touches this root or a direct helper; original affected case still needs actual validation.':'Not addressed by this candidate; observed first gate does not establish downstream behavior.'};
});
const classificationReview={at:new Date().toISOString(),classification:classificationPath,classificationSha256:sha(read(classificationPath)),terminal:composition.terminal,terminalSha256:composition.terminalSha256,stockReceipt:terminal.stockReceipt,stockReceiptSha256:terminal.stockReceiptSha256,tap:{path:tap,bytes:15489549,sha256:'1628b01d03edec69e15c5b60a62cf10b4abf84549258b8ca83b0b09a68109172',lines:line},nativeCounts:counts,topLevel:{tests:top,pass,fail,skipped:skip},additionalNestedPasses:nestedPass,allFailureAndSkipLinesIndependentlyMatched:true,allNamedSourceLocationsExist:true,impact,
 interpretation:'The 107 native failures are observed failing gates, not a count of independent product bugs. The source/digest/count/history labels are diagnostic mechanisms only. Test-file import aborts prevent their downstream cases from running. None of the three host symlink skips is a pass; no privilege or access policy is changed. Classification and candidate overlap do not resolve any case without execution.',
 productChanged:false,previewChanged:false,wholeSuitePassing:false};
fs.writeFileSync(stage+'/TERMINAL_CLASSIFICATION_REVIEW.json',JSON.stringify(classificationReview,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({classificationMatched:observed.length,counts,topLevel:top,additionalNestedPasses:nestedPass}));

const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const observation=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"$vmOs=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');freePhysicalKiB=$vmOs.FreePhysicalMemory;freeCommitKiB=$vmOs.FreeVirtualMemory;oldStockProcesses=@(Get-CimInstance Win32_Process -Filter 'ProcessId=164336 OR ProcessId=136616 OR ProcessId=240252'|Select-Object ProcessId,ParentProcessId,Name,CreationDate)}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
assert.equal(observation.oldStockProcesses.length,0,'Do not mutate/restart a still-live predecessor');
// Only small text/hash proofs run at128MiB. Heavy feature checks/builds remain
// deferred while physical headroom is below2GiB, regardless of commit space.
const args=['--max-old-space-size=128','--test','--test-reporter=tap','--test-concurrency=1',
 'tests/release-epoch-composition-preservation.test.mjs','tests/arterial-history-preservation.test.mjs',
 'tests/atlas-learning-loader-preservation.test.mjs','tests/extra-expansion-adoption.test.mjs',
 'tests/learning-loader-preservation-composition.test.mjs'];
assert(observation.freeCommitKiB>4*1024*1024,'No safe bounded proof capacity');
const env={...process.env,NODE_OPTIONS:'--max-old-space-size=128',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};
const child=spawnSync(process.execPath,args,{cwd:site,env,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
const log=(child.stdout??'')+(child.stderr??'');fs.writeFileSync(stage+'/source-preservation.tap',log,{flag:'wx'});
const actual=Object.fromEntries([...log.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
const proof={at:new Date().toISOString(),args,exitCode:child.status,signal:child.signal,error:child.error?.message,counts:actual,log:stage+'/source-preservation.tap',logSha256:sha(read(stage+'/source-preservation.tap')),observation,heapMiB:128,pureSourceTextOnly:true,fullAffectedFeatureRootsPending:8,typesBuildBrowserPending:true,wholeSuitePassing:false,productChanged:false,previewChanged:false,installed:false};
fs.writeFileSync(stage+'/SOURCE_PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
assert.equal(child.error,undefined);assert.equal(child.status,0,log);assert.deepEqual(actual,{tests:14,pass:14,fail:0,cancelled:0,skipped:0,todo:0});
const slab=Buffer.alloc(65536);const fileSha=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const previous=json(source.previousSource),drift=source.sourceRows.filter(r=>fileSha(site+'/'+r.path)!==r.sha256).map(r=>r.path),previousDrift=previous.sourceRows.filter(r=>fileSha(previous.website+'/'+r.path)!==r.sha256).map(r=>r.path);
assert.deepEqual(drift,[]);assert.deepEqual(previousDrift,[]);
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const result={at:new Date().toISOString(),source:sourcePath,sourceSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,changedPaths:source.changedPaths,addedPaths:source.addedPaths,allProductAndBindingsByteIdentical:true,completeOriginalSourceInverses:12,nativeSourceProof:proof,terminalClassificationReview:stage+'/TERMINAL_CLASSIFICATION_REVIEW.json',terminalClassificationReviewSha256:sha(read(stage+'/TERMINAL_CLASSIFICATION_REVIEW.json')),sourceDrift:drift,predecessorDrift:previousDrift,fullFeatureValidationPending:true,wholeSuitePassing:false,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(stage+'/VERIFICATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:stage+'/VERIFICATION.json',sha256:sha(read(stage+'/VERIFICATION.json')),sourcePaths:source.sourcePaths,sourceProof:actual,drift,previousDrift,productChanged:false,previewChanged:false,fullFeatureAcceptance:false}));
