import assert from 'node:assert/strict';
import test from 'node:test';
import {authorizeAtlasDelivery,actualPolicy,clock,createSqlFixture,schemaEvidence} from './atlas-delivery-access-sql-source.mjs';
const learner={audience:'reviewed-learner',manifestRevision:actualPolicy.manifestRevision,approvedRevision:actualPolicy.manifestRevision};
const entitlement=(extra={})=>({organization_id:'synthetic-org',atlas_access:1,studio_access:0,status:'active',valid_until:null,...extra});
async function call(f,policy=learner,subject=f.subject){
 const before=f.sessions.length;let error;
 try{await authorizeAtlasDelivery(f.db,subject,policy,clock);}catch(cause){error=cause;}
 finally{f.verify();}
 const preflight=!subject||!/^[a-f0-9]{64}$/.test(policy.manifestRevision);
 assert.equal(f.sessions.length-before,preflight?0:1,'Exactly one primary session for every database-backed decision');
 assert(f.sessions.every(mode=>mode==='first-primary'));
 return {status:error?.status??(error?null:200),error,queries:[...f.queries]};
}
async function decide(config={},policy=learner,subject){const f=createSqlFixture(config);try{return await call(f,policy,subject===undefined?f.subject:subject);}finally{f.close();}}

test('actual source pins and seven declared tables back the SQLite fixture and exact current draft policy',()=>{
 assert.deepEqual(schemaEvidence.tableNames,['users','account_security_profiles','courses','enrolments','organizations','organization_memberships','organization_entitlements']);
 assert.equal(schemaEvidence.platformAstSha256,'c20018dcdc879c8ec1545f9bef2854a54f28e1c0e78606a38123fd0a9a5a9057');
 assert.equal(actualPolicy.audience,'administrator-review');assert.equal(actualPolicy.manifestRevision,'10b2253e7f903b3d5d39f96d2d258f1f1b511a58e5d3313d07ef86f4fee51b2f');assert.equal(Object.hasOwn(actualPolicy,'approvedRevision'),false);
});

test('anonymous and malformed releases refuse before database access or provisioning',async()=>{
 assert.equal((await decide({},actualPolicy,null)).status,401);
 for(const revision of ['', 'not-a-hash','0'.repeat(63),'A'.repeat(64)])assert.equal((await decide({},{...actualPolicy,manifestRevision:revision})).status,503);
});

test('active education account and exact external subject are required for either audience',async()=>{
 for(const policy of [actualPolicy,learner]){
  assert.equal((await decide({},policy,'unknown-synthetic-subject')).status,403);
  assert.equal((await decide({profile:false},policy)).status,403);
  assert.equal((await decide({externalSubject:'sites:foreign-subject'},policy)).status,403);
  for(const accountStatus of ['restricted','suspended','deactivated','revoked','unknown'])assert.equal((await decide({roles:'administrator',accountStatus},policy)).status,403);
 }
});

test('global administrator review remains global for an active exact administrator role',async()=>{
 for(const roles of ['administrator','learner,administrator']){
  const result=await decide({roles,organizations:[],memberships:[],entitlements:[]},actualPolicy);assert.equal(result.status,200);assert.equal(result.queries.length,1);assert(!result.queries.some(sql=>sql.includes('organization_')));
 }
 for(const roles of ['learner','educator','not-administrator','administrator-extra'])assert.equal((await decide({roles},actualPolicy)).status,403);
 assert.equal((await decide({roles:'administrator',organizations:[{id:'synthetic-org',status:'suspended'}],memberships:[{organization_id:'synthetic-org',status:'revoked'}],entitlements:[entitlement({status:'revoked',atlas_access:0})]},actualPolicy)).status,200,'Organization grants do not narrow global administrator-review policy');
 assert.equal((await decide({roles:'administrator',organizations:[],memberships:[],entitlements:[]},learner)).status,403,'Administrator role does not bypass reviewed-learner grants');
});

test('reviewed learner policy requires its exact approved revision and known audience',async()=>{
 for(const approvedRevision of [undefined,'0'.repeat(64),'foreign'])assert.equal((await decide({},{...learner,approvedRevision})).status,403);
 assert.equal((await decide({},{...learner,audience:'unknown'})).status,403);
});

test('active and evaluation Atlas grants accept only declared bit with null or canonical future expiry',async()=>{
 for(const status of ['active','evaluation'])for(const valid_until of [null,'2026-10-26T00:00:00.000Z'])assert.equal((await decide({entitlements:[entitlement({status,valid_until})]})).status,200);
});

test('expired, equal-now and malformed/noncanonical expiry fail closed in actual SQLite',async()=>{
 for(const valid_until of ['2026-10-25T12:00:00.000Z','2026-10-24T00:00:00.000Z','not-a-date','now','','2026-99-99T00:00:00.000Z','2027-02-30T00:00:00.000Z','2026-10-26T00:00:00Z','2026-10-26T00:00:00.000+00:00','2026-10-26 00:00:00.000'])assert.equal((await decide({entitlements:[entitlement({valid_until})]})).status,403,valid_until);
});

test('revoked/unknown entitlement status and absent or non-one Atlas bits refuse independently of Studio',async()=>{
 for(const status of ['revoked','expired','suspended','pending','ACTIVE','unknown'])assert.equal((await decide({entitlements:[entitlement({status})]})).status,403,status);
 for(const atlas_access of [0,2,-1,'true'])assert.equal((await decide({entitlements:[entitlement({atlas_access,studio_access:1})]})).status,403,String(atlas_access));
 assert.equal((await decide({entitlements:[]})).status,403);
});

test('suspended organization or inactive membership refuses otherwise valid Atlas grant',async()=>{
 for(const status of ['suspended','revoked','unknown']){
  assert.equal((await decide({organizations:[{id:'synthetic-org',status}]})).status,403);
  assert.equal((await decide({memberships:[{organization_id:'synthetic-org',status}]})).status,403);
 }
 assert.equal((await decide({memberships:[]})).status,403);
});

test('cross-organization grants cannot attach to another membership, while a real second membership can',async()=>{
 const organizations=[{id:'synthetic-org',status:'active'},{id:'synthetic-other',status:'active'}],entitlements=[entitlement({organization_id:'synthetic-other'})];
 assert.equal((await decide({organizations,entitlements})).status,403);
 assert.equal((await decide({organizations,entitlements,memberships:[{organization_id:'synthetic-org',status:'active'},{organization_id:'synthetic-other',status:'active'}]})).status,200);
});

test('Studio and paid-lecture enrolment never grant Atlas, and Atlas authorizer never consults them',async()=>{
 const result=await decide({roles:'educator,learner',lecture:true,entitlements:[entitlement({atlas_access:0,studio_access:1})]});assert.equal(result.status,403);
 assert(!result.queries.some(sql=>/enrolments|courses|studio_access/.test(sql)));
 assert.equal((await decide({lecture:true,organizations:[],memberships:[],entitlements:[]})).status,403);
});

test('each real helper call rechecks first-primary and observes revocation without writes or cache',async()=>{
 const f=createSqlFixture();try{
  assert.equal((await call(f)).status,200);assert.equal(f.sessions.length,1);
  f.arrangeMembershipStatus('revoked');
  assert.equal((await call(f)).status,403);assert.equal(f.sessions.length,2);assert.equal(f.queries.length,4);
 }finally{f.close();}
});