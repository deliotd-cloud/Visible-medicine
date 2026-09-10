import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = new URL('../', import.meta.url), check = process.argv.includes('--check');
const read = (path) => readFile(new URL(path, root));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = await read('content/prototypes/um-knee/knee.glb');
assert.equal(hash(source), 'f4199fc6fdaed1a7ba2da1ae76bff266f0baf4e0972e0c79f9975fc526d17b48');
const reportBytes = await read('content/prototypes/um-knee/source-audit.json');
assert.equal(hash(reportBytes), '4c7f705392f57ac7ab22d4fd0cdfff95e956ca88686bc640521a1203006548d8');
const report = JSON.parse(reportBytes);
// Change presentation metadata only. Keep the entire binary geometry chunk exact.
const jsonLength = source.readUInt32LE(12);
const gltf = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
for (const node of gltf.nodes.filter((n) => n.mesh !== undefined)) {
  assert.equal(node.extras.prototypeOnly, true);
  node.extras.prototypeOnly = false;
  node.extras.presentationStatus = 'unvalidated-independent-reference';
  node.extras.registeredToBodyParts3D = false;
}
const json = Buffer.from(JSON.stringify(gltf));
const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(padded);
const bin = source.subarray(20 + jsonLength);
const header = Buffer.alloc(20); source.copy(header, 0, 0, 20);
header.writeUInt32LE(20 + padded.length + bin.length, 8);
header.writeUInt32LE(padded.length, 12);
const glb = Buffer.concat([header, padded, bin]);
const model = await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '');
const meshes = new Map(); model.scene.traverse((m) => { if (m.isMesh) meshes.set(m.name, m); });
assert.equal(meshes.size, 15);
const structures = report.structures.map((s) => {
  const mesh = meshes.get(s.slug); assert(mesh);
  assert.equal(mesh.userData.anatomicalReview, false);
  assert.equal(mesh.geometry.index.count / 3, s.display.triangles);
  const center = s.bounds.min.map((v, i) => (v + s.bounds.max[i]) / 2);
  const p = mesh.geometry.getAttribute('position');
  let distance = Infinity, anchor;
  for (let i = 0; i < p.count; i++) {
    const point = [p.getX(i), p.getY(i), p.getZ(i)];
    const d = point.reduce((sum, v, k) => sum + (v - center[k]) ** 2, 0);
    if (d < distance) { distance = d; anchor = point; }
  }
  return {
    id: s.id, slug: s.slug, name: s.name, sourceName: s.sourceName,
    fmaId: null, laterality: s.laterality, tissue: s.tissue,
    bounds: s.bounds, center, anchor, nodeName: s.slug,
    sources: [{ file: s.sourceFile, sha256: s.sha256 }],
    triangles: s.display.triangles, omittedSourceFaces: s.display.omittedSourceFaces,
    validation: s.validation,
  };
});
const catalog = {
  version: 1, specimenId: 'um-5t6tz7-v1-2:knee', status: 'unvalidated-independent-reference',
  source: report.source, sourceBasis: report.sourceBasis,
  displayTransformColumnMajor: report.displayTransformColumnMajor,
  registeredToBodyParts3D: false, imagingRegistration: null,
  prototypeSha256: hash(source), geometryBinarySha256: hash(bin),
  structures,
  bundle: { id: 'um-knee', url: '/models/um-knee/knee.glb', bytes: glb.length, sha256: hash(glb), structures: 15 },
};
await mkdir(new URL('public/models/um-knee/', root), { recursive: true });
for (const [name, bytes] of [['knee.glb', glb], ['catalog.json', Buffer.from(JSON.stringify(catalog, null, 2) + '\n')]]) {
  const path = `public/models/um-knee/${name}`;
  if (check) assert.deepEqual(await read(path), bytes, `Stale ${path}`);
  else await writeFile(new URL(path, root), bytes);
}
console.log(JSON.stringify({ check, structures: structures.length, triangles: report.glb.triangles, geometryBinaryUnchanged: true, bytes: glb.length, sha256: hash(glb) }));
