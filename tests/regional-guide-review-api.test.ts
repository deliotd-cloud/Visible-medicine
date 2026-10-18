import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';

const hash=(digit:string)=>digit.repeat(64);
const packet={schema:'vm-regional-guide-review-packet-1',region:'knee',guideId:'posterior-knee',title:'Synthetic knee teaching',guideRevision:'synthetic-v1',contentRevision:hash('a'),steps:[],approvalScope:'guide-teaching-only',patientRegistration:false,publicationApproval:false};
const output=await build({stdin:{contents:"export * from './lib/regional-guide-review-api.ts'; export * from './lib/regional-guide-review-contract.ts'; export * from './lib/regional-guide-review-store.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',target:'es2022',plugins:[{name:'synthetic-canonical-guide',setup(builder){builder.onResolve({filter:/regional-guide-review\.ts$/},()=>({path:'synthetic-guide',namespace:'synthetic'}));builder.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:`export function parseRegionalGuideReviewSelection(v){return v&&Object.keys(v).length===3&&v.region==='knee'&&v.guide==='posterior-knee'&&/^[a-f0-9]{64}$/.test(v.revision)?v:null;} export async function resolveRegionalGuideReview(v){return v.revision===${JSON.stringify(packet.contentRevision)}?${JSON.stringify(packet)}:null;}`,loader:'js'}));}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64')) as any;
const context=api.regionalGuideReviewContext(packet);
const decision=api.blankRegionalGuideDecision();
const approved={status:'approved',notes:'Reviewed synthetic teaching only.',checks:{facts:true,scope:true,sources:true,navigation:true},attested:true};
const principal=(account='a',institution='one')=>JSON.stringify(['vm-website-personal-review-1',account,institution]);
function fixture(){
 const sql=new DatabaseSync(':memory:');
 const migration=readFileSync(new URL('../drizzle/0008_solid_infant_terrible.sql',import.meta.url),'utf8');
 sql.exec(migration.split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`'))!);
 let prepares=0;
 const db={prepare(query:string){prepares++;return {bind(...params:any[]){const statement=sql.prepare(query);return {async all(){return {success:true,results:statement.all(...params)};},async run(){const result=statement.run(...params);return {success:true,meta:{changes:Number(result.changes)}};}};}};}};
 return {sql,db,get prepares(){return prepares;},close(){sql.close();}};
}
function request(method:'GET'|'POST',body?:unknown,options:{query?:string;headers?:Record<string,string>;account?:string;institution?:string}={}){
 const query=options.query??`?region=knee&guide=posterior-knee&revision=${packet.contentRevision}`;
 return new Request('https://review.test/api/atlas-review/regional-guide'+query,{method,headers:{'oai-authenticated-user-id':principal(options.account,options.institution),...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{}),...options.headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
const payload=(expectedVersion=0,selected:unknown=context,chosen:unknown=decision)=>({context:selected,expectedVersion,decision:chosen});
async function call(db:any,method:'GET'|'POST',body?:unknown,options:Parameters<typeof request>[2]={}){const req=request(method,body,options);return method==='GET'?api.getRegionalGuideReviews(req,db):api.postRegionalGuideReview(req,db);}

test('contract confines approval to exact current guide teaching',()=>{
 assert.deepEqual(api.validateRegionalGuideDecision(approved),approved);
 for(const bad of [{...approved,attested:false},{...approved,checks:{...approved.checks,sources:false}},{...approved,publicationApproval:true},{...approved,status:'changes-required',attested:false,notes:'short'},{...decision,attested:true},{...decision,notes:'x'.repeat(6001)}])assert.throws(()=>api.validateRegionalGuideDecision(bad));
 const event=api.parseRegionalGuideReviewEvent({eventSchema:'vm-regional-guide-teaching-review-event-1',context,version:1,savedAt:'2026-10-14T12:00:00.000Z',decision:approved});
 assert.deepEqual(api.parseRegionalGuideReviewHistory({context,history:[event],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'},context).history,[event]);
 assert.throws(()=>api.parseRegionalGuideReviewHistory({context,history:[event,event],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'},context));
 assert.throws(()=>api.parseRegionalGuideReviewHistory({context,history:[event],latestVersion:1,nextBefore:null,scope:'public'},context));
});

test('authorization, request shape, stale source and CSRF refuse before storage',async()=>{
 const f=fixture();try{
  const cases:Array<[Request,number,string?]>=[
   [request('GET',undefined,{headers:{'oai-authenticated-user-id':''}}),401],
   [request('GET',undefined,{query:'?region=knee&guide=posterior-knee'}),400],
   [request('GET',undefined,{query:`?region=knee&guide=posterior-knee&revision=${hash('b')}`}),409,'source-changed'],
   [request('GET',undefined,{query:`?region=knee&guide=posterior-knee&revision=${hash('a')}&extra=1`}),400],
   [request('GET',undefined,{headers:{'X-Regional-Guide-Before':'01'}}),400],
   [request('POST',payload(),{headers:{origin:'https://evil.test'}}),403],
   [request('POST',payload(),{headers:{'sec-fetch-site':'cross-site'}}),403],
   [request('POST',payload(),{headers:{'content-type':'text/plain'}}),415],
   [request('POST',payload(),{headers:{'X-Regional-Guide-Before':'2'}}),400],
   [request('POST',{...payload(),globalApproval:true}),400],
   [request('POST',payload(-1)),400],
   [request('POST',payload(0,{...context,contentRevision:hash('b')})),409,'source-changed'],
   [request('POST',payload(0,context,{...approved,attested:false})),422],
   [request('POST',payload(0,context,{...approved,publicationApproval:true})),422],
   [request('POST',payload(0,context,{...decision,notes:'x'.repeat(33000)})),413],
  ];
  for(const [req,status,code] of cases){const response=req.method==='GET'?await api.getRegionalGuideReviews(req,f.db):await api.postRegionalGuideReview(req,f.db);assert.equal(response.status,status,await response.clone().text());if(code)assert.equal((await response.json()).code,code);assert.equal(f.prepares,0);}
  const malformed=new Request(request('POST',payload()).url,{method:'POST',headers:{'oai-authenticated-user-id':principal(),origin:'https://review.test','content-type':'application/json'},body:'{'});
  assert.equal((await api.postRegionalGuideReview(malformed,f.db)).status,400);
 }finally{f.close();}
});

test('SQLite has atomic append, pagination, old revision visibility and tenant separation',async()=>{
 const f=fixture();try{
  assert.equal((await call(f.db,'POST',payload())).status,201);
  assert.equal((await call(f.db,'POST',payload())).status,409);
  const race=await Promise.all([call(f.db,'POST',payload(1,context,approved)),call(f.db,'POST',payload(1,context,approved))]);
  assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
  for(let expected=2;expected<22;expected++)assert.equal((await call(f.db,'POST',payload(expected))).status,201);
  const latest=await (await call(f.db,'GET')).json();
  assert.deepEqual(latest.history.map((e:any)=>e.version),Array.from({length:20},(_,i)=>22-i));
  assert.equal(latest.nextBefore,3);assert.equal(latest.latestVersion,22);
  const older=await (await call(f.db,'GET',undefined,{headers:{'X-Regional-Guide-Before':'3'}})).json();
  assert.deepEqual(older.history.map((e:any)=>e.version),[2,1]);assert.equal(older.latestVersion,22);
  for(const identity of [{account:'b'},{institution:'two'}])assert.deepEqual((await (await call(f.db,'GET',undefined,identity)).json()).history,[]);
  const old=f.sql.prepare('SELECT payload FROM atlas_personal_nested_review_events WHERE version=1').get() as any;
  const changed={...context,contentRevision:hash('b')};
  f.sql.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE version=1').run(JSON.stringify({...JSON.parse(old.payload),context:changed}));
  const stale=await (await call(f.db,'GET',undefined,{headers:{'X-Regional-Guide-Before':'3'}})).json();assert.equal(stale.history.at(-1).context.contentRevision,hash('b'));
  assert.equal(api.regionalGuideReviewKey(changed),api.regionalGuideReviewKey(context));
  const rows=f.sql.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all() as any[];
  assert.ok(rows.every(r=>r.user_id===JSON.stringify(['vm-regional-guide-teaching-private-1',principal()])&&r.structure_id==='posterior-knee'&&r.track==='teaching'));
 }finally{f.close();}
});

test('corrupt storage envelope and failed reads/writes return 503, not empty or saved',async()=>{
 for(const [column,replacement] of [['version',23],['saved_at','2020-01-01T00:00:00.000Z'],['payload','{}']] as const){
  const f=fixture();try{assert.equal((await call(f.db,'POST',payload())).status,201);f.sql.prepare(`UPDATE atlas_personal_nested_review_events SET ${column}=?`).run(replacement);assert.equal((await call(f.db,'GET')).status,503);}finally{f.close();}
 }
 const falseRead={prepare(){return {bind(){return {async all(){return {success:false,results:[]};}};}}}};
 assert.equal((await call(falseRead,'GET')).status,503);
 const falseWrite={prepare(){return {bind(){return {async all(){return {success:true,results:[]};},async run(){return {success:false,meta:{changes:1}};}};}}}};
 assert.equal((await call(falseWrite,'POST',payload())).status,503);
});

test('untrusted contract parsers reject wrong primitives, controls, timestamps and foreign guides',()=>{
 const saved={eventSchema:'vm-regional-guide-teaching-review-event-1',context,version:1,savedAt:'2026-10-14T12:00:00.000Z',decision};
 for(const altered of [
  {...context,guideId:42},
  {...context,guideRevision:'bad\u0000revision'},
  {...context,contentRevision:hash('A')},
  {...context,publicationApproval:'false'},
 ])assert.throws(()=>api.parseRegionalGuideReviewContext(altered));
 for(const altered of [
  {...decision,status:1},
  {...decision,notes:'bad\u007fnotes'},
  {...decision,checks:{...decision.checks,facts:'true'}},
  {...decision,attested:0},
 ])assert.throws(()=>api.validateRegionalGuideDecision(altered));
 for(const altered of [
  {...saved,version:'1'},
  {...saved,savedAt:'2026-02-30T12:00:00.000Z'},
  {...saved,savedAt:'2026-10-14T12:00:00Z'},
  {...saved,decision:{...decision,notes:'bad\u0001note'}},
 ])assert.throws(()=>api.parseRegionalGuideReviewEvent(altered));
 const foreign={...saved,context:{...context,guideId:'another-knee-guide'}};
 assert.throws(()=>api.parseRegionalGuideReviewHistory({context,history:[foreign],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'},context));
 const oldRevision={...saved,context:{...context,contentRevision:hash('b')}};
 assert.equal(api.parseRegionalGuideReviewHistory({context,history:[oldRevision],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'},context).history[0].context.contentRevision,hash('b'));
});
