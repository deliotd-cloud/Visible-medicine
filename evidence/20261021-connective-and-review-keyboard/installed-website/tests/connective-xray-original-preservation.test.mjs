import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const originalPath='tests/fixtures/connective-xray-9f-original.test.ts.raw';
const currentPath='tests/clinical-review-lower-limb-connective-xray.test.ts';
const originalHash='45edaee10adc1dd2bcd5da4461832a4878431ac0c3cfca18624c84bf95fcc074';
const currentHash='eb7e626855026127c0c02927a8b4c7ad7cc31da4637681dc5efa11c281bdd4f7';
const deltaHash='ffcb04a59f951cf91642032d0bf69b81d8fa6ef2dfe4cde5f0ecbfafe8b39e45';
const sha=value=>createHash('sha256').update(value).digest('hex');

// The exact line edit script has pinned bytes. Reversing it must recover every
// original line, including assertions that now belong only to the old epoch.
function exactDelta(original,current){
 const a=original.match(/[^\n]*\n|[^\n]+$/g)??[];
 const b=current.match(/[^\n]*\n|[^\n]+$/g)??[];
 const rows=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  rows[i][j]=a[i]===b[j]?rows[i+1][j+1]+1:Math.max(rows[i+1][j],rows[i][j+1]);
 const edits=[];let i=0,j=0;
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){edits.push(['=',a[i]]);i++;j++;}
  else if(j<b.length&&(i===a.length||rows[i][j+1]>rows[i+1][j]))edits.push(['+',b[j++]]);
  else edits.push(['-',a[i++]]);
 }
 return edits;
}
function verify(original,current){
 assert.equal(sha(original),originalHash,'byte-exact original fixture');
 assert.equal(sha(current),currentHash,'exact proposed test source');
 const edits=exactDelta(original,current);
 assert.equal(sha(JSON.stringify(edits)),deltaHash,'only the declared complete edit script');
 assert.equal(edits.filter(([op])=>op!=='+' ).map(([,line])=>line).join(''),original,
  'strict inverse reconstructs the entire original source');
 assert.equal(edits.filter(([op])=>op!=='-' ).map(([,line])=>line).join(''),current,
  'forward edit reconstructs the entire proposed source');
}

test('connective X-ray adaptation preserves the exact original source and rejects mutations',()=>{
 const original=readFileSync(originalPath,'utf8');
 const current=readFileSync(currentPath,'utf8');
 verify(original,current);
 assert.throws(()=>verify(original,current.replace('const revision=', 'const revisionX=')),
  /exact proposed test source/,'a one-byte test mutation must fail');
 assert.throws(()=>verify(original.replace('const revision=', 'const revisionX='),current),
  /byte-exact original fixture/,'a one-byte original mutation must fail');
});
