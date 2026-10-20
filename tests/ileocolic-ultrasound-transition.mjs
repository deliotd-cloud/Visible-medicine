import assert from 'node:assert/strict';

// The historical API runs in a separate VM. Clone only ordinary message data,
// while refusing accessors, hidden fields, symbols and cyclic structures.
function messageData(value, ancestors=new Set()) {
  if(value===null||typeof value!=='object'){
    assert(['undefined','string','number','boolean'].includes(typeof value)||value===null);
    if(typeof value==='number') assert(Number.isFinite(value));
    return structuredClone(value);
  }
  assert(!ancestors.has(value),'cyclic lesson data'); ancestors.add(value);
  const prototype=Object.getPrototypeOf(value);
  assert(Array.isArray(value)||prototype===null||Object.getPrototypeOf(prototype)===null,
    'plain lesson data only');
  for(const key of Reflect.ownKeys(value)){
    assert.equal(typeof key,'string','symbol metadata refused');
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    assert(Object.hasOwn(descriptor,'value'),'accessor refused');
    assert(descriptor.enumerable||(Array.isArray(value)&&key==='length'),'hidden metadata refused');
    messageData(descriptor.value,ancestors);
  }
  ancestors.delete(value); return structuredClone(value);
}
const same=(actual,expected,label)=>assert.deepEqual(messageData(actual),messageData(expected),label);

export const ileocolicIdentity={
  id:'vm:anatomy:body:abdomen:unspecified:vessel:ileocolic-artery',
  fmaId:'FMA14815',name:'Ileocolic artery',sourceName:'ileocolic artery',
  system:'vessels',category:'vessel',laterality:'unspecified',region:'abdomen',
  regions:['abdomen'],bundle:'abdomen-vessels-mesenteric',nodeName:'FMA14815',
  bounds:{min:[-0.3138050138950348,1.5446600914001465,0.7963600158691406],
    max:[-0.054398197680711746,1.8339098691940308,0.9436999559402466]},
  center:[-0.18410160578787327,1.6892849802970886,0.8700299859046936],
  anchor:[-0.1850760132074356,1.7021899223327637,0.8727099895477295],
  sourceTree:'isa',
  sources:[{file:'FJ3439',sha256:'a0e7715dace7a22773b5e976f415b6049fe84eeb8e91f01cb6a4582c31ced81a'}],
  coverageNote:'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. Selected named vessel surface only, not a complete vascular tree. Branch continuity, calibre, bowel supply territories, variants and vessel relationships require specialist review. No flow, patency or procedural guidance is established.',
  provenance:{method:'licensed-source-mesh',license:'CC-BY-4.0',sourceVersion:'4.0',recovered:true},
  validation:{status:'unvalidated',anatomicalReview:false},
};

export function assertIleocolicUltrasoundTransition({structure,tab,priorLesson,before,
  predecessor,predecessorTopic,after,introduced,topic,introducedTopic,
  currentResolver,worksheet}) {
  assert.equal(tab,'ultrasound');
  same(structure,ileocolicIdentity,'complete ileocolic source identity');
  assert.equal(predecessor.readiness,'pending');
  same(priorLesson,predecessor,'f1 predecessor');
  same(before,predecessor,'baseline predecessor');
  same(predecessorTopic,{tab,...predecessor},'parent Review predecessor');
  assert.equal(introduced.readiness,'draft');
  assert.notDeepEqual(messageData(introduced),messageData(predecessor),'actual new teaching');
  same(after,introduced,'current exact introduction lesson');
  same(after,currentResolver(structure,tab),'current source-bound resolver');
  same(topic,{tab,...after},'current complete Review topic');
  same(topic,introducedTopic,'introduction Review topic');
  assert.equal(worksheet.approval,false,'no carried clinical approval');
  assert.equal(worksheet.status,'worksheet-not-submitted','unsigned Review worksheet');
  assert.match(after.note,/revision-bound radiologist review pending/i);
  assert.match(after.note,/No article image, scan, Doppler data or patient-space registration/i);
  assert.match(after.note,/Atlas, case and lecture access remain independent/i);
  assert.match(after.body,/one healthy child/);
  assert.match(after.body,/not evidence that the artery can routinely be identified/);
  same(after.citations,['https://pmc.ncbi.nlm.nih.gov/articles/PMC6659467/',
    'https://pubmed.ncbi.nlm.nih.gov/9172672/'],'fixed original citations');

  const mutations=[
    s=>{s.id+='-foreign';},s=>{s.laterality='left';},s=>{s.fmaId+='-foreign';},
    s=>{s.sources[0].sha256='0'.repeat(64);},s=>{s.bundle+='-foreign';},
    s=>{s.regions.push('pelvis');},s=>{s.validation.anatomicalReview=true;},
    s=>{s.bounds.min[0]+=.01;},s=>{s.extra='foreign';},
  ];
  for(const mutate of mutations){
    const changed=structuredClone(ileocolicIdentity); mutate(changed);
    assert.equal(currentResolver(changed,tab),undefined,'altered complete identity refused');
  }
  assert.equal(currentResolver(structure,'ct'),undefined,'wrong tab refused');
  const changedTopic=structuredClone(messageData(topic)); changedTopic.citations[0]='https://invalid.example/';
  assert.notDeepEqual(changedTopic,messageData(topic),'citation mutation visible');
  const changedReadiness=structuredClone(messageData(topic)); changedReadiness.readiness='approved';
  assert.notDeepEqual(changedReadiness,messageData(topic),'readiness mutation visible');
}
