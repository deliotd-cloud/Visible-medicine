import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate',candidate=root+'/website';
assert(!fs.existsSync(root+'/FRAME_EVENT_BUS_CORRECTION.json'));
const prior=json(root+'/CONSUMER_ADOPTION.json');assert.equal(prior.counts.tests,40);assert.equal(prior.counts.pass,39);assert.equal(prior.counts.fail,1);
assert.equal(sha(read(prior.log)),prior.logSha256);
const changed='tests/atlas-runtime-frame.test.mjs',preimage='tests/fixtures/expansion-consumer-first-attempt-20261022/atlas-runtime-frame.test.mjs.raw';
assert.equal(sha(read(candidate+'/'+preimage)),prior.sourceRows.find(row=>row.path===changed).sha256);
const old="  const documentListeners = new Map();\n  const doc = {body, activeElement: body, fullscreenEnabled: true, fullscreenElement: null,\n    addEventListener(type, listener) { const group = documentListeners.get(type) ?? new Set(); group.add(listener); documentListeners.set(type, group); },\n    removeEventListener(type, listener) { documentListeners.get(type)?.delete(listener); },\n    emit(type, event = {}) { for (const listener of [...(documentListeners.get(type) ?? [])]) listener(event); },\n";
const next="  const doc = {body, activeElement: body, fullscreenEnabled: true, fullscreenElement: null,\n    // attachLiveLearningBrowser installs the shared event bus below. Both the\n    // learning channel and fullscreen controller must observe that same bus.\n    emit(type, event = {}) { doc.dispatchEvent({...event, type}); },\n";
const proposed=read(candidate+'/'+changed).toString(),before=read(candidate+'/'+preimage).toString();
assert.equal(before.split(old).length,2);assert.equal(proposed,before.replace(old,next),'Only one test event-bus seam');
for(const row of prior.sourceRows)if(row.path!==changed)assert.equal(sha(read(candidate+'/'+row.path)),row.sha256,row.path);
const command=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',changed];
const run=spawnSync(process.execPath,command,{cwd:candidate,encoding:'utf8',windowsHide:true,maxBuffer:8e6,env:{...process.env,VM_WEBSITE_ROOT:candidate,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
const log=(run.stdout??'')+(run.stderr??'');fs.writeFileSync(root+'/FRAME_EVENT_BUS_CORRECTION.log',log,{flag:'wx'});
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo'])counts[key]=Number([...log.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))].at(-1)?.[1]??NaN);
const sourceRows=prior.sourceRows.map(row=>row.path===changed?{path:changed,bytes:read(candidate+'/'+changed).length,sha256:sha(read(candidate+'/'+changed))}:row);
sourceRows.push({path:preimage,bytes:read(candidate+'/'+preimage).length,sha256:sha(read(candidate+'/'+preimage))});sourceRows.sort((a,b)=>a.path.localeCompare(b.path));
const receipt={at:new Date().toISOString(),root,candidate,source:prior.source,pendingReview:prior.pendingReview,sourcePaths:sourceRows.length,sourceRows,
 command:[process.execPath,...command],exitCode:run.status,counts,log:root+'/FRAME_EVENT_BUS_CORRECTION.log',logSha256:sha(read(root+'/FRAME_EVENT_BUS_CORRECTION.log')),
 classification:'Test-only harness event-bus conflict, not an observed browser/product failure: attachLiveLearningBrowser replaced doc.add/removeEventListener, leaving the newly added doc.emit dispatching a different stale listener map. Both learning and fullscreen now use the existing shared dispatchEvent bus. No assertion or product source was changed.',
 priorRun:{receipt:root+'/CONSUMER_ADOPTION.json',sha256:sha(read(root+'/CONSUMER_ADOPTION.json')),counts:prior.counts,log:prior.log,logSha256:prior.logSha256,retained:true},
 originalTestAndProductInversesRetained:true,unaffectedSourceInputsExact:true,canonicalChanged:false,frozenSuiteInputsChanged:false,reviewViewerBuild:false,currentPinAdmission:false,fullTypes:false,fullBuild:false,wholeSuitePassing:false,clinicalApproval:false};
fs.writeFileSync(root+'/FRAME_EVENT_BUS_CORRECTION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/FRAME_EVENT_BUS_CORRECTION.json',sha256:sha(read(root+'/FRAME_EVENT_BUS_CORRECTION.json')),exitCode:run.status,counts}));
assert.equal(run.status,0);assert(counts.tests>0&&counts.pass===counts.tests&&counts.fail===0&&counts.cancelled===0&&counts.skipped===0);
