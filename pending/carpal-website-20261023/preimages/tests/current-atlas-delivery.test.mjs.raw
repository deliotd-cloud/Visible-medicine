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
 assert.equal(CURRENT_ATLAS_REVISION,'be9b53d96c37f1ea973e60f5981ad80db0893177');
 assert.equal(pin.sourceTree,'f94d89f76d1b29f2aeb5d66d23dd5b0cf5a55ff6');
 assert.deepEqual(pin.runtimeSources,{
  'head-neck':'be9b53d96c37f1ea973e60f5981ad80db0893177',
  shoulder:'be9b53d96c37f1ea973e60f5981ad80db0893177',
  'lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
  'female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 });
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
 assert.equal(sourceFiles,1576);assert.equal(inputs,1745);assert(artifacts>100);
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
 ['missing runtime source',p=>{delete p.runtimeSources.shoulder;}],
 ['foreign runtime source',p=>{p.runtimeSources.specimen='0'.repeat(40);}],
 ['malformed runtime source',p=>{p.runtimeSources['lower-limb']='HEAD';}],
])test('current fixture refuses '+label,()=>{const bad=structuredClone(pin);edit(bad);assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));});

for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 test('current fixture refuses wrong '+module+' runtime source even with a repinned document',()=>{
  const path=`public/atlas-runtime/${module}/manifest.json`,bad=structuredClone(pin),manifest=JSON.parse(read(path));
  manifest.sourceCommit='0'.repeat(40);
  const bytes=Buffer.from(JSON.stringify(manifest));bad.documents[path]=sha(bytes);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:p=>p===path?bytes:read(p)}));
 });
 test('current fixture refuses wrong '+module+' admitted source',()=>{
  const bad=structuredClone(pin);bad.runtimeSources[module]='0'.repeat(40);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
 });
}

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

test('complete f509 source and whole original contracts remain frozen outside explicit current-admission seams',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-f5097af8.json');assert.equal(sha(bytes),'b683fcb7b38b83c97c49bdc2a2903ced10de2cb69cc16a80959bbe8f21a7409a');
 const old=JSON.parse(bytes);assert.equal(old.source,'f5097af8493701d64a8e2a2b5797df380f3b348a');assert.equal(old.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');assert.equal(old.reviewIntegration,'a4dbbd06443804be3d16ae0f73313504ce6782e12cd98ca161b21b3052bc94d8');assert.equal(old.reviewSourceFiles,1541);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const original=read('tests/fixtures/current-atlas-delivery-f5097af8.txt');assert.equal(sha(original),'a7ce97681413483667399d7d8388231c842082dd87a2eb8648d13751cf30aafa');
 const text=original.toString(),current=read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.test.mjs.raw').toString(),prefix=current.slice(0,current.indexOf("\ntest('complete f509"));
 assert.equal(prefix.replace("assert.equal(CURRENT_ATLAS_REVISION,'a2475a37201bdd5fdd12f5849fc8ee043412d02f');","assert.equal(CURRENT_ATLAS_REVISION,'f5097af8493701d64a8e2a2b5797df380f3b348a');").replace("assert.equal(pin.sourceTree,'97957a35788028b319df4f5d60c68a95e71320d7');","assert.equal(pin.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');").replace('assert.equal(sourceFiles,1545);assert.equal(inputs,1682);assert(artifacts>100);','assert.equal(sourceFiles,1541);assert(artifacts>100&&inputs>1500);'),text,'Every original source/model/Review/refusal assertion is preserved outside exact source/tree/observed-count seams');
 const ui=read('tests/fixtures/ui-teaching-current-delivery-f5097af8.mjs.raw');assert.equal(sha(ui),'137b8031035f8c15db0b0f8775abddef7819aad22af43ca7682903aee668b786');
 assert.equal(read('tests/fixtures/tongue-palate-a247/ui-teaching-current-delivery.test.mjs.raw').toString(),ui.toString().replace('assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1545);').replace('assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1682);'),'Only two observed a247-count seams change; whole original behavioral bodies remain exact');
});

test('pre-ileocolic 4d19 delivery is immutable and refused by the new source epoch',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-pre-ileocolic-4d19.json');
 assert.equal(sha(bytes),'7f42de4aa82acf32c5cf7b89f02dfdf7d5c13cb360a10ad2bae8f0c1ad8a68ee');
 const old=JSON.parse(bytes);
 assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');
 assert.equal(old.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');
 assert.equal(old.reviewIntegration,'4d19f9f2e465a772f5ea6da4a3605c09d9f0d540bde3f63735ff653d393c60ad');
 assert.equal(old.reviewSourceFiles,1543);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
});

test('aaa8 delivery and its complete pre-entry contract remain historical and byte exact',()=>{
 const pinBytes=read('tests/fixtures/current-atlas-delivery-aaa8a6a4.json');
 assert.equal(sha(pinBytes),'d0550d6202c5121489f16a1ce292226994d7f525c9c1d8da8b0822822ecb48d2');
 const old=JSON.parse(pinBytes);
 assert.equal(old.source,'aaa8a6a428e74a2055310630f9dfee8731fe0eee');
 assert.equal(old.sourceTree,'7c0b886d66d2adf64d6d29e44938f39d8cd61046');
 assert.equal(old.reviewIntegration,'d7036f8da6dae70ead5f54469c8e8a9511a94aecfc8da3833d26f20476012e1b');
 assert.equal(old.reviewSourceFiles,1544);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const before=read('tests/fixtures/current-atlas-delivery-before-review-entry.mjs.raw');
 assert.equal(sha(before),'49dbe4d46facced8194ed35ebc8b1b50b927c5892c5b05fec665b69ce65c3a6f');
 const current=read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.test.mjs.raw').toString();
 const start="\ntest('aaa8 delivery and its complete pre-entry contract remain historical and byte exact'";
 const index=current.indexOf(start);
 assert(index>0&&current.lastIndexOf(start)===index);
 let inverse=current.slice(0,index);
 const back=(from,to,count)=>{
  assert.equal(inverse.split(from).length-1,count,`Exact current seam: ${from}`);
  inverse=inverse.split(from).join(to);
 };
 back('a2475a37201bdd5fdd12f5849fc8ee043412d02f','aaa8a6a428e74a2055310630f9dfee8731fe0eee',2);
 back('97957a35788028b319df4f5d60c68a95e71320d7','7c0b886d66d2adf64d6d29e44938f39d8cd61046',2);
 back('assert.equal(sourceFiles,1545);assert.equal(inputs,1682);assert(artifacts>100);',
  'assert.equal(sourceFiles,1544);assert.equal(inputs,1681);assert(artifacts>100);',2);
 back("'assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1545);'",
  "'assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1544);'",1);
 back("'assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1682);'",
  "'assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1681);'",1);
 assert.equal(inverse,before.toString(),'Every earlier historical, auth, tamper and semantic assertion survives exact live seams');
});

test('6036 current-delivery contract is preserved by exact source/tree/count inverse',()=>{
 const original=read('tests/fixtures/current-atlas-delivery.before-mra-6036.mjs.raw');
 assert.equal(sha(original),'6233c1028f9478b2bb4d7733a5b48c5427e69990fec8e5bfed106d77b3f615a6');
 const current=read('tests/fixtures/current-delivery-test-before-roving.mjs.raw').toString();
 const marker="\ntest('6036 current-delivery contract is preserved by exact source/tree/count inverse'";
 assert.equal(current.split(marker).length,2);
 let inverse=current.slice(0,current.indexOf(marker));
 const one=(from,to)=>{assert.equal(inverse.split(from).length,2,`Exact admission seam: ${from}`);inverse=inverse.replace(from,to);};
 one("assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
  "assert.equal(CURRENT_ATLAS_REVISION,'6036a7a59dcc1fd75eee4a23af34ca2a568d86b6');");
 one("assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');",
  "assert.equal(pin.sourceTree,'6da62962106cfab9419b09618547a9da5e3aafc6');");
 one('assert.equal(sourceFiles,1548);assert.equal(inputs,1695);assert(artifacts>100);',
  'assert.equal(sourceFiles,1548);assert.equal(inputs,1685);assert(artifacts>100);');
 assert.equal(inverse,original.toString(),'Every historical pin, tamper, source and approval refusal remains exact');
 const stale=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-mra-6036.json'));
 assert.equal(sha(read('tests/fixtures/current-atlas-delivery-before-mra-6036.json')),'13a8fe34b87cdb3a4e14ab5146e6d42c3ca79e9180ecdae9938ab8f97c6b6ea6');
 assert.equal(stale.source,'6036a7a59dcc1fd75eee4a23af34ca2a568d86b6');
 assert.equal(stale.sourceTree,'6da62962106cfab9419b09618547a9da5e3aafc6');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:stale}),'Stale prebind fixture cannot admit current source');
});
