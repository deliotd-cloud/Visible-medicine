import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BufferGeometry,Float32BufferAttribute,Matrix4,Mesh,MeshStandardMaterial,Scene,Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { limbicLandmarkSources } from './limbic-landmark-sources.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { preflightCurrentSourceHolds } from './current-source-holds.mjs';
const candidates=limbicLandmarkSources.filter(s=>s.status==='candidate');
await preflightCurrentSourceHolds(candidates.map(s=>({tree:'isa',id:s.id,name:s.name,files:s.files.map(f=>f.file)})));
const hash=b=>createHash('sha256').update(b).digest('hex'),check=process.argv.includes('--check');
const auditBytes=await readFile('docs/limbic-landmark-source-audit.json');
assert.equal(hash(auditBytes),'2b29686d350ca29d88c67c7a44c3e143033deea35f15df0a66b90c758a82f69c');
const audit=JSON.parse(auditBytes),{catalog,evidence}=await loadSourceHolds();assert.deepEqual(audit.evidence,evidence);
const scene=new Scene(),matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor),structures=[],expected=new Map();
const originals=[];
for(const candidate of limbicLandmarkSources) {
  const parts=[];
  for(const source of candidate.files){
    const retainedDir=candidate.status==='held'?'content/prototypes/stria-terminalis-review':'content/sources/limbic-landmarks';
    const bytes=await readFile(check?`${retainedDir}/${source.file}.obj`:`../work/bodyparts3d/isa/${source.file}.obj`);assert.equal(hash(bytes),source.sha256);
    originals.push({...source,bytes,held:candidate.status==='held'});
    if(candidate.status==='held')continue;
    const shape=sourceObjShape(bytes),points=[],lookup=new Map();
    const remap=shape.vertices.map(p=>{const key=p.join(',');if(!lookup.has(key)){lookup.set(key,points.length);points.push(p);}return lookup.get(key);});
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new Float32BufferAttribute(points.flatMap(p=>new Vector3(...p).applyMatrix4(matrix).toArray()),3));
    geometry.setIndex(shape.faces.flatMap(f=>f.map(i=>remap[i])));geometry.computeVertexNormals();parts.push(geometry);
  }
  if(candidate.status==='held')continue;
  // Do not weld the distinct lamina source files together at their point contact.
  const geometry=mergeGeometries(parts,false);assert(geometry);geometry.computeBoundingBox();
  const center=geometry.boundingBox.getCenter(new Vector3());
  const id=`vm:anatomy:body:head-neck:${candidate.side}:organ:${candidate.name.replaceAll(' ','-')}`;
  const mesh=new Mesh(geometry,new MeshStandardMaterial({color:'#e3c990',roughness:.92}));mesh.name=candidate.id;
  mesh.userData={structureId:id,fmaId:candidate.id,sourceTree:'isa',sourceFiles:candidate.files,anatomicalReview:false};scene.add(mesh);
  const positions=Array.from(geometry.attributes.position.array),vertices=Array.from({length:positions.length/3},(_,i)=>positions.slice(i*3,i*3+3));
  const anchor=vertices.reduce((best,p)=>new Vector3(...p).distanceToSquared(center)<new Vector3(...best).distanceToSquared(center)?p:best,vertices[0]);
  expected.set(mesh.name,{positions,indices:Array.from(geometry.index.array),normals:Array.from(geometry.attributes.normal.array),userData:mesh.userData});
  const qualification=candidate.id==='FMA61975'?'Two original lamina files touch at one source-coordinate vertex; their individual normals remain separate. This is not a reconstructed continuous sheet.'
    :candidate.id==='FMA61842'?'The original septum-of-telencephalon definition has two components. It does not independently identify septal nuclei, septum verum or a validated septum-pellucidum subdivision.'
    :'Coarse source-labelled stria medullaris envelope, not individual fibres or tractography. The source origin is not a validated midsagittal plane; slight zero-X crossing of the left source is retained, not repaired.';
  structures.push({id,fmaId:candidate.id,name:candidate.name[0].toUpperCase()+candidate.name.slice(1),sourceName:candidate.name,
    system:'nerves',category:'organ',laterality:candidate.side,region:'head-neck',regions:['head-neck'],bundle:'limbic-landmarks',nodeName:candidate.id,sourceTree:'isa',sources:candidate.files,
    bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()},center:center.toArray(),anchor,
    coverageNote:qualification+' Every ordered source triangle and position is retained. Stria terminalis is withheld for source defects. Anatomical relationships, laterality and clinical accuracy require review; no patient registration or complete limbic circuit is supplied.',
    provenance:{method:'licensed-source-mesh',license:catalog.license,sourceVersion:catalog.sourceVersion,recovered:false},
    validation:{status:'unvalidated',anatomicalReview:false}});
}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const bytes=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let count=0;
loaded.scene.traverse(mesh=>{if(!mesh.isMesh)return;const before=expected.get(mesh.name);assert(before);
  assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),before.positions);
  assert.deepEqual(Array.from(mesh.geometry.index.array),before.indices);
  assert.deepEqual(Array.from(mesh.geometry.attributes.normal.array),before.normals);
  assert.deepEqual(mesh.userData,{name:mesh.name,...before.userData});count++;});assert.equal(count,4);
const contextIds=['FMA258714','FMA258716','FMA72924','FMA72925','FMA86464','FMA61961','FMA61970'];
const contextRecords=catalog.structures.filter(s=>contextIds.includes(s.fmaId));assert.equal(contextRecords.length,7);
const result={version:1,sourceVersion:catalog.sourceVersion,license:catalog.license,credit:catalog.credit,coordinateSystem:catalog.coordinateSystem,evidence,
 auditSha256:hash(auditBytes),structures,contextRecords,contextBundles:catalog.bundles.filter(b=>contextRecords.some(s=>s.bundle===b.id)),
 bundles:[{id:'limbic-landmarks',url:`/models/bodyparts3d/limbic-landmarks/limbic-landmarks.glb?v=${hash(bytes)}`,bytes:bytes.length,sha256:hash(bytes),structures:4}],
 modification:'Exact-coordinate indexing and normals within each original file; no cross-file welding. Established display transform and Float32 storage. Every triangle retained in source file/face order; no fitting, reflection, smoothing, bridging or face deletion.',clinicalApproval:false};
const path='public/models/bodyparts3d/limbic-landmarks',text=JSON.stringify(result,null,2)+'\n';
if(check){assert.equal(hash(await readFile(path+'/limbic-landmarks.glb')),hash(bytes));assert.equal((await readFile(path+'/catalog.json','utf8')).replace(/\r\n/g,'\n'),text);}
else{await mkdir(path);await writeFile(path+'/limbic-landmarks.glb',bytes,{flag:'wx'});await writeFile(path+'/catalog.json',text,{flag:'wx'});}
for(const held of [false,true]){
 const dir=held?'content/prototypes/stria-terminalis-review':'content/sources/limbic-landmarks';
 if(!check)await mkdir(dir);
 for(const source of originals.filter(s=>s.held===held))if(check)assert.deepEqual(await readFile(`${dir}/${source.file}.obj`),source.bytes);else await writeFile(`${dir}/${source.file}.obj`,source.bytes,{flag:'wx'});
}
console.log(JSON.stringify({selections:4,triangles:8042,originalFiles:5,heldFiles:2,...result.bundles[0],clinicalApproval:false}));
