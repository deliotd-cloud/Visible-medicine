import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createEducationMediaRecordReader} from '../lib/education-media-records.ts';

const schema = readFileSync(new URL('../scripts/education-media-records.proposed.sql', import.meta.url), 'utf8');
const hash = character => character.repeat(64);
const binding = {
  assessmentVersionId: 'version-1', assessmentIntegrityHash: hash('a'), caseId: 'case-1',
  caseVersion: 2, casePublicationHash: hash('b'), sourceId: 'source-1', sourceRevision: 'source-rev-1',
  clearanceRevision: 'clearance-1', objectId: 'object-1', representation: 'dicom-instance',
  studyInstanceUid: '1.2.3', seriesInstanceUid: '1.2.3.4', frameOfReferenceUid: '1.2.3.5',
  sopInstanceUid: '1.2.3.6', objectKey: 'education-media/synthetic-object', sha256: hash('c'),
  byteLength: 4, contentType: 'application/dicom',
};
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(schema);
  const insertClearance = sqlite.prepare(`INSERT INTO education_media_clearance_records
    (source_id, source_revision, clearance_revision, state, privacy_cleared,
     commercial_use_cleared, object_sha256s_json, authority_record_id, recorded_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`);
  const activate = sqlite.prepare(`INSERT INTO education_media_clearance_activations
    (source_id, source_revision, clearance_revision, authority_record_id, recorded_at)
    VALUES (?1, ?2, ?3, ?4, ?5)`);
  const insertBinding = sqlite.prepare(`INSERT INTO education_media_bindings
    (assessment_version_id, assessment_integrity_hash, case_id, case_version,
     case_publication_hash, source_id, source_revision, clearance_revision, object_id,
     representation, study_instance_uid, series_instance_uid, frame_of_reference_uid,
     sop_instance_uid, object_key, sha256, byte_length, content_type, authority_record_id, recorded_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)`);
  insertClearance.run(binding.sourceId, binding.sourceRevision, binding.clearanceRevision,
    'cleared', 1, 1, JSON.stringify([binding.sha256]), 'clearance-evidence-1', '2026-10-19T00:00:00Z');
  activate.run(binding.sourceId, binding.sourceRevision, binding.clearanceRevision,
    'activation-evidence-1', '2026-10-19T00:00:01Z');
  const bindingValues = [binding.assessmentVersionId, binding.assessmentIntegrityHash, binding.caseId,
    binding.caseVersion, binding.casePublicationHash, binding.sourceId, binding.sourceRevision,
    binding.clearanceRevision, binding.objectId, binding.representation, binding.studyInstanceUid,
    binding.seriesInstanceUid, binding.frameOfReferenceUid, binding.sopInstanceUid,
    binding.objectKey, binding.sha256, binding.byteLength, binding.contentType,
    'binding-evidence-1', '2026-10-19T00:00:02Z'];
  insertBinding.run(...bindingValues);
  const calls = [];
  const shaped = transform => ({prepare(sql) {
    calls.push({sql, values: null});
    return {bind(...values) {
      calls.at(-1).values = values;
      return {async first() {return transform(sqlite.prepare(sql).get(...values) ?? null, sql);}};
    }};
  }});
  return {sqlite, calls, reader: createEducationMediaRecordReader(shaped(row => row)),
    transformed: transform => createEducationMediaRecordReader(shaped(transform)),
    insertBinding, bindingValues, insertClearance, activate, close: () => sqlite.close()};
}

test('empty schema and unactivated clearance have no readable media record', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(schema);
    const reader = createEducationMediaRecordReader({prepare(sql) {return {bind(...values) {
      return {async first() {return sqlite.prepare(sql).get(...values) ?? null;}};
    }};}});
    assert.equal(await reader.loadBinding('version-1','case-1','object-1'),null);
    assert.equal(await reader.loadClearance('source-1','source-rev-1'),null);
    sqlite.prepare(`INSERT INTO education_media_clearance_records
      (source_id,source_revision,clearance_revision,state,privacy_cleared,
       commercial_use_cleared,object_sha256s_json,authority_record_id,recorded_at)
      VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`)
      .run('source-1','source-rev-1','clearance-1','cleared',1,1,
        JSON.stringify([binding.sha256]),'unactivated-evidence','2026-10-19T00:00:00Z');
    assert.equal(await reader.loadClearance('source-1','source-rev-1'),null,
      'an immutable record is not automatically the current clearance');
  } finally {sqlite.close();}
});

test('exact prepared reads return defensive binding and current clearance snapshots', async () => {
  const f = fixture();
  try {
    const b = await f.reader.loadBinding('version-1', 'case-1', 'object-1');
    const c = await f.reader.loadClearance('source-1', 'source-rev-1');
    assert.deepEqual(b, binding);
    assert.deepEqual(c, {sourceId:'source-1',sourceRevision:'source-rev-1',clearanceRevision:'clearance-1',
      state:'cleared',privacyCleared:true,commercialUseCleared:true,objectSha256s:[binding.sha256]});
    assert.deepEqual(f.calls.map(call => call.values), [['version-1','case-1','object-1'],['source-1','source-rev-1']]);
    assert(f.calls.every(call => call.sql.includes('?1') && !call.sql.includes("'version-1'")));
    b.objectKey = 'education-media/changed'; c.objectSha256s[0] = hash('d');
    assert.equal((await f.reader.loadBinding('version-1','case-1','object-1')).objectKey,binding.objectKey);
    assert.deepEqual((await f.reader.loadClearance('source-1','source-rev-1')).objectSha256s,[binding.sha256]);
    assert.equal(await f.reader.loadBinding('wrong','case-1','object-1'),null);
    assert.equal(await f.reader.loadBinding('version-1','wrong','object-1'),null);
    assert.equal(await f.reader.loadBinding('version-1','case-1','wrong'),null);
    assert.equal(await f.reader.loadClearance('wrong','source-rev-1'),null);
    assert.equal(await f.reader.loadClearance('source-1','wrong'),null);
    const count=f.calls.length;
    assert.equal(await f.reader.loadBinding("version-1' OR 1=1--",'case-1','object-1'),null);
    assert.equal(await f.reader.loadClearance("source-1';DROP TABLE education_media_bindings;--",'source-rev-1'),null);
    assert.equal(f.calls.length,count,'invalid untrusted keys never reach SQL');
  } finally {f.close();}
});

test('malformed, oversized and wrong-tuple rows fail closed', async () => {
  const f = fixture();
  try {
    for (const patch of [{assessment_version_id:'other'}, {case_id:'other'}, {object_id:'other'},
      {source_id:''}, {source_revision:'invalid source revision'}, {clearance_revision:''},
      {sha256:'bad'}, {case_version:0}, {byte_length:16777217}, {object_key:'../clinical'},
      {representation:'bitmap'}]) {
      const reader=f.transformed((row,sql)=>sql.includes('education_media_bindings b')?{...row,...patch}:row);
      assert.equal(await reader.loadBinding('version-1','case-1','object-1'),null,JSON.stringify(patch));
    }
    for (const patch of [{source_id:'other'}, {source_revision:'other'}, {clearance_revision:''},
      {state:'unknown'}, {privacy_cleared:2}, {object_sha256s_json:'{'},
      {object_sha256s_json:'x'.repeat(65537)}, {object_sha256s_json:JSON.stringify([hash('c'),'bad'])},
      {object_sha256s_json:JSON.stringify(Array(257).fill(hash('c')))}]) {
      const reader=f.transformed((row,sql)=>sql.includes('education_media_clearance_current c')?{...row,...patch}:row);
      assert.equal(await reader.loadClearance('source-1','source-rev-1'),null,JSON.stringify(patch).slice(0,90));
    }
  } finally {f.close();}
});

test('historical identities cannot be duplicated or overwritten; current change and terminal revocation refuse delivery', async () => {
  const f=fixture();
  try {
    assert.throws(()=>f.insertBinding.run(...f.bindingValues));
    assert.throws(()=>f.sqlite.prepare("UPDATE education_media_bindings SET object_key='education-media/other'").run());
    assert.throws(()=>f.sqlite.prepare('DELETE FROM education_media_bindings').run());
    assert.throws(()=>f.insertClearance.run('source-1','source-rev-1','clearance-1','cleared',1,1,
      JSON.stringify([binding.sha256]),'new-evidence','2026-10-19T01:00:00Z'));
    f.insertClearance.run('source-1','source-rev-1','clearance-2','quarantine',0,0,
      JSON.stringify([binding.sha256]),'clearance-evidence-2','2026-10-19T01:00:00Z');
    f.activate.run('source-1','source-rev-1','clearance-2','activation-evidence-2','2026-10-19T01:00:01Z');
    assert.equal(await f.reader.loadBinding('version-1','case-1','object-1'),null,'old binding cannot inherit new clearance');
    assert.equal((await f.reader.loadClearance('source-1','source-rev-1')).state,'quarantine');
    assert.throws(()=>f.activate.run('source-1','source-rev-1','clearance-1','rollback','2026-10-19T02:00:00Z'));
    f.sqlite.prepare(`INSERT INTO education_media_revocations
      (source_id,source_revision,authority_record_id,recorded_at,reason_code) VALUES (?1,?2,?3,?4,?5)`)
      .run('source-1','source-rev-1','revocation-evidence-1','2026-10-19T03:00:00Z','rights-withdrawn');
    assert.equal(await f.reader.loadBinding('version-1','case-1','object-1'),null);
    assert.equal((await f.reader.loadClearance('source-1','source-rev-1')).state,'revoked');
    f.insertClearance.run('source-1','source-rev-1','clearance-3','cleared',1,1,
      JSON.stringify([binding.sha256]),'clearance-evidence-3','2026-10-19T04:00:00Z');
    f.activate.run('source-1','source-rev-1','clearance-3','activation-evidence-3','2026-10-19T04:00:01Z');
    assert.equal((await f.reader.loadClearance('source-1','source-rev-1')).state,'revoked','later activation cannot undo terminal revocation');
    assert.equal(await f.reader.loadBinding('version-1','case-1','object-1'),null);
    assert.throws(()=>f.sqlite.prepare('DELETE FROM education_media_revocations').run());
    assert.throws(()=>f.sqlite.prepare("UPDATE education_media_revocations SET reason_code='other'").run());
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS count FROM education_media_clearance_records').get().count,3,'evidence remains');
  } finally {f.close();}
});
