#!/usr/bin/env node
// Offline, read-only inventory. Never connects to D1 or applies migrations.
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const finding = (code, detail) => ({ code, detail });
const safeName = (name) => typeof name === 'string' && /^\d{4}_[a-z0-9_]+\.sql$/.test(name);

function git(repo, args) {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024 });
  return result.status === 0 ? result.stdout.trim() : null;
}

function schemaObjects(db) {
  return db.prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type IN ('table','index','view','trigger') ORDER BY type, name").all()
    .filter(({ name }) => !name.startsWith('sqlite_'))
    // Compare SQLite's stored SQL exactly. Whitespace is data inside quoted
    // CHECK/default literals; false mismatches are safer than false parity.
    .map(({ type, name, tbl_name: table, sql }) => ({ type, name, table, sql: sql ?? null }));
}

async function replay(migrations, expectedSchema, findings) {
  let DatabaseSync, constants;
  try { ({ DatabaseSync, constants } = await import('node:sqlite')); }
  catch { findings.push(finding('SQLITE_UNAVAILABLE', 'Node built-in SQLite is unavailable; SQL replay and schema comparison were not performed.')); return null; }
  if (typeof DatabaseSync.prototype.setAuthorizer !== 'function' || !constants?.SQLITE_DENY) {
    findings.push(finding('SQLITE_AUTHORIZER_UNAVAILABLE', 'This Node SQLite version cannot authorize SQL; replay was not performed.'));
    return null;
  }
  let deniedAction = null;
  const authorizedDatabase = () => {
    const db = new DatabaseSync(':memory:', { allowExtension: false, defensive: true });
    db.exec('PRAGMA temp_store=MEMORY; PRAGMA cache_spill=OFF;');
    // SQLite may access the filesystem despite an in-memory main database.
    // Permit only the operations needed by ordinary migration DDL and data copy.
    const allowed = new Set([
      constants.SQLITE_CREATE_TABLE, constants.SQLITE_CREATE_INDEX,
      constants.SQLITE_CREATE_TEMP_TABLE, constants.SQLITE_CREATE_TEMP_INDEX,
      constants.SQLITE_DROP_TABLE, constants.SQLITE_DROP_INDEX,
      constants.SQLITE_DROP_TEMP_TABLE, constants.SQLITE_DROP_TEMP_INDEX,
      constants.SQLITE_ALTER_TABLE, constants.SQLITE_INSERT, constants.SQLITE_UPDATE,
      constants.SQLITE_DELETE, constants.SQLITE_READ, constants.SQLITE_SELECT,
      constants.SQLITE_TRANSACTION, constants.SQLITE_SAVEPOINT,
      constants.SQLITE_REINDEX, constants.SQLITE_ANALYZE,
    ]);
    db.setAuthorizer((action, arg1, arg2) => {
      let permit = allowed.has(action);
      if (action === constants.SQLITE_PRAGMA)
        permit = ['foreign_keys', 'defer_foreign_keys', 'optimize'].includes(String(arg1).toLowerCase());
      if (action === constants.SQLITE_FUNCTION)
        permit = ['printf', 'substr', 'length', 'replace', 'coalesce', 'ifnull', 'lower', 'upper', 'trim', 'quote', 'like', 'json_valid', 'json_extract'].includes(String(arg2).toLowerCase())
          || String(arg2).toLowerCase().startsWith('sqlite_rename_');
      if (!permit) deniedAction = action;
      return permit ? constants.SQLITE_OK : constants.SQLITE_DENY;
    });
    return db;
  };
  const db = authorizedDatabase();
  try {
    for (const migration of migrations) {
      deniedAction = null;
      try { db.exec(migration.sql); }
      catch { findings.push(finding('SQL_REPLAY_FAILED', `${migration.name} failed in a new in-memory SQLite database${deniedAction === null ? '' : ` (authorization action ${deniedAction} denied)`}.`)); return null; }
    }
    const actual = schemaObjects(db);
    if (!expectedSchema) return { objectCount: actual.length, parity: null };
    const expected = authorizedDatabase();
    try {
      try { expected.exec(expectedSchema); }
      catch { findings.push(finding('EXPECTED_SCHEMA_INVALID', 'The supplied expected schema SQL did not replay in memory.')); return { objectCount: actual.length, parity: null }; }
      const wanted = schemaObjects(expected);
      if (JSON.stringify(actual) !== JSON.stringify(wanted)) findings.push(finding('SCHEMA_MISMATCH', `Replayed migration schema differs from supplied expected SQL (${actual.length} vs ${wanted.length} objects).`));
      return { objectCount: actual.length, expectedObjectCount: wanted.length, parity: JSON.stringify(actual) === JSON.stringify(wanted) };
    } finally { expected.close(); }
  } finally { db.close(); }
}

export async function audit({ migrationsDir, journalPath, expectedSchemaPath, ledgerPath, repoRoot, boundary } = {}) {
  const findings = [];
  const chain = [];
  if (!migrationsDir || !journalPath) throw new Error('Explicit migrationsDir and journalPath are required');
  const dir = resolve(migrationsDir);
  let journal;
  try { journal = JSON.parse(await readFile(journalPath, 'utf8')); }
  catch { findings.push(finding('JOURNAL_MISSING_OR_INVALID', 'Migration journal is missing or invalid JSON.')); }
  const entries = journal?.entries;
  if (!Array.isArray(entries) || !entries.length) findings.push(finding('JOURNAL_MALFORMED', 'Journal entries must be a nonempty array.'));
  let names = [];
  if (Array.isArray(entries)) {
    names = entries.map((entry) => `${entry?.tag}.sql`);
    const seen = new Set();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i], name = names[i];
      if (!safeName(name) || entry?.idx !== i || Number(name.slice(0, 4)) !== i || typeof entry?.version !== 'string' || !Number.isSafeInteger(entry?.when)) findings.push(finding('JOURNAL_ENTRY_INVALID', `Entry ${i} has an invalid index, name, version or timestamp.`));
      if (seen.has(name)) findings.push(finding('JOURNAL_DUPLICATE', `Duplicate migration entry at index ${i}.`));
      seen.add(name);
    }
  }
  let diskNames = [];
  try { diskNames = (await readdir(dir, { withFileTypes: true })).filter(x => x.isFile() && x.name.endsWith('.sql')).map(x => x.name).sort(); }
  catch { findings.push(finding('MIGRATION_DIR_MISSING', 'Migration directory cannot be read.')); }
  for (const name of diskNames) if (!names.includes(name)) findings.push(finding('UNJOURNALED_SQL', `${name} is not in the journal.`));
  for (const name of names) {
    if (!safeName(name)) continue;
    try {
      const bytes = await readFile(join(dir, name));
      if (!bytes.length) findings.push(finding('EMPTY_SQL', `${name} is empty.`));
      chain.push({ name, sha256: sha256(bytes), sql: bytes.toString('utf8') });
    } catch { findings.push(finding('MISSING_SQL', `${name} is absent.`)); }
  }
  if (!boundary || !names.includes(boundary)) findings.push(finding('BOUNDARY_UNSUPPORTED', 'Supply a journaled supported boundary as an exact SQL filename.'));
  else if (boundary !== names.at(-1)) findings.push(finding('BOUNDARY_EXCLUDES_JOURNAL', 'The supplied boundary excludes journaled migrations; separate the future draft before deploy input.'));

  if (!repoRoot) findings.push(finding('GIT_ADMISSION_UNVERIFIED', 'A repository root is required to verify committed migration bytes.'));
  else {
    const root = resolve(repoRoot);
    if (!git(root, ['rev-parse', '--show-toplevel'])) findings.push(finding('GIT_UNAVAILABLE', 'The supplied repository is not readable by Git.'));
    else {
      for (const path of [journalPath, ...names.filter(safeName).map(name => join(dir, name))]) {
        const rel = relative(root, resolve(path)).split(sep).join('/');
        if (rel.startsWith('../') || rel === '..' || isAbsolute(rel) || !rel || /^[A-Za-z]:/.test(rel)) { findings.push(finding('PATH_OUTSIDE_REPO', 'Migration inventory path is outside the supplied repository.')); continue; }
        const head = git(root, ['show', `HEAD:${rel}`]);
        if (head === null) { findings.push(finding('NOT_COMMITTED', `${basename(path)} is absent from HEAD.`)); continue; }
        // Git returns text for this public source inventory. Compare exact bytes through git hash-object.
        const workingHash = git(root, ['hash-object', '--', rel]);
        const committedHash = git(root, ['rev-parse', `HEAD:${rel}`]);
        if (!workingHash || !committedHash || workingHash !== committedHash) findings.push(finding('WORKTREE_DIFFERS_FROM_HEAD', `${basename(path)} differs from HEAD.`));
      }
    }
    try {
      const bootstrap = await readFile(join(root, 'db', 'bootstrap.ts'), 'utf8');
      const platform = await readFile(join(root, 'db', 'platform.ts'), 'utf8');
      if (/env\.DB\.batch\(SCHEMA\.map|seedCatalog\(\)|backfillKnownAssessmentManifests\(\)|ensureColumn\(/.test(bootstrap)
        || /env\.DB\.batch\(statements\.map|INSERT OR IGNORE INTO|UPDATE organizations SET/.test(platform))
        findings.push(finding('REQUEST_BOOTSTRAP_ACTIVE', 'Public code still creates schema and runs seed/backfill work during request paths; migration replay cannot prove safe startup or hosted schema parity.'));
    } catch { findings.push(finding('APPLICATION_CODE_UNVERIFIED', 'Application bootstrap and platform schema code were not both readable; startup behavior and parity remain unverified.')); }
    try {
      const hosting = JSON.parse(await readFile(join(root, '.openai', 'hosting.json'), 'utf8'));
      if (hosting?.d1 && !hosting?.migrations_dir) findings.push(finding('MIGRATION_WIRING_UNVERIFIED', 'Hosting metadata names a D1 binding but does not attest a migrations directory, applied table or deployment migration command.'));
    } catch { /* No hosting metadata in a standalone fixture. */ }
  }

  let ledger;
  if (!ledgerPath) findings.push(finding('LEDGER_NOT_SUPPLIED', 'An explicit applied ledger is required; no remote ledger was read.'));
  else {
    try { ledger = JSON.parse(await readFile(ledgerPath, 'utf8')); }
    catch { findings.push(finding('LEDGER_INVALID', 'Supplied ledger is missing or invalid JSON.')); }
  }
  if (ledger !== undefined) {
    const applied = ledger?.applied;
    if (!Array.isArray(applied)) findings.push(finding('LEDGER_INVALID', 'Ledger must contain applied: [{name, sha256}] in application order.'));
    else {
      const seen = new Set();
      for (let i = 0; i < applied.length; i++) {
        const row = applied[i], local = chain[i];
        if (typeof row?.name !== 'string' || !/^[a-f0-9]{64}$/.test(row?.sha256 ?? '')) findings.push(finding('LEDGER_ROW_INVALID', `Applied row ${i} needs a filename and SHA-256.`));
        if (seen.has(row?.name)) findings.push(finding('LEDGER_DUPLICATE', `Applied row ${i} is duplicated.`));
        seen.add(row?.name);
        if (!names.includes(row?.name)) findings.push(finding('UNKNOWN_APPLIED_HISTORY', `Applied row ${i} is unknown to the journal.`));
        else if (row?.name !== names[i]) findings.push(finding('LEDGER_OUT_OF_ORDER', `Applied row ${i} is not a journal prefix.`));
        if (local?.name === row?.name && local.sha256 !== row?.sha256) findings.push(finding('APPLIED_HASH_MISMATCH', `Applied row ${i} differs from local SQL bytes.`));
      }
    }
  }
  let expectedSchema;
  if (!expectedSchemaPath) findings.push(finding('EXPECTED_SCHEMA_NOT_SUPPLIED', 'An explicit expected .sql schema is required for parity.'));
  else if (!expectedSchemaPath.endsWith('.sql')) findings.push(finding('EXPECTED_SCHEMA_UNSUPPORTED', 'Expected schema must be an independently supplied .sql file; TypeScript schema is not executed.'));
  else try { expectedSchema = await readFile(expectedSchemaPath, 'utf8'); }
    catch { findings.push(finding('EXPECTED_SCHEMA_MISSING', 'Supplied expected schema SQL cannot be read.')); }
  const replayResult = chain.length === names.length && !findings.some(f => ['JOURNAL_MALFORMED','JOURNAL_ENTRY_INVALID','JOURNAL_DUPLICATE','MISSING_SQL'].includes(f.code))
    ? await replay(chain, expectedSchema, findings) : null;
  findings.push(finding('HOSTED_STATE_UNVERIFIED', 'Offline inputs do not attest the hosted D1 ledger, live schema, bootstrap behavior, backup or deployment target.'));
  return { status: 'blocked-not-ready', readyForDeployment: false, boundary: boundary ?? null,
    migrations: chain.map(({ name, sha256 }) => ({ name, sha256 })), replay: replayResult, findings };
}

function parseArgs(argv) {
  // Running with no arguments inventories the current public checkout and remains blocked.
  const site = process.cwd();
  const args = { migrationsDir: join(site, 'drizzle'), journalPath: join(site, 'drizzle', 'meta', '_journal.json'),
    expectedSchemaPath: join(site, 'db', 'schema.ts'), repoRoot: site };
  const keys = { '--migrations-dir': 'migrationsDir', '--journal': 'journalPath', '--expected-schema': 'expectedSchemaPath', '--ledger': 'ledgerPath', '--repo': 'repoRoot', '--boundary': 'boundary' };
  for (let i = 0; i < argv.length; i += 2) {
    if (!keys[argv[i]] || argv[i + 1] === undefined) throw new Error('Use --migrations-dir, --journal, --expected-schema, --ledger, --repo and --boundary with values.');
    args[keys[argv[i]]] = argv[i + 1];
  }
  return args;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const result = await audit(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
