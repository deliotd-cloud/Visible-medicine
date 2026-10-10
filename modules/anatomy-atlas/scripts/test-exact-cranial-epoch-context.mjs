import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {exactCranialEpochContext,validateExactCranialTransition} from './exact-cranial-epoch-context.mjs';

const root=new URL('../',import.meta.url);
const json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const copy=value=>structuredClone(value);
const changeLesson=(context,id,topic,mutate)=>({
 ...context,api:{...context.api,bodyLesson(s,t){
  const lesson=context.api.bodyLesson(s,t);
  if(s.id!==id||t!==topic)return lesson;
  const changed=copy(lesson);mutate(changed);return changed;
 }},
});

test('exact cranial teaching epochs retain complete snapshots and reject copied-state drift',async()=>{
 const [boundaryBefore,boundaryAfter,costalAfter]=await Promise.all([
  exactCranialEpochContext('cranial-boundary-before'),
  exactCranialEpochContext('cranial-boundary-after'),
  exactCranialEpochContext('costal-after'),
 ]);
 const costalBefore=await exactCranialEpochContext('costal-before');
 assert.equal(costalBefore.commit,boundaryAfter.commit);
 assert.deepEqual(costalBefore.catalog,boundaryAfter.catalog);
 const [boundaryPins,boundaryTransition,costalPins,costalTransition]=await Promise.all([
  json('content/cranial-boundary-clinical-pins.json'),
  json('content/cranial-boundary-clinical.transition.json'),
  json('content/costal-cartilage-imaging-pins.json'),
  json('content/costal-cartilage-imaging.transition.json'),
 ]);
 const boundary={before:boundaryBefore,after:boundaryAfter,pins:boundaryPins,transition:boundaryTransition};
 const costal={before:costalBefore,after:costalAfter,pins:costalPins,transition:costalTransition};
 assert.deepEqual(validateExactCranialTransition('cranial-boundary',boundary),{
  kind:'cranial-boundary',beforeCommit:boundaryBefore.commit,afterCommit:boundaryAfter.commit,
  targets:boundaryPins.entries.length,sections:boundaryPins.entries.reduce((n,e)=>n+e.topics.length,0),
 });
 assert.equal(validateExactCranialTransition('costal',costal).sections,
  costalPins.entries.reduce((n,e)=>n+e.topics.length,0));

 // A forged context, copied pin, unrelated lesson or recipe must not pass as
 // the exact transition even when all target entries remain untouched.
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,before:{...costal.before,commit:boundaryBefore.commit},
 }),/Wrong before epoch/);
 assert.throws(()=>validateExactCranialTransition('cranial-boundary',{
  ...boundary,transition:{...copy(boundaryTransition),parentCommit:costalAfter.commit},
 }),/Altered historical transition/);
 const alteredPins=copy(costalPins);alteredPins.entries[0].identity.name+=' altered';
 assert.throws(()=>validateExactCranialTransition('costal',{...costal,pins:alteredPins}),/Altered historical pins/);
 const target=costalPins.entries[0];
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,after:changeLesson(costalAfter,target.identity.id,target.topics[0],v=>{v.title+=' changed';}),
 }),/After target mismatch/);
 const epigastric=(await json('content/epigastric-vein-pathology.before.json')).entries[0].identity;
 assert(costalAfter.display.structures.some(s=>s.id===epigastric.id));
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,after:changeLesson(costalAfter,epigastric.id,'pathology',v=>{v.title+=' unrelated draft';}),
 }),/After full teaching or recipes mismatch/);
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,after:changeLesson(costalAfter,target.identity.id,target.topics[0],
   v=>Object.assign(v,copy(costalBefore.api.bodyLesson(target.identity,target.topics[0])))),
 }),/After target mismatch/);
 const wrongIdentity={...target.identity,name:target.identity.name+' altered'};
 const driftedDisplay={...costalAfter.display,structures:costalAfter.display.structures.map(s=>s.id===target.identity.id?wrongIdentity:s)};
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,after:{...costalAfter,display:driftedDisplay},
 }),/Source identity changed/);
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,after:{...costalAfter,display:{...costalAfter.display,license:'altered'}},
 }),/Source identity mismatch/);
 assert.throws(()=>validateExactCranialTransition('costal',{
  ...costal,after:{...costalAfter,api:{...costalAfter.api,dissectionProfiles:{...costalAfter.api.dissectionProfiles,altered:{id:'altered'}}}},
 }),/After full teaching or recipes mismatch/);
});

test('unknown and missing epochs fail closed',async()=>{
 await assert.rejects(exactCranialEpochContext(undefined),/Unknown cranial epoch/);
 await assert.rejects(exactCranialEpochContext('HEAD'),/Unknown cranial epoch/);
 await assert.rejects(exactCranialEpochContext('a8a711c40fe20ebacf880e028354ab4e71cb8651'),/Unknown cranial epoch/);
 await assert.rejects(exactCranialEpochContext('missing'),/Unknown cranial epoch/);
});
