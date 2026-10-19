// Portable preservation and tamper contract; does not substitute for native feature execution.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

test('elbow original201 lines survive eight explicit tour/player lifecycle seams; tampering is refused',()=>{
 const original=readFileSync(new URL('./fixtures/clinical-review-elbow-arterial-tour-before-lifecycle.ts.raw',import.meta.url));
 const candidate=readFileSync(new URL('./clinical-review-elbow-arterial-tour.test.ts',import.meta.url));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const originalSha='5d14824a266020120ba92957008670d04b167beae5aa591ba3b0555aa853450e';
 const candidateSha='15bb108f73a9eb2719edca3708e7b4ea9844c8f555db4495c8045c83ede40f99';
 assert.equal(sha(original),originalSha,'Byte-exact canonical original');
 const oldLines=original.toString().replaceAll('\r\n','\n').split('\n');
 const replaced=[
  "  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);",
  "  const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);",
  '  assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);',
  '  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,revision,name);',
  "  const legacyTours=api.regionalTours.filter((item:{id:string})=>item.id!=='portal-hepatic-venous-relationships');",
  '  assert.equal(api.regionalTours.length,48);',
  '  assert.equal(api.regionalTours.reduce((count:number,item:{steps:unknown[]})=>count+item.steps.length,0),290);',
  "  const player=readFileSync('atlas-review/app/regional-guided-learning.tsx','utf8');",
 ];
 for(const line of replaced)assert.equal(oldLines.filter(row=>row===line).length,1,
  'Unique original lifecycle seam: '+line);
 const retained=oldLines.filter(line=>!replaced.includes(line));
 assert.equal(retained.length,201);
 function verify(bytes){
  assert.equal(sha(bytes),candidateSha,'Exact reviewed candidate');
  const text=bytes.toString();const lines=text.replaceAll('\r\n','\n').split('\n');
  for(const line of replaced)assert.equal(lines.includes(line),false,'Stale seam replaced: '+line);
  let cursor=0;for(const line of lines)if(cursor<retained.length&&line===retained[cursor])cursor++;
  assert.equal(cursor,retained.length,'Every other original line remains in order');
  for(const proof of [
   'admitPreservedClinicalReview({revision,sourceHashes:',
   "proveAddition('baseline','elbow','right-elbow-arterial-pairs',47)",
   "proveAddition('elbow','portal','portal-hepatic-venous-relationships',48)",
   "proveAddition('portal','cervical','cervical-whole-discs-orientation',49)",
   "proveAddition('cervical','medial','right-medial-thigh-orientation',50)",
   "proveAddition('venous','calf','right-posterior-calf-achilles-orientation',51)",
   'all six earlier venous stop identities retain order',
   'every earlier tour and its complete step/camera data unchanged',
   'all 51 current Review tours and their exact source stops',
   'rate-aware player survives from genuine speed introduction',
   'current rate-aware and legacy camera branches both keep reduced motion at zero',
   'current authored continuous policy is exact; runtime speed is not a changed teaching approval',
   'assert.equal((await save(forged)).status,422);',
   'assert.equal(stale.status,409);assert.equal(db.reads.length,0',
  ])assert.ok(text.includes(proof),'Required preserved/lifecycle proof: '+proof);
 }
 verify(candidate);
 for(const [from,to] of [
  ['assert.equal(legacyTours.length,47);','assert.equal(legacyTours.length,46);'],
  ['assert.equal((await save(forged)).status,422);','assert.equal((await save(forged)).status,200);'],
  ["proveAddition('venous','calf','right-posterior-calf-achilles-orientation',51)",
   "proveAddition('venous','calf','right-posterior-calf-achilles-orientation',50)"],
  ['assert.equal(playback.guidedSweepDuration(rate),sweep);','assert.equal(playback.guidedSweepDuration(rate),1800);'],
  ]){
  assert.equal(candidate.toString().split(from).length,2,'Unique tamper point: '+from);
  assert.throws(()=>verify(Buffer.from(candidate.toString().replace(from,to))));
 }
 assert.throws(()=>verify(Buffer.from('if(false){\n'+candidate+'\n}')));
 console.log(JSON.stringify({schema:'vm-elbow-tour-current-preservation/1',
  originalSha256:originalSha,candidateSha256:candidateSha,
  originalLines:oldLines.length,retainedLines:retained.length,replacedLines:replaced.length,
  historicalPortalTours:48,currentTours:51,nativeTestExecuted:false}));
});
