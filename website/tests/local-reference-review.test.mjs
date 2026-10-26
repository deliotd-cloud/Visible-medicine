import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLocalReferencePacket,loadLocalReferencePacket} from '../lib/local-reference-review.ts';

const encode=value=>new TextEncoder().encode(JSON.stringify(value));
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const buffer=bytes=>Uint8Array.from(bytes).buffer;
// Nonmedical synthetic marker stream: SOF declares 2×2; browser decoder is stubbed in loader tests.
const jpeg=Uint8Array.from([255,216,255,192,0,11,8,0,2,0,2,1,1,17,0,255,218,0,8,1,1,0,0,63,0,1,2,3,4,255,217,...Array(80).fill(0)]);
// Put EOI at the actual end without introducing a real image or copied source pixels.
jpeg.set([255,217],jpeg.length-2);
const hex='a'.repeat(64);
async function fixture(change=()=>{}){
 const imageSha=await digest(jpeg),figure={figure:1,file:'sample.jpg',sha256:imageSha,bytes:jpeg.length,widthPixels:2,heightPixels:2,sourceUrl:'https://example.invalid/figure',id:'synthetic:figure-1',title:'Synthetic grid',draftPrompt:'Inspect an abstract grid.',extent:'Synthetic square.',changes:'None.',rightsHold:null,clinicalReview:'not-reviewed',privacyReview:'not-reviewed',publication:'not-cleared',patientLaterality:null,fmaId:null,atlasStructureId:null,mask:null,imageTo3DTransform:null};
 const packet={schema:'vm-published-ultrasound-review-packet/1',sourceIntakeSha256:hex,article:{title:'Synthetic article',author:'Test author',year:2026,journal:'Test journal',doi:'10.0000/synthetic',url:'https://example.invalid/article',htmlSha256:hex},license:{declared:'Test licence pending review',url:'https://example.invalid/licence',copyright:'Test copyright',assetSpecificReviewComplete:false,privacyClearance:false,clinicalApproval:false,publicationClearance:false,notice:'Synthetic test only.'},figures:[figure],mainVisualScreen:{all5OriginalsViewedAtNativeResolution:false,visiblePersonalNameDateOrIdentifierObserved:false,meaning:'Limited synthetic screen.',figure4:'Direction requires review.',figure6:'Schematic origin requires review.'},reviewInboxImported:false,normalLearnerInventoryImported:false,readinessEnabled:false,patientSpaceRegistration:false,decisionWrites:false};
 change(packet);packet.revisionSha256=await digest(encode(packet));const bytes=encode(packet);
 return {packet,bytes,packetSha256:await digest(bytes)};
}
function localFile(name,bytes,folder='held'){return {name,webkitRelativePath:`${folder}/${name}`,size:bytes.length,arrayBuffer:async()=>buffer(bytes)}}
test('synthetic held packet validates exact revision and optional byte/source pins',async()=>{
 const x=await fixture();const result=await parseLocalReferencePacket(buffer(x.bytes),{expectedRevision:x.packet.revisionSha256,expectedPacketSha256:x.packetSha256});
 assert.equal(result.packet.figures[0].title,'Synthetic grid');assert.equal(result.packetSha256,x.packetSha256);
 await assert.rejects(parseLocalReferencePacket(buffer(x.bytes),{expectedRevision:hex}),/expected source/);
 await assert.rejects(parseLocalReferencePacket(buffer(x.bytes),{expectedPacketSha256:hex}),/expected source/);
 const altered=new TextEncoder().encode(new TextDecoder().decode(x.bytes).replace('Synthetic article','Altered article'));
 await assert.rejects(parseLocalReferencePacket(buffer(altered)),/revision does not match/);
});
test('all held gates, null mappings, Figure 6 hold and unknown fields refuse',async()=>{
 for(const mutate of [p=>{p.license.privacyClearance=true},p=>{p.readinessEnabled=true},p=>{p.figures[0].clinicalReview='approved'},p=>{p.figures[0].fmaId='FMA:1'},p=>{p.figures[0].newApprovalFlag=true},p=>{p.newGate=false},p=>{p.figures[0].figure=6}]){
  const x=await fixture(mutate);await assert.rejects(parseLocalReferencePacket(buffer(x.bytes)));
 }
 const x=await fixture(p=>{p.figures[0].figure=6;p.figures[0].rightsHold='Synthetic schematic origin unresolved.'});
 assert.equal((await parseLocalReferencePacket(buffer(x.bytes))).packet.figures[0].figure,6);
});
test('missing, duplicate, traversing and extra folder entries refuse',async()=>{
 const x=await fixture(),manifest=localFile('REVIEW_PACKET.json',x.bytes),image=localFile('sample.jpg',jpeg);
 await assert.rejects(loadLocalReferencePacket([manifest]),/file-count/);
 await assert.rejects(loadLocalReferencePacket([manifest,image,localFile('SAMPLE.jpg',jpeg)]),/duplicate/);
 await assert.rejects(loadLocalReferencePacket([manifest,{...image,webkitRelativePath:'held/../sample.jpg'}]),/directly/);
 await assert.rejects(loadLocalReferencePacket([manifest,image,localFile('extra.jpg',jpeg)]),/extra figures/);
});
test('exact JPEG bytes/dimensions and aborted loads refuse; successful URLs dispose once',async()=>{
 const x=await fixture(),manifest=localFile('REVIEW_PACKET.json',x.bytes),image=localFile('sample.jpg',jpeg);
 const oldBitmap=globalThis.createImageBitmap,oldURL=globalThis.URL;
 let created=0,revoked=0,closed=0;
 globalThis.createImageBitmap=async()=>({width:2,height:2,close(){closed++}});
 globalThis.URL={...oldURL,createObjectURL(){return `blob:synthetic-${++created}`},revokeObjectURL(){revoked++}};
 try{
  const valid=await loadLocalReferencePacket([manifest,image],{expectedRevision:x.packet.revisionSha256,expectedPacketSha256:x.packetSha256});
  assert.equal(valid.images['sample.jpg'],'blob:synthetic-1');assert.equal(closed,1);valid.dispose();valid.dispose();assert.equal(revoked,1);
  const changed=Uint8Array.from(jpeg);changed[25]^=1;
  await assert.rejects(loadLocalReferencePacket([manifest,localFile('sample.jpg',changed)]),/SHA-256 differs/);
  const wrongDims=Uint8Array.from(jpeg);wrongDims[9]=3;
  await assert.rejects(loadLocalReferencePacket([manifest,localFile('sample.jpg',wrongDims)]),/dimensions differ/);
  const controller=new AbortController();controller.abort();await assert.rejects(loadLocalReferencePacket([manifest,image],{signal:controller.signal}),/cancelled/);
  assert.equal(created,1);assert.equal(revoked,1);
 }finally{globalThis.createImageBitmap=oldBitmap;globalThis.URL=oldURL}
});
test('abort after one verified JPEG revokes its partial blob URL',async()=>{
 const x=await fixture(p=>p.figures.push({...p.figures[0],figure:2,file:'sample2.jpg',id:'synthetic:figure-2'}));
 const controller=new AbortController(),manifest=localFile('REVIEW_PACKET.json',x.bytes),first=localFile('sample.jpg',jpeg);
 const second={...localFile('sample2.jpg',jpeg),async arrayBuffer(){controller.abort();return buffer(jpeg)}};
 const oldBitmap=globalThis.createImageBitmap,oldURL=globalThis.URL;let created=0,revoked=0;
 globalThis.createImageBitmap=async()=>({width:2,height:2,close(){}});
 globalThis.URL={...oldURL,createObjectURL(){created++;return `blob:partial-${created}`},revokeObjectURL(){revoked++}};
 try{await assert.rejects(loadLocalReferencePacket([manifest,first,second],{signal:controller.signal}),/cancelled/);assert.equal(created,1);assert.equal(revoked,1)}
 finally{globalThis.createImageBitmap=oldBitmap;globalThis.URL=oldURL}
});
test('exact eight-file review folder accepts two unread companions and rejects unknown extras',async()=>{
 const x=await fixture(p=>{for(let n=2;n<=5;n++)p.figures.push({...p.figures[0],figure:n,file:`sample${n}.jpg`,id:`synthetic:figure-${n}`})});
 const files=[localFile('REVIEW_PACKET.json',x.bytes),...x.packet.figures.map(f=>localFile(f.file,jpeg)),
  {name:'review.html',webkitRelativePath:'held/review.html',size:17,async arrayBuffer(){throw new Error('HTML must never be read')}},
  {name:'THIRD_PARTY_NOTICES.txt',webkitRelativePath:'held/THIRD_PARTY_NOTICES.txt',size:18,async arrayBuffer(){throw new Error('notices must never be read')}}];
 const oldBitmap=globalThis.createImageBitmap,oldURL=globalThis.URL;let created=0,revoked=0;
 globalThis.createImageBitmap=async()=>({width:2,height:2,close(){}});
 globalThis.URL={...oldURL,createObjectURL(){return `blob:folder-${++created}`},revokeObjectURL(){revoked++}};
 try{const loaded=await loadLocalReferencePacket(files);assert.equal(Object.keys(loaded.images).length,5);loaded.dispose();assert.equal(created,5);assert.equal(revoked,5);
  await assert.rejects(loadLocalReferencePacket([...files,{...files[6],name:'REVIEW.html',webkitRelativePath:'held/REVIEW.html'}]),/duplicate|unexpected/);
  await assert.rejects(loadLocalReferencePacket([...files,localFile('other.txt',jpeg)]),/unexpected/);
  await assert.rejects(loadLocalReferencePacket([...files.slice(0,7),{...files[7],webkitRelativePath:'held/nested/THIRD_PARTY_NOTICES.txt'}]),/directly/);
 }finally{globalThis.createImageBitmap=oldBitmap;globalThis.URL=oldURL}
});
test('duplicate JSON keys refuse at root and nested levels, including escaped equivalents',async()=>{
 const x=await fixture(),original=new TextDecoder().decode(x.bytes);
 for(const text of [
  original.replace('"readinessEnabled":false','"readinessEnabled":true,"readinessEnabled":false'),
  original.replace('"clinicalApproval":false','"clinicalApproval":true,"clinical\\u0041pproval":false'),
  original.replace('"clinicalReview":"not-reviewed"','"clinicalReview":"approved","clinicalReview":"not-reviewed"'),
 ])await assert.rejects(parseLocalReferencePacket(buffer(new TextEncoder().encode(text))),/duplicate JSON object key/);
 const safe=await fixture(p=>{p.article.title='Synthetic { grid, [array] } and "quotes"';p.figures[0].draftPrompt='Review \\"literal\\" braces {,} and [items,] as text.'});
 assert.equal((await parseLocalReferencePacket(buffer(safe.bytes))).packet.article.title,'Synthetic { grid, [array] } and "quotes"');
});
