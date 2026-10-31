import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-brand-provenance',site=root+'/website',source=json(root+'/SOURCE.json');
const prior='F:/VisibleMedicine/recovery/checkpoints/20261031-head-focus-font-verified';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-brand-provenance-verified',canonical='F:/VisibleMedicine/website';
const read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)});
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
function verify(){
 assert.equal(hash(root+'/SOURCE.json'),'38961fa91329cc4dcf69130386da65fe5a59cb94e4e7ac373655133d9c858f3a');
 for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const r of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 assert.equal(json(canonical+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
 assert.match(read(root+'/FOCUSED.tap').toString(),/^ℹ pass 5\r?$/m);assert.match(read(root+'/FOCUSED.tap').toString(),/^ℹ fail 0\r?$/m);
}
verify();assert(!fs.existsSync(cp));const at=new Date().toISOString();
write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
for(const p of ['SOURCE.json','PREPARED.json','FOCUSED.tap','ASSET_CHECK.json'])write(cp+'/'+p,read(root+'/'+p));
const build='G:/VisibleMedicine-temp/staging/20261031-head-focus-font-verified';
for(const p of ['BUILD_RESULT.json','build-bounded.mjs','build-child.mjs','build-bounded-1/PROCESS-TERMINAL.json','build-bounded-1/CONFIGURATION.json','build-bounded-1/MEMORY-BEFORE.json','build-bounded-1/memory.jsonl','build-bounded-1/runner.stdout.log','build-bounded-1/runner.stderr.log'])write(cp+'/build-trial/'+p,read(build+'/'+p));
write(cp+'/asset-audit-findings.txt',read('G:/VisibleMedicine-temp/proposals/20261031-public-asset-release-audit/findings.txt'));
const proof={at,source:ref(cp+'/SOURCE.json'),assets:{files:12,sourceMasters:2,originalPackByteMatches:true,adoptionCommit:'ff984ea1f714594f2d93aad332f25073156a8e13',commitByteMatches:true,recipeInspectedNotRerun:true,artworkChanged:false,blanketRightsClearance:false},checks:{passed:5,failed:0,skipped:0,negativeCases:['same-size logo byte change','additional unrecorded asset','changed original manifest'],allProtectedInputsUnchanged:true,fullSuitePassed:false},runtime:{unchangedFromParent:true,review:source.review,installedReview:'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f'},fullWebsiteBuild:{result:ref(cp+'/build-trial/BUILD_RESULT.json'),passed:false,terminal:true,reason:'Lower 3072MiB aggregate ceiling trial failed native allocation during client compilation after SSR completed. Source verified unchanged; no automatic repeat under unchanged capacity.',normalAdmissionMiB:5632,freeReserveMiB:2048},quickReview:{installedPreviously:true,liveListenerPid:106988,visibleControlsRechecked:true,observed:['Quick review','Anatomy / Teaching','Group','Start review','Approve & next instructions'],newReviewDecisions:0,restarted:false},installed:false,publicDeployment:false,clinicalApproval:false};
write(cp+'/VERIFICATION.json',proof);
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,p+'/');else selected.set(p,dir+'/'+e.name);}}collect(prior+'/selected-source');
for(const p of source.currentChanges)selected.set('website/'+p,site+'/'+p);
for(const p of ['prepare.mjs','seal.mjs','save.mjs'])selected.set('recipes/brand-provenance/'+p,root+'/'+p);
for(const [p,file] of selected)write(cp+'/selected-source/'+p,read(file));
const files=[...selected].map(([p,file])=>({path:p,sha256:hash(file),bytes:fs.statSync(file).size}));
let sourceBackup;
try{
 backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/brand-provenance-20261031',files,bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:proof.source},scope:'Selected authored source, tests, public software/font notices and brand provenance records only. No scans, masks, anatomy meshes, private decisions/references, actual local browser observations or canonical Git ancestry. Not a whole-project backup. No deployment or clinical approval.',proof:{at,assets:proof.assets,checks:proof.checks,installed:false,fullBuildPassed:false},verifySource:verify});
 sourceBackup={...ref(cp+'/source-only-backup/github-backup.json'),verified:true};
}catch(error){write(cp+'/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false});sourceBackup={...ref(cp+'/SOURCE_BACKUP_FAILURE.json'),verified:false};}
const checkpoint={schema:'vm-brand-provenance-checkpoint/1',at,source:proof.source,verification:ref(cp+'/VERIFICATION.json'),prior:ref(prior+'/checkpoint.json'),sourceBackup,installed:false,wholeSuitePassing:false,next:'Owner quick-review flow is installed and observed. Preserve owner preview. Staged successor retains prior runtime exactly and adds verified12-file brand provenance, original records, corrected documentation and5focused checks. Full website build failed a lower-memory trial and remains open; do not repeat without adequate capacity. Resume applicable release checks when admitted and continue independent source/teaching/reliability work. Preserve all71requirements/eightideas and pending clinical reviews.'};write(cp+'/checkpoint.json',checkpoint);
const cpRef=ref(cp+'/checkpoint.json'),index=json('CURRENT_CHECKPOINT.json'),v=index.activeWork.current;
v.latestCheckpoint=cpRef;if(sourceBackup.verified)v.latestSourceOnlyBackup=sourceBackup;
v.currentStagedCandidate={stage:root,source:proof.source,review:source.review,runtimeUnchangedFromParent:true,installed:false};
v.pendingBrandProvenance={checkpoint:cpRef,source:proof.source,assets:12,focusedPasses:5,installed:false};
v.latestBuildTrial={checkpoint:cpRef,terminal:true,passed:false,sourceUnchanged:true};
v.activeExecutionSessions=[];v.next=checkpoint.next;index.next=checkpoint.next;
v.beforeFurtherWork='Installed Review3648 is running on owner port3000/PID106988; quicker review visibly confirmed without new approvals/restart. Current staged source38961fa9,7317rows,Reviewcd2912d0 retains prior runtime exactly and adds12-asset brand provenance/5focused passes. Full build lower-ceiling trial failed native allocation; source unchanged, all trial processes terminal. No temporary jobs. Public release/full suite/rights and clinical approvals remain open.';
v.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index at original JSON paths, preserving its archive chain. Omitted fields are historical records, not approval or completion.'};
for(const key of ['pendingHeadComparisonKeyboard','latestComparisonRegression','pendingReleaseContextWork','pendingQuickReviewRegions','pendingWebsiteDistributionAudit','pendingReadableReviewGroups','pendingPublicImageDelivery','pendingPartition5Repair','pendingPartition6Repair','pendingPartition7Repair']){if(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size-1024)break;delete v[key];}
assert(Buffer.byteLength(JSON.stringify(index)+'\n')<=fs.statSync('CURRENT_CHECKPOINT.json').size);
const cf=canonical+'/docs/completion-checklist.json',mf=canonical+'/docs/completion-checklist.md',c=json(cf),old=structuredClone(c);
assert.equal(c.revision,419);assert.equal(read(mf).toString(),renderChecklist(old));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
c.revision=420;c.updatedAt=at.slice(0,10);c.roots.brandprovenance=cp;
for(const id of ['REL-01','REL-02'])c.items.find(i=>i.id===id).evidence.push('brandprovenance:checkpoint.json');
c.changeLog.unshift({revision:420,date:c.updatedAt,change:'Verified12existing logos/icons against original brand-pack files, manifest and adoption commit; corrected stale identity documentation and retained portable provenance records.5focused checks pass, including same-size corruption/unrecorded-file/manifest-change rejection. Runtime and protected Reviewinputs unchanged. Lower-memory full-build trial failed native allocation; source unchanged and terminal evidence saved. Installed quick-review flow observed available, no restart or clinical decisions. Full build/suite, complete rights and owner review remain open.'});
validateChecklist(c);assert.equal(c.items.length,71);assert.equal(c.items.filter(i=>i.scope==='optional').length,8);assert.deepEqual(c.items.map(({id,status})=>({id,status})),old.items.map(({id,status})=>({id,status})));
fs.writeFileSync(cf,JSON.stringify(c,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(c));saveIndex(index);
const intro='## Current: brand provenance verified; quick review available — 31 October 2026\n\nTwelve existing logos/icons match their original pack and adoption commit. Staged documentation/provenance checks pass5focused cases; runtime unchanged. Full website build failed its lower-memory trial and remains open. Installed quick review confirmed available, without restart or new decisions.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Candidate '+root+'. Checklist420 retains71requirements/eightideas. No temporary jobs.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);
const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify previous bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:420,index:ref('CURRENT_CHECKPOINT.json'),goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:420,selectedFiles:files.length,ownerPreviewChanged:false}));
