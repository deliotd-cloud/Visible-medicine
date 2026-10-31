import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',source=json(root+'/SOURCE.json');
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition9-focused';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-neonatal-lobar-atlas-verified';
const canonical='F:/VisibleMedicine/website',workerRoot='G:/VisibleMedicine-temp/proposals/20261031-neonatal-lobar-history-impl';
const queueRoot='G:/VisibleMedicine-temp/staging/20261031-release-partition9-title-ready';
const ref=p=>({path:p,sha256:hash(p)}),read=p=>fs.readFileSync(p);
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const verify=()=>{
 assert.equal(hash(root+'/SOURCE.json'),'033254f1c84c902e4af28169119e5355b27f239d6f2260dfc87676475e633bc7');
 for(const row of source.sourceRows)assert.equal(hash(source.site+'/'+row.path),row.sha256,row.path);
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
};
verify();assert(json(root+'/REMAINING.json').passed);assert(json(root+'/REVIEW_IMPACT.json').passed);
const worker=json(workerRoot+'/RESULT.json');for(const command of Object.values(worker.commands))assert.equal(command.exitCode,0);
const commit=json(root+'/COMMIT.json');assert.equal(commit.head,'2c80143a1c7332173dd83a92a637b3ef9a729098');
const queue=json(queueRoot+'/RELEASE_QUEUE.json');assert(queue.terminal&&queue.completed.length===2);
assert(queue.completed[0].index===9&&queue.completed[0].passing&&queue.completed[1].index===10&&!queue.completed[1].passing);
const cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md';
const checklist=json(cf),old=structuredClone(checklist);assert.equal(checklist.revision,428);assert.equal(read(mf).toString(),renderChecklist(old));
const at=new Date().toISOString();assert(!fs.existsSync(cp));write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['BASELINE.json','SOURCE.json','COMMIT.json','VALIDATION.json','VALIDATION-TSX.json','REMAINING.json','REVIEW_IMPACT.json','RELEASE_FAILURES.json'])write(cp+'/'+p,read(root+'/'+p));
for(const p of fs.readdirSync(root).filter(p=>/^(CHECK-|REMAINING-).*\.(log|json)$/.test(p)))write(cp+'/checks/'+p,read(root+'/'+p));
for(const p of ['HANDOFF.md','RESULT.json','VALIDATE-LOBAR.log','VALIDATE-NESTED.log','TEST-INVERSE.log'])write(cp+'/worker/'+p,read(workerRoot+'/'+p));
write(cp+'/REVIEW_FINGERPRINT_AUDIT.md',read('G:/VisibleMedicine-temp/proposals/20261031-review-fingerprint-audit/AUDIT.md'));
write(cp+'/QUEUE_TERMINAL.json',read(queueRoot+'/RELEASE_QUEUE.json'));
for(const n of [9,10]){
 write(cp+'/release/'+n+'/RESULT.json',read(queueRoot+'/PARTITION_RESULT-'+n+'.json'));
 for(const p of ['runner.stdout.log','runner.stderr.log','PROCESS-TERMINAL.json'])write(cp+'/release/'+n+'/'+p,read(queueRoot+'/partition-'+n+'/'+p));
 const result=JSON.parse(read(queueRoot+'/partition-'+n+'/runner.stdout.log').toString().trim());
 for(const p of ['receipt.json','child.tap','child.log'])write(cp+'/release/'+n+'/'+p,read(result.output+'/'+p));
}
const selected=new Map();
function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');
for(const row of source.changes.filter(r=>!r.path.startsWith('docs/')))selected.set('atlas/'+row.path,source.site+'/'+row.path);
for(const p of ['prepare.mjs','prepare-tsx-validation.mjs','validate.mjs','validate-tsx.mjs','remaining-checks.mjs','review-impact.mjs','freeze.mjs','commit.mjs','inspect-partition-ten.mjs','save.mjs'])selected.set('recipes/neonatal-lobar-atlas/'+p,root+'/'+p);
selected.set('plans/review-fingerprint-audit.md',cp+'/REVIEW_FINGERPRINT_AUDIT.md');
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{
 backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/neonatal-lobar-atlas-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE.json'),commit:ref(cp+'/COMMIT.json')},scope:'Selected source, recipes and read-only audit only. No model assets, scans, masks, private observations, clinical decisions, raw test logs or canonical ancestry. Independent fetch/tree/byte and restore verification.',proof:{at,focusedAtlasChecksPassed:true,installed:false,wholeSuitePassing:false},verifySource:verify});
 sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Keep installed quick review unchanged. Isolated Atlas2c80143a adds4source-backed neonatal US drafts; generators,10,448nested assertions, lobar/history/review/hippocampal checks pass;968other lessons and allmesh/source identities unchanged. Conservative renderer seal still changes108nested geometry-review revisions; no approvals migrated. Website0d queue terminal:9passes445,10has230pass11fail across9roots; inspect exact epoch/environment failures before successor. Full release suite/build open. Read-only partition-ten diagnosis active. Preserve full71requirements/eightideas and separate repositories; no installation or clinical approval.';
write(cp+'/checkpoint.json',{schema:'vm-neonatal-lobar-atlas-checkpoint/1',at,source:ref(cp+'/SOURCE.json'),commit:ref(cp+'/COMMIT.json'),worker:ref(cp+'/worker/RESULT.json'),remaining:ref(cp+'/REMAINING.json'),reviewImpact:ref(cp+'/REVIEW_IMPACT.json'),reviewAudit:ref(cp+'/REVIEW_FINGERPRINT_AUDIT.md'),releaseQueue:ref(cp+'/QUEUE_TERMINAL.json'),releaseFailures:ref(cp+'/RELEASE_FAILURES.json'),sourceBackup,prior:ref(prior+'/checkpoint.json'),next,canonicalIntegrated:false,websiteImported:false,installed:false,clinicalApproval:false,wholeSuitePassing:false});
const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=429;checklist.updatedAt=at.slice(0,10);checklist.roots.neonatallobarready=cp;
for(const id of ['TEACH-01','TEACH-07','REL-01'])checklist.items.find(x=>x.id===id).evidence.push('neonatallobarready:checkpoint.json');
checklist.changeLog.unshift({revision:429,date:checklist.updatedAt,change:'Isolated Atlas2c80143a stages4neonatal ultrasound draft placements with source-backed citations;968other topics unchanged. Focused stock validators/generation pass, including10,448nested checks and108Review contexts. Global renderer still invalidates geometry review broadly; audit saved without approval migration. Website0d partition9passes445;10stops230pass11fail. Full suite/build/import remain open. Installed quick review unchanged; original71requirements/eightideas preserved.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.pendingNeonatalLobarDraft={checkpoint:cpRef,stage:source.site,head:commit.head,tree:commit.tree,source:ref(cp+'/SOURCE.json'),changedPlacements:4,unchangedPlacements:968,focusedPassed:true,canonicalIntegrated:false,websiteImported:false,installed:false};
current.pendingPartition9Repair.stockRerunPending=false;current.pendingPartition9Repair.stockPasses=445;
current.currentReleaseQueue={terminal:true,sessionId:19802,source:queue.source,completed:[{partition:9,pass:445,fail:0},{partition:10,pass:230,fail:11}],evidence:ref(cp+'/QUEUE_TERMINAL.json'),failureInventory:ref(cp+'/RELEASE_FAILURES.json'),wholeSuitePassing:false};
current.activeExecutionSessions=[];current.reviewFingerprintAudit={checkpoint:cpRef,implementation:false,policyUnchanged:true};
current.activeDelegation={agent:'/root/partition_ten_diagnosis_1031',kind:'read-only nine-root source/epoch failure diagnosis',output:'G:/VisibleMedicine-temp/proposals/20261031-partition-ten-diagnosis/AUDIT.md',canonicalWrites:false};
current.next=next;current.beforeFurtherWork=next;index.next=next;current.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index with original JSON paths and archive chain. Missing fields imply no approval or completion.'};
for(const key of ['pendingReviewSharedFilters','pendingSavedPlanStatuses','pendingReviewReturnFocus','pendingPartition8Repair']){
 if(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size-512)break;
 current[key]={historicalRecord:{...ref(cp+'/INDEX_BEFORE.json'),jsonPath:'activeWork.current.'+key}};
}
saveIndex(index);
const intro='## Current: neonatal drafts verified; next release failures isolated — 31 October 2026\n\nSeparate Atlas2c80143a adds4source-backed ultrasound drafts; focused validators/generation pass. Website0d partition9passes445;10has230pass11fail. Exact failure diagnosis underway. Installed quick review unchanged. Full suite/build/import remain open.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));
const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Isolated candidate '+source.site+'. Checklist429. No live release test process; use CURRENT_CHECKPOINT.\n');
const size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify prior bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:429,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:429,selectedFiles:selected.size}));
