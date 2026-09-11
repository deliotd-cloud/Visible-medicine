import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { readGlb } from './glb-lossless-codec.mjs';
import { prepareShape } from './vessel-shape-math.mjs';
import { sourceTopology } from './source-topology.mjs';
import {
  sourceTriangleSet,
  sourceBoundsNear,
  compareSourceSurfaces,
} from './source-surface-audit.mjs';
const directory =
  process.argv.find((a) => a.startsWith('--source='))?.slice(9) ??
  'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const bytes = await readFile(directory + '/3d-vh-f-united.glb');
const hash = (b) => createHash('sha256').update(b).digest('hex');
assert.equal(
  hash(bytes),
  '95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422',
);
const { json: g, bin } = readGlb(bytes),
  parents = new Map();
g.nodes.forEach((n, i) =>
  (n.children ?? []).forEach((c) => {
    assert(!parents.has(c));
    parents.set(c, i);
  }),
);
const matrix = (i) => {
  const n = g.nodes[i];
  const m = n.matrix
    ? new Matrix4().fromArray(n.matrix)
    : new Matrix4().compose(
        new Vector3(...(n.translation ?? [0, 0, 0])),
        new Quaternion(...(n.rotation ?? [0, 0, 0, 1])),
        new Vector3(...(n.scale ?? [1, 1, 1])),
      );
  return parents.has(i) ? matrix(parents.get(i)).multiply(m) : m;
};
function accessor(i) {
  const a = g.accessors[i],
    v = g.bufferViews[a.bufferView];
  assert(!a.sparse && !a.normalized);
  assert.equal(v.buffer, 0);
  const channels = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type],
    component = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
  assert(channels && component);
  const stride = v.byteStride ?? channels * component,
    start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  assert(start + (a.count - 1) * stride + channels * component <= bin.length);
  const get = {
    5126: 'readFloatLE',
    5125: 'readUInt32LE',
    5123: 'readUInt16LE',
    5121: 'readUInt8',
  }[a.componentType];
  return Array.from({ length: a.count }, (_, r) =>
    Array.from({ length: channels }, (_, c) =>
      bin[get](start + r * stride + c * component),
    ),
  );
}
const nodes = g.nodes
  .map((n, i) => ({ n, i }))
  .filter(
    ({ n, i }) =>
      n.mesh !== undefined &&
      ((i >= 437 && i <= 487) ||
        /^VH_F_(rectum|fundus_of_urinary_bladder_dome|urinary_bladder_neck_smooth_muscle|fundus_of_urinary_bladder_base|left_uterine_artery|right_uterine_artery|left_uterine_vein|right_uterine_vein|sacrum)$/.test(
          n.name,
        )),
  );
const rows = [],
  shapes = new Map();
for (const { n, i } of nodes) {
  const m = matrix(i);
  assert(m.elements.every(Number.isFinite));
  assert(m.determinant() > 0);
  const mesh = g.meshes[n.mesh];
  assert.equal(mesh.primitives.length, 1);
  const p = mesh.primitives[0];
  assert.equal(p.mode ?? 4, 4);
  const vertices = accessor(p.attributes.POSITION).map((p) =>
      new Vector3(...p).applyMatrix4(m).multiplyScalar(1000).toArray(),
    ),
    idx = accessor(p.indices).flat();
  assert(idx.length % 3 === 0 && idx.every((v) => v < vertices.length));
  const faces = Array.from({ length: idx.length / 3 }, (_, i) =>
      idx.slice(i * 3, i * 3 + 3),
    ),
    shape = prepareShape(vertices, faces),
    topology = sourceTopology(shape);
  const min = [0, 1, 2].map((k) => Math.min(...vertices.map((p) => p[k]))),
    max = [0, 1, 2].map((k) => Math.max(...vertices.map((p) => p[k])));
  rows.push({
    nodeIndex: i,
    nodeName: n.name,
    meshIndex: n.mesh,
    metadata: n.extras ?? null,
    worldMatrix: m.toArray(),
    attributes: p.attributes,
    triangles: faces.length,
    positionAccessorSha256: hash(
      JSON.stringify(accessor(p.attributes.POSITION)),
    ),
    worldBoundsMm: { min, max },
    topology,
  });
}
// Re-read shapes only for uterine alternatives and shared-face diagnostics.
for (const { n, i } of nodes) {
  const p = g.meshes[n.mesh].primitives[0],
    m = matrix(i);
  const vertices = accessor(p.attributes.POSITION).map((p) =>
      new Vector3(...p).applyMatrix4(m).multiplyScalar(1000).toArray(),
    ),
    idx = accessor(p.indices).flat();
  shapes.set(
    i,
    prepareShape(
      vertices,
      Array.from({ length: idx.length / 3 }, (_, j) =>
        idx.slice(j * 3, j * 3 + 3),
      ),
    ),
  );
}
const shared = [];
for (let a = 0; a < rows.length; a++) {
  const ra = rows[a],
    sa = sourceTriangleSet(shapes.get(ra.nodeIndex));
  for (const rb of rows.slice(a + 1)) {
    if (!sourceBoundsNear(ra.worldBoundsMm, rb.worldBoundsMm, 0)) continue;
    const sb = sourceTriangleSet(shapes.get(rb.nodeIndex));
    const count = [...sa].filter((t) => sb.has(t)).length;
    if (count)
      shared.push({ a: ra.nodeName, b: rb.nodeName, triangles: count });
  }
}
const uterineComparisons = [];
for (const a of [483, 484])
  for (const b of [479, 480, 482, 485]) {
    uterineComparisons.push({
      a: g.nodes[a].name,
      b: g.nodes[b].name,
      ...compareSourceSurfaces(shapes.get(a), shapes.get(b)),
    });
  }
const report = {
  sourceSha256: hash(bytes),
  sourceBytes: bytes.length,
  rows,
  shared,
  uterineComparisons,
  clinicalApproval: false,
  admitted: false,
};
const text = JSON.stringify(report, null, 2) + '\n';
const target = 'docs/hra-pelvic-source-audit.json';
if (process.argv.includes('--check'))
  assert.equal(await readFile(target, 'utf8'), text);
else await writeFile(target, text);
console.log(
  JSON.stringify(
    {
      rows: rows.length,
      triangles: rows.reduce((n, r) => n + r.triangles, 0),
      shared,
      uterineComparisons: uterineComparisons.map((p) => ({
        a: p.a,
        b: p.b,
        exact: p.exactTriangles,
        aMedian: p.aToB.medianMm,
        bMedian: p.bToA.medianMm,
        aNear: p.aToB.withinTenthMm,
        bNear: p.bToA.withinTenthMm,
      })),
      allWorldMatricesIdentity: rows.every(
        (r) =>
          JSON.stringify(r.worldMatrix) ===
          JSON.stringify(new Matrix4().toArray()),
      ),
    },
    null,
    2,
  ),
);
