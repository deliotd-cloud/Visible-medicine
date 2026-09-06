import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { junctionId, junctionParents } from './junction-selection.mjs';
const root = 'public/models/bodyparts3d/full-body/';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const baseline = JSON.parse(
  await fs.readFile('content/junction-baseline.json', 'utf8'),
);
const catalog = JSON.parse(await fs.readFile(root + 'catalog.json', 'utf8'));
const evidence = JSON.parse(
  await fs.readFile('content/junction-source-audit.json', 'utf8'),
);
assert.equal(baseline.sourceCommit, '0b1c27632fb4fc7d7cd21b8c500c6f883bd6c645');
assert.equal(evidence.sourceCommit, baseline.sourceCommit);
assert.equal(
  baseline.catalogSha256,
  '9b2cb3eb0b530491c9a4d0f54c4d89058e14f7475f05597f4babf9fb3ea8bdc7',
);
assert.equal(baseline.structures.length, 924);
assert.equal(catalog.structures.length, 942);
assert.equal(catalog.bundles.length, 76);
assert.deepEqual(catalog.coordinateSystem, baseline.coordinateSystem);
assert.deepEqual(catalog.excluded, baseline.excluded);
const junction = catalog.structures.find((s) => s.id === junctionId);
assert(junction);
assert.equal(junction.fmaId, 'FMA11338');
assert.equal(junction.sourceName, 'ileocecal junction');
assert.equal(junction.sourceTree, 'isa');
assert.equal(junction.bundle, 'abdomen-organs-junction');
assert.deepEqual(junction.sources, [
  { file: 'FJ2599', sha256: evidence.raw.find((r) => r.tree === 'isa').sha256 },
]);
assert.deepEqual(junction.validation, {
  status: 'unvalidated',
  anatomicalReview: false,
});
assert.equal(junction.provenance.license, 'CC-BY-4.0');
const parentChanges = [];
for (const old of baseline.structures) {
  const now = catalog.structures.find((s) => s.id === old.id);
  assert(now);
  const before = baseline.parents.find((s) => s.id === old.id);
  if (!before) {
    assert.equal(hash(JSON.stringify(now)), old.sha256, old.id);
    continue;
  }
  assert(junctionParents.includes(before.fmaId));
  assert.equal(hash(JSON.stringify(before)), old.sha256);
  assert.deepEqual(
    now.sources,
    before.sources.filter((s) => s.file !== 'FJ2599'),
  );
  assert.equal(
    now.coverageNote,
    `${before.coverageNote ?? ''} Display aggregate excludes the separately selectable ileocecal junction surface. Source coordinates are unchanged.`.trim(),
  );
  // Only the displayed component list, explanatory note and a now-removed
  // closest-vertex label anchor may change. Identity and spatial bounds may not.
  for (const key of Object.keys(before).filter(
    (k) => !['sources', 'coverageNote', 'anchor'].includes(k),
  ))
    assert.deepEqual(now[key], before[key], key);
  parentChanges.push({ before, after: now });
}
assert.equal(parentChanges.length, 2);
const sourceOwners = new Map();
for (const s of catalog.structures)
  for (const f of s.sources) {
    assert(!sourceOwners.has(f.file), 'Duplicate source ownership: ' + f.file);
    sourceOwners.set(f.file, s.id);
  }
assert.equal(sourceOwners.get('FJ2599'), junctionId);
const bundleChanges = [];
for (const before of baseline.bundles) {
  const after = catalog.bundles.find((b) => b.id === before.id);
  const bytes = await fs.readFile(root + before.id + '.glb');
  assert.equal(hash(bytes), after.sha256);
  if (before.id !== 'abdomen-organs') {
    assert.deepEqual(after, before);
    continue;
  }
  assert.equal(after.structures, before.structures);
  assert.equal(after.url, before.url);
  bundleChanges.push({ before, after });
}
assert.equal(bundleChanges.length, 1);
async function meshes(bytes) {
  const { scene } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  const map = new Map();
  scene.traverse((m) => {
    if (m.isMesh) map.set(m.name, m);
  });
  return map;
}
// Exact oriented triangle multisets (position AND shading normal), not bounds
// or approximate overlap. Re-indexing does not change a triangle's evidence.
function triangles(mesh) {
  const { position: p, normal: n } = mesh.geometry.attributes,
    ix = mesh.geometry.index;
  const out = new Map();
  for (let i = 0; i < (ix?.count ?? p.count); i += 3) {
    const values = [];
    for (let j = 0; j < 3; j++) {
      const v = ix ? ix.getX(i + j) : i + j;
      values.push(
        p.getX(v),
        p.getY(v),
        p.getZ(v),
        n.getX(v),
        n.getY(v),
        n.getZ(v),
      );
    }
    const key = values.join(',');
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}
const oldBytes = execFileSync(
  'git',
  ['show', baseline.sourceCommit + ':' + root + 'abdomen-organs.glb'],
  { maxBuffer: 10e6 },
);
assert.equal(hash(oldBytes), bundleChanges[0].before.sha256);
const oldMeshes = await meshes(oldBytes),
  nextMeshes = await meshes(await fs.readFile(root + 'abdomen-organs.glb'));
const newBytes = await fs.readFile(root + junction.bundle + '.glb');
assert.equal(
  hash(newBytes),
  catalog.bundles.find((b) => b.id === junction.bundle).sha256,
);
const componentMeshes = await meshes(newBytes);
assert.equal(componentMeshes.size, 1);
const component = componentMeshes.get('FMA11338'),
  componentTriangles = triangles(component);
assert.equal(component.userData.structureId, junctionId);
assert.deepEqual([...oldMeshes.keys()], [...nextMeshes.keys()]);
let exactTriangles = 0;
for (const [name, old] of oldMeshes) {
  const next = nextMeshes.get(name),
    before = triangles(old),
    after = triangles(next);
  assert.deepEqual(next.userData, old.userData);
  if (junctionParents.includes(name))
    for (const [key, count] of componentTriangles)
      after.set(key, (after.get(key) ?? 0) + count);
  assert.deepEqual(
    after,
    before,
    'Exact old surface = remainder + separate junction: ' + name,
  );
  exactTriangles += [...before.values()].reduce((a, b) => a + b, 0);
}
// The ingestion anchor must lie on remaining tissue and be the closest vertex
// to the unchanged centre, not float at the removed component.
for (const { after } of parentChanges) {
  const p = nextMeshes.get(after.nodeName).geometry.attributes.position;
  let distance = Infinity,
    anchor;
  for (let i = 0; i < p.count; i++) {
    const point = [p.getX(i), p.getY(i), p.getZ(i)];
    const d = point.reduce((n, v, k) => n + (v - after.center[k]) ** 2, 0);
    if (d < distance) {
      distance = d;
      anchor = point;
    }
  }
  assert.deepEqual(after.anchor, anchor);
}
const transition = {
  sourceCommit: baseline.sourceCommit,
  reason:
    'FJ2599 has one source owner, FMA11338, after exact triangle-preserving separation from both bowel aggregates.',
  structures: parentChanges,
  bundles: bundleChanges,
};
const transitionText = JSON.stringify(transition, null, 2) + '\n';
if (process.argv.includes('--record-transition')) {
  const old = await fs
    .readFile('content/junction-transition.json', 'utf8')
    .catch(() => null);
  if (old)
    assert.equal(
      old.replace(/\r\n/g, '\n'),
      transitionText,
      'Do not overwrite transition evidence',
    );
  else await fs.writeFile('content/junction-transition.json', transitionText);
} else
  assert.deepEqual(
    JSON.parse(await fs.readFile('content/junction-transition.json', 'utf8')),
    transition,
  );
const result = {
  passed: true,
  catalogueEntries: catalog.structures.length,
  bodyBundles: catalog.bundles.length,
  unchangedPriorRecords: 922,
  unchangedPriorBundles: 72,
  explicitlyChangedParents: 2,
  sourceComponentsWithSingleOwner: sourceOwners.size,
  exactOrientedTrianglesChecked: exactTriangles,
  duplicateTrianglesRemoved: [...componentTriangles.values()].reduce(
    (a, b) => a + b,
    0,
  ),
  transitionSha256: hash(transitionText),
  unchangedCoordinateFrame: true,
  newAnatomicalTissue: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/junction-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
