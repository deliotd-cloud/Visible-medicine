import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition';
const prep=json(root+'/PREPARATION.json'),site=prep.website,parent=json(prep.sourceReceipt);
assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);
const rows=[];
for(const phase of ['import','coverage','bind','proof','ui-only']){
 const r=json(`${root}/evidence/${phase}/RESULT.json`);assert(r.success);
 for(const c of r.checks){assert.equal(c.exitCode,0);assert.equal(sha(read(c.log)),c.logSha256);rows.push({...c,phase});}
}
const mixed=json(root+'/evidence/ui/RESULT.json');assert.equal(mixed.success,false);assert.equal(mixed.checks.length,1);
const mixedText=read(mixed.checks[0].log).toString();assert.equal(sha(read(mixed.checks[0].log)),mixed.checks[0].logSha256);
assert(mixedText.includes('Current delivery changed: atlas-review/manifest.json'));
assert.equal((mixedText.match(/^not ok /gm)||[]).length,1);assert(mixedText.includes('# pass 64'));assert(mixedText.includes('# fail 1'));
const nativeCounts=log=>{const raw=read(log).toString(),value=k=>{const a=[...raw.matchAll(new RegExp('^(?:#|ℹ) '+k+' (\\d+)\\r?$','gm'))];assert.equal(a.length,1);return Number(a[0][1]);};
 const counts={tests:value('tests'),pass:value('pass'),fail:value('fail'),cancelled:value('cancelled'),skipped:value('skipped'),todo:value('todo')};
 assert.equal(counts.tests,counts.pass);for(const k of ['fail','cancelled','skipped','todo'])assert.equal(counts[k],0);assert.equal(value('suites'),0);
 assert.equal([...raw.matchAll(/^(?:ok \d+ - |✔ )/gm)].length,counts.tests);return counts;};
const native=rows.filter(r=>r.command.includes('--test')).map(r=>({phase:r.phase,log:r.log,...nativeCounts(r.log)}));
const worker=json(root+'/bookmark-portable-evidence/RESULT.json');assert.equal(worker.verification.exitCode,0);
for(const row of worker.files){assert.equal(sha(read(site+'/'+row.path)),row.resultSha256);assert.equal(sha(read(root+'/'+row.preimage)),row.preimageSha256);}
const workerHashCorrections=[];
for(const[p,hash]of Object.entries(worker.sourceHashes)){
 const actual=sha(read(site+'/'+p));
 if(p==='lib/head-learning-bookmark.ts'&&hash==='ae5a590f8dc9ec6f50b23982eae8e193f73ee220ed7c9e32afdd7d003e23f25d3'){
  assert.equal(hash.length,65);const pinned=parent.sourceRows.find(row=>row.path===p);assert(pinned);assert.equal(actual,pinned.sha256);assert.equal(sha(read(parent.website+'/'+p)),actual);
  workerHashCorrections.push({path:p,reportedMalformedHash:hash,verifiedSha256:actual,parentSourceReceipt:prep.sourceReceipt,reason:'65-character worker receipt transcription error; independent current/original/source-manifest bytes match. Original receipt retained.'});
 }else assert.equal(actual,hash);
}
assert.equal(sha(read(root+'/'+worker.verification.log)),worker.verification.logSha256);
native.push({phase:'bookmark-worker',log:root+'/'+worker.verification.log,...nativeCounts(root+'/'+worker.verification.log)});
const ts=createRequire(site+'/package.json')('typescript');
const calls=text=>{const s=ts.createSourceFile('test.ts',text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),a=[];function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(s)==='test')a.push(n.getText(s));ts.forEachChild(n,visit);}visit(s);return a;};
let inverse=read(site+'/tests/head-learning-bookmark-ui.test.ts').toString();
inverse=inverse.replace("'../lib/head-learning-bookmark.ts'","'file:///F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website/lib/head-learning-bookmark.ts'")
 .replace("'../lib/head-atlas-learning.ts'","'file:///F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website/lib/head-atlas-learning.ts'")
 .replace("new URL('../components/head-learning-bookmark.css',import.meta.url)","new URL('file:///F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website/components/head-learning-bookmark.css')");
assert.equal(inverse,read(root+'/bookmark-portable-evidence/head-learning-bookmark-ui.test.ts.preimage').toString());
assert.equal(calls(inverse).length,20);
const source=json(site+'/atlas-review/manifest.json'),binding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(source.revision,prep.atlasHead);assert.equal(source.files.length,1567);assert.equal(binding.inputs.length,1734);assert.equal(source.websiteIntegrationSha256,binding.sha256);
const previousView=json(parent.website+'/public/atlas-review-viewer/manifest.json'),currentView=json(site+'/public/atlas-review-viewer/manifest.json');assert.deepEqual(previousView,currentView);assert.notEqual(currentView.sourceCommit,source.revision);
assert.deepEqual(read(site+'/tests/fixtures/current-atlas-delivery.json'),read(parent.website+'/tests/fixtures/current-atlas-delivery.json'));
assert.deepEqual(read(site+'/tests/current-atlas-delivery.mjs'),read(parent.website+'/tests/current-atlas-delivery.mjs'));
const originalImporter=read(root+'/preimage/scripts/import-clinical-review.mjs').toString();
assert.equal(read(site+'/scripts/import-clinical-review.mjs').toString().replace(`const revision = '${prep.atlasHead}';`,`const revision = '${parent.atlasHead}';`),originalImporter);
const names=new Set([...parent.sourceRows.map(r=>r.path),...prep.sourceOverlays.map(r=>r.path),...source.files.map(r=>'atlas-review/'+r.path),'atlas-review/integration-inputs.json']);
const parentByPath=new Map(parent.sourceRows.map(r=>[r.path,r]));
const sourceRows=[...names].sort().map(p=>{assert(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>s==='..'||s==='.'||!s));const b=read(site+'/'+p);assert(fs.lstatSync(site+'/'+p).isFile()&&!fs.lstatSync(site+'/'+p).isSymbolicLink());return{path:p,bytes:b.length,sha256:sha(b)};});
const changes=sourceRows.filter(row=>row.sha256!==parentByPath.get(row.path)?.sha256);
const allowed=new Set([...prep.sourceOverlays.map(r=>r.path),'scripts/import-clinical-review.mjs','scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts',...['root','nested','independent','reference','index'].map(s=>'docs/anatomy-coverage/'+s+'.json')]);
for(const row of changes)assert(row.path.startsWith('atlas-review/')||allowed.has(row.path),'Unexpected source change: '+row.path);
for(const row of parent.sourceRows)assert.equal(sha(read(parent.website+'/'+row.path)),row.sha256,'Parent drift: '+row.path);
assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.atlasHead);assert.equal(runGit(['-C',prep.atlas,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const evidence=[root+'/PREPARATION.json',root+'/COVERAGE_ADMISSION.json',...['import','coverage','bind','proof','ui','ui-only'].flatMap(p=>{const result=`${root}/evidence/${p}/RESULT.json`;return[result,...json(result).checks.map(r=>r.log)];}),root+'/bookmark-portable-evidence/RESULT.json',root+'/'+worker.verification.log,root+'/coverage/candidate-manifest.json',...['root','nested','independent','reference'].flatMap(p=>[root+'/coverage/'+p+'-receipt.json',root+'/coverage/'+p+'.log'])];
const snapshot={at:new Date().toISOString(),website:site,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,review:binding.sha256,importedSourceFiles:1567,reviewBindings:1734,sourceRows,sourcePaths:sourceRows.length,parentSource:prep.sourceReceipt,parentSourceSha256:prep.sourceReceiptSha256,status:'source-import-and-binding-only-not-admitted-delivery',previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
const report={at:snapshot.at,status:snapshot.status,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),sourcePaths:sourceRows.length,changes,native,nativePassing:native.reduce((n,r)=>n+r.pass,0),
 importedSourceFiles:1567,reviewBindings:1734,reviewIntegration:binding.sha256,coverageSourceInputs:171,coverageScopes:4,
 currentMaterials:{rootWorksheets:1104,changedSnapshots:22,unchangedSnapshots:1082,changedTopicPlacements:89,pendingTopicPlacements:525,importEqualsDirectAtlas:true},
 preserved:{bookmarkComponent:worker.sourceHashes['components/HeadLearningBookmark.tsx'],bookmarkTestCalls:20,coverageGuards:true,existingRuntimeAndViewer:true,currentDeliveryGateAndPinUnchanged:true,parentSourceUnchanged:true},
 pendingCurrentDelivery:{classification:'Expected fail-closed incomplete delivery, not a relaxed/passing release gate',log:mixed.checks[0].log,logSha256:mixed.checks[0].logSha256,nativeFailureEntries:1,passingUiRecords:64,reason:'Review imports now identify7978478 but existing viewer/runtime/current-delivery fixture remain at2381. Must produce/rebuild/rebind/verify the full delivery before admitting a new current fixture.',rendererRuntimeBuildPending:true,wholeProjectTypesPending:true,browserPending:true,plexusDependencyRebindPending:true},
 workerHashCorrections,localEvidence:[...new Set(evidence)].map(p=>({path:p,sha256:sha(read(p))})),installed:false,previewChanged:false,clinicalApproval:false,spatialRegistration:false,wholeSuitePassing:false,publicDeployment:false};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({mainReview:root+'/MAIN_REVIEW.json',sha256:sha(read(root+'/MAIN_REVIEW.json')),source:root+'/SOURCE.json',sourceSha256:sha(read(root+'/SOURCE.json')),sourcePaths:sourceRows.length,changedPaths:changes.length,nativePassing:report.nativePassing,pendingCurrentDeliveryFailures:1,previewChanged:false}));
