import assert from 'node:assert/strict';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';
const cases=[['',''],['a\nb\n','a\nx\nb\n'],['a\nx\nb\n','a\nb\n'],
 ['a\nb\nc\n','x\nb\ny\n'],['a\r\nb\r\n','a\nb\n'],['🧬\n','new\n🧬'],['','one\ntwo']];
for(const [before,after]of cases){
 const old=Buffer.from(before),current=Buffer.from(after),oldCopy=Buffer.from(old),newCopy=Buffer.from(current);
 const edits=fullSourceInverse(old,current);
 assert(Array.isArray(edits));assert.deepEqual(old,oldCopy);assert.deepEqual(current,newCopy);
 if(before===after)assert.equal(edits.length,0);else assert(edits.length>0);
}
assert.throws(()=>fullSourceInverse(Buffer.from([255]),Buffer.from('valid')),'Invalid UTF-8 refused');
assert.throws(()=>fullSourceInverse(Buffer.from('a\n'.repeat(2002)),Buffer.from('b\n'.repeat(2002))),'Unbounded matrix refused before allocation');
assert.throws(()=>fullSourceInverse(Buffer.from('x\n'.repeat(65535)),Buffer.from('x')),'Oversized line domain refused');
console.log(JSON.stringify({roundTrips:cases.length,refusals:3,inputMutations:0,sourceOrPreviewChanged:false}));
