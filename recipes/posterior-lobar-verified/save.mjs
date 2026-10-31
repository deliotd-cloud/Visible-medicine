import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us',site=root+'/atlas',website='F:/VisibleMedicine/website';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-posterior-lobar-atlas-verified',prior='F:/VisibleMedicine/recovery/checkpoints/20261031-posterior-lobar-ultrasound-draft';
const queueRoot='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-cervical-temp-portability',diagnosis='G:/VisibleMedicine-temp/proposals/20261031-release-eleven-diagnosis';
const ref=p=>({path:p,sha256:hash(p)}),read=p=>fs.readFileSync(p),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const source=json(root+'/SOURCE.json'),commit=json(root+'/COMMIT.json'),validation=json(root+'/FULL_VALIDATION.json'),impact=json(root+'/REVIEW_IMPACT.json'),failures=json(root+'/RELEASE_FAILURES.json');
const verify=()=>{
 assert.equal(hash(root+'/SOURCE.json'),'6c214ddd4eb944567406e2925635bfc56d6196992b43f35fafd2a85aaf223803');
 for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 assert.equal(json(website+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
};
verify();assert(validation.passed&&impact.passed);assert.equal(commit.head,'d9bdfa1ceb1d86cabe059e963dcd6284f9527be1');assert(json(queueRoot+'/RELEASE_QUEUE.json').terminal);
const transport=json(proposal+'/HISTORICAL.json');assert(transport.passed);assert.equal(hash(transport.helper.path),transport.helper.sha256);assert.equal(hash(transport.log.path),transport.log.sha256);
const cf=website+'/docs/completion-checklist.json',mf=website+'/docs/completion-checklist.md',checklist=json(cf),old=structuredClone(checklist);
assert.equal(checklist.revision,432);assert.equal(read(mf).toString(),renderChecklist(old));assert(!fs.existsSync(cp));
const at=new Date().toISOString();write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['BASELINE.json','SOURCE.json','COMMIT.json','GENERATION-THIRD.json','FULL_VALIDATION.json','REVIEW_IMPACT.json','RESEARCH.json','CONTENT_PIN.json','RELEASE_FAILURES.json'])write(cp+'/'+p,read(root+'/'+p));
for(const p of fs.readdirSync(root).filter(p=>/^(GEN-THIRD-|FULL-CHECK-).*\.(log|json)$/.test(p)))write(cp+'/checks/'+p,read(root+'/'+p));
for(const p of ['HANDOFF.md','RESULT.json','HISTORICAL.json','HISTORICAL.log','verify-historical.mjs'])write(cp+'/cervical-transport/'+p,read(proposal+'/'+p));
for(const p of ['AUDIT.md','RESULT.json'])write(cp+'/release-diagnosis/'+p,read(diagnosis+'/'+p));
write(cp+'/QUEUE_TERMINAL.json',read(queueRoot+'/RELEASE_QUEUE.json'));
for(const p of failures.partitions){
 write(cp+'/release/'+p.partition+'/RESULT.json',read(p.result.path));write(cp+'/release/'+p.partition+'/receipt.json',read(p.receipt.path));write(cp+'/release/'+p.partition+'/child.tap',read(p.tap.path));
}
const selected=new Map();
function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');
for(const r of source.changes.filter(r=>!r.path.startsWith('docs/')))selected.set('atlas/'+r.path,site+'/'+r.path);
for(const p of ['generate-third.mjs','validate-current.mjs','freeze.mjs','commit.mjs','record-release-terminal.mjs','save.mjs'])selected.set('recipes/posterior-lobar-verified/'+p,root+'/'+p);
for(const p of ['cervical-a01-history-transport.mjs','cervical-a01-temp.test.mjs'])selected.set('proposals/cervical-temp-portability/tests/'+p,proposal+'/files/tests/'+p);
selected.set('proposals/cervical-temp-portability/HANDOFF.md',proposal+'/HANDOFF.md');
selected.set('proposals/cervical-temp-portability/verify-historical.mjs',proposal+'/verify-historical.mjs');
selected.set('plans/release-eleven-diagnosis.md',diagnosis+'/AUDIT.md');
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{
 backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/posterior-lobar-atlas-verified-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE.json'),commit:ref(cp+'/COMMIT.json')},scope:'Selected source, recipes and proposed test transport only. No models, scans, masks, private observations, clinical decisions, raw test logs or canonical ancestry. Independent fetch/tree/byte and restore verification.',proof:{at,focusedAtlasChecksPassed:true,transportOriginalPassed:true,installed:false,wholeSuitePassing:false},verifySource:verify});
 sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Atlas d9bdfa1c independently verified: four posterior neonatal ultrasound draft placements,968other lessons unchanged,10502nested assertions and108Review contexts pass. Existing conservative renderer invalidates108geometry review revisions; no decisions migrated. Websitecf3 queue terminal: partition10passes212;11has198pass21fail. Finish source-bound failure repairs before successor full partition11; G-temp cervical transport proposal passes its whole original and focused tests but is not integrated. Partition7 and full suite/build remain unresolved. Keep installed quick review unchanged; preserve full71/eightideas.';
write(cp+'/checkpoint.json',{schema:'vm-posterior-lobar-atlas-checkpoint/1',at,source:ref(cp+'/SOURCE.json'),commit:ref(cp+'/COMMIT.json'),validation:ref(cp+'/FULL_VALIDATION.json'),reviewImpact:ref(cp+'/REVIEW_IMPACT.json'),research:ref(cp+'/RESEARCH.json'),releaseFailures:ref(cp+'/RELEASE_FAILURES.json'),queue:ref(cp+'/QUEUE_TERMINAL.json'),transport:ref(cp+'/cervical-transport/HISTORICAL.json'),diagnosis:ref(cp+'/release-diagnosis/AUDIT.md'),sourceBackup,prior:ref(prior+'/checkpoint.json'),next,canonicalIntegrated:false,websiteImported:false,installed:false,clinicalApproval:false,wholeSuitePassing:false});
const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=433;checklist.updatedAt=at.slice(0,10);checklist.roots.posteriorlobarready=cp;
for(const id of ['TEACH-01','TEACH-07','REL-01'])checklist.items.find(x=>x.id===id).evidence.push('posteriorlobarready:checkpoint.json');
checklist.changeLog.unshift({revision:433,date:checklist.updatedAt,change:'Verified isolated Atlasd9bdfa1c adds4posterior neonatal ultrasound draft placements;968other lessons unchanged. Six generator checks,18mutation refusals,10502nested assertions and108Review contexts pass; existing renderer review scope preserved. Websitecf3 partition10passes212;11has198pass21fail. Portable G-temp cervical proposal passes whole original and3focused checks but is unintegrated. Full suite/build/import and clinical sign-off remain open; installed quick review unchanged; original71requirements/eightideas preserved.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.pendingPosteriorLobarDraft={checkpoint:cpRef,stage:site,head:commit.head,tree:commit.tree,source:ref(cp+'/SOURCE.json'),changedPlacements:4,unchangedPlacements:968,fullValidation:true,rendererRegenerated:true,candidateDraftTopics:729,candidatePendingTopics:243,canonicalIntegrated:false,websiteImported:false,installed:false};
current.currentReleaseQueue={terminal:true,sessionId:13594,source:failures.source,completed:failures.partitions.map(p=>({partition:p.partition,...p.counts})),evidence:ref(cp+'/QUEUE_TERMINAL.json'),failureInventory:ref(cp+'/RELEASE_FAILURES.json'),wholeSuitePassing:false};
current.activeExecutionSessions=[];current.activeDelegation={completed:true,evidence:ref(cp+'/release-diagnosis/AUDIT.md'),canonicalWrites:false};
current.pendingCervicalTempTransport={proposal,checkpoint:cpRef,historicalPassed:true,focusedPasses:3,integrated:false,installed:false};
current.next=next;current.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index with original JSON paths and archive chain. No goal, policy, approval or pending work omitted.'};
assert(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size,'Compact duplicate historical summaries before saving; complete index is in INDEX_BEFORE');
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));saveIndex(index);
const intro='## Current: posterior ultrasound teaching verified; release repairs queued — 31 October 2026\n\nAtlasd9bdfa1c adds4verified software draft placements with968other lessons unchanged. No clinical approval or installation. Websitecf3: partition10passes212;11has198pass21fail. G-temp cervical transport proposal passes its original proof and focused checks. Full release suite/build remain open.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Draft '+site+'. Checklist433. Release session13594 terminal; no active test process.\n');
const size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=website+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:433,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:433,selectedFiles:selected.size,indexBytes:Buffer.byteLength(JSON.stringify(index)+'\n')}));
