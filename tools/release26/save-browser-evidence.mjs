import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-head-learning-browser',queue='G:/VisibleMedicine-temp/staging/20261031-prostate-website/verification-twentyfive',attempt=queue+'/attempts/partition-25-zvZtuZ',source='G:/VisibleMedicine-temp/staging/20261031-prostate-website/SOURCE.json';
const ref=p=>({path:p,sha256:hash(p)}),copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(from),hash(to));},write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n',{flag:'wx'});
const state=json(queue+'/STATE.json'),terminal=json(attempt+'/evidence/PROCESS-TERMINAL.json');assert(state.terminal);assert(terminal.terminalObserved);assert.equal(terminal.exitCode,1);assert.equal(hash(source),'69748f41a0cabd199180be76d6466dd1594921f381357cb4e61c6662b5edfc33');
for(const name of ['PLAN.json','STATE.json','SCOPE.json'])copy(queue+'/'+name,cp+'/partition25/'+name);
for(const name of ['PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log'])copy(attempt+'/evidence/'+name,cp+'/partition25/'+name);
copy('G:/VisibleMedicine-temp/staging/20261031-prostate-website/website/.local/website-test-runs/2026-10-31T19-50-00-060Z-f27d8d69-7dfe-4d08-8b88-65f8dc84e7db/child.tap',cp+'/partition25/child.tap');copy(source,cp+'/partition25/SOURCE.json');
copy('G:/VisibleMedicine-temp/proposals/20261031-head-teaching-lazy/FEASIBILITY.json',cp+'/TEACHING_LOAD_FEASIBILITY.json');
write('G:/VisibleMedicine-temp/proposals/20261031-local-manifest-loader/NOT_ADOPTED.json',{at:new Date().toISOString(),installed:false,reason:'The local MRI route ultimately loaded without changes. Vite message is a warning, not established cause of a runtime failure. Proposed plugin never integrated; negative test failed to reproduce a rejection. Further loading optimization needs evidence, not this unproven workaround.'});
const installed=json('CURRENT_CHECKPOINT.json').activeWork.current.currentInstalled,site=installed.website;
const productFiles=['components/HeadAtlasViewer.tsx','components/HeadAtlasPractice.tsx','components/HeadAtlasInlineComparison.tsx','lib/head-inline-comparison.ts','lib/head-atlas-links.ts','atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-runtime/head-neck/manifest.json'].map(p=>({path:p,sha256:hash(site+'/'+p)}));
const ui={at:new Date().toISOString(),installed:json('CURRENT_CHECKPOINT.json').activeWork.current.currentInstalled.installation,productFiles,viewport:{width:1280,height:720},browser:'in-app browser',checks:[
 {case:'MRI structure search',result:'pons search yielded one result; Pons selection navigated to exact concept/revision and slice145/256'},
 {case:'MRI to existing 3D model',result:'Compare beside 3D Atlas loaded installed head-neck runtime and acknowledged Pons is selected in the model'},
 {case:'Comparison close',result:'Close comparison restored keyboard focus to Compare beside 3D Atlas'},
 {case:'Practice locate',result:'Named Pons single-question set hid answer index; clicked visible saved-mask voxel; feedback Correct, first attempts1/1, revealed0'},
 {case:'Practice finish',result:'Practice complete,1/1correct first attempts,0revealed,0unanswered; focus moved to completion heading'},
 {case:'MRI to CT handoff',result:'Continue this anatomy on CT kept concept brainstem-pons and exact headRevision; CT selected Pons at slice67/199'},
 {case:'CT scrolling',result:'Mouse wheel over image changed slice67to70 while keeping anatomical selection'},
 {case:'Browser Back',result:'Returned to MRI route and reopened local source; prior practice-cleared URL contained no concept, so no restored selection was claimed'},
 {case:'MRI scroll isolation',result:'Mouse wheel changed MRI slice145to148 while document scrollTop/scrollLeft remained0/0'},
 {case:'Clear selection keyboard',result:'Enter on Clear selection cleared selected structure and placed focus in Find a structure'}
 ],wholeMatrixComplete:false,clinicalDecisionsSubmitted:0,certifiedAttemptSaved:false,privateDataUploaded:false,patientRegistration:false,sourceMasksChanged:false,previewRestarted:false,ownerTabsRefreshed:false,screenshotLocalOnly:ref(cp+'/private-browser/mri-workspace.png'),accessibilityLocalOnly:ref(cp+'/private-browser/final-accessibility.txt')};
write(cp+'/BROWSER_ACCEPTANCE.json',ui);write(cp+'/PARTITION25.json',{at:new Date().toISOString(),source:ref(cp+'/partition25/SOURCE.json'),plan:ref(cp+'/partition25/PLAN.json'),state:ref(cp+'/partition25/STATE.json'),terminal:ref(cp+'/partition25/PROCESS-TERMINAL.json'),tap:ref(cp+'/partition25/child.tap'),tests:290,passed:273,failed:17,skipped:0,cancelled:0,wholeSuitePassing:false});
console.log(JSON.stringify({evidence:cp,browserChecks:ui.checks.length,partition:{tests:290,pass:273,fail:17},unprovenManifestProposalDiscarded:true}));
