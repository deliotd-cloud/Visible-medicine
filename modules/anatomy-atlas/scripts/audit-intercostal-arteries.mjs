import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { crc32 } from 'node:zlib';
import { build } from 'esbuild';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceObjShape, mergeSourceShapes, sourceBoundsNear, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { uniqueSourceVertices, spatialDistanceIndex, distanceSummary, candidateContact } from './source-spatial-math.mjs';
import { shapeCandidate, compareTranslatedShape } from './vessel-shape-math.mjs';
import { prepareSourceIntersection, sourceIntersectionPairs } from './source-intersection-checker.mjs';

export const baselineCommit = '6934e7f998cec0e88a7fe552676d1595b333b8a9';
const baselineEvidenceSha256 = 'c32185072d317d7e5f6e07e898901febf9b6f0d40c3f7c86572b22183726ca45';
const baselineRootSha256 = 'a4655f9eb02d8f43cbc972377259c1bfca2080cff559fce40c6eb862cdc69178';
const baselineNestedSha256 = 'b9e2cc4b7e629721f4fb1c338dc94bf337d420af341b98336db5457d490fb192';
export const proposal = Object.freeze([
  { id: 'FMA66242', file: 'FJ1939', bytes: 89654, crc32: 3476756671, sha256: 'a11a93262445e16bae2d4a1bee6ded11c23ab0737b540fd97d270150991e057a', side: 'right', level: 'first', representation: 'BP6139' },
  { id: 'FMA5041', file: 'FJ1950', bytes: 161995, crc32: 3156974199, sha256: '2b6c467538d03278583cd396dd5a86c6964908ca017d26ee0ae635e8a7d5f148', side: 'right', level: 'second', representation: 'BP6135' },
  { id: 'FMA66243', file: 'FJ1973', bytes: 90536, crc32: 3349837645, sha256: '1f4bd8e1281524c80dfc8eede887e71137985e1076d9d4a6de4fef16044142b3', side: 'left', level: 'first', representation: 'BP6138' },
  { id: 'FMA4112', file: 'FJ1974', bytes: 164855, crc32: 1622615631, sha256: 'f8342d545e64702ba5d6cac32751d7b4649d561797ee375fd072f71583b0c295', side: 'left', level: 'second', representation: 'BP6136' },
].map((row) => Object.freeze(row)));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const key = (tree, file) => `${tree}/${file}`;
const bounds = (shape) => ({ min: shape.min, max: shape.max, extent: shape.max.map((n, i) => n - shape.min[i]) });
const sample = (shape) => {
  const points = uniqueSourceVertices(shape);
  const stride = Math.max(1, Math.ceil(points.length / 128));
  return points.filter((_, i) => i % stride === 0);
};

/** Validate the complete current concept and the official pinned archive metadata. */
export function validateProposal(records, inventory, policy, expected = proposal) {
  assert.equal(expected.length, 4, 'Four complete proposals required');
  const definitions = expected.map((p) => {
    const sourceRows = records.filter((r) => r.tree === 'isa' && r.id === p.id);
    const derivedRows = inventory.records.filter((r) => r.tree === 'isa' && r.id === p.id);
    assert.equal(sourceRows.length, 1, `Missing or ambiguous IS-A definition ${p.id}`);
    assert.equal(derivedRows.length, 1, `Missing or ambiguous derived definition ${p.id}`);
    const definition = sourceRows[0], derived = derivedRows[0];
    assert.deepEqual(definition.files, [p.file], `Changed complete definition ${p.id}`);
    assert.equal(definition.name, `${p.side} ${p.level} posterior intercostal artery`, `Changed source name ${p.id}`);
    assert.equal(definition.representation, p.representation, `Changed representation ${p.id}`);
    assert.deepEqual([derived.tree, derived.id, derived.name, derived.representation, derived.files],
      [definition.tree, definition.id, definition.name, definition.representation, definition.files],
      `Derived source identity changed ${p.id}`);
    assert.equal(derived.status, 'unused-available', `Changed source status ${p.id}`);
    assert.equal(derived.displayedId, null, `Source already displayed ${p.id}`);
    assert.equal(derived.heldReason, null, `Source became held ${p.id}`);
    assert.deepEqual(derived.representedBy, [], `Source already represented ${p.id}`);
    assert.deepEqual(derived.unavailable, [], `Source became unavailable ${p.id}`);
    assert.deepEqual(derived.sharedDefinitionWith, [], `Source shares another definition ${p.id}`);
    const pins = inventory.assets.filter((a) => a.tree === 'isa' && a.file === p.file);
    assert.equal(pins.length, 1, `Missing or ambiguous source asset ${p.file}`);
    const pin = pins[0];
    assert(pin?.available, `Unavailable archive entry ${p.file}`);
    assert.equal(pin.bytes, p.bytes, `Changed archive byte pin ${p.file}`);
    assert.equal(pin.crc32, p.crc32, `Changed archive CRC pin ${p.file}`);
    assert.equal(pin.sha256, null, `Unexpected admitted SHA pin ${p.file}`);
    assert.equal(pin.geometrySha256, null, `Unexpected admitted geometry pin ${p.file}`);
    assert.deepEqual(pin.representedBy, [], `Already represented ${p.file}`);
    assert.match(p.sha256, /^[a-f0-9]{64}$/);
    return definition;
  });
  policy.assertNoKnownHolds(definitions);
  return definitions;
}

/** Collect every held component, preserving tree scope and all holding concepts. */
export function heldComponents(records, policy) {
  const held = new Map();
  for (const definition of records.filter((r) => r.files.length)) {
    for (const component of policy.inspect(definition).components) {
      const identity = key(definition.tree, component.file);
      if (!held.has(identity)) held.set(identity, { tree: definition.tree, file: component.file, heldBy: new Set() });
      for (const id of component.heldBy) held.get(identity).heldBy.add(id);
    }
  }
  return [...held.values()].map((h) => ({ ...h, heldBy: [...h.heldBy].sort() }));
}

/** Root plus reachable nested direct ownership; no inference from names or parent bundles. */
export function directOwners(root, nested, tree, file) {
  return [
    ...root.structures.map((structure) => ({ scope: 'root', structure })),
    ...nested.map((target) => ({ scope: 'nested', structure: target.structure, study: target.study, parentId: target.parentId })),
  ].filter(({ structure }) => structure.sourceTree === tree && structure.sources.some((s) => s.file === file))
    .map(({ scope, structure, study, parentId }) => ({ scope, id: structure.id, fmaId: structure.fmaId, study: study ?? null, parentId: parentId ?? null }));
}

export function screenCandidates(candidateGroups, targets, marginMm = 1.01) {
  return targets.map((target) => ({
    target,
    candidates: candidateGroups.filter((candidate) =>
      candidate.id !== target.fmaId &&
      (sourceBoundsNear(candidate.sourceBounds, target.sourceBounds, marginMm) ||
        (target.system === 'vessels' && shapeCandidate(candidate.sourceBounds, target.sourceBounds))),
    ),
  }));
}

async function run() {
  const args = process.argv.slice(2);
  assert(args.every((a) => a === '--check'), 'Only --check is supported');
  execFileSync('git', ['merge-base', '--is-ancestor', baselineCommit, 'HEAD']);
  const loaded = await loadCurrentSourceHolds();
  const { records, inventory, policy, evidence, supplementalEvidence, catalog: raw } = loaded;
  assert.equal(hash(JSON.stringify({ evidence, supplementalEvidence })), baselineEvidenceSha256,
    'Pinned source and current-hold evidence changed');
  const definitions = validateProposal(records, inventory, policy);
  const compiled = await build({
    stdin: {
      contents: "export { bodyDisplayCatalog } from './lib/body-display-catalog'; export { nestedStudyTargets } from './lib/nested-anatomy';",
      resolveDir: process.cwd(), loader: 'ts',
    }, bundle: true, write: false, platform: 'node', format: 'esm',
  });
  const module = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const root = module.bodyDisplayCatalog(raw);
  assert.deepEqual(root.coordinateSystem, raw.coordinateSystem, 'Source coordinate frame changed');
  assert.equal(root.license, raw.license, 'Source licence changed');
  assert.equal(root.credit, raw.credit, 'Source attribution changed');
  assert.equal(root.structures.length, 1104, 'Changed root selection baseline');
  const nested = module.nestedStudyTargets(root);
  assert.equal(hash(JSON.stringify(root.structures)), baselineRootSha256, 'Root selection source changed');
  assert.equal(hash(JSON.stringify(nested)), baselineNestedSha256, 'Nested selection source changed');
  const shapeCache = new Map();
  async function source(tree, file, expectedSha = null) {
    const identity = key(tree, file);
    if (!shapeCache.has(identity)) {
      const pin = inventory.assets.find((a) => a.tree === tree && a.file === file);
      assert(pin?.available, `Missing inventory pin ${identity}`);
      const bytes = await readFile(`../work/bodyparts3d/${identity}.obj`);
      assert.equal(bytes.length, pin.bytes, `Source size mismatch ${identity}`);
      assert.equal(crc32(bytes), pin.crc32, `Source CRC mismatch ${identity}`);
      const sha256 = hash(bytes), geometrySha256 = geometryFingerprint(bytes);
      if (pin.sha256) assert.equal(sha256, pin.sha256, `Inventory SHA mismatch ${identity}`);
      if (pin.geometrySha256) assert.equal(geometrySha256, pin.geometrySha256, `Inventory geometry mismatch ${identity}`);
      shapeCache.set(identity, { bytes, sha256, geometrySha256, shape: sourceObjShape(bytes) });
    }
    const row = shapeCache.get(identity);
    if (expectedSha) assert.equal(row.sha256, expectedSha, `Owner SHA mismatch ${identity}`);
    return row;
  }
  const groups = [];
  const proposalIntersections = new Map();
  for (const [i, p] of proposal.entries()) {
    const original = await source('isa', p.file, p.sha256);
    assert.equal(original.bytes.length, p.bytes);
    assert.equal(crc32(original.bytes), p.crc32);
    const geometry = original.shape;
    const intersectionHandle = prepareSourceIntersection(geometry);
    proposalIntersections.set(p.id, intersectionHandle);
    groups.push({
      id: p.id, name: definitions[i].name, file: p.file, side: p.side, level: p.level,
      definition: definitions[i], partOfDefinition: records.find((r) => r.tree === 'partof' && r.id === p.id) ?? null,
      bytes: original.bytes.length, crc32: p.crc32, sha256: original.sha256, geometrySha256: original.geometrySha256,
      sourceBounds: bounds(geometry), topology: sourceTopology(geometry),
      selfIntersection: sourceIntersectionPairs(intersectionHandle, intersectionHandle, { self: true }),
      laterality: { negativeX: geometry.vertices.filter((v) => v[0] < 0).length,
        positiveX: geometry.vertices.filter((v) => v[0] > 0).length,
        zeroX: geometry.vertices.filter((v) => v[0] === 0).length,
        consistent: geometry.vertices.every((v) => p.side === 'right' ? v[0] < 0 : v[0] > 0) },
      directOwners: directOwners(root, nested, 'isa', p.file),
      exactInventoryMatches: inventory.assets.filter((a) => a.geometrySha256 === original.geometrySha256 && a.representedBy.length)
        .map((a) => ({ tree: a.tree, file: a.file, representedBy: a.representedBy })),
      holdScreen: policy.inspect(definitions[i]), admissionApproved: false,
    });
  }
  const inverse = new Matrix4().fromArray(root.coordinateSystem.sourceToSceneColumnMajor).invert();
  const existing = [
    ...root.structures.map((s) => ({ scope: 'root', structure: s })),
    ...nested.map((t) => ({ scope: 'nested', structure: t.structure, study: t.study, parentId: t.parentId, sourceHash: t.sourceHash })),
  ].map(({ scope, structure: s, study, parentId, sourceHash }) => {
    const box = new Box3(new Vector3(...s.bounds.min), new Vector3(...s.bounds.max)).applyMatrix4(inverse);
    return { id: s.id, fmaId: s.fmaId, system: s.system, sourceTree: s.sourceTree, sources: s.sources,
      targetKind: scope, study: study ?? null, parentId: parentId ?? null, sourceHash: sourceHash ?? null,
      sourceBounds: bounds({ min: box.min.toArray(), max: box.max.toArray() }) };
  });
  const held = heldComponents(records, policy);
  const heldTargets = [];
  for (const h of held) {
    const heldPins = [...new Set(loaded.supplemental.filter((s) => s.tree === h.tree)
      .flatMap((s) => s.files).filter((s) => s.file === h.file).map((s) => s.sha256))];
    assert(heldPins.length <= 1, `Conflicting current held-source hashes ${key(h.tree, h.file)}`);
    const original = await source(h.tree, h.file, heldPins[0] ?? null);
    heldTargets.push({ id: `held:${key(h.tree, h.file)}`, fmaId: null, targetKind: 'held',
      sourceTree: h.tree, sources: [{ file: h.file, sha256: original.sha256 }],
      system: 'vessels', heldBy: h.heldBy, sourceBounds: bounds(original.shape) });
  }
  const candidateTargets = groups.map((g) => ({ id: g.id, fmaId: g.id, targetKind: 'proposal',
    sourceTree: 'isa', sources: [{ file: g.file, sha256: g.sha256 }], system: 'vessels', sourceBounds: g.sourceBounds }));
  const screens = screenCandidates(groups, [...existing, ...heldTargets, ...candidateTargets]);
  const screened = [], comparisons = [];
  for (const { target, candidates } of screens) {
    screened.push({ id: target.id, targetKind: target.targetKind, sourceTree: target.sourceTree,
      sourceBounds: target.sourceBounds, recordSha256: hash(JSON.stringify(target)),
      candidateIds: candidates.map((g) => g.id) });
    if (!candidates.length) continue;
    const reference = mergeSourceShapes(await Promise.all(target.sources.map(async (s) =>
      (await source(target.sourceTree, s.file, s.sha256)).shape)));
    const referenceIndex = spatialDistanceIndex(reference);
    const referenceTriangles = sourceTriangleSet(reference);
    const referenceIntersection = prepareSourceIntersection(reference);
    for (const g of candidates) {
      const candidate = (await source('isa', g.file, g.sha256)).shape;
      comparisons.push({ candidate: g.id, reference: target.id, referenceFma: target.fmaId,
        targetKind: target.targetKind, referenceTree: target.sourceTree, referenceSources: target.sources,
        exactSharedTriangles: [...sourceTriangleSet(candidate)].filter((triangle) => referenceTriangles.has(triangle)).length,
        candidateToReference: distanceSummary(sample(candidate), referenceIndex),
        referenceToCandidate: distanceSummary(sample(reference), spatialDistanceIndex(candidate)),
        candidateContact: candidateContact(candidate, reference, referenceIndex),
        surfaceIntersection: sourceIntersectionPairs(proposalIntersections.get(g.id), referenceIntersection),
        translatedDiagnostic: target.system === 'vessels' && shapeCandidate(bounds(candidate), bounds(reference))
          ? compareTranslatedShape(candidate, reference) : null });
    }
    referenceIntersection.geometry.dispose();
  }
  for (const handle of proposalIntersections.values()) handle.geometry.dispose();
  const result = { schemaVersion: 1, baselineSourceCommit: baselineCommit,
    sourceArchive: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
    licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    license: root.license, credit: root.credit, coordinateSystem: root.coordinateSystem,
    evidence, supplementalEvidence, groups, rootSelectionCount: root.structures.length,
    nestedSelectionCount: nested.length, heldComponentCount: heldTargets.length,
    screened, comparisons, geometryModified: false, admissionApproved: false, clinicalApproval: false,
    limitations: [
      'Complete official IS-A definitions and cached original archive components only; no source geometry was edited.',
      'CRC, size, SHA, geometry fingerprints, topology and bounded unsigned surface distances are diagnostic evidence, not anatomical or clinical approval.',
      'Scene envelopes are converted to source coordinates for broad screening; each compared mesh uses exact cached source faces. Proximity does not prove vessel identity, lumen continuity or a surgical plane.',
      'Contact diagnostics include every unique candidate vertex and area-weighted triangle centroid, but only bounded reference samples. Unsigned distances are not a continuous intersection or containment test.',
      'Separate floating-point triangle predicates record non-adjacent self and screened pair intersections/touches with original source face IDs. They exclude degenerate faces explicitly and cannot certify containment, lumen continuity or anatomical correctness.',
      'No fitting, mirroring, trimming, bridge, source repair, admission or patient-space registration is performed.',
    ] };
  const output = JSON.stringify(result, null, 2) + '\n';
  const path = 'docs/intercostal-artery-source-audit.json';
  if (args.includes('--check')) assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output,
    'Audit evidence differs from current source');
  else await writeFile(path, output, { flag: 'wx' });
  console.log(JSON.stringify({ auditSha256: hash(output), groups: groups.length,
    roots: root.structures.length, nested: nested.length, held: heldTargets.length,
    screened: screened.length, comparisons: comparisons.length,
    identityFlags: comparisons.filter((c) => c.exactSharedTriangles || c.translatedDiagnostic?.similar).length,
    intersectionComparisons: comparisons.filter((c) => c.surfaceIntersection.count).length,
    selfIntersectionPairs: groups.reduce((n, g) => n + g.selfIntersection.count, 0),
    incompleteIntersectionComparisons: comparisons.filter((c) => c.surfaceIntersection.degeneracy.predicateIncomplete).length }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
