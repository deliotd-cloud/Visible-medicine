import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// Optional roots allow this source-only proposal to be checked before integration.
const root=process.env.STUDIO_ACCESS_PRODUCT_ROOT?pathToFileURL(resolve(process.env.STUDIO_ACCESS_PRODUCT_ROOT)+'/'):new URL('../',import.meta.url);
const routeRoot=process.env.STUDIO_ACCESS_ROUTE_ROOT?pathToFileURL(resolve(process.env.STUDIO_ACCESS_ROUTE_ROOT)+'/'):root;
const require=createRequire(new URL('package.json',root)),ts=require('typescript');
function compile(base,file,imports,logs){
 const code=ts.transpileModule(readFileSync(new URL(file,base),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports','console',code)(id=>{
  assert(Object.hasOwn(imports,id),'Unexpected dependency in '+file+': '+id);return imports[id];
 },mod,mod.exports,{error(...args){logs.push(args);}});
 return mod.exports;
}
async function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(`CREATE TABLE users(id TEXT PRIMARY KEY);CREATE TABLE courses(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 CREATE TABLE workbooks(id TEXT PRIMARY KEY,status TEXT NOT NULL);CREATE TABLE ingestion_jobs(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 INSERT INTO users VALUES('edu:system-examiner'),('edu:one');
 INSERT INTO courses VALUES('course-advanced-imaging','active');
 INSERT INTO workbooks VALUES('workbook-teaching-demo','published'),('workbook-assessment','published');`);
 const f={sqlite,roles:['instructor'],auth:{userId:'edu:one',externalSubject:'synthetic:one',email:'one@example.invalid',displayName:'Synthetic educator'},reads:[],writes:[],logs:[],rateCalls:0,contextCalls:0,readFailure:null,contextFailure:null};
 const DB={prepare(sql){
  const bind=values=>({sql,values,bind:(...args)=>bind(args),
   async first(){f.reads.push(sql);if(f.readFailure)throw f.readFailure;return sqlite.prepare(sql).get(...values)??null;},
   async all(){f.reads.push(sql);if(f.readFailure)throw f.readFailure;return {results:sqlite.prepare(sql).all(...values)};},
   async run(){f.writes.push(sql);return sqlite.prepare(sql).run(...values);}});
  return bind([]);
 },async batch(statements){
  f.writes.push(...statements.map(s=>s.sql));sqlite.exec('BEGIN');
  try{const rows=statements.map(s=>sqlite.prepare(s.sql).run(...s.values));sqlite.exec('COMMIT');return rows;}
  catch(error){sqlite.exec('ROLLBACK');throw error;}
 }};
 const unexpected=()=>{throw Error('Unexpected out-of-scope dependency call');};
 // Identity and the education bootstrap are seams. Platform schema/snapshot SQL
 // and getStudioSnapshot -> requireStaff are actual source, not replacement gates.
 const identity={async ensureEducationUser(){return {roles:f.roles,status:'active',bootstrapDefaultOrganization:false};},async ensureDatabase(){},appendAudit:unexpected};
 const platform=compile(root,'db/platform.ts',{'cloudflare:workers':{env:{DB}},'./bootstrap':identity},f.logs);
 const education=compile(root,'lib/education-platform.ts',{
  'cloudflare:workers':{env:{DB}},'@/db/bootstrap':identity,'@/db/platform':platform,
  '@/lib/course-enrolment-policy':{},'@/lib/domain':{sha256:unexpected},'@/lib/studio-templates':{studioTemplate:unexpected},
  '@/lib/account-policy':{},'@/lib/transactional-email':{},'@/lib/workbook-eligibility':{},
 },f.logs);
 const context=compile(root,'lib/studio-mutation-context.ts',{},f.logs);
 class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
 f.route=compile(routeRoot,'app/api/studio/route.ts',{
  '@/lib/auth':{async getAuthContext(){return f.auth;}},'@/db/platform':platform,'@/lib/education-platform':education,
  '@/lib/institution-operations':{InstitutionOperationsError,async enforceRateLimit(){f.rateCalls++;}},
  '@/lib/mutation-json':{async readBoundedMutationJson(request){return request.json();}},
  '@/lib/studio-mutation-context':context,
  '@/lib/studio-mutation-context-server':{async assertStudioMutationContext(){f.contextCalls++;if(f.contextFailure)throw f.contextFailure;}},
 },f.logs);
 f.platform=platform;f.context=context;
 await platform.ensurePlatformSchema();
 sqlite.prepare(`INSERT INTO organization_memberships VALUES('org-elivion-pilot','edu:one','educator','active','2026-01-01T00:00:00.000Z')`).run();
 f.reads.length=0;f.writes.length=0;
 f.close=()=>sqlite.close();
 f.post=()=>f.route.POST(new Request('https://synthetic.invalid/api/studio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'create-course',expectedStudioContext:{actorId:'edu:one',organizationId:'org-elivion-pilot'},title:'Synthetic course',description:'Synthetic description'})}));
 return f;
}
async function responseIs(response,status,body){
 assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),body);
}
const states=[
 ['missing membership',f=>f.sqlite.exec('DELETE FROM organization_memberships'),'organization-unavailable'],
 ['revoked membership',f=>f.sqlite.exec("UPDATE organization_memberships SET status='revoked'"),'organization-unavailable'],
 ['suspended institution',f=>f.sqlite.exec("UPDATE organizations SET status='suspended'"),'organization-unavailable'],
 ['missing entitlement',f=>f.sqlite.exec('DELETE FROM organization_entitlements'),'entitlement-unavailable'],
];
for(const [label,mutate,reason] of states)test(`Studio GET classifies actual snapshot refusal: ${label}`,async()=>{
 const f=await fixture();try{
  mutate(f);
  await assert.rejects(f.platform.getPlatformSnapshot(f.auth),error=>error instanceof f.platform.PlatformAccessError&&error.reason===reason);
  const expected=new f.platform.PlatformAccessError(reason);
  await responseIs(await f.route.GET(),403,{error:expected.message});
  assert(f.reads.some(sql=>sql.includes('organization_memberships')));assert.deepEqual(f.writes,[]);assert.deepEqual(f.logs,[]);
 }finally{f.close();}
});
test('Studio keeps unauthenticated401 and actual nonstaff/effective-grant403',async()=>{
 const f=await fixture();try{
  f.auth=null;await responseIs(await f.route.GET(),401,{error:'Education sign-in is required.'});assert.deepEqual(f.reads,[]);
  f.auth={userId:'edu:one'};f.roles=['learner'];
  await responseIs(await f.route.GET(),403,{error:'An educator or administrator role is required.'});assert.deepEqual(f.reads,[]);
  f.roles=['instructor'];f.sqlite.exec('UPDATE organization_entitlements SET studio_access=0');
  await responseIs(await f.route.GET(),403,{error:'Studio is not enabled for this organization.'});assert.deepEqual(f.writes,[]);
 }finally{f.close();}
});
test('Studio does not classify matching-message or plain-status failures as typed access refusal',async()=>{
 for(const error of [new Error('PRIVATE_SYNTHETIC_STORAGE_FAILURE'),new Error('No active Visible Medicine organization is available for this account.'),new Error('The organization has no active education entitlement.'),{status:403,message:'forged refusal'}]){
  const f=await fixture();try{
   f.readFailure=error;await responseIs(await f.route.GET(),500,{error:'Studio could not complete this request.'});
   assert.equal(f.logs.length,1);assert.deepEqual(f.writes,[]);
  }finally{f.close();}
 }
});
test('Studio context refusals retain priority before actual mutation staff lookup',async()=>{
 for(const [reason,status,code] of [['changed',409,'STUDIO_CONTEXT_CHANGED'],['unavailable',503,'STUDIO_CONTEXT_UNAVAILABLE']]){
  const f=await fixture();try{
   f.sqlite.exec('DELETE FROM organization_memberships');f.contextFailure=new f.context.StudioMutationContextError(reason);
   await responseIs(await f.post(),status,{error:f.contextFailure.message,code});
   assert.equal(f.contextCalls,1);assert.equal(f.rateCalls,0);assert.deepEqual(f.reads,[]);assert.deepEqual(f.writes,[]);
  }finally{f.close();}
 }
});
test('Studio POST classifies actual requireStaff refusal after successful synthetic context comparison',async()=>{
 const f=await fixture();try{
  f.sqlite.exec('DELETE FROM organization_entitlements');
  await responseIs(await f.post(),403,{error:new f.platform.PlatformAccessError('entitlement-unavailable').message});
  assert.equal(f.contextCalls,1);assert.equal(f.rateCalls,1);assert(f.reads.length>0);assert.deepEqual(f.writes,[]);assert.deepEqual(f.logs,[]);
 }finally{f.close();}
});
