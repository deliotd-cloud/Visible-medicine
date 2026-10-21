import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const changes=[
 ['current-atlas-delivery.test.mjs','e3eea7022e2154634b51f44d5d94a9dc9701ee9fb527f7c6f412f1aa7cdd169f',[
  ["assert.equal(CURRENT_ATLAS_REVISION,'485df97c2530e8e81a8d39a5ee61073ce76d93db');","assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"],
  ["assert.equal(pin.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');","assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');"],
  ['assert.equal(sourceFiles,1550);assert.equal(inputs,1707);','assert.equal(sourceFiles,1548);assert.equal(inputs,1696);'],
 ]],
 ['ui-teaching-current-delivery.test.mjs','78919d9a82605a2c24bb4a490e0a5e5cc04549d15e2990107c3c7618dfec2189',[
  ['assert.equal(delivery.reviewSourceFiles, 1550);','assert.equal(delivery.reviewSourceFiles, 1548);'],
  ['assert.equal(inputs.inputs.length, 1707);','assert.equal(inputs.inputs.length, 1685);'],
 ]],
 ['clinical-review-desktop-layout.test.mjs','400c50faf155feb09658c081f6db9ef35c598e7b83872f6d1e85f5847913891a',[
  ["test('current delivery remains separately bound to the clean Atlas source'","test('current 87ed delivery remains separately bound to the clean Atlas source'"],
  ["assert.equal(current.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');","assert.equal(current.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"],
  ["assert.equal(current.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');","assert.equal(current.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');"],
  ["assert.equal(current.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');","assert.equal(current.reviewIntegration,'b10311bfc3de1b628eb3d124d47c317ac4db2f7226e7ad1616e838d009af39d5');"],
  ['assert.equal(current.reviewSourceFiles,1550);','assert.equal(current.reviewSourceFiles,1548);'],
  ["assert.equal(sha(bindingBytes),'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');","assert.equal(sha(bindingBytes),'acbad30ecf452317221384c708022b3f5f2d4c3e8042ca82e572f91507bb43d7');"],
  ['assert.equal(JSON.parse(bindingBytes).inputs.length,1707);','assert.equal(JSON.parse(bindingBytes).inputs.length,1696);'],
 ]],
];
for(const [name,hash,inverses]of changes)test('original complete '+name+' reconstructs with only reviewed current-admission edits',()=>{
 const raw=readFileSync('tests/fixtures/current-delivery-before-inbox485/'+name+'.raw');assert.equal(sha(raw),hash);
 let source=name==='current-atlas-delivery.test.mjs'
  ?readFileSync('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw','utf8')
  :name==='clinical-review-desktop-layout.test.mjs'
   ?readFileSync('tests/fixtures/clinical-review-desktop-layout-actual485-20261020.mjs.raw','utf8')
   :readFileSync('tests/'+name,'utf8');
 if(name==='current-atlas-delivery.test.mjs')assert.equal(sha(Buffer.from(source)),'82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821','Exact 485 admission witness');
 if(name==='clinical-review-desktop-layout.test.mjs')assert.equal(sha(Buffer.from(source)),'4d1ba4639ad5f71378a1ae84fec3d1224c86ff90cacf4b767212386390bf15bf','Authentic retained 485 desktop-layout source');
 for(const [from,to]of inverses){assert.equal(source.split(from).length,2,'Exact admission seam: '+from);source=source.replace(from,to);}
 assert.equal(source,raw.toString(),'No historical/semantic/security assertion changed');
});
test('historical 485 admission retains exact source and binding obligations',()=>{
 const previousBytes=readFileSync('tests/fixtures/source190-admission/previous-current.json');
 assert.equal(sha(previousBytes),'7f08673542eedf10d211b4668aad93efc65ab7854d6141ec409512edd3785eba');
 const previous=JSON.parse(previousBytes);
 assert.equal(previous.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');assert.equal(previous.reviewSourceFiles,1550);
 assert.equal(previous.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');
 assert.equal(previous.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');
 assert.equal(previous.documents['atlas-review/integration-inputs.json'],'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}),'Historical 485 pin must refuse current190 bytes');
});
test('admitted current scope agrees with exact source and bound imported bytes',()=>{
 const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
 assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');
 assert.equal(pin.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');assert.equal(pin.reviewSourceFiles,1553);
 const bytes=readFileSync('atlas-review/integration-inputs.json');assert.equal(sha(bytes),'69092b905e27e50b748a73344214a050e35cd4eb345bcebe19887b6867b8b82d');
 const binding=JSON.parse(bytes);assert.equal(binding.inputs.length,1710);assert.equal(binding.sha256,pin.reviewIntegration);
});
