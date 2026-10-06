import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { audit } from '../scripts/d1-migration-readiness.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');

async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), 'vm-d1-preflight-'));
  const dir = join(root, 'drizzle');
  const a = 'CREATE TABLE sample (id TEXT PRIMARY KEY);';
  const b = 'ALTER TABLE sample ADD COLUMN title TEXT;';
  try {
    await mkdir(dir);
    await writeFile(join(dir, '0000_start.sql'), a);
    await writeFile(join(dir, '0001_add_title.sql'), b);
    const journalPath = join(root, 'journal.json');
    const ledgerPath = join(root, 'ledger.json');
    const expectedSchemaPath = join(root, 'expected.sql');
    const entries = [
      { idx: 0, version: '6', when: 1, tag: '0000_start' },
      { idx: 1, version: '6', when: 2, tag: '0001_add_title' },
    ];
    await writeFile(journalPath, JSON.stringify({ entries }));
    await writeFile(ledgerPath, JSON.stringify({ applied: [{ name: '0000_start.sql', sha256: hash(a) }] }));
    await writeFile(expectedSchemaPath, 'CREATE TABLE sample (id TEXT PRIMARY KEY, title TEXT);');
    return await fn({ root, dir, journalPath, ledgerPath, expectedSchemaPath, entries, a, b });
  } finally {
    const target = resolve(root);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert(basename(target).startsWith('vm-d1-preflight-'));
    await rm(target, { recursive: true, force: true });
  }
}

const codes = result => result.findings.map(f => f.code);
const options = f => ({ migrationsDir: f.dir, journalPath: f.journalPath, ledgerPath: f.ledgerPath,
  expectedSchemaPath: f.expectedSchemaPath, boundary: '0001_add_title.sql' });
const git = (root, ...args) => {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
};

test('valid synthetic SQL replays in memory while hosted readiness remains blocked', async () => fixture(async f => {
  const result = await audit(options(f));
  assert.equal(result.status, 'blocked-not-ready');
  assert.equal(result.readyForDeployment, false);
  assert.equal(result.replay?.parity, true);
  assert.deepEqual(result.migrations.map(m => m.sha256), [hash(f.a), hash(f.b)]);
  assert.ok(codes(result).includes('HOSTED_STATE_UNVERIFIED'));
}));

test('journal order, missing SQL, and extra SQL fail closed', async () => fixture(async f => {
  await writeFile(f.journalPath, JSON.stringify({ entries: [f.entries[1], f.entries[0]] }));
  await rm(join(f.dir, '0001_add_title.sql'));
  await writeFile(join(f.dir, '0002_extra.sql'), 'SELECT 1;');
  const result = await audit(options(f));
  for (const code of ['JOURNAL_ENTRY_INVALID', 'MISSING_SQL', 'UNJOURNALED_SQL']) assert.ok(codes(result).includes(code), code);
}));

test('excluded boundary is reported', async () => fixture(async f => {
  const result = await audit({ ...options(f), boundary: '0000_start.sql' });
  assert.ok(codes(result).includes('BOUNDARY_EXCLUDES_JOURNAL'));
}));

test('duplicate journal is reported', async () => fixture(async f => {
  await writeFile(f.journalPath, JSON.stringify({ entries: [f.entries[0], f.entries[0]] }));
  const result = await audit(options(f));
  assert.ok(codes(result).includes('JOURNAL_DUPLICATE'));
}));

test('unknown, reordered, and duplicated applied history are reported', async () => fixture(async f => {
  await writeFile(f.ledgerPath, JSON.stringify({ applied: [
    { name: '0001_add_title.sql', sha256: hash('wrong') },
    { name: '0099_unknown.sql', sha256: hash('unknown') },
    { name: '0001_add_title.sql', sha256: hash(f.b) },
  ] }));
  const result = await audit(options(f));
  for (const code of ['LEDGER_OUT_OF_ORDER', 'UNKNOWN_APPLIED_HISTORY', 'LEDGER_DUPLICATE']) assert.ok(codes(result).includes(code), code);
}));

test('applied hash drift and expected schema mismatch are reported', async () => fixture(async f => {
  await writeFile(f.ledgerPath, JSON.stringify({ applied: [{ name: '0000_start.sql', sha256: hash('different') }] }));
  await writeFile(f.expectedSchemaPath, 'CREATE TABLE unrelated (id TEXT);');
  const result = await audit(options(f));
  assert.ok(codes(result).includes('APPLIED_HASH_MISMATCH'));
  assert.ok(codes(result).includes('SCHEMA_MISMATCH'));
}));

test('schema comparison preserves whitespace inside SQL literals', async () => fixture(async f => {
  await writeFile(join(f.dir, '0001_add_title.sql'), f.b + " CREATE TABLE literal_sample(value TEXT DEFAULT 'a  b');");
  await writeFile(f.expectedSchemaPath, "CREATE TABLE sample (id TEXT PRIMARY KEY, title TEXT); CREATE TABLE literal_sample(value TEXT DEFAULT 'a b');");
  const result = await audit(options(f));
  assert.equal(result.replay?.parity, false);
  assert.ok(codes(result).includes('SCHEMA_MISMATCH'));
  assert.equal(result.readyForDeployment, false);
}));

test('missing external evidence and unsupported TypeScript schema stay blocked', async () => fixture(async f => {
  const result = await audit({ migrationsDir: f.dir, journalPath: f.journalPath,
    expectedSchemaPath: join(f.root, 'db/schema.ts') });
  for (const code of ['LEDGER_NOT_SUPPLIED', 'BOUNDARY_UNSUPPORTED', 'EXPECTED_SCHEMA_UNSUPPORTED', 'HOSTED_STATE_UNVERIFIED']) assert.ok(codes(result).includes(code), code);
}));

test('ATTACH, VACUUM INTO, and quoted file-oriented PRAGMA cannot create files or leak SQL', async () => {
  for (const kind of ['attach', 'vacuum', 'pragma']) await fixture(async f => {
    const canary = join(f.root, `${kind}-canary.db`);
    const sqlPath = canary.replaceAll("'", "''");
    const harmful = kind === 'attach' ? `ATTACH DATABASE '${sqlPath}' AS outsider;`
      : kind === 'vacuum' ? `VACUUM INTO '${sqlPath}';`
        : `PRAGMA temp_store_directory='${sqlPath}';`;
    await writeFile(join(f.dir, '0001_add_title.sql'), harmful);
    const result = await audit(options(f));
    assert.ok(codes(result).includes('SQL_REPLAY_FAILED'), kind);
    await assert.rejects(access(canary));
    assert.ok(!JSON.stringify(result).includes(sqlPath));
    assert.ok(!JSON.stringify(result).includes(harmful));
  });
});

test('Git admission distinguishes committed bytes, dirty journal, untracked SQL, and unavailable repo', async () => fixture(async f => {
  git(f.root, 'init', '-q');
  git(f.root, 'config', 'user.name', 'Preflight Fixture');
  git(f.root, 'config', 'user.email', 'fixture@example.invalid');
  git(f.root, 'add', 'drizzle', 'journal.json');
  git(f.root, 'commit', '-qm', 'synthetic migration chain');
  const clean = await audit({ ...options(f), repoRoot: f.root });
  assert.ok(!codes(clean).includes('NOT_COMMITTED'));
  assert.ok(!codes(clean).includes('WORKTREE_DIFFERS_FROM_HEAD'));
  await writeFile(f.journalPath, JSON.stringify({ entries: [...f.entries, { idx: 2, version: '6', when: 3, tag: '0002_new' }] }));
  await writeFile(join(f.dir, '0002_new.sql'), 'CREATE TABLE newest (id TEXT);');
  const pending = await audit({ ...options(f), repoRoot: f.root });
  assert.ok(codes(pending).includes('WORKTREE_DIFFERS_FROM_HEAD'));
  assert.ok(codes(pending).includes('NOT_COMMITTED'));
  const unavailable = await audit({ ...options(f), repoRoot: join(f.root, 'missing-repo') });
  assert.ok(codes(unavailable).includes('GIT_UNAVAILABLE'));
}));
