import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadSourceHolds } from './load-source-holds.mjs';
import { inspectSourceBytes, sha256, sourceKey } from './source-geometry-screen.mjs';
import { sourceObjShape, compareSourceSurfaces } from './source-surface-audit.mjs';

// These are complete source definitions, including their alternative components.
export const pelvicFloorFiles = Object.freeze({
  FMA45854: ['FJ2550'],
  FMA45855: ['FJ1457M', 'FJ2545'],
  FMA45856: ['FJ2551'],
  FMA45857: ['FJ1458M', 'FJ2546'],
  FMA45858: ['FJ2549'],
  FMA45859: ['FJ1453M', 'FJ2544'],
  FMA46442: ['FJ1465', 'FJ1465M', 'FJ2552', 'FJ2553'],
});
export const pinnedGeometryScreenSha256 =
  '80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7';
export const disposition = 'held-pending-radiologist-adjudication';

// A face with zero-X vertices and vertices on only one side belongs to that
// side. "Crossing" requires both strictly negative and strictly positive X.
// The four categories are mutually exclusive and cover every triangle.
export function measureSourceXSurface({ vertices, faces }) {
  assert(Array.isArray(vertices) && Array.isArray(faces), 'Missing source geometry');
  const referenced = new Set();
  const triangles = Object.fromEntries(
    ['entirelyNegative', 'entirelyPositive', 'crossingPlane', 'onPlane'].map(
      (key) => [key, { count: 0, surfaceAreaMm2: 0 }],
    ),
  );
  for (const face of faces) {
    assert(Array.isArray(face) && face.length === 3, 'Invalid source triangle');
    const points = face.map((index) => {
      assert(Number.isInteger(index) && index >= 0 && index < vertices.length, 'Invalid source vertex index');
      referenced.add(index);
      const point = vertices[index];
      assert(Array.isArray(point) && point.length === 3 && point.every(Number.isFinite), 'Invalid source vertex');
      return point;
    });
    const xs = points.map((p) => p[0]);
    const hasNegative = xs.some((x) => x < 0);
    const hasPositive = xs.some((x) => x > 0);
    const category = hasNegative && hasPositive ? 'crossingPlane'
      : hasNegative ? 'entirelyNegative'
      : hasPositive ? 'entirelyPositive' : 'onPlane';
    const [a, b, c] = points;
    const ab = b.map((n, i) => n - a[i]);
    const ac = c.map((n, i) => n - a[i]);
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const area = Math.hypot(...cross) / 2;
    assert(Number.isFinite(area), 'Non-finite source triangle area');
    triangles[category].count++;
    triangles[category].surfaceAreaMm2 += area;
  }
  const counts = { negative: 0, zero: 0, positive: 0 };
  for (const index of referenced) {
    const x = vertices[index][0];
    counts[x < 0 ? 'negative' : x > 0 ? 'positive' : 'zero']++;
  }
  return {
    referencedVertices: referenced.size,
    unreferencedVertices: vertices.length - referenced.size,
    referencedXDistribution: counts,
    triangles,
    totalSurfaceAreaMm2: Object.values(triangles).reduce((sum, row) => sum + row.surfaceAreaMm2, 0),
  };
}

export function selectPelvicFloorDefinitions(context) {
  const definitions = [];
  for (const [id, files] of Object.entries(pelvicFloorFiles)) {
    const matches = context.records.filter((r) => r.id === id);
    assert(matches.length, `Missing source definition ${id}`);
    for (const record of matches) {
      assert(['isa', 'partof'].includes(record.tree), 'Unexpected source tree');
      assert.deepEqual(record.files, files, `Changed component membership: ${record.tree}/${id}`);
      const inventoryMatches = context.inventory.records.filter(
        (r) => r.tree === record.tree && r.id === id,
      );
      assert.equal(inventoryMatches.length, 1, 'Missing or duplicate inventory definition');
      const indexed = inventoryMatches[0];
      assert.equal(indexed.name, record.name, 'Source name differs from inventory');
      assert.deepEqual(indexed.files, files, 'Inventory component membership changed');
      assert.equal(indexed.status, 'held-source-review', 'Source hold status changed');
      assert.equal(indexed.displayedId, null, 'Held source is displayed');
      const hold = context.policy.inspect(record);
      assert.equal(hold.status, 'blocked-known-source-hold', 'Source hold changed');
      assert(hold.directReason, 'Direct pelvic-floor hold is missing');
      assert.equal(indexed.heldReason, hold.directReason, 'Inventory hold reason changed');
      definitions.push({ tree: record.tree, id, name: record.name, files: [...files], holdReason: hold.directReason });
    }
  }
  return definitions;
}

export function parsePinnedGeometryScreen(bytes, context) {
  assert.equal(sha256(bytes), pinnedGeometryScreenSha256, 'Pinned geometry screen changed');
  const screen = JSON.parse(bytes);
  assert.equal(screen.schemaVersion, 1);
  assert.deepEqual(screen.evidence, context.evidence, 'Geometry screen source evidence changed');
  assert.equal(screen.license, context.inventory.license);
  assert.equal(screen.credit, context.inventory.credit);
  assert.deepEqual(screen.archives, context.inventory.archives);
  assert(Array.isArray(screen.files), 'Missing screened source files');
  return screen;
}

export function inspectPelvicFloorComponent(target, bytes, inventory, screenFile) {
  assert(screenFile, `Missing geometry screen member ${sourceKey(target)}`);
  assert.equal(sourceKey(screenFile), sourceKey(target), 'Geometry screen member changed');
  const checked = inspectSourceBytes({ ...target, candidateFor: [] }, bytes, inventory);
  for (const field of [
    'bytes', 'crc32', 'sha256', 'geometrySha256', 'bounds', 'centre',
    'extent', 'sourceXDistribution', 'vertices', 'triangles',
    'degenerateTriangles',
  ]) assert.deepEqual(checked[field], screenFile[field], `Geometry screen ${field} changed: ${sourceKey(target)}`);
  const shape = sourceObjShape(bytes);
  const sourceXSurface = measureSourceXSurface(shape);
  assert.equal(sourceXSurface.referencedVertices + sourceXSurface.unreferencedVertices, checked.vertices);
  assert.equal(Object.values(sourceXSurface.triangles).reduce((sum, row) => sum + row.count, 0), checked.triangles);
  return {
    file: {
      tree: target.tree,
      file: target.file,
      bytes: checked.bytes,
      crc32: checked.crc32,
      sha256: checked.sha256,
      geometrySha256: checked.geometrySha256,
      vertices: checked.vertices,
      triangles: checked.triangles,
      degenerateTriangles: checked.degenerateTriangles,
      bounds: checked.bounds,
      sourceXDistribution: checked.sourceXDistribution,
      sourceXSurface,
      disposition,
      clinicalApproval: false,
    },
    shape: {
      tree: target.tree,
      file: target.file,
      vertices: shape.vertices,
      faces: shape.faces,
      min: shape.min,
      max: shape.max,
      centre: shape.centre,
      extent: shape.extent,
      triangles: shape.triangles,
    },
  };
}

export async function buildPelvicFloorReview({ cacheRoot = resolve('../work/bodyparts3d') } = {}) {
  const context = await loadSourceHolds();
  const groups = selectPelvicFloorDefinitions(context);
  const screenBytes = await readFile('content/source-geometry-screen.json');
  const screen = parsePinnedGeometryScreen(screenBytes, context);
  const screenMap = new Map();
  for (const member of screen.files) {
    const key = sourceKey(member);
    assert(!screenMap.has(key), 'Duplicate geometry screen member');
    screenMap.set(key, member);
  }
  const targets = new Map();
  for (const group of groups) for (const file of group.files) {
    const key = sourceKey({ tree: group.tree, file });
    const matches = context.inventory.assets.filter((a) => sourceKey(a) === key);
    assert.equal(matches.length, 1, `Missing or duplicate archive inventory member ${key}`);
    const member = screenMap.get(key);
    assert(member, `Missing geometry screen member ${key}`);
    assert(member.heldBy.includes(group.id), `Screen lost hold membership ${key}`);
    targets.set(key, { tree: group.tree, file, bytes: matches[0].bytes, crc32: matches[0].crc32 });
  }
  const inspected = [];
  for (const target of targets.values()) {
    const bytes = await readFile(join(cacheRoot, target.tree, `${target.file}.obj`));
    inspected.push(inspectPelvicFloorComponent(target, bytes, context.inventory, screenMap.get(sourceKey(target))));
  }
  const files = inspected.map((item) => item.file);
  const shapes = inspected.map((item) => item.shape);
  const shapeMap = new Map(shapes.map((s) => [sourceKey(s), s]));
  const comparisons = [];
  for (const group of groups) {
    for (let i = 0; i < group.files.length; i++) for (let j = i + 1; j < group.files.length; j++) {
      const a = { tree: group.tree, file: group.files[i] };
      const b = { tree: group.tree, file: group.files[j] };
      const measured = compareSourceSurfaces(shapeMap.get(sourceKey(a)), shapeMap.get(sourceKey(b)));
      comparisons.push({ tree: group.tree, id: group.id, a: a.file, b: b.file,
        method: 'bidirectional-sampled-original-source-coordinate-surfaces',
        exactTriangles: measured.exactTriangles, aToB: measured.aToB,
        bToA: measured.bToA, sampledProximityFlag: measured.flagged,
        anatomicalEquivalence: 'not-determined', disposition });
    }
  }
  return {
    report: {
      schemaVersion: 1,
      source: 'BodyParts3D v4 original cached OBJ',
      coordinateSpace: 'original source coordinates; no transform',
      evidence: { ...context.evidence, geometryScreenSha256: pinnedGeometryScreenSha256 },
      license: context.inventory.license,
      credit: context.inventory.credit,
      licenseUrl: screen.licenseUrl,
      groups: groups.map((group) => ({ ...group, disposition, clinicalApproval: false })),
      files,
      comparisons,
      summary: { definitions: groups.length, components: files.length, comparisons: comparisons.length, admissions: 0 },
      xMeasurement: 'Per-component original-coordinate X bounds, referenced/unreferenced vertex counts, referenced vertex X counts, and source triangle surface areas in mm². Entirely negative includes plane-touching faces with negative vertices only; entirely positive similarly includes plane-touching faces with positive vertices only; crossing requires both negative and positive vertices; on-plane means every vertex has X=0. These are disjoint categories, not volumes or validated anatomical sides.',
      comparisonLimit: 'Distances sample source vertices against the other source surface in both directions; they do not establish anatomical equivalence, continuity or completeness.',
      disposition,
      clinicalApproval: false,
      admissionsChanged: false,
    },
    shapes,
  };
}
