import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { build } from './workspace-test-build.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceObjShape, mergeSourceShapes, sourceBoundsNear, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { candidateContact, componentEndBands, distanceSummary, spatialDistanceIndex } from './source-spatial-math.mjs';

export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const candidates = [
  { tree: 'isa', id: 'FMA50088', name: 'right anterior choroidal artery', file: 'FJ1658', sha256: '19a51b68f4f0f58bb86302bbf3d8eb39f26158e2f7d5cd752f85b3adf94eddaf', side: 'right', role: 'parent' },
  { tree: 'isa', id: 'FMA50089', name: 'left anterior choroidal artery', file: 'FJ1658M', sha256: '14087bbb463ac93b83165ac19c577188f0c4b07f89bed60e42a1197041ca7342', side: 'left', role: 'parent' },
  { tree: 'isa', id: 'FMA50146', name: 'branch of right anterior choroidal artery to posterior limb of right internal capsule', file: 'FJ1674', side: 'right', role: 'branch' },
  { tree: 'isa', id: 'FMA50147', name: 'branch of left anterior choroidal artery to posterior limb of left internal capsule', file: 'FJ1674M', side: 'left', role: 'branch' },
];
const key = ({ tree, file }) => `${tree}/${file}`;
const bounds = (shape) => ({ min: shape.min, max: shape.max });
const exactTriangles = (a, b) => {
  const target = sourceTriangleSet(b);
  return [...sourceTriangleSet(a)].filter((face) => target.has(face)).length;
};

export function validateScope({ context, catalog, prep }) {
  assert.deepEqual(prep.evidence, context.evidence, 'Source preparation evidence is stale');
  assert.equal(catalog.structures.length, 1104, 'Current display catalog scope changed');
  assert.equal(new Set(catalog.structures.map((s) => s.id)).size, 1104, 'Duplicate display IDs');
  for (const candidate of candidates) {
    const definition = context.records.find((r) => r.tree === candidate.tree && r.id === candidate.id);
    assert(definition, `Missing official definition ${candidate.id}`);
    assert.equal(definition.name, candidate.name, `Official name changed ${candidate.id}`);
    assert.deepEqual(definition.files, [candidate.file], `Official file membership changed ${candidate.id}`);
    assert.equal(context.inventory.records.find((r) => r.tree === candidate.tree && r.id === candidate.id)?.status, 'unused-available', `Source inventory status changed ${candidate.id}`);
    context.policy.assertNoKnownHolds([definition]);
  }
  assert.equal(prep.summary.heldFiles, 48, 'Preparatory held-file scope changed');
  assert.equal(prep.files.filter((f) => f.heldBy.length).length, 48, 'Preparatory held-file rows changed');
  for (const candidate of candidates.filter((c) => c.role === 'branch')) {
    const row = prep.files.find((f) => f.tree === candidate.tree && f.file === candidate.file);
    assert(row, `Missing pinned branch source ${candidate.file}`);
    assert.deepEqual(row.candidateFor, [candidate.id]);
    if (candidate.sha256) assert.equal(row.sha256, candidate.sha256);
  }
}

export async function currentInputs() {
  const context = await loadCurrentSourceHolds();
  const prepBytes = await readFile('content/source-geometry-screen.json');
  assert.equal(hash(prepBytes), '80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7', 'Preparatory source evidence changed');
  const prep = JSON.parse(prepBytes);
  const compiled = await build({ stdin: { contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  const { bodyDisplayCatalog } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const catalog = bodyDisplayCatalog(context.catalog);
  validateScope({ context, catalog, prep });
  return { context, catalog, prep, prepSha256: hash(prepBytes) };
}

export async function anteriorChoroidalSourceReport({ context, catalog, prep, prepSha256, readSource = (tree, file) => readFile(`../work/bodyparts3d/${tree}/${file}.obj`) }) {
  validateScope({ context, catalog, prep });
  const sourceCache = new Map();
  async function load(tree, file, expectedSha) {
    const source = `${tree}/${file}`;
    if (!sourceCache.has(source)) {
      assert.match(expectedSha, /^[a-f0-9]{64}$/, `Missing source pin ${source}`);
      let bytes;
      try { bytes = await readSource(tree, file); }
      catch (error) { throw new Error(`Missing verified source cache ${source}: ${error.message}`); }
      assert.equal(hash(bytes), expectedSha, `Source SHA changed ${source}`);
      sourceCache.set(source, { sha256: expectedSha, shape: sourceObjShape(bytes), geometrySha256: geometryFingerprint(bytes) });
    }
    assert.equal(sourceCache.get(source).sha256, expectedSha, `Conflicting source pin ${source}`);
    return sourceCache.get(source);
  }
  const pinned = candidates.map((c) => ({ ...c, sha256: c.sha256 ?? prep.files.find((f) => key(f) === key(c))?.sha256 }));
  const assessed = [];
  for (const candidate of pinned) {
    const { shape, geometrySha256 } = await load(candidate.tree, candidate.file, candidate.sha256);
    const inventoryAsset = context.inventory.assets.find((a) => key(a) === key(candidate));
    assert(inventoryAsset, `Missing inventory asset ${key(candidate)}`);
    if (inventoryAsset.sha256) assert.equal(inventoryAsset.sha256, candidate.sha256);
    if (inventoryAsset.geometrySha256) assert.equal(inventoryAsset.geometrySha256, geometrySha256);
    const directOwners = catalog.structures.filter((s) => s.sourceTree === candidate.tree && s.sources.some((f) => f.file === candidate.file)).map((s) => s.id);
    const exactShapeOwners = context.inventory.assets.filter((a) => a.geometrySha256 === geometrySha256 && a.representedBy?.length).map((a) => ({ tree: a.tree, file: a.file, representedBy: a.representedBy }));
    const topology = sourceTopology(shape);
    assert(topology.closedOrientedManifold && topology.components.length === 1, `Unexpected source topology ${candidate.id}`);
    assert.equal(topology.triangles, candidate.role === 'parent' ? 418 : 346, `Unexpected source triangles ${candidate.id}`);
    const sideEvidence = { negativeXVertices: shape.vertices.filter((v) => v[0] < 0).length, zeroXVertices: shape.vertices.filter((v) => v[0] === 0).length, positiveXVertices: shape.vertices.filter((v) => v[0] > 0).length };
    assert.equal(sideEvidence.zeroXVertices, 0, `Midline source vertices ${candidate.id}`);
    assert.equal(candidate.side === 'right' ? sideEvidence.positiveXVertices : sideEvidence.negativeXVertices, 0, `Unexpected source-X side ${candidate.id}`);
    assessed.push({ ...candidate, geometrySha256, shape, topology, bounds: bounds(shape), sideEvidence, directOwners, exactShapeOwners, hold: context.policy.inspect(context.records.find((r) => r.tree === candidate.tree && r.id === candidate.id)) });
  }
  const prepHeld = prep.files.filter((f) => f.heldBy.length).map((f) => ({ tree: f.tree, file: f.file, sha256: f.sha256, heldBy: f.heldBy, bounds: f.bounds }));
  const heldMap = new Map(prepHeld.map((f) => [key(f), f]));
  for (const hold of context.supplemental) for (const f of hold.files) {
    const source = { tree: hold.tree, file: f.file, sha256: f.sha256 };
    const prior = heldMap.get(key(source));
    if (prior) { assert.equal(prior.sha256, source.sha256, `Held source pin conflicts ${key(source)}`); prior.heldBy = [...new Set([...prior.heldBy, hold.id])].sort(); }
    else heldMap.set(key(source), { ...source, heldBy: [hold.id], bounds: null });
  }
  const held = [...heldMap.values()];
  for (const item of held) if (!item.bounds) item.bounds = bounds((await load(item.tree, item.file, item.sha256)).shape);
  const marginMm = 2.01;
  const inverse = new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor).invert();
  const arteryEndBandControls = new Set(['FMA3949', 'FMA4062', 'FMA50085', 'FMA50086']);
  const explicit = catalog.structures.filter((s) => arteryEndBandControls.has(s.fmaId) || /^(right|left) (anterior|middle|posterior) cerebral artery$/i.test(s.sourceName));
  assert(explicit.some((s) => s.fmaId === 'FMA3949') && explicit.some((s) => s.fmaId === 'FMA4062'), 'Missing bilateral ICA controls');
  assert(explicit.some((s) => s.fmaId === 'FMA50085') && explicit.some((s) => s.fmaId === 'FMA50086'), 'Missing bilateral posterior communicating artery controls');
  assert(explicit.some((s) => /right .* cerebral artery/i.test(s.sourceName)) && explicit.some((s) => /left .* cerebral artery/i.test(s.sourceName)), 'Missing bilateral cerebral arterial controls');
  const explicitIds = new Set(explicit.map((s) => s.id));
  const displayedScreen = [], targets = [];
  for (const owner of catalog.structures) {
    const box = new Box3(new Vector3(...owner.bounds.min), new Vector3(...owner.bounds.max)).applyMatrix4(inverse);
    const sourceBounds = { min: box.min.toArray(), max: box.max.toArray() };
    const near = assessed.filter((c) => sourceBoundsNear(c.bounds, sourceBounds, marginMm)).map((c) => c.id);
    const selected = near.length || explicitIds.has(owner.id);
    displayedScreen.push({ id: owner.id, recordSha256: hash(JSON.stringify(owner)), nearCandidateIds: near, explicitControl: explicitIds.has(owner.id) });
    if (selected) targets.push({ id: owner.id, fmaId: owner.fmaId, name: owner.sourceName, role: explicitIds.has(owner.id) ? 'displayed-explicit-control' : 'displayed-near', tree: owner.sourceTree, sources: owner.sources, near });
  }
  const heldScreen = held.map((f) => ({ tree: f.tree, file: f.file, sha256: f.sha256, heldBy: f.heldBy, nearCandidateIds: assessed.filter((c) => sourceBoundsNear(c.bounds, f.bounds, marginMm)).map((c) => c.id) }));
  for (const item of held.filter((f) => heldScreen.find((s) => key(s) === key(f)).nearCandidateIds.length)) targets.push({ id: `held/${key(item)}`, fmaId: null, name: item.file, role: 'held-near', tree: item.tree, sources: [{ file: item.file, sha256: item.sha256 }], near: heldScreen.find((s) => key(s) === key(item)).nearCandidateIds });
  const comparisons = [], endBandProbes = [];
  for (const target of targets) {
    const shapes = [];
    for (const source of target.sources) shapes.push((await load(target.tree, source.file, source.sha256)).shape);
    // Existing display definitions with multiple source members preserve their complete source geometry.
    const shape = mergeSourceShapes(shapes);
    const targetIndex = spatialDistanceIndex(shape);
    for (const candidate of assessed.filter((c) => target.near.includes(c.id) || target.role === 'displayed-explicit-control')) {
      const contact = candidateContact(candidate.shape, shape, targetIndex);
      const substantialNearContact = [contact.candidateVertices, contact.candidateTriangleCentroids, contact.targetVertexSamples].some((summary) => summary.thresholds.find((threshold) => threshold.mm === 0.25).weightedFraction >= 0.25);
      comparisons.push({ candidate: candidate.id, target: target.id, fmaId: target.fmaId, name: target.name, role: target.role, boundsNear: sourceBoundsNear(candidate.bounds, bounds(shape), marginMm), exactSharedTriangles: exactTriangles(candidate.shape, shape), substantialNearContact, ...contact });
      if (target.role === 'displayed-explicit-control' && arteryEndBandControls.has(target.fmaId))
        endBandProbes.push({ candidate: candidate.id, candidateSide: candidate.side, target: target.id, targetFmaId: target.fmaId, targetName: target.name, targetSide: target.name.startsWith('right ') ? 'right' : 'left', components: componentEndBands(candidate.shape).map(({ low, high, ...component }) => ({ ...component, low: distanceSummary(low, targetIndex), high: distanceSummary(high, targetIndex) })) });
    }
  }
  const pairComparisons = [];
  for (const parent of assessed.filter((c) => c.role === 'parent')) for (const branch of assessed.filter((c) => c.role === 'branch')) {
    const parentIndex = spatialDistanceIndex(parent.shape), branchIndex = spatialDistanceIndex(branch.shape);
    pairComparisons.push({ parent: parent.id, branch: branch.id, sidesMatch: parent.side === branch.side, exactSharedTriangles: exactTriangles(parent.shape, branch.shape), parentToBranch: candidateContact(parent.shape, branch.shape, branchIndex), branchToParent: candidateContact(branch.shape, parent.shape, parentIndex), parentEndBandsToBranch: componentEndBands(parent.shape).map(({ low, high, ...component }) => ({ ...component, low: distanceSummary(low, branchIndex), high: distanceSummary(high, branchIndex) })), branchEndBandsToParent: componentEndBands(branch.shape).map(({ low, high, ...component }) => ({ ...component, low: distanceSummary(low, parentIndex), high: distanceSummary(high, parentIndex) })) });
  }
  const substantialNearContacts = comparisons.filter((c) => c.substantialNearContact).map((c) => ({ candidate: c.candidate, target: c.target, targetName: c.name, role: c.role, candidateVertexFractionWithinQuarterMm: c.candidateVertices.thresholds.find((t) => t.mm === 0.25).weightedFraction, candidateCentroidFractionWithinQuarterMm: c.candidateTriangleCentroids.thresholds.find((t) => t.mm === 0.25).weightedFraction, targetSampleFractionWithinQuarterMm: c.targetVertexSamples.thresholds.find((t) => t.mm === 0.25).weightedFraction, interpretation: 'Unsigned sampled proximity requiring source/anatomical review; neither contact proof nor clearance.' }));
  return {
    schemaVersion: 1, purpose: 'source-only-anterior-choroidal-admission-audit', evidence: context.evidence, supplementalEvidence: context.supplementalEvidence,
    preparationSha256: prepSha256, currentDisplaySha256: hash(JSON.stringify(catalog)), currentDisplayDefinitions: catalog.structures.length,
    algorithmSha256: hash((await readFile(new URL('./source-spatial-math.mjs', import.meta.url), 'utf8')).replaceAll('\r\n', '\n')),
    topologyAlgorithmSha256: hash((await readFile(new URL('./source-topology.mjs', import.meta.url), 'utf8')).replaceAll('\r\n', '\n')),
    reportGeneratorSha256: hash((await readFile(new URL(import.meta.url), 'utf8')).replaceAll('\r\n', '\n')),
    license: context.inventory.license, credit: context.inventory.credit, licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html', coordinateSystem: catalog.coordinateSystem,
    marginMm, summary: { candidateDefinitions: assessed.length, displayedDefinitionsScreened: displayedScreen.length, heldFilesBoundsScreened: heldScreen.length, displayedControlsLoaded: targets.filter((t) => t.role.startsWith('displayed')).length, heldControlsLoaded: targets.filter((t) => t.role === 'held-near').length, comparisons: comparisons.length, substantialNearContactPairs: substantialNearContacts.length, arterialControlEndBandProbes: endBandProbes.length, parentBranchPairs: pairComparisons.length, admissions: 0 },
    candidates: assessed.map(({ shape, ...row }) => row), displayedScreen, heldScreen, comparisons, substantialNearContacts, endBandProbes, pairComparisons,
    exclusions: ['No source geometry is repaired, moved, reflected, split, relabelled, exported or admitted.', 'No CT-head masks or boundaries, clinical PACS, patient scan, identifier or uncleared derivative is read or written.', 'No runtime display, selection, teaching, entitlement or deployment change.'],
    limitations: ['Original source-coordinate vertex and triangle-centroid distances are unsigned quadrature diagnostics. They do not prove surface intersection, vascular continuity, patent lumen, branch territory, source anatomy or clinical accuracy.', 'A substantial-near-contact flag means at least 25% of one sampled direction is within 0.25 mm; it is a review trigger, not contact proof or clearance. Left parent artery versus displayed choroid plexus is flagged and remains anatomically uncertain.', 'Exact triangles require exact coordinate equality; exact geometry fingerprints preserve ordering and do not detect translated, reflected, reindexed or near-coincident shapes.', 'Scene bounds are conservatively inverted for displayed screening; raw held bounds are screened at 2.01 mm. Far geometry is not distance-loaded except explicit bilateral arterial controls.', 'End bands are geometric extrema on the longest component axis, at most 1 mm wide, and are not anatomical terminals.', 'No radiologist sign-off exists for this source revision; source audit is not clinical validation.'],
    sourceGeometryChanged: false, admissions: 0, clinicalValidation: false,
  };
}

export async function assertCurrentReportPins(report, { context, catalog, prepSha256 }) {
  assert.deepEqual(report.evidence, context.evidence, 'Source evidence changed');
  assert.deepEqual(report.supplementalEvidence, context.supplementalEvidence, 'Current source holds changed');
  assert.equal(report.preparationSha256, prepSha256, 'Source preparation changed');
  assert.equal(report.currentDisplaySha256, hash(JSON.stringify(catalog)), 'Current display catalog changed');
  for (const [field, file] of [
    ['algorithmSha256', './source-spatial-math.mjs'],
    ['topologyAlgorithmSha256', './source-topology.mjs'],
    ['reportGeneratorSha256', import.meta.url],
  ]) assert.equal(report[field], hash((await readFile(new URL(file, import.meta.url), 'utf8')).replaceAll('\r\n', '\n')), `${field} changed`);
}
