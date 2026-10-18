import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { captureSelectedD1, captureContractForTests as contract } from './d1-target-readonly-capture.mjs';

function fixture({ ledger, schema, override, bookmark = 'opaque-bookmark' } = {}) {
  const migrationRows = (ledger ?? contract.MIGRATIONS.map((name, i) => ({ id: i + 1, name })))
    .map(row => ({ ...row, nameBytes: typeof row.name === 'string' ? Buffer.byteLength(row.name) : null }));
  const schemaRows = (schema ?? [
    { type: 'index', name: 'sqlite_autoindex_d1_migrations_1', tableName: 'd1_migrations', sql: null },
    { type: 'table', name: 'd1_migrations', tableName: 'd1_migrations', sql: 'CREATE TABLE d1_migrations (id INTEGER, name TEXT UNIQUE)' },
    { type: 'table', name: 'sqlite_sequence', tableName: 'sqlite_sequence', sql: 'CREATE TABLE sqlite_sequence(name,seq)' },
  ]).map(row => ({ ...row,
    nameBytes: typeof row.name === 'string' ? Buffer.byteLength(row.name) : null,
    tableNameBytes: typeof row.tableName === 'string' ? Buffer.byteLength(row.tableName) : null,
    sqlBytes: row.sql === null ? null : Buffer.byteLength(row.sql),
  }));
  const schemaTotalBytes = schemaRows.reduce((sum, row) => sum + (row.sqlBytes ?? 0), 0);
  const queries = [];
  const answers = new Map([
    [contract.SQL.ledgerCount, () => ({ count: migrationRows.length })],
    [contract.SQL.ledger, () => migrationRows],
    [contract.SQL.schemaCount, () => ({ count: schemaRows.length, totalBytes: schemaTotalBytes })],
    [contract.SQL.schema, () => schemaRows],
  ]);
  if (override) for (const [query, handler] of Object.entries(override)) answers.set(query, handler);
  const session = {
    prepare(sql) {
      queries.push(sql);
      assert.ok(answers.has(sql), 'only fixed queries are allowed');
      return {
        first: async () => answers.get(sql)(),
        // validateSchema intentionally releases each result row. Every query
        // receives an independent snapshot, as native D1 does.
        all: async () => ({ success: true, results: structuredClone(answers.get(sql)()) }),
      };
    },
    getBookmark: () => bookmark,
  };
  const db = { withSession(constraint) { assert.equal(constraint, 'first-primary'); return session; } };
  return { db, queries, answers, migrationRows, schemaRows };
}

test('bounded capture uses only fixed reads and redacts stored SQL and bookmark', async () => {
  const { db, queries } = fixture();
  const report = await captureSelectedD1(db, 'private-target');
  assert.equal(report.status, 'captured-unverified');
  assert.equal(report.schemaObjectCount, 3);
  assert.equal(report.schemaObjects[0].sqlKind, 'automatic-index-null');
  assert.equal(report.schemaObjects[0].sqlSha256, null);
  assert.equal(report.schemaObjects[2].system, true);
  assert.equal(report.appliedMigrationNames.length, 9);
  assert.deepEqual(report.appliedMigrationLedger.map(row => row.name), report.appliedMigrationNames);
  assert.equal(report.appliedMigrationLedger.length, 9);
  assert.equal(createHash('sha256').update(JSON.stringify({
    ledgerEntries: report.appliedMigrationLedger, schemaObjects: report.schemaObjects,
  })).digest('hex'), report.captureSha256);
  assert.equal(report.targetVerified, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.invitationEnabled, false);
  assert.equal(report.audit, 'not-captured');
  assert.equal('schemaVersion' in report, false);
  assert.equal(report.contract, 'd1-target-readonly-capture-prototype-v5');
  assert.ok(report.captureSha256.match(/^[a-f0-9]{64}$/));
  assert.equal(queries.length, 8);
  assert.ok(queries.every(sql => /^SELECT/u.test(sql)));
  assert.ok(queries.every(sql => !/\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/iu.test(sql)));
  assert.match(contract.SQL.ledger, /CASE WHEN length\(CAST\(name AS BLOB\)\) <= 128 THEN name ELSE NULL END AS name/u);
  assert.doesNotMatch(contract.SQL.ledger, /SELECT id, name FROM/u);
  assert.match(contract.SQL.schema, /CASE WHEN length\(CAST\(name AS BLOB\)\) <= 256 THEN name ELSE NULL END AS name/u);
  assert.match(contract.SQL.schema, /CASE WHEN length\(CAST\(tbl_name AS BLOB\)\) <= 256 THEN tbl_name ELSE NULL END AS tableName/u);
  assert.match(contract.SQL.schema, /ORDER BY sqlite_master\.type, sqlite_master\.name LIMIT 513/u);
  assert.doesNotMatch(contract.SQL.schema, /SELECT type, name, tbl_name/u);
  assert.ok(!JSON.stringify(report).includes('CREATE TABLE'));
  assert.ok(!JSON.stringify(report).includes('opaque-bookmark'));
  assert.ok(!JSON.stringify(report).includes('private-target'));
});

test('refuses missing, extra, duplicate, malformed and out-of-order ledger rows', async () => {
  const base = contract.MIGRATIONS.map((name, i) => ({ id: i + 1, name }));
  const variants = [
    base.slice(0, 8),
    [...base, { id: 10, name: '0009_pending.sql' }],
    base.map((row, i) => i === 4 ? { id: 5, name: base[3].name } : row),
    base.map((row, i) => i === 4 ? { id: 4, name: row.name } : row),
    base.map((row, i) => i === 4 ? { id: 5, name: 'bad' } : row),
  ];
  for (const ledger of variants) {
    const report = await captureSelectedD1(fixture({ ledger }).db, 'private-target');
    assert.equal(report.status, 'refused');
    assert.equal(report.targetVerified, false);
    assert.equal('appliedMigrationNames' in report, false);
  }
});

test('refuses an oversized projected-null name and forged byte counts', async () => {
  const ordinary = contract.MIGRATIONS.map((name, i) => ({ id: i + 1, name, nameBytes: Buffer.byteLength(name) }));
  const projected = ordinary.map((row, i) => i === 4
    ? { id: 5, name: null, nameBytes: 20_000_000 } : row);
  const projectedSpy = fixture({ override: { [contract.SQL.ledger]: () => projected } });
  assert.equal((await captureSelectedD1(projectedSpy.db, 'private-target')).code, 'LEDGER_PROFILE');
  const forged = ordinary.map((row, i) => i === 4
    ? { ...row, nameBytes: row.nameBytes - 1 } : row);
  const forgedSpy = fixture({ override: { [contract.SQL.ledger]: () => forged } });
  assert.equal((await captureSelectedD1(forgedSpy.db, 'private-target')).code, 'LEDGER_PROFILE');
});

test('refuses truncated, duplicate, malformed and overbound schema inventory', async () => {
  const standard = fixture().schemaRows;
  const variants = [
    [...standard, { ...standard[1] }],
    [{ ...standard[1], sql: null }],
    [{ ...standard[1], name: 'x\n' }],
    [{ ...standard[1], sql: 'x'.repeat(256 * 1024 + 1) }],
    [{ type: 'table', name: 'other', tableName: 'other', sql: 'CREATE TABLE other (id INTEGER)' }],
    [{ type: 'trigger', name: 'audit_probe', tableName: 'd1_migrations', sql: 'CREATE TRIGGER audit_probe AFTER INSERT ON d1_migrations BEGIN SELECT 1; END' }, ...standard],
  ];
  for (const schema of variants) {
    const report = await captureSelectedD1(fixture({ schema }).db, 'private-target');
    assert.equal(report.status, 'refused');
    assert.equal('schemaObjects' in report, false);
  }
  const short = fixture({ override: { [contract.SQL.schema]: () => standard.slice(0, 2) } });
  assert.equal((await captureSelectedD1(short.db, 'private-target')).status, 'refused');
  const tooMany = fixture({ override: { [contract.SQL.schemaCount]: () => ({ count: contract.MAX_OBJECTS + 1, totalBytes: 0 }) } });
  assert.equal((await captureSelectedD1(tooMany.db, 'private-target')).code, 'SCHEMA_BOUND');
  const tooManyBytes = fixture({ override: { [contract.SQL.schemaCount]: () => ({ count: 3, totalBytes: 4 * 1024 * 1024 + 1 }) } });
  assert.equal((await captureSelectedD1(tooManyBytes.db, 'private-target')).code, 'SCHEMA_BOUND');
});

test('refuses projected-null overlong schema identifiers and forged UTF-8 byte lengths', async () => {
  const ordinary = fixture().schemaRows;
  const variants = [
    ordinary.map((row, i) => i === 1 ? { ...row, name: null, nameBytes: 20_000_000 } : row),
    ordinary.map((row, i) => i === 0 ? { ...row, tableName: null, tableNameBytes: 20_000_000 } : row),
    ordinary.map((row, i) => i === 1 ? { ...row, nameBytes: row.nameBytes - 1 } : row),
    ordinary.map((row, i) => i === 0 ? { ...row, tableNameBytes: row.tableNameBytes - 1 } : row),
    ordinary.map((row, i) => i === 1 ? { ...row, name: 'é'.repeat(129), nameBytes: 258 } : row),
    ordinary.map((row, i) => i === 0 ? { ...row, tableName: 'é'.repeat(129), tableNameBytes: 258 } : row),
  ];
  for (const projectedRows of variants) {
    const spy = fixture({ override: { [contract.SQL.schema]: () => projectedRows } });
    const report = await captureSelectedD1(spy.db, 'private-target');
    assert.equal(report.code, 'SCHEMA_PROFILE');
    assert.equal('schemaObjects' in report, false);
  }
  // The query's CASE projection, rather than JavaScript, must prevent transfer
  // of an oversized name even when many automatic indexes share the table.
  assert.match(contract.SQL.schema, /length\(CAST\(tbl_name AS BLOB\)\) <= 256 THEN tbl_name ELSE NULL/u);
});

test('keeps a bounded trigger identity and hash in the inventory without treating it as approval', async () => {
  const base = fixture().schemaRows;
  const schema = [...base, {
    type: 'trigger', name: 'audit_probe', tableName: 'd1_migrations',
    sql: 'CREATE TRIGGER audit_probe AFTER INSERT ON d1_migrations BEGIN SELECT 1; END',
  }];
  const report = await captureSelectedD1(fixture({ schema }).db, 'private-target');
  assert.equal(report.status, 'captured-unverified');
  assert.equal(report.triggerCount, 1);
  assert.equal(report.schemaObjects.at(-1).name, 'audit_probe');
  assert.equal(report.schemaObjects.at(-1).sqlKind, 'stored-sql');
  assert.equal(report.targetVerified, false);
});

test('refuses observed count drift and redacts source exception content', async () => {
  let reads = 0;
  const bytes = fixture().schemaRows.reduce((sum, row) => sum + (row.sqlBytes ?? 0), 0);
  const drift = fixture({ override: { [contract.SQL.schemaCount]: () => ({ count: 3 + reads++, totalBytes: bytes }) } });
  assert.equal((await captureSelectedD1(drift.db, 'private-target')).code, 'OBSERVED_DRIFT');
  const broken = fixture({ override: { [contract.SQL.ledger]: () => { throw new Error('private SQL and patient value'); } } });
  const report = await captureSelectedD1(broken.db, 'private-target');
  assert.equal(report.code, 'QUERY_OR_HASH');
  assert.equal(JSON.stringify(report).includes('patient'), false);
  assert.equal((await captureSelectedD1(null, 'private-target')).code, 'INPUT');
  assert.equal((await captureSelectedD1(fixture().db, 'bad label')).code, 'INPUT');
  const badCount = fixture({ override: { [contract.SQL.ledgerCount]: () => ({ count: 'nine' }) } });
  assert.equal((await captureSelectedD1(badCount.db, 'private-target')).code, 'COUNT_PROFILE');
});

test('refuses same-count equal-byte SQL drift and malformed second inventory', async () => {
  const baseline = fixture().schemaRows;
  const totalBytes = baseline.reduce((sum, row) => sum + (row.sqlBytes ?? 0), 0);
  let calls = 0;
  const changed = baseline.map(row => row.name === 'd1_migrations'
    ? { ...row, sql: row.sql.replace('id INTEGER', 'ix INTEGER') } : row);
  assert.equal(changed.reduce((sum, row) => sum + (row.sqlBytes ?? 0), 0), totalBytes);
  const drift = fixture({ override: { [contract.SQL.schema]: () => ++calls === 1 ? baseline : changed } });
  assert.equal((await captureSelectedD1(drift.db, 'private-target')).code, 'OBSERVED_DRIFT');
  let malformedCalls = 0;
  const malformed = fixture({ override: { [contract.SQL.schema]: () => ++malformedCalls === 1
    ? baseline : baseline.map((row, i) => i === 1 ? { ...row, nameBytes: -1 } : row) } });
  const refusal = await captureSelectedD1(malformed.db, 'private-target');
  assert.equal(refusal.code, 'OBSERVED_DRIFT');
  assert.equal('schemaObjects' in refusal, false);
});

test('refuses same-count ledger identity drift and malformed second ledger', async () => {
  const baseline = fixture().migrationRows;
  let calls = 0;
  const shifted = baseline.map(row => ({ ...row, id: row.id + 10 }));
  const idDrift = fixture({ override: { [contract.SQL.ledger]: () => ++calls === 1 ? baseline : shifted } });
  assert.equal((await captureSelectedD1(idDrift.db, 'private-target')).code, 'OBSERVED_DRIFT');
  let nameCalls = 0;
  const nameDrift = fixture({ override: { [contract.SQL.ledger]: () => ++nameCalls === 1 ? baseline
    : baseline.map((row, i) => i === 4 ? { ...row, name: '0004_other.sql', nameBytes: 14 } : row) } });
  const refusal = await captureSelectedD1(nameDrift.db, 'private-target');
  assert.equal(refusal.code, 'OBSERVED_DRIFT');
  assert.equal('appliedMigrationNames' in refusal, false);
});

test('refuses aggregate SQL-byte mismatch and overbound bookmark before hashing', async () => {
  const mismatch = fixture({ override: { [contract.SQL.schemaCount]: () => ({ count: 3, totalBytes: 0 }) } });
  assert.equal((await captureSelectedD1(mismatch.db, 'private-target')).code, 'SCHEMA_PROFILE');
  const longBookmark = fixture({ bookmark: 'x'.repeat(contract.MAX_BOOKMARK_BYTES + 1) });
  const result = await captureSelectedD1(longBookmark.db, 'private-target');
  assert.equal(result.code, 'BOOKMARK');
  assert.equal(JSON.stringify(result).includes('xxxxx'), false);
  const multibyteBookmark = fixture({ bookmark: 'é'.repeat(600) });
  assert.equal((await captureSelectedD1(multibyteBookmark.db, 'private-target')).code, 'BOOKMARK');
});

test('accepts SQLite UTF-8 order while refusing JavaScript UTF-16 order', async () => {
  const bmp = 'native_\uE000', supplementary = 'native_\u{10000}';
  assert.ok(bmp > supplementary, 'the fixture differs under UTF-16');
  const rows = [bmp, supplementary].map(name => ({type:'table', name, tableName:name, sql:`CREATE TABLE "${name}" (id INTEGER)`}));
  const ordered = [...fixture().schemaRows, ...rows].sort((left,right)=>Buffer.compare(
    Buffer.from(`${left.type}\0${left.name}`),Buffer.from(`${right.type}\0${right.name}`)));
  assert.equal((await captureSelectedD1(fixture({schema:ordered}).db,'private-target')).status,'captured-unverified');
  const reversed = [...ordered];
  const index = reversed.findIndex(row=>row.name===bmp);
  [reversed[index],reversed[index+1]]=[reversed[index+1],reversed[index]];
  const refusal = await captureSelectedD1(fixture({schema:reversed}).db,'private-target');
  assert.equal(refusal.code,'SCHEMA_PROFILE');
  assert.equal('schemaObjects' in refusal,false);
});

test('retains a cross-type SQLite identity but refuses a duplicate type/name', async () => {
  const base = fixture().schemaRows;
  const trigger = {type:'trigger',name:'d1_migrations',tableName:'d1_migrations',sql:'CREATE TRIGGER d1_migrations AFTER INSERT ON d1_migrations BEGIN SELECT 1; END'};
  const success = await captureSelectedD1(fixture({schema:[...base,trigger]}).db,'private-target');
  assert.equal(success.status,'captured-unverified');
  assert.equal(success.schemaObjects.filter(row=>row.name==='d1_migrations').length,2);
  assert.equal(success.targetVerified,false);
  const refusal = await captureSelectedD1(fixture({schema:[...base,trigger,trigger]}).db,'private-target');
  assert.equal(refusal.code,'SCHEMA_PROFILE');
  assert.equal('schemaObjects' in refusal,false);
});
