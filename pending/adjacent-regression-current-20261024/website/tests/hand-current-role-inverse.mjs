import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function restoreHandCurrentRole(bytes){
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
