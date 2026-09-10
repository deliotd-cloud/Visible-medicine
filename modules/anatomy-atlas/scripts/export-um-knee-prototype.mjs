// Offline, pinned-source ingestion. No DICOM download, registration to BodyParts3D,
// network calls, public export, source smoothing or anatomical relabelling.
// Only exactly zero-area source triangles are omitted from the display derivative.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = resolve(import.meta.dirname, '..');
const cache = resolve(root, '../work/um-lower-limb-v1-2');
const destination = resolve(root, 'content/prototypes/um-knee');
const rights = resolve(root, 'LICENSES/um-lower-limb-v1-2');
const check = process.argv.includes('--check');
const updateDerived = process.argv.includes('--update-derived');
const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const archiveHash = '0c6c7fa81329dba949e00c7d99de37afef0352368eb5b386eb8034ec0b66ec86';
const archiveMd5 = 'd7f066d2fd3fc21c21f64ad3d5a985fd';
const definitions = [
  ['femur', 'Bone_Femur', 'Femur', 'skeleton'],
  ['tibia', 'Bone_Tibia', 'Tibia', 'skeleton'],
  ['fibula', 'Bone_Fibula', 'Fibula', 'skeleton'],
  ['patella', 'Bone_Patella', 'Patella', 'skeleton'],
  ['femoral-cartilage', 'Cartilage_Femur Distal ', 'Distal femoral cartilage', 'cartilage'],
  ['tibial-cartilage', 'Cartilage_Tibia ', 'Tibial cartilage (source group)', 'cartilage'],
  ['patellar-cartilage', 'Cartilage_Patella', 'Patellar cartilage', 'cartilage'],
  ['acl', 'Ligament_ACL', 'Anterior cruciate ligament', 'ligament'],
  ['pcl', 'Ligament_PCL', 'Posterior cruciate ligament', 'ligament'],
  ['mcl', 'Ligament_MCL', 'Medial collateral ligament', 'ligament'],
  ['lcl', 'Ligament_LCL', 'Lateral collateral ligament', 'ligament'],
  ['patellar-ligament', 'Ligament_Patella ', 'Patellar ligament', 'ligament'],
  ['meniscus-group', 'Meniscus_Knee', 'Knee meniscus (source group)', 'meniscus'],
  ['quadriceps-tendon', 'Tendon_Quadriceps ', 'Quadriceps tendon', 'tendon'],
  ['popliteus', 'Muscle_Popliteus', 'Popliteus', 'muscle'],
];
const rawMetadata = await readFile(resolve(check ? rights : cache, 'dataverse.json'));
const metadata = JSON.parse(rawMetadata), version = metadata.datasetVersion;
assert.equal(metadata.persistentUrl, 'https://doi.org/10.22452/RD/5T6TZ7');
assert.deepEqual([version.versionNumber, version.versionMinorNumber, version.versionState], [1, 2, 'RELEASED']);
assert.deepEqual([version.license.name, version.license.uri], ['CC0 1.0', 'http://creativecommons.org/publicdomain/zero/1.0']);
const asset = version.files.find((f) => f.dataFile.id === 596);
assert.equal(asset.restricted, false);
assert.equal(asset.label, 'Final Model STL files.zip');
assert.deepEqual(asset.dataFile.checksum, { type: 'MD5', value: archiveMd5 });
const readme = await readFile(resolve(check ? rights : cache, 'readme.txt'));
assert.equal(digest(readme, 'md5'), 'd938e8bb8d460acd0ba7bbceefb93901');
const sourceCatalogHash = digest(await readFile(resolve(root, 'public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(sourceCatalogHash, '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
let archive, inventory;
if (!check) {
  archive = resolve(cache, 'model-stl.zip');
  const bytes = await readFile(archive);
  assert.equal(bytes.length, asset.dataFile.filesize);
  assert.equal(digest(bytes), archiveHash);
  assert.equal(digest(bytes, 'md5'), archiveMd5);
  inventory = execFileSync('tar', ['-tf', archive], { encoding: 'utf8' }).trim().split(/\r?\n/);
  assert.equal(new Set(inventory).size, inventory.length);
  assert(inventory.every((p) => p.startsWith('Final Model STL files/') && !p.includes('..') && !p.includes('\\') && !p.includes(':')));
  assert.equal(inventory.filter((p) => p.endsWith('.stl')).length, 67);
} else {
  inventory = JSON.parse(await readFile(resolve(destination, 'source-audit.json'))).archiveEntries;
}

function parseSurface(bytes) {
  assert(bytes.length >= 84);
  const header = bytes.subarray(0, 80).toString().replace(/\0/g, '').trim();
  assert.equal(header, '3D Slicer output. SPACE=LPS');
  const triangles = bytes.readUInt32LE(80);
  assert(triangles > 0 && triangles < 2_000_000);
  assert.equal(bytes.length, 84 + triangles * 50, 'Strict binary STL size');
  const vertices = [], indices = [], lookup = new Map(), edges = new Map();
  let degenerate = 0, signedVolume = 0;
  const zeroAreaFaces = [];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < triangles; i++) {
    const face = [];
    for (let j = 0; j < 3; j++) {
      const p = [0, 1, 2].map((k) => bytes.readFloatLE(84 + 50 * i + 12 + 12 * j + 4 * k));
      assert(p.every(Number.isFinite));
      for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
      const key = p.join(',');
      if (!lookup.has(key)) { lookup.set(key, vertices.length); vertices.push(p); }
      face.push(lookup.get(key));
    }
    indices.push(...face);
    const [a, b, c] = face.map((n) => new Vector3(...vertices[n]));
    const cross = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    if (cross.lengthSq() === 0) { degenerate++; zeroAreaFaces.push(i); }
    signedVolume += a.dot(new Vector3().crossVectors(b, c)) / 6;
    for (let j = 0; j < 3; j++) {
      const a = face[j], b = face[(j + 1) % 3], key = a < b ? `${a}/${b}` : `${b}/${a}`;
      const edge = edges.get(key) ?? { count: 0, orientation: 0 };
      edge.count++; edge.orientation += a < b ? 1 : -1; edges.set(key, edge);
    }
  }
  // Exact-position connectivity only; components are reported, not anatomically named.
  const parents = vertices.map((_, i) => i);
  const find = (v) => { while (parents[v] !== v) { parents[v] = parents[parents[v]]; v = parents[v]; } return v; };
  for (let i = 0; i < indices.length; i += 3) for (const offset of [1, 2]) parents[find(indices[i + offset])] = find(indices[i]);
  const components = new Map();
  for (let i = 0; i < indices.length; i += 3) { const id = find(indices[i]); components.set(id, (components.get(id) ?? 0) + 1); }
  return { vertices, indices, stats: {
    header, triangles, vertices: vertices.length, degenerateTriangles: degenerate, zeroAreaFaces,
    boundaryEdges: [...edges.values()].filter((e) => e.count === 1).length,
    nonManifoldEdges: [...edges.values()].filter((e) => e.count > 2).length,
    inconsistentWindingEdges: [...edges.values()].filter((e) => e.count === 2 && e.orientation !== 0).length,
    components: [...components.values()].sort((a, b) => b - a), signedVolumeSourceUnitsCubed: signedVolume,
    sourceBounds: { min, max },
  } };
}

const scene = new Group(), records = [], originals = [], expected = new Map();
const colors = { skeleton: '#c5aa79', cartilage: '#a2cac6', ligament: '#d4c28f', meniscus: '#729ea8', tendon: '#e0d4ad', muscle: '#b35c50' };
for (const [slug, stem, name, tissue] of definitions) {
  const file = `Segmentation_${stem}.stl`, entry = `Final Model STL files/${file}`;
  assert(inventory.includes(entry));
  // Extraction to stdout only: archive names never select a filesystem write path.
  const bytes = check ? await readFile(resolve(destination, 'source', file)) : execFileSync('tar', ['-xOf', archive, entry], { maxBuffer: 80 * 1024 * 1024 });
  const { vertices, indices, stats } = parseSurface(bytes);
  const omitted = new Set(stats.zeroAreaFaces), used = new Map(), displayVertices = [], displayIndices = [];
  for (let i = 0; i < indices.length; i += 3) {
    if (omitted.has(i / 3)) continue;
    for (const old of indices.slice(i, i + 3)) {
      if (!used.has(old)) { used.set(old, displayVertices.length); displayVertices.push(vertices[old]); }
      displayIndices.push(used.get(old));
    }
  }
  // Every retained coordinate and the relative order/winding of source triangles
  // survive. Unreferenced vertices from the zero-area islands are not exported.
  assert.equal(displayIndices.length / 3, stats.triangles - stats.degenerateTriangles);
  const displayEdges = new Map();
  for (let i = 0; i < displayIndices.length; i += 3) for (let j = 0; j < 3; j++) {
    const a = displayIndices[i + j], b = displayIndices[i + (j + 1) % 3];
    const key = a < b ? `${a}/${b}` : `${b}/${a}`;
    displayEdges.set(key, (displayEdges.get(key) ?? 0) + 1);
  }
  assert([...displayEdges.values()].every((count) => count === 2), 'Clean display must retain closed manifold edges');
  const geometry = new BufferGeometry();
  // LPS -> viewer: left +X, superior +Y, anterior +Z. Fixed 0.01 display
  // scale only. Do not translate, warp or fit this subject to BodyParts3D.
  const positions = displayVertices.flatMap(([x, y, z]) => [x * 0.01, z * 0.01, -y * 0.01]);
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(displayIndices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  let maxSourceCoordinateError = 0;
  const renderedPositions = geometry.getAttribute('position');
  for (let i = 0; i < displayVertices.length; i++) {
    const original = displayVertices[i];
    const restored = [renderedPositions.getX(i) / 0.01, -renderedPositions.getZ(i) / 0.01, renderedPositions.getY(i) / 0.01];
    maxSourceCoordinateError = Math.max(maxSourceCoordinateError, ...restored.map((v, k) => Math.abs(v - original[k])));
  }
  assert(maxSourceCoordinateError < 0.0001);
  const id = `vm:reference:um-5t6tz7-v1-2:knee:${slug}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: colors[tissue], roughness: 0.72 }));
  mesh.name = slug;
  mesh.userData = { structureId: id, sourceFile: file, sourceSha256: digest(bytes), sourceLicense: 'CC0-1.0', prototypeOnly: true, anatomicalReview: false };
  scene.add(mesh);
  expected.set(slug, { positions: geometry.getAttribute('position').array, indices: displayIndices, userData: mesh.userData });
  originals.push({ file, bytes });
  records.push({ id, slug, name, sourceName: stem, tissue, sourceFile: file, sha256: digest(bytes), bytes: bytes.length,
    fmaId: null, laterality: 'right-source-report', sourceSpace: 'LPS',
    validation: { status: 'unvalidated', anatomicalReview: false, registeredToBodyParts3D: false },
    bounds: { min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() }, ...stats,
    display: { triangles: displayIndices.length / 3, vertices: displayVertices.length, omittedSourceFaces: stats.zeroAreaFaces,
      omissionCriterion: 'exact-zero-cross-product-in-original-STL-coordinates', boundaryEdges: 0, nonManifoldEdges: 0, maxSourceCoordinateError } });
}
globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }); } };
const glb = Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true }));
const reloaded = await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '');
const seen = new Set();
reloaded.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const source = expected.get(mesh.name); assert(source && !seen.has(mesh.name)); seen.add(mesh.name);
  assert.deepEqual(mesh.userData, { name: mesh.name, ...source.userData });
  assert.deepEqual(Array.from(mesh.geometry.index.array), source.indices);
  assert.deepEqual(Array.from(mesh.geometry.getAttribute('position').array), Array.from(source.positions));
  assert(Array.from(mesh.geometry.getAttribute('normal').array).every(Number.isFinite));
});
assert.equal(seen.size, 15);
const report = {
  schemaVersion: 1, prototypeOnly: true, admitted: false,
  source: { doi: metadata.persistentUrl, version: '1.2', fileId: 596, archiveSha256: archiveHash, archiveMd5,
    metadataSha256: digest(rawMetadata), readmeSha256: digest(readme), license: 'CC0-1.0',
    credit: 'Jeevaraaj N Vivekanandan and Juliana Binti Usman, Universiti Malaya, 2026. DOI:10.22452/RD/5T6TZ7, version 1.2.' },
  sourceBasis: 'STL headers explicitly declare LPS; original float32 positions and triangle order retained. Source README identifies right-limb acquisition. Display scaling is not scan registration or a calibrated measurement.',
  displayTransformColumnMajor: [0.01, 0, 0, 0, 0, 0, -0.01, 0, 0, 0.01, 0, 0, 0, 0, 0, 1],
  bodyParts3dCatalogSha256: sourceCatalogHash, registeredToBodyParts3D: false,
  dicomDownloaded: false, segmentationDownloaded: false, archiveEntries: inventory,
  modifications: ['Selected 15 source files from 67 STL surfaces', 'Exact-coordinate vertex welding for indexing and smooth display normals', 'Omitted only individually recorded exactly zero-area source triangles and their unreferenced vertices; original STL bytes preserved', 'Uniform display scale and LPS-to-viewer axis rotation', 'Original solid tissue colours and local specimen-scoped IDs; no FMA crosswalk inferred'],
  glb: { file: 'knee.glb', bytes: glb.length, sha256: digest(glb), structures: records.length, sourceTriangles: records.reduce((sum, r) => sum + r.triangles, 0), triangles: records.reduce((sum, r) => sum + r.display.triangles, 0), roundTripFloat32PositionsExact: true },
  structures: records,
};
const reportBytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
if (check) {
  assert.deepEqual(await readFile(resolve(destination, 'source-audit.json')), reportBytes);
  assert.deepEqual(await readFile(resolve(destination, 'knee.glb')), glb);
} else {
  await mkdir(resolve(destination, 'source'), { recursive: true });
  await mkdir(rights, { recursive: true });
  const preserve = async (path, bytes) => {
    if (updateDerived) assert.deepEqual(await readFile(path), bytes, 'Never overwrite original source evidence');
    else await writeFile(path, bytes, { flag: 'wx' });
  };
  for (const original of originals) await preserve(resolve(destination, 'source', original.file), original.bytes);
  await preserve(resolve(rights, 'dataverse.json'), rawMetadata);
  await preserve(resolve(rights, 'readme.txt'), readme);
  await writeFile(resolve(destination, 'source-audit.json'), reportBytes, { flag: updateDerived ? 'w' : 'wx' });
  await writeFile(resolve(destination, 'knee.glb'), glb, { flag: updateDerived ? 'w' : 'wx' });
}
console.log(JSON.stringify({ checked: check, ...report.glb, ...(check ? {} : { surfaces: records.map((r) => ({ slug: r.slug, triangles: r.triangles, components: r.components, boundaryEdges: r.boundaryEdges, nonManifoldEdges: r.nonManifoldEdges, degenerateTriangles: r.degenerateTriangles, inconsistentWindingEdges: r.inconsistentWindingEdges })) }) }, null, 2));
