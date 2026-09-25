import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectCtHandoff, validateCliPaths } from './ct-handoff-preflight.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const codes = ['cth.bst.midbrain', 'cth.bst.pons', 'cth.bst.medulla_oblongata'];
const ids = ['midbrain', 'pons', 'medulla-oblongata'].map(suffix => `vm:anatomy:body:head-neck:midline:organ:${suffix}`);
const bytes = value => Buffer.from(JSON.stringify(value));
const fixture = () => {
  const annotations = Object.fromEntries(codes.map((code, index) => [code, {
    atlas_code: code, status: 'USER_ACCEPTED', approved: true,
    geometry: { type: 'binary_mask', sha256: String(index + 1).repeat(64), complete_regional_segmentation: true, file: '/PRIVATE/scan.nii.gz', affine_ras_mm: [123, 456] },
    provenance: { current_mask_review_status: 'USER_ACCEPTED_BOUNDARY_ONLY', whole_entry_acceptance: { date: '2026-09-25', record_id: `SYNTHETIC-ACCEPT-${index}`, geometry_sha256: String(index + 1).repeat(64), geometry_unchanged: true, smoothing_applied: false }, notes: 'PRIVATE_REVIEW_TEXT' },
    label_anchor: [123, 456, 789],
  }]));
  return {
    annotation: { schema: 'elivion.cth.annotations.draft.v0.2', revision: 'synthetic-r1', release: 'NOT_FOR_PUBLICATION', annotations, source_geometry: '/PRIVATE/reference.nii.gz' },
    catalog: { structures: ids.map((id, index) => ({ id, name: `Private Name ${index}`, anchor: [1, 2, 3], sources: [{ file: `FJ${1738 + index}`, sha256: 'a'.repeat(64) }] })), selectableIds: ids, parent: { path: '/PRIVATE/atlas' } },
  };
};
function run(f = fixture(), stateChange = {}) {
  const annotationBytes = bytes(f.annotation);
  const stateBytes = bytes({ annotation_sha256: digest(annotationBytes), release: 'NOT_FOR_PUBLICATION', annotation_json: '/PRIVATE/annotations.json', case_id: 'PRIVATE_CASE_ID', ...stateChange });
  return inspectCtHandoff(stateBytes, annotationBytes, bytes(f.catalog));
}

test('three fixed advisory candidates bind accepted metadata and catalog sources', () => {
  const report = run();
  assert.deepEqual(report.summary, { candidates: 3, recordedAcceptance: 3, held: 0 });
  assert.deepEqual(report.candidates.map(row => row.atlasCode), codes);
  assert.deepEqual(report.candidates.map(row => row.atlasId), ids);
  assert.ok(report.candidates.every(row => row.status === 'RECORDED_ACCEPTANCE_ONLY' && row.holdReasons.length === 0));
  assert.ok(report.candidates.every(row => row.warnings.includes('LEGACY_BOUNDARY_STATUS_DIFFERS')));
  assert.equal(report.candidates[0].catalogSources[0].sourceId, 'FJ1738');
  assert.equal(report.candidates[0].catalogSources[0].sha256, 'a'.repeat(64));
  assert.equal(report.release, 'NOT_FOR_PUBLICATION');
  assert.deepEqual(report.claims, { acceptance: 'RECORDED_METADATA_ONLY', geometryInspected: false, exactApprovedLink: false, spatialPermission: false, publicationPermission: false, clinicalSignoff: false });
  const serialized = JSON.stringify(report);
  for (const forbidden of ['/PRIVATE', 'PRIVATE_CASE_ID', 'PRIVATE_REVIEW_TEXT', 'Private Name', 'affine', 'anchor', 'registered', 'signedoff']) assert.ok(!serialized.includes(forbidden), forbidden);
});

test('changed annotation bytes, invalid schema/release/revision reject before candidates', () => {
  const f = fixture();
  const a = bytes(f.annotation);
  assert.throws(() => inspectCtHandoff(bytes({ annotation_sha256: 'a'.repeat(64), release: 'NOT_FOR_PUBLICATION' }), a, bytes(f.catalog)), /ANNOTATION_HASH_MISMATCH/);
  for (const mutate of [
    x => { x.annotation.schema = 'wrong'; },
    x => { x.annotation.annotations = []; },
    x => { x.annotation.release = 'PUBLIC'; },
    x => { x.annotation.revision = ''; },
  ]) {
    const other = fixture(); mutate(other);
    assert.throws(() => run(other), /ANNOTATION_SCHEMA_INVALID|RELEASE_STATE_INVALID|ANNOTATION_REVISION_INVALID/);
  }
  assert.throws(() => run(f, { release: 'PUBLIC' }), /RELEASE_STATE_INVALID/);
});

test('every acceptance and geometry mutation holds the affected row', () => {
  const mutations = [
    row => { row.atlas_code = 'cth.bst.other'; },
    row => { row.status = 'IN_PROGRESS_PARTIAL'; },
    row => { row.approved = false; },
    row => { row.geometry.type = 'mesh'; },
    row => { row.geometry.sha256 = 'bad'; },
    row => { row.geometry.complete_regional_segmentation = false; },
    row => { row.provenance.whole_entry_acceptance.geometry_sha256 = 'b'.repeat(64); },
    row => { row.provenance.whole_entry_acceptance.geometry_unchanged = false; },
    row => { row.provenance.whole_entry_acceptance.smoothing_applied = true; },
    row => { row.provenance.whole_entry_acceptance.record_id = ''; },
    row => { row.provenance.whole_entry_acceptance.date = 'bad'; },
    row => { row.provenance.whole_entry_acceptance.date = '2026-02-30'; },
    row => { delete row.provenance.whole_entry_acceptance; },
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f.annotation.annotations[codes[0]]);
    const report = run(f);
    assert.equal(report.candidates[0].status, 'HELD');
    assert.ok(report.candidates[0].holdReasons.length > 0);
    assert.equal(report.summary.held, 1);
  }
  const f = fixture(); delete f.annotation.annotations[codes[0]];
  assert.deepEqual(run(f).candidates[0].holdReasons, ['ANNOTATION_MISSING']);
});

test('catalog missing, duplicate, unknown source, and nonselectable entries hold', () => {
  for (const mutate of [
    c => { c.structures = []; },
    c => { c.structures.push(c.structures[0]); },
    c => { c.structures[0].sources = [{ file: '/PRIVATE/path', sha256: 'a'.repeat(64) }]; },
    c => { c.structures[0].sources.push(c.structures[0].sources[0]); },
    c => { c.selectableIds = []; },
    c => { delete c.structures; },
  ]) {
    const f = fixture(); mutate(f.catalog);
    assert.equal(run(f).candidates[0].status, 'HELD');
  }
});

test('revision, annotation, acceptance and catalog changes alter bindings', () => {
  const original = run();
  assert.match(original.stateSha256, /^[a-f0-9]{64}$/);
  for (const mutate of [
    f => { f.annotation.revision = 'synthetic-r2'; },
    f => { f.annotation.annotations[codes[0]].provenance.whole_entry_acceptance.record_id = 'SYNTHETIC-ACCEPT-NEW'; },
    f => { f.annotation.annotations[codes[0]].geometry.sha256 = 'b'.repeat(64); f.annotation.annotations[codes[0]].provenance.whole_entry_acceptance.geometry_sha256 = 'b'.repeat(64); },
    f => { f.catalog.structures[0].sources[0].sha256 = 'b'.repeat(64); },
  ]) {
    const f = fixture(); mutate(f);
    const changed = run(f);
    assert.notEqual(changed.candidates[0].candidateBindingSha256, original.candidates[0].candidateBindingSha256);
  }
});

test('CLI path policy rejects mask state files and output outside the local handoff directory', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const state = path.join(root, '.local', 'synthetic-state.json');
  const out = path.join(root, '.local', 'ct-handoff', 'synthetic-report.json');
  assert.doesNotThrow(() => validateCliPaths(state, out));
  assert.throws(() => validateCliPaths(path.join(root, 'scan.nii.gz'), out), /STATE_PATH_INVALID/);
  assert.throws(() => validateCliPaths(state, path.join(root, 'public', 'report.json')), /OUTPUT_PATH_INVALID/);
  assert.throws(() => validateCliPaths(state, path.join(root, '.local', 'report.json')), /OUTPUT_PATH_INVALID/);
});
