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
import { headDetailSelections } from './head-detail-selections.mjs';

const sourceCommit = '6bdd559680d318cf22b3a0ce390f072863032924';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const baselineBytes = execFileSync(
  'git',
  ['show', sourceCommit + ':public/models/bodyparts3d/full-body/catalog.json'],
  { maxBuffer: 8 * 1024 * 1024 },
);
const baseline = JSON.parse(baselineBytes);
assert.equal(baseline.structures.length, 892);
assert.equal(baseline.bundles.length, 71);
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
const results = await parallelMap(headDetailSelections(isa), 4, async (c) => {
  assert(!inventoryHolds[c.fma]);
  assert(!baseline.structures.some((s) => s.fmaId === c.fma));
  const file = c.files[0];
  assert(!components.has(file));
  components.add(file);
  assert(
    !baseline.structures.some((s) => s.sources.some((f) => f.file === file)),
  );
  const aliases = inventory.records.filter((r) => r.files.includes(file));
  assert(!aliases.some((r) => inventoryHolds[r.id]));
  const bytes = await zip.get(file),
    geometrySha256 = geometryFingerprint(bytes),
    bounds = objBounds(bytes);
  assert(!rendered.has(geometrySha256), 'Previously displayed exact surface');
  assert(!fingerprints.has(geometrySha256), 'Duplicate candidate geometry');
  fingerprints.add(geometrySha256);
  assert([...bounds.min, ...bounds.max].every(Number.isFinite));
  const cx = (bounds.min[0] + bounds.max[0]) / 2;
  assert(/\bright\b/.test(c.name) ? cx < 0 : cx > 0);
  const grossEnvelope = c.name.endsWith('tooth')
    ? { min: [-40, -190, 1420], max: [40, -120, 1495] }
    : { min: [-30, -175, 1510], max: [30, -110, 1550] };
  for (let k = 0; k < 3; k++) {
    assert(bounds.min[k] >= grossEnvelope.min[k]);
    assert(bounds.max[k] <= grossEnvelope.max[k]);
  }
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
  return {
    fmaId: c.fma,
    sourceName: c.name,
    tree: 'isa',
    system: c.system,
    category: c.category,
    sources: [
      {
        file,
        sha256: sha(bytes),
        geometrySha256,
        bounds,
        sceneBounds,
        exactAliases: aliases
          .filter((r) => r.files.length === 1)
          .map((r) => ({ tree: r.tree, fmaId: r.id, name: r.name })),
      },
    ],
    grossEnvelope,
    clinicalValidation: false,
  };
});
// Gross ordering only: upper/lower and front/back centres, not occlusion or root validation.
const dental = results.filter((r) => r.sourceName.endsWith('tooth'));
const center = (r) =>
  r.sources[0].bounds.min.map((v, k) => (v + r.sources[0].bounds.max[k]) / 2);
const order = [
  'central secondary incisor',
  'lateral secondary incisor',
  'secondary canine',
  'first secondary premolar',
  'second secondary premolar',
  'first secondary molar',
  'second secondary molar',
];
const dentalOrderChecks = [];
for (const side of ['right', 'left']) {
  for (const jaw of ['upper', 'lower']) {
    const teeth = order.map((type) =>
      dental.find((r) => r.sourceName === `${side} ${jaw} ${type} tooth`),
    );
    assert(teeth.every(Boolean));
    // Root-containing bounding-box centres are not crown landmarks: the lower
    // central/lateral incisors differ by only ~0.02 mm in Y and can reverse order.
    // Record that observation rather than inventing a correction or a tooth number.
    dentalOrderChecks.push({
      side,
      jaw,
      centresMm: teeth.map((r) => ({ fmaId: r.fmaId, centre: center(r) })),
      incisorCenterDeltaYmm: center(teeth[1])[1] - center(teeth[0])[1],
    });
    for (let i = 2; i < teeth.length; i++)
      assert(center(teeth[i])[1] > center(teeth[i - 1])[1]);
  }
  for (const type of order) {
    const upper = dental.find(
      (r) => r.sourceName === `${side} upper ${type} tooth`,
    );
    const lower = dental.find(
      (r) => r.sourceName === `${side} lower ${type} tooth`,
    );
    assert(center(upper)[2] > center(lower)[2]);
  }
  const ring = results.find(
    (r) => r.sourceName === `${side} common tendinous ring`,
  );
  const trochlea = results.find(
    (r) => r.sourceName === `trochlea of ${side} superior oblique`,
  );
  assert(
    center(ring)[1] > center(trochlea)[1],
    'Source ring posterior to source trochlea',
  );
}
const pinned =
  JSON.stringify(
    {
      sourceCommit,
      catalogSha256: sha(baselineBytes),
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
  .readFile('content/head-detail-baseline.json', 'utf8')
  .catch(() => null);
if (existing && existing.replace(/\r\n/g, '\n') !== pinned)
  throw Error('Refusing to replace different baseline');
if (!existing) await fs.writeFile('content/head-detail-baseline.json', pinned);
await fs.writeFile(
  'content/head-detail-source-audit.json',
  JSON.stringify(
    {
      sourceCommit,
      sourceVersion: '4.0',
      license: 'CC-BY-4.0',
      licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
      licenseChecked: '2026-09-06',
      results,
      dentalOrderChecks,
      limits:
        'Exact source and canonical geometry hashes plus gross envelopes/order are not clinical validation. No image, tooth numbering, inferred mesh subdivision or patient registration included.',
    },
    null,
    2,
  ) + '\n',
);
console.log({
  admittedCandidates: results.length,
  components: components.size,
  clinicalValidation: false,
});
