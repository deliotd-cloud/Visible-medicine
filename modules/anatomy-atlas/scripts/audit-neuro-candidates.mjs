import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  archiveReader,
  conceptMap,
  parallelMap,
} from './bodyparts-archive.mjs';
import { geometryFingerprint, inventoryHolds } from './anatomy-inventory.mjs';
import { objBounds } from './audit-legacy-anatomy.mjs';
import { neuroSelections } from './neuro-selections.mjs';

const sourceCommit = 'b49c9172fbc443bcd2ee1faf58c171aa76424e20';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const baseline = JSON.parse(
  execFileSync(
    'git',
    [
      'show',
      sourceCommit + ':public/models/bodyparts3d/full-body/catalog.json',
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  ),
);
assert.equal(baseline.structures.length, 859);
assert.equal(baseline.bundles.length, 66);
const inventory = JSON.parse(
  await fs.readFile('content/source-inventory.json', 'utf8'),
);
const oldIds = new Set(baseline.structures.map((s) => s.id));
const rendered = new Set(
  inventory.assets
    .filter((a) => a.representedBy.some((id) => oldIds.has(id)))
    .map((a) => a.geometrySha256),
);
const [isa, zip] = await Promise.all([conceptMap('isa'), archiveReader('isa')]);
const candidates = neuroSelections(isa);
const components = new Set();
const fingerprints = new Set();
const brain = baseline.structures.find((s) => s.fmaId === 'FMA50801');
const results = await parallelMap(candidates, 4, async (candidate) => {
  assert(!inventoryHolds[candidate.fma]);
  assert(!baseline.structures.some((s) => s.fmaId === candidate.fma));
  const sources = [];
  for (const file of candidate.files) {
    assert(!components.has(file), 'Repeated candidate source');
    components.add(file);
    assert(
      !baseline.structures.some((s) => s.sources.some((f) => f.file === file)),
      'Already rendered source file',
    );
    const bytes = await zip.get(file);
    const geometrySha256 = geometryFingerprint(bytes);
    assert(!rendered.has(geometrySha256), 'Already rendered geometry');
    assert(!fingerprints.has(geometrySha256), 'Repeated candidate geometry');
    fingerprints.add(geometrySha256);
    const bounds = objBounds(bytes);
    assert([...bounds.min, ...bounds.max].every(Number.isFinite));
    const centerX = (bounds.min[0] + bounds.max[0]) / 2;
    if (/\bright\b/.test(candidate.name))
      assert(centerX < 0, 'Right source has left centroid: ' + candidate.name);
    if (/\bleft\b/.test(candidate.name))
      assert(centerX > 0, 'Left source has right centroid: ' + candidate.name);
    // Existing source-frame transform: X left, Y superior, Z anterior, 0.01 scene units/mm.
    const sceneBounds = {
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
    };
    for (let axis = 0; axis < 3; axis++) {
      assert(
        sceneBounds.min[axis] >= brain.bounds.min[axis] - 0.02,
        'Source extends outside brain bounds: ' + candidate.name,
      );
      assert(
        sceneBounds.max[axis] <= brain.bounds.max[axis] + 0.02,
        'Source extends outside brain bounds: ' + candidate.name,
      );
    }
    sources.push({
      file,
      sha256: sha(bytes),
      geometrySha256,
      bounds,
      sceneBounds,
    });
  }
  return {
    fmaId: candidate.fma,
    sourceName: candidate.name,
    tree: candidate.tree,
    sources,
    clinicalValidation: false,
  };
});
await fs.writeFile(
  '../work/neuro-candidates-audit.json',
  JSON.stringify(
    { sourceCommit, sourceVersion: '4.0', license: 'CC-BY-4.0', results },
    null,
    2,
  ) + '\n',
);
// Capture only after every candidate passes. Immutable old catalogue fingerprints
// let the admission test run in a GitHub source snapshot without old Git history.
const pinned =
  JSON.stringify(
    {
      sourceCommit,
      coordinateSystem: baseline.coordinateSystem,
      excluded: baseline.excluded,
      structures: baseline.structures.map((s) => ({
        id: s.id,
        sha256: sha(JSON.stringify(s)),
      })),
      bundles: baseline.bundles,
    },
    null,
    2,
  ) + '\n';
const existing = await fs
  .readFile('content/neuro-baseline.json', 'utf8')
  .catch(() => null);
if (existing && existing.replace(/\r\n/g, '\n') !== pinned)
  throw Error('Refusing to overwrite different neuro baseline');
if (!existing) await fs.writeFile('content/neuro-baseline.json', pinned);
await fs.writeFile(
  'content/neuro-source-audit.json',
  JSON.stringify(
    { sourceCommit, sourceVersion: '4.0', license: 'CC-BY-4.0', results },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    results.map((r) => ({
      name: r.sourceName,
      components: r.sources.map((s) => ({ file: s.file, bounds: s.bounds })),
    })),
    null,
    2,
  ),
);
console.log(
  'Passed identity, CRC/hash, exact duplication, laterality and brain-frame bounds gates: ' +
    results.length +
    ' records / ' +
    components.size +
    ' components. NOT clinical validation.',
);
