import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inventoryHolds } from './anatomy-inventory.mjs';

const bytes = await readFile('content/source-inventory.json');
const inventory = JSON.parse(bytes);
const catalog = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const candidates = inventory.records.filter(
  (record) =>
    record.tree === 'isa' &&
    record.status === 'unused-available' &&
    record.files.length <= 4 &&
    /muscle|pterygoid|constrictor|sphincter|laryn|pharyn|duoden|pancrea|urethra|bronch|esophag|oesophag|gallbladder|bile duct/i.test(
      record.name,
    ),
);
const results = candidates.map((candidate) => {
  const fileSet = new Set(candidate.files);
  const heldAliases = inventory.records
    .filter(
      (record) =>
        inventoryHolds[record.id] &&
        record.files.some((file) => fileSet.has(file)),
    )
    .map(({ tree, id, name, files }) => ({
      tree,
      id,
      name,
      overlap: files.filter((file) => fileSet.has(file)),
      reason: inventoryHolds[id],
    }));
  const identicalDefinitions = inventory.records
    .filter(
      (record) =>
        !(record.tree === candidate.tree && record.id === candidate.id) &&
        record.files.length === fileSet.size &&
        record.files.every((file) => fileSet.has(file)),
    )
    .map(({ tree, id, name }) => ({ tree, id, name }));
  const renderedOwners = catalog.structures
    .filter((structure) =>
      structure.sources.some((source) => fileSet.has(source.file)),
    )
    .map(({ id, fmaId }) => ({ id, fmaId }));
  return {
    id: candidate.id,
    name: candidate.name,
    files: candidate.files,
    heldAliases,
    identicalDefinitions,
    renderedOwners,
    decision: heldAliases.length
      ? 'existing-hold-applies'
      : identicalDefinitions.length
        ? 'resolve-aliases-before-mesh-audit'
        : 'candidate-for-mesh-audit',
    admitted: false,
    meshGeometryAudited: false,
  };
});
const constrictor = results.find((item) => item.id === 'FMA46622');
assert(constrictor);
assert.deepEqual(
  new Set(constrictor.heldAliases.map((item) => item.id)),
  new Set(['FMA46633', 'FMA46634']),
);
assert.equal(constrictor.decision, 'existing-hold-applies');
assert(
  results.every(
    (item) =>
      !item.admitted &&
      !item.meshGeometryAudited &&
      item.renderedOwners.length === 0,
  ),
);
const report = {
  sourceVersion: '4.0',
  license: inventory.license,
  credit: inventory.credit,
  inventorySha256: createHash('sha256').update(bytes).digest('hex'),
  catalogSha256: inventory.catalogSha256,
  query:
    'Unused available ISA definitions, at most four source components, matching selected muscle/pharyngeal/visceral/vascular name terms.',
  resultCount: results.length,
  results,
  nextAudit: results
    .filter((item) => item.decision !== 'existing-hold-applies')
    .map((item) => item.id),
  limits: [
    'Lexical inventory triage only; not an exhaustive anatomical review or a source admission.',
    'The middle-constrictor aggregate reuses both existing held laterality candidates; grouping cannot bypass that hold.',
    'The visceral-detail milestone admitted twelve definitions and held the pharyngeal raphe. The thoracic milestone admits four further definitions with one bronchial-variant geometry owner. See PANCREATIC_DETAIL.md and THORACIC_DETAIL.md; existing holds remain.',
    'Remaining small organ/muscle/vascular definitions need exact identity, parent-alias, common-coordinate and sampled surface-overlap checks before admission. No continuous organ or vessel network is inferred.',
    'Running this lexical triage changes no source geometry, source hold, review record, dependency or licence obligation.',
  ],
  clinicalValidation: false,
};
await writeFile(
  'content/unused-study-candidates.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      candidates: results.length,
      heldAggregates: results
        .filter((item) => item.decision === 'existing-hold-applies')
        .map((item) => item.id),
      admitted: 0,
    },
    null,
    2,
  ),
);
