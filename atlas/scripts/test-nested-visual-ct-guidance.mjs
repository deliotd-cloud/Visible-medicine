import assert from 'node:assert/strict';
import test from 'node:test';
import {nestedCTOrientation,nestedCTOrientationReferences} from '../content/nested-ct-orientation.ts';
import {nestedBeforeCTOrientation,nestedCTOrientationIds} from './nested-ct-orientation-history.mjs';
import {nestedBeforeVisualCTGuidance,visualCTIds,visualCTReferenceKeys} from './nested-visual-ct-history.mjs';

const clone=value=>structuredClone(value);
const api=()=>({
  nestedConcepts:[...nestedCTOrientationIds.map(id=>({id,imaging:{ct:clone(nestedCTOrientation[id]),mri:{body:'unrelated'}}})),
    {id:'unrelated',imaging:{ct:{body:'untouched'}}}],
  nestedTeachingReferences:{...clone(nestedCTOrientationReferences),unrelated:{title:'untouched',url:'https://example.invalid/'}},
});
const ct=(value,id)=>value.nestedConcepts.find(concept=>concept.id===id)?.imaging?.ct;

test('two exact visual CT lessons add attributed, bounded orientation only',()=>{
  assert.deepEqual(visualCTIds,['visual-optic-chiasm','visual-optic-tracts']);
  const [chiasm,tracts]=visualCTIds.map(id=>nestedCTOrientation[id]);
  for(const lesson of [chiasm,tracts]){
    assert.equal(lesson.readiness,'draft');
    assert(lesson.body.trim().split(/\s+/).length>=45&&lesson.body.trim().split(/\s+/).length<=65);
    assert(!lesson.references.includes('nestedCTReuseLicense'),'ACR/Chen are not assigned the older reuse licence');
  }
  assert.deepEqual(chiasm.references,['nestedCTACRVision2025','nestedCTVisual']);
  assert.deepEqual(tracts.references,['nestedCTChen2009','nestedCTVisual']);
  assert.match(chiasm.body,/suprasellar/);assert.match(chiasm.body,/MRI better characterizes/);
  assert.match(chiasm.body,/calcification or adjacent bone/);assert.match(chiasm.body,/not a traced CT boundary/);
  assert.match(tracts.body,/cerebral peduncle/);assert.match(tracts.body,/expected geniculate region/);
  assert.match(tracts.body,/do not establish tract visibility on CT/);
  assert.match(tracts.body,/no axons, validated termination, patient registration/);
  assert.equal(nestedCTOrientationReferences.nestedCTACRVision2025.url,'https://acsearch.acr.org/docs/3196640/Narrative');
  assert.equal(nestedCTOrientationReferences.nestedCTChen2009.url,'https://pubmed.ncbi.nlm.nih.gov/19837645/');
  assert(!/CC BY|Creative Commons/.test(nestedCTOrientationReferences.nestedCTACRVision2025.title));
  assert(!/CC BY|Creative Commons/.test(nestedCTOrientationReferences.nestedCTChen2009.title));
});

test('exact two-topic inverse restores the original five-topic CT transition',()=>{
  const current=api(),older=nestedBeforeVisualCTGuidance(current);
  assert.notEqual(older,current);
  for(const id of nestedCTOrientationIds.filter(id=>!visualCTIds.includes(id)))
    assert.deepEqual(ct(older,id),ct(current,id),`${id}: other CT lesson byte exact`);
  for(const id of visualCTIds)assert.notDeepEqual(ct(older,id),ct(current,id),`${id}: substantive guidance revision`);
  for(const key of visualCTReferenceKeys)assert(!Object.hasOwn(older.nestedTeachingReferences,key),`${key}: new reference removed`);
  assert.equal(nestedBeforeVisualCTGuidance(older),older,'Original two lessons are an idempotent historical state');
  const earliest=nestedBeforeCTOrientation(current);
  for(const id of nestedCTOrientationIds)assert.equal(ct(earliest,id),undefined,`${id}: original CT addition inverted`);
  for(const key of ['nestedCTAuditory','nestedCTTemporal','nestedCTVisual','nestedCTReuseLicense',...visualCTReferenceKeys])
    assert(!Object.hasOwn(earliest.nestedTeachingReferences,key),`${key}: original addition inverted`);
  assert.deepEqual(earliest.nestedConcepts.find(c=>c.id==='unrelated'),current.nestedConcepts.find(c=>c.id==='unrelated'));
  assert.deepEqual(earliest.nestedTeachingReferences.unrelated,current.nestedTeachingReferences.unrelated);
  assert.equal(nestedBeforeCTOrientation(earliest),earliest,'Pre-CT state remains idempotent');
});

test('partial, forged and foreign visual CT states fail closed',()=>{
  for(const edit of [
    value=>{delete value.nestedTeachingReferences.nestedCTChen2009;},
    value=>{ct(value,'visual-optic-chiasm').body+=' Forged.';},
    value=>{ct(value,'visual-optic-tracts').references=['nestedCTReuseLicense'];},
    value=>{value.nestedTeachingReferences.nestedCTACRVision2025.url='https://foreign.invalid/';},
    value=>{delete value.nestedConcepts.find(c=>c.id==='visual-optic-tracts').imaging.ct;},
    value=>{ct(value,'inferior-collicular-brachia').body+=' Forged.';},
  ]){const altered=api();edit(altered);assert.throws(()=>nestedBeforeCTOrientation(altered));}
});
