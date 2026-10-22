// Retain the full old source contract and validator; change only declared current roles.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate',state=json(root+'/SOURCE_IMPORT.json'),site=state.website;
assert.equal(state.code,0);assert.equal(state.source,'4f20ae0b62b9e0dab5936b430575a983dcdd934e');assert.equal(state.boundInputs,1728);assert.equal(state.importedSources,1561);assert(!fs.existsSync(root+'/DELIVERY_ADMISSION.json'));
const prep=json(root+'/WEBSITE_PREPARED.json'),prior=json(prep.sourceReceipt).website;
const beforeTest=read(prior+'/tests/current-atlas-delivery.test.mjs'),beforePin=read(prior+'/tests/fixtures/current-atlas-delivery.json');
assert.equal(sha(beforeTest),'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb');
assert.equal(sha(beforePin),'e21465496188fb9c0bd743dd98cfcf0251bd0125a84ec457392b893be0a57237');
assert.deepEqual(read(site+'/tests/current-atlas-delivery.test.mjs'),beforeTest);
assert.deepEqual(read(site+'/tests/current-atlas-delivery.mjs'),read(prior+'/tests/current-atlas-delivery.mjs'));
const seams=[['389bd0ca846a42c7f21055f55904bcf5df81a09f',state.source,2],['25acdee40ee57e0253cdcca924aa64b4b38586c8',state.tree,1],
 ['assert.equal(sourceFiles,1560);assert.equal(inputs,1727);','assert.equal(sourceFiles,1561);assert.equal(inputs,1728);',1]];
let next=beforeTest.toString();for(const[from,to,count]of seams){assert.equal(next.split(from).length,count+1);next=next.replaceAll(from,to);}
let inverse=next;for(const[from,to]of [...seams].reverse())inverse=inverse.replaceAll(to,from);assert.equal(inverse,beforeTest.toString());
const testFixture='tests/fixtures/current-atlas-delivery-before-renal-source-20261022.mjs.raw',pinFixture='tests/fixtures/current-atlas-delivery-before-renal-source-20261022.json';
for(const[p,b]of [[testFixture,beforeTest],[pinFixture,beforePin]]){assert(!fs.existsSync(site+'/'+p));fs.writeFileSync(site+'/'+p,b,{flag:'wx'});}
fs.writeFileSync(site+'/tests/current-atlas-delivery.test.mjs',next);
for(const[from,to]of [['renal-delivery-transition-20261022.test.mjs','tests/atlas-renal-delivery-transition.test.mjs'],['renal-tour-website-integration-20261022.test.mjs','tests/atlas-renal-source-tour.test.mjs']]){
 assert(!fs.existsSync(site+'/'+to));fs.copyFileSync(path.resolve(from),site+'/'+to,fs.constants.COPYFILE_EXCL);
}
const previous=json(prep.sourceReceipt),missing=previous.sourceRows.filter(r=>!fs.existsSync(site+'/'+r.path));
for(const r of missing){assert(/^public\/atlas-review-viewer\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(r.path),r.path);assert.equal(sha(read(prior+'/'+r.path)),r.sha256);
 fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(prior+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(site+'/'+r.path)),r.sha256);}
const result={at:new Date().toISOString(),source:state.source,tree:state.tree,review:state.review,seams,testFixture,pinFixture,originalTestSha256:sha(beforeTest),originalPinSha256:sha(beforePin),
 currentTestSha256:sha(read(site+'/tests/current-atlas-delivery.test.mjs')),restoredCompatibilityAssets:missing,allOldAssertionsPreserved:true,validatorChanged:false,
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/DELIVERY_ADMISSION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/DELIVERY_ADMISSION.json',sha256:sha(read(root+'/DELIVERY_ADMISSION.json')),currentTestSha256:result.currentTestSha256,restoredCompatibilityAssets:missing.length,ownerPreviewChanged:false}));
