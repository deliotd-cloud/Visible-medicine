// Main-owned create-only full Website composition. No installed preview changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261023-ui-recovery-integrated',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261023-current-ui-delivery/SOURCE_CURRENT.json';
assert.equal(sha(read(parentFile)),'bd073fb1d6134af415e8b77f82ba218a1756e47af2c2ab503459e711ea8a6cc8');
const parent=json(parentFile),phase=process.argv[2];
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const overlays=[
 ['studio-session-drafts','F:/VisibleMedicine/staging/20261023-studio-session-drafts/website','ba007e3af7804d7bd9a482afa40cf41145609f7bf6e7e65f2c706e32cc8cda58'],
 ['inbox-failure-focus','F:/VisibleMedicine/staging/20261023-review-inbox-failure-focus/website','3fe776ef0f828428411cfb7cd2716ff3d25067256d6a9bb27f6fc5a72b0ec4b1'],
 ['modality-help-clarity','F:/VisibleMedicine/staging/20261023-modality-help-clarity/website','1b4b4c22a7521b697bdb7d840e863486f1f673457785d189628e5e552409befb'],
];
function verifyPrepared(){const p=json(stage+'/PREPARATION.json');assert.equal(p.parentReceiptSha256,sha(read(parentFile)));for(const r of p.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,'Prepared source '+r.path);return p;}
if(phase==='prepare'){
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 assert.equal(git('-C','F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(git('-C','F:/VisibleMedicine/atlas','rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 git('clone','--shared','--no-checkout','F:/VisibleMedicine/website',site);git('-C',site,'read-tree','HEAD');
 const selected=new Map(),originals=new Map(parent.sourceRows.map(r=>[r.path,r]));
 for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256);const to=containedTarget(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);selected.set(row.path,row);}
 const receipts=[],delta=[];
 for(const[id,from,digest]of overlays){const file='F:/VisibleMedicine/recovery/checkpoints/20261023-'+id+'/checkpoint.json';assert.equal(hash(file),digest);const c=json(file);for(const row of c.sourceRows){assert.equal(hash(from+'/'+row.path),row.sha256);assert(!delta.some(d=>d.path===row.path),'Exclusive overlay path');const old=originals.get(row.path);if(old){const pre=containedTarget(stage+'/preimages',row.path+'.raw');fs.mkdirSync(path.dirname(pre),{recursive:true});fs.copyFileSync(site+'/'+row.path,pre,fs.constants.COPYFILE_EXCL);assert.equal(hash(pre),old.sha256);}const to=containedTarget(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from+'/'+row.path,to,old?0:fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);selected.set(row.path,row);delta.push({...row,overlay:id,previousSha256:old?.sha256??null});}receipts.push({file,sha256:digest,source:from});}
 fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(delta.filter(r=>bound.inputs.some(b=>b.path===r.path)).length,0,'Do not reuse a stale Review binding');
 const p={at:new Date().toISOString(),website:site,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,overlays:receipts,delta,sourceRows:[...selected.values()].sort((a,b)=>a.path.localeCompare(b.path)),boundReviewInputOverlap:[],previewChanged:false,installed:false};write(stage+'/PREPARATION.json',p);console.log(JSON.stringify({phase,paths:p.sourceRows.length,delta:delta.length,reviewBoundInputsUnchanged:true,previewChanged:false}));
}else if(phase==='seal'){
 const p=verifyPrepared(),all=[];for(const row of parent.sourceRows)assert.equal(hash(parent.website+'/'+row.path),row.sha256,'Parent source unchanged '+row.path);
 for(const r of json(parent.buildArtifacts).files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256,'Parent built output unchanged '+r.path);
 for(const f of fs.readdirSync(stage+'/checks')){const r=json(stage+'/checks/'+f+'/TERMINAL.json');assert.equal(hash(stage+'/checks/'+f+'/stdout.log'),r.stdoutSha256);assert.equal(hash(stage+'/checks/'+f+'/stderr.log'),r.stderrSha256);all.push(r);}
 for(const[n,count]of Object.entries({ui:95,extra:23,delivery:78})){const r=all.find(r=>r.phase===n);assert.equal(r.exitCode,0);assert.equal(r.counts.tests,count);assert.equal(r.counts.pass,count);assert.equal(r.counts.fail+r.counts.cancelled+r.counts.skipped,0);}
 assert.equal(all.find(r=>r.phase==='prebuild').exitCode,0);assert.equal(all.find(r=>r.phase==='focused-types-ambient').exitCode,0);assert.equal(all.find(r=>r.phase==='focused-types').exitCode,1);
 const types=json(stage+'/FOCUSED_TYPES_AMBIENT.json');assert.equal(types.diagnostics.length,0);assert.equal(types.sourceFiles,624);for(const r of types.inputs)assert.equal(hash(path.resolve(site,r.path)),r.sha256,'Focused semantic input unchanged '+r.path);
 const build=all.find(r=>r.phase==='build');assert.equal(build.exitCode,0);assert(read(stage+'/checks/build/stdout.log').toString().includes('Build complete.'));
 const files=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){assert(!f.isSymbolicLink());const name=prefix+f.name,target=dir+'/'+f.name;if(f.isDirectory())walk(target,name+'/');else{assert(f.isFile());files.push({path:name,bytes:fs.statSync(target).size,sha256:hash(target)});}}}walk(site+'/dist');files.sort((a,b)=>a.path.localeCompare(b.path));write(stage+'/BUILD_ARTIFACTS.json',{at:new Date().toISOString(),root:site+'/dist',files,bytes:files.reduce((n,f)=>n+f.bytes,0),privateGeneratedOutputsKeptLocal:true});
 write(stage+'/SOURCE_INTEGRATED.json',{...p,at:new Date().toISOString(),sourcePaths:p.sourceRows.length,checks:all,nativeCasesPassed:196,focusedSemanticTypes:{receipt:stage+'/FOCUSED_TYPES_AMBIENT.json',sha256:hash(stage+'/FOCUSED_TYPES_AMBIENT.json'),sourceFiles:624,diagnostics:0,fullProject:false,initialHarnessAmbientOmissionRetained:true},actualProductionBuildPassed:true,buildArtifacts:stage+'/BUILD_ARTIFACTS.json',buildArtifactsSha256:hash(stage+'/BUILD_ARTIFACTS.json'),sourceAndParentBuildBytesUnchanged:true,wholeSuitePassing:false,fullTypecheckPassing:false,authenticatedAcceptance:false,previewChanged:false,installed:false});console.log(JSON.stringify({phase,sourcePaths:p.sourceRows.length,buildFiles:files.length,sourceReceipt:stage+'/SOURCE_INTEGRATED.json',sha256:hash(stage+'/SOURCE_INTEGRATED.json')}));
}else{
 const p=verifyPrepared();
 const specs={
  ui:{args:['--max-old-space-size=128','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',
   'tests/studio-session-drafts.test.ts','tests/studio-session-draft-form.test.mjs','tests/studio-draft-safety.test.ts','tests/studio-course-draft-discard.test.mjs','tests/clinical-review-inbox-failure-focus.test.mjs','tests/clinical-review-inbox-auto-return.test.mjs','tests/clinical-review-inbox-filter-recovery.test.mjs','tests/clinical-review-inbox-pagination-focus.test.mjs','tests/atlas-workspace-simplification.test.ts'],expected:0},
  delivery:{args:['--max-old-space-size=128','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/current-atlas-delivery.test.mjs','tests/current-ui-delivery-transition.test.mjs',...['reference','content','integration','related','ui','preservation','loader-preservation'].map(n=>'tests/lecture-body-'+n+'.test.mjs')],expected:0},
  prebuild:{args:['--max-old-space-size=128',path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'run','prebuild'],expected:0},
  build:{args:['--max-old-space-size=384','node_modules/vinext/dist/cli.js','build'],expected:0},
 };
 if(phase==='extra')specs.extra={args:['--max-old-space-size=128','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',...json(stage+'/EXTRA_TESTS.json').tests],expected:0};
 if(phase==='focused-types')specs['focused-types']={args:['--max-old-space-size=384',path.resolve('check-ui-recovery-types-20261023.mjs'),site],expected:0};
 if(phase==='focused-types-ambient')specs['focused-types-ambient']={args:['--max-old-space-size=384',path.resolve('check-ui-recovery-types-20261023.mjs'),site],expected:0};
 const spec=specs[phase];assert(spec,'Unknown phase');
 if(phase==='build')assert(!fs.existsSync(site+'/dist'),'Fresh build only');
 const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
 const start={at:new Date().toISOString(),phase,args:spec.args,cwd:site,sourceReceiptSha256:hash(stage+'/PREPARATION.json'),expectedExit:spec.expected};write(dir+'/STARTED.json',start);
 const r=spawnSync(process.execPath,spec.args,{cwd:site,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+(phase==='build'||phase.startsWith('focused-types')?384:128),VM_ATLAS_SOURCE_REPO:p.atlas,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},windowsHide:true,stdio:['ignore',out,err]});fs.closeSync(out);fs.closeSync(err);
 const stdout=read(dir+'/stdout.log').toString(),counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(stdout.match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
 const result={...start,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,counts,stdoutSha256:hash(dir+'/stdout.log'),stderrSha256:hash(dir+'/stderr.log')};write(dir+'/TERMINAL.json',result);console.log(JSON.stringify({phase,exit:r.status,counts,receipt:dir+'/TERMINAL.json'}));assert.equal(r.status,spec.expected);verifyPrepared();
}
