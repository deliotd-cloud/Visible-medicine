import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup,read} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-prostate-keyboard',repairs='G:/VisibleMedicine-temp/proposals/20261031-release26-repairs';
const root='G:/VisibleMedicine-temp/staging/20261031-release26',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-keyboard-and-release26',canonical='F:/VisibleMedicine/website';
const ref=p=>({path:p,sha256:hash(p)});
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const b=Buffer.isBuffer(v)?v:Buffer.from(JSON.stringify(v,null,2)+'\n');if(fs.existsSync(p)){assert.deepEqual(read(p),b,p);return;}fs.writeFileSync(p,b,{flag:'wx'});};
const copy=(from,to)=>{write(to,read(from));assert.equal(hash(to),hash(from));};
const resultFile=process.env.VM_RELEASE26_RESULT||root+'/PARTITION26_CT_CLOSURE.json',sourceFile=process.env.VM_RELEASE26_SOURCE||root+'/SOURCE7.json';
const result=json(resultFile),source=json(sourceFile);assert(result.result.passing);assert(json(proposal+'/CHECKS.json').allPassed);
for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
const originalPin=json(proposal+'/BASELINE.json');for(const row of originalPin)assert.equal(hash('F:/VisibleMedicine/atlas/'+row.path),row.sha256,row.path);
for(const row of originalPin)copy(proposal+'/atlas/'+row.path,cp+'/candidate/atlas/'+row.path);
copy('F:/VisibleMedicine/atlas/scripts/test-prostate-zones.mjs',cp+'/candidate/atlas/scripts/test-prostate-zones.mjs');
for(const p of ['BASELINE.json','CHECKS.json','GUARDED_CHECK.json','types.log','keyboard-and-zones.log','preview-build.json','browser-cutaway.png','browser-accessibility.txt','check.mjs','run-check.mjs','build-preview.mjs','save.mjs','finalize.mjs'])copy(proposal+'/'+p,cp+'/keyboard/'+p);
write(cp+'/keyboard/BROWSER_ACCEPTANCE.json',{scope:'Isolated actual prostate component, desktop in-app browser, no patient data',url:'http://127.0.0.1:52271/',tabClosed:true,serverStopped:true,checks:['Canvas appears as named focusable group; parent group preserves it in the accessibility tree','Axial preset displays A/R/L/P markers after settling','Right arrow rotates and removes markers and preset pressed state','Equal and minus change model scale; Shift+Down supports fine rotation','Tab from Reset reaches model; Tab from model reaches Anterior without trapping focus','Manual keyboard input interrupts a preset sweep; preset pressed state stays cleared after settling','Peripheral-zone selection remains unchanged during camera-only input','3D cutaway preset restores its settled state'],screenReaderAcceptance:false,installed:false,clinicalApproval:false});
for(const p of ['SOURCE5.json','SOURCE6.json','PARTITION26_FOCUSED.json','PARTITION26_CORRECTIONS.json'])copy(root+'/'+p,cp+'/release/'+p);
copy(sourceFile,cp+'/release/FINAL_SOURCE.json');copy(resultFile,cp+'/release/FINAL_RESULT.json');
copy(root+'/verification-twentysix/STATE.json',cp+'/release/partition26-state.json');
const repairPin=json(repairs+'/BASELINE.json');copy(repairPin.tap.path,cp+'/release/partition26.tap');
for(const n of ['focused-4','focused-5','focused-6'])for(const p of ['runner.stdout.log','runner.stderr.log','PROCESS-TERMINAL.json'])copy(root+'/'+n+'/'+p,cp+'/release/'+n+'/'+p);
copy(repairs+'/BASELINE.json',cp+'/release/BASELINE.json');copy(repairs+'/HANDOFF.json',cp+'/release/HANDOFF.json');
for(const p of ['versions/v1/tests/atlas-nested-ct-orientation.test.ts','versions/v1/tests/clinical-review-regional-tour.test.ts','versions/v2/tests/atlas-nested-ct-orientation.test.ts'])copy(repairs+'/'+p,cp+'/release/'+p);
for(const row of repairPin.files){
 assert.equal(hash(canonical+'/'+row.path),row.originalSha256,row.path);
 assert.equal(hash(source.website+'/'+row.path),row.proposalSha256,row.path);
 copy(canonical+'/'+row.path,cp+'/before/website/'+row.path);
 copy(source.website+'/'+row.path,cp+'/source/website/'+row.path);
}
// Only verified test repairs are installed. The keyboard product change stays staged.
for(const row of repairPin.files){fs.copyFileSync(source.website+'/'+row.path,canonical+'/'+row.path);assert.equal(hash(canonical+'/'+row.path),row.proposalSha256);}
const binding=json(canonical+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,source.review);for(const row of binding.inputs)assert.equal(hash(canonical+'/'+row.path),row.sha256);
write(cp+'/TEST_INSTALLATION.json',{tests:repairPin.files.map(r=>({path:r.path,before:r.originalSha256,after:r.proposalSha256})),productSourceUnchanged:true,protectedInputs:binding.inputs.length,previewRestarted:false,ownerTabsRefreshed:false});
const selected=new Map();
for(const row of originalPin)selected.set('atlas-candidate/'+row.path,cp+'/candidate/atlas/'+row.path);
selected.set('atlas-candidate/scripts/test-prostate-zones.mjs',cp+'/candidate/atlas/scripts/test-prostate-zones.mjs');
for(const row of repairPin.files)selected.set('website/'+row.path,cp+'/source/website/'+row.path);
for(const [prefix,dir,names] of [['tools/keyboard',proposal,['check.mjs','run-check.mjs','build-preview.mjs','save.mjs','finalize.mjs']],['tools/release',repairs,['run-focused.mjs','run-corrections.mjs','run-ct-closure.mjs']]])for(const name of names)selected.set(prefix+'/'+name,dir+'/'+name);
const files=[...selected].map(([p,f])=>({path:p,sha256:hash(f),bytes:fs.statSync(f).size}));
const model=json(proposal+'/atlas/content/prostate-zones-revision.json').sha256;
const receipt=backup({root:proposal+'/source-backup',repo:proposal+'/source-backup.git',branch:'backup/prostate-keyboard-release26-20261031',files,bytesFor:p=>read(selected.get(p)),sourceIdentity:{installedAtlas:source.atlasHead,installedReview:source.review,prostateCandidate:model},scope:'Selected authored prostate candidate source and regression tests/recipes. Keyboard candidate is not installed. No scans, masks, private references, screenshots, databases, generated models, credentials or canonical Git ancestry. This is not a whole-project backup.',proof:{keyboardTests:29,focusedTypes:true,keyboardBrowserChecks:true,keyboardInstalled:false,release26Original:{tests:334,pass:327,fail:7},firstFocused:{tests:13,pass:11,fail:2},correctedFollowup:result.result,wholeSuitePassing:false},verifySource:()=>{for(const r of files)assert.equal(hash(selected.get(r.path)),r.sha256);}});
assert(receipt.sourceBackupVerified);copy(proposal+'/source-backup/github-backup.json',cp+'/github-backup.json');
write(cp+'/checkpoint.json',{schema:'vm-prostate-keyboard-release26/1',at:new Date().toISOString(),installedAtlas:source.atlasHead,installedReview:source.review,keyboard:{revision:model,candidate:cp+'/candidate/atlas',baseline:ref(cp+'/keyboard/BASELINE.json'),checks:ref(cp+'/keyboard/CHECKS.json'),browser:ref(cp+'/keyboard/BROWSER_ACCEPTANCE.json'),installed:false,geometryChanged:false,next:'Build and export the native regional Atlas from the candidate, then import it through the website pipeline; never hand-edit generated runtime copies.'},release:{source:ref(cp+'/release/FINAL_SOURCE.json'),partition:26,original:ref(cp+'/release/partition26-state.json'),originalCounts:{tests:334,pass:327,fail:7},firstFocused:ref(cp+'/release/PARTITION26_FOCUSED.json'),earlierFollowup:ref(cp+'/release/PARTITION26_CORRECTIONS.json'),correctedFollowup:ref(cp+'/release/FINAL_RESULT.json'),testsInstalled:ref(cp+'/TEST_INSTALLATION.json'),wholeSuitePassing:false,next:'Continue partition27 against a newly sealed successor, preserving original26 and both focused receipts.'},sourceBackup:ref(cp+'/github-backup.json'),mriCaseConfirmed:false,clinicalApproval:false,patientSpaceRegistration:false,publicDeployment:false,full71RequirementsAndEightIdeasPreserved:true});
console.log(JSON.stringify({checkpoint:ref(cp+'/checkpoint.json'),sourceFilesBackedUp:files.length,keyboardCandidateInstalled:false,testRepairsInstalled:4}));
