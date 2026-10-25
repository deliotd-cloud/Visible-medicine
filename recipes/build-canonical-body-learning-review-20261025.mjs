import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
import {stage,site,save,verify,update,parent} from './canonical-body-learning-integration-20261025.mjs';
import {guarded} from './run-canonical-body-learning-guarded-20261025.mjs';
const state=verify();assert.equal(state.phase,'bound');
const prefix='public/atlas-review-viewer/',oldRows=parent.sourceRows.filter(r=>r.path.startsWith(prefix));assert(oldRows.length>40);
const target=path.resolve(site+'/public/atlas-review-viewer'),before=path.resolve(stage+'/before/viewer');
assert(target.startsWith(path.resolve(stage)+path.sep));assert(before.startsWith(path.resolve(stage)+path.sep));assert(!fs.existsSync(before));
function walk(root,prefix=''){const rows=[];for(const e of fs.readdirSync(root,{withFileTypes:true})){assert(!e.isSymbolicLink());const p=prefix+e.name;if(e.isDirectory())rows.push(...walk(root+'/'+e.name,p+'/'));else{assert(e.isFile());rows.push({path:p,bytes:fs.statSync(root+'/'+e.name).size,sha256:hash(root+'/'+e.name)});}}return rows.sort((a,b)=>a.path.localeCompare(b.path));}
const oldViewer=json(target+'/manifest.json');assert.equal(oldViewer.websiteIntegrationSha256,'c535c60256f6f09d348369e7c24cfa4e04663406c392c4b245465138dc2d7a68');
assert.deepEqual(walk(target),oldRows.map(r=>({...r,path:r.path.slice(prefix.length)})).sort((a,b)=>a.path.localeCompare(b.path)));
fs.renameSync(target,before);
let next=update(state,'viewer-building',[],{removedPaths:[...state.removedPaths,...oldRows.map(r=>r.path)]});
const dir=stage+'/checks/viewer-attempt-1';let result;
try{
 result=await guarded({site,dir,command:'--max-old-space-size=1536 scripts/build-clinical-review-viewer.mjs'});
 const actual=fs.existsSync(target)?walk(target):[];
 next=update(next,result.passing?'viewer-built':'viewer-build-failed',actual.map(r=>prefix+r.path));verify(next);
 assert(result.passing,'Actual stock viewer build failed');
 const viewer=json(target+'/manifest.json');assert.equal(viewer.sourceCommit,parent.atlasHead);assert.equal(viewer.websiteIntegrationSha256,state.reviewBindingSha256);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.modelDelivery,'existing-protected-inventory');
 assert.deepEqual(viewer.packages,oldViewer.packages,'No bundled dependency or licence changes');
 assert.equal(hash(target+'/THIRD_PARTY_NOTICES.txt'),hash(before+'/THIRD_PARTY_NOTICES.txt'),'All notice bytes preserved');
 assert.deepEqual(actual.map(r=>r.path).sort(),[...viewer.files.map(r=>r.path),'manifest.json'].sort());for(const r of viewer.files)assert.equal(hash(target+'/'+r.path),r.sha256,r.path);
 next=update(next,'viewer',[],{viewerManifestSha256:hash(target+'/manifest.json'),viewerFiles:actual.length,viewerPackages:viewer.packages.length,noticesBytesPreserved:true});verify(next);
 save(dir+'/TERMINAL.json',{at:new Date().toISOString(),...result,sourceHead:parent.atlasHead,binding:state.reviewBindingSha256,files:actual.length,packages:viewer.packages.length,noticesBytesPreserved:true,oldViewerRetained:before,ownerPreviewChanged:false,clinicalApproval:false});
 console.log(JSON.stringify({passing:true,files:actual.length,packages:viewer.packages.length,binding:state.reviewBindingSha256}));
}catch(e){if(fs.existsSync(dir))save(dir+'/FAILURE.json',{at:new Date().toISOString(),message:e.message,stack:e.stack,result});throw e;}
