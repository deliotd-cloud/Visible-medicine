// Main-owned anonymous runtime QA and unintegrated two-file clarity fix.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-modality-help-clarity',site=stage+'/website';
const qa='F:/VisibleMedicine/staging/20261023-candidate-browser-qa';
const parentReceipt='F:/VisibleMedicine/staging/20261023-current-ui-delivery/SOURCE_CURRENT.json';
assert.equal(sha(read(parentReceipt)),'bd073fb1d6134af415e8b77f82ba218a1756e47af2c2ab503459e711ea8a6cc8');
const source=json(parentReceipt),files=['components/AtlasWorkspaceNavigation.tsx','tests/atlas-workspace-simplification.test.ts'];
const classification='F:/VisibleMedicine/staging/20261023-prod-auth-entry-triage/CLASSIFICATION.md';
assert.equal(sha(read(classification)),'8e411e5f6f9bc9c7003fa0f7762b26dda3a9d87debbbc82f648335d77c2b700c');
const slab=Buffer.alloc(65536);function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const rows=files.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
function exactInverses(){
  for(const p of files){const before=read(stage+'/'+p.replaceAll('/','__')+'.before.raw').toString(),now=read(site+'/'+p).toString();assert.equal(now.split('About modality links').length,2);assert.equal(now.replace('About modality links','Switching views'),before,'Entire original file '+p);assert.equal(sha(before),source.sourceRows.find(r=>r.path===p).sha256);}
  const p='components/AtlasRegionNavigation.tsx';assert.equal(hash(site+'/'+p),source.sourceRows.find(r=>r.path===p).sha256);
}
const pending='The reviewed two-file modality-help copy proposal is SOURCE-ONLY and not in the sealed6130-path built candidate or normal preview. Integrate it with a subsequent coherent UI batch before fresh applicable build/browser acceptance. Continue full Atlas anatomy/teaching/imaging/Studio roadmap independently. Anonymous built-Worker QA is not signed-in Studio/Clinical Review, scan/GPU or clinical acceptance. Authenticated local acceptance needs the supported Sites development/hosted identity boundary; do not add dispatcher-owned auth routes or manufacture identity/roles/entitlements. Existing full-TypeScript resource failure, failed6044-case stock gate/three symlink skip limits/eight feature roots and owner no-normal-preview install/restart/refresh remain.';
if(process.argv.includes('--prepare')){
  exactInverses();
  for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,'Frozen built Website '+r.path);
  const build=json(source.buildArtifacts);assert.equal(sha(read(source.buildArtifacts)),source.buildArtifactsSha256);for(const r of build.files)assert.equal(hash(source.website+'/dist/'+r.path),r.sha256,'Frozen build '+r.path);
  const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
  const stop=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"$qaListeners=@(Get-NetTCPConnection -LocalPort 3047 -State Listen -ErrorAction SilentlyContinue);$qaOwned=@(Get-CimInstance Win32_Process -Filter 'ProcessId=130308');[pscustomobject]@{listeners=$qaListeners.Count;observedOwnedProcessStillPresent=$qaOwned.Count}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
  assert.equal(stop.listeners,0);assert.equal(stop.observedOwnedProcessStillPresent,0);
  const evidenceFiles=fs.readdirSync(qa+'/evidence').map(name=>({path:qa+'/evidence/'+name,sha256:sha(read(qa+'/evidence/'+name)),bytes:read(qa+'/evidence/'+name).length}));
  const mri=read(qa+'/evidence/mri-unloaded-guided.ax.txt').toString(),review=read(qa+'/evidence/review-signed-out.ax.txt').toString(),auth=read(qa+'/evidence/studio-platform-signin-unavailable.ax.txt').toString();
  // The browser saves its default incremental AX response, not a complete tree.
  // Check only facts actually serialized here; full UI observations came from
  // the live tool responses and the retained screenshots, not these sparse files.
  assert(mri.includes('MRI head anatomy')&&mri.includes('Guided learning')&&mri.includes('/atlas/mri-head?headTour=brainstem&headRevision='));
  assert(review.includes('Review inbox')&&review.includes('/workspace/clinical-review-inbox'));
  assert(auth.includes('Page not found')&&auth.includes('signin-with-chatgpt?return_to=%2Fstudio%2Fworkspace'));
  for(const text of [mri,review,auth])assert(text.includes('There has been no change in the accessibility tree.'));
  const screenshotMetadata=[];
  for(const name of ['mri-unloaded-guided.png','studio-platform-signin-unavailable.png']){
    const image=read(qa+'/evidence/'+name);assert.equal(image.readUInt16BE(0),0xffd8,'Retained original browser screenshot JPEG bytes');
    let offset=2,dimensions;
    while(offset<image.length){
      assert.equal(image[offset++],0xff);while(image[offset]===0xff)offset++;
      const marker=image[offset++];if(marker===0xda||marker===0xd9)break;
      const length=image.readUInt16BE(offset);assert(length>=2&&offset+length<=image.length);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){dimensions={width:image.readUInt16BE(offset+5),height:image.readUInt16BE(offset+3)};break;}
      offset+=length;
    }
    assert.deepEqual(dimensions,name==='mri-unloaded-guided.png'?{width:1280,height:720}:{width:1265,height:712});screenshotMetadata.push({name,encoding:'image/jpeg',...dimensions,originalBytesPreserved:true,extensionMismatch:true});
  }
  const green=json(stage+'/green/TERMINAL.json'),red=json(stage+'/red/TERMINAL.json');assert.equal(green.exit,0);assert.equal(red.exit,1);
  const pass=read(stage+'/green/stdout.log').toString();assert(pass.includes('ℹ tests 5')&&pass.includes('ℹ pass 5')&&pass.includes('ℹ fail 0'));
  const fail=read(stage+'/red/stdout.log').toString();assert(fail.includes('ℹ pass 4')&&fail.includes('ℹ fail 1'));
  const report={at:new Date().toISOString(),schema:'vm.anonymous-built-ui-and-help-clarity/1',parentReceipt,parentReceiptSha256:sha(read(parentReceipt)),builtCandidate:source.website,builtCandidateSourcePaths:6130,builtSourceAnd1110OutputBytesUnchanged:true,
    localRuntime:{command:'installed Wrangler4.125.0 dev --config dist/server/wrangler.json --local --ip127.0.0.1 --port3047 --inspector-ip127.0.0.1 --inspector-port9327 --persist-to isolatedQA/local-state',session:75206,observedOwnedListenerPid:130308,readyHttp:200,bindingsLocalOnly:true,newIsolatedStateOnly:true,ownerDatabaseOrSecretsImported:false,remoteBindingsOrTunnelUsed:false,manuallyStopped:true,stopObservation:stop,ownedTab137Closed:true,normalPreviewChanged:false,fullRuntimeConsoleLogRetained:false},
    browser:{surface:'Codex in-app browser',initialObservedViewport:{width:1280,height:720},anonymous:true,observed:['homepage five-modality menu opens','whole-body 3D shell renders four learning modes and compact system sidebar','unavailable protected model bytes show retained-settings sign-in notice','3D-to-CT navigation succeeds','CT-to-MRI navigation succeeds','unloaded MRI practice start/styles remain disabled','unloaded MRI guided-learning sequence remains disabled','source-bound tour revision appears in URL without loading a scan','Clinical Review sign-in gate shows no records','Studio handoff reaches platform-owned sign-in path absent from direct production Worker'],evidenceFiles,screenshotMetadata,
      serializedAccessibilityEvidence:'Three retained AX files contain terminal title/URL/focus and unchanged-tree responses, not full snapshots. Detailed control observations are supported by the live browser tool transcript; screenshots retain the MRI guided and platform-sign-in states. They must not be treated as complete persisted AX proof of every observation.',
      checkpointHarnessCorrection:'Three prepare invocations refused before writing VERIFICATION.json: for incorrectly requiring full-tree control text in sparse incremental AX files, assuming screenshot encoding from a .png filename, and assuming both screenshot dimensions matched the initial viewport. The coordinator verifier now checks retained AX facts and the actual original JPEG bytes/dimensions (MRI1280x720; auth1265x712); original files are not converted. No product assertions or tests were weakened or rerun for these corrections.',
      limitations:['No scan folder opened, images/masks loaded, source scan or mask edited, review decision submitted, or actual 3D mesh/GPU acceptance.','No authentication or role/entitlement grant. Direct Worker lacks Sites Dispatch/Vite sign-in boundary. This404 is an environment limit, not a proven application routing bug.','Initial Skip-intro index became stale as timed intro ended; refreshed state used. An exact CT locator failed because the accessible name is the descriptive browse label; AX link navigation then succeeded.','New copy was verified by source/render tests, not installed into this browser-tested built candidate.']},
    authTriage:{path:classification,sha256:sha(read(classification)),classification:'expected direct-production-Worker sign-in limitation',worker:'Sol Medium read-only',mainReviewed:true,authPolicyChanged:false},
    proposal:{thinOverlay:site,changed:rows,wholeOriginalCodeAndTestInversesVerified:true,onlyLiteralChange:'Switching views -> About modality links',unchangedRegionNavigation:true,regression:{oldExpectationPass:4,oldExpectationFail:1,updatedNativeCasesPass:5,skipped:0},noRouteFocusRegistrationOrAccessChange:true,fullIntegrationAndBrowserVerificationPending:true},
    fullGoalPreserved:true,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,pending};
  fs.writeFileSync(stage+'/VERIFICATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:stage+'/VERIFICATION.json',sha256:sha(read(stage+'/VERIFICATION.json')),proposalFiles:2,tests:5,qaServerStopped:true,builtCandidateUnchanged:true}));
}else{
  const report=json(stage+'/VERIFICATION.json'),proofSha=sha(read(stage+'/VERIFICATION.json'));
  function verify(){exactInverses();assert.equal(sha(read(stage+'/VERIFICATION.json')),proofSha);for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256);for(const phase of ['red','green']){const r=json(stage+'/'+phase+'/TERMINAL.json');assert.equal(r.exit,phase==='red'?1:0);for(const ch of ['stdout','stderr'])assert.equal(sha(read(stage+'/'+phase+'/'+ch+'.log')),r[ch+'Sha256']);}for(const r of report.browser.evidenceFiles)assert.equal(hash(r.path),r.sha256);assert.equal(sha(read(classification)),report.authTriage.sha256);assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');}
  const localArtifacts=[[stage+'/VERIFICATION.json','VERIFICATION.json'],[stage+'/PREPARATION.json','PREPARATION.json'],[classification,'auth/CLASSIFICATION.md'],...report.browser.evidenceFiles.map(r=>[r.path,'browser/'+path.basename(r.path)])];
  for(const p of files)localArtifacts.push([stage+'/'+p.replaceAll('/','__')+'.before.raw','preimages/'+path.basename(p)+'.raw']);
  for(const phase of ['red','green'])for(const n of ['STARTED.json','TERMINAL.json','stdout.log','stderr.log'])localArtifacts.push([stage+'/'+phase+'/'+n,phase+'/'+n]);
  const config={id:'modality-help-clarity-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-modality-help-clarity',stage,site,key:'pendingModalityHelpClarity',rows,verify,review:report,localArtifacts,
    remoteArtifacts:[...['modality-help-clarity-20261023.mjs','checkpoint-modality-help-clarity-20261023.mjs'].map(p=>['coordination/'+p,path.resolve(p)]),...rows.map(r=>['candidate/'+r.path,site+'/'+r.path]),...files.map(p=>['preimages/'+path.basename(p)+'.raw',stage+'/'+p.replaceAll('/','__')+'.before.raw'])],
    parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-current-ui-delivery-source-backup/github-backup.json',receiptSha256:'c5de37f4b12d73652aff9efd3b271ac87b46aa0274444091fe16700c8945e979',repo:'F:/VisibleMedicine/history/website-work/github-current-ui-delivery-20261023.git'},backupRepo:'F:/VisibleMedicine/history/website-work/github-modality-help-clarity-20261023.git',sourceIdentity:{parentReceiptSha256:sha(read(parentReceipt)),proposalRows:rows},
    backupScope:'Inherited verified filtered source plus2main coordinator recipes,2literal-only UI/test edits and2whole exact original source preimages. Browser screenshots/AX, auth-triage notes, local runtime/storage records and generated/private build/Review/model/scan/decision data remain F-only. No full/private/runnable off-device recovery, normal preview install/restart/refresh, authentication change, permission/entitlement widening, public deployment, clinical approval or patient registration. Thin copy proposal is not integrated into the sealed6130-path built candidate.',
    proof:{anonymousRuntimeQa:true,initialObservedViewport:'1280x720',retainedScreenshotPixels:['1280x720','1265x712'],builtSourceAndBuildBytesUnchanged:true,noScanOrMeshGpuAcceptance:true,signedOutReviewGateObserved:true,auth404ClassifiedEnvironmentOnly:true,ownedQaServerStopped:true,nativeCasesPassed:5,oldExpectationRedCases:1,wholeCodeAndTestInversesVerified:true,literalOnlyCopyProposal:true,notIntegratedIntoBuiltCandidate:true},milestone:'Anonymous built-Worker UI/navigation verified and clearer modality-link help prepared without changing the owner preview',pending,
    summary:{thinOverlay:site,parentBuiltCandidate:source.website,parentSourceReceipt:parentReceipt,parentSourceReceiptSha256:sha(read(parentReceipt)),proposalFiles:2,nativeCasesPassed:5,wholeCodeAndTestInversesVerified:true,literalOnlyCopyProposal:true,fullIntegrationPending:true,browserQa:stage+'/VERIFICATION.json',browserQaSha256:proofSha,anonymousOnly:true,scansOrModelsNotLoaded:true,authenticatedQaPending:true,ownedQaServerStopped:true}};
  if(process.argv.includes('--finalize')){const result=finalizeProposal(config),p=json('CURRENT_CHECKPOINT.json');p.next=pending;p.activeWork.current.next=pending;p.activeWork.current.beforeFurtherWork=pending;p.activeWork.updated=new Date().toISOString();const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(text)}));}
  else console.log(JSON.stringify(saveProposal(config)));
}
