import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';

const root='G:/VisibleMedicine-temp/staging/20261031-cerebral-detail-ultrasound-atlas';
const site=root+'/atlas', website='F:/VisibleMedicine/website';
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-cerebral-detail-ultrasound-draft';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-cerebral-detail-atlas-prepared';
const ref=p=>({path:p,sha256:hash(p)}),read=p=>fs.readFileSync(p);
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
const prepared=json(root+'/SOURCE_PREPARED.json'), baseline=json(root+'/BASELINE.json');
function verify(){
 assert.equal(git(site,'rev-parse','HEAD'),prepared.base.head);
 assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
 assert.equal(git('F:/VisibleMedicine/atlas','status','--porcelain'),'');
 assert.equal(git(website,'rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(json(website+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
 for(const r of prepared.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const r of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+r.path),r.sha256,r.path);
 assert.equal(hash(prepared.verificationRecipe.path),prepared.verificationRecipe.sha256);
 assert(!fs.existsSync(root+'/VERIFICATION_STATE.json'),'Reassess runtime results before saving a source-only checkpoint');
}
verify();assert(!fs.existsSync(cp));
const at=new Date().toISOString(), cf=website+'/docs/completion-checklist.json', mf=website+'/docs/completion-checklist.md';
const oldChecklist=json(cf), checklist=structuredClone(oldChecklist);
assert.equal(checklist.revision,435);assert.equal(read(mf).toString(),renderChecklist(oldChecklist));
const oldIndex=json('CURRENT_CHECKPOINT.json');
write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const name of ['SOURCE_PREPARED.json','BASELINE.json','CONTENT.json','VALIDATION_PROPOSAL.json','TEST_BROWSER_CLEANUP.json'])write(cp+'/'+name,read(root+'/'+name));
write(cp+'/RELEASE_RESUME_ONCE.json',read('G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs/RESUME_ONCE.json'));
const availableMiB=Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','(Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory).AvailableMBytes'],{encoding:'utf8',windowsHide:true}).trim());
write(cp+'/CAPACITY.json',{at,availableMiB,minimumTestMiB:4096,observedWithoutLaunchingTests:true,previewUnchanged:true,wslUnchanged:true});
const selected=new Map();
function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');
for(const row of prepared.authoredFiles)selected.set('atlas/'+row.path,site+'/'+row.path);
for(const name of ['apply-content.mjs','apply-validation.mjs','seal-preparation.mjs','verify-ready.mjs','review-impact.mjs','save-prepared.mjs'])selected.set('recipes/cerebral-detail-atlas/'+name,root+'/'+name);
for(const [rel,p]of selected){const out=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(out),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,out);else fs.copyFileSync(p,out,fs.constants.COPYFILE_EXCL);assert.equal(hash(out),hash(p));}
// The source backup is filtered independently of both canonical repositories.
let sourceBackup;
try{
 backup({root:cp+'/source-only-backup',repo:root+'/prepared-source-backup.git',branch:'backup/cerebral-detail-atlas-prepared-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE_PREPARED.json')},scope:'Selected implementation source, original teaching drafts and verification/recovery recipes only. The isolated candidate is prepared, not runtime-verified or installed. No models, scans, masks, patient data, review decisions, source-article figures/prose, raw Git ancestry or logs.',proof:{at,syntaxChecks:8,authoredFiles:8,intendedTeachingPlacements:8,runtimeValidated:false,generated:false,installed:false,clinicalApproval:false,wholeSuitePassing:false},verifySource:verify});
 sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Keep the installed quick-review website available. Website79f451df release repairs and the isolated cerebral-detail Atlas candidate await runtime verification with at least4096MiB available RAM. Do not repeat empty waits or reduce guards. Atlas candidate has8authored files,8syntax checks and a resumable13-step generation/history/revision verifier; execute verify-ready.mjs after source readback and adequate memory. Canonical Atlasc32 and verified parentd9 remain unchanged. Measure actual review-impact changes; do not migrate approvals. Full71requirements/eightideas, full website suite/build and clinical review remain open.';
write(cp+'/checkpoint.json',{schema:'vm-cerebral-detail-atlas-prepared/1',at,source:ref(cp+'/SOURCE_PREPARED.json'),base:ref(cp+'/BASELINE.json'),prior:ref(prior+'/checkpoint.json'),releaseTerminal:ref(cp+'/RELEASE_RESUME_ONCE.json'),capacity:ref(cp+'/CAPACITY.json'),sourceBackup,authoredFiles:8,sourceFiles:prepared.sourceRows.length,intendedPlacements:8,syntaxChecks:8,runtimeValidated:false,generated:false,installed:false,clinicalApproval:false,wholeSuitePassing:false,next});
const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=436;checklist.updatedAt=at.slice(0,10);checklist.roots.cerebralprepared=cp;
for(const id of ['TEACH-01','TEACH-07','REL-01'])checklist.items.find(x=>x.id===id).evidence.push('cerebralprepared:checkpoint.json');
checklist.changeLog.unshift({revision:436,date:checklist.updatedAt,change:'Integrated4original ultrasound drafts into an isolated Atlas candidate for8paired selections, with exact historical comparison and malformed-identity checks. Eight source/syntax checks pass;13-step runtime/generation/revision verification remains pending adequate RAM. Canonical repos, installed quick review, all71requirements/eightideas and clinical approvals are unchanged.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),oldChecklist.items.map(({id,status,acceptance})=>({id,status,acceptance})));
const index=structuredClone(oldIndex),current=index.activeWork.current;
current.latestCheckpoint=cpRef;
if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.pendingCerebralDetailUltrasound={stage:root,checkpoint:cpRef,source:ref(cp+'/SOURCE_PREPARED.json'),parentHead:prepared.base.head,intendedPlacements:8,authoredFiles:8,syntaxChecks:8,runtimeValidated:false,generated:false,installed:false,verification:root+'/verify-ready.mjs'};
current.currentReleaseQueue={...current.currentReleaseQueue,state:'memory-deferred',terminal:true,regressionStarted:false,latestAttempt:ref(cp+'/RELEASE_RESUME_ONCE.json')};
current.currentCapacityDecision={at,availableMiB,minimumTestMiB:4096,evidence:ref(cp+'/CAPACITY.json'),previewPreserved:true,wslPreserved:true};
current.activeExecutionSessions=[];current.next=next;
index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Complete previous index with original JSON paths; omission never implies approval or completion.'};
assert.deepEqual(index.goal.objective,oldIndex.goal.objective);assert.deepEqual(current.currentInstalled,oldIndex.activeWork.current.currentInstalled);assert.deepEqual(current.currentStagedCandidate,oldIndex.activeWork.current.currentStagedCandidate);
assert(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size,'Index must fit its existing allocation');
write(cp+'/INDEX_AFTER.json',index);write(cp+'/CHECKLIST_AFTER.json',checklist);
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));saveIndex(index);
const intro='## Current: cerebral ultrasound integration prepared — 31 October 2026\n\nEight paired teaching entries and their history/identity checks are integrated in an isolated candidate. Eight syntax checks passed; runtime generation and validation await sufficient RAM. Installed quick review remains available. No new clinical approval or installed changes.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));
const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Candidate '+root+'. Checklist436; no active test process.\n');
const mapSize=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=mapSize);
const mapFd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(mapFd,Buffer.concat([map,Buffer.alloc(mapSize-map.length,32)]));fs.fsyncSync(mapFd);}finally{fs.closeSync(mapFd);}
const master=website+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:436,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,ownerPreviewChanged:false,goalActive:true});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:436,selectedFiles:selected.size,indexBytes:Buffer.byteLength(JSON.stringify(index)+'\n')}));
