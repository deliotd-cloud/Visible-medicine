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
// Each later source commit is bound to its complete document and exact changed
// identity set. This keeps the old two-colic/neck/renal theorem at its real epoch.
const laterPinEpochs=[
 ['7978478992f54ea68e0f53c3d195c459c7b80068','6c3850d6ef8962aea8ae0ccfd2d8e0db7d6499e8987004f0f9f1fe3cdd6fcac6',22,'243ed0f5c154ded6f367f4d0bff28c11d149e23b69b40d9564cb035dc1dac2ea'],
 ['ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6','70425278fd95274420a95a64b641a7b4e0224c12a287b3776c1986c989876927',6,'76ae2e8cd09ac0dccf173b53c0226b00713ef9b2c1f63d3d8e887cc94b1853ed'],
 ['0327b6360e18b62563265d115df2b779c9397792','01437c7b8990000ffe852ddb5b6df8d3980ca19f4254ce3b12f7f37f9fe46cbc',3,'7d42c2b2ee8f19925c4af8f9d240097ed359fc017e87d1d40b43b5ebda97363d'],
 ['dab0c8ffa6986a57f8456303d47fa675a37055cf','5f2c97ee6482d0ea15e153a7e64557b693e698e5155c61441ae663f7a48288ab',8,'c0da033f8797040ada1d9b96b0ce77967bbf71c776d3fa5839923b49a1a46489'],
 ['be9b53d96c37f1ea973e60f5981ad80db0893177','82a9f435173e27901b3b31fc99d7bbc736fa2ac8573cd8622bf05efc66aabe47',6,'2b9beeacd962a7ff80cfdfdf8ae764df5740eba18559f3eb7a6e1b0acc65b85b'],
 ['5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7','8495b7cfc4df36b22d7043acef36e0fdba1bb5225732eb7d9a33aab19339c2ce',8,'2f93dff4cd03fbae3027dd1446ca435da190298ea20c56c442ffaf3279192bad'],
 ['2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491','9417a35cac5952e1a6d9c4bf8f1b8936f7614f8c942eec7732386ae6ec576ab5',12,'beaed8b57b8658e0cb27ca815330f9f8d210e15d59f0eddd634b30c3514f0beb'],
 ['d143c28fb1e5da200712af6629a375c25d17dad7','a94f6ce86c8ff5f9bc14a356c9d7784fa198b452514592fafbd89eb5b3a4b6af',12,'1b11330ca2fca0cbfeedd649b0227f460adba364f3eb50d6b7279680c2f8e733'],
 ['aa13c067197cad87bd0a9b2da5549bc4b33bfdf7','a3bec06bf44a2c348067829905fcaa029b0e2c1c4a9bf83f9bcb3f2d5f2ad5d8',12,'4b53a671750950700821d83c573c4494e2b0d31ba506f027a54a67766a98f904'],
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
 const current=map(currentBytes),[prior,colicById,neckById,renalById]=documents;
 assert.deepEqual(changed(prior,colicById),colic);
 assert.deepEqual(changed(colicById,neckById),neck);
 assert.deepEqual(changed(neckById,renalById),renal);
 const transitions=[{source:displayPinEpochs[1][0],ids:[...colic]},{source:displayPinEpochs[2][0],ids:[...neck]},{source:displayPinEpochs[3][0],ids:[...renal]}];
 let previous=renalById;
 for(const [commit,digest,count,idsDigest] of laterPinEpochs){
  const source=readGit(commit,file);
  assert.equal(sha(source),digest,'Exact later display-pin bytes: '+commit);
  const next=map(source),ids=changed(previous,next);
  assert.equal(ids.length,count,'Exact later display-pin change count: '+commit);
  assert.equal(sha(JSON.stringify(ids)),idsDigest,'Exact later display-pin identities: '+commit);
  transitions.push({source:commit,ids});previous=next;
 }
 assert.equal(sha(currentBytes),laterPinEpochs.at(-1)[1],'Current pin document must equal the complete declared later source epoch');
 assert.deepEqual(current,previous,'Unrecognized later display-pin changes require a new explicit source-bound history');
 return{colicById,currentById:current,transitions};
}
