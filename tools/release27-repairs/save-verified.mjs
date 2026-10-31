import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='G:/VisibleMedicine-temp/staging/20261031-release27-repaired-v3';
const previous='G:/VisibleMedicine-temp/staging/20261031-release27-repaired-v2';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release27-repairs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const source=json(stage+'/SOURCE.json');
const ref=p=>({path:p,sha256:hash(p)});
const write=(p,bytes)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes,{flag:'wx'});};
const record=(p,o)=>write(p,JSON.stringify(o,null,2)+'\n');
const copy=(a,b)=>{write(b,fs.readFileSync(a));assert.equal(hash(a),hash(b));};
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true}).trim();
assert(!fs.existsSync(cp),'New checkpoint required');
assert.equal(source.testsOnly,true);assert.equal(source.currentChanges.length,10);
assert.equal(git(atlas,'rev-parse','HEAD'),source.atlasHead);
assert.equal(git(atlas,'status','--porcelain'),'');
const results={};
for(const name of ['focusedretry']){
 const p=stage+'/'+name+'-RESULT.json',r=json(p);
 assert.equal(r.source.sha256,hash(stage+'/SOURCE.json'));
 assert.equal(r.passing,true);assert.equal(r.sourceDrift,false);
 assert.equal(r.process.exitCode,0);assert.equal(r.process.terminalObserved,true);assert.equal(r.process.interrupted,false);
 results[name]=ref(p);
}
for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
const documentation=new Set(['docs/master-plan.md','docs/completion-checklist.json','docs/completion-checklist.md']);
for(const row of source.sourceRows){
 if(documentation.has(row.path))continue;
 const change=source.changes.find(c=>c.path===row.path);
 assert.equal(hash(site+'/'+row.path),change?.before??row.sha256,'Installed source changed: '+row.path);
}
const productBefore=source.sourceRows.filter(r=>!documentation.has(r.path)&&!source.currentChanges.includes(r.path)).map(r=>({path:r.path,sha256:hash(site+'/'+r.path)}));
copy('CURRENT_CHECKPOINT.json',cp+'/INDEX_BEFORE.json');
copy(site+'/docs/master-plan.md',cp+'/MASTER_PLAN_BEFORE.md');
copy('WORKSPACE_MAP.md',cp+'/WORKSPACE_MAP_BEFORE.md');
copy(stage+'/SOURCE.json',cp+'/SOURCE.json');
copy(stage+'/PREPARATION.json',cp+'/PREPARATION.json');
for(const c of source.changes){copy(site+'/'+c.path,cp+'/before/website/'+c.path);copy(source.website+'/'+c.path,cp+'/source/website/'+c.path);}
for(const name of ['focusedretry']){
 copy(stage+'/'+name+'-RESULT.json',cp+'/'+name+'-RESULT.json');
 for(const file of ['PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log','PREPARATION.json'])copy(stage+'/checks/'+name+'/'+file,cp+'/checks/'+name+'/'+file);
}
copy(previous+'/partition27-RESULT.json',cp+'/preflight-failure-RESULT.json');
copy(previous+'/checks/partition27/runner.stderr.log',cp+'/preflight-failure.stderr.log');
copy(previous+'/HISTORY_CONTEXT.json',cp+'/HISTORY_CONTEXT.json');
copy(previous+'/partition27retry-RESULT.json',cp+'/PARTITION27_BEFORE_FINAL_REPAIRS.json');
copy(previous+'/checks/partition27retry/runner.stdout.log',cp+'/PARTITION27_BEFORE_FINAL_REPAIRS.stdout.log');
copy(previous+'/focused-RESULT.json',cp+'/earlier-focused-RESULT.json');
copy(previous+'/checks/focused/runner.stdout.log',cp+'/earlier-focused.stdout.log');
copy(stage+'/focused-RESULT.json',cp+'/missing-admission-environment-RESULT.json');
copy(stage+'/checks/focused/runner.stdout.log',cp+'/missing-admission-environment.stdout.log');
const original='G:/VisibleMedicine-temp/staging/20261031-release27-repaired';
copy(original+'/focused-RESULT.json',cp+'/original-focused-RESULT.json');
copy(original+'/checks/focused/runner.stdout.log',cp+'/original-focused.stdout.log');
const recipes='G:/VisibleMedicine-temp/proposals/20261031-release27-main';
for(const file of ['prepare-repairs.mjs','prepare-stage.mjs','prepare-v2.mjs','prepare-v3.mjs','prepare-history-index.mjs','run-v2.mjs','run-v3.mjs','save-verified.mjs'])copy(recipes+'/'+file,cp+'/recipes/'+file);
copy(recipes+'/prostate-mri-next.json',cp+'/prostate-mri-next.json');
copy(recipes+'/PRIVATE_MRI_LOOKUP.json',cp+'/PRIVATE_MRI_LOOKUP.json');
record(cp+'/INSTALL_PLAN.json',{at:new Date().toISOString(),testsOnly:true,operations:source.changes.map(c=>({path:c.path,before:c.before,after:c.after})),previewRestartRequired:false,productInputs:productBefore.length});
for(const c of source.changes){assert.equal(hash(site+'/'+c.path),c.before);fs.copyFileSync(source.website+'/'+c.path,site+'/'+c.path);assert.equal(hash(site+'/'+c.path),c.after);}
for(const row of productBefore)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
record(cp+'/INSTALLED.json',{at:new Date().toISOString(),testsOnly:true,changed:source.currentChanges,productInputsUnchanged:productBefore.length,source:ref(cp+'/SOURCE.json'),previewRestarted:false,ownerTabsRefreshed:false,privateDataWrites:false});
const summary='Ten release-test repairs are integrated locally. Historical teaching checks now use authenticated original revisions, with separate current-Atlas checks and strict reversible assertion preservation. Partition27 returned244pass/2test-context failures; both residual failures were repaired and focused rechecks passed without source drift. The full partition was not rerun after those final repairs, so no whole-partition or whole-suite pass is claimed. Product code, installed prostate model, private reviews and the running preview were unchanged. The prostate MRI source folder is located but exact scan selection is pending; the existing Didanix Education bridge integration is mapped for the next step.';
record(cp+'/checkpoint.json',{at:new Date().toISOString(),atlasHead:source.atlasHead,review:source.review,source:ref(cp+'/SOURCE.json'),installed:ref(cp+'/INSTALLED.json'),checks:results,earlierFocused:ref(cp+'/earlier-focused-RESULT.json'),earlierPartition:ref(cp+'/PARTITION27_BEFORE_FINAL_REPAIRS.json'),earlierPartitionCounts:{tests:246,pass:244,fail:2,cancelled:0,skipped:0},fullPartitionRerun:false,originalFailurePreserved:ref(cp+'/original-focused-RESULT.json'),prostateNext:ref(cp+'/prostate-mri-next.json'),summary,wholeSuitePassing:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,full71AndEightIdeasPreserved:true});
const heading='## Current: focused release repairs saved — 31 October 2026\n\n'+summary+'\n\nCheckpoint: '+cp+'/checkpoint.json\n\n';
fs.writeFileSync(site+'/docs/master-plan.md',heading+fs.readFileSync(site+'/docs/master-plan.md','utf8'));
const mapOld=fs.readFileSync('WORKSPACE_MAP.md'),mapText=Buffer.from(heading+'Canonical Atlas and website remain separate. Installed prostate delivery remains checkpoint471. CURRENT_CHECKPOINT.json is the current index.\n');
assert(mapText.length<=mapOld.length);fs.writeFileSync('WORKSPACE_MAP.md',Buffer.concat([mapText,Buffer.alloc(mapOld.length-mapText.length,32)]));
const index=json('CURRENT_CHECKPOINT.json'),c=index.activeWork.current;
c.currentReleaseQueue.repairedCandidate={state:'ten-test-repairs-integrated-focused-checks-passed',checkpoint:ref(cp+'/checkpoint.json'),changedTests:10,installedTestsOnly:true,fullPartitionRerun:false,wholeSuitePassing:false};
c.latestCoordination=ref(cp+'/checkpoint.json');c.activeExecutionSessions=[];
c.pendingProstateZonalDraft={...c.pendingProstateZonalDraft,nextBridgePlan:ref(cp+'/prostate-mri-next.json'),mriLookup:{...ref(cp+'/PRIVATE_MRI_LOOKUP.json'),localOnly:true,uploadAllowed:false}};
c.next='Continue full website/Atlas roadmap. Focused release repairs verified; broader release testing remains open. Next independent prostate task: connect zone-selection events to the existing revision-bound Didanix Education bridge. Exact MRI source selection and clinical review remain pending; no spatial registration claimed.';
c.lastPriorityReassessment={at:new Date().toISOString(),priority:c.next};index.activeWork.lastUpdated=new Date().toISOString();saveIndex(index);
record(cp+'/SAVED.json',{at:new Date().toISOString(),checkpoint:ref(cp+'/checkpoint.json'),index:ref('CURRENT_CHECKPOINT.json'),goalPreserved:true});
console.log(JSON.stringify({checkpoint:ref(cp+'/checkpoint.json'),changedTests:10,productUnchanged:true,wholeSuitePassing:false}));
