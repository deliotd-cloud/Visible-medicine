import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

// Prepare only. The existing sealed controller performs --seal and --run separately.
const stage='G:/VisibleMedicine-temp/staging/20261031-release26';
const old='G:/VisibleMedicine-temp/staging/20261031-prostate-website/verification-twentyfive';
const oldStage='G:/VisibleMedicine-temp/staging/20261031-prostate-website';
const root=stage+'/verification-twentysix';
const requiredTests=[
 'tests/atlas-a01-current-preservation.test.mjs','tests/atlas-contained-review.test.ts',
 'tests/atlas-femoral-clinical.test.ts','tests/atlas-hyoid-epiglottis-ultrasound.test.ts',
 'tests/atlas-nested-answer-focus.test.ts','tests/atlas-tour-reference-reading.test.ts',
 'tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-craniofacial-bone-quiz.test.ts',
 'tests/clinical-review-forearm-vascular-xray.test.ts','tests/clinical-review-lower-connective-quiz.test.ts',
 'tests/clinical-review-orbital-sensory-mri.test.ts','tests/clinical-review-regional-muscle-completion-quiz.test.ts',
 'tests/clinical-review-teaching-heading.test.ts','tests/clinical-review-vocal-tissue-teaching.test.ts',
 'tests/head-native-history-current-transition.test.mjs','tests/tour-replay-current-delivery.test.mjs',
 'tests/fda-reference-review-links.test.mjs','tests/current-atlas-delivery.test.mjs',
 'tests/prostate-current-delivery-transition.test.mjs'
];
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const requiredProduct=[
 'atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 ...modules.flatMap(name=>['manifest.json','source-inputs.json'].map(file=>'public/atlas-runtime/'+name+'/'+file)),
 'tests/fixtures/current-atlas-delivery.json','tests/current-atlas-delivery.mjs'
];
const sourcePath=process.env.FINAL_SOURCE,sourceSha=process.env.FINAL_SOURCE_SHA256;
const focusedPath=process.env.FOCUSED_RECEIPT,focusedSha=process.env.FOCUSED_RECEIPT_SHA256;
for(const value of [sourcePath,focusedPath])assert.equal(typeof value,'string','Explicit final source and focused completion receipt required');
for(const digest of [sourceSha,focusedSha])assert(/^[a-f0-9]{64}$/.test(digest??''),'Explicit SHA-256 required');
assert.equal(path.dirname(path.resolve(sourcePath)).replaceAll('\\','/'),stage,'Final source must be in release26 stage');
assert(/^SOURCE(?:[0-9]+)?\.json$/.test(path.basename(sourcePath)),'Named sealed source receipt required');
assert.equal(hash(sourcePath),sourceSha);
const receipt=json(sourcePath);
assert.equal(receipt.website,stage+'/website');
assert.equal(receipt.atlasHead,'df175264724a98ca4f70de19e1bfabd325084fdb');
assert.equal(receipt.atlasTree,'e07b52eec6b4eeff4caaa039ab1cdb54828a716d');
assert.equal(receipt.review,'8b349bdc9a34ac1d0a1edbc6f5724cfb835995a934f5e3c7cfd9cad0ecd19b46');
assert.equal(receipt.inputs,1874);assert.equal(receipt.viewerFiles,58);
assert.equal(receipt.importedSourceFiles,1655);
assert(Array.isArray(receipt.sourceRows)&&receipt.sourceRows.length>=7413);
assert.equal(hash(receipt.historicalEnvironment.path),receipt.historicalEnvironment.sha256);
const unique=new Set();
for(const row of receipt.sourceRows){
 assert(typeof row.path==='string'&&row.path.length>0&&!path.posix.isAbsolute(row.path)&&!row.path.includes('\\')&&!row.path.split('/').some(x=>x===''||x==='.'||x==='..'),row.path);
 assert(!unique.has(row.path),'Duplicate source row: '+row.path);unique.add(row.path);
 assert(/^[a-f0-9]{64}$/.test(row.sha256),row.path);
 const target=receipt.website+'/'+row.path;
 assert(fs.lstatSync(target).isFile(),'Nonregular source row: '+row.path);
 assert.equal(hash(target),row.sha256,row.path);
}
for(const name of [...requiredProduct,...requiredTests])assert(unique.has(name),'Missing bound product/test row: '+name);
assert.equal(hash(focusedPath),focusedSha);
const focused=json(focusedPath);
assert.equal(focused.source?.path,sourcePath,'Focused proof belongs to final source path');
assert.equal(focused.source?.sha256,sourceSha,'Focused proof belongs to final source bytes');
assert.equal(focused.sourceUnchanged,true);
assert.equal(focused.result?.passing,true,'All focused failures must pass');
assert.equal(focused.result?.supervisor?.code,0);
assert.equal(focused.result?.process?.terminalObserved,true);
assert.equal(focused.result?.process?.interrupted,false);
assert.equal(focused.result?.process?.exitCode,0);
assert(Array.isArray(focused.tests));
for(const name of requiredTests)assert(focused.tests.includes(name),'Unrepaired original failure root: '+name);

const oldPlanFile=old+'/PLAN.json',oldStateFile=old+'/STATE.json';
assert.equal(hash(oldPlanFile),'b1ca58bff89e9d60503ea2d435990a2544fb8a1d6892937d4f9d842fe359fa96');
const oldPlan=json(oldPlanFile),oldState=json(oldStateFile);
assert.equal(oldState.terminal,true);assert.equal(oldState.status,'failed');
assert.equal(oldState.current?.id,'partition-25');assert.equal(oldState.completed.length,0);
assert.equal(oldPlan.minimumMiB,4096);assert.equal(oldPlan.aggregateJobMiB,2048);
assert.equal(oldPlan.heapMiB,1024);assert.equal(oldPlan.freeReserveMiB,2048);
assert.equal(oldPlan.steps.length,32);assert.equal(oldPlan.steps[0].id,'partition-25');
assert.equal(new Set(oldPlan.steps.map(s=>s.id)).size,32);
assert(!fs.existsSync(root),'New verification directory must not exist');
for(const name of ['runner.mjs','runner.test.mjs','guarded-step.mjs','one-step-admission.mjs','one-step-admission.test.mjs','run-release.mjs']){
 const item=oldPlan.codeFiles.find(x=>x.path===old+'/'+name);
 assert(item&&hash(item.path)===item.sha256,'Original runner changed: '+name);
}
let code=fs.readFileSync(old+'/run-release.mjs','utf8');
const replaceOne=(from,to)=>{assert.equal(code.split(from).length,2,'Exact runner seam: '+from);code=code.replace(from,to);};
replaceOne("const stage='"+oldStage+"';","const stage='"+stage+"';");
replaceOne("const source={path:stage+'/SOURCE.json',sha256:'69748f41a0cabd199180be76d6466dd1594921f381357cb4e61c6662b5edfc33'};",
 "const source={path:"+JSON.stringify(sourcePath)+",sha256:"+JSON.stringify(sourceSha)+"};");
const a=code.indexOf('const steps='),b=code.indexOf('\nconst ref=',a);
assert(a>0&&b>a);
const steps=[...oldPlan.steps.slice(1),oldPlan.steps[0]];
assert.equal(steps[0].id,'partition-26');assert.equal(steps.length,32);
code=code.slice(0,a)+'const steps='+JSON.stringify(steps,null,2)+';'+code.slice(b);
const focusedLiteral=JSON.stringify({path:focusedPath,sha256:focusedSha});
const gate="const focused="+focusedLiteral+";\n"+
 "const checkFocused=()=>{assert.equal(hash(focused.path),focused.sha256);const f=json(focused.path);"+
 "assert.equal(f.source?.path,source.path);assert.equal(f.source?.sha256,source.sha256);"+
 "assert.equal(f.sourceUnchanged,true);assert.equal(f.result?.passing,true);"+
 "assert.equal(f.result?.supervisor?.code,0);assert.equal(f.result?.process?.terminalObserved,true);"+
 "assert.equal(f.result?.process?.interrupted,false);assert.equal(f.result?.process?.exitCode,0);"+
 "for(const name of "+JSON.stringify(requiredTests)+")assert(f.tests?.includes(name),'Focused gap: '+name);};\n";
replaceOne('const steps=',gate+'const steps=');
replaceOne("assert.equal(process.argv.length,3);assert.equal(hash(source.path),source.sha256);",
 "assert.equal(process.argv.length,3);assert.equal(hash(source.path),source.sha256);checkFocused();");
replaceOne("  assert.equal(hash(source.path),source.sha256);\n  assert.equal(hash(receipt.historicalEnvironment.path),receipt.historicalEnvironment.sha256);",
 "  assert.equal(hash(source.path),source.sha256);checkFocused();\n  assert.equal(hash(receipt.historicalEnvironment.path),receipt.historicalEnvironment.sha256);");
const scope={at:new Date().toISOString(),source:{path:sourcePath,sha256:sourceSha},
 focused:{path:focusedPath,sha256:focusedSha},
 prior:{plan:{path:oldPlanFile,sha256:hash(oldPlanFile)},state:{path:oldStateFile,sha256:hash(oldStateFile)},failedPartition:'25/32',tests:290,pass:273,fail:17},
 steps,requiredTests,priorFailuresPreserved:true,wholeSuitePassing:false,
 oneNewStepPerInvocation:true,guardUnchanged:true,minimumMiB:4096,aggregateJobMiB:2048,heapMiB:1024,freeReserveMiB:2048,
 coverageLimit:'Partition membership is sorted root position; prior receipts remain source-specific evidence, not proof of the final current suite.'};
fs.mkdirSync(root);
for(const name of ['runner.mjs','runner.test.mjs','guarded-step.mjs','one-step-admission.mjs','one-step-admission.test.mjs'])
 fs.copyFileSync(old+'/'+name,root+'/'+name,fs.constants.COPYFILE_EXCL);
fs.writeFileSync(root+'/run-release.mjs',code,{flag:'wx'});
fs.writeFileSync(root+'/SCOPE.json',JSON.stringify(scope,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:root,source:{path:sourcePath,sha256:sourceSha},focused:{path:focusedPath,sha256:focusedSha},next:steps[0],remaining:steps.length,sealCommand:'node '+root+'/run-release.mjs --seal',runCommand:'node '+root+'/run-release.mjs --run'}));