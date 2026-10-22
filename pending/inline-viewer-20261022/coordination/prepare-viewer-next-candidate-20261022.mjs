import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate';
const candidate=root+'/website',site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
assert(!fs.existsSync(root),'Create-only candidate');
const plan=json('F:/VisibleMedicine/recovery/local-cutover/20261021-colic-ultrasound/PLAN.json');
const prepared=json('F:/VisibleMedicine/staging/20261022-complete-current-website/PREPARED.json');
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),plan.websiteHead);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),plan.atlasSource);
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const foundation=new Map(),duplicates=[];
for(const row of [...plan.sourceRows,...plan.preserved]){
 const previous=foundation.get(row.path);
 if(previous){assert.deepEqual(previous,row,'Duplicate path must have identical complete evidence');duplicates.push(row.path);}
 foundation.set(row.path,row);
}
assert.deepEqual(duplicates,['public/atlas-runtime/head-neck/LICENSE']);
assert.equal(foundation.size,5736,'5737 obligations include one identical retained-licence overlap');
const additions=[];
for(const row of prepared.sourceFiles){
 const existing=foundation.get(row.path);
 if(existing)assert.equal(existing.sha256,row.sha256,row.path);
 else{foundation.set(row.path,row);additions.push(row.path);}
}
assert.deepEqual(additions,['docs/fracture-exams/CHECKPOINT-20260928.md','docs/fracture-exams/README.md','docs/master-plan.md']);
assert.equal(foundation.size,5739);
const ui=json('F:/VisibleMedicine/staging/20261022-inline-viewer-bound-ready/MAIN_VERIFIED.json');
const aorta=json('F:/VisibleMedicine/staging/20261022-aorta-runtime-family-proposal/MAIN_REVIEW.json');
const arterial=json('F:/VisibleMedicine/staging/20261022-arterial-epoch-proposal/MAIN_REVIEW.json');
const cervical=json('F:/VisibleMedicine/staging/20261022-cervical-epoch-proposal-v3/MAIN_REVIEW.json');
const simpleRoot='F:/VisibleMedicine/staging/20261022-simple-runtime-family-proposal';
const simple=json(simpleRoot+'/MAIN_REVIEW.json');
const simplePaths=[...simple.accepted.map(row=>row.path),...simple.accepted.map(row=>'tests/fixtures/runtime-family-before-20261022/'+row.path.slice(6)+'.raw'),'tests/runtime-family-forward-inverse.test.mjs'];
const packets=[ui,aorta,arterial,cervical,{root:simpleRoot,files:simplePaths.map(path=>({path,bytes:read(simpleRoot+'/'+path).length,sha256:sha(read(simpleRoot+'/'+path))}))}];
const overlay=new Map();
for(const packet of packets)for(const row of packet.files){
 assert(!overlay.has(row.path),'Exclusive overlay ownership: '+row.path);
 const from=packet.root+'/'+row.path;assert.equal(sha(read(from)),row.sha256,row.path);overlay.set(row.path,{...row,from});
}
assert.equal(overlay.size,27);
const resolveCandidate=relative=>{
 assert(!path.isAbsolute(relative)&&!relative.includes('\\')&&relative.split('/').every(part=>part&&part!=='.'&&part!=='..'));
 const resolved=path.resolve(candidate,relative);assert(resolved.startsWith(path.resolve(candidate)+path.sep));return resolved;
};
fs.mkdirSync(root,{recursive:true});
const state={at:new Date().toISOString(),phase:'prepare-isolated-candidate',site,candidate,frozenFullRunCandidate:prepared.candidate,installedSource:plan.atlasSource,installedReview:plan.review,websiteHead:plan.websiteHead,canonicalChanged:false,privateStateOrScansCopied:false,rawLocalGitAncestrySharedNotUploaded:true,privateSourceArtifactsLocalOnly:true,heavyJobStarted:false,sourceObligations:5737,distinctInstalledPaths:5736,identicalOverlap:duplicates};
const save=()=>fs.writeFileSync(root+'/STATE.json',JSON.stringify(state,null,2)+'\n');save();
fs.writeFileSync(root+'/PREPARATION_COUNT_REFUSAL.json',JSON.stringify({at:new Date().toISOString(),originalExpected:5740,actualDistinctFoundation:5739,reason:'Before directory creation the strict count refused an overcount. The5737installed obligations include the identical head-neck LICENSE row twice;5736distinct installed paths plus3stock prose paths are5739. Full row bytes/hashes are unchanged; no omitted source or weakened assertion.',canonicalChanged:false,frozenSuiteChanged:false},null,2)+'\n',{flag:'wx'});
runGit(['clone','--shared','--no-checkout',site,candidate]);
assert.equal(runGit(['-C',candidate,'rev-parse','HEAD']).toString().trim(),plan.websiteHead);
runGit(['-C',candidate,'read-tree','HEAD']);
const expected=new Map();
for(const row of foundation.values()){
 const bytes=read(site+'/'+row.path);assert.equal(sha(bytes),row.sha256,row.path);
 const target=resolveCandidate(row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(site+'/'+row.path,target,fs.constants.COPYFILE_EXCL);
 assert.equal(sha(read(target)),row.sha256,row.path);expected.set(row.path,{path:row.path,bytes:bytes.length,sha256:row.sha256});
}
assert(fs.statSync(site+'/node_modules').isDirectory());fs.symlinkSync(site+'/node_modules',candidate+'/node_modules','junction');
const overlayChanges=[];
for(const row of overlay.values()){
 const target=resolveCandidate(row.path),before=expected.get(row.path)??null;
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(row.from,target);
 assert.equal(sha(read(target)),row.sha256,row.path);
 expected.set(row.path,{path:row.path,bytes:row.bytes,sha256:row.sha256});
 overlayChanges.push({path:row.path,before,after:{bytes:row.bytes,sha256:row.sha256}});
}
Object.assign(state,{phase:'source-overlays-copied',foundationPaths:foundation.size,overlayPaths:overlay.size,namedPaths:expected.size});save();
const beforeBinding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(beforeBinding.inputs.length,1721);assert.equal(beforeBinding.sha256,plan.review);
const generated=['atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','atlas-review/manifest.json','atlas-review/integration-inputs.json'];
const generatedBefore=new Map(generated.map(path=>[path,read(candidate+'/'+path)]));
const env={...process.env,VM_ATLAS_SOURCE_REPO:atlas,VM_WEBSITE_ROOT:candidate,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};
const bind=spawnSync(process.execPath,['scripts/bind-clinical-review.mjs'],{cwd:candidate,encoding:'utf8',windowsHide:true,env});
const log=(bind.stdout??'')+(bind.stderr??'');fs.writeFileSync(root+'/BIND.log',log,{flag:'wx'});assert.equal(bind.status,0,log);
const afterBinding=json(candidate+'/atlas-review/integration-inputs.json');
assert.equal(afterBinding.inputs.length,1723);assert.equal(afterBinding.sourceCommit,plan.atlasSource);
assert.equal(afterBinding.sha256,sha(JSON.stringify(afterBinding.inputs)));assert.notEqual(afterBinding.sha256,beforeBinding.sha256);
const beforeRows=new Map(beforeBinding.inputs.map(row=>[row.path,row.sha256]));
const added=afterBinding.inputs.filter(row=>!beforeRows.has(row.path)).map(row=>row.path).sort();
const changed=afterBinding.inputs.filter(row=>beforeRows.has(row.path)&&beforeRows.get(row.path)!==row.sha256).map(row=>row.path).sort();
assert.deepEqual(added,['components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css']);
assert.deepEqual(changed,['components/AtlasRuntimeFrame.tsx','scripts/bind-clinical-review.mjs']);
assert.deepEqual(beforeBinding.inputs.map(row=>row.path).sort(),afterBinding.inputs.filter(row=>beforeRows.has(row.path)).map(row=>row.path).sort());
for(const row of afterBinding.inputs)assert.equal(sha(read(candidate+'/'+row.path)),row.sha256,row.path);
const beforeBody=JSON.parse(generatedBefore.get(generated[0])),afterBody=json(candidate+'/'+generated[0]);
assert.equal(afterBody.sourceRendererSha256,beforeBody.sourceRendererSha256);
assert.equal(afterBody.websiteIntegrationSha256,afterBinding.sha256);
assert.equal(afterBody.sha256,sha(JSON.stringify({source:beforeBody.sourceRendererSha256,website:afterBinding.sha256})));
const restoredBody=structuredClone(afterBody);restoredBody.sha256=beforeBody.sha256;restoredBody.websiteIntegrationSha256=beforeBody.websiteIntegrationSha256;assert.deepEqual(restoredBody,beforeBody);
const beforeShoulder=JSON.parse(generatedBefore.get(generated[1])),afterShoulder=json(candidate+'/'+generated[1]);
assert.deepEqual(afterShoulder.sourceRevisions,beforeShoulder.sourceRevisions);
for(const [id,tracks]of Object.entries(afterShoulder.sourceRevisions))for(const track of ['geometry','teaching'])
 assert.equal(afterShoulder.revisions[id][track],tracks[track]===null?null:sha(JSON.stringify({source:tracks[track],website:afterBinding.sha256})));
const restoredShoulder=structuredClone(afterShoulder);restoredShoulder.revisions=beforeShoulder.revisions;restoredShoulder.websiteIntegrationSha256=beforeShoulder.websiteIntegrationSha256;assert.deepEqual(restoredShoulder,beforeShoulder);
const beforeManifest=JSON.parse(generatedBefore.get(generated[2])),afterManifest=json(candidate+'/'+generated[2]);
const restoredManifest=structuredClone(afterManifest);restoredManifest.websiteIntegrationSha256=beforeManifest.websiteIntegrationSha256;
for(const row of restoredManifest.files){const old=beforeManifest.files.find(before=>before.path===row.path);assert(old);assert.equal(row.sourceSha256,old.sourceSha256);if(generated.slice(0,2).includes('atlas-review/'+row.path))row.importedSha256=old.importedSha256;}
assert.deepEqual(restoredManifest,beforeManifest);
for(const relative of generated){const bytes=read(candidate+'/'+relative);assert.notEqual(sha(bytes),sha(generatedBefore.get(relative)));expected.set(relative,{path:relative,bytes:bytes.length,sha256:sha(bytes)});}
for(const row of expected.values())assert.equal(sha(read(candidate+'/'+row.path)),row.sha256,row.path);
for(const row of foundation.values())assert.equal(sha(read(site+'/'+row.path)),row.sha256,'Canonical unchanged '+row.path);
for(const row of prepared.sourceFiles)assert.equal(sha(read(prepared.candidate+'/'+row.path)),row.sha256,'Frozen run input unchanged '+row.path);
assert.equal(sha(read(candidate+'/lib/plexus-review-manifest.json')),sha(read(site+'/lib/plexus-review-manifest.json')));
assert.equal(sha(read(candidate+'/.local/plexus-review/assets.ts')),sha(read(site+'/.local/plexus-review/assets.ts')));
const oldViewer=json(candidate+'/public/atlas-review-viewer/manifest.json');
assert.equal(oldViewer.websiteIntegrationSha256,beforeBinding.sha256,'Viewer intentionally awaits actual build');
const receipt={at:new Date().toISOString(),...state,phase:'real-source-binding-prepared-viewer-build-deferred',
 foundationPaths:foundation.size,overlayPaths:27,namedPaths:expected.size,overlayChanges,sourceRows:[...expected.values()].sort((a,b)=>a.path.localeCompare(b.path)),
 binding:{before:beforeBinding.sha256,after:afterBinding.sha256,beforeInputs:1721,afterInputs:1723,added,changed,sourceAndOriginalContentPreserved:true,sourceRendererAndShoulderTrackHashesPreserved:true,derivedPresentationRevisionsChanged:true,log:root+'/BIND.log',logSha256:sha(read(root+'/BIND.log'))},
 canonicalChanged:false,frozenSuiteInputsChanged:false,previewRestarted:false,privateRecordsCopied:false,entitlementsChanged:false,modelsAndAcceptedMasksChanged:false,plexusPacketAndAssetsUnchanged:true,
 heavyJobStarted:false,viewerBuild:false,currentPinAdmission:false,fullTypes:false,websiteBuild:false,nativeOriginalCohortsRun:false,passingClaim:false,clinicalApproval:false,patientSpaceRegistration:false,publicDeployment:false,
 limits:'Preparatory local source assembly plus actual binding only. Candidate viewer/current pin deliberately remain at pre-bind identity until a single sequential rebuild/admission after the complete stock run terminates. Do not preview/install or claim a coherent closed application yet. Local shared Git ancestry, authored private source artifacts and generated derivatives stay F-only, excluded from filtered source backup.',
 next:'Wait for exact full-run terminal while advancing safe independent work. Then build Review viewer, verify exact allowed binding/source/package transitions and create strict current pin, run actual affected original/native roots plus Frame consumer/history admissions, full types/build and browser acceptance before fresh-draft safe owner cutover.'};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});Object.assign(state,{phase:receipt.phase,afterReview:afterBinding.sha256,viewerBuildPending:true});save();
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingCoherentViewerCandidate={stage:root,candidate,receipt:root+'/PREPARED.json',receiptSha256:sha(read(root+'/PREPARED.json')),source:plan.atlasSource,beforeReview:beforeBinding.sha256,afterBinding:afterBinding.sha256,boundInputs:1723,overlayPaths:27,canonicalInstalled:false,viewerBuild:false,currentPinAdmission:false,fullTypes:false,websiteBuild:false,next:receipt.next};pointer.activeWork.updated=receipt.at;pointer.updatedAt=receipt.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/PREPARED.json',sha256:sha(read(root+'/PREPARED.json')),sourcePaths:expected.size,addedBindingInputs:2,changedExistingBindingInputs:2,afterReview:afterBinding.sha256,viewerBuild:false,canonicalChanged:false,frozenSuiteInputsChanged:false}));
