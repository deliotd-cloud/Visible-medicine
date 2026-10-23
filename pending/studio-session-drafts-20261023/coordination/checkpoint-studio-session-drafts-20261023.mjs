// Main-owned isolated Studio recovery evidence; never installs the held preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-studio-session-drafts',site=stage+'/website';
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt);
assert.equal(sha(read(prep.parentReceipt)),prep.parentReceiptSha256);
const changed=['components/StudioForms.tsx','tests/studio-mutation-context-fixture.mjs','tests/studio-course-draft-discard.test.mjs'];
const added=['lib/studio-session-drafts.ts','tests/studio-session-drafts.test.ts','tests/studio-session-draft-fixture.mjs','tests/studio-session-draft-form.test.mjs'];
const rows=[...changed,...added].map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
const preimages=['StudioForms.before.raw','studio-mutation-context-fixture.before.raw','studio-course-draft-discard.before.raw'];
const text=p=>read(p).toString('utf8');
const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const exactlyOnce=(s,from,to)=>{assert.equal(s.split(from).length,2);return s.replace(from,to);};
function verify(){
  for(const row of rows)assert.equal(hash(site+'/'+row.path),row.sha256);
  for(const row of prep.sourceRows.filter(r=>!changed.includes(r.path)))assert.equal(hash(site+'/'+row.path),row.sha256,'Unchanged support '+row.path);
  for(const row of json(stage+'/SUPPLEMENTAL_INPUTS.json').sourceRows){assert.equal(hash(site+'/'+row.path),row.sha256);assert.equal(parent.sourceRows.find(r=>r.path===row.path).sha256,row.sha256);}
  preimages.forEach((p,i)=>assert.equal(hash(stage+'/'+p),parent.sourceRows.find(r=>r.path===changed[i]).sha256));
  const before=text(stage+'/'+preimages[0]),after=text(site+'/'+changed[0]);
  assert.equal(after.slice(after.indexOf('async function postStudio('),after.indexOf('export type StudioDraftRecoveryState')),before.slice(before.indexOf('async function postStudio('),before.indexOf('export type StudioDraftRecoveryState')),'Mutation transport and lock bodies unchanged');
  const fixture=text(site+'/'+changed[1]);
  assert.equal(exactlyOnce(exactlyOnce(fixture,',moduleRequire=createRequire(new URL(\'../\'+relative,import.meta.url))',''),':moduleRequire(name)',':require(name)'),text(stage+'/'+preimages[1]),'Whole default-resolution fixture inverse');
  const strict=text(site+'/'+changed[2]),line="    '../lib/studio-session-drafts.ts': requireSite('../lib/studio-session-drafts.ts'),\n";
  assert.equal(exactlyOnce(strict.replaceAll('\r\n','\n'),line,''),text(stage+'/'+preimages[2]).replaceAll('\r\n','\n'),'Only actual module provider added; all old assertions retained');
  assert.equal(hash(site+'/lib/studio-session-drafts.ts'),'d67fd4c7432fcd10c4591638b3d5b9ed3ccf9c3e020dc2b0e0643cb42eaede83');
  assert.equal(hash(site+'/tests/studio-session-drafts.test.ts'),'d50a30811e597c1ed921061cc80aa46bd26ecb28ffddd70bacb360fbd01f45ba');
  assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
  assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
}
const pending='Keep the owner preview unchanged. Studio same-Document recovery, inbox failure focus and modality-help wording are isolated source proposals, not integrated/bound/installed. Compose a later coherent Website/Review successor with exact source bindings and applicable native/build/types/signed-in browser acceptance; do not restart or refresh the held preview. Session recovery covers scoped draft-enabled ActionForms only, not every Studio editor, and does not survive closing/reload or guarantee native Back cancellation. Continue the full71/eight anatomy, source-backed teaching, linked modalities and Studio roadmap. Preserve full-type resource failure, failed stock gate/skip/feature-root limits and all rights/source/privacy/independent-access/clinical/specialist-mask/desktopPACS boundaries; semantic comparison is not patient-space registration.';
if(process.argv.includes('--prepare')){
  verify();
  for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Sealed parent '+r.path);
  const build=json(parent.buildArtifacts);for(const r of build.files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256,'Sealed output '+r.path);
  const native=['before-final','current-final','original-final'].map(phase=>{
    const r=json(stage+'/logs/'+phase+'.json');assert.equal(hash(r.component),r.componentSha256);
    for(const t of r.tests)assert.equal(hash(site+'/'+t.path),t.sha256);
    assert.equal(hash(stage+'/logs/'+phase+'.stdout.txt'),r.stdoutSha256);assert.equal(hash(stage+'/logs/'+phase+'.stderr.txt'),r.stderrSha256);
    assert.equal(r.exitCode,phase==='before-final'?1:0);assert.equal(r.counts.tests,phase==='original-final'?45:7);assert.equal(r.counts.pass,phase==='before-final'?1:r.counts.tests);assert.equal(r.counts.skipped,0);assert.equal(r.counts.cancelled,0);return r;
  });
  const store=json(stage+'/STORE_TEST_TERMINAL.json');assert.equal(hash(store.rawLog),store.rawLogSha256);assert.equal(store.exitCode,0);assert.equal(store.passed,10);assert.equal(store.failed+store.skipped+store.cancelled,0);
  const fixture=json(stage+'/BROWSER_BUILD_FINAL.json');for(const r of fixture.inputs)assert.equal(hash(site+'/'+r.path),r.sha256);for(const r of fixture.files)assert.equal(hash(stage+'/browser-fixture-final/'+r.name),r.sha256);
  const browser=json(stage+'/browser-evidence/FINAL.json');assert(browser.actualBrowserBackForward&&browser.syntheticProtocolAndConfirmationOnly&&!browser.authenticatedStudioAcceptance&&!browser.normalPreviewChanged);
  assert.equal(browser.beforeRecovery.title,'');assert.equal(browser.beforeRecovery.description,'');assert.equal(browser.beforeRecovery.recoveryAvailable,true);assert.equal(browser.cancelled.title,'');assert.equal(browser.cancelled.recoveryAvailable,true);assert.equal(browser.recovered.activeName,'title');assert.equal(browser.recovered.title,'Synthetic shoulder teaching draft');assert.equal(browser.recovered.description,'Synthetic unsent teaching notes for this recovery test only.');
  const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
  const stop=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"[pscustomobject]@{listeners=@(Get-NetTCPConnection -LocalPort 3049 -State Listen -ErrorAction SilentlyContinue).Count;initialOwnedPidPresent=@(Get-CimInstance Win32_Process -Filter 'ProcessId=289068').Count}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));assert.equal(stop.listeners,0);assert.equal(stop.initialOwnedPidPresent,0);
  const report={at:new Date().toISOString(),schema:'vm.studio-session-draft-review/1',changed:rows,parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,sealedParentSourcePathsUnchanged:parent.sourceRows.length,sealedBuildOutputPathsUnchanged:build.files.length,
    behavior:'A bounded Document-owned, exact actor/institution/form scoped in-memory copy is captured before durable-storage attempts. After SPA unmount/remount and current context verification, explicit recovery restores compatible form values without automatic submission or replacing unseen durable/temporary drafts. Confirmed writes/drop use exact object-identity CAS tokens. Recovered text stays dirty, explicitly non-durable, with departure warnings and focus in its first input.',
    caps:{entriesPerDocument:8,totalUtf8Bytes:2097152,eachRawUtf8Bytes:524288,rejectWithoutEviction:true,reloadOrCloseRecovery:false},
    mainReview:{native,store,nativeCasesPassed:62,newConsumerCases:7,unchangedExistingCases:45,pureStoreCases:10,beforeNewConsumer:{pass:1,fail:6},zeroSkipsOrCancellations:true,fullSemanticTypecheck:false,fullWebsiteBuild:false,wholeSuitePassing:false,transportAndLockBodiesByteExact:true,wholeThreeOriginalPreimagesPreserved:true,oldFixtureChanges:'Only source-relative default require resolution and explicit actual-module import provider; exact whole-file inverses verified. All old cases/assertions retained.',initialSetupFailures:'Original37pass/8fail:7 strict provider errors before assertions and1 omitted unchanged StudioCourseEditor support input. Exact source resolution/provider/input corrected; raw diagnostics retained.',initialStoreTestCorrection:'Equal-size replacement at cap is allowed; corrected mistaken test expectation, retaining diagnostic and testing growth refusal.',mainBrowserPolish:'First real-DOM run exposed contradictory empty-form status and focus falling to body after the recovery button disappears; corrected both and reran52 form regressions.'},
    browser:{...browser,build:fixture,realReactDom:true,syntheticGetOnly:true,postRefused:true,nativeBrowserConfirmationTested:false,fullVinextOrSignedInAcceptance:false,ownedTab139Closed:true,initialSession29911TerminalManualExit1:true,initialObservedPid:289068,finalSession13173TerminalManualExit1:true,finalPidUnavailable:true,stopObservation:stop},
    routerFinding:'F:/VisibleMedicine/staging/20261023-studio-history-router/FINDINGS.md',routerDecision:'No universal history trap or unsupported App Router blocker. Native traversal cancellation/index-distance assumptions are unsafe. Recovery is mitigation, not universal Back cancellation.',
    limitations:['Same Document only; closing/reloading loses the temporary copy. Caps can refuse the newest edit; warning must not claim otherwise.','Only draft-key enabled ActionForms are covered. No automatic submission, synchronization, persistent backup, new identity, role or permission.','Synthetic context transport/router/confirmation harness validates actual React component behavior, not authenticated Website/Vinext integration, native dialogs or clinical/rights approval.','Coherent integration/source binding, build, semantic types and wider regression acceptance still pending.'],
    previewChanged:false,installed:false,publicDeployment:false,clinicalApproval:false,spatialRegistration:false,full71AndEightIdeasPreserved:true,pending};
  fs.writeFileSync(stage+'/VERIFICATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({verification:stage+'/VERIFICATION.json',sha256:hash(stage+'/VERIFICATION.json'),nativeCasesPassed:62,previewChanged:false}));
}else{
  const review=json(stage+'/VERIFICATION.json');assert.deepEqual(review.changed,rows);
  const artifacts=['PREPARATION.json','SUPPLEMENTAL_INPUTS.json','VERIFICATION.json','RESULT.md','STORE_TEST_TERMINAL.json','STORE_TEST_RAW.log','STORE_TEST_RAW_FINAL.log','BROWSER_BUILD.json','BROWSER_BUILD_FINAL.json',...preimages];
  const localArtifacts=artifacts.map(p=>[stage+'/'+p,p]);
  for(const folder of ['logs','browser-evidence'])for(const name of fs.readdirSync(stage+'/'+folder))localArtifacts.push([stage+'/'+folder+'/'+name,folder+'/'+name]);
  localArtifacts.push(['F:/VisibleMedicine/staging/20261023-studio-history-router/FINDINGS.md','router/FINDINGS.md']);
  const recipes=['prepare-studio-session-drafts-20261023.mjs','run-studio-session-checks-20261023.mjs','studio-session-browser-entry-20261023.tsx','studio-session-browser-router-20261023.mjs','studio-session-browser-20261023.mjs','checkpoint-studio-session-drafts-20261023.mjs'];
  const c={id:'studio-session-drafts-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-studio-session-drafts',stage,site,key:'pendingStudioSessionDrafts',rows,verify,review,localArtifacts,
    remoteArtifacts:[...recipes.map(p=>['coordination/'+p,path.resolve(p)]),...rows.map(r=>['candidate/'+r.path,site+'/'+r.path]),...preimages.map(p=>['preimages/'+p,stage+'/'+p])],
    parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-inbox-failure-focus-source-backup/github-backup.json',receiptSha256:'f709c353cf59b6a0938e485a25e0215f777b59ea0db8fd03f3d6b2f9c534142f',repo:'F:/VisibleMedicine/history/website-work/github-inbox-failure-focus-20261023.git'},backupRepo:'F:/VisibleMedicine/history/website-work/github-studio-session-drafts-20261023.git',sourceIdentity:{parentReceiptSha256:prep.parentReceiptSha256,proposal:rows},
    backupScope:'Inherited independently verified filtered source plus seven selected source files, six authored coordinator/fixture recipes and three exact authored source preimages. No generated bundles, captures, logs, private references, context records, scans, masks, model/build/private data, decisions or permissions are selected. Raw evidence remains F-only. Not whole/private/runnable off-device backup; no production preview or public deployment change.',
    proof:{nativeCasesPassed:62,pureStoreCases:10,newConsumerCases:7,unchangedExistingCases:45,beforeNewConsumerFail:6,beforeNewConsumerPass:1,skips:0,realReactSyntheticBackForward:true,explicitRecoveryAndCancel:true,contextAndFormSeparation:true,noAutomaticSubmit:true,temporaryNotDurable:true,sealed6130SourceAnd1110BuildPathsUnchanged:true,ownerPreviewChanged:false},
    milestone:'Scoped Studio edits can be explicitly recovered after same-document Back/Forward when durable draft storage fails; isolated source only',pending,
    summary:{candidate:site,parentBuiltCandidate:parent.website,verification:stage+'/VERIFICATION.json',verificationSha256:hash(stage+'/VERIFICATION.json'),nativeCasesPassed:62,syntheticRealReactBackForwardVerified:true,temporaryDocumentOnly:true,authenticatedAcceptance:false,sourceBindingAndFullIntegrationPending:true,universalHistoryCancellation:false,previewChanged:false,installed:false}};
  if(process.argv.includes('--finalize')){const result=finalizeProposal(c),p=json('CURRENT_CHECKPOINT.json');p.next=pending;p.activeWork.current.next=pending;p.activeWork.current.beforeFurtherWork=pending;p.activeWork.updated=new Date().toISOString();const b=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(b)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',b);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(b)}));}
  else console.log(JSON.stringify(saveProposal(c)));
}
