// Scoped first-party source/evidence recovery. No installation or preview actions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha,backup,runGit} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/recovery/checkpoints/20261024-review-harness-preparation';
const links='F:/VisibleMedicine/staging/20261024-review-links-harness-proposal';
const css='F:/VisibleMedicine/staging/20261024-compact-css-proposal';
const stream='F:/VisibleMedicine/staging/20261024-streaming-diagnostic';
const source='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/SOURCE_BOUND.json';
const sourceHash='cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e';
const priorSupplement='F:/VisibleMedicine/recovery/checkpoints/20261024-combined-atlas-bounded-unit-source-supplement/github-backup.json';
assert.equal(sha(read(source)),sourceHash);
assert.equal(sha(read(priorSupplement)),'6490cb7ebd51eeadfcec35fa5e69b1845583f815888f4c48e9a11b4c1ef7cc2c');
const sourceRows=new Map(json(source).sourceRows.map(row=>[row.path,row]));
const prior=json(priorSupplement),base=prior.sourceIdentity.requiredBase;
const selected=[
  ...prior.sourceIdentity.restorePaths.map(row=>({path:row.path,source:row.restore,restore:row.restore})),
  ...['clinical-review-integration.test.ts'].map(file=>({path:'pending/review-links-harness-20261024/tests/'+file,source:links+'/candidate/tests/'+file})),
  ...['atlas-compact-study-checks.mjs','runtime-family-forward-inverse.test.mjs','fixtures/compact-css-discovery-seam-20261024.json','compact-css-pure-check.mjs','compact-css-negative-controls.mjs'].map(file=>({path:'pending/compact-css-20261024/tests/'+file,source:css+'/candidate/tests/'+file})),
  ...['streaming-release-failures-20261024.mjs','test-streaming-release-failures-20261024.mjs','verify-review-links-harness-proposal-20261024.mjs','save-review-harness-preparation-20261024.mjs'].map(file=>({path:'recipes/'+file,source:path.resolve(file)})),
].map(row=>({...row,restore:row.restore??row.source,bytes:read(row.source).length,sha256:sha(read(row.source))}));
assert(selected.length<20);assert.equal(new Set(selected.map(row=>row.path)).size,selected.length);
assert(selected.reduce((n,row)=>n+row.bytes,0)<=192*1024,'Retain the tiny supplement payload cap');

const originalFiles=[
  [links,'tests/clinical-review-integration.test.ts'],
  [css,'tests/atlas-compact-study-checks.mjs'],
  [css,'tests/runtime-family-forward-inverse.test.mjs'],
];
function verify(){
  assert.equal(sha(read(source)),sourceHash);
  for(const [proposal,file]of originalFiles){
    const bytes=read(proposal+'/preimage/'+file),row=sourceRows.get(file);assert(row);
    assert.equal(sha(bytes),row.sha256);assert.deepEqual(read(json(source).website+'/'+file),bytes);
  }
  for(const row of selected)assert.equal(sha(read(row.source)),row.sha256,row.path);
  const p=json('CURRENT_CHECKPOINT.json');assert.equal(p.goal.status,'active');
  assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
  assert.equal(json(links+'/main-review/controls-v2/TERMINAL.json').exitCode,0);
  assert.equal(json(stream+'/checks/TERMINAL.json').exitCode,0);
  const followup=json(css+'/MAIN_FOLLOWUP.json');
  assert.deepEqual(followup.isolatedModesPassed,['gate','baseline','duplicate-owner','duplicate-target','missing-owner','unreferenced-owner','changed-css-bytes']);
  assert.equal(sha(read(css+'/'+followup.addedCandidateGate)),followup.addedCandidateGateSha256);
  assert.equal(sha(read(css+'/'+followup.boundedSeamFixture)),followup.boundedSeamFixtureSha256);
  assert.equal(sha(read(css+'/'+followup.control)),followup.controlSha256);
}
verify();
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);};

if(process.argv[2]==='local'){
  assert(!fs.existsSync(root));fs.mkdirSync(root);
  for(const row of selected)copy(row.source,root+'/source/'+row.path);
  for(const [proposal,files]of [
    [links,['HANDOFF.json','INVERSE.json','main-review/CONTROLS.json','main-review/controls.stdout.log','main-review/controls.stderr.log','main-review/controls-v2/TERMINAL.json','main-review/controls-v2/stdout.log','main-review/controls-v2/stderr.log','main-review/worker-original.test.ts']],
    [css,['HANDOFF.json','INVERSE.json','MAIN_FOLLOWUP.json']],
    [stream,['initial/FAILURE_SUMMARY.json','initial/streaming-release-failures-20261024.mjs','initial/test-streaming-release-failures-20261024.mjs','checks/TERMINAL.json','checks/stdout.log','checks/stderr.log','observation/TERMINAL.json','observation/stdout.log','observation/stderr.log']],
  ])for(const file of files)copy(proposal+'/'+file,root+'/evidence/'+path.basename(proposal)+'/'+file);
  const partial=JSON.parse(read(stream+'/observation/stdout.log').toString().trim()).evidence;
  copy(partial,root+'/evidence/partial-inventory.json');
  for(const [proposal,file]of originalFiles)copy(proposal+'/preimage/'+file,root+'/preimages/'+(proposal===links?'links/':'css/')+file);
  copy('CURRENT_CHECKPOINT.json',root+'/CURRENT_BEFORE.json');
  const p=json('CURRENT_CHECKPOINT.json'),keys=['pendingRightGastricEusProposal','pendingReviewHeadingProposal'];
  const fields=keys.map(key=>({path:'activeWork.current.'+key,value:p.activeWork.current[key]}));
  write(root+'/history.json',{schema:'visible-medicine.lossless-index-history/1',at:new Date().toISOString(),previousArchive:p.historyArchive,fields});
  write(root+'/field-index.json',{fields:fields.map(row=>row.path),previousArchive:p.historyArchive,readPolicy:'Read original paths for relevant older facts; no state, approval or permission inferred.'});
  for(const key of keys){const old=p.activeWork.current[key];p.activeWork.current[key]={checkpoint:old.checkpoint,sha256:old.checkpointSha256,historyRef:'activeWork.current.'+key,integrated:old.integrated,installed:old.installed,...(old.browserAccepted===false?{browserAccepted:false}:{})};}
  const rebuilt=structuredClone(p);for(const row of fields)rebuilt.activeWork.current[row.path.split('.').at(-1)]=row.value;
  assert.deepEqual(rebuilt,json(root+'/CURRENT_BEFORE.json'),'Lossless whole-index inverse before replacing archive pointer');
  p.historyArchive={path:root+'/history.json',sha256:sha(read(root+'/history.json')),fieldIndex:root+'/field-index.json',allHistoryRetained:true,priorArchiveIn:'previousArchive',readPolicy:'Read original JSON paths only for relevant older facts. Missing details never imply approval, completion or permission.'};
  const checkpoint={at:new Date().toISOString(),kind:'test-harness-preparation-not-application-acceptance',source,sourceSha256:sourceHash,
    selected: selected.map(({source,...row})=>row),selectedPayloadBytes:selected.reduce((n,row)=>n+row.bytes,0),
    controls:{streamingCases:4,linkSourceCases:3,css:json(css+'/MAIN_FOLLOWUP.json')},
    partialInventory:{path:partial,sha256:sha(read(partial)),terminal:false,passingClaim:false},
    fullSuite:'same original1288-root process; not restarted or filtered',
    history:{path:root+'/history.json',sha256:sha(read(root+'/history.json')),wholeIndexInverseVerified:true},
    originalApplicationSuitesRun:false,originalGraphOrMiniflareRun:false,
    proposalSourceBackupVerified:false,previewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false};
  write(root+'/checkpoint.json',checkpoint);
  p.activeWork.current.pendingReviewHarnessPreparation={checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),originalSuitesRun:false,installed:false};
  p.activeWork.updated=checkpoint.at;const bytes=Buffer.from(JSON.stringify(p,null,2)+'\n');assert(bytes.length<65536);
  fs.writeFileSync('CURRENT_CHECKPOINT.json',bytes);copy('CURRENT_CHECKPOINT.json',root+'/CURRENT_LOCAL.json');
  console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),indexBytes:bytes.length,selectedPaths:selected.length,payloadBytes:checkpoint.selectedPayloadBytes}));
}else if(process.argv[2]==='backup'){
  assert(fs.existsSync(root+'/checkpoint.json'));const remoteRoot=root+'-source-supplement';assert(!fs.existsSync(remoteRoot));
  const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
  if(!(typeof memory.AvailableMBytes==='number'&&memory.AvailableMBytes>=512&&typeof memory.PercentCommittedBytesInUse==='number'&&memory.PercentCommittedBytesInUse<=90)){
    console.log(JSON.stringify({started:false,memory,reason:'Tiny-source-supplement resource admission declined; no remote attempt folder'}));
  }else{
    assert.equal(runGit(['ls-remote',prior.repository,'refs/heads/'+base.branch]).toString().trim(),base.head+'\trefs/heads/'+base.branch);
    const map=new Map(selected.map(row=>[row.path,row.source]));
    const result=backup({root:remoteRoot,repo:'F:/VisibleMedicine/history/website-work/github-review-harness-preparation-20261024.git',branch:'backup/review-harness-preparation-20261024',parent:null,carryParent:false,
      files:selected.map(({path,bytes,sha256})=>({path,bytes,sha256})),bytesFor:file=>read(map.get(file)),verifySource:verify,
      sourceIdentity:{kind:'incremental-source-supplement-not-cumulative-snapshot',websiteSourceSha256:sourceHash,requiredBase:base,baseCoverage:prior.sourceIdentity.baseCoverage,restorePaths:selected.map(({path,restore})=>({path,restore}))},
      scope:'Only explicit first-party source/test/JSON-fixture recipes, <=192KiB selected. Includes the prior three-file portability supplement, plus proposed Review-link/compact-CSS harness changes and bounded streaming-diagnostic tools. Recovery requires exact earlier filtered base branch/head/tree; no earlier unique source removed. Not a cumulative, whole/private or runnable backup. No scans, models, masks, private references, licence-notice addendum, dependencies, raw QA or later coordination uploaded. Source controls are not application/browser/clinical/release acceptance.',
      proof:{sourceOnlyControls:true,originalSuiteUnrun:true,selectedPayloadBytes:selected.reduce((n,row)=>n+row.bytes,0),memoryAtStart:memory,requiredBaseRemoteHeadReadback:true,rawQaUploaded:false,previewChanged:false,installed:false,clinicalApproval:false}});
    write(root+'/SOURCE_SUPPLEMENT.json',{at:new Date().toISOString(),receipt:remoteRoot+'/github-backup.json',sha256:sha(read(remoteRoot+'/github-backup.json')),head:result.head,tree:result.tree,sourcePaths:result.sourcePaths,restoredPaths:result.restoredPaths,requiredBase:base,cumulative:false,wholePrivateOrRunnableBackup:false});
    console.log(JSON.stringify({supplement:root+'/SOURCE_SUPPLEMENT.json',sha256:sha(read(root+'/SOURCE_SUPPLEMENT.json')),head:result.head,selected:result.sourcePaths,restored:result.restoredPaths}));
  }
}else throw Error('Use local or backup');
