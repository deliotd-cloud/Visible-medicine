import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';

const hash=digit=>digit.repeat(64);
let current={revision:hash('a'),modelRevision:hash('b')};
const output=await build({stdin:{contents:"export * from './lib/prostate-review-api.ts'; export * from './lib/prostate-review-contract.ts'; export * from './lib/prostate-review-store.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',target:'es2022',plugins:[{name:'synthetic-prostate-material',setup(builder){builder.onResolve({filter:/prostate-review-material\.ts$/},()=>({path:'synthetic-prostate',namespace:'synthetic'}));builder.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:'export async function prostateReviewMaterial(){return globalThis.__prostateReviewMaterial;}',loader:'js'}));}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const reset=()=>{current={revision:hash('a'),modelRevision:hash('b')};globalThis.__prostateReviewMaterial=current;};reset();
const context=()=>api.prostateReviewContext(current);
const principal=(account='a',institution='one')=>JSON.stringify(['vm-website-personal-review-1',account,institution]);
function fixture(){
 const sql=new DatabaseSync(':memory:');
 const migration=readFileSync(new URL('../drizzle/0008_solid_infant_terrible.sql',import.meta.url),'utf8');
 sql.exec(migration.split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`')));
 let prepares=0;
 const db={prepare(query){prepares++;return {bind(...params){const statement=sql.prepare(query);return {async all(){return {success:true,results:statement.all(...params)};},async run(){const result=statement.run(...params);return {success:true,meta:{changes:Number(result.changes)}};}};}};}};
 return {sql,db,get prepares(){return prepares;},close(){sql.close();}};
}
function request(method,body,options={}){
 const query=options.query??`?revision=${hash('a')}`;
 return new Request('https://review.test/api/atlas-review/prostate'+query,{method,headers:{'oai-authenticated-user-id':principal(options.account,options.institution),...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{}),...options.headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
const payload=(expectedVersion=0,selected=context(),decision=api.blankProstateDecision())=>({context:selected,expectedVersion,decision});
const call=(db,method,body,options)=>method==='GET'?api.getProstateReviews(request(method,body,options),db):api.postProstateReview(request(method,body,options),db);

test('exact context and independently selected geometry and teaching decisions',()=>{
 reset();const c=context(),blank=api.blankProstateDecision();
 assert.deepEqual(api.validateProstateDecision(blank),blank);
 for(const chosen of [{geometry:'approved',teaching:'not-reviewed',notes:'',attested:true},{geometry:'not-reviewed',teaching:'approved',notes:'',attested:true},{geometry:'changes-required',teaching:'approved',notes:'ten clear characters',attested:true}])assert.deepEqual(api.validateProstateDecision(chosen),chosen);
 for(const bad of [{...blank,attested:true},{...blank,geometry:'approved'},{...blank,teaching:'changes-required',notes:'short'},{...blank,notes:'x'.repeat(6001)},{...blank,notes:'bad\u0000note'},{...blank,extra:true}])assert.throws(()=>api.validateProstateDecision(bad));
 for(const bad of [{...c,modelRevision:hash('A')},{...c,contentRevision:'x'},{...c,publicationApproval:true},{...c,extra:true}])assert.throws(()=>api.parseProstateReviewContext(bad));
 assert.throws(()=>api.prostateReviewContext({revision:'x',modelRevision:hash('b')}));
 const event=api.parseProstateReviewEvent({eventSchema:'vm-prostate-zones-review-event-1',context:c,version:1,savedAt:'2026-11-01T12:00:00.000Z',decision:blank});
 const history={context:c,history:[event],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
 assert.deepEqual(api.parseProstateReviewHistory(history,c).history,[event]);
 assert.throws(()=>api.parseProstateReviewHistory({...history,scope:'public'},c));
 assert.throws(()=>api.parseProstateReviewHistory({...history,history:[event,event]},c));
 assert.equal(api.parseProstateReviewHistory({...history,history:[{...event,context:{...c,contentRevision:hash('f')}}]},c).history[0].context.contentRevision,hash('f'));
});

test('authentication and strict request boundaries run before database access',async()=>{
 reset();const f=fixture();try{
  const cases=[
   [request('GET',undefined,{headers:{'oai-authenticated-user-id':''}}),401],
   [request('GET',undefined,{query:''}),400],
   [request('GET',undefined,{query:`?revision=${hash('f')}`}),409,'source-changed'],
   [request('GET',undefined,{query:`?revision=${hash('a')}&extra=1`}),400],
   [request('GET',undefined,{headers:{'X-Prostate-Review-Before':'01'}}),400],
   [request('POST',payload(),{headers:{origin:'https://evil.test'}}),403],
   [request('POST',payload(),{headers:{'sec-fetch-site':'cross-site'}}),403],
   [request('POST',payload(),{headers:{'content-type':'text/plain'}}),415],
   [request('POST',payload(),{headers:{'X-Prostate-Review-Before':'2'}}),400],
   [request('POST',{...payload(),publicationApproval:true}),400],
   [request('POST',payload(-1)),400],
   [request('POST',payload(0,{...context(),contentRevision:hash('f')})),409,'source-changed'],
   [request('POST',payload(0,context(),{...api.blankProstateDecision(),geometry:'approved'})),422],
  ];
  for(const [req,status,code] of cases){const response=req.method==='GET'?await api.getProstateReviews(req,f.db):await api.postProstateReview(req,f.db);assert.equal(response.status,status,await response.clone().text());if(code)assert.equal((await response.json()).code,code);assert.equal(f.prepares,0);}
 }finally{f.close();}
});

test('SQLite event stream enforces account scope, atomic versioning, pagination and old revisions',async()=>{
 reset();const f=fixture();try{
  assert.equal((await call(f.db,'POST',payload())).status,201);
  const race=await Promise.all([call(f.db,'POST',payload(1,context(),{geometry:'approved',teaching:'not-reviewed',notes:'',attested:true})),call(f.db,'POST',payload(1,context(),{geometry:'approved',teaching:'not-reviewed',notes:'',attested:true}))]);
  assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
  for(let expected=2;expected<22;expected++)assert.equal((await call(f.db,'POST',payload(expected))).status,201);
  const latest=await (await call(f.db,'GET')).json();assert.deepEqual(latest.history.map(e=>e.version),Array.from({length:20},(_,i)=>22-i));assert.equal(latest.nextBefore,3);assert.equal(latest.latestVersion,22);
  const older=await (await call(f.db,'GET',undefined,{headers:{'X-Prostate-Review-Before':'3'}})).json();assert.deepEqual(older.history.map(e=>e.version),[2,1]);assert.equal(older.latestVersion,22);
  for(const identity of [{account:'b'},{institution:'two'}])assert.deepEqual((await (await call(f.db,'GET',undefined,identity)).json()).history,[]);
  const row=f.sql.prepare('SELECT payload FROM atlas_personal_nested_review_events WHERE version=1').get();
  f.sql.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE version=1').run(JSON.stringify({...JSON.parse(row.payload),context:{...context(),contentRevision:hash('f')}}));
  assert.equal((await (await call(f.db,'GET',undefined,{headers:{'X-Prostate-Review-Before':'2'}})).json()).history[0].context.contentRevision,hash('f'));
  const rows=f.sql.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all();
  assert(rows.every(row=>row.user_id===JSON.stringify(['vm-prostate-zones-private-1',principal()])&&row.nested_key===api.prostateReviewKey(context())&&row.structure_id==='prostate-zones'&&row.track==='teaching'));
 }finally{f.close();}
});

test('source change and unconfirmed storage never imply a saved decision',async()=>{
 reset();const f=fixture();try{
  current={revision:hash('f'),modelRevision:hash('b')};globalThis.__prostateReviewMaterial=current;
  assert.equal((await call(f.db,'POST',payload())).status,409);assert.equal(f.prepares,0);
 }finally{f.close();reset();}
 assert.equal((await call(undefined,'GET')).status,503);
 const falseRead={prepare(){return {bind(){return {async all(){return {success:false,results:[]};}};}}}};
 assert.equal((await call(falseRead,'GET')).status,503);
 const falseWrite={prepare(){return {bind(){return {async all(){return {success:true,results:[]};},async run(){return {success:false,meta:{changes:1}};}};}}}};
 assert.equal((await call(falseWrite,'POST',payload())).status,503);
 const f2=fixture();try{assert.equal((await call(f2.db,'POST',payload())).status,201);f2.sql.prepare('UPDATE atlas_personal_nested_review_events SET saved_at=?').run('2020-01-01T00:00:00.000Z');assert.equal((await call(f2.db,'GET')).status,503);}finally{f2.close();}
});
