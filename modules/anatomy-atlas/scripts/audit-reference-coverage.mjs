import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { loadSourceHolds } from './load-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import {
  sourceBindingEvidence,
  sourceCoverageStatus,
  coverageCounts,
} from './reference-coverage.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const textHash = (value) => hash(JSON.stringify(value));
const current = await loadCurrentSourceHolds();
const additionalHolds = current.supplemental.flatMap(h => h.files.map(s => ({...h, file:s.file, sha256:s.sha256})));
const referenceBytes = await readFile('content/reference-male-inventory.json');
const reference = JSON.parse(referenceBytes);
assert.equal(reference.repository, 'ashemag/human-atlas');
assert.equal(reference.commit, '1c38bf35c254a891200d3cedecfd57abebe83d8d');
assert.equal(
  reference.manifestSha256,
  'c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee',
);
assert.equal(reference.sourceLicense, 'CC-BY-4.0');
assert.equal(reference.parts.length, 2234);
assert.equal(new Set(reference.parts.map((p) => p[0])).size, 2234);
assert(
  reference.parts.every(
    (p) => p.length === 2 && /^FJ\d+M?$/.test(p[0]) && typeof p[1] === 'string',
  ),
);
if (process.argv.includes('--verify-reference')) {
  const bytes = execFileSync(
    'gh',
    [
      'api',
      `repos/${reference.repository}/contents/${reference.path}?ref=${reference.commit}`,
      '-H',
      'Accept: application/vnd.github.raw+json',
    ],
    { maxBuffer: 4e6 },
  );
  assert.equal(
    hash(bytes),
    reference.manifestSha256,
    'Pinned external manifest changed',
  );
  assert.deepEqual(
    JSON.parse(bytes)
      .parts.map((p) => [p.id, p.system])
      .sort(([a], [b]) => a.localeCompare(b)),
    reference.parts,
  );
}
const h = await loadSourceHolds();
const crossBytes = await readFile('docs/reference-cross-tree-audit.json');
const cross = JSON.parse(crossBytes);
assert.equal(cross.license, 'CC-BY-4.0');
assert.equal(cross.sourceVersion, '4.0');
assert.equal(cross.sources.length, 8);
assert.equal(new Set(cross.sources.map((s) => s.tree + '/' + s.file)).size, 8);
const assets = structuredClone(h.inventory.assets);
for (const source of cross.sources) {
  assert(
    ['isa', 'partof'].includes(source.tree) &&
      ['FJ3481', 'FJ3581', 'FJ3582', 'FJ3584'].includes(source.file),
  );
  assert.equal(
    source.path,
    `content/prototypes/reference-cross-tree/${source.tree}/${source.file}.obj`,
  );
  const bytes = await readFile(source.path);
  assert.equal(hash(bytes), source.sha256);
  assert.equal(geometryFingerprint(bytes), source.geometrySha256);
  const original = assets.find(
    (a) => a.tree === source.tree && a.file === source.file,
  );
  assert.equal(original.bytes, bytes.length);
  if (original.sha256) assert.equal(original.sha256, source.sha256);
  if (original.geometrySha256)
    assert.equal(original.geometrySha256, source.geometrySha256);
  Object.assign(original, {
    sha256: source.sha256,
    geometrySha256: source.geometrySha256,
  });
}
const built = await build({
  stdin: {
    contents:
      "export { bodyDisplayCatalog, eyeDisplayCorrection, pancreasDisplayCorrection } from './lib/body-display-catalog'; export { nestedStudyTargets } from './lib/nested-anatomy';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const a = await import(
  'data:text/javascript;base64,' +
    Buffer.from(built.outputFiles[0].text).toString('base64')
);
const root = a.bodyDisplayCatalog(h.catalog),
  nested = a.nestedStudyTargets(root);
const shoulderBytes = await readFile('public/models/bodyparts3d/manifest.json');
const shoulder = JSON.parse(shoulderBytes);
assert.equal(shoulder.version, '4.0');
assert.equal(shoulder.license, 'CC-BY-4.0');
const owners = [];
const add = (structure, scope, extra = {}) => {
  for (const source of structure.sources)
    owners.push({
      scope,
      id: structure.id,
      fmaId: structure.fmaId,
      tree: structure.sourceTree,
      file: source.file,
      sha256: source.sha256,
      ...extra,
    });
};
root.structures.forEach((s) => add(s, 'root'));
nested.forEach((t) =>
  add(t.structure, 'nested', {
    study: t.study,
    parentId: t.parentId,
    sourceHash: t.sourceHash,
  }),
);
shoulder.parts.forEach((p) =>
  add(
    {
      id: p.structureId,
      fmaId: p.fmaId,
      sourceTree: 'isa',
      sources: [
        { file: p.sourceFile.replace(/\.obj$/, ''), sha256: p.sourceSha256 },
      ],
    },
    'shoulder',
  ),
);
const referenceFiles = reference.parts.map((p) => p[0]).sort();
const isa = assets.filter((a) => a.tree === 'isa');
assert.deepEqual(
  isa.map((a) => a.file).sort(),
  referenceFiles,
  'External comparison and official pinned archive must cover exactly the same file IDs',
);
const corrected = [];
for (const correction of [
  a.eyeDisplayCorrection,
  a.pancreasDisplayCorrection,
]) {
  for (const old of correction.original.sources)
    if (
      !correction.replacement.sources.some(
        (s) => s.file === old.file && s.sha256 === old.sha256,
      )
    )
      corrected.push({
        file: old.file,
        tree: correction.original.sourceTree,
        sha256: old.sha256,
        structureId: correction.original.id,
        replacementSources: correction.replacement.sources.map((s) => s.file),
      });
}
const rows = [];
for (const [file, referenceDisplaySystem] of reference.parts) {
  const asset = isa.find((a) => a.file === file);
  const matches = owners
    .filter((o) => o.file === file)
    .map((o) => ({ ...o, evidence: sourceBindingEvidence(asset, o, assets) }));
  const definitions = h.records.filter(
    (r) => r.tree === 'isa' && r.files.includes(file),
  );
  if(additionalHolds.some(h=>h.file===file)) assert(!matches.some(o=>
    ['same-tree-source-binding','cross-tree-geometry-match'].includes(o.evidence)),
    'Held supplemental source appears in runtime anatomy: '+file);
  assert(definitions.length, 'Missing official source definition: ' + file);
  const minimum = Math.min(...definitions.map((d) => d.files.length));
  const holds = [];
  for (const held of additionalHolds.filter((h) => h.file === file))
    holds.push({
      tree: 'isa',
      conceptId: held.id,
      reason: held.reason,
      evidence: held.evidence,
      evidenceSha256: held.evidenceSha256,
    });
  for (const tree of ['isa', 'partof']) {
    const reasons = new Map();
    for (const r of h.records.filter(
      (r) => r.tree === tree && r.files.includes(file),
    )) {
      const screen = h.policy.inspect({ ...r, files: [file] });
      if (screen.directReason) reasons.set(r.id, screen.directReason);
      for (const c of screen.components)
        for (const id of c.heldBy) if (!reasons.has(id)) reasons.set(id, null);
    }
    for (const [id, reason] of reasons)
      holds.push({ tree, conceptId: id, reason });
  }
  const exclusions = corrected.filter((c) => c.file === file);
  const status = sourceCoverageStatus({
    owners: matches,
    hold: holds.some((h) => h.tree === 'isa'),
    relatedHold: holds.some((h) => h.tree === 'partof'),
    excluded: exclusions.length > 0,
  });
  rows.push({
    file,
    referenceDisplaySystem,
    status,
    admissionApproved: false,
    definitions: definitions
      .filter((d) => d.files.length === minimum)
      .map((d) => ({ id: d.id, name: d.name, componentCount: d.files.length })),
    owners: matches,
    holds,
    displayCorrections: exclusions,
    source: {
      bytes: asset.bytes,
      crc32: asset.crc32,
      sha256: asset.sha256,
      geometrySha256: asset.geometrySha256,
    },
  });
}
const missing = rows.filter((r) => !r.owners.some((o) => o.scope === 'root'));
const unverifiedRoot = rows.filter(
  (r) =>
    r.owners.some((o) => o.scope === 'root') &&
    r.status !== 'root-source-covered',
);
const report = {
  schemaVersion: 1,
  scope:
    'Male BodyParts3D v4 IS-A source-file coverage in current root, reachable nested selections and shoulder. Not anatomical completeness, geometry validation or admission permission.',
  reference: {
    repository: reference.repository,
    commit: reference.commit,
    url: reference.url,
    manifestSha256: reference.manifestSha256,
    extractedMetadataSha256: hash(referenceBytes),
  },
  evidence: {
    ...h.evidence,
    crossTreeProofSha256: hash(crossBytes),
    supplementalSourceHoldEvidence: current.supplementalEvidence,
    currentRootSha256: textHash(root),
    reachableNestedSha256: textHash(nested),
    shoulderManifestSha256: hash(shoulderBytes),
    sourceIdSetSha256: textHash(referenceFiles),
  },
  summary: {
    referenceSourceFiles: rows.length,
    rootSelections: root.structures.length,
    rootSourceFileIds: rows.length - missing.length,
    reachableNestedSelections: nested.length,
    rootOnlyDifferences: missing.length,
    rootBindingsNeedingEquivalenceReview: unverifiedRoot.length,
    allSourceStatuses: coverageCounts(rows, 'status'),
    rootDifferenceStatuses: coverageCounts(missing, 'status'),
    rootDifferenceReferenceGroups: coverageCounts(
      missing,
      'referenceDisplaySystem',
    ),
    reviewQueueReferenceGroups: coverageCounts(
      missing.filter((r) => r.status === 'needs-source-and-anatomical-review'),
      'referenceDisplaySystem',
    ),
  },
  limitations: [
    'Reference system groups are copied only for comparison, not used to classify the atlas; they include ambiguous groupings such as interventricular foramen under cardiac.',
    'Equal names, concept IDs or filenames alone do not prove equal anatomy or geometry. Cross-tree equivalence requires pinned geometry evidence and matching retained source hashes.',
    'Independent CC0 lower limb and BP3D v3 abdominal specimens use different donors/releases and are not counted as equal v4 source files. Their anatomical equivalents require separate review.',
    'Source-bound presence does not mean a separately selectable named structure, complete layer, clinically accurate surface or human approval.',
    'No competitor geometry or explanatory prose is imported. Only audit ID/group metadata is retained; eight original official OBJ files are retained separately as non-runtime cross-tree evidence, with attribution.',
    'The review queue is not an admission list; source topology, spatial extent, aliases, laterality, complete concept membership, licensing and clinical review remain required.',
  ],
  rootBindingsNeedingEquivalenceReview: unverifiedRoot,
  rootDifferences: missing,
};
const output = JSON.stringify(report, null, 2) + '\n';
const target = 'docs/reference-coverage-audit.json';
if (process.argv.includes('--check'))
  assert.equal(
    (await readFile(target, 'utf8')).replace(/\r\n/g, '\n'),
    output,
    'Coverage ledger is stale',
  );
else await writeFile(target, output);
console.log(
  JSON.stringify(
    {
      mode: process.argv.includes('--check') ? 'checked' : 'generated',
      ...report.summary,
      sourceInputsPinned: true,
      noAutomaticAdmission: true,
    },
    null,
    2,
  ),
);
