import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// The optional explicit root is for proposal verification only. Exact source
// and table hashes below remain mandatory; there is no alternate/fallback policy.
const root=process.env.CLINICAL_REVIEW_TEST_ROOT
 ?pathToFileURL(resolve(process.env.CLINICAL_REVIEW_TEST_ROOT)+'/')
 :new URL('../',import.meta.url);
const require=createRequire(new URL('package.json',root)),ts=require('typescript');
const sha=value=>createHash('sha256').update(value).digest('hex');
const bytes=readFileSync(new URL('lib/clinical-review-access.ts',root));
assert.equal(sha(bytes),'37f4f7a9c228dae469ce8b7b6b7cc2e8220c27a347d9f74c420b057a56780d7a');
const source=stripTypeScriptTypes(bytes.toString('utf8'),{mode:'strip'});
const {clinicalReviewPrincipal,ClinicalReviewAccessError}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const tablePins=new Map([
 ['users','04546e18e8e3b1363c170d83079f48bc177ae79dafd742f6265339493396bc7b'],
 ['account_security_profiles','a0e270ecf6cfcf24d93dd4ac12d159fe335cf88f00f3a3a76e48940e656163bd'],
 ['organizations','d70c87f61ec712a417fbf15dd7a260cab620745affde2b23da38d463736186cf'],
 ['organization_memberships','6f3e5fbb5de4628c1fdbea3da0187deec4e72e33162fd3f601a1481b3ef00a20'],
]);
const schema=new Map();
for(const path of ['db/bootstrap.ts','db/platform.ts']){
 const tree=ts.createSourceFile(path,readFileSync(new URL(path,root),'utf8'),ts.ScriptTarget.Latest,true);
 function visit(node){
  if(ts.isNoSubstitutionTemplateLiteral(node)){
   const name=/^CREATE TABLE IF NOT EXISTS ([a-z_]+) \(/.exec(node.text)?.[1];
   if(tablePins.has(name)){assert(!schema.has(name));assert.equal(sha(node.text),tablePins.get(name));schema.set(name,node.text);}
  }
  ts.forEachChild(node,visit);
 }
 visit(tree);
}
assert.deepEqual([...schema.keys()].sort(),[...tablePins.keys()].sort());
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 for(const sql of schema.values())sqlite.exec(sql);
 const sessions=[],queries=[];
 const session={prepare(sql){
  assert.match(sql,/^\s*SELECT\b/i,'The principal may issue SELECT only');
  return {bind(...values){return {async first(){queries.push({sql,values});return sqlite.prepare(sql).get(...values)??null;}};}};
 }};
 const db={withSession(hint){assert.equal(hint,'first-primary');sessions.push(hint);return session;}};
 function insert(table,values){const keys=Object.keys(values);sqlite.prepare('INSERT INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').run(...Object.values(values));}
 const at='2026-01-01T00:00:00.000Z';
 function user(subject,roles='administrator',status='active'){
  insert('users',{id:'edu:'+subject,external_subject:'sites:'+subject,email:subject+'@example.invalid',display_name:'Synthetic principal',roles,created_at:at,last_seen_at:at});
  insert('account_security_profiles',{user_id:'edu:'+subject,status,identity_provider:'synthetic',registered_at:at,last_authenticated_at:at,terms_version:'',privacy_version:'',updated_at:at});
 }
 function organization(id,status='active',created=at){insert('organizations',{id,slug:id,name:'Synthetic institution',kind:'institution',status,created_at:created});}
 function membership(subject,org,role='owner',status='active'){insert('organization_memberships',{organization_id:org,user_id:'edu:'+subject,role,status,joined_at:at});}
 return {sqlite,sessions,queries,session,db,user,organization,membership,
  principal:subject=>clinicalReviewPrincipal(db,subject),close(){sqlite.close();}};
}
const denied=(f,subject,status)=>assert.rejects(f.principal(subject),error=>error instanceof ClinicalReviewAccessError&&error.status===status);
test('actual schema principal denies missing or inactive identity before returning a partition; queries are primary SELECT only',async()=>{
 const f=fixture();try{
  await denied(f,null,401);assert.equal(f.sessions.length,0);assert.equal(f.queries.length,0);
  await denied(f,'missing',403);
  f.user('inactive','administrator','restricted');f.organization('institution-a');f.membership('inactive','institution-a');
  await denied(f,'inactive',403);
  f.user('missing-profile');f.sqlite.prepare("DELETE FROM account_security_profiles WHERE user_id='edu:missing-profile'").run();f.membership('missing-profile','institution-a');
  await denied(f,'missing-profile',403);
  f.user('mismatch');f.membership('mismatch','institution-a');
  f.sqlite.prepare("UPDATE users SET external_subject='sites:someone-else' WHERE id='edu:mismatch'").run();
  await denied(f,'mismatch',403);
  assert.equal(f.sessions.length,4);assert.equal(f.queries.length,4);
  assert.deepEqual(f.queries.at(-1).values,['edu:mismatch','sites:mismatch']);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM users').get().n,3,'No unknown identity was provisioned');
 }finally{f.close();}
});
test('website administrator and same-actor institution owner/admin must intersect; general staff and learner memberships cannot borrow authority',async()=>{
 const f=fixture();try{
  f.organization('institution-a');f.organization('institution-b');
  for(const role of ['owner','administrator','educator','learner']){
   const subject='member-'+role;f.user(subject);f.membership(subject,'institution-a',role);
   if(['owner','administrator'].includes(role)){const p=await f.principal(subject);assert.equal(p.organizationId,'institution-a');assert.equal(p.session,f.session);}
   else await denied(f,subject,403);
  }
  for(const role of ['instructor','examiner','learner']){f.user(role,role);f.membership(role,'institution-a','owner');await denied(f,role,403);}
  f.user('admin-no-membership');f.user('different-owner','instructor');f.membership('different-owner','institution-b','owner');
  await denied(f,'admin-no-membership',403);await denied(f,'different-owner',403);
 }finally{f.close();}
});
test('suspended institutions and revoked memberships are excluded before deterministic eligible-institution selection',async()=>{
 const f=fixture();try{
  f.user('reviewer');f.organization('suspended','suspended','2000-01-01T00:00:00.000Z');f.membership('reviewer','suspended');
  await denied(f,'reviewer',403);
  f.organization('revoked','active','2001-01-01T00:00:00.000Z');f.membership('reviewer','revoked','administrator','revoked');
  await denied(f,'reviewer',403);
  f.organization('educator-first','active','2002-01-01T00:00:00.000Z');f.membership('reviewer','educator-first','educator');
  await denied(f,'reviewer',403);
  // Insert tie candidates in reverse order; the helper must use created_at,id.
  f.organization('institution-b');f.organization('institution-a');f.membership('reviewer','institution-b');f.membership('reviewer','institution-a','administrator');
  assert.equal((await f.principal('reviewer')).organizationId,'institution-a');
  f.sqlite.prepare("UPDATE organizations SET created_at='2025-01-01T00:00:00.000Z' WHERE id='institution-b'").run();
  assert.equal((await f.principal('reviewer')).organizationId,'institution-b');
 }finally{f.close();}
});
test('exact storage keys partition users and institutions and restore only the same original partition',async()=>{
 const f=fixture();try{
  f.user('reviewer');f.user('second');f.organization('institution-a');f.organization('institution-b');
  f.membership('reviewer','institution-a');f.membership('reviewer','institution-b');f.membership('second','institution-a');
  const a=await f.principal('reviewer'),other=await f.principal('second');
  assert.equal(a.storageKey,JSON.stringify(['vm-website-personal-review-1','edu:reviewer','institution-a']));
  assert.equal(other.storageKey,JSON.stringify(['vm-website-personal-review-1','edu:second','institution-a']));
  assert.notEqual(a.storageKey,other.storageKey);
  f.sqlite.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id='edu:reviewer' AND organization_id='institution-a'").run();
  const b=await f.principal('reviewer');
  assert.equal(b.storageKey,JSON.stringify(['vm-website-personal-review-1','edu:reviewer','institution-b']));assert.notEqual(b.storageKey,a.storageKey);
  f.sqlite.prepare("UPDATE organization_memberships SET status='active' WHERE user_id='edu:reviewer' AND organization_id='institution-a'").run();
  assert.equal((await f.principal('reviewer')).storageKey,a.storageKey);
  assert(f.queries.every(q=>/^\s*SELECT\b/i.test(q.sql)));
 }finally{f.close();}
});
