import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectSuppliedTargetEvidence,committedMigrations,writeTables} from '../scripts/d1-target-admission-preflight.mjs';
import {auditHashInput} from '../scripts/audit-chain-integrity.mjs';
import {readFile,mkdtemp,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const sha = text => createHash('sha256').update(text).digest('hex');
const schema = () => writeTables.map(name=>({type:'table',name,tableName:name,sqlSha256:sha(name)}));
const event = () => {
  const row={id:'private-id',sequence:1,actor_id:'private-actor',action:'test',target_type:'test',
    target_id:'private-target',outcome:'success',reason:'sensitive reason',occurred_at:'2026-10-06T00:00:00.000Z'};
  row.integrity_hash=sha(auditHashInput('GENESIS',row)); return row;
};
function input() {
  const row=event(), objects=schema();
  return {
    migrationLedger:committedMigrations.map(([name])=>({name})),
    sourceFileHashes:committedMigrations.map(([name,sha256])=>({name,sha256})),
    schemaCapture:objects, expectedSchema:objects.map(item=>({...item})),
    auditRows:[row],auditHead:{rows:1,sequence:1,integrityHash:row.integrity_hash},
  };
}
const safe = report => {
  assert.equal(report.targetVerified,false);
  assert.equal(report.productionReady,false);
  assert.equal(report.invitationEnabled,false);
  const serialized=JSON.stringify(report);
  for(const secret of ['private-id','private-actor','private-target','sensitive reason','SELECT','https://'])
    assert.equal(serialized.includes(secret),false);
};

test('exact production hash helper and supplied matches remain untrusted',async()=>{
  assert.equal(event().integrity_hash,sha(`GENESIS|1|private-actor|test|test|private-target|success|sensitive reason|2026-10-06T00:00:00.000Z`));
  const report=await inspectSuppliedTargetEvidence(input()); safe(report);
  assert.deepEqual([report.migration.kind,report.schema.kind,report.audit.kind],['untrusted','untrusted','untrusted']);
});
test('forged metadata and claimed verified flags never authorize a target',async()=>{
  const material=input(); material.targetVerified=true; material.productionReady=true; material.invitationEnabled=true;
  material.provenance={authenticated:true,source:'primary',snapshot:'complete'};
  const report=await inspectSuppliedTargetEvidence(material); safe(report);
});
test('ledger and committed-source pin drift refuse',async()=>{
  const material=input(); material.migrationLedger[0].name='0009_unadmitted.sql';
  let report=await inspectSuppliedTargetEvidence(material); safe(report);
  assert.deepEqual(report.migration,{kind:'mismatch',code:'MIGRATION_PIN'});
  const material2=input(); material2.sourceFileHashes[0].sha256='0'.repeat(64);
  report=await inspectSuppliedTargetEvidence(material2); safe(report);
  assert.equal(report.migration.code,'MIGRATION_PIN');
});
test('unsupported trigger and schema mismatch refuse',async()=>{
  const material=input(); material.schemaCapture.push({type:'trigger',name:'ignore_guard',tableName:writeTables[0],sqlSha256:sha('trigger')});
  let report=await inspectSuppliedTargetEvidence(material); safe(report);
  assert.deepEqual(report.schema,{kind:'mismatch',code:'UNSUPPORTED_TRIGGER'});
  const material2=input(); material2.schemaCapture[0].sqlSha256=sha('altered');
  report=await inspectSuppliedTargetEvidence(material2); safe(report);
  assert.deepEqual(report.schema,{kind:'mismatch',code:'SCHEMA_PROFILE'});
});
test('missing write table, changed head and incomplete stream refuse',async()=>{
  const material=input(); material.schemaCapture.pop(); material.auditHead.integrityHash='0'.repeat(64);
  let report=await inspectSuppliedTargetEvidence(material); safe(report);
  assert.equal(report.schema.code,'WRITE_TABLE_MISSING');
  assert.equal(report.audit.code,'HEAD_BOUNDARY_MISMATCH');
  const material2=input(); material2.auditRows=[];
  report=await inspectSuppliedTargetEvidence(material2); safe(report);
  assert.equal(report.audit.code,'HEAD_BOUNDARY_MISMATCH');
});
test('source exceptions, hostile descriptors and metadata getters are redacted and inert',async()=>{
  const material=input();
  material.auditRows={async *[Symbol.asyncIterator](){throw new Error('private-id SELECT secret');}};
  Object.defineProperty(material,'metadata',{get(){throw new Error('must not run');}});
  let report=await inspectSuppliedTargetEvidence(material); safe(report);
  assert.equal(report.audit.code,'SOURCE_FAILURE');
  const hostile=input(); Object.defineProperty(hostile.migrationLedger[0],'name',{get(){throw new Error('private-id');}});
  report=await inspectSuppliedTargetEvidence(hostile); safe(report);
  assert.equal(report.migration.code,'MIGRATION_SHAPE');
  const proxy=new Proxy({}, {getPrototypeOf(){throw new Error('private-id');}});
  report=await inspectSuppliedTargetEvidence(proxy); safe(report);
  assert.equal(report.migration.code,'INPUT_SHAPE');
});
test('no supplied write-capable callback or database method is invoked',async()=>{
  let writes=0; const material=input();
  for(const method of ['prepare','batch','run','put','delete']) Object.defineProperty(material,method,{get(){writes++;throw new Error('write');}});
  const report=await inspectSuppliedTargetEvidence(material); safe(report);
  assert.equal(writes,0);
});
test('exported nested migration pins are immutable',()=>{
  assert.equal(Object.isFrozen(committedMigrations),true);
  assert.ok(committedMigrations.every(Object.isFrozen));
  const original=committedMigrations[0][1];
  assert.throws(()=>{committedMigrations[0][1]='0'.repeat(64);},TypeError);
  assert.equal(committedMigrations[0][1],original);
});
test('exact adjacent helper drift refuses before importing changed bytes',async()=>{
  const parent=await realpath(tmpdir());
  const folder=await mkdtemp(join(parent,'vm-preflight-canonical-'));
  try {
    const moduleBytes=await readFile(new URL('../scripts/d1-target-admission-preflight.mjs',import.meta.url));
    const helperBytes=await readFile(new URL('../scripts/audit-chain-integrity.mjs',import.meta.url));
    await writeFile(join(folder,'d1-target-admission-preflight.mjs'),moduleBytes);
    await writeFile(join(folder,'audit-chain-integrity.mjs'),Buffer.concat([helperBytes,Buffer.from('\n// drift')]));
    const imported=await import(pathToFileURL(join(folder,'d1-target-admission-preflight.mjs')).href);
    const report=await imported.inspectSuppliedTargetEvidence(input()); safe(report);
    assert.deepEqual(report.audit,{kind:'untrusted',code:'AUDIT_HELPER_DRIFT'});
  } finally {
    assert.equal(dirname(await realpath(folder)),parent,'Exact disposable fixture remains inside the resolved temp directory');
    await rm(folder,{recursive:true,force:true});
  }
});
test('portable CRLF helper compares and executes the exact normalized pinned bytes',async()=>{
  const parent=await realpath(tmpdir());
  const folder=await mkdtemp(join(parent,'vm-preflight-crlf-'));
  try {
    const moduleBytes=await readFile(new URL('../scripts/d1-target-admission-preflight.mjs',import.meta.url));
    const helper=await readFile(new URL('../scripts/audit-chain-integrity.mjs',import.meta.url),'utf8');
    await writeFile(join(folder,'d1-target-admission-preflight.mjs'),moduleBytes);
    await writeFile(join(folder,'audit-chain-integrity.mjs'),helper.replaceAll('\r\n','\n').replaceAll('\n','\r\n'));
    const imported=await import(pathToFileURL(join(folder,'d1-target-admission-preflight.mjs')).href);
    const report=await imported.inspectSuppliedTargetEvidence(input());safe(report);
    assert.deepEqual(report.audit,{kind:'untrusted',code:'SUPPLIED_AUDIT_MATCH'});
  } finally {
    assert.equal(dirname(await realpath(folder)),parent,'Exact disposable CRLF fixture remains within its resolved temp directory');
    await rm(folder,{recursive:true,force:true});
  }
});
test('null/missing/function inputs and bounded arrays yield fixed redacted findings',async()=>{
  let report=await inspectSuppliedTargetEvidence(null); safe(report);
  assert.equal(report.migration.code,'INPUT');
  const missing=input(); delete missing.auditHead;
  report=await inspectSuppliedTargetEvidence(missing); safe(report);
  assert.equal(report.audit.code,'INPUT_SHAPE');
  const invalid=input(); invalid.migrationLedger=()=>{throw new Error('private-id');};
  invalid.schemaCapture=Array(513).fill(null);
  report=await inspectSuppliedTargetEvidence(invalid); safe(report);
  assert.equal(report.migration.code,'MIGRATION_INPUT');
  assert.equal(report.schema.code,'SCHEMA_BOUND');
});
test('UTF-8 mutation and invalid head refuse with exact redacted categories',async()=>{
  const changed=input(); changed.auditRows[0].reason='📚 private-id';
  let report=await inspectSuppliedTargetEvidence(changed); safe(report);
  assert.equal(report.audit.code,'HASH_MISMATCH');
  const badHead=input(); badHead.auditHead={rows:1,sequence:1,integrityHash:'bad'};
  report=await inspectSuppliedTargetEvidence(badHead); safe(report);
  assert.deepEqual(report.audit,{kind:'untrusted',code:'AUDIT_SOURCE_FAILURE'});
});
test('hostile audit getter and throwing iterator never reveal source fields',async()=>{
  const hostile=input(); Object.defineProperty(hostile.auditRows[0],'reason',{get(){throw new Error('private-id SELECT');}});
  let report=await inspectSuppliedTargetEvidence(hostile); safe(report);
  assert.equal(report.audit.code,'ROW_SHAPE');
  const iterator=input(); iterator.auditRows={async *[Symbol.asyncIterator](){throw new Error('private-id SELECT');}};
  report=await inspectSuppliedTargetEvidence(iterator); safe(report);
  assert.equal(report.audit.code,'SOURCE_FAILURE');
});
