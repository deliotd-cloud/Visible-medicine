import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { vesselKind } from '../lib/anatomy-vessels.ts';
import {
  prepareShape,
  meshSourceShape,
  shapeCandidate,
  compareTranslatedShape,
  shapeCriteria,
} from './vessel-shape-math.mjs';

let assertions = 0;
const same = (a, b, message) => {
  assertions++;
  assert.deepEqual(a, b, message);
};
const check = (value, message) => {
  assertions++;
  assert(value, message);
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const root = 'public/models/bodyparts3d/full-body/';
const raw = await fs.readFile(root + 'catalog.json'),
  catalog = JSON.parse(raw);
const reportRaw = await fs.readFile('content/vessel-shape-audit.json');
const report = JSON.parse(reportRaw);
same(
  hash(raw),
  'b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5',
);
same(report.catalogSha256, hash(raw));
same(report.sourceCommit, 'd2dacd10edeac3ead12fd26376aa3377b223ffc7');
same(report.criteria, shapeCriteria);
same(shapeCriteria, {
  samples: 128,
  nearMm: 0.1,
  fraction: 0.95,
  maxMm: 0.3,
  extentAbsoluteFloorMm: 0.5,
  extentRelativeTolerance: 0.08,
  extentAbsoluteCapMm: 3,
});
same(report.sourceGeometryChanged, false);
same(report.admissionsChanged, false);
same(report.clinicalValidation, false);
same(report.sourceVersion, '4.0');
same(report.license, 'CC-BY-4.0');

// Independent, asymmetric fixtures check the math without any anatomical claims.
const vertices = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 6, 0],
  [0, 6, 0],
];
const faces = [
  [0, 1, 2],
  [0, 2, 3],
];
const snapshot = JSON.stringify({ vertices, faces });
const plane = prepareShape(vertices, faces);
const translated = prepareShape(
  vertices.map((v) => v.map((n, k) => n + [12, -5, 8][k])),
  faces,
);
const moved = compareTranslatedShape(plane, translated);
same(moved.diagnosticTranslationMm, [12, -5, 8]);
check(moved.similar);
same(moved.aToAlignedB.maxMm, 0);
same(moved.alignedBToA.maxMm, 0);
// Different triangulation and vertex/face counts must not exclude a true match.
const remeshed = prepareShape(
  [...vertices, [5, 3, 0]],
  [
    [0, 1, 4],
    [1, 2, 4],
    [2, 3, 4],
    [3, 0, 4],
  ],
);
check(shapeCandidate(plane, remeshed));
check(compareTranslatedShape(plane, remeshed).similar);
const scaled = prepareShape(
  vertices.map((v) => v.map((n) => n * 1.25)),
  faces,
);
check(!compareTranslatedShape(plane, scaled).similar);
check(!shapeCandidate(plane, scaled));
const rotated = prepareShape(
  vertices.map(([x, y, z]) => [y, -x, z]),
  faces,
);
check(!compareTranslatedShape(plane, rotated).similar);
const indented = prepareShape(
  [...vertices, [5, 3, 2]],
  [
    [0, 1, 4],
    [1, 2, 4],
    [2, 3, 4],
    [3, 0, 4],
  ],
);
const unequal = compareTranslatedShape(plane, indented);
check(!unequal.similar);
for (const shape of [
  prepareShape(
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ],
    [[0, 1, 2]],
  ),
  prepareShape([[0, 0, 0]], [[0, 0, 0]]),
]) {
  const result = compareTranslatedShape(shape, shape);
  check(result.similar);
  same(result.aToAlignedB.maxMm, 0);
  same(result.alignedBToA.maxMm, 0);
}
for (const [v, f] of [
  [[], faces],
  [vertices, []],
  [[[NaN, 0, 0]], [[0, 0, 0]]],
  [vertices, [[0, 1, 8]]],
  [vertices, [[0, 1]]],
  [vertices, [[0, 1, 1.5]]],
]) {
  assertions++;
  assert.throws(() => prepareShape(v, f));
}
same(
  JSON.stringify({ vertices, faces }),
  snapshot,
  'Diagnostic does not move source vertices',
);
const transform = new Matrix4()
  .makeRotationX(-Math.PI / 2)
  .multiply(new Matrix4().makeScale(0.01, 0.01, 0.01))
  .multiply(new Matrix4().makeTranslation(0, 50, -800));
const geometry = new BufferGeometry().setAttribute(
  'position',
  new Float32BufferAttribute(vertices.flat(), 3),
);
geometry.setIndex(faces.flat());
const mesh = new Mesh(geometry);
mesh.matrixAutoUpdate = false;
mesh.matrix.copy(transform);
mesh.updateMatrixWorld(true);
const recovered = meshSourceShape(mesh, transform.toArray());
recovered.vertices.forEach((v, i) =>
  v.forEach((n, k) =>
    check(
      Math.abs(n - vertices[i][k]) < 1e-8,
      'Inverse common transform recovers source mm',
    ),
  ),
);
geometry.dispose();
mesh.material.dispose();

// Recompute actual rendered surfaces from immutable GLBs, not report extents.
const vessels = catalog.structures.filter((s) => s.system === 'vessels');
same(vessels.length, 223);
const bundles = catalog.bundles.filter((b) =>
  vessels.some((s) => s.bundle === b.id),
);
same(report.bundles, bundles);
const shapes = new Map();
for (const b of bundles) {
  const bytes = await fs.readFile(root + b.id + '.glb');
  same(hash(bytes), b.sha256);
  const { scene } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  scene.updateMatrixWorld(true);
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const s = vessels.find(
      (s) => s.bundle === b.id && s.nodeName === mesh.name,
    );
    if (s) {
      check(!shapes.has(s.id));
      shapes.set(
        s.id,
        meshSourceShape(
          mesh,
          catalog.coordinateSystem.sourceToSceneColumnMajor,
        ),
      );
    }
  });
}
same(shapes.size, vessels.length);
same(
  report.vessels,
  vessels.map((s) => ({
    id: s.id,
    fmaId: s.fmaId,
    kind: vesselKind(s),
    recordSha256: hash(JSON.stringify(s)),
    vertices: shapes.get(s.id).vertices.length,
    triangles: shapes.get(s.id).faces.length,
  })),
);
let crossTypePairs = 0,
  oppositeSidePairs = 0,
  boundsPruned = 0;
const comparisons = [];
for (let i = 0; i < vessels.length; i++)
  for (let j = i + 1; j < vessels.length; j++) {
    const a = vessels[i],
      b = vessels[j],
      ka = vesselKind(a),
      kb = vesselKind(b);
    if (
      !['artery', 'vein'].includes(ka) ||
      !['artery', 'vein'].includes(kb) ||
      ka === kb
    )
      continue;
    crossTypePairs++;
    if (
      ['left', 'right'].includes(a.laterality) &&
      ['left', 'right'].includes(b.laterality) &&
      a.laterality !== b.laterality
    ) {
      oppositeSidePairs++;
      continue;
    }
    if (!shapeCandidate(shapes.get(a.id), shapes.get(b.id))) {
      boundsPruned++;
      continue;
    }
    comparisons.push({
      a: a.id,
      b: b.id,
      fmaA: a.fmaId,
      fmaB: b.fmaId,
      nameA: a.sourceName,
      nameB: b.sourceName,
      ...compareTranslatedShape(shapes.get(a.id), shapes.get(b.id)),
    });
  }
same(
  { crossTypePairs, oppositeSidePairs, boundsPruned },
  {
    crossTypePairs: report.crossTypePairs,
    oppositeSidePairs: report.oppositeSidePairs,
    boundsPruned: report.boundsPruned,
  },
);
same(crossTypePairs, oppositeSidePairs + boundsPruned + comparisons.length);
same(
  comparisons,
  report.comparisons,
  'Exact committed diagnostics reproduce from product GLBs',
);
same(
  comparisons.filter((c) => c.similar),
  [],
);
const example = shapes.get(vessels[0].id);
same(
  report.controls.translated,
  compareTranslatedShape(
    example,
    prepareShape(
      example.vertices.map((v) => v.map((n, k) => n + [12, -5, 8][k])),
      example.faces,
    ),
  ),
);
same(
  report.controls.scaled,
  compareTranslatedShape(
    example,
    prepareShape(
      example.vertices.map((v) => v.map((n) => n * 1.25)),
      example.faces,
    ),
  ),
);
check(report.controls.translated.similar);
check(!report.controls.scaled.similar);
const foot = JSON.parse(
  await fs.readFile('content/foot-vascular-source-audit.json'),
);
same(
  report.heldControls.map((c) => c.heldId),
  ['FMA44883', 'FMA44884'],
);
for (const c of report.heldControls) {
  const source = foot.results.find((s) => s.fmaId === c.heldId);
  same(c.admitted, false);
  check(!catalog.structures.some((s) => s.fmaId === c.heldId));
  same(c.source, {
    file: source.files[0].file,
    sha256: source.files[0].sha256,
  });
  check(c.similar);
  for (const direction of [c.aToAlignedB, c.alignedBToA]) {
    check(direction.samples > 0 && direction.samples <= shapeCriteria.samples);
    check(
      direction.withinTenthMm / direction.samples >= shapeCriteria.fraction,
    );
    check(
      Number.isFinite(direction.maxMm) &&
        direction.maxMm <= shapeCriteria.maxMm,
    );
  }
}
const result = {
  passed: true,
  assertions,
  vessels: vessels.length,
  bundles: bundles.length,
  crossTypePairs,
  oppositeSidePairs,
  boundsPruned,
  compared: comparisons.length,
  flagged: comparisons.filter((c) => c.similar).length,
  heldControls: report.heldControls.length,
  catalogSha256: hash(raw),
  auditSha256: hash(reportRaw),
  geometryChanged: false,
  clinicalValidation: false,
  limitations:
    'Recomputed all current rendered vascular shapes and the extent-filtered comparison from committed GLBs. Held-control raw OBJ distances are recorded evidence, not recomputed by this default test; regenerate the audit with the original hash-verified raw cache. Numerical screening is not a complete topology, surface-equivalence or clinical audit.',
};
await fs.writeFile(
  'docs/vessel-shape-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
