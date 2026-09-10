import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import {
  spatialDistanceIndex,
  uniqueSourceVertices,
  distanceSummary,
} from './source-spatial-math.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7197');
assert.equal(parent.sources.length, 57);
const definitions = [
  ['FMA14778', 'Right hepatic arterial branches', 'artery', 'right', 8],
  ['FMA14779', 'Left hepatic arterial branches', 'artery', 'left', 7],
  ['FMA15414', 'Right portal vein branches', 'portal', 'right', 9],
  ['FMA15415', 'Left portal vein branches', 'portal', 'left', 8],
  ['FMA71857', 'Right hepatic bile ducts', 'biliary', 'right', 6],
  ['FMA71858', 'Left hepatic bile ducts', 'biliary', 'left', 8],
  [
    'FMA15800',
    'Anterior inferior tributary of middle hepatic vein',
    'venous',
    'unspecified',
    2,
  ],
];
const shapes = new Map(),
  files = [];
for (const source of parent.sources) {
  const raw = await readFile(
    `${cache}/${parent.sourceTree}/${source.file}.obj`,
  );
  assert.equal(hash(raw), source.sha256);
  const shape = sourceObjShape(raw);
  shapes.set(source.file, shape);
  const candidates = records.filter((r) => r.files.includes(source.file));
  const smallest = Math.min(...candidates.map((r) => r.files.length));
  files.push({
    ...source,
    labels: candidates.filter((r) => r.files.length === smallest),
    min: shape.min,
    max: shape.max,
    topology: sourceTopology(shape),
  });
}
const groups = definitions.map(([id, name, kind, laterality, count]) => {
  const definition = records.find((r) => r.tree === 'partof' && r.id === id);
  assert(definition);
  policy.assertNoKnownHolds([definition]);
  assert.equal(definition.files.length, count);
  assert(
    definition.files.every((f) => parent.sources.some((s) => s.file === f)),
  );
  return { definition, name, kind, laterality };
});
const branchFiles = groups.flatMap((g) => g.definition.files);
assert.equal(branchFiles.length, 48);
assert.equal(new Set(branchFiles).size, 48);
const tissue = files.filter((f) => !branchFiles.includes(f.file));
assert.deepEqual(
  tissue.map((f) => f.file).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  [
    'FJ2409',
    'FJ2816',
    'FJ2818',
    'FJ2819',
    'FJ2820',
    'FJ2821',
    'FJ2822',
    'FJ2823',
    'FJ2824',
  ],
);
// Sample ORIGINAL, unaligned surfaces in both directions. Bounds alone are not an overlap test.
const pair = ['FJ2822', 'FJ2409'].map((file, i, all) => {
  const points = uniqueSourceVertices(shapes.get(file));
  const stride = Math.max(1, Math.ceil(points.length / 512));
  return {
    from: file,
    to: all[1 - i],
    stride,
    originalVertices: points.length,
    distances: distanceSummary(
      points.filter((_, n) => n % stride === 0),
      spatialDistanceIndex(shapes.get(all[1 - i])),
    ),
  };
});
const report = {
  version: 1,
  sourceVersion: '4.0',
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  parent,
  groups,
  files,
  tissueFiles: tissue.map((f) => f.file),
  segmentPairDiagnostic: pair,
  decision:
    'Expose seven explicitly source-labelled vessel/duct groups. Preserve nine residual tissue files as one optional nonselectable context, never a validated Couinaud segment map.',
  limitations: [
    'FJ2822 (source segment VI) and FJ2409 (source segment VII) have nearly identical extents and sampled near-coincident surfaces; distinct segment boundaries require adjudication. No relabelling, alignment or repair.',
    'Source segment VIII combines FJ2823 and FJ2824; do not split or assign a new segment identity to either file.',
    'Segment IV source FJ2820 has nonmanifold/degenerate geometry and detached internal remnants. Other source duplicate faces remain. Context is not a clean envelope or a measured organ volume.',
    'These are partial source groups, not a complete continuous vascular/biliary tree, individual perfusion territories, surgical planes or clinical validation.',
    'Right/left hepatic veins and hepatic artery proper were already separated from the parent aggregate; no complete venous outflow is represented by this nested subset.',
  ],
};
const output = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(
    await readFile('docs/hepatic-source-audit.json', 'utf8'),
    output,
  );
else await writeFile('docs/hepatic-source-audit.json', output);
console.log(
  JSON.stringify({
    groups: groups.length,
    branchFiles: branchFiles.length,
    tissueFiles: tissue.length,
    triangles: files.reduce((n, f) => n + f.topology.triangles, 0),
    segmentPairDiagnostic: pair,
  }),
);
