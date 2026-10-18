import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, lstat, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { compareContract, replaySql, verifyBundleGraph, verifySourceHashes } from '../scripts/d1-schema-contract.mjs';

const codes = report => report.findings.map(row => row.code);
const base = () => ({ tables: [{ name: 'sample', columns: [
  { name: 'id', type: 'TEXT', notNull: true, default: null, primary: true, unique: false },
  { name: 'label', type: 'TEXT', notNull: true, default: 'ready', primary: false, unique: false },
], primaryKey: ['id'], indexes: [{ name: 'idx_sample_label', unique: false, columns: ['label'] }],
  uniques: [['label']], foreignKeys: [], namedChecks: [] }] });
const sql = `CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 'ready',CONSTRAINT uq_sample_label UNIQUE(label));
CREATE INDEX idx_sample_label ON sample(label);`;
const compare = (contract, statements = [sql], options = {}) => {
  const db = replaySql(statements);
  try { return compareContract(contract, db, options); } finally { db.close(); }
};

test('independent column and index contract matches synthetic committed SQL', () => {
  const report = compare(base());
  assert.equal(report.readyForDeployment, false);
  assert.deepEqual(report.findings, []);
});

test('missing and wrong columns, nullability, and defaults are detected', () => {
  const contract = base();
  contract.tables[0].columns.push({ name: 'missing', type: 'INTEGER', notNull: false, default: null, primary: false, unique: false });
  contract.tables[0].columns[1].type = 'INTEGER';
  contract.tables[0].columns[1].notNull = false;
  contract.tables[0].columns[1].default = 'different';
  const result = compare(contract);
  for (const code of ['MISSING_COLUMN', 'TYPE_MISMATCH', 'NULLABILITY_MISMATCH', 'DEFAULT_MISMATCH']) assert.ok(codes(result).includes(code), code);
});

test('missing named index and unique requirement are detected', () => {
  const withoutIndexes = `CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 'ready');`;
  const result = compare(base(), [withoutIndexes]);
  assert.ok(codes(result).includes('INDEX_MISMATCH'));
  assert.ok(codes(result).includes('UNIQUE_MISMATCH'));
});

test('foreign key target and named check requirements are detected', () => {
  const contract = base();
  contract.tables[0].foreignKeys = [{ columns: ['label'], targetTable: 'target', targetColumns: ['id'], onUpdate: 'NO ACTION', onDelete: 'NO ACTION' }];
  contract.tables[0].namedChecks = ['sample_label_valid'];
  const result = compare(contract);
  assert.ok(codes(result).includes('FOREIGN_KEY_MISMATCH'));
  assert.ok(codes(result).includes('NAMED_CHECK_MISSING'));
});

test('pending-only table is identified without admitting pending SQL', () => {
  const contract = { tables: [{ ...base().tables[0], name: 'pending_only' }] };
  const result = compare(contract, [sql], { pendingNames: ['pending_only'] });
  assert.deepEqual(codes(result), ['PENDING_ONLY_TABLE']);
});

test('mismatched source hashes refuse contract extraction', () => {
  const sha = value => createHash('sha256').update(value).digest('hex');
  const pin = { schemaSha256: sha('good'), reviewSchemaSha256: sha('review') };
  verifySourceHashes(Buffer.from('good'), Buffer.from('review'), pin);
  assert.throws(() => verifySourceHashes(Buffer.from('changed'), Buffer.from('review'), pin), /hash mismatch/);
});

test('quoted textual booleans and numeric-looking defaults remain strings', () => {
  const contract = base();
  contract.tables[0].columns[1].default = 'true';
  assert.deepEqual(compare(contract, [`CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 'true',UNIQUE(label)); CREATE INDEX idx_sample_label ON sample(label);`]).findings, []);
  contract.tables[0].columns[1].default = '001';
  assert.deepEqual(compare(contract, [`CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT '001',UNIQUE(label)); CREATE INDEX idx_sample_label ON sample(label);`]).findings, []);
  assert.ok(codes(compare(contract, [`CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 001,UNIQUE(label)); CREATE INDEX idx_sample_label ON sample(label);`])).includes('DEFAULT_MISMATCH'));
});

test('quoted textual defaults preserve internal doubled spaces and escaped quotes', () => {
  const contract = base();
  contract.tables[0].columns[1].default = "a  b's";
  const statement = `CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 'a  b''s',UNIQUE(label)); CREATE INDEX idx_sample_label ON sample(label);`;
  assert.deepEqual(compare(contract, [statement]).findings, []);
});

test('partial unique index cannot satisfy global unique requirement', () => {
  const statement = `CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 'ready'); CREATE INDEX idx_sample_label ON sample(label); CREATE UNIQUE INDEX only_some ON sample(label) WHERE label IS NOT NULL;`;
  assert.ok(codes(compare(base(), [statement])).includes('UNIQUE_MISMATCH'));
});

test('descending or collated index cannot satisfy plain named index', () => {
  for (const shape of ['label DESC', 'label COLLATE NOCASE']) {
    const statement = `CREATE TABLE sample(id TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL DEFAULT 'ready',UNIQUE(label)); CREATE INDEX idx_sample_label ON sample(${shape});`;
    assert.ok(codes(compare(base(), [statement])).includes('INDEX_MISMATCH'));
  }
});

test('schema bundle graph rejects extra source and external imports', () => {
  const site = resolve(tmpdir(), 'schema-graph-fixture');
  const valid = { inputs: {
    'db/schema.ts': { imports: [{ path: 'atlas-review/db/schema.ts', external: false }, { path: 'drizzle-orm', external: true }] },
    'atlas-review/db/schema.ts': { imports: [{ path: 'drizzle-orm/sqlite-core', external: true }] },
  }, outputs: { 'schema.js': { imports: [{ path: 'drizzle-orm', external: true }] } } };
  verifyBundleGraph(valid, site);
  const extraFile = structuredClone(valid);
  extraFile.inputs['db/extra.ts'] = { imports: [] };
  assert.throws(() => verifyBundleGraph(extraFile, site), /Unexpected schema bundle dependency/);
  const extraExternal = structuredClone(valid);
  extraExternal.inputs['db/schema.ts'].imports.push({ path: 'node:fs', external: true });
  assert.throws(() => verifyBundleGraph(extraExternal, site), /Unexpected schema bundle import/);
});

async function removeOwnedTestDirectory(directory) {
  const root = resolve(tmpdir());
  const target = resolve(directory);
  const stat = await lstat(target);
  if (dirname(target) !== root || !/^vm-schema-unsafe-[A-Za-z0-9]+$/.test(basename(target)) || !stat.isDirectory() || stat.isSymbolicLink()
    || await realpath(target) !== target) throw new Error('Refusing unsafe test cleanup target');
  await rm(target, { recursive: true, force: true });
}

test('restricted replay denies filesystem SQL without writing canaries or echoing SQL', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vm-schema-unsafe-'));
  try {
    for (const [kind, expression] of [
      ['attach', path => `ATTACH DATABASE '${path}' AS other;`],
      ['vacuum', path => `VACUUM INTO '${path}';`],
      ['pragma', path => `PRAGMA temp_store_directory='${path}';`],
    ]) {
      const canary = join(dir, `${kind}.db`).replaceAll("'", "''");
      assert.throws(() => replaySql([expression(canary)]), error => error.message === 'Restricted in-memory SQL replay refused or failed');
      await assert.rejects(access(canary));
    }
  } finally { await removeOwnedTestDirectory(dir); }
});
