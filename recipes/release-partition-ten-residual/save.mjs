import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final',source=json(root+'/SOURCE.json'),site=source.website;
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition-ten-repair',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition-ten-residual-verified';
const canonical='F:/VisibleMedicine/website',at=new Date().toISOString(),read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)});
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const verify=()=>{
 assert.equal(hash(root+'/SOURCE.json'),'cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2');
 for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
};
verify();assert(!fs.existsSync(cp));
const focused=json(root+'/FOCUSED_RESULT.json');assert(focused.passed);assert.equal(focused.source.sha256,hash(root+'/SOURCE.json'));
const cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md',checklist=json(cf),old=structuredClone(checklist);
assert.equal(checklist.revision,430);assert.equal(read(mf).toString(),renderChecklist(old));
write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['PREPARED.json','SOURCE.json','COMPOSITION.json','INTEGRATION.json','HISTORICAL_ENVIRONMENT.json','FOCUSED_RESULT.json'])write(cp+'/'+p,read(root+'/'+p));
for(const p of ['STARTED.json','runner.stdout.log','runner.stderr.log','PROCESS-TERMINAL.json'])if(fs.existsSync(root+'/focused/'+p))write(cp+'/focused/'+p,read(root+'/focused/'+p));
for(const proposal of ['20261031-head-colic-epoch-fix','20261031-shoulder-review-epoch-fix'])for(const p of ['HANDOFF.md','RESULT.json'])write(cp+'/workers/'+proposal+'/'+p,read('G:/VisibleMedicine-temp/proposals/'+proposal+'/'+p));
write(cp+'/PRIOR_FAILURES.json',{source:ref(prior+'/SOURCE.json'),result:ref('G:/VisibleMedicine-temp/staging/20261031-release-partition10-ready/FOCUSED_RESULT.json'),counts:{tests:71,pass:68,fail:3,cancelled:0,skipped:0,todo:0},scope:'Historical evidence only; three failing roots now rerun on successor. Whole stock suite still required.'});
const selected=new Map();
function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');for(const p of source.currentChanges)selected.set('website/'+p,site+'/'+p);
for(const p of ['prepare.mjs','integrate.mjs','compose.mjs','focused.mjs','record-run.mjs','save.mjs','release-queue.mjs'])if(fs.existsSync(root+'/'+p))selected.set('recipes/release-partition-ten-residual/'+p,root+'/'+p);
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{
 backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/release-partition-ten-residual-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE.json')},scope:'Selected source and recipes only; no patient data, masks, model assets, private observations, clinical decisions, raw logs or canonical ancestry. Independently fetched, restored and byte verified.',proof:{at,focusedCounts:focused.counts,sourceUnchanged:true,installed:false,wholeSuitePassing:false},verifySource:verify});
 sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Websitecf3 repairs remaining shoulder packet, colic test epoch and head-anchor preservation comparisons. All affected whole roots and current anchor test pass on this exact source. Product/1866Review inputs unchanged. Re-run source-matched stock partitions before full build/install; prior7164 had68/71 and is retained. Keep installed quick review and separate unimported neonatal Atlas2c80143a unchanged. All71requirements/eightideas retained; no clinical approval or public deployment.';
write(cp+'/checkpoint.json',{schema:'vm-partition-ten-residual-verified/1',at,source:ref(cp+'/SOURCE.json'),composition:ref(cp+'/COMPOSITION.json'),focused:ref(cp+'/FOCUSED_RESULT.json'),prior:ref(prior+'/checkpoint.json'),sourceBackup,next,installed:false,clinicalApproval:false,wholeSuitePassing:false});
const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=431;checklist.updatedAt=at.slice(0,10);checklist.roots.partitiontenresidual=cp;checklist.items.find(x=>x.id==='REL-01').evidence.push('partitiontenresidual:checkpoint.json');
checklist.changeLog.unshift({revision:431,date:checklist.updatedAt,change:'Three residual test-era comparisons corrected on isolated websitecf3; '+focused.counts.pass+' affected/current-anchor checks pass without skips. Whole introduction and current Review packets, source fingerprints and mutation refusals retained. Product and Review inputs unchanged; full stock suite/build remain open. Installed quick review and separate neonatal draft preserved. Original71requirements/eightideas unchanged.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.currentStagedCandidate={stage:root,source:ref(cp+'/SOURCE.json'),review:source.review,buildPassed:false,installed:false};
current.pendingPartitionTenRepair={checkpoint:cpRef,focusedPassed:true,focusedCounts:focused.counts,fullSuitePassed:false,installed:false};
current.activeExecutionSessions=[];current.activeDelegation={completed:true,evidence:cp+'/workers',canonicalWrites:false};
current.next=next;current.beforeFurtherWork=next;index.next=next;current.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index with original JSON paths and archive chain. Missing fields imply no approval or completion.'};saveIndex(index);
const intro='## Current: remaining release comparisons verified — 31 October 2026\n\nWebsitecf3 repairs3test comparisons; '+focused.counts.pass+' focused checks pass. Product andReview inputs unchanged. Full source-matched suite/build remain open. Installed quick review unchanged; separate neonatal Atlas draft unimported.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));
const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas; candidate '+root+'. Checklist431. Use CURRENT_CHECKPOINT for process handles.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);
const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify previous bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:431,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:431,selectedFiles:selected.size}));
