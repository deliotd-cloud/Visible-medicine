import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, evidence, policy } = await loadSourceHolds();
const pulmonary = JSON.parse(
  await readFile('public/models/bodyparts3d/pulmonary/catalog.json'),
);
assert.deepEqual(pulmonary.coordinateSystem, catalog.coordinateSystem);
const definitions = [
  ['FMA7394', 'partof', 'FJ2541', 0],
  ['FMA7395', 'partof', 'FJ2539', 2],
  ['FMA7396', 'isa', 'FJ2450', 3],
];
const structures = [],
  sourceReports = [];
for (const [fma, tree, file, duplicates] of definitions) {
  const structure = catalog.structures.find((s) => s.fmaId === fma);
  assert(structure);
  assert.equal(structure.sourceTree, tree);
  const definition = records.find((r) => r.tree === tree && r.id === fma);
  assert.deepEqual(definition.files, [file]);
  policy.assertNoKnownHolds([definition]);
  assert.equal(structure.sources.length, 1);
  assert.equal(structure.sources[0].file, file);
  assert(
    !pulmonary.structures.some((s) => s.sources.some((f) => f.file === file)),
    'Context overlaps a selectable branch group',
  );
  const raw = await readFile(`${cache}/${tree}/${file}.obj`);
  assert.equal(hash(raw), structure.sources[0].sha256);
  const topology = sourceTopology(sourceObjShape(raw));
  assert.equal(topology.duplicateFaces, duplicates);
  for (const key of [
    'collapsedFaces',
    'degenerateFaces',
    'boundaryEdges',
    'nonManifoldEdges',
    'nonManifoldVertices',
    'inconsistentWindingEdges',
  ])
    assert.equal(topology[key], 0);
  structures.push(structure);
  sourceReports.push({ fmaId: fma, tree, file, sha256: hash(raw), topology });
}
const bundles = catalog.bundles.filter((b) =>
  structures.some((s) => s.bundle === b.id),
);
for (const b of bundles) {
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://local.invalid').pathname,
  );
  assert.equal(hash(bytes), b.sha256);
  assert.equal(bytes.length, b.bytes);
}
const parents = pulmonary.parents.map((parent) => {
  assert.deepEqual(
    parent,
    catalog.structures.find((s) => s.id === parent.id),
  );
  return parent;
});
const result = {
  schemaVersion: 1,
  evidence,
  coordinateSystem: catalog.coordinateSystem,
  license: catalog.license,
  credit: catalog.credit,
  parents,
  structures,
  bundles,
  bindings: parents.map((p) => ({
    parentId: p.id,
    contextIds: structures
      .filter((s) => s.fmaId === 'FMA7394' || s.laterality === p.laterality)
      .map((s) => s.id),
  })),
  sourceReports,
  limitation:
    'Existing trachea and ipsilateral source main-bronchus surfaces are orientation landmarks only. Detached remnants and duplicate faces are retained; the source does not prove lumen continuity, carinal or lobar boundaries, or patient registration. No context structure is a new nested identity.',
};
const path = 'public/models/bodyparts3d/pulmonary/airway-context.json';
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(await readFile(path, 'utf8'), text);
else {
  const previous = await readFile(path, 'utf8').catch((e) => {
    if (e.code === 'ENOENT') return null;
    throw e;
  });
  assert(
    previous === null || previous === text,
    'Existing context pins changed; explicit source review required',
  );
  await writeFile(path, text);
}
console.log(
  JSON.stringify({
    parents: parents.length,
    contextStructures: structures.length,
    existingBundles: bundles.length,
    triangles: sourceReports.reduce((n, r) => n + r.topology.triangles, 0),
    duplicateFacesRetained: 5,
    newGeometry: false,
  }),
);
