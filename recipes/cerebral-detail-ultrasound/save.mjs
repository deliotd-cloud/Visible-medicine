import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-cerebral-detail-ultrasound',atlas='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us/atlas',canonical='F:/VisibleMedicine/website';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-cerebral-detail-ultrasound-draft',prior='F:/VisibleMedicine/recovery/checkpoints/20261031-release-eleven-source-sealed';
const ref=p=>({path:p,sha256:hash(p)}),read=p=>fs.readFileSync(p),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const inspection=json(root+'/SOURCE_INSPECTION.json');
function verify(){
 for(const row of inspection.sourceFiles)assert.equal(hash(root+'/files/'+row.path),row.sha256,row.path);
 for(const row of inspection.baselineFiles)assert.equal(hash(row.path),row.sha256,row.path);
 const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
 assert.equal(git('rev-parse','HEAD'),inspection.parent.head);assert.equal(git('status','--porcelain'),'');
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
}
verify();const at=new Date().toISOString(),cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md',checklist=json(cf),old=structuredClone(checklist);
assert.equal(checklist.revision,434);assert.equal(read(mf).toString(),renderChecklist(old));assert(!fs.existsSync(cp));
write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
for(const p of ['SOURCE_INSPECTION.json','HANDOFF.md','RESULT.json'])write(cp+'/'+p,read(root+'/'+p));
write(cp+'/RELEASE_TERMINAL.json',read(prior+'/ADMISSION_TERMINAL.json'));
write(cp+'/RESEARCH.json',{checkedOn:at.slice(0,10),references:[{key:'cerebralNeonatalUS',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7897227/',locations:['Temporal lobe, Figures11–12','Medial temporal lobe, Figure13','Lateral sulcus, Figure15'],use:'Original factual teaching only. Non-commercial manuscript images, figures and source prose are not redistributed.'},{key:'cerebralNeonatalUSWindow',url:'https://efsumb.org/wp-content/uploads/2022/03/neonatal_cranial_ultrasound_safety_aspects_update2022_final.pdf',use:'Existing reference retained; no PDF or illustration distributed.'}],newSoftwareDependencies:0,newAssets:0,patientData:0,clinicalApproval:false});
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,rel+'/');else selected.set(rel,dir+'/'+e.name);}}
collect(prior+'/selected-source');for(const row of inspection.sourceFiles)selected.set('atlas/'+row.path,root+'/files/'+row.path);
for(const p of ['inspect-source.mjs','save.mjs'])selected.set('recipes/cerebral-detail-ultrasound/'+p,root+'/'+p);
selected.set('plans/cerebral-detail-ultrasound.md',root+'/HANDOFF.md');selected.set('plans/cerebral-detail-ultrasound-evidence.json',cp+'/RESEARCH.json');
for(const [rel,p]of selected){const dest=cp+'/selected-source/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});if(p.startsWith(prior+'/selected-source/'))fs.linkSync(p,dest);else fs.copyFileSync(p,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),hash(p));}
let sourceBackup;
try{backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/cerebral-detail-ultrasound-draft-20261031',files:[...selected].map(([rel,p])=>({path:rel,sha256:hash(p),bytes:fs.statSync(p).size})),bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(cp+'/SOURCE_INSPECTION.json')},scope:'Selected implementation source, original teaching drafts and recovery recipes only. Source proposal remains unintegrated and clinically unapproved. No models, imaging, masks, private data, decisions, article text or figures, raw ancestry or logs.',proof:{at,staticSourceInspection:true,syntaxChecked:true,runtimeTestsPassed:false,generated:false,installed:false,clinicalApproval:false,wholeSuitePassing:false},verifySource:verify});sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};}
catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const next='Keep current quick review installed. Website79f451df17test repairs remain sealed and unverified; session61701 is terminal, no tests launched because4096MiB capacity was unavailable. Retry adjacent roots and full partition11 only after observed adequate RAM; no weakened guards or empty repeated waits. Atlasd9bdfa1c is verified/unimported. New cerebral-detail ultrasound proposal prepares4original drafts for8paired selections; source/syntax inspection only. Integrate via full teaching/history/renderer pipeline and measure all review-revision changes, including the hippocampal scope note; no approval migration. Preserve71requirements/eightideas and remaining full suite/build/release requirements.';
write(cp+'/checkpoint.json',{schema:'vm-cerebral-detail-ultrasound-draft/1',at,source:ref(cp+'/SOURCE_INSPECTION.json'),research:ref(cp+'/RESEARCH.json'),releaseTerminal:ref(cp+'/RELEASE_TERMINAL.json'),sourceBackup,prior:ref(prior+'/checkpoint.json'),draftSections:4,intendedPlacements:8,newWords:176,sourceInspectionOnly:true,runtimeValidated:false,generated:false,installed:false,clinicalApproval:false,wholeSuitePassing:false,next});
const cpRef=ref(cp+'/checkpoint.json');
checklist.revision=435;checklist.updatedAt=at.slice(0,10);checklist.roots.cerebralusdetail=cp;
for(const id of ['TEACH-01','TEACH-07','REL-01'])checklist.items.find(x=>x.id===id).evidence.push('cerebralusdetail:checkpoint.json');
checklist.changeLog.unshift({revision:435,date:checklist.updatedAt,change:'Prepared4original neonatal ultrasound drafts for8paired insular,hippocampal and superior-temporal selections. Syntax,exact source bindings and reversal of adjacent changes inspected; runtime tests/generation/import remain pending. Website79f451df admission terminated without launching tests after10samples below4096MiB. Installed quick review and complete71requirements/eightideas unchanged.'});
validateChecklist(checklist);assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
current.latestCheckpoint=cpRef;if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.activeExecutionSessions=[];current.activeDelegation={completed:true,evidence:ref(cp+'/RESULT.json'),canonicalWrites:false};
current.pendingCerebralDetailUltrasound={proposal:root,checkpoint:cpRef,parentHead:inspection.parent.head,intendedPlacements:8,syntaxChecked:true,runtimeValidated:false,installed:false};
current.next=next;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index at original JSON paths. Missing detail is not approval or completion.'};
if(Buffer.byteLength(JSON.stringify(index)+'\n')>fs.statSync('CURRENT_CHECKPOINT.json').size-64){current.pendingPartitionTenRepair={historicalRecord:{...ref(cp+'/INDEX_BEFORE.json'),jsonPath:'activeWork.current.pendingPartitionTenRepair'},note:'Parentcf3 partition10passed212; complete source-matched suite remains open.'};}
assert(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size);
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(checklist));saveIndex(index);
const intro='## Current: cerebral ultrasound drafts saved; release tests deferred — 31 October 2026\n\nFour original drafts target8paired selections. Source/syntax inspection complete; runtime verification,generation and clinical review remain pending. Website79f451df sealed; session61701terminal without launching tests due to insufficient memory. Installed quick review unchanged.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Proposal '+root+'. Checklist435; no active test process.\n');const size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:435,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:435,selectedFiles:selected.size,indexBytes:Buffer.byteLength(JSON.stringify(index)+'\n')}));
