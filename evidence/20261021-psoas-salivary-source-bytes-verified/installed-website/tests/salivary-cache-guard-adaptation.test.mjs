import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {inverseSalivaryCacheEpoch,restoreSalivaryPrior} from './salivary-cache-epoch-adapter.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixtures='./fixtures/salivary-cache-epoch-20261021/';
const adapter=read('./salivary-cache-epoch-adapter.mjs');
const postimages=[
 ['clinical-review-git-root-preservation.test.mjs','git-root-preservation.original.mjs.raw',
  'd7bd7c4e5abb369c00a69cf049d02848f77064b14f757573297393eac6bab4a1',
  '59bf61933c8a8944bb7da9bd10cdb517c93ddd65af74ef34b0934c66389397a2'],
 ['atlas190-current-delivery.test.mjs','atlas190-current-delivery.original.mjs.raw',
  '1788fce7a307bc36145b20a570e3783a4c496cb1f06e26f8faf1b38195db93ef',
  '8b6e741d1565be147f25258163ffdc00830aafcca2f4a04b39a0f4edbd5e62cf'],
];
const once=(text,from,to)=>{
 assert.equal(text.split(from).length,2,`Unique inverse seam: ${from.slice(0,50)}`);
 return text.replace(from,to);
};

function inverseGuard(name,bytes){
 let text=bytes.toString();
 const importLine="import {restoreSalivaryPrior} from './salivary-cache-epoch-adapter.mjs';\n";
 text=once(text,importLine,'');
 if(name==='clinical-review-git-root-preservation.test.mjs'){
  text=once(text,
   "  const prior=restoreSalivaryPrior(bytes);\n  restored=prior.toString().replace(/\\r\\n/g,'\\n');\n  assert.equal(sha(prior),",
   '  assert.equal(sha(bytes),');
 }else{
  text=once(text,
   "after=restoreSalivaryPrior(read('tests/clinical-review-salivary-stylohyoid-quiz.test.ts')).toString()",
   "after=read('tests/clinical-review-salivary-stylohyoid-quiz.test.ts').toString()");
 }
 return Buffer.from(text);
}

test('both original preservation guards reconstruct exactly and their cases remain registered',()=>{
 assert.equal(sha(adapter),'8a84ac8dfe143a07113ca237e31ab1443ffe8a80a79c6a9559adef4362aedab0');
 for(const [name,fixture,originalHash,postHash] of postimages){
  const before=read(fixtures+fixture),after=read('./'+name);
  assert.equal(sha(before),originalHash);assert.equal(sha(after),postHash);
  assert.deepEqual(inverseGuard(name,after),before);
  assert.equal((after.toString().match(/^test\(/gm)||[]).length,
   (before.toString().match(/^test\(/gm)||[]).length,name);
 }
});

test('the adapter refuses arbitrary current edits and keeps the exact prior typed/root/CT witness',()=>{
 const current=read('./clinical-review-salivary-stylohyoid-quiz.test.ts');
 const prior=read(fixtures+'original.ts.raw');
 assert.deepEqual(restoreSalivaryPrior(current),prior);
 assert.deepEqual(inverseSalivaryCacheEpoch(current),prior);
 for(const mutated of [
  current.toString().replace('3dcdf94a46db44202e72641be9fbcf1274ce5364','0'.repeat(40)),
  current.toString().replace("assert.equal(git(['rev-parse','HEAD'])","assert.notEqual(git(['rev-parse','HEAD'])"),
  'if(false){\n'+current.toString()+'\n}',
 ]){
  assert.notEqual(mutated,current.toString());
  assert.throws(()=>restoreSalivaryPrior(Buffer.from(mutated)));
 }
});

test('mutating a guard assertion or registration violates its independently pinned postimage',()=>{
 for(const [name,,originalHash,postHash] of postimages){
  const after=read('./'+name).toString();
  assert.notEqual(originalHash,postHash);
  for(const mutated of [after.replace('assert.equal(','assert.notEqual('),'if(false){\n'+after+'\n}']){
   assert.notEqual(mutated,after);assert.notEqual(sha(Buffer.from(mutated)),postHash);
  }
 }
});
