// Focused types and exact source/generated-artifact preservation for the integrated UI.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-linked-menus-website',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),proposal=json(prep.proposal);
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
if(process.argv[2]==='types'){
 assert.equal(process.cwd().replaceAll('\\','/').toLowerCase(),site.toLowerCase());
 const ts=createRequire(site+'/package.json')('typescript'),loaded=ts.readConfigFile(site+'/tsconfig.json',ts.sys.readFile);assert(!loaded.error);
 const parsed=ts.parseJsonConfigFileContent(loaded.config,ts.sys,site);assert.equal(parsed.errors.length,0);
 const roots=['components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLearningPicker.tsx'].map(p=>site+'/'+p),ambient=parsed.fileNames.filter(p=>p.endsWith('.d.ts'));assert.equal(ambient.length,6);
 const program=ts.createProgram([...roots,...ambient],{...parsed.options,noEmit:true,incremental:false,composite:false,tsBuildInfoFile:undefined});
 const diagnostics=ts.getPreEmitDiagnostics(program),sourceFiles=program.getSourceFiles().map(f=>({path:f.fileName,sha256:hash(f.fileName)}));
 write(stage+'/checks/TYPES.json',{at:new Date().toISOString(),roots,ambient,configSha256:hash(site+'/tsconfig.json'),sourceFiles,diagnosticCount:diagnostics.length,diagnostics:diagnostics.map(d=>({code:d.code,path:d.file?.fileName,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')})),fullProjectTypes:false});
 console.log(JSON.stringify({roots:roots.length,ambient:ambient.length,files:sourceFiles.length,diagnostics:diagnostics.length}));process.exitCode=diagnostics.length?1:0;
}else if(process.argv[2]==='seal'){
 assert.equal(hash(prep.parentReceipt),prep.parentReceiptSha256);assert.equal(hash(prep.proposal),prep.proposalSha256);
 const beforeViewer=json(parent.website+'/public/atlas-review-viewer/manifest.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.files.length,46);assert.deepEqual(viewer.packages,beforeViewer.packages);
 assert.equal(hash(site+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'),hash(parent.website+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'));
 const oldViewer=new Set(['public/atlas-review-viewer/manifest.json',...beforeViewer.files.map(r=>'public/atlas-review-viewer/'+r.path)]),newViewer=new Set(['public/atlas-review-viewer/manifest.json',...viewer.files.map(r=>'public/atlas-review-viewer/'+r.path)]);
 for(const r of viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+r.path),r.sha256);
 const allowed=new Set([...proposal.changedPaths,'scripts/bind-clinical-review.mjs','tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery.json','atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json']);
 const changed=[],paths=new Set();for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);if(oldViewer.has(r.path))continue;paths.add(r.path);if(hash(site+'/'+r.path)!==r.sha256){assert(allowed.has(r.path),'Unexpected changed source '+r.path);changed.push(r.path);}}
 assert.deepEqual(new Set(changed),allowed);
 for(const r of json(parent.buildArtifacts).files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256);
 for(const r of proposal.sourceRows)assert.equal(hash(proposal.website+'/'+r.path),r.sha256);
 for(const r of proposal.changedPaths)assert.equal(hash(site+'/'+r),hash(proposal.website+'/'+r));
 for(const p of oldViewer)if(!newViewer.has(p))assert(!fs.existsSync(site+'/'+p));
 const added=['tests/head-link-menu-keyboard.test.mjs','tests/head-link-menu-bound-delivery.test.mjs'];for(const p of [...added,...newViewer])paths.add(p);
 const binding=json(site+'/atlas-review/integration-inputs.json'),capture=json(stage+'/CAPTURE.json');assert.equal(binding.sha256,capture.binding);assert.equal(binding.inputs.length,1740);assert.equal(binding.sha256,viewer.websiteIntegrationSha256);
 for(const r of binding.inputs)assert.equal(hash(site+'/'+r.path),r.sha256);
 const manifest=json(site+'/atlas-review/manifest.json'),beforeManifest=json(parent.website+'/atlas-review/manifest.json');assert.equal(manifest.files.length,1571);
 assert.deepEqual(manifest,{...beforeManifest,websiteIntegrationSha256:binding.sha256,files:beforeManifest.files.map(r=>['content/body-renderer-revision.json','content/review-revisions.json'].includes(r.path)?{...r,importedSha256:hash(site+'/atlas-review/'+r.path)}:r)});
 for(const r of manifest.files)assert.equal(hash(site+'/atlas-review/'+r.path),r.importedSha256);
 const phases=['stale','bind','viewer','verify','tests-v2','prebuild','build'],checks=phases.map(p=>{const d=stage+'/checks/'+p,t=json(d+'/TERMINAL.json');assert.equal(t.code,p==='stale'?1:0,p);assert.equal(hash(d+'/stdout.log'),t.stdoutSha256);assert.equal(hash(d+'/stderr.log'),t.stderrSha256);return t;});
 const native=checks.find(r=>r.phase==='tests-v2');assert.equal(native.counts.pass,120);assert.equal(native.counts.fail+native.counts.skipped+native.counts.cancelled,0);
 const types=json(stage+'/checks/TYPES.json');assert.equal(types.diagnosticCount,0);assert.equal(types.roots.length,2);assert.equal(types.ambient.length,6);for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256);
 const oldTypes=json('F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard/checks/TYPES.corrected.json');
 const rootRelative=p=>p.replaceAll('\\','/').replace(/^.*\/website\//,'');
 assert.deepEqual(types.roots.map(rootRelative),oldTypes.roots.map(rootRelative));
 for(const p of ['lib/head-disclosure-keyboard.ts','components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLearningPicker.tsx','app/atlas/head-neck-3d/head-learning.css'])assert.equal(hash(site+'/'+p),hash(proposal.website+'/'+p));
 // The isolated actual-component browser proof is reusable for these exact bytes,
 // not a claim that the authenticated integrated Website has been accepted.
 const browserProof='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard/browser/OBSERVATIONS.json';
 const files=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){assert(!f.isSymbolicLink());if(f.isDirectory())walk(dir+'/'+f.name,prefix+f.name+'/');else files.push({path:prefix+f.name,bytes:fs.statSync(dir+'/'+f.name).size,sha256:hash(dir+'/'+f.name)});}}
 walk(site+'/dist');files.sort((a,b)=>a.path.localeCompare(b.path));
 if(fs.existsSync(stage+'/BUILD_ARTIFACTS.json')){const recorded=json(stage+'/BUILD_ARTIFACTS.json');assert.equal(recorded.root,site+'/dist');assert.deepEqual(recorded.files,files);assert.equal(recorded.localOnly,true);}
 else write(stage+'/BUILD_ARTIFACTS.json',{at:new Date().toISOString(),root:site+'/dist',files,localOnly:true});
 const sourceRows=[...paths].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
 const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true}).trim();
 for(const[root,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[prep.atlas,prep.atlasHead]])assert.equal(git(root,'rev-parse','HEAD'),head);assert.equal(git(prep.atlas,'status','--porcelain'),'');
 const inventory=json(site+'/lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(r=>r.paths).length,144);assert.equal(inventory.models.reduce((n,r)=>n+r.bytes,0),199072480);
 assert.equal(json(new URL('./CURRENT_CHECKPOINT.json',import.meta.url)).activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 write(stage+'/SOURCE_BOUND.json',{at:new Date().toISOString(),website:site,parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,proposal:prep.proposal,proposalSha256:prep.proposalSha256,
  atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,sourceRows,sourcePaths:sourceRows.length,changedExistingSourcePaths:changed,addedPaths:added,removedViewerPaths:[...oldViewer].filter(p=>!newViewer.has(p)),
  reviewSourceFiles:1571,sourceFiles:1571,reviewInputs:1740,reviewBindingSha256:binding.sha256,viewerFiles:46,viewerPackages:22,onlyExistingBoundInputsChanged:capture.changedExistingInputs,newBoundInput:capture.addedInput,
  checks,nativeCasesPassed:120,focusedTypeRoots:2,focusedTypeFiles:types.sourceFiles.length,focusedTypeDiagnostics:0,originalTestAssertionsPreserved:true,
  originalCurrentDeliveryCounterOnly:true,wholeSourceModelPackageNoticeAccessPreservation:true,actualPrebuildPassed:true,actualProductionBuildPassed:true,
  browserEvidence:browserProof,browserEvidenceSha256:hash(browserProof),browserScope:'Reused actual-component/static-focus/synthetic-teaching proof for exact2components/helper/CSS, not integrated authenticated acceptance.',
  buildArtifacts:stage+'/BUILD_ARTIFACTS.json',buildArtifactsSha256:hash(stage+'/BUILD_ARTIFACTS.json'),buildFiles:files.length,
  wholeSuitePassing:false,fullProjectTypesPassing:false,authenticatedAcceptance:false,actualDeviceImeAcceptance:false,clinicalApproval:false,spatialRegistration:false,privateDecisionsReadOrMigrated:false,previewChanged:false,installed:false,publicDeployment:false});
 console.log(JSON.stringify({receipt:stage+'/SOURCE_BOUND.json',sha256:hash(stage+'/SOURCE_BOUND.json'),sourcePaths:sourceRows.length,buildFiles:files.length,nativeCases:120,types:types.sourceFiles.length,binding:binding.sha256}));
}
