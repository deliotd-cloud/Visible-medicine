import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

// Actual adapter SQL + existing workbook policy against synthetic in-memory
// tables. Only signed-in identity and the independently tested manifest verifier
// are substituted. No hosting SDK, account, database or media object is accessed.
const require=createRequire(import.meta.url),ts=require('typescript');
const bootstrap=readFileSync(new URL('../db/bootstrap.ts',import.meta.url),'utf8');
const tree=ts.createSourceFile('bootstrap.ts',bootstrap,ts.ScriptTarget.Latest,true);
const declaration=tree.statements.filter(ts.isVariableStatement)
 .flatMap(row=>row.declarationList.declarations).find(row=>row.name.getText(tree)==='SCHEMA');
assert(declaration&&ts.isArrayLiteralExpression(declaration.initializer));
const tables=new Set(['users','account_security_profiles','courses','modules','workbooks','cases','workbook_cases','enrolments','workbook_assignments','workbook_assignment_rules','workbook_progress','cohorts','cohort_members','cohort_workbook_assignments']);
const schema=declaration.initializer.elements.filter(ts.isNoSubstitutionTemplateLiteral)
 .map(row=>row.text).filter(sql=>tables.has(/^CREATE TABLE IF NOT EXISTS ([a-z_]+)/.exec(sql)?.[1]));
assert.equal(schema.length,tables.size,'Use current actual table definitions, not weakened lookalikes');
const compiled=await build({entryPoints:[fileURLToPath(new URL('../lib/education-media-access.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'synthetic-server-identity-and-verifier',setup(builder){
 builder.onResolve({filter:/^(cloudflare:workers|\.\/auth|\.\/assessment-manifest-store)$/},args=>{
  if(args.path==='cloudflare:workers'||args.importer.endsWith('education-media-access.ts'))return {path:args.path,namespace:'synthetic'};
 });
 builder.onLoad({filter:/.*/,namespace:'synthetic'},args=>({loader:'js',contents:args.path==='cloudflare:workers'
  ? 'export const env=new Proxy({},{get:(_,key)=>globalThis.__vmExactMediaAccessFixture.env[key]});'
  : args.path==='./auth'
  ? 'export async function getAuthContext(){return globalThis.__vmExactMediaAccessFixture.auth;}'
  : 'export async function getVerifiedAssessmentManifest(id){const f=globalThis.__vmExactMediaAccessFixture;f.verified.push(id);if(f.verifierThrows)throw Error("synthetic verifier failure");return f.record;}'}));
}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash='a'.repeat(64),actorId='edu:learner-1';
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON;');for(const sql of schema)sqlite.exec(sql);
 const at='2026-01-01T00:00:00Z';
 function insert(table,row){assert(tables.has(table));const cols=Object.keys(row);sqlite.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`).run(...Object.values(row));}
 insert('users',{id:actorId,external_subject:'sites:learner-1',email:'learner@example.invalid',display_name:'Synthetic learner',roles:'learner',created_at:at,last_seen_at:at});
 insert('account_security_profiles',{user_id:actorId,status:'active',identity_provider:'openai-sites',registered_at:at,last_authenticated_at:at,terms_version:'',privacy_version:'',updated_at:at});
 insert('cases',{id:'case-1',title:'Synthetic case',classification:'radiology',status:'published',version:1,description:'Synthetic metadata, no image',visual_kind:'ct',tools_json:'[]',publication_hash:'b'.repeat(64),deidentified:1,publication_cleared:1});
 for(const suffix of ['1','2']){
  insert('courses',{id:'course-'+suffix,code:'SYN-'+suffix,title:'Synthetic',description:'Synthetic only',status:'published'});
  insert('modules',{id:'module-'+suffix,course_id:'course-'+suffix,title:'Synthetic',position:1});
  insert('workbooks',{id:'workbook-'+suffix,module_id:'module-'+suffix,title:'Synthetic',mode:'assessment',version:1,status:'published',duration_minutes:30});
  insert('workbook_cases',{workbook_id:'workbook-'+suffix,case_id:'case-1',position:1});
  insert('enrolments',{id:'enrolment-'+suffix,user_id:actorId,course_id:'course-'+suffix,status:'active',enrolled_at:at});
  insert('workbook_assignments',{id:'assignment-'+suffix,workbook_id:'workbook-'+suffix,learner_id:actorId,status:'active',assigned_by:actorId,assigned_at:at,version:1});
 }
 const f={sqlite,auth:{userId:actorId,externalSubject:'sites:learner-1'},record:{id:'assessment-v1',integrityHash:hash,manifest:{product:'Visible Medicine',intendedPurpose:'education-only',workbook:{id:'workbook-1'},cases:[{id:'case-1'}]}},verified:[],queries:[],sessions:[],databaseThrows:false};
 function prepare(sql){return {bind(...values){return {async first(){f.queries.push({sql,values});if(f.databaseThrows)throw Error('synthetic private provider error');return sqlite.prepare(sql).get(...values)??null;}};}};}
 f.env={DB:{prepare,withSession(hint){f.sessions.push(hint);assert.equal(hint,'first-primary');return {prepare};}}};
 globalThis.__vmExactMediaAccessFixture=f;
 const authorize=api.createEducationMediaCaseAuthorizer('assessment-v1',hash);
 return Object.assign(f,{check:()=>authorize(actorId,'workbook-1','case-1'),close:()=>sqlite.close()});
}

test('actual server actor/membership SQL and existing learner eligibility admit only the exact workbook',async()=>{
 const f=fixture();try{
  assert.equal(await f.check(),true);
  assert.deepEqual(f.sessions,['first-primary','first-primary']);
  assert.deepEqual(f.verified,['assessment-v1']);
  assert(f.queries.every(row=>/^\s*SELECT/.test(row.sql)),'No provisioning, grant or other write');
  assert(f.queries.some(row=>row.sql.includes('u.external_subject = ?')&&row.values[1]==='sites:learner-1'));
  assert(f.queries.some(row=>row.sql.includes('JOIN cases c')&&row.values.join('/')==='workbook-1/case-1'));
  f.sqlite.prepare("UPDATE workbook_assignments SET status='revoked' WHERE workbook_id='workbook-1'").run();
  assert.equal(await f.check(),false,'Still has same case through workbook2, not requested workbook1');
 }finally{f.close();}
});

test('withdrawn case and withdrawn workbook deny despite frozen assessment membership',async()=>{
 for(const table of ['cases','workbooks']){
  const f=fixture();try{
   f.sqlite.prepare(`UPDATE ${table} SET status='draft'`).run();
   assert.equal(await f.check(),false);
  }finally{f.close();}
 }
});

test('current server account and external identity binding are rechecked without provisioning',async()=>{
 for(const mutation of [
  f=>{f.auth=null;},
  f=>{f.auth.externalSubject='sites:someone-else';},
  f=>{f.sqlite.prepare("UPDATE account_security_profiles SET status='restricted'").run();},
  f=>{f.sqlite.prepare('DELETE FROM account_security_profiles').run();},
  f=>{f.sqlite.prepare("UPDATE users SET roles='atlas-subscriber'").run();},
 ]){
  const f=fixture();try{mutation(f);assert.equal(await f.check(),false);assert.equal(f.verified.length,0);}finally{f.close();}
 }
});

test('staff policy is reused and a subsequent role downgrade cannot reuse staff access',async()=>{
 const f=fixture();try{
  f.sqlite.prepare("UPDATE users SET roles='instructor'").run();
  f.sqlite.prepare("UPDATE workbook_assignments SET status='revoked'").run();
  assert.equal(await f.check(),true,'Existing staff rule requires published workbook, not learner assignment');
  f.sqlite.prepare("UPDATE users SET roles='learner'").run();
  assert.equal(await f.check(),false,'Persisted roles reread on next call');
 }finally{f.close();}
});

test('actual SQL/provider and verified-manifest failures return false, never provider details',async()=>{
 for(const key of ['databaseThrows','verifierThrows']){
  const f=fixture();try{f[key]=true;assert.equal(await f.check(),false);}finally{f.close();}
 }
});
