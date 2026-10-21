// Read-only local dataset QA. Detailed results and all source-derived interaction
// metadata stay on F; neither source assets nor this report may be uploaded.
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-head-positive-mask-browser';
const {loadEnv}=await import(pathToFileURL(site+'/node_modules/vite/dist/node/index.js'));
const {createNativeVolumeGeometry,maskCropIndexForIJK}=await import(pathToFileURL(site+'/lib/head-atlas-geometry.mjs'));
const {maskContainsVoxel,practiceEntries}=await import(pathToFileURL(site+'/lib/head-atlas-practice.ts'));
const configured=loadEnv('development',site,'VM_LOCAL_HEAD_').VM_LOCAL_HEAD_ROOT;assert(configured&&path.isAbsolute(configured));const root=path.resolve(configured);assert.equal(fs.realpathSync(root),root);assert(!fs.lstatSync(root).isSymbolicLink());
const expected='0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5';assert.equal(sha(read(root+'/manifest.json')),expected);const manifest=json(root+'/manifest.json');assert.equal(manifest.version,'1.0.2');assert.equal(manifest.source_studies_are_distinct,true);
assert(fs.existsSync(stage));assert(!fs.existsSync(stage+'/PRIVATE_MASK_SCORING_AUDIT.json'));
const start=Date.now(),rows=[],checkedFiles=new Map(),modules=['lib/head-atlas-practice.ts','lib/head-atlas-geometry.mjs','lib/head-atlas-display.ts'].map(p=>({path:p,sha256:sha(read(site+'/'+p))}));let positiveChecks=0,negativeChecks=0;
for(const modality of ['MRI','CT']){
 const definition=manifest.studies[modality],geometry=createNativeVolumeGeometry(definition.image),study={definition,geometry};
 const eligible=practiceEntries(definition.entries);assert(eligible.length>0);assert.equal(new Set(eligible).size,eligible.length);
 for(const entry of eligible){
  const crop=entry.mask,row={modality,entryId:entry.id,pass:false,positiveChecks:0,negativeChecks:0};rows.push(row);
  try{
   assert(crop&&crop.dtype==='uint8');assert(typeof crop.file==='string'&&!/[\\:\x00-\x1f]/.test(crop.file)&&crop.file.split('/').every(v=>v&&v!=='.'&&v!=='..'));
   const file=path.resolve(root,crop.file);assert(file.startsWith(root+path.sep));const before=fs.statSync(file);assert(before.isFile()&&before.nlink===1&&before.size<=134217728);assert(!fs.lstatSync(file).isSymbolicLink());assert.equal(fs.realpathSync(file),file);
   const mask=read(file);assert.equal(sha(mask),crop.sha256);const after=fs.statSync(file);for(const k of ['dev','ino','size','mtimeMs'])assert.equal(after[k],before[k]);assert.deepEqual(crop.native_shape_kji,definition.image.shape_kji);assert.deepEqual(crop.ijk_to_ras,definition.image.ijk_to_ras);
   const[K,J,I]=crop.shape_kji;assert.equal(mask.length,K*J*I);assert(crop.offset_kji.every((n,i)=>Number.isSafeInteger(n)&&n>=0&&n+crop.shape_kji[i]<=definition.image.shape_kji[i]));
   let first=-1,last=-1,nearest=-1,nearestDistance=Infinity,zero=-1;
   for(let n=0;n<mask.length;n++){
    const value=mask[n];assert(value===0||value===1,'Nonbinary source mask');
    if(value===0){if(zero<0)zero=n;continue;}if(first<0)first=n;last=n;
    const i=n%I,j=Math.floor(n/I)%J,k=Math.floor(n/(I*J)),d=(i-I/2)**2+(j-J/2)**2+(k-K/2)**2;if(d<nearestDistance){nearestDistance=d;nearest=n;}
   }
   assert(first>=0,'No occupied source mask voxel');
   const ijk=n=>[n%I+crop.offset_kji[2],Math.floor(n/I)%J+crop.offset_kji[1],Math.floor(n/(I*J))+crop.offset_kji[0]],target={entry,mask};
   for(const index of new Set([first,nearest,last])){
    const point=ijk(index);assert.equal(mask[maskCropIndexForIJK(point,crop)],1);assert.equal(maskContainsVoxel(target,study,point),true,'Occupied source voxel must score correctly');
    for(const view of Object.values(geometry.views)){const pixel=view.pixelFromIJK(point);assert.deepEqual(view.pixelToIJK(pixel.x,pixel.y,point[view.fixedAxisIJK]),point,'Native-plane round trip');}
    row.positiveChecks++;
   }
   if(zero>=0){assert.equal(maskContainsVoxel(target,study,ijk(zero)),false,'A source zero cell cannot score');row.negativeChecks++;}
   for(const point of [[-1,0,0],[definition.image.shape_kji[2],0,0],[0.5,0,0],[Number.NaN,0,0]]){assert.equal(maskContainsVoxel(target,study,point),false);row.negativeChecks++;}
   assert.equal(maskContainsVoxel(target,{...study,definition:{...definition,entries:[]}},ijk(nearest)),false,'A foreign study cannot reuse this entry');row.negativeChecks++;
   row.pass=true;positiveChecks+=row.positiveChecks;negativeChecks+=row.negativeChecks;checkedFiles.set(file,{hash:crop.sha256,stat:before});
  }catch(error){row.error=error instanceof Error?error.message:String(error);}
 }
 console.log(JSON.stringify({phase:'modality-audited',modality,eligible:eligible.length,failed:rows.filter(r=>r.modality===modality&&!r.pass).length}));
}
// Readback of the original files, not copies or inferred cleared derivatives.
for(const[file,r]of checkedFiles){assert.equal(sha(read(file)),r.hash);const stat=fs.statSync(file);for(const k of ['dev','ino','size','mtimeMs'])assert.equal(stat[k],r.stat[k]);}
assert.equal(sha(read(root+'/manifest.json')),expected);for(const r of modules)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
const report={at:new Date().toISOString(),durationMs:Date.now()-start,manifestSha256:expected,sourceModules:modules,sourceReadOnly:true,allCheckedFilesReadBack:true,allEligibleEntriesVisited:true,eligible:rows.length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).length,positiveChecks,negativeChecks,uniqueMaskFiles:checkedFiles.size,rows,privateLocalReportOnly:true,neverUpload:true,imageVolumePixelsLoadedByThisAudit:false,wholeBrowserOrClinicalAcceptance:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(stage+'/PRIVATE_MASK_SCORING_AUDIT.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({terminal:true,eligible:report.eligible,passed:report.passed,failed:report.failed,positiveChecks,negativeChecks,privateReportRetainedLocally:true,sourceFilesChanged:false}));if(report.failed)process.exitCode=1;
