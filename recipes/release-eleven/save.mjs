import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs',site=root+'/website',canonical='F:/VisibleMedicine/website';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release-eleven-source-sealed',prior='F:/VisibleMedicine/recovery/checkpoints/20261031-posterior-lobar-atlas-verified';
const ref=p=>({path:p,sha256:hash(p)}),read=p=>fs.readFileSync(p),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const source=json(root+'/SOURCE.json'),composition=json(root+'/COMPOSITION.json');
const verify=()=>{
 assert.equal(hash(root+'/SOURCE.json'),'79f451df9dde58cd70a72eb6560d05fd74f8b421897405bd4ae82e6756304bb4');
 for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
};verify();assert.equal(composition.changed.length,17);assert(composition.allProductBytesUnchanged&&composition.protectedInputsUnchanged);
const cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md',checklist=json(cf),old=structuredClone(checklist);assert.equal(checklist.revision,433);assert.equal(read(mf).toString(),renderChecklist(old));assert(!fs.existsSync(cp));
const at=new Date().toISOString();write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['SOURCE.json','COMPOSITION.json','PREPARED.json','HISTORICAL_ENVIRONMENT.json','RUN_STATE.json','ADMISSION_RETRY.json'])write(cp+'/'+p,read(root+'/'+p));
const workers=['head-history-eleven','xray-epoch-eleven'];
for(const worker of workers){const base='G:/VisibleMedicine-temp/proposals/20261031-'+worker;for(const p of ['HANDOFF.md','RESULT.json'])write(cp+'/workers/'+worker+'/'+p,read(base+'/'+p));const result=json(base+'/RESULT.json');for(const row of result.files){const expected=row.after??row.afterSha256;assert.equal(hash(site+'/'+row.path),expected,row.path);}}
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');for(const r of composition.changed)selected.set('website/'+r.path,site+'/'+r.path);
for(const p of ['prepare.mjs','compose.mjs','verify.mjs','admission-retry.mjs','save.mjs'])selected.set('recipes/release-eleven/'+p,root+'/'+p);
for(const worker of workers)selected.set('plans/'+worker+'.md',cp+'/workers/'+worker+'/HANDOFF.md');
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/release-eleven-repairs-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE.json')},scope:'Selected source and local test recipes only. Sealed test repairs await regression execution. No model assets, scans, masks, private observations, clinical decisions, raw logs or canonical ancestry. Independent fetch/tree/byte and restore verification.',proof:{at,productUnchanged:true,protectedReviewInputsUnchanged:true,validationPending:true,installed:false,wholeSuitePassing:false},verifySource:verify});sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};}
catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const admission=json(root+'/ADMISSION_RETRY.json');
const alive=!!execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Get-Process -Id ${admission.pid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id`],{encoding:'utf8',windowsHide:true}).trim();
const next='Website79f451df seals17test repairs with all product/1866Review input bytes unchanged. Restore full historical admission proofs separately from current C32 coverage; MRI form mock now carries real response identity, image hashes use bytes. Inspect session61701/ADMISSION_RETRY.json and actual process before continuing: minimum4096MiB unchanged. Run adjacent roots then whole partition11; failures must be diagnosed before any new source. Atlasd9bdfa1c remains separately verified and unimported. Full32partitions, separate7memory profile and source-matched build remain open. Keep installed quick review unchanged and full71/eightideas.';
write(cp+'/checkpoint.json',{schema:'vm-release-eleven-sealed-source/1',at,source:ref(cp+'/SOURCE.json'),composition:ref(cp+'/COMPOSITION.json'),workers:workers.map(w=>ref(cp+'/workers/'+w+'/RESULT.json')),sourceBackup,admissionAtSave:{...admission,pidObservedAlive:alive,sessionId:61701},prior:ref(prior+'/checkpoint.json'),next,validationPending:true,productUnchanged:true,protectedInputsUnchanged:true,installed:false,clinicalApproval:false,wholeSuitePassing:false});
const cpRef=ref(cp+'/checkpoint.json');checklist.revision=434;checklist.updatedAt=at.slice(0,10);checklist.roots.releaseeleven=cp;
checklist.items.find(x=>x.id==='REL-01').evidence.push('releaseeleven:checkpoint.json');checklist.changeLog.unshift({revision:434,date:checklist.updatedAt,change:'Sealed17test-only repairs covering the21partition11failures: authentic historical/native sources, current imaging/curriculum coverage, preview notice evolution, MRI response identity and binary Review hashes. All product/1866Review inputs unchanged. Combined tests await4096MiB capacity; no pass claimed. Original71requirements/eightideas and current quick review preserved.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.currentStagedCandidate={stage:root,source:ref(cp+'/SOURCE.json'),review:source.review,buildPassed:false,testsVerified:false,installed:false};
current.currentReleaseQueue={state:admission.state,source:ref(cp+'/SOURCE.json'),sessionId:61701,admissionPath:root+'/ADMISSION_RETRY.json',runPath:root+'/RUN_STATE_RETRY.json',priorTerminal:ref(prior+'/checkpoint.json'),wholeSuitePassing:false};
current.activeExecutionSessions=alive&&!admission.terminal?[{sessionId:61701,coordinatorPid:admission.pid,kind:admission.state,childPid:admission.childPid??null,sourceSha256:hash(root+'/SOURCE.json'),evidence:root,verifiedLiveAt:new Date().toISOString()}]:[];
current.activeDelegation={completed:true,evidence:cp+'/workers',canonicalWrites:false};current.pendingCervicalTempTransport.integratedIntoStagedSource=hash(root+'/SOURCE.json');
current.next=next;current.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index at original JSON paths, including complete goal, policies and ancestor candidates. No approval implied.'};
for(const key of ['pendingNeonatalLobarDraft','pendingPartitionTenRepair']){
 if(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size-128)break;
 current[key]={historicalRecord:{...ref(cp+'/INDEX_BEFORE.json'),jsonPath:'activeWork.current.'+key},note:key==='pendingNeonatalLobarDraft'?'Included in the separate pendingPosteriorLobarDraft ancestor chain; not installed.':'Exact parentcf3 stock partition10passed212; full suite still open.'};
}
assert(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size);
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));saveIndex(index);
const intro='## Current: release repairs sealed; verification queued — 31 October 2026\n\nWebsite79f451df contains17test repairs; product and protected Review inputs unchanged. Combined regression execution awaits adequate RAM. Installed quick review remains available. Separate Atlasd9bdfa1c draft verified and unimported.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Candidate '+root+'. Checklist434; revalidate session61701 and indexed admission process.\n');const size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:434,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:434,selectedFiles:selected.size,indexBytes:Buffer.byteLength(JSON.stringify(index)+'\n')}));
