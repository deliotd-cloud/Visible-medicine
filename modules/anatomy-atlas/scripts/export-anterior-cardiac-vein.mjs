import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {BufferGeometry,Float32BufferAttribute,Matrix4,Mesh,MeshStandardMaterial,Scene,Vector3} from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sourceObjShape} from './source-surface-audit.mjs';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {hash,cardiacVeinBase} from './anterior-cardiac-vein-tools.mjs';
const check=process.argv.includes('--check'),auditPath='docs/anterior-cardiac-vein-source-audit.json';
const auditBytes=await readFile(check?auditPath:'../work/anterior-cardiac-vein-audit-20260917.json');
assert.equal(hash(auditBytes),'833d38d84f21d9000ed4d14dc608185670518761a16d09c87c3328758564a20a');
const audit=JSON.parse(auditBytes),current=await loadCurrentSourceHolds(),catalog=current.catalog;
assert.equal(audit.baselineCommit,cardiacVeinBase);assert.equal(audit.screenedFiles,1816);assert.equal(audit.rootSelections,1103);assert.equal(audit.nestedSelections,104);
assert.deepEqual(audit.evidence,current.evidence);current.policy.assertNoKnownHolds([audit.definition]);
assert.deepEqual(audit.matches,[]);assert(audit.comparisons.every(r=>r.sharedTriangles===0&&!r.translatedDiagnostic?.similar));assert.equal(audit.candidateComparison.sharedTriangles,0);
assert(audit.candidates.every(c=>c.topology.closedOrientedManifold&&c.topology.components.length===1&&c.topology.duplicateFaces===0));
const id='vm:anatomy:body:thorax:unspecified:vessel:anterior-cardiac-vein',matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor),positions=[],indices=[],retained=[];
for(const c of audit.candidates){const bytes=await readFile(check?`content/sources/anterior-cardiac-vein/${c.file}.obj`:`../work/bodyparts3d/isa/${c.file}.obj`);assert.equal(hash(bytes),c.sha256);const s=sourceObjShape(bytes);assert(s.faces.every(f=>f.length===3));const offset=positions.length/3;positions.push(...s.vertices.flatMap(v=>new Vector3(...v).applyMatrix4(matrix).toArray()));indices.push(...s.faces.flatMap(f=>f.map(i=>i+offset)));retained.push({file:c.file,bytes});}
assert.equal(indices.length/3,730);
const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();
const center=geometry.boundingBox.getCenter(new Vector3()),p=geometry.attributes.position;let anchor=new Vector3().fromBufferAttribute(p,0);
for(let i=1;i<p.count;i++){const v=new Vector3().fromBufferAttribute(p,i);if(v.distanceToSquared(center)<anchor.distanceToSquared(center))anchor=v;}
const scene=new Scene(),mesh=new Mesh(geometry,new MeshStandardMaterial({color:'#688dae',roughness:.65}));mesh.name='FMA76767';mesh.userData={structureId:id,fmaId:'FMA76767',sourceTree:'isa',anatomicalReview:false};scene.add(mesh);
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const bytes=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})),loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let count=0;
loaded.scene.traverse(m=>{if(!m.isMesh)return;assert.equal(m.name,mesh.name);assert.deepEqual(Array.from(m.geometry.attributes.position.array),Array.from(p.array));assert.deepEqual(Array.from(m.geometry.index.array),indices);assert.deepEqual(m.userData,{name:mesh.name,...mesh.userData});count++;});assert.equal(count,1);
const structure={id,fmaId:'FMA76767',name:'Anterior cardiac vein · source group',sourceName:'anterior cardiac vein',system:'vessels',category:'vessel',laterality:'unspecified',region:'thorax',regions:['thorax'],bundle:'anterior-cardiac-vein',nodeName:'FMA76767',sourceTree:'isa',sources:audit.candidates.map(c=>({file:c.file,sha256:c.sha256})),bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()},center:center.toArray(),anchor:anchor.toArray(),coverageNote:'Two original surfaces retained as one source-defined group. The visible branches are not a normal vein count, a complete venous tree or independently named veins. Apparent contact with the heart, right coronary artery or the other component does not prove lumen continuity, drainage openings or a dissection plane. Reassemble before comparing source relationships.',provenance:{method:'licensed-source-mesh',license:catalog.license,sourceVersion:catalog.sourceVersion,recovered:false},validation:{status:'unvalidated',anatomicalReview:false}};
const contextRecords=catalog.structures.filter(s=>['FMA7088','FMA3802','FMA4707','FMA4713'].includes(s.fmaId));assert.equal(contextRecords.length,4);
const result={version:1,sourceVersion:catalog.sourceVersion,license:catalog.license,credit:catalog.credit,coordinateSystem:catalog.coordinateSystem,auditSha256:hash(auditBytes),structures:[structure],contextRecords,contextBundles:catalog.bundles.filter(b=>contextRecords.some(s=>s.bundle===b.id)),bundles:[{id:'anterior-cardiac-vein',url:`/models/bodyparts3d/anterior-cardiac-vein/anterior-cardiac-vein.glb?v=${hash(bytes)}`,bytes:bytes.length,sha256:hash(bytes),structures:1}],modification:'Original indexed vertices and ordered faces preserved under the existing common source-to-scene transform and Float32 storage. Shading normals recomputed. No repair, smoothing, mirroring, inferred connectors, lumen or flow.',clinicalApproval:false};
const dir='public/models/bodyparts3d/anterior-cardiac-vein',original='content/sources/anterior-cardiac-vein',text=JSON.stringify(result,null,2)+'\n';
if(check){assert.equal(hash(await readFile(`${dir}/anterior-cardiac-vein.glb`)),hash(bytes));assert.equal((await readFile(`${dir}/catalog.json`,'utf8')).replace(/\r\n/g,'\n'),text);}
else{await mkdir(dir);await mkdir(original);await writeFile(`${dir}/anterior-cardiac-vein.glb`,bytes,{flag:'wx'});await writeFile(`${dir}/catalog.json`,text,{flag:'wx'});await writeFile(auditPath,auditBytes,{flag:'wx'});for(const r of retained)await writeFile(`${original}/${r.file}.obj`,r.bytes,{flag:'wx'});}
console.log(JSON.stringify({selections:1,sourceFiles:2,triangles:730,bundle:result.bundles[0],clinicalApproval:false}));
