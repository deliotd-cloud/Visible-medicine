import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'package.json'));
const {build}=require('esbuild');
const env={};
globalThis.__courseInvitationHoldTestEnv=env;
globalThis.__courseInvitationHoldTestAudits=[];
const stubs={
 'cloudflare:workers':`export const env=globalThis.__courseInvitationHoldTestEnv;`,
 '@/db/bootstrap':`export async function ensureEducationUser(){return {status:'active',bootstrapDefaultOrganization:true};} export async function ensureDatabase(){} export async function appendAudit(...args){globalThis.__courseInvitationHoldTestAudits.push(args);}`,
 '@/db/platform':`export async function ensurePlatformSchema(){} export async function getPlatformSnapshot(){throw Error('Unexpected platform snapshot');}`,
 '@/lib/domain':`export async function sha256(v){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');}`,
 '@/lib/studio-templates':`export function studioTemplate(){throw Error('Unexpected studio template');}`,
 '@/lib/transactional-email':`export function getEmailProviderConfig(){return {publicSiteUrl:null};} export function courseEnrolmentEmail(){return {subject:'synthetic',text:'synthetic'};} export async function sendTransactionalEmail(){return {status:'held',reason:'TEST_NO_SEND',sentAt:null};}`,
};
const compiled=await build({stdin:{contents:"export {enrolInCourse} from './lib/education-platform.ts';export {canAccessPublishedWorkbook,canAccessPublishedCase} from './lib/workbook-access.ts';export * from './lib/course-enrolment-policy.ts';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{},plugins:[{name:'synthetic-service-boundaries',setup(b){
 b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(stubs,a.path))return {path:a.path,namespace:'stub'};if(['@/lib/account-policy','@/lib/workbook-access-policy','@/lib/course-enrolment-policy'].includes(a.path))return {path:resolve(root,a.path.slice(2)+'.ts')};});
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],loader:'js'}));
}}]});
const {enrolInCourse,canAccessPublishedWorkbook,canAccessPublishedCase,INVITATION_SELF_ENROLMENT_ENABLED,INVITATION_SELF_ENROLMENT_HOLD_MESSAGE}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const auth=userId=>({userId,email:userId+'@example.invalid',externalSubject:'synthetic:'+userId});

// Minimal synthetic schema only. Actual production SQL executes unchanged.
// No migrations, private records or on-disk database are read or written.
const schema=`
CREATE TABLE course_releases(id TEXT PRIMARY KEY,course_id TEXT,status TEXT,enrolment_open INTEGER,access_model TEXT,visibility TEXT,organization_id TEXT,slug TEXT,title TEXT);
CREATE TABLE course_invitations(id TEXT PRIMARY KEY,release_id TEXT,code_hash TEXT,status TEXT,uses INTEGER,max_uses INTEGER,expires_at TEXT);
CREATE TABLE enrolments(id TEXT PRIMARY KEY,user_id TEXT,course_id TEXT,status TEXT,enrolled_at TEXT,UNIQUE(user_id,course_id));
CREATE TABLE workbooks(id TEXT PRIMARY KEY,status TEXT,module_id TEXT);
CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT);
CREATE TABLE workbook_cases(workbook_id TEXT,case_id TEXT,position INTEGER);
CREATE TABLE workbook_progress(workbook_id TEXT,learner_id TEXT,percent_complete INTEGER);
CREATE TABLE cohort_workbook_assignments(id TEXT,cohort_id TEXT,workbook_id TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER,status TEXT,available_from TEXT,expires_at TEXT);
CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT);
CREATE TABLE cohorts(id TEXT,course_id TEXT,status TEXT);
CREATE TABLE organization_memberships(organization_id TEXT,user_id TEXT,status TEXT);
CREATE TABLE course_release_workbooks(release_id TEXT,workbook_id TEXT,position INTEGER);
CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT,assigned_by TEXT,assigned_at TEXT,due_at TEXT,revoked_at TEXT,version INTEGER,UNIQUE(workbook_id,learner_id));
CREATE TABLE workbook_assignment_rules(assignment_id TEXT PRIMARY KEY,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER,updated_at TEXT);
CREATE TABLE notification_outbox(id TEXT PRIMARY KEY,organization_id TEXT,recipient TEXT,template TEXT,payload_json TEXT,status TEXT,reason TEXT,created_at TEXT,sent_at TEXT);
CREATE TABLE account_security_profiles(user_id TEXT PRIMARY KEY,status TEXT,identity_provider TEXT,terms_version TEXT,privacy_version TEXT,terms_accepted_at TEXT,privacy_accepted_at TEXT);
CREATE TABLE learner_profiles(user_id TEXT PRIMARY KEY,onboarding_status TEXT,training_stage TEXT,discipline TEXT,interests_json TEXT,institution_name TEXT,country_code TEXT,timezone TEXT,marketing_opt_in INTEGER,updated_at TEXT);
`;
function fixture({uses=0,model='invitation',member=true,onAssignmentLookup}={}){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
 sqlite.exec("INSERT INTO course_releases VALUES('release','course','published',1,'invitation','private','org','synthetic-course','Synthetic course');INSERT INTO modules VALUES('module','course');INSERT INTO workbooks VALUES('workbook','published','module');INSERT INTO course_release_workbooks VALUES('release','workbook',1);INSERT INTO workbook_cases VALUES('workbook','synthetic-case',1);");
 sqlite.prepare('UPDATE course_releases SET access_model=?,visibility=?').run(model,model==='free'?'public':'private');
 if(member)sqlite.exec("INSERT INTO organization_memberships VALUES('org','alpha','active');");
 sqlite.prepare('INSERT INTO course_invitations VALUES(?,?,?,?,?,?,?)').run('invite','release',createHash('sha256').update('SYNTHETIC').digest('hex'),'active',uses,1,'2099-01-01T00:00:00.000Z');
 for(const user of ['alpha','beta']){
  sqlite.prepare('INSERT INTO account_security_profiles VALUES(?,?,?,?,?,?,?)').run(user,'active','synthetic','2026-08-31','2026-08-31','2026-01-01','2026-01-01');
  sqlite.prepare('INSERT INTO learner_profiles VALUES(?,?,?,?,?,?,?,?,?,?)').run(user,'complete','trainee','radiology','[]','Synthetic','GB','UTC',0,'2026-01-01');
 }
 const writes=[];let invitationLookups=0;
 env.DB={prepare(sql){return {bind(...values){return {
  async first(){if(sql.startsWith('SELECT * FROM course_invitations')){invitationLookups++;throw Error('Held invitation reached lookup');}const result=sqlite.prepare(sql).get(...values)||null;if(sql.startsWith('SELECT id, version FROM workbook_assignments'))onAssignmentLookup?.(sqlite);return result;},
  async all(){return {results:sqlite.prepare(sql).all(...values)};},
  execute(){writes.push(sql);return {success:true,meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};},
  async run(){return this.execute();}
 };}};},async batch(statements){sqlite.exec('BEGIN');try{const out=statements.map(s=>s.execute());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 globalThis.__courseInvitationHoldTestAudits=[];
 return {sqlite,writes,get invitationLookups(){return invitationLookups;},noGrants(){
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM enrolments').get().n,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM workbook_assignments').get().n,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM workbook_assignment_rules').get().n,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM notification_outbox').get().n,0);
  assert.equal(sqlite.prepare('SELECT uses FROM course_invitations').get().uses,uses);
  assert.equal(invitationLookups,0);assert.deepEqual(writes,[]);assert.deepEqual(globalThis.__courseInvitationHoldTestAudits,[]);
 }};
}

for(const [name,code,uses,users]of [
 ['valid invitation','SYNTHETIC',0,['alpha']],
 ['missing invitation code','',0,['alpha']],
 ['exhausted invitation','SYNTHETIC',1,['alpha']],
 ['concurrent last-use requests','SYNTHETIC',0,['alpha','beta']],
])test(name+' fails closed before invitation lookup or grants',{concurrency:false},async()=>{
 assert.equal(INVITATION_SELF_ENROLMENT_ENABLED,false);
 const policy=await readFile(resolve(root,'lib/course-enrolment-policy.ts'),'utf8');
 assert.match(policy,/INVITATION_SELF_ENROLMENT_ENABLED = false;/);assert(!policy.includes('process.env'));
 const f=fixture({uses});try{
  await Promise.all(users.map(u=>assert.rejects(enrolInCourse(auth(u),'release',code),e=>e.status===409&&e.message===INVITATION_SELF_ENROLMENT_HOLD_MESSAGE)));
  f.noGrants();for(const u of users)assert.equal(await canAccessPublishedWorkbook(u,['learner'],'workbook'),false);
 }finally{f.sqlite.close();}
});
for(const model of ['free','institution'])test(model+' self-enrolment and actual workbook access remain available',{concurrency:false},async()=>{
 const f=fixture({model});try{const result=await enrolInCourse(auth('alpha'),'release');assert.equal(result.workbookId,'workbook');assert.equal(await canAccessPublishedWorkbook('alpha',['learner'],'workbook'),true);assert.equal(f.sqlite.prepare('SELECT uses FROM course_invitations').get().uses,0);assert.equal(f.invitationLookups,0);}finally{f.sqlite.close();}
});
test('institution nonmember remains denied',{concurrency:false},async()=>{
 const f=fixture({model:'institution',member:false});try{await assert.rejects(enrolInCourse(auth('alpha'),'release'),e=>e.status===403);f.noGrants();}finally{f.sqlite.close();}
});

const rows=(db,table)=>db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all();
function instructorAllocation(db,{status='active',expires=null,available='2020-01-01',prerequisite=null,noRules=false}={}){
 db.prepare('INSERT INTO workbook_assignments VALUES(?,?,?,?,?,?,?,?,?)').run('instructor-allocation','workbook','alpha',status,'instructor','2020-01-01','2098-01-01',status==='revoked'?'2021-01-01':null,7);
 if(!noRules)db.prepare('INSERT INTO workbook_assignment_rules VALUES(?,?,?,?,?,?)').run('instructor-allocation',available,expires,prerequisite,85,'2020-01-01');
 if(prerequisite)db.prepare('INSERT INTO workbook_progress VALUES(?,?,?)').run(prerequisite,'alpha',20);
}
for(const model of ['free','institution'])for(const [name,options,allowed]of [
 ['revoked',{status:'revoked'},false],
 ['expired',{expires:'2000-01-01'},false],
 ['future',{available:'2099-01-01'},false],
 ['prerequisite',{prerequisite:'required-workbook'},false],
 ['active restricted',{expires:'2099-01-01'},true],
 ['active without rules',{noRules:true},true],
])test(`${model} preserves ${name} instructor allocation and case access`,{concurrency:false},async()=>{
 const f=fixture({model});try{
  f.sqlite.exec("INSERT INTO enrolments VALUES('existing-enrolment','alpha','course','active','2020-01-01');");
  instructorAllocation(f.sqlite,options);
  const before={enrolments:rows(f.sqlite,'enrolments'),assignments:rows(f.sqlite,'workbook_assignments'),rules:rows(f.sqlite,'workbook_assignment_rules')};
  assert.equal(await canAccessPublishedWorkbook('alpha',['learner'],'workbook'),allowed);
  assert.equal(await canAccessPublishedCase('alpha',['learner'],'synthetic-case'),allowed);
  await enrolInCourse(auth('alpha'),'release');
  assert.deepEqual(rows(f.sqlite,'enrolments'),before.enrolments);
  assert.deepEqual(rows(f.sqlite,'workbook_assignments'),before.assignments);
  assert.deepEqual(rows(f.sqlite,'workbook_assignment_rules'),before.rules);
  assert.equal(await canAccessPublishedWorkbook('alpha',['learner'],'workbook'),allowed);
  assert.equal(await canAccessPublishedCase('alpha',['learner'],'synthetic-case'),allowed);
 }finally{f.sqlite.close();}
});
for(const model of ['free','institution'])for(const status of ['revoked','suspended'])test(`${model} cannot revive ${status} course enrolment`,{concurrency:false},async()=>{
 const f=fixture({model});try{
  f.sqlite.prepare('INSERT INTO enrolments VALUES(?,?,?,?,?)').run('restricted-enrolment','alpha','course',status,'2020-01-01');
  const before=rows(f.sqlite,'enrolments');
  await assert.rejects(enrolInCourse(auth('alpha'),'release'),e=>e.status===409&&/existing course enrolment requires instructor review/i.test(e.message));
  assert.deepEqual(rows(f.sqlite,'enrolments'),before);assert.deepEqual(f.writes,[]);
  assert.deepEqual(rows(f.sqlite,'workbook_assignments'),[]);assert.deepEqual(rows(f.sqlite,'notification_outbox'),[]);assert.deepEqual(globalThis.__courseInvitationHoldTestAudits,[]);
 }finally{f.sqlite.close();}
});
for(const model of ['free','institution'])for(const [name,options,allowed]of [
 ['revoked with rules',{status:'revoked',expires:'2000-01-01',prerequisite:'required-workbook'},false],
 ['active without rules',{noRules:true},true],
])test(`${model} preserves concurrent ${name} instructor allocation after empty lookup`,{concurrency:false},async()=>{
 let protectedRows;
 const f=fixture({model,onAssignmentLookup(db){instructorAllocation(db,options);protectedRows={assignments:rows(db,'workbook_assignments'),rules:rows(db,'workbook_assignment_rules')};}});
 try{
  await enrolInCourse(auth('alpha'),'release');
  assert(protectedRows);assert.deepEqual(rows(f.sqlite,'workbook_assignments'),protectedRows.assignments);assert.deepEqual(rows(f.sqlite,'workbook_assignment_rules'),protectedRows.rules);
  assert.equal(await canAccessPublishedWorkbook('alpha',['learner'],'workbook'),allowed);assert.equal(await canAccessPublishedCase('alpha',['learner'],'synthetic-case'),allowed);
  assert.equal(rows(f.sqlite,'workbook_assignment_rules').length,options.noRules?0:1);
 }finally{f.sqlite.close();}
});
for(const model of ['free','institution'])test(`${model} repeated self-enrolment preserves its first allocation`,{concurrency:false},async()=>{
 const f=fixture({model});try{
  await enrolInCourse(auth('alpha'),'release');
  const before={enrolments:rows(f.sqlite,'enrolments'),assignments:rows(f.sqlite,'workbook_assignments'),rules:rows(f.sqlite,'workbook_assignment_rules')};
  await enrolInCourse(auth('alpha'),'release');
  assert.deepEqual(rows(f.sqlite,'enrolments'),before.enrolments);assert.deepEqual(rows(f.sqlite,'workbook_assignments'),before.assignments);assert.deepEqual(rows(f.sqlite,'workbook_assignment_rules'),before.rules);
  assert.equal(await canAccessPublishedWorkbook('alpha',['learner'],'workbook'),true);
 }finally{f.sqlite.close();}
});

// Real current component and shared policy; only Next Link is a render boundary.
const ui=await build({entryPoints:[resolve(root,'components/CourseEnrolmentControl.tsx')],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',tsconfigRaw:{},external:['react','react/jsx-runtime'],plugins:[{name:'synthetic-next-link',setup(b){
 b.onResolve({filter:/^@\/lib\/course-enrolment-policy$/},()=>({path:resolve(root,'lib/course-enrolment-policy.ts')}));
 b.onResolve({filter:/^next\/link$/},a=>({path:a.path,namespace:'link'}));
 b.onLoad({filter:/.*/,namespace:'link'},()=>({contents:"import React from 'react';export default function Link(props){return React.createElement('a',props,props.children);}",loader:'js'}));
}}]});
const scope={exports:{}};new Function('module','exports','require',ui.outputFiles[0].text)(scope,scope.exports,require);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const props={releaseId:'release',slug:'course',accessModel:'invitation',enrolled:false,firstWorkbookId:'workbook',signedIn:true,profileComplete:true,enrolmentOpen:true,invitationCode:'SYNTHETIC'};
const html=p=>renderToStaticMarkup(React.createElement(scope.exports.CourseEnrolmentControl,p));
for(const [name,change]of [['signed-in',{}],['signed-out',{signedIn:false}],['incomplete profile',{profileComplete:false}]])test(name+' invitation UI clearly unavailable',{concurrency:false},()=>{
 const output=html({...props,...change});assert(output.includes('Invitation enrolment unavailable'));assert(output.includes('disabled'));assert(output.includes(INVITATION_SELF_ENROLMENT_HOLD_MESSAGE));assert(!output.includes('<input'));assert(!output.includes('Accept invitation'));
});
test('existing allocation retains Continue course',{concurrency:false},()=>{const output=html({...props,enrolled:true});assert(output.includes('Continue course'));assert(!output.includes('unavailable'));assert(output.includes('/learn/course/workbook'));});
for(const [model,label]of [['free','Enrol for free'],['institution','Join with institution access']])test(model+' UI retains enrolment CTA',{concurrency:false},()=>{const output=html({...props,accessModel:model});assert(output.includes(label));assert(!output.includes('unavailable'));});
