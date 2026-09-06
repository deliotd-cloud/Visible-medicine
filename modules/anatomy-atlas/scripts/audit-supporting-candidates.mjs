import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const inventoryRaw = await fs.readFile('content/source-inventory.json'),
  inventory = JSON.parse(inventoryRaw);
const catalogRaw = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  ),
  catalog = JSON.parse(catalogRaw);
const queryRaw = await fs.readFile('content/regional-source-candidates.json'),
  query = JSON.parse(queryRaw);
assert.equal(
  hash(inventoryRaw),
  '339eb68f016a33545aac745d921e1a678927a6b3d813afb5f5a0eda75ce12fac',
);
assert.equal(
  hash(catalogRaw),
  '8868c391ee285c13cfe54ffd3a5e4051d4a2e41d956a22acbaeb94bc8e4920a7',
);
assert.equal(query.inventorySha256, hash(inventoryRaw));
const types = {
  FJ1343: [
    'tendon-candidate',
    'One source shared by generic and right levator-palpebrae tendon definitions. Do not infer a left counterpart or merge with the existing muscle.',
  ],
  FJ1581: [
    'tendon-candidate',
    'Generic/right intermediate-tendon aliases do not establish a named parent muscle or attachment. Further source/geometry evidence is required.',
  ],
  FJ1514: [
    'muscle-candidate',
    'A superficial flexor-pollicis-brevis head, not fascia or tendon. Compare exact shape and laterality with previously held whole-muscle alternatives before admission.',
  ],
  FJ1514M: [
    'muscle-candidate',
    'The source-named left superficial flexor-pollicis-brevis head remains separate from held whole-muscle alternatives. A filename suffix is not anatomical validation.',
  ],
  FJ2223: [
    'artery-candidate',
    'Left common interosseous artery. Route to the forearm vascular queue, not connective-tissue completion.',
  ],
  FJ2275: [
    'artery-candidate',
    'Right common interosseous artery. Route to the forearm vascular queue, not connective-tissue completion.',
  ],
  FJ2245: [
    'artery-candidate',
    'Left recurrent interosseous artery. Route to the forearm vascular queue, not connective-tissue completion.',
  ],
  FJ2297: [
    'artery-candidate',
    'Right recurrent interosseous artery. Route to the forearm vascular queue, not connective-tissue completion.',
  ],
  FJ1469: [
    'held-muscle',
    'Existing whole-muscle laterality/position hold applies. No aggregate bypass or automatic relabelling.',
  ],
  FJ1469M: [
    'held-muscle',
    'Existing whole-muscle laterality/position hold applies. No aggregate bypass or automatic relabelling.',
  ],
};
const groups = query.groups.filter((g) =>
  g.domains.includes('regional-supporting-tissue'),
);
assert.equal(groups.length, 12);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const files = [...new Set(groups.flatMap((g) => g.files))].sort(compare);
assert.deepEqual(files, Object.keys(types).sort(compare));
const components = files.map((file) => {
  const aliases = inventory.records.filter((r) => r.files.includes(file));
  const renderedOwners = catalog.structures
    .filter((s) => s.sources.some((f) => f.file === file))
    .map((s) => s.id);
  assert.equal(renderedOwners.length, 0);
  const holds = aliases
    .filter((r) => r.heldReason)
    .map(({ tree, id, name, heldReason }) => ({
      tree,
      id,
      name,
      reason: heldReason,
    }));
  const [classification, rationale] = types[file];
  assert.equal(holds.length > 0, classification === 'held-muscle');
  return {
    file,
    classification,
    rationale,
    renderedOwners,
    holds,
    exactDefinitions: aliases
      .filter((r) => r.files.length === 1)
      .map(({ tree, id, name, files }) => ({ tree, id, name, files })),
    aliases: aliases.map((r) => ({
      tree: r.tree,
      id: r.id,
      name: r.name,
      componentCount: r.files.length,
      recordSha256: hash(JSON.stringify(r)),
    })),
    admitted: false,
    geometryAudited: false,
  };
});
const report = {
  sourceCommit: '7e8718882ffc4eb98753bb965c785faa81de6de7',
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  credit: catalog.credit,
  catalogSha256: hash(catalogRaw),
  inventorySha256: hash(inventoryRaw),
  querySha256: hash(queryRaw),
  scope:
    'Index-only adjudication of the lexical supporting-tissue queue; not a geometry or clinical audit.',
  sourceSetGroups: 12,
  uniqueComponents: 10,
  unheldTendonComponents: 2,
  unheldMuscleComponents: 2,
  unheldArteryComponents: 4,
  heldMuscleComponents: 2,
  components,
  admitted: 0,
  clinicalValidation: false,
  next: 'Audit four exact forearm artery sources and nearby rendered vessels; separately establish tendon parent/extent and thumb-head laterality against held alternatives. Do not count this query as missing fascia or duplicate group aliases as additional anatomy.',
};
await fs.writeFile(
  'content/supporting-candidate-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log({
  sourceSetGroups: 12,
  uniqueComponents: 10,
  tendons: 2,
  muscles: 2,
  arteries: 4,
  held: 2,
  admitted: 0,
  geometryAudited: false,
});
