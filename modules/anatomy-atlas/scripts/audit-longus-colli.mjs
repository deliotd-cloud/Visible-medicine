import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadSourceHolds } from './load-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  sourceTriangleSet,
} from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import {
  spatialDistanceIndex,
  uniqueSourceVertices,
  distanceSummary,
} from './source-spatial-math.mjs';
import {
  shapeCandidate,
  compareTranslatedShape,
} from './vessel-shape-math.mjs';
import { longusColliSources } from './longus-colli-sources.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, inventory, records, policy, evidence } =
  await loadSourceHolds();
async function bytesFor(tree, file, sha) {
  const bytes = await readFile(`../work/bodyparts3d/${tree}/${file}.obj`);
  assert.equal(hash(bytes), sha);
  return bytes;
}
const shapes = new Map(),
  groups = [],
  held = [];
for (const candidate of longusColliSources) {
  const definition = records.find(
    (r) => r.tree === 'isa' && r.id === candidate.id,
  );
  assert.equal(definition.name, candidate.name);
  assert.deepEqual(
    definition.files,
    candidate.files.map((f) => f.file),
  );
  const parts = [],
    sourceShapes = [];
  for (const source of candidate.files) {
    const bytes = await bytesFor('isa', source.file, source.sha256),
      s = sourceObjShape(bytes);
    sourceShapes.push(s);
    const geometrySha256 = geometryFingerprint(bytes);
    parts.push({
      ...source,
      bytes: bytes.length,
      geometrySha256,
      topology: sourceTopology(s),
      exactInventoryMatches: inventory.assets.filter(
        (a) => a.geometrySha256 === geometrySha256 && a.representedBy.length,
      ),
    });
  }
  const s = mergeSourceShapes(sourceShapes);
  const row = {
    ...candidate,
    definition,
    parts,
    aliases: records.filter(
      (r) =>
        r.tree === definition.tree &&
        r.id !== definition.id &&
        JSON.stringify(r.files) === JSON.stringify(definition.files),
    ),
    bounds: { min: s.min, max: s.max },
    topology: sourceTopology(s),
    directOwners: catalog.structures
      .filter(
        (s) =>
          s.sourceTree === 'isa' &&
          s.sources.some((f) => definition.files.includes(f.file)),
      )
      .map((s) => s.id),
    holdScreen: policy.inspect(definition),
  };
  if (candidate.status === 'held') {
    held.push(row);
    continue;
  }
  policy.assertNoKnownHolds([definition]);
  assert(row.topology.closedOrientedManifold);
  assert(
    parts.every(
      (p) =>
        p.topology.closedOrientedManifold &&
        p.topology.components.length === 1 &&
        !p.exactInventoryMatches.length,
    ),
  );
  assert(!row.directOwners.length);
  shapes.set(candidate.id, s);
  groups.push(row);
}
assert.equal(groups.length, 3);
assert.equal(held.length, 0);
// Raw catalog plus separately admitted surfaces; avoid depending on the addition under test.
const additions = await Promise.all(
  [
    'brachial-veins',
    'tentorium',
    'deep-leg-veins',
    'portal-veins',
    'hepatic-veins',
  ].map(async (name) =>
    JSON.parse(
      await readFile(`public/models/bodyparts3d/${name}/catalog.json`),
    ),
  ),
);
const owners = [
  ...catalog.structures,
  ...additions.flatMap((a) => a.structures),
];
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const screened = [],
  comparisons = [],
  nearest = new Map(
    [...shapes].map(([id, s]) => [id, spatialDistanceIndex(s)]),
  );
const samples = (s) => {
  const p = uniqueSourceVertices(s),
    stride = Math.max(1, Math.ceil(p.length / 128));
  return p.filter((_, i) => i % stride === 0);
};
function compare(id, candidate, reference, referenceId, extra = {}) {
  const refTriangles = sourceTriangleSet(reference);
  return {
    candidate: id,
    reference: referenceId,
    ...extra,
    exactSharedTriangles: [...sourceTriangleSet(candidate)].filter((t) =>
      refTriangles.has(t),
    ).length,
    candidateToReference: distanceSummary(
      samples(candidate),
      spatialDistanceIndex(reference),
    ),
    referenceToCandidate: distanceSummary(samples(reference), nearest.get(id)),
    translatedDiagnostic:
      extra.system === 'muscles' && shapeCandidate(candidate, reference)
        ? compareTranslatedShape(candidate, reference)
        : null,
  };
}
for (const owner of owners) {
  const box = new Box3(
    new Vector3(...owner.bounds.min),
    new Vector3(...owner.bounds.max),
  ).applyMatrix4(inverse);
  const bounds = {
    min: box.min.toArray(),
    max: box.max.toArray(),
    extent: box.getSize(new Vector3()).toArray(),
  };
  const candidates = groups.filter(
    (g) =>
      sourceBoundsNear(shapes.get(g.id), bounds, 1.01) ||
      (owner.system === 'muscles' && shapeCandidate(shapes.get(g.id), bounds)),
  );
  screened.push({
    id: owner.id,
    recordSha256: hash(JSON.stringify(owner)),
    candidateIds: candidates.map((g) => g.id),
  });
  if (!candidates.length) continue;
  const reference = mergeSourceShapes(
    await Promise.all(
      owner.sources.map(async (f) =>
        sourceObjShape(await bytesFor(owner.sourceTree, f.file, f.sha256)),
      ),
    ),
  );
  for (const g of candidates)
    comparisons.push(
      compare(g.id, shapes.get(g.id), reference, owner.id, {
        system: owner.system,
        referenceFma: owner.fmaId,
        referenceSources: owner.sources,
      }),
    );
}
const internal = [];
for (let i = 0; i < groups.length; i++)
  for (let j = i + 1; j < groups.length; j++) {
    const a = groups[i],
      b = groups[j];
    internal.push(
      compare(a.id, shapes.get(a.id), shapes.get(b.id), b.id, {
        system: 'muscles',
      }),
    );
  }
assert(
  [...comparisons, ...internal].every(
    (c) => !c.exactSharedTriangles && !c.translatedDiagnostic?.similar,
  ),
);
const result = {
  schemaVersion: 1,
  sourceCommit: '1f9413f581fd35da56561001e23b803ce94951af',
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  sourceArchive:
    'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  groups,
  held,
  screened,
  comparisons,
  internal,
  clinicalApproval: false,
  geometryModified: false,
  limitations: [
    'Bounded vertex-to-surface sampling is diagnostic, not complete collision or self-intersection certification.',
    'Three whole official left-sided part definitions retained; generic aliases are not duplicated as additional anatomy. No supplied right counterpart is inferred, mirrored, cropped, fitted or bridged.',
    'No right longus colli, complete tendon/fascial plane, attachment footprint, level-specific slip or patient imaging registration is supplied.',
    'Source topology and proximity diagnostics do not verify muscle attachments, level boundaries, tissue interfaces or clinical safety.',
  ],
};
const output = JSON.stringify(result, null, 2) + '\n',
  path = 'docs/longus-colli-source-audit.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    groups: groups.length,
    held: held.length,
    owners: screened.length,
    comparisons: comparisons.length,
    internal: internal.length,
    triangles: groups.reduce((n, g) => n + g.topology.triangles, 0),
    auditSha256: hash(output),
    clinicalApproval: false,
  }),
);
