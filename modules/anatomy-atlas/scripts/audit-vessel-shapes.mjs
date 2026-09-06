import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { cache } from './bodyparts-archive.mjs';
import {
  prepareShape,
  meshSourceShape,
  shapeCandidate,
  compareTranslatedShape,
  shapeCriteria,
} from './vessel-shape-math.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const root = 'public/models/bodyparts3d/full-body/';
const bytes = await fs.readFile(root + 'catalog.json'),
  catalog = JSON.parse(bytes);
assert.equal(
  hash(bytes),
  'b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5',
);
const compiled = await build({
  entryPoints: ['lib/anatomy-vessels.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { vesselKind } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const vessels = catalog.structures.filter((s) => s.system === 'vessels');
assert.equal(vessels.length, 223);
const shapes = new Map(),
  bundles = catalog.bundles.filter((b) =>
    vessels.some((s) => s.bundle === b.id),
  );
for (const b of bundles) {
  const data = await fs.readFile(root + b.id + '.glb');
  assert.equal(hash(data), b.sha256);
  const { scene } = await new GLTFLoader().parseAsync(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    '',
  );
  scene.updateMatrixWorld(true);
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const s = vessels.find(
      (s) => s.bundle === b.id && s.nodeName === mesh.name,
    );
    if (s)
      shapes.set(
        s.id,
        meshSourceShape(
          mesh,
          catalog.coordinateSystem.sourceToSceneColumnMajor,
        ),
      );
  });
}
assert.equal(shapes.size, vessels.length);
const comparisons = [];
let crossTypePairs = 0,
  oppositeSidePairs = 0,
  boundsPruned = 0;
for (let i = 0; i < vessels.length; i++)
  for (let j = i + 1; j < vessels.length; j++) {
    const a = vessels[i],
      b = vessels[j],
      kindA = vesselKind(a),
      kindB = vesselKind(b);
    if (
      !['artery', 'vein'].includes(kindA) ||
      !['artery', 'vein'].includes(kindB) ||
      kindA === kindB
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
    const shapeA = shapes.get(a.id),
      shapeB = shapes.get(b.id);
    if (!shapeCandidate(shapeA, shapeB)) {
      boundsPruned++;
      continue;
    }
    const row = {
      a: a.id,
      b: b.id,
      fmaA: a.fmaId,
      fmaB: b.fmaId,
      nameA: a.sourceName,
      nameB: b.sourceName,
      ...compareTranslatedShape(shapeA, shapeB),
    };
    comparisons.push(row);
    console.log(JSON.stringify(row));
  }
// Independent diagnostic control surfaces, never stored in product geometry.
const example = shapes.get(vessels[0].id);
const translated = prepareShape(
  example.vertices.map((v) => v.map((n, k) => n + [12, -5, 8][k])),
  example.faces,
);
const scaled = prepareShape(
  example.vertices.map((v) => v.map((n) => n * 1.25)),
  example.faces,
);
const controls = {
  translated: compareTranslatedShape(example, translated),
  scaled: compareTranslatedShape(example, scaled),
};
assert(controls.translated.similar);
assert(!controls.scaled.similar);
// Two real previously held source controls test the near-translated case without
// admitting either venous surface or modifying the rendered arterial geometry.
const footAudit = JSON.parse(
  await fs.readFile('content/foot-vascular-source-audit.json', 'utf8'),
);
const heldControls = [];
for (const [arteryId, heldId] of [
  ['FMA43943', 'FMA44883'],
  ['FMA43944', 'FMA44884'],
]) {
  const artery = vessels.find((s) => s.fmaId === arteryId);
  const held = footAudit.results.find((s) => s.fmaId === heldId);
  assert.equal(held.files.length, 1);
  const file = held.files[0],
    raw = await fs.readFile(cache + '/isa/' + file.file + '.obj');
  assert.equal(hash(raw), file.sha256);
  const vertices = [],
    faces = [];
  for (const line of raw.toString().split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields[0] === 'v') vertices.push(fields.slice(1).map(Number));
    if (fields[0] === 'f')
      faces.push(
        fields.slice(1).map((value) => {
          const n = Number(value.split('/')[0]);
          return n < 0 ? vertices.length + n : n - 1;
        }),
      );
  }
  const result = compareTranslatedShape(
    shapes.get(artery.id),
    prepareShape(vertices, faces),
  );
  assert(result.similar);
  heldControls.push({
    arteryId,
    heldId,
    source: { file: file.file, sha256: file.sha256 },
    ...result,
    admitted: false,
  });
}
const report = {
  sourceCommit: 'd2dacd10edeac3ead12fd26376aa3377b223ffc7',
  catalogSha256: hash(bytes),
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  checked: '2026-09-06',
  criteria: shapeCriteria,
  vessels: vessels.map((s) => ({
    id: s.id,
    fmaId: s.fmaId,
    kind: vesselKind(s),
    recordSha256: hash(JSON.stringify(s)),
    vertices: shapes.get(s.id).vertices.length,
    triangles: shapes.get(s.id).faces.length,
  })),
  bundles,
  crossTypePairs,
  oppositeSidePairs,
  boundsPruned,
  comparisons,
  controls,
  heldControls,
  sourceGeometryChanged: false,
  admissionsChanged: false,
  clinicalValidation: false,
  limitations:
    'Screening of the current 223 rendered vascular identities only. Different artery/vein types, excluding opposite explicit sides; extent-only pruning, with no triangle-count exclusion; translation-only bounding-centre alignment in source mm and at most 128 deterministic samples per direction to every comparison triangle, with degenerate-face fallback. No scale, rotation, reflection or topology equivalence test. Similarity is a source-review signal, not evidence of copying, wrong anatomy, vascular correspondence or patient registration. No sampled match is clinical validation, and no flag automatically removes or admits tissue.',
};
await fs.writeFile(
  'content/vessel-shape-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    vessels: vessels.length,
    crossTypePairs,
    oppositeSidePairs,
    boundsPruned,
    compared: comparisons.length,
    flagged: comparisons.filter((r) => r.similar).map((r) => [r.fmaA, r.fmaB]),
  }),
);
