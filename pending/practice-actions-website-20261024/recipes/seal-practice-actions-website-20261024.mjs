// Seal an isolated source-aligned candidate, never install or refresh a preview.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-practice-actions-website',site=stage+'/website';
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),native=json(prep.atlasReceipt);
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const text=(root,p)=>fs.readFileSync(root+'/'+p,'utf8');
const git=(...a)=>execFileSync('git',['-C',prep.atlas,...a],{encoding:'utf8',windowsHide:true,stdio:'pipe',maxBuffer:128e6}).trim();
assert.equal(hash(prep.parentReceipt),prep.parentReceiptSha256);assert.equal(hash(prep.atlasReceipt),prep.atlasReceiptSha256);
assert.equal(git('rev-parse','HEAD'),prep.atlasHead);assert.equal(git('rev-parse','HEAD^{tree}'),prep.atlasTree);assert.equal(git('status','--porcelain'),'');
for(const r of native.sourceRows)assert.equal(hash(prep.atlas+'/'+r.path),r.sha256,r.path);
const changed=prep.baseSourceRows.filter(r=>hash(site+'/'+r.path)!==r.sha256).map(r=>r.path).sort();
const expected=['docs/anatomy-coverage/independent.json','docs/anatomy-coverage/index.json','docs/anatomy-coverage/nested.json','docs/anatomy-coverage/reference.json','docs/anatomy-coverage/root.json','lib/anatomy-coverage-view.ts','lib/atlas-delivery-policy.ts','lib/atlas-model-inventory.json','lib/lecture-body-catalog.json','scripts/check-anatomy-coverage.mjs','scripts/import-clinical-review.mjs','tests/current-atlas-delivery.test.mjs','tests/upper-vascular-current-delivery.test.mjs','tests/fixtures/current-atlas-delivery.json'].sort();
assert.deepEqual(changed,expected);const added=['tests/practice-actions-current-delivery.test.mjs'];
for(const p of added)assert(!parent.sourceRows.some(r=>r.path===p));
const current='tests/current-atlas-delivery.test.mjs';
assert.equal(text(site,current).replaceAll(prep.atlasHead,parent.atlasHead).replaceAll(prep.atlasTree,parent.atlasTree).replace('assert.equal(sourceFiles,1601);assert.equal(inputs,1794);','assert.equal(sourceFiles,1599);assert.equal(inputs,1792);'),text(parent.website,current),'Every current contract body retained outside exact identity/count seams');
const oldUpper=text(parent.website,'tests/upper-vascular-current-delivery.test.mjs');
let inverse=text(site,'tests/upper-vascular-current-delivery.test.mjs').replace("import {validateCurrentAtlasDelivery as validateDelivery} from './current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';");
const begin=inverse.indexOf("const site = 'F:"),end=inverse.indexOf('\nconst parent = ');assert(begin>=0&&end>begin);
inverse=inverse.slice(0,begin)+"const site = fileURLToPath(new URL('../', import.meta.url));"+inverse.slice(end);
assert.equal(inverse,oldUpper,'Whole original5f3 upper-vascular source, theorem and negative bodies reconstruct exactly');
for(const p of ['tests/tour-explore-current-delivery.test.mjs','tests/tour-explore-focus-current-delivery.test.mjs','tests/current-atlas-delivery.mjs','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','components/HeadAtlasViewer.tsx','components/HeadAtlasGuidedLearning.tsx','components/HeadSeparateComparisonLink.tsx','lib/head-atlas-links.ts','lib/head-separate-comparison.ts','lib/clinical-review-reference-assets.json','scripts/bind-clinical-review.mjs','scripts/build-clinical-review-viewer.mjs'])assert.equal(hash(site+'/'+p),hash(parent.website+'/'+p),p);
assert.equal(text(site,'scripts/import-clinical-review.mjs').replace(prep.atlasHead,parent.atlasHead),text(parent.website,'scripts/import-clinical-review.mjs'));
for(const r of json(stage+'/METADATA_PATCH.json').edits)assert.equal(hash(site+'/'+r.path),r.afterSha256);
assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,json(parent.website+'/lib/atlas-model-inventory.json').models);
const m=json(site+'/atlas-review/manifest.json'),b=json(site+'/atlas-review/integration-inputs.json'),v=json(site+'/public/atlas-review-viewer/manifest.json');
assert.equal(m.revision,prep.atlasHead);assert.equal(m.files.length,1601);assert.equal(b.sourceCommit,prep.atlasHead);assert.equal(b.inputs.length,1794);assert.equal(sha(JSON.stringify(b.inputs)),b.sha256);assert.equal(m.websiteIntegrationSha256,b.sha256);assert.equal(v.websiteIntegrationSha256,b.sha256);assert.equal(v.sourceCommit,prep.atlasHead);assert.equal(v.mode,'production');assert.equal(v.personalRecordsIncluded,false);assert.equal(v.files.length,54);assert.equal(v.packages.length,24);
assert.deepEqual(v.packages,json(parent.website+'/public/atlas-review-viewer/manifest.json').packages);
const originals=execFileSync('git',['-C',prep.atlas,'cat-file','--batch'],{input:m.files.map(r=>prep.atlasHead+':'+r.path+'\n').join(''),windowsHide:true,maxBuffer:128e6,stdio:['pipe','pipe','pipe']});
let offset=0;for(const r of m.files){const end=originals.indexOf(10,offset),header=originals.subarray(offset,end).toString().match(/^[a-f0-9]{40} blob (\d+)$/);assert(header,r.path);const size=Number(header[1]),start=end+1;assert.equal(sha(originals.subarray(start,start+size)),r.sourceSha256,r.path);assert.equal(originals[start+size],10);offset=start+size+1;assert.equal(hash(site+'/atlas-review/'+r.path),r.importedSha256,r.path);}assert.equal(offset,originals.length);
for(const r of b.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const r of v.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+r.path),r.sha256,r.path);
const modules=[];for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const file=site+'/public/atlas-runtime/'+name+'/manifest.json',manifest=json(file);assert.equal(manifest.sourceCommit,prep.atlasHead);assert.equal(manifest.patientDataIncluded,false);assert.notEqual(manifest.clinicalApproved,true);
 for(const r of manifest.files){assert.equal(hash(path.dirname(file)+'/'+r.path),r.sha256,r.path);assert.equal(fs.statSync(path.dirname(file)+'/'+r.path).size,r.bytes,r.path);}
 modules.push({name,manifest:file,sha256:hash(file),sourceCommit:manifest.sourceCommit,files:manifest.files.length});
}
const phases=['import','shoulder','regional','lower','pelvis','exportShoulder','exportRegional','exportLower','exportPelvis','inventory','lecture','coverage','coverageCheck','bind','viewer','prebuild','build','tests','verify','types'];
const checks=phases.map(phase=>{const dir=stage+'/checks/'+phase,t=json(dir+'/TERMINAL.json');assert.equal(t.code,0,phase);for(const name of ['stdout','stderr'])assert.equal(hash(dir+'/'+name+'.log'),t[name+'Sha256']);return{phase,...t};});
const tests=json(stage+'/checks/tests/TERMINAL.json');assert.equal(tests.counts.tests,148);assert.equal(tests.counts.pass,148);for(const key of ['fail','skipped','cancelled'])assert.equal(tests.counts[key],0);
const types=json(stage+'/checks/types/RESULT.json');assert.equal(types.roots.length,28);assert.equal(types.ambient.length,6);assert.equal(types.diagnosticCount,0);assert.equal(types.moduleSubstitutions,false);assert(types.configuredCompilerOptions.strict);for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);
const browserSource='F:/VisibleMedicine/staging/20261024-practice-actions/qa-v3/public/atlas-runtime/head-neck';
const a=json(browserSource+'/manifest.json'),z=json(site+'/public/atlas-runtime/head-neck/manifest.json');
assert.equal(a.sourceCommit,prep.atlasHead);assert.deepEqual(a.files,z.files,'Previously browser-tested public module bytes must be exactly reused, not inferred from source identity');for(const r of a.files)assert.equal(hash(browserSource+'/'+r.path),r.sha256,r.path);
assert.equal(hash(native.browserResult),native.browserResultSha256);const browser=json(native.browserResult);assert.equal(browser.sourceCommit,prep.atlasHead);assert.equal(browser.ownerTabsChanged,false);
const paths=new Set([...prep.baseSourceRows.map(r=>r.path),...added,'atlas-review/manifest.json','atlas-review/integration-inputs.json',...m.files.map(r=>'atlas-review/'+r.path),'public/atlas-review-viewer/manifest.json',...v.files.map(r=>'public/atlas-review-viewer/'+r.path)]);
for(const mod of modules){paths.add('public/atlas-runtime/'+mod.name+'/manifest.json');for(const r of json(mod.manifest).files)paths.add('public/atlas-runtime/'+mod.name+'/'+r.path);}
const sourceRows=[...paths].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
function scan(root,prefix,rows){for(const e of fs.readdirSync(root,{withFileTypes:true})){assert(!e.isSymbolicLink());if(e.isDirectory())scan(root+'/'+e.name,prefix+e.name+'/',rows);else rows.push({path:prefix+e.name,bytes:fs.statSync(root+'/'+e.name).size,sha256:hash(root+'/'+e.name)});}}
const build=[];scan(site+'/dist','',build);build.sort((a,b)=>a.path.localeCompare(b.path));write(stage+'/BUILD_ARTIFACTS.json',{root:site+'/dist',files:build,localOnly:true});
const evidence=[];for(const d of ['checks','preimages','coverage-candidate'])scan(stage+'/'+d,d+'/',evidence);for(const p of ['PREPARATION.json','CAPTURE.json','COVERAGE_TRANSITION.json','METADATA_PATCH.json','BACKUP_PREFLIGHT.json','VALIDATION_SLOT_ACQUIRED.json'])evidence.push({path:p,bytes:fs.statSync(stage+'/'+p).size,sha256:hash(stage+'/'+p)});
const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(pointer.activeWork.current.activeExecutionSessions.length,0);
write(stage+'/SOURCE_BOUND.json',{at:new Date().toISOString(),website:site,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,nativeSourceReceipt:prep.atlasReceipt,nativeSourceReceiptSha256:prep.atlasReceiptSha256,sourceRows,sourcePaths:sourceRows.length,changedAuthoredPaths:changed.filter(p=>!p.endsWith('.json')),changedGeneratedPaths:changed.filter(p=>p.endsWith('.json')),newPaths:added,modules,reviewSourceFiles:m.files.length,reviewInputs:b.inputs.length,reviewBindingSha256:b.sha256,viewerFiles:v.files.length,viewerPackages:v.packages.length,modelAssetsAndAccessUnchanged:true,referenceObjectsRemainInParent:parent.referenceObjectsRemainInParent,checks,evidence,focusedCasesPassed:148,focusedTypeRoots:28,focusedTypeFiles:types.sourceFiles.length,focusedTypeAmbient:6,focusedTypeDiagnostics:0,actualPrebuildPassed:true,actualProductionBuildPassed:true,actualReviewVerifierPassed:true,buildArtifacts:stage+'/BUILD_ARTIFACTS.json',buildArtifactsSha256:hash(stage+'/BUILD_ARTIFACTS.json'),buildFiles:build.length,browserResult:native.browserResult,browserResultSha256:native.browserResultSha256,allFourModuleSourcesAligned:true,sharedPracticeControlsPlayers:4,nativeBrowserPayloadReusedExactly:true,actualWebsiteBrowserReplayPerformed:false,actualExportedPublicRootPracticeVerified:true,reasoningConcepts:232,reasoningSelections:424,wholeSuitePassing:false,fullProjectTypesPassed:false,authenticatedAcceptance:false,newDependenciesInstalled:false,privateDecisionsReadOrMigrated:false,clinicalApproval:false,patientSpaceRegistration:false,previewChanged:false,installed:false,publicDeployment:false});
console.log(JSON.stringify({receipt:stage+'/SOURCE_BOUND.json',sha256:hash(stage+'/SOURCE_BOUND.json'),sourcePaths:sourceRows.length,buildFiles:build.length,focusedCases:148,typeFiles:types.sourceFiles.length,reviewBinding:b.sha256}));
