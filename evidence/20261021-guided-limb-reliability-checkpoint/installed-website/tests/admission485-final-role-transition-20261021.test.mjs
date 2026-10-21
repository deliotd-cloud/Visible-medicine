import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const stage=new URL('../',import.meta.url);
const readStage=path=>readFileSync(new URL(path,stage));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const unique=(source,before,after,label)=>{
 assert.equal(source.split(before).length,2,label+': unique declared seam');
 return source.replace(before,after);
};
const prove=(name,original,hash,edits,negative)=>{
 const raw=readStage('tests/fixtures/'+original);
 assert.equal(sha(raw),hash,name+': exact pre-role whole file');
 const candidate=(name==='current-delivery-admission-485.test.mjs'
  ?readStage('tests/fixtures/current-delivery-admission-485.test.mjs.raw')
  :name==='current-head-index-whole-role-transition-20261021.test.mjs'
   ?readStage('tests/fixtures/current-head-index-whole-role-transition-20261021.test.mjs.raw')
   :readStage('tests/'+name)).toString();
 if(name==='current-delivery-admission-485.test.mjs')assert.equal(sha(Buffer.from(candidate)),'3c9d57988e6a4cbc8d67a7b5c392aa8e4dbc5dc656978aaaa3c6a659ba9d7611','Exact admitted predecessor for the historical 485 theorem');
 if(name==='current-head-index-whole-role-transition-20261021.test.mjs')assert.equal(sha(Buffer.from(candidate)),'e23e0467fd460da384ba6eddef1ea1b57b7e28f5978b6cc4228dad8544c90e11','Exact admitted predecessor for the whole-role theorem');
 let expected=raw.toString();
 for(const [before,after]of edits)expected=unique(expected,before,after,name);
 assert.equal(candidate,expected,name+': exact complete forward');
 let inverse=candidate;
 for(const [before,after]of edits.toReversed())inverse=unique(inverse,after,before,name+' inverse');
 assert.equal(inverse,raw.toString(),name+': exact complete inverse');
 assert.equal(sha(Buffer.from(inverse)),hash,name+': inverse bytes');
 assert(candidate.includes(negative),name+': original refusal retained');
 assert.throws(()=>assert.equal(candidate.replace(negative,''),expected),name+': removed negative refused');
 assert.throws(()=>assert.equal(candidate+'\nconst unknown=true;\n',expected),name+': appended code refused');
};

const oldSource=` let source=name==='current-atlas-delivery.test.mjs'
  ?readFileSync('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw','utf8')
  :readFileSync('tests/'+name,'utf8');
 if(name==='current-atlas-delivery.test.mjs')assert.equal(sha(Buffer.from(source)),'82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821','Exact 485 admission witness');`;
const newSource=` let source=name==='current-atlas-delivery.test.mjs'
  ?readFileSync('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw','utf8')
  :name==='clinical-review-desktop-layout.test.mjs'
   ?readFileSync('tests/fixtures/clinical-review-desktop-layout-actual485-20261020.mjs.raw','utf8')
   :readFileSync('tests/'+name,'utf8');
 if(name==='current-atlas-delivery.test.mjs')assert.equal(sha(Buffer.from(source)),'82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821','Exact 485 admission witness');
 if(name==='clinical-review-desktop-layout.test.mjs')assert.equal(sha(Buffer.from(source)),'4d1ba4639ad5f71378a1ae84fec3d1224c86ff90cacf4b767212386390bf15bf','Authentic retained 485 desktop-layout source');`;
const oldScope=`test('admitted current scope agrees with exact source and bound imported bytes',()=>{
 const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
 assert.equal(pin.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');assert.equal(pin.reviewSourceFiles,1550);
 const bytes=readFileSync('atlas-review/integration-inputs.json');assert.equal(sha(bytes),'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');
 const binding=JSON.parse(bytes);assert.equal(binding.inputs.length,1707);assert.equal(binding.sha256,pin.reviewIntegration);
});`;
const newScope=`test('historical 485 admission retains exact source and binding obligations',()=>{
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
});`;

test('final 485 admission keeps every original body and refusal under the two role repairs',()=>{
 prove('current-delivery-admission-485.test.mjs','current-delivery-admission-485-before-final-role-20261021.mjs.raw',
  'c962c340de4e7479d03b533ba283e6da2775d291a8051f69a2d1afc3dfe430c0',
  [[oldSource,newSource],[oldScope,newScope]],
  "assert.equal(source,raw.toString(),'No historical/semantic/security assertion changed');");
});

test('existing whole-role guard changes only its two exact additional admission seams',()=>{
 const tick='`';
 const added=`   seam(String.raw${tick}${oldSource}${tick},String.raw${tick}${newSource}${tick}),\n`+
  `   seam(String.raw${tick}${oldScope}${tick},String.raw${tick}${newScope}${tick}),\n`;
 const anchor=`  ],"assert.equal(source,raw.toString(),'No historical/semantic/security assertion changed');");`;
 prove('current-head-index-whole-role-transition-20261021.test.mjs',
  'current-head-index-whole-role-transition-before-final-role-20261021.mjs.raw',
  'cb83ee91c39131833dfc60afb16c3ef70fd04bddcc3d0c14135178262e66ba33',
  [[anchor,added+anchor]],
  "assert.notEqual(actualTest.replace(\"['invented clinical approval',p=>{p.clinicalApproval=true;}]\",''),expectedTest,'Clinical refusal cannot disappear');");
});

test('authentic retained 485 desktop-layout source is distinct from both 87ed and current190',()=>{
 const witness=readStage('tests/fixtures/clinical-review-desktop-layout-actual485-20261020.mjs.raw');
 assert.equal(sha(witness),'4d1ba4639ad5f71378a1ae84fec3d1224c86ff90cacf4b767212386390bf15bf');
 assert.notEqual(sha(witness),sha(readStage('tests/clinical-review-desktop-layout.test.mjs')));
 const original=readStage('tests/fixtures/current-delivery-before-inbox485/clinical-review-desktop-layout.test.mjs.raw');
 assert.equal(sha(original),'400c50faf155feb09658c081f6db9ef35c598e7b83872f6d1e85f5847913891a');
 const inverses=[
  ["test('current delivery remains separately bound to the clean Atlas source'","test('current 87ed delivery remains separately bound to the clean Atlas source'"],
  ["assert.equal(current.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');","assert.equal(current.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"],
  ["assert.equal(current.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');","assert.equal(current.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');"],
  ["assert.equal(current.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');","assert.equal(current.reviewIntegration,'b10311bfc3de1b628eb3d124d47c317ac4db2f7226e7ad1616e838d009af39d5');"],
  ['assert.equal(current.reviewSourceFiles,1550);','assert.equal(current.reviewSourceFiles,1548);'],
  ["assert.equal(sha(bindingBytes),'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');","assert.equal(sha(bindingBytes),'acbad30ecf452317221384c708022b3f5f2d4c3e8042ca82e572f91507bb43d7');"],
  ['assert.equal(JSON.parse(bindingBytes).inputs.length,1707);','assert.equal(JSON.parse(bindingBytes).inputs.length,1696);'],
 ];
 let inverse=witness.toString();
 for(const [from,to]of inverses)inverse=unique(inverse,from,to,'desktop 485 to 87ed');
 assert.equal(inverse,original.toString(),'The complete retained 485 source inverses to exact 87ed');
 let forward=original.toString();
 for(const [from,to]of inverses){
  if(to==='assert.equal(current.reviewSourceFiles,1548);'){
   const context="assert.equal(current.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');\n "+to;
   forward=unique(forward,context,context.replace(to,from),'desktop 87ed to 485 scoped count');
  }else forward=unique(forward,to,from,'desktop 87ed to 485');
 }
 assert.equal(forward,witness.toString(),'The complete archived 485 source has only declared admission seams');
 assert.throws(()=>assert.equal(forward.replace("assert.equal(current.reviewSourceFiles,1550);",''),witness.toString()),'Removed historical assertion refused');
 assert.throws(()=>assert.equal(forward+'\nconst unknown=true;\n',witness.toString()),'Unknown code refused');
});
