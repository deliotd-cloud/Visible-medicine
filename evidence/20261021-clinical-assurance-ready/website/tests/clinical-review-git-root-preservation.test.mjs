import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cases=[
 {name:'clinical-review-salivary-stylohyoid-quiz',originalEol:'\r\n',hash:'7ae70f87540ce1cefa82437e9578b13ec3fddfc5ff2a2a9ccdd23e5ba4ae30d2',edits:[
  ["import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
  ["const atlas='F:/VisibleMedicine/atlas';",'const atlas=currentAtlasDeliveryRoot();'],
 ]},
 {name:'clinical-review-teaching-heading',originalEol:'\n',hash:'228eaa9986e7730815905d9ea11feb896a4effec5f1f64a1c0b1b1e25c8caef6',edits:[
  ["const sourceRepo=process.env.ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas';",'const sourceRepo=currentAtlasDeliveryRoot();'],
 ]},
];
function verify(entry,bytes){
 const original=readFileSync(new URL('./fixtures/'+entry.name+'.before-git-root.ts.raw',import.meta.url));
 assert.equal(sha(original),entry.hash,'Exact entire original test');
 // Only these test-source representations vary; raw evidence remains SHA-pinned.
 const oldLf=original.toString().replace(/\r\n/g,'\n');
 assert.deepEqual(Buffer.from(oldLf.replace(/\n/g,entry.originalEol)),original,'Declared uniform original EOL, no hidden raw changes');
 let expected=oldLf,restored=bytes.toString().replace(/\r\n/g,'\n');
 for(const [before,after] of entry.edits){
  assert.equal(expected.split(before).length,2,'One original seam');
  expected=expected.replace(before,after);
 }
 assert.equal(restored,expected,'Only checked-root declaration/import changes; whole registered test bodies unchanged');
 for(const [before,after] of [...entry.edits].reverse()){
  assert.equal(restored.split(after).length,2,'One inverse seam');restored=restored.replace(after,before);
 }
 assert.deepEqual(Buffer.from(restored.replace(/\n/g,entry.originalEol)),original,'Whole original bytes restored in exact declared representation');
 assert.equal((expected.match(/\btest\(/g)||[]).length,(original.toString().match(/\btest\(/g)||[]).length);
 return expected;
}
for(const entry of cases)test(entry.name+' retains every original assertion and historical/current theorem',()=>{
 verify(entry,readFileSync(new URL('./'+entry.name+'.test.ts',import.meta.url)));
});
test('a changed historical epoch, removed assertion or unchecked root cannot pass as a root-only repair',()=>{
 for(const entry of cases){
  const text=verify(entry,readFileSync(new URL('./'+entry.name+'.test.ts',import.meta.url)));
  const rootLine=entry.edits.at(-1)[1];
  for(const changed of [text.replace(rootLine,"const sourceRepo='F:/VisibleMedicine/atlas';"),
   text.replace('assert.equal(','assert.notEqual('),
   text.replace('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','0'.repeat(40)),
   'if(false){\n'+text+'\n}']){
   // Salivary keeps its baseline/completed epochs rather than a 9f literal.
   if(changed!==text)assert.throws(()=>verify(entry,Buffer.from(changed)));
  }
 }
});
