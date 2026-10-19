import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const pin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(root+'/'+path);
const safe=path=>assert(/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..'));

test('closed55 current pin remains immutable historical evidence',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-55.json');
 assert.equal(sha(bytes),'f15fdf3f9959504ae83e08b777def63b8157dbf954d3721dae54cc9301186e23');
 const old=JSON.parse(bytes);
 assert.equal(old.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(old.reviewIntegration,'4f0846e90efe86c86ddbfb5817cbd8b82baaf1b05c3d6eead91caa85a320013d');
 assert.equal(old.reviewSourceFiles,1531);
 assert.equal(Object.keys(old.documents).length,12);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
});

test('closed 6ba delivery pin remains immutable historical evidence',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-6ba0dd43.json');
 assert.equal(sha(bytes),'dc317ee27d8e297255d77b3ad418da6066d73fd5b066074c52b88ed5473bc92b');
 const old=JSON.parse(bytes);
 assert.equal(old.source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
 assert.equal(old.sourceTree,'4ce7882a2748d2f190e4b4f8783af6416c7cf44b');
 assert.equal(old.reviewIntegration,'af91db5ca835c33841628a71b52e6aa0f18ef258260e4866529731ed86a68373');
 assert.equal(old.reviewSourceFiles,1528);
 assert.equal(Object.keys(old.documents).length,12);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
});

test('previous complete bc925 delivery and its contract stay exact but cannot admit the new source',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-bc925194.json');
 assert.equal(sha(bytes),'f50171ac10bcf767cc29eb34cae7e873ff526a3940b03a0a59fe6d932cf01eab');
 const old=JSON.parse(bytes);
 assert.equal(old.source,'bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f');
 assert.equal(old.sourceTree,'a26d0f391021c207f34d3d1449b4ed85f42239f7');
 assert.equal(old.reviewIntegration,'4fb502a3edb0a95e73fb154ccb5e7c720dab862d71c2b4230a6092ba530424b9');
 assert.equal(old.reviewSourceFiles,1514);assert.equal(Object.keys(old.documents).length,12);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 assert.equal(sha(read('tests/fixtures/current-atlas-delivery-bc925194.txt')),'c3ff732333006762cecc4899bae379cb42f56ae28f6fe1e100d331f3384502fc');
});

test('one current fixture binds exact source tree, four learners, protected Review and model registry',()=>{
 assert.equal(CURRENT_ATLAS_REVISION,'f5097af8493701d64a8e2a2b5797df380f3b348a');
 assert.equal(pin.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');
 assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read('atlas-review/integration-inputs.json')).inputs)));
 assert.equal(Object.keys(pin.documents).length,12);assert(currentAtlasDeliveryRoot());
 assert.deepEqual(validateCurrentAtlasDelivery(),pin);
 const detached=validateCurrentAtlasDelivery();detached.documents.foreign='0'.repeat(64);
 assert.deepEqual(validateCurrentAtlasDelivery(),pin,'Consumers cannot mutate the admitted default');
});

test('current fixture agrees with actual emitted bytes, notices, imported Review and integration inputs',()=>{
 let artifacts=0,sourceFiles=0,inputs=0;
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base=`public/atlas-runtime/${module}/`,manifest=JSON.parse(read(base+'manifest.json'));
  assert(manifest.files.some(f=>f.path==='LICENSES/THIRD_PARTY_NOTICES.md'));
  for(const row of manifest.files){safe(row.path);const path=base+row.path,stat=lstatSync(root+'/'+path);assert(stat.isFile()&&!stat.isSymbolicLink());const bytes=read(path);assert.equal(bytes.length,row.bytes,path);assert.equal(sha(bytes),row.sha256,path);artifacts++;}
 }
 const review=JSON.parse(read('atlas-review/manifest.json'));
 for(const row of review.files){safe(row.path);assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);sourceFiles++;}
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 for(const row of binding.inputs){safe(row.path);assert.equal(sha(read(row.path)),row.sha256,row.path);inputs++;}
 const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));
 for(const row of viewer.files){safe(row.path);assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);artifacts++;}
 assert.equal(sourceFiles,1541);assert(artifacts>100&&inputs>1500);
});

for(const [label,edit]of [
 ['source commit',p=>{p.source='0'.repeat(40);}],
 ['missing document',p=>{delete p.documents['atlas-review/manifest.json'];}],
 ['foreign document',p=>{p.documents['.env.local']='0'.repeat(64);}],
 ['changed document',p=>{p.documents['atlas-review/manifest.json']='0'.repeat(64);}],
 ['wrong Review count',p=>{p.reviewSourceFiles++;}],
 ['wrong viewer count',p=>{p.viewerFiles++;}],
 ['wrong package count',p=>{p.viewerPackages++;}],
 ['invented clinical approval',p=>{p.clinicalApproval=true;}],
 ['malformed tree',p=>{p.sourceTree='HEAD';}],
])test('current fixture refuses '+label,()=>{const bad=structuredClone(pin);edit(bad);assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));});

for(const [label,path,edit]of [
 ['one stale learner','public/atlas-runtime/head-neck/manifest.json',d=>{d.sourceCommit='0'.repeat(40);}],
 ['clinical clearance','public/atlas-runtime/shoulder/manifest.json',d=>{d.clinicalApproved=true;}],
 ['patient data admission','public/atlas-runtime/shoulder/manifest.json',d=>{d.patientDataIncluded=true;}],
 ['mixed Review','atlas-review/manifest.json',d=>{d.revision='0'.repeat(40);}],
 ['personal records','public/atlas-review-viewer/manifest.json',d=>{d.personalRecordsIncluded=true;}],
 ['debug Review','public/atlas-review-viewer/manifest.json',d=>{d.mode='debug';}],
 ['model substitution','lib/atlas-model-inventory.json',d=>{d.models.pop();}],
])test('repinning a hash cannot hide '+label,()=>{
 const bad=structuredClone(pin),document=JSON.parse(read(path));edit(document);
 const bytes=Buffer.from(JSON.stringify(document));bad.documents[path]=sha(bytes);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:p=>p===path?bytes:read(p)}));
});

test('previous8d delivery fixture is immutable historical evidence, not current admission',()=>{
 const bytes=readFileSync(new URL('./fixtures/current-atlas-delivery-8d32653e.json',import.meta.url));
 assert.equal(sha(bytes),'0e838f33bf76b1c9a39e05253e140e5425a33004c4ced87de755a60a6603337e');
 const historic=JSON.parse(bytes);
 assert.equal(historic.source,'8d32653eaac8b86521618c824214dd6af8e35e29');
 assert.equal(historic.sourceTree,'876d7c8b59a9507479b65e1800c2bea455b242ef');
 assert.equal(historic.reviewIntegration,'2e620c81c5ad25831b35dc93cc62c2d008829da455c16f65fcf2ddc8f2882f60');
 assert.equal(historic.reviewSourceFiles,1505);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:historic}));
});

test('previous f1 complete delivery proof remains immutable and cannot admit current delivery',()=>{
 const bytes=readFileSync(new URL('./fixtures/current-atlas-delivery-f1dc0ccc.json',import.meta.url));
 assert.equal(sha(bytes),'97fd4523bb0653b22ed878b027703273fafaafc600be09347cd07dd71c9bb21e');
 const historic=JSON.parse(bytes);assert.equal(historic.source,'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418');assert.equal(historic.sourceTree,'d3c165a126e773f004c9a620b5271bc15d0f384a');assert.equal(historic.reviewIntegration,'bbca7076adc53030a83772c457d2dec50aac6622defb45ce2c5510464f926297');assert.equal(historic.reviewSourceFiles,1508);assert.throws(()=>validateCurrentAtlasDelivery({pin:historic}));
 const proof=readFileSync(new URL('./fixtures/current-atlas-delivery-f1dc0ccc.txt',import.meta.url));assert.equal(sha(proof),'12d3a9ed4a7dbadeaf3ebbca3e6f96e665c1a86832c0f1e0f6a012e76e1958c4');
});

test('pre-focus same-source delivery remains frozen but cannot admit the changed website renderer',()=>{
 const bytes=readFileSync(new URL('./fixtures/current-atlas-delivery-before-desktop-focus.json',import.meta.url));assert.equal(sha(bytes),'978d254d315c1c9a54bcd268d47f1585549501561a276b6c5edd07ff19403216');
 const historicalPin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-58926355.json',import.meta.url)));
 const old=JSON.parse(bytes);assert.equal(old.source,historicalPin.source);assert.equal(old.sourceTree,historicalPin.sourceTree);assert.equal(old.reviewIntegration,'464ccf522d725e5636fb3c14429e371402f1f0832d0feaeed3c025d6906e7990');assert.notEqual(old.reviewIntegration,historicalPin.reviewIntegration);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 assert.equal(sha(readFileSync(new URL('./fixtures/current-atlas-delivery-before-desktop-focus.txt',import.meta.url))),'c72d0ca6c8e8d24dc8dd0a479f02317c00db6e7717a1dc55de948daa55a58c0c');
});

test('complete589 delivery and its original contract remain immutable historical evidence',()=>{
 const bytes=readFileSync(new URL('./fixtures/current-atlas-delivery-58926355.json',import.meta.url));
 assert.equal(sha(bytes),'3a29ea22a99e88869409f164ad50598e69106484e9b4f0603e4434e92d7df1f4');
 const old=JSON.parse(bytes);assert.equal(old.source,'589263554141ba94548f9073327d4e51674bc33b');
 assert.equal(old.sourceTree,'ba724f0a46448132a6e5fc4c24f63730b53540f9');assert.equal(old.reviewSourceFiles,1511);
 assert.equal(old.reviewIntegration,'56b9e31355b4e8a1671738e7f7d106edfbfcdb6af5e3e1f6e2699b225baf1ce2');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 assert.equal(sha(readFileSync(new URL('./fixtures/current-atlas-delivery-58926355.txt',import.meta.url))),'1768182752a3cba31451a536498642d0b00edee786a277e12d6011dc1af527e8');
});

test('pre-head-loading44b7 delivery remains exact historical proof, not current admission',()=>{
 const bytes=readFileSync(new URL('./fixtures/current-atlas-delivery-before-head-loading.txt',import.meta.url));
 assert.equal(sha(bytes),'cc4d8e7c8f4dbdd3afac7cfb7c01af18773a5e45d806d0bcd7e880747a9959d8');
 const old=JSON.parse(bytes);
 assert.equal(old.source,'bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f');
 assert.equal(old.sourceTree,'a26d0f391021c207f34d3d1449b4ed85f42239f7');
 assert.equal(old.reviewIntegration,'44b7f4a53c8e3fd96fba49438158143ef7967a0abfc6094f33310425d54efcec');
 assert.equal(old.reviewSourceFiles,1514);assert.equal(old.viewerFiles,46);assert.equal(old.viewerPackages,22);
 assert.notEqual(old.reviewIntegration,pin.reviewIntegration);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
});
