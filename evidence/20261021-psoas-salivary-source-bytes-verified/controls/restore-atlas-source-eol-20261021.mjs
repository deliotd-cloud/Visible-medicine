import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const previous='F:/VisibleMedicine/staging/20261021-psoas-salivary-epoch-application';
const stage='F:/VisibleMedicine/staging/20261021-atlas-source-eol-restoration';
const report='F:/VisibleMedicine/staging/20261021-atlas-source-eol-audit/REPORT.md';
assert.equal(sha(read(report)),'377ba2b0e3c6a54a1a47ebadb1c23bcfe5f5192533af8f7c667b7a8bf855a524');
const source='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const manifestPath=site+'/atlas-review/manifest.json';
assert.equal(sha(read(manifestPath)),'b4ba7a95f08fe473d838a9be700dc76de8c3484879cadf2464b416d532e8881f');
const manifest=json(manifestPath);assert.equal(manifest.files.length,1553);assert.equal(manifest.revision,source);
const terminal=json(previous+'/native.json');assert.equal(terminal.code,1);assert.equal(terminal.signal,null);assert.equal(terminal.sourceInputsUnchanged,true);
assert.deepEqual(terminal.counts,{tests:17,pass:16,fail:1,cancelled:0,skipped:0,todo:0});assert.equal(sha(read(terminal.log)),terminal.logSha256);
const rows=json(previous+'/SOURCE_INPUTS_AFTER.json'),preserved=json(previous+'/PRESERVED_SOURCE_AFTER.json');assert.equal(rows.length,5162);assert.equal(preserved.length,7);
const guard=()=>{
 for(const r of [...rows,...preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),source);
 assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);process.kill(266712,0);
};guard();const resume=process.argv[2]==='resume';
assert.equal(fs.existsSync(stage),resume);if(resume)assert(!fs.existsSync(stage+'/RESTORATION.json'));
const expected=new Map([
 ['app/review/overview/page.tsx','ddafaa8e8aa91abcf1ac942f7089cc5adfecb07495fbca5d5648a1003f12e554'],
 ['content/abdominal-branch-imaging-pins.json','735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1'],
 ['content/coronary-arterial-us-pins.json','8fe899c4cc342ee61afa2b086d2920b4eb46cc62bb52ae3583ce9f9e35e74435'],
 ['lib/coronary-arterial-us.ts','6ca30f92e3085c431325c681b2bcd17ab867da6e3dd8a935acb38470332bfe59'],
 ['content/coronary-arterial-us.ts','4ba07709b49b9c72f5d9e42f12495bc2a8439cc3505a7a5132018ca0fa290307'],
 ['lib/abdominal-branch-imaging.ts','c93f1b7ea40b7d2646b51d84632b3388b32b957351370ea78b948808a99631ae'],
 ['content/abdominal-branch-imaging.ts','ec3c59407eb763814afa4a9bd749ea801a39931d0dc884fbe294a165fc083d67'],
 ['lib/imaging-sync.ts','337351363197184239a62ff840bc9f6f1f260ce0d9fc61fa9adddf433f7b3331'],
 ['lib/didanix-atlas-adapter.ts','54d3483448a4cebce88a15eefd9ad43782e9d4cc0fb2d41b971d2278d614c382'],
]);
const differences=manifest.files.filter(r=>sha(read(atlas+'/'+r.path))!==r.sourceSha256);assert.deepEqual(new Set(differences.map(r=>r.path)),resume?new Set():new Set(expected.keys()));
const pending=manifest.files.filter(r=>expected.has(r.path)).map(r=>{
 const from=path.resolve(atlas,r.path);assert(from.startsWith(path.resolve(atlas)+path.sep));assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());
 const before=read(resume?stage+'/preimages/'+r.path:from);assert.equal(sha(before),expected.get(r.path));
 const committed=runGit(['-C',atlas,'show',source+':'+r.path]);assert.equal(sha(committed),r.sourceSha256);
 const text=new TextDecoder('utf-8',{fatal:true}).decode(before),next=Buffer.from(text.replaceAll('\r\n','\n'));assert.deepEqual(next,committed);assert(!committed.includes(Buffer.from('\r\n')));
 if(resume)assert.deepEqual(read(from),next,'Resume only after complete exact mechanical restoration');
 return{path:r.path,from,before,next,beforeSha256:sha(before),afterSha256:sha(next),beforeBytes:before.length,afterBytes:next.length};
});
if(!resume)fs.mkdirSync(stage);const save=(name,data)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
for(const r of pending){const p=stage+'/preimages/'+r.path;if(!resume){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,r.before,{flag:'wx'});}assert.equal(sha(read(p)),r.beforeSha256);}
// Bounded mechanical EOL normalization, not a source-semantic edit. Every target
// and exact preimage was checked before any write; originals remain recoverable.
if(!resume)for(const r of pending){assert.equal(sha(read(r.from)),r.beforeSha256);fs.writeFileSync(r.from,r.next);assert.equal(sha(read(r.from)),r.afterSha256);}
// Refresh only these already-HEAD-identical text entries. Assert no staged
// content before/after; no Git config, attributes or commit is changed.
runGit(['-C',atlas,'diff','--cached','--quiet']);
const refresh=spawnSync('git',['-C',atlas,'update-index','--refresh','--',...pending.map(r=>r.path)],{encoding:'utf8',windowsHide:true});
assert(refresh.status===0||refresh.status===1);runGit(['-C',atlas,'diff','--cached','--quiet']);
guard();for(const r of manifest.files)assert.equal(sha(read(atlas+'/'+r.path)),r.sourceSha256,r.path);
save('RESTORATION.json',{at:new Date().toISOString(),source,report,reportSha256:sha(read(report)),paths:pending.map(({path,beforeSha256,afterSha256,beforeBytes,afterBytes})=>({path,beforeSha256,afterSha256,beforeBytes,afterBytes})),all1553WorkingSourceHashesExact:true,wholeTextPreserved:true,atlasHeadAdvanced:false,atlasGitClean:true,websiteInputsUnchanged:true,testsOrManifestRepinned:false,ownerPreviewRestarted:false,indexStatRefreshWithoutStagedContent:true,resumedAfterInitialStrictDirtyStatRefusal:resume});
const receipts=[];
for(const[label,args]of [
 ['native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1','tests/atlas190-current-delivery.test.mjs']],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],
]){
 console.log(JSON.stringify({phase:'running',label,stage,driver:process.pid}));guard();
 const result=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,VM_ATLAS_SOURCE_REPO:atlas},encoding:'utf8',windowsHide:true,maxBuffer:16e6});
 const log=stage+'/'+label+'.log';fs.writeFileSync(log,result.stdout+result.stderr,{flag:'wx'});const counts={};for(const m of result.stdout.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))counts[m[1]]=Number(m[2]);
 const receipt={at:new Date().toISOString(),args,code:result.status,signal:result.signal,log,logSha256:sha(read(log)),counts};receipts.push(receipt);save(label+'.json',receipt);guard();assert.equal(result.status,0,'Inspect retained '+label+' failure');assert.equal(result.signal,null);
 if(label==='native')assert.deepEqual(counts,{tests:4,pass:4,fail:0,cancelled:0,skipped:0,todo:0});
}
for(const r of manifest.files)assert.equal(sha(read(atlas+'/'+r.path)),r.sourceSha256,r.path);guard();
const result={at:new Date().toISOString(),source,review:manifest.websiteIntegrationSha256,canonicalInstalled:true,websiteChangedPaths:12,controlledInputs:5162,preservedInputs:7,namedInputs:5169,sourceSnapshot:previous+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(previous+'/SOURCE_INPUTS_AFTER.json')),priorNative:previous+'/native.json',priorNativeSha256:sha(read(previous+'/native.json')),priorNativeCounts:terminal.counts,affectedStrictSourceModuleNative:receipts[0],freshFullTypes:receipts[1],all1553WorkingSourceHashesExact:true,wholeSourceAssertionsUnchanged:true,normalizationOnlyAtlasPaths:9,allWebsiteInputsAnd1710BindingsUnchanged:true,ownerPreviewPid:266712,ownerPreviewSession:32652,ownerPreviewRestarted:false,ownerFormsRefreshed:false,ownerDecisionsChanged:false,fullSuitePassingClaim:false,original136FailureBaselineRetained:true,clinicalApproval:false,spatialRegistration:false};save('APPLICATION.json',result);console.log(JSON.stringify(result));
