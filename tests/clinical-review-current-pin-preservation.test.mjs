import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const old="'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'";
const importLine="import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n";
const specs={
 'clinical-review-brain-connections-quiz.test.ts':{
  originalSha:'b68caff05dd38c975d37bb6a21618373d9e5f991e138588b424ed97908e350c0',
  count:1,anchor:"import {build} from './review-component-test-build.ts';\n",
 },
 'clinical-review-cardiac-xray.test.ts':{
  originalSha:'f49a68b46836bd39264b967725ec3e9abf558cc107b704bfde2ea522521e5e75',
  count:1,anchor:"import {build} from 'esbuild';\n",
 },
 'clinical-review-cerebral-arterial-quiz.test.ts':{
  originalSha:'1d40e81666af5ec721d8775c57c083265f5b7491084198668a26b7051d60bd4f',
  count:1,anchor:"import {build} from 'esbuild';\n",
 },
 'clinical-review-cervical-quiz.test.ts':{
  originalSha:'31c23a29d805ff829a924659d7c020e38ca53c430bade75a7a55bdb67002b97a',
  count:2,anchor:"import { build } from './review-component-test-build.ts';\n",
 },
};
function replaceExactly(source,needle,value,count){
 assert.equal(source.split(needle).length-1,count,'Unexpected admission shape');
 return source.split(needle).join(value);
}
function expected(original,name){
 const spec=specs[name];
 assert.equal(sha(original),spec.originalSha,'Original fixture bytes changed: '+name);
 const source=original.toString('utf8');
 assert(Buffer.from(source,'utf8').equals(original),'Original fixture is not UTF-8: '+name);
 assert(!source.includes('\r'),'Original line endings changed: '+name);
 const repinned=replaceExactly(source,old,'CURRENT_ATLAS_REVISION',spec.count);
 return Buffer.from(replaceExactly(repinned,spec.anchor,spec.anchor+importLine,1),'utf8');
}
function verify(original,actual,name){
 assert(actual.equals(expected(original,name)),'Unapproved test change: '+name);
}
for(const name of Object.keys(specs)){
 test('only current delivery pin and import changed: '+name,()=>{
  const original=readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
  const actual=readFileSync(new URL('./'+name,import.meta.url));
  verify(original,actual,name);
 });
}
test('a changed clinical answer is refused',()=>{
 const name='clinical-review-cervical-quiz.test.ts';
 const original=readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
 const actual=readFileSync(new URL('./'+name,import.meta.url)).toString('utf8');
 const changed=Buffer.from(replaceExactly(actual,'It lacks a vertebral body','A changed clinical answer',1),'utf8');
 assert.throws(()=>verify(original,changed,name),/Unapproved test change/);
});
