// Read-only metadata prototype. A caller selects/injects the D1 binding; this module has no connector.
// Fixed read statements only. This is evidence collection, never target admission.
const MIGRATIONS = Object.freeze([
  '0000_chubby_power_man.sql', '0001_volatile_magus.sql',
  '0002_clumsy_sage.sql', '0003_old_ser_duncan.sql',
  '0004_easy_wasp.sql', '0005_volatile_black_tarantula.sql',
  '0006_broad_sasquatch.sql', '0007_glamorous_luke_cage.sql',
  '0008_solid_infant_terrible.sql',
]);
const MAX_OBJECTS = 512;
const MAX_MIGRATION_NAME_BYTES = 128;
const MAX_SCHEMA_IDENTIFIER_BYTES = 256;
const MAX_SQL_BYTES = 256 * 1024;
const MAX_TOTAL_SQL_BYTES = 4 * 1024 * 1024;
const MAX_BOOKMARK_BYTES = 1024;
const SQL = Object.freeze({
  ledgerCount: 'SELECT COUNT(*) AS count FROM d1_migrations',
  ledger: `SELECT id, length(CAST(name AS BLOB)) AS nameBytes, CASE WHEN length(CAST(name AS BLOB)) <= ${MAX_MIGRATION_NAME_BYTES} THEN name ELSE NULL END AS name FROM d1_migrations ORDER BY id LIMIT ${MIGRATIONS.length + 1}`,
  schemaCount: "SELECT COUNT(*) AS count, COALESCE(SUM(length(CAST(sql AS BLOB))),0) AS totalBytes FROM sqlite_master WHERE type IN ('table','index','view','trigger')",
  schema: `SELECT type, length(CAST(name AS BLOB)) AS nameBytes, CASE WHEN length(CAST(name AS BLOB)) <= ${MAX_SCHEMA_IDENTIFIER_BYTES} THEN name ELSE NULL END AS name, length(CAST(tbl_name AS BLOB)) AS tableNameBytes, CASE WHEN length(CAST(tbl_name AS BLOB)) <= ${MAX_SCHEMA_IDENTIFIER_BYTES} THEN tbl_name ELSE NULL END AS tableName, length(CAST(sql AS BLOB)) AS sqlBytes, CASE WHEN length(CAST(sql AS BLOB)) <= ${MAX_SQL_BYTES} THEN sql ELSE NULL END AS sql FROM sqlite_master WHERE type IN ('table','index','view','trigger') ORDER BY sqlite_master.type, sqlite_master.name LIMIT ${MAX_OBJECTS + 1}`,
});
const encoder = new TextEncoder();
const fixedFailure = code => ({
  contract: 'd1-target-readonly-capture-prototype-v5',
  status: 'refused', code,
  targetVerified: false, productionReady: false, invitationEnabled: false,
});
const own = (row, key) => Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined;
const integer = value => Number.isSafeInteger(value) && value >= 0;
const countOf = row => row && integer(own(row, 'count')) ? row.count : null;
const bytesOf = row => row && integer(own(row, 'totalBytes')) ? row.totalBytes : null;
const validName = value => typeof value === 'string' && value.length > 0 && value.length <= 256 && !/[\u0000-\u001f\u007f]/u.test(value);

// SQLite BINARY ordering of UTF-8 text is not JavaScript UTF-16 ordering.
function compareBytes(left, right) {
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return left.length - right.length;
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
async function first(session, sql) {
  return session.prepare(sql).first();
}
async function rows(session, sql) {
  const response = await session.prepare(sql).all();
  if (!response || response.success !== true || !Array.isArray(response.results)) throw new Error('QUERY');
  return response.results;
}
function validateLedger(rowsRead, count) {
  if (count !== MIGRATIONS.length || rowsRead.length !== count) return null;
  let prior = 0;
  const names = [], entries = [];
  for (let i = 0; i < count; i++) {
    const row = rowsRead[i];
    if (!row || !Number.isSafeInteger(row.id) || row.id <= prior ||
        !validName(row.name) || !integer(row.nameBytes) ||
        row.nameBytes > MAX_MIGRATION_NAME_BYTES ||
        encoder.encode(row.name).byteLength !== row.nameBytes ||
        row.name !== MIGRATIONS[i]) return null;
    prior = row.id;
    names.push(row.name);
    entries.push({ id: row.id, name: row.name });
  }
  return { names, entries };
}
async function validateSchema(rowsRead, count) {
  if (count > MAX_OBJECTS || rowsRead.length !== count) return null;
  const objects = [];
  const seen = new Set();
  let totalBytes = 0;
  let previous = null;
  for (let i = 0; i < rowsRead.length; i++) {
    const row = rowsRead[i];
    if (!row || !['table', 'index', 'view', 'trigger'].includes(row.type) ||
        !validName(row.name) || !validName(row.tableName) ||
        !integer(row.nameBytes) || row.nameBytes > MAX_SCHEMA_IDENTIFIER_BYTES ||
        encoder.encode(row.name).byteLength !== row.nameBytes ||
        !integer(row.tableNameBytes) || row.tableNameBytes > MAX_SCHEMA_IDENTIFIER_BYTES ||
        encoder.encode(row.tableName).byteLength !== row.tableNameBytes) return null;
    // Trigger names occupy a separate SQLite namespace from tables/views.
    const identity = `${row.type}\u0000${row.name}`;
    const order = encoder.encode(identity);
    if (seen.has(identity) || (previous !== null && compareBytes(order, previous) <= 0)) return null;
    previous = order;
    seen.add(identity);
    if (row.type === 'table' && row.tableName !== row.name) return null;
    if (row.sql === null) {
      if (row.sqlBytes !== null || row.type !== 'index' || !row.name.startsWith('sqlite_autoindex_')) return null;
      objects.push({ type: row.type, name: row.name, tableName: row.tableName,
        system: true, sqlKind: 'automatic-index-null', sqlSha256: null });
      rowsRead[i] = null;
      continue;
    }
    if (typeof row.sql !== 'string' || !row.sql) return null;
    const sqlBytes = encoder.encode(row.sql);
    if (!integer(row.sqlBytes) || row.sqlBytes !== sqlBytes.byteLength) return null;
    totalBytes += sqlBytes.byteLength;
    if (sqlBytes.byteLength > MAX_SQL_BYTES || totalBytes > MAX_TOTAL_SQL_BYTES) return null;
    objects.push({ type: row.type, name: row.name, tableName: row.tableName,
      system: row.name.startsWith('sqlite_'), sqlKind: 'stored-sql',
      sqlSha256: await sha256(sqlBytes) });
    // Release the query result's raw SQL as soon as its hash is recorded.
    rowsRead[i] = null;
  }
  if (!objects.some(object => object.type === 'table' && object.name === 'd1_migrations')) return null;
  return { objects, totalBytes };
}

/** Collect bounded metadata from an operator-selected binding; no URL, path or SQL input. */
export async function captureSelectedD1(db, operatorTargetLabel) {
  try {
    if (!db || typeof db.withSession !== 'function' ||
        typeof operatorTargetLabel !== 'string' ||
        !/^[a-z0-9][a-z0-9._-]{0,63}$/u.test(operatorTargetLabel))
      return fixedFailure('INPUT');
    const startedAt = new Date().toISOString();
    const session = db.withSession('first-primary');
    if (!session || typeof session.prepare !== 'function' || typeof session.getBookmark !== 'function')
      return fixedFailure('SESSION');
    const ledgerCount = countOf(await first(session, SQL.ledgerCount));
    const firstSchemaSummary = await first(session, SQL.schemaCount);
    const schemaCount = countOf(firstSchemaSummary);
    const schemaBytes = bytesOf(firstSchemaSummary);
    if (ledgerCount === null || schemaCount === null || schemaBytes === null)
      return fixedFailure('COUNT_PROFILE');
    if (ledgerCount !== MIGRATIONS.length) return fixedFailure('LEDGER_BOUNDARY');
    if (schemaCount > MAX_OBJECTS || schemaBytes > MAX_TOTAL_SQL_BYTES) return fixedFailure('SCHEMA_BOUND');
    const firstLedger = validateLedger(await rows(session, SQL.ledger), ledgerCount);
    if (!firstLedger) return fixedFailure('LEDGER_PROFILE');
    const firstSchema = await validateSchema(await rows(session, SQL.schema), schemaCount);
    if (!firstSchema || firstSchema.totalBytes !== schemaBytes) return fixedFailure('SCHEMA_PROFILE');
    // The tested local D1 binding denies PRAGMA schema_version. Re-read
    // independently and compare validated identities/hashes, not just counts.
    const endLedgerCount = countOf(await first(session, SQL.ledgerCount));
    const lastSchemaSummary = await first(session, SQL.schemaCount);
    const endSchemaCount = countOf(lastSchemaSummary);
    const endSchemaBytes = bytesOf(lastSchemaSummary);
    if (endLedgerCount !== ledgerCount || endSchemaCount !== schemaCount ||
        endSchemaBytes !== schemaBytes)
      return fixedFailure('OBSERVED_DRIFT');
    const finalLedger = validateLedger(await rows(session, SQL.ledger), endLedgerCount);
    if (!finalLedger || JSON.stringify(finalLedger.entries) !== JSON.stringify(firstLedger.entries))
      return fixedFailure('OBSERVED_DRIFT');
    const finalSchema = await validateSchema(await rows(session, SQL.schema), endSchemaCount);
    if (!finalSchema || finalSchema.totalBytes !== endSchemaBytes ||
        JSON.stringify(finalSchema.objects) !== JSON.stringify(firstSchema.objects))
      return fixedFailure('OBSERVED_DRIFT');
    const bookmark = session.getBookmark();
    if (bookmark !== null && (typeof bookmark !== 'string' || !bookmark ||
        bookmark.length > MAX_BOOKMARK_BYTES)) return fixedFailure('BOOKMARK');
    const bookmarkBytes = bookmark === null ? null : encoder.encode(bookmark);
    if (bookmarkBytes && bookmarkBytes.byteLength > MAX_BOOKMARK_BYTES) return fixedFailure('BOOKMARK');
    const payload = { ledgerEntries: firstLedger.entries, schemaObjects: firstSchema.objects };
    const captureSha256 = await sha256(encoder.encode(JSON.stringify(payload)));
    return {
      contract: 'd1-target-readonly-capture-prototype-v5', status: 'captured-unverified',
      selectedTargetLabelSha256: await sha256(encoder.encode(operatorTargetLabel)),
      startedAt, endedAt: new Date().toISOString(),
      sessionConstraint: 'first-primary', bookmarkSha256: bookmarkBytes ? await sha256(bookmarkBytes) : null,
      captureSha256, appliedMigrationNames: firstLedger.names,
      appliedMigrationLedger: firstLedger.entries,
      schemaObjectCount: schemaCount, schemaObjects: firstSchema.objects,
      triggerCount: firstSchema.objects.filter(object => object.type === 'trigger').length,
      consistency: 'sequential-session-only; not an atomic whole-database snapshot',
      audit: 'not-captured', expectedSchema: 'not-supplied', sourceFileHashes: 'not-captured',
      targetVerified: false, productionReady: false, invitationEnabled: false,
    };
  } catch {
    // Database/host exceptions may contain SQL or private data: never reflect them.
    return fixedFailure('QUERY_OR_HASH');
  }
}

export const captureContractForTests = Object.freeze({
  SQL, MIGRATIONS, MAX_OBJECTS, MAX_MIGRATION_NAME_BYTES,
  MAX_SCHEMA_IDENTIFIER_BYTES, MAX_BOOKMARK_BYTES,
});
