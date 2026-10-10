import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Vector3 } from 'three';
import { cache } from './bodyparts-archive.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sha256 } from './source-geometry-screen.mjs';
import { sourceObjShape, mergeSourceShapes, sourceTriangleSet } from './source-surface-audit.mjs';
import { spatialDistanceIndex, uniqueSourceVertices, distanceSummary, componentEndBands } from './source-spatial-math.mjs';

export const opticPairs = [
  { side: 'right', id: 'FMA50875', name: 'right optic nerve', files: ['FJ1364', 'FJ1819'] },
  { side: 'left', id: 'FMA50878', name: 'left optic nerve', files: ['FJ1313', 'FJ1772'] },
];
const preparationSha256 = '80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7';
const visualAuditSha256 = '5b1a018edcc3b4d271eeb5ae0fe81aef1b92161e1c179585573602ffd57184f6';
const visualIds = ['FMA62045', 'FMA62382', 'FMA67936'];
const globeIds = ['FMA12514', 'FMA12515'];

export function validateOpticPins(context, prep, visual) {
  assert.deepEqual(prep.evidence, context.evidence, 'Source preparation is stale');
  assert.deepEqual(visual.evidence, context.evidence, 'Visual pathway audit is stale');
  for (const pair of opticPairs) {
    const record = context.inventory.records.find((r) => r.tree === 'isa' && r.id === pair.id);
    assert(record && record.name === pair.name, `Wrong or absent optic definition: ${pair.id}`);
    assert.equal(record.status, 'held-source-review', `Optic hold changed: ${pair.id}`);
    assert.deepEqual(record.files, pair.files, `Optic source files changed: ${pair.id}`);
    const sourceRow = context.records.find((r) => r.tree === 'isa' && r.id === pair.id);
    assert.deepEqual(sourceRow?.files, pair.files, `Source table changed: ${pair.id}`);
    for (const file of pair.files) {
      const row = prep.files.find((f) => f.tree === 'isa' && f.file === file);
      assert(row && row.heldBy.includes(pair.id) && row.admitted === false && !row.candidateFor.length,
        `Optic file is not held by expected definition: ${file}`);
      assert(row.sha256 && row.geometrySha256 && row.bytes > 0, `Missing optic fingerprint: ${file}`);
      assert(pair.side === 'right' ? row.bounds.max[0] < 0 : row.bounds.min[0] >= -0.01 && row.bounds.max[0] > 0,
        `Optic laterality screen changed: ${file}`);
    }
  }
  for (const id of visualIds) {
    const group = visual.groups.find((g) => g.id === id);
    assert(group && group.tree === 'isa' && group.admitted === false && group.sources.length,
      `Visual context changed: ${id}`);
    const record = context.records.find((r) => r.tree === 'isa' && r.id === id);
    assert.deepEqual(record?.files, group.files, `Visual context table changed: ${id}`);
  }
}

export function compareOpticShapes(a, b) {
  const setA = sourceTriangleSet(a), setB = sourceTriangleSet(b);
  const exactSharedTriangles = [...setA].filter((t) => setB.has(t)).length;
  const direction = (source, target) => {
    const nearest = spatialDistanceIndex(target);
    const vertices = distanceSummary(uniqueSourceVertices(source), nearest);
    const centroids = distanceSummary(
      source.triangles.map(({ triangle }) => triangle.getMidpoint(new Vector3()).toArray()),
      nearest,
      source.triangles.map(({ triangle }) => triangle.getArea()),
    );
    return { vertices, areaWeightedTriangleCentroids: centroids };
  };
  const bands = (shape, other) => {
    const nearest = spatialDistanceIndex(other);
    return componentEndBands(shape).map(({ low, high, ...component }) => ({
      ...component,
      low: distanceSummary(low, nearest),
      high: distanceSummary(high, nearest),
    }));
  };
  return {
    exactSharedTriangles,
    triangleCounts: [a.faces.length, b.faces.length],
    exactUniqueTriangleCounts: [setA.size, setB.size],
    aToB: direction(a, b),
    bToA: direction(b, a),
    componentEndBands: { a: bands(a, b), b: bands(b, a) },
  };
}

export function verifyOpticSourceBytes(source, bytes, key) {
  assert.equal(sha256(bytes), source.sha256, `Source hash changed: ${key}`);
  if (source.bytes !== undefined)
    assert.equal(bytes.length, source.bytes, `Source size changed: ${key}`);
  return sourceObjShape(bytes);
}

export async function opticAlternativeReport() {
  const context = await loadSourceHolds();
  const prepBytes = await readFile('content/source-geometry-screen.json');
  assert.equal(sha256(prepBytes), preparationSha256, 'Source preparation revision changed');
  const prep = JSON.parse(prepBytes);
  const visualBytes = await readFile('docs/visual-pathway-source-audit.json');
  assert.equal(sha256(visualBytes),visualAuditSha256,'Visual pathway revision changed');
  const visual = JSON.parse(visualBytes);
  validateOpticPins(context, prep, visual);

  const entries = [];
  for (const pair of opticPairs) {
    for (const file of pair.files) {
      const source = prep.files.find((f) => f.tree === 'isa' && f.file === file);
      entries.push({ key: `isa/${file}`, id: pair.id, name: `${pair.name} ${file}`,
        side: pair.side, role: 'candidate', tree: 'isa', held: true,
        sources: [{ file, sha256: source.sha256, bytes: source.bytes, geometrySha256: source.geometrySha256 }] });
    }
  }
  for (const id of globeIds) {
    const owner = context.catalog.structures.find((s) => s.fmaId === id);
    assert(owner && owner.sourceTree === 'partof' && owner.sources.length, `Globe owner absent: ${id}`);
    entries.push({ key: owner.id, id, name: owner.sourceName,
      side: id === 'FMA12514' ? 'right' : 'left', role: 'globe-context',
      tree: owner.sourceTree, held: false, sources: owner.sources });
  }
  for (const id of visualIds) {
    const group = visual.groups.find((g) => g.id === id);
    entries.push({ key: `isa/${id}`, id, name: group.name, side: group.side,
      role: 'visual-context', tree: 'isa', held: false,
      sources: group.sources.map(({ file, sha256, bytes, geometrySha256 }) => ({ file, sha256, bytes, geometrySha256 })) });
  }
  const sphenoid = context.catalog.structures.find((s) => s.fmaId === 'FMA52736');
  assert(sphenoid && sphenoid.sourceTree === 'isa' && sphenoid.sourceName === 'sphenoid bone');
  entries.push({ key: sphenoid.id, id: sphenoid.fmaId, name: 'whole sphenoid bone',
    side: 'midline', role: 'bone-context', tree: 'isa', held: false, sources: sphenoid.sources });

  const meshes = [];
  for (const entry of entries) {
    const shapes = [];
    for (const source of entry.sources) {
      assert(/^FJ\d+M?$/.test(source.file) && /^[a-f0-9]{64}$/.test(source.sha256));
      const bytes = await readFile(path.join(cache, entry.tree, source.file + '.obj'));
      shapes.push(verifyOpticSourceBytes(source, bytes, `${entry.tree}/${source.file}`));
    }
    const shape = shapes.length === 1 ? shapes[0] : mergeSourceShapes(shapes);
    meshes.push({ ...entry, shape });
  }
  const metadata = meshes.map(({ shape, ...entry }) => ({ ...entry,
    vertices: shape.vertices.length, triangles: shape.faces.length,
    degenerateTriangles: shape.triangles.filter((t) => t.degenerate).length,
    bounds: { min: shape.min, max: shape.max },
    geometrySha256: sha256(JSON.stringify({ vertices: shape.vertices, faces: shape.faces })),
  }));
  const pairs = opticPairs.map((pair) => {
    const [a, b] = pair.files.map((file) => meshes.find((m) => m.key === `isa/${file}`).shape);
    return { ...pair, metrics: compareOpticShapes(a, b), held: true, admissionApproved: false };
  });
  const algorithmFiles = ['optic-alternative-report.mjs', 'source-surface-audit.mjs', 'source-spatial-math.mjs', 'source-topology.mjs'];
  const algorithmSha256 = Object.fromEntries(await Promise.all(algorithmFiles.map(async (file) =>
    [file, sha256((await readFile(new URL(`./${file}`, import.meta.url), 'utf8')).replaceAll('\r\n', '\n'))])));
  const report = {
    schemaVersion: 1, purpose:'source-only-optic-alternative-review', sourceVersion: context.evidence.sourceVersion,
    evidence: context.evidence, preparationSha256, visualAuditSha256: sha256(visualBytes),
    algorithmSha256, coordinateSystem: context.catalog.coordinateSystem,
    license: prep.license, credit: prep.credit, licenseUrl: prep.licenseUrl,
    sourceArchives: prep.archives, meshes: metadata, pairs,
    coverage: { opticAlternatives: 'Two held files on each side, compared within side only',
      context: 'Exact catalogue eyeball owners, existing visual-pathway audit groups, and whole sphenoid bone',
      opticCanal: 'No independently segmented optic canal source is asserted' },
    admissions:0, sourceGeometryChanged:false, admissionApproved: false, clinicalValidation: false, patientRegistration: false,
    limitations: [
      'Original BodyParts3D millimetre coordinates and triangles are retained. No alignment, welding, repair or source relabelling.',
      'Every exact unique source vertex and every source triangle centroid is queried against the other full triangle surface in both directions. Centroids are area weighted; zero-area faces retain a sample with zero weight.',
      'Distances are unsigned sampled diagnostics, not continuous surface distance, fibre continuity, identity, clinical anatomy or surgical clearance.',
      'componentEndBands are longest-axis geometric extrema on exact-coordinate connected components, NOT anatomical terminals.',
      'Whole sphenoid bone is spatial context, NOT a segmented optic canal. Globe and visual context are source-labelled and do not validate the optic alternatives.',
      'Both optic source definitions remain held. Radiologist review bound to this exact report and source revision is required before any admission.'
    ],
  };
  report.reportRevision = sha256(JSON.stringify(report));
  return { report, meshes };
}
