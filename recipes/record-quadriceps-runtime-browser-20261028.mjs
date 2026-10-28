import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const root='F:/VisibleMedicine/staging/20261028-quadriceps-website', dir=root+'/runtime-browser';
const pin=p=>({path:p,sha256:hash(p)}), started=json(dir+'/STARTED.json'), terminal=json(dir+'/TERMINAL.json');
assert.equal(hash(started.source.path),started.source.sha256);
assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
const report={at:new Date().toISOString(),source:started.source,manifestSha256:started.manifestSha256,started:pin(dir+'/STARTED.json'),terminal:pin(dir+'/TERMINAL.json'),scope:'Standalone stock-exported learner runtime in an isolated Chrome context. No real-account website or Review acceptance.',passingForStatedScope:true,
observations:[
 {check:'Exact tour deep link',result:'Right knee: quadriceps to tibia opens in Guided learning; six stops and explicit Play full tour.'},
 {check:'Existing speed choices',result:'0.5x, 1x, 1.5x, 2x and 3x present; selecting 3x updates the visible control.'},
 {check:'Automatic advance and notes',result:'After Play, Rectus femoris step 1 advanced to Vastus lateralis step 2 with the matching caption and selected structure.'},
 {check:'Pause',result:'At 00:45:49Z Pause changed to Play; step 2 and title were unchanged at 00:46:00Z.'},
 {check:'Manual step chooser',result:'All six ordered stops are available; choosing Patella opens step 5 with its caption and selected surface.'},
 {check:'Visual close-up',result:'Screenshots inspected at 1600x1000: initial muscle and patella close-up render clearly with faded context, label and notes. Images viewed inline; no screenshot file claimed.'},
 {check:'Desktop layout',result:'No horizontal document overflow at 1600x1000 or 1280x900. Visible controls remain in viewport; settled 1280 canvas is 952x717.'},
 {check:'Resume',result:'At 1280x900, Play resumed step 5 at 00:46:40Z; step 6 Tibia with its caption appeared by 00:46:49Z.'},
 {check:'Completion',result:'By 00:47:04Z final step remained with Replay full tour and Finish; no further automatic advance.'},
 {check:'Runtime console',result:'No console errors at inspection; one existing THREE.Clock deprecation warning.'}
],clinicalApproval:false,patientSpaceRegistration:false,wholeStockSuitePassing:false,realAccountAcceptance:false,normalPreviewChanged:false,wsLStopped:false,ownedBrowserPageClosed:true};
fs.writeFileSync(dir+'/QA.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
const file='finish-quadriceps-website-20261028.mjs';let source=fs.readFileSync(file,'utf8');
const replace=(from,to)=>{assert.equal(source.split(from).length,2,from);source=source.replace(from,to);};
replace("browserRerun:false,wholeStockSuitePassing:false,realAccountAcceptance:false", "browserRerun:false,standaloneRuntimeBrowser:pin(stage+'/runtime-browser/QA.json'),retainedContentHarnessFailure:{...pin(stage+'/checks/content-1/RESULT.json'),cause:'Native hermetic builder was used outside its checkout. Corrected the verification recipe to compile each website catalogue with its own esbuild and tsconfig; product source stayed exact. Content attempt 2 passes.'},wholeStockSuitePassing:false,realAccountAcceptance:false");
replace("focusedNodeCases:v.focusedCounts.pass,browserRerun:false", "focusedNodeCases:v.focusedCounts.pass,standaloneRuntimeBrowser:v.standaloneRuntimeBrowser,browserRerun:false");
replace("Clinical, real-account, visual and whole-suite acceptance remain open; current preview and WSL unchanged.", "Standalone Chrome checks pass for playback, pause, step choice, completion and desktop layout. Clinical, real-account, full-website visual and whole-suite acceptance remain open; current preview and WSL unchanged.");
replace("'serve-quadriceps-runtime-qa','run-quadriceps-stock-import'", "'serve-quadriceps-runtime-qa','run-quadriceps-stock-import','record-quadriceps-runtime-browser'");
replace("const checks=json(stage+'/checks/ACCEPTED.json');", "const browser=json(stage+'/runtime-browser/QA.json');assert(browser.passingForStatedScope&&browser.source.sha256===hash(sf)&&browser.ownedBrowserPageClosed);assert.equal(hash(browser.terminal.path),browser.terminal.sha256);const checks=json(stage+'/checks/ACCEPTED.json');");
fs.writeFileSync(file,source);
console.log(JSON.stringify({browser:pin(dir+'/QA.json'),finishRecipe:pin(file),terminal}));
