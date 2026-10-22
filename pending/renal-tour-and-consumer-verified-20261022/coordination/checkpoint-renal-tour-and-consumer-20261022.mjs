// Local verified-source checkpoint with a filtered, independently restored source backup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const renalPath='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-verified/SOURCE.json';
assert.equal(sha(read(renalPath)),'b594ff4d1008a6368c52f50054eb817b590e1b372db66f55625a49dc1d07e014');
const renal=json(renalPath),pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;
const selectedPath=process.argv[2];assert(selectedPath&&path.isAbsolute(selectedPath));
const source=json(selectedPath);assert(source.website.startsWith('F:/VisibleMedicine/staging/'));
const terminalPath=process.argv[3];assert(terminalPath&&path.isAbsolute(terminalPath));const terminal=json(terminalPath);
assert.equal(terminal.code,0);assert.equal(terminal.sourceReceipt,selectedPath);assert.equal(terminal.sourceReceiptSha256,sha(read(selectedPath)));
assert.equal(terminal.counts.fail,0);assert.equal(terminal.counts.skipped,0);assert.equal(terminal.counts.cancelled,0);assert.deepEqual(terminal.sourceDrift,[]);
const priorPath='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/SOURCE.json',prior=json(priorPath);
assert.equal(sha(read(priorPath)),'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');
const outsideTests=s=>s.sourceRows.filter(r=>!r.path.startsWith('tests/'));
assert.deepEqual(outsideTests(source),outsideTests(prior));assert.equal(source.review,prior.review);
const verify=()=>{
 for(const s of [source,prior])for(const r of s.sourceRows)assert.equal(sha(read(s.website+'/'+r.path)),r.sha256,r.path);
 for(const r of renal.sourceRows)assert.equal(sha(read(renal.atlas+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',renal.atlas,'rev-parse','HEAD']).toString().trim(),renal.head);
 assert.equal(runGit(['-C',renal.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),renal.tree);
 assert.equal(runGit(['-C',renal.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);assert.equal(current.ownerPreviewPolicy.goalPaused,false);
};verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-and-consumer-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
fs.copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.before.md');
const previousRows=new Map(prior.sourceRows.map(r=>[r.path,r]));
const changedTests=source.sourceRows.filter(r=>previousRows.get(r.path)?.sha256!==r.sha256);assert(changedTests.every(r=>r.path.startsWith('tests/')));
for(const r of changedTests){const to=root+'/source/website/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+r.path,to);}
for(const r of renal.sourceRows){const to=root+'/source/atlas/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(renal.atlas+'/'+r.path,to);}
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'188745ad9c62046c3a9ee8670a987583ebbda7f943470427cd64e0f5d5717bf1');
const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const parentRepo='F:/VisibleMedicine/history/website-work/github-renal-tour-source-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
for(const r of manifest.files)assert.equal(sha(read(selected.get(r.path))),r.sha256);
const prefix='pending/renal-tour-and-consumer-verified-20261022/';
function add(from,to){
 assert(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'));const b=read(from);assert.deepEqual(Buffer.from(b.toString('utf8')),b);
 const p=prefix+to;assert(!selected.has(p));selected.set(p,from);
}
for(const r of renal.sourceRows.filter(r=>/\.(?:ts|mjs)$/.test(r.path)))add(renal.atlas+'/'+r.path,'atlas/'+r.path);
for(const r of changedTests)add(source.website+'/'+r.path,'website/'+r.path);
for(const p of ['freeze-renal-tour-source-20261022.mjs','verify-renal-tour-final-20261022.mjs','verify-renal-tour-source-20261022.mjs',
 'inventory-renal-predecessor-failures-20261022.mjs','prepare-surface-spinal-consumer-20261022.mjs','prepare-spinal-shoulder-history-20261022.mjs',
 'build-renal-tour-runtime-20261022.mjs','prepare-current-consumer-assurance-20261022.mjs','checkpoint-renal-tour-and-consumer-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
for(const stem of ['20261022-spinal-neck-row-followup','20261022-four-consumer-source-followup']){
 const p='F:/VisibleMedicine/staging/'+stem+'/evidence/verify-source.mjs';add(p,'proofs/'+stem+'/verify-source.mjs');
}
add('F:/VisibleMedicine/staging/20261022-two-teaching-consumer-followup/evidence/prove-source-only.mjs','proofs/20261022-two-teaching-consumer-followup/prove-source-only.mjs');
for(const p of ['tests/colic-adapter-inverse.test.mjs','tests/four-consumer-source-inverse.mjs'])
 add('F:/VisibleMedicine/staging/20261022-four-consumer-source-followup/evidence/initial-CODE/'+p,'first-proposal/'+p);
const priorTests=changedTests.filter(r=>previousRows.has(r.path));
for(const r of priorTests)add(prior.website+'/'+r.path,'RAW/website/'+r.path);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256,r.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-and-consumer-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-renal-tour-and-consumer-20261022.git',branch:'backup/renal-tour-and-consumer-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{atlas:renal.head,atlasTree:renal.tree,websiteSourceReceiptSha256:sha(read(selectedPath)),review:source.review},
 scope:'Inherited filtered source plus verified renal-tour source guard, additive tests, exact historical consumer repairs and code preimages. Generated pin/Review metadata, compiled runtime/viewer, private records/DB/env/references/decisions, held assets, scans/models/masks, raw logs/media and canonical ancestry remain local. Not full, private or runnable recovery. No installation or deployment.',
 proof:{renalTypesAndProductionBuild:true,renalPlayerTests:75,renalReviewPacketsChanged:5,otherReviewPacketsUnchanged:1099,teachingPlacementsUnchanged:9936,
  websiteTestOnlyChanges:changedTests.length,focusedNative:terminal.counts,allNonTestWebsiteBytesUnchanged:true,
  widerPredecessor:{tests:751,pass:713,fail:38},wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,ownerPreviewChanged:false,publicDeployment:false}});}
catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();const backupPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,
 independentlyVerified:!!saved,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const widerPath='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate/native-website-predecessor/TERMINAL.json';
const runtimePath='F:/VisibleMedicine/staging/20261022-renal-tour-runtime-candidate/RUNTIME_EXPORT.json',runtime=json(runtimePath);
assert.equal(runtime.code,0);assert.equal(runtime.source,renal.head);assert.equal(runtime.tree,renal.tree);
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Exact-source renal tour verified, committed and exported in isolation; focused historical consumer repairs verified without changing any website product or Review bytes.',
 sourceReceipt:selectedPath,sourceReceiptSha256:sha(read(selectedPath)),sourcePaths:source.sourcePaths,review:source.review,
 atlasWebsiteSourceRemains:{atlas:source.atlas,head:source.atlasHead,tree:source.atlasTree},renalSource:{receipt:renalPath,sha256:sha(read(renalPath)),head:renal.head,tree:renal.tree,websiteImportPending:true},
 native:{receipt:terminalPath,sha256:sha(read(terminalPath)),...terminal.counts},changedTestPaths:changedTests.map(r=>r.path),
 renalRuntime:{receipt:runtimePath,sha256:sha(read(runtimePath)),exported:true,websiteImportPending:true},
 widerPredecessor:{receipt:widerPath,sha256:sha(read(widerPath)),counts:json(widerPath).counts,allFailuresDiagnosed:false},
 failedNativeRepairReceipts:['F:/VisibleMedicine/staging/20261022-surface-spinal-consumer-successor/native-integration/TERMINAL.json',
 'F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-successor/native-integration/TERMINAL.json'],
 sourceBackup,full71AndEightIdeasPreserved:true,canonicalInstalled:false,ownerPreviewChanged:false,ownerPreviewPolicy:current.ownerPreviewPolicy,
 typesAndBuildForTestOnlyWebsiteReusedFromExactProductPredecessor:true,newWebsiteBuildClaim:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');
const pendingRenal={...latest.activeWork.current.pendingRenalTour,sourceRows:renal.sourceRows,at:result.at,head:renal.head,tree:renal.tree,clean:true,
 verifiedReceipt:renalPath,verifiedReceiptSha256:sha(read(renalPath)),runtimeExport:result.renalRuntime,registrationAndAllPacketComparisonPending:false,rendererRevisionGenerationPending:false,
 typesBuildAndWebsiteImportPending:false,typesAndBuildPassed:true,websiteImportPending:true,sourceBackup};
Object.assign(latest.activeWork.current,{at:result.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),
 currentCandidate:source.website,sourceReceipt:selectedPath,sourceReceiptSha256:sha(read(selectedPath)),sourcePaths:source.sourcePaths,sourceBackup,pendingRenalTour:pendingRenal,
 wholeSuitePassing:false,full71AndEightIdeasPreserved:true,
 next:'Continue diagnosed current-source regression groups with exact historical assertions retained, then import the separately verified renal source coherently in isolation. Website remains bound to Atlas389, not the new renal commit. Owner preview/cutover/refresh hold remains; continue independent roadmap work without waiting for clinical sign-off.'});
latest.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackup,websiteSourceReceipt:selectedPath,ownerPreviewChanged:false}));
