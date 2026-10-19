import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{build}=require('esbuild'),{Miniflare,convertV4MiniflareOptions}=require('miniflare');
const source=readFileSync(process.env.PLATFORM_DB_SOURCE??new URL('../db/platform.ts',import.meta.url),'utf8');
console.log(JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),mode:'actual platform initializer in local workerd; one injected phase failure; successful batches use real isolated synthetic D1; no app auth/private/cloud data'}));

async function script(phase){
  const guard=`import {env as actualEnv} from 'cloudflare:workers';
export const observations={batches:0,optimize:0};
let failed=false;
const wrap=(statement,sql)=>({statement,sql,
  bind(...values){return wrap(statement.bind(...values),sql);},
  first(...args){return statement.first(...args);},all(){return statement.all();},
  async run(){
    if(sql==='PRAGMA optimize'){
      observations.optimize++;
      if(!failed&&${JSON.stringify(phase)}==='optimize'){failed=true;throw new Error('Synthetic optimize failure');}
    }
    return statement.run();
  }
});
const database={prepare(sql){return wrap(actualEnv.DB.prepare(sql),sql);},async batch(statements){
  observations.batches++;
  const phase=/^CREATE/.test(statements[0].sql)?'schema':'seed';
  if(!failed&&phase===${JSON.stringify(phase)}){failed=true;throw new Error('Synthetic '+phase+' failure');}
  return actualEnv.DB.batch(statements.map(value=>value.statement));
}};
export const env={DB:database};`;
  const wrapper=`
import {observations} from 'platform-observations';
export default {async fetch(){
  try{await ensurePlatformSchema();return Response.json({ready:true,observations});}
  catch(error){return Response.json({syntheticFailure:error instanceof Error&&/^Synthetic (schema|seed|optimize) failure$/.test(error.message),observations},{status:503});}
}};`;
  const result=await build({stdin:{contents:source+wrapper,loader:'ts',resolveDir:fileURLToPath(new URL('../db/',import.meta.url)),sourcefile:'platform-synthetic-worker.ts'},
    bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent',plugins:[{name:'platform-first-phase-fault',setup(b){
      b.onResolve({filter:/^(cloudflare:workers|platform-observations)$/},args=>args.namespace==='guarded'&&args.path==='cloudflare:workers'
        ?{path:args.path,external:true}:{path:'guarded-workers',namespace:'guarded'});
      b.onLoad({filter:/.*/,namespace:'guarded'},()=>({contents:guard,loader:'js'}));
      b.onResolve({filter:/^\.\/bootstrap$/},()=>({path:'unused-bootstrap',namespace:'synthetic'}));
      b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:"export async function ensureEducationUser(){throw new Error('Actual user bootstrap must not execute in schema-only test');}",loader:'js'}));
    }}]});
  return result.outputFiles[0].text;
}

for(const phase of ['schema','seed','optimize'])test(`local workerd platform initializer recovers after ${phase} failure and stays warm`,{timeout:30000},async()=>{
  const options={name:'synthetic-platform-'+phase,modules:true,script:await script(phase),compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,d1Databases:{DB:'synthetic-platform-only'},d1Persist:false};
  const mf=new Miniflare({...convertV4MiniflareOptions(options),telemetry:{enabled:false}});
  try{
    const db=await mf.getD1Database('DB');
    assert.equal((await db.prepare('PRAGMA foreign_keys').first()).foreign_keys,1);
    await db.batch(['users','courses','workbooks','ingestion_jobs'].map(table=>db.prepare(`CREATE TABLE ${table} (id TEXT PRIMARY KEY)`)));
    await db.prepare('INSERT INTO users (id) VALUES (?)').bind('edu:system-examiner').run();
    await db.prepare('INSERT INTO courses (id) VALUES (?)').bind('course-advanced-imaging').run();
    await db.batch(['workbook-teaching-demo','workbook-assessment'].map(id=>db.prepare('INSERT INTO workbooks (id) VALUES (?)').bind(id)));
    const request=async()=>{const response=await mf.dispatchFetch('http://synthetic.invalid/');return{status:response.status,body:await response.json()};};
    const failed=await request();assert.equal(failed.status,503);assert.equal(failed.body.syntheticFailure,true);
    assert.deepEqual(failed.body.observations,{batches:phase==='schema'?1:2,optimize:phase==='optimize'?1:0},'no automatic initialization retry');
    let preserved;
    if(phase==='optimize'){
      // These are synthetic owner edits after seed commit, not real access changes.
      await db.prepare("UPDATE organization_entitlements SET atlas_access=0,studio_access=0,status='suspended' WHERE organization_id=?").bind('org-elivion-pilot').run();
      await db.prepare("UPDATE course_releases SET visibility='private',access_model='paid',price_minor=1234,status='draft',enrolment_open=0 WHERE id=?").bind('release-integrated-imaging-v1').run();
      preserved={entitlement:await db.prepare('SELECT * FROM organization_entitlements').first(),release:await db.prepare('SELECT * FROM course_releases').first()};
    }
    const recovered=await request();assert.equal(recovered.status,200);assert.equal(recovered.body.ready,true);
    const expected={batches:phase==='schema'?3:4,optimize:phase==='optimize'?2:1};
    assert.deepEqual(recovered.body.observations,expected);
    const warm=await request();assert.equal(warm.status,200);assert.deepEqual(warm.body.observations,expected);
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM course_releases').first()).count,1);
    if(preserved){assert.deepEqual(await db.prepare('SELECT * FROM organization_entitlements').first(),preserved.entitlement);assert.deepEqual(await db.prepare('SELECT * FROM course_releases').first(),preserved.release);}
    const ct=await db.prepare('SELECT rights_status,deidentification_status,specialist_review_status,reviewer,reviewed_at FROM education_publications WHERE id=?').bind('publication-ct-head-v1').first();
    assert.deepEqual(ct,{rights_status:'clearance-required',deidentification_status:'synthetic-demonstration',specialist_review_status:'review-required',reviewer:null,reviewed_at:null});
    for(const table of ['organization_memberships','course_completions','education_certificates','atlas_publication_reviews'])assert.equal((await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()).count,0,table);
  }finally{await mf.dispose();}
});
