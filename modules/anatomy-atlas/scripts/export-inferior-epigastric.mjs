import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { inferiorEpigastricSources } from './inferior-epigastric-sources.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { preflightCurrentSourceHolds } from './current-source-holds.mjs';
await preflightCurrentSourceHolds(inferiorEpigastricSources.map(s=>({tree:'isa',id:s.id,name:s.name,files:[s.file]})));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const auditBytes=await readFile('docs/inferior-epigastric-source-audit.json');
assert.equal(hash(auditBytes),'58fab593957c3469125e84258c78c176425235b40838e369bff0d38191930698');
const audit=JSON.parse(auditBytes), {catalog,evidence}=await loadSourceHolds();
assert.deepEqual(audit.evidence,evidence);
const scene=new Scene(), matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);
const structures=[],expected=new Map(),retained=[];
for(const candidate of inferiorEpigastricSources) {
  const original=await readFile(`../work/bodyparts3d/isa/${candidate.file}.obj`);
  assert.equal(hash(original),candidate.sha256); retained.push({file:candidate.file,bytes:original});
  const shape=sourceObjShape(original),points=[],lookup=new Map();
  const remap=shape.vertices.map(p=>{const key=p.join(',');if(!lookup.has(key)){lookup.set(key,points.length);points.push(p);}return lookup.get(key);});
  const transformed=points.map(p=>new Vector3(...p).applyMatrix4(matrix).toArray());
  const faces=shape.faces.map(face=>face.map(i=>remap[i]));
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(transformed.flat(),3));
  geometry.setIndex(faces.flat()); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  const center=geometry.boundingBox.getCenter(new Vector3());
  const id=`vm:anatomy:body:abdomen:${candidate.side}:vessel:${candidate.name.replaceAll(' ','-')}`;
  const mesh=new Mesh(geometry,new MeshStandardMaterial({color:candidate.kind==='artery'?'#be6157':'#6596b8',roughness:0.65}));
  mesh.name=candidate.id;
  mesh.userData={structureId:id,fmaId:candidate.id,sourceTree:'isa',sourceSha256:candidate.sha256,anatomicalReview:false};
  scene.add(mesh);
  const stored=Array.from(geometry.attributes.position.array);
  expected.set(candidate.id,{positions:stored,indices:faces.flat(),userData:mesh.userData});
  const vertices=Array.from({length:stored.length/3},(_,i)=>stored.slice(i*3,i*3+3));
  const anchor=vertices.reduce((best,p)=>new Vector3(...p).distanceToSquared(center)<new Vector3(...best).distanceToSquared(center)?p:best,vertices[0]);
  structures.push({id,fmaId:candidate.id,name:candidate.name[0].toUpperCase()+candidate.name.slice(1),sourceName:candidate.name,
    system:'vessels',category:'vessel',laterality:candidate.side,region:'abdomen',regions:['abdomen','pelvis'],
    bundle:'inferior-epigastric-vessels',nodeName:candidate.id,sourceTree:'isa',sources:[{file:candidate.file,sha256:candidate.sha256}],
    bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()},center:center.toArray(),anchor,
    coverageNote:'Complete original source definition, not a complete abdominal-wall vascular tree. Rectus sheath, inguinal rings, fascia and nerves are not supplied by this addition. Source surfaces do not establish joined lumens, perforator anatomy, blood flow or a safe procedural route. All original triangles and source positions retained; clinical review pending.',
    provenance:{method:'licensed-source-mesh',license:catalog.license,sourceVersion:catalog.sourceVersion,recovered:false},
    validation:{status:'unvalidated',anatomicalReview:false}});
}
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const bytes=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let count=0;
loaded.scene.traverse(mesh=>{if(!mesh.isMesh)return;const before=expected.get(mesh.name);assert(before);
  assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),before.positions);
  assert.deepEqual(Array.from(mesh.geometry.index.array),before.indices);
  assert.deepEqual(mesh.userData,{name:mesh.name,...before.userData});count++;});
assert.equal(count,4);
const contextFmas=['FMA18806','FMA18807','FMA18885','FMA18886','FMA3988','FMA4083'];
const contextRecords=catalog.structures.filter(s=>contextFmas.includes(s.fmaId));assert.equal(contextRecords.length,6);
const result={version:1,sourceVersion:catalog.sourceVersion,license:catalog.license,credit:catalog.credit,
  coordinateSystem:catalog.coordinateSystem,evidence,auditSha256:hash(auditBytes),structures,contextRecords,
  contextBundles:catalog.bundles.filter(b=>contextRecords.some(s=>s.bundle===b.id)),
  bundles:[{id:'inferior-epigastric-vessels',url:`/models/bodyparts3d/inferior-epigastric-vessels/inferior-epigastric-vessels.glb?v=${hash(bytes)}`,bytes:bytes.length,sha256:hash(bytes),structures:4}],
  modification:'Exact-coordinate welding for indexed normals and Float32 GLB storage. Every triangle retained in order; no fitting, mirroring, smoothing, bridges, invented branches or face removal.',clinicalApproval:false};
const path='public/models/bodyparts3d/inferior-epigastric-vessels',sourcePath='content/sources/inferior-epigastric-vessels',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')) {
  assert.equal(hash(await readFile(`${path}/inferior-epigastric-vessels.glb`)),hash(bytes));
  assert.equal((await readFile(`${path}/catalog.json`,'utf8')).replace(/\r\n/g,'\n'),text);
  for(const original of retained) assert.deepEqual(await readFile(`${sourcePath}/${original.file}.obj`),original.bytes);
} else {
  await mkdir(path);await mkdir(sourcePath);
  await writeFile(`${path}/inferior-epigastric-vessels.glb`,bytes,{flag:'wx'});
  await writeFile(`${path}/catalog.json`,text,{flag:'wx'});
  for(const original of retained)await writeFile(`${sourcePath}/${original.file}.obj`,original.bytes,{flag:'wx'});
}
console.log(JSON.stringify({selections:4,triangles:28968,...result.bundles[0],clinicalApproval:false}));
