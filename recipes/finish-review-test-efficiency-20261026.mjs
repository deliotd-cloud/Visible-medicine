import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {appendEvidence} from './append-checklist-evidence-20261026.mjs';

const stage='F:/VisibleMedicine/staging/20261026-review-count-website';
const sourceFile=stage+'/SOURCE_CANDIDATE.json',source=json(sourceFile),site=source.website;
const pin=p=>({path:p,sha256:hash(p)}),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const phase=process.argv[2];assert(['seal','backup','record'].includes(phase));
const index=json('CURRENT_CHECKPOINT.json'),c=index.activeWork.current;
assert.deepEqual(c.activeExecutionSessions,[]);assert.equal(c.ownerPreviewPolicy.restartPermitted,false);
assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const [root,head]of [[source.atlas,source.atlasHead],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
const vf=stage+'/VERIFICATION_SUMMARY.json';
if(phase==='seal'){
  const checks=json(stage+'/checks/tests/RESULT.json'),types=json(stage+'/checks/types/RESULT.json');
  assert(checks.passing&&types.passing);assert.equal(checks.source.sha256,hash(sourceFile));assert.equal(types.source.sha256,hash(sourceFile));
  const parent=json(source.parent),changed=new Set(source.changedPaths);assert.equal(changed.size,2);assert([...changed].every(p=>p.startsWith('tests/')));
  for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(!changed.has(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
  const review=json(site+'/atlas-review/integration-inputs.json');for(const r of review.inputs){assert(!changed.has(r.path));assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
  const typeResult=json(types.types.path);for(const r of typeResult.sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);
  const beforeEvents='F:/VisibleMedicine/staging/20261026-release-stock-campaign/shard-001/events.jsonl';
  const events=fs.readFileSync(beforeEvents,'utf8').trim().split(/\r?\n/).map(JSON.parse);
  const campaign='F:/VisibleMedicine/staging/20261026-release-stock-campaign',planFile=campaign+'/PLAN.json',plan=json(planFile);
  assert.equal(hash(planFile),'71292d85b2fa81ca78094f317715c9f510196693baa494137822b88cb00cb52c');
  const diagnosticRoot=plan.source.replaceAll('\\','/').replace(/\/$/,'')+'/';
  const eventRoot=e=>e.file?.replaceAll('\\','/').replace(diagnosticRoot,'');
  const rows=plan.shards[1].roots.map(root=>{
    const relevant=events.filter(e=>eventRoot(e)===root),summaries=relevant.filter(e=>e.event==='test:summary');
    assert(summaries.length<=1,'Ambiguous root summary');const summary=summaries[0];
    return {root,state:summary?(summary.success===true?'completed-pass':'completed-with-failures'):relevant.length?'incomplete-or-module-abort':'no-completed-evidence',nativeSummary:summary??null};
  });
  const diagnosticCoverage={at:new Date().toISOString(),source:source.parent,plan:pin(planFile),events:pin(beforeEvents),index:1,assignedRoots:rows.length,roots:rows,completedRoots:rows.filter(r=>r.nativeSummary).length,unresolvedRoots:rows.filter(r=>r.state!=='completed-pass').map(r=>r.root),otherCampaignShardsNotAssessed:true,wholeStockSuitePassing:false};
  save(stage+'/DIAGNOSTIC_COVERAGE.json',diagnosticCoverage);
  const before=events.find(e=>e.event==='test:summary'&&e.file?.replaceAll('\\','/').endsWith('/tests/atlas-glottic-muscle-imaging.test.ts'));
  assert.equal(before.success,true);assert.equal(before.counts.tests,1);
  const log=fs.readFileSync(stage+'/checks/tests/runner.stdout.log','utf8');
  const timing=/# Subtest: live glottic notes preserve anatomy and all prior teaching with revision-bound Review[\s\S]*?duration_ms: ([0-9.]+)/.exec(log);
  assert(timing,'Missing actual optimized test timing');
  const diagnostic=json(source.precedingDiagnostic.path);
  const summary={at:new Date().toISOString(),passingForStatedScope:true,source:pin(sourceFile),tests:pin(stage+'/checks/tests/RESULT.json'),counts:checks.counts,types:pin(stage+'/checks/types/RESULT.json'),fullConfiguredTypes:types.types,changedPaths:source.changedPaths,allProductNativeRuntimeReviewLicencesAndDependenciesUnchanged:true,protectedReviewInputs:review.inputs.length,reviewBindingUnchanged:review.sha256,originalAssertionsPreservedByExactInverse:true,reviewBefore:pin('F:/VisibleMedicine/staging/20261026-review-count-proposal/checks-before-2/RESULT.json'),reviewAfter:pin('F:/VisibleMedicine/staging/20261026-review-count-proposal/checks-after/RESULT.json'),glotticTiming:{beforeFileSummaryMs:before.duration_ms,afterTestMs:Number(timing[1]),sourceForBefore:pin(beforeEvents),isolatedBenchmark:false,note:'Observed complete-root timings under different concurrent load; not a guaranteed speedup.'},stockDiagnostic:source.precedingDiagnostic,stockDiagnosticComplete:!!diagnostic.terminal,stockDiagnosticPassing:diagnostic.passingForThisShardOnly,applicationBuild:{inheritedFrom:pin('F:/VisibleMedicine/staging/20261026-surface-recovery-website/VERIFICATION_SUMMARY.json'),rerun:false,reason:'Only two test files changed; all production inputs and dependencies retain exact verified bytes.'},wholeStockSuitePassing:false,normalPreviewChanged:false,installed:false,realAccountAcceptance:false,clinicalApproval:false};
  summary.stockDiagnosticCoverage=pin(stage+'/DIAGNOSTIC_COVERAGE.json');
  save(vf,summary);console.log(JSON.stringify({verification:pin(vf),counts:checks.counts,types:types.types,glotticTiming:summary.glotticTiming,completedDiagnosticRoots:diagnosticCoverage.completedRoots}));
}else if(phase==='backup'){
  const v=json(vf);assert(v.passingForStatedScope);
  const {backup,read,sha}=await import('./source-only-backup-20261019.mjs');const files=[];
  function add(p,f){const b=read(f);new TextDecoder('utf8',{fatal:true}).decode(b);assert(!b.includes(0));files.push({path:p,file:f,bytes:b.length,sha256:sha(b)});}
  for(const p of source.changedPaths)add('website/'+p,site+'/'+p);
  for(const name of ['integrate-review-count-20261026.mjs','verify-review-count-integration-20261026.mjs','finish-review-test-efficiency-20261026.mjs'])add('recipes/'+name,path.resolve(name));
  add('originals/atlas-glottic-muscle-imaging.test.mjs.raw','F:/VisibleMedicine/staging/20261026-glottic-cost-proposal/original.raw');
  const priorFile='F:/VisibleMedicine/recovery/checkpoints/20261026-review-count-source/SOURCE_SUPPLEMENT.json',prior=json(priorFile);assert.equal(hash(prior.receipt),prior.sha256);
  const required=[{...pin(priorFile),head:prior.head,tree:prior.tree,branch:prior.branch}],map=new Map(files.map(r=>[r.path,r.file]));
  const dir='F:/VisibleMedicine/recovery/checkpoints/20261026-review-test-efficiency-source',root=dir+'-supplement';assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
  const result=backup({root,repo:'F:/VisibleMedicine/history/website-work/github-review-test-efficiency-source-20261026.git',branch:'backup/review-test-efficiency-source-20261026',parent:null,carryParent:false,files:files.map(({path,bytes,sha256})=>({path,bytes,sha256})),bytesFor:p=>read(map.get(p)),verifySource(){assert.equal(hash(sourceFile),v.source.sha256);for(const f of files)assert.equal(hash(f.file),f.sha256);assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);},sourceIdentity:{kind:'review-catalog-verification-and-immutable-manifest-test-efficiency',sourceSha256:v.source.sha256,requiredPriorSourceSupplements:required},scope:'Selected first-party test source, original test and integration recipes only. No generated medical/Review data, raw logs, scans, masks, models, media, private decisions, dependencies or canonical/native ancestry. Prior supplements/local sources remain required; not a full/private/runnable backup.',proof:{focusedCases:v.counts,fullConfiguredTypeDiagnostics:0,productBytesUnchanged:true,wholeStockSuitePassing:false,normalPreviewChanged:false,clinicalApproval:false}});
  const receipt=root+'/github-backup.json',pointer={at:new Date().toISOString(),receipt,sha256:hash(receipt),head:result.head,tree:result.tree,branch:result.branch,sourcePaths:result.sourcePaths,restoredPaths:result.restoredPaths,requiredSourceSupplements:required,wholePrivateOrRunnableBackup:false};save(dir+'/SOURCE_SUPPLEMENT.json',pointer);console.log(JSON.stringify(pointer));
}else{
  const v=json(vf);assert(v.passingForStatedScope);const bf='F:/VisibleMedicine/recovery/checkpoints/20261026-review-test-efficiency-source/SOURCE_SUPPLEMENT.json',backup=json(bf);assert.equal(hash(backup.receipt),backup.sha256);assert.equal(json(backup.receipt).phase,'independent-fetch-tree-bytes-and-restore-verified');
  const dir='F:/VisibleMedicine/recovery/checkpoints/20261026-review-test-efficiency-verified';assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
  for(const [from,to]of [['CURRENT_CHECKPOINT.json','CURRENT_INDEX_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP_BEFORE.md'],['F:/VisibleMedicine/website/docs/master-plan.md','MASTER_PLAN_BEFORE.md'],[sourceFile,'SOURCE_CANDIDATE_LOCAL.json'],[vf,'VERIFICATION_SUMMARY.json']])fs.copyFileSync(from,dir+'/'+to,fs.constants.COPYFILE_EXCL);
  const ledger=await appendEvidence({base:stage,verificationSha256:hash(vf),beforeRevision:249,id:'REL-01',expectedStatus:'partial',rootKey:'reviewtestefficiency',note:'Current endpoint catalogue test repair integrated as a test-only successor;4 endpoint cases and the full historical glottic wrapper pass. Catalogue is exactly1583 with six source-proven FDA additions, retaining original authorization/isolation/race/correction/revocation checks. Glottic reads its pinned manifest once instead of roughly999times, preserving all48assertions and actual full-root coverage. Complete configured types pass; production/runtime/Review/licence bytes stay exact. Original partial stock diagnostic retained; no complete-suite, real-account or clinical acceptance claim.',change:'Integrated source-reconciled Review endpoint verification and reduced repeated immutable Git reads, with full focused roots and configured type checking; all statuses/acceptances preserved.'});
  const next='Continue full71requirements/eightideas from this test-only development successor. Product source remains8c69/157d/native643fd with unchanged Review6db4; installedb953ff/6d7a and owner preview unchanged. Do not repeat completed unchanged build/generation. Preserve the original bounded diagnostic terminal/partial evidence and all unresolved roots, reconcile authentic historical versus current contexts, then prioritize current product defects and real desktop scan/learning journeys. Test-only source repair and measured manifest-read reduction do not establish complete-suite, clinical or real-account acceptance. Keep small bounded regression groups to avoid wasting a30minute job on an oversized batch.';
  const checkpoint={at:new Date().toISOString(),fullGoal:index.goal,source:v.source,verification:pin(vf),sourceRecovery:pin(bf),checklist:ledger,currentInstalledUnchanged:c.currentInstalled,ownerPreviewPolicy:c.ownerPreviewPolicy,stockDiagnostic:v.stockDiagnostic,stockDiagnosticComplete:v.stockDiagnosticComplete,wholeStockSuitePassing:false,normalPreviewChanged:false,clinicalApproval:false,next};save(dir+'/checkpoint.json',checkpoint);const saved=pin(dir+'/checkpoint.json');
  c.latestCoordination=saved;c.latestSourceRecovery=pin(bf);c.latestChecklistUpdate=ledger;c.latestDevelopmentSource={source:v.source,checkpoint:saved,kind:'verified test-only successor',productBytesUnchanged:true,normalPreviewChanged:false};
  c.latestReviewCatalogProposal={...c.latestReviewCatalogProposal,integrated:true,integratedSource:v.source,integrationVerification:pin(vf)};
  c.currentReleaseCampaign={...c.currentReleaseCampaign,verifiedLive:[],live:false,terminalEvidence:v.stockDiagnostic,coverage:v.stockDiagnosticCoverage,complete:v.stockDiagnosticComplete,wholeStockSuitePassing:false};
  c.next=next;c.beforeFurtherWork=next;c.nextExecutionHandoff=saved;c.lastPriorityReassessment={at:new Date().toISOString(),checkpoint:saved,fullGoalPreserved:true,priority:'Current reliability and desktop acceptance, with economical source-bound checks'};index.goal.previousTurn='progress';index.activeWork.updated=new Date().toISOString();
  const text=JSON.stringify(index,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);
  const prefix=`## Current: Review verification and test efficiency — 26 October 2026\n\nTest-only successor ${v.source.sha256.slice(0,8)} integrates the source-reconciled1583-entry catalogue assertion and removes repeated reads of the same committed manifest. All5cases across2whole roots pass, including the existing authorization, account/organisation isolation, race, correction and revocation checks. The glottic wrapper retains all48assertions; observed runtime changed from${Math.round(v.glotticTiming.beforeFileSummaryMs/1000)}s to${Math.round(v.glotticTiming.afterTestMs/1000)}s under different concurrent load, not a controlled benchmark. Full configured types pass${v.fullConfiguredTypes.roots}roots/${v.fullConfiguredTypes.files}files/zero diagnostics. All application/native/runtime/Review/licence bytes remain unchanged; prior build evidence remains source-bound and was not needlessly rerun.\n\nBroader stock diagnostic evidence remains at${v.stockDiagnostic.path}; no full-suite pass. Filtered source backup independently fetched/restored at${backup.branch},${backup.head}; no private data or assets. Checklist${ledger.revision} retains all71statuses/eightideas/fullacceptance. Checkpoint:${saved.path}(${saved.sha256}). ${next}\n\n`;
  for(const p of ['WORKSPACE_MAP.md','F:/VisibleMedicine/website/docs/master-plan.md'])fs.writeFileSync(p,prefix+fs.readFileSync(p,'utf8'));console.log(JSON.stringify({checkpoint:saved,revision:ledger.revision,indexBytes:Buffer.byteLength(text),goal:'active'}));
}
