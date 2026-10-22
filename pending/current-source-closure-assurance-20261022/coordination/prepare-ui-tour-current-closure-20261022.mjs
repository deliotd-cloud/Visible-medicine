// Four current/historical UI test roles, with their complete original bodies retained.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-ui-tour-current-history-closure';
const receipt='F:/VisibleMedicine/staging/20261022-historical-admission-assurance/SOURCE_V3.json';
assert.equal(sha(read(receipt)),'d769eb7da674dd534f3e220a1b32b1a176c321ce39602d84ae9862a942c0989a');
const source=json(receipt),site=source.website,old='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',now=source.atlasHead;
const oldTree='e9165d7122361f809a267af1414b337b69097fe2',newTree=source.atlasTree;
const rows=[{name:'review-navigation-delivery-preservation.test.mjs',seams:[
 ["import {beforeCompactDeliveryTest,beforeCompactPin,compactInputs} from './review-frame-history-inverse.mjs';",
  "import {beforeCompactDeliveryTest,beforeCompactPin,compactInputs} from './review-frame-history-inverse.mjs';\nimport {restorePreNeckPin2381,restorePreNeckDelivery2381} from './zero-registration-current-roles-inverse.mjs';"],
 ["beforeCompactDeliveryTest(read('tests/current-atlas-delivery.test.mjs').toString())",
  "beforeCompactDeliveryTest(restorePreNeckDelivery2381(read('tests/current-atlas-delivery.test.mjs'),read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw')).toString())"],
 ['assert.equal(currentBinding.inputs.length,1724);','assert.equal(currentBinding.inputs.length,1729);'],
 ["beforeCompactPin(read('tests/fixtures/current-atlas-delivery.json'))",
  "beforeCompactPin(restorePreNeckPin2381(read('tests/fixtures/current-atlas-delivery.json'),read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json')))"],
 ]},{name:'ui-teaching-current-delivery.test.mjs',seams:[
 ['assert.equal(delivery.reviewSourceFiles, 1558);','assert.equal(delivery.reviewSourceFiles, 1562);'],
 ['assert.equal(inputs.inputs.length, 1724);','assert.equal(inputs.inputs.length, 1729);'],
 ]},{name:'ui-teaching-admission-contract.test.mjs',seams:[
 [`assert.equal(live.source,'${old}');`,`assert.equal(live.source,'${now}');`],
 [`assert.equal(live.sourceTree,'${oldTree}');`,`assert.equal(live.sourceTree,'${newTree}');`],
 ["assert.equal(live.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');",`assert.equal(live.reviewIntegration,'${source.review}');`],
 ['assert.equal(live.reviewSourceFiles,1558);','assert.equal(live.reviewSourceFiles,1562);'],
 ["assert.equal(sha(bindingBytes),'3c159e7d1abecd4735ed5182cd9143a968a15718f6abc6a0faccd504c0c66513','Exact current Review binding document');",`assert.equal(sha(bindingBytes),'${sha(read(site+'/atlas-review/integration-inputs.json'))}','Exact current Review binding document');`],
 ['assert.equal(binding.inputs.length,1724);','assert.equal(binding.inputs.length,1729);'],
 ]},{name:'tour-discovery-current-delivery.test.mjs',seams:[
 [`assert.equal(CURRENT_ATLAS_REVISION,'${old}');`,`assert.equal(CURRENT_ATLAS_REVISION,'${now}');`],
 [`assert.equal(current.sourceTree,'${oldTree}');`,`assert.equal(current.sourceTree,'${newTree}');`],
 ['assert.equal(current.reviewSourceFiles,1558);','assert.equal(current.reviewSourceFiles,1562);'],
 ['assert.equal(inputs.inputs.length,1724);','assert.equal(inputs.inputs.length,1729);'],
 ]}];
assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(root+'/tests');fs.mkdirSync(root+'/preimages');
for(const row of rows){const from=site+'/tests/'+row.name,bytes=read(from);assert.equal(sha(bytes),source.sourceRows.find(r=>r.path==='tests/'+row.name).sha256);assert.deepEqual(Buffer.from(bytes.toString()),bytes);
 let text=bytes.toString();for(const[a,b]of row.seams){assert.equal(text.split(a).length,2,row.name+': unique forward seam');text=text.replace(a,b);}
 let inverse=text;for(const[a,b]of [...row.seams].reverse()){assert.equal(inverse.split(b).length,2,row.name+': unique inverse seam');inverse=inverse.replace(b,a);}assert.equal(inverse,bytes.toString());
 fs.copyFileSync(from,root+'/preimages/'+row.name+'.raw',fs.constants.COPYFILE_EXCL);fs.writeFileSync(root+'/tests/'+row.name,text,{flag:'wx'});row.before=sha(bytes);row.after=sha(Buffer.from(text));
}
const {restorePreNeckPin2381,restorePreNeckDelivery2381}=await import(pathToFileURL(site+'/tests/zero-registration-current-roles-inverse.mjs'));
const {beforeCompactDeliveryTest,beforeCompactPin}=await import(pathToFileURL(site+'/tests/review-frame-history-inverse.mjs'));
const pin=restorePreNeckPin2381(read(site+'/tests/fixtures/current-atlas-delivery.json'),read(site+'/tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json'));
const delivery=restorePreNeckDelivery2381(read(site+'/tests/current-atlas-delivery.test.mjs'),read(site+'/tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'));
const compact=beforeCompactDeliveryTest(delivery.toString()),seam='assert.equal(inputs,1712)';assert.equal(compact.split(seam).length,2);
assert.equal(compact.replace(seam,'assert.equal(inputs,1710)'),read(site+'/tests/fixtures/review-navigation-delivery/current-atlas-delivery.test.mjs.raw').toString());
const prior=json(site+'/tests/fixtures/review-navigation-delivery/current-atlas-delivery.json.raw'),historical=beforeCompactPin(pin),inverse=structuredClone(historical);
inverse.reviewIntegration=prior.reviewIntegration;inverse.documents=prior.documents;assert.deepEqual(inverse,prior);
for(const invalid of [Buffer.concat([pin,Buffer.from(' ')]),Buffer.from('{}')])assert.throws(()=>restorePreNeckPin2381(invalid,pin));
const tests=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=${JSON.stringify(rows,null,2)},sha=b=>createHash('sha256').update(b).digest('hex');
function inverse(row,text){for(const[from,to]of [...row.seams].reverse()){assert.equal(text.split(to).length,2,'Unique exact inverse');text=text.replace(to,from);}return text;}
test('all four complete UI/navigation/tour source bodies preserve every historical and refusal assertion',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/ui-tour-current-before/'+row.name+'.raw',import.meta.url)),after=readFileSync(new URL('./'+row.name,import.meta.url));assert.equal(sha(before),row.before);assert.equal(sha(after),row.after);assert.equal(inverse(row,after.toString()),before.toString());}
});
test('foreign assertions and changed current-role seams cannot pass the complete original-source proof',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/ui-tour-current-before/'+row.name+'.raw',import.meta.url)).toString(),after=readFileSync(new URL('./'+row.name,import.meta.url)).toString();
  assert.throws(()=>assert.equal(inverse(row,after+'\\n/* forged */'),before));
  assert.throws(()=>assert.equal(inverse(row,after.replace(row.seams[0][1],row.seams[0][1]+'/* forged */')),before));}
});
`;
fs.writeFileSync(root+'/tests/ui-tour-current-role-preservation.test.mjs',tests,{flag:'wx'});
const result={at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),rows:rows.map(row=>({...row,proposed:root+'/tests/'+row.name,preimage:root+'/preimages/'+row.name+'.raw'})),
 addedTest:{path:root+'/tests/ui-tour-current-role-preservation.test.mjs',sha256:sha(read(root+'/tests/ui-tour-current-role-preservation.test.mjs'))},
 sourceOnlyProofPassed:true,wholeOriginalBodiesPreserved:true,currentToCompactHistoryComposedExactly:true,nativeNotRun:true,productChanged:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json')),roots:4,pureCurrentCompactInverseVerified:true}));
