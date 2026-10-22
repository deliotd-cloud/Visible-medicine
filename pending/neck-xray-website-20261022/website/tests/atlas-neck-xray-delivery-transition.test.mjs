import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const old='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',source='389bd0ca846a42c7f21055f55904bcf5df81a09f';
test('neck X-ray admission preserves the complete prior current-delivery assertion body',()=>{
 const original=read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw');
 assert.equal(sha(original),'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea');
 const seams=[[old,source,2],['e9165d7122361f809a267af1414b337b69097fe2','25acdee40ee57e0253cdcca924aa64b4b38586c8',1],
  ['assert.equal(sourceFiles,1558);assert.equal(inputs,1724);','assert.equal(sourceFiles,1560);assert.equal(inputs,1726);',1]];
 let expected=original.toString();for(const[from,to,count]of seams){assert.equal(expected.split(from).length,count+1);expected=expected.replaceAll(from,to);}
 const actual=read('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(actual,expected,'No original assertion/case/negative path removed');
 const corrupt=actual.replace('assert(artifacts>100);','');assert.notEqual(corrupt,actual);assert.throws(()=>assert.equal(corrupt,expected));
 for(const[from,to]of [...seams].reverse())expected=expected.replaceAll(to,from);assert.equal(expected,original.toString());
});
test('prior exact delivery is historical only; model bytes and the three independent families retain identity',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json');
 assert.equal(sha(bytes),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d');
 const previous=JSON.parse(bytes),pin=validateCurrentAtlasDelivery();assert.equal(previous.source,old);assert.equal(pin.source,source);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}),'Old exact pin cannot masquerade as current');
 for(const name of ['shoulder','lower-limb','female-pelvis']){
  assert.equal(pin.runtimeSources[name],previous.runtimeSources[name]);
  for(const file of ['manifest.json','source-inputs.json'])assert.equal(pin.documents['public/atlas-runtime/'+name+'/'+file],previous.documents['public/atlas-runtime/'+name+'/'+file]);
 }
 const inventory=JSON.parse(read('lib/atlas-model-inventory.json'));
 assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(row=>row.paths).length,144);assert.equal(inventory.models.reduce((n,row)=>n+row.bytes,0),199072480);
 assert.equal(pin.reviewSourceFiles,previous.reviewSourceFiles+2);assert.equal(pin.viewerFiles,previous.viewerFiles);assert.equal(pin.viewerPackages,previous.viewerPackages);
});
