import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const hraSource = {
  version: 'v1.10',
  key: 'hra-united-female-v1.10-pelvis',
  url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/assets/3d-vh-f-united.glb',
  metadataUrl:
    'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/metadata.json',
  crosswalkUrl:
    'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/assets/crosswalk.csv',
  sha256: '95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422',
  bytes: 374505632,
  metadataSha256:
    'b9f137b1176c31419c68b78ac87f0926f874dad22f56d4dde7df3e2f15bab501',
  crosswalkSha256:
    '2a367d3ad8c1cf1b083c884aed7d99fb3b504d482e1e49570ecdb4f03c84d55f',
  credit:
    'Kristen Browne and Heidi Schlehlein. 3D Reference Organ Set for Female, v1.10. HuBMAP, 2026. Based on the NLM Visible Human Dataset.',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};
export const hraPelvicHolds = {
  VH_F_right_round_ligament_of_uterus:
    'Source-labelled right structure lies on the left side relative to the concordant ovary/tube/vessel pairs. No relabelling or mirroring.',
  VH_F_left_round_ligament_of_uterus:
    'Source-labelled left structure lies on the right side relative to the concordant ovary/tube/vessel pairs. No relabelling or mirroring.',
  VH_F_abdominal_ostium_of_uterine_tube:
    'Two source pieces near the uterine end need identity/extent review; do not reinterpret as abdominal fimbrial openings.',
  VH_F_cornua:
    'Compound uterine-end source regions need extent review alongside the disputed ostium group; no ontology identity invented.',
  VH_F_posterior_wall_of_uterus:
    'Alternative wall representation overlaps the regional uterine surfaces and shares 234 exact triangles with the other wall; not an additional tissue layer.',
  VH_F_anterior_wall_of_uterus:
    'Alternative wall representation overlaps regional uterine surfaces, shares 234 exact triangles with the other wall and contains one duplicate face. No automatic repair.',
};
export const hraCandidateNodeIndices = [
  437, 438, 441, 442, 443, 444, 446, 447, 448, 449, 451, 453, 454, 456, 457,
  459, 460, 462, 463, 465, 466, 467, 469, 470, 472, 473, 475, 476, 478, 479,
  480, 481, 482, 483, 484, 485, 486, 487, 598, 707, 708, 709, 736, 737, 739,
  740, 1007,
];
export const hraDigest = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
export function hraAccessor(g, bin, index) {
  const a = g.accessors[index],
    v = g.bufferViews[a?.bufferView];
  assert(a && v && !a.sparse && !a.normalized, 'Unsupported source accessor');
  assert.equal(v.buffer, 0);
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type],
    size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
  assert(width && size && Number.isSafeInteger(a.count) && a.count > 0);
  const stride = v.byteStride ?? width * size,
    start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0),
    end = start + (a.count - 1) * stride + width * size;
  assert(
    stride >= width * size &&
      end <= (v.byteOffset ?? 0) + v.byteLength &&
      end <= bin.length,
  );
  const getter = {
    5126: 'readFloatLE',
    5125: 'readUInt32LE',
    5123: 'readUInt16LE',
    5121: 'readUInt8',
  }[a.componentType];
  return Array.from({ length: a.count }, (_, r) =>
    Array.from({ length: width }, (_, c) => {
      const n = bin[getter](start + r * stride + c * size);
      assert(Number.isFinite(n));
      return n;
    }),
  );
}
export function hraWriteGlb(json, bin) {
  const text = Buffer.from(JSON.stringify(json)),
    jlen = Math.ceil(text.length / 4) * 4,
    blen = Math.ceil(bin.length / 4) * 4,
    out = Buffer.alloc(28 + jlen + blen);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jlen, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  out.fill(32, 20, 20 + jlen);
  text.copy(out, 20);
  out.writeUInt32LE(blen, 20 + jlen);
  out.writeUInt32LE(0x004e4942, 24 + jlen);
  bin.copy(out, 28 + jlen);
  return out;
}
/** Repack only referenced accessor elements; values/order remain byte exact. */
export function hraSubset(g, bin, nodeIndices) {
  assert.equal(new Set(nodeIndices).size, nodeIndices.length);
  assert(
    !g.images?.length &&
      !g.textures?.length &&
      !g.animations?.length &&
      !g.skins?.length &&
      !g.extensionsRequired?.length,
  );
  const views = [],
    accessors = [],
    meshes = [],
    nodes = [],
    materials = [],
    chunks = [],
    amap = new Map(),
    mmap = new Map();
  let offset = 0;
  function accessor(i) {
    if (!amap.has(i)) {
      const a = g.accessors[i],
        v = g.bufferViews[a.bufferView];
      assert(!a.sparse && !a.extensions && !v.extensions && v.buffer === 0);
      const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type],
        size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
      assert(width && size);
      const rowBytes = width * size,
        stride = v.byteStride ?? rowBytes,
        start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
      assert(
        stride >= rowBytes &&
          start + (a.count - 1) * stride + rowBytes <=
            (v.byteOffset ?? 0) + v.byteLength,
      );
      const packed = Buffer.alloc(Math.ceil((a.count * rowBytes) / 4) * 4);
      for (let n = 0; n < a.count; n++)
        bin.copy(
          packed,
          n * rowBytes,
          start + n * stride,
          start + n * stride + rowBytes,
        );
      const viewIndex = views.length;
      views.push({
        buffer: 0,
        byteOffset: offset,
        byteLength: a.count * rowBytes,
        ...(v.target ? { target: v.target } : {}),
      });
      chunks.push(packed);
      offset += packed.length;
      amap.set(i, accessors.length);
      accessors.push({ ...a, bufferView: viewIndex, byteOffset: 0 });
    }
    return amap.get(i);
  }
  function material(i) {
    if (i === undefined) return undefined;
    if (!mmap.has(i)) {
      mmap.set(i, materials.length);
      materials.push(structuredClone(g.materials[i]));
    }
    return mmap.get(i);
  }
  for (const i of nodeIndices) {
    const n = g.nodes[i];
    assert(
      n &&
        n.mesh !== undefined &&
        !n.matrix &&
        !n.translation &&
        !n.rotation &&
        !n.scale,
    );
    const mesh = g.meshes[n.mesh];
    assert(!mesh.weights);
    const primitives = mesh.primitives.map((p) => {
      assert(!p.targets && !p.extensions && (p.mode ?? 4) === 4);
      return {
        ...p,
        attributes: Object.fromEntries(
          Object.entries(p.attributes).map(([k, a]) => [k, accessor(a)]),
        ),
        indices: accessor(p.indices),
        material: material(p.material),
      };
    });
    nodes.push({
      name: n.name,
      mesh: meshes.length,
      extras: {
        ...n.extras,
        originalNodeIndex: n.extras?.originalNodeIndex ?? i,
      },
    });
    meshes.push({ ...mesh, primitives });
  }
  return {
    json: {
      asset: {
        version: '2.0',
        generator: 'Visible Medicine lossless HRA source subset',
        copyright: hraSource.credit + ' ' + hraSource.license,
      },
      scene: 0,
      scenes: [{ nodes: nodes.map((_, i) => i) }],
      nodes,
      meshes,
      accessors,
      bufferViews: views,
      buffers: [{ byteLength: offset }],
      materials,
    },
    bin: Buffer.concat(chunks),
  };
}
