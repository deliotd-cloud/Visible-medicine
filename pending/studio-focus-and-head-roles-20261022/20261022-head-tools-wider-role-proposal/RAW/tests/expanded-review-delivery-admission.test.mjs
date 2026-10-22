import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeLoadingPin} from './review-frame-history-inverse.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture='tests/fixtures/expanded-review-admission/';
const beforeBytes=read(fixture+'current-atlas-delivery.json.raw');
const before=JSON.parse(beforeBytes),pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
const priorPin=beforeLoadingPin(read('tests/fixtures/current-atlas-delivery.json'));
const documents=['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'];

test('expanded-viewer admission changes only the exact Review epoch, never source or clearance',()=>{
 assert.equal(sha(beforeBytes),'3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb');
 assert.equal(before.reviewIntegration,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 assert.equal(priorPin.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
 assert.equal(pin.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
 assert.deepEqual(Object.keys(before.documents).filter(path=>before.documents[path]!==priorPin.documents[path]).sort(),documents);
 const inverse=structuredClone(priorPin);inverse.reviewIntegration=before.reviewIntegration;
 for(const path of documents)inverse.documents[path]=before.documents[path];
 assert.deepEqual(inverse,before,'Source/tree, independent runtime families, models and counts stay exact');
 assert.deepEqual(validateCurrentAtlasDelivery(),pin);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Old Review never becomes current by compatibility fallback');
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.inputs.length,1724);assert.equal(sha(JSON.stringify(binding.inputs)),pin.reviewIntegration);
 for(const path of ['components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css']){
  const rows=binding.inputs.filter(row=>row.path===path);assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(path)));
 }
});

test('complete previous current-delivery test survives the one observed binding-count seam',()=>{
 const raw=read(fixture+'current-atlas-delivery.test.mjs.raw');
 assert.equal(sha(raw),'799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b');
 const current=read('tests/current-atlas-delivery.test.mjs').toString();
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
