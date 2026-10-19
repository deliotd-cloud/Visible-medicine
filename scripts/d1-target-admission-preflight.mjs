// Read-only supplied-evidence diagnostic. Never certifies a live target.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Fixed adjacent helper only; no caller-selected path or module is accepted.
const auditHelperUrl = new URL('./audit-chain-integrity.mjs', import.meta.url);
const auditHelperSha256 = 'f26b39bf9d5dbbeddd77313a96956f95097fb4cf8dccaa9c542c674e59bf93e9';
export const committedMigrations = Object.freeze([
  ['0000_chubby_power_man.sql','37e81ba22dd96c45e65405a01574e4e9a4e14b1c9612a99704add378d98c3cd8'],
  ['0001_volatile_magus.sql','d593f668937339a0893ab22b036f88ac1b778d358bdad708962e1e6995c4b47c'],
  ['0002_clumsy_sage.sql','15af2c8714541e80d5ae7d90ae4c6db703aa725a5b48acc3a767ed31600ed8e0'],
  ['0003_old_ser_duncan.sql','a6a61496adde4723eba16c94d5dc28f1691054af66550dee0621d868a2c23e1a'],
  ['0004_easy_wasp.sql','c5f173243ff7ce2d136e8a9209a5c91f9dcd4e7dc578fcf5458b178b4a8c6963'],
  ['0005_volatile_black_tarantula.sql','4690e1de79e0c0732004e9d6931ab9c7fdd0e6ed4f91144f35490be64c04a832'],
  ['0006_broad_sasquatch.sql','3d04e985f1e6f38e219aeb5e686558568d39470af94c0a5918c759ab85be74ee'],
  ['0007_glamorous_luke_cage.sql','35590354f4c03b590a60c1ac6056a72c68e4c9699e88e7c95a68d61e7b97b4a3'],
  ['0008_solid_infant_terrible.sql','305870905f36e9b8975776e3f48ac7554e4b32d2ab195ab81d78c7d7498d2eca'],
].map(row => Object.freeze(row)));
export const writeTables = Object.freeze([
  'proposal_invitation_receipts','course_invitations','enrolments',
  'workbook_assignments','workbook_assignment_rules','notification_outbox',
  'audit_events','proposal_invitation_commit_guards',
]);
const hex = /^[a-f0-9]{64}$/;
const maxSchemaObjects = 512;
const own = (value,key) => {
  const descriptor = Object.getOwnPropertyDescriptor(value,key);
  if (!descriptor || !Object.hasOwn(descriptor,'value')) throw new TypeError();
  return descriptor.value;
};
const plain = value => value && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const result = (migration, schema, audit) => ({
  contract:'supplied-target-admission-diagnostic-v2',
  migration, schema, audit,
  targetVerified:false, productionReady:false, invitationEnabled:false,
});
const finding = (kind,code) => ({kind,code});

function migrationFinding(ledger, sourceHashes) {
  if (!Array.isArray(ledger) || !Array.isArray(sourceHashes)) return finding('missing','MIGRATION_INPUT');
  if (ledger.length !== committedMigrations.length || sourceHashes.length !== committedMigrations.length)
    return finding('mismatch','MIGRATION_COUNT');
  try {
    for (let i=0;i<committedMigrations.length;i++) {
      if (!plain(ledger[i]) || !plain(sourceHashes[i])) throw new TypeError();
      const [name,hash] = committedMigrations[i];
      if (own(ledger[i],'name') !== name || own(sourceHashes[i],'name') !== name ||
          own(sourceHashes[i],'sha256') !== hash) return finding('mismatch','MIGRATION_PIN');
    }
  } catch { return finding('untrusted','MIGRATION_SHAPE'); }
  // D1's applied ledger contains names, not cryptographic file identities.
  return finding('untrusted','SUPPLIED_MIGRATION_MATCH');
}

function schemaFinding(capture, expected) {
  if (!Array.isArray(capture) || !Array.isArray(expected)) return finding('missing','SCHEMA_INPUT');
  if (capture.length > maxSchemaObjects || expected.length > maxSchemaObjects)
    return finding('untrusted','SCHEMA_BOUND');
  try {
    const normalize = rows => rows.map(row => {
      if (!plain(row)) throw new TypeError();
      const type=own(row,'type'), name=own(row,'name'), tableName=own(row,'tableName'), sha256=own(row,'sqlSha256');
      if (!['table','index','trigger'].includes(type) || typeof name!=='string' || !name || name.length>128 ||
          !writeTables.includes(tableName) || typeof sha256!=='string' || !hex.test(sha256)) throw new TypeError();
      return {type,name,tableName,sha256};
    });
    const observed=normalize(capture), baseline=normalize(expected);
    const unique = rows => new Set(rows.map(row => `${row.type}\0${row.name}`)).size===rows.length;
    if (!unique(observed) || !unique(baseline)) return finding('mismatch','SCHEMA_DUPLICATE');
    if (writeTables.some(table => !observed.some(row=>row.type==='table' && row.name===table && row.tableName===table)))
      return finding('mismatch','WRITE_TABLE_MISSING');
    if (observed.some(row=>row.type==='trigger')) return finding('mismatch','UNSUPPORTED_TRIGGER');
    const key = row => `${row.type}\0${row.name}\0${row.tableName}\0${row.sha256}`;
    if (observed.map(key).sort().join('\n')!==baseline.map(key).sort().join('\n'))
      return finding('mismatch','SCHEMA_PROFILE');
  } catch { return finding('untrusted','SCHEMA_SHAPE'); }
  // Neither capture completeness nor the caller's expected SQL pins are authenticated.
  return finding('untrusted','SUPPLIED_SCHEMA_MATCH');
}

async function auditFinding(rows, head) {
  if (rows===undefined || head===undefined) return finding('missing','AUDIT_INPUT');
  try {
    const rawBytes=await readFile(auditHelperUrl);
    const bytes=Buffer.from(rawBytes.toString('utf8').replaceAll('\r\n','\n'));
    if (createHash('sha256').update(bytes).digest('hex')!==auditHelperSha256)
      return finding('untrusted','AUDIT_HELPER_DRIFT');
    // Import the exact bytes checked above, not a potentially changed path or
    // a previously cached module at that path. This helper imports node:crypto only.
    const checkedModuleUrl=`data:text/javascript;base64,${bytes.toString('base64')}`;
    const {inspectAuditChain}=await import(checkedModuleUrl);
    const report=await inspectAuditChain(rows,{expectedHead:head,maxRows:100_000,maxBytes:64*1024*1024});
    if (report.integrity!=='consistent' || report.snapshotMatches!==true)
      return finding('mismatch',report.failure?.code ?? 'AUDIT_CHAIN');
    return finding('untrusted','SUPPLIED_AUDIT_MATCH');
  } catch { return finding('untrusted','AUDIT_SOURCE_FAILURE'); }
}

/** Pure comparison of caller-supplied material. No D1, URL, arbitrary path or write API. */
export async function inspectSuppliedTargetEvidence(input) {
  try {
    if (!plain(input)) return result(finding('missing','INPUT'),finding('missing','INPUT'),finding('missing','INPUT'));
  } catch { return result(finding('untrusted','INPUT_SHAPE'),finding('untrusted','INPUT_SHAPE'),finding('untrusted','INPUT_SHAPE')); }
  let ledger,sourceHashes,schemaCapture,expectedSchema,auditRows,auditHead;
  try {
    ledger=own(input,'migrationLedger'); sourceHashes=own(input,'sourceFileHashes');
    schemaCapture=own(input,'schemaCapture'); expectedSchema=own(input,'expectedSchema');
    auditRows=own(input,'auditRows'); auditHead=own(input,'auditHead');
  } catch { return result(finding('untrusted','INPUT_SHAPE'),finding('untrusted','INPUT_SHAPE'),finding('untrusted','INPUT_SHAPE')); }
  let migration, schema;
  try { migration=migrationFinding(ledger,sourceHashes); }
  catch { migration=finding('untrusted','MIGRATION_SHAPE'); }
  try { schema=schemaFinding(schemaCapture,expectedSchema); }
  catch { schema=finding('untrusted','SCHEMA_SHAPE'); }
  return result(migration,schema,await auditFinding(auditRows,auditHead));
}
