/** Reproducible, no-paid-service ingestion of the official CC BY 4.0 archive. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const source = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip';
const out = path.resolve('public/models/bodyparts3d');
const raw = path.resolve('../work/bodyparts3d/selected');
await fs.mkdir(out, { recursive: true });
await fs.mkdir(raw, { recursive: true });
const parts = [
  ['FJ3384', 'scapula', 'FMA13395'], ['FJ3368', 'humerus', 'FMA23130'],
  ['FJ3362', 'clavicle', 'FMA13322'], ['FJ1506', 'supraspinatus', 'FMA32544'],
  ['FJ1500', 'infraspinatus', 'FMA32547'], ['FJ1504', 'subscapularis', 'FMA13414'],
  ['FJ1508', 'teres-minor', 'FMA32553'], ['FJ1468', 'deltoid', 'FMA34680'],
  ['FJ1467', 'deltoid', 'FMA34682'], ['FJ1513', 'deltoid', 'FMA34684'],
  ['FJ1478', 'biceps-long-head-muscle', 'FMA37686'],
];
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
async function range(start, end) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(source, { headers: { Range: start < 0 ? `bytes=${start}` : `bytes=${start}-${end ?? ''}` }, signal: AbortSignal.timeout(90000) });
    if (response.status === 206) return Buffer.from(await response.arrayBuffer());
    if (attempt === 3) throw new Error(`Archive range returned ${response.status}`);
  }
}
// Read ZIP directory, then retrieve only the eleven selected files (~1 MB).
const tail = await range(-65536);
const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) throw new Error('ZIP end record missing');
const cdSize = tail.readUInt32LE(eocd + 12), cdStart = tail.readUInt32LE(eocd + 16);
const directory = await range(cdStart, cdStart + cdSize - 1);
const entries = new Map();
for (let i = 0; i < directory.length;) {
  if (directory.readUInt32LE(i) !== 0x02014b50) throw new Error('Invalid ZIP directory');
  const nameLength = directory.readUInt16LE(i + 28);
  const name = directory.subarray(i + 46, i + 46 + nameLength).toString();
  entries.set(path.posix.basename(name), { name, crc32: directory.readUInt32LE(i + 16), size: directory.readUInt32LE(i + 20), unpacked: directory.readUInt32LE(i + 24), offset: directory.readUInt32LE(i + 42), method: directory.readUInt16LE(i + 10) });
  i += 46 + nameLength + directory.readUInt16LE(i + 30) + directory.readUInt16LE(i + 32);
}
const records = await Promise.all(parts.map(async ([file, slug, fma]) => {
  const entry = entries.get(`${file}.obj`);
  if (!entry) throw new Error(`Missing ${file}`);
  let bytes;
  try { bytes = await fs.readFile(path.join(raw, `${file}.obj`)); } catch {
    const header = await range(entry.offset, entry.offset + 29);
    const start = entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
    const compressed = await range(start, start + entry.size - 1);
    bytes = entry.method === 8 ? inflateRawSync(compressed) : compressed;
    if (bytes.length !== entry.unpacked) throw new Error(`Size mismatch ${file}`);
    await fs.writeFile(path.join(raw, `${file}.obj`), bytes);
  }
  if (bytes.length !== entry.unpacked || crc32(bytes) !== entry.crc32) throw new Error(`Archive integrity mismatch ${file}; discard the cached OBJ and retry`);
  const object = new OBJLoader().parse(bytes.toString());
  return { file, slug, fma, object, sha256: createHash('sha256').update(bytes).digest('hex') };
}));
// One rigid transform for EVERY structure; never center or scale individual meshes.
const sourceBounds = new THREE.Box3();
for (const record of records.filter(r => ['scapula', 'clavicle'].includes(r.slug))) sourceBounds.expandByObject(record.object);
const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
const scale = 0.026;
const transform = new THREE.Matrix4().makeRotationX(-Math.PI / 2).multiply(new THREE.Matrix4().makeTranslation(-sourceCenter.x, -sourceCenter.y, -sourceCenter.z));
transform.premultiply(new THREE.Matrix4().makeScale(scale, scale, scale));
const scene = new THREE.Group();
const manifest = [];
for (const record of records) {
  let count = 0;
  record.object.traverse(mesh => {
    if (!mesh.isMesh) return;
    let geometry = mesh.geometry.clone();
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry = mergeVertices(geometry, 0.0001);
    geometry.computeVertexNormals();
    geometry.applyMatrix4(transform);
    const newMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: ['scapula','humerus','clavicle'].includes(record.slug) ? '#e7d7b3' : '#bd5a55' }));
    newMesh.name = `${record.slug}__${record.file}_${count++}`;
    newMesh.userData = { sourceFile: `${record.file}.obj`, fmaId: record.fma, anatomySlug: record.slug };
    scene.add(newMesh);
  });
  const bbox = new THREE.Box3().setFromObject(record.object).applyMatrix4(transform);
  const slug = record.slug.replace('biceps-long-head-muscle', 'biceps-long-head');
  const category = ['scapula','humerus','clavicle'].includes(slug) ? 'bone' : 'muscle';
  manifest.push({ sourceFile: `${record.file}.obj`, slug, structureId: `vm:anatomy:upper-limb:shoulder:right:${category}:${slug}`, nodeName: `${record.slug}__${record.file}_0`, fmaId: record.fma, sourceSha256: record.sha256, bounds: { min: bbox.min.toArray(), max: bbox.max.toArray() } });
}
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
};
const glb = Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true }));
await fs.writeFile(path.join(out, 'shoulder-right.glb'), glb);
await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify({
  title: 'BodyParts3D right shoulder subset', version: '4.0', source,
  license: 'CC-BY-4.0', licenseEvidence: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  credit: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
  changes: 'Subset selection; rigid common coordinate transform; vertex welding and normal recomputation; OBJ to GLB. Appearance modified at runtime. No per-part registration or reshaping.',
  coordinateSystem: { source: 'millimetres, +X left, +Y posterior, +Z superior', scene: '+X left, +Y superior, +Z anterior', sourceCenter: sourceCenter.toArray(), unitsPerMillimetre: scale, sourceToSceneColumnMajor: transform.toArray() },
  sha256: createHash('sha256').update(glb).digest('hex'), parts: manifest,
}, null, 2));
console.log(JSON.stringify({ bytes: glb.length, meshes: scene.children.length, sourceCenter: sourceCenter.toArray(), parts: manifest.map(({slug,bounds}) => ({slug,bounds})) }, null, 2));
