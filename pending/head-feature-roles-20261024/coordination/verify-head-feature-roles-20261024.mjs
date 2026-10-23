// Test-only successor: no regenerated production, Review or learner modules.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-head-feature-roles',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt);
const write=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
assert.equal(hash(prep.parentReceipt),'1071697c3bd7da15fa7b3daa563f4d55ce3d9b4ae1854d9eb36fe1790a6492e0');
const changed=[...prep.touched,'tests/colic-adapter-inverse.test.mjs'].sort();
assert.equal(changed.length,6);
const found=[];
for(const row of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);
 if(hash(site+'/'+row.path)!==row.sha256){assert(changed.includes(row.path),row.path);found.push(row.path);}
}
assert.deepEqual(found.sort(),changed);
const added=['tests/head-feature-source-roles.mjs','tests/head-feature-roles-preservation.mjs','tests/head-feature-roles-preservation.test.mjs'];
for(const rel of added)assert(!parent.sourceRows.some(row=>row.path===rel),rel);
const checks=[];
for(const phase of ['features','combined','combined-v2','neighbors-baseline','neighbors','neighbors-v2']){
 const dir=stage+'/checks/'+phase,t=json(dir+'/TERMINAL.json');
 for(const stream of ['stdout','stderr'])assert.equal(hash(dir+'/'+stream+'.log'),t[stream+'Sha256']);
 checks.push(t);
}
assert.deepEqual(checks[0].counts,{tests:21,pass:21,fail:0,skipped:0,cancelled:0});
assert.deepEqual(checks[1].counts,{tests:41,pass:41,fail:0,skipped:0,cancelled:0});
assert.deepEqual(checks[2].counts,{tests:42,pass:42,fail:0,skipped:0,cancelled:0});
for(const row of checks[2].sourceInputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
assert.deepEqual(checks[3].counts,{tests:19,pass:11,fail:8,skipped:0,cancelled:0});
assert.deepEqual(checks[4].counts,{tests:19,pass:10,fail:9,skipped:0,cancelled:0});
assert.deepEqual(checks[5].counts,checks[3].counts);
const outcomes=phase=>fs.readFileSync(stage+'/checks/'+phase+'/stdout.log','utf8').split('\n').filter(line=>/^(?:not ok|ok) \d/.test(line));
assert.deepEqual(outcomes('neighbors-v2'),outcomes('neighbors-baseline'),'No previously passing adjacent case remains regressed');
for(const row of checks[5].sourceInputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
write('ADJACENT_FOLLOWUP.json',{
 kind:'Paired exact-parent and repaired-candidate source-proof execution',
 baseline:checks[3].counts,initialCandidate:checks[4].counts,finalCandidate:checks[5].counts,
 identicalFinalPassFailTitles:true,failures:outcomes('neighbors-v2').filter(line=>line.startsWith('not ok')),
 initialRegression:'The surface-era desktop adapter needed the exact new-to-parent whole-source inverse before its original inverse. Both new seams are enumerated and proved; original adapter assertions are retained.',
 unresolved:'Eight pre-existing failures across six older closure/inverse roots remain; later assertions may be hidden by their first failing source/validator guard. No whole-suite or product-regression-free claim.',
 next:'Repair these historical closure roles independently; keep every old assertion and current54-file guards. Continue substantive Website/Atlas work in parallel through bounded exclusive ownership.',
 wholeSuitePassing:false,previewChanged:false,
});
const syntax=[];
for(const rel of [...changed,...added]){
 execFileSync(process.execPath,['--check',site+'/'+rel],{stdio:'pipe',windowsHide:true});
 syntax.push({path:rel,sha256:hash(site+'/'+rel),code:0});
}
write('SYNTAX.json',{actualNodeSyntaxChecks:true,files:syntax});
const uiPaths=['components/AtlasWorkspaceNavigation.tsx','components/StudioNavigation.tsx','components/ClinicalReviewInbox.tsx','components/HeadAtlasViewer.tsx','components/ImagingAtlasShell.tsx','atlas-review/app/review/review-dashboard.tsx'];
write('UI_PRIORITY_AUDIT.json',{
 kind:'Read-only source-level priority check, not UI acceptance',
 sources:uiPaths.map(rel=>({path:rel,sha256:hash(site+'/'+rel)})),
 observed:[
  'Modality/region navigation and expandable limitations already exist; exact verified head concept/tour links preserve semantic context, with independent access and no registration claim.',
  'Studio has four primary destinations with role-gated secondary Administration.',
  'Clinical Review auto-loads and rechecks after return, with compact pagination/filters and expandable revision/approval details.',
  'The imaging shell already offers source-scoped Focus images/Restore panels, contextual tools and independently scrollable index/learning panes.',
  'The head viewer has Structure/Guided learning/Practice panels and expandable provenance; the integrated review dashboard combines visual review and worksheet. This source check does not establish four-mode parity for every regional runtime.',
 ],
 next:'Prioritize behavior/keyboard/unsaved-state consistency and mode/toolbar parity across actual regional and imaging viewers, rather than adding duplicate navigation or controls. Keep signed-in role, acquired-study, AT, browser/performance and clinical acceptance separate.',
 productChanged:false,browserAcceptance:false,authenticatedAcceptance:false,previewChanged:false,
});
for(const [root,head] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[prep.atlas,prep.atlasHead]]){
 assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',stdio:'pipe',windowsHide:true}).trim(),head);
}
for(const rel of ['tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json','tests/atlas-source-repo.mjs','tests/head-tools-wider-consumer-inverse.mjs','tests/surface-binder-history-inverse.mjs','tests/zero-registration-current-roles-inverse.mjs'])assert.equal(hash(site+'/'+rel),hash(parent.website+'/'+rel),rel);
const binding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(binding.sha256,parent.reviewBindingSha256);
assert.equal(binding.inputs.filter(row=>changed.includes(row.path)||added.includes(row.path)).length,0);
assert.equal(hash(parent.buildArtifacts),parent.buildArtifactsSha256);
const artifact=json(parent.buildArtifacts),files=[];assert(!fs.existsSync(site+'/dist'));
for(const row of artifact.files){
 assert.equal(hash(artifact.root+'/'+row.path),row.sha256,row.path);
 const target=site+'/dist/'+row.path;fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(artifact.root+'/'+row.path,target,fs.constants.COPYFILE_EXCL);
 assert.equal(hash(target),row.sha256,row.path);files.push(row);
}
assert.equal(files.length,1125);
write('BUILD_ARTIFACTS.json',{at:new Date().toISOString(),root:site+'/dist',files,reusedExactParentArtifacts:true,parentBuildArtifacts:parent.buildArtifacts,parentBuildArtifactsSha256:parent.buildArtifactsSha256,newBuildProcessRun:false,allNonTestInputsByteIdentical:true,localOnly:true});
const sourceRows=[...parent.sourceRows.map(row=>row.path),...added].sort().map(rel=>({path:rel,bytes:fs.statSync(site+'/'+rel).size,sha256:hash(site+'/'+rel)}));
assert.equal(sourceRows.length,6481);
const evidence=[];
function scan(dir,prefix){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 assert(!entry.isSymbolicLink());const rel=prefix+entry.name;
 if(entry.isDirectory())scan(dir+'/'+entry.name,rel+'/');else evidence.push({path:rel,bytes:fs.statSync(dir+'/'+entry.name).size,sha256:hash(dir+'/'+entry.name)});
}}
for(const dir of ['checks','preimages'])scan(stage+'/'+dir,dir+'/');
for(const rel of ['PREPARATION.json','SYNTAX.json','ADJACENT_FOLLOWUP.json','UI_PRIORITY_AUDIT.json'])evidence.push({path:rel,bytes:fs.statSync(stage+'/'+rel).size,sha256:hash(stage+'/'+rel)});
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions.length,0);
write('SOURCE_BOUND.json',{
 at:new Date().toISOString(),website:site,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,
 parentReceipt:prep.parentReceipt,parentReceiptSha256:hash(prep.parentReceipt),sourceRows,sourcePaths:sourceRows.length,
 changedAuthoredPaths:changed,newPaths:added,evidence,checks,focusedCasesPassed:42,
 fourOriginalFeatureRootsPass:true,originalFeatureAssertionsRetained:true,actualCurrentChecksAdded:4,
 sourceTransitionFiles:5,exactTransitionHunks:18,syntaxFiles:9,
 adjacentBaseline:checks[3].counts,adjacentInitial:checks[4].counts,adjacentFinal:checks[5].counts,
 allNonTestProductBytesIdentical:true,currentValidatorAndPinUnchanged:true,
 allFourRuntimeSourcesAligned:true,allFourLearnerRuntimesUnchanged:true,
 reviewSourceFiles:1593,reviewInputs:1783,reviewBindingSha256:parent.reviewBindingSha256,
 viewerFiles:54,viewerPackages:24,models:137,modelPaths:144,modelBytes:199072480,
 modules:parent.modules,referenceObjectsRemainInParent:parent.referenceObjectsRemainInParent,
 buildArtifacts:stage+'/BUILD_ARTIFACTS.json',buildArtifactsSha256:hash(stage+'/BUILD_ARTIFACTS.json'),buildFiles:1125,
 productionBuildReusedByExactNonTestIdentity:true,newBuildProcessRun:false,typesRerun:false,browserRerun:false,
 wholeSuitePassing:false,fullProjectTypesPassed:false,authenticatedAcceptance:false,clinicalApproval:false,
 spatialRegistration:false,privateDecisionsReadOrMigrated:false,previewChanged:false,installed:false,publicDeployment:false,
});
console.log(JSON.stringify({receipt:stage+'/SOURCE_BOUND.json',sha256:hash(stage+'/SOURCE_BOUND.json'),sourcePaths:sourceRows.length,changed:changed.length,added:added.length,focusedCases:42,syntaxFiles:9,buildFiles:1125,newBuildProcessRun:false}));
