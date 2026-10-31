import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {admitKidneyQuizSuccessor} from './abdominal-quiz-kidney-successor-1031.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const old="'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'";
const importLine="import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n";
const specs={
 'clinical-review-abdominal-connective-quiz.test.ts':{sha:'bba9952246ae8252c04b23c0086cb8d75cb94b517c7dfe074109914fe17fa42c',anchor:"import {build} from 'esbuild';\n"},
 'clinical-review-abdominal-quiz.test.ts':{sha:'e1cfa38ce68152442f76a8168b6dfae3a4e7a56653ee1dd15e1fb1176dd3361f',anchor:"import {build} from './review-component-test-build.ts';\n"},
 'clinical-review-abdominal-vessel-quiz.test.ts':{sha:'ada1f2edd248d9ee7193b6509aaac03137b85e5d549bfca8c54ca447a689e0cb',anchor:"import {build} from 'esbuild';\n"},
 'clinical-review-hand-venous-quiz.test.ts':{sha:'e2133d475828275600acade5187994baebde9e82f5058cb856145af224650c05',anchor:"import {build} from 'esbuild';\n"},
 'clinical-review-head-neck-vessel-quiz.test.ts':{sha:'119ab10f5c7e4ece111a9c884ba9cfeb7f0532c8053e590ed771e2921058335b',anchor:"import {build} from 'esbuild';\n"},
 'clinical-review-neck-muscle-quiz.test.ts':{sha:'e66fb427b8c395e5611a3262851323baa27e689e824eed21a36ebbf8cbc208d9',anchor:"import {build} from 'esbuild';\n"},
 'clinical-review-pelvic-organ-quiz.test.ts':{sha:'e7258942fcfa336deb6e90408b0d16831698e5d2f24bba54c8ea8389c0f274ad',anchor:"import {build} from './review-component-test-build.ts';\n"},
};
function replaceOnce(source,needle,value){
 assert.equal(source.split(needle).length-1,1,'Unexpected admission shape: '+needle);
 return source.replace(needle,value);
}
function expected(original,name){
 const spec=specs[name];
 assert.equal(sha(original),spec.sha,'Original fixture bytes changed: '+name);
 const source=original.toString('utf8');
 assert(Buffer.from(source,'utf8').equals(original),'Original fixture is not UTF-8: '+name);
 assert(!source.includes('\r'),'Original line endings changed: '+name);
 return Buffer.from(replaceOnce(replaceOnce(source,old,'CURRENT_ATLAS_REVISION'),spec.anchor,spec.anchor+importLine),'utf8');
}
function verify(original,actual,name){
 const pinned=expected(original,name);
 const admitted=name==='clinical-review-abdominal-quiz.test.ts'?admitKidneyQuizSuccessor(pinned):pinned;
 assert(actual.equals(admitted),'Unapproved clinical test change: '+name);
}
for(const name of Object.keys(specs)){
 test('only current source pin and import changed: '+name,()=>{
  const original=readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
  const actual=readFileSync(new URL('./'+name,import.meta.url));
  verify(original,actual,name);
 });
}
test('a changed clinical answer is refused',()=>{
 const name='clinical-review-abdominal-quiz.test.ts';
 const original=readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
 const actual=readFileSync(new URL('./'+name,import.meta.url)).toString('utf8');
 const changed=Buffer.from(replaceOnce(actual,"FMA7196:'Blood'","FMA7196:'Altered answer'"),'utf8');
 assert.throws(()=>verify(original,changed,name),/Unapproved clinical test change/);
});
