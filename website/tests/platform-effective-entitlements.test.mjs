import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

// Real platform source/schema/SQL; only the signed-in identity and hosting
// environment are synthetic. No account, live DB, payment or bucket is used.
const {build}=createRequire(resolve(process.cwd(),'package.json'))('esbuild');
const source=readFileSync(process.env.PLATFORM_DB_SOURCE??new URL('../db/platform.ts',import.meta.url),'utf8');
const compiled=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{
 name:'synthetic-identity-and-hosting-only',setup(builder){
  builder.onResolve({filter:/^(cloudflare:workers|\.\/bootstrap)$/},args=>({path:args.path,namespace:'synthetic'}));
  builder.onLoad({filter:/.*/,namespace:'synthetic'},args=>({loader:'js',contents:args.path==='cloudflare:workers'
   ?'export const env=new Proxy({},{get(_,key){return globalThis.__paidPolicyEnv[key];}});'
   :'export async function ensureEducationUser(){return {roles:["instructor"],bootstrapDefaultOrganization:false};}'}));
 }}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const actor={userId:'edu:synthetic-staff',externalSubject:'sites:synthetic-staff'};
function database(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(`CREATE TABLE users(id TEXT PRIMARY KEY);
 CREATE TABLE courses(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 CREATE TABLE workbooks(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 CREATE TABLE ingestion_jobs(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 INSERT INTO users VALUES('edu:system-examiner'),('edu:synthetic-staff');
 INSERT INTO courses VALUES('course-advanced-imaging','active');
 INSERT INTO workbooks VALUES('workbook-teaching-demo','published'),('workbook-assessment','published');`);
 const DB={prepare(sql){
  const bind=values=>({sql,values,bind:(...args)=>bind(args),
   async run(){return sqlite.prepare(sql).run(...values);},
   async first(){return sqlite.prepare(sql).get(...values)??null;},
   async all(){return {results:sqlite.prepare(sql).all(...values)};}});
  return bind([]);
 },async batch(statements){
  sqlite.exec('BEGIN');try{const results=statements.map(s=>sqlite.prepare(s.sql).run(...s.values));sqlite.exec('COMMIT');return results;}
  catch(error){sqlite.exec('ROLLBACK');throw error;}
 }};
 return {sqlite,DB};
}
async function fixture(){
 const f=database();globalThis.__paidPolicyEnv={DB:f.DB};
 await api.ensurePlatformSchema(f.DB);
 f.sqlite.prepare(`INSERT INTO organization_memberships(organization_id,user_id,role,status,joined_at) VALUES('org-elivion-pilot',?,'educator','active','2026-01-01T00:00:00.000Z')`).run(actor.userId);
 return {...f,async snapshot(){return api.getPlatformSnapshot(actor);},close(){f.sqlite.close();delete globalThis.__paidPolicyEnv;}};
}
const featureFlags=s=>[s.entitlement.atlasAccess,s.entitlement.studioAccess,s.entitlement.reportingAccess,s.entitlement.embedsAccess];
test('active and evaluation entitlements retain only their declared independent features',{concurrency:false},async()=>{
 const f=await fixture();try{
  for(const status of ['active','evaluation']){
   f.sqlite.prepare('UPDATE organization_entitlements SET status=?,valid_until=NULL,atlas_access=0,studio_access=1,reporting_access=0,embeds_access=1').run(status);
   assert.deepEqual(featureFlags(await f.snapshot()),[false,true,false,true]);
   f.sqlite.prepare("UPDATE organization_entitlements SET valid_until='2999-01-01T00:00:00.000Z'").run();
   assert.deepEqual(featureFlags(await f.snapshot()),[false,true,false,true]);
  }
 }finally{f.close();}
});
test('expired, malformed-expiry and noncurrent entitlements cannot activate stored feature flags',{concurrency:false},async()=>{
 const f=await fixture();try{
  for(const [status,until] of [['active','2000-01-01T00:00:00.000Z'],['evaluation','not-a-date'],['active','2999-01-01'],['suspended',null],['revoked',null],['unknown',null]]){
   f.sqlite.prepare('UPDATE organization_entitlements SET status=?,valid_until=?,atlas_access=1,studio_access=1,reporting_access=1,embeds_access=1').run(status,until);
   assert.deepEqual(featureFlags(await f.snapshot()),[false,false,false,false],JSON.stringify([status,until]));
   const stored=f.sqlite.prepare('SELECT studio_access,status,valid_until FROM organization_entitlements').get();
   assert.equal(stored.studio_access,1,'Read policy must not rewrite the declared grant');assert.equal(stored.status,status);assert.equal(stored.valid_until,until);
  }
 }finally{f.close();}
});
test('inactive organization or revoked membership cannot yield an enabled Studio snapshot',{concurrency:false},async()=>{
 const f=await fixture();try{
  f.sqlite.prepare("UPDATE organizations SET status='suspended'").run();
  await assert.rejects(f.snapshot(),/No active Visible Medicine organization/);
  f.sqlite.prepare("UPDATE organizations SET status='active'").run();
  f.sqlite.prepare("UPDATE organization_memberships SET status='revoked'").run();
  await assert.rejects(f.snapshot(),/No active Visible Medicine organization/);
 }finally{f.close();}
});
test('another organization entitlement never merges into the authenticated membership',{concurrency:false},async()=>{
 const f=await fixture();try{
  f.sqlite.prepare("UPDATE organization_entitlements SET studio_access=0,atlas_access=0").run();
  f.sqlite.prepare("INSERT INTO organizations(id,slug,name,kind,status,created_at) VALUES('org-other','other','Synthetic other','institution','active','2000-01-01T00:00:00.000Z')").run();
  f.sqlite.prepare(`INSERT INTO organization_entitlements(organization_id,plan,learner_limit,educator_limit,storage_bytes,atlas_access,studio_access,reporting_access,embeds_access,status,valid_until,version,updated_at)
   VALUES('org-other','Synthetic',1,1,1,1,1,1,1,'active',NULL,1,'2026-01-01T00:00:00.000Z')`).run();
  const snapshot=await f.snapshot();assert.equal(snapshot.organization.id,'org-elivion-pilot');
  assert.equal(snapshot.entitlement.studioAccess,false);assert.equal(snapshot.entitlement.atlasAccess,false);
 }finally{f.close();}
});


test('non-one stored feature values cannot become effective grants',{concurrency:false},async()=>{
 const f=await fixture();try{
  for(const value of [0,2,-1,'true']){
   f.sqlite.prepare('UPDATE organization_entitlements SET status=?,valid_until=NULL,atlas_access=?,studio_access=?,reporting_access=?,embeds_access=?').run('active',value,value,value,value);
   assert.deepEqual(featureFlags(await f.snapshot()),[false,false,false,false],String(value));
  }
  f.sqlite.prepare('UPDATE organization_entitlements SET atlas_access=1,studio_access=1,reporting_access=1,embeds_access=1').run();
  assert.deepEqual(featureFlags(await f.snapshot()),[true,true,true,true]);
 }finally{f.close();}
});
