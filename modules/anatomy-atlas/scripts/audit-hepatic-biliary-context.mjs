import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { catalog, records, evidence, policy } = await loadSourceHolds();
const hepatic = JSON.parse(
  await readFile('public/models/bodyparts3d/hepatic/catalog.json'),
);
assert.deepEqual(hepatic.coordinateSystem, catalog.coordinateSystem);
assert.deepEqual(
  hepatic.parent,
  catalog.structures.find((s) => s.id === hepatic.parent.id),
);
const definitions = [
  ['FMA7202', 'partof', 'FJ2817'],
  ['FMA14539', 'isa', 'FJ3080'],
  ['FMA14668', 'isa', 'FJ3079'],
];
const structures = [],
  sourceReports = [];
for (const [fma, tree, file] of definitions) {
  const matches = catalog.structures.filter((s) => s.fmaId === fma);
  assert.equal(matches.length, 1);
  const structure = matches[0];
  assert.equal(structure.sourceTree, tree);
  assert.equal(structure.region, 'abdomen'); // Preserve the legacy gallbladder ID verbatim.
  const definition = records.find((r) => r.tree === tree && r.id === fma);
  assert.deepEqual(definition.files, [file]);
  policy.assertNoKnownHolds([definition]);
  assert.equal(structure.sources.length, 1);
  assert.equal(structure.sources[0].file, file);
  assert(
    !hepatic.structures.some((s) => s.sources.some((f) => f.file === file)),
    'Repeated liver source',
  );
  const bytes = await readFile(`${cache}/${tree}/${file}.obj`);
  assert.equal(hash(bytes), structure.sources[0].sha256);
  const topology = sourceTopology(sourceObjShape(bytes));
  structures.push(structure);
  sourceReports.push({
    fmaId: fma,
    tree,
    file,
    sha256: hash(bytes),
    topology,
  });
}
const bundles = catalog.bundles.filter((b) =>
  structures.some((s) => s.bundle === b.id),
);
for (const bundle of bundles) {
  const bytes = await readFile(
    'public' + new URL(bundle.url, 'https://local.invalid').pathname,
  );
  assert.equal(hash(bytes), bundle.sha256);
  assert.equal(bytes.length, bundle.bytes);
}
const result = {
  schemaVersion: 1,
  evidence,
  coordinateSystem: catalog.coordinateSystem,
  license: catalog.license,
  credit: catalog.credit,
  parent: hepatic.parent,
  structures,
  bundles,
  sourceReports,
  limitation:
    'Existing gallbladder, cystic duct and source-labelled common hepatic duct are nonselectable orientation landmarks. No common bile duct, duct junction, lumen, bile flow, surgical plane or clinical registration is inferred; original names, IDs, coordinates and topology are preserved.',
};
const path = 'public/models/bodyparts3d/hepatic/biliary-context.json';
const output = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(await readFile(path, 'utf8'), output);
else {
  const prior = await readFile(path, 'utf8').catch((e) => {
    if (e.code === 'ENOENT') return null;
    throw e;
  });
  assert(
    prior === null || prior === output,
    'Existing source pins require explicit adjudication',
  );
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    context: structures.length,
    reusedBundles: bundles.length,
    reports: sourceReports.map((r) => ({ fma: r.fmaId, ...r.topology })),
    newGeometry: false,
  }),
);
