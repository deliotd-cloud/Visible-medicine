// Main-only, exact-source admission and real Review producers in the isolated candidate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor',prep=json(root+'/PREPARED.json');
const site=prep.website,prior=json(prep.sourceReceipt),proposal='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-proposal';
assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);assert(!fs.existsSync(root+'/SOURCE.json'));assert(!fs.existsSync(root+'/admission'));
const overlays=new Map([
 ['lib/head-atlas-import.ts','70fa65adc382a02cfa3a53d4bf6baf267c6272bed9086297866a80adc87413b7'],
 ['lib/head-surface-validation.ts','85597c4c6a59fb18c862eb404a3da21c3043306985f44f6d2985703b8c1022b6'],
 ['tests/head-surface-validation.test.ts','8b4f977027856faa15cae191b73ad33428212cedec327a85985ccfd9f14af0de'],
 ['tests/head-entry-surface-cancellation.test.ts','1ae5bcbaa194e0e0cec8c20560597356b8105fb1ff557426c908837cc4b031b3'],
]);
const allowedPreEdits=['scripts/bind-clinical-review.mjs','tests/current-atlas-delivery.test.mjs'];
for(const r of prior.sourceRows)if(!allowedPreEdits.includes(r.path))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
for(const[p,digest]of overlays){assert.equal(sha(read(proposal+'/'+p)),digest,p);const to=containedTarget(site,p);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(proposal+'/'+p,to);}
const snapshots=['lib/head-atlas-import.ts','scripts/bind-clinical-review.mjs','tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery.json','atlas-review/integration-inputs.json'];
for(const p of snapshots){const to=containedTarget(site,'tests/fixtures/head-surface-before-20261022/'+p.replaceAll('/','__')+'.raw');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(prior.website+'/'+p,to,fs.constants.COPYFILE_EXCL);}
fs.mkdirSync(root+'/admission');const commands=[];
const env=nativeAtlasEnvironment({atlas:prep.atlas,revision:prep.atlasHead,tree:prep.atlasTree});
async function run(label,args){
 const out=fs.createWriteStream(root+'/admission/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/admission/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.surfaceCancellationRun={at:new Date().toISOString(),root,label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 commands.push({label,args,...result,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(result.code,0,label);
}
let failure=null;
try{
 await run('review-bind',['scripts/bind-clinical-review.mjs']);
 const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.inputs.length,1727);assert.equal(binding.sourceCommit,prep.atlasHead);
 const oldBinding=json(prior.website+'/atlas-review/integration-inputs.json'),oldMap=new Map(oldBinding.inputs.map(r=>[r.path,r.sha256]));
 assert.deepEqual(binding.inputs.filter(r=>!oldMap.has(r.path)).map(r=>r.path),['lib/head-surface-validation.ts']);
 assert.deepEqual(binding.inputs.filter(r=>oldMap.has(r.path)&&oldMap.get(r.path)!==r.sha256).map(r=>r.path).sort(),['lib/head-atlas-import.ts','scripts/bind-clinical-review.mjs']);
 await run('review-build',['scripts/build-clinical-review-viewer.mjs']);
 const missing=prior.sourceRows.filter(r=>!fs.existsSync(site+'/'+r.path));
 for(const r of missing){assert(/^public\/atlas-review-viewer\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(r.path),r.path);assert.equal(sha(read(prior.website+'/'+r.path)),r.sha256);fs.copyFileSync(prior.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
 fs.writeFileSync(root+'/admission/COMPATIBILITY_RESTORE.json',JSON.stringify({restored:missing,newViewerFilesUnchanged:true},null,2)+'\n',{flag:'wx'});
 const viewer=json(site+'/public/atlas-review-viewer/manifest.json'),oldViewer=json(prior.website+'/public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.files.length,46);assert.deepEqual(viewer.packages,oldViewer.packages);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
 const pin=json(prior.website+'/tests/fixtures/current-atlas-delivery.json');pin.reviewIntegration=binding.sha256;for(const p of Object.keys(pin.documents))pin.documents[p]=sha(read(site+'/'+p));
 fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 await run('review-verify',['scripts/verify-clinical-review.mjs']);
 await run('models',['scripts/atlas-model-inventory.mjs','--check']);
 await run('policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 await run('catalog',['scripts/lecture-body-catalog.mjs','--check']);
 await run('types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 await run('website',['node_modules/vinext/dist/cli.js','build']);
 const allowedChanges=new Set([...overlays.keys(),...allowedPreEdits,'tests/fixtures/current-atlas-delivery.json','atlas-review/integration-inputs.json','atlas-review/manifest.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','public/atlas-review-viewer/index.html','public/atlas-review-viewer/manifest.json']);
 const changed=prior.sourceRows.filter(r=>sha(read(site+'/'+r.path))!==r.sha256).map(r=>r.path);for(const p of changed)assert(allowedChanges.has(p),p);
 const rows=new Map(prior.sourceRows.map(r=>[r.path,{path:r.path,bytes:read(site+'/'+r.path).length,sha256:sha(read(site+'/'+r.path))}]));
 const add=p=>{const b=read(site+'/'+p);rows.set(p,{path:p,bytes:b.length,sha256:sha(b)});};
 for(const p of [...overlays.keys(),'tests/head-surface-review-binding.test.mjs',...snapshots.map(p=>'tests/fixtures/head-surface-before-20261022/'+p.replaceAll('/','__')+'.raw')])add(p);
 for(const r of viewer.files)add('public/atlas-review-viewer/'+r.path);
 for(const p of ['atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json']){
  const old=json(prior.website+'/'+p),now=json(site+'/'+p);for(const key of ['sourceRendererSha256','sourceRevisions'])if(key in old)assert.deepEqual(now[key],old[key],p+':'+key);
 }
 for(const r of prior.sourceRows)assert.equal(sha(read(prior.website+'/'+r.path)),r.sha256,'Predecessor drift: '+r.path);
 assert.equal(runGit(['-C',prep.atlas,'status','--porcelain']).toString().trim(),'');
 const result={at:new Date().toISOString(),website:site,sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),sourcePaths:rows.size,review:binding.sha256,
  previousSource:prep.sourceReceipt,previousSourceSha256:prep.sourceReceiptSha256,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,
  changedProductPaths:['lib/head-atlas-import.ts','lib/head-surface-validation.ts','scripts/bind-clinical-review.mjs'],changedExisting:changed,boundInputs:1727,
  importedSources:1560,viewerFiles:46,viewerPackages:22,reviewBindingUnchanged:false,geometryAndNativeMaskSourcesUnchanged:true,privateRuntimeStateCopied:false,
  controlledHeldSourceAssetsLocalOnly:true,nativeAccepted:false,typesPassed:true,websiteBuilt:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
 fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 const tests=['tests/head-surface-validation.test.ts','tests/head-entry-surface-cancellation.test.ts','tests/head-surface-review-binding.test.mjs',
  'tests/head-atlas-import.test.ts','tests/head-mask-reuse.test.ts','tests/head-mask-focus.test.ts','tests/head-mask-focus-preservation.test.mjs','tests/head-overlay-resource-budget.test.ts',
  'tests/head-study-buffer.test.ts','tests/head-asset-checksum.test.ts','tests/head-asset-checksum-binding.test.mjs','tests/head-loading-progress.test.ts','tests/head-loading-review-binding.test.mjs',
  'tests/head-overlay-loading.test.ts','tests/head-practice-mask-only.test.ts','tests/current-atlas-delivery.test.mjs','tests/atlas-workspace-3d-context.test.mjs'];
 for(const p of tests)assert(rows.has(p),p);
 fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
  scope:'Surface import cancellation/unchanged source gates, mask reuse and budget, native-buffer/checksum/progress, protected Review and exact current delivery; not whole-suite, patient/model rendering, clinical or registration acceptance.'},null,2)+'\n',{flag:'wx'});
}catch(error){failure=String(error);}
const terminal={at:new Date().toISOString(),code:failure?1:0,terminal:true,failure,commands,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false};
fs.writeFileSync(root+'/admission/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.surfaceCancellationRun,{pid:null,terminal:true,code:terminal.code,result:root+'/admission/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({result:root+'/admission/TERMINAL.json',code:terminal.code,failure}));if(failure)process.exitCode=1;
