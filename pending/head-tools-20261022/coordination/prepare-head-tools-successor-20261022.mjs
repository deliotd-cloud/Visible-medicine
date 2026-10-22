// Main-owned coherent local successor. Frozen predecessor and owner preview stay exact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const parentRoot='F:/VisibleMedicine/staging/20261022-review-queue-accessibility-successor';
const sourcePath=parentRoot+'/SOURCE.json',source=json(sourcePath);
assert.equal(sha(read(sourcePath)),'c70dfa42798aba75ae16e37d8bb9c96765bc71ff00642db65c4c0814fc86c6b0');
assert.equal(json(parentRoot+'/quality-build/TERMINAL.json').code,0);
const toolbar='F:/VisibleMedicine/staging/20261022-head-toolbar-compact-proposal';
const pane='F:/VisibleMedicine/staging/20261022-head-pane-accessible-labels';
assert(fs.existsSync(toolbar+'/HANDOFF.json'),'Wait for completed worker handoff; no partial source integration');
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',website=root+'/website';assert(!fs.existsSync(root));
const canonical='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas',relative='components/HeadAtlasViewer.tsx';
assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const expected=new Map(),held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of source.sourceRows){
 containedTarget(website,row.path);assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 if(!held.has(row.path))assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'No private runtime state: '+row.path);
 expected.set(row.path,{...row,from:source.website+'/'+row.path});
}
const original=read(source.website+'/'+relative);assert.equal(sha(original),'a14d1d851fff12960b35ffe71e282a0f2ec00e9a9077c74e72d3ed456ad25daa');
assert.deepEqual(read(toolbar+'/RAW/'+relative),original);assert.deepEqual(read(pane+'/RAW/'+relative),original);
const labelSeams=[
 ['onClick={onExpand} aria-pressed={expanded}',"onClick={onExpand} aria-pressed={expanded} aria-label={`${expanded?'Restore':'Enlarge'} ${plane} image`}"],
 ["aria-pressed={expanded==='3d'} onClick={()=>setExpanded(expanded==='3d'?null:'3d')}","aria-pressed={expanded==='3d'} aria-label={`${expanded==='3d'?'Restore':'Enlarge'} selected anatomy 3D scan view`} onClick={()=>setExpanded(expanded==='3d'?null:'3d')}"],
];
let paneOnly=original.toString(),combined=read(toolbar+'/CODE/'+relative).toString();
for(const [before,after] of labelSeams){assert.equal(paneOnly.split(before).length,2);paneOnly=paneOnly.replace(before,after);assert.equal(combined.split(before).length,2);combined=combined.replace(before,after);}
assert.equal(paneOnly,read(pane+'/CODE/'+relative).toString(),'Exact approved pane-label delta');
let inverse=combined;for(const [before,after] of labelSeams){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}
assert.equal(inverse,read(toolbar+'/CODE/'+relative).toString(),'Only approved nonoverlapping label seams added to toolbar proposal');
fs.mkdirSync(root);fs.mkdirSync(root+'/COMBINED/components',{recursive:true});fs.writeFileSync(root+'/COMBINED/'+relative,combined,{flag:'wx'});
const overlays=[{path:relative,from:root+'/COMBINED/'+relative,before:toolbar+'/RAW/'+relative},
 {path:'tests/head-pane-expansion-labels.test.mjs',from:pane+'/CODE/tests/head-pane-expansion-labels.test.mjs'},
 {path:'tests/head-toolbar-compact.test.mjs',from:toolbar+'/CODE/tests/head-toolbar-compact.test.mjs'},
 {path:'tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw',from:toolbar+'/CODE/tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw'}];
if(fs.existsSync(toolbar+'/CODE/components/head-atlas.css'))overlays.push({path:'components/head-atlas.css',from:toolbar+'/CODE/components/head-atlas.css',before:toolbar+'/RAW/components/head-atlas.css'});
for(const row of overlays){const prior=expected.get(row.path);if(prior){assert(row.before);assert.equal(sha(read(row.before)),prior.sha256);}else{assert(!row.before);assert(row.path.startsWith('tests/'));}const b=read(row.from);expected.set(row.path,{path:row.path,from:row.from,bytes:b.length,sha256:sha(b)});}
runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
for(const row of expected.values()){const to=containedTarget(website,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256);}
fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(atlas,root+'/atlas','junction');
// Predict the real binder only in memory; its actual outputs must match later.
let binder=read(website+'/scripts/bind-clinical-review.mjs').toString();
for(const line of ["import { readFileSync, writeFileSync, readdirSync } from 'node:fs';","import { createHash } from 'node:crypto';"]){assert.equal(binder.split(line).length,2);binder=binder.replace(line,'');}
const writes=new Map(),readBound=p=>writes.has(p)?Buffer.from(writes.get(p)):read(website+'/'+p);
new Function('readFileSync','writeFileSync','readdirSync','createHash','console',binder)(readBound,(p,value)=>writes.set(p,value),(p,options)=>fs.readdirSync(website+'/'+p,options),createHash,{log(){}});
const allowed=['atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','atlas-review/manifest.json','atlas-review/integration-inputs.json'];
assert.deepEqual([...writes.keys()].sort(),allowed.toSorted());
const priorBinding=json(website+'/atlas-review/integration-inputs.json'),nextBinding=JSON.parse(writes.get('atlas-review/integration-inputs.json'));
assert.equal(priorBinding.inputs.length,1724);assert.equal(nextBinding.inputs.length,1724);assert.equal(nextBinding.sourceCommit,priorBinding.sourceCommit);assert.notEqual(nextBinding.sha256,priorBinding.sha256);
const beforeInputs=new Map(priorBinding.inputs.map(row=>[row.path,row.sha256]));
const changedInputs=nextBinding.inputs.filter(row=>beforeInputs.get(row.path)!==row.sha256).map(row=>row.path).sort();
assert.deepEqual(changedInputs,overlays.filter(row=>row.path.startsWith('components/')).map(row=>row.path).sort());
for(const row of nextBinding.inputs)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Exact proposed input: '+row.path);
for(const [p,field] of [[allowed[0],'sourceRendererSha256'],[allowed[1],'sourceRevisions']])assert.deepEqual(JSON.parse(writes.get(p))[field],json(website+'/'+p)[field],'Independent source tracks remain unchanged');
const files=allowed.map(p=>{const after=Buffer.from(writes.get(p));const to=root+'/BINDING_CODE/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,after,{flag:'wx'});return{path:p,beforeSha256:sha(read(website+'/'+p)),afterSha256:sha(after)};});
const sourceRows=[...expected.values()].map(({from,...row})=>row).sort((a,b)=>a.path.localeCompare(b.path));
const receipt={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,review:source.review,previousSource:sourcePath,previousSourceSha256:sha(read(sourcePath)),
 changedProductPaths:changedInputs,overlays:overlays.map(({path,from})=>({path,from,sha256:sha(read(from))})),proposedReview:nextBinding.sha256,proposedBindingFiles:files,boundInputs:1724,importedSources:1558,
 actualRebindPerformed:false,typesPassed:false,websiteBuilt:false,nativeAccepted:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/PRE_BIND_SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,'Frozen predecessor: '+row.path);
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.nextViewerSuccessor={website,sourceReceipt:root+'/PRE_BIND_SOURCE.json',sourceReceiptSha256:sha(read(root+'/PRE_BIND_SOURCE.json')),sourcePaths:sourceRows.length,proposedReview:nextBinding.sha256,applied:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({root,sourcePaths:sourceRows.length,proposedReview:nextBinding.sha256,changedInputs,sourceReceiptSha256:sha(read(root+'/PRE_BIND_SOURCE.json')),ownerPreviewChanged:false}));
