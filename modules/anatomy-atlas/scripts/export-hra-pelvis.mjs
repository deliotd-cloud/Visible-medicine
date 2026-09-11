import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readGlb } from './glb-lossless-codec.mjs';
import {
  hraSource,
  hraPelvicHolds,
  hraCandidateNodeIndices,
  hraDigest,
  hraAccessor,
  hraWriteGlb,
  hraSubset,
} from './hra-pelvis-source.mjs';
const sourceDirectory =
  process.argv.find((a) => a.startsWith('--source='))?.slice(9) ??
  'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const retained = 'content/sources/hra-pelvis',
  out = 'public/models/hra-pelvis';
const check = process.argv.includes('--check'),
  bootstrap = process.argv.includes('--retain-source');
async function save(path, bytes) {
  if (check)
    assert.deepEqual(
      await readFile(path),
      Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes),
      'Stale ' + path,
    );
  else await writeFile(path, bytes);
}
if (bootstrap) {
  assert(!check);
  await mkdir(retained, { recursive: true });
  const original = await readFile(sourceDirectory + '/3d-vh-f-united.glb');
  assert.equal(original.length, hraSource.bytes);
  assert.equal(hraDigest(original), hraSource.sha256);
  const { json, bin } = readGlb(original);
  // All source ancestors must be identity; never silently lose a transform.
  const parent = new Map();
  json.nodes.forEach((n, i) =>
    (n.children ?? []).forEach((c) => {
      assert(!parent.has(c));
      parent.set(c, i);
    }),
  );
  for (const index of hraCandidateNodeIndices) {
    let i = index;
    const seen = new Set();
    while (i !== undefined) {
      assert(!seen.has(i));
      seen.add(i);
      const n = json.nodes[i];
      assert(!n.matrix && !n.translation && !n.rotation && !n.scale);
      i = parent.get(i);
    }
  }
  const subset = hraSubset(json, bin, hraCandidateNodeIndices);
  await save(
    retained + '/pelvic-source.glb',
    hraWriteGlb(subset.json, subset.bin),
  );
  for (const [file, expected] of [
    ['metadata.json', hraSource.metadataSha256],
    ['crosswalk.csv', hraSource.crosswalkSha256],
  ]) {
    const b = await readFile(sourceDirectory + '/' + file);
    assert.equal(hraDigest(b), expected);
    await save(retained + '/' + file, b);
  }
  const audit = await readFile(
    sourceDirectory + '/pelvic-candidate-audit.json',
  );
  assert.equal(JSON.parse(audit).sourceSha256, hraSource.sha256);
  await save('docs/hra-pelvic-source-audit.json', audit);
}
const original = await readFile(retained + '/pelvic-source.glb'),
  audit = JSON.parse(await readFile('docs/hra-pelvic-source-audit.json'));
assert.equal(
  hraDigest(original),
  '2cb1eefede00b05a1ee593fb098082c30b034d0a43c2afd64b637f9ee26673aa',
  'Exact retained source subset',
);
assert.equal(
  hraDigest(await readFile('docs/hra-pelvic-source-audit.json')),
  '50d0640df153a22fc3fa5ebb5bc2dfb0d00baad29dc466b38d45185687a997b6',
);
for (const [file, pin] of [
  ['metadata.json', hraSource.metadataSha256],
  ['crosswalk.csv', hraSource.crosswalkSha256],
])
  assert.equal(hraDigest(await readFile(retained + '/' + file)), pin);
assert.equal(audit.sourceSha256, hraSource.sha256);
assert.equal(audit.rows.length, 47);
const { json, bin } = readGlb(original);
assert.equal(json.nodes.length, 47);
const sourceNodes = json.nodes
  .map((n, i) => ({ n, i }))
  .filter(({ n }) => !Object.hasOwn(hraPelvicHolds, n.name));
assert.equal(sourceNodes.length, 41);
const display = hraSubset(
  json,
  bin,
  sourceNodes.map(({ i }) => i),
);
// Metres to scene units. Positive uniform scale only; original normals/order unchanged.
for (const accessorIndex of new Set(
  display.json.meshes.flatMap((m) =>
    m.primitives.map((p) => p.attributes.POSITION),
  ),
)) {
  const a = display.json.accessors[accessorIndex],
    v = display.json.bufferViews[a.bufferView];
  assert(a.componentType === 5126 && a.type === 'VEC3');
  const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0),
    stride = v.byteStride ?? 12;
  assert(stride >= 12);
  for (let i = 0; i < a.count; i++)
    for (let k = 0; k < 3; k++) {
      const offset = start + i * stride + 4 * k;
      display.bin.writeFloatLE(
        Math.fround(display.bin.readFloatLE(offset) * 10),
        offset,
      );
    }
  for (const key of ['min', 'max'])
    if (a[key]) a[key] = a[key].map((n) => Math.fround(n * 10));
}
const glb = hraWriteGlb(display.json, display.bin),
  bundleId = hraSource.key;
const overrides = {
  VH_F_right_cardinal_ligament_of_uterus:
    'Right cardinal ligament (source region)',
  VH_F_left_cardinal_ligament_of_uterus:
    'Left cardinal ligament (source region)',
  VH_F_cervicovaginal_junction: 'Cervicovaginal junction (source surface)',
  VH_F_fundus_of_urinary_bladder_dome: 'Bladder dome (source surface)',
  VH_F_fundus_of_urinary_bladder_base: 'Bladder base (source surface)',
};
const structures = display.json.nodes.map((n, i) => {
  const sourceNode = sourceNodes[i].n,
    row = audit.rows.find((r) => r.nodeName === n.name);
  assert(row && row.nodeIndex === sourceNode.extras.originalNodeIndex);
  assert(
    !row.topology.duplicateFaces &&
      !row.topology.degenerateFaces &&
      !row.topology.nonManifoldEdges,
  );
  const mesh = display.json.meshes[n.mesh],
    p = mesh.primitives[0],
    positions = hraAccessor(display.json, display.bin, p.attributes.POSITION),
    normals = hraAccessor(display.json, display.bin, p.attributes.NORMAL),
    indices = hraAccessor(display.json, display.bin, p.indices).flat();
  assert.equal(indices.length, row.triangles * 3);
  const min = [0, 1, 2].map((k) => Math.min(...positions.map((p) => p[k]))),
    max = [0, 1, 2].map((k) => Math.max(...positions.map((p) => p[k]))),
    center = min.map((v, k) => (v + max[k]) / 2);
  const nearest = positions.reduce(
    (a, p) =>
      p.reduce((s, v, k) => s + (v - center[k]) ** 2, 0) < a.d
        ? { p, d: p.reduce((s, v, k) => s + (v - center[k]) ** 2, 0) }
        : a,
    { p: positions[0], d: Infinity },
  ).p;
  const side = /(_L$|_left_)/.test(n.name)
    ? 'left'
    : /(_R$|_right_)/.test(n.name)
      ? 'right'
      : 'midline';
  const tissue = /artery/.test(n.name)
    ? 'artery'
    : /vein/.test(n.name)
      ? 'vein'
      : /sacrum/.test(n.name)
        ? 'skeleton'
        : /ligament|mesosalpinx|mesovarium|pouch/.test(n.name)
          ? 'ligament'
          : 'organ';
  const name = overrides[n.name] ?? row.metadata?.label;
  assert(name && name !== '-');
  const slug = n.name
    .replace(/^VH_F_/, '')
    .toLowerCase()
    .replaceAll('_', '-');
  return {
    id: 'vm:reference:hra-united-female-v1-10:pelvis:' + slug,
    slug,
    name: name[0].toUpperCase() + name.slice(1),
    sourceName: n.name,
    sourceOntologyId: row.metadata?.ontologyid ?? null,
    fmaId: /^FMA:\d+$/.test(row.metadata?.ontologyid ?? '')
      ? row.metadata.ontologyid.replace(':', '')
      : null,
    tissue,
    laterality: side,
    bundle: bundleId,
    nodeName: n.name,
    bounds: { min, max },
    center,
    anchor: nearest,
    sources: [
      { file: '3d-vh-f-united.glb#' + n.name, sha256: hraSource.sha256 },
    ],
    triangles: row.triangles,
    omittedSourceFaces: [],
    sourceQuality: {
      components: row.topology.components.length,
      nonManifoldEdges: row.topology.nonManifoldEdges,
      zeroNormalVertices: normals.filter((normal) =>
        normal.every((value) => value === 0),
      ).length,
    },
    coverageNote:
      'Partial HRA reference surface; open cut boundaries and paired inner/outer source shells may remain. Not a complete organ, operative plane or registered scan.',
    color:
      tissue === 'artery'
        ? '#bf514d'
        : tissue === 'vein'
          ? '#597dba'
          : tissue === 'skeleton'
            ? '#ddcfad'
            : tissue === 'ligament'
              ? '#c5b68f'
              : /ovary/.test(n.name)
                ? '#c597a9'
                : /bladder/.test(n.name)
                  ? '#c9a77c'
                  : '#b77980',
  };
});
const bundle = {
  id: bundleId,
  url: '/models/hra-pelvis/pelvis.glb?v=' + hraDigest(glb).slice(0, 12),
  sha256: hraDigest(glb),
  bytes: glb.length,
  structures: structures.length,
};
const catalog = {
  version: 1,
  specimenId: hraSource.key,
  source: hraSource,
  sourceSubsetSha256: hraDigest(original),
  displayTransformColumnMajor: [
    0.01, 0, 0, 0, 0, 0, -0.01, 0, 0, 0.01, 0, 0, 0, 0, 0, 1,
  ],
  sourceFrame: 'hra-united-female-v1.10:lps-mm',
  coordinateNote:
    'Original GLB metres: x left, y superior, z anterior, established from concordant paired structures and bladder/rectum/sacrum. LPS mm = (1000*x,-1000*z,1000*y). Display=(10*x,10*y,10*z). Separate reference, no registration.',
  structures,
  bundles: [bundle],
  heldNodes: hraPelvicHolds,
  clinicalApproval: false,
};
await mkdir(out, { recursive: true });
await save(out + '/pelvis.glb', glb);
await save(out + '/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(
  JSON.stringify({
    selections: structures.length,
    triangles: structures.reduce((s, r) => s + r.triangles, 0),
    held: 6,
    sourceSubsetBytes: original.length,
    sourceSubsetSha256: hraDigest(original),
    glbBytes: glb.length,
    glbSha256: hraDigest(glb),
    check,
  }),
);
