import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const evidenceBytes=await readFile('../work/short-ciliary-owners-20260917.json');
assert.equal(sha(evidenceBytes),'953c4a9f58d3b5f68961b8aefba1452ff20b215b0c8a927eb65886d045f357d6');
const audit=JSON.parse(evidenceBytes),current=await loadCurrentSourceHolds(),catalog=current.catalog;
current.policy.assertNoKnownHolds([audit.definition]);
assert.equal(audit.freshCandidateBytesVerified,true);assert.equal(audit.screenedFiles,1814);assert.deepEqual(audit.matches,[]);
assert(audit.comparisons.every(r=>!r.sharedTriangles&&!r.translatedDiagnostic?.similar));
const sourceId='vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve';
const matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);
const scene=new Scene(),parts=[],retained=[],expected=new Map(),allPositions=[],allIndices=[];
function geometry(positions,indices){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();return g;}
function spatial(g){const center=g.boundingBox.getCenter(new Vector3()),p=g.attributes.position;let anchor=new Vector3().fromBufferAttribute(p,0);
 for(let i=1;i<p.count;i++){const v=new Vector3().fromBufferAttribute(p,i);if(v.distanceToSquared(center)<anchor.distanceToSquared(center))anchor=v;}
 return {bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()},center:center.toArray(),anchor:anchor.toArray()};}
function add(name,g,metadata){const mesh=new Mesh(g,new MeshStandardMaterial({color:'#d5aa3c',roughness:.65}));mesh.name=name;mesh.userData={structureId:sourceId,fmaId:'FMA7041',sourceTree:'isa',anatomicalReview:false,...metadata};scene.add(mesh);expected.set(name,{positions:Array.from(g.attributes.position.array),indices:Array.from(g.index.array),userData:mesh.userData});}
for(let i=0;i<audit.candidates.length;i++){
 const candidate=audit.candidates[i],bytes=await readFile(`../work/bodyparts3d/isa/${candidate.file}.obj`);assert.equal(sha(bytes),candidate.sha256);retained.push({file:candidate.file,bytes});
 const shape=sourceObjShape(bytes);assert(shape.faces.every(f=>f.length===3));
 const side=i===0?'left':'right';assert(shape.vertices.every(v=>side==='left'?v[0]>0:v[0]<0));
 const positions=shape.vertices.flatMap(v=>new Vector3(...v).applyMatrix4(matrix).toArray()),indices=shape.faces.flat(),g=geometry(positions,indices);
 const nodeName=`FMA7041_${candidate.file}`,source={file:candidate.file,sha256:candidate.sha256};
 const part={source,displaySide:side,nodeName,...spatial(g)};parts.push(part);add(nodeName,g,{presentationPart:part});
 const offset=allPositions.length/3;allPositions.push(...positions);allIndices.push(...indices.map(n=>n+offset));
}
assert.deepEqual(parts.map(p=>p.source.file),['FJ1319','FJ1370']);
const aggregate=geometry(allPositions,allIndices);add('FMA7041',aggregate,{presentationParts:parts});
const structure={id:sourceId,fmaId:'FMA7041',name:'Short ciliary nerve · source group',sourceName:'short ciliary nerve',system:'nerves',category:'nerve',laterality:'unspecified',region:'head-neck',regions:['head-neck'],bundle:'short-ciliary',nodeName:'FMA7041',sourceTree:'isa',sources:parts.map(p=>p.source),presentationParts:parts,...spatial(aggregate),coverageNote:'Bilateral source-defined group: one original file on each side, with two topological components per file. Components and visible projections are not a normal nerve count or complete ocular autonomic pathway. Laterality filters show the audited source-file presentation without asserting new sided FMA identities. Fibre continuity, precise globe entry and clinical anatomy require review.',provenance:{method:'licensed-source-mesh',license:catalog.license,sourceVersion:catalog.sourceVersion,recovered:false},validation:{status:'unvalidated',anatomicalReview:false}};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const bytes=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let meshes=0;
loaded.scene.traverse(m=>{if(!m.isMesh)return;const e=expected.get(m.name);assert(e);assert.deepEqual(Array.from(m.geometry.attributes.position.array),e.positions);assert.deepEqual(Array.from(m.geometry.index.array),e.indices);assert.deepEqual(m.userData,{name:m.name,...e.userData});meshes++;});assert.equal(meshes,3);
const contextRecords=catalog.structures.filter(s=>['FMA53549','FMA53550','FMA52673','FMA52674'].includes(s.fmaId));assert.equal(contextRecords.length,4);
const result={version:1,sourceVersion:catalog.sourceVersion,license:catalog.license,credit:catalog.credit,coordinateSystem:catalog.coordinateSystem,auditSha256:sha(evidenceBytes),structures:[structure],contextRecords,contextBundles:catalog.bundles.filter(b=>contextRecords.some(s=>s.bundle===b.id)),bundles:[{id:'short-ciliary',url:`/models/bodyparts3d/short-ciliary/short-ciliary.glb?v=${sha(bytes)}`,bytes:bytes.length,sha256:sha(bytes),structures:1}],modification:'Original indexed vertices and ordered faces retained under the common source-to-scene transform and Float32 storage; shading normals recomputed. Aggregate and source-part nodes are alternative presentations, never simultaneously drawn for one selection. No repair, mirroring, smoothing or generated connections.',clinicalApproval:false};
const path='public/models/bodyparts3d/short-ciliary',original='content/sources/short-ciliary',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){assert.equal(sha(await readFile(`${path}/short-ciliary.glb`)),sha(bytes));assert.equal((await readFile(`${path}/catalog.json`,'utf8')).replace(/\r\n/g,'\n'),text);for(const r of retained)assert.equal(sha(await readFile(`${original}/${r.file}.obj`)),sha(r.bytes));}
else{await mkdir(path);await mkdir(original);await writeFile(`${path}/short-ciliary.glb`,bytes,{flag:'wx'});await writeFile(`${path}/catalog.json`,text,{flag:'wx'});for(const r of retained)await writeFile(`${original}/${r.file}.obj`,r.bytes,{flag:'wx'});}
console.log(JSON.stringify({canonicalSelections:1,presentationParts:2,alternativeRenderNodes:3,sourceTriangles:1240,bundle:result.bundles[0],clinicalApproval:false}));
