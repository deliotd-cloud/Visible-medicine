import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

// The later hamstring/coccygeus witness is an exact successor of the original
// hand adapter input. Restore that whole input before the unchanged tour inverse.
function restoreHandLaterSuccessor(bytes){
 assert.equal(sha(bytes),'6d17f5183b6fa179a4ceafdbb61e33cff8561aa5e96aa61b7935b011d7ab5953',
  'Exact later hand arterial consumer');
 let source=bytes.toString('utf8');assert.deepEqual(Buffer.from(source),bytes,'Lossless hand successor source');
 const eol=source.includes('\r\n')?'\r\n':'\n';
 const once=(after,before)=>{
  after=after.replaceAll('\n',eol);before=before.replaceAll('\n',eol);
  assert.equal(source.split(after).length,2,'One exact later hand source seam');
  source=source.replace(after,before);
 };
 once("const hamstringSource='5e75b9ce7e46fed291748108edd7565c97dee101';\n",'');
 once('const [previous,live,portal,lowerVenousV2,hamstring,current]=await Promise.all([',
  'const [previous,live,portal,lowerVenousV2,current]=await Promise.all([');
 once("  exactSourceHistoryApi(lowerVenousV2Source,'review-security'),\n  exactSourceHistoryApi(hamstringSource,'review-security'),currentApi()]);",
  "  exactSourceHistoryApi(lowerVenousV2Source,'review-security'),currentApi()]);");
 once('assert.deepEqual(hamstring.regionalTours.slice(51).map((tour:any)=>tour.id),[',
  'assert.deepEqual(current.regionalTours.slice(51).map((tour:any)=>tour.id),[');
 once('assert.equal(hamstring.regionalTours.length,53);','assert.equal(current.regionalTours.length,53);');
 once('assert.equal(new Set(hamstring.regionalTours.map((tour:any)=>tour.id)).size,53);',
  'assert.equal(new Set(current.regionalTours.map((tour:any)=>tour.id)).size,53);');
 once('assert.equal(hamstring.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),317);',
  'assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),317);');
 once(" assert.deepEqual(current.regionalTours.slice(0,53),hamstring.regionalTours,\n   'All 53 historical hamstring tours remain exact and ordered');\n",'');
 once(" assert.deepEqual(current.regionalTours.slice(53).map((tour:any)=>[tour.id,tour.revision,tour.steps.length]),[\n   ['coccygeus-pelvic-landmarks','coccygeus-pelvic-landmarks-20261027-r1',4],\n   ['right-knee-quadriceps-to-tibia','right-quadriceps-20261027-r1',6]]);\n",'');
 once(' assert.equal(current.regionalTours.length,55);\n','');
 once(' assert.equal(new Set(current.regionalTours.map((tour:any)=>tour.id)).size,55);\n','');
 once(' assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),327);\n','');
 const restored=Buffer.from(source);
 assert.equal(sha(restored),'57e5b84e74f7c65df0d942a220ad8985dabc532b07c24f74cce1a696ba636594',
  'Complete preceding hand adapter input restored');
 return restored;
}

export function restoreHandCurrentRole(bytes){
 if(sha(bytes)==='6d17f5183b6fa179a4ceafdbb61e33cff8561aa5e96aa61b7935b011d7ab5953')
  bytes=restoreHandLaterSuccessor(bytes);
 assert.equal(sha(bytes),'57e5b84e74f7c65df0d942a220ad8985dabc532b07c24f74cce1a696ba636594',
  'Exact current hand arterial consumer');
 let source=bytes.toString();const eol=source.includes('\r\n')?'\r\n':'\n';
 const once=(after,before)=>{
  after=after.replaceAll('\n',eol);before=before.replaceAll('\n',eol);
  assert.equal(source.split(after).length,2,'One exact hand tour-source seam');
  source=source.replace(after,before);
 };
 once('current.regionalTours.slice(48,51).map','current.regionalTours.slice(48).map');
 once(" assert.deepEqual(current.regionalTours.slice(51).map((tour:any)=>tour.id),[\n  'right-hamstring-orientation','left-hamstring-orientation']);\n",'');
 once('assert.equal(current.regionalTours.length,53);','assert.equal(current.regionalTours.length,51);');
 once('assert.equal(new Set(current.regionalTours.map((tour:any)=>tour.id)).size,53);',
  'assert.equal(new Set(current.regionalTours.map((tour:any)=>tour.id)).size,51);');
 once('assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),317);',
  'assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),309);');
 const restored=Buffer.from(source);
 assert.equal(sha(restored),'7f2ac953efdd39445c376a7c68c2a15b0c9dd121e33864ba25fb5bb591793a4f',
  'Complete reviewed renal-era hand consumer restored');
 return restored;
}
