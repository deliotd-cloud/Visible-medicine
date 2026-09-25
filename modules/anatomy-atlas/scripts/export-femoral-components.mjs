import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const hash = b => createHash('sha256').update(b).digest('hex');
const {catalog, records, policy, evidence, supplementalEvidence} = await loadCurrentSourceHolds();
// This audit records the source policy at the femoral export revision. Current
// holds are still loaded and checked above, including later tibial evidence;
// later reports must not rewrite the recorded historical reproduction.
const historicalSupplementalEvidence = [
  {path:'docs/limbic-landmark-source-audit.json',sha256:'2b29686d350ca29d88c67c7a44c3e143033deea35f15df0a66b90c758a82f69c'},
  {path:'docs/pelvic-vein-source-audit.json',sha256:'ffb300bcd1f2cd8c2a9684c133ed5d82a1043d7bda99a78f377854c9168ebf26'},
  {path:'docs/collicular-brachia-source-audit.json',sha256:'376863798d350db47711e802a9f5a0180b9d1c99f0972bbec769e6588e5c5b9a'},
  {path:'docs/deep-leg-vein-source-audit.json',sha256:'2ed4267b0ceae5448673eaf0743ed79a995fc7f879dac26c81e24109c7b201ec'},
];
const historicalPaths = new Set(historicalSupplementalEvidence.map(entry=>entry.path));
assert.deepEqual(
  supplementalEvidence.filter(entry=>historicalPaths.has(entry.path)),
  historicalSupplementalEvidence,
  'Historical femoral supplemental evidence changed',
);
assert(
  supplementalEvidence.some(entry=>entry.path==='docs/tibial-recurrent-source-disposition.json'),
  'Current tibial recurrent source disposition must be validated',
);
const parents = ['FMA20796','FMA20797'].map(id => catalog.structures.find(s => s.fmaId === id));
assert(parents.every(Boolean));
assert.deepEqual(parents.map(p => p.sources.map(s => s.file)), [['FJ2137','FJ2158'],['FJ2069','FJ2078']]);
const parentBundles = catalog.bundles.filter(b => parents.some(p => p.bundle === b.id));
assert.equal(parentBundles.length, 1);
const originalBytes = await readFile('public/models/bodyparts3d/full-body/'+parentBundles[0].id+'.glb');
assert.equal(hash(originalBytes), parentBundles[0].sha256);
const originalScene = (await new GLTFLoader().parseAsync(originalBytes.buffer.slice(originalBytes.byteOffset, originalBytes.byteOffset+originalBytes.byteLength), '')).scene;
const matrix = new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);
const scene = new Scene(), structures = [], proofs = [], retained = [];
// Rotation-invariant face key retains orientation. Multisets preserve duplicate counts.
const faceKey = points => [0,1,2].map(i => [...points.slice(i),...points.slice(0,i)].map(p=>p.join(',')).join('|')).sort()[0];
const meshFaces = mesh => {
  const p=mesh.geometry.attributes.position, index=mesh.geometry.index;
  return Array.from({length:(index?.count??p.count)/3},(_,f)=>faceKey([0,1,2].map(c=>{const i=index?index.array[f*3+c]:f*3+c; return [p.getX(i),p.getY(i),p.getZ(i)];})));
};
for (const parent of parents) {
  const definition = records.find(r=>r.tree==='partof' && r.id===parent.fmaId);
  assert.equal(definition.name,parent.sourceName);
  assert.deepEqual(definition.files,parent.sources.map(s=>s.file));
  policy.assertNoKnownHolds([definition]);
  const originalMesh = originalScene.getObjectByName(parent.nodeName);
  assert(originalMesh?.isMesh);
  const oldFaces=meshFaces(originalMesh).sort(), partition=[], parts=[];
  for (let i=0;i<parent.sources.length;i++) {
    const source=parent.sources[i], lateral=i===1;
    const bytes=await readFile('../work/bodyparts3d/partof/'+source.file+'.obj');
    assert.equal(hash(bytes),source.sha256);
    const shape=sourceObjShape(bytes), topology=sourceTopology(shape);
    assert(topology.closedOrientedManifold);
    assert(shape.vertices.every(p=>parent.laterality==='right'?p[0]<0:p[0]>0));
    const fmaId=lateral?(parent.laterality==='right'?'FMA20801':'FMA20802'):parent.fmaId;
    const partDefinition=lateral?records.find(r=>r.tree==='partof'&&r.id===fmaId):definition;
    if(lateral){assert.deepEqual(partDefinition.files,[source.file]);policy.assertNoKnownHolds([partDefinition]);}
    const sourceName=partDefinition.name;
    // Match the original OBJLoader path: Float32 source positions, then transform,
    // then Float32 scene storage. Do not introduce a different rounding pipeline.
    const positions=shape.vertices.map(p=>new Vector3(...p.map(Math.fround)).applyMatrix4(matrix).toArray().map(Math.fround));
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new Float32BufferAttribute(positions.flat(),3));
    geometry.setIndex(shape.faces.flat());geometry.computeVertexNormals();geometry.computeBoundingBox();
    const center=geometry.boundingBox.getCenter(new Vector3()), anchor=positions.reduce((best,p)=>new Vector3(...p).distanceToSquared(center)<new Vector3(...best).distanceToSquared(center)?p:best,positions[0]);
    const id=`vm:anatomy:body:thigh:${parent.laterality}:source-component:${source.file.toLowerCase()}`;
    const mesh=new Mesh(geometry,new MeshStandardMaterial({color:lateral?'#be6157':'#975349',roughness:0.65}));
    mesh.name=`${parent.fmaId}_${source.file}`;
    mesh.userData={structureId:id,fmaId,parentId:parent.id,sourceTree:'partof',sourceSha256:source.sha256,anatomicalReview:false};
    scene.add(mesh);
    const faces=meshFaces(mesh);partition.push(...faces);
    parts.push({id,source,role:lateral?'lateral-circumflex':'remainder',triangles:shape.faces.length,topology,sourceFaceKeySha256:hash(faces.join('\n'))});
    retained.push({file:source.file,bytes});
    structures.push({
      ...parent,id,fmaId,name:lateral?sourceName[0].toUpperCase()+sourceName.slice(1):`${parent.laterality==='right'?'Right':'Left'} deep-femoral source remainder`,sourceName,
      bundle:'femoral-components',nodeName:mesh.name,sources:[source],
      bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()},center:center.toArray(),anchor,
      parentId:parent.id,role:lateral?'lateral-circumflex':'remainder',
      coverageNote:lateral?'One complete source-labelled lateral circumflex definition, already contained in the root deep-femoral aggregate. Not a complete branch network or verified joined lumen.':'Remaining FJ source component of the deep-femoral aggregate. This is not the complete deep femoral artery, an independently named perforator, or a new anatomical concept.',
      provenance:{...parent.provenance,recovered:false},validation:{status:'unvalidated',anatomicalReview:false},
    });
  }
  assert.equal(hash(partition.sort().join('\n')),hash(oldFaces.join('\n')),'Partition must reproduce every rendered parent triangle exactly');
  const first=new Set(meshFaces(scene.children.at(-2))),second=meshFaces(scene.children.at(-1));
  assert(second.every(f=>!first.has(f)),'Components must not overlap source faces');
  proofs.push({parent,parentBundle:parentBundles[0],triangles:oldFaces.length,partitionSha256:hash(oldFaces.join('\n')),parts,exactRenderedFacePartition:true});
}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const bytes=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
const roundtrip=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
for(const before of scene.children){const after=roundtrip.getObjectByName(before.name);assert.equal(hash(JSON.stringify(meshFaces(after))),hash(JSON.stringify(meshFaces(before))));assert.equal(hash(JSON.stringify(Array.from(after.geometry.attributes.normal.array))),hash(JSON.stringify(Array.from(before.geometry.attributes.normal.array))));}
const artifact={id:'femoral-components',url:`/models/bodyparts3d/femoral-components/femoral-components.glb?v=${hash(bytes)}`,bytes:bytes.length,sha256:hash(bytes),structures:4};
const result={version:1,sourceVersion:catalog.sourceVersion,license:catalog.license,credit:catalog.credit,coordinateSystem:catalog.coordinateSystem,parents,parentBundles,structures,bundles:[artifact],selectableIds:structures.map(s=>s.id),contextIds:[],regions:catalog.regions.filter(r=>r.id==='thigh'),coverage:{nerves:'Not included',organs:'Not included',vessels:'Source partition only; incomplete branch network and unverified junctions'},excluded:[],clinicalApproval:false};
const audit={schemaVersion:1,sourceCommit:'82ffc964f8830b375e089f154ae7ca0599c5fe44',evidence,supplementalEvidence:historicalSupplementalEvidence,proofs,artifact,modification:'Re-export of an exact triangle partition from existing root surfaces. Original source coordinates, faces and winding retained with established transform/Float32; normals recomputed. No new anatomy, fitting, mirroring, bridging or face deletion.',clinicalApproval:false};
const out='public/models/bodyparts3d/femoral-components',sourceOut='content/sources/femoral-components';
const outputs=[[out+'/catalog.json',JSON.stringify(result,null,2)+'\n'],['docs/femoral-component-source-audit.json',JSON.stringify(audit,null,2)+'\n'],[out+'/femoral-components.glb',bytes],...retained.map(s=>[sourceOut+'/'+s.file+'.obj',s.bytes])];
if(process.argv.includes('--check')) {for(const [path,value]of outputs)assert.equal(hash(await readFile(path)),hash(value),`Export output changed: ${path}`);}
else {await mkdir(out);await mkdir(sourceOut);for(const[path,value]of outputs)await writeFile(path,value,{flag:'wx'});}
console.log(JSON.stringify({parts:structures.length,parents:parents.length,triangles:proofs.reduce((n,p)=>n+p.triangles,0),...artifact,exactRenderedFacePartition:true,clinicalApproval:false}));
