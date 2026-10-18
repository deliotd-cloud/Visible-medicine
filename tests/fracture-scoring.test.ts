import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreFracture,scorePaper,decodeFractureResponse,type FractureKey} from '../lib/fracture-scoring.mjs';
const key:FractureKey={status:'reviewed',fracturePresent:true,acceptedBoneAnswers:['radius','distal radius']};
test('two-mark rule covers all choices, missing bone and wrong first choice',()=>{
  for(const [present,choice,bone,marks] of [[true,'yes','radius',2],[true,'yes','ulna',1],[true,'yes','',1],[true,'no','radius',0],[false,'no','',2],[false,'yes','radius',0]] as const)
    assert.equal(scoreFracture({...key,fracturePresent:present},{choice,bone,submitted:true}).marks,marks);
});
test('explicit whole-answer aliases accept case/spacing; extra and negated bones do not match',()=>{
  const grade=(bone:string)=>scoreFracture(key,{choice:'yes',bone,submitted:true}).marks;
  assert.equal(grade(' DISTAL   RADIUS '),2);
  for(const text of ['not radius','radius or ulna','radius and ulna','radius fracture']) assert.equal(grade(text),1);
  assert.equal(scoreFracture({...key,acceptedBoneAnswers:['radius and ulna','ulna and radius']},{choice:'yes',bone:'ulna and radius',submitted:true}).marks,2);
});
test('pending, unknown, incomplete keys and unsubmitted attempts never invent marks',()=>{
  for(const invalid of [{...key,status:'pending' as const},{...key,fracturePresent:null},{...key,acceptedBoneAnswers:[]},{...key,acceptedBoneAnswers:[' ']}])
    assert.equal(scoreFracture(invalid,{choice:'yes',bone:'radius',submitted:true}).marks,null);
  assert.equal(scoreFracture(key,{choice:'yes',bone:'radius',submitted:false}).marks,null);
  assert.equal(decodeFractureResponse('{"choice":"no","bone":"","submitted":true,"marks":2}').submitted,false);
});
test('papers require exactly 50 unique cases, total 100, and wait for every key/response',()=>{
  const cases=Array.from({length:50},(_,i)=>({id:`case-${i}`,key,response:{choice:'yes' as const,bone:'radius',submitted:true}}));
  assert.equal(scorePaper(cases).marks,100); assert.equal(scorePaper(cases).maxMarks,100);
  assert.throws(()=>scorePaper(cases.slice(1)),/50_UNIQUE/);
  assert.throws(()=>scorePaper([...cases.slice(1),cases[1]]),/50_UNIQUE/);
  cases[0].response.submitted=false; assert.equal(scorePaper(cases).marks,null);
});
