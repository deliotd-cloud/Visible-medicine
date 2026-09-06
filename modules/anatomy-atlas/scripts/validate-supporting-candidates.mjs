import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = (b) => createHash('sha256').update(b).digest('hex');
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const read = async (p) => JSON.parse(await fs.readFile(p));
const report = await read('content/supporting-candidate-audit.json');
const inventoryRaw = await fs.readFile('content/source-inventory.json'),
  inventory = JSON.parse(inventoryRaw);
const catalogRaw = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  ),
  catalog = JSON.parse(catalogRaw);
const queryRaw = await fs.readFile('content/regional-source-candidates.json'),
  query = JSON.parse(queryRaw);
same(report.catalogSha256, hash(catalogRaw));
same(report.inventorySha256, hash(inventoryRaw));
same(report.querySha256, hash(queryRaw));
same(report.sourceCommit, '7e8718882ffc4eb98753bb965c785faa81de6de7');
same(
  hash(catalogRaw),
  '8868c391ee285c13cfe54ffd3a5e4051d4a2e41d956a22acbaeb94bc8e4920a7',
);
same(
  hash(inventoryRaw),
  '339eb68f016a33545aac745d921e1a678927a6b3d813afb5f5a0eda75ce12fac',
);
same(report.sourceVersion, '4.0');
same(report.license, 'CC-BY-4.0');
same(report.credit, catalog.credit);
same(report.admitted, 0);
same(report.clinicalValidation, false);
const groups = query.groups.filter((g) =>
  g.domains.includes('regional-supporting-tissue'),
);
same(groups.length, 12);
same(report.sourceSetGroups, 12);
same(report.uniqueComponents, 10);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same(
  report.components.map((c) => c.file),
  [...new Set(groups.flatMap((g) => g.files))].sort(compare),
);
const expected = {
  FJ1343: [
    'tendon-candidate',
    'FMA54159',
    'tendon of right levator palpebrae superioris',
  ],
  FJ1581: ['tendon-candidate', 'FMA258850', 'right intermediate tendon'],
  FJ1514: [
    'muscle-candidate',
    'FMA65198',
    'superficial head of right flexor pollicis brevis',
  ],
  FJ1514M: [
    'muscle-candidate',
    'FMA65199',
    'superficial head of left flexor pollicis brevis',
  ],
  FJ2223: ['artery-candidate', 'FMA22808', 'left common interosseous artery'],
  FJ2275: ['artery-candidate', 'FMA22807', 'right common interosseous artery'],
  FJ2245: [
    'artery-candidate',
    'FMA268669',
    'left recurrent interosseous artery',
  ],
  FJ2297: [
    'artery-candidate',
    'FMA268667',
    'right recurrent interosseous artery',
  ],
  FJ1469: ['held-muscle', 'FMA37389', 'left flexor pollicis brevis'],
  FJ1469M: ['held-muscle', 'FMA37388', 'right flexor pollicis brevis'],
};
for (const c of report.components) {
  const aliases = inventory.records.filter((r) => r.files.includes(c.file));
  same(
    c.aliases,
    aliases.map((r) => ({
      tree: r.tree,
      id: r.id,
      name: r.name,
      componentCount: r.files.length,
      recordSha256: hash(JSON.stringify(r)),
    })),
  );
  same(
    c.exactDefinitions,
    aliases
      .filter((r) => r.files.length === 1)
      .map(({ tree, id, name, files }) => ({ tree, id, name, files })),
  );
  same(
    c.holds,
    aliases
      .filter((r) => r.heldReason)
      .map(({ tree, id, name, heldReason }) => ({
        tree,
        id,
        name,
        reason: heldReason,
      })),
  );
  same(c.renderedOwners, []);
  same(c.admitted, false);
  same(c.geometryAudited, false);
  same(
    catalog.structures.some((s) => s.sources.some((f) => f.file === c.file)),
    false,
  );
  const [classification, id, name] = expected[c.file];
  same(c.classification, classification);
  same(
    c.exactDefinitions.some(
      (d) => d.tree === 'isa' && d.id === id && d.name === name,
    ),
    true,
  );
  same(c.holds.length > 0, classification === 'held-muscle');
}
for (const [kind, count] of [
  ['tendon-candidate', 2],
  ['muscle-candidate', 2],
  ['artery-candidate', 4],
  ['held-muscle', 2],
])
  same(
    report.components.filter((c) => c.classification === kind).length,
    count,
  );
const result = {
  passed: true,
  checks,
  groups: 12,
  components: 10,
  admitted: 0,
  geometryAudited: false,
  clinicalValidation: false,
  catalogSha256: hash(catalogRaw),
};
await fs.writeFile(
  'docs/supporting-candidate-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
