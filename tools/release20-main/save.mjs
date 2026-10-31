import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {backup,sha,read,json,runGit} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const recipes='G:/VisibleMedicine-temp/proposals/20261031-release20-main',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release19-progress',stage='G:/VisibleMedicine-temp/staging/20261031-release20-initial',site='F:/VisibleMedicine/website';
const ref=p=>({path:p,sha256:sha(read(p))}),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const b=Buffer.isBuffer(v)?v:Buffer.from(typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');if(fs.existsSync(p)){assert.deepEqual(read(p),b,p);return;}fs.writeFileSync(p,b,{flag:'wx'});};
assert(!fs.existsSync(cp+'/checkpoint.json'));const start=read('CURRENT_CHECKPOINT.json'),i=JSON.parse(start),c=i.activeWork.current,at=new Date().toISOString();
const candidate='G:/VisibleMedicine-temp/staging/20261031-release20-followup',source=json(candidate+'/SOURCE.json');assert.equal(ref(candidate+'/SOURCE.json').sha256,'a70e361cc0ade780d58f34512702d71b2d5abe36a4c4dee48380e981f59487b2');assert.equal(ref(stage+'/SOURCE.json').sha256,'8532b8971db6e4d480645b61354e7fa1b291fe5c8e4862c9e677e1fa67f99edc');
for(const row of source.sourceRows)assert.equal(ref(source.website+'/'+row.path).sha256,row.sha256,row.path);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),c.currentInstalled.websiteHead);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),c.currentInstalled.atlasHead);
assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,c.currentInstalled.review);
const focused=json(stage+'/FOCUSED.json');assert(focused.result.process.terminalObserved);assert.equal(focused.beforeRows,focused.afterRows);
const tap=read(stage+'/focused-1/runner.stdout.log').toString(),counts={};
for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const matches=[...tap.matchAll(new RegExp('^# '+name+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,name);counts[name]=Number(matches[0][1]);}
const failures=[...tap.matchAll(/^not ok (\d+) - ([^\r\n]+)\r?\n([\s\S]*?)(?=^# Subtest:|^1\.\.|^# tests |$(?![\s\S]))/gm)].map(m=>({index:+m[1],name:m[2],detail:m[3]}));
const followup=json(candidate+'/FOCUSED.json');assert(followup.result.passing&&followup.result.process.terminalObserved);assert.equal(followup.beforeRows,followup.afterRows);
const followupTap=read(candidate+'/focused-1/runner.stdout.log').toString(),followupCounts={};for(const name of ['tests','pass','fail','skipped','cancelled','todo']){const m=[...followupTap.matchAll(new RegExp('^# '+name+' (\\d+)\\r?$','gm'))];assert.equal(m.length,1,name);followupCounts[name]=Number(m[0][1]);}assert.equal(followupCounts.fail,0);assert.equal(followupCounts.skipped,0);
write(cp+'/INDEX_BEFORE_FINALIZE.json',start);write(cp+'/release20/FAILURES.json',{counts,failures});
for(const [label,dir,files]of [
 ['release19-initial','G:/VisibleMedicine-temp/staging/20261031-release19-initial',['SOURCE.json','COMPOSITION.json','ATLAS_IDENTITY.json','FOCUSED.json']],
 ['release19-followup','G:/VisibleMedicine-temp/staging/20261031-release19-followup',['SOURCE.json','COMPOSITION.json','pure-followup/RESULT.json']],
 ['release20',stage,['SOURCE.json','COMPOSITION.json','FOCUSED.json','focused-1/runner.stdout.log','focused-1/runner.stderr.log','focused-1/PROCESS-TERMINAL.json']],
 ['release20-followup',candidate,['SOURCE.json','COMPOSITION.json','FOCUSED.json','focused-1/runner.stdout.log','focused-1/runner.stderr.log','focused-1/PROCESS-TERMINAL.json']],
])for(const file of files)write(cp+'/'+label+'/'+file,read(dir+'/'+file));
const selected=new Map();
for(const dir of ['G:/VisibleMedicine-temp/staging/20261031-release19-initial','G:/VisibleMedicine-temp/staging/20261031-release19-followup',stage,candidate])
 for(const row of json(dir+'/COMPOSITION.json').patches){assert(row.path.startsWith('tests/'));selected.set('website/'+row.path,source.website+'/'+row.path);}
for(const [p]of [...json(recipes+'/INPUTS.json'),...json(recipes+'/FOLLOWUP_INPUTS.json')]){
 const name=path.basename(p);write(cp+'/proposals/'+name+'/MANIFEST.json',read(p+'/MANIFEST.json'));
 for(const file of ['HANDOFF.md','HANDOFF.txt'])if(fs.existsSync(p+'/'+file))write(cp+'/proposals/'+name+'/'+file,read(p+'/'+file));
 for(const file of ['prepare.mjs','seal.mjs'])if(fs.existsSync(p+'/'+file))selected.set('tools/'+name+'/'+file,p+'/'+file);
}
for(const file of ['prepare.mjs','integrate.mjs','prepare-check.mjs','check.mjs','prepare-followup.mjs','integrate-followup.mjs','prepare-followup-check.mjs','check-followup.mjs','save.mjs'])selected.set('tools/release20-main/'+file,recipes+'/'+file);
for(const file of ['check-lower-pure.mjs','check-lower-clinical.mjs','integrate-release19.mjs','check-release19.mjs','integrate-release19-followup.mjs','check-release19-pure.mjs','record-partition20.mjs'])selected.set('tools/release19-main/'+file,'G:/VisibleMedicine-temp/proposals/20261031-release18-main/'+file);
const files=[...selected].map(([path,local])=>({path,bytes:read(local).length,sha256:sha(read(local))}));
const verify=()=>{for(const row of files)assert.equal(ref(selected.get(row.path)).sha256,row.sha256,row.path);};verify();
for(const [p,local]of selected)write(cp+'/source/'+p,read(local));
const oldChecklist=json(site+'/docs/completion-checklist.json');assert.equal(oldChecklist.revision,459);assert.equal(read(site+'/docs/completion-checklist.md').toString(),renderChecklist(oldChecklist));
const proof={lowerPurePass:9,lowerClinicalPass:1,release19InitialPass:6,release19FollowupPass:13,release20:counts,release20Followup:followupCounts,initialFocusedFailureResolved:true,sourceRowsUnchanged:followup.afterRows,protectedInputs:json(candidate+'/COMPOSITION.json').protectedInputs,productChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false};
assert(json('G:/VisibleMedicine-temp/staging/20261031-release18-final/pure-lower/RESULT.json').passed);
assert(json('G:/VisibleMedicine-temp/staging/20261031-release18-final/CLINICAL.json').result.passing);
assert(json('G:/VisibleMedicine-temp/staging/20261031-release19-initial/FOCUSED.json').result.passing);
assert(json('G:/VisibleMedicine-temp/staging/20261031-release19-followup/pure-followup/RESULT.json').passed);
const backed=backup({root:recipes+'/github-recovery',repo:recipes+'/source-only-backup.git',branch:'backup/release20-followup-20261031',files,bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(candidate+'/SOURCE.json'),review:source.review,websiteHead:source.websiteHead},scope:'Selected test source, text-only test fixtures and validation recipes only. No scans, patient identifiers, images, meshes, databases, generated runtime or canonical Git ancestry. Scoped source delta; earlier backups retained.',proof,verifySource:verify});
assert(backed.sourceBackupVerified);write(cp+'/github-backup.json',read(recipes+'/github-recovery/github-backup.json'));
const summary=`Lower-limb checks passed9+1 and release19 repairs passed6+13. Release20 focused run finished${counts.pass}pass/${counts.fail}fail; its remaining reasoning failure and imaging-status check now pass all${followupCounts.pass}followup cases. Practice navigation24cases, protected Review and six-section cardiac preservation passed. Original partition20 failures retained; two delivery roots remain before broader checks. Installed website unchanged.`;
const next='Continue from release20-followup SOURCEa70e361c... and its exact terminal focused receipt. The remaining partition20 roots are clinical-review-leg-venous-xray.test.ts and clinical-review-upper-limb-completion-quiz.test.ts; preserve historical proofs while checking actual current delivery. Upper-limb old dispatcher epoch identified in G:/VisibleMedicine-temp/proposals/20261031-release20-reasoning/DISPATCH_EPOCH.json. Continue remaining release partitions before pending UI/Atlas installation; retain Windows symlink coverage gap. Whole71requirements/eightideas remain active.';
const list=structuredClone(oldChecklist);list.revision=460;list.updatedAt=at.slice(0,10);list.roots.releasetwentyfollowup=cp;list.items.find(row=>row.id==='REL-01').evidence.push('releasetwentyfollowup:checkpoint.json');list.changeLog.unshift({revision:460,date:list.updatedAt,change:summary});validateChecklist(list);
assert.deepEqual(list.items.map(({id,status,acceptance})=>({id,status,acceptance})),oldChecklist.items.map(({id,status,acceptance})=>({id,status,acceptance})));
write(cp+'/CHECKLIST_BEFORE.json',oldChecklist);write(cp+'/CHECKLIST_AFTER.json',list);write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));
write(cp+'/checkpoint.json',{schema:'vm-release-twenty-followup/1',at,proof,prior:c.latestCheckpoint,candidate:ref(cp+'/release20-followup/SOURCE.json'),focused:ref(cp+'/release20/FOCUSED.json'),followup:ref(cp+'/release20-followup/FOCUSED.json'),failures:ref(cp+'/release20/FAILURES.json'),partition20:ref(cp+'/PARTITION20_FAILURES.json'),sourceBackup:ref(cp+'/github-backup.json'),next});
const checkpoint=ref(cp+'/checkpoint.json');c.latestCheckpoint=checkpoint;c.latestSourceOnlyBackup={...ref(cp+'/github-backup.json'),verified:true,wholeProjectBackup:false};
c.currentReleaseQueue={prior:{...ref(cp+'/INDEX_BEFORE_FINALIZE.json'),jsonPath:'activeWork.current.currentReleaseQueue'},state:'release20-focused-passed-two-delivery-repairs-remain',stage:candidate,source:ref(candidate+'/SOURCE.json'),checkpoint,wholeSuitePassing:false,installed:false};
c.activeExecutionSessions=[];c.next=next;c.lastPriorityReassessment={at,priority:'Finish source-bound navigation and teaching delivery verification for pending UI installation, then continue all remaining roadmap work.',clinicalReviewIsNotProjectBlocker:true};
i.goal.previousTurn='progress';i.activeWork.updated=at;i.activeWork.lastUpdated=at;
const intro='## Current: review/navigation verification — 31 October 2026\n\n'+summary+'\n\nCheckpoint:'+cp+'/checkpoint.json\n\n';
const map=Buffer.from(intro+'Canonical sources/reviews on F; temporary files on G. Current pointers: CURRENT_CHECKPOINT.json. Checklist460.\n'),mapSize=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=mapSize);
write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:site+'/docs/master-plan.md',previous:ref(site+'/docs/master-plan.md'),prefix:intro});write(cp+'/INDEX_AFTER.json',i);
assert.equal(sha(read('CURRENT_CHECKPOINT.json')),sha(start));assert(Buffer.byteLength(JSON.stringify(i)+'\n')<=start.length);
fs.writeFileSync(site+'/docs/completion-checklist.json',JSON.stringify(list,null,2)+'\n');fs.writeFileSync(site+'/docs/completion-checklist.md',renderChecklist(list));saveIndex(i);
const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(mapSize-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
fs.writeFileSync(site+'/docs/master-plan.md',intro+read(site+'/docs/master-plan.md').toString());
write(cp+'/SAVED.json',{at,checkpoint,checklist:460,index:ref('CURRENT_CHECKPOINT.json'),sourceBackup:ref(cp+'/github-backup.json')});console.log(JSON.stringify({saved:true,checkpoint,proof,sourceBackupVerified:true}));
