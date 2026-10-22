// Preserve original current-delivery assertions; admit only this exact source delta.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate',state=json(stage+'/SOURCE_IMPORT.json'),site=state.website;
assert.equal(state.code,0);assert(!fs.existsSync(stage+'/DELIVERY_ADMISSION.json'));
const before='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',after=state.source;
const prior='F:/VisibleMedicine/staging/20261022-review-return-refresh-successor/website';
const beforeTest=read(prior+'/tests/current-atlas-delivery.test.mjs'),beforePin=read(prior+'/tests/fixtures/current-atlas-delivery.json');
assert.equal(sha(beforeTest),'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea');
assert.equal(sha(beforePin),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d');
assert.deepEqual(read(site+'/tests/current-atlas-delivery.test.mjs'),beforeTest);
const seams=[
 [before,after,2],
 ['e9165d7122361f809a267af1414b337b69097fe2',state.tree,1],
 ['assert.equal(sourceFiles,1558);assert.equal(inputs,1724);','assert.equal(sourceFiles,1560);assert.equal(inputs,1726);',1],
];
let next=beforeTest.toString();for(const[from,to,count]of seams){assert.equal(next.split(from).length,count+1,from);next=next.replaceAll(from,to);}
let inverse=next;for(const[from,to]of [...seams].reverse())inverse=inverse.replaceAll(to,from);assert.equal(inverse,beforeTest.toString());
const testFixture='tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw',pinFixture='tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json';
for(const[p,b]of[[testFixture,beforeTest],[pinFixture,beforePin]]){assert(!fs.existsSync(site+'/'+p));fs.writeFileSync(site+'/'+p,b,{flag:'wx'});}
fs.writeFileSync(site+'/tests/current-atlas-delivery.test.mjs',next);
const additive=path.resolve('neck-xray-delivery-transition-20261022.test.mjs');
assert(fs.existsSync(additive));assert(!fs.existsSync(site+'/tests/atlas-neck-xray-delivery-transition.test.mjs'));
fs.copyFileSync(additive,site+'/tests/atlas-neck-xray-delivery-transition.test.mjs');
const proposal='F:/VisibleMedicine/staging/20261022-neck-xray-delivery-check-proposal/CODE/tests/atlas-neck-landmark-xray.test.mjs';
assert.equal(sha(read(proposal)),'7bab52a8598eb7430f6c8bae3042f3da65726b23975b4934253ec1273f2656b3');
assert(!fs.existsSync(site+'/tests/atlas-neck-landmark-xray.test.mjs'));fs.copyFileSync(proposal,site+'/tests/atlas-neck-landmark-xray.test.mjs');
const result={at:new Date().toISOString(),website:site,source:after,tree:state.tree,review:state.review,seams,testFixture,pinFixture,
 originalTestSha256:sha(beforeTest),originalPinSha256:sha(beforePin),currentTestSha256:sha(read(site+'/tests/current-atlas-delivery.test.mjs')),
 originalAssertionsPreserved:true,validatorChanged:false,originalRunPending:true,successorRunPending:true,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/DELIVERY_ADMISSION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
