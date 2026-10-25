import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261025-neonatal-current-final-website',sourceFile=stage+'/SOURCE_CANDIDATE.json';
assert.equal(hash(sourceFile),'7f105c077fa9813868dc25efd849ebb7ac20934162cc8e9d8431f540ef2fd0e4');
const source=json(sourceFile),d1File='F:/VisibleMedicine/staging/20261025-abdominal-us-website/SOURCE_CANDIDATE.json';
assert.equal(hash(d1File),'d1ad04d547ab70a392f3e3ad9f49a026e319abf5cbc0fca1bdd34aa45652490f');
const d1=json(d1File),old=new Map(d1.sourceRows.map(r=>[r.path,r])),current=new Map(source.sourceRows.map(r=>[r.path,r]));
for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const delta=[];
for(const r of source.sourceRows)if(old.get(r.path)?.sha256!==r.sha256){assert(/^(tests|scripts|docs)\//.test(r.path),'Unexpected shipped-source change '+r.path);delta.push(r.path);}
for(const r of d1.sourceRows)assert(current.has(r.path),'No parent path removed');
const rootsFile=stage+'/checks/whole-roots-attempt-1/RESULT.json',typesFile=stage+'/checks/focused-types-attempt-1/RESULT.json',historyFile='F:/VisibleMedicine/staging/20261025-neonatal-historical-context/checks/whole-roots-attempt-1/RESULT.json';
for(const [file,sha]of [[rootsFile,'fae250d4f753cedfb8226e1fb200c96cde622eeb84932af8f2ccdfdb2b40a6c3'],[typesFile,'ded60a60b37fa94b225d1df4e8fdc4a33bddaae3e1f7545dd573f33045128e53'],[historyFile,'cc356c124b9d5d7ec8b0e4ad46249c27a26f3c54b98673a12095aa36631c0c53']]){assert.equal(hash(file),sha);assert.equal(json(file).passing,true);}
const roots=json(rootsFile),types=json(typesFile),historical=json(historyFile);assert.equal(roots.expectedWholeCases,16);assert.equal(historical.expectedWholeCases,5);assert.equal(types.typeResult.diagnostics,0);
for(const row of [...roots.rows,...historical.rows]){assert.equal(row.code,0);assert.equal(row.counts.tests,row.expected);assert.equal(row.counts.pass,row.expected);assert.equal(row.counts.fail+row.counts.skipped+row.counts.cancelled+row.counts.todo,0);}
assert.equal(hash(types.typeResult.path),types.typeResult.sha256);for(const r of json(types.typeResult.path).actualTransitiveGraph)assert.equal(hash(r.path),r.sha256);
const {restorePreNeonatalReasoningRole}=await import(pathToFileURL(source.website+'/tests/restore-neonatal-reasoning-role.mjs'));
const cp=fs.readFileSync(source.website+'/tests/clinical-review-neonatal-cranial-us.test.ts','utf8');
let original=restorePreNeonatalReasoningRole(cp).replace("import {restorePreRegionalTourHeadEntry} from './restore-pre-tour-head-entry.mjs';\n",'').replace('restorePreRegionalTourHeadEntry(norm(source))','norm(source)');
const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(original).digest('hex'),'ed23b3a23e83fffbdffecb0e67d31ffbc6e62999cac30adbbf81cbf49612b73f');
const nativeFile='F:/VisibleMedicine/staging/20261025-abdominal-arterial-us-native/SOURCE_CANDIDATE.json';assert.equal(hash(nativeFile),'3ab3744296035502165d3b3b2439338306533a15dffdd72d4e6103aafdc6f75a');
const native=json(nativeFile);for(const r of native.sourceRows)assert.equal(hash(native.atlas+'/'+r.path),r.sha256,r.path);
const inputs=json(source.website+'/atlas-review/integration-inputs.json'),manifest=json(source.website+'/atlas-review/manifest.json');
assert.equal(inputs.inputs.length,1816);assert.equal(manifest.files.length,1612);for(const r of inputs.inputs)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
const buildResultFile='F:/VisibleMedicine/staging/20261025-abdominal-us-website/checks/build-attempt-1/RESULT.json';
assert.equal(hash(buildResultFile),'e36a4b00508d0267711307c8d98198d06f6a0a02fdc60f0afa21cf3d019cbf68');
const buildResult=json(buildResultFile);assert.equal(buildResult.passing,true);assert.equal(buildResult.artifacts.sha256,'d36c4a1ca75ce62d8eff7a6e54ca535a481618a2d8e691e0ae151bed99785cc9');
assert.equal(hash(buildResult.artifacts.path),buildResult.artifacts.sha256);const built=json(buildResult.artifacts.path);for(const r of built.files)assert.equal(hash(built.root+'/'+r.path),r.sha256,r.path);
const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);
const retain=[
 'F:/VisibleMedicine/staging/20261025-neonatal-current-baseline/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-neonatal-path-website/checks/whole-roots-attempt-1/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-neonatal-source-roles-website/checks/whole-roots-attempt-1/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-neonatal-source-roles-website/checks/original-two-larger-heap-attempt-1/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-neonatal-source-roles-website/checks/current-ventricular-attempt-1/RESULT.json'
].map(p=>({path:p,sha256:hash(p),passing:json(p).passing}));
const result={schema:'vm-neonatal-current-review-verification/1',at:new Date().toISOString(),passing:true,source:{path:sourceFile,sha256:hash(sourceFile)},sourceRows:source.sourceRows.length,currentWholeRoots:{path:rootsFile,sha256:hash(rootsFile),cases:16,roots:3},historicalWholeRoots:{path:historyFile,sha256:hash(historyFile),cases:5,roots:2,originalClinicalSourceSha256:'ed23b3a23e83fffbdffecb0e67d31ffbc6e62999cac30adbbf81cbf49612b73f'},focusedTypes:{path:typesFile,sha256:hash(typesFile),roots:types.typeResult.roots,graphFiles:types.typeResult.files,diagnostics:0,fullProjectTypes:false},originalClinicalCompleteByteInverseVerified:true,currentQuestionTamperCategories:5,currentInboxAndStaleZeroStorageRefusalsVerified:true,strictRelativePathAndExactCatchAllRouteVerified:true,allNativeSourceFilesUnchanged:6400,allProtectedInputsUnchanged:1816,allReviewSourceFilesUnchanged:1612,shippedRuntimeUnchangedTo:{path:d1File,sha256:hash(d1File),verifiedPriorBuildArtifacts:built.files.length},developerOnlyDeltaFromBuiltD1:delta,actualNewBuildExecuted:false,retainedFailures:retain,frozenNativeVentricularScript:'Retained unmodified current-source failure at old total/tail catalogue assertion after later legitimate neck/hip/carpal/vascular additions. No current whole-script pass claimed or old counts repinned.',newClinicalDecisionsReadOrWritten:false,ownerPreviewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false,wholeStockSuitePassing:false,originalStockFailureCountUnadjusted:316,originalStockSkippedCountUnadjusted:3,primaryNegativeGapAudit:{path:'F:/VisibleMedicine/staging/20261025-pancreatic-eus-next-proposal/REPORT.md',sha256:'d2d33c55b3f432fe1646e3d714b2527a116e8965f948955b6b010cbba480736f',unfilledFmaIds:['FMA14787','FMA70480'],contentAdded:false},goalUnchanged:{requirements:71,optionalIdeas:8}};
fs.writeFileSync(stage+'/VERIFICATION_SUMMARY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verification:stage+'/VERIFICATION_SUMMARY.json',sha256:hash(stage+'/VERIFICATION_SUMMARY.json'),currentCases:16,historicalCases:5,focusedDiagnostics:0,developerDelta:delta.length,buildArtifactsRehashed:built.files.length}));
