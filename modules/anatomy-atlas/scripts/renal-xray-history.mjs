// Exact offline editorial rewind. Never imported by learner or Review runtime.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/abdominal-organ-imaging-pins.json' with {type:'json'};
import renalUltrasoundTransition from '../content/renal-ultrasound.transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const parentCommit='ce9dcce39fb088975bee2ec890730d1ee153d70f';
const originalPinsHash='4eaecd43646f4f7f2df08ee3dfb0846e3f372341009b4034b26695b38a5bfc69';
const originalUltrasoundTransitionHash='9096a2e2ada11a5f74003b30dd7eef99c69953b32f9ab24b0d0c3feb700c5f40';
const original=pins.entries.filter(entry=>['FMA7204','FMA7205'].includes(entry.identity.fmaId));
const names=['abdominalOrganImagingGroups','abdominalOrganImagingTopics','abdominalOrganImagingReferences','abdominalOrganImagingLandmarks','abdominalOrganImagingScope'];
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};

export function beforeRenalXray(api,catalog) {
 assert(api&&typeof api==='object','Renal X-ray replay requires an API');
 if(api.bodyLesson===undefined){
  assert(catalog===undefined&&api.bodyContent===undefined&&api.bodyDisplayCatalog===undefined&&
   api.abdominalOrganImagingLesson===undefined&&names.every(name=>api[name]===undefined),
   'Only an early synthetic API may omit renal lessons');
  return api;
 }
 assert.equal(typeof api.bodyLesson,'function','Renal X-ray replay requires bodyLesson');
 assert.equal(hash(pins),originalPinsHash,'Original abdominal source pins changed');
 assert.equal(original.length,2,'Exactly two pinned renal roots required');
 const transition=JSON.parse(readFileSync(new URL('../content/renal-xray.transition.json',import.meta.url),'utf8'));
 assert.equal(hash(transition),'ba280268012a53fc4a357b6caab353ecb0310fecca5963b79512b73cbc615166','Unrecorded renal X-ray transition');
 assert.equal(transition.parentCommit,parentCommit);
 assert.equal(transition.originalPinsHash,originalPinsHash);
 assert.deepEqual(transition.newReferences,['renalPlainFilm','renalIvp','renalStoneRadiopacity']);
 assert.equal(hash(renalUltrasoundTransition),originalUltrasoundTransitionHash,'Original renal Ultrasound transition changed');
 assert.equal(transition.entries?.length,2,'Exactly two renal X-ray transitions required');
 assert.equal(new Set(transition.entries.map(entry=>entry.identity.id)).size,2);

 const present=names.map(name=>api[name]!==undefined);
 assert(present.every(Boolean)||present.every(value=>!value),'Partial renal editorial metadata');
 let previousMaps,metadataEpoch;
 if(present.every(Boolean)){
  const maps={groups:api.abdominalOrganImagingGroups,topics:api.abdominalOrganImagingTopics,
   references:api.abdominalOrganImagingReferences,landmarks:api.abdominalOrganImagingLandmarks,scope:api.abdominalOrganImagingScope};
  const digest=hash(maps);
  assert(digest===transition.currentMetadataHash||digest===transition.previousMetadataHash||
   digest===renalUltrasoundTransition.previousMetadataHash,'Foreign renal editorial metadata');
  metadataEpoch=digest===transition.currentMetadataHash?'current':
   digest===transition.previousMetadataHash?'old':'old-ultrasound';
  if(metadataEpoch==='old-ultrasound'){
   assert.equal(hash(maps.topics.kidney.xray),hash(transition.focus.previous.topic),'Older renal metadata must retain original X-ray');
   assert.deepEqual(maps.references,renalUltrasoundTransition.focus.previous.references,'Older renal metadata contains foreign references');
   for(const key of transition.newReferences)assert(!Object.hasOwn(maps.references,key),'Older metadata contains a current X-ray reference');
  }
  if(metadataEpoch==='current'){
   const topics=structuredClone(maps.topics),references=structuredClone(maps.references);
   topics.kidney.xray=structuredClone(transition.focus.previous.topic);
   for(const key of transition.newReferences){assert(Object.hasOwn(references,key),'Missing current renal X-ray reference');delete references[key];}
   previousMaps={...maps,topics,references};
   assert.equal(hash(previousMaps),transition.previousMetadataHash,'Renal metadata replay changed another topic');
  }
 } else assert(api.abdominalOrganImagingLesson===undefined||typeof api.bodyDisplayCatalog!=='function','Current display API requires renal editorial metadata');
 if(api.bodyContent!==undefined)assert.equal(typeof api.bodyContent,'function','Renal body content must be callable');
 if(api.abdominalOrganImagingLesson!==undefined)assert.equal(typeof api.abdominalOrganImagingLesson,'function','Renal helper must be callable');
 if(catalog!==undefined){
  let display=catalog;
  if(hash(catalog)!==transition.catalogHash){
   assert.equal(typeof api.bodyDisplayCatalog,'function','Raw renal catalog requires display projection');
   display=api.bodyDisplayCatalog(catalog);
  }
  assert.equal(hash(display),transition.catalogHash,'Renal source catalog changed');
  for(const entry of transition.entries)assert.deepEqual(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity],'Renal display identity changed');
 }

 let current=0,old=0,pending=0,absent=0;
 for(const [index,entry] of transition.entries.entries()){
  const pin=original.find(candidate=>candidate.identity.id===entry.identity.id);
  assert(pin&&['FMA7204','FMA7205'].includes(entry.identity.fmaId),'Foreign renal transition identity');
  assert.deepEqual(entry.identity,pin.identity,'Renal source identity changed');
  assert.equal(entry.tab,'xray');assert.equal(entry.previousHash,hash(entry.previous),'Renal predecessor changed');
  assert.equal(entry.previous.readiness,'draft');
  assert.equal(index,original.findIndex(candidate=>candidate.identity.id===entry.identity.id),'Renal transition order changed');
  const lesson=api.bodyLesson(entry.identity,'xray');
  if(lesson===undefined){
   absent++;
   if(api.bodyContent)assert.equal(api.bodyContent(entry.identity,'xray'),undefined,'Foreign absent renal body content');
   if(api.abdominalOrganImagingLesson)assert.equal(api.abdominalOrganImagingLesson(entry.identity,'xray'),undefined,'Foreign absent renal helper');
   continue;
  }
  const digest=hash(lesson);
  const epoch=digest===entry.currentHash?'current':digest===entry.previousHash?'old':
   isDeepStrictEqual(lesson,pin.previous.xray)?'pending':'foreign';
  if(epoch==='current')current++;
  else if(epoch==='old')old++;
  else if(epoch==='pending')pending++;
  else assert.fail('Unrecorded renal X-ray lesson');
  if(typeof api.abdominalOrganImagingLesson==='function')assert.equal(typeof api.bodyContent,'function','Current renal helper requires body content');
  if(typeof api.bodyContent==='function')assert.deepEqual(api.bodyContent(entry.identity,'xray'),shown(lesson),'Foreign renal body content');
  if(typeof api.abdominalOrganImagingLesson==='function'){
   const helper=api.abdominalOrganImagingLesson(entry.identity,'xray');
   if(epoch==='pending')assert(helper===undefined||hash(helper)===entry.previousHash,'Foreign renal draft helper');
   else assert.deepEqual(helper,lesson,'Foreign renal draft helper');
  }
 }
 assert(current===2||old===2||pending===2||(absent===2&&catalog===undefined&&api.bodyDisplayCatalog===undefined&&
  api.abdominalOrganImagingLesson===undefined&&present.every(value=>!value)),'Mixed renal X-ray history');
 if(current===2&&metadataEpoch!==undefined)assert.equal(metadataEpoch,'current','Current renal lessons require current metadata');
 if((old===2||pending===2)&&metadataEpoch!==undefined)assert(['old','old-ultrasound'].includes(metadataEpoch),'Earlier renal lessons require previous metadata');
 if(old===2||pending===2||absent===2)return api;
 if(present.every(Boolean))assert(previousMaps,'Current renal metadata is required for replay');
 const entries=new Map(transition.entries.map(entry=>[entry.identity.id,entry]));
 const matches=(s,t)=>t==='xray'&&entries.has(s?.id);
 const bodyLesson=(s,t)=>{
  if(!matches(s,t))return api.bodyLesson(s,t);
  const entry=entries.get(s.id);assert.deepEqual(s,entry.identity,'Foreign renal source identity');
  return structuredClone(entry.previous);
 };
 return {...api,
  ...(previousMaps?{abdominalOrganImagingTopics:previousMaps.topics,abdominalOrganImagingReferences:previousMaps.references}:{}),
  bodyLesson,
  ...(api.bodyContent?{bodyContent(s,t){return matches(s,t)?shown(bodyLesson(s,t)):api.bodyContent(s,t);}}:{}),
  ...(api.abdominalOrganImagingLesson?{abdominalOrganImagingLesson(s,t){return matches(s,t)?bodyLesson(s,t):api.abdominalOrganImagingLesson(s,t);}}:{}),
 };
}
