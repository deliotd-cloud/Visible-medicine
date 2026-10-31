import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-release-eleven-residual';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-final';
const controller='G:/VisibleMedicine-temp/proposals/20261031-resumable-release';
const atlas='G:/VisibleMedicine-temp/staging/20261031-cerebral-detail-ultrasound-atlas';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release-eleven-residual-verified';
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-cerebral-detail-atlas-prepared',website='F:/VisibleMedicine/website';
const read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)});
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const source=json(root+'/SOURCE.json'),light=json(root+'/light-checks/RESULT.json'),astate=json(atlas+'/VERIFICATION_STATE.json'),unit=json(controller+'/CONTROLLER_CHECKS.json'),oldState=json(controller+'/STATE.json');
const failedOutput=json(controller+'/attempts/partition-11-1PJD9h/evidence/runner.stdout.log');
assert(astate.terminal&&astate.state==='memory-deferred'&&!astate.failure);assert.equal(astate.completed.length,3);
assert(oldState.terminal&&oldState.status==='failed');assert.equal(failedOutput.counts.fail,4);assert.equal(failedOutput.counts.pass,226);
assert(light.passed);assert.equal(light.counts.pass,10);assert.equal(unit.counts.pass,13);
const verify=()=>{
 assert.equal(hash(root+'/SOURCE.json'),'c0c16e3aeee38b41e1796237be9c8d0bc24ad651965803b4913d0996c9c6b75c');
 for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
 for(const r of [light.stdout,light.stderr,...unit.source,...astate.completed.map(r=>r.log)])assert.equal(hash(r.path),r.sha256,r.path);
 for(const row of json(atlas+'/SOURCE_PREPARED.json').sourceRows)assert.equal(hash(atlas+'/atlas/'+row.path),row.sha256,row.path);
 assert.equal(json(website+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
};verify();
const cf=website+'/docs/completion-checklist.json',mf=website+'/docs/completion-checklist.md',old=json(cf),checklist=structuredClone(old);assert.equal(old.revision,436);assert.equal(read(mf).toString(),renderChecklist(old));assert(!fs.existsSync(cp));
const at=new Date().toISOString();write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['SOURCE.json','COMPOSITION.json','verification/PLAN.json','verification/ADAPTER_DERIVATION.json','light-checks/RESULT.json','light-checks/stdout.log','light-checks/stderr.log'])write(cp+'/'+p,read(root+'/'+p));
for(const p of ['MAIN_PROPOSAL.json','RESULT.json','HANDOFF.md'])write(cp+'/residual/'+p,read(proposal+'/'+p));
for(const p of ['PLAN.json','STATE.json','CONTROLLER_CHECKS.json','HANDOFF.md'])write(cp+'/controller/'+p,read(controller+'/'+p));
for(const p of ['GUARDED_RESULT.json','evidence/PROCESS-TERMINAL.json','evidence/runner.stdout.log','evidence/runner.stderr.log'])write(cp+'/partition11-before/'+p,read(controller+'/attempts/partition-11-1PJD9h/'+p));
write(cp+'/partition11-before/receipt.json',read(path.join(failedOutput.output,'receipt.json')));
write(cp+'/atlas/VERIFICATION_STATE.json',read(atlas+'/VERIFICATION_STATE.json'));
for(const row of astate.completed){assert.equal(row.status,0);write(cp+'/atlas/'+path.basename(row.log.path),read(row.log.path));}
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}collect(prior+'/selected-source');
for(const p of json(root+'/COMPOSITION.json').changed)selected.set('website/'+p.path,source.website+'/'+p.path);
for(const p of ['runner.mjs','runner.test.mjs','run-release.mjs','guarded-step.mjs'])selected.set('recipes/release-eleven-residual-verification/'+p,root+'/verification/'+p);
for(const p of ['integrate.mjs','prepare-verification.mjs','verify-light.mjs','save.mjs'])selected.set('recipes/release-eleven-residual/'+p,proposal+'/'+p);
selected.set('plans/release-eleven-residual.md',proposal+'/HANDOFF.md');
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/release-eleven-residual-verified-20261031',files:[...selected].map(([rel,p])=>({path:rel,bytes:fs.statSync(p).size,sha256:hash(p)})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE.json')},scope:'Selected source, original teaching drafts, tests and verification recipes only. No scans, masks, models, private references, decisions, raw logs or canonical ancestry. Full website release tests and Atlas generation remain incomplete; current installed preview unchanged.',proof:{at,focusedTests:10,controllerTests:13,atlasChecksCompleted:3,atlasChecksTotal:13,previousPartition:{tests:230,pass:226,fail:4},wholeSuitePassing:false,installed:false,clinicalApproval:false},verifySource:verify});sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};}
catch(error){write(cp+'/BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/BACKUP_FAILURE.json'),verified:false};}
const next='Current review preview stays available. Websitec0c16e3a integrates three test-only residual repairs;10pure-source checks pass, but femoral full root and stock partition11 remain pending. Run '+root+'/verification/run-release.mjs --run with unchanged4096MiB guard when available. Atlas candidate completed3/13 checks; resume its verify-ready.mjs only from terminal memory-deferred state with4096MiB available and no other heavy job. No candidate installation, geometry/review policy change or clinical approval. Full71requirements/eightideas and remaining suite/build preserved.';
write(cp+'/checkpoint.json',{schema:'vm-release-eleven-residual-checkpoint/1',at,source:ref(cp+'/SOURCE.json'),composition:ref(cp+'/COMPOSITION.json'),focused:ref(cp+'/light-checks/RESULT.json'),controller:ref(cp+'/controller/CONTROLLER_CHECKS.json'),previousPartition:ref(cp+'/partition11-before/receipt.json'),atlas:ref(cp+'/atlas/VERIFICATION_STATE.json'),sourceBackup,prior:ref(prior+'/checkpoint.json'),next,installed:false,clinicalApproval:false,wholeSuitePassing:false});const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=437;checklist.updatedAt=at.slice(0,10);checklist.roots.releaseelevenresidual=cp;checklist.items.find(x=>x.id==='REL-01').evidence.push('releaseelevenresidual:checkpoint.json');
const summary='Integrated three isolated test repairs with10focused checks passing. Previous stock partition11:226pass/4fail; remaining full-root and partition reruns pending. Resumable controller13checks pass; Atlas candidate3/13checks complete before memory deferral. Product, installed preview, review decisions and all71requirements/eightideas unchanged.';
checklist.changeLog.unshift({revision:437,date:checklist.updatedAt,change:summary});validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.activeExecutionSessions=[];current.currentReleaseQueue={state:'focused-checks-passed-full-rerun-pending',source:ref(cp+'/SOURCE.json'),stage:root,plan:ref(cp+'/verification/PLAN.json'),focusedPasses:10,previousPartition:{tests:230,pass:226,fail:4,evidence:ref(cp+'/partition11-before/receipt.json')},wholeSuitePassing:false};
current.currentStagedCandidate={source:ref(cp+'/SOURCE.json'),stage:source.website,review:source.review,productUnchangedFromParent:true,focusedVerification:cpRef,testsVerified:false,buildPassed:false,installed:false};
current.pendingCerebralDetailUltrasound={...current.pendingCerebralDetailUltrasound,verificationProgress:{completed:3,total:13,state:'memory-deferred',evidence:ref(cp+'/atlas/VERIFICATION_STATE.json')},runtimeValidated:false};
current.next=next;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Complete prior index at original JSON paths. No missing field implies approval or completion.'};
assert(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size);
write(cp+'/INDEX_AFTER.json',index);write(cp+'/CHECKLIST_AFTER.json',checklist);fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));saveIndex(index);
const intro='## Current: release residual repairs verified locally — 31 October 2026\n\n'+summary+'\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Candidate '+source.website+'. Checklist437; no active test process.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=website+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:437,selectedFiles:selected.size,index:ref('CURRENT_CHECKPOINT.json'),goalActive:true,previewChanged:false});console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:437,selectedFiles:selected.size}));
