import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const config=process.argv[3]?json(process.argv[3]):{};
const proposal=config.proposal??'F:/VisibleMedicine/staging/20261021-closed56-historical-role-proposal';
const stage=config.stage??'F:/VisibleMedicine/staging/20261021-closed56-role-application';
assert(proposal.startsWith('F:/VisibleMedicine/staging/')&&stage.startsWith('F:/VisibleMedicine/staging/')&&!proposal.includes('..')&&!stage.includes('..'));
const rawManifest=json(proposal+'/PROPOSAL.json'),pointer=json('CURRENT_CHECKPOINT.json');
const publicFocus=rawManifest.schema==='visible-medicine.public-focus-preservation-proposal/1';
const headPilot=rawManifest.schema==='visible-medicine-head-pilot-delivery-proposal-v1';
const manifest=publicFocus
 ?{...rawManifest,websiteHeadAtObservation:rawManifest.websiteHead,source:rawManifest.atlasSource,review:rawManifest.canonicalReview,proposedPaths:rawManifest.changes.map(r=>({path:r.path,preimageSha256:r.preimage?.sha256??null,candidateSha256:r.sha256,candidateBytes:r.bytes}))}
 :headPilot
 ?{...rawManifest,websiteHeadAtObservation:rawManifest.baseline.websiteHead,source:rawManifest.baseline.atlasHead,review:rawManifest.baseline.review,proposedPaths:rawManifest.paths.map(r=>({path:r.path,preimageSha256:r.preimage?.sha256??null,candidateSha256:r.candidate.sha256,candidateBytes:r.candidate.bytes}))}
 :rawManifest.schema==='visible-medicine.staged-regional-link-role-proposal/1'
 ?{...rawManifest,source:rawManifest.atlasSource,review:rawManifest.reviewDigest}
 :rawManifest;
const currentSnapshot=pointer.activeWork.inflight?.takesPrecedenceOverSavedCheckpointNarrative&&pointer.activeWork.inflight?.latestSourceSnapshot
 ?{path:pointer.activeWork.inflight.latestSourceSnapshot,sha256:pointer.activeWork.inflight.latestSourceSnapshotSha256}
 :{path:pointer.activeWork.sourceSnapshot,sha256:pointer.activeWork.sourceSnapshotSha256};
const expected=config.expectedPaths??['tests/closed56-femoral-epoch.test.mjs','tests/closed56-live-preservation.test.mjs','tests/closed56-live-preservation.mjs','tests/closed56-live-context-repair-contract.test.mjs','tests/closed56-whole-role-transition-20261021.test.mjs','tests/fixtures/closed56-live-preservation-before-role-20261021.mjs.raw','tests/fixtures/closed56-live-preservation-test-before-role-20261021.mjs.raw','tests/fixtures/closed56-femoral-epoch-before-role-20261021.mjs.raw','tests/fixtures/closed56-live-context-repair-contract-before-role-20261021.mjs.raw'];
assert.deepEqual(manifest.proposedPaths.map(r=>r.path),expected);
assert(expected.every(p=>(/^tests\/[A-Za-z0-9_./-]+\.(?:mjs|ts|raw)$/.test(p)||(publicFocus&&p==='tests/fixtures/public-focus-epochs-20261021.json'))&&!p.includes('..')));
const proposalFiles=publicFocus||headPilot?proposal+'/candidate':proposal;
if(publicFocus){assert.deepEqual(expected,['tests/public-focus-adapter-preservation.test.mjs','tests/public-focus-epoch-preservation.mjs','tests/fixtures/public-focus-epochs-20261021.json','tests/fixtures/public-focus-original-guard-20261021.mjs.raw']);assert.equal(sha(read(proposal+'/PROPOSAL.json')),'672101a503c6b706b2842bf86df4da650ff75e02e149bc0ab8074659939f4e6b');}
if(headPilot){assert.deepEqual(expected,['tests/head-neck-pilot-current.test.mjs','tests/historical-head-pilot-87-read.mjs','tests/head-pilot-delivery-role-preservation-20261021.test.mjs','tests/fixtures/head-pilot-delivery-before-role-20261021/head-neck-pilot-current.test.mjs.raw','tests/fixtures/head-pilot-delivery-before-role-20261021/head-neck-pilot.test.ts.raw']);assert.equal(sha(read(proposal+'/PROPOSAL.json')),'66d733b96d1a3ec0fea91cf1bba48e30b3f3631ffea7209f294de42296265db1');}
if(config.manifestSha256)assert.equal(sha(read(proposal+'/PROPOSAL.json')),config.manifestSha256);
assert.equal(manifest.websiteHeadAtObservation,'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(manifest.source,pointer.activeWork.source);assert.equal(manifest.review,pointer.activeWork.review);
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const environment=()=>{
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),manifest.websiteHeadAtObservation);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),manifest.source);
 assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,manifest.review);assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of json('F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared/PRIVATE_GUARDS_AT_CUTOVER.json'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 process.kill(266712,0);
};
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(stage));const rows=json(currentSnapshot.path);assert.equal(rows.length,config.beforeInputs??5162);
 assert.equal(sha(read(currentSnapshot.path)),currentSnapshot.sha256);
 for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);environment();
 for(const r of manifest.proposedPaths){
  const b=read(proposalFiles+'/'+r.path);assert.equal(b.length,r.candidateBytes);assert.equal(sha(b),r.candidateSha256);assert(!b.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(b);assert(!b.includes(Buffer.from('\r\n')),'Exact LF patch source');
  if(r.preimageSha256===null)assert(!fs.existsSync(site+'/'+r.path));else assert.equal(sha(read(site+'/'+r.path)),r.preimageSha256,r.path);
 }
 fs.mkdirSync(stage);
 const preserved=pointer.activeWork.preservedSourcePaths.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
 for(const r of manifest.proposedPaths)if(r.preimageSha256){const to=stage+'/preimages/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+r.path,to,fs.constants.COPYFILE_EXCL);}
 save('PREPARATION.json',{at:new Date().toISOString(),source:manifest.source,review:manifest.review,proposal,manifestSha256:sha(read(proposal+'/PROPOSAL.json')),priorSourceSnapshot:currentSnapshot.path,priorSourceSnapshotSha256:currentSnapshot.sha256,preserved,paths:manifest.proposedPaths,ownerPreviewPid:266712,canonicalChanged:false});
 console.log(expected.length+' exact proposed paths/preimages and complete current-source guards saved; canonical unchanged.');
}else if(process.argv[2]==='emit'){
 const plan=json(stage+'/PREPARATION.json');assert.equal(sha(read(proposal+'/PROPOSAL.json')),plan.manifestSha256);environment();
 const patch=['*** Begin Patch'];
 for(const r of plan.paths){
  assert.equal(sha(read(proposalFiles+'/'+r.path)),r.candidateSha256);
  if(r.preimageSha256){
   assert.equal(sha(read(site+'/'+r.path)),r.preimageSha256);
   const result=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',site+'/'+r.path,proposalFiles+'/'+r.path],{encoding:'utf8',windowsHide:true,maxBuffer:4e6});assert.equal(result.status,1);
   const lines=result.stdout.replaceAll('\r\n','\n').split('\n'),start=lines.findIndex(l=>l.startsWith('@@'));assert(start>=0);
   patch.push('*** Update File: '+site+'/'+r.path,...lines.slice(start).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));
  }else{
   assert(!fs.existsSync(site+'/'+r.path));const text=read(proposalFiles+'/'+r.path).toString();assert(text.endsWith('\n'));
   patch.push('*** Add File: '+site+'/'+r.path,...text.slice(0,-1).split('\n').map(l=>'+'+l));
  }
 }
 patch.push('*** End Patch');console.log(patch.join('\n'));
}else{
 assert.equal(process.argv[2],'verify');const plan=json(stage+'/PREPARATION.json');assert.equal(sha(read(proposal+'/PROPOSAL.json')),plan.manifestSha256);
 const prior=json(plan.priorSourceSnapshot),changed=new Map(plan.paths.map(r=>[r.path,r]));
 const rows=prior.map(r=>changed.has(r.path)?{path:r.path,bytes:changed.get(r.path).candidateBytes,sha256:changed.get(r.path).candidateSha256}:r);
 for(const r of plan.paths)if(r.preimageSha256===null){assert(!prior.some(p=>p.path===r.path));rows.push({path:r.path,bytes:r.candidateBytes,sha256:r.candidateSha256});}
 rows.sort((a,b)=>a.path.localeCompare(b.path));assert.equal(rows.length,config.afterInputs??5167);
 const guard=()=>{environment();for(const r of [...rows,...plan.preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);};
 guard();save('SOURCE_INPUTS_AFTER.json',rows);save('PRESERVED_SOURCE_AFTER.json',plan.preserved);
 for(const r of plan.paths.filter(r=>/\.(?:mjs|ts)$/.test(r.path))){const checked=spawnSync(process.execPath,['--check',...(r.path.endsWith('.ts')?['--experimental-strip-types']:[]),r.path],{cwd:site,encoding:'utf8',windowsHide:true});assert.equal(checked.status,0,checked.stderr);}
 const roots=config.roots??['tests/closed56-femoral-epoch.test.mjs','tests/closed56-live-preservation.test.mjs','tests/closed56-original-tests.test.mjs','tests/closed56-live-context-repair-contract.test.mjs','tests/closed56-whole-role-transition-20261021.test.mjs','tests/current-atlas-delivery.test.mjs','tests/head-index-tab-stop.test.mjs'];
 assert(roots.every(p=>/^tests\/[A-Za-z0-9_.-]+\.test\.(?:mjs|ts)$/.test(p)));
 const args=['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...roots];
 save('STARTED.json',{at:new Date().toISOString(),driver:process.pid,source:plan.source,review:plan.review,roots,args,controlledInputs:rows.length});
 console.log('Running '+roots.length+' actual native roots; outside-scope historical failures will be retained, not hidden.');
 const result=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,VM_ATLAS_SOURCE_REPO:atlas},windowsHide:true,encoding:'utf8',maxBuffer:64e6});
 const log=stage+'/native.tap';fs.writeFileSync(log,(result.stdout??'')+(result.stderr??''),{flag:'wx'});
 const counts={};for(const m of (result.stdout??'').matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))counts[m[1]]=Number(m[2]);
 const failures=[...(result.stdout??'').matchAll(/^not ok (\d+) - (.+)\r?$/gm)].map(m=>({number:Number(m[1]),title:m[2].trim()}));
 const receipt={at:new Date().toISOString(),args,code:result.status,signal:result.signal,error:result.error?.message??null,log,logSha256:sha(read(log)),counts,failures,rawLogLocalOnly:true};save('native.json',receipt);guard();
 assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);assert(counts.tests>=30);
 const application={at:new Date().toISOString(),source:plan.source,review:plan.review,canonicalSourceInstalled:true,ownerPreviewRestarted:false,ownerFormsRefreshed:false,changedPaths:plan.paths,controlledInputs:rows.length,preservedInputs:plan.preserved.length,namedInputs:rows.length+plan.preserved.length,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),preservedSnapshot:stage+'/PRESERVED_SOURCE_AFTER.json',native:receipt,sourceInputsUnchangedDuringRun:true,allOtherSourceInputsUnchanged:true,all1710ReviewBindingsUnchanged:true,currentAtlasValidatorAndFixtureUnchanged:true,currentAtlasValidatorTestAndFixtureUnchanged:!expected.includes('tests/current-atlas-delivery.test.mjs'),allProposedPathHashesExact:true,allOriginalAssertionsAndMutationGuardsRetained:true,fullSuitePassingClaim:false,clinicalApproval:false,publicDeployment:false};save('APPLICATION.json',application);
 console.log(JSON.stringify({application:stage+'/APPLICATION.json',code:result.status,counts,failures,sourceInputsUnchanged:true,previewUntouched:true}));
}
