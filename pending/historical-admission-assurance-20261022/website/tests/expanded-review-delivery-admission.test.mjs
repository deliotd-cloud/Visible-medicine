import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeLoadingPin} from './review-frame-history-inverse.mjs';
import {restorePreNeckPin2381,restorePreNeckDelivery2381} from './zero-registration-current-roles-inverse.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture='tests/fixtures/expanded-review-admission/';
const beforeBytes=read(fixture+'current-atlas-delivery.json.raw');
const currentBytes=read('tests/fixtures/current-atlas-delivery.json');
const preNeckBytes=read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json');
const historicalBytes=restorePreNeckPin2381(currentBytes,preNeckBytes);
const before=JSON.parse(beforeBytes),pin=JSON.parse(historicalBytes),currentPin=JSON.parse(currentBytes);
const priorPin=beforeLoadingPin(historicalBytes);
const documents=['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'];

test('expanded-viewer admission changes only the exact Review epoch, never source or clearance',()=>{
 assert.equal(sha(beforeBytes),'3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb');
 assert.equal(before.reviewIntegration,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 assert.equal(priorPin.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
 assert.equal(pin.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');
 assert.deepEqual(Object.keys(before.documents).filter(path=>before.documents[path]!==priorPin.documents[path]).sort(),documents);
 const inverse=structuredClone(priorPin);inverse.reviewIntegration=before.reviewIntegration;
 for(const path of documents)inverse.documents[path]=before.documents[path];
 assert.deepEqual(inverse,before,'Source/tree, independent runtime families, models and counts stay exact');
 assert.deepEqual(validateCurrentAtlasDelivery(),currentPin);
 assert.equal(currentPin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.equal(currentPin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 assert.equal(currentPin.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
 assert.equal(currentPin.reviewSourceFiles,1562);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Old Review never becomes current by compatibility fallback');
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.inputs.length,1729);assert.equal(sha(JSON.stringify(binding.inputs)),currentPin.reviewIntegration);
 assert.equal(binding.sourceCommit,currentPin.source);
 for(const path of ['components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css']){
  const rows=binding.inputs.filter(row=>row.path===path);assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(path)));
 }
});

test('complete previous current-delivery test survives the one observed binding-count seam',()=>{
 const raw=read(fixture+'current-atlas-delivery.test.mjs.raw');
 assert.equal(sha(raw),'799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b');
 const current=restorePreNeckDelivery2381(read('tests/current-atlas-delivery.test.mjs'),
  read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw')).toString();
 const seam='assert.equal(sourceFiles,1558);assert.equal(inputs,1724);assert(artifacts>100);';
 assert.equal(current.split(seam).length,2);
 assert.equal(current.replace(seam,'assert.equal(sourceFiles,1558);assert.equal(inputs,1721);assert(artifacts>100);'),raw.toString());
});

for(const path of documents)test('current Review refuses tampered '+path,()=>{
 const bytes=Buffer.concat([read(path),Buffer.from(' ')]);
 assert.throws(()=>validateCurrentAtlasDelivery({read:other=>other===path?bytes:read(other)}));
 const bad=structuredClone(currentPin);bad.documents[path]='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
});

for(const [key,value]of [['personalRecordsIncluded',true],['mode','debug'],['sourceCommit','0'.repeat(40)],['websiteIntegrationSha256',before.reviewIntegration]])test('repinning viewer digest cannot admit '+key,()=>{
 const path='public/atlas-review-viewer/manifest.json',document=JSON.parse(read(path));document[key]=value;
 const bytes=Buffer.from(JSON.stringify(document)),bad=structuredClone(currentPin);bad.documents[path]=sha(bytes);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:other=>other===path?bytes:read(other)}));
});

test('complete original expanded Review admission source survives named current roles',()=>{
 const marker='\ntest(\'complete original expanded Review admission source survives named current roles\'';
 let source=readFileSync(new URL('./expanded-review-delivery-admission.test.mjs',import.meta.url),'utf8');
 assert.equal(source.split(marker).length,2);
 source=source.split(marker)[0];
 const once=(from,to)=>{assert.equal(source.split(from).length,2,`Exact expanded Review seam: ${from}`);source=source.replace(from,to);};
 once("import {restorePreNeckPin2381,restorePreNeckDelivery2381} from './zero-registration-current-roles-inverse.mjs';\n",'');
 once("const currentBytes=read('tests/fixtures/current-atlas-delivery.json');\nconst preNeckBytes=read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json');\nconst historicalBytes=restorePreNeckPin2381(currentBytes,preNeckBytes);\nconst before=JSON.parse(beforeBytes),pin=JSON.parse(historicalBytes),currentPin=JSON.parse(currentBytes);\nconst priorPin=beforeLoadingPin(historicalBytes);",
  "const before=JSON.parse(beforeBytes),pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));\nconst priorPin=beforeLoadingPin(read('tests/fixtures/current-atlas-delivery.json'));");
 once(" assert.deepEqual(validateCurrentAtlasDelivery(),currentPin);\n assert.equal(currentPin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');\n assert.equal(currentPin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');\n assert.equal(currentPin.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');\n assert.equal(currentPin.reviewSourceFiles,1562);",
  ' assert.deepEqual(validateCurrentAtlasDelivery(),pin);');
 once(' assert.equal(binding.inputs.length,1729);assert.equal(sha(JSON.stringify(binding.inputs)),currentPin.reviewIntegration);\n assert.equal(binding.sourceCommit,currentPin.source);',
  ' assert.equal(binding.inputs.length,1724);assert.equal(sha(JSON.stringify(binding.inputs)),pin.reviewIntegration);');
 once(" const current=restorePreNeckDelivery2381(read('tests/current-atlas-delivery.test.mjs'),\n  read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw')).toString();",
  " const current=read('tests/current-atlas-delivery.test.mjs').toString();");
 once("const bad=structuredClone(currentPin);bad.documents[path]='0'.repeat(64);",
  "const bad=structuredClone(pin);bad.documents[path]='0'.repeat(64);");
 once("const bytes=Buffer.from(JSON.stringify(document)),bad=structuredClone(currentPin);bad.documents[path]=sha(bytes);",
  "const bytes=Buffer.from(JSON.stringify(document)),bad=structuredClone(pin);bad.documents[path]=sha(bytes);");
 assert.equal(sha(source),'e4ee6d1670ec14b6f5f7b722ae4b9958225ee1886aff82513e4e1a74301b8872','Complete original test preimage');
});
