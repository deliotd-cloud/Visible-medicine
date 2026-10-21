// Pure source proof. The two clinical-review registrations run separately.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const originalPath='tests/fixtures/clinical-review-psoas-xray.original.raw';
const candidatePath='tests/clinical-review-psoas-xray.test.ts';
const originalHash='7687a4b56ee61dcb46603cdcab5b7e273b2f7cfa7456a854f859b37cb2cf9af4';
const candidateHash='48bd7232dc16e830cd5f8a7be95ab6ead9de41d9365ff55815457360f49dff16';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

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
 assert.equal(sha(original),originalHash,'complete original source bytes');
 assert.equal(sha(current),candidateHash,'complete proposed source bytes');
 const edits=exactDelta(original,current);
 assert.equal(edits.filter(([op])=>op!=='+').map(([,line])=>line).join(''),original,
  'inverse recovers every original line and assertion');
 assert.equal(edits.filter(([op])=>op!=='-').map(([,line])=>line).join(''),current,
  'forward delta recovers every proposed line');
 assert.equal((current.match(/\btest\('/g)??[]).length,2,'two original registrations retained');
}

test('psoas historical/current proposal retains the complete original and rejects source mutations',()=>{
 const original=readFileSync(originalPath,'utf8');
 const current=readFileSync(candidatePath,'utf8');
 verify(original,current);
 assert.throws(()=>verify(original,current.replace('const revision=','const revisionX=')),
  /complete proposed source bytes/);
 assert.throws(()=>verify(original.replace('const revision=','const revisionX='),current),
  /complete original source bytes/);
});
