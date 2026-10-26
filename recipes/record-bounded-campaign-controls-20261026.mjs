// Check actual installed Node event semantics; a file that aborts before test
// bootstrap emits a file failure and NO per-file summary, not a zero-case summary.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const dir='F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2';
assert(!fs.existsSync(dir+'/RESULT.json'));
const rows=fs.readFileSync(dir+'/native-events.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);
const globals=rows.filter(r=>r.event==='test:summary'&&r.file===null),summaries=rows.filter(r=>r.event==='test:summary'&&r.file!==null);
assert.equal(globals.length,1);assert.equal(summaries.length,3);assert.equal(globals[0].success,false);
const counts=Object.fromEntries(['tests','passed','failed','skipped','cancelled','todo'].map(k=>[k,globals[0].counts[k]]));
assert.deepEqual(counts,{tests:5,passed:2,failed:2,skipped:1,cancelled:0,todo:0});
const matching=(rows,name)=>rows.filter(r=>r.file&&path.resolve(r.file)===path.resolve(dir+'/fixtures/'+name));
assert.equal(matching(summaries,'pass.test.mjs')[0].counts.tests,2);
assert.equal(matching(summaries,'pass.test.mjs')[0].success,true);
assert.equal(matching(summaries,'fail.test.mjs')[0].counts.failed,1);
assert.equal(matching(summaries,'skip.test.mjs')[0].counts.skipped,1);
assert.equal(matching(summaries,'abort.test.mjs').length,0);
const abort=matching(rows,'abort.test.mjs');assert.equal(abort.length,1);assert.equal(abort[0].event,'test:fail');assert.equal(abort[0].nesting,0);
const tap=fs.readFileSync(dir+'/native.tap','utf8');for(const [k,v]of Object.entries({tests:5,pass:2,fail:2,skipped:1,cancelled:0,todo:0}))assert.match(tap,new RegExp('^# '+k+' '+v+'$','m'));
const plan=fs.readFileSync(dir+'/plan-controls.stdout.log','utf8');for(const [k,v]of Object.entries({tests:4,pass:4,fail:0,skipped:0}))assert.match(plan,new RegExp('^# '+k+' '+v+'$','m'));
assert.equal(fs.readFileSync(dir+'/native-negative.stderr.log','utf8'),'');
const pins={'bounded-stock-campaign.mjs':'16cbdb05db40e407c5790eccf265d564787b85ac1735207ff1b16fa4866c162c','structured-test-reporter.mjs':'1cb5e3c17e8636ca52cc91084dedfdec78425c05ba0f78d1104dfdd239791067','plan-refusals.test.mjs':'585602a0d026b83dbd9cda5f93dc4caa5d69d7f0a36df4e36cdaab0ce1e53159'};
for(const [p,d]of Object.entries(pins))assert.equal(hash(dir+'/'+p),d);
assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
const pin=p=>({path:p,sha256:hash(p)});
const result={at:new Date().toISOString(),passingControls:true,planControls:{tests:4,pass:4,fail:0,skips:0},
 nativeReporterNegativeFixture:{rootFiles:4,globalCounts:globals[0].counts,globalSuccess:false,fileAbortHasNoSummary:true,fileAbortFailureEventPresent:true,oneIntentionalSyntheticSkip:true,notApplicationTests:true},
 evidence:{events:pin(dir+'/native-events.jsonl'),tap:pin(dir+'/native.tap'),planControls:pin(dir+'/plan-controls.stdout.log'),executedRecipe:pin('check-bounded-campaign-controls-v2-run-20261026.mjs')},
 diagnosticsPreserved:[pin('F:/VisibleMedicine/staging/20261026-bounded-campaign-controls/native-negative.stderr.log')],
 corrections:['Custom reporter pathToFileURL required on Windows.','Original harness incorrectly expected four per-file summaries. Actual native import abort has a failure event without a summary; retain that refusal distinction.'],
 sourcePins:pins,campaignOrApplicationCasesExecuted:false,normalPreviewChanged:false};
fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passingControls:true,positivePlanControls:4,negativeSyntheticCounts:counts}));
