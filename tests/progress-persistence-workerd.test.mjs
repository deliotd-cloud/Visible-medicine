import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{build}=require('esbuild'),{Miniflare,convertV4MiniflareOptions}=require('miniflare');
const source=readFileSync(new URL('../db/progress.ts',import.meta.url),'utf8');
const built=await build({stdin:{contents:source+'\nexport default {async fetch(request) {const input=await request.json();return Response.json(input.list ? await listProgress(input.user) : await saveProgress(input.user,input.record));}};',loader:'ts',resolveDir:fileURLToPath(new URL('../',import.meta.url)),sourcefile:'progress-synthetic-worker.ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers'],logLevel:'silent'});
console.log(JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),mode:'actual progress module in local workerd with synthetic isolated D1; no app auth or patient data; no hosted/cloud resources'}));

test('local workerd D1 RETURNING acknowledges merged course progress and preserves Atlas slice behavior',{timeout:30000},async()=>{
 // This checkout uses Miniflare5 alpha. Its exported compatibility converter
 // translates the documented v4 fixture options without changing dependencies.
 const options={name:'synthetic-progress-verification',modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,d1Databases:{DB:'synthetic-progress-only'},d1Persist:false};
 const mf=new Miniflare({...convertV4MiniflareOptions(options),telemetry:{enabled:false}});
 try{
  const save=async(record,user='synthetic-learner')=>{
   const response=await mf.dispatchFetch('http://synthetic.invalid/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user,record})});
   assert.equal(response.status,200);return response.json();
  };
  const course=(progress,lastPosition)=>({resourceType:'course',resourceSlug:'synthetic-course',progress,lastPosition});
  const first=await save(course(100,999)),stale=await save(course(5,1));
  assert.equal(first.progress,100);assert.equal(stale.progress,100);assert.equal(stale.lastPosition,999);assert.equal(stale.resourceSlug,'synthetic-course');
  const db=await mf.getD1Database('DB');
  const row=await db.prepare('SELECT progress,last_position AS lastPosition FROM learning_progress WHERE user_id=? AND resource_type=? AND resource_slug=?').bind('synthetic-learner','course','synthetic-course').first();
  assert.deepEqual(row,{progress:100,lastPosition:999});
  const other=await save(course(5,1),'another-synthetic-learner');assert.equal(other.progress,5);assert.equal(other.lastPosition,1);
  const atlas=(progress,lastPosition)=>({resourceType:'atlas',resourceSlug:'synthetic-atlas',progress,lastPosition});
  await save(atlas(80,40));const revisit=await save(atlas(20,3));assert.equal(revisit.progress,20);assert.equal(revisit.lastPosition,3);
  const response=await mf.dispatchFetch('http://synthetic.invalid/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user:'synthetic-learner',list:true})});
  assert.equal(response.status,200);const listed=await response.json();assert.equal(listed.length,2);assert.equal(listed.find(r=>r.resourceType==='course').progress,100);
 }finally{await mf.dispose();}
});
