// Freeze the verified source, retaining the initial tooling/test failures and exact preimages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',atlas=root+'/atlas',base='4f20ae0b62b9e0dab5936b430575a983dcdd934e';
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),base);
const finalPath=root+'/producer-verification-v3/TERMINAL.json',final=json(finalPath);assert.equal(sha(read(finalPath)),'f99fd4aa043a7b1378c5f4212a6c25e37d91c976fa613a4c58d8de7bf979502e');
assert.equal(final.code,0);assert(final.baselineFailureReproduced);assert.deepEqual(final.sourceDrift,[]);
assert(final.commands.filter(c=>c.label!=='baseline-specimen-access').every(c=>c.code===0));
const correctionPath=root+'/specimen-harness-correction/TERMINAL.json',correction=json(correctionPath);assert.equal(correction.code,0);assert.equal(correction.counts.pass,6);assert(correction.completeOriginalAssertionsPreserved);
const focus=json(root+'/focused/TERMINAL.json');assert.equal(focus.code,0);assert.deepEqual(focus.sourceDrift,[]);assert.deepEqual(focus.producerDrift,[]);
const files=['app/body-explorer.tsx','app/eye-layers.tsx','app/ventricles.tsx','content/body-renderer-revision.json','lib/head-selection-channel.ts','scripts/test-head-resource-channel.mjs','scripts/test-head-resource-scopes.mjs','scripts/test-specimen-model-access.mjs'].sort();
const status=runGit(['-C',atlas,'status','--porcelain=v1']).toString().trimEnd().split('\n').filter(Boolean).map(s=>s.slice(3).trim()).sort();assert.deepEqual(status,files);
const originalRows=json(root+'/producer-verification/INPUTS.json').before;
const drift=originalRows.filter(row=>sha(read(atlas+'/'+row.path))!==row.sha256).map(row=>row.path);assert.deepEqual(drift,['scripts/test-specimen-model-access.mjs']);
const sourceRows=files.map(p=>({path:p,bytes:read(atlas+'/'+p).length,sha256:sha(read(atlas+'/'+p))}));
fs.mkdirSync(root+'/verified-source');for(const row of sourceRows){const to=root+'/verified-source/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(atlas+'/'+row.path,to,fs.constants.COPYFILE_EXCL);}
const git=args=>runGit(['-C',atlas,...args]).toString().trim();git(['add','--',...files]);assert.deepEqual(git(['diff','--cached','--name-only']).split('\n').sort(),files);
git(['commit','-m','Explain source-bound head model access failures without granting access']);const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']);assert.equal(git(['status','--porcelain']),'');
assert.equal(git(['rev-parse','HEAD^']),base);for(const row of sourceRows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,row.path);
const hostChanges=['components/HeadAtlasInlineComparison.tsx','lib/head-live-selection.ts','tests/head-inline-frame.test.ts','tests/head-live-selection.test.ts'].map(p=>({path:p,beforeSha256:sha(read(root+'/before/host/'+p)),afterSha256:sha(read(root+'/website/'+p))}));
const result={schema:'vm-head-model-access-source/1',at:new Date().toISOString(),atlas,base,head,tree,clean:true,sourceRows,hostChanges,
 focused:{receipt:root+'/focused/TERMINAL.json',sha256:sha(read(root+'/focused/TERMINAL.json')),hostTests:51,hostPass:51,classifierTests:5,classifierPass:5,actualSceneExpressions:3,originalHeadProtocolAssertionsPassed:true},
 producerTypesAndBuild:{receipt:finalPath,sha256:sha(read(finalPath)),passed:true},testHarnessCorrection:{receipt:correctionPath,sha256:sha(read(correctionPath)),tests:6,pass:6,originalAssertionsRetained:true,productionInputsUnchangedAfterBuild:true},
 retainedFailures:[root+'/producer-verification/TERMINAL.json',root+'/producer-verification-v2/TERMINAL.json',root+'/producer-verification-v3/baseline-specimen-access.stdout.log'],
 nativeMriBaseline:{receipt:root+'/BROWSER_BASELINE.json',sha256:sha(read(root+'/BROWSER_BASELINE.json')),newHostBrowserAcceptance:false},
 geometryChanged:false,newMedicalClaims:false,newDependencies:false,licensingChanged:false,accessRulesChanged:false,sourceProtocolAdvisoryOnly:true,full71AndEightIdeasPreserved:true,
 containedBuildExportPending:true,websiteImportAndReviewRebindPending:true,websiteTypesAndBuildPending:true,canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.pendingHeadModelAccess={...result,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json'))};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),head,tree,sourcePaths:sourceRows.length,websiteImportAndReviewRebindPending:true,ownerPreviewChanged:false}));
