import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',candidate='F:/VisibleMedicine/staging/20261021-body-lecture-links-proposal/candidate',root='F:/VisibleMedicine/recovery/local-cutover/20261021-body-lecture-links-v2';
const previous=json('F:/VisibleMedicine/recovery/checkpoints/20261021-desktop-search-entry-verified/checkpoint.json');
const prepared=json('F:/VisibleMedicine/staging/20261021-body-lecture-links-proposal/PREPARATION.json');
assert.equal(sha(read(previous.sourceSnapshot)),previous.sourceSnapshotSha256);const rows=json(previous.sourceSnapshot);assert.equal(rows.length,5496);
const scoped=(base,p)=>{assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));const out=path.resolve(base,p);assert(out.startsWith(path.resolve(base)+path.sep));return out;};
const paths=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);assert(!entry.isSymbolicLink());if(entry.isDirectory())walk(file);else{assert(entry.isFile());if(!entry.name.endsWith('.before'))paths.push(path.relative(candidate,file).replaceAll('\\','/'));}}}walk(candidate);paths.sort();
assert.equal(paths.length,44,'Feature, exact test-loader adapters and complete public-code preservation witnesses');
for(const r of [...rows,...prepared.preserved])assert.equal(sha(read(scoped(site,r.path))),r.sha256,r.path);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),previous.atlas);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const bound=new Set(json(site+'/atlas-review/integration-inputs.json').inputs.map(r=>r.path));
assert(paths.every(p=>!bound.has(p)),'No Review-bound source changes or generated module hand edits');
assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
const save=(name,value)=>fs.writeFileSync(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const ops=paths.map(p=>{const exists=fs.existsSync(scoped(site,p)),b=exists?read(scoped(site,p)):null;if(exists){const target=scoped(root,'preimages/'+p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});}return {path:p,before:b?sha(b):null,after:sha(read(scoped(candidate,p)))};});
save('PLAN.json',{at:new Date().toISOString(),baseline:previous.sourceSnapshot,baselineSha256:previous.sourceSnapshotSha256,preserved:prepared.preserved,ops,review:previous.review,source:previous.atlas});
save('BROWSER_DRAFT_GATE.json',{at:new Date().toISOString(),ownerTabs:['66','75','80','69'],unsavedIndicators:0,enabledSaves:0,lectureEditors:0,ownerFormsWillNotBeRefreshed:true,readOnlyDomObservation:true});
const processInfo=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter 'ProcessId=272600' | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
assert.match(processInfo.CommandLine,/node\.exe.*scripts\/start-stable-preview\.mjs/);
const commands=[];
function run(name,args){const log=root+'/'+name+'.log',fd=fs.openSync(log,'wx'),start=Date.now(),r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});fs.closeSync(fd);const receipt={at:new Date().toISOString(),args,code:r.status,signal:r.signal,durationMs:Date.now()-start,log,logSha256:sha(read(log))};if(name==='native'){receipt.counts={};for(const m of read(log).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))receipt.counts[m[1]]=Number(m[2]);}save(name+'.json',receipt);commands.push(receipt);console.log(JSON.stringify({name,code:r.status,durationMs:receipt.durationMs,counts:receipt.counts}));assert.equal(r.status,0,name);assert.equal(r.signal,null);if(receipt.counts)for(const k of ['fail','skipped','cancelled'])assert.equal(receipt.counts[k],0);}
process.kill(272600);
try{
 for(const op of ops){fs.mkdirSync(path.dirname(scoped(site,op.path)),{recursive:true});fs.copyFileSync(scoped(candidate,op.path),scoped(site,op.path));}
 const changed=new Set(paths);function guard(){for(const r of [...rows,...prepared.preserved])if(!changed.has(r.path))assert.equal(sha(read(scoped(site,r.path))),r.sha256,r.path);for(const op of ops)assert.equal(sha(read(scoped(site,op.path))),op.after);assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,previous.review);assert.equal(json(site+'/atlas-review/integration-inputs.json').inputs.length,1712);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');}
 guard();
 const tests=['lecture-body-reference.test.mjs','lecture-body-content.test.mjs','lecture-body-related.test.mjs','lecture-body-ui.test.mjs','lecture-body-integration.test.mjs','lecture-body-loader-preservation.test.mjs','lecture-body-preservation.test.mjs','lecture-anatomy-reference.test.ts','lecture-anatomy-collection.test.ts','lecture-anatomy-integration.test.ts','lecture-multi-anatomy-repository.test.ts','lecture-multi-anatomy-ui.test.ts','lecture-anatomy-text-matches.test.ts','lecture-anatomy-matches-ui.test.ts','related-lectures.test.ts','related-lecture-entrypoints.test.ts','lecture-manifest.test.ts','lecture-repository.test.ts','lecture-editor.test.ts','lecture-slide-player.test.ts','lecture-slide-preview.test.ts','lecture-context-editor.test.mjs','lecture-request-lifecycle.test.ts','lecture-save-preservation.test.mjs','lecture-save-adapter-preservation.test.mjs','lecture-tour-player.test.ts','lecture-api.test.ts','body-structure-search.test.ts','atlas-structure-search.test.mjs','search-kind-page.test.ts'];
 run('native',['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...tests.map(p=>'tests/'+p)]);
 run('stock-review',['scripts/verify-clinical-review.mjs']);run('catalog-check',['scripts/lecture-body-catalog.mjs','--check']);
 run('full-types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 run('model-inventory',['scripts/atlas-model-inventory.mjs','--check']);run('delivery-policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 run('full-build',['node_modules/vinext/dist/cli.js','build']);guard();
 const after=new Map(rows.map(r=>[r.path,r]));for(const op of ops){const b=read(scoped(site,op.path));after.set(op.path,{path:op.path,bytes:b.length,sha256:sha(b)});}save('SOURCE_INPUTS_AFTER.json',[...after.values()].sort((a,b)=>a.path.localeCompare(b.path)));
 save('INSTALLATION.json',{at:new Date().toISOString(),source:previous.atlas,review:previous.review,reviewBindings:1712,ops,commands,nativeCounts:commands.find(r=>r.counts).counts,sourceSnapshot:root+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(root+'/SOURCE_INPUTS_AFTER.json')),controlledInputs:after.size,preservedInputs:7,typesPassed:true,buildPassed:true,stockReviewPassed:true,modelInventoryAndDeliveryPolicyPassed:true,ownerTabsReloaded:false,previewRestartPending:true,clinicalApproval:false,spatialRegistration:false,publicDeployment:false});console.log(JSON.stringify({installed:root+'/INSTALLATION.json',sourceInputs:after.size+7,previewRestartPending:true}));
}catch(error){for(const op of ops){const target=scoped(site,op.path);if(op.before)fs.copyFileSync(scoped(root,'preimages/'+op.path),target);else if(fs.existsSync(target)){assert.equal(sha(read(target)),op.after);fs.unlinkSync(target);}}save('INSTALLATION_FAILED.json',{at:new Date().toISOString(),error:String(error),commands,exactOriginalSourcesRestored:true,previewRestartRequired:true});throw error;}
