// Historical schema-1 admission only. The current schema-2 validator stays strict.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const witnessUrl=new URL('./fixtures/body-learning-current-admission/current-atlas-delivery-190.mjs.raw',import.meta.url);
const witness=readFileSync(witnessUrl);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(witness),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62',
  'Authenticated historical schema-1 validator bytes');
const source=witness.toString('utf8');
const constantsStart=source.indexOf('const modules=');
const functionStart=source.indexOf('export function validateCurrentAtlasDelivery(');
const functionEnd=source.indexOf('// Consumers cannot silently accept',functionStart);
assert(constantsStart>=0&&functionStart>constantsStart&&functionEnd>functionStart,'Historical validator boundaries');
const constants=source.slice(constantsStart,functionStart);
const historicalFunction=source.slice(functionStart,functionEnd).replace(/^export function /,'function ');
assert.match(historicalFunction,/pin\.schema,'vm-current-atlas-test-delivery-1'/);
const historicalValidate=new Function('assert','createHash','readFileSync','websiteRoot','defaultPin',
  `${constants}\n${historicalFunction}\nreturn validateCurrentAtlasDelivery;`)(assert,createHash,readFileSync,'',null);

export function validateClosed59AtlasDelivery(pin,read,pinBytes){
  assert(Buffer.isBuffer(pinBytes),'Exact closed59 JSON bytes required');
  assert.equal(sha(pinBytes),'8f78fd9edc87dac6a8d9ef5fef681059bfb698eca39f0988ff470d44c0afd267',
    'Authenticated exact closed59 pin bytes');
  assert.deepEqual(pin,JSON.parse(pinBytes),'Only the exact closed59 pin may use historical schema-1 admission');
  assert.equal(pin.schema,'vm-current-atlas-test-delivery-1');
  return historicalValidate({pin,root:'',read});
}
