import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sourceHunks} from './head-tools-wider-consumer-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const receiptFile='F:/VisibleMedicine/staging/20261024-head-tools-proof/SOURCE_BOUND.json';
const bytes=readFileSync(receiptFile);
assert.equal(sha(bytes),'1071697c3bd7da15fa7b3daa563f4d55ce3d9b4ae1854d9eb36fe1790a6492e0');
const receipt=JSON.parse(bytes),rows=new Map(receipt.sourceRows.map(r=>[r.path,r]));
export const headFeatureRoles={
 'colic-adapter-inverse.test.mjs':{
  before:'cfcaa8e253a9699aba33383c13c43d718ad17aa62534583ed9ba31208fcdd567',
  after:'6926164ef11cbd21c154a85f2f7f14c81dfb1b79a60f4c1b32d31f509107ce54',
  hunks:['ea42bdbac88dc2998a70b1c9c4e6f8da840dd87bbc27ef0fb91a1d466ff6c416','c7440c5c6fac47ec95b63aba9a796baf9613fc0b30c3fbb49afcf1c2fcc269ce'],
 },
 'desktop-learning-row-history.test.mjs':{
  before:'bf0374b9a54789d6a8c50df44050350b274fb53d111acd2c47ee5b2d5b5fe6c5',
  after:'62ea0da6d0195750d1faaf0789a305204133e6ad2f088dbc25ff363fc1a645f8',
  hunks:['49cc380472c5e9633acd21f47bcb9e8582d86ae4b42b30af6ad9914df696a0e1','b8e247b2b5c4b5f8e2b8c8840da62d348eee144b961540838234ba2239ddb6a0','201ec8fb6acc15dd241a972ac3f95f01220413ffaef2b5612f27ad55beb02930'],
 },
 'drawable-epoch-current-admission.test.mjs':{
  before:'522d21d973f0e54edcf4936e2f544d6d032a7147267edb301d389edab33bf388',
  after:'0308f5bf0df4d4291c7015bbb6bb94562effc0e0d4265b83fbd84d936dc38879',
  hunks:['f988d9ff00b92e7802a866cca4b5c0ae153b5158eb43e063ef23cae32c918f2c','91389541de0125026d2058d7b8408f9dd15472304702a77b1fb44838795114a1','4f3ce96980a83b8728115bc04839ae46a8129fd37a5a82754f72b606b24086f1','f5fcd8135e73539d89735e4644f2deff1f91bc64e3d043fa5edbc0e00aaea75f','623a9cce3573901082c7623bee4863b0e4ce47dc65b4e40caca8d4b1e8fb78fa','25fc71d7863e7071e18a4d69ee29aca04939e6559614b795589d988bbafc62d2'],
 },
 'head-manual-recovery-54-to-55-closed.test.mjs':{
  before:'e60a4d22254e3af6da0394822cee26acc52fa8373c67c634400b36f74bf96f9a',
  after:'3f8c85040f3d32037e554e93c9f630d81f3e82420978f9467765a887ee69e0c8',
  hunks:['955b82f001fa25ff410100cacc6cfd2d362f901b70c5e16249119f3c8f5315d8','a25cf5fa2932675029290a9647dd5319880d8f87f8e40691ad7376b4259247cb','30cbbe8b60b179ee708b6f3fa35d0ecd12089933516044fc46b17a10dbec0e8e','bd3a4dbd588359946990fa2bf25a19c4cb7ef14c13e9cabd3a2c29c141870568'],
 },
 'head-native-history-current-transition.test.mjs':{
  before:'6280d5d8c8bd42447827a29f256acb5e718acd07effb549e9226ddc4b8efd8b4',
  after:'c03b67d158fb103a4a8b6f56c91217be08b793c21818a5ef5423f35067ddcdbd',
  hunks:['ed87605f569b44a79450dd4a43df8bea218696418d48c5d5e903d8145b42142e','884179cb7672956a59bf6b2cf0bbcbd1e5571544d99e097069efebb235c848c8','3c2bb4c069e79ac3dcc993a1eb95c90915ff0772e3e1cd01090aa0225685c782'],
 },
};
export function readBeforeHeadFeatureSource(name){
 const role=headFeatureRoles[name];assert(role,'Only five named historical feature/adapter roots');
 const row=rows.get('tests/'+name);assert.equal(row?.sha256,role.before);
 const bytes=readFileSync(receipt.website+'/tests/'+name);assert.equal(sha(bytes),role.before);return bytes;
}
export function restoreBeforeHeadFeatureRepair(name,actualBytes,priorBytes=readBeforeHeadFeatureSource(name)){
 const role=headFeatureRoles[name];assert(role,'Only five named feature/adapter repairs');
 assert.equal(sha(priorBytes),role.before);assert.equal(sha(actualBytes),role.after);
 const before=priorBytes.toString('utf8'),after=actualBytes.toString('utf8');
 assert.deepEqual(Buffer.from(before),priorBytes);assert.deepEqual(Buffer.from(after),actualBytes);
 const hunks=sourceHunks(before,after);assert.deepEqual(hunks.map(h=>sha(JSON.stringify(h))),role.hunks);
 const reverse=after.split('\n'),forward=before.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);
  reverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(reverse.join('\n'),before);assert.equal(forward.join('\n'),after);
 return Buffer.from(reverse.join('\n'));
}
export function assertUnchangedHeadFeatureParent(path,actualBytes){
 const row=rows.get(path);assert(row);assert.equal(sha(actualBytes),row.sha256,path);
}
