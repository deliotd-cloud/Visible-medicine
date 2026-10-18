import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {MAX_LECTURE_ANATOMY_REFERENCES,lectureSlideAnatomyReferences,
  validateLectureAnatomyReferences} from '../lib/lecture-anatomy-collection.ts';
import {MAX_LECTURE_SLIDES_BYTES,validateLectureSlides} from '../lib/lecture-content.ts';
import {createLectureManifestRecord,parseAndVerifyLectureManifest} from '../lib/lecture-manifest.ts';
import {createLectureAnatomyReference,resolveLectureAnatomyReference,
  type LectureAnatomyReference} from '../lib/lecture-anatomy-reference.ts';

const slide = {id:'slide-1',title:'Synthetic lesson',body:'Teaching text',referenceUrl:'https://example.edu/reference'};
const manifestBase = {schema:'visible-medicine-lecture-v1',product:'Visible Medicine',
  intendedPurpose:'education-only',workbook:{id:'workbook:11111111-1111-4111-8111-111111111111',
    title:'Saved lecture',mode:'lecture',version:2}};

function pin(conceptId:string):LectureAnatomyReference {
  const reference=createLectureAnatomyReference(conceptId);
  assert(reference,`Missing synthetic source pin ${conceptId}`);
  return reference;
}

test('one through six saved pins validate, clone and preserve source order',()=>{
  const pins=['brainstem-pons','brainstem-midbrain','brainstem-medulla','cerebellum-vermis',
    'cerebellum-left-hemisphere','cerebellum-right-hemisphere'].map(pin);
  assert.equal(MAX_LECTURE_ANATOMY_REFERENCES,6);
  assert.equal(pins.length,MAX_LECTURE_ANATOMY_REFERENCES);
  const saved=validateLectureSlides([{...slide,anatomyReferences:pins}]);
  assert.deepEqual(saved[0].anatomyReferences,pins);
  assert.notStrictEqual(saved[0].anatomyReferences,pins);
  assert.deepEqual(lectureSlideAnatomyReferences(saved[0]),pins);
  assert.notStrictEqual(lectureSlideAnatomyReferences(saved[0])[0],pins[0]);
  for(const reference of pins)assert(resolveLectureAnatomyReference(reference));
  const stale={...pins[0],headRevision:'a'.repeat(64)};
  assert.deepEqual(validateLectureAnatomyReferences([stale]),[stale]);
  assert.equal(resolveLectureAnatomyReference(stale),null);
  assert.deepEqual(lectureSlideAnatomyReferences({anatomyReferences:[stale]}),[stale]);
});

test('legacy single pin and absent pin retain exact canonical manifest JSON and hash',async()=>{
  const reference=pin('brainstem-pons');
  for(const candidate of [slide,{...slide,anatomyReference:reference}]){
    const record=await createLectureManifestRecord({...manifestBase,slides:[candidate]});
    const expected=JSON.stringify({...manifestBase,slides:[candidate]});
    assert.equal(record.manifestJson,expected);
    assert.equal(record.integrityHash,createHash('sha256').update(expected).digest('hex'));
    assert.deepEqual(await parseAndVerifyLectureManifest(record.manifestJson,record.integrityHash),record.manifest);
    assert.equal(Object.hasOwn(record.manifest.slides[0],'anatomyReferences'),false);
  }
  assert.deepEqual(lectureSlideAnatomyReferences({anatomyReference:reference}),[reference]);
  assert.deepEqual(lectureSlideAnatomyReferences({}),[]);
});

test('plural pins round trip under the existing manifest schema and hash',async()=>{
  const references=[pin('brainstem-pons'),pin('cerebellum-vermis')];
  const record=await createLectureManifestRecord({...manifestBase,slides:[{...slide,anatomyReferences:references}]});
  assert.equal(record.manifest.workbook.version,2);
  assert.deepEqual((await parseAndVerifyLectureManifest(record.manifestJson,record.integrityHash)).slides[0].anatomyReferences,references);
  assert.equal(record.integrityHash,createHash('sha256').update(record.manifestJson).digest('hex'));
  await assert.rejects(()=>parseAndVerifyLectureManifest(record.manifestJson.replace('brainstem-pons','brainstem-midbrain'),record.integrityHash));
});

test('ambiguous, duplicate, empty, sparse and oversized collections fail closed',()=>{
  const reference=pin('brainstem-pons');
  const other=pin('cerebellum-vermis');
  const duplicate={...reference,headRevision:'b'.repeat(64)};
  const imageDuplicate={...other,conceptId:reference.conceptId};
  const sparse:LectureAnatomyReference[]=new Array(2);
  sparse[0]=reference;
  const candidates:unknown[]=[[],[reference,duplicate],[reference,imageDuplicate],sparse,
    Array(7).fill(reference),[reference,other,...Array(5).fill(pin('brainstem-midbrain'))],
    Object.assign([reference],{extra:true})];
  for(const candidate of candidates){
    assert.throws(()=>validateLectureAnatomyReferences(candidate));
    assert.throws(()=>validateLectureSlides([{...slide,anatomyReferences:candidate}]));
    assert.deepEqual(lectureSlideAnatomyReferences({anatomyReferences:candidate as LectureAnatomyReference[]}),[]);
  }
  for(const invalid of [{...slide,anatomyReference:reference,anatomyReferences:[other]},
    {...slide,anatomyReference:undefined,anatomyReferences:[other]},
    {...slide,anatomyReference:reference,anatomyReferences:undefined}]){
    assert.throws(()=>validateLectureSlides([invalid]));
    assert.deepEqual(lectureSlideAnatomyReferences(invalid as {anatomyReference?:LectureAnatomyReference;anatomyReferences?:LectureAnatomyReference[]}),[]);
  }
  assert.throws(()=>validateLectureSlides([{...slide,anatomyReferences:undefined}]));
});

test('accessors and nonplain reference objects are rejected without calling getters',()=>{
  const reference=pin('brainstem-pons');
  let calls=0;
  const elementGetter=[reference];
  Object.defineProperty(elementGetter,0,{get(){calls++;return reference;},enumerable:true});
  const fieldGetter=Object.defineProperty({...slide},'anatomyReferences',{
    enumerable:true,get(){calls++;return [reference];}});
  const referenceGetter=Object.defineProperty({...reference},'conceptId',{
    enumerable:true,get(){calls++;return reference.conceptId;}});
  const nonplain=Object.assign(Object.create({}),reference);
  for(const invalid of [elementGetter,[referenceGetter],[nonplain]]){
    assert.throws(()=>validateLectureAnatomyReferences(invalid));
    assert.deepEqual(lectureSlideAnatomyReferences({anatomyReferences:invalid as LectureAnatomyReference[]}),[]);
  }
  assert.throws(()=>validateLectureSlides([fieldGetter]));
  assert.deepEqual(lectureSlideAnatomyReferences(fieldGetter as {anatomyReferences?:LectureAnatomyReference[]}),[]);
  assert.equal(calls,0);
});

test('plural pins retain the existing 80 slide and 48,000 UTF-8 byte limits',()=>{
  const reference=pin('brainstem-pons');
  const large=Array.from({length:10},(_,index)=>({...slide,id:`slide-${index}`,body:'é'.repeat(4_900),anatomyReferences:[reference]}));
  assert(new TextEncoder().encode(JSON.stringify(large)).byteLength>MAX_LECTURE_SLIDES_BYTES);
  assert.throws(()=>validateLectureSlides(large));
  assert.throws(()=>validateLectureSlides(Array.from({length:81},(_,index)=>({...slide,id:`slide-${index}`,anatomyReferences:[reference]}))));
});
