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
import { axialSelections, axialHeldDefinitions } from './axial-selections.mjs';

const sourceCommit = 'e007550faec7c75947569c2a30fa1a032c7bf5f0';
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
assert.equal(baseline.structures.length, 881);
assert.equal(baseline.bundles.length, 67);
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
const components = new Set(),
  fingerprints = new Set();
// Broad source-millimetre envelopes are only gross position checks, not attachment tests.
const envelope = (name) =>
  /wrist/.test(name)
    ? { x: 300, z: [740, 850] }
    : /iliotibial/.test(name)
      ? { x: 200, z: [250, 1000] }
      : /linea alba/.test(name)
        ? { x: 20, z: [750, 1200] }
        : /lumborum/.test(name)
          ? { x: 20, z: [900, 1080] }
          : /cervic/.test(name)
            ? { x: 60, z: [1340, 1500] }
            : { x: 100, z: [1020, 1410] };
const results = await parallelMap(
  axialSelections(isa),
  4,
  async (candidate) => {
    assert(!inventoryHolds[candidate.fma]);
    assert(!baseline.structures.some((s) => s.fmaId === candidate.fma));
    assert(
      [candidate.region, ...candidate.extraRegions].every((r) =>
        baseline.regions.some((x) => x.id === r),
      ),
    );
    const sources = [];
    for (const file of candidate.files) {
      assert(!components.has(file));
      components.add(file);
      assert(
        !baseline.structures.some((s) =>
          s.sources.some((f) => f.file === file),
        ),
      );
      const aliases = inventory.records.filter((r) => r.files.includes(file));
      assert(
        !aliases.some((r) => inventoryHolds[r.id]),
        'Held source alias reused',
      );
      const bytes = await zip.get(file),
        geometrySha256 = geometryFingerprint(bytes),
        bounds = objBounds(bytes);
      assert(!rendered.has(geometrySha256), 'Already rendered geometry');
      assert(!fingerprints.has(geometrySha256));
      fingerprints.add(geometrySha256);
      assert([...bounds.min, ...bounds.max].every(Number.isFinite));
      const centerX = (bounds.min[0] + bounds.max[0]) / 2;
      if (/\bright\b/.test(candidate.name)) assert(centerX < 0);
      if (/\bleft\b/.test(candidate.name)) assert(centerX > 0);
      const limits = envelope(candidate.name);
      assert(bounds.min[0] >= -limits.x && bounds.max[0] <= limits.x);
      assert(bounds.min[2] >= limits.z[0] && bounds.max[2] <= limits.z[1]);
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
      sources.push({
        file,
        sha256: sha(bytes),
        geometrySha256,
        bounds,
        sceneBounds,
        exactAliases: aliases
          .filter((r) => r.files.length === 1)
          .map((r) => ({ tree: r.tree, fmaId: r.id, name: r.name })),
      });
    }
    return {
      fmaId: candidate.fma,
      sourceName: candidate.name,
      tree: 'isa',
      sources,
      grossEnvelope: envelope(candidate.name),
      clinicalValidation: false,
    };
  },
);
const held = await parallelMap(
  axialHeldDefinitions,
  2,
  async ([fmaId, sourceName, files]) => {
    const def = isa.get(fmaId);
    assert.equal(def.name, sourceName);
    assert.deepEqual(def.files, files);
    const sources = await Promise.all(
      files.map(async (file) => {
        const b = await zip.get(file);
        return {
          file,
          sha256: sha(b),
          geometrySha256: geometryFingerprint(b),
          bounds: objBounds(b),
        };
      }),
    );
    return {
      fmaId,
      sourceName,
      sources,
      reason:
        'Named longi/breves distinction needs fibre-course, vertebral-level and overlap review. Full thoracic source extents are near-identical; not proof of source error.',
    };
  },
);
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
  .readFile('content/axial-baseline.json', 'utf8')
  .catch(() => null);
if (existing && existing.replace(/\r\n/g, '\n') !== pinned)
  throw Error('Refusing to overwrite different baseline');
if (!existing) await fs.writeFile('content/axial-baseline.json', pinned);
await fs.writeFile(
  'content/axial-source-audit.json',
  JSON.stringify(
    { sourceCommit, sourceVersion: '4.0', license: 'CC-BY-4.0', results, held },
    null,
    2,
  ) + '\n',
);
console.log({
  admittedCandidates: results.length,
  components: components.size,
  held: held.length,
  clinicalValidation: false,
});
