import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const originalUrl=new URL('./fixtures/atlas-spinal-muscle-xray-before-lifecycle.mjs.raw',import.meta.url);
const currentUrl=new URL('./atlas-spinal-muscle-xray.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldSha='8280e9d6e879906ee8e206caa02acdd0718d3fb06e36c1ba77aae1a179b4f7e5';
const currentSha='3df0513e9d5889434f195915e26d66680e966ee31d5209e6d43d6dbb0596bedf';
const replaced=[
 'for (const epoch of [ultrasoundEpoch,footEpoch,evidenceEpoch,pharyngealEpoch]) {',
 '  ...[ultrasoundEpoch,footEpoch,evidenceEpoch,pharyngealEpoch].map(epoch=>[epoch,tree(epoch)])]);',
 '    ...footSelected.keys(),...evidenceSelected.keys(),...mriSelected.keys()]).size,118,',
 "    'protected historical and later pin sets do not overlap');",
 "        (footRow&&tab==='xray')||(evidenceRow&&tab===evidenceRow.tab)||(mriRow&&tab==='mri')) {",
 '  assert.equal(currentPreserved,9910);',
 '  assert.equal(currentVsOldPreserved,9818);',
 '    footChanges,evidenceChanges,mriChanges,currentVsOldPreserved,',
];
function verify(original,candidate){
 assert.equal(sha(original),oldSha,'Byte-exact original before any normalization');
 assert.equal(sha(candidate),currentSha,'Exact reviewed candidate, including all new proof blocks');
 const oldLines=original.toString().replaceAll('\r\n','\n').split('\n');
 const nextLines=candidate.toString().replaceAll('\r\n','\n').split('\n');
 for(const line of replaced){assert.equal(oldLines.filter(item=>item===line).length,1);assert.equal(nextLines.filter(item=>item===line).length,0);}
 const retained=oldLines.filter(line=>!replaced.includes(line));let cursor=0;
 for(const line of nextLines)if(cursor<retained.length&&line===retained[cursor])cursor++;
 assert.equal(cursor,retained.length,'Every other original assertion line retained in order');
 for(const proof of ['const ctEpoch=','const medianEpoch=','ctTransition.changedPlacements,4','medianPins.entries.length,2','ctSelected.keys(),...medianSelected.keys()','currentPreserved+ctChanges+medianChanges+additionalUsChanges,9910','currentVsOldPreserved+ctChanges+medianChanges+additionalUsChanges,9818','additionalUsSelected.size,12','new Set(introducedCells).size,18','new Set(protectedCells).size,118','currentPreserved,9892','currentVsOldPreserved,9800','partial source identity refused','tampered teaching refused','exact introduced teaching emitted'])assert(candidate.toString().includes(proof),proof);
}
test('the original spinal theorem is frozen and only eight source-proven lifecycle seams change',()=>{
 verify(readFileSync(originalUrl),readFileSync(currentUrl));
});
test('altered old assertions, historical totals or added bypass blocks cannot enter the seam',()=>{
 const original=readFileSync(originalUrl),candidate=readFileSync(currentUrl),text=candidate.toString();
 for(const [from,to] of [['assert.equal(changedWorksheets, 56);','assert.equal(changedWorksheets, 55);'],['currentPreserved+ctChanges+medianChanges+additionalUsChanges,9910','currentPreserved+ctChanges+medianChanges+additionalUsChanges,9904'],['additionalUsSelected.size,12','additionalUsSelected.size,11'],['tampered teaching refused','tampered teaching accepted']]){
  assert.equal(text.split(from).length,2,from);assert.throws(()=>verify(original,Buffer.from(text.replace(from,to))));
 }
 assert.throws(()=>verify(Buffer.concat([original,Buffer.from('\n')]),candidate));
 assert.throws(()=>verify(original,Buffer.from('if(false){\n'+text+'\n}')));
});
