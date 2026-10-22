// Coherent test-only successor: current delivery and historical evidence remain distinct.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'ff37b7b498682fed64b4a593a91bdc0584757a6dff208b844345cf5748c49f8e');
const failed=json(path.dirname(receipt)+'/native-integration/TERMINAL.json');assert.equal(failed.code,1);assert.equal(failed.counts.fail,1);assert.deepEqual(failed.sourceDrift,[]);
const selected=[];
const rowRoot='F:/VisibleMedicine/staging/20261022-spinal-neck-row-followup';
for(const[p,hash]of [['tests/atlas-spinal-muscle-xray.test.mjs','887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308'],
 ['tests/spinal-current-source-inverse.mjs','cd59ab680f8bbbccfe4b4d8a7b512493388329af3086d1397427b34ea41b7e4b']])selected.push({root:rowRoot,path:p,sha256:hash});
const four='F:/VisibleMedicine/staging/20261022-four-consumer-source-followup',fourReceipt=four+'/evidence/RESULT.json';
assert.equal(sha(read(fourReceipt)),'40f443e822748f37bf8f3e53d0f033c8df6f770b41d5e2d2caf5cd052a672280');
const fourResult=json(fourReceipt);assert.equal(Object.keys(fourResult.code).length,5);
for(const[p,hash]of Object.entries(fourResult.code))selected.push({root:four,path:p,sha256:hash});
const teaching='F:/VisibleMedicine/staging/20261022-two-teaching-consumer-followup',teachingReceipt=teaching+'/evidence/RESULT.json';
assert.match(process.argv[2]??'',/^[a-f0-9]{64}$/);assert.equal(sha(read(teachingReceipt)),process.argv[2]);
const teachingResult=json(teachingReceipt);
assert.deepEqual(Object.keys(teachingResult.code).sort(),['tests/clinical-review-median-cubital-xray.test.ts','tests/clinical-review-vocal-tissue-teaching.test.ts','tests/teaching-consumer-source-inverse.mjs']);
for(const[p,hash]of Object.entries(teachingResult.code))selected.push({root:teaching,path:p,sha256:hash});
assert.equal(selected.length,10);assert.equal(new Set(selected.map(r=>r.path)).size,10);
const overlays=selected.map(r=>{assert(r.path.startsWith('tests/'));const code=r.root+'/CODE/'+r.path;assert.equal(sha(read(code)),r.sha256);
 const old=source.sourceRows.find(v=>v.path===r.path),before=r.root+'/RAW/'+r.path;
 if(old)assert.equal(sha(read(before)),old.sha256,'Exact frozen preimage '+r.path);
 return {path:r.path,code,sha256:r.sha256,beforeSha256:old?.sha256??null,...(old?{before}:{})};});
const root='F:/VisibleMedicine/staging/20261022-current-consumer-assurance-successor',planPath=path.resolve('current-consumer-assurance-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const result=prepareUiSuccessor(planPath);assert.equal(result.sourcePaths,6185);assert.equal(result.review,source.review);assert.deepEqual(result.changedProductPaths,[]);
const tests=[...json(path.dirname(receipt)+'/NATIVE_PLAN.json').tests,
 'tests/atlas190-current-delivery.test.mjs','tests/colic-adapter-inverse.test.mjs','tests/current-delivery-admission-485.test.mjs','tests/current-head-index-whole-role-transition-20261021.test.mjs',
 'tests/clinical-review-median-cubital-xray.test.ts','tests/clinical-review-vocal-tissue-teaching.test.ts'];
assert.equal(tests.length,13);
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Actual thirteen-root test-only current-source/historical-inverse assurance with complete original theorems retained, including real teaching Review/import/emitted checks and neck-only row-shape correction. All product/binding/runtime/model/dependency bytes unchanged; not a whole-suite, clinical or deployment certificate.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),nativeRoots:tests.length,sourcePaths:result.sourcePaths,productAndBindingUnchanged:true,ownerPreviewChanged:false}));
