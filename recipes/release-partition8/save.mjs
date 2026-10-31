import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready',site=root+'/website',source=json(root+'/SOURCE.json');
const proposal='G:/VisibleMedicine-temp/proposals/20261031-release-partition8-repair';
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-desktop-and-teaching-inventory',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition8-focused';
const canonical='F:/VisibleMedicine/website',read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)}),write=(p,value)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(value)?value:typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
function verify(){
 assert.equal(hash(root+'/SOURCE.json'),'1bd8a279d88605eb2b230e5df7ae27905ba64217f4761f43eafec23a990522a1');
 for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 for(const row of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 const p=json(source.parent.path);for(const row of p.sourceRows)if(!source.currentChanges.includes(row.path))assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
 assert.deepEqual(source.currentChanges,['tests/deep-brain-history-role.mjs','tests/tour-discovery-current-delivery.test.mjs']);
 assert.equal(json(root+'/VERIFIED.json').focused.pass,7);assert.equal(json(root+'/VERIFIED.json').source.sha256,hash(root+'/SOURCE.json'));
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
}
verify();assert(!fs.existsSync(cp));const at=new Date().toISOString();write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
for(const p of ['SOURCE.json','COMPOSITION.json','VERIFIED.json','FOCUSED.tap'])write(cp+'/'+p,read(root+'/'+p));
for(const p of ['HANDOFF.md','REPAIR_RECEIPT.json','HISTORICAL_NATIVE_CLONE_RECIPE.ps1','DEEP_BRAIN_FULL_ROOT.tap','TOUR_FOCUSED.tap'])write(cp+'/proposal/'+p,read(proposal+'/'+p));
for(const p of ['STARTED.json','PREPARATION.json','CONFIGURATION.json'])write(cp+'/cervical/'+p,read(root+'/cervical-diagnostic/'+p));
const started=json(root+'/cervical-diagnostic/STARTED.json');let diagnostic;
if(fs.existsSync(root+'/CERVICAL_DIAGNOSTIC.json')){
 const result=json(root+'/CERVICAL_DIAGNOSTIC.json');assert(result.process.terminalObserved);write(cp+'/cervical/RESULT.json',read(root+'/CERVICAL_DIAGNOSTIC.json'));
 for(const p of ['PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log','memory.jsonl'])write(cp+'/cervical/'+p,read(root+'/cervical-diagnostic/'+p));
 diagnostic={terminal:true,passing:result.passing,counts:result.counts,evidence:ref(cp+'/cervical/RESULT.json'),executedSource:result.source};
}else{
 process.kill(started.supervisorPid,0);process.kill(started.runnerPid,0);process.kill(137400,0);
 diagnostic={terminal:false,passing:false,sessionId:55380,coordinatorPid:137400,supervisorPid:started.supervisorPid,runnerPid:started.runnerPid,evidence:root+'/cervical-diagnostic',result:root+'/CERVICAL_DIAGNOSTIC.json',verifiedLiveAt:at};
}
const proof={at,source:ref(cp+'/SOURCE.json'),focused:{pass:7,fail:0,skip:0,wholeDeepBrainRoot:4,wholeTourRoot:1,wrongContextChecks:2},historicalOriginalPreserved:true,fullOriginalEnvironmentUsed:true,productBytesUnchanged:true,protectedInputsUnchanged:true,cervical:diagnostic,stockPartition8StillNeedsFinalSourceRerun:true,fullBuildPassed:false,wholeSuitePassing:false,installed:false,clinicalApproval:false};write(cp+'/VERIFICATION.json',proof);
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,name+'/');else selected.set(name,dir+'/'+e.name);}}collect(prior+'/selected-source');
for(const p of source.currentChanges)selected.set('website/'+p,site+'/'+p);
for(const p of ['prepare.mjs','seal.mjs','verify-focused.mjs','cervical-diagnostic.mjs','negative-role.test.mjs','save.mjs'])selected.set('recipes/release-partition8/'+p,root+'/'+p);
selected.set('recipes/release-partition8/HISTORICAL_NATIVE_CLONE_RECIPE.ps1',proposal+'/HISTORICAL_NATIVE_CLONE_RECIPE.ps1');
for(const [p,file] of selected){const dest=cp+'/selected-source/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});if(file.startsWith(prior+'/selected-source/'))fs.linkSync(file,dest);else fs.copyFileSync(file,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(file));}
const files=[...selected].map(([p,file])=>({path:p,sha256:hash(file),bytes:fs.statSync(file).size}));let sourceBackup;
try{backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/release-partition8-20261031',files,bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:proof.source},scope:'Selected authored source and test/audit recipes only. No scans, masks, model assets, private observations or decisions, release logs, native clone objects or canonical Git ancestry. Existing immutable recovery source files share storage; GitHub fetch/tree/byte verification is independent.',proof:{at,focused:proof.focused,productUnchanged:true,wholeSuitePassing:false,installed:false},verifySource:verify});sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};}
catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Keep installed quick review available. Candidate1bd8a279 composes2test-only repairs and passes7focused checks, preserving historical originals and exact current roles; all product/Review bytes match aba4be7a. '+(diagnostic.terminal?'Cervical whole-root diagnostic is terminal; inspect its exact result. ':'Cervical whole-root diagnostic is confirmed live session55380/coordinator137400/supervisor97860/runner170708 with1536MiB heap,3072MiB aggregate and2048MiB free reserve; poll same handle, do not restart. ')+'Full final-source partition8, partition7 historical spinal replay, new-product full build and remaining stock partitions are required. No clinical approval or installed update; preserve71requirements/eightideas.';
const checkpoint={schema:'vm-partition8-focused-checkpoint/1',at,source:proof.source,verification:ref(cp+'/VERIFICATION.json'),prior:ref(prior+'/checkpoint.json'),sourceBackup,next,installed:false,wholeSuitePassing:false};write(cp+'/checkpoint.json',checkpoint);const cpRef=ref(cp+'/checkpoint.json');
const cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md',c=json(cf),old=structuredClone(c);assert.equal(c.revision,423);assert.equal(read(mf).toString(),renderChecklist(old));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
c.revision=424;c.updatedAt=at.slice(0,10);c.roots.partitioneight=cp;c.items.find(i=>i.id==='REL-01').evidence.push('partitioneight:checkpoint.json');
c.changeLog.unshift({revision:424,date:c.updatedAt,change:'Two partition8 test-source context errors repaired in candidate1bd8a279.7focused cases pass: whole deep-brain4, whole tour1, wrong-context2; original historical child and all negative assertions retained. Product and protected Review inputs unchanged. Cervical whole root runs unchanged under increased admitted test memory after stock process crash; its state is in checkpoint evidence. Full final-source partition/suite and saved-plan production build remain outstanding. Installed quick review unchanged; no clinical approval.'});validateChecklist(c);
assert.deepEqual(c.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
fs.writeFileSync(cf,JSON.stringify(c,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(c));
const index=json('CURRENT_CHECKPOINT.json'),v=index.activeWork.current;v.latestCheckpoint=cpRef;if(sourceBackup.verified)v.latestSourceOnlyBackup=sourceBackup;
v.currentStagedCandidate={stage:root,source:proof.source,review:source.review,buildPassed:false,installed:false};
v.pendingPartition8Repair={checkpoint:cpRef,focusedPasses:7,integrated:true,stockRerunPending:true,cervical:diagnostic,installed:false};
v.activeExecutionSessions=diagnostic.terminal?[]:[{sessionId:55380,kind:'unchanged whole cervical root memory diagnostic',coordinatorPid:137400,supervisorPid:started.supervisorPid,runnerPid:started.runnerPid,evidence:diagnostic.evidence,sourceSha256:source.parent.sha256,verifiedLive:true}];
v.next=next;index.next=next;v.beforeFurtherWork=next;v.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index at original JSON paths with archive chain. Missing fields imply no approval or completion.'};
for(const key of ['pendingGeistFont','pendingBrandProvenance','pendingPublicImageDelivery']){if(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size-768)break;delete v[key];}saveIndex(index);
const intro='## Current: source-version test repairs verified — 31 October 2026\n\nCandidate1bd8a279 passes7focused checks after2test-only repairs. Product bytes unchanged. Cervical whole-root memory diagnostic '+(diagnostic.terminal?'terminal; inspect checkpoint result.':'running as session55380.')+' Full build/suite remain open. Installed quick review unchanged.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Candidate '+root+'. Checklist424; use CURRENT_CHECKPOINT handles.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify prior bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:424,index:ref('CURRENT_CHECKPOINT.json'),cervical:diagnostic,goalActive:true,ownerPreviewChanged:false});console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:424,diagnosticTerminal:diagnostic.terminal,selectedFiles:files.length}));
