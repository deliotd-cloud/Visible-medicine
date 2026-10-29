import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {backup} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import {validateChecklist,renderChecklist} from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261029-combined-types-review-verified';
const native='G:/VisibleMedicine-temp/staging/20261029-mandible-full-validation';
const web='G:/VisibleMedicine-temp/staging/20261029-combined-website-full-types';
const viewer='G:/VisibleMedicine-temp/staging/20261029-combined-review-viewer';
const site='G:/VisibleMedicine-temp/staging/20261029-combined-website/website';
const read=p=>fs.readFileSync(p),ref=p=>({path:p,sha256:hash(p)});
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)||typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
assert(!fs.existsSync(cp));
const nr=json(native+'/RESULT.json'),wr=json(web+'/RESULT.json'),vr=json(viewer+'/RESULT.json');
const verify=()=>{
 for(const [root,r] of [[native,nr],[web,wr],[viewer,vr]]){
  assert(r.passing&&r.run.passing&&r.run.process.terminalObserved&&r.run.process.exitCode===0&&!r.run.process.interrupted,root);
 }
 for(const r of [nr,wr]){
  assert.equal(hash(r.report.path),r.report.sha256);const report=json(r.report.path);
  assert.equal(report.diagnosticCount,0);assert(report.fullProjectTypes&&report.actualTransitiveGraph&&!report.scopeExclusionsAdded&&!report.substitutions);
  for(const row of report.sourceFiles)assert.equal(hash(row.path),row.sha256,row.path);
 }
 assert.equal(hash(nr.source.path),nr.source.sha256);
 const m=json(nr.source.path);for(const row of m.sourceRows)assert.equal(hash(m.atlas+'/'+row.path),row.sha256,row.path);
 for(const row of wr.inputs)assert.equal(hash(row.path),row.sha256,row.path);
 assert.equal(hash(vr.viewer.manifest.path),vr.viewer.manifest.sha256);
 for(const row of vr.viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+row.path),row.sha256,row.path);
 assert.equal(vr.reviewBinding,json(site+'/atlas-review/integration-inputs.json').sha256);
 assert.equal(vr.reviewBinding,'e797853ed87cb3d4dc39a1addafa55aa7962394bc1e961a14c83ca0b54f9f510');
 for(const [repo,head] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),head);
};verify();
write(cp+'/CURRENT_INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
for(const [label,root,run] of [['native-types',native,'type-run-1'],['website-types',web,'run-1'],['review-viewer',viewer,'build-1']]){
 for(const name of ['RESULT.json','PROFILE.json'])if(fs.existsSync(root+'/'+name))write(cp+'/'+label+'/'+name,read(root+'/'+name));
 for(const name of ['PREPARATION.json','PROCESS-TERMINAL.json','SUPERVISOR-HANDLE.json','STARTED.json','MEMORY-BEFORE.json','memory.jsonl','runner.stdout.log','runner.stderr.log','supervisor.stdout.log','supervisor.stderr.log'])if(fs.existsSync(root+'/'+run+'/'+name))write(cp+'/'+label+'/'+run+'/'+name,read(root+'/'+run+'/'+name));
}
write(cp+'/native-types/FULL_TYPE_RESULT.json',read(nr.report.path));write(cp+'/website-types/FULL_TYPE_RESULT.json',read(wr.report.path));
for(const row of vr.viewer.files)write(cp+'/review-viewer/artifact/'+row.path,read(site+'/public/atlas-review-viewer/'+row.path));write(cp+'/review-viewer/artifact/manifest.json',read(vr.viewer.manifest.path));
const recipes=new Map([
 ['recipes/native-types-launch.mjs',native+'/launch-types.mjs'],['recipes/native-types-checker.mjs',native+'/types-full-attempt-1/checker.mjs'],
 ['recipes/website-types-launch.mjs',web+'/launch.mjs'],['recipes/website-types-checker.mjs',web+'/types-full-attempt-1/checker.mjs'],
 ['recipes/review-viewer-launch.mjs',viewer+'/launch.mjs'],['recipes/save.mjs',fileURLToPath(import.meta.url)]
]);
const rows=[...recipes].map(([p,f])=>({path:p,bytes:read(f).length,sha256:hash(f)}));for(const r of rows)write(cp+'/source/'+r.path,read(recipes.get(r.path)));
backup({root:cp+'/source-only-backup',repo:'G:/VisibleMedicine-temp/staging/20261029-combined-checkpoint/source-only.git',branch:'backup/combined-types-review-20261029',files:rows,bytesFor:p=>read(recipes.get(p)),sourceIdentity:{native:nr.source,websiteReport:ref(wr.report.path),reviewBinding:vr.reviewBinding},scope:'Six verification/checkpoint recipes only. No model data, scans, patient derivatives, private decisions or raw Git ancestry. Full compiler reports and viewer build stay in local F recovery.',proof:{nativeTypes:true,websiteTypes:true,reviewViewerBuild:true,fullProductionBuild:false,wholeSuite:false,installed:false},verifySource:()=>{verify();for(const r of rows)assert.equal(hash(recipes.get(r.path)),r.sha256);}});
const checkpoint={schema:'vm-combined-types-review/1',at:new Date().toISOString(),native:{source:nr.source,result:ref(cp+'/native-types/RESULT.json'),report:ref(cp+'/native-types/FULL_TYPE_RESULT.json'),roots:1332,graphFiles:4710,diagnostics:0,fullTypes:true,fullBuild:false},website:{site,result:ref(cp+'/website-types/RESULT.json'),report:ref(cp+'/website-types/FULL_TYPE_RESULT.json'),roots:2731,graphFiles:6303,diagnostics:0,fullTypes:true,sourceSealed:false,fullBuild:false,wholeSuite:false},reviewViewer:{result:ref(cp+'/review-viewer/RESULT.json'),manifest:ref(cp+'/review-viewer/artifact/manifest.json'),binding:vr.reviewBinding,sourceCommit:vr.sourceCommit,files:54,packages:24},sourceOnlyBackup:ref(cp+'/source-only-backup/github-backup.json'),allOwnedJobsTerminal:true,installed:false,normalPreviewChanged:false,clinicalApproval:false,patientSpaceRegistration:false};write(cp+'/checkpoint.json',checkpoint);const cpref=ref(cp+'/checkpoint.json');
const cf='F:/VisibleMedicine/website/docs/completion-checklist.json',mf='F:/VisibleMedicine/website/docs/completion-checklist.md',old=json(cf),next=structuredClone(old);assert.equal(old.revision,387);next.revision=388;next.updatedAt='2026-10-29';next.roots.combinedtypesreview=cp;
const item=next.items.find(r=>r.id==='REL-01');item.evidence.push('combinedtypesreview:checkpoint.json');item.completionNote+=' Full configured native and combined website type checks pass (1,332/2,731 roots respectively, zero diagnostics). The staged Clinical Review viewer was rebuilt against its current revision binding. Current combined production builds, whole-suite and release acceptance remain outstanding.';
next.changeLog.unshift({revision:388,date:'2026-10-29',change:'Full native/website type checks and staged Clinical Review viewer verified; installation and whole-suite remain open.'});validateChecklist(next);assert.equal(next.items.length,71);assert.equal(next.items.filter(r=>r.scope==='optional').length,8);for(const r of old.items){const n=next.items.find(x=>x.id===r.id);assert.equal(n.status,r.status);if(r.id!=='REL-01')assert.deepEqual(n,r);}
write(cp+'/checklist.before.json',read(cf));write(cp+'/checklist.before.md',read(mf));fs.writeFileSync(cf,JSON.stringify(next,null,2)+'\n');fs.writeFileSync(mf,renderChecklist(next));write(cp+'/CHECKLIST.json',{revision:388,requirements:71,optionalIdeas:8,statusesUnchanged:true,source:ref(cf),markdown:ref(mf)});
const index=json('CURRENT_CHECKPOINT.json'),before=structuredClone(index),c=index.activeWork.current;c.activeExecutionSessions=[];c.latestCoordination=cpref;c.latestChecklistUpdate=ref(cp+'/CHECKLIST.json');c.lastUpdated=checkpoint.at;
c.pendingNativeTeachingCandidate.fullTypes={checkpoint:cpref,path:checkpoint.native.report.path,sha256:checkpoint.native.report.sha256,roots:1332,graphFiles:4710,diagnostics:0};c.pendingNativeTeachingCandidate.fullTypesPending=false;
c.pendingCombinedWebsite.reviewBuildPending=false;c.pendingCombinedWebsite.reviewBinding.viewerBuildPending=false;c.pendingCombinedWebsite.currentVerification={checkpoint:cpref,fullConfiguredTypes:true,reviewViewerBuilt:true,fullProductionBuild:false,wholeSuite:false,sourceSealed:false};
c.next='Finish native production build at the unchanged6,144MiB admission, then stock export/import preserving staged website UI. Combined website types and Review viewer now pass; seal its current source before resumable authenticated whole-suite checks. Keep owner review unchanged.';index.next=c.next;c.beforeFurtherWork='All three recorded validation jobs are terminal. Full candidate checks are source-bound; native and website candidates remain separate, uninstalled revisions. Normal review is running.';
for(const k of ['goal','safety','ownerWithdrawnHistoryPolicy'])assert.deepEqual(index[k],before[k]);for(const k of ['currentInstalled','ownerPreviewPolicy','pendingFootInterossei'])assert.deepEqual(c[k],before.activeWork.current[k]);saveIndex(index);
const heading='## Current: Combined types and Review viewer verified — 29 October 2026\n\n';const summary='Full native and staged website type checks pass with zero diagnostics. The staged Clinical Review viewer now matches its saved UI revision. Current owner review remains unchanged.\n\n';const link=`Checkpoint: ${cp}/checkpoint.json (${cpref.sha256}).\n\n`;const map='WORKSPACE_MAP.md',master='F:/VisibleMedicine/website/docs/master-plan.md';write(cp+'/WORKSPACE_MAP.before.md',read(map));write(cp+'/master-plan.before.md',read(master));
const mapText=Buffer.from(heading+summary+link+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas (outputs). Checklist388 retains71requirements/eightideas. Native types1332roots/4710files; website2731roots/6303files. Full production builds, coherent export/import, whole-suite and clinical acceptance remain open. Native build admission6,144MiB unchanged. G staging; F recovery. No preview restart/install.\n');const allocated=read(map).length;assert(mapText.length<=allocated);const fd=fs.openSync(map,'r+');try{fs.writeSync(fd,Buffer.concat([mapText,Buffer.alloc(allocated-mapText.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
fs.writeFileSync(master,heading+summary+link+'Native candidate pins6,500source files. Website full configured graph covers2,731roots/6,303files with no exclusions or substitutions. Review viewer54files/24packages binds e797853e; it still uses the previous9cef native import, so new native teaching remains unimported. Six verification recipes have a separately verified source-only GitHub backup. Full native/website production builds, exact-source whole-suite, coherent import and clinical acceptance remain pending.\n\n'+read(master).toString());write(cp+'/INDEX_AFTER.json',read('CURRENT_CHECKPOINT.json'));verify();write(cp+'/SAVED.json',{checkpoint:cpref,allOwnedJobsTerminal:true,goalPreserved:true,previewChanged:false});console.log(JSON.stringify({checkpoint:cpref,checklistRevision:388,sourceBackup:checkpoint.sourceOnlyBackup}));
