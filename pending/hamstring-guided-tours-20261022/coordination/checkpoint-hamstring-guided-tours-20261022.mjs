import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';

const stage='F:/VisibleMedicine/staging/20261022-hamstring-guided-tours',main=stage+'/MAIN_REVIEW.json';
assert.equal(sha(read(main)),'0489edf6c9abd21f732d24365fa178ffbdea04a53385ba00d332954df67dab63');
const reviewed=json(main);assert.equal(reviewed.newDraftTours,2);assert.equal(reviewed.originalToursPreserved,51);
const reportPath='F:/VisibleMedicine/staging/20261022-current-teaching-priority/complete/report.stdout.json';
const readinessRun='F:/VisibleMedicine/staging/20261022-current-teaching-priority/complete/RUN.json';
const qualityPath='F:/VisibleMedicine/staging/20261022-root-draft-quality/RESULT.json';
assert.equal(sha(read(readinessRun)),'3217e24859348084fd159280abea579e23aee88bfd719080d9fb24784bb89bdd');
assert.equal(sha(read(reportPath)),json(readinessRun).stdoutSha256);
assert.equal(sha(read(qualityPath)),'2353ad6dfa20224277bca3749dc8f4db1b1b1ee606b1041d8ea65a5da54ade90');
const readiness=json(reportPath),quality=json(qualityPath);
assert.equal(readiness.sourceRevision,reviewed.baseline.head);assert.equal(quality.sourceRevision,reviewed.baseline.head);
assert.deepEqual(readiness.totals,{draft:9380,'identity-only':0,pending:525,'generated-identification':31});
assert.equal(readiness.rows.length,525);assert.equal(quality.counts.topicPlacements,9936);
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-hamstring-tours-editorial-priority';
assert(!fs.existsSync(root));fs.mkdirSync(root);
const initial=json('CURRENT_CHECKPOINT.json'),goalSha=sha(Buffer.from(JSON.stringify(initial.goal))),safetySha=sha(Buffer.from(JSON.stringify(initial.safety))),policySha=sha(Buffer.from(JSON.stringify(initial.activeWork.current.ownerPreviewPolicy)));
assert.equal(initial.goal.status,'active');assert.equal(initial.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
for(const [from,to] of [['CURRENT_CHECKPOINT.json','CURRENT_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md'],[main,'MAIN_REVIEW.json'],[stage+'/RESULT.json','WORKER_RESULT.json'],[readinessRun,'READINESS_RUN.json'],[reportPath,'READINESS_REPORT.local.json'],[qualityPath,'QUALITY_TRIAGE.local.json'],...reviewed.runs.flatMap(r=>[[r.stdout,path.basename(r.stdout)],[r.stderr,path.basename(r.stderr)]])])
  fs.copyFileSync(from,root+'/'+to,fs.constants.COPYFILE_EXCL);
const priorPath='F:/VisibleMedicine/recovery/checkpoints/20261022-head-bookmark-commit-controls-source-backup/github-backup.json';
assert.equal(sha(read(priorPath)),'b2df4eb0186c6ef34af352e92134b7f789398be2f888acd30f137b281c0c7723');
const prior=json(priorPath),priorRepo='F:/VisibleMedicine/history/website-work/github-head-bookmark-commit-controls-20261022.git';assert(prior.sourceBackupVerified&&prior.strictIntegrity);
const manifest=JSON.parse(runGit(['--git-dir='+priorRepo,'show',prior.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(priorPath)+'/remote-source-restored/'+row.path]));
const newSources=[['atlas/lib/hamstring-tours.ts',stage+'/lib/hamstring-tours.ts'],['atlas/lib/regional-tours.ts',stage+'/lib/regional-tours.ts'],['fixtures/regional-tours.preimage.ts.raw',stage+'/preimage/regional-tours.ts'],['fixtures/worker-hamstring-tours.ts.raw',stage+'/worker-hamstring-tours.ts.raw'],['fixtures/worker-test-hamstring-tours.mjs.raw',stage+'/worker-test-hamstring-tours.mjs.raw'],['atlas/scripts/pin-hamstring-tours.mjs',stage+'/scripts/pin-hamstring-tours.mjs'],['atlas/scripts/test-hamstring-tours.mjs',stage+'/scripts/test-hamstring-tours.mjs'],...['verify-hamstring-guided-tours-20261022.mjs','checkpoint-hamstring-guided-tours-20261022.mjs','capture-current-teaching-gap-report-20261022.mjs','audit-current-root-draft-quality-20261022.mjs'].map(p=>['coordination/'+p,path.resolve(p)])];
for(const [name,from] of newSources){const dest=root+'/source/'+name,key='pending/hamstring-guided-tours-20261022/'+name;assert(!selected.has(key));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(from,dest,fs.constants.COPYFILE_EXCL);selected.set(key,dest);}
const files=[...selected].map(([name,from])=>({path:name,bytes:fs.statSync(from).size,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{
  assert.equal(sha(read(main)),'0489edf6c9abd21f732d24365fa178ffbdea04a53385ba00d332954df67dab63');
  for(const row of reviewed.proposal)assert.equal(sha(read(stage+'/'+row.path)),row.sha256);
  for(const row of reviewed.unchangedSharedSource)assert.equal(sha(read(reviewed.baseline.path+'/'+row.path)),row.sha256);
  for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
  const now=json('CURRENT_CHECKPOINT.json');assert.equal(sha(Buffer.from(JSON.stringify(now.goal))),goalSha);assert.equal(sha(Buffer.from(JSON.stringify(now.safety))),safetySha);assert.equal(sha(Buffer.from(JSON.stringify(now.activeWork.current.ownerPreviewPolicy))),policySha);
};
const backupRoot=root+'-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-hamstring-tours-editorial-priority-20261022.git',branch:'backup/hamstring-tours-editorial-priority-20261022',parent:prior.head,parentRepo:priorRepo,parentTree:prior.tree,files,bytesFor:name=>read(selected.get(name)),verifySource,sourceIdentity:{atlas:reviewed.baseline.head,atlasTree:reviewed.baseline.tree,selectedWebsiteSourceSha256:initial.activeWork.current.sourceReceiptSha256,hamstringModuleSha256:reviewed.proposal[0].sha256},scope:'Inherited filtered source plus two unintegrated, main-reviewed bilateral hamstring tours and their source-only assertion/pin producers. Existing51tours preserved,8newstops,10exactsourceidentities,3bundles. Primary factual references summarized in original captions; no external images/article prose/assets imported. No generated pin JSON, teaching reports or clinical records, raw logs, anatomy metadata/data files, scans, masks, geometry, private references or canonical Git ancestry added. New authored audit code is included, its generated readiness/quality output is local-only. Source-only recovery, not whole/private/runnable backup. No selected full-gate/installed source or normal preview change.',proof:{originalToursPreserved:51,newDraftTours:2,newStops:8,customAssertions:{tourAndSourceRefusals:102,sourceLeafRefusals:349,reviewEvidenceChecks:8},sharedPlaybackUnchanged:true,readinessDraftPlacements:9380,readinessPendingPlacements:525,rootSelections:1104,readinessIsNotClinicalCompletion:true,generatedReportsUploaded:false,pinsUploaded:false,geometryAdmitted:false,integrated:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();
const receipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt,receiptSha256:sha(read(receipt)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false};
const cp={at:new Date().toISOString(),milestone:'Two hamstring draft tours main-reviewed; source-bound editorial readiness and quality queue refreshed',mainReview:main,mainReviewSha256:sha(read(main)),proposal:reviewed.proposal,originalToursPreserved:51,newDraftTours:2,newStops:8,sourceBackup,
  readinessAudit:{path:reportPath,sha256:sha(read(reportPath)),run:readinessRun,runSha256:sha(read(readinessRun)),source:readiness.sourceRevision,selections:1104,topicPlacements:9936,totals:readiness.totals,pendingByRegion:Object.fromEntries(Object.entries(readiness.byRegion).map(([key,value])=>[key,value.pending])),candidateOnly:true,notClinicalOrUniqueLessons:true},
  qualityAudit:{path:qualityPath,sha256:sha(read(qualityPath)),counts:quality.counts,interpretation:'Review hints only. Repeated regional/bilateral prose may be appropriate. An absent explicit citations field is not proof references are absent elsewhere. No automatic downgrade/deletion.'},
  reviewBindingPending:true,fullTypesBuildBrowserPending:true,integrated:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
  next:'Keep normal preview unchanged and selected full stock gate frozen. Classify its terminal result before composing pending website repairs. Integrate the tour separately with relocatable producers, registered focused tests, source-bound Review/runtime re-export and appropriate types/build/browser checks; never transfer prior sign-off. Use exact pending and editorial quality rows to prioritize substantive evidence-backed drafts without inventing missing anatomy/visibility. All71/eight roadmap/statuses remain unchanged.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(cp,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json'),c=p.activeWork.current;
c.pendingHamstringTours={checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),mainReview:main,mainReviewSha256:cp.mainReviewSha256,originalToursPreserved:51,newDraftTours:2,newStops:8,reviewBindingPending:true,fullTypesBuildBrowserPending:true,integrated:false,sourceBackup};
c.currentCandidateEditorialAudit={checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),source:readiness.sourceRevision,rootSelections:1104,topicPlacements:9936,totals:readiness.totals,pendingByRegion:cp.readinessAudit.pendingByRegion,qualityCounts:quality.counts,candidateOnly:true,notClinicalOrUniqueLessons:true,canonicalChecklistUnchanged:true};
c.pendingWorkers={task:'/root/hamstring_guided_tours_1022',status:'completed-main-reviewed-and-caption-corrected',model:'gpt-6-sol',effort:'medium',ownership:stage};p.activeWork.updated=cp.at;
assert.equal(sha(Buffer.from(JSON.stringify(p.goal))),goalSha);assert.equal(sha(Buffer.from(JSON.stringify(p.safety))),safetySha);assert.equal(sha(Buffer.from(JSON.stringify(c.ownerPreviewPolicy))),policySha);
const bytes=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(bytes)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',bytes);
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackup,originalToursPreserved:51,newDraftTours:2,newStops:8,pointerBytes:Buffer.byteLength(bytes),integrated:false,previewChanged:false}));
