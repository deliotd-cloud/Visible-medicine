import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=Object.freeze({
 'atlas190-current-delivery.test.mjs':{
  current:'b198b7505c9ac9bc826d2a952ac4fcad8760dbdc250d0a488a8c09a0526b9ad3',
  forward:'ee51701b213d8a7b2720c5243146b286683cb791d48d5775c23f02501f842198',
 },
 'body-learning-layout-history-preservation.test.mjs':{
  current:'dd6099dbac9a94294a720a6e4de0bf10fc295ae4fc79ff94b22324c2d5e5d761',
  forward:'de95cdf5b16db2679b45b915fb7933ccbb42bdc3c83e06548fd700858f60e530',
 },
 'clinical-review-desktop-layout.test.mjs':{
  current:'7597bc43a6466e1cd60a20feb32a556b4ec73788d1638d024a98a55b85e59654',
  forward:'a0c4ad2500ba988fde1cd074fa4aeaf7a3cc090eeaf32e1f7bdc548e427f32fa',
 },
 'current-atlas-delivery.test.mjs':{
  current:'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea',
  forward:'799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b',
 },
});
export const colicLaterSourceNames=Object.freeze(Object.keys(cases));
const once=(text,after,before,name)=>{
 assert.equal(text.split(after).length,2,name+': one exact later source seam');
 return text.replace(after,before);
};

/** Recover the authenticated original fa1-forward test source after unrelated later edits. */
export function restoreColicLaterSource(name,currentBytes){
 const item=cases[name];
 if(!item)return currentBytes;
 assert.equal(sha(currentBytes),item.current,name+': exact V5 later source');
 let text=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(text),currentBytes,name+': lossless source UTF-8');
 assert(!text.includes('\r'),name+': exact LF source');
 if(name==='atlas190-current-delivery.test.mjs'){
  text=once(text,"import {restoreSalivaryCurrentPrior} from './salivary-current-family-inverse.mjs';\n",'',name);
  text=once(text,"restoreSalivaryPrior(restoreSalivaryCurrentPrior(read('tests/clinical-review-salivary-stylohyoid-quiz.test.ts')))",
   "restoreSalivaryPrior(read('tests/clinical-review-salivary-stylohyoid-quiz.test.ts'))",name);
 }else if(name==='body-learning-layout-history-preservation.test.mjs'){
  text=once(text,"import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';\n",'',name);
  text=once(text,"const current=restorePreExpansionFrame(read('../components/AtlasRuntimeFrame.tsx').toString());",
   "const current=read('../components/AtlasRuntimeFrame.tsx').toString();",name);
  const addition="\ntest('expansion keeps exact full preimage and rejects deleted or mutated seams',()=>{";
  assert.equal(text.split(addition).length,2,name+': one later expansion test');
  text=text.slice(0,text.indexOf(addition));
 }else if(name==='clinical-review-desktop-layout.test.mjs'){
  text=once(text,"test('ae84 delivery remains separately bound to the clean Atlas source',async()=>{",
   "test('current delivery remains separately bound to the clean Atlas source',()=>{",name);
  text=once(text," const {historicalReviewAe84Read,historicalReviewAe84Pin}=await import('./historical-review-ae84.mjs');\n const readAe84=path=>historicalReviewAe84Read(path,read);\n",'',name);
  text=once(text,'const current=validateCurrentAtlasDelivery({pin:historicalReviewAe84Pin(read),read:readAe84});',
   'const current=validateCurrentAtlasDelivery();',name);
  text=once(text,"const bindingBytes=readAe84('atlas-review/integration-inputs.json');",
   "const bindingBytes=read('atlas-review/integration-inputs.json');",name);
 }else{
  if(name==='current-atlas-delivery.test.mjs')text=once(text,
   'assert.equal(sourceFiles,1558);assert.equal(inputs,1724);assert(artifacts>100);',
   'assert.equal(sourceFiles,1558);assert.equal(inputs,1723);assert(artifacts>100);',name);
  text=once(text,'assert.equal(sourceFiles,1558);assert.equal(inputs,1723);assert(artifacts>100);',
   'assert.equal(sourceFiles,1558);assert.equal(inputs,1721);assert(artifacts>100);',name);
 }
 const restored=Buffer.from(text);
 assert.equal(sha(restored),item.forward,name+': complete V5→fa1-forward inverse');
 return restored;
}
