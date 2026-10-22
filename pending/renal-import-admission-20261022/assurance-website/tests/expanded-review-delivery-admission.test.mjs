import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeLoadingPin} from './review-frame-history-inverse.mjs';
import {restorePreNeckPin} from './current-pin-epoch-inverse.mjs';
import {restorePreNeckDelivery} from './four-consumer-source-inverse.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture='tests/fixtures/expanded-review-admission/';
const beforeBytes=read(fixture+'current-atlas-delivery.json.raw');
const currentBytes=read('tests/fixtures/current-atlas-delivery.json');
const preSurfaceBytes=read('tests/fixtures/head-surface-before-20261022/tests__fixtures__current-atlas-delivery.json.raw');
const preNeckBytes=read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json');
const historicBytes=restorePreNeckPin(currentBytes,preSurfaceBytes,preNeckBytes);
const before=JSON.parse(beforeBytes),pin=JSON.parse(historicBytes),currentPin=JSON.parse(currentBytes);
const priorPin=beforeLoadingPin(historicBytes);
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
 assert.equal(currentPin.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
 assert.equal(currentPin.reviewIntegration,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
 assert.equal(currentPin.reviewSourceFiles,1560);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Old Review never becomes current by compatibility fallback');
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.inputs.length,1727);assert.equal(sha(JSON.stringify(binding.inputs)),currentPin.reviewIntegration);
 assert.equal(binding.sourceCommit,currentPin.source);
 for(const path of ['components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css']){
  const rows=binding.inputs.filter(row=>row.path===path);assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(path)));
 }
});

test('complete previous current-delivery test survives the one observed binding-count seam',()=>{
 const raw=read(fixture+'current-atlas-delivery.test.mjs.raw');
 assert.equal(sha(raw),'799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b');
 const current=restorePreNeckDelivery(read('tests/current-atlas-delivery.test.mjs'),
  read('tests/fixtures/head-surface-before-20261022/tests__current-atlas-delivery.test.mjs.raw'),
  read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw')).toString();
 const seam='assert.equal(sourceFiles,1558);assert.equal(inputs,1724);assert(artifacts>100);';
 assert.equal(current.split(seam).length,2);
 assert.equal(current.replace(seam,'assert.equal(sourceFiles,1558);assert.equal(inputs,1721);assert(artifacts>100);'),raw.toString());
});

for(const path of documents)test('current Review refuses tampered '+path,()=>{
 const bytes=Buffer.concat([read(path),Buffer.from(' ')]);
 assert.throws(()=>validateCurrentAtlasDelivery({read:other=>other===path?bytes:read(other)}));
 const bad=structuredClone(pin);bad.documents[path]='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
});

for(const [key,value]of [['personalRecordsIncluded',true],['mode','debug'],['sourceCommit','0'.repeat(40)],['websiteIntegrationSha256',before.reviewIntegration]])test('repinning viewer digest cannot admit '+key,()=>{
 const path='public/atlas-review-viewer/manifest.json',document=JSON.parse(read(path));document[key]=value;
 const bytes=Buffer.from(JSON.stringify(document)),bad=structuredClone(pin);bad.documents[path]=sha(bytes);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:other=>other===path?bytes:read(other)}));
});

// Exact source history proof: original archived assertions survive outside the named roles.
test('entire original expanded Review admission source survives current-role inversion',()=>{
 const marker='\n// Exact source history proof:';
 let source=readFileSync(new URL('./expanded-review-delivery-admission.test.mjs',import.meta.url),'utf8');
 assert.equal(source.split(marker).length,2);
 source=source.split(marker)[0];
 const once=(from,to)=>{assert.equal(source.split(from).length,2,from);source=source.replace(from,to);};
 once("import {restorePreNeckPin} from './current-pin-epoch-inverse.mjs';\n",'');
 once("import {restorePreNeckDelivery} from './four-consumer-source-inverse.mjs';\n",'');
 once("const currentBytes=read('tests/fixtures/current-atlas-delivery.json');\nconst preSurfaceBytes=read('tests/fixtures/head-surface-before-20261022/tests__fixtures__current-atlas-delivery.json.raw');\nconst preNeckBytes=read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json');\nconst historicBytes=restorePreNeckPin(currentBytes,preSurfaceBytes,preNeckBytes);\nconst before=JSON.parse(beforeBytes),pin=JSON.parse(historicBytes),currentPin=JSON.parse(currentBytes);\nconst priorPin=beforeLoadingPin(historicBytes);",
  "const before=JSON.parse(beforeBytes),pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));\nconst priorPin=beforeLoadingPin(read('tests/fixtures/current-atlas-delivery.json'));");
 once(" assert.deepEqual(validateCurrentAtlasDelivery(),currentPin);\n assert.equal(currentPin.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');\n assert.equal(currentPin.reviewIntegration,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');\n assert.equal(currentPin.reviewSourceFiles,1560);",
  ' assert.deepEqual(validateCurrentAtlasDelivery(),pin);');
 once(" assert.equal(binding.inputs.length,1727);assert.equal(sha(JSON.stringify(binding.inputs)),currentPin.reviewIntegration);\n assert.equal(binding.sourceCommit,currentPin.source);",
  ' assert.equal(binding.inputs.length,1724);assert.equal(sha(JSON.stringify(binding.inputs)),pin.reviewIntegration);');
 once(" const current=restorePreNeckDelivery(read('tests/current-atlas-delivery.test.mjs'),\n  read('tests/fixtures/head-surface-before-20261022/tests__current-atlas-delivery.test.mjs.raw'),\n  read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw')).toString();",
  " const current=read('tests/current-atlas-delivery.test.mjs').toString();");
 assert.equal(sha(source),'e4ee6d1670ec14b6f5f7b722ae4b9958225ee1886aff82513e4e1a74301b8872');
});

for(const path of documents)test('actual current Review refuses tampered '+path,()=>{
 const bytes=Buffer.concat([read(path),Buffer.from(' ')]);
 assert.throws(()=>validateCurrentAtlasDelivery({read:other=>other===path?bytes:read(other)}));
 const bad=structuredClone(currentPin);bad.documents[path]='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
});

for(const [key,value]of [['personalRecordsIncluded',true],['mode','debug'],['sourceCommit','0'.repeat(40)],['websiteIntegrationSha256',before.reviewIntegration]])test('actual current viewer refuses '+key,()=>{
 const path='public/atlas-review-viewer/manifest.json',document=JSON.parse(read(path));document[key]=value;
 const bytes=Buffer.from(JSON.stringify(document)),bad=structuredClone(currentPin);bad.documents[path]=sha(bytes);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:other=>other===path?bytes:read(other)}));
});
