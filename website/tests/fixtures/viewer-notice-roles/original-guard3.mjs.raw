import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const original='67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05';
const guard=" assert.equal(sha(viewer),sha(Buffer.concat([nowPrefix,source,tail])),'Protected Viewer notice bytes differ; inspect the source-bound notice comparison without a large Buffer diff');\n";
const assertion=' assert.deepEqual(viewer,Buffer.concat([nowPrefix,source,tail]));';
const sourceText=readFileSync(new URL('./atlas-current-history-wave4-contract.test.mjs',import.meta.url),'utf8');
function restore(text){assert.equal(text.split(guard).length,2);const before=text.replace(guard,'');assert.equal(sha(Buffer.from(before)),original);return before;}
test('one digest precheck preserves the complete original four-case source and exact byte assertion',()=>{
 restore(sourceText);assert.equal(sourceText.split(assertion).length,2);
 assert.throws(()=>restore(sourceText+' '));assert.throws(()=>restore(sourceText.replace(guard,guard+guard)));
});
function exercise(viewer,{digest=sha}={}){
 let comparisons=0;
 const observed={equal:assert.equal,deepEqual(...args){comparisons++;return assert.deepEqual(...args);}};
 const run=new Function('assert','sha','viewer','nowPrefix','source','tail',guard+assertion);
 let error=null;try{run(observed,digest,viewer,Buffer.from('prefix:'),Buffer.from('source'),Buffer.from(':tail'));}catch(cause){error=cause;}
 return {comparisons,error};
}
test('equal input still reaches the original comparison and different bytes refuse before expensive formatting',()=>{
 const same=exercise(Buffer.from('prefix:source:tail'));assert.equal(same.error,null);assert.equal(same.comparisons,1);
 const different=exercise(Buffer.from('prefix:changed:tail'));assert(different.error instanceof assert.AssertionError);assert.equal(different.comparisons,0);
});
test('even a digest collision cannot bypass the original exact byte assertion',()=>{
 const result=exercise(Buffer.from('different'),{digest:()=> 'forced-collision'});
 assert.equal(result.comparisons,1);assert(result.error instanceof assert.AssertionError);
});
