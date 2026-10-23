// Main-only three-way source composition. Generated modules are copied whole
// from their verified producers, never hand-edited or installed into the preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261023-coherent-ui-runtime-website',site=root+'/website';
const receipts=[
 ['F:/VisibleMedicine/staging/20261023-release-epoch-successor/SOURCE.json','0dd282c43570998f10d8497fd32f6bcca12ea122f81aec8efd8cdc06379a1512'],
 ['F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition/SOURCE.json','2a87c6f0e169b79b4cf3d4dff62a9ccc506373e9fd12f8b1706596e538f98796'],
 ['F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json','65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522'],
];
for(const [file,expected]of receipts)assert.equal(sha(read(file)),expected);
const [base,teaching,common]=receipts.map(([file])=>json(file));
const exported='F:/VisibleMedicine/staging/20261023-atlas-runtime-preflight/EXPORT_VERIFICATION.json';
assert.equal(sha(read(exported)),'eac90490187c0bb1c173790a9aae4807f9aa836dca2b2c81f0e948162057139d');
const delivery=json(exported),raw='F:/VisibleMedicine/staging/20261023-atlas-review-9e14-import/website';
const reviewProof='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/MAIN_REVIEW.json';assert.equal(sha(read(reviewProof)),'1ebca28e8cd5c6a990b53cf584eb8ef00863d9c09fb68a07ff4d0cf72ffaf80f');
const reviewed=json(reviewProof);assert.equal(sha(read(reviewed.manifest)),reviewed.manifestSha256);
const patchProof='F:/VisibleMedicine/staging/20261023-regional-reference-current-role/MAIN_REVIEW.json',patch=json(patchProof);
const patchCheckpoint=json('F:/VisibleMedicine/recovery/checkpoints/20261023-reference-links-closed56/checkpoint.json');assert.equal(sha(read(patchProof)),patchCheckpoint.mainReviewSha256);
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const generated=p=>p.startsWith('atlas-review/')||p.startsWith('public/atlas-review-viewer/')||/^public\/atlas-runtime\/(?:head-neck|shoulder)\//.test(p);
const originals=new Map(common.sourceRows.map(r=>[r.path,r])),expected=new Map(),collisions=[],selected=[];
for(const row of base.sourceRows)if(!generated(row.path))expected.set(row.path,{...row,from:base.website+'/'+row.path,origin:'test-successor'});
for(const row of teaching.sourceRows){
 if(generated(row.path))continue;
 const old=originals.get(row.path),ours=expected.get(row.path);
 if(old?.sha256===row.sha256)continue;
 if(ours&&ours.sha256!==row.sha256&&ours.sha256!==old?.sha256){collisions.push(row.path);continue;}
 expected.set(row.path,{...row,from:teaching.website+'/'+row.path,origin:'teaching-ui'});selected.push(row.path);
}
assert.deepEqual(collisions,[],'Do not resolve competing source changes by precedence');
for(const row of patch.rows){
 const old=base.sourceRows.find(r=>r.path===row.path),current=expected.get(row.path);if(old)assert.equal(current?.sha256,old.sha256,'Patch requires its exact old source: '+row.path);else assert(!current,'Unknown new-path collision: '+row.path);
 expected.set(row.path,{...row,from:patch.containedWebsite+'/'+row.path,origin:'reviewed-reference-and-family-tests'});
}
function add(name,from,origin){containedTarget(site,name);const bytes=read(from);expected.set(name,{path:name,bytes:bytes.length,sha256:sha(bytes),from,origin});}
assert.equal(sha(read(raw+'/scripts/import-clinical-review.mjs')),reviewed.sourceImporterSha256);assert.equal(expected.get('scripts/import-clinical-review.mjs')?.sha256,reviewed.originalImporterSha256);
add('scripts/import-clinical-review.mjs',raw+'/scripts/import-clinical-review.mjs','reviewed9e14-importer');
const sourceManifest=json(reviewed.manifest);
for(const row of sourceManifest.files){const name='atlas-review/'+row.path,from=raw+'/'+name;assert.equal(sha(read(from)),row.importedSha256);add(name,from,'exact-unbound9e14Review');}
add('atlas-review/manifest.json',reviewed.manifest,'exact-unbound9e14Review');
for(const module of delivery.modules){
 const manifest=json(module.root+'/manifest.json');assert.equal(sha(read(module.root+'/manifest.json')),module.manifestSha256);assert.equal(manifest.sourceCommit,delivery.source);
 for(const row of manifest.files){const name='public/atlas-runtime/'+module.name+'/'+row.path,from=module.root+'/'+row.path;assert.equal(sha(read(from)),row.sha256);add(name,from,'verified9e14-runtime');}
 add('public/atlas-runtime/'+module.name+'/manifest.json',module.root+'/manifest.json','verified9e14-runtime');
}
const slab=Buffer.alloc(65536);const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const permittedPrivate=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of expected.values()){
 containedTarget(site,row.path);assert.equal(fs.statSync(row.from).size,row.bytes);assert.equal(hash(row.from),row.sha256,row.path);
 if(!permittedPrivate.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|nrrd|sqlite3?|db)$/i.test(row.path),'No patient, secret or unselected private files');
}
assert(!fs.existsSync(root));fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
for(const row of expected.values()){const target=containedTarget(site,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(row.from,target,fs.constants.COPYFILE_EXCL);assert.equal(hash(target),row.sha256);}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(reviewed.atlas,root+'/atlas','junction');
assert(!fs.existsSync(site+'/atlas-review/integration-inputs.json'));assert(!fs.existsSync(site+'/public/atlas-review-viewer'));
const sourceRows=[...expected.values()].map(({from,origin,...r})=>r).sort((a,b)=>a.path.localeCompare(b.path));
const manifest={at:new Date().toISOString(),website:site,atlas:reviewed.atlas,atlasHead:delivery.source,atlasTree:delivery.sourceTree,sourceRows,sourcePaths:sourceRows.length,parents:receipts.map(([file,digest])=>({file,sha256:digest})),reviewSource:sourceManifest.revision,reviewBound:false,runtimeSource:delivery.source,sourceMergeConflicts:[],selectedTeachingUiChanges:selected,referenceAndFamilyPatchRows:patch.rows,exportVerification:exported,exportVerificationSha256:sha(read(exported)),unboundReviewProof:reviewProof,unboundReviewProofSha256:sha(read(reviewProof)),missingGeneratedOutputs:['atlas-review/integration-inputs.json','public/atlas-review-viewer'],staleKnownContracts:['lib/atlas-model-inventory.json','tests/fixtures/current-atlas-delivery.json'],scope:'Full unpublished host SOURCE assembly from exact three-way parents and complete verified generated artifacts. Not a bound/accepted current delivery: inventory/policy, Review binding, protected viewer and full native/types/build/browser/release checks remain pending. Three explicitly selected local asset-map code files stay F-only; no raw scans, identifiers, mask or private database copied.',previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE_UNBOUND.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});fs.copyFileSync(new URL(import.meta.url),root+'/compose-ui-runtime-website-20261023.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({receipt:root+'/SOURCE_UNBOUND.json',sha256:sha(read(root+'/SOURCE_UNBOUND.json')),paths:sourceRows.length,mergeConflicts:0,teachingUiOverlays:selected.length,runtimeSources:delivery.source,reviewBound:false,previewChanged:false,installed:false}));
