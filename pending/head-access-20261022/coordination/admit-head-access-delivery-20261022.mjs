// Explicit successor roles only; retain the complete prior contract and validator.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',state=json(root+'/SOURCE_IMPORT.json'),site=state.website;
assert.equal(state.code,0);assert.equal(state.source,'ea70b126efc1b9a4e9c9b576587f922650145e53');assert.equal(state.boundInputs,1728);assert.equal(state.importedSources,1561);
assert(!fs.existsSync(root+'/DELIVERY_ADMISSION.json'));
const prep=json(root+'/WEBSITE_PREPARED.json'),previous=json(prep.sourceReceipt),prior=previous.website;
assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);
const beforeTest=read(prior+'/tests/current-atlas-delivery.test.mjs'),beforePin=read(prior+'/tests/fixtures/current-atlas-delivery.json');
assert.equal(sha(beforeTest),'2c22ebddc061915b2fd44c3a283d2eff9d363032efc516026c734291511aeefe');
assert.equal(sha(beforePin),'26933727f44c6171a01db3e2ddf06ffd748e08f4107e597fcf4e039f0af67708');
assert.deepEqual(read(site+'/tests/current-atlas-delivery.test.mjs'),beforeTest);
assert.deepEqual(read(site+'/tests/current-atlas-delivery.mjs'),read(prior+'/tests/current-atlas-delivery.mjs'));
const seams=[['4f20ae0b62b9e0dab5936b430575a983dcdd934e',state.source,2],['64f085e1f8b63b5f17daf8b107efcbe40bb7596c',state.tree,1]];
let next=beforeTest.toString();for(const[from,to,count]of seams){assert.equal(next.split(from).length,count+1);next=next.replaceAll(from,to);}
let inverse=next;for(const[from,to]of [...seams].reverse())inverse=inverse.replaceAll(to,from);assert.equal(inverse,beforeTest.toString());
const testFixture='tests/fixtures/current-atlas-delivery-before-head-access-20261022.mjs.raw',pinFixture='tests/fixtures/current-atlas-delivery-before-head-access-20261022.json';
for(const[p,b]of [[testFixture,beforeTest],[pinFixture,beforePin]]){assert(!fs.existsSync(site+'/'+p));fs.writeFileSync(site+'/'+p,b,{flag:'wx'});}
fs.writeFileSync(site+'/tests/current-atlas-delivery.test.mjs',next);
const missing=previous.sourceRows.filter(r=>!fs.existsSync(site+'/'+r.path));
for(const r of missing){assert(/^public\/atlas-review-viewer\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(r.path),r.path);assert.equal(sha(read(prior+'/'+r.path)),r.sha256);
 fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(prior+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(site+'/'+r.path)),r.sha256);}
const result={at:new Date().toISOString(),source:state.source,tree:state.tree,review:state.review,seams,testFixture,pinFixture,originalTestSha256:sha(beforeTest),originalPinSha256:sha(beforePin),
 currentTestSha256:sha(read(site+'/tests/current-atlas-delivery.test.mjs')),restoredCompatibilityAssets:missing,allOldAssertionsPreserved:true,validatorChanged:false,
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/DELIVERY_ADMISSION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/DELIVERY_ADMISSION.json',sha256:sha(read(root+'/DELIVERY_ADMISSION.json')),restoredCompatibilityAssets:missing.length}));
