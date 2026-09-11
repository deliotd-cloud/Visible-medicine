import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { MeshoptEncoder } from 'meshoptimizer/encoder';

// Use the exact loader/decoder installed behind this app's useGLTF, rather than
// validating with a newer decoder that the shipped viewer does not have.
const require = createRequire(import.meta.url);
const dreiRequire = createRequire(require.resolve('@react-three/drei'));
const { GLTFLoader, MeshoptDecoder } = dreiRequire('three-stdlib');
const decoder = typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder;
const extension = 'EXT_meshopt_compression';
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const aligned = n => Math.ceil(n / 4) * 4;

export function readGlb(bytes) {
  assert.ok(bytes.length >= 28 && bytes.readUInt32LE(0) === 0x46546c67, 'Not a GLB');
  assert.equal(bytes.readUInt32LE(4), 2); assert.equal(bytes.readUInt32LE(8), bytes.length);
  const length = bytes.readUInt32LE(12), next = 20 + length;
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a); assert.ok(next + 8 <= bytes.length);
  assert.equal(bytes.readUInt32LE(next + 4), 0x004e4942);
  assert.equal(next + 8 + bytes.readUInt32LE(next), bytes.length, 'Unexpected extra/truncated chunks');
  return { json: JSON.parse(bytes.subarray(20, next)), bin: bytes.subarray(next + 8) };
}
function writeGlb(json, data) {
  const text = Buffer.from(JSON.stringify(json)), jsonSize = aligned(text.length), binSize = aligned(data.length);
  const output = Buffer.alloc(28 + jsonSize + binSize);
  output.writeUInt32LE(0x46546c67, 0); output.writeUInt32LE(2, 4); output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonSize, 12); output.writeUInt32LE(0x4e4f534a, 16);
  output.fill(0x20, 20, 20 + jsonSize); text.copy(output, 20);
  output.writeUInt32LE(binSize, 20 + jsonSize); output.writeUInt32LE(0x004e4942, 24 + jsonSize);
  data.copy(output, 28 + jsonSize); return output;
}
export async function compressGlb(original) {
  assert.ok(MeshoptEncoder.supported && decoder.supported, 'Lossless codec unavailable');
  await Promise.all([MeshoptEncoder.ready, decoder.ready]);
  const { json, bin } = readGlb(original), output = structuredClone(json);
  assert.equal(json.buffers.length, 1, 'Only self-contained single-buffer source GLBs are supported');
  assert.equal(json.buffers[0].uri, undefined);
  assert.ok(!json.extensionsRequired?.includes(extension));
  assert.ok(!json.images?.length, 'Image-bearing GLBs require a separately reviewed path');
  const chunks = []; let offset = 0;
  for (const [i, view] of json.bufferViews.entries()) {
    const accessors = json.accessors.filter(a => a.bufferView === i);
    assert.equal(view.buffer, 0); assert.equal(view.extensions, undefined);
    assert.equal(accessors.length, 1, 'Shared or non-accessor storage requires explicit support');
    const a = accessors[0]; assert.equal(a.sparse, undefined); assert.equal(a.byteOffset ?? 0, 0);
    let stride, mode;
    if (a.type === 'VEC3' && a.componentType === 5126) { stride = 12; mode = 'ATTRIBUTES'; }
    else if (a.type === 'SCALAR' && [5123, 5125].includes(a.componentType)) { stride = a.componentType === 5123 ? 2 : 4; mode = 'INDICES'; }
    else throw Error(`Unsupported accessor ${a.componentType}/${a.type}; source was not changed`);
    assert.equal(view.byteStride ?? stride, stride); assert.equal(view.byteLength, a.count * stride);
    const start = view.byteOffset ?? 0;
    assert.ok(start >= 0 && start + view.byteLength <= json.buffers[0].byteLength && json.buffers[0].byteLength <= bin.length);
    const source = bin.subarray(start, start + view.byteLength);
    // Version 0 is required by EXT and the installed decoder. No quantization,
    // normal filters, simplification, index reordering or cyclic triangle rotation.
    const encoded = Buffer.from(MeshoptEncoder.encodeGltfBuffer(source, a.count, stride, mode, 0));
    const decoded = new Uint8Array(view.byteLength);
    decoder.decodeGltfBuffer(decoded, a.count, stride, encoded, mode, 'NONE');
    assert.ok(Buffer.from(decoded).equals(source), `Lossless round trip failed for view ${i}`);
    const padded = Buffer.alloc(aligned(encoded.length)); encoded.copy(padded); chunks.push(padded);
    output.bufferViews[i] = { ...view, buffer: 1, extensions: { [extension]: { buffer: 0, byteOffset: offset, byteLength: encoded.length, byteStride: stride, count: a.count, mode, filter: 'NONE' } } };
    offset += padded.length;
  }
  output.buffers = [{ byteLength: offset }, { ...json.buffers[0], extensions: { [extension]: { fallback: true } } }];
  output.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), extension])];
  output.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []), extension])];
  output.asset = { ...json.asset, extras: { ...json.asset.extras, visibleMedicineTransport: { codec: extension, canonicalSha256: digest(original), precision: 'byte-exact', filters: 'NONE' } } };
  const bytes = writeGlb(output, Buffer.concat(chunks));
  // Keeping an original when compression is not beneficial avoids small-file bloat.
  return bytes.length < original.length ? bytes : original;
}

/** Byte equality covers all accessor storage; loader equality also covers actual
 * names, hierarchy, transforms, primitives/materials and runtime decoder wiring. */
export async function validateGlbDelivery(original, delivered) {
  await decoder.ready;
  const source = readGlb(original), packed = readGlb(delivered);
  if (original.equals(delivered)) return { compressed: false, bufferViews: source.json.bufferViews.length, meshes: source.json.meshes.length };
  assert.equal(packed.json.asset.extras.visibleMedicineTransport.canonicalSha256, digest(original));
  assert.ok(packed.json.extensionsRequired.includes(extension));
  assert.equal(packed.json.bufferViews.length, source.json.bufferViews.length);
  const normalized = structuredClone(packed.json);
  normalized.buffers = source.json.buffers;
  normalized.extensionsUsed = source.json.extensionsUsed;
  normalized.extensionsRequired = source.json.extensionsRequired;
  normalized.asset = source.json.asset;
  for (const [i, view] of packed.json.bufferViews.entries()) {
    const e = view.extensions[extension], originalView = source.json.bufferViews[i];
    assert.equal(e.filter, 'NONE'); assert.ok(['ATTRIBUTES', 'INDICES'].includes(e.mode));
    assert.equal(e.buffer, 0); assert.equal(e.byteStride * e.count, originalView.byteLength);
    const decoded = new Uint8Array(originalView.byteLength);
    decoder.decodeGltfBuffer(decoded, e.count, e.byteStride, packed.bin.subarray(e.byteOffset, e.byteOffset + e.byteLength), e.mode, 'NONE');
    assert.ok(Buffer.from(decoded).equals(source.bin.subarray(originalView.byteOffset ?? 0, (originalView.byteOffset ?? 0) + originalView.byteLength)));
    const restored = { ...view, buffer: 0 }; delete restored.extensions; normalized.bufferViews[i] = restored;
  }
  // JSON stringify normalizes absent optional fields to the source's form.
  assert.deepEqual(JSON.parse(JSON.stringify(normalized)), source.json, 'Scene metadata changed');
  const parse = bytes => new GLTFLoader().setMeshoptDecoder(decoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const [before, after] = await Promise.all([parse(original), parse(delivered)]);
  function snapshot(model) {
    const rows = []; model.scene.updateMatrixWorld(true);
    model.scene.traverse(object => {
      const row = { name: object.name, type: object.type, parent: object.parent?.name ?? null, matrix: object.matrixWorld.toArray(), userData: object.userData };
      if (object.isMesh) {
        const geo = object.geometry;
        row.attributes = Object.fromEntries(Object.entries(geo.attributes).map(([name, attr]) => [name, { count: attr.count, itemSize: attr.itemSize, normalized: attr.normalized, type: attr.array.constructor.name, hash: digest(Buffer.from(attr.array.buffer, attr.array.byteOffset, attr.array.byteLength)) }]));
        row.index = geo.index && { count: geo.index.count, type: geo.index.array.constructor.name, hash: digest(Buffer.from(geo.index.array.buffer, geo.index.array.byteOffset, geo.index.array.byteLength)) };
        row.groups = geo.groups; row.material = (Array.isArray(object.material) ? object.material : [object.material]).map(m => ({ name: m.name, type: m.type, color: m.color?.toArray(), opacity: m.opacity, side: m.side, roughness: m.roughness, metalness: m.metalness }));
      }
      rows.push(row);
    }); return rows;
  }
  assert.deepEqual(snapshot(after), snapshot(before), 'Installed GLTFLoader produced a different scene');
  for (const model of [before, after]) model.scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } });
  return { compressed: true, bufferViews: source.json.bufferViews.length, meshes: source.json.meshes.length };
}
