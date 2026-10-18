import assert from 'node:assert/strict';
import { test } from 'node:test';
import { candidateDigest } from '../lib/clinical-review-candidate.ts';
import { validateFrozenComparisonPair } from '../lib/frozen-candidate-comparison.ts';

const h = (letter: string) => letter.repeat(64);
async function descriptor(mode: 'inspection-only'|'personal-review', selections=['a','b'], supersedes: string|null=null) {
  const personal=mode==='personal-review';
  const material={schema:`visible-medicine.clinical-review-candidate/${personal?2:1}`,kind:personal?'root-body-review':'root-body-inspection',label:'Synthetic',createdAt:'2026-10-18T00:00:00.000Z',atlasRevision:'a'.repeat(40),reviewRevision:h('b'),rendererRevision:h('c'),decisionMode:mode,
    ...(personal?{supersedes}:{}),selections:selections.map(structureId=>({structureId,structureName:structureId,region:'foot',materialHash:h('d'),sourceHash:h('e'),teachingHash:h('f'),...(personal?{review:{checklistVersion:'body-review-1',checklists:{geometry:[{id:'g',label:'Geometry'}],teaching:[{id:'t',label:'Teaching'}],imaging:[{id:'i',label:'Imaging'}]},blockers:{geometry:[],teaching:[],imaging:[]},teachingTabs:['anatomy']}}:{})})),
    files:['index.html','viewer/index.html','worksheet.json'].map(path=>({path,sha256:h('1'),bytes:12,contentType:path.endsWith('.json')?'application/json':'text/html',storage:'candidate'}))};
  return {...material,id:await candidateDigest(material)};
}

test('accepts exact direct supersession with equal unordered selection set',async()=>{
  const previous=await descriptor('inspection-only');
  const current=await descriptor('personal-review',['b','a'],previous.id);
  const pair=await validateFrozenComparisonPair(current,previous);
  assert.equal(pair.current.id,current.id);
  assert.equal(pair.previous.id,previous.id);
});
test('rejects unrelated, reversed, missing, duplicate and tampered descriptors',async()=>{
  const previous=await descriptor('inspection-only');
  const current=await descriptor('personal-review',['a','b'],previous.id);
  const unrelated=await descriptor('inspection-only',['a','c']);
  await assert.rejects(validateFrozenComparisonPair(current,unrelated));
  await assert.rejects(validateFrozenComparisonPair(previous,current));
  await assert.rejects(validateFrozenComparisonPair({...current,supersedes:null},previous));
  await assert.rejects(validateFrozenComparisonPair({...current,selections:[current.selections[0],current.selections[0]]},previous));
  await assert.rejects(validateFrozenComparisonPair({...previous,label:'tampered'},current));
});
