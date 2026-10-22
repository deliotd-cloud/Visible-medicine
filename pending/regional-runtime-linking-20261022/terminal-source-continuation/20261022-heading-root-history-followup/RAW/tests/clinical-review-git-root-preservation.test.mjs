import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreSalivaryPrior} from './salivary-cache-epoch-adapter.mjs';
import {restoreSalivaryCurrentPrior} from './salivary-current-family-inverse.mjs';
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
function inverseLaterCt(text){
 const start=text.indexOf('// The completed quiz rows are immutable;');
 const end=text.indexOf('async function importedApi(){',start);
 assert(start>=0&&end>start,'One declared later-CT helper layer');
 const helper=text.slice(start,end);
 assert.equal(sha(Buffer.from(helper)),'821cc95facd0a1618185cb67ef01b7b76d9b4c65f17406470cbf95554b78f2a1',
  'Exact CT transition/Git/Review/learner/cache theorem');
 text=text.slice(0,start)+text.slice(end);
 const closureStart=text.indexOf(" for(const path of ['content/craniofacial-calcification-ct-pins.json'");
 const closureEnd=text.indexOf(' const api=await import(',closureStart);
 assert(closureStart>=0&&closureEnd>closureStart,'One CT closure layer');
 assert.equal(sha(Buffer.from(text.slice(closureStart,closureEnd))),
  'abd5821764667c9ffc1a1bb5c12b7e51422c3aed612a06010d14eae450460194',
  'Exact CT bundler-closure assertion');
 text=text.slice(0,closureStart)+text.slice(closureEnd);
 const current=' const laterCt=assertSalivaryCacheTransition(featureByIdentity,currentCache);';
 const prior=" for(const row of salivaryEntries)assert.deepEqual(row,featureByIdentity.get(row.identity),'Later regional cache edits must preserve salivary teaching');";
 assert.equal(text.split(current).length,2,'One cache comparison seam');
 text=text.replace(current,prior);
 const blockStart=text.indexOf("  if(group==='stylohyoid'){");
 const blockEnd=text.indexOf('  for(const code of emitted)for(const value of [lesson.body',blockStart);
 assert(blockStart>=0&&blockEnd>blockStart,'One CT emitted/Review/refusal layer');
 const block=text.slice(blockStart,blockEnd);
 assert.equal(sha(Buffer.from(block)),'6797cbe035e6851973b4d1f6ea3ab7ff324d8f2e6763bf9e0528886673550bf8',
  'Exact CT resolver, worksheet and refusal layer');
 return text.slice(0,blockStart)+text.slice(blockEnd);
}
function verify(entry,bytes){
 const original=readFileSync(new URL('./fixtures/'+entry.name+'.before-git-root.ts.raw',import.meta.url));
 assert.equal(sha(original),entry.hash,'Exact entire original test');
 // Only these test-source representations vary; raw evidence remains SHA-pinned.
 const oldLf=original.toString().replace(/\r\n/g,'\n');
 assert.deepEqual(Buffer.from(oldLf.replace(/\n/g,entry.originalEol)),original,'Declared uniform original EOL, no hidden raw changes');
 let expected=oldLf,restored=bytes.toString().replace(/\r\n/g,'\n');
 if(entry.name==='clinical-review-salivary-stylohyoid-quiz'){
  const prior=restoreSalivaryPrior(restoreSalivaryCurrentPrior(bytes));
  restored=prior.toString().replace(/\r\n/g,'\n');
  assert.equal(sha(prior),'c4e18aeb9ce2056cb50fcef3a665de0356f91b88ff78992a928b7346f3ca2362',
   'Exact later-CT salivary postimage with source190 type correction');
  const typed='const featureByIdentity=new Map<string,any>(featureCache.entries.map';
  const untyped='const featureByIdentity=new Map(featureCache.entries.map';
  assert.equal(restored.split(typed).length,2,'One source190 type-only correction');
  restored=restored.replace(typed,untyped);
  assert.equal(sha(Buffer.from(restored)),'fe9bbfe9e64286d36f1f373fd18475e91cdaf7a2ba6c504a0a71c7e483666dd5',
   'Exact earlier later-CT salivary postimage after type-only inverse');
  restored=inverseLaterCt(restored);
 }
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
