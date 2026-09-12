import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { pelvicVeinSources } from './pelvic-vein-sources.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { preflightCurrentSourceHolds } from './current-source-holds.mjs';
const pelvicVeinCandidates=pelvicVeinSources.filter(s=>s.status!=='held');
assert.equal(pelvicVeinCandidates.length,10);
await preflightCurrentSourceHolds(pelvicVeinCandidates.map(s=>({tree:'isa',id:s.id,name:s.name,files:[s.file]})));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const auditBytes=await readFile('docs/pelvic-vein-source-audit.json');
assert.equal(hash(auditBytes),'ffb300bcd1f2cd8c2a9684c133ed5d82a1043d7bda99a78f377854c9168ebf26');
const audit=JSON.parse(auditBytes), {catalog,evidence}=await loadSourceHolds();
assert.deepEqual(audit.evidence,evidence);
const scene=new Scene(), matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);
const structures=[],expected=new Map(),retained=[];
for(const candidate of pelvicVeinCandidates) {
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
  const id=`vm:anatomy:body:pelvis:${candidate.side}:vessel:${candidate.name.replaceAll(' ','-')}`;
  const mesh=new Mesh(geometry,new MeshStandardMaterial({color:candidate.kind==='artery'?'#be6157':'#6596b8',roughness:0.65}));
  mesh.name=candidate.id;
  mesh.userData={structureId:id,fmaId:candidate.id,sourceTree:'isa',sourceSha256:candidate.sha256,anatomicalReview:false};
  scene.add(mesh);
  const stored=Array.from(geometry.attributes.position.array);
  expected.set(candidate.id,{positions:stored,indices:faces.flat(),userData:mesh.userData});
  const vertices=Array.from({length:stored.length/3},(_,i)=>stored.slice(i*3,i*3+3));
  const anchor=vertices.reduce((best,p)=>new Vector3(...p).distanceToSquared(center)<new Vector3(...best).distanceToSquared(center)?p:best,vertices[0]);
  structures.push({id,fmaId:candidate.id,name:candidate.name[0].toUpperCase()+candidate.name.slice(1),sourceName:candidate.name,
    system:'vessels',category:'vessel',laterality:candidate.side,region:'pelvis',regions:['pelvis'],
    bundle:'pelvic-veins',nodeName:candidate.id,sourceTree:'isa',sources:[{file:candidate.file,sha256:candidate.sha256}],
    bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()},center:center.toArray(),anchor,
    coverageNote:'Complete original source definition, not a complete pelvic venous network. Left internal pudendal and left lateral sacral definitions are held for coordinate/laterality review. Small superior gluteal surfaces do not depict their entire drainage territory. Plexuses, nerves and fascial canals are not supplied. Source proximity does not establish joined lumens, flow, patency or a safe procedural route. Every original triangle and source position is retained; clinical review pending.',
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
assert.equal(count,10);
const contextFmas=['FMA21387','FMA21388','FMA18887','FMA18888','FMA16586','FMA16587','FMA16202'];
const contextRecords=catalog.structures.filter(s=>contextFmas.includes(s.fmaId));assert.equal(contextRecords.length,7);
const result={version:1,sourceVersion:catalog.sourceVersion,license:catalog.license,credit:catalog.credit,
  coordinateSystem:catalog.coordinateSystem,evidence,auditSha256:hash(auditBytes),structures,contextRecords,
  contextBundles:catalog.bundles.filter(b=>contextRecords.some(s=>s.bundle===b.id)),
  bundles:[{id:'pelvic-veins',url:`/models/bodyparts3d/pelvic-veins/pelvic-veins.glb?v=${hash(bytes)}`,bytes:bytes.length,sha256:hash(bytes),structures:10}],
  modification:'Exact-coordinate welding for indexed normals and Float32 GLB storage. Every triangle retained in order; no fitting, mirroring, smoothing, bridges, invented branches or face removal.',clinicalApproval:false};
const path='public/models/bodyparts3d/pelvic-veins',sourcePath='content/sources/pelvic-veins',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')) {
  assert.equal(hash(await readFile(`${path}/pelvic-veins.glb`)),hash(bytes));
  assert.equal((await readFile(`${path}/catalog.json`,'utf8')).replace(/\r\n/g,'\n'),text);
  for(const original of retained) assert.deepEqual(await readFile(`${sourcePath}/${original.file}.obj`),original.bytes);
} else {
  await mkdir(path);await mkdir(sourcePath);
  await writeFile(`${path}/pelvic-veins.glb`,bytes,{flag:'wx'});
  await writeFile(`${path}/catalog.json`,text,{flag:'wx'});
  for(const original of retained)await writeFile(`${sourcePath}/${original.file}.obj`,original.bytes,{flag:'wx'});
}
const heldPath='content/prototypes/pelvic-vein-review';
if(!process.argv.includes('--check'))await mkdir(heldPath);
for(const held of pelvicVeinSources.filter(s=>s.status==='held')) {
  const original=await readFile(`../work/bodyparts3d/isa/${held.file}.obj`);
  assert.equal(hash(original),held.sha256);
  if(process.argv.includes('--check'))assert.deepEqual(await readFile(`${heldPath}/${held.file}.obj`),original);
  else await writeFile(`${heldPath}/${held.file}.obj`,original,{flag:'wx'});
}
console.log(JSON.stringify({selections:10,triangles:65026,...result.bundles[0],clinicalApproval:false}));
