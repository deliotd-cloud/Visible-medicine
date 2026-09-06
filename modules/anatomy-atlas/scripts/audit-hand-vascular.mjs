import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { Triangle, Vector3 } from 'three';
import {
  archiveReader,
  conceptMap,
  parallelMap,
  cache,
} from './bodyparts-archive.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { objBounds } from './audit-legacy-anatomy.mjs';
import { handVascularCandidates } from './hand-vascular-selections.mjs';

const sourceCommit = '2418244c0dcdb01807c6398d94623651fca6f7fa';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const raw = execFileSync(
  'git',
  ['show', sourceCommit + ':public/models/bodyparts3d/full-body/catalog.json'],
  { maxBuffer: 8e6 },
);
assert.equal(
  hash(raw),
  'd740da1d11bdf93d26ebe60ccdc82b7fc16909713779d7d2933d3d9dc10988cb',
);
const baseline = JSON.parse(raw);
const inventory = JSON.parse(
  execFileSync(
    'git',
    ['show', sourceCommit + ':content/source-inventory.json'],
    { maxBuffer: 16e6 },
  ),
);
const rendered = new Map(
  inventory.assets
    .filter((asset) => asset.representedBy.length && asset.geometrySha256)
    .map((asset) => [asset.geometrySha256, asset.representedBy]),
);
const [isa, zip] = await Promise.all([conceptMap('isa'), archiveReader('isa')]);

function shape(bytes) {
  const vertices = [],
    triangles = new Set();
  for (const line of bytes.toString().split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields[0] === 'v') vertices.push(fields.slice(1, 4).map(Number));
    if (fields[0] === 'f') {
      assert.equal(fields.length, 4, 'Only source triangles accepted');
      triangles.add(
        fields
          .slice(1)
          .map((field) => {
            const index = Number(field.split('/')[0]);
            const point =
              vertices[index < 0 ? vertices.length + index : index - 1];
            assert(point?.every(Number.isFinite));
            return point.join(',');
          })
          .sort()
          .join(';'),
      );
    }
  }
  assert(vertices.length && triangles.size, 'No finite triangular surface');
  return { vertices, triangles };
}
function merge(parts) {
  return {
    vertices: parts.flatMap((part) => part.vertices),
    triangles: new Set(parts.flatMap((part) => [...part.triangles])),
  };
}
function boundsOf(obj) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const point of obj.vertices)
    point.forEach((value, k) => {
      min[k] = Math.min(min[k], value);
      max[k] = Math.max(max[k], value);
    });
  return { min, max };
}
function boundsNear(a, b) {
  return a.min.every(
    (value, k) => value <= b.max[k] + 1 && a.max[k] + 1 >= b.min[k],
  );
}
function prepare(row) {
  row.bounds = boundsOf(row.obj);
  row.surfaces = [...row.obj.triangles].map(
    (triangle) =>
      new Triangle(
        ...triangle
          .split(';')
          .map((point) => new Vector3(...point.split(',').map(Number))),
      ),
  );
  row.degenerateTriangles = row.surfaces.filter(
    (triangle) => triangle.getArea() <= 1e-10,
  ).length;
  return row;
}
function segmentDistance(point, start, end) {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    dz = end.z - start.z;
  const length = dx * dx + dy * dy + dz * dz;
  const t = length
    ? Math.max(
        0,
        Math.min(
          1,
          ((point.x - start.x) * dx +
            (point.y - start.y) * dy +
            (point.z - start.z) * dz) /
            length,
        ),
      )
    : 0;
  return (
    (point.x - start.x - t * dx) ** 2 +
    (point.y - start.y - t * dy) ** 2 +
    (point.z - start.z - t * dz) ** 2
  );
}
function surfaceDistance(a, b) {
  const distances = [],
    closePoints = [],
    target = new Vector3();
  for (
    let i = 0;
    i < a.obj.vertices.length;
    i += Math.max(1, Math.ceil(a.obj.vertices.length / 128))
  ) {
    const point = new Vector3(...a.obj.vertices[i]);
    let distance = Infinity;
    for (const triangle of b.surfaces) {
      let candidate =
        triangle.getArea() > 1e-10
          ? point.distanceToSquared(triangle.closestPointToPoint(point, target))
          : NaN;
      if (!Number.isFinite(candidate))
        candidate = Math.min(
          segmentDistance(point, triangle.a, triangle.b),
          segmentDistance(point, triangle.b, triangle.c),
          segmentDistance(point, triangle.c, triangle.a),
        );
      distance = Math.min(distance, candidate);
    }
    assert(Number.isFinite(distance), 'Non-finite point-to-surface result');
    if (distance <= 0.25 ** 2) closePoints.push(point.toArray());
    distances.push(Math.sqrt(distance));
  }
  distances.sort((a, b) => a - b);
  return {
    samples: distances.length,
    withinQuarterMm: distances.filter((v) => v <= 0.25).length,
    withinOneMm: distances.filter((v) => v <= 1).length,
    medianMm: distances[Math.floor(distances.length / 2)],
    maxMm: distances.at(-1),
    closePointBounds: closePoints.length
      ? boundsOf({ vertices: closePoints })
      : null,
  };
}
const old = [];
for (const structure of baseline.structures.filter(
  (item) => item.regions.includes('hand') || item.regions.includes('forearm'),
)) {
  const parts = [];
  for (const source of structure.sources) {
    const bytes = await fs.readFile(
      `${cache}/${structure.sourceTree}/${source.file}.obj`,
    );
    assert.equal(hash(bytes), source.sha256);
    parts.push(shape(bytes));
  }
  old.push(
    prepare({
      id: structure.fmaId,
      existing: true,
      regions: [...new Set([...structure.regions, 'hand'])],
      system: structure.system,
      obj: merge(parts),
    }),
  );
}
const fetched = await parallelMap(
  handVascularCandidates(isa),
  4,
  async (candidate) => {
    const aliases = inventory.records.filter((record) =>
      record.files.some((file) => candidate.files.includes(file)),
    );
    // Use the pinned pre-audit hold state, so later decisions remain reproducible.
    assert(
      !aliases.some((record) => record.status === 'held-source-review'),
      'Previously held source component cannot enter this audit queue',
    );
    const parts = [],
      files = [];
    for (const file of candidate.files) {
      assert(
        !baseline.structures.some((item) =>
          item.sources.some((source) => source.file === file),
        ),
        'Already rendered source',
      );
      const bytes = await zip.get(file),
        fingerprint = geometryFingerprint(bytes);
      const entry = zip.entries.get(file + '.obj');
      const inventoried = inventory.assets.find(
        (asset) => asset.tree === 'isa' && asset.file === file,
      );
      assert.equal(entry.crc, inventoried.crc32);
      assert.equal(bytes.length, inventoried.bytes);
      const obj = shape(bytes);
      parts.push(obj);
      files.push({
        file,
        sha256: hash(bytes),
        geometrySha256: fingerprint,
        canonicalDuplicateOwners: rendered.get(fingerprint) ?? [],
        bytes: bytes.length,
        crc32: entry.crc,
        bounds: objBounds(bytes),
        vertices: obj.vertices.length,
        triangles: obj.triangles.size,
      });
    }
    const row = prepare({
      id: candidate.fma,
      existing: false,
      regions: [candidate.region],
      system: candidate.system,
      obj: merge(parts),
    });
    const envelope = { min: [-600, -300, 350], max: [600, 300, 1100] };
    const evidence = {
      fmaId: candidate.fma,
      name: candidate.name,
      region: candidate.region,
      system: candidate.system,
      files,
      bounds: row.bounds,
      degenerateTriangles: row.degenerateTriangles,
      grossEnvelope: envelope,
      lateralityPass: candidate.name.includes('right')
        ? row.bounds.max[0] < 0
        : row.bounds.min[0] > 0,
      grossPositionPass: row.bounds.min.every(
        (value, k) =>
          value >= envelope.min[k] && row.bounds.max[k] <= envelope.max[k],
      ),
      exactDefinitions: aliases
        .filter(
          (record) =>
            record.files.length === candidate.files.length &&
            record.files.every((file) => candidate.files.includes(file)),
        )
        .map(({ tree, id, name }) => ({ tree, id, name })),
      admitted: false,
      clinicalValidation: false,
    };
    console.log(
      candidate.fma +
        ' ' +
        candidate.name +
        ': ' +
        JSON.stringify({
          bounds: row.bounds,
          triangles: row.obj.triangles.size,
          grossPositionPass: evidence.grossPositionPass,
        }),
    );
    return { ...row, evidence };
  },
);
const comparisons = [],
  all = [...old, ...fetched];
for (let i = 0; i < all.length; i++)
  for (let j = i + 1; j < all.length; j++) {
    const a = all[i],
      b = all[j];
    if (a.existing && b.existing) continue;
    if (!a.regions.some((region) => b.regions.includes(region))) continue;
    if (!boundsNear(a.bounds, b.bounds)) continue;
    const exactTriangles = [...a.obj.triangles].filter((triangle) =>
      b.obj.triangles.has(triangle),
    ).length;
    const ab = surfaceDistance(a, b),
      ba = surfaceDistance(b, a);
    const flag =
      exactTriangles > 0 ||
      ab.withinQuarterMm / ab.samples >= 0.25 ||
      ba.withinQuarterMm / ba.samples >= 0.25;
    comparisons.push({
      a: a.id,
      b: b.id,
      aExisting: a.existing,
      bExisting: b.existing,
      exactTriangles,
      aToB: ab,
      bToA: ba,
      flagged: flag,
    });
  }
const baselineRecord = {
  sourceCommit,
  catalogSha256: hash(raw),
  coordinateSystem: baseline.coordinateSystem,
  excluded: baseline.excluded,
  structures: baseline.structures.map((item) => ({
    id: item.id,
    sha256: hash(JSON.stringify(item)),
  })),
  bundles: baseline.bundles,
};
const baselineText = JSON.stringify(baselineRecord, null, 2) + '\n';
const baselinePath = 'content/hand-vascular-baseline.json';
const previous = await fs.readFile(baselinePath, 'utf8').catch(() => null);
if (previous) assert.equal(previous.replace(/\r\n/g, '\n'), baselineText);
else await fs.writeFile(baselinePath, baselineText);
const report = {
  sourceCommit,
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  licenseChecked: '2026-09-06',
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  distanceMethod:
    'At most 128 deterministic vertex samples per direction; minimum distance to all triangles in the comparison surface, with segment/point fallback for degenerate faces (area <= 1e-10 mm²) and non-finite triangle-projection results. No source face removed or altered.',
  results: fetched.map((row) => row.evidence),
  comparisons,
  limits:
    'CRC/SHA, exact definitions, finite source geometry, gross envelope and sampled bidirectional point-to-triangle distances are engineering checks only. Comparisons use all existing hand and forearm structures, pruning pairs with boxes over 1 mm apart; no proof of attachments, biological non-overlap, variants or clinical accuracy. Running this audit admits nothing.',
};
await fs.writeFile(
  'content/hand-vascular-source-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      candidates: fetched.length,
      comparisons: comparisons.length,
      flags: comparisons.filter((row) => row.flagged),
    },
    null,
    2,
  ),
);
