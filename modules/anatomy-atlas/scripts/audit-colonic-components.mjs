import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Group,Mesh,MeshStandardMaterial,Matrix4,Vector3,BufferGeometry,BufferAttribute} from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeVertices,mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {loadSourceHolds} from './load-source-holds.mjs';
import {sourceObjShape,sourceTriangleSet} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';
import {geometryFingerprint} from './anatomy-inventory.mjs';
import {cache} from './bodyparts-archive.mjs';

assert(process.argv.slice(2).every(a=>a==='--check'),'Only --check is supported');
const hash=b=>createHash('sha256').update(b).digest('hex');
const {catalog,records,inventory,policy,evidence}=await loadSourceHolds();
const parent=catalog.structures.find(s=>s.fmaId==='FMA7201');assert(parent);
assert.equal(parent.sourceTree,'partof');
const definitions=[
 ['FMA14545','ascending colon','FJ2566','colon','#e2aa91'],
 ['FMA14546','transverse colon','FJ2572','colon','#d9bb7d'],
 ['FMA14547','descending colon','FJ2567','colon','#c6a6bb'],
 ['FMA15042','taenia mesocolica','FJ2569','taenia','#2da19c'],
 ['FMA15043','taenia omentalis','FJ2570','taenia','#5676a4'],
 ['FMA15044','taenia libera','FJ2568','taenia','#a86764'],
].map(([fma,name,file,role,colour])=>({fma,name,file,role,colour}));
assert.deepEqual(definitions.map(d=>d.file).sort(),parent.sources.map(s=>s.file).sort());
const bundle=catalog.bundles.find(b=>b.id===parent.bundle);
const parentBytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
assert.equal(hash(parentBytes),bundle.sha256);
const parse=bytes=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const loaded=await parse(parentBytes),parentMeshes=[];
loaded.scene.traverse(m=>{if(m.isMesh&&(m.name===parent.nodeName||m.userData.structureId===parent.id))parentMeshes.push(m);});
assert.equal(parentMeshes.length,1);
loaded.scene.updateMatrixWorld(true);
assert.deepEqual(parentMeshes[0].matrixWorld.elements,new Matrix4().elements,'Parent must already use the catalogue scene frame');
const triangleSignatures=(g,includeNormals=true,sorted=true)=>{
 const p=g.attributes.position,n=g.attributes.normal,ix=g.index;
 const out=Array.from({length:(ix?.count??p.count)/3},(_,f)=>[0,1,2].map(k=>{
  const i=ix?ix.getX(f*3+k):f*3+k;
  return [p.getX(i),p.getY(i),p.getZ(i),...(includeNormals?[n.getX(i),n.getY(i),n.getZ(i)]:[])].join(',');
 }).join(';'));
 return sorted?out.sort():out;
};
// Source OBJ conversion identifies triangles, but must not regenerate shading.
// Copy every original render attribute by exact oriented position membership.
const parentGeometry=parentMeshes[0].geometry,parentFaces=new Map();
triangleSignatures(parentGeometry,false,false).forEach((key,face)=>{
 const bucket=parentFaces.get(key)??[];bucket.push(face);parentFaces.set(key,bucket);
});
const copiedFaces=new Set(),faceOwners=new Map();
function extractSourceSurface(sourceGeometry,file){
 const faces=triangleSignatures(sourceGeometry,false,false).map(key=>{
  const priorOwner=faceOwners.get(key);
  assert(!priorOwner||priorOwner===file,'A rendered triangle cannot have ambiguous source owners');
  faceOwners.set(key,file);
  const face=parentFaces.get(key)?.shift();assert.notEqual(face,undefined,'Source triangle absent from render parent');
  assert(!copiedFaces.has(face));copiedFaces.add(face);return face;
 });
 const vertices=[],remap=new Map(),indices=[];
 for(const face of faces)for(let k=0;k<3;k++){
  const index=parentGeometry.index?parentGeometry.index.getX(face*3+k):face*3+k;
  if(!remap.has(index)){remap.set(index,vertices.length);vertices.push(index);}
  indices.push(remap.get(index));
 }
 const geometry=new BufferGeometry();
 for(const [name,attribute] of Object.entries(parentGeometry.attributes)){
  assert(!attribute.isInterleavedBufferAttribute,'Unexpected interleaved parent attribute');
  const array=new attribute.array.constructor(vertices.length*attribute.itemSize);
  vertices.forEach((source,i)=>array.set(attribute.array.subarray(source*attribute.itemSize,(source+1)*attribute.itemSize),i*attribute.itemSize));
  geometry.setAttribute(name,new BufferAttribute(array,attribute.itemSize,attribute.normalized));
 }
 geometry.setIndex(indices);return geometry;
}
const matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);
const prototype=new Group(),parts=[],shapes=[],geometries=[];
for(const d of definitions){
 const official=records.find(r=>r.tree==='partof'&&r.id===d.fma);
 assert.equal(official?.name,d.name);assert.deepEqual(official.files,[d.file]);policy.assertNoKnownHolds([official]);
 const raw=await readFile(`${cache}/partof/${d.file}.obj`),stored=parent.sources.find(s=>s.file===d.file);
 assert.equal(hash(raw),stored.sha256);
 const asset=inventory.assets.find(a=>a.tree==='partof'&&a.file===d.file);
 assert.equal(hash(raw),asset.sha256);assert.equal(geometryFingerprint(raw),asset.geometrySha256);
 assert.deepEqual(catalog.structures.filter(s=>s.sources.some(p=>p.file===d.file)).map(s=>s.id),[parent.id]);
 const aliases=records.filter(r=>r.files.length===1&&r.files[0]===d.file).map(r=>({tree:r.tree,fma:r.id,name:r.name}));
 const shape=sourceObjShape(raw),topology=sourceTopology(shape);shapes.push(shape);
 const converted=[];
 new OBJLoader().parse(raw.toString()).traverse(mesh=>{
  if(!mesh.isMesh)return;
  let g=mesh.geometry.clone();g.deleteAttribute('normal');g.deleteAttribute('uv');
  g=mergeVertices(g,0.0001);g.computeVertexNormals();g.applyMatrix4(matrix);converted.push(g);
 });
 const convertedGeometry=mergeGeometries(converted);
 const geometry=extractSourceSurface(convertedGeometry,d.file);geometry.computeBoundingBox();geometries.push(geometry);
 const mesh=new Mesh(geometry,new MeshStandardMaterial({color:d.colour,roughness:0.75}));
 mesh.name=d.fma;mesh.userData={sourceFile:d.file,sourceFma:d.fma,role:d.role,parentId:parent.id,clinicalApproval:false,prototypeOnly:true};prototype.add(mesh);
 parts.push({...d,sourceTree:'partof',sourceSha256:hash(raw),canonicalGeometrySha256:asset.geometrySha256,aliases,topology,
  sceneBounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()},
  centre:geometry.boundingBox.getCenter(new Vector3()).toArray(),triangles:geometry.index.count/3});
}
const assembled=geometries.flatMap(g=>triangleSignatures(g)).sort(),original=triangleSignatures(parentMeshes[0].geometry);
const positions=geometries.flatMap(g=>triangleSignatures(g,false)).sort(),originalPositions=triangleSignatures(parentMeshes[0].geometry,false);
assert.equal(copiedFaces.size,original.length);assert([...parentFaces.values()].every(bucket=>bucket.length===0));
assert.equal(hash(positions.join('\n')),hash(originalPositions.join('\n')));
assert.equal(hash(assembled.join('\n')),hash(original.join('\n')),'Source split must preserve every rendered triangle, winding and normal');
const triangleSets=shapes.map(sourceTriangleSet),shared=[];
for(let a=0;a<parts.length;a++)for(let b=a+1;b<parts.length;b++){
 let count=0;for(const key of triangleSets[a])if(triangleSets[b].has(key))count++;
 shared.push({a:parts[a].file,b:parts[b].file,identicalTriangles:count});
}
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const prototypeBytes=Buffer.from(await new GLTFExporter().parseAsync(prototype,{binary:true}));
const roundTrip=await parse(prototypeBytes),prototypeMeshes=[];roundTrip.scene.traverse(m=>{if(m.isMesh)prototypeMeshes.push(m);});
assert.equal(prototypeMeshes.length,6);
for(const p of parts){const m=prototypeMeshes.find(m=>m.name===p.fma);assert(m);assert.equal(m.userData.sourceFile,p.file);}
assert.equal(hash(prototypeMeshes.flatMap(m=>triangleSignatures(m.geometry)).sort().join('\n')),hash(original.join('\n')),'Prototype round trip preserves original render surface');
const report={version:1,baseline:'a915f17a6ef525f0fec0c20ec9d404578c3c6e3c',evidence,parentId:parent.id,parentBundle:{id:bundle.id,sha256:bundle.sha256},parts,sharedTriangles:shared,
 preservation:{parentTriangles:original.length,partitionTriangles:assembled.length,positionsWindingNormalsExact:true,parentCatalogueUnchanged:true,renderTriangleSha256:hash(original.join('\n')),method:'Exact oriented source-position membership; original parent attributes copied, not regenerated.'},
 prototype:{path:'.local/colonic-components-prototype/colonic-components.glb',bytes:prototypeBytes.length,sha256:hash(prototypeBytes),public:false,registered:false},
 licence:{license:'CC-BY-4.0',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',checked:'2026-09-17',credit:'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',changes:'Existing source aggregate separated into six labelled, coloured diagnostic surfaces; original positions, winding and normals retained.'},
 boundaries:{clinicalApproval:false,anatomicalExtentValidated:false,sourceNamesAreNotClinicalSegmentation:true,sigmoidSeparatelyIdentified:false,wallLayersOrLumenValidated:false,selfIntersectionProvedAbsent:false,nearCoincidenceAssessed:false,publicModelChanged:false,patientDataIncluded:false}};
assert.equal(hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')),evidence.catalogSha256);
assert.equal(hash(await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname)),bundle.sha256);
const reportPath='docs/colonic-components-source-audit.json',reportText=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check')){
 assert.equal((await readFile(reportPath,'utf8')).replace(/\r\n/g,'\n'),reportText);
 assert.deepEqual(await readFile(report.prototype.path),prototypeBytes);
}else{
 await mkdir('.local/colonic-components-prototype',{recursive:true});await writeFile(report.prototype.path,prototypeBytes);await writeFile(reportPath,reportText);
}
console.log(JSON.stringify({parts:parts.map(p=>({name:p.name,triangles:p.triangles,components:p.topology.components.length,closed:p.topology.closedOrientedManifold,degenerate:p.topology.degenerateFaces})),sharedTriangles:shared.filter(s=>s.identicalTriangles),preservation:report.preservation,prototype:report.prototype}));
