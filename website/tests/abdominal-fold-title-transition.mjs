import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const historicalSha='884980bc5090348fc0c78a081f026f4b9923e3458171bce2499323eceab1df0d';
export const currentSha='973dfb99c8c8789d8437346d097502d69f096cc52fa6c109533b2a46624fbe66';
const titleChanges=[
 ["title: 'Transverse mesocolon · Ultrasound and EUS',","title: 'Ultrasound and EUS',"],
 ["title: 'Mesoappendix · Ultrasound',","title: 'Ultrasound',"],
];

// The previous source remains a complete historical witness. Only these two
// recorded display-title lines may differ in the current source.
export function verifyAbdominalFoldTitleTransition(historicalBytes,currentBytes){
 assert.equal(sha(historicalBytes),historicalSha,'Exact 9f source bytes');
 assert.equal(sha(currentBytes),currentSha,'Exact current title source bytes');
 let projected=new TextDecoder('utf-8',{fatal:true}).decode(historicalBytes);
 for(const [before,after] of titleChanges){
  assert.equal(projected.split(before).length,2,'Unique historical title line');
  assert.equal(projected.split(after).length,1,'New title cannot pre-exist in historical source');
  projected=projected.replace(before,after);
 }
 assert.deepEqual(Buffer.from(projected),currentBytes,'Only two declared title lines changed');
 return currentSha;
}
