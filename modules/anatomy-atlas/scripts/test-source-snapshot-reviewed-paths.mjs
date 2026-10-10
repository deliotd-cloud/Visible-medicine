import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ReviewedPathPolicyError,
  compileReviewedPathPolicy,
  reviewedPolicySourceCommit,
  reviewedPathRecord,
  reviewedDirectoryAllowed,
  verifyReviewedPathIdentity,
} from './source-snapshot-reviewed-paths.mjs';

const COMMIT = 'a'.repeat(40);
const SHA = 'b'.repeat(64);
const BLOB = 'c'.repeat(40);
const PROOF = 'd'.repeat(64);
const paths = [
  ['app/regions/[region]/page.tsx', 'framework-region-route'],
  ['app/scene-recovery.tsx', 'renderer-recovery-code'],
  ['app/scene-recovery.css', 'renderer-recovery-code'],
];
const record = ([path, purpose]) => ({
  path, role: 'code', purpose, sha256: SHA, gitBlob: BLOB, bytes: 42,
  proof: {id: 'source-name-review', revision: 'r1', sha256: PROOF},
});
const envelope = (selected = paths) => ({
  schema: 'vm-reviewed-source-names/1', sourceCommit: COMMIT,
  records: selected.map(record),
});
const compile = value => compileReviewedPathPolicy(value, COMMIT);
const rejects = (run, code) => assert.throws(run, error =>
  error instanceof ReviewedPathPolicyError && error.code === code);

test('compiles only the three reviewed names into an opaque, immutable token', () => {
  const input = envelope();
  const token = compile(input);
  assert.equal(Object.isFrozen(token), true);
  assert.deepEqual(Reflect.ownKeys(token), []);
  assert.equal(reviewedPolicySourceCommit(token), COMMIT);
  for (const [path, purpose] of paths) {
    const copy = reviewedPathRecord(token, path);
    assert.equal(copy.purpose, purpose);
    assert.equal(Object.isFrozen(copy), true);
    assert.equal(Object.isFrozen(copy.proof), true);
    assert.deepEqual(verifyReviewedPathIdentity(token,
      {path, sha256: SHA, gitBlob: BLOB, bytes: 42}), copy);
  }
  input.records[0].proof.id = 'changed';
  input.records[0].sha256 = 'e'.repeat(64);
  input.records.pop();
  assert.equal(reviewedPathRecord(token, paths[0][0]).proof.id, 'source-name-review');
  assert.equal(reviewedPathRecord(token, paths[0][0]).sha256, SHA);
  assert.equal(reviewedPathRecord(token, paths[2][0]).path, paths[2][0]);
  assert.equal(reviewedDirectoryAllowed(token, 'app/regions/[region]'), true);
  for (const path of ['app', 'app/regions', 'app/regions/[region]/child',
    'app/scene-recovery', 'app/regions/[Region]'])
    assert.equal(reviewedDirectoryAllowed(token, path), false);
  assert.equal(reviewedPathRecord(token, 'app/regions/[Region]/page.tsx'), undefined);
  assert.equal(reviewedPathRecord(token, 'app/scene-recovery.mjs'), undefined);
  assert.equal(reviewedDirectoryAllowed(compile(envelope([paths[1]])), 'app/regions/[region]'), false);
});

test('rejects forged tokens before examining other arguments', () => {
  for (const fake of [{}, Object.freeze(Object.create(null)), null, 'token']) {
    rejects(() => reviewedPolicySourceCommit(fake), 'REVIEWED_TOKEN');
    rejects(() => reviewedPathRecord(fake, paths[0][0]), 'REVIEWED_TOKEN');
    rejects(() => reviewedDirectoryAllowed(fake, paths[0][0]), 'REVIEWED_TOKEN');
    rejects(() => verifyReviewedPathIdentity(fake, null), 'REVIEWED_TOKEN');
  }
});

test('rejects malformed envelope, records, hashes, bytes, and source pins', () => {
  const cases = [
    value => { value.schema = 'vm-reviewed-source-names/2'; },
    value => { value.sourceCommit = 'A'.repeat(40); },
    value => { value.records = []; },
    value => { value.records.push(record(paths[0])); },
    value => { value.records[0].sha256 = 'B'.repeat(64); },
    value => { value.records[0].gitBlob = 'C'.repeat(40); },
    value => { value.records[0].bytes = 0; },
    value => { value.records[0].bytes = Number.MAX_SAFE_INTEGER + 1; },
    value => { value.records[0].proof.id = ' id'; },
    value => { value.records[0].proof.revision = ''; },
    value => { value.records[0].proof.sha256 = 'D'.repeat(64); },
  ];
  for (const mutate of cases) {
    const value = envelope(); mutate(value);
    rejects(() => compile(value), 'REVIEWED_SCHEMA');
  }
  rejects(() => compileReviewedPathPolicy(envelope(), 'f'.repeat(40)), 'REVIEWED_SOURCE_COMMIT');
  rejects(() => compileReviewedPathPolicy(envelope(), 'x'), 'REVIEWED_SCHEMA');
  const duplicate = envelope([paths[0], paths[0]]);
  rejects(() => compile(duplicate), 'REVIEWED_DUPLICATE_PATH');
  for (const change of [
    value => { value.records[0].role = 'model'; },
    value => { value.records[0].purpose = 'clinical-approval'; },
  ]) {
    const value = envelope(); change(value);
    rejects(() => compile(value), 'REVIEWED_PATH');
  }
});

test('refuses extra, inherited, accessor and symbol fields at every level', () => {
  for (const change of [
    value => { value.admitted = true; },
    value => { value.records[0].rights = {}; },
    value => { value.records[0].clinical = true; },
    value => { value.records[0].proof.admitted = true; },
    value => { value.records.extra = true; },
    value => { value.records[0][Symbol('hidden')] = true; },
    value => { Object.setPrototypeOf(value, {schema: value.schema}); },
    value => { Object.setPrototypeOf(value.records[0], {role: 'code'}); },
    value => { Object.setPrototypeOf(value.records[0].proof, {id: 'review'}); },
    value => { Object.setPrototypeOf(value.records, {}); },
    value => { Object.defineProperty(value, 'schema', {get() { throw Error('read'); }}); },
    value => { Object.defineProperty(value.records[0], 'path', {get() { throw Error('read'); }}); },
    value => { Object.defineProperty(value.records[0].proof, 'id', {get() { throw Error('read'); }}); },
    value => { Object.defineProperty(value.records, '0', {get() { throw Error('read'); }}); },
  ]) {
    const value = envelope(); change(value);
    rejects(() => compile(value), 'REVIEWED_SCHEMA');
  }
  const sparse = envelope(); delete sparse.records[1];
  rejects(() => compile(sparse), 'REVIEWED_SCHEMA');
});

test('only exact reviewed paths and purposes are accepted', () => {
  for (const path of [
    'app/regions/[Region]/page.tsx', 'app/regions/[patient]/page.tsx',
    'app/regions/[region]/candidate.tsx', 'app/regions/[region]/model.glb',
    'app/regions/[region]/child/page.tsx', 'app/scene-Recovery.tsx',
    'app/scene-recovery-other.tsx', 'app/scene-recovery.scss',
    'app/scene-recovery.css/child',
  ]) {
    const value = envelope([paths[0]]); value.records[0].path = path;
    rejects(() => compile(value), 'REVIEWED_PATH');
  }
});

test('identity checks require exact plain data and all three matching fields', () => {
  const token = compile(envelope([paths[0]]));
  const observed = () => ({path: paths[0][0], sha256: SHA, gitBlob: BLOB, bytes: 42});
  for (const change of [
    row => { row.path = paths[1][0]; },
    row => { row.sha256 = 'e'.repeat(64); },
    row => { row.gitBlob = 'f'.repeat(40); },
    row => { row.bytes = 43; },
  ]) {
    const row = observed(); change(row);
    rejects(() => verifyReviewedPathIdentity(token, row), 'REVIEWED_IDENTITY_MISMATCH');
  }
  for (const change of [
    row => { row.admitted = true; },
    row => { Object.setPrototypeOf(row, {path: paths[0][0]}); },
    row => { Object.defineProperty(row, 'sha256', {get() { throw Error('read'); }}); },
  ]) {
    const row = observed(); change(row);
    rejects(() => verifyReviewedPathIdentity(token, row), 'REVIEWED_SCHEMA');
  }
});
