import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const cardiac = JSON.parse(
  await readFile('public/models/bodyparts3d/cardiac/catalog.json'),
);
assert.deepEqual(cardiac.coordinateSystem, catalog.coordinateSystem);
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7088');
assert.deepEqual(parent, cardiac.parent);
const definitions = [
  ['FMA4720', ['FJ3645']],
  ['FMA50872', ['FJ3019']],
  ['FMA50873', ['FJ2924']],
  ['FMA49914', ['FJ3020']],
  ['FMA49916', ['FJ2925', 'FJ2933']],
  ['FMA49911', ['FJ3040']],
  ['FMA49913', ['FJ2944', 'FJ2950', 'FJ2955']],
  ['FMA3736', ['FJ3413']],
];
const structures = [],
  sourceReports = [];
for (const [fmaId, files] of definitions) {
  const matches = catalog.structures.filter((s) => s.fmaId === fmaId);
  assert.equal(matches.length, 1);
  const s = matches[0];
  assert.equal(s.sourceTree, 'isa');
  assert.equal(s.system, 'vessels');
  const definition = records.find((r) => r.tree === 'isa' && r.id === fmaId);
  assert.deepEqual(definition.files, files);
  assert.deepEqual(
    s.sources.map((f) => f.file),
    files,
  );
  policy.assertNoKnownHolds([definition]);
  assert(
    !cardiac.structures.some((c) =>
      c.sources.some((f) => files.includes(f.file)),
    ),
    'Context duplicates a displayed chamber or wall',
  );
  for (const source of s.sources) {
    const raw = await readFile(`${cache}/isa/${source.file}.obj`);
    assert.equal(hash(raw), source.sha256);
    sourceReports.push({
      fmaId,
      tree: 'isa',
      ...source,
      topology: sourceTopology(sourceObjShape(raw)),
    });
  }
  structures.push(s);
}
assert.equal(
  new Set(structures.flatMap((s) => s.sources.map((f) => f.file))).size,
  11,
);
const bundles = catalog.bundles.filter((b) =>
  structures.some((s) => s.bundle === b.id),
);
for (const b of bundles) {
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://local.invalid').pathname,
  );
  assert.equal(bytes.length, b.bytes);
  assert.equal(hash(bytes), b.sha256);
}
const result = {
  schemaVersion: 1,
  evidence,
  coordinateSystem: catalog.coordinateSystem,
  license: catalog.license,
  credit: catalog.credit,
  parent,
  structures,
  bundles,
  sourceReports,
  excludedFromContext: [
    {
      fmaId: 'FMA10951',
      reason:
        'The existing inferior vena cava includes a long abdominal extent; it is not a separately validated cavoatrial segment. Not cropped or repositioned to imply an atrial connection.',
    },
  ],
  limitation:
    'Existing great-vessel surfaces provide orientation only. Original compound surfaces, remnants and topology defects are retained; no continuous lumen, ostium, pulmonary trunk, valve, flow, patient registration or repaired connection is inferred.',
};
const path = 'public/models/bodyparts3d/cardiac/great-vessel-context.json';
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(await readFile(path, 'utf8'), text);
else {
  const old = await readFile(path, 'utf8').catch((e) => {
    if (e.code === 'ENOENT') return null;
    throw e;
  });
  assert(
    old === null || old === text,
    'Existing context pins changed; explicit source review required',
  );
  await writeFile(path, text);
}
console.log(
  JSON.stringify(
    {
      structures: structures.length,
      files: sourceReports.length,
      bundles: bundles.length,
      triangles: sourceReports.reduce((n, r) => n + r.topology.triangles, 0),
      topology: sourceReports.map((r) => ({
        file: r.file,
        components: r.topology.components.length,
        duplicateFaces: r.topology.duplicateFaces,
        boundaryEdges: r.topology.boundaryEdges,
        nonManifoldEdges: r.topology.nonManifoldEdges,
        degenerateFaces: r.topology.degenerateFaces,
      })),
      newGeometry: false,
    },
    null,
    2,
  ),
);
