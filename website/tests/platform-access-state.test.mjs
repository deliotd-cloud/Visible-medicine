import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const baseline=process.env.PLATFORM_ACCESS_BASELINE_ROOT?pathToFileURL(resolve(process.env.PLATFORM_ACCESS_BASELINE_ROOT)+'/'):new URL('../',import.meta.url);
const product=process.env.PLATFORM_ACCESS_PRODUCT_ROOT?pathToFileURL(resolve(process.env.PLATFORM_ACCESS_PRODUCT_ROOT)+'/'):new URL('../',import.meta.url);
const require=createRequire(new URL('package.json',baseline));
const ts=require('typescript'),React=require('react'),jsx=require('react/jsx-runtime');
const {renderToStaticMarkup}=require('react-dom/server');
function compile(root,path,imports){
 const source=readFileSync(new URL(path,root),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(id=>{
  assert(Object.hasOwn(imports,id),'Unexpected dependency in '+path+': '+id);return imports[id];
 },mod,mod.exports);
 return mod.exports;
}
const keyboard=compile(baseline,'lib/head-disclosure-keyboard.ts',{});
const disclosure=compile(baseline,'components/NativeDisclosure.tsx',{'react/jsx-runtime':jsx,'../lib/head-disclosure-keyboard':keyboard});
const manager=compile(baseline,'components/EmbedOriginManager.tsx',{'react/jsx-runtime':jsx,react:React});
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(`CREATE TABLE users(id TEXT PRIMARY KEY);CREATE TABLE courses(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 CREATE TABLE workbooks(id TEXT PRIMARY KEY,status TEXT NOT NULL);CREATE TABLE ingestion_jobs(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 INSERT INTO users VALUES('edu:system-examiner'),('edu:one');
 INSERT INTO courses VALUES('course-advanced-imaging','active');
 INSERT INTO workbooks VALUES('workbook-teaching-demo','published'),('workbook-assessment','published');`);
 const f={sqlite,roles:['administrator'],auth:{userId:'edu:one',externalSubject:'sites:one',email:'one@example.invalid',displayName:'Synthetic educator'},
  reads:[],writes:[],audits:[],reviewCalls:0,reviewAllowed:false,readFailure:null};
 const DB={prepare(sql){
  const bind=values=>({sql,values,bind:(...args)=>bind(args),
   async first(){f.reads.push({sql,values});if(f.readFailure)throw f.readFailure;return sqlite.prepare(sql).get(...values)??null;},
   async all(){f.reads.push({sql,values});if(f.readFailure)throw f.readFailure;return {results:sqlite.prepare(sql).all(...values)};},
   async run(){f.writes.push({sql,values});return sqlite.prepare(sql).run(...values);}});
  return bind([]);
 },async batch(statements){
  f.writes.push(...statements);sqlite.exec('BEGIN');
  try{const result=statements.map(s=>sqlite.prepare(s.sql).run(...s.values));sqlite.exec('COMMIT');return result;}
  catch(error){sqlite.exec('ROLLBACK');throw error;}
 }};
 const identity={async ensureEducationUser(){return {roles:f.roles,bootstrapDefaultOrganization:false};}};
 f.platform=compile(product,'db/platform.ts',{'cloudflare:workers':{env:{DB}},'./bootstrap':identity});
 const authBoundary={async requireChatGPTUser(){return {userId:'one',email:'one@example.invalid',displayName:'Synthetic educator'};}};
 const reviewBoundary={async authorizeClinicalReview(){f.reviewCalls++;if(!f.reviewAllowed)throw Error('synthetic independent review denial');}};
 f.page=compile(product,'app/workspace/page.tsx',{
  'react/jsx-runtime':jsx,'next/link':{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)},
  'next/navigation':{redirect(href){throw Error('redirect:'+href);}},
  '../chatgpt-auth':authBoundary,'../../db/platform':f.platform,
  '../../components/NativeDisclosure':disclosure,'../../components/EmbedOriginManager':manager,
  '@/db/bootstrap':identity,'@/lib/clinical-review-server':reviewBoundary,
 }).default;
 f.route=compile(product,'app/api/platform/embed-origins/route.ts',{
  'cloudflare:workers':{env:{DB}},'@/lib/auth':{async getAuthContext(){return f.auth;}},
  '@/db/bootstrap':{async appendAudit(...args){f.audits.push(args);}},'@/db/platform':f.platform,
 });
 f.reset=()=>{f.reads.length=0;f.writes.length=0;f.audits.length=0;f.reviewCalls=0;};
 f.render=async()=>renderToStaticMarkup(await f.page());
 f.request=()=>new Request('https://website.invalid/api/platform/embed-origins',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:'https://teaching.example.invalid'})});
 f.close=()=>sqlite.close();
 return f;
}
async function ready(){
 const f=fixture();await f.platform.ensurePlatformSchema();
 f.sqlite.prepare(`INSERT INTO organization_memberships(organization_id,user_id,role,status,joined_at) VALUES('org-elivion-pilot','edu:one','owner','active','2026-01-01T00:00:00.000Z')`).run();
 f.reset();return f;
}
const states=[
 ['missing membership',f=>f.sqlite.prepare('DELETE FROM organization_memberships').run(),'organization-unavailable'],
 ['suspended institution',f=>f.sqlite.prepare("UPDATE organizations SET status='suspended'").run(),'organization-unavailable'],
 ['revoked membership',f=>f.sqlite.prepare("UPDATE organization_memberships SET status='revoked'").run(),'organization-unavailable'],
 ['missing entitlement',f=>f.sqlite.prepare('DELETE FROM organization_entitlements').run(),'entitlement-unavailable'],
];
test('actual snapshot brands only expected missing institution/entitlement rows and performs no new writes',async()=>{
 for(const [,mutate,reason] of states){
  const f=await ready();try{
   mutate(f);
   await assert.rejects(f.platform.getPlatformSnapshot(f.auth),error=>error.name==='PlatformAccessError'&&error.reason===reason&&error instanceof f.platform.PlatformAccessError);
   assert.equal(f.writes.length,0);assert.equal(f.audits.length,0);
  }finally{f.close();}
 }
});
test('Workspace renders restricted access with My Learning/manual Atlas and no fabricated institution tools',async()=>{
 for(const [,mutate] of states){
  const f=await ready();try{
   mutate(f);const html=await f.render();
   assert.match(html,/Workspace access is restricted/);assert.match(html,/role="status"/);
   assert.match(html,/href="\/my-learning"/);assert.match(html,/href="\/atlas"/);
   assert.doesNotMatch(html,/href="\/studio\/workspace"|href="\/workspace\/control"|embed-origin-manager|workspace-metrics/);
   assert.equal(f.writes.length,0);assert.equal(f.audits.length,0);
  }finally{f.close();}
 }
});
test('missing workspace entitlement does not replace an independent Clinical Review authorization',async()=>{
 const f=await ready();try{
  f.sqlite.prepare('DELETE FROM organization_entitlements').run();f.reviewAllowed=true;
  assert.match(await f.render(),/href="\/workspace\/clinical-review-inbox"/);
  f.reviewAllowed=false;assert.doesNotMatch(await f.render(),/href="\/workspace\/clinical-review-inbox"/);
  assert.equal(f.writes.length,0);
 }finally{f.close();}
});
test('embed GET/POST return explicit403/private-no-store before parsing or writing on expected access refusal',async()=>{
 for(const [,mutate] of states){
  const f=await ready();try{
   mutate(f);const request=f.request();
   for(const response of [await f.route.GET(),await f.route.POST(request)]){
    assert.equal(response.status,403);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
    const body=await response.json();assert.equal(body.code,'PLATFORM_ACCESS_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(body),/org-elivion-pilot|SQL|provider/);
   }
   assert.equal(request.bodyUsed,false);assert.equal(f.writes.length,0);assert.equal(f.audits.length,0);
  }finally{f.close();}
 }
});
test('unexpected SQL/runtime errors remain errors, including text identical to an expected refusal',async()=>{
 for(const message of ['synthetic private SQL failure','No active Visible Medicine organization is available for this account.']){
  const f=await ready();try{
   const error=new Error(message);f.readFailure=error;
   await assert.rejects(f.page(),value=>value===error);
   await assert.rejects(f.route.GET(),value=>value===error);
   await assert.rejects(f.route.POST(f.request()),value=>value===error);
   assert.equal(f.writes.length,0);assert.equal(f.audits.length,0);assert.equal(f.reviewCalls,0);
  }finally{f.close();}
 }
});
test('unauthenticated embed requests keep401/private-no-store and learner Workspace redirect stays before snapshot reads',async()=>{
 const f=await ready();try{
  f.auth=null;
  for(const response of [await f.route.GET(),await f.route.POST(f.request())]){
   assert.equal(response.status,401);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  }
  assert.equal(f.reads.length,0);f.roles=['learner'];
  await assert.rejects(f.page(),/redirect:\/my-learning/);assert.equal(f.reads.length,0);assert.equal(f.reviewCalls,0);
 }finally{f.close();}
});
test('current enabled Workspace/embeds retain actual components and exact institution origin writes',async()=>{
 const f=await ready();try{
  f.reviewAllowed=true;const html=await f.render();
  assert.match(html,/Where would you like to go/);assert.match(html,/href="\/studio\/workspace"/);
  assert.match(html,/embed-origin-manager/);assert.doesNotMatch(html,/Workspace access is restricted/);
  const get=await f.route.GET();assert.equal(get.status,200);assert.equal(get.headers.get('Cache-Control'),'private, no-store');
  const post=await f.route.POST(f.request());assert.equal(post.status,200);assert.equal(post.headers.get('Cache-Control'),'private, no-store');
  const rows=f.sqlite.prepare('SELECT organization_id,origin,status FROM approved_embed_origins').all();
  assert.deepEqual(rows.map(row=>({...row})),[{organization_id:'org-elivion-pilot',origin:'https://teaching.example.invalid',status:'evaluation'}]);
  assert.equal(f.writes.length,1);assert.equal(f.audits.length,1);
 }finally{f.close();}
});
test('existing administrator and effective embed entitlement gates still stop writes before body parsing',async()=>{
 for(const mode of ['educator','disabled-entitlement','expired-entitlement']){
  const f=await ready();try{
   if(mode==='educator')f.roles=['instructor'];
   if(mode==='disabled-entitlement')f.sqlite.prepare('UPDATE organization_entitlements SET embeds_access=0').run();
   if(mode==='expired-entitlement')f.sqlite.prepare("UPDATE organization_entitlements SET valid_until='2000-01-01T00:00:00.000Z'").run();
   const request=f.request(),response=await f.route.POST(request);
   assert.equal(response.status,403);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
   assert.equal(request.bodyUsed,false);assert.equal(f.writes.length,0);assert.equal(f.audits.length,0);
  }finally{f.close();}
 }
});
