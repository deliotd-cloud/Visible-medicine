import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-ready',source=json(root+'/SOURCE.json'),site=source.website;
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-neonatal-lobar-atlas-verified';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition-ten-repair';
const canonical='F:/VisibleMedicine/website',at=new Date().toISOString();
const ref=p=>({path:p,sha256:hash(p)}),read=p=>fs.readFileSync(p);
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const verify=()=>{
 assert.equal(hash(root+'/SOURCE.json'),'7164d154e054a675884b281852fd4dae078e7f944f2d881df8eaf0c856b4b72a');
 for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
};
verify();assert(!fs.existsSync(cp));
const cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md',checklist=json(cf),old=structuredClone(checklist);
assert.equal(checklist.revision,429);assert.equal(read(mf).toString(),renderChecklist(old));
const light=read(root+'/NAV_FONT_LIGHT.log').toString();assert(light.includes('pass 9')&&light.includes('fail 0')&&light.includes('skipped 0'));
write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['PREPARED.json','SOURCE.json','COMPOSITION.json','HISTORICAL_ENVIRONMENT.json','NAV_FONT_LIGHT.log'])write(cp+'/'+p,read(root+'/'+p));
for(const kind of ['anatomy','head']){
 const from='G:/VisibleMedicine-temp/proposals/20261031-partition-ten-'+kind+'-impl';
 for(const p of ['HANDOFF.md','RESULT.json'])write(cp+'/workers/'+kind+'/'+p,read(from+'/'+p));
}
write(cp+'/ADMISSION.json',{at,attempts:[{availableMiB:4072,requiredMiB:4096,admitted:false},{availableMiB:3821,requiredMiB:4096,admitted:false},{availableMiB:4076,requiredMiB:4096,admitted:false}],source:'Actual guarded runner output; exact individual timestamps not retained',scope:'These three attempts only; later execution is recorded separately.',processStarted:false,heapMiB:1024,aggregateMiB:2048,freeReserveMiB:2048,policyUnchanged:true});
let handle=null,focused=null;
if(fs.existsSync(root+'/FOCUSED_RESULT.json')){focused=json(root+'/FOCUSED_RESULT.json');write(cp+'/FOCUSED_RESULT.json',read(root+'/FOCUSED_RESULT.json'));}
else if(fs.existsSync(root+'/focused/STARTED.json')){
 const started=json(root+'/focused/STARTED.json');for(const pid of [started.runnerPid,started.supervisorPid])process.kill(pid,0);
 handle={sessionId:Number(process.argv[2]),kind:'partition-ten focused regression verification',runnerPid:started.runnerPid,supervisorPid:started.supervisorPid,evidence:root+'/focused',sourceSha256:hash(root+'/SOURCE.json'),verifiedLiveAt:at};assert(handle.sessionId>0);
}
if(handle)write(cp+'/RUNNING.json',handle);
if(fs.existsSync(root+'/focused'))for(const name of ['STARTED.json','runner.stdout.log','runner.stderr.log','PROCESS-TERMINAL.json'])if(fs.existsSync(root+'/focused/'+name))write(cp+'/focused/'+name,read(root+'/focused/'+name));
const selected=new Map();
function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');
for(const p of source.currentChanges)selected.set('website/'+p,site+'/'+p);
for(const p of ['prepare.mjs','compose.mjs','focused.mjs','save.mjs'])selected.set('recipes/release-partition-ten/'+p,root+'/'+p);
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{
 backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/release-partition-ten-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE.json')},scope:'Selected source and recipes only; no scans, masks, model assets, private observations, clinical decisions, raw logs or canonical ancestry. Independent fetch/tree/byte and restore verification.',proof:{at,testOnlyChanges:source.currentChanges.length,lightPasses:9,focusedPassed:focused?.passed??false,installed:false,wholeSuitePassing:false},verifySource:verify});
 sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Keep installed quick review unchanged. Website7164d154 repairs13test files across9failed roots and dependencies; product/1866Review inputs unchanged. Navigation/font light9checks pass; worker preservation6 and link-menu wrapper2/original4 pass, but combined current-source verification remains '+(focused?.passed?'passed; whole stock suite/build remain open.':handle?'running at the exact indexed handle.':'pending memory admission (4096MiB free minimum,2048MiB reserve).')+' Preserve all historical assertions and mutation refusals; inspect full focused result before stock rerun. Prior0d partition9pass445 and partition10fail11 remain historical source-specific evidence. Isolated Atlas2c80143a remains separate/unimported. Full71requirements/eightideas preserved; no clinical approval or installation.';
write(cp+'/checkpoint.json',{schema:'vm-release-partition-ten-repair-checkpoint/1',at,source:ref(cp+'/SOURCE.json'),composition:ref(cp+'/COMPOSITION.json'),historicalEnvironment:ref(cp+'/HISTORICAL_ENVIRONMENT.json'),light:ref(cp+'/NAV_FONT_LIGHT.log'),admission:ref(cp+'/ADMISSION.json'),focused:focused?ref(cp+'/FOCUSED_RESULT.json'):null,running:handle?ref(cp+'/RUNNING.json'):null,sourceBackup,prior:ref(prior+'/checkpoint.json'),next,installed:false,clinicalApproval:false,wholeSuitePassing:false});
const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=430;checklist.updatedAt=at.slice(0,10);checklist.roots.partitiontenrepair=cp;checklist.items.find(x=>x.id==='REL-01').evidence.push('partitiontenrepair:checkpoint.json');
checklist.changeLog.unshift({revision:430,date:checklist.updatedAt,change:'Website7164d154 repairs13test files while product/1866Review inputs stay exact. Preserves historical source roles and current integrity/refusal checks; navigation/font light9checks pass. Combined guarded verification remains open; prior0d failures are not counted as resolved until full roots pass. Installed quick review unchanged; separate neonatal Atlas draft remains unimported. Original71requirements/eightideas preserved.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.currentStagedCandidate={stage:root,source:ref(cp+'/SOURCE.json'),review:source.review,buildPassed:false,installed:false};
current.pendingPartitionTenRepair={checkpoint:cpRef,testFiles:13,lightPassed:9,focusedPassed:focused?.passed??false,fullSuitePassed:false,installed:false};
current.currentReleaseQueue.candidateDeltaRequiresReconciliation=true;current.activeExecutionSessions=handle?[handle]:[];
current.activeDelegation={completed:true,evidence:cp+'/workers',canonicalWrites:false};
current.next=next;current.beforeFurtherWork=next;index.next=next;current.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index with original JSON paths and archive chain. Missing fields imply no approval or completion.'};
for(const key of ['pendingReviewSharedFilters','pendingSavedPlanStatuses','pendingReviewReturnFocus','pendingPartition8Repair','pendingPublicImageDelivery']){
 if(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size-512)break;
 if(current[key])current[key]={historicalRecord:{...ref(cp+'/INDEX_BEFORE.json'),jsonPath:'activeWork.current.'+key}};
}
saveIndex(index);
const intro='## Current: release history and navigation checks repaired — 31 October 2026\n\nWebsite7164d154 stages13test-only repairs; product andReview inputs unchanged. Nine navigation/font checks pass; combined verification remains open. Installed quick review unchanged. Separate neonatal Atlas draft remains unimported.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));
const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas; candidate '+root+'. Checklist430. Use CURRENT_CHECKPOINT for actual process handles.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);
const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify prior bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:430,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:430,selectedFiles:selected.size,handle}));
