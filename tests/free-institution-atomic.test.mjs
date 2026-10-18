import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'package.json'));
const {build}=require('esbuild');
const env={};globalThis.__atomicEnv=env;
const source=readFileSync(resolve(root,'lib/education-platform.ts'),'utf8').replaceAll('\r\n','\n');
// Compile the actual canonical function, never a staged source replacement.
const entry=source;
const stubs={
 'cloudflare:workers':'export const env=globalThis.__atomicEnv;',
 '@/db/bootstrap':'export async function ensureEducationUser(){return {status:"active",identityProvider:"external-identity",localDemo:globalThis.__freeAdmissionDemo??false,bootstrapDefaultOrganization:true};} export async function ensureDatabase(){} export async function appendAudit(){throw Error("Unexpected old audit path");}',
 '@/db/platform':'export async function ensurePlatformSchema(){} export async function getPlatformSnapshot(){throw Error("Unexpected snapshot");}',
 '@/lib/domain':'export async function sha256(v){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,"0")).join("");}',
 '@/lib/studio-templates':'export function studioTemplate(){throw Error("Unexpected template");}',
 '@/lib/transactional-email':'export function getEmailProviderConfig(){return {publicSiteUrl:null};} export function courseEnrolmentEmail(){return {subject:"synthetic",text:"synthetic"};} export async function sendTransactionalEmail(){globalThis.__atomicEnv.sent++;return {status:"held",reason:"TEST_NO_SEND",sentAt:null};}',
};
const bundle=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{},plugins:[{name:'seams',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(stubs,a.path))return {path:a.path,namespace:'stub'};if(['@/lib/account-policy','@/lib/course-enrolment-policy'].includes(a.path))return {path:resolve(root,a.path.slice(2)+'.ts')};});b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],loader:'js'}));}}]});
const {enrolInCourse}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const schema=`CREATE TABLE course_releases(id TEXT PRIMARY KEY,course_id TEXT,status TEXT,enrolment_open INTEGER,access_model TEXT,visibility TEXT,organization_id TEXT,slug TEXT,title TEXT);
CREATE TABLE enrolments(id TEXT PRIMARY KEY,user_id TEXT,course_id TEXT,status TEXT,enrolled_at TEXT,UNIQUE(user_id,course_id));
CREATE TABLE workbooks(id TEXT PRIMARY KEY,status TEXT);
CREATE TABLE course_release_workbooks(release_id TEXT,workbook_id TEXT,position INTEGER);
CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT,assigned_by TEXT,assigned_at TEXT,due_at TEXT,revoked_at TEXT,version INTEGER,UNIQUE(workbook_id,learner_id));
CREATE TABLE workbook_assignment_rules(assignment_id TEXT PRIMARY KEY,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER,updated_at TEXT);
CREATE TABLE organization_memberships(organization_id TEXT,user_id TEXT,status TEXT);
CREATE TABLE account_security_profiles(user_id TEXT PRIMARY KEY,status TEXT,identity_provider TEXT,terms_version TEXT,privacy_version TEXT,terms_accepted_at TEXT,privacy_accepted_at TEXT);
CREATE TABLE learner_profiles(user_id TEXT PRIMARY KEY,onboarding_status TEXT,training_stage TEXT,discipline TEXT,interests_json TEXT,institution_name TEXT,country_code TEXT,timezone TEXT,marketing_opt_in INTEGER,updated_at TEXT);
CREATE TABLE audit_events(id TEXT PRIMARY KEY,sequence INTEGER NOT NULL UNIQUE,actor_id TEXT NOT NULL,action TEXT NOT NULL,target_type TEXT NOT NULL,target_id TEXT NOT NULL,outcome TEXT NOT NULL,reason TEXT NOT NULL,occurred_at TEXT NOT NULL,integrity_hash TEXT NOT NULL);
CREATE TABLE notification_outbox(id TEXT PRIMARY KEY,organization_id TEXT,recipient TEXT NOT NULL,template TEXT NOT NULL,payload_json TEXT NOT NULL,status TEXT NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL,sent_at TEXT);`;
function fixture({model='free',existing='none',assignment='none',membership=true,mutate,failSql,postcommit=false}={}){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
 sqlite.prepare('INSERT INTO course_releases VALUES(?,?,?,?,?,?,?,?,?)').run('release','course','published',1,model,model==='free'?'public':'private','org','synthetic','Synthetic');
 sqlite.exec("INSERT INTO workbooks VALUES('book','published');INSERT INTO course_release_workbooks VALUES('release','book',1);INSERT INTO account_security_profiles VALUES('alpha','active','external-identity','2026-08-31','2026-08-31','2026-01-01','2026-01-01');INSERT INTO learner_profiles VALUES('alpha','complete','trainee','radiology','[]','Synthetic','GB','UTC',0,'2026-01-01');");
 if(membership)sqlite.exec("INSERT INTO organization_memberships VALUES('org','alpha','active');");
 if(existing!=='none')sqlite.prepare('INSERT INTO enrolments VALUES(?,?,?,?,?)').run('prior','alpha','course',existing,'2020-01-01');
 if(assignment!=='none'){
  sqlite.prepare('INSERT INTO workbook_assignments VALUES(?,?,?,?,?,?,?,?,?)').run('instructor','book','alpha',assignment,'instructor','2020-01-01','2099-01-01',assignment==='revoked'?'2021-01-01':null,7);
  sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES(?,?,?,?,?,?)').run('instructor','2099-01-01',null,null,85,'2020-01-01');
 }
 let batches=0;env.sent=0;
 env.DB={prepare(sql){const bind=(...args)=>(globalThis.__freeAdmissionMaxBind=Math.max(globalThis.__freeAdmissionMaxBind??0,args.length),{async first(){return sqlite.prepare(sql).get(...args)??null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},execute(){if(failSql&&sql.includes(failSql))throw Error('synthetic write failure');return {success:true,meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};},async run(){return this.execute();}});return {bind,first:()=>bind().first(),all:()=>bind().all(),run:()=>bind().run()};},async batch(stmts){globalThis.__freeAdmissionBatchSizes??=[];globalThis.__freeAdmissionBatchSizes.push(stmts.length);batches++;mutate?.(sqlite,batches);sqlite.exec('BEGIN');let open=true;try{const out=stmts.map(s=>s.execute());sqlite.exec('COMMIT');open=false;if(postcommit)throw Error('synthetic postcommit transport failure');return out;}catch(e){if(open)sqlite.exec('ROLLBACK');throw e;}}};
 return {sqlite,get batches(){return batches;},counts(){return Object.fromEntries(['enrolments','workbook_assignments','workbook_assignment_rules','audit_events','notification_outbox'].map(t=>[t,sqlite.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n]));}};
}
const auth={userId:'alpha',email:'alpha@example.invalid',externalSubject:'synthetic:alpha'};
let checks=0;
async function scenario(name,options,expect){await test(name,{concurrency:false},async()=>{const f=fixture(options);try{if(expect.reject)await assert.rejects(enrolInCourse(auth,'release'));else await enrolInCourse(auth,'release');assert.deepEqual(f.counts(),expect.counts,name);assert.equal(env.sent,expect.sent??0,name+' sent');if(expect.assignment){assert.equal(f.sqlite.prepare('SELECT id FROM workbook_assignments').get().id,expect.assignment);assert.equal(f.sqlite.prepare('SELECT prerequisite_min_percent FROM workbook_assignment_rules').get().prerequisite_min_percent,85);}checks++;process.stdout.write(name+': pass\n');}finally{f.sqlite.close();}});}
const zero={enrolments:0,workbook_assignments:0,workbook_assignment_rules:0,audit_events:0,notification_outbox:0};
const full={enrolments:1,workbook_assignments:1,workbook_assignment_rules:1,audit_events:1,notification_outbox:1};
for(const model of ['free','institution']){
 await scenario(model+' success',{model},{counts:full,sent:1});
 for(const needle of ['INSERT INTO enrolments','INSERT INTO workbook_assignments','INSERT INTO workbook_assignment_rules','INSERT INTO audit_events','INSERT INTO notification_outbox']){
  await scenario(model+' rollback '+needle,{model,failSql:needle},{reject:true,counts:zero});
 }
 await scenario(model+' revoked enrolment',{model,existing:'revoked'},{reject:true,counts:{...zero,enrolments:1}});
 await scenario(model+' instructor allocation',{model,existing:'active',assignment:'revoked'},{counts:full,sent:1,assignment:'instructor'});
 await scenario(model+' concurrent instructor allocation',{model,mutate(db){db.exec("INSERT INTO workbook_assignments VALUES('instructor','book','alpha','revoked','instructor','2020-01-01','2099-01-01','2021-01-01',7);INSERT INTO workbook_assignment_rules VALUES('instructor','2099-01-01',NULL,NULL,85,'2020-01-01');");}},{counts:full,sent:1,assignment:'instructor'});
 await scenario(model+' release closes in batch',{model,mutate(db){db.exec("UPDATE course_releases SET enrolment_open=0");}},{reject:true,counts:zero});
 await scenario(model+' workbook added in batch',{model,mutate(db){db.exec("INSERT INTO workbooks VALUES('newbook','published');INSERT INTO course_release_workbooks VALUES('release','newbook',2);");}},{reject:true,counts:zero});
 await scenario(model+' account revoked in batch',{model,mutate(db){db.exec("UPDATE account_security_profiles SET status='restricted'");}},{reject:true,counts:zero});
 await scenario(model+' consent revoked in batch',{model,mutate(db){db.exec("UPDATE account_security_profiles SET privacy_version='obsolete'");}},{reject:true,counts:zero});
 await scenario(model+' postcommit error proof',{model,postcommit:true},{counts:full,sent:1});
}
await scenario('institution membership revoked in batch',{model:'institution',mutate(db){db.exec("UPDATE organization_memberships SET status='revoked'");}},{reject:true,counts:zero});
await test('audit-head retry',{concurrency:false},async()=>{
 const f=fixture({mutate(db,n){if(n===1)db.exec("INSERT INTO audit_events VALUES('other',1,'other','other','other','other','success','other','2026-01-01','other-hash');");}});
 try{await enrolInCourse(auth,'release');assert.equal(f.batches,2);assert.deepEqual(f.counts(),{...full,audit_events:2});checks++;process.stdout.write('audit-head retry: pass\n');}finally{f.sqlite.close();}
});
await test('retry reuses held outbox',{concurrency:false},async()=>{
 const f=fixture();
 try{await enrolInCourse(auth,'release');await enrolInCourse(auth,'release');assert.equal(f.counts().notification_outbox,1);assert.equal(f.counts().enrolments,1);assert.equal(f.counts().workbook_assignments,1);checks++;process.stdout.write('retry reuses held outbox: pass\n');}finally{f.sqlite.close();}
});

for(const table of ['enrolments','workbook_assignments','workbook_assignment_rules','audit_events','notification_outbox']){
 for(const timing of ['before','late','benign'])await test('trigger profile '+table+'/'+timing,{concurrency:false},async()=>{
  const f=fixture({mutate:timing==='late'?(db,n)=>{if(n===1)db.exec('CREATE TRIGGER test_admission BEFORE INSERT ON '+table+' BEGIN SELECT RAISE(IGNORE); END;');}:undefined});
  try{if(timing!=='late')f.sqlite.exec('CREATE TRIGGER test_admission BEFORE INSERT ON '+table+' BEGIN SELECT '+(timing==='benign'?'1':'RAISE(IGNORE)')+'; END;');
   await assert.rejects(enrolInCourse(auth,'release'));assert.deepEqual(f.counts(),zero);assert.equal(env.sent,0);checks++;
  }finally{f.sqlite.close();}
 });
}
for(const column of ['terms_accepted_at','privacy_accepted_at'])await test('empty consent '+column,{concurrency:false},async()=>{
 const f=fixture({mutate(db){db.exec('UPDATE account_security_profiles SET '+column+"=''");}});
 try{await assert.rejects(enrolInCourse(auth,'release'));assert.deepEqual(f.counts(),zero);assert.equal(env.sent,0);checks++;}finally{f.sqlite.close();}
});
const stableOutboxId='course-enrolment:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(['release','alpha','alpha@example.invalid','synthetic']))))).map(x=>x.toString(16).padStart(2,'0')).join('');
for(const[column,value]of [['organization_id',null],['organization_id','other'],['recipient','other@example.invalid'],['template','wrong'],['payload_json','{}'],['status','failed']])await test('outbox conflict '+column+'='+value,{concurrency:false},async()=>{
 const f=fixture();try{
  f.sqlite.prepare('INSERT INTO notification_outbox VALUES(?,?,?,?,?,?,?,?,?)').run(stableOutboxId,'org','alpha@example.invalid','course-enrolment',JSON.stringify({releaseId:'release',courseSlug:'synthetic'}),'held','pending','2026-01-01',null);
  f.sqlite.prepare('UPDATE notification_outbox SET '+column+'=?').run(value);
  await assert.rejects(enrolInCourse(auth,'release'));assert.deepEqual(f.counts(),{...zero,notification_outbox:1});assert.equal(env.sent,0);checks++;
 }finally{f.sqlite.close();}
});
await test('same-count workbook swap refuses without new grants',{concurrency:false},async()=>{
 const f=fixture({mutate(db){db.exec("DELETE FROM course_release_workbooks;INSERT INTO workbooks VALUES('different','published');INSERT INTO course_release_workbooks VALUES('release','different',1);INSERT INTO workbook_assignments VALUES('instructor','different','alpha','active','instructor','2020-01-01',NULL,NULL,7);");}});
 try{await assert.rejects(enrolInCourse(auth,'release'));assert.deepEqual(f.counts(),{...zero,workbook_assignments:1});assert.equal(env.sent,0);checks++;}finally{f.sqlite.close();}
});
await test('trusted account preflight refuses local demo',{concurrency:false},async()=>{
 const f=fixture();try{globalThis.__freeAdmissionDemo=true;await assert.rejects(enrolInCourse(auth,'release'));assert.deepEqual(f.counts(),zero);checks++;}finally{globalThis.__freeAdmissionDemo=false;f.sqlite.close();}
});
await test('identity provider revocation before batch refuses',{concurrency:false},async()=>{
 const f=fixture({mutate(db){db.exec("UPDATE account_security_profiles SET identity_provider='local-evaluation'");}});
 try{await assert.rejects(enrolInCourse(auth,'release'));assert.deepEqual(f.counts(),zero);assert.equal(env.sent,0);checks++;}finally{f.sqlite.close();}
});
await test('existing computed in-progress onboarding policy retained',{concurrency:false},async()=>{
 const f=fixture();try{f.sqlite.exec("UPDATE learner_profiles SET onboarding_status='in-progress'");await enrolInCourse(auth,'release');assert.deepEqual(f.counts(),full);checks++;}finally{f.sqlite.close();}
});
await test('500 workbooks fixed five statements preserve instructor policy',{concurrency:false},async()=>{
 const f=fixture();try{
  for(let n=1;n<500;n++){f.sqlite.prepare('INSERT INTO workbooks VALUES(?,?)').run('book'+n,'published');f.sqlite.prepare('INSERT INTO course_release_workbooks VALUES(?,?,?)').run('release','book'+n,n+1);}
  f.sqlite.prepare('INSERT INTO workbook_assignments VALUES(?,?,?,?,?,?,?,?,?)').run('instructor-250','book250','alpha','revoked','instructor','2020-01-01',null,'2021-01-01',7);
  f.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES(?,?,?,?,?,?)').run('instructor-250','2099-01-01',null,null,85,'2020-01-01');
  globalThis.__freeAdmissionBatchSizes=[];globalThis.__freeAdmissionMaxBind=0;
  await enrolInCourse(auth,'release');assert.deepEqual(globalThis.__freeAdmissionBatchSizes,[5]);assert(globalThis.__freeAdmissionMaxBind<=100);
  assert.deepEqual(f.counts(),{...full,workbook_assignments:500,workbook_assignment_rules:500});
  assert.deepEqual({...f.sqlite.prepare("SELECT id,status,version FROM workbook_assignments WHERE workbook_id='book250'").get()},{id:'instructor-250',status:'revoked',version:7});
  assert.equal(f.sqlite.prepare("SELECT prerequisite_min_percent FROM workbook_assignment_rules WHERE assignment_id='instructor-250'").get().prerequisite_min_percent,85);checks++;
 }finally{f.sqlite.close();}
});
process.stdout.write(JSON.stringify({checks})+'\n');
