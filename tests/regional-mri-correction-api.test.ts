import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
const bundled=await build({entryPoints:[fileURLToPath(new URL('../lib/regional-mri-correction-api.ts',import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
const {getRegionalMriCorrections,postRegionalMriCorrection}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));

const h=(letter:string)=>letter.repeat(64);
const annotation={id:'annotation-a',anatomyId:'anatomy-a',label:'Synthetic structure',laterality:'left',coverage:'partial',reviewStatus:'provisional',reviewRevision:h('c'),reviewScope:'Synthetic review only',geometryKind:'mask',gridKind:'source-native',geometryMappingRevision:h('d'),geometrySourceSha256:h('e')};
const projection={schema:'visible-medicine.regional-mri-review-context/1',sourceRevision:h('a'),projectionRevision:h('b'),region:'knee',laterality:'left',registration:'none',release:'local-private-draft',series:[{id:'sequence-a',label:'Synthetic A',imageSha256:h('f'),annotations:[annotation]},{id:'sequence-b',label:'Synthetic B',imageSha256:h('1'),annotations:[annotation]}]} as any;
const context={schema:'vm-regional-mri-correction-context-1',sourceRevision:projection.sourceRevision,projectionRevision:projection.projectionRevision,region:'knee',laterality:'left',sequenceId:'sequence-a',sequenceLabel:'Synthetic A',imageSha256:h('f'),annotation,clinicalApproval:false,publicationApproval:false,patientRegistration:false};
const draft={status:'draft',notes:'Synthetic note',checks:{identity:false,extent:false,sourceScope:false},attested:false};
const payload=(expectedVersion=0,selected:unknown=context)=>({context:selected,expectedVersion,draft});

function fixture(){
 const sql=new DatabaseSync(':memory:');
 const migration=readFileSync(new URL('../drizzle/0008_solid_infant_terrible.sql',import.meta.url),'utf8');
 sql.exec(migration.split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`'))!);
 let prepares=0;
 const db={prepare(query:string){prepares++;return {bind(...args:unknown[]){
  const statement=sql.prepare(query),params=args as Array<string|number|null>;
  return {async all(){return {success:true,results:statement.all(...params)};},async run(){const result=statement.run(...params);return {success:true,meta:{changes:Number(result.changes)}};}};
 }};}};
 const count=()=>Number((sql.prepare('SELECT COUNT(*) AS n FROM atlas_personal_nested_review_events').get() as any).n);
 return {sql,db,count,get prepares(){return prepares;},close:()=>sql.close()};
}
const user=(id='account-a',org='org-a')=>JSON.stringify(['vm-website-personal-review-1',id,org]);
function request(method:'GET'|'POST',body?:unknown,options:{headers?:Record<string,string>;query?:string;account?:string;org?:string}={}){
 const headers:Record<string,string>={'oai-authenticated-user-id':user(options.account,options.org),'X-Regional-MRI-Source':projection.sourceRevision,'X-Regional-MRI-Projection':projection.projectionRevision,'X-Regional-MRI-Sequence':'sequence-a','X-Regional-MRI-Annotation':'annotation-a',...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{}),...options.headers};
 return new Request('https://review.test/api/atlas-review/regional-mri'+(options.query??''),{method,headers,...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
async function call(db:any,method:'GET'|'POST',body?:unknown,options:Parameters<typeof request>[2]={},source:any=projection){
 return method==='GET'?getRegionalMriCorrections(request(method,undefined,options),db,source):postRegionalMriCorrection(request(method,body,options),db,source);
}
test('selection, request shape and draft validation reject before any storage access',async()=>{
 const f=fixture();try{
  const invalid:Array<[string,Request,any,number]>=[
   ['missing user',request('GET',undefined,{headers:{'oai-authenticated-user-id':''}}),projection,401],
   ['no projection',request('GET'),null,503],
   ['write without projection',request('POST',payload()),null,503],
   ['source pin',request('GET',undefined,{headers:{'X-Regional-MRI-Source':h('9')}}),projection,409],
   ['projection pin',request('GET',undefined,{headers:{'X-Regional-MRI-Projection':h('9')}}),projection,409],
   ['sequence',request('GET',undefined,{headers:{'X-Regional-MRI-Sequence':'missing'}}),projection,404],
   ['annotation',request('GET',undefined,{headers:{'X-Regional-MRI-Annotation':'missing'}}),projection,404],
   ['query identity',request('GET',undefined,{query:'?user=account-b'}),projection,400],
   ['bad cursor',request('GET',undefined,{headers:{'X-Regional-MRI-Before':'01'}}),projection,400],
   ['cursor above range',request('GET',undefined,{headers:{'X-Regional-MRI-Before':'2147483649'}}),projection,400],
   ['foreign origin',request('POST',payload(),{headers:{origin:'https://evil.test'}}),projection,403],
   ['cross site',request('POST',payload(),{headers:{'sec-fetch-site':'cross-site'}}),projection,403],
   ['content type',request('POST',payload(),{headers:{'content-type':'text/plain'}}),projection,415],
   ['unknown field',request('POST',{...payload(),user:'other'}),projection,400],
   ['write query',request('POST',payload(),{query:'?before=1'}),projection,400],
   ['approval flag',request('POST',{...payload(),draft:{...draft,attested:true}}),projection,422],
   ['invalid status',request('POST',{...payload(),draft:{...draft,status:'approved'}}),projection,422],
   ['oversize',request('POST',{...payload(),draft:{...draft,notes:'x'.repeat(33000)}}),projection,413],
  ];
  for(const [label,req,source,status] of invalid){
   const response=req.method==='GET'?await getRegionalMriCorrections(req,f.db,source):await postRegionalMriCorrection(req,f.db,source);
   assert.equal(response.status,status,label+' '+await response.clone().text());
   assert.equal(f.prepares,0,label);
  }
  for(const field of Object.keys(context)){
   const changed={...context,[field]:field==='annotation'?{...context.annotation,label:'Altered synthetic label'}:field.endsWith('Approval')||field==='patientRegistration'?true:'changed'};
   const response=await call(f.db,'POST',payload(0,changed));assert.equal(response.status,409,field);assert.equal(f.prepares,0,field);
  }
  assert.equal(f.count(),0);
 }finally{f.close();}
});

test('actual SQLite enforces private namespaces, append-only versions and paged history',async()=>{
 const f=fixture();try{
  assert.equal((await call(f.db,'POST',payload())).status,201);
  assert.equal((await call(f.db,'POST',payload())).status,409);
  const racing=await Promise.all([call(f.db,'POST',payload(1)),call(f.db,'POST',payload(1))]);
  assert.deepEqual(racing.map(r=>r.status).sort(),[201,409]);
  for(let version=2;version<22;version++)assert.equal((await call(f.db,'POST',payload(version))).status,201);
  assert.equal(f.count(),22);
  const latest=await (await call(f.db,'GET')).json() as any;
  assert.deepEqual(latest.history.map((e:any)=>e.version),Array.from({length:20},(_,i)=>22-i));
  assert.equal(latest.latestVersion,22);assert.equal(latest.nextBefore,3);
  const older=await (await call(f.db,'GET',undefined,{headers:{'X-Regional-MRI-Before':'3'}})).json() as any;
  assert.deepEqual(older.history.map((e:any)=>e.version),[2,1]);assert.equal(older.latestVersion,22);
  assert.deepEqual((await (await call(f.db,'GET',undefined,{account:'account-b'})).json() as any).history,[]);
  assert.deepEqual((await (await call(f.db,'GET',undefined,{org:'org-b'})).json() as any).history,[]);
  assert.deepEqual((await (await call(f.db,'GET',undefined,{headers:{'X-Regional-MRI-Sequence':'sequence-b'}})).json() as any).history,[]);
  const rows=f.sql.prepare('SELECT nested_key,track,payload FROM atlas_personal_nested_review_events ORDER BY version').all() as any[];
  assert.ok(rows.every(r=>r.track==='geometry'&&JSON.parse(r.nested_key)[0]==='vm-regional-mri-corrections-1'));
  assert.equal(JSON.parse(rows[0].payload).version,1,'old event is retained');
  assert.equal((await call(f.db,'POST',payload(0),{account:'account-b'})).status,201);
  assert.equal((await call(f.db,'POST',payload(0),{org:'org-b'})).status,201);
  assert.equal((await call(f.db,'POST',payload(0),{headers:{'X-Regional-MRI-Sequence':'sequence-b'}})).status,409,'client context must follow selected sequence');
 }finally{f.close();}
});

test('corrupt stored envelopes and storage failures remain closed and generic',async()=>{
 const variants=[
  ['row user','user_id','foreign'],['row key','nested_key','foreign'],['row structure','structure_id','foreign'],['row track','track','teaching'],
  ['row version','version',2],['row time','saved_at','2020-01-01T00:00:00.000Z'],
  ['payload context','payload',(e:any)=>JSON.stringify({...e,context:{...e.context,projectionRevision:h('9')}})],
  ['payload status','payload',(e:any)=>JSON.stringify({...e,draft:{...e.draft,status:'approved'}})],
  ['payload flags','payload',(e:any)=>JSON.stringify({...e,context:{...e.context,clinicalApproval:true}})],
  ['payload envelope','payload',(e:any)=>JSON.stringify({...e,version:2})],
  ['payload json','payload','{}'],
 ] as const;
 for(const [label,column,value] of variants){
  const f=fixture();try{
   assert.equal((await call(f.db,'POST',payload())).status,201);
   const row=f.sql.prepare('SELECT payload FROM atlas_personal_nested_review_events').get() as any;
   const replacement=typeof value==='function'?value(JSON.parse(row.payload)):value;
   f.sql.prepare(`UPDATE atlas_personal_nested_review_events SET ${column}=?`).run(replacement);
   const response=await call(f.db,'GET');
   // Key-changing row corruption becomes unreachable; the selected namespace still reads empty.
   if(['row user','row key','row structure','row track'].includes(label))assert.equal((await response.json() as any).history.length,0,label);
   else {assert.equal(response.status,503,label);assert.match((await response.text()),/Storage could not be confirmed/);}
  }finally{f.close();}
 }
 const failure=await call({prepare(){throw Error('private SQL payload sentinel');}},'GET');
 assert.equal(failure.status,503);assert.doesNotMatch(await failure.text(),/sentinel|SQL|payload/);
});

test('Miniflare D1 persists synthetic correction history with one concurrent version winner', {timeout:120000},async()=>{
 const fixtureSource=`
 import {getRegionalMriCorrections,postRegionalMriCorrection} from './lib/regional-mri-correction-api.ts';
 const projection=${JSON.stringify(projection)};
 const changed={...projection,sourceRevision:'${h('2')}',projectionRevision:'${h('3')}'};
 export default {async fetch(request,env){
  const selected=new URL(request.url).pathname==='/other-source'?changed:projection;
  if(request.method==='GET')return getRegionalMriCorrections(request,env.DB,selected);
  if(request.method==='POST')return postRegionalMriCorrection(request,env.DB,selected);
  return new Response('Method not allowed',{status:405});
 }};`;
 const built=await build({stdin:{contents:fixtureSource,resolveDir:process.cwd(),sourcefile:'regional-mri-correction-d1-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/regional-mri-correction-d1-fixture.mjs'),contents:built.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
 try{
  const db=await mf.getD1Database('DB');
  const migration=readFileSync(new URL('../drizzle/0008_solid_infant_terrible.sql',import.meta.url),'utf8');
  await db.prepare(migration.split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`'))!.trim()).run();
  const send=async(method:'GET'|'POST',value?:unknown,options:{account?:string;org?:string;sequence?:string;source?:'current'|'other'}={})=>{
   const different=options.source==='other';
   return mf.dispatchFetch('https://review.test/'+(different?'other-source':'corrections'),{method,
    headers:{'oai-authenticated-user-id':user(options.account,options.org),'X-Regional-MRI-Source':different?h('2'):h('a'),
     'X-Regional-MRI-Projection':different?h('3'):h('b'),'X-Regional-MRI-Sequence':options.sequence??'sequence-a',
     'X-Regional-MRI-Annotation':'annotation-a',...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{})},
    ...(method==='POST'?{body:JSON.stringify(value)}:{})});
  };
  const initial=await send('GET');assert.equal(initial.status,200,await initial.clone().text());
  assert.deepEqual((await initial.json() as any).history,[]);
  const saved=await send('POST',payload());assert.equal(saved.status,201,await saved.clone().text());
  const first=await saved.json() as any;assert.equal(first.review.version,1);
  const race=await Promise.all([send('POST',payload(1)),send('POST',payload(1))]);
  assert.deepEqual(race.map(r=>r.status).sort(),[201,409],(await Promise.all(race.map(r=>r.clone().text()))).join('\n'));
  const refreshed=await send('GET');assert.equal(refreshed.status,200);
  assert.deepEqual((await refreshed.json() as any).history.map((event:any)=>event.version),[2,1]);
  assert.equal((await send('GET',undefined,{source:'other'})).status,200);
  for(const selection of [{source:'other' as const},{sequence:'sequence-b'},{account:'account-b'},{org:'org-b'}]){
   const response=await send('GET',undefined,selection);assert.equal(response.status,200);
   assert.deepEqual((await response.json() as any).history,[],JSON.stringify(selection));
  }
  const rows=await db.prepare('SELECT user_id,nested_key,structure_id,track,version,payload FROM atlas_personal_nested_review_events ORDER BY version').all<any>();
  assert.equal(rows.results.length,2);assert.deepEqual(rows.results.map(row=>row.version),[1,2]);
  assert.deepEqual(rows.results.map(row=>JSON.parse(row.payload).version),[1,2]);
  assert.equal(JSON.parse(rows.results[0].payload).draft.notes,draft.notes,'first event remains unchanged');
  assert.ok(rows.results.every(row=>row.track==='geometry'&&row.structure_id==='anatomy-a'&&JSON.parse(row.nested_key)[0]==='vm-regional-mri-corrections-1'));
 }finally{await mf.dispose();}
});
