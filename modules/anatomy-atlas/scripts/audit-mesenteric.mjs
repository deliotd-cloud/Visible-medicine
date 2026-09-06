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
import { geometryFingerprint, inventoryHolds } from './anatomy-inventory.mjs';
import { objBounds } from './audit-legacy-anatomy.mjs';
import {
  mesentericCandidates,
  mesentericHeldIds,
} from './mesenteric-selections.mjs';
const sourceCommit = '85401e066e4f5479ca00e7177f2e8aa29676ec94';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const baselineBytes = execFileSync(
  'git',
  ['show', sourceCommit + ':public/models/bodyparts3d/full-body/catalog.json'],
  { maxBuffer: 8e6 },
);
assert.equal(
  hash(baselineBytes),
  '9512052d74f333f3276aac1926c8537c428badcd237dd724a5822cd7c7a005cd',
);
const baseline = JSON.parse(baselineBytes);
const inventory = JSON.parse(
  execFileSync(
    'git',
    ['show', sourceCommit + ':content/source-inventory.json'],
    { maxBuffer: 16e6 },
  ),
);
const rendered = new Set(
  inventory.assets
    .filter((a) => a.representedBy.length)
    .map((a) => a.geometrySha256),
);
const [isa, zip] = await Promise.all([conceptMap('isa'), archiveReader('isa')]);
// Position-based exact triangle overlap catches partial duplicates even when
// component hashes or vertex order differ. Near-overlap remains a review gate.
function shape(bytes) {
  const vertices = [],
    triangles = new Set();
  for (const line of bytes.toString().split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') vertices.push(parts.slice(1, 4).map(Number));
    if (parts[0] === 'f') {
      assert.equal(parts.length, 4, 'Only source triangles expected');
      const coords = parts.slice(1).map((x) => {
        const i = Number(x.split('/')[0]);
        return vertices[i < 0 ? vertices.length + i : i - 1].join(',');
      });
      triangles.add(coords.sort().join(';'));
    }
  }
  return { vertices, triangles };
}
const oldVessels = [];
for (const s of baseline.structures.filter(
  (s) => s.system === 'vessels' && s.regions.includes('abdomen'),
)) {
  const vertices = [],
    triangles = new Set();
  for (const f of s.sources) {
    const bytes = await fs.readFile(
      cache + '/' + s.sourceTree + '/' + f.file + '.obj',
    );
    assert.equal(hash(bytes), f.sha256);
    const obj = shape(bytes);
    vertices.push(...obj.vertices);
    obj.triangles.forEach((t) => triangles.add(t));
  }
  oldVessels.push({ fmaId: s.fmaId, name: s.sourceName, vertices, triangles });
}
const fetched = await parallelMap(mesentericCandidates(isa), 4, async (c) => {
  const file = c.files[0],
    aliases = inventory.records.filter((r) => r.files.includes(file));
  assert(!inventoryHolds[c.fma] || mesentericHeldIds.includes(c.fma));
  assert(
    !aliases.some(
      (r) => inventoryHolds[r.id] && !mesentericHeldIds.includes(r.id),
    ),
  );
  assert(
    !baseline.structures.some(
      (s) => s.fmaId === c.fma || s.sources.some((f) => f.file === file),
    ),
  );
  const bytes = await zip.get(file),
    geometrySha256 = geometryFingerprint(bytes),
    bounds = objBounds(bytes),
    obj = shape(bytes);
  assert(!rendered.has(geometrySha256));
  const grossEnvelope = { min: [-180, -240, 740], max: [180, 80, 1160] };
  const grossPositionPass = bounds.min.every(
    (v, k) =>
      v >= grossEnvelope.min[k] && bounds.max[k] <= grossEnvelope.max[k],
  );
  const overlaps =
    c.system === 'vessels'
      ? oldVessels
          .map((old) => ({
            fmaId: old.fmaId,
            name: old.name,
            exactTriangles: [...obj.triangles].filter((t) =>
              old.triangles.has(t),
            ).length,
          }))
          .filter((r) => r.exactTriangles)
      : [];
  console.log(
    c.fma +
      ' ' +
      c.name +
      ': ' +
      bytes.length +
      ' bytes; bounds ' +
      JSON.stringify(bounds) +
      '; exact overlaps ' +
      JSON.stringify(overlaps),
  );
  return {
    c,
    obj,
    evidence: {
      fmaId: c.fma,
      sourceName: c.name,
      sourceTree: c.tree,
      system: c.system,
      category: c.category,
      file,
      sha256: hash(bytes),
      geometrySha256,
      bytes: bytes.length,
      crc32: zip.entries.get(file + '.obj').crc,
      bounds,
      sceneBounds: {
        min: [
          bounds.min[0] * 0.01,
          (bounds.min[2] - 800) * 0.01,
          -(bounds.max[1] + 50) * 0.01,
        ],
        max: [
          bounds.max[0] * 0.01,
          (bounds.max[2] - 800) * 0.01,
          -(bounds.min[1] + 50) * 0.01,
        ],
      },
      grossEnvelope,
      grossPositionPass,
      triangles: obj.triangles.size,
      exactAliases: aliases
        .filter((r) => r.files.length === 1)
        .map((r) => ({ tree: r.tree, fmaId: r.id, name: r.name })),
      existingTriangleOverlaps: overlaps,
      clinicalValidation: false,
    },
  };
});
const fingerprints = new Set();
for (const row of fetched) {
  assert(!fingerprints.has(row.evidence.geometrySha256));
  fingerprints.add(row.evidence.geometrySha256);
}
const candidateTriangleOverlaps = [];
for (let i = 0; i < fetched.length; i++)
  for (let j = i + 1; j < fetched.length; j++) {
    const a = fetched[i],
      b = fetched[j],
      count = [...a.obj.triangles].filter((t) => b.obj.triangles.has(t)).length;
    if (count)
      candidateTriangleOverlaps.push({
        a: a.c.fma,
        b: b.c.fma,
        exactTriangles: count,
      });
  }
// Report sampled nearest-vertex distances to existing SMA source pieces. This
// is a conservative overlap diagnostic, not a centreline or surface distance.
const trunk = fetched.find((r) => r.c.fma === 'FMA66358'),
  oldSma = oldVessels.find((r) => r.fmaId === 'FMA14749');
const sampledDistances = [];
for (
  let i = 0;
  i < trunk.obj.vertices.length;
  i += Math.max(1, Math.floor(trunk.obj.vertices.length / 256))
) {
  const p = trunk.obj.vertices[i];
  let best = Infinity;
  for (const q of oldSma.vertices)
    best = Math.min(
      best,
      p.reduce((n, v, k) => n + (v - q[k]) ** 2, 0),
    );
  sampledDistances.push(Math.sqrt(best));
}
sampledDistances.sort((a, b) => a - b);
const vascularRows = [
  ...oldVessels.map((r) => ({ id: r.fmaId, existing: true, obj: r })),
  ...fetched
    .filter((r) => r.c.system === 'vessels')
    .map((r) => ({ id: r.c.fma, existing: false, obj: r.obj })),
];
for (const r of vascularRows)
  r.surfaces = [...r.obj.triangles].map(
    (t) =>
      new Triangle(
        ...t.split(';').map((p) => new Vector3(...p.split(',').map(Number))),
      ),
  );
function surfaceDistance(a, b) {
  const distances = [],
    target = new Vector3();
  for (
    let i = 0;
    i < a.obj.vertices.length;
    i += Math.max(1, Math.ceil(a.obj.vertices.length / 96))
  ) {
    const point = new Vector3(...a.obj.vertices[i]);
    let closest = Infinity;
    for (const triangle of b.surfaces)
      closest = Math.min(
        closest,
        point.distanceToSquared(triangle.closestPointToPoint(point, target)),
      );
    distances.push(Math.sqrt(closest));
  }
  distances.sort((a, b) => a - b);
  return {
    samples: distances.length,
    withinQuarterMm: distances.filter((d) => d <= 0.25).length,
    withinOneMm: distances.filter((d) => d <= 1).length,
    medianMm: distances[Math.floor(distances.length / 2)],
    maxMm: distances.at(-1),
  };
}
const nearOverlapDiagnostics = [];
for (let i = 0; i < vascularRows.length; i++)
  for (let j = i + 1; j < vascularRows.length; j++) {
    const a = vascularRows[i],
      b = vascularRows[j];
    if (a.existing && b.existing) continue;
    const ab = surfaceDistance(a, b),
      ba = surfaceDistance(b, a);
    // A candidate substantially covering an existing surface, or either of two
    // candidate labels covering each other, requires explicit source review.
    if (
      ab.withinQuarterMm / ab.samples >= 0.25 ||
      ba.withinQuarterMm / ba.samples >= 0.25
    )
      nearOverlapDiagnostics.push({
        a: a.id,
        b: b.id,
        aExisting: a.existing,
        bExisting: b.existing,
        aToB: ab,
        bToA: ba,
      });
  }
const audit = {
  sourceCommit,
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  licenseChecked: '2026-09-06',
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  results: fetched.map((r) => r.evidence),
  candidateTriangleOverlaps,
  nearOverlapDiagnostics,
  smaTrunkDiagnostic: {
    sampledVertices: sampledDistances.length,
    minMm: sampledDistances[0],
    medianMm: sampledDistances[Math.floor(sampledDistances.length / 2)],
    maxMm: sampledDistances.at(-1),
    withinOneMm: sampledDistances.filter((d) => d < 1).length,
  },
  limitation:
    'Source identity, CRC/SHA, gross envelope and exact triangle checks are engineering evidence, not attachment, topology, near-overlap, clinical or imaging validation. No candidate is admitted by running this audit.',
};
const pinned = {
  sourceCommit,
  catalogSha256: hash(baselineBytes),
  coordinateSystem: baseline.coordinateSystem,
  excluded: baseline.excluded,
  structures: baseline.structures.map((s) => ({
    id: s.id,
    sha256: hash(JSON.stringify(s)),
  })),
  bundles: baseline.bundles,
};
const baselinePath = 'content/mesenteric-baseline.json',
  pinnedText = JSON.stringify(pinned, null, 2) + '\n';
const existing = await fs.readFile(baselinePath, 'utf8').catch(() => null);
if (existing) assert.equal(existing.replace(/\r\n/g, '\n'), pinnedText);
else await fs.writeFile(baselinePath, pinnedText);
await fs.writeFile(
  'content/mesenteric-source-audit.json',
  JSON.stringify(audit, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      candidates: fetched.length,
      candidateTriangleOverlaps,
      smaTrunkDiagnostic: audit.smaTrunkDiagnostic,
      nearOverlapDiagnostics,
    },
    null,
    2,
  ),
);
