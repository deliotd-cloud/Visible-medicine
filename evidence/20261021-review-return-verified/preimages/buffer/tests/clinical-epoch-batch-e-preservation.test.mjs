// Every reviewed zero-context edit is inverted onto the complete proposed source.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
 ['neonatal-cranial-us','b7a37a2afd7488ed89a8f4b2552f03dff2578c06750282033dbf38cba1befce9','356212d081e871bf7998e590cdfa61afaa9644cfb7fd9a7de4ecc77bdb1e9660','8c2b85f724820657426667f4e818050eddee242f9e687cb84eb78afe44d00b35',2],
 ['nested-duct-xray','bcb8f7ba8ac05454522a2b9cfed2f4f7273db016a049259872c8dfb6258614bf','9bbc43adfd820b25f2cb9ff7111b55649f0e809f86dbb62d0079b70e73f4ddc9','bb0a1ae9467b561d713d46936ce4e958f82ae9859201b278b3fd644b4bf5e2ac',1],
 ['orbital-apex-ct','2622078169a37612f97a4c31c66db312421e42f2b3dfd33ec2d8c305c110872b','8f4a7e1eb6af862ff9643c08972c02f45dc9502db20ef03898b3723b78b05cc5','b12a5d593536d0065867d9c93d49f4df47f512bf040c3d0cc7b828cb673e03d4',3],
 ['orbital-ring-ct','f72ae4a6eb2522d15fccc2237015be88193500d21fbc183683166f9d0d003b2d','1408d09004e4277d15e2d05c7a84207767892b5724dcdb40463808b23d1821bc','3f0a6a1ab81191cd479861fb2562fa2d2db0698997e9629a8a1b89acb05b08c0',1],
 ['orbital-support-mri','c4829b9a32b117712aa85723e27517207f20dc13e769e1de360d965c581b5236','03467a60f9e863584cdecc34d6f217aa9222b938012c156c1ece2aeccf629495','438b2245b666cfb456cff0d6289b5cfc11def1e58772cc12d1458b373135d0f5',1],
];

function inverse(currentBytes,deltaBytes){
 const utf8=(bytes,label)=>{
  const value=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(value),bytes,`${label}: lossless UTF-8`);
  assert(!value.includes('\r'),`${label}: exact LF representation`);
  return value;
 };
 const current=utf8(currentBytes,'postimage').split('\n');
 const delta=utf8(deltaBytes,'reviewed zero-context delta').split('\n');
 assert(delta.at(-1)==='','Delta ends with LF');
 let cursor=0,i=0,hunks=0;
 const original=[];
 while(i<delta.length-1){
  const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(delta[i++]);
  assert(head,'Declared unified hunk');
  const oldStart=Number(head[1]),oldCount=Number(head[2]??1);
  const newStart=Number(head[3]),newCount=Number(head[4]??1);
  const newIndex=newCount===0?newStart:newStart-1;
  const oldIndex=oldCount===0?oldStart:oldStart-1;
  assert(newIndex>=cursor&&newIndex<=current.length,'Ordered postimage hunk');
  original.push(...current.slice(cursor,newIndex));cursor=newIndex;
  assert.equal(original.length,oldIndex,'Exact original hunk position');
  let oldSeen=0,newSeen=0;
  while(i<delta.length-1&&!delta[i].startsWith('@@ ')){
   const line=delta[i++],mode=line[0],value=line.slice(1);
   assert(mode==='+'||mode==='-'||mode===' ','Only reviewed unified delta lines');
   if(mode!== '-'){
    assert.equal(current[cursor++],value,'Exact postimage hunk byte line');newSeen++;
   }
   if(mode!=='+'){original.push(value);oldSeen++;}
  }
  assert.equal(newSeen,newCount,'Complete postimage hunk');
  assert.equal(oldSeen,oldCount,'Complete original hunk');
  hunks++;
 }
 assert(hunks>0,'At least one reviewed edit');
 original.push(...current.slice(cursor));
 return Buffer.from(original.join('\n'));
}

function verify(entry,bytes){
 const [name,before,after,deltaHash,registrations]=entry;
 const original=readFileSync(new URL(`./fixtures/clinical-review-${name}-original.ts.raw`,import.meta.url));
 const delta=readFileSync(new URL(`./fixtures/${name}.delta.raw`,import.meta.url));
 assert.equal(sha(original),before,'Whole original byte source');
 assert.equal(sha(delta),deltaHash,'Exact reviewed delta');
 assert.equal(sha(bytes),after,'Whole proposed postimage');
 assert.deepEqual(inverse(bytes,delta),original,'Full original bytes restored, with no removed assertion');
 assert.equal((original.toString().match(/^test\(/gm)||[]).length,registrations);
 assert.equal((bytes.toString().match(/^test\(/gm)||[]).length,registrations);
}

for(const entry of cases){
 const name=entry[0];
 test(name+' has a declared whole-source inverse',()=>{
  const bytes=readFileSync(new URL(`./clinical-review-${name}.test.ts`,import.meta.url));
  verify(entry,bytes);
 });
 test(name+' refuses removed assertions or a substituted historical epoch',()=>{
  const bytes=readFileSync(new URL(`./clinical-review-${name}.test.ts`,import.meta.url));
  const source=bytes.toString('utf8');
  const epochNeedle=name==='orbital-ring-ct'?'FIRST_DELIVERY} from':'9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
  const epochReplacement=name==='orbital-ring-ct'?'FIRST_DELIVERX} from':'0'.repeat(40);
  for(const changed of [source.replace('assert.equal(', 'assert.notEqual('),
   source.replace(epochNeedle,epochReplacement)]){
   assert.notEqual(changed,source,'Mutation must alter the source');
   assert.throws(()=>verify(entry,Buffer.from(changed)));
  }
 });
}
