import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { anteriorChoroidalSourceReport, assertCurrentReportPins, currentInputs, validateScope, candidates, hash } from './anterior-choroidal-source-report.mjs';

const inputs = await currentInputs();
const report = JSON.parse(await readFile('content/anterior-choroidal-source-audit.json'));

test('current source-only report covers the exact four identities and both pair directions', () => {
  assert.deepEqual(report.candidates.map((c) => c.id), candidates.map((c) => c.id));
  assert.deepEqual(report.evidence, inputs.context.evidence);
  assert.deepEqual(report.supplementalEvidence, inputs.context.supplementalEvidence);
  assert.equal(report.preparationSha256, inputs.prepSha256);
  assert.equal(report.currentDisplaySha256, hash(JSON.stringify(inputs.catalog)));
  assert.deepEqual(report.candidates.map((c) => c.sha256), candidates.map((c) => c.sha256 ?? inputs.prep.files.find((f) => f.file === c.file).sha256));
  assert.equal(report.summary.displayedDefinitionsScreened, 1104);
  assert.equal(report.displayedScreen.length, 1104);
  assert.equal(report.heldScreen.length, report.summary.heldFilesBoundsScreened);
  assert.equal(report.pairComparisons.length, 4);
  assert.equal(report.pairComparisons.filter((p) => p.sidesMatch).length, 2);
  assert.equal(report.pairComparisons.filter((p) => !p.sidesMatch).length, 2);
  assert.equal(report.endBandProbes.length, 16);
  assert.deepEqual(new Set(report.endBandProbes.map((p) => p.candidate)), new Set(candidates.map((c) => c.id)));
  assert.deepEqual(new Set(report.endBandProbes.map((p) => p.targetFmaId)), new Set(['FMA3949', 'FMA4062', 'FMA50085', 'FMA50086']));
  assert(report.endBandProbes.every((p) => p.components.length === 1 && p.components[0].low.samples && p.components[0].high.samples));
  assert(report.comparisons.some((c) => c.fmaId === 'FMA3949'));
  assert(report.comparisons.some((c) => c.fmaId === 'FMA4062'));
  assert(report.comparisons.some((c) => c.role === 'held-near'));
  assert.equal(report.admissions, 0);
  assert.equal(report.clinicalValidation, false);
  assert(report.candidates.every((c) => c.hold.status === 'no-known-source-hold'));
  assert(report.candidates.every((c) => c.topology.closedOrientedManifold && c.topology.components.length === 1));
  assert(report.candidates.every((c) => c.directOwners.length === 0 && c.exactShapeOwners.length === 0));
  assert.equal(report.summary.substantialNearContactPairs, report.substantialNearContacts.length);
  assert(report.substantialNearContacts.some((c) => c.candidate === 'FMA50089' && c.targetName === 'choroid plexus of cerebral hemisphere' && c.candidateVertexFractionWithinQuarterMm > 0.32));
});

test('current catalog and algorithm pins match; same-count catalog edits fail', async () => {
  await assertCurrentReportPins(report, inputs);
  const structures = [...inputs.catalog.structures];
  structures[0] = { ...structures[0], sourceName: structures[0].sourceName + ' tampered' };
  await assert.rejects(assertCurrentReportPins(report, { ...inputs, catalog: { ...inputs.catalog, structures } }), /Current display catalog changed/);
  await assert.rejects(assertCurrentReportPins({ ...report, algorithmSha256: '0'.repeat(64) }, inputs), /algorithmSha256 changed/);
  await assert.rejects(assertCurrentReportPins({ ...report, topologyAlgorithmSha256: '0'.repeat(64) }, inputs), /topologyAlgorithmSha256 changed/);
  await assert.rejects(assertCurrentReportPins({ ...report, reportGeneratorSha256: '0'.repeat(64) }, inputs), /reportGeneratorSha256 changed/);
});

test('tampered source bytes fail closed before geometry use', async () => {
  const readSource = async (tree, file) => Buffer.concat([await readFile(`../work/bodyparts3d/${tree}/${file}.obj`), Buffer.from('x')]);
  await assert.rejects(anteriorChoroidalSourceReport({ ...inputs, readSource }), /Source SHA changed/);
});

test('missing source cache fails with the missing control identity', async () => {
  await assert.rejects(anteriorChoroidalSourceReport({ ...inputs, readSource: async () => { throw Error('ENOENT'); } }), /Missing verified source cache isa\/FJ1658: ENOENT/);
});

test('stale source evidence, catalog and missing or held definitions fail closed', () => {
  assert.throws(() => validateScope({ ...inputs, prep: { ...inputs.prep, evidence: { ...inputs.prep.evidence, sourceVersion: 'stale' } } }), /stale/);
  assert.throws(() => validateScope({ ...inputs, catalog: { ...inputs.catalog, structures: inputs.catalog.structures.slice(1) } }), /scope changed/);
  const missing = { ...inputs.context, records: inputs.context.records.filter((r) => r.id !== 'FMA50088') };
  assert.throws(() => validateScope({ ...inputs, context: missing }), /Missing official definition/);
  const held = { ...inputs.context, policy: { assertNoKnownHolds() { throw Error('Source hold blocks fixture'); } } };
  assert.throws(() => validateScope({ ...inputs, context: held }), /Source hold blocks fixture/);
});
