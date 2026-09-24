import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const check = process.argv.includes('--check');
const dir = 'public/models/bodyparts3d/coronary-venous';
const definitions = [
  { fmaId: 'FMA4706', sourceName: 'coronary sinus', name: 'Coronary sinus', files: ['FJ2655'], color: '#718ba9' },
  { fmaId: 'FMA4714', sourceName: 'small cardiac vein', name: 'Small cardiac vein · source group', files: ['FJ2724', 'FJ2731'], color: '#93a7c4' },
];
const { catalog, records, policy, evidence } = await loadCurrentSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7088');
assert(parent && parent.sourceTree === 'partof' && parent.sources.length === 56);
const matrix = new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);
const scene = new Scene(), structures = [];
for (const definition of definitions) {
  const row = records.find((r) => r.tree === 'partof' && r.id === definition.fmaId);
  const isa = records.find((r) => r.tree === 'isa' && r.id === definition.fmaId);
  assert(row && isa);
  assert.equal(row.name, definition.sourceName);
  assert.deepEqual(row.files, definition.files);
  assert.deepEqual(isa.files, definition.files);
  policy.assertNoKnownHolds([row, isa]);
  const positions = [], indices = [], sources = [];
  for (const file of definition.files) {
    const source = parent.sources.find((s) => s.file === file);
    assert(source);
    const bytes = await readFile(`../work/bodyparts3d/partof/${file}.obj`);
    assert.equal(hash(bytes), source.sha256);
    const shape = sourceObjShape(bytes), topology = sourceTopology(shape);
    assert(shape.faces.every((face) => face.length === 3));
    assert(topology.closedOrientedManifold && topology.components.length === 1);
    for (const key of ['duplicateFaces', 'collapsedFaces', 'degenerateFaces', 'boundaryEdges', 'nonManifoldEdges', 'nonManifoldVertices', 'inconsistentWindingEdges'])
      assert.equal(topology[key], 0, `${file}: ${key}`);
    const offset = positions.length / 3;
    positions.push(...shape.vertices.flatMap((v) => new Vector3(...v).applyMatrix4(matrix).toArray()));
    indices.push(...shape.faces.flatMap((face) => face.map((i) => i + offset)));
    sources.push(source);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new Vector3());
  let anchor = new Vector3().fromBufferAttribute(geometry.attributes.position, 0);
  for (let i = 1; i < geometry.attributes.position.count; i++) {
    const candidate = new Vector3().fromBufferAttribute(geometry.attributes.position, i);
    if (candidate.distanceToSquared(center) < anchor.distanceToSquared(center)) anchor = candidate;
  }
  const id = `vm:anatomy:body:thorax:unpaired:vessel:${definition.sourceName.replaceAll(' ', '-')}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: definition.color, roughness: 0.65 }));
  mesh.name = definition.fmaId;
  mesh.userData = { structureId: id, fmaId: definition.fmaId, parentId: parent.id, sourceTree: 'partof', anatomicalReview: false };
  scene.add(mesh);
  structures.push({
    id, fmaId: definition.fmaId, name: definition.name, sourceName: definition.sourceName,
    system: 'vessels', category: 'vessel', laterality: 'unpaired', region: 'thorax', regions: ['thorax'],
    bundle: 'coronary-venous', nodeName: definition.fmaId, sourceTree: 'partof', sources, parentId: parent.id,
    bounds: { min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() },
    center: center.toArray(), anchor: anchor.toArray(),
    coverageNote: definition.fmaId === 'FMA4714'
      ? 'Two original source files retained as one small cardiac vein selection, not two independently named branches. No complete tree, junction, lumen, flow or patient correspondence is established.'
      : 'One original coronary sinus source surface. No opening, connected lumen, flow or patient correspondence is established.',
    provenance: { method: 'licensed-source-mesh', license: catalog.license, sourceVersion: catalog.sourceVersion, recovered: false },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
}
globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }); } };
const bytes = Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true }));
const loaded = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const meshes = [];
loaded.scene.traverse((object) => { if (object.isMesh) meshes.push(object); });
assert.equal(meshes.length, 2);
for (const [index, mesh] of meshes.entries()) {
  const original = scene.children[index];
  assert.equal(mesh.name, original.name);
  assert.deepEqual(Array.from(mesh.geometry.attributes.position.array), Array.from(original.geometry.attributes.position.array));
  assert.deepEqual(Array.from(mesh.geometry.index.array), Array.from(original.geometry.index.array));
}
const result = {
  version: 1, sourceVersion: catalog.sourceVersion, license: catalog.license, credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem, evidence, parent,
  regions: [{ id: 'thorax', name: 'Coronary venous source parts', description: 'Two source-defined selections within the heart; clinical validation pending.' }],
  structures, selectableIds: structures.map((s) => s.id), contextIds: [],
  bundles: [{ id: 'coronary-venous', url: `/models/bodyparts3d/coronary-venous/coronary-venous.glb?v=${hash(bytes)}`, bytes: bytes.length, sha256: hash(bytes), structures: 2 }],
  modification: 'Original indexed vertices and ordered faces preserved under the pinned source-to-scene transform and Float32 storage. Shading normals recomputed; no geometry repair or inferred connector.',
  clinicalApproval: false,
};
const json = JSON.stringify(result, null, 2) + '\n';
if (check) {
  assert.equal(hash(await readFile(`${dir}/coronary-venous.glb`)), hash(bytes));
  assert.equal((await readFile(`${dir}/catalog.json`, 'utf8')).replace(/\r\n/g, '\n'), json);
} else {
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/coronary-venous.glb`, bytes);
  await writeFile(`${dir}/catalog.json`, json);
}
console.log(JSON.stringify({ status: check ? 'verified' : 'exported', selections: 2, sourceFiles: 3, triangles: 2086, bundle: result.bundles[0], clinicalApproval: false }));
