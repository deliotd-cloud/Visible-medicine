import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const evidence=path.resolve(root,'../contract-worker');
fs.mkdirSync(evidence,{recursive:true});
await build({entryPoints:[path.join(root,'lib/fda-shoulder-reference.ts'),path.join(root,'lib/fda-reference-model-loader.ts'),path.join(root,'lib/fda-reference-review.ts')],bundle:true,platform:'node',format:'esm',packages:'bundle',outdir:evidence,entryNames:'[name]',logLevel:'error'});
const [reference,loader,review]=await Promise.all(['fda-shoulder-reference','fda-reference-model-loader','fda-reference-review'].map(name=>import(pathToFileURL(path.join(evidence,name+'.js')).href)));
const {isFdaShoulderReference,assertPinnedFdaCatalogue,canonicalFdaReference,fdaReferenceAssetUrl,fdaReferenceCatalogueSha256,fdaReferenceCanonicalSha256}=reference;
const {inspectFdaReferenceGlb,readFdaReferenceBytes,loadFdaReference}=loader;
const {fdaReferenceReviewMaterial}=review;
const assetDir=path.join(root,'public/models/fda-shoulder-draft');
const raw=fs.readFileSync(path.join(assetDir,'catalog.json'));
const glb=fs.readFileSync(path.join(assetDir,'reference.glb'));
const catalogue=JSON.parse(raw.toString('utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const clone=x=>structuredClone(x);
const sourceHashes=Object.fromEntries(['lib/fda-shoulder-reference.ts','lib/fda-reference-model-loader.ts','lib/fda-reference-review.ts','public/models/fda-shoulder-draft/catalog.json','public/models/fda-shoulder-draft/reference.glb'].map(p=>[p,sha(fs.readFileSync(path.join(root,p)))]));
fs.writeFileSync(path.join(evidence,'source-hashes.json'),JSON.stringify({atlasHead:'d008e1b507bd08177a44cfe12716dae623dda5a4',sourceHashes},null,2)+'\n');

const bytesResponse=(bytes,{status=200,length,redirected=false,chunks=3}={})=>{
 const data=new Uint8Array(bytes);let pos=0;
 const body=new ReadableStream({pull(controller){if(pos>=data.length){controller.close();return;}const end=Math.min(data.length,pos+Math.max(1,Math.ceil(data.length/chunks)));controller.enqueue(data.subarray(pos,end));pos=end;}});
 const response=new Response(body,{status,headers:length===undefined?{}:{'content-length':String(length)}});
 if(redirected)Object.defineProperty(response,'redirected',{value:true});
 return response;
};
const fetchAssets=({catalogBytes=raw,modelBytes=glb,record=[]}={})=>async(url,options)=>{
 record.push({url,credentials:options.credentials,redirect:options.redirect,signal:options.signal});
 assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');
 if(url==='/models/fda-shoulder-draft/catalog.json')return bytesResponse(catalogBytes);
 if(url==='/models/fda-shoulder-draft/reference.glb')return bytesResponse(modelBytes);
 throw new Error('Unapproved network URL '+url);
};
const rejectMutation=async mutate=>{const copy=clone(catalogue);mutate(copy);assert.equal(isFdaShoulderReference(copy),false);await assert.rejects(assertPinnedFdaCatalogue(copy),/pinned draft revision/);};
function mutateGlb(mutator){
 const jsonLength=glb.readUInt32LE(12),binOffset=20+jsonLength;
 const doc=JSON.parse(glb.subarray(20,binOffset).toString('utf8'));
 mutator(doc);
 const json=Buffer.from(JSON.stringify(doc),'utf8'),pad=Buffer.alloc((4-json.length%4)%4,0x20),bin=glb.subarray(binOffset);
 const out=Buffer.alloc(20+json.length+pad.length+bin.length);
 out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
 out.writeUInt32LE(json.length+pad.length,12);out.writeUInt32LE(0x4e4f534a,16);
 json.copy(out,20);pad.copy(out,20+json.length);bin.copy(out,20+json.length+pad.length);
 return out;
}

test('exact raw and canonical pin, six admitted source meshes',async()=>{
 assert.equal(sha(raw),'56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44');
 assert.equal(fdaReferenceCatalogueSha256,sha(raw));
 assert.equal(sha(Buffer.from(canonicalFdaReference(catalogue))),'c31f38ad5b30d02a0df582f45cec17af81780797343449f3511c91007554e553');
 assert.equal(fdaReferenceCanonicalSha256,sha(Buffer.from(canonicalFdaReference(catalogue))));
 assert.equal(sha(glb),'38f96ede01a6cd6467fbcc4cb42eac4b673fe18c2ef54b07731e070c0968a5f6');
 assert.equal(catalogue.bundle.sha256,sha(glb));assert.equal(catalogue.bundle.bytes,glb.length);
 assert.equal(isFdaShoulderReference(catalogue),true);await assertPinnedFdaCatalogue(catalogue);
 assert.deepEqual(catalogue.structures.map(s=>s.sourcePart),['AC_Lig','Hcart','Labrum','CLAVICLE','Humerus','SCAPULA']);
 const doc=inspectFdaReferenceGlb(glb,catalogue);assert.equal(doc.meshes.length,6);
});

test('metadata guard refuses altered source, hold, labels, calibration, side, and URLs',async()=>{
 for(const change of [
  x=>x.status='approved',x=>x.source.sha256='0'.repeat(64),x=>x.source.commit='foreign',
  x=>x.source.publisherReportedSide='left',x=>x.source.publicationURL='https://other.example/',
  x=>x.held=[],x=>x.held[0].sourceNodeIds=[2798,4501],x=>x.held[0].reason='cleared',
  x=>x.structures[0].name='Other ligament',x=>x.structures[0].laterality='right',
  x=>x.structures[0].validation.anatomicalReview=true,x=>x.structures[0].validation.clinicalApproval=true,
  x=>x.display.unitsPerMillimetre=1,x=>x.display.sourceToDisplayColumnMajor[0]=-x.display.sourceToDisplayColumnMajor[0],
  x=>x.bundle.url='https://remote.example/model.glb',
  x=>x.measurementEnabled=true,x=>x.clinicalApproval=true
 ])await rejectMutation(change);
 assert.equal(fdaReferenceAssetUrl(),'/models/fda-shoulder-draft/reference.glb');
 for(const base of ['https://other.example','//other.example','/../escape','/safe?x=1'])assert.throws(()=>fdaReferenceAssetUrl(base),/Invalid same-origin/);
 const altered=clone(catalogue);altered.source.credit+=' ';assert.equal(isFdaShoulderReference(altered),true);
 await assert.rejects(assertPinnedFdaCatalogue(altered),/pinned draft revision/);
 const otherAsset=clone(catalogue);otherAsset.bundle.sha256='0'.repeat(64);assert.equal(isFdaShoulderReference(otherAsset),true);
 await assert.rejects(assertPinnedFdaCatalogue(otherAsset),/pinned draft revision/);
});

test('bounded streaming fetch enforces status, redirect, length, body and abort',async()=>{
 const calls=[];const fetcher=async(u,o)=>{calls.push([u,o]);return bytesResponse(raw,{chunks:5});};
 assert.deepEqual(await readFdaReferenceBytes('/local',raw.length,undefined,fetcher),new Uint8Array(raw));
 assert.equal(calls.length,1);assert.equal(calls[0][1].credentials,'same-origin');assert.equal(calls[0][1].redirect,'error');
 for(const response of [bytesResponse(raw,{status:404}),bytesResponse(raw,{redirected:true})])await assert.rejects(readFdaReferenceBytes('/local',raw.length,undefined,async()=>response),/unavailable/);
 for(const length of [raw.length+1,'1.2','-1'])await assert.rejects(readFdaReferenceBytes('/local',raw.length,undefined,async()=>bytesResponse(raw,{length})),/size limit/);
 await assert.rejects(readFdaReferenceBytes('/local',raw.length-1,undefined,async()=>bytesResponse(raw)),/size limit/);
 await assert.rejects(readFdaReferenceBytes('/local',raw.length,undefined,async()=>new Response(null)),/no response body/);
 const controller=new AbortController();controller.abort();let contacted=false;
 await assert.rejects(readFdaReferenceBytes('/local',raw.length,controller.signal,async()=>{contacted=true;return bytesResponse(raw);}),{name:'AbortError'});assert.equal(contacted,false);
 const later=new AbortController();let emitted=false;
 const aborting=async()=>new Response(new ReadableStream({pull(c){if(!emitted){emitted=true;c.enqueue(new Uint8Array([1]));later.abort();}else c.close();}}));
 await assert.rejects(readFdaReferenceBytes('/local',4,later.signal,aborting),{name:'AbortError'});
});

test('actual loader checks raw checksums and revision with no alternate fetch',async()=>{
 const calls=[];const loaded=await loadFdaReference({expectedRevision:fdaReferenceCatalogueSha256},fetchAssets({record:calls}));
 assert.equal(calls.length,2);assert.equal(loaded.revision,fdaReferenceCatalogueSha256);
 assert.deepEqual(loaded.meshes.map(m=>m.structure.sourcePart),catalogue.structures.map(s=>s.sourcePart));
 for(const {structure,geometry} of loaded.meshes){assert.equal(geometry.getAttribute('position').count,structure.vertices);assert.equal(geometry.index.count,structure.triangles*3);}
 loaded.dispose();loaded.dispose();
 const staleCalls=[];await assert.rejects(loadFdaReference({expectedRevision:'0'.repeat(64)},fetchAssets({record:staleCalls})),/Stale reference revision/);assert.equal(staleCalls.length,0);
 const badCatalog=Buffer.from(raw);badCatalog[0]^=1;const catalogCalls=[];
 await assert.rejects(loadFdaReference({},fetchAssets({catalogBytes:badCatalog,record:catalogCalls})),/catalogue checksum mismatch/);assert.equal(catalogCalls.length,1);
 const badGlb=Buffer.from(glb);badGlb[badGlb.length-1]^=1;const glbCalls=[];
 await assert.rejects(loadFdaReference({},fetchAssets({modelBytes:badGlb,record:glbCalls})),/geometry checksum mismatch/);assert.equal(glbCalls.length,2);
 const shortCalls=[];await assert.rejects(loadFdaReference({},fetchAssets({modelBytes:glb.subarray(0,-1),record:shortCalls})),/geometry checksum mismatch/);assert.equal(shortCalls.length,2);
});

test('GLB inspection refuses external resources, transforms, altered source identities',()=>{
 for(const change of [
  d=>d.buffers[0].uri='https://remote.example/data.bin',d=>d.images=[{uri:'https://remote.example/i.png'}],
  d=>d.extensionsUsed=['KHR_draco_mesh_compression'],d=>d.nodes[0].translation=[1,0,0],
  d=>d.nodes[0].matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  d=>d.nodes[0].children=[1],d=>d.nodes[0].name='foreign',d=>d.meshes[0].primitives[0].mode=1,
  d=>d.asset.extras.status='approved'
 ])assert.throws(()=>inspectFdaReferenceGlb(mutateGlb(change),catalogue),/refused|Unsupported|identity|scope/);
 const broken=Buffer.from(glb);broken.writeUInt32LE(broken.length+4,8);assert.throws(()=>inspectFdaReferenceGlb(broken,catalogue),/header/);
});

test('review revision binds exact renderer and source id without granting approval',async()=>{
 const id=catalogue.structures[0].id,a='a'.repeat(64),b='b'.repeat(64);
 const first=await fdaReferenceReviewMaterial(catalogue,id,a),again=await fdaReferenceReviewMaterial(catalogue,id,a),otherRenderer=await fdaReferenceReviewMaterial(catalogue,id,b),otherStructure=await fdaReferenceReviewMaterial(catalogue,catalogue.structures[1].id,a);
 assert.equal(first.revision,again.revision);assert.notEqual(first.revision,otherRenderer.revision);assert.notEqual(first.revision,otherStructure.revision);
 assert.equal(first.clinicalApproval,false);assert.equal(first.decisionWritingEnabled,false);assert.equal(first.protectedWebsiteQueueIntegrated,false);assert.equal(first.measurementEnabled,false);assert.equal(first.registeredToBodyParts3D,false);
 for(const invalid of ['vm:reference:fda-shoulder-fc9f3e56:Gcart','vm:bodyparts3d:shoulder','foreign',undefined])await assert.rejects(fdaReferenceReviewMaterial(catalogue,invalid,a),/not admitted/);
 for(const invalid of ['0'.repeat(64),'short','A'.repeat(64)])await assert.rejects(fdaReferenceReviewMaterial(catalogue,id,invalid),/renderer source digest/);
 const altered=clone(catalogue);altered.structures[0].name='Other';await assert.rejects(fdaReferenceReviewMaterial(altered,id,a),/pinned draft revision/);
});
