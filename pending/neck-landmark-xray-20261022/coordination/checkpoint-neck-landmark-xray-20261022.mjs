// Source-only checkpoint and filtered readback; no preview installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate',atlas=stage+'/atlas';
const baseline='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),baseline);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const git=args=>runGit(['-C',atlas,...args]).toString().trim();
const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']);
assert.equal(git(['merge-base',baseline,'HEAD']),baseline);assert.equal(git(['status','--porcelain']),'');
const expected=['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json',
  'content/neck-landmark-xray.ts','content/regional-teaching/head-neck.json','content/review-revisions.json','lib/neck-landmark-xray.ts','scripts/test-neck-landmark-xray.mjs'].sort();
assert.deepEqual(git(['diff','--name-only',baseline,'HEAD']).split('\n').sort(),expected);
const first=stage+'/verification/TERMINAL.json',final=stage+'/verification-producer/TERMINAL.json',buildPath=stage+'/production-build-producer/TERMINAL.json';
assert(json(first).allPassed);assert(json(final).allPassed);const built=json(buildPath);
assert(built.passing);assert.equal(built.head,head);assert.equal(built.tree,tree);assert.deepEqual(built.sourceDrift,[]);
const counts={};
for(const name of ['neck-native','gap-tools','regional-freshness']){
  const text=read(stage+'/verification-producer/'+name+'.stdout.txt').toString();
  const count=key=>Number(text.match(new RegExp('(?:#|ℹ) '+key+' (\\d+)'))?.[1]);
  counts[name]={tests:count('tests'),pass:count('pass'),fail:count('fail'),cancelled:count('cancelled'),skipped:count('skipped')};
  assert.equal(counts[name].tests,counts[name].pass);assert.equal(counts[name].fail,0);
  assert.equal(counts[name].cancelled,0);assert.equal(counts[name].skipped,0);
}
assert.equal(Object.values(counts).reduce((n,row)=>n+row.tests,0),34);
const rows=git(['ls-files','-z']).split('\0').filter(Boolean).sort().map(path=>({path,bytes:read(atlas+'/'+path).length,sha256:sha(read(atlas+'/'+path))}));
const ready={schemaVersion:1,at:new Date().toISOString(),baseline,head,tree,atlas,sourceRows:rows,sourcePaths:rows.length,changedPaths:expected,
  checks:{initial:{path:first,sha256:sha(read(first))},final:{path:final,sha256:sha(read(final))},build:{path:buildPath,sha256:sha(read(buildPath))},counts},
  lessonPlacements:{roots:1104,total:9936,changed:3,preserved:9933,draft:9380,pending:525,generatedIdentification:31},
  reviewPackets:{changed:3,preserved:1101,staleApprovalRefused:true},sourceIdentityMutationRefusals:121,
  generatedByRealProducers:true,preexistingShoulderStylesheetWitnessRepaired:true,unchangedShoulderModelsAndTeaching:true,
  canonicalInstalled:false,previewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
const readyPath=stage+'/READY_ATLAS_SOURCE.json';assert(!fs.existsSync(readyPath));fs.writeFileSync(readyPath,JSON.stringify(ready,null,2)+'\n',{flag:'wx'});

const evidence={at:new Date().toISOString(),scope:'Original text-only three-root X-ray orientation drafts; references do not license figures or article text.',
  references:[
    {url:'https://pubs.rsna.org/doi/10.1148/rg.2017160073',supports:'Normal lateral neck landmarks, overlapping projection and variable laryngeal cartilage calcification.',reuse:'Reading link and original factual synthesis only; no copied article prose, figures or diagrams.'},
    {url:'https://jksronline.org/DOIx.php?id=10.3348%2Fjkrs.1991.27.3.317',supports:'Anterior epiglottic margin against vallecular air and posterior margin against laryngeal air under selected acquisition technique.',access:'Indexed primary abstract examined; no downloaded figures or full article.',reuse:'No copied prose or figures; no numerical performance or diagnostic cutoff claimed.'},
    {url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6056368/',supports:'Posterior cricoid ridge ossification can mimic a fish bone in a selected adult ED radiograph series.',reuse:'Original factual synthesis only; no imported article material; not a population prevalence or foreign-body exclusion rule.'},
  ],newDependencies:[],newFonts:[],newMeshes:[],newTextures:[],newDatasets:[],articleAssetsImported:false,
  existingSourceLicenceAndAttributionUnchanged:true,clinicalApproval:false};
fs.writeFileSync(stage+'/REFERENCE_EVIDENCE.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
const websiteReceipt='F:/VisibleMedicine/staging/20261022-linked-tour-dismiss-successor/READY_SOURCE.json',website=json(websiteReceipt);
assert.equal(sha(read(websiteReceipt)),'d72ddc1094db40b0a44cd1192f2362ca89b43a80c460a4423b401a7f61272013');
const auditPaths=['app/learn/related-anatomy/page.tsx','lib/lecture-related-repository.ts','lib/lecture-repository.ts',
  'lib/workbook-access.ts','lib/workbook-eligibility.ts','app/learn/lectures/[workbookId]/page.tsx',
  'components/LectureLesson.tsx','app/api/education/lectures/[workbook_id]/route.ts'];
const accessAudit={at:new Date().toISOString(),sourceReceipt:websiteReceipt,sourceReceiptSha256:sha(read(websiteReceipt)),
  paths:auditPaths.map(path=>{const row=website.sourceRows.find(row=>row.path===path);assert(row,path);assert.equal(sha(read(website.website+'/'+path)),row.sha256);return{path,sha256:row.sha256};}),
  outcome:'No confirmed paid-lecture title/body leak in inspected source: discovery IDs are eligibility-filtered, then final published-lecture access and manifest integrity are rechecked before rendering. Direct player and API repeat the publication gate.',
  limits:'Read-only bounded source audit, not a signed-in target account/tenant/media or end-to-end security exercise.',
  next:'A controlled direct API/player target-account exercise remains useful; preserve independent Atlas/case/lecture access.'};
fs.writeFileSync(stage+'/ACCESS_AUDIT.json',JSON.stringify(accessAudit,null,2)+'\n',{flag:'wx'});

const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-linked-tour-dismiss-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'89fb0830715a5bdeb2329349eeee6744e4846c3c8b06522ead97c0cdda25d67d');
assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-linked-tour-dismiss-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const prefix='pending/neck-landmark-xray-20261022/';
function add(from,to){const bytes=read(from);assert(/\.(?:mjs|ts|tsx|preimage)$/.test(from));assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
for(const file of ['app/body-content.ts','content/neck-landmark-xray.ts','lib/neck-landmark-xray.ts','scripts/test-neck-landmark-xray.mjs'])add(atlas+'/'+file,'atlas/'+file);
for(const file of ['neck-landmark-xray.ts.preimage','test-neck-landmark-xray.mjs.preimage'])add(stage+'/RAW-before-wording/'+file,'RAW/'+file);
for(const file of ['prepare-neck-landmark-xray-20261022.mjs','verify-neck-landmark-xray-20261022.mjs','build-neck-landmark-xray-20261022.mjs','checkpoint-neck-landmark-xray-20261022.mjs'])add(path.resolve(file),'coordination/'+file);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{assert.equal(git(['status','--porcelain']),'');assert.equal(git(['rev-parse','HEAD']),head);
  for(const row of rows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,row.path);
  for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-neck-landmark-xray-source-backup';
let saved,backupFailure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-neck-landmark-xray-20261022.git',
  branch:'backup/neck-landmark-xray-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
  sourceIdentity:{selectedWebsiteReceiptSha256:sha(read(websiteReceipt)),atlasCandidate:head,atlasCandidateTree:tree,installedAtlas:baseline},
  scope:'Inherited filtered source plus staged source-bound hyoid/epiglottis/cricoid X-ray draft code, additive test, exact original wording preimages and coordination helpers. Generated snapshots/pins/revision JSON, article assets, raw evidence/logs, models/scans/masks, private records/DB/env/decisions/references and canonical ancestry are excluded. Not full/private/runnable recovery or installation.',
  proof:{focusedCounts:counts,fullTypesPassed:true,productionBuildPassed:true,sourceDrift:[],changedLessons:3,unrelatedPlacementsPreserved:9933,
    sourceIdentityRefusals:121,staleApprovalRefused:true,liveBrowserAcceptance:false,wholeSuitePassing:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}
catch(error){backupFailure={at:new Date().toISOString(),message:error.message,independentlyVerified:false,automaticRetry:false};
  fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(backupFailure,null,2)+'\n',{flag:'wx'});}
verifySource();

const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-neck-landmark-xray-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
for(const file of expected){const dest=directory+'/source/'+file;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(atlas+'/'+file,dest);}
const backupReceipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:backupReceipt,receiptSha256:sha(read(backupReceipt)),head:saved?.head,tree:saved?.tree,
  sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:Boolean(saved),wholePrivateOrRunnableBackup:false,...(backupFailure?{failure:backupFailure}:{} )};
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Three exact-source lateral-neck X-ray orientation drafts with unchanged anatomy and stale-approval refusal.',
  sourceReceipt:websiteReceipt,sourceReceiptSha256:sha(read(websiteReceipt)),sourcePaths:website.sourcePaths,
  atlasCandidateReceipt:readyPath,atlasCandidateReceiptSha256:sha(read(readyPath)),atlasCandidateHead:head,atlasCandidateTree:tree,
  checks:ready.checks,referenceEvidence:{path:stage+'/REFERENCE_EVIDENCE.json',sha256:sha(read(stage+'/REFERENCE_EVIDENCE.json'))},
  accessAudit:{path:stage+'/ACCESS_AUDIT.json',sha256:sha(read(stage+'/ACCESS_AUDIT.json'))},sourceBackup,
  full71AndEightIdeasPreserved:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
  preparationRefusal:'Initial byte-equality preflight rejected a clean Git checkout because an HTML evidence file had CRLF in canonical source and LF in the candidate. Exact-baseline resume proved every differing file was line-ending-only; no source, asset or licence text was substituted.',
  firstProductionBuild:{path:stage+'/production-build/TERMINAL.json',sha256:sha(read(stage+'/production-build/TERMINAL.json')),accepted:false,
    reason:'Command exited0 but unchanged-source guard refused stock producer drift in shoulder/body review metadata. Canonical read-only review-revisions --check independently failed with Review fingerprints are stale. Existing CSS had972224... bytes while the baseline cache named9834c7...; no CSS was changed. Actual producer admission and a complete original nine-structure source inverse preserve all model/teaching/imaging values and refresh only display-bound revisions.'},
  next:'Keep normal preview unchanged. Selected website6113 and Review3ed remain staged; installed Atlas6d7/Reviewae84 remain truth. The new Atlas neck-Xray candidate is separate and requires coherent runtime/Review admission before future installation. Continue source-backed teaching and integrated existing3D/CT/MRI usability without clinical-signoff stall; no public deployment, fees, private data or desktopPACS edits.'};
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
assert.equal(current.sourceReceipt,websiteReceipt);
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),sourceBackup,
  pendingNeckLandmarkXray:{sourceReceipt:readyPath,sourceReceiptSha256:result.atlasCandidateReceiptSha256,head,tree,canonicalInstalled:false,
    focusedCounts:counts,fullTypesPassed:true,productionBuildPassed:true,changedLessons:3,clinicalApproval:false},next:result.next,beforeFurtherWork:result.next,pendingWorkers:[]});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,atlasHead:head,atlasSourcePaths:rows.length,
  sourceBackup,counts,previewChanged:false}));
