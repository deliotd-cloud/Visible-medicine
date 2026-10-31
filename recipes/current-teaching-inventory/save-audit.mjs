import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';

const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-desktop-and-teaching-inventory';
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-saved-plan-status-verified';
const root='G:/VisibleMedicine-temp/staging/20261031-study-plan-release-ready';
const desktop='G:/VisibleMedicine-temp/staging/20261031-head-desktop-scroll';
const audit='G:/VisibleMedicine-temp/proposals/20261031-current-teaching-gap';
const quiz='G:/VisibleMedicine-temp/proposals/20261031-assessment-gap-audit';
const evidence='G:/VisibleMedicine-temp/proposals/20261031-pharyngeal-ct-evidence';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)});
const write=(p,data)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:typeof data==='string'?data:JSON.stringify(data,null,2)+'\n',{flag:'wx'});};
const source=json(root+'/SOURCE.json'),inventory=json(audit+'/result.json'),qa=json(desktop+'/RESULT.json');
function verify(){
  assert.equal(hash(prior+'/checkpoint.json'),'c867a10f2d695e5da27ec6f9c994b68657b4786f598e6d38da69b29e21657563');
  assert.equal(hash(root+'/SOURCE.json'),'aba4be7a7c7e479afb8ffd32fb4d182ad9223f321f404b92548c97e694d64436');
  for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,encoding:'utf8'}).trim(),inventory.head);
  assert.equal(execFileSync('git',['status','--porcelain'],{cwd:atlas,encoding:'utf8'}).trim(),'');
  assert.equal(hash(atlas+'/public/models/bodyparts3d/full-body/catalog.json'),inventory.catalogSha256);
  assert.equal(inventory.rootCount,1104);assert.equal(inventory.uniqueRootIds,1104);assert.equal(inventory.placements,9936);
  assert.deepEqual(inventory.totals,{draft:9487,pending:448,'generated-identification':1});
  assert.equal(inventory.rows.length,449);assert.equal(inventory.tabs.length,9);
  assert.equal(qa.passing,true);assert.equal(qa.checks.length,7);
  assert.equal(hash(qa.observation.path),qa.observation.sha256);
  for(const row of qa.sourceFiles)assert.equal(hash(site+'/'+row.path),row.sha256);
  assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
  assert.equal(json(root+'/RELEASE_QUEUE.json').terminal,true);
  assert.equal(json(root+'/PARTITION_RESULT-8.json').process.terminalObserved,true);
  assert.equal(json(root+'/PARTITION_RESULT-8.json').process.exitCode,1);
}
verify();assert(!fs.existsSync(cp));const at=new Date().toISOString();
write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
for(const name of ['probe.mjs','result.json','findings.md'])write(cp+'/teaching/'+name,read(audit+'/'+name));
for(const name of ['probe.mjs','probe-v2.mjs','residual.json','residual-v2.json','findings.md'])write(cp+'/quiz/'+name,read(quiz+'/'+name));
write(cp+'/research/PHARYNGEAL_CT_EVIDENCE.md',read(evidence+'/findings.md'));
write(cp+'/desktop/RESULT.json',read(desktop+'/RESULT.json'));
write(cp+'/desktop/verify.mjs',read(desktop+'/verify.mjs'));
write(cp+'/local-only/desktop-observations.json',read(qa.observation.path));
for(const name of ['SOURCE.json','RELEASE_QUEUE.json','PARTITION_RESULT-8.json','partition-8/PROCESS-TERMINAL.json','partition-8/CONFIGURATION.json','partition-8/runner.stderr.log'])write(cp+'/release/'+name,read(root+'/'+name));
const run=root+'/website/.local/website-test-runs/2026-10-31T04-17-27-671Z-55bc2b1b-12ba-487a-bfa6-9c6ce789a9bd';
for(const name of ['child.tap','receipt.json','manifest.json'])write(cp+'/local-only/release/'+name,read(run+'/'+name));
const tap=read(run+'/child.tap').toString();for(const expected of ['# tests 227','# pass 224','# fail 3','# skipped 0'])assert(tap.includes(expected));
const failures=[...tap.matchAll(/^not ok .+$/gm)].map(m=>m[0]);assert.equal(failures.length,3);
const proof={at,installedDesktop:{cases:7,passing:true,evidence:ref(cp+'/desktop/RESULT.json'),observations:ref(cp+'/local-only/desktop-observations.json'),scope:qa.scope},
  teaching:{source:inventory.head,rootCount:1104,placements:9936,totals:inventory.totals,byTab:inventory.byTab,evidence:ref(cp+'/teaching/result.json'),draftsAreNotApprovals:true,scope:'Body-display roots only. Nine topic placements per root; not unique authored lessons. Nested, shoulder and specimen catalogues excluded. Original acceptance scope and historical baselines retained.'},
  quiz:{placements:1104,drafts:1103,basicGenerated:1,evidence:ref(cp+'/quiz/residual-v2.json'),remainingIdentity:'FMA19728 remains held pending exact source adjudication.'},
  pharyngealCt:{evidence:ref(cp+'/research/PHARYNGEAL_CT_EVIDENCE.md'),placements:6,disposition:'Remain pending; bounded primary-source search does not establish separately visible ordinary CT boundaries. No source asset imported.'},
  release:{source:ref(cp+'/release/SOURCE.json'),partition:'8/32',pass:224,fail:3,skip:0,terminal:true,exitCode:1,failures,wholeSuitePassing:false,repairProposal:'G:/VisibleMedicine-temp/proposals/20261031-release-partition8-repair',repairAcceptancePending:true},
  productChanged:false,installedUpdate:false,clinicalApproval:false,publicDeployment:false,sourceScansOrMasksChanged:false};
write(cp+'/VERIFICATION.json',proof);

// Only public source, recipes and original research notes enter this backup.
// Actual scan/browser observations and release logs remain local-only.
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,p+'/');else selected.set(p,dir+'/'+e.name);}}
collect(prior+'/selected-source');
selected.set('recipes/current-teaching-inventory/probe.mjs',audit+'/probe.mjs');
selected.set('recipes/current-teaching-inventory/quiz-probe.mjs',quiz+'/probe-v2.mjs');
selected.set('recipes/current-teaching-inventory/verify-desktop.mjs',desktop+'/verify.mjs');
selected.set('recipes/current-teaching-inventory/save-audit.mjs',desktop+'/save-audit.mjs');
selected.set('docs/current-root-teaching-inventory.md',audit+'/findings.md');
selected.set('docs/current-root-quiz-scope.md',quiz+'/findings.md');
selected.set('docs/pharyngeal-ct-evidence.md',evidence+'/findings.md');
for(const [name,file] of selected)write(cp+'/selected-source/'+name,read(file));
const files=[...selected].map(([name,file])=>({path:name,sha256:hash(file),bytes:fs.statSync(file).size}));let sourceBackup;
try{
  backup({root:cp+'/source-only-backup',repo:desktop+'/source-only-backup.git',branch:'backup/teaching-inventory-20261031',files,bytesFor:name=>read(selected.get(name)),sourceIdentity:{source:ref(cp+'/release/SOURCE.json'),atlas:inventory.head},
    scope:'Selected authored source and original audit recipes/notes. No scans, masks, models, private observations, clinical decisions, release logs or canonical Git ancestry. Not a whole-project backup.',
    proof:{at,productChanged:false,installedDesktopChecks:7,bodyRootPlacements:9936,clinicalApproval:false,wholeSuitePassing:false},verifySource:verify});
  sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Preserve installed quick review. Actual installed CT/MRI desktop scroll, boundaries, crosshair and concept handoff pass7 checks. Current body roots have9487draft/448pending/1generated placements, not clinical approvals. Original71requirements/eightideas retained. Stock partition8 terminal224pass3fail; integrate exact historical source-role repairs from bounded worker, diagnose cervical replay crash and rerun whole affected roots. Partition7 and full saved-plan build remain required at admitted memory. Current frozen candidate aba4be7a unchanged/uninstalled; no background release queue remains live.';
const checkpoint={schema:'vm-desktop-teaching-audit-checkpoint/1',at,verification:ref(cp+'/VERIFICATION.json'),prior:ref(prior+'/checkpoint.json'),sourceBackup,next,goalActive:true,installedUpdate:false,wholeSuitePassing:false};
write(cp+'/checkpoint.json',checkpoint);const cpRef=ref(cp+'/checkpoint.json');
const cf=site+'/docs/completion-checklist.json',mf=site+'/docs/completion-checklist.md',c=json(cf),old=structuredClone(c);
assert.equal(c.revision,422);assert.equal(read(mf).toString(),renderChecklist(old));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
c.revision=423;c.updatedAt=at.slice(0,10);c.roots.currentteaching=cp;
for(const id of ['ASSESS-01','TEACH-01','TEACH-02','TEACH-03','TEACH-04','TEACH-06','IMG-01','UX-01','REL-01'])c.items.find(i=>i.id===id).evidence.push('currentteaching:checkpoint.json');
for(const id of ['ASSESS-01','TEACH-02','TEACH-03','TEACH-04','UX-01'])c.items.find(i=>i.id===id).status='partial';
c.changeLog.unshift({revision:423,date:c.updatedAt,change:'Current clean c32 body-root inventory:1104roots×9topics=9936placements;9487draft,448pending,1generated-identification. Drafts are not clinical approvals or unique lessons. Original scope/baselines retained; separate nested/shoulder/specimen catalogues excluded. Current CT35/MRI6/Xray219/US185pending; Function/Clinical/Pathology1each. Spine and hand root Xray are draft-covered, with quality/sign-off outstanding. Six longitudinal pharyngeal CT entries remain pending after limited primary-source evidence search. Actual installed1280×720 CT/MRI scroll,boundary,crosshair,skip-focus and semantic-handoff checks pass7 with private observations local only. Stock partition8 terminal224pass3fail/0skip; exact-source repairs pending. No product installation or clinical approval.'});
validateChecklist(c);assert.equal(c.items.length,71);assert.equal(c.items.filter(i=>i.scope==='optional').length,8);
assert.deepEqual(c.items.map(({id,acceptance,task,owner,scope,priority})=>({id,acceptance,task,owner,scope,priority})),old.items.map(({id,acceptance,task,owner,scope,priority})=>({id,acceptance,task,owner,scope,priority})));
fs.writeFileSync(cf,JSON.stringify(c,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(c));write(cp+'/CHECKLIST.json',read(cf));
const index=json('CURRENT_CHECKPOINT.json'),v=index.activeWork.current;
v.latestCheckpoint=cpRef;if(sourceBackup.verified)v.latestSourceOnlyBackup=sourceBackup;
v.latestTeachingInventory={checkpoint:cpRef,source:inventory.head,rootPlacements:9936,draft:9487,pending:448,generated:1,clinicalApproval:false};
v.latestInstalledHeadDesktop={checkpoint:cpRef,cases:7,viewport:[1280,720],onlyInstalledSource:true};
v.latestReleaseQueue={path:root+'/RELEASE_QUEUE.json',terminal:true,pass:224,fail:3,partition:8,source:ref(cp+'/release/SOURCE.json'),requiredPartition7Rerun:true,wholeSuitePassing:false};
v.activeExecutionSessions=[];
v.pendingPartition8Repair={proposal:'G:/VisibleMedicine-temp/proposals/20261031-release-partition8-repair',worker:'/root/release_partition8_repair_1031',acceptancePending:true,installed:false};
v.next=next;index.next=next;v.beforeFurtherWork=next;v.lastPriorityReassessment={at,priority:'Repair release failures; then current source-backed gaps and integrated desktop journeys. Historical gap counts are not the current inventory.',clinicalReviewIsNotProjectBlocker:true};
v.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index at original JSON paths with archive chain. Missing fields do not imply completion or authority.'};
for(const key of ['pendingPartition5Repair','pendingPartition6Repair','pendingNativeWebsiteNotice','latestBuildTrial']){if(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size-768)break;delete v[key];}
saveIndex(index);
const intro='## Current: desktop journeys checked; teaching gaps refreshed — 31 October 2026\n\nActual installed CT/MRI desktop checks pass7. Current body-root topics:9487draft/448pending/1generated; drafts await clinical review. Original71requirements/eightideas preserved. Stock partition8 stopped224pass3fail; exact-source repair underway. Installed quick review unchanged.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Current candidate remains '+root+'. Checklist423. Release queue33363 terminal; see CURRENT_CHECKPOINT for pending work.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);
const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=site+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify previous bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:423,index:ref('CURRENT_CHECKPOINT.json'),goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:423,selectedFiles:files.length,installedUpdate:false}));
