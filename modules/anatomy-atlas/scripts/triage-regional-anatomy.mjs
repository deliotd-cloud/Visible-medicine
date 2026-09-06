import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { inventoryHolds } from './anatomy-inventory.mjs';

const inventoryBytes = await readFile('content/source-inventory.json');
const inventory = JSON.parse(inventoryBytes);
const catalogBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogBytes);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
assert.equal(inventory.catalogSha256, hash(catalogBytes));
const domains = [
  [
    'hand-foot-vessels',
    /palmar|plantar|digital|metacarpal|metatarsal|carpal|calcaneal|hand|foot/i,
    /arter|vein|arch|venous/i,
  ],
  [
    'ocular-lacrimal',
    /ocular|eyeball|lacrim|tarsal plate|ciliar|eyelid|levator palpebrae/i,
  ],
  [
    'laryngeal-pharyngeal',
    /thyrohyoid|conus elasticus|aryepiglott|raphe|laryn|pharyn|constrictor/i,
  ],
  [
    'pelvic-genitourinary',
    /deferent|penis|penile|prostat|ureth|vesic|testis|pelvi/i,
  ],
  [
    'cranial-neural',
    /nerve|ganglion|chiasm|tract|stria|lamina terminalis|collicul|peduncle|telencephalon|ventricle|cerebell|gyrus|sulcus|dura|tentorium/i,
  ],
  [
    'regional-supporting-tissue',
    /muscle|tendon|retinacul|ligament|fascia|aponeuros|interosse|pollicis brevis/i,
  ],
  [
    'visceral-vessels-ducts',
    /renal|hepatic|gastric|mesenter|celiac|coeliac|splen|suprarenal|cystic/i,
    /arter|vein|duct/i,
  ],
  ['surface-features', /skin|hair|gingiv|lip$|external ear/i],
];
const unused = inventory.records.filter(
  (r) => r.tree === 'isa' && r.status === 'unused-available',
);
const bounded = unused.filter((r) => r.files.length > 0 && r.files.length <= 4);
const grouped = new Map();
for (const r of bounded) {
  const tags = domains
    .filter(
      ([, name, constraint]) =>
        name.test(r.name) && (!constraint || constraint.test(r.name)),
    )
    .map(([id]) => id);
  if (!tags.length) continue;
  const key = [...r.files].sort(compare).join(',');
  if (!grouped.has(key))
    grouped.set(key, {
      files: [...r.files].sort(compare),
      definitions: [],
      domains: new Set(),
    });
  const group = grouped.get(key);
  group.definitions.push({ id: r.id, name: r.name });
  for (const tag of tags) group.domains.add(tag);
}
const groups = [...grouped.values()]
  .map((group) => {
    const heldComponents = inventory.records
      .filter(
        (r) =>
          inventoryHolds[r.id] &&
          r.files.some((file) => group.files.includes(file)),
      )
      .map((r) => ({
        tree: r.tree,
        id: r.id,
        name: r.name,
        files: r.files.filter((file) => group.files.includes(file)),
        reason: inventoryHolds[r.id],
      }));
    const renderedOwners = catalog.structures
      .filter((s) =>
        s.sources.some((source) => group.files.includes(source.file)),
      )
      .map((s) => s.id);
    assert.equal(renderedOwners.length, 0);
    return {
      files: group.files,
      definitions: group.definitions.sort((a, b) =>
        a.id.localeCompare(b.id, 'en'),
      ),
      domains: [...group.domains],
      heldComponents,
      decision: heldComponents.length
        ? 'existing-component-hold-applies'
        : 'identity-and-geometry-review-required',
      renderedOwners,
      admitted: false,
      meshGeometryAudited: false,
    };
  })
  .sort(
    (a, b) =>
      a.files.length - b.files.length ||
      a.files.join().localeCompare(b.files.join(), 'en'),
  );
const flattenedIds = groups.flatMap((g) => g.definitions.map((d) => d.id));
assert.equal(new Set(flattenedIds).size, flattenedIds.length);
for (const [aggregate, held] of [
  ['FMA37378', ['FMA37388', 'FMA37389']],
  ['FMA46622', ['FMA46633', 'FMA46634']],
]) {
  const group = groups.find((g) =>
    g.definitions.some((d) => d.id === aggregate),
  );
  assert(group && group.decision === 'existing-component-hold-applies');
  assert.deepEqual(
    new Set(group.heldComponents.map((r) => r.id)),
    new Set(held),
  );
}
const report = {
  sourceVersion: '4.0',
  license: inventory.license,
  credit: inventory.credit,
  inventorySha256: hash(inventoryBytes),
  catalogSha256: hash(catalogBytes),
  query:
    'Unused-available ISA definitions with one to four components and explicit lexical regional-domain matches. Exact component sets are grouped without choosing a preferred anatomical identity. Domains overlap and are not inferred ontology classes.',
  unusedIsaDefinitions: unused.length,
  boundedIsaDefinitions: bounded.length,
  matchedDefinitions: flattenedIds.length,
  sourceSetGroups: groups.length,
  domainCounts: domains.map(([id]) => ({
    id,
    sourceSetGroups: groups.filter((g) => g.domains.includes(id)).length,
  })),
  groups,
  limits: [
    'Names and source-set equivalence are retrieval triage, not anatomy or clinical validation. No candidate is admitted by this report.',
    'Unmatched, large, partially represented and PART-OF definitions are outside this bounded query, not proved absent anatomy.',
    'Held components remain held under aggregate or alternative names. Unverified geometry can still duplicate an existing surface despite a different filename.',
    'Before admission verify exact identity, asset rights/version, raw hashes, common coordinates, laterality and geometry overlap; do not infer missing counterparts, tissue connections or clinically normal variants.',
  ],
  clinicalValidation: false,
};
await writeFile(
  'content/regional-source-candidates.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log({
  unusedIsaDefinitions: unused.length,
  boundedIsaDefinitions: bounded.length,
  matchedDefinitions: flattenedIds.length,
  sourceSetGroups: groups.length,
  heldGroups: groups.filter((g) => g.heldComponents.length).length,
  domainCounts: report.domainCounts,
});
