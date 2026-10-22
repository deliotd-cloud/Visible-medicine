import assert from 'node:assert/strict';import test from 'node:test';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {build} from 'esbuild';
const root=process.cwd(),sha=value=>createHash('sha256').update(value).digest('hex');
const original=JSON.parse(readFileSync(new URL('./fixtures/shoulder-us-renderer-original.json',import.meta.url)));
const text=readFileSync(new URL('./atlas-shoulder-girdle-arterial-ultrasound-checks.mjs',import.meta.url),'utf8');
const old="assert.equal(currentPin.reviewIntegration, '245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37');";
const current="assert.equal(currentPin.reviewIntegration, hash(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs));";
function preserve(candidate){
  assert.equal(original.schema,'vm-original-shoulder-us-checks/1');assert.equal(original.sha256,'7d616a07cbf787a6569924d45c2518129c18d888c2579ec83379b917a37d5e04');assert.equal(sha(original.text),original.sha256);
  assert.equal(candidate.split(current).length,2);assert.equal(candidate.replace(current,old),original.text,'Only the stale current-epoch expectation may change');
}
test('every original shoulder-US assertion byte is preserved except the current epoch read seam',()=>preserve(text));
test('unrelated assertion, source, or additional-read changes cannot hide in the migration',()=>{
  for(const candidate of [text+'\n',text.replace('const sourceRevision =','const alteredRevision ='),text.replace(current,current+'\n'+current),text.replace("hash(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs)","'0'.repeat(64)")])assert.throws(()=>preserve(candidate));
});
test('the unchanged245ca assertion still executes against authenticated closed7b inputs',()=>{
  const read=name=>readFileSync(resolve(root,'tests/fixtures',name));
  const pinBytes=read('current-atlas-delivery-7b3e678a.json'),inputBytes=read('integration-inputs-7b3e678a.json'),manifestBytes=read('atlas-review-7b-manifest.json');
  assert.equal(sha(pinBytes),'1a9a62e5ec6998ccc0f68c083dcd50ef03c6f89bc8cc46a7036e6c3ba39466cf');
  assert.equal(sha(inputBytes),'37ee961401e8d18bf6e595a7edf58acd49faeec8a47201fdc91747697b637104');
  assert.equal(sha(manifestBytes),'2cdccade40ccd436bd5c3af931291813bf5857ec78bb7c18b7df4fcf1ab99ec4');
  const pin=JSON.parse(pinBytes),inputs=JSON.parse(inputBytes),manifest=JSON.parse(manifestBytes);
  assert.equal(pin.source,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');assert.equal(inputs.sourceCommit,pin.source);assert.equal(manifest.revision,pin.source);
  assert.equal(sha(JSON.stringify(inputs.inputs)),pin.reviewIntegration);assert.equal(manifest.websiteIntegrationSha256,pin.reviewIntegration);
  const execute=new Function('assert','currentPin',old);execute(assert,pin);assert.throws(()=>execute(assert,{...pin,reviewIntegration:'0'.repeat(64)}));
});
const delivery=await import(pathToFileURL(resolve(root,'tests/current-atlas-delivery.mjs')).href);
test('current admission is the independently pinned 2381 delivery, not the closed7b epoch',()=>{
  const pin=delivery.validateCurrentAtlasDelivery();
  assert.equal(delivery.CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');
  assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
  assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs)));
  assert.equal(pin.reviewSourceFiles,1562);
  assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  assert.notEqual(pin.runtimeSources.shoulder,pin.source);
  assert.notEqual(pin.reviewIntegration,'245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37');
  assert.notEqual(pin.reviewIntegration,'4f0846e90efe86c86ddbfb5817cbd8b82baaf1b05c3d6eead91caa85a320013d');
  assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
});
const addedPaths=['lib/shoulder-girdle-arterial-ultrasound.ts','content/shoulder-girdle-arterial-ultrasound.ts','content/shoulder-girdle-arterial-ultrasound-pins.json'];
const gitOptions={maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
const sourceRoot=delivery.currentAtlasDeliveryRoot();
const pinBytes=execFileSync('git',['show','c5c99ba11e6533d306587e71f5fc2854d882fbd6:content/shoulder-girdle-arterial-ultrasound-pins.json'],{...gitOptions,cwd:sourceRoot});
assert.deepEqual(readFileSync(resolve(root,'atlas-review/content/shoulder-girdle-arterial-ultrasound-pins.json')),pinBytes);
const pins=JSON.parse(pinBytes);assert(pins.entries.length>0);
const start=text.indexOf('const currentPin = validateCurrentAtlasDelivery();'),end=text.indexOf('console.log(JSON.stringify({websiteBaseline',start);
assert(start>0&&end>start);const tail=text.slice(start,end);
const run=new (Object.getPrototypeOf(async function(){}).constructor)('assert','validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION','currentAtlasDeliveryRoot','readFileSync','addedPaths','hash','execFileSync','gitOptions','build','pins',tail);
const hash=value=>sha(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));
const execute=reader=>run(assert,delivery.validateCurrentAtlasDelivery,delivery.CURRENT_ATLAS_REVISION,delivery.currentAtlasDeliveryRoot,reader,addedPaths,hash,execFileSync,gitOptions,build,pins);
test('the actual current tail admits exact imported teaching and source bindings after the old epoch',async()=>{
  await execute(readFileSync);
});
test('current tail refuses a tampered integration input rather than accepting an arbitrary current value',async()=>{
  await assert.rejects(execute((file,...args)=>{
    if(file==='atlas-review/integration-inputs.json'){const input=JSON.parse(readFileSync(file));input.inputs[0].sha256='0'.repeat(64);return Buffer.from(JSON.stringify(input));}
    return readFileSync(file,...args);
  }));
});
