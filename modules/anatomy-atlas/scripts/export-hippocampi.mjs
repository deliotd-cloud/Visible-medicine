import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Group, Mesh, MeshStandardMaterial, Matrix4, Vector3} from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {sourceObjShape} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';

// Source membership, not an inferred hippocampal-formation/subfield segmentation.
const definitions = [
  ['FMA72714','left hippocampus','FJ1759','left','f64b3cea9f760a352cb8981f6cb577700a66392d8a8395ffb45dfebdccee7344',980],
  ['FMA72713','right hippocampus','FJ1807','right','6ae0c7024c63059599eedabc36fe4650e5979d99ca7d8f9b8bd2389c89d6c5a4',1020],
];
const hash = b => createHash('sha256').update(b).digest('hex');
const baseBytes = await readFile('public/models/bodyparts3d/cerebral/catalog.json');
const base = JSON.parse(baseBytes);
const {catalog,records,policy} = await loadCurrentSourceHolds();
const parent = catalog.structures.find(s=>s.id===base.parent.id);
assert.deepEqual(parent,base.parent);
assert.deepEqual(catalog.coordinateSystem,base.coordinateSystem);
assert.equal(base.selectableIds.length,14);
const matrix = new Matrix4().fromArray(base.coordinateSystem.sourceToSceneColumnMajor);
const group = new Group(), structures = [], sourceReports = [];
for (const [fmaId,name,file,side,sha256,triangleCount] of definitions) {
  const definition=records.find(r=>r.tree==='partof'&&r.id===fmaId);
  assert.equal(definition.name,name);
  assert.deepEqual(definition.files,[file]);
  policy.assertNoKnownHolds([definition]);
  const source=parent.sources.find(s=>s.file===file);
  assert.equal(source.sha256,sha256);
  assert(!base.structures.some(s=>s.sources.some(p=>p.file===file)), 'Already independently represented');
  const bytes=await readFile('../work/bodyparts3d/partof/'+file+'.obj');
  assert.equal(hash(bytes),sha256);
  const topology=sourceTopology(sourceObjShape(bytes));
  assert.equal(topology.triangles,triangleCount);
  assert.equal(topology.components.length,1);
  assert.equal(topology.closedOrientedManifold,true);
  for(const key of ['duplicateFaces','collapsedFaces','degenerateFaces','boundaryEdges','nonManifoldEdges','nonManifoldVertices','inconsistentWindingEdges']) assert.equal(topology[key],0);
  sourceReports.push({tree:'partof',file,sha256,topology});
  const parts=[];
  new OBJLoader().parse(bytes.toString()).traverse(m=>{if(m.isMesh)parts.push(m.geometry.clone());});
  assert.equal(parts.length,1);
  let geometry=parts[0];
  geometry.deleteAttribute('normal'); geometry.deleteAttribute('uv');
  geometry=mergeVertices(geometry,1e-6);
  geometry.computeVertexNormals(); geometry.applyMatrix4(matrix); geometry.computeBoundingBox();
  const box=geometry.boundingBox, center=box.getCenter(new Vector3());
  assert(side==='left'?box.min.x>0:box.max.x<0);
  let anchor=center.clone(), distance=Infinity;
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++) {
    const p=new Vector3().fromBufferAttribute(positions,i),d=p.distanceToSquared(center);
    if(d<distance){anchor=p;distance=d;}
  }
  const id=`vm:anatomy:body:head-neck:${side}:organ:${name.replaceAll(' ','-')}`;
  const mesh=new Mesh(geometry,new MeshStandardMaterial());
  mesh.name=fmaId;
  mesh.userData={structureId:id,fmaId,studyParentId:parent.id,sourceRelationship:'parent-component'};
  group.add(mesh);
  structures.push({id,fmaId,name:name[0].toUpperCase()+name.slice(1),sourceName:name,
    system:'nerves',category:'organ',laterality:side,group:'hippocampus',region:'head-neck',regions:['head-neck'],
    bundle:'hippocampi',nodeName:fmaId,bounds:{min:box.min.toArray(),max:box.max.toArray()},center:center.toArray(),anchor:anchor.toArray(),
    sourceTree:'partof',sources:[source],studyParentId:parent.id,sourceRelationship:'parent-component',
    coverageNote:'Original coarse hippocampal surface from the brain aggregate; not separate CA fields, dentate gyrus, subiculum or a patient segmentation. Source shape and position retained; radiologist review pending.',
    provenance:{method:'licensed-source-mesh',license:base.license,sourceVersion:'4.0',recovered:false},
    validation:{status:'unvalidated',anatomicalReview:false}});
}
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const bytes=Buffer.from(await new GLTFExporter().parseAsync(group,{binary:true}));
const output='public/models/bodyparts3d/hippocampi';
const manifest={version:1,sourceVersion:'4.0',license:base.license,credit:base.credit,
  baseCatalogSha256:hash(baseBytes),coordinateSystem:base.coordinateSystem,parent:base.parent,
  baseStructures:base.structures,baseBundles:base.bundles,baseSelectableIds:base.selectableIds,
  structures,selectableIds:structures.map(s=>s.id),sourceReports,
  bundles:[{id:'hippocampi',url:`/models/bodyparts3d/hippocampi/hippocampi.glb?v=${hash(bytes)}`,bytes:bytes.length,sha256:hash(bytes),structures:2}],
  sourceReferences:['https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html','https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html'],
  clinicalApproval:false};
await mkdir(output,{recursive:true});
await writeFile(output+'/hippocampi.glb',bytes);
await writeFile(output+'/catalog.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({structures:2,triangles:2000,bytes:bytes.length,sha256:hash(bytes),clinicalApproval:false}));
