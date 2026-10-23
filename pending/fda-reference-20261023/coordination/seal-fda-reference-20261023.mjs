import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-fda-shoulder-reference',atlas=stage+'/atlas';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),hash=p=>createHash('sha256').update(read(p)).digest('hex');
const prepared=json(stage+'/PREPARED.json');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,stdio:'pipe',maxBuffer:32e6}).trim();
const changed=['LICENSES/THIRD_PARTY_NOTICES.md','README.md','docs/FDA_SHOULDER_SOURCE.md'];
const added=['app/fda-shoulder-reference.css','app/fda-shoulder-reference.tsx','lib/fda-reference-model-loader.ts','lib/fda-reference-review.ts','lib/fda-shoulder-reference.ts','public/models/fda-shoulder-draft/NOTICE.md','public/models/fda-shoulder-draft/catalog.json','public/models/fda-shoulder-draft/reference.glb','scripts/check-fda-reference-types.mjs','scripts/export-fda-reference-review.mjs','scripts/export-fda-shoulder-reference.mjs','scripts/test-fda-reference-contract.mjs','scripts/test-fda-shoulder-reference-assets.mjs'];
assert.equal(git('rev-parse','HEAD'),prepared.head);assert.deepEqual(git('diff','--name-only').split('\n').sort(),changed.sort());
assert.deepEqual(git('ls-files','--others','--exclude-standard').split('\n').sort(),[...added].sort());
for(const row of prepared.files)if(!changed.includes(row.path))assert.equal(hash(atlas+'/'+row.path),row.sha256,row.path);
const terminal=json(stage+'/verification/final-native.TERMINAL.json');assert.equal(terminal.exitCode,0);
for(const row of terminal.source)assert.equal(hash(atlas+'/'+row.path),row.sha256);
for(const p of ['stdout','stderr'])assert.equal(hash(stage+'/verification/final-native.'+p+'.log'),terminal[p+'Sha256']);
assert.match(read(stage+'/verification/final-native.stdout.log').toString(),/tests 7\r?\n.*suites 0\r?\n.*pass 7\r?\n.*fail 0/);
assert.equal(json(stage+'/verification/types.current.stdout.log').diagnostics,0);
for(const job of json(stage+'/verification/BASELINE_CHECKS.json').rows){
 if(job.name!=='selection-visibility')assert.equal(job.exitCode,0);
 for(const k of ['stdout','stderr'])assert.equal(hash(stage+'/verification/'+job.name+'.'+k+'.log'),job[k+'Sha256']);
}
assert.match(read(stage+'/verification/selection-visibility.layout-v2.stdout.log').toString(),/passed: true/);
const pack=json(stage+'/review-material-v2/MATERIALS.json');assert.equal(pack.materials.length,6);assert.equal(new Set(pack.materials.map(r=>r.revision)).size,6);assert.equal(pack.protectedWebsiteQueueIntegrated,false);
for(const row of pack.rendererInputs)assert.equal(hash(atlas+'/'+row.path),row.sha256);
const visual=json(stage+'/visual-qa/OBSERVATION.v2.json'),built=json(stage+'/visual-qa/BUILT.json');assert(visual.ownedTabClosed&&visual.stopProbe.ownedLoopbackServerStopped);assert.equal(visual.errorCount,0);assert.equal(visual.ownerTabsTouched,false);
for(const row of built.source)assert.equal(hash(atlas+'/'+row.path),row.sha256);
for(const row of built.outputs)assert.equal(hash(stage+'/visual-qa/'+row.path),row.sha256);
const catalogue=json(atlas+'/public/models/fda-shoulder-draft/catalog.json');assert.equal(catalogue.structures.length,6);assert.equal(catalogue.structures.reduce((n,s)=>n+s.triangles,0),354736);assert.equal(hash(atlas+'/public'+catalogue.bundle.url),catalogue.bundle.sha256);
assert.equal(catalogue.held[0].sourcePart,'Gcart');assert.equal(catalogue.measurementEnabled,false);
git('diff','--check');fs.writeFileSync(stage+'/SOURCE_DIFF.patch',execFileSync('git',['-C',atlas,'diff','--',...changed],{windowsHide:true,stdio:'pipe'}),{flag:'wx'});
git('add','--',...changed,...added);git('commit','-m','Prepare pinned unitless shoulder reference viewer and draft review material');assert.equal(git('status','--porcelain'),'');
const sourceRows=git('ls-files','-z').split('\0').filter(Boolean).map(path=>({path,sha256:hash(atlas+'/'+path)}));
const receipt={at:new Date().toISOString(),atlas,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),parent:prepared.parent,parentHead:prepared.head,parentTree:prepared.tree,sourceRows,changed,added,sourcePaths:sourceRows.length,unchangedParentFiles:prepared.files.length-changed.length,
 catalogue:atlas+'/public/models/fda-shoulder-draft/catalog.json',catalogueSha256:hash(atlas+'/public/models/fda-shoulder-draft/catalog.json'),glb:atlas+'/public'+catalogue.bundle.url,glbSha256:catalogue.bundle.sha256,glbBytes:catalogue.bundle.bytes,structures:6,triangles:354736,held:'Gcart',maximumInverseFloat32CoordinateError:3.3131259442598093e-6,units:'unverified source coordinates; unitless display only',
 nativeTests:7,strictRoots:2,strictGraphFiles:1559,strictDiagnostics:0,sourceHoldChecks:9388,sourceHoldRefusals:699,geometryScreenChecks:236,rendererChecks:822,selectionChecks:1485539,
 reviewMaterial:stage+'/review-material-v2/MATERIALS.json',reviewMaterialSha256:hash(stage+'/review-material-v2/MATERIALS.json'),rendererSourceSha256:pack.rendererSourceSha256,uniqueDraftMaterialRevisions:6,protectedWebsiteReviewIntegrated:false,decisionWritingEnabled:false,
 visualEvidence:stage+'/visual-qa/OBSERVATION.v2.json',visualEvidenceSha256:hash(stage+'/visual-qa/OBSERVATION.v2.json'),actualComponentIsolatedBrowserPass:true,ownedQaTabsAndServersClosed:true,
 fullAppBuildRun:false,fullSuitePassing:false,learnerGeometryAdmitted:false,websiteCandidateChanged:false,clinicalApproval:false,registeredToBodyParts3D:false,patientSpaceRegistration:false,installed:false,previewChanged:false};
fs.writeFileSync(stage+'/SOURCE_BOUND.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({head:receipt.head,tree:receipt.tree,sourcePaths:sourceRows.length,changes:changed.length+added.length,nativeTests:7,glbBytes:receipt.glbBytes,reviewMaterialRevisions:6,previewChanged:false}));
