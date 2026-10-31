import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-review-readable-groups', cp='F:/VisibleMedicine/recovery/checkpoints/20261031-review-navigation-and-import-audit';
const prior='F:/VisibleMedicine/recovery/checkpoints/20261030-release-epochs-and-notices-verified',site='F:/VisibleMedicine/website';
const groups='G:/VisibleMedicine-temp/proposals/20261030-review-readable-groups', audit='G:/VisibleMedicine-temp/proposals/20261030-distribution-import-reconciliation';
const release='G:/VisibleMedicine-temp/staging/20261030-release-notices-successor', repairs='G:/VisibleMedicine-temp/proposals/20261031-partition5-epoch-repairs/website';
const source=json(root+'/SOURCE.json'),at=new Date().toISOString(),read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)});
const write=(p,value)=>{const bytes=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');if(fs.existsSync(p)){assert(read(p).equals(bytes),'Existing evidence differs: '+p);return;}fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes,{flag:'wx'});};
function verify(){
 assert(json(root+'/BUILD_RESULT-3.json').passing);assert(json(root+'/SCOPED_TYPES.json').passing);
 assert.equal(json(groups+'/FOCUSED_RESULT-2.json').counts.pass,18);
 for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
 assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
 assert(json(release+'/RELEASE_QUEUE.json').terminal);
 assert.equal(json(audit+'/MAIN_VERIFICATION.json').unexplainedWithinScope,0);
}
verify();assert(!fs.existsSync(cp+'/checkpoint.json'));write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
for(const p of ['SOURCE.json','SCOPED_TYPES.json','BUILD_RESULT-1.json','BUILD_RESULT-2.json','BUILD_RESULT-3.json','BUILD_CHILD-2.json','BUILD_CHILD-3.json',
 'build-1/PROCESS-TERMINAL.json','build-1/runner.stdout.log','build-1/runner.stderr.log','build-2/PROCESS-TERMINAL.json','build-2/runner.stdout.log','build-2/runner.stderr.log',
 'build-3/PROCESS-TERMINAL.json','build-3/runner.stdout.log','build-3/runner.stderr.log','browser/observations.json','browser/collision-selected.png'])write(cp+'/'+p,read(root+'/'+p));
for(const p of ['FOCUSED_SOURCE.json','FOCUSED_SOURCE-2.json','FOCUSED_RESULT.json','FOCUSED_RESULT-2.json','focused.tap','focused-2.tap','installed-inbox-observation.png'])write(cp+'/focused/'+p,read(groups+'/'+p));
for(const p of ['REPORT.md','EVIDENCE.json','MAIN_VERIFICATION.json','verify-main.mjs'])write(cp+'/import-audit/'+p,read(audit+'/'+p));
for(const p of ['RELEASE_QUEUE.json','PARTITION_RESULT-4.json','PARTITION_RESULT-5.json','partition-4/runner.stdout.log','partition-5/runner.stdout.log'])write(cp+'/release/'+p,read(release+'/'+p));
const run=JSON.parse(read(release+'/partition-5/runner.stdout.log').toString().trim().split('\n').at(-1)).output;
for(const p of ['child.tap','child.log','receipt.json'])write(cp+'/release/partition-5/'+p,read(run+'/'+p));
const proposalFiles=['atlas-runtime-expansion-binding.test.mjs','clinical-review-nasal-bone-surface-imaging.test.ts','colic-fa1-historical-closure.test.mjs','current-atlas-delivery-help-transition.test.mjs','partition5-history-context.mjs'];
for(const p of proposalFiles)write(cp+'/unverified-partition5-proposal/tests/'+p,read(repairs+'/tests/'+p));
const dimensions=json(root+'/browser/dimensions.json');assert.equal(dimensions.sha256,hash(root+'/browser/collision-selected.png'));assert.equal(dimensions.width,1280);assert.equal(dimensions.height,720);write(cp+'/browser/dimensions.json',dimensions);
const proof={at,source:ref(cp+'/SOURCE.json'),focusedTests:18,scopedTypeGraph:198,scopedTypesPassed:true,fullTypesPassed:false,productionBuildPassed:true,
 buildAttempt:3,earlierNativeBuildFailuresRetained:true,successfulBuildLimits:{heapMiB:1536,aggregateMiB:4096,minimumAvailableMiB:6144},
 browser:{synthetic:true,width:1280,height:720,regionFiltering:true,collisionsRemainDistinct:true,exactDestination:true,refreshPreservesGroup:true,keyboardTrackSwitch:true,temporaryTabAndServerClosed:true,clinicalActions:0},
 installedInboxObservedReadOnly:true,installedInboxFullAcceptance:ref('F:/VisibleMedicine/recovery/checkpoints/20261030-quick-review-local-install/BROWSER_ACCEPTANCE.json'),
 integrationUnchanged:'d98623af51b216359fdd7385148ca0beaa46f0c3866ae9f867202a48770d5799',installed:false,
 importAudit:{source:'c62dcfae5cf9e0d6a48120e5e4673f1199ce2efbd5a399aac252f0c849aa12fa',edges:95,generated:39,platform:56,unexplainedWithinRecordedEdges:0,licensingCleared:false},
 release:{source:'2ef834f9fc79c5ec3921a8920e691ce504d5dea88bf4849de2428b7abda9fe91',partition4:{tests:235,pass:235,fail:0},partition5:{tests:336,pass:330,fail:6},terminal:true,sourceDrift:false,assetDrift:false,repairProposalTested:false},
 wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false};write(cp+'/VERIFICATION.json',proof);
const selected=new Map();function collect(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())collect(dir+'/'+e.name,p+'/');else selected.set(p,dir+'/'+e.name);}}
collect(prior+'/selected-source');for(const p of source.changedPaths)selected.set('website/'+p,source.website+'/'+p);
for(const p of ['prepare.mjs','scoped-types.mjs','build.mjs','build-2.mjs','build-3.mjs','build-only.mjs','build-diagnostic.mjs','build-diagnostic-3.mjs','browser-fixture.mjs','save.mjs'])selected.set('recipes/readable-review-groups/'+p,root+'/'+p);
for(const [p,file]of selected)write(cp+'/selected-source/'+p,read(file));
const files=[...selected].map(([p,file])=>({path:p,sha256:hash(file),bytes:fs.statSync(file).size}));
backup({root:cp+'/source-only-backup',repo:root+'/source-only-backup.git',branch:'backup/review-navigation-audit-20261031',files,bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:proof.source},
 scope:'Selected website sources and synthetic verification recipes only, with prior selected-source checkpoint content retained. Human-readable review groups keep exact identifiers and decision scopes. No scan/image/model assets, private browser evidence, raw distribution inventories or raw canonical ancestry. Local installed review remains unchanged. Release partition5 repairs are saved locally and unverified; excluded from this source backup.',proof,verifySource:verify});
const checkpoint={schema:'vm-review-navigation-and-import-audit/1',at,source:proof.source,verification:ref(cp+'/VERIFICATION.json'),sourceBackup:ref(cp+'/source-only-backup/github-backup.json'),prior:ref(prior+'/checkpoint.json'),installed:false,wholeSuitePassing:false,
 next:'Review and integrate the saved partition5 proposal, run focused validation, then resume the stock release campaign on coherent source. The new group labels are built and browser-checked but not installed; keep owner review preview available. Preserve the full71/eight-idea roadmap and remaining licence gaps.'};
write(cp+'/checkpoint.json',checkpoint);const cpRef=ref(cp+'/checkpoint.json');
const cf=site+'/docs/completion-checklist.json',mf=site+'/docs/completion-checklist.md',c=json(cf),old=structuredClone(c);assert.equal(c.revision,409);assert.equal(read(mf).toString(),renderChecklist(old));write(cp+'/CHECKLIST_BEFORE.json',read(cf));
c.revision=410;c.updatedAt=at.slice(0,10);c.roots.reviewnav=cp;for(const id of ['REL-01','REL-02','UX-01'])c.items.find(i=>i.id===id).evidence.push('reviewnav:checkpoint.json');
c.changeLog.unshift({revision:410,date:c.updatedAt,change:'Readable review-group labels preserve exact source keys;18focused checks,198-file scoped type graph and production build pass, with synthetic1280x720 browser evidence. Native low-cap build failures retained.95recorded distribution import edges independently reconciled; broader licensing remains open. Stock partition4 passes235; partition5 stops330pass/6fail with no source/assets drift. Unverified repair proposal saved. Installed review preview unchanged.'});
validateChecklist(c);assert.equal(c.items.length,71);assert.equal(c.items.filter(i=>i.scope==='optional').length,8);assert.deepEqual(c.items.map(({id,status})=>({id,status})),old.items.map(({id,status})=>({id,status})));
fs.writeFileSync(cf,JSON.stringify(c,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(c));write(cp+'/CHECKLIST.json',{revision:410,requirements:71,optional:8,statusesUnchanged:true,json:ref(cf),markdown:ref(mf)});
const index=json('CURRENT_CHECKPOINT.json'),v=index.activeWork.current;v.latestCoordination=cpRef;v.latestChecklistUpdate=ref(cp+'/CHECKLIST.json');v.latestSourceBackup=checkpoint.sourceBackup;
v.activeExecutionSessions=[];v.pendingReadableReviewGroups={stage:root,source:proof.source,verification:checkpoint.verification,buildPassed:true,focusedTests:18,scopedTypeGraph:198,installed:false};
v.latestReleaseQueue={checkpoint:cpRef,path:release+'/RELEASE_QUEUE.json',terminal:true,partition4Passed:235,partition5Passed:330,partition5Failed:6,wholeSuitePassing:false};
v.pendingPartition5Repair={proposal:repairs,localRecovery:cp+'/unverified-partition5-proposal',files:5,tested:false,installed:false};
v.beforeFurtherWork='All owned build/test/QA processes are terminal. Stock queue stopped at partition5 with6failures. Read latest saved proposal before launching checks. Owner installed preview remains running; do not reinstall later staged source without reconciling preview policy.';
v.next=checkpoint.next;v.lastUpdated=at;v.lastPriorityReassessment={at,priority:'Finish source-epoch release regression repair, preserve the installed quick-review flow, and integrate verified review navigation coherently.',clinicalReviewIsNotProjectBlocker:true};
index.next=v.next;index.activeWork.updated=at;index.activeWork.lastUpdated=at;index.goal.previousTurn='progress';saveIndex(index);
const intro='## Current: Review navigation and distribution audit verified — 31 October 2026\n\nReadable group names pass18focused checks, scoped types and production build; synthetic desktop checks preserve exact destinations and refresh state.95recorded import edges reconciled. Stock partition4 passes235; partition5 stops at330pass/6fail. Its repair proposal is saved but untested. Installed quick review remains available.\n\nCheckpoint:'+cpRef.path+' ('+cpRef.sha256+').\n\n';
const map=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Installed c32/Review3648 unchanged. Candidate G:/VisibleMedicine-temp/staging/20261031-review-readable-groups, source0d74/Reviewd986. All owned jobs terminal. Checklist410 preserves71requirements/eightideas. Selected-source GitHub readback verified.\n');
const size=fs.statSync('WORKSPACE_MAP.md').size;assert(map.length<=size);write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([map,Buffer.alloc(size-map.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=site+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify previous bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup:checkpoint.sourceBackup,checklist:410,index:ref('CURRENT_CHECKPOINT.json'),goalActive:true,ownerPreviewChanged:false});console.log(JSON.stringify({checkpoint:cpRef,checklist:410,selectedSourceFiles:files.length,sourceBackup:checkpoint.sourceBackup}));
