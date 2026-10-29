import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {parseObj,auditObj}from './obj-audit.mjs';
const root=process.env.VM_FOOT_ROOT??path.resolve(import.meta.dirname,'..'),sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFile(root+'/'+p),json=async p=>JSON.parse(await read(p));
const acquisition=await json('ACQUISITION.json'),packet=await json('REVIEW_PACKET.json'),model=await json('review/model.json');
assert.equal(sha(await read('ACQUISITION.json')),packet.acquisitionSha256);assert.equal(sha(await read('review/model.json')),packet.modelSha256);
assert.equal(acquisition.structures.length,12);assert.equal(packet.structures.length,12);assert.equal(model.structures.length,12);
assert.deepEqual(model.notice,packet.notice);assert.equal(packet.notice.registration,'none');assert.equal(packet.notice.clinicalApproval,false);assert.equal(packet.notice.admittedToAtlas,false);
let faces=0,vertices=0;
for(const original of acquisition.structures){const bytes=await read(original.path);assert.equal(sha(bytes),original.sha256);assert.equal(bytes.length,original.bytes);
 const parsed=parseObj(bytes),display=model.structures.find(s=>s.id===original.id),report=packet.structures.find(s=>s.id===original.id);assert(display&&report);
 assert.deepEqual(display.positions,parsed.positions);assert.deepEqual(display.faces,parsed.faces);assert.equal(display.name,original.name);assert.equal(display.sourceSha256,original.sha256);assert.equal(display.sourceSha256,report.sha256);assert.equal(report.exactCoordinateTopology.triangles,parsed.faces.length);
 const a=auditObj(parsed);delete a.positions;delete a.faces;assert.deepEqual(a,report.rawIndexTopology);faces+=parsed.faces.length;vertices+=parsed.positions.length;
}
assert.equal(faces,acquisition.archive.endsWith('_95.zip')?69234:16092);assert.equal(packet.render.triangles,faces);assert.equal(packet.structures.filter(s=>s.kind==='bone-context').length,10);assert.equal(packet.structures.filter(s=>s.kind==='muscle-group').length,2);
for(const id of ['FMA74140','FMA74141']){const r=packet.structures.find(s=>s.id===id);assert.equal(r.exactCoordinateTopology.components.filter(c=>c.triangles>100).length,4);assert.equal(r.exactCoordinateTopology.closedOrientedManifold,false);assert(r.exactCoordinateTopology.duplicateFaces>0);assert.equal(r.versionComparison,null);}
const delta=packet.structures.filter(s=>s.versionComparison).map(s=>({id:s.id,delta:s.versionComparison.v4MinusV3BoundsCenter}));
assert.equal(delta.length,10);assert(delta.some(v=>v.delta.some(n=>Math.abs(n)>5))); // Descriptive evidence that these source frames differ; never an alignment.
const centroidDeltaRange=[0,1,2].map(k=>({min:Math.min(...delta.map(s=>s.delta[k])),max:Math.max(...delta.map(s=>s.delta[k]))}));
const result={at:new Date().toISOString(),structures:12,vertices,triangles:faces,allSourceTrianglesRetained:true,originalCoordinatesPreserved:true,numberedMuscleLabelsAssigned:false,registered:false,clinicalApproval:false,normalWebsiteChanged:false,groupDefectsFlagged:true,versionComparison:{bones:10,centroidDeltaRange,meaning:'Raw v4 minus v3 bounding-box centres only; not a registration or registration-error metric'},modelSha256:packet.modelSha256};
await fs.writeFile(root+'/VERIFIED.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
