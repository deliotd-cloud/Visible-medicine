import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
import {guarded} from './run-native-build-balanced-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261027-head-selection-history-website',site=stage+'/website';
const pf='F:/VisibleMedicine/staging/20261026-tongue-website/SOURCE_CANDIDATE.json',ph='e8a9c3a37a7d6671e2dfe4eb4a643efe4f0abe0824bda7e8630a8881de415a5a';
const proposal='F:/VisibleMedicine/staging/20261027-head-selection-history-proposal';
const app=['components/HeadAtlasViewer.tsx','lib/head-view-history.ts'],test='tests/head-unmapped-selection-history.test.ts',doc='docs/HEAD_SELECTION_HISTORY.md';
const generated=['atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json'];
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash(pf),ph);const parent=json(pf),phase=process.argv[2];
if(phase==='prepare'||phase==='resume-prepare'){
 assert.equal(hash(proposal+'/REPORT.md'),'bf619fe55a3b3c762f1e10ca8cc94f75db002e27d3f21384ca634e81fc228e1c');
 for(const name of ['before-4','after-3'])assert(json('F:/VisibleMedicine/staging/20261027-head-selection-history-browser/'+name+'/TERMINAL.json').graceful);
 if(phase==='prepare')clonePinnedWebsite({stage,parentFile:pf,parentSha256:ph});
 else {
  assert.equal(json(stage+'/PREPARATION.json').parent.sha256,ph);assert(!fs.existsSync(stage+'/PROPOSAL_INPUTS.json'));
  const partial={'components/HeadAtlasViewer.tsx':'af896cf7b68b7fc7a6bfaf2b2e67c219901570d0b363fa728467db0b2bf50e10','lib/head-view-history.ts':'6632b570b452b85b7310f77b5b2d5279919fe014ac63532756c934a636c718f1'};
  for(const r of parent.sourceRows)assert.equal(hash(site+'/'+r.path),partial[r.path]??r.sha256,r.path);
  save(stage+'/PREPARATION_REPAIR.json',{reason:'Preparation stopped on a mistyped 63-character test digest before test copy or generation; exact partial overlay verified before resuming.',changedBeforeResume:Object.keys(partial),supersededHelper:partial['lib/head-view-history.ts'],sourceUnchanged:true});
 }
 const hashes=['af896cf7b68b7fc7a6bfaf2b2e67c219901570d0b363fa728467db0b2bf50e10','97f800b8afad657d2e7ae96d82082cff67bf3b4a48793e46b3a7cd18f851b23e','10bc50428c6c87ef498a915a64bdb0bd694862ea03a8ed6df8bcb91eb44e3606'];
 for(const [i,p]of [...app,test].entries()){assert.equal(hash(proposal+'/'+p),hashes[i]);fs.copyFileSync(proposal+'/'+p,site+'/'+p,app.includes(p)?0:fs.constants.COPYFILE_EXCL);}
 fs.writeFileSync(site+'/'+doc,'# CT/MRI selection history\n\nBrowser Back and Forward retain an ordinary selected structure even when it has no 3D concept link, alongside its existing scan layout, slice and window settings. Explicit Clear remains empty. Canonical concept, guided and practice navigation retain their own policies.\n\nOnly an opaque token enters browser history. Selected identities and exact bounded annotation snapshots remain in tab memory; restored entries must match the current image, study, modality, source revision and annotation. Changed annotations, unavailable or duplicate entries, evicted receipts, new sessions and closed packages cannot restore an old selection. No spatial registration or access entitlement is implied.\n\nVerification uses the actual React viewer with synthetic image acquisition and native browser traversal for CT and MRI, plus complete existing regression roots, full configured types and production build. Synthetic browser evidence is not real-account or clinical acceptance.\n',{flag:'wx'});
 for(const p of ['next-env.d.ts','.next/types/routes.d.ts']){const from=parent.website+'/'+p,to=site+'/'+p;assert(fs.existsSync(from));if(!fs.existsSync(to)){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}assert.equal(hash(from),hash(to));}
 save(stage+'/PROPOSAL_INPUTS.json',{app:[...app,test].map(p=>({path:p,sha256:hash(site+'/'+p)})),report:{path:proposal+'/REPORT.md',sha256:hash(proposal+'/REPORT.md')},doc});
 console.log(JSON.stringify({phase,site,paths:parent.sourceRows.length}));
}else if(phase==='bind'){
 const target=fs.realpathSync.native(site+'/public/atlas-review-viewer'),root=fs.realpathSync.native(site);
 assert(path.resolve(target).startsWith(path.resolve(root)+path.sep));assert.equal(target,path.join(root,'public','atlas-review-viewer'));
 const dir=stage+'/checks/review-1',inner=stage+'/stock-review.mjs';
 save(stage+'/REVIEW_TARGET.json',{resolved:target,root,isolated:true});
 const steps=[[384,['scripts/check-anatomy-coverage.mjs','--check','--source-root',parent.atlas]],[384,['scripts/bind-clinical-review.mjs']],[1024,['scripts/build-clinical-review-viewer.mjs']],[384,['scripts/verify-clinical-review.mjs']]];
 fs.writeFileSync(inner,`import{spawn}from'node:child_process';for(const[heap,args]of ${JSON.stringify(steps)}){console.log(JSON.stringify({stockStep:args[0]}));const child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd:process.cwd(),env:process.env,windowsHide:true,stdio:'inherit'});const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});if(code!==0)throw Error(args[0]+' '+code);}`,{flag:'wx'});
 const ix=json('CURRENT_CHECKPOINT.json');assert.deepEqual(ix.activeWork.current.activeExecutionSessions,[]);ix.activeWork.current.activeExecutionSessions=[{kind:'head-selection-review-bind',driverPid:process.pid,evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
 try{global.gc();const run=await guarded({site,dir,command:'--max-old-space-size=256 '+inner,heap:1024,aggregate:3584,minimum:5632});save(stage+'/REVIEW_RESULT.json',{run,passing:run.passing,normalPreviewChanged:false});assert(run.passing);}finally{const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}}
 console.log(JSON.stringify({phase,passing:true}));
}else if(phase==='seal'){
 assert(json(stage+'/REVIEW_RESULT.json').passing);
 const oldInputs=json(parent.website+'/atlas-review/integration-inputs.json'),inputs=json(site+'/atlas-review/integration-inputs.json');
 assert.equal(inputs.inputs.length,1824);assert.deepEqual(inputs.inputs,oldInputs.inputs.map(r=>app.includes(r.path)?{...r,sha256:hash(site+'/'+r.path)}:r));
 assert.equal(inputs.sha256,createHash('sha256').update(JSON.stringify(inputs.inputs)).digest('hex'));
 for(const r of inputs.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 const manifest=json(site+'/atlas-review/manifest.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json'),oldViewer=json(parent.website+'/public/atlas-review-viewer/manifest.json');
 assert.equal(manifest.files.length,1617);assert.equal(manifest.revision,parent.atlasHead);assert.equal(viewer.sourceCommit,parent.atlasHead);assert.equal(viewer.websiteIntegrationSha256,inputs.sha256);assert.equal(viewer.files.length,54);assert.deepEqual(viewer.packages,oldViewer.packages);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
 assert.equal(hash(site+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'),hash(parent.website+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'));
 for(const r of viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+r.path),r.sha256,r.path);
 const pinFile='tests/fixtures/current-atlas-delivery.json',oldPin=json(site+'/'+pinFile),nextPin={...oldPin,reviewIntegration:inputs.sha256,documents:Object.fromEntries(Object.keys(oldPin.documents).map(p=>[p,hash(site+'/'+p)]))};
 assert.equal(nextPin.source,parent.atlasHead);fs.writeFileSync(site+'/'+pinFile,JSON.stringify(nextPin,null,2)+'\n');
 const allowed=[...app,...generated,pinFile],rows=[],changed=[];
 for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(r.path.startsWith('public/atlas-review-viewer/'))continue;const actual=hash(site+'/'+r.path);if(actual!==r.sha256){assert(allowed.includes(r.path),r.path);changed.push(r.path);}rows.push({path:r.path,bytes:fs.statSync(site+'/'+r.path).size,sha256:actual});}
 assert.deepEqual(changed.sort(),allowed.sort());
 for(const p of [test,doc,'public/atlas-review-viewer/manifest.json',...viewer.files.map(r=>'public/atlas-review-viewer/'+r.path)])rows.push({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)});
 assert.equal(new Set(rows.map(r=>r.path)).size,rows.length);rows.sort((a,b)=>a.path.localeCompare(b.path));
 save(stage+'/SOURCE_CANDIDATE.json',{schema:'vm-head-selection-history-successor/1',at:new Date().toISOString(),website:site,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,parent:pf,parentSha256:ph,sourceRows:rows,sourcePaths:rows.length,changedPaths:changed,newPaths:[test,doc],dependencies:parent.dependencies,reviewBindingSha256:inputs.sha256,reviewInputs:inputs.inputs.length,reviewSourceFiles:manifest.files.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,stockReview:{path:stage+'/REVIEW_RESULT.json',sha256:hash(stage+'/REVIEW_RESULT.json')},proposal:{path:stage+'/PROPOSAL_INPUTS.json',sha256:hash(stage+'/PROPOSAL_INPUTS.json')},allOriginalTestsUnchanged:true,allAtlasSourceAndLearnerRuntimesUnchanged:true,normalPreviewChanged:false,clinicalApproval:false});
 console.log(JSON.stringify({phase,sourceSha256:hash(stage+'/SOURCE_CANDIDATE.json'),paths:rows.length,review:inputs.sha256}));
}else throw Error('Unknown phase');
