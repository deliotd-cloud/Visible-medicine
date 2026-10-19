import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createEducationMediaRecordReader} from '../lib/education-media-records.ts';
import {createEducationMediaObjectReader} from '../lib/education-media-object-reader.ts';
import {readEducationMediaObject} from '../lib/education-media-delivery.ts';

// All identifiers, approvals and bytes below are synthetic test inputs. These
// tests never provision a real source, grant, database, bucket or DICOM decoder.
const schema=readFileSync(new URL('../scripts/education-media-records.proposed.sql',import.meta.url),'utf8');
const hex=value=>Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,'0')).join('');
async function fixture({seed=true,clearance='cleared',duringRead,caseVersion=1,allowed=()=>true}={}) {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
  const bytes=new Uint8Array([1,2,3]),hash=hex(await crypto.subtle.digest('SHA-256',bytes));
  const assessment='synthetic-assessment',caseId='synthetic-case',objectId='synthetic-object';
  const sourceId='synthetic-source',sourceRevision='source-v1',clearanceRevision='clearance-v1',key='education-media/synthetic/source-v1/object-1';
  const integrity='a'.repeat(64),publication='b'.repeat(64);
  const uids={studyInstanceUid:'1.2.3',seriesInstanceUid:'1.2.4',frameOfReferenceUid:'1.2.5',sopInstanceUid:'1.2.6'};
  function insert(table,record){const columns=Object.keys(record);sqlite.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...Object.values(record));}
  const identity={source_id:sourceId,source_revision:sourceRevision};
  if(seed){
    insert('education_media_clearance_records',{...identity,clearance_revision:clearanceRevision,state:clearance,privacy_cleared:clearance==='cleared'?1:0,commercial_use_cleared:clearance==='cleared'?1:0,object_sha256s_json:JSON.stringify([hash]),authority_record_id:'synthetic-clearance-evidence',recorded_at:'2026-10-19T00:00:00Z'});
    insert('education_media_clearance_activations',{...identity,clearance_revision:clearanceRevision,authority_record_id:'synthetic-activation-evidence',recorded_at:'2026-10-19T00:00:01Z'});
    insert('education_media_bindings',{assessment_version_id:assessment,assessment_integrity_hash:integrity,case_id:caseId,case_version:1,case_publication_hash:publication,...identity,clearance_revision:clearanceRevision,object_id:objectId,representation:'dicom-instance',study_instance_uid:uids.studyInstanceUid,series_instance_uid:uids.seriesInstanceUid,frame_of_reference_uid:uids.frameOfReferenceUid,sop_instance_uid:uids.sopInstanceUid,object_key:key,sha256:hash,byte_length:3,content_type:'application/dicom',authority_record_id:'synthetic-binding-evidence',recorded_at:'2026-10-19T00:00:02Z'});
  }
  const database={prepare(sql){return {bind(...values){return {async first(){return sqlite.prepare(sql).get(...values)??null;}};}};}};
  let storageCalls=0,authorizationCalls=0;
  const readObject=createEducationMediaObjectReader({async get(requested){storageCalls++;assert.equal(requested,key);duringRead?.({sqlite,insert,identity,hash});return {key,size:3,bodyUsed:false,body:new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}})};}});
  const dependencies={...createEducationMediaRecordReader(database),readObject,
    async loadVerifiedAssessment(){return {id:assessment,integrityHash:integrity,manifest:{product:'Visible Medicine',intendedPurpose:'education-only',workbook:{id:'synthetic-workbook'},cases:[{id:caseId,version:caseVersion,publicationHash:publication,media:{series:[{plane:'axial',...uids,sopInstanceUids:[uids.sopInstanceUid]}]}}]}};},
    async authorizeCase(actor,workbook,requestedCase){authorizationCalls++;assert.deepEqual([actor,workbook,requestedCase],['synthetic-actor','synthetic-workbook',caseId]);return allowed(authorizationCalls);},
  };
  return {sqlite,request:{actorId:'synthetic-actor',assessmentVersionId:assessment,assessmentIntegrityHash:integrity,caseId,objectId},dependencies,get storageCalls(){return storageCalls;},get authorizationCalls(){return authorizationCalls;},close(){sqlite.close();}};
}

test('real metadata SQL and bounded reader compose under the unchanged protected delivery contract',async()=>{
  const f=await fixture();try{const result=await readEducationMediaObject(f.request,f.dependencies);assert.deepEqual(result.bytes,new Uint8Array([1,2,3]));assert.equal(result.headers['Cache-Control'],'private, no-store');assert.equal(f.storageCalls,1);assert.equal(f.authorizationCalls,2);}finally{f.close();}
});

test('empty records, quarantine, wrong case revision and denied case access stop before object storage',async()=>{
  for(const [options,code] of [[{seed:false},'source-unavailable'],[{clearance:'quarantine'},'source-unavailable'],[{caseVersion:2},'revision-mismatch'],[{allowed:()=>false},'access-denied']]){
    const f=await fixture(options);try{await assert.rejects(readEducationMediaObject(f.request,f.dependencies),error=>error.code===code);assert.equal(f.storageCalls,0);}finally{f.close();}
  }
});

test('terminal source revocation during a read prevents release, without deleting historical evidence',async()=>{
  const f=await fixture({duringRead:({insert,identity})=>insert('education_media_revocations',{...identity,authority_record_id:'synthetic-revocation',recorded_at:'2026-10-19T00:01:00Z',reason_code:'synthetic-withdrawal'})});
  try{await assert.rejects(readEducationMediaObject(f.request,f.dependencies),error=>error.code==='source-unavailable');assert.equal(f.storageCalls,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM education_media_bindings').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM education_media_clearance_records').get().n,1);}finally{f.close();}
});

test('a new current clearance cannot be inherited by an immutable old binding during storage read',async()=>{
  const f=await fixture({duringRead:({insert,identity,hash})=>{
    insert('education_media_clearance_records',{...identity,clearance_revision:'clearance-v2',state:'cleared',privacy_cleared:1,commercial_use_cleared:1,object_sha256s_json:JSON.stringify([hash]),authority_record_id:'synthetic-clearance-v2',recorded_at:'2026-10-19T00:02:00Z'});
    insert('education_media_clearance_activations',{...identity,clearance_revision:'clearance-v2',authority_record_id:'synthetic-activation-v2',recorded_at:'2026-10-19T00:02:01Z'});
  }});
  try{await assert.rejects(readEducationMediaObject(f.request,f.dependencies),error=>error.code==='source-unavailable');assert.equal(f.storageCalls,1);}finally{f.close();}
});

test('revoked case access during an otherwise valid object read still prevents release',async()=>{
  const f=await fixture({allowed:count=>count===1});try{await assert.rejects(readEducationMediaObject(f.request,f.dependencies),error=>error.code==='access-denied');assert.equal(f.storageCalls,1);assert.equal(f.authorizationCalls,2);}finally{f.close();}
});

test('actual repository database exceptions are sanitized by the protected contract before storage',async()=>{
  const f=await fixture();f.close();
  await assert.rejects(readEducationMediaObject(f.request,f.dependencies),error=>error.code==='delivery-unavailable'&&error.message==='Protected Education images are unavailable for this request.');
  assert.equal(f.storageCalls,0);
});
