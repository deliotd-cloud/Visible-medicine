#!/usr/bin/env node
// Offline public-source contract. Never opens a user database or applies D1 migrations.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync, constants } from 'node:sqlite';

export const PIN = {
  websiteHead: '1477f242f77356e4b989e24215121cc0c3e32a83',
  atlasSource: '3954cf5a8f7fff29bd2a253d586981d855d0fb29',
  schemaSha256: '07e27b36bc95a5ce6535d19c7bec90fc214bf2d3ee3e27f1bd6ba0ba3370b982',
  reviewSchemaSha256: 'd0aee5755b477253d71ffb9cbbdb9cafaae35f1926fd506e26cd69bfa34e0987',
  migrations: [
    ['drizzle/0000_chubby_power_man.sql', '37e81ba22dd96c45e65405a01574e4e9a4e14b1c9612a99704add378d98c3cd8'],
    ['drizzle/0001_volatile_magus.sql', 'd593f668937339a0893ab22b036f88ac1b778d358bdad708962e1e6995c4b47c'],
    ['drizzle/0002_clumsy_sage.sql', '15af2c8714541e80d5ae7d90ae4c6db703aa725a5b48acc3a767ed31600ed8e0'],
    ['drizzle/0003_old_ser_duncan.sql', 'a6a61496adde4723eba16c94d5dc28f1691054af66550dee0621d868a2c23e1a'],
    ['drizzle/0004_easy_wasp.sql', 'c5f173243ff7ce2d136e8a9209a5c91f9dcd4e7dc578fcf5458b178b4a8c6963'],
    ['drizzle/0005_volatile_black_tarantula.sql', '4690e1de79e0c0732004e9d6931ab9c7fdd0e6ed4f91144f35490be64c04a832'],
    ['drizzle/0006_broad_sasquatch.sql', '3d04e985f1e6f38e219aeb5e686558568d39470af94c0a5918c759ab85be74ee'],
    ['drizzle/0007_glamorous_luke_cage.sql', '35590354f4c03b590a60c1ac6056a72c68e4c9699e88e7c95a68d61e7b97b4a3'],
    ['drizzle/0008_solid_infant_terrible.sql', '305870905f36e9b8975776e3f48ac7554e4b32d2ab195ab81d78c7d7498d2eca'],
  ],
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const issue = (code, table, detail) => ({ code, table, detail });
function git(site, args, binary = false) {
  const result = spawnSync('git', ['-C', site, ...args], { windowsHide: true, encoding: binary ? undefined : 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Git read failed: ${args[0]}`);
  return binary ? result.stdout : result.stdout.trimEnd();
}
export function verifySourceHashes(schemaBytes, reviewBytes, pin = PIN) {
  if (hash(schemaBytes) !== pin.schemaSha256 || hash(reviewBytes) !== pin.reviewSchemaSha256)
    throw new Error('Pinned schema source hash mismatch');
}
function expectedDefault(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  throw new Error('Unsupported declared schema default');
}
function sqlDefault(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (/^'(?:[^']|'')*'$/.test(text)) return text.slice(1, -1).replaceAll("''", "'");
  if (/^true$/i.test(text)) return 1;
  if (/^false$/i.test(text)) return 0;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  return { unsupportedExpression: true };
}

export function verifyBundleGraph(metafile, site) {
  const allowedFiles = new Set(['db/schema.ts', 'atlas-review/db/schema.ts'].map(path => resolve(site, path)));
  const allowedExternal = new Set(['drizzle-orm', 'drizzle-orm/sqlite-core']);
  const inputPaths = Object.keys(metafile.inputs ?? {});
  if (inputPaths.length !== allowedFiles.size) throw new Error('Unexpected schema bundle dependency');
  for (const input of inputPaths) {
    const absolute = resolve(site, input);
    if (!allowedFiles.has(absolute)) throw new Error('Unexpected schema bundle dependency');
    for (const imported of metafile.inputs[input].imports ?? []) {
      if (imported.external) {
        if (!allowedExternal.has(imported.path)) throw new Error('Unexpected schema bundle import');
      } else if (!allowedFiles.has(resolve(site, imported.path))) throw new Error('Unexpected schema bundle import');
    }
  }
  for (const output of Object.values(metafile.outputs ?? {}))
    for (const imported of output.imports ?? [])
      if (!imported.external || !allowedExternal.has(imported.path)) throw new Error('Unexpected schema bundle output import');
}

export function extractContract(site, pin = PIN) {
  const schemaBytes = readFileSync(resolve(site, 'db/schema.ts'));
  const reviewBytes = readFileSync(resolve(site, 'atlas-review/db/schema.ts'));
  verifySourceHashes(schemaBytes, reviewBytes, pin);
  const require = createRequire(resolve(site, 'package.json'));
  const { buildSync } = require('esbuild');
  const { getTableConfig, SQLiteTable } = require('drizzle-orm/sqlite-core');
  const { is, getTableName } = require('drizzle-orm');
  const built = buildSync({ absWorkingDir: resolve(site), entryPoints: [resolve(site, 'db/schema.ts')], bundle: true, write: false,
    platform: 'node', format: 'cjs', external: ['drizzle-orm', 'drizzle-orm/*'], metafile: true });
  verifyBundleGraph(built.metafile, site);
  const scope = { exports: {} };
  new Function('module', 'exports', 'require', built.outputFiles[0].text)(scope, scope.exports, require);
  const tables = Object.values(scope.exports).filter(value => is(value, SQLiteTable)).map(getTableConfig);
  const byName = new Map();
  for (const table of tables) {
    if (byName.has(table.name)) throw new Error('Duplicate Drizzle table');
    const columns = table.columns.map(column => ({
      name: column.name, type: column.getSQLType().toUpperCase(), notNull: Boolean(column.notNull),
      default: column.hasDefault ? expectedDefault(column.default) : null, primary: Boolean(column.primary),
      unique: Boolean(column.isUnique),
    }));
    const primaryKey = table.primaryKeys.length ? table.primaryKeys[0].columns.map(column => column.name)
      : columns.filter(column => column.primary).map(column => column.name);
    const indexes = table.indexes.map(index => {
      if (index.config.where || index.config.columns.some(column => !column.name))
        throw new Error('Unsupported declared schema index');
      return { name: index.config.name, unique: Boolean(index.config.unique),
        columns: index.config.columns.map(column => column.name) };
    });
    const uniques = table.uniqueConstraints.map(unique => unique.columns.map(column => column.name));
    for (const column of columns) if (column.unique) uniques.push([column.name]);
    const foreignKeys = table.foreignKeys.map(foreign => { const ref = foreign.reference(); return {
      columns: ref.columns.map(column => column.name), targetTable: getTableName(ref.foreignTable),
      targetColumns: ref.foreignColumns.map(column => column.name),
      onUpdate: (foreign.onUpdate ?? 'no action').toUpperCase(), onDelete: (foreign.onDelete ?? 'no action').toUpperCase(),
    }; });
    byName.set(table.name, { name: table.name, columns, primaryKey, indexes, uniques,
      foreignKeys, namedChecks: table.checks.map(check => check.name) });
  }
  return { sourceSha256: { 'db/schema.ts': hash(schemaBytes), 'atlas-review/db/schema.ts': hash(reviewBytes) },
    tables: [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

function memoryDatabase() {
  if (typeof DatabaseSync.prototype.setAuthorizer !== 'function') throw new Error('SQLite authorizer unavailable');
  const db = new DatabaseSync(':memory:', { allowExtension: false, defensive: true });
  db.exec('PRAGMA temp_store=MEMORY; PRAGMA cache_spill=OFF;');
  const permitted = new Set([
    constants.SQLITE_CREATE_TABLE, constants.SQLITE_CREATE_INDEX, constants.SQLITE_CREATE_TEMP_TABLE,
    constants.SQLITE_CREATE_TEMP_INDEX, constants.SQLITE_DROP_TABLE, constants.SQLITE_DROP_INDEX,
    constants.SQLITE_DROP_TEMP_TABLE, constants.SQLITE_DROP_TEMP_INDEX, constants.SQLITE_ALTER_TABLE,
    constants.SQLITE_INSERT, constants.SQLITE_UPDATE, constants.SQLITE_DELETE, constants.SQLITE_READ,
    constants.SQLITE_SELECT, constants.SQLITE_TRANSACTION, constants.SQLITE_SAVEPOINT,
    constants.SQLITE_REINDEX, constants.SQLITE_ANALYZE,
  ]);
  db.setAuthorizer((action, first, second) => {
    let okay = permitted.has(action);
    if (action === constants.SQLITE_PRAGMA)
      okay = ['foreign_keys', 'defer_foreign_keys', 'optimize', 'table_info', 'index_list', 'index_xinfo', 'foreign_key_list'].includes(String(first).toLowerCase());
    if (action === constants.SQLITE_FUNCTION)
      okay = ['printf', 'substr', 'length', 'replace', 'coalesce', 'ifnull', 'lower', 'upper', 'trim', 'quote', 'like', 'json_valid', 'json_extract'].includes(String(second).toLowerCase()) || String(second).toLowerCase().startsWith('sqlite_rename_');
    return okay ? constants.SQLITE_OK : constants.SQLITE_DENY;
  });
  return db;
}
export function replaySql(sqlFiles) {
  const db = memoryDatabase();
  try {
    for (const sql of sqlFiles) db.exec(sql);
    return db;
  } catch {
    db.close();
    throw new Error('Restricted in-memory SQL replay refused or failed');
  }
}
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const equalColumns = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const key = columns => columns.join('\u0000');
export function compareContract(contract, db, { pendingNames = [] } = {}) {
  const findings = [];
  const pending = new Set(pendingNames);
  const tableRows = db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  const byName = new Map(tableRows.map(row => [row.name, row]));
  for (const table of contract.tables) {
    const actual = byName.get(table.name);
    if (!actual) { findings.push(issue(pending.has(table.name) ? 'PENDING_ONLY_TABLE' : 'MISSING_TABLE', table.name, 'Absent from committed replay.')); continue; }
    const rows = db.prepare(`PRAGMA table_info(${quote(table.name)})`).all();
    const cols = new Map(rows.map(row => [row.name, row]));
    for (const column of table.columns) {
      const found = cols.get(column.name);
      if (!found) { findings.push(issue('MISSING_COLUMN', table.name, column.name)); continue; }
      if (String(found.type).toUpperCase() !== column.type) findings.push(issue('TYPE_MISMATCH', table.name, column.name));
      if (Boolean(found.notnull) !== column.notNull) findings.push(issue('NULLABILITY_MISMATCH', table.name, column.name));
      if (sqlDefault(found.dflt_value) !== column.default) findings.push(issue('DEFAULT_MISMATCH', table.name, column.name));
    }
    const actualPrimary = rows.filter(row => row.pk).sort((a, b) => a.pk - b.pk).map(row => row.name);
    if (!equalColumns(actualPrimary, table.primaryKey)) findings.push(issue('PRIMARY_KEY_MISMATCH', table.name, 'Column order differs.'));
    const indexRows = db.prepare(`PRAGMA index_list(${quote(table.name)})`).all();
    const indexColumns = row => {
      if (row.partial) return null;
      const parts = db.prepare(`PRAGMA index_xinfo(${quote(row.name)})`).all().filter(part => part.key).sort((a, b) => a.seqno - b.seqno);
      if (parts.some(part => part.cid < 0 || !part.name || part.desc || String(part.coll).toUpperCase() !== 'BINARY')) return null;
      return parts.map(part => part.name);
    };
    for (const index of table.indexes) {
      const found = indexRows.find(row => row.name === index.name);
      if (!found || Boolean(found.unique) !== index.unique || !equalColumns(indexColumns(found), index.columns)) findings.push(issue('INDEX_MISMATCH', table.name, index.name));
    }
    const uniqueKeys = new Set(indexRows.filter(row => row.unique && row.origin !== 'pk').map(indexColumns).filter(Boolean).map(key));
    for (const columns of table.uniques) if (!uniqueKeys.has(key(columns))) findings.push(issue('UNIQUE_MISMATCH', table.name, columns.join(',')));
    const foreignRows = db.prepare(`PRAGMA foreign_key_list(${quote(table.name)})`).all();
    const groups = new Map();
    for (const row of foreignRows) { const group = groups.get(row.id) ?? []; group.push(row); groups.set(row.id, group); }
    const actualForeign = [...groups.values()].map(group => group.sort((a, b) => a.seq - b.seq)).map(group => ({
      columns: group.map(row => row.from), targetTable: group[0].table, targetColumns: group.map(row => row.to),
      onUpdate: group[0].on_update.toUpperCase(), onDelete: group[0].on_delete.toUpperCase(),
    }));
    for (const foreign of table.foreignKeys) if (!actualForeign.some(row => JSON.stringify(row) === JSON.stringify(foreign))) findings.push(issue('FOREIGN_KEY_MISMATCH', table.name, foreign.columns.join(',')));
    for (const name of table.namedChecks) {
      if (!new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(actual.sql)) findings.push(issue('NAMED_CHECK_MISSING', table.name, name));
    }
  }
  return { status: 'blocked-not-ready', readyForDeployment: false, tablesExpected: contract.tables.length,
    tablesInReplay: byName.size, findings, limitations: [
      'Check-name occurrences are matched; constraint binding and expression equivalence are not proved.',
      'No live D1 schema, applied ledger, data transition, runtime query or hosted deployment is attested.',
    ] };
}

export function auditSite(site) {
  const currentHead = git(site, ['rev-parse', 'HEAD']);
  git(site, ['merge-base', '--is-ancestor', PIN.websiteHead, currentHead]);
  const manifest = JSON.parse(readFileSync(resolve(site, 'atlas-review/manifest.json'), 'utf8'));
  assert.equal(manifest.revision, PIN.atlasSource);
  const contract = extractContract(site);
  const paths = git(site, ['ls-tree', '-r', '--name-only', PIN.websiteHead, '--', 'drizzle']).split(/\r?\n/).filter(path => /^drizzle\/\d{4}_.+\.sql$/.test(path));
  assert.deepEqual(paths, PIN.migrations.map(([path]) => path), 'Pinned baseline migration paths changed');
  const blobs = paths.map((path, i) => {
    const blob = git(site, ['show', `${PIN.websiteHead}:${path}`], true);
    assert.equal(hash(blob), PIN.migrations[i][1], 'Pinned baseline migration hash changed');
    return blob;
  });
  const db = replaySql(blobs.map(blob => blob.toString('utf8')));
  try {
    const pendingPath = resolve(site, 'drizzle/0009_complex_bloodscream.sql');
    const pending = existsSync(pendingPath) && git(site, ['ls-files', 'drizzle/0009_complex_bloodscream.sql']) === '';
    const result = compareContract(contract, db, { pendingNames: pending ? ['fracture_review_workbooks', 'fracture_review_answers'] : [] });
    const sourceAdmission = Object.entries(contract.sourceSha256).map(([path, workingSha256]) => {
      const committedSha256 = hash(git(site, ['show', `${currentHead}:${path}`], true));
      return { path, workingSha256, committedSha256, committedEqualsWorking: workingSha256 === committedSha256 };
    });
    return { ...result, source: contract.sourceSha256, sourceAdmission,
      replayScope: 'Immutable pinned baseline only; current or working-tree changes are not automatically replayed.',
      baselineHead: PIN.websiteHead, currentHead, atlasSource: PIN.atlasSource,
      requirements: { columns: contract.tables.reduce((n, table) => n + table.columns.length, 0),
        namedIndexes: contract.tables.reduce((n, table) => n + table.indexes.length, 0),
        uniqueConstraints: contract.tables.reduce((n, table) => n + table.uniques.length, 0),
        foreignKeys: contract.tables.reduce((n, table) => n + table.foreignKeys.length, 0),
        namedChecks: contract.tables.reduce((n, table) => n + table.namedChecks.length, 0) },
      committedMigrations: paths.map((path, i) => ({ path, sha256: hash(blobs[i]) })),
      pendingMigration: pending ? { path: 'drizzle/0009_complex_bloodscream.sql', tracked: false } : null };
  } finally { db.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const site = resolve(process.argv[2] ?? process.cwd());
    const report = auditSite(site);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 2;
  } catch {
    console.error('Independent schema contract audit could not complete safely.');
    process.exitCode = 2;
  }
}
