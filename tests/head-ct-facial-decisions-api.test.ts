import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';

const site=process.cwd();
const at='2026-10-16T10:00:00.000Z';
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const bundle=async(entry:string,plugins:Parameters<typeof build>[0]['plugins']=[])=>{
  const output=await build({entryPoints:[entry],absWorkingDir:site,bundle:true,write:false,format:'esm',platform:'node',target:'es2022',plugins});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
};
const source=await bundle('lib/head-ct-facial-decision-api.ts');
const contracts=await bundle('lib/head-ct-facial-decision-contract.ts');
const store=await bundle('lib/head-ct-facial-decision-store.ts');
const client=await bundle('lib/head-ct-facial-decision-client.ts');
const {HEAD_LINK_REVISION}=await bundle('lib/head-atlas-links.ts');
const {HEAD_CT_BONE_COMPARISON_REVISION}=await bundle('lib/head-ct-bone-comparison-review.ts');
const {CT_FACIAL_COMPARISON_CONCEPTS}=await bundle('lib/head-ct-facial-comparison-review.ts');
const {getFacialDecisions,postFacialDecision}=source;
const {facialDecisionContext,blankFacialDecision,parseSavedFacialDecision}=contracts;
const {facialDecisionKey}=store;

function fixture(){
  const db=new DatabaseSync(':memory:');
  for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(part=>part.trim()).filter(Boolean))db.exec(sql);
  let calls=0;
  const adapter={prepare(sql:string){calls++;return {bind(...params:unknown[]){const statement=db.prepare(sql);return {
    all:async()=>({success:true,results:statement.all(...params as any[])}),
    run:async()=>({success:true,meta:{changes:Number(statement.run(...params as any[]).changes)}}),
  };}};}};
  const rows=()=>db.prepare('SELECT * FROM atlas_personal_nested_review_events').all() as Array<{user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string}>;
  const request=(who:string|null,method:'GET'|'POST',kind:string,concept:string,body?:unknown,extra:Record<string,string>={},query='')=>{
    const headers=new Headers(extra);if(who)headers.set('oai-authenticated-user-id',who);
    if(method==='POST'){headers.set('origin',extra.origin??'https://review.test');headers.set('content-type',extra['content-type']??'application/json');}
    const url=`https://review.test/api/atlas-review/head-ct-facial-decisions${query||`?kind=${kind}&concept=${concept}`}`;
    return new Request(url,{method,headers,body:method==='POST'?JSON.stringify(body):undefined});
  };
  const get=(who:string|null,kind:string,concept:string,query='')=>getFacialDecisions(request(who,'GET',kind,concept,undefined,{},query),adapter,HEAD_LINK_REVISION);
  const post=(who:string|null,body:unknown,extra:Record<string,string>={},query='')=>postFacialDecision(request(who,'POST','','',body,extra,query||'?'),adapter,HEAD_LINK_REVISION);
  return {db,adapter,rows,get,post,request,get calls(){return calls;},close(){db.close();}};
}

test('six exact source contexts and independent kind, concept, account, institution streams',async()=>{
  const f=fixture();try{
    const contexts=[];
    for(const kind of ['teaching','clinical'])for(const concept of CT_FACIAL_COMPARISON_CONCEPTS){
      const response=await f.get('institution-a:reviewer-a',kind,concept);
      assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control')??'',/no-store/);
      const data=await response.json() as any;assert.deepEqual(data.history,[]);
      assert.equal(data.context.kind,kind);assert.equal(data.context.conceptId,concept);
      contexts.push(data.context);
      const payload={context:data.context,expectedVersion:0,decision:blankFacialDecision(data.context)};
      const saved=await f.post('institution-a:reviewer-a',payload);assert.equal(saved.status,201,await saved.clone().text());
      assert.deepEqual(client.confirmFacialSave(await saved.json(),data.context,0,payload.decision).context,data.context);
    }
    assert.equal(new Set(contexts.map(c=>c.packetId)).size,2);
    assert.equal(f.rows().length,6);
    for(const row of f.rows()){assert.equal(row.track,'teaching');assert.equal(row.version,1);}
    for(const who of ['institution-a:reviewer-b','institution-b:reviewer-a']){
      assert.deepEqual((await (await f.get(who,'teaching','bone-mandible')).json() as any).history,[]);
    }
    const teaching=(await (await f.get('institution-a:reviewer-a','teaching','bone-mandible')).json() as any);
    const clinical=(await (await f.get('institution-a:reviewer-a','clinical','bone-mandible')).json() as any);
    assert.equal(teaching.history.length,1);assert.equal(clinical.history.length,1);
    assert.notEqual(facialDecisionKey('teaching'),facialDecisionKey('clinical'));
    assert.notEqual(teaching.context.packetRevision,clinical.context.packetRevision);
    assert.deepEqual(client.parseFacialHistory(teaching,teaching.context).history,teaching.history);
    assert.deepEqual(client.parseFacialHistory(clinical,clinical.context).history,clinical.history);
  }finally{f.close();}
});

test('atomic version contention, duplicate submission, correction and bounded paging',async()=>{
  const f=fixture();try{
    const c=await facialDecisionContext(HEAD_LINK_REVISION,'bone-mandible','teaching');
    const draft=blankFacialDecision(c),payload={context:c,expectedVersion:0,decision:draft};
    const races=await Promise.all([f.post('org:a',payload),f.post('org:a',payload)]);
    assert.deepEqual(races.map(r=>r.status).sort(),[201,409]);assert.equal(f.rows().length,1);
    assert.equal((await f.post('org:a',payload)).status,409);
    const correction={context:c,expectedVersion:1,decision:{...draft,status:'changes-required',notes:'Synthetic correction supersedes draft.'}};
    assert.equal((await f.post('org:a',correction)).status,201);
    const accepted={context:c,expectedVersion:2,decision:{...draft,status:'accepted-educational',reviewer:'Synthetic reviewer',qualification:'Fixture only',checks:Object.fromEntries(c.checklist.map((x:any)=>[x.id,true])),attested:true}};
    assert.equal((await f.post('org:a',accepted)).status,201);
    const latest=(await (await f.get('org:a','teaching','bone-mandible')).json() as any);
    assert.deepEqual(latest.history.map((r:any)=>r.version),[3,2,1]);
    assert.equal(latest.history[0].decision.status,'accepted-educational');
    assert.deepEqual(client.parseFacialHistory(latest,c).history,latest.history);
    for(let expected=3;expected<22;expected++)assert.equal((await f.post('org:a',{...payload,expectedVersion:expected})).status,201);
    const page=(await (await f.get('org:a','teaching','bone-mandible')).json() as any);
    assert.equal(page.history.length,20);assert.equal(page.nextBefore,3);
    assert.deepEqual(page.history.map((r:any)=>r.version),Array.from({length:20},(_,i)=>22-i));
    const tail=(await (await f.get('org:a','teaching','bone-mandible','?kind=teaching&concept=bone-mandible&before=3')).json() as any);
    assert.deepEqual(tail.history.map((r:any)=>r.version),[2,1]);assert.equal(tail.nextBefore,null);
    assert.deepEqual(client.parseFacialHistory(tail,c,3).history,tail.history);
  }finally{f.close();}
});

test('invalid requests and foreign or stale contexts fail before any storage call',async()=>{
  const f=fixture();try{
    const c=await facialDecisionContext(HEAD_LINK_REVISION,'bone-left-zygomatic','teaching');
    const draft=blankFacialDecision(c),payload={context:c,expectedVersion:0,decision:draft};
    const checks:Array<[()=>Promise<Response>,number]>=[
      [()=>f.get(null,'teaching','bone-left-zygomatic'),401],
      [()=>f.post(null,payload),401],
      [()=>f.get('org:a','bad','bone-left-zygomatic'),400],
      [()=>f.get('org:a','teaching','bone-occipital'),400],
      [()=>f.get('org:a','teaching','bone-left-zygomatic','?kind=teaching&kind=clinical&concept=bone-left-zygomatic'),400],
      [()=>f.get('org:a','teaching','bone-left-zygomatic','?kind=teaching&concept=bone-left-zygomatic&before=0'),400],
      [()=>f.get('org:a','teaching','bone-left-zygomatic','?kind=teaching&concept=bone-left-zygomatic&extra=x'),400],
      [()=>f.post('org:a',payload,{origin:'https://elsewhere.test'}),403],
      [()=>f.post('org:a',payload,{'sec-fetch-site':'cross-site'}),403],
      [()=>f.post('org:a',payload,{'content-type':'text/plain'}),415],
      [()=>f.post('org:a',payload,{},'?kind=teaching'),400],
      [()=>f.post('org:a',{...payload,extra:true}),400],
      [()=>f.post('org:a',{...payload,expectedVersion:-1}),400],
      [()=>f.post('org:a',{...payload,context:{...c,packetId:'head-ct-bone-teaching'}}),400],
      [()=>f.post('org:a',{...payload,context:{...c,kind:'clinical'}}),400],
      [()=>f.post('org:a',{...payload,context:{...c,packetRevision:'a'.repeat(64)}}),409],
      [()=>f.post('org:a',{...payload,context:{...c,checklist:[...c.checklist.slice(0,1).map((x:any)=>({...x,label:'Earlier wording'})),...c.checklist.slice(1)]}}),409],
      [()=>f.post('org:a',{...payload,decision:{...draft,attested:true}}),422],
      [()=>f.post('org:a',{...payload,decision:{...draft,notes:'x'.repeat(33000)}}),413],
    ];
    for(const [call,status] of checks){const before=f.calls;const response=await call();assert.equal(response.status,status,await response.clone().text());assert.equal(f.calls,before);}
    assert.equal(f.rows().length,0);
    assert.equal((await getFacialDecisions(f.request('org:a','GET','teaching','bone-left-zygomatic'),f.adapter,'a'.repeat(64))).status,503);
    assert.equal((await postFacialDecision(f.request('org:a','POST','','',payload,{},'?'),f.adapter,'a'.repeat(64))).status,503);
    assert.equal(f.rows().length,0);
  }finally{f.close();}
});

test('storage read/write failures, malformed rows and envelope mismatch fail closed',async()=>{
  const f=fixture();try{
    const c=await facialDecisionContext(HEAD_LINK_REVISION,'bone-right-zygomatic','clinical');
    const payload={context:c,expectedVersion:0,decision:blankFacialDecision(c)};
    const failing={prepare(){return {bind(){return {all:async()=>({success:false,results:[]}),run:async()=>({success:false,meta:{changes:0}})};}};}};
    assert.equal((await getFacialDecisions(f.request('org:a','GET','clinical','bone-right-zygomatic'),failing,HEAD_LINK_REVISION)).status,503);
    assert.equal((await postFacialDecision(f.request('org:a','POST','','',payload,{},'?'),failing,HEAD_LINK_REVISION)).status,503);
    assert.equal((await f.post('org:a',payload)).status,201);
    const row=f.rows()[0];const original=row.payload;
    const alter=(patch:{saved_at?:string;track?:string;payload?:string},payloadText=original)=>f.db.prepare('UPDATE atlas_personal_nested_review_events SET payload=?,saved_at=?,track=? WHERE user_id=? AND nested_key=? AND structure_id=? AND version=?')
      .run(payloadText,patch.saved_at??row.saved_at,patch.track??row.track,row.user_id,row.nested_key,row.structure_id,row.version);
    for(const changed of [
      {payload:JSON.stringify({...JSON.parse(original),context:{...c,kind:'teaching'}})},
      {payload:JSON.stringify({...JSON.parse(original),version:2})},
      {payload:JSON.stringify({...JSON.parse(original),context:{...c,clinicalApproval:true}})},
      {saved_at:'2026-10-16T11:00:00.000Z'},
    ]){
      alter(changed,changed.payload??original);
      assert.equal((await f.get('org:a','clinical','bone-right-zygomatic')).status,503);
      assert.equal((await f.post('org:a',{...payload,expectedVersion:1})).status,503);
    }
    alter({},original);
    assert.equal((await f.get('org:a','clinical','bone-right-zygomatic')).status,200);
    for(const changed of [{track:'geometry'},{user_id:'other-user'},{nested_key:'other-packet'},{structure_id:'bone-mandible'},{payload:'{broken'}]){
      const wrongEnvelope={prepare(_sql:string){return {bind(..._params:unknown[]){return {all:async()=>({success:true,results:[{...row,...changed}]})};}};}};
      assert.equal((await getFacialDecisions(f.request('org:a','GET','clinical','bone-right-zygomatic'),wrongEnvelope,HEAD_LINK_REVISION)).status,503);
    }
    alter({track:'geometry'},original);
    assert.equal((await f.get('org:a','clinical','bone-right-zygomatic')).status,200);
    assert.equal((await f.post('org:a',{...payload,expectedVersion:1})).status,409);
    alter({},original);
    const writeFailure={prepare(sql:string){if(sql.includes('INSERT INTO'))return {bind(){return {run:async()=>({success:false,meta:{changes:0}})};}};return f.adapter.prepare(sql);}};
    assert.equal((await postFacialDecision(f.request('org:a','POST','','',{...payload,expectedVersion:1},{},'?'),writeFailure,HEAD_LINK_REVISION)).status,503);
    assert.equal(f.rows().length,1);
    const boneKey=JSON.stringify(['vm-head-ct-bone-teaching-decisions-1']);
    const bonePayload=JSON.stringify({unrelated:'immutable bone stream'});
    f.db.prepare('INSERT INTO atlas_personal_nested_review_events (user_id,nested_key,structure_id,track,version,payload,saved_at) VALUES (?,?,?,?,?,?,?)')
      .run('org:a',boneKey,'bone-occipital','teaching',1,bonePayload,at);
    assert.equal((await f.post('org:a',{...payload,expectedVersion:1})).status,201);
    assert.equal(f.db.prepare('SELECT payload FROM atlas_personal_nested_review_events WHERE nested_key=?').get(boneKey)?.payload,bonePayload);
    assert.equal(HEAD_CT_BONE_COMPARISON_REVISION.length,64);
  }finally{f.close();}
});

test('route runs authorization before binding access, then passes guarded request and first-primary session',async()=>{
  const state={allowed:false,guardedIdentity:'server-derived:institution-a',runs:0,handlerCalls:[] as Array<{method:string;identity:string|null;binding:unknown;manifest:string}>,dbReads:0,sessions:[] as string[]};
  (globalThis as any).__facialRouteTest=state;
  const plugin={name:'route-boundaries',setup(p:any){
    p.onResolve({filter:/^cloudflare:workers$/},()=>({path:'cloudflare:workers',namespace:'stub'}));
    p.onResolve({filter:/^@\/lib\/clinical-review-server$/},()=>({path:'clinical-review',namespace:'stub'}));
    p.onResolve({filter:/^@\/lib\/head-ct-facial-decision-api$/},()=>({path:'facial-api',namespace:'stub'}));
    p.onResolve({filter:/^@\/lib\/head-atlas-import$/},()=>({path:'manifest',namespace:'stub'}));
    p.onLoad({filter:/.*/,namespace:'stub'},(args:any)=>({contents:args.path==='cloudflare:workers'
      ?`export const env={get DB(){const s=globalThis.__facialRouteTest;s.dbReads++;return {withSession(mode){s.sessions.push(mode);return {kind:'guarded-db'};}}}};`
      :args.path==='clinical-review'
      ?`export async function runClinicalReview(request,handler){const s=globalThis.__facialRouteTest;s.runs++;if(!s.allowed)return Response.json({error:'denied'},{status:403});const headers=new Headers(request.headers);headers.set('oai-authenticated-user-id',s.guardedIdentity);return handler(new Request(request.url,{method:request.method,headers,body:request.method==='POST'?request.body:undefined,duplex:'half'}));}`
      :args.path==='facial-api'
      ?`export async function getFacialDecisions(request,binding,manifest){const s=globalThis.__facialRouteTest;s.handlerCalls.push({method:'GET',identity:request.headers.get('oai-authenticated-user-id'),binding,manifest});return Response.json({ok:true});}export async function postFacialDecision(request,binding,manifest){const s=globalThis.__facialRouteTest;s.handlerCalls.push({method:'POST',identity:request.headers.get('oai-authenticated-user-id'),binding,manifest});return Response.json({ok:true});}`
      :`export const HEAD_MANIFEST_SHA256='${HEAD_LINK_REVISION}';`,loader:'js'}));
  }};
  const route=await bundle('app/api/atlas-review/head-ct-facial-decisions/route.ts',[plugin]);
  assert.equal(route.dynamic,'force-dynamic');
  for(const method of ['GET','POST'] as const){
    const request=new Request('https://review.test/api/atlas-review/head-ct-facial-decisions',{method,headers:{'oai-authenticated-user-id':'spoofed-client'},body:method==='POST'?'{}':undefined});
    const priorReads=state.dbReads,priorCalls=state.handlerCalls.length;
    assert.equal((await route[method](request)).status,403);
    assert.equal(state.dbReads,priorReads);assert.equal(state.handlerCalls.length,priorCalls);
    state.allowed=true;
    assert.equal((await route[method](request)).status,200);
    assert.deepEqual(state.handlerCalls.at(-1),{method,identity:state.guardedIdentity,binding:{kind:'guarded-db'},manifest:HEAD_LINK_REVISION});
    state.allowed=false;
  }
  assert.deepEqual(state.sessions,['first-primary','first-primary']);
  assert.equal(state.runs,4);
  delete (globalThis as any).__facialRouteTest;
});
