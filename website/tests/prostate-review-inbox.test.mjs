import assert from 'node:assert/strict';import test from 'node:test';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export * from './lib/prostate-review-inbox.ts';export * from './lib/prostate-review-material.ts';export * from './lib/prostate-review-contract.ts';export * from './lib/prostate-review-api.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
const material=await api.prostateReviewMaterial(),context=api.prostateReviewContext(material),catalog=await api.prostateReviewInboxCatalog();
function dbFixture(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`')));const db={prepare(query){return{bind(...params){const stmt=sql.prepare(query);return{async all(){return{success:true,results:stmt.all(...params)};},async run(){return{success:true,meta:{changes:Number(stmt.run(...params).changes)}};}};}};}};return{sql,db};}
const request=(method='GET',body,principal='synthetic:account:institution')=>new Request('https://review.test/api/atlas-review/prostate?revision='+context.contentRevision,{method,headers:{'oai-authenticated-user-id':principal,...(method==='POST'?{'content-type':'application/json',origin:'https://review.test'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const decision=(geometry='not-reviewed',teaching='not-reviewed')=>({geometry,teaching,notes:'Synthetic review corrections only.',attested:[geometry,teaching].includes('approved')});
test('grouped row requires both sections and exact current source; real SQLite remains account scoped',async()=>{
 const f=dbFixture();try{let version=0;const status=async(principal)=> (await api.prostateReviewInboxStatuses(request('GET',undefined,principal),f.db,catalog))[0].status;
  assert.equal(await status(),'not-started');
  for(const[g,t,want]of[['approved','not-reviewed','in-progress'],['not-reviewed','approved','in-progress'],['approved','changes-required','changes-required'],['approved','approved','approval-recorded']]){
   const saved=await api.postProstateReview(request('POST',{context,expectedVersion:version++,decision:decision(g,t)}),f.db);assert.equal(saved.status,201);assert.equal(await status(),want);
  }
  assert.equal(await status('synthetic:other:institution'),'not-started');
  assert.equal(await status('synthetic:account:other'),'not-started');
  const row=f.sql.prepare('SELECT * FROM atlas_personal_nested_review_events ORDER BY version DESC LIMIT 1').get();
  const event=JSON.parse(row.payload);event.context.contentRevision='0'.repeat(64);f.sql.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE version=?').run(JSON.stringify(event),row.version);
  assert.equal(await status(),'re-review');
  event.context.patientRegistration=true;f.sql.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE version=?').run(JSON.stringify(event),row.version);assert.equal(await status(),'unavailable');
 }finally{f.sql.close();}
});
test('unconfirmed database reads and changed descriptors never imply an empty or approved review',async()=>{
 const badDb={prepare(){return{bind(){return{all:async()=>({success:false,results:[]})};}};}};
 for(const db of [undefined,badDb])assert.equal((await api.prostateReviewInboxStatuses(request(),db,catalog))[0].status,'unavailable');
 const f=dbFixture();try{for(const item of [{...catalog[0],revision:'0'.repeat(64)},{...catalog[0],capability:'inspection-only'},{...catalog[0],href:catalog[0].href+'&other=x'}])assert.equal((await api.prostateReviewInboxStatuses(request(),f.db,[item]))[0].status,'unavailable');}finally{f.sql.close();}
});
