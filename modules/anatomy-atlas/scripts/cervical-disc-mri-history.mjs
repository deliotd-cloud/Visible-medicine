// Exact offline predecessor only; never runtime teaching or approval authority.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import transition from '../content/cervical-disc-mri-revision.transition.json' with {type:'json'};
import thoracic from '../content/thoracic-disc-mri-revision.transition.json' with {type:'json'};
import lumbar from '../content/lumbar-disc-mri-revision.transition.json' with {type:'json'};
import pins from '../content/spine-imaging-pins.json' with {type:'json'};
import before from '../content/spine-imaging.before.json' with {type:'json'};
export const hashCervicalMri=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(hashCervicalMri(transition),'0e67113a50b7e403c80f3f4bf817c65dc05513972c9eb7fe2c5f4110f3887fbf','Unrecorded cervical MRI revision');
assert.equal(hashCervicalMri(thoracic),'ecb78b86b69090927b2ec2f072ab4194e5f9c4764699e7389cfe31a67d27b06a','Immutable earlier thoracic revision');
assert.equal(hashCervicalMri(lumbar),'6e3531ebea4d280d54cb6d746fc8418883841f227853a4fddc304811c534e342','Immutable earlier lumbar revision');
assert.equal(hashCervicalMri(pins),transition.originalPinsJsonSha256);
assert.equal(hashCervicalMri(before),transition.originalBeforeJsonSha256);
assert.equal(transition.baselineCommit,'6601e0dbb3a0e5a1f3c88781f4e1a73568e760c0');
assert.equal(transition.entries.length,6);
assert.deepEqual(pins.entries.filter(e=>e.group==='cervicalDisc').map(e=>e.identity),transition.entries.map(e=>e.identity));
const byId=new Map(transition.entries.map(e=>[e.identity.id,e]));assert.equal(byId.size,6);
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
const same=(a,b,message)=>assert.deepEqual(a,b,message);

/** Reverse exactly this later revision before the older immutable spine epochs. */
export function beforeCervicalDiscMri(api,catalog){
 const present=['spineImagingTopics','spineImagingReferences','spineImagingLesson'].map(name=>api[name]!==undefined);
 assert(present.every(Boolean)||present.every(v=>!v),'Partial cervical MRI contract');
 if(catalog!==undefined){assert(Array.isArray(catalog?.structures),'Source catalog required');for(const e of transition.entries)same(catalog.structures.filter(s=>s.id===e.identity.id),[e.identity],'Exact cervical MRI catalog identity');}
 if(typeof api.bodyLesson!=='function'){
  assert(catalog===undefined&&present.every(v=>!v)&&api.bodyContent===undefined&&api.bodyDisplayCatalog===undefined,'Early synthetic undefined API only');return api;
 }
 if(present.every(v=>!v)){
  if(api.bodyContent!==undefined)assert.equal(typeof api.bodyContent,'function');
  const epochs=transition.entries.map(e=>{
   const lesson=api.bodyLesson(e.identity,'mri');
   const epoch=lesson===undefined?'undefined':JSON.stringify(lesson)===JSON.stringify(e.oldLesson)?'old':JSON.stringify(lesson)===JSON.stringify(e.pendingLesson)?'pending':'foreign';
   assert.notEqual(epoch,'foreign','Omitted cervical MRI contract requires exact prior epoch');
   if(api.bodyContent!==undefined)same(api.bodyContent(e.identity,'mri'),lesson===undefined?undefined:shown(lesson),'Omitted cervical MRI learner mismatch');
   return epoch;
  });
  assert(epochs.every(e=>e===epochs[0]),'Mixed omitted cervical MRI epochs');
  if(epochs[0]==='undefined')assert(catalog===undefined&&api.bodyDisplayCatalog===undefined,'Undefined synthetic epoch only');
  return api;
 }
 assert.equal(typeof api.spineImagingLesson,'function');assert.equal(typeof api.bodyContent,'function');
 const isNew=JSON.stringify(api.spineImagingTopics?.cervicalDisc?.mri)===JSON.stringify(transition.newTopic);
 const isOld=JSON.stringify(api.spineImagingTopics?.cervicalDisc?.mri)===JSON.stringify(transition.oldTopic);
 assert(isOld||isNew,'Unrecorded cervical MRI topic');
 const topicHash=hashCervicalMri(api.spineImagingTopics),refHash=hashCervicalMri(api.spineImagingReferences);
 if(isNew){same(topicHash,transition.newTopicsSha256,'New cervical MRI whole topic table');same(refHash,transition.newReferencesSha256,'New cervical MRI whole reference table');}
 else assert((topicHash===transition.oldTopicsSha256&&refHash===transition.oldReferencesSha256)||(topicHash===thoracic.oldTopicsSha256&&refHash===thoracic.oldReferencesSha256)||(topicHash===lumbar.oldTopicsSha256&&refHash===lumbar.oldReferencesSha256),'Unrecorded prior spine topic/reference epoch');
 same(api.spineImagingReferences[transition.addedReference.key],isNew?transition.addedReference.url:undefined,'Exact cervical MRI reading link');
 same(Object.hasOwn(api.spineImagingReferences,transition.addedReference.key),isNew,'Exact cervical MRI reading-link presence');
 for(const e of transition.entries){
  const expected=isNew?e.newLesson:e.oldLesson;same(hashCervicalMri(expected),isNew?e.newSha256:e.oldSha256,'Recorded full MRI lesson');
  same(api.spineImagingLesson(e.identity,'mri'),expected,'Cervical MRI helper mismatch');
  same(api.bodyLesson(e.identity,'mri'),expected,'Cervical MRI dispatch mismatch');
  same(api.bodyContent(e.identity,'mri'),shown(expected),'Cervical MRI learner mismatch');
 }
 if(isOld)return api;
 const topics=structuredClone(api.spineImagingTopics);topics.cervicalDisc.mri=structuredClone(transition.oldTopic);
 const references={...api.spineImagingReferences};delete references[transition.addedReference.key];
 const oldFor=(s,tab)=>{if(tab!=='mri'||!byId.has(s?.id))return undefined;const e=byId.get(s.id);same(s,e.identity,'Complete historical cervical MRI source identity');return structuredClone(e.oldLesson);};
 return {...api,spineImagingTopics:topics,spineImagingReferences:references,
  spineImagingLesson(s,tab){return oldFor(s,tab)??api.spineImagingLesson(s,tab);},
  bodyLesson(s,tab){return oldFor(s,tab)??api.bodyLesson(s,tab);},
  bodyContent(s,tab){const old=oldFor(s,tab);return old?shown(old):api.bodyContent(s,tab);}};
}
