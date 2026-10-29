import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';

const root='G:/VisibleMedicine-temp/staging/20261029-native-successor-generation';
const stage='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor',atlas=stage+'/atlas';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261029-native-generation-verified';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const buf=Buffer.alloc(65536);
function hash(p){const h=createHash('sha256'),fd=fs.openSync(p,'r');try{let n;while((n=fs.readSync(fd,buf,0,buf.length,null)))h.update(buf.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const ref=p=>({path:p,sha256:hash(p)});
function write(p,v){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});}
assert(!fs.existsSync(cp),'Preserve previous checkpoint');
assert.equal(hash(root+'/launch-contained-v7.mjs'),'dab283b7e20b7f8411f02dea1afa8ab1136a071955f9bcd5bd8b56632dceb4ee');
assert.equal(hash(stage+'/PREPARATION.json'),'f1ae317be0b5b862225f47eb1907cdc0378f4a6891e4c779ff0b38b13e1f15ee');
const prep=json(stage+'/PREPARATION.json'),expected=new Map(prep.sourceRows.map(r=>[r.path,r.sha256]));
const commands=[['regional-write','scripts/regional-teaching-snapshots.mjs'],['regional-check','scripts/regional-teaching-snapshots.mjs --check'],['display-write-v6','scripts/generate-body-review-display-pins.mjs'],['display-check-v6','scripts/generate-body-review-display-pins.mjs --check'],['reviews-write','scripts/review-revisions.mjs'],['reviews-check','scripts/review-revisions.mjs --check'],['renderer-write','scripts/body-renderer-revisions.mjs'],['renderer-check','scripts/body-renderer-revisions.mjs --check'],['nested-write','scripts/generate-nested-review-bindings.mjs'],['nested-check','scripts/generate-nested-review-bindings.mjs --check']];
const allowed=new Set(['content/regional-teaching/abdomen.json','content/regional-teaching/forearm.json','content/regional-teaching/head-neck.json','content/regional-teaching/leg.json','content/regional-teaching/shoulder-arm.json','content/body-review-display-pins.json','content/body-renderer-revision.json']);
const changed=new Set(),steps=[];
for(const[attempt,command]of commands){
 const r=json(root+'/'+attempt+'/RESULT.json'),t=json(root+'/'+attempt+'/PROCESS-TERMINAL.json');
 assert.equal(r.command,command);assert(r.passing);assert.equal(r.supervisor.code,0);assert.deepEqual(t,r.process);assert(t.terminalObserved&&!t.interrupted&&t.exitCode===0);
 if(attempt.includes('check'))assert.equal(r.generated.length,0);
 for(const row of r.generated){assert(allowed.has(row.path));assert.equal(expected.get(row.path),row.beforeSha256);expected.set(row.path,row.sha256);changed.add(row.path);}
 steps.push({attempt,command,result:ref(root+'/'+attempt+'/RESULT.json'),terminal:ref(root+'/'+attempt+'/PROCESS-TERMINAL.json')});
}
assert.deepEqual(changed,allowed);assert.equal(expected.size,6484);
for(const[p,h]of expected)assert.equal(hash(atlas+'/'+p),h,p);
assert(!fs.existsSync(root+'/GENERATOR.lock'));
const extra=execFileSync('git',['-C',atlas,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert(extra.every(p=>expected.has(p)));
for(const[repo,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
const deltaPath='G:/VisibleMedicine-temp/staging/20261029-native-teaching-delta/RESULT-1793301113558.json',delta=json(deltaPath);
assert(delta.generatedLessonsMatch&&delta.pinDeltaMatches);assert.equal(delta.expectedChangedTopics.length,44);assert.equal(delta.expectedUnchangedLessons,9892);
for(const r of delta.sourceInputs)assert.equal(hash(r.path),r.sha256,r.path);
assert.match(read(root+'/display-check-v6/runner.stdout.log').toString(),/"worksheets":1104/);
assert.match(read(root+'/nested-check/runner.stdout.log').toString(),/"groups":20,"selections":108,"checked":true/);
write(cp+'/CURRENT_INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
write(cp+'/TEACHING_DELTA.json',read(deltaPath));write(cp+'/PREPARATION.json',read(stage+'/PREPARATION.json'));
for(const p of changed)write(cp+'/generated/'+p,read(atlas+'/'+p));
for(const{attempt}of steps)for(const name of ['RESULT.json','PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log','PREPARATION.json','memory.jsonl','supervise.ps1'])write(cp+'/execution/'+attempt+'/'+name,read(root+'/'+attempt+'/'+name));
for(const name of ['V6_PREPARATION.json','V7_PREPARATION.json'])write(cp+'/execution/'+name,read(root+'/'+name));
const priorFailures=['F:/VisibleMedicine/recovery/checkpoints/20261029-native-regional-generated/checkpoint.json','F:/VisibleMedicine/recovery/checkpoints/20261029-native-display-generated/checkpoint.json'].map(ref);
const sourceRows=[...expected].sort(([a],[b])=>a.localeCompare(b)).map(([p,h])=>({path:p,bytes:fs.statSync(atlas+'/'+p).size,sha256:h}));
const generatedManifest={schema:'vm-native-post-generation/1',at:new Date().toISOString(),atlas,parent:prep.parent,parentHead:prep.parentHead??'4259fd81a7da96945dcd288cb8652dce3421af34',sourceRows,sourceFiles:sourceRows.length,authoredFiles:prep.changes.length,generatedChangedPaths:[...changed],stockGenerationVerified:true,fullTypesPassed:false,fullBuildPassed:false,installed:false,steps};
write(cp+'/SOURCE_AFTER_GENERATION.json',generatedManifest);
const authorBase='F:/VisibleMedicine/recovery/checkpoints/20261029-native-successor-prepared';
const priorBackup=json(authorBase+'/source-only-backup/github-backup.json');assert.equal(priorBackup.head,'642a97bbe1a5fcd66adaf5ad55f257075b616673');
const authorRows=prep.changes.map(r=>({path:r.path,sha256:hash(atlas+'/'+r.path),bytes:read(atlas+'/'+r.path).length}));assert.equal(authorRows.length,28);
const tools=['launch-contained-v6.mjs','prepare-v6.mjs','launch-contained-v7.mjs','prepare-v7.mjs','save-verified.mjs'];
const rows=[...authorRows,...tools.map(n=>({path:'tools/validation/native-generation/'+n,sha256:hash(root+'/'+n),bytes:read(root+'/'+n).length}))];
for(const row of rows)write(cp+'/source/'+row.path,read(row.path.startsWith('tools/')?root+'/'+path.basename(row.path):atlas+'/'+row.path));
const verify=()=>{for(const row of rows)assert.equal(hash(cp+'/source/'+row.path),row.sha256);for(const[p,h]of expected)assert.equal(hash(atlas+'/'+p),h,p);};
const github=backup({root:cp+'/source-only-backup',repo:'G:/VisibleMedicine-temp/staging/20261029-native-generation-verified.git',branch:'backup/native-generation-verified-20261029',files:rows,bytesFor:p=>read(cp+'/source/'+p),sourceIdentity:{preparation:ref(stage+'/PREPARATION.json'),postGeneration:ref(cp+'/SOURCE_AFTER_GENERATION.json')},scope:'28 previously backed-up authored Atlas files plus five bounded generation/recovery tools. Partial source-only recovery. Generated teaching/review files remain in the local F-drive checkpoint. No scans, private records, geometry, generated runtime, approvals or deployment.',proof:{stockStepsPassed:10,bodyWorksheets:1104,nestedGroups:20,nestedSelections:108,changedTopics:44,unchangedLessons:9892,fullBuild:false,installed:false},verifySource:verify,parent:priorBackup.head,parentRepo:'G:/VisibleMedicine-temp/staging/20261029-native-successor-authored.git',parentTree:'15773330fa8ca61177fa2ed7d91a5e0c2c4bf1d5'});
write(cp+'/REPORT.md','# Native teaching generation verified\n\nThe exact staged Atlas completed all ten stock generation/check steps: regional teaching, body worksheet display pins, shoulder review fingerprints, body renderer fingerprints and nested review bindings. The five regional snapshots contain exactly 44 intended topic changes and preserve 9,892 other lessons. The stock display check recalculated all 1,104 worksheet preimages; 20 nested groups and 108 selections match their source bindings. Seven generated files changed.\n\nThe original 512 MiB display job exited 0xc0000409 without writing outputs. A 1,024 MiB job with a higher 3,072 MiB admission completed it, retaining the 2 GiB free reserve. A later admission refusal was safely resumed using independently checked, pinned successful receipts. Original failures and all completed evidence are retained. No live process remains.\n\nAll 6,484 source files were reconciled after generation. The 28 authored files and five recovery tools were independently restored from the source-only GitHub branch. Generated teaching and bindings are saved on F only. This is not a whole-project or patient-data backup.\n\nThe full application type check, production build, exports and website import remain pending. The separate four-limbic-quiz and mixed-choice UI proposals are not included in this candidate. The normal review website, WSL, source scans/masks and clinical approval state are unchanged.\n');
const checkpoint={schema:'vm-native-generation-verified/1',at:new Date().toISOString(),source:ref(cp+'/SOURCE_AFTER_GENERATION.json'),teaching:ref(cp+'/TEACHING_DELTA.json'),priorFailures,stockStepsPassed:10,bodyWorksheets:1104,nestedGroups:20,nestedSelections:108,changedTopics:44,unchangedLessons:9892,generatedFiles:changed.size,authoredFiles:28,github:{...ref(cp+'/source-only-backup/github-backup.json'),head:github.head,tree:github.tree,sourceBackupVerified:github.sourceBackupVerified},fullTypesPassed:false,fullBuildPassed:false,exportsProduced:false,websiteImported:false,installed:false,ownerPreviewChanged:false,clinicalApproval:false};
write(cp+'/checkpoint.json',checkpoint);
const checklistFile='F:/VisibleMedicine/website/docs/completion-checklist.json',md='F:/VisibleMedicine/website/docs/completion-checklist.md',old=json(checklistFile),next=structuredClone(old);
assert.equal(next.revision,376);next.revision=377;next.updatedAt='2026-10-29';next.roots.nativegeneration=cp;
const item=next.items.find(i=>i.id==='ASSESS-02');item.evidence.push('nativegeneration:checkpoint.json');item.completionNote+=' Exact staged generation now passes ten stock commands, including all 1,104 body worksheet preimages and 108 nested selections. The 41 quiz placements plus three imaging topics yield exactly 44 changed lessons, with 9,892 unchanged. Full types/build/export/import and separate limbic/choice-order proposals remain pending; installed and clinical status unchanged.';
next.changeLog.unshift({revision:377,date:'2026-10-29',change:'Completed exact staged native teaching and review generation with full source reconciliation; no installation or approval-state change.'});validateChecklist(next);assert.equal(next.items.length,71);assert.equal(next.items.filter(i=>i.scope==='optional').length,8);
for(const row of old.items){const n=next.items.find(i=>i.id===row.id);assert.equal(n.status,row.status);if(row.id!=='ASSESS-02')assert.deepEqual(n,row);}
write(cp+'/checklist/before.json',read(checklistFile));write(cp+'/checklist/before.md',read(md));fs.writeFileSync(checklistFile,JSON.stringify(next,null,2)+'\n');fs.writeFileSync(md,renderChecklist(next));assert.deepEqual(json(checklistFile),next);
write(cp+'/checklist/RESULT.json',{revision:377,items:71,optionalIdeas:8,statusesUnchanged:true,validatedAndRendered:true,checklist:ref(checklistFile),markdown:ref(md)});
const index=json('CURRENT_CHECKPOINT.json'),before=structuredClone(index),c=index.activeWork.current;
c.latestCoordination=ref(cp+'/checkpoint.json');c.latestChecklistUpdate=ref(cp+'/checklist/RESULT.json');c.activeExecutionSessions=[];
c.pendingNativeTeachingCandidate.stockGenerationPending=false;c.pendingNativeTeachingCandidate.generation=ref(cp+'/checkpoint.json');c.pendingNativeTeachingCandidate.deltaContract={...ref(cp+'/checkpoint.json'),expectedChangedTopics:44,unchangedLessons:9892,actualGeneratedPassing:true};
c.pendingNativeGenerationAdmission={checkpoint:ref(cp+'/checkpoint.json'),state:'completed',sourceFilesVerified:6484,stockCommandsPassed:10,generated:true,fullBuildGuardsUnchanged:true,previewChanged:false,resumePolicy:'Generation complete. Do not rerun frozen v5/v6/v7 launchers; completed source manifest is pinned in checkpoint. Full native build/export/import pending.'};
c.pendingTeachingQuality.resolverFreshnessVerified=true;c.pendingTeachingQuality.generation=ref(cp+'/checkpoint.json');
c.lastUpdated=checkpoint.at;c.lastPriorityReassessment={at:checkpoint.at,priority:'Ten stock generation/check steps complete. Preserve exact source manifest for full native types/build and website import when resource gates permit; separate limbic and choice-order proposals remain pending. Keep owner review unchanged.',checkpoint:ref(cp+'/checkpoint.json')};
c.beforeFurtherWork='No generation process is live. All completed stock outputs are source-bound in SOURCE_AFTER_GENERATION.json. Preserve separate repositories, pending authored proposals and current review session.';
c.next='Use the verified post-generation native source for guarded full types/build (native full build minimum6,144MiB), runtime exports and stock website import. Integrate separate limbic and choice-order proposals coherently with regenerated bindings. Keep normal review preview unchanged.';index.next=c.next;
for(const k of ['goal','safety','ownerWithdrawnHistoryPolicy'])assert.deepEqual(index[k],before[k]);for(const k of ['currentInstalled','ownerPreviewPolicy','pendingCombinedWebsite','pendingLimbicQuiz','pendingQuickCheckOrder'])assert.deepEqual(c[k],before.activeWork.current[k]);saveIndex(index);
const heading='## Current: Atlas teaching generation verified — 29 October 2026\n\n';
const summary='All ten stock generation/check steps pass: 44 intended topic changes, 9,892 unchanged lessons, 1,104 body worksheets and 108 nested selections. Seven generated files are saved on F. The 28 authored files plus five recovery tools are verified in the source-only GitHub backup. Full application types/build/export/import remain pending; your current review website is unchanged.\n\n';
const link=`Checkpoint: ${cp}/checkpoint.json (${hash(cp+'/checkpoint.json')}).\n\n`;
const map='WORKSPACE_MAP.md',master='F:/VisibleMedicine/website/docs/master-plan.md';write(cp+'/WORKSPACE_MAP.before.md',read(map));write(cp+'/master-plan.before.md',read(master));
const text=Buffer.from(heading+summary+link+'Website: F:/VisibleMedicine/website. Atlas: F:/VisibleMedicine/atlas (outputs). Checklist377 preserves all71 requirements/eight ideas. Generation has no live process; source manifest and remaining proposals are indexed in CURRENT_CHECKPOINT.json.\n');
const allocated=read(map).length;assert(text.length<=allocated);const fd=fs.openSync(map,'r+');try{fs.writeSync(fd,Buffer.concat([text,Buffer.alloc(allocated-text.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
fs.writeFileSync(master,heading+summary+link+'The 512MiB display attempt and later memory-admission refusal remain preserved. Successful steps were independently pinned before resume. Full build gates and the2GiB runtime reserve were retained. The later limbic quizzes and answer-choice presentation proposal are separate and not represented by this generated source. No clinical approval or installation is implied.\n\n'+read(master).toString());
write(cp+'/INDEX_AFTER.json',read('CURRENT_CHECKPOINT.json'));write(cp+'/SAVED.json',{checkpoint:ref(cp+'/checkpoint.json'),index:ref('CURRENT_CHECKPOINT.json'),master:ref(master),checklist:ref(cp+'/checklist/RESULT.json'),fullGoalPreserved:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:ref(cp+'/checkpoint.json'),source:checkpoint.source,stockStepsPassed:10,changedTopics:44,unchangedLessons:9892,checklistRevision:377,github:checkpoint.github}));
