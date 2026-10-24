// Test-only immutable display history. Never author pins or read decisions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const file='content/body-review-display-pins.json';
export const displayPinEpochs=[
 ['190a63238eadcf906abe89dcbb6a67c88afe70b9','37c64990ca92b3c5c2eaef7676812661deb5cc2f7be4353d3e7d665928685905'],
 ['6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','64663645ea5ae88758c25496b82466c12499abecd2d8abd8bc22747204190a84'],
 ['da84654113bdd27dbfabd6879d82740c8407f4db','bfc27ae558b0c1c340b71d7448d9fe02bbd82215767b32b3726b2ef890ed372d'],
 ['4f20ae0b62b9e0dab5936b430575a983dcdd934e','9638e05158be50e2e6a9b93bef2147e0efe241f0fac571f6282e83dec9d58da8'],
];
const colic=[
 'vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery',
 'vm:anatomy:body:abdomen:right:vessel:right-colic-artery',
];
const neck=[
 'vm:anatomy:body:head-neck:midline:bone:hyoid-bone',
 'vm:anatomy:body:head-neck:midline:cartilage:cricoid-cartilage',
 'vm:anatomy:body:head-neck:unpaired:organ:epiglottis',
];
const renal=[
 'vm:anatomy:body:abdomen:left:organ:left-kidney',
 'vm:anatomy:body:abdomen:left:vessel:left-renal-artery',
 'vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta',
 'vm:anatomy:body:abdomen:right:organ:right-kidney',
 'vm:anatomy:body:abdomen:right:vessel:right-renal-artery',
];
const map=bytes=>{const document=JSON.parse(bytes),rows=document.pins;assert.equal(rows.length,1104);const result=new Map(rows.map(r=>{assert.equal(typeof r.structureId,'string');assert.match(r.sha256,/^[a-f0-9]{64}$/);return[r.structureId,r.sha256];}));assert.equal(result.size,1104);return result;};
const changed=(a,b)=>{assert.deepEqual(new Set(a.keys()),new Set(b.keys()));return[...b].filter(([id,hash])=>hash!==a.get(id)).map(([id])=>id).sort();};

export function exactDisplayPinHistory({readGit,revision,currentBytes}){
 assert.equal(typeof readGit,'function');assert.match(revision,/^[a-f0-9]{40}$/);
 const documents=displayPinEpochs.map(([commit,digest])=>{const bytes=readGit(commit,file);assert.equal(sha(bytes),digest,'Exact historical display-pin bytes: '+commit);return map(bytes);});
 assert.equal(sha(currentBytes),sha(readGit(revision,file)),'Current imported pins must match their exact committed source');
 assert.equal(sha(currentBytes),displayPinEpochs[3][1],'Current pin document must be the complete declared renal source epoch; unknown fields, ordering or revisions are not admitted');
 const current=map(currentBytes),[prior,colicById,neckById,renalById]=documents;
 assert.deepEqual(changed(prior,colicById),colic);
 assert.deepEqual(changed(colicById,neckById),neck);
 assert.deepEqual(changed(neckById,renalById),renal);
 assert.deepEqual(current,renalById,'Unrecognized later display-pin changes require a new explicit source-bound history, not a widened allowance');
 assert.deepEqual(changed(prior,current),[...colic,...neck,...renal].sort());
 return{colicById,currentById:current,transitions:[{source:displayPinEpochs[1][0],ids:[...colic]},{source:displayPinEpochs[2][0],ids:[...neck]},{source:displayPinEpochs[3][0],ids:[...renal]}]};
}
