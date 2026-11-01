import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sha=value=>createHash('sha256').update(value).digest('hex');
export const source='e32617ef2ed8690472e797d791a061fa3b1985b4';
export const tree='89d5ec3eb886429325d6c8e768960ab73293a5fa';
export const integration='7238e36f74eef2a9dd083d69501e7fd099ac422bde0b0638049ad21d3614224c';
export const predecessor='tests/fixtures/current-atlas-delivery-before-orientation';
export function advanceContract(original){
 const changes=[
  [" assert.equal(CURRENT_ATLAS_REVISION,'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc');",` assert.equal(CURRENT_ATLAS_REVISION,'${source}');`],
  [" assert.equal(pin.sourceTree,'2e742b31600a6da39af99558d07ff6986fec6b9e');",` assert.equal(pin.sourceTree,'${tree}');`],
  ["  'head-neck':'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc',",`  'head-neck':'${source}',`],
  [' assert.equal(sourceFiles,1675);assert.equal(inputs,1908);assert(artifacts>100);',' assert.equal(sourceFiles,1677);assert.equal(inputs,1910);assert(artifacts>100);'],
  [" assert.equal(admitted.source,'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc');assert.equal(admitted.sourceTree,'2e742b31600a6da39af99558d07ff6986fec6b9e');",` assert.equal(admitted.source,'${source}');assert.equal(admitted.sourceTree,'${tree}');`],
  [' assert.equal(admitted.reviewSourceFiles,1675);',' assert.equal(admitted.reviewSourceFiles,1677);'],
  [' assert.equal(review.files.length,1675);assert.equal(binding.inputs.length,1908);',' assert.equal(review.files.length,1677);assert.equal(binding.inputs.length,1910);'],
  [` let preserved=read('tests/current-atlas-delivery.test.mjs').toString().split("\\ntest('focus delivery preserves the entire previous contract'")[0];`,` let preserved=read('${predecessor}.txt').toString().split("\\ntest('focus delivery preserves the entire previous contract'")[0];`],
 ];
 let text=original;
 for(const [before,after]of changes){
  const pattern=new RegExp('^'+before.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\r?$)','gm');
  assert.equal([...text.matchAll(pattern)].length,1,'Current contract seam missing or duplicated: '+before);
  text=text.replace(pattern,()=>after);
 }
 let inverse=text;
 for(const [before,after]of [...changes].reverse()){
  const pattern=new RegExp('^'+after.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\r?$)','gm');
  assert.equal([...inverse.matchAll(pattern)].length,1,'Inverse seam changed');inverse=inverse.replace(pattern,()=>before);
 }
 assert.equal(inverse,original,'Predecessor history changed');return{text,changes};
}
// Called only with the exact successful guarded Review-build result. A source
// manifest alone never establishes that the rebuilt viewer actually exists.
export function requireReviewBuild({result,receipt,manifestBytes}){
 assert(result?.passing===true&&result.supervisor?.code===0&&result.process?.terminalObserved===true&&result.process?.exitCode===0&&result.process?.interrupted===false,'A completed successful guarded Review build is required');
 assert.equal(receipt?.source,source);assert.equal(receipt?.reviewIntegration,integration);
 assert.equal(sha(manifestBytes),receipt?.viewerManifestSha256,'Viewer changed after guarded build');
 const viewer=JSON.parse(manifestBytes);assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,integration);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,63,'Changed artifact count requires explicit contract review');assert.equal(viewer.packages.length,24,'Changed dependency count requires notice audit');
 return viewer;
}
