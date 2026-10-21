import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inverseCurrentToLaterSix} from './spinal-current-source-inverse.mjs';

const originalUrl=new URL('./fixtures/atlas-spinal-muscle-xray-after-first-lifecycle.mjs.raw',import.meta.url);
const currentUrl=new URL('./atlas-spinal-muscle-xray.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='3df0513e9d5889434f195915e26d66680e966ee31d5209e6d43d6dbb0596bedf';
const currentSha='3824e78ca19ff6f1a2745232142b9df53278393afdcf8a2e50cea82e0cd5b865';
const replaced=[
  '  lacrimalEpoch,abdominalEusEpoch,superficialPlantarEpoch]) {',
  '    lacrimalEpoch,abdominalEusEpoch,superficialPlantarEpoch].map(epoch=>[epoch,tree(epoch)])]);',
  '  let ctChanges=0,medianChanges=0,additionalUsChanges=0;',
  "        (ctRow&&tab==='ct')||(medianRow&&tab==='xray')||(additionalUs&&tab==='ultrasound')) {",
  '  assert.equal(currentPreserved,9892);',
  '  assert.equal(currentPreserved+ctChanges+medianChanges+additionalUsChanges,9910,',
  "    'original 9910 current-preservation cells partition into preserved plus eighteen exact introductions');",
  '  assert.equal(currentVsOldPreserved,9800);',
  '  assert.equal(currentVsOldPreserved+ctChanges+medianChanges+additionalUsChanges,9818,',
  "    'original 9818 baseline-preservation cells partition into preserved plus eighteen exact introductions');",
];
function verify(original,candidate){
  assert.equal(sha(original),originalSha,'Exact whole 3df predecessor');
  assert.equal(sha(candidate),currentSha,'Exact reviewed later-six postimage');
  const oldLines=original.toString('utf8').replaceAll('\r\n','\n').split('\n');
  const nextLines=candidate.toString('utf8').replaceAll('\r\n','\n').split('\n');
  for(const line of replaced){
    assert.equal(oldLines.filter(item=>item===line).length,1,'Unique reviewed seam');
    assert.equal(nextLines.filter(item=>item===line).length,0,'Old seam retired');
  }
  const retained=oldLines.filter(line=>!replaced.includes(line));
  let cursor=0;
  for(const line of nextLines)if(cursor<retained.length&&line===retained[cursor])cursor++;
  assert.equal(cursor,retained.length,'Every other original theorem line retained in order');
  const text=candidate.toString('utf8');
  for(const proof of [
    "const checkMriParent='509b01da5d72f33bd774e4a59d63e2406af1f2ff'",
    "const checkMriEpoch='f5052a1906bf9b87e5235bda57d367b1103729db'",
    "const archXrayEpoch='f5097af8493701d64a8e2a2b5797df380f3b348a'",
    "checkMriBefore.bodyLesson(structure,tab)",
    "archXrayBefore.bodyLesson(structure,tab)",
    "assert.equal(predecessor.readiness,'draft'",
    "assert.equal(predecessor.readiness,'pending'",
    'assert.equal(checkMriChanges,4);',
    'assert.equal(archXrayChanges,2);',
    'currentPreserved+ctChanges+medianChanges+additionalUsChanges+',
    'currentVsOldPreserved+ctChanges+medianChanges+additionalUsChanges+',
    'assert.equal(preserved, 9836);',
    '118+18+6',
    'exact current MRI revision',
    'exact current dorsal-arch X-ray lesson',
    'partial source identity refused',
    'tampered teaching refused',
    'clinicalApproval: false',
  ])assert.ok(text.includes(proof),`Required original/later proof: ${proof}`);
}

test('whole 3df theorem is frozen; only ten reviewed lifecycle seams change',()=>{
  verify(readFileSync(originalUrl),inverseCurrentToLaterSix(readFileSync(currentUrl)));
});
test('prior assertions, historical counts and six-cell guards reject mutation',()=>{
  const original=readFileSync(originalUrl),candidate=readFileSync(currentUrl);
  const verifyCurrent=current=>verify(original,inverseCurrentToLaterSix(current));
  const text=candidate.toString('utf8');
  for(const [from,to] of [
    ['assert.equal(changedWorksheets, 56);','assert.equal(changedWorksheets, 55);'],
    ['assert.equal(preserved, 9836);','assert.equal(preserved, 9835);'],
    ['assert.equal(checkMriChanges,4);','assert.equal(checkMriChanges,3);'],
    ['assert.equal(archXrayChanges,2);','assert.equal(archXrayChanges,1);'],
    ['clinicalApproval: false','clinicalApproval: true'],
  ]){
    assert.equal(text.split(from).length,2,`Unique tamper target ${from}`);
    assert.throws(()=>verifyCurrent(Buffer.from(text.replace(from,to))));
  }
  assert.throws(()=>verify(Buffer.concat([original,Buffer.from('\n')]),inverseCurrentToLaterSix(candidate)));
  assert.throws(()=>verifyCurrent(Buffer.from('if(false){\n'+text+'\n}')));
});
