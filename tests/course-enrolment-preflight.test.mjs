import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(site,'package.json')),{build}=require('esbuild');
const source=readFileSync(resolve(site,'lib/education-platform.ts'),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
globalThis.__preflight={env:{},bootstrap:0,platform:0,reads:[]};
const stubs={
 'cloudflare:workers':'export const env=globalThis.__preflight.env;',
 '@/db/bootstrap':"export async function ensureEducationUser(){globalThis.__preflight.bootstrap++;throw Error('BOOTSTRAP_REACHED');} export async function ensureDatabase(){throw Error('DATABASE_REACHED');} export async function appendAudit(){throw Error('AUDIT_REACHED');}",
 '@/db/platform':"export async function ensurePlatformSchema(){globalThis.__preflight.platform++;throw Error('PLATFORM_REACHED');} export async function getPlatformSnapshot(){throw Error('SNAPSHOT_REACHED');}",
 '@/lib/domain':"export async function sha256(){throw Error('HASH_REACHED');}",
 '@/lib/studio-templates':"export function studioTemplate(){throw Error('TEMPLATE_REACHED');}",
 '@/lib/transactional-email':"export function getEmailProviderConfig(){throw Error('EMAIL_REACHED');} export function courseEnrolmentEmail(){throw Error('EMAIL_REACHED');} export async function sendTransactionalEmail(){throw Error('EMAIL_REACHED');}"
};
async function compile(text){
 const result=await build({stdin:{contents:text,resolveDir:site,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{},plugins:[{name:'explicit-bootstrap-seams',setup(b){
  b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(stubs,a.path))return{path:a.path,namespace:'stub'};if(['@/lib/account-policy','@/lib/course-enrolment-policy'].includes(a.path))return{path:resolve(site,a.path.slice(2)+'.ts')};});
  b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],loader:'js'}));
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const next=await compile(source);
const auth={userId:'synthetic',externalSubject:'synthetic:one',email:'one@example.invalid',displayName:'Synthetic'};
const schema=`CREATE TABLE account_security_profiles(user_id TEXT PRIMARY KEY,status TEXT,terms_version TEXT,privacy_version TEXT,terms_accepted_at TEXT,privacy_accepted_at TEXT);
CREATE TABLE learner_profiles(user_id TEXT PRIMARY KEY,onboarding_status TEXT,terms_accepted_at TEXT);
CREATE TABLE course_releases(id TEXT PRIMARY KEY,status TEXT,enrolment_open INTEGER,access_model TEXT);`;
function fixture(options={}){
 const db=new DatabaseSync(':memory:');db.exec(schema);
 db.prepare('INSERT INTO account_security_profiles VALUES(?,?,?,?,?,?)').run('synthetic','active','2026-08-31','2026-08-31','2026-01-01','2026-01-01');
 db.prepare('INSERT INTO learner_profiles VALUES(?,?,?)').run('synthetic','complete','2026-01-01');
 db.prepare('INSERT INTO course_releases VALUES(?,?,?,?)').run('release','published',1,options.model??'invitation');
 options.setup?.(db);
 const s=globalThis.__preflight;s.bootstrap=0;s.platform=0;s.reads=[];
 s.env.DB={
  prepare(sql){
   assert.match(sql,/^SELECT /);s.reads.push(sql);
   if(options.failPrepare)throw Error('synthetic unavailable');
   return {bind(...values){return {async first(){
    if(options.failRead)throw Error('synthetic unavailable');
    return db.prepare(sql).get(...values)??null;
   }};}};
  },
  batch(){throw Error('BATCH_REACHED');},
  exec(){throw Error('DDL_REACHED');},
 };
 return{db,state:s,snapshot(){return JSON.stringify(db.prepare("SELECT name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>({...r,rows:db.prepare('SELECT * FROM '+r.name+' ORDER BY 1').all()})));}};
}
const cases=[];
async function refusal(name,options,status,message,code='SYNTHETIC',release='release'){
 return test(name,{concurrency:false},async()=>{
 const f=fixture(options),before=f.snapshot();try{
  await assert.rejects(next.enrolInCourse(auth,release,code),e=>e.status===status&&message.test(e.message),name);
  assert.equal(f.state.bootstrap,0,name);assert.equal(f.state.platform,0,name);assert.equal(f.snapshot(),before,name+' database unchanged');
  cases.push({name,status,readCount:f.state.reads.length,bootstrap:0,databaseUnchanged:true});
 }finally{f.db.close();}
 });
}
// The original writeful-bootstrap reproduction is retained in the E-only candidate evidence.
for(const [name,code]of [['supplied','SYNTHETIC'],['empty',''],['missing',undefined],['null',null],['object',{value:'SYNTHETIC'}],['whitespace',' \n '],['overlong','A'.repeat(10000)]])
 await refusal('held invitation '+name,{},409,/Invitation self-enrolment is temporarily unavailable/,code);
for(const status of ['restricted','deletion-pending','deactivated','unknown',''])
 await refusal('account '+status,{setup(db){db.prepare('UPDATE account_security_profiles SET status=?').run(status);}},403,/account/i,'');
for(const [name,setup,status,message]of [
 ['missing profile',db=>db.exec('DELETE FROM learner_profiles'),409,/Complete your learner profile/],
 ['missing account and profile',db=>db.exec('DELETE FROM account_security_profiles;DELETE FROM learner_profiles'),409,/Complete your learner profile/],
 ['profile but missing account',db=>db.exec('DELETE FROM account_security_profiles'),409,/Review the current education terms/],
 ['not-started',db=>db.exec("UPDATE learner_profiles SET onboarding_status='not-started'"),409,/Complete your learner profile/],
 ['outdated terms',db=>db.exec("UPDATE account_security_profiles SET terms_version='old'"),409,/Review the current education terms/],
 ['missing privacy date',db=>db.exec("UPDATE account_security_profiles SET privacy_accepted_at=NULL"),409,/Review the current education terms/],
 ['missing release',db=>db.exec('DELETE FROM course_releases'),404,/not available/],
 ['unpublished release',db=>db.exec("UPDATE course_releases SET status='draft'"),404,/not available/],
 ['closed release',db=>db.exec('UPDATE course_releases SET enrolment_open=0'),409,/currently closed/],
 ['missing account schema',db=>db.exec('DROP TABLE account_security_profiles'),503,/prepared for review/],
 ['missing profile schema',db=>db.exec('DROP TABLE learner_profiles'),503,/prepared for review/],
 ['missing release schema',db=>db.exec('DROP TABLE course_releases'),503,/prepared for review/],
 ['incompatible account schema',db=>db.exec('ALTER TABLE account_security_profiles DROP COLUMN terms_version'),503,/prepared for review/],
 ])await refusal(name,{setup},status,message);
await refusal('prepare unavailable',{failPrepare:true},503,/prepared for review/);
await refusal('read unavailable',{failRead:true},503,/prepared for review/);
await refusal('quoted release ID remains bound',{},404,/not available/,'',"release' OR 1=1 --");
for(const model of ['free','institution'])await test(model+' retains original later service',{concurrency:false},async()=>{
 const f=fixture({model});try{await assert.rejects(next.enrolInCourse(auth,'release','EXTRA'),/BOOTSTRAP_REACHED/);assert.equal(f.state.bootstrap,1);assert.equal(f.state.reads.length,2);}finally{f.db.close();}
});
test('invitation hold remains literal false',()=>{
 const policy=readFileSync(resolve(site,'lib/course-enrolment-policy.ts'),'utf8');
 assert.match(policy,/INVITATION_SELF_ENROLMENT_ENABLED = false;/);assert(!policy.includes('process.env'));
});
