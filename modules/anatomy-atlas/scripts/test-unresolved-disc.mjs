import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,mkdtemp,copyFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {request} from 'node:http';
import {discSourceReviewReport,discSourcePins,discHash,verifiedDiscShape} from './disc-source-review-report.mjs';
import {discReviewPacket} from './disc-source-review-packet.mjs';
import {discReviewServer} from './disc-source-review-server.mjs';

test('actual unresolved source report reproduces exact geometry/context without level assignment or admission',async()=>{
 const {report,meshes}=await discSourceReviewReport();
 assert.equal((await readFile('docs/unresolved-disc-source-review.json','utf8')).replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n');
 assert.equal(report.levelAssigned,false);assert.equal(report.admissions,0);assert.equal(report.clinicalValidation,false);
 assert.equal(report.crossTree.bytesIdentical,false);assert.equal(report.crossTree.orderedGeometryIdentical,true);assert.equal(report.crossTree.exactSharedTriangles,3476);
 assert.equal(report.meshes.filter(m=>m.role==='candidate').length,2);assert.equal(report.meshes.filter(m=>m.role==='context').length,6);
 for(const m of report.meshes.filter(m=>m.role==='candidate')){assert.equal(m.vertices,4131);assert.equal(m.triangles,3476);assert.deepEqual(m.bounds,{min:[-21.7746,-105.126,1061.5],max:[20.4661,-65.797,1078.89]});}
 for(const direction of ['isaToPartof','partofToIsa'])assert(report.crossTree[direction].vertices.maxMm<1e-10);
 assert.equal(report.contextDistances.length,6);for(const row of report.contextDistances){assert.equal(row.diagnosticOnly,true);assert.equal(row.fromCandidates.length,2);for(const samples of row.fromCandidates){assert(samples.vertices.samples>0);assert.equal(samples.areaWeightedTriangleCentroids.samples,3476);}}
 const packet=discReviewPacket(report,meshes);assert.equal(packet.reportSha256,discHash(JSON.stringify(report,null,2)+'\n'));assert.equal(packet.levelAssigned,false);
 assert.deepEqual(packet,JSON.parse(await readFile('../work/unresolved-disc-preview-20261002/scene.json','utf8')),'Generated scene changed from verified source packet');
 const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));assert.equal(catalog.structures.length,1022);assert(!catalog.structures.some(s=>s.sources.some(f=>f.file==='FJ3211')));
 for(const m of meshes)assert.deepEqual(packet.meshes.find(p=>p.key===m.key).vertices,m.shape.vertices);
});

test('original archive hash, size and CRC gates refuse source substitution',async()=>{
 const pin=discSourcePins[1],bytes=await readFile('../work/bodyparts3d/partof/FJ3211.obj'),inventory=JSON.parse(await readFile('content/source-inventory.json','utf8')),asset=inventory.assets.find(a=>a.tree===pin.tree&&a.file===pin.file);
 assert(verifiedDiscShape(bytes,pin,asset).faces.length>0);
 assert.throws(()=>verifiedDiscShape(Buffer.concat([bytes,Buffer.from(' ')]),pin,asset),/Source size/);
 const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>verifiedDiscShape(changed,pin,asset),/Source hash/);
 assert.throws(()=>verifiedDiscShape(bytes,pin,{...asset,crc32:0}),/CRC/);
 assert.throws(()=>verifiedDiscShape(bytes,pin,{...asset,tree:'isa'}));
});

test('actual packet HTTP delivery is loopback-only, revision/hash bound and refuses mutation',async()=>{
 const original=resolve('../work/unresolved-disc-preview-20261002'),manifest=JSON.parse(await readFile(resolve(original,'manifest.json'),'utf8'));
 const directory=await mkdtemp(resolve('../work/unresolved-disc-http-test-'));
 for(const name of ['manifest.json',...manifest.files.map(f=>f.name)])await copyFile(resolve(original,name),resolve(directory,name));
 await assert.rejects(()=>discReviewServer(directory,'0'.repeat(64)),/revision|equal/i);
 const server=await discReviewServer(directory,manifest.reportSha256);try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const f of manifest.files){const response=await fetch(base+'/'+f.name);assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(discHash(bytes),f.sha256);assert.equal(response.headers.get('cache-control'),'no-store');const head=await fetch(base+'/'+f.name,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(+head.headers.get('content-length'),f.bytes);}
  for(const path of ['/manifest.json','/source.obj','/scene.json?foreign=1','/%2e%2e/private','/subdir/scene.json'])assert.equal((await fetch(base+path)).status,404);
  assert.equal((await fetch(base+'/scene.json',{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/scene.json',{headers:{Origin:'https://foreign.example'}})).status,403);
  const foreignHostStatus=await new Promise((done,reject)=>{const req=request(base+'/scene.json',{headers:{Host:'foreign.example'}},response=>{response.resume();response.on('end',()=>done(response.statusCode));});req.on('error',reject);req.end();});assert.equal(foreignHostStatus,403);
  await writeFile(resolve(directory,'scene.json'),'altered fixture');assert.equal((await fetch(base+'/scene.json')).status,503);
 }finally{await new Promise((done,reject)=>server.close(error=>error?reject(error):done()));}
});

test('inspector is revision-pinned, local-only and uses the existing eased camera without approval controls',async()=>{
 const html=await readFile('scripts/disc-source-review-preview.html','utf8'),viewer=await readFile('scripts/disc-source-review-viewer.mjs','utf8');
 assert.match(html,/No assigned level/);assert.match(html,/No approval controls/);assert.match(html,/__REPORT_HASH__/);
 assert.match(viewer,/data\.reportSha256!==expected/);assert.match(viewer,/opticCameraArc/);assert.match(viewer,/prefers-reduced-motion/);assert.match(viewer,/900/);assert.match(viewer,/ArrowLeft/);
 assert.match(viewer,/admissions:0,levelAssigned:false,clinicalApproval:false,holdRetained:true/);
 assert(!/https?:\/\//.test(viewer));assert(!/fetch\([^)]*POST/.test(viewer));
});
