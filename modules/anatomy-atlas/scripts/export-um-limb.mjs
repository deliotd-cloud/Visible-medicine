// Offline extension of the preserved UM specimen. No patient scans, fitting,
// mirroring, smoothing, guessed subdivisions or nonzero-face removal.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = resolve(import.meta.dirname, '..'), check = process.argv.includes('--check');
const path = (...parts) => resolve(root, ...parts);
const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const knee = JSON.parse(await readFile(path('content/prototypes/um-knee/source-audit.json')));
const metadataBytes = await readFile(path('LICENSES/um-lower-limb-v1-2/dataverse.json'));
assert.equal(hash(metadataBytes), knee.source.metadataSha256);
const metadata = JSON.parse(metadataBytes), version = metadata.datasetVersion;
assert.deepEqual([version.versionNumber, version.versionMinorNumber, version.license.name], [1, 2, 'CC0 1.0']);
assert.equal(version.files.find((f) => f.dataFile.id === 596).restricted, false);
const archive = path('../work/um-lower-limb-v1-2/model-stl.zip');
if (!check) {
  const bytes = await readFile(archive);
  assert.equal(hash(bytes), knee.source.archiveSha256);
  assert.equal(hash(bytes, 'md5'), knee.source.archiveMd5);
}
const supplied = knee.archiveEntries.filter((s) => s.endsWith('.stl'));
const oldFiles = new Set(knee.structures.map((s) => s.sourceFile));
const entries = supplied.filter((s) => !oldFiles.has(s.split('/').at(-1)));
assert.equal(entries.length, 52);
const legMuscles = new Set(['Extensor Digitorum Longus', 'Extensor Hallucis Longus', 'Flexor Digitorum Longus', 'Flexor Hallucis Longus', 'Gastrocnemius Lateral', 'Gastrocnemius Medial', 'Peroneus Longus', 'Soleus', 'Tibialis Anterior', 'Tibialis Posterior']);
const footMuscles = new Set(['Abductor Digiti Minimi', 'Abductor Hallucis', 'Extensor Digitorum Brevis', 'Flexor Digitorum Brevis', 'Quadratus Plantae']);
const names = {
  'Illiacus': 'Iliacus', 'Quadratis Femoris': 'Quadratus femoris',
  'Bicep Femoris Longhead': 'Biceps femoris — long head', 'Bicep Femoris Shorthead': 'Biceps femoris — short head',
  'Peroneus Longus': 'Fibularis (peroneus) longus',
  'Gastrocnemius Lateral': 'Gastrocnemius — lateral head', 'Gastrocnemius Medial': 'Gastrocnemius — medial head',
  'Archilles': 'Calcaneal (Achilles) tendon', 'Femur Head': 'Femoral head cartilage',
  'Pelvis': 'Pelvic bone surface (source group)', 'Phalanges': 'Foot bone group (source: Phalanges)',
};
const slugNames = { Illiacus: 'iliacus', 'Quadratis Femoris': 'quadratus-femoris', 'Bicep Femoris Longhead': 'biceps-femoris-long-head', 'Bicep Femoris Shorthead': 'biceps-femoris-short-head', Archilles: 'achilles-tendon', 'Femur Head': 'femoral-head-cartilage', Pelvis: 'pelvis-group', Phalanges: 'foot-bone-group' };
const materials = { skeleton: '#c5aa79', muscle: '#b35c50', cartilage: '#a2cac6', tendon: '#e0d4ad' };
const hipMuscles = new Set(['Gluteus Maximus', 'Gluteus Medius', 'Gluteus Minimus', 'Illiacus', 'Inferior Gemellus', 'Superior Gemellus', 'Obturator Externus', 'Obturator Internus', 'Piriformis', 'Psoas Major', 'Quadratis Femoris', 'Tensor Fasciae Latae']);
const groups = Object.fromEntries(['hip-thigh', 'thigh', 'leg', 'foot'].map((id) => [id, new Group()]));
const records = [], audits = [], originals = [];

for (const entry of entries) {
  assert(entry.startsWith('Final Model STL files/') && !entry.includes('..') && !entry.includes('\\') && !entry.includes(':'));
  const file = entry.split('/').at(-1);
  const bytes = check ? await readFile(path('content/sources/um-limb', file)) : execFileSync('tar', ['-xOf', archive, entry], { maxBuffer: 40 * 1024 * 1024 });
  assert(bytes.length >= 84);
  assert.equal(bytes.subarray(0, 80).toString().replace(/\0/g, '').trim(), '3D Slicer output. SPACE=LPS');
  const sourceTriangles = bytes.readUInt32LE(80);
  assert(sourceTriangles > 0 && sourceTriangles < 2_000_000);
  assert.equal(bytes.length, 84 + sourceTriangles * 50);
  const [, type, labelRaw] = /^Segmentation_(Bone|Muscle|Cartilage|Tendon)_(.+)\.stl$/.exec(file) ?? [];
  assert(type && labelRaw);
  const label = labelRaw.trim(), slug = slugNames[label] ?? label.toLowerCase().replaceAll(' ', '-');
  const tissue = { Bone: 'skeleton', Muscle: 'muscle', Cartilage: 'cartilage', Tendon: 'tendon' }[type];
  const region = type === 'Bone' ? (label === 'Pelvis' ? 'hip-thigh' : 'foot') : type === 'Tendon' || legMuscles.has(label) ? 'leg' : footMuscles.has(label) ? 'foot' : 'hip-thigh';
  const bundleRegion = region === 'hip-thigh' && type === 'Muscle' && !hipMuscles.has(label) ? 'thigh' : region;
  const displayName = names[label] ?? (label[0] + label.slice(1).toLowerCase());
  const positions = [], indices = [], vertexMap = new Map(), sourcePoints = [], omittedSourceFaces = [];
  for (let f = 0; f < sourceTriangles; f++) {
    const points = [0, 1, 2].map((v) => [0, 1, 2].map((k) => bytes.readFloatLE(84 + 50 * f + 12 + v * 12 + k * 4)));
    assert(points.flat().every(Number.isFinite));
    const [a, b, c] = points, u = b.map((v, k) => v - a[k]), w = c.map((v, k) => v - a[k]);
    const cross = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (cross.every((v) => v === 0)) { omittedSourceFaces.push(f); continue; }
    for (const point of points) {
      const key = point.join(',');
      if (!vertexMap.has(key)) {
        vertexMap.set(key, positions.length / 3); sourcePoints.push(point);
        positions.push(point[0] * .01, point[2] * .01, -point[1] * .01);
      }
      indices.push(vertexMap.get(key));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  // Opposing incident faces can cancel a smoothed vertex normal. Use an actual
  // incident source-face direction there, not GLTFExporter's arbitrary fallback.
  const normal = geometry.getAttribute('normal'), zeroNormalVertices = [];
  for (let i = 0; i < normal.count; i++) if (Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) < 1e-12) zeroNormalVertices.push(i);
  const pendingNormals = new Set(zeroNormalVertices);
  for (let i = 0; i < indices.length && pendingNormals.size; i += 3) {
    const face = indices.slice(i, i + 3);
    if (!face.some((v) => pendingNormals.has(v))) continue;
    const [a, b, c] = face.map((v) => sourcePoints[v]), u = b.map((v, k) => v - a[k]), w = c.map((v, k) => v - a[k]);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], length = Math.hypot(...n);
    assert(length > 0);
    for (const v of face) if (pendingNormals.delete(v)) normal.setXYZ(v, n[0] / length, n[2] / length, -n[1] / length);
  }
  assert.equal(pendingNormals.size, 0);
  const p = geometry.getAttribute('position'), min = geometry.boundingBox.min.toArray(), max = geometry.boundingBox.max.toArray();
  const center = min.map((v, i) => (v + max[i]) / 2);
  let distance = Infinity, anchor, coordinateError = 0;
  for (let i = 0; i < p.count; i++) {
    const point = [p.getX(i), p.getY(i), p.getZ(i)], restored = [point[0] / .01, -point[2] / .01, point[1] / .01];
    coordinateError = Math.max(coordinateError, ...restored.map((v, k) => Math.abs(v - sourcePoints[i][k])));
    const d = point.reduce((sum, v, k) => sum + (v - center[k]) ** 2, 0);
    if (d < distance) { distance = d; anchor = point; }
  }
  assert(coordinateError < .0001);
  const edges = new Map(), parents = sourcePoints.map((_, i) => i);
  const find = (v) => { while (parents[v] !== v) { parents[v] = parents[parents[v]]; v = parents[v]; } return v; };
  for (let i = 0; i < indices.length; i += 3) for (let j = 0; j < 3; j++) {
    const a = indices[i + j], b = indices[i + (j + 1) % 3];
    parents[find(a)] = find(b);
    const key = a < b ? `${a}/${b}` : `${b}/${a}`;
    const edge = edges.get(key) ?? { count: 0, orientation: 0 };
    edge.count++; edge.orientation += a < b ? 1 : -1; edges.set(key, edge);
  }
  const components = new Map();
  for (let i = 0; i < indices.length; i += 3) { const key = find(indices[i]); components.set(key, (components.get(key) ?? 0) + 1); }
  const id = `vm:reference:um-5t6tz7-v1-2:lower-limb:${slug}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: materials[tissue], roughness: .72 }));
  mesh.name = slug;
  mesh.userData = { structureId: id, sourceFile: file, sourceSha256: hash(bytes), sourceLicense: 'CC0-1.0', anatomicalReview: false, registeredToBodyParts3D: false, presentationStatus: 'unvalidated-independent-reference' };
  groups[bundleRegion].add(mesh);
  const record = {
    id, slug, name: displayName, sourceName: file.slice(13, -4), fmaId: null,
    laterality: label === 'Pelvis' ? 'source-group' : 'right-source-report', tissue, region, bundle: `um-limb-${bundleRegion}`,
    bounds: { min, max }, center, anchor, nodeName: slug,
    sources: [{ file, sha256: hash(bytes) }], triangles: indices.length / 3, omittedSourceFaces,
    grouped: ['Pelvis', 'Phalanges'].includes(label),
    sourceQuality: { components: components.size, nonManifoldEdges: [...edges.values()].filter((e) => e.count > 2).length, zeroNormalVertices: zeroNormalVertices.length },
    coverageNote: label === 'Phalanges' ? 'Original grouped foot-bone surface. Individual digit/bone identities are not adjudicated; no metatarsal, phalanx or digit numbering is inferred.' : label === 'Pelvis' ? 'Original pelvic surface kept as one source group; no separate ilium, ischium, pubis or sacral identities are inferred.' : null,
    validation: { status: 'unvalidated', anatomicalReview: false, registeredToBodyParts3D: false },
  };
  records.push(record); originals.push({ file, bytes });
  audits.push({ id, sourceFile: file, sourceSha256: hash(bytes), sourceBytes: bytes.length, sourceTriangles,
    displayTriangles: record.triangles, omittedSourceFaces, zeroNormalVertices, maxSourceCoordinateError: coordinateError,
    components: [...components.values()].sort((a, b) => b - a),
    boundaryEdges: [...edges.values()].filter((e) => e.count === 1).length,
    nonManifoldEdges: [...edges.values()].filter((e) => e.count > 2).length,
    inconsistentWindingEdges: [...edges.values()].filter((e) => e.count === 2 && e.orientation !== 0).length,
  });
}
assert.equal(new Set(records.map((s) => s.id)).size, 52);
globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }); } };
const outputs = [], bundles = [];
for (const [region, scene] of Object.entries(groups)) {
  const glb = Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true }));
  assert(glb.length < 25 * 1024 * 1024, 'Regional asset must remain below the hosting per-file limit');
  const reloaded = await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '');
  let count = 0;
  reloaded.scene.traverse((mesh) => {
    if (!mesh.isMesh) return; count++;
    const original = scene.getObjectByName(mesh.name); assert(original);
    for (const name of ['position', 'normal']) assert.deepEqual(mesh.geometry.getAttribute(name).array, original.geometry.getAttribute(name).array);
    assert.deepEqual(mesh.geometry.index.array, original.geometry.index.array);
  });
  assert.equal(count, scene.children.length);
  bundles.push({ id: `um-limb-${region}`, url: `/models/um-limb/${region}.glb`, bytes: glb.length, sha256: hash(glb), structures: count });
  outputs.push([`public/models/um-limb/${region}.glb`, glb]);
}
const catalog = { version: 1, specimenId: 'um-5t6tz7-v1-2:lower-limb', status: 'unvalidated-independent-reference',
  source: knee.source, sourceBasis: knee.sourceBasis, displayTransformColumnMajor: knee.displayTransformColumnMajor,
  registeredToBodyParts3D: false, imagingRegistration: null,
  companionKneeCatalogSha256: hash(await readFile(path('public/models/um-knee/catalog.json'))),
  structures: records, bundles,
};
const report = { schemaVersion: 1, source: knee.source, clinicalApproval: false, dicomDownloaded: false,
  modifications: ['Exact-position indexing; recomputed smooth normals, with incident source-face fallback at recorded zero-normal vertices', 'Only recorded exactly zero-area source faces omitted', 'Fixed LPS display transform (0.01x, 0.01z, -0.01y)', 'Source spellings normalised in display only; originals and source groups retained'],
  structures: audits, sourceTriangles: audits.reduce((n, s) => n + s.sourceTriangles, 0),
  displayTriangles: audits.reduce((n, s) => n + s.displayTriangles, 0),
};
outputs.push(['public/models/um-limb/catalog.json', Buffer.from(JSON.stringify(catalog, null, 2) + '\n')], ['content/um-limb-source-audit.json', Buffer.from(JSON.stringify(report, null, 2) + '\n')]);
if (!check) await mkdir(path('content/sources/um-limb'), { recursive: true });
for (const { file, bytes } of originals) {
  const target = path('content/sources/um-limb', file);
  if (check) assert.deepEqual(await readFile(target), bytes);
  else { try { await writeFile(target, bytes, { flag: 'wx' }); } catch (e) { if (e.code !== 'EEXIST') throw e; assert.deepEqual(await readFile(target), bytes); } }
}
if (!check) await mkdir(path('public/models/um-limb'), { recursive: true });
for (const [file, bytes] of outputs) {
  if (check) assert.deepEqual(await readFile(path(file)), bytes, `Stale ${file}`);
  else await writeFile(path(file), bytes);
}
console.log(JSON.stringify({ check, newStructures: records.length, bundles, sourceTriangles: report.sourceTriangles, displayTriangles: report.displayTriangles, omitted: report.sourceTriangles - report.displayTriangles,
  topologyWarnings: audits.filter((s) => s.boundaryEdges || s.nonManifoldEdges || s.inconsistentWindingEdges).map((s) => ({ id: s.id, boundary: s.boundaryEdges, nonManifold: s.nonManifoldEdges, winding: s.inconsistentWindingEdges })),
  groupedComponents: audits.filter((s) => s.components.length > 1).map((s) => ({ id: s.id, components: s.components })),
}));
