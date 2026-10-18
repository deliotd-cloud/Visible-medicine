import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{build}=require('esbuild'),{Miniflare,convertV4MiniflareOptions}=require('miniflare');
const source=readFileSync(process.env.PROGRESS_DB_SOURCE??new URL('../db/progress.ts',import.meta.url),'utf8');
// The fault seam rejects only the first CREATE; all successful SQL still runs
// against real isolated D1 in workerd. No production binding is read or changed.
const guard=`import {env as actualEnv} from 'cloudflare:workers';
export const observations={initializations:0,writes:0,reads:0};
const database={prepare(sql){
  if(/^\\s*CREATE TABLE IF NOT EXISTS learning_progress/.test(sql))return{async run(){
    observations.initializations++;
    if(observations.initializations===1)throw new Error('Synthetic schema unavailable');
    return actualEnv.DB.prepare(sql).run();
  }};
  if(/^\\s*INSERT INTO learning_progress/.test(sql))observations.writes++;
  if(/^\\s*SELECT/.test(sql))observations.reads++;
  return actualEnv.DB.prepare(sql);
}};
export const env={DB:database};`;
const wrapper=`
import {observations} from 'bootstrap-observations';
export default {async fetch(request){
  const input=await request.json();
  try{
    const value=input.list?await listProgress(input.user):await saveProgress(input.user,input.record);
    return Response.json({value,observations});
  }catch(error){
    return Response.json({syntheticFailure:error instanceof Error&&error.message==='Synthetic schema unavailable',observations},{status:503});
  }
}};`;
const built=await build({stdin:{contents:source+wrapper,loader:'ts',resolveDir:fileURLToPath(new URL('../',import.meta.url)),sourcefile:'progress-bootstrap-synthetic-worker.ts'},
  bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent',plugins:[{name:'first-bootstrap-fault',setup(b){
    b.onResolve({filter:/^(cloudflare:workers|bootstrap-observations)$/},args=>args.namespace==='guarded'&&args.path==='cloudflare:workers'
      ?{path:args.path,external:true}:{path:'guarded-workers',namespace:'guarded'});
    b.onLoad({filter:/.*/,namespace:'guarded'},()=>({contents:guard,loader:'js'}));
  }}]});
console.log(JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),mode:'actual progress module in local workerd; first CREATE rejection injected; all successful SQL uses synthetic isolated D1; no live/app/patient data'}));

test('local workerd progress recovers after initial schema rejection without replaying a save',{timeout:30000},async()=>{
  const options={name:'synthetic-progress-bootstrap',modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,d1Databases:{DB:'synthetic-bootstrap-only'},d1Persist:false};
  const mf=new Miniflare({...convertV4MiniflareOptions(options),telemetry:{enabled:false}});
  try{
    const request=async input=>{
      const response=await mf.dispatchFetch('http://synthetic.invalid/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
      return {status:response.status,body:await response.json()};
    };
    const user='synthetic-learner',record={resourceType:'course',resourceSlug:'synthetic-course',progress:70,lastPosition:12};
    const failed=await request({user,record});
    assert.equal(failed.status,503);assert.equal(failed.body.syntheticFailure,true);
    assert.deepEqual(failed.body.observations,{initializations:1,writes:0,reads:0});
    // No automatic retry: only this later, explicit call tries initialization.
    const retry=await request({user,record});assert.equal(retry.status,200);
    assert.equal(retry.body.value.progress,70);assert.equal(retry.body.value.lastPosition,12);
    assert.deepEqual(retry.body.observations,{initializations:2,writes:1,reads:0});
    const stale=await request({user,record:{...record,progress:5,lastPosition:1}});assert.equal(stale.status,200);
    assert.equal(stale.body.value.progress,70);assert.equal(stale.body.value.lastPosition,12);
    assert.deepEqual(stale.body.observations,{initializations:2,writes:2,reads:0});
    const listed=await request({user,list:true});assert.equal(listed.status,200);
    assert.equal(listed.body.value.length,1);assert.deepEqual(listed.body.value[0],stale.body.value);
    assert.deepEqual(listed.body.observations,{initializations:2,writes:2,reads:1});
    const other=await request({user:'another-synthetic-learner',list:true});assert.equal(other.status,200);assert.deepEqual(other.body.value,[]);
    const db=await mf.getD1Database('DB');
    const count=await db.prepare('SELECT COUNT(*) AS count FROM learning_progress').first();assert.equal(count.count,1);
  }finally{await mf.dispose();}
});
