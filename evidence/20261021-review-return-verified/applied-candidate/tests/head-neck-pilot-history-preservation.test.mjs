import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const entries=[
 ['head-neck-pilot.test.ts',
  '98ed1e8bba232320894aec053adb06083d03226ea3fbc47280e7f6b82ca3c6f7',
  '97d2ab7dfdeab8ac28656bbc779c0a8bec3c08bf98cf05ff545658930372d1e1',
  'c079bcf8d72f00e70b112a8ea54ca5d671800d79dd99cd1008291962dff69cfa',3,4],
 ['historical-head-pilot-read.mjs',
  'f20ac1ff485bb2fefdb3b00b3a7b98d35faaf9d002351893cc65903ddbcadb66',
  '155580d27d857afca4622fd286c4ef9419ea3883b5a2484095a3eb076b074443',
  '0f47f35ab70c321b87e26a83b02d3002f9ddfce60d7dc9458849c96283c3c4bf',0,0],
];
const utf8=(bytes,label)=>{
 const value=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(value),bytes,`${label}: lossless UTF-8`);
 assert(!value.includes('\r'),`${label}: exact LF representation`);
 return value;
};
function inverse(postBytes,deltaBytes){
 const post=utf8(postBytes,'postimage').split('\n');
 const delta=utf8(deltaBytes,'declared zero-context delta').split('\n');
 assert.equal(delta.at(-1),'','Delta ends in LF');
 let cursor=0,i=0,hunks=0;
 const original=[];
 while(i<delta.length-1){
  const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(delta[i++]);
  assert(head,'Declared unified hunk');
  const oldStart=Number(head[1]),oldCount=Number(head[2]??1);
  const newStart=Number(head[3]),newCount=Number(head[4]??1);
  const oldIndex=oldCount===0?oldStart:oldStart-1;
  const newIndex=newCount===0?newStart:newStart-1;
  assert(newIndex>=cursor&&newIndex<=post.length,'Ordered postimage hunk');
  original.push(...post.slice(cursor,newIndex));cursor=newIndex;
  assert.equal(original.length,oldIndex,'Exact original hunk position');
  let oldSeen=0,newSeen=0;
  while(i<delta.length-1&&!delta[i].startsWith('@@ ')){
   const line=delta[i++],mode=line[0],value=line.slice(1);
   assert(mode==='+'||mode==='-'||mode===' ','Only reviewed unified delta lines');
   if(mode!=='-'){assert.equal(post[cursor++],value,'Exact postimage line');newSeen++;}
   if(mode!=='+'){original.push(value);oldSeen++;}
  }
  assert.equal(oldSeen,oldCount,'Complete original hunk');
  assert.equal(newSeen,newCount,'Complete postimage hunk');
  hunks++;
 }
 assert(hunks>0,'At least one reviewed edit');
 original.push(...post.slice(cursor));
 return Buffer.from(original.join('\n'));
}
function verify(entry,post){
 const [name,before,after,deltaSha,oldTests,newTests]=entry;
 const original=readFileSync(new URL(`./fixtures/${name}.original.raw`,import.meta.url));
 const delta=readFileSync(new URL(`./fixtures/${name}.delta.raw`,import.meta.url));
 assert.equal(sha(original),before,'Pinned entire original');
 assert.equal(sha(delta),deltaSha,'Pinned declared delta');
 assert.equal(sha(post),after,'Pinned entire proposal');
 assert.deepEqual(inverse(post,delta),original,'Inverse restores every original byte and assertion');
 assert.equal((original.toString().match(/^test\(/gm)||[]).length,oldTests);
 assert.equal((post.toString().match(/^test\(/gm)||[]).length,newTests);
}
for(const entry of entries){
 const name=entry[0];
 test(`${name}: whole-source inverse`,()=>{
  verify(entry,readFileSync(new URL(`./${name}`,import.meta.url)));
 });
 test(`${name}: mutation refusal`,()=>{
  const source=readFileSync(new URL(`./${name}`,import.meta.url)).toString('utf8');
  const needle=name.endsWith('.ts')?'190a63238eadcf906abe89dcbb6a67c88afe70b9':'e87f3e7fe1e50735ff9a9a9ba8c989be8bd8b26b';
  for(const changed of [source.replace('assert.equal(', 'assert.notEqual('),source.replace(needle,'0'.repeat(40))]){
   assert.notEqual(changed,source,'Mutation must change the complete source');
   assert.throws(()=>verify(entry,Buffer.from(changed)));
  }
 });
}
