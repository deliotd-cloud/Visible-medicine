// Tracking draft only: authenticate the existing installation without touching it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-checklist-installed-reconciliation';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const proposal='F:/VisibleMedicine/staging/20261022-checklist-runtime-schema-proposal';
const installation='F:/VisibleMedicine/recovery/local-cutover/20261021-colic-ultrasound/INSTALLATION.json';
const snapshot='F:/VisibleMedicine/recovery/local-cutover/20261021-colic-ultrasound/SOURCE_INPUTS_AFTER.json';
const checkpoint='F:/VisibleMedicine/recovery/checkpoints/20261021-colic-ultrasound-installed/checkpoint.json';
const source='F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/SOURCE_V2.json';
const commit='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree='e9165d7122361f809a267af1414b337b69097fe2';
const binding='ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59';
const pinned=[
 [installation,'91b5d24a1da449787319c0d282816816d1e89a1fb2b493fe5924494bb2cdadf9'],
 [snapshot,'693de4623b0bbaf4c8c41d5e97ad77dc9b214a0210d16b45fc50035c28e9c5f7'],
 [checkpoint,'b203032226df4b8641efd44f397773bdadd15c2041ac9e6018ca97914a4cf15a'],
 [source,'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d'],
 [proposal+'/refresh-completion-checklist.v2.mjs','4a324befd2eb0acba8b3212f80bf7bb7777d1c57948e4d2d96e353de9cf58007'],
 [proposal+'/refresh-completion-checklist.preimage.mjs','8a8d09097784389a15e514db3835345591cb29e7a1dbd6036fe491bf6a261a69'],
 [proposal+'/runtime-schema.v2.test.mjs','a21a2f7c5460f3e19661f6f9ecd0da095616ba1a71c7b3e5dcb4ca0daefee7a7'],
];
for(const[p,h]of pinned)assert.equal(sha(read(p)),h,p);
const canonicalPaths=['docs/completion-checklist.json','docs/completion-checklist.md','scripts/refresh-completion-checklist.mjs',
 'atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json',
 ...['head-neck','shoulder','lower-limb','female-pelvis'].map(n=>'public/atlas-runtime/'+n+'/manifest.json')];
const before=canonicalPaths.map(p=>({path:p,sha256:sha(read(site+'/'+p))}));
const listener=()=>JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
 'Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress,OwningProcess | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
const initialListener=listener();assert.deepEqual(initialListener,{LocalAddress:'127.0.0.1',OwningProcess:297128});
const verifyCanonical=()=>{
 for(const row of before)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),commit);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),tree);
 assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.deepEqual(listener(),initialListener);
};
verifyCanonical();
const installed=json(installation),history=json(checkpoint),rows=json(snapshot),candidate=json(source);
assert.equal(installed.source,commit);assert.equal(installed.tree,tree);assert.equal(installed.review,binding);
assert.equal(installed.publicDeployment,false);assert.equal(installed.clinicalApproval,false);
assert(installed.commands.every(row=>row.code===0));assert.equal(installed.sourceSnapshotSha256,sha(read(snapshot)));
assert.equal(history.atlas.head,commit);assert.equal(history.atlas.tree,tree);assert.equal(history.review.sha256,binding);
assert.deepEqual([history.teaching.placements,history.teaching.draft,history.teaching.pending,history.teaching.generated],[9936,9377,528,31]);
assert.equal(candidate.canonicalInstalled,false);assert.equal(candidate.ownerPreviewChanged,false);
const review=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json');
assert.equal(review.revision,commit);assert.equal(review.files.length,1558);assert.equal(inputs.inputs.length,1721);
assert.equal(inputs.sha256,binding);assert.equal(sha(Buffer.from(JSON.stringify(inputs.inputs))),binding);
const saved=new Map(rows.map(r=>[r.path,r]));assert.equal(saved.size,history.source.controlled);assert.equal(saved.size,5730);
const runtimeSources=Object.fromEntries(['head-neck','shoulder','lower-limb','female-pelvis'].map(n=>[n,json(site+'/public/atlas-runtime/'+n+'/manifest.json').sourceCommit]));
for(const row of inputs.inputs){
 assert(!path.isAbsolute(row.path)&&!row.path.includes('\\')&&row.path.split('/').every(p=>p&&p!=='.'&&p!=='..'));
 assert(!/(^|\/)(?:private|\.local|scans|datasets)(?:\/|$)|\.env|\.(?:db|sqlite|dcm|nii)$/i.test(row.path));
 assert.equal(row.sha256,saved.get(row.path)?.sha256,'Exact installed snapshot member: '+row.path);
 assert.equal(sha(read(site+'/'+row.path)),row.sha256,'Current bound source: '+row.path);
}
for(const p of canonicalPaths.slice(3))assert.equal(sha(read(site+'/'+p)),saved.get(p)?.sha256,'Installed manifest: '+p);
assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(root+'/preimages');fs.mkdirSync(root+'/docs');fs.mkdirSync(root+'/scripts');
for(const p of canonicalPaths.slice(0,3))fs.copyFileSync(site+'/'+p,root+'/preimages/'+path.basename(p),fs.constants.COPYFILE_EXCL);
for(const p of ['refresh-completion-checklist.v2.mjs','refresh-completion-checklist.preimage.mjs','runtime-schema.v2.test.mjs'])
 fs.copyFileSync(proposal+'/'+p,root+'/scripts/'+p,fs.constants.COPYFILE_EXCL);
const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
// This attests an already applied import. It does not perform or invent a new import.
const evidence={at:new Date().toISOString(),kind:'read-only-existing-local-import-verification',applied:true,
 sourceAtlas:commit,tree,review:binding,publicDeployment:false,clinicalApproval:false,spatialRegistration:false,
 installation:{path:installation,sha256:sha(read(installation))},snapshot:{path:snapshot,sha256:sha(read(snapshot))},
 teachingCheckpoint:{path:checkpoint,sha256:sha(read(checkpoint))},boundInputsVerified:1721,importedSources:1558,
 runtimeSources,operation:'No installation, restart, refresh, clinical decision or publication; existing source bytes only.',
 canonicalInputs:before};
write(root+'/ATLAS_IMPORT_EVIDENCE.json',evidence);
const original=json(site+'/docs/completion-checklist.json'),draft=structuredClone(original);
assert.equal(original.revision,127);assert.equal(original.items.length,71);assert.equal(original.items.filter(r=>r.scope==='optional').length,8);
draft.revision=128;draft.updatedAt='2026-10-22';draft.roots.installedreconciliation=root;
draft.importedAtlasSource={commit,tree,reviewIntegration:binding,reviewSourceFiles:1558,
 rootDraftPlacements:9377,rootPendingPlacements:528,rootGeneratedIdentificationPlacements:31,
 evidence:'installedreconciliation:ATLAS_IMPORT_EVIDENCE.json',evidenceSha256:sha(read(root+'/ATLAS_IMPORT_EVIDENCE.json')),runtimeSources};
draft.pendingAtlasSource={commit,tree,rootDraftPlacements:9377,rootPendingPlacements:528,rootGeneratedIdentificationPlacements:31,
 websiteImported:true,evidence:checkpoint,
 note:'This is the installed colic-ultrasound source, not the newer staged website. Its 9,936 overlapping placements include 9,377 editorial drafts, 528 pending and 31 generated prompts; these are not unique lessons or clinical approvals. The head-neck runtime is pinned to this source; shoulder, lower-limb and female-pelvis retain their independent 190a632 source. Separately, the unpublished 6,375-path practice-exit candidate uses Atlas '+candidate.atlasHead+' / Review '+candidate.review+' at '+source+'. It has not been installed into the normal preview. This tracking draft changes no requirement status, baseline, approval, anatomy or owner tab.'};
draft.changeLog.unshift({date:draft.updatedAt,revision:draft.revision,change:'Tracking draft only: reconcile the installed 6d7a356/ae8413 source against the authentic installation receipt, source snapshot, all 1,721 live bound inputs and four separately pinned learner families. Preserve the historical audit baseline, all 71 complete item records, eight optional ideas, rules and statuses. The newer practice-exit candidate remains explicitly uninstalled. No canonical checklist/generator, preview, private decisions, clinical approval or public deployment changes.'});
const {validateChecklist,verifyImportedAtlasEvidence,renderChecklist,evidencePath}=await import(pathToFileURL(root+'/scripts/refresh-completion-checklist.v2.mjs'));
validateChecklist(draft);verifyImportedAtlasEvidence(draft,site);
for(const item of draft.items)for(const ref of item.evidence)assert(fs.statSync(evidencePath(draft,ref)).isFile(),'Missing item evidence '+ref);
assert.deepEqual(draft.items,original.items);assert.deepEqual(draft.baseline,original.baseline);
assert.deepEqual(draft.rules,original.rules);assert.deepEqual(draft.statusDefinitions,original.statusDefinitions);
const inverse=structuredClone(draft);for(const key of ['revision','updatedAt','roots','importedAtlasSource','pendingAtlasSource','changeLog'])inverse[key]=original[key];
assert.deepEqual(inverse,original,'Only six declared tracking seams change');
write(root+'/docs/completion-checklist.json',draft);
fs.writeFileSync(root+'/docs/completion-checklist.md',renderChecklist(draft),{flag:'wx'});
assert.equal(read(root+'/docs/completion-checklist.md').toString(),renderChecklist(json(root+'/docs/completion-checklist.json')));
assert(read(root+'/docs/completion-checklist.md').toString().includes('not been installed into the normal preview'));
const mutations=[];
const refused=(name,edit)=>{const d=structuredClone(draft);edit(d);assert.throws(()=>verifyImportedAtlasEvidence(d,site));mutations.push(name);};
refused('uninstalled candidate masquerading as installed',d=>{d.importedAtlasSource.commit=candidate.atlasHead;d.importedAtlasSource.runtimeSources['head-neck']=candidate.atlasHead;});
refused('changed evidence hash',d=>{d.importedAtlasSource.evidenceSha256='0'.repeat(64);});
refused('collapsed independent runtime family',d=>{d.importedAtlasSource.runtimeSources.shoulder=commit;});
refused('unverified Review revision',d=>{d.importedAtlasSource.reviewIntegration=candidate.review;});
refused('changed total scope',d=>{d.importedAtlasSource.rootDraftPlacements++;});
verifyCanonical();for(const[p,h]of pinned)assert.equal(sha(read(p)),h,p);
write(root+'/RESULT.json',{at:new Date().toISOString(),verdict:'pass',draftRevision:128,items:71,optional:8,
 authenticatedInstallation:true,currentBoundInputHashesVerified:1721,controlledSnapshotEntries:5730,preservedEntriesNotReverified:7,realInstalledEvidenceAccepted:true,
 runtimeSources,installedAtlas:commit,installedReview:binding,counts:{draft:9377,pending:528,generated:31},
 syntheticMutationRefusals:mutations,baselineAndFullItemRecordsUnchanged:true,statusesChanged:false,
 files:['docs/completion-checklist.json','docs/completion-checklist.md','scripts/refresh-completion-checklist.v2.mjs','ATLAS_IMPORT_EVIDENCE.json'].map(p=>({path:p,sha256:sha(read(root+'/'+p))})),
 canonicalChecklistChanged:false,canonicalGeneratorChanged:false,ownerPreviewChanged:false,privateDecisionsRead:false,
 candidateInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 initialPreflightDiagnostic:{code:1,assertion:'5730 !== 5737',cause:'The authenticated source snapshot lists 5,730 controlled entries; seven preserved entries are counted separately. Refused before stage creation or canonical mutation. Corrected to the authenticated controlled count, without reading private preserved state.'},
 limitation:'Standalone reconciled tracking draft and producer only. Not installed, a completion percentage, full-suite/browser acceptance or clinical sign-off.'});
console.log(JSON.stringify({receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json')),draftRevision:128,realInstalledEvidenceAccepted:true,liveBoundInputs:1721,mutationRefusals:mutations.length,ownerPreviewChanged:false}));
