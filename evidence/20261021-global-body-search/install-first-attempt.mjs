import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-global-body-search-proposal',site='F:/VisibleMedicine/website';
const prep=json(stage+'/PREPARATION.json'),rows=json(prep.baseline);
assert.equal(sha(read(prep.baseline)),prep.baselineSha256);
const paths=['lib/body-structure-search.ts','lib/atlas-structure-search.ts','lib/platform-governance.ts','tests/body-structure-search.test.ts','tests/atlas-structure-search.test.mjs','tests/unified-search-concepts.test.ts','tests/fixtures/global-body-search/platform-governance.before.txt'];
const safe=p=>{assert(!path.isAbsolute(p)&&p.split('/').every(part=>part&&part!=='.'&&part!=='..')&&!/[\\\x00-\x1f]/.test(p));const v=path.resolve(site,p);assert(v.startsWith(path.resolve(site)+path.sep));return v;};
const originals=new Map(prep.existing.map(r=>[r.path,r.sha256]));
for(const row of [...rows,...prep.preserved])assert.equal(sha(read(safe(row.path))),row.sha256,row.path);
for(const p of paths){assert(fs.existsSync(stage+'/candidate/'+p));if(originals.has(p))assert.equal(sha(read(safe(p))),originals.get(p));else assert(!fs.existsSync(safe(p)),p);}
const root='F:/VisibleMedicine/recovery/local-cutover/20261021-global-body-search';assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
const save=(name,obj)=>fs.writeFileSync(root+'/'+name,JSON.stringify(obj,null,2)+'\n',{flag:'wx'});
save('OPEN_DRAFT_GATE.json',{at:new Date().toISOString(),priorLocalSwitchAuthorized:true,manualReloadPreview:true,ownerTabsWillNotBeReloaded:true,shoulderUnsavedIndicators:0,shoulderSaveDraftDisabled:true,bodyReviewEditors:0,studioEditors:0,noNotesOrDecisionsWritten:true});
const processInfo=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter 'ProcessId=254464' | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
assert.equal(processInfo.ProcessId,254464);assert.match(processInfo.CommandLine,/node\.exe.*scripts\/start-stable-preview\.mjs/);
const ops=paths.map(p=>({path:p,before:originals.get(p)??null,after:sha(read(stage+'/candidate/'+p))}));save('PLAN.json',{at:new Date().toISOString(),ops,baseline:prep.baseline,baselineSha256:prep.baselineSha256,preserved:prep.preserved});
const commands=[];
function run(name,args){const log=root+'/'+name+'.log',fd=fs.openSync(log,'wx'),start=Date.now();const result=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});fs.closeSync(fd);const receipt={at:new Date().toISOString(),args,code:result.status,signal:result.signal,durationMs:Date.now()-start,log,logSha256:sha(read(log))};if(name==='native'){receipt.counts={};for(const m of read(log).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))receipt.counts[m[1]]=Number(m[2]);}commands.push(receipt);save(name+'.json',receipt);console.log(JSON.stringify({name,code:result.status,durationMs:receipt.durationMs,counts:receipt.counts}));assert.equal(result.status,0,name);assert.equal(result.signal,null);if(receipt.counts)for(const key of ['fail','skipped','cancelled'])assert.equal(receipt.counts[key],0);}
process.kill(254464);
try{
 for(const op of ops){const to=safe(op.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(stage+'/candidate/'+op.path,to);assert.equal(sha(read(to)),op.after);}
 function guard(){for(const row of [...rows,...prep.preserved])if(!originals.has(row.path))assert.equal(sha(read(safe(row.path))),row.sha256,row.path);for(const op of ops)assert.equal(sha(read(safe(op.path))),op.after);assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,prep.review);assert.equal(json(site+'/atlas-review/integration-inputs.json').inputs.length,1712);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');}
 guard();
 run('native',['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1','tests/body-structure-search.test.ts','tests/atlas-structure-search.test.mjs','tests/structure-learning-search.test.ts','tests/unified-search-concepts.test.ts','tests/search-kind-page.test.ts','tests/atlas-search-study-handoff.test.ts','tests/head-learning-search-context.test.ts']);
 run('stock-review',['scripts/verify-clinical-review.mjs']);
 run('full-types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 run('full-build',['node_modules/vinext/dist/cli.js','build']);guard();
 const after=new Map(rows.map(r=>[r.path,r]));for(const op of ops){const b=read(safe(op.path));after.set(op.path,{path:op.path,bytes:b.length,sha256:sha(b)});}const snapshot=[...after.values()].sort((a,b)=>a.path.localeCompare(b.path));save('SOURCE_INPUTS_AFTER.json',snapshot);
 save('INSTALLATION.json',{at:new Date().toISOString(),site,sourceRevision:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:prep.review,reviewBindings:1712,sourceSnapshot:root+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(root+'/SOURCE_INPUTS_AFTER.json')),controlledInputs:snapshot.length,preservedInputs:prep.preserved.length,ops,commands,nativeCounts:commands.find(r=>r.counts).counts,reviewSourceAssetsAndBindingsUnchanged:true,allOtherControlledSourceUnchanged:true,typesPassed:true,buildPassed:true,stockReviewPassed:true,ownerTabsReloaded:false,noNotesOrDecisionsChanged:true,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,previewRestartPending:true});
 console.log(JSON.stringify({installed:root+'/INSTALLATION.json',controlledInputs:snapshot.length,previewRestartPending:true}));
}catch(error){
 for(const op of ops){const to=safe(op.path);if(op.before){fs.copyFileSync(stage+'/preimages/'+op.path,to);assert.equal(sha(read(to)),op.before);}else if(fs.existsSync(to)){assert.equal(sha(read(to)),op.after);fs.unlinkSync(to);}}
 save('INSTALLATION_FAILED.json',{at:new Date().toISOString(),error:String(error),commands,exactOriginalSourceRestored:true,newOwnedPathsRemovedWithStagedRecovery:true,previewRestartRequired:true});throw error;
}
