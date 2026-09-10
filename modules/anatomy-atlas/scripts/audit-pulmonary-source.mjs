import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, evidence, policy } = await loadSourceHolds();
const definitions = [
  ['FMA7333', 'FMA7309', 62],
  ['FMA7383', 'FMA7309', 25],
  ['FMA7337', 'FMA7309', 69],
  ['FMA7370', 'FMA7310', 68],
  ['FMA7371', 'FMA7310', 56],
];
const faults = [
  'duplicateFaces',
  'collapsedFaces',
  'degenerateFaces',
  'boundaryEdges',
  'nonManifoldEdges',
  'nonManifoldVertices',
  'inconsistentWindingEdges',
];
const lobes = [];
for (const [fmaId, parentFmaId, count] of definitions) {
  const definition = records.find((r) => r.tree === 'partof' && r.id === fmaId);
  const parent = catalog.structures.find((s) => s.fmaId === parentFmaId);
  policy.assertNoKnownHolds([definition]);
  assert.equal(definition.files.length, count);
  const files = [];
  for (const file of definition.files) {
    const source = parent.sources.find((f) => f.file === file);
    assert(source, `${file}: not a member of ${parentFmaId}`);
    const raw = await readFile(`${cache}/partof/${file}.obj`);
    assert.equal(hash(raw), source.sha256);
    // Report the smallest explicit source definitions, not an inferred new FMA identity.
    const candidates = records.filter((r) => r.files.includes(file));
    const smallest = Math.min(...candidates.map((r) => r.files.length));
    const labels = candidates.filter((r) => r.files.length === smallest);
    const roles = [
      ...new Set(
        labels.map((r) =>
          /artery|arteries/.test(r.name)
            ? 'artery'
            : /vein/.test(r.name)
              ? 'vein'
              : /bronch/.test(r.name)
                ? 'airway'
                : 'unclassified',
        ),
      ),
    ];
    assert.equal(roles.length, 1, `${file}: conflicting smallest-label roles`);
    const shape = sourceObjShape(raw),
      topology = sourceTopology(shape);
    files.push({
      file,
      sha256: source.sha256,
      role: roles[0],
      labels,
      min: shape.min,
      max: shape.max,
      topology,
    });
  }
  lobes.push({
    definition,
    parentId: parent.id,
    parentFmaId,
    files,
    roleCounts: Object.fromEntries(
      ['airway', 'artery', 'vein', 'unclassified'].map((role) => [
        role,
        files.filter((f) => f.role === role).length,
      ]),
    ),
    topologyFlags: files
      .filter((f) => faults.some((k) => f.topology[k] > 0))
      .map((f) => ({
        file: f.file,
        ...Object.fromEntries(faults.map((k) => [k, f.topology[k]])),
      })),
  });
}
for (const id of ['FMA7309', 'FMA7310']) {
  const parts = lobes
    .filter((l) => l.parentFmaId === id)
    .flatMap((l) => l.files.map((f) => f.file));
  assert.equal(new Set(parts).size, parts.length);
  assert.deepEqual(
    [...parts].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    catalog.structures
      .find((s) => s.fmaId === id)
      .sources.map((s) => s.file)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}
const report = {
  version: 1,
  evidence,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  decision:
    'No lobe surface admission: the five PART-OF compounds contain only source-labelled airway and vessel files, not independently delineated lobe parenchyma or fissures.',
  method:
    'Pinned source-table memberships, raw OBJ SHA-256, smallest explicit source labels, exact-coordinate diagnostic topology. No geometry edits, clinical approval or inferred tissue envelope.',
  lobes,
};
const output = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(
    await readFile('docs/pulmonary-source-audit.json', 'utf8'),
    output,
  );
else await writeFile('docs/pulmonary-source-audit.json', output);
console.log(
  JSON.stringify(
    lobes.map((l) => ({
      id: l.definition.id,
      name: l.definition.name,
      files: l.files.length,
      roles: l.roleCounts,
      flagged: l.topologyFlags.length,
      triangles: l.files.reduce((n, f) => n + f.topology.triangles, 0),
    })),
  ),
);
