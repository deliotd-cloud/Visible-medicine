import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const seams=[
 ['389bd0ca846a42c7f21055f55904bcf5df81a09f','4f20ae0b62b9e0dab5936b430575a983dcdd934e',2],
 ['25acdee40ee57e0253cdcca924aa64b4b38586c8','64f085e1f8b63b5f17daf8b107efcbe40bb7596c',1],
 ['assert.equal(sourceFiles,1560);assert.equal(inputs,1727);','assert.equal(sourceFiles,1561);assert.equal(inputs,1728);',1],
];
function restore(bytes){
 let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
 for(const[from,to,count]of [...seams].reverse()){assert.equal(text.split(to).length,count+1);text=text.replaceAll(to,from);}
 assert.equal(sha(Buffer.from(text)),'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb','Entire previous current-delivery theorem retained');
 return Buffer.from(text);
}
test('renal delivery preserves every preceding source/delivery assertion outside its exact source/tree/count roles',()=>{
 const prior=read('./fixtures/current-atlas-delivery-before-renal-source-20261022.mjs.raw');
 assert.equal(sha(prior),'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb');
 const current=read('./current-atlas-delivery.test.mjs');assert.deepEqual(restore(current),prior);
 for(const[from,to]of [['assert.equal(sourceFiles,1561);assert.equal(inputs,1728);assert(artifacts>100);','assert.equal(sourceFiles,1561);assert.equal(inputs,1728);assert(artifacts>0);'],['assert.equal(sourceFiles,1561)','assert.equal(sourceFiles,1560)'],['assert.equal(inputs,1728)','assert.equal(inputs,0)']]){
  const text=current.toString();assert.equal(text.split(from).length,2);assert.throws(()=>restore(Buffer.from(text.replace(from,to))));
 }
 assert.throws(()=>restore(Buffer.concat([current,Buffer.from('\n// forged\n')])));
 const priorPin=read('./fixtures/current-atlas-delivery-before-renal-source-20261022.json');
 assert.equal(sha(priorPin),'e21465496188fb9c0bd743dd98cfcf0251bd0125a84ec457392b893be0a57237');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(priorPin)}),'Old source/Review is not current approval evidence');
 const currentPin=validateCurrentAtlasDelivery();assert.equal(currentPin.source,seams[0][1]);assert.equal(currentPin.sourceTree,seams[1][1]);assert.equal(currentPin.reviewSourceFiles,1561);
 assert.equal(currentPin.reviewIntegration,'9aead9088895249b19b6a28f75fe824388b951055d6a62263ca14e6ed4e0eb5c');
});
