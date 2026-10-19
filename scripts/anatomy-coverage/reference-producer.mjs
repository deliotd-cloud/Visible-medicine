import assert from 'node:assert/strict';
import {
  parseProducerArgs,
  createCoverageSource,
  hash,
  writeCoverageOutput,
  withCoverageWorkingDirectory,
} from './source-context.mjs';

const equality = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const issue = (list, name, expected, actual) => {
  if (!equality(expected, actual)) list.push({ name, expected, actual });
};

const args = parseProducerArgs(process.argv.slice(2));
const source = createCoverageSource(args);
source.hook();

try {
  // These are metadata records. No external source, model, or OBJ is fetched.
  const audit = source.json('docs/reference-coverage-audit.json');
  const reference = source.json('content/reference-male-inventory.json');
  const inventory = source.json('content/source-inventory.json');
  const cross = source.json('docs/reference-cross-tree-audit.json');
  const shoulder = source.json('public/models/bodyparts3d/manifest.json');
  const extractedMetadataSha256 = hash(source.read('content/reference-male-inventory.json'));
  const { loadCurrentSourceHolds } = await import(source.rootUrl + 'scripts/current-source-holds.mjs');
  const { inventoryHolds } = await import(source.rootUrl + 'scripts/anatomy-inventory.mjs');
  const { sourceBindingEvidence, sourceCoverageStatus } = await import(source.rootUrl + 'scripts/reference-coverage.mjs');
  const { bodyDisplayCatalog, eyeDisplayCorrection, pancreasDisplayCorrection } = await import(source.rootUrl + 'lib/body-display-catalog.ts');
  const { nestedStudyTargets } = await import(source.rootUrl + 'lib/nested-anatomy.ts');
  const h = await withCoverageWorkingDirectory(source.root, () => loadCurrentSourceHolds());

  // The hold loader checks each supplemental record against its own pinned hash.
  // Explicit reads also keep the direct and supplemental dependencies in the
  // verified committed-source input list, including non-imported audit code.
  for (const path of [
    'scripts/audit-reference-coverage.mjs', 'scripts/reference-coverage.mjs',
    'scripts/load-source-holds.mjs', 'scripts/current-source-holds.mjs',
    'scripts/anatomy-inventory.mjs', 'scripts/source-hold-policy.mjs',
    'scripts/tibial-recurrent-sources.mjs', 'scripts/limbic-landmark-sources.mjs',
    'scripts/pelvic-vein-sources.mjs', 'scripts/collicular-brachia-sources.mjs',
    'scripts/deep-leg-vein-sources.mjs',
    ...h.supplementalEvidence.map(row => row.path),
  ]) source.read(path);

  const rootCatalog = bodyDisplayCatalog(h.catalog);
  const nested = nestedStudyTargets(rootCatalog);
  const mismatches = [];
  issue(mismatches, 'external reference identity', audit.reference, {
    repository: reference.repository, commit: reference.commit, url: reference.url,
    manifestSha256: reference.manifestSha256,
    extractedMetadataSha256,
  });
  assert.equal(reference.repository, 'ashemag/human-atlas');
  assert.equal(reference.commit, '1c38bf35c254a891200d3cedecfd57abebe83d8d');
  assert.equal(reference.manifestSha256, 'c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee');
  assert.equal(reference.parts.length, 2234);
  assert.equal(new Set(reference.parts.map(row => row[0])).size, 2234);

  const actualEvidence = {
    ...h.evidence,
    crossTreeProofSha256: hash(source.read('docs/reference-cross-tree-audit.json')),
    supplementalSourceHoldEvidence: h.supplementalEvidence,
    currentRootSha256: hash(JSON.stringify(rootCatalog)),
    reachableNestedSha256: hash(JSON.stringify(nested)),
    shoulderManifestSha256: hash(source.read('public/models/bodyparts3d/manifest.json')),
    sourceIdSetSha256: hash(JSON.stringify(reference.parts.map(row => row[0]).sort())),
  };
  issue(mismatches, 'recorded dependency evidence', audit.evidence, actualEvidence);
  issue(mismatches, 'inventory catalogue', inventory.catalogSha256, hash(source.read('public/models/bodyparts3d/full-body/catalog.json').toString().replace(/\r\n/g, '\n')));
  issue(mismatches, 'hold policy hash', audit.evidence.holdsSha256, hash(JSON.stringify(inventoryHolds)));
  for (const table of inventory.tables) issue(mismatches, 'table ' + table.path, table.sha256, hash(source.read(table.path)));
  for (const row of cross.sources) {
    const asset = inventory.assets.find(a => a.tree === row.tree && a.file === row.file);
    issue(mismatches, 'cross tree size ' + row.tree + '/' + row.file, row.bytes, asset?.bytes);
    if (asset?.sha256) issue(mismatches, 'cross tree hash ' + row.tree + '/' + row.file, row.sha256, asset.sha256);
    if (asset?.geometrySha256) issue(mismatches, 'cross tree geometry hash ' + row.tree + '/' + row.file, row.geometrySha256, asset.geometrySha256);
  }
  assert.equal(cross.sources.length, 14);
  assert.equal(shoulder.version, '4.0');
  assert.equal(shoulder.license, 'CC-BY-4.0');
  const assets = structuredClone(inventory.assets);
  for (const row of cross.sources) Object.assign(assets.find(a => a.tree === row.tree && a.file === row.file), { sha256: row.sha256, geometrySha256: row.geometrySha256 });
  const owners = [];
  const add = (s, scope) => { for (const item of s.sources) owners.push({ scope, id: s.id, tree: s.sourceTree, file: item.file, sha256: item.sha256 }); };
  rootCatalog.structures.forEach(s => add(s, 'root'));
  nested.forEach(t => add(t.structure, 'nested'));
  shoulder.parts.forEach(p => owners.push({ scope: 'shoulder', id: p.structureId, tree: 'isa', file: p.sourceFile.replace(/\.obj$/, ''), sha256: p.sourceSha256 }));
  const corrections = [eyeDisplayCorrection, pancreasDisplayCorrection].flatMap(c => c.original.sources.filter(old => !c.replacement.sources.some(s => s.file === old.file && s.sha256 === old.sha256)).map(s => s.file));
  const oldDifference = new Map(audit.rootDifferences.map(r => [r.file, r]));
  const heldExtra = h.supplemental.flatMap(s => s.files.map(f => f.file));
  const rows = [];
  for (const [file, group] of reference.parts) {
    const asset = assets.find(a => a.tree === 'isa' && a.file === file);
    if (!asset) { rows.push({ file, group, category: 'genuine-absent-source-file', status: 'absent-from-current-pinned-inventory' }); continue; }
    const matchingOwners = owners.filter(o => o.file === file).map(o => ({ ...o, evidence: sourceBindingEvidence(asset, o, assets) }));
    const holds = [];
    if (heldExtra.includes(file)) holds.push('isa');
    for (const tree of ['isa', 'partof']) for (const record of h.records.filter(r => r.tree === tree && r.files.includes(file))) {
      const screen = h.policy.inspect({ ...record, files: [file] });
      if (screen.directReason || screen.components.some(c => c.heldBy.length)) holds.push(tree);
    }
    const status = sourceCoverageStatus({ owners: matchingOwners, hold: holds.includes('isa'), relatedHold: holds.includes('partof'), excluded: corrections.includes(file) });
    let category;
    if (['root-source-covered', 'nested-source-covered', 'shoulder-source-covered'].includes(status)) category = 'admitted-current-or-reachable-nested';
    else if (['known-source-hold', 'related-cross-tree-hold', 'cross-tree-equivalence-unverified'].includes(status)) category = 'source-condition-or-identity-hold';
    else if (status === 'excluded-by-display-correction') category = 'reviewed-source-difference-or-overlap';
    else category = 'unsupported-no-current-evidence';
    rows.push({ file, group, category, status, scopes: [...new Set(matchingOwners.map(o => o.scope))].sort(), sourcePresentInInventory: true, priorStatus: oldDifference.get(file)?.status ?? 'root-source-covered' });
  }

  const counts = values => Object.fromEntries([...new Set(values)].sort().map(k => [k, values.filter(v => v === k).length]));
  const currentDifferences = rows.filter(r => !r.scopes?.includes('root'));
  const changed = currentDifferences.filter(r => oldDifference.get(r.file)?.status !== r.status).map(r => ({ file: r.file, prior: oldDifference.get(r.file)?.status ?? null, current: r.status }));
  const missingPrior = [...oldDifference.keys()].filter(f => !currentDifferences.some(r => r.file === f));

  // verify() proves exact clean HEAD and the committed and working bytes of all
  // reads/imports; the source input order is stable for output comparison.
  const sourceInputs = source.verify();
  const result = {
    schemaVersion: 1, sourceRevision: source.revision, auditPath: 'docs/reference-coverage-audit.json',
    status: mismatches.length || changed.length || missingPrior.length ? 'partial-or-stale' : 'current-metadata-reconciled',
    reference: { repository: reference.repository, commit: reference.commit, manifestSha256: reference.manifestSha256, extractedMetadataSha256, remoteManifestReverified: false },
    evidence: { sourceInputs, committedSourceInputs: sourceInputs, commitReadback: { revision: source.revision, gitReplaceObjectsDisabled: true, matchedInputs: Object.keys(sourceInputs).length }, recordedDependencyMismatches: mismatches, originalObjBytesReverified: false },
    counts: { referenceFiles: rows.length, rootSelections: rootCatalog.structures.length, reachableNestedSelections: nested.length, shoulderBindings: shoulder.parts.length, currentRootDifferences: currentDifferences.length, categories: counts(rows.map(r => r.category)), currentDifferenceCategories: counts(currentDifferences.map(r => r.category)), currentStatuses: counts(rows.map(r => r.status)) },
    differencesAgainstRecordedAudit: { changedStatuses: changed, priorRowsNoLongerRootDifferences: missingPrior },
    backlog: currentDifferences,
    limits: ['Metadata and source bindings only; original OBJ bytes and remote manifest were not fetched or reverified.', 'Source-file IDs, selection records, meshes and unique anatomy are distinct units.', 'No admission or clinical sign-off follows from this classification.'],
  };
  assert.deepEqual(source.verify(), sourceInputs, 'Source inputs changed before output');
  await writeCoverageOutput(args, result);
  assert.deepEqual(source.verify(), sourceInputs, 'Source inputs changed after output');
  console.log(JSON.stringify({ output: args.output, status: result.status, counts: result.counts, commitMatchedInputs: Object.keys(sourceInputs).length, mismatches: mismatches.length, changed: changed.length, missingPrior: missingPrior.length }));
} finally {
  source.close();
}
