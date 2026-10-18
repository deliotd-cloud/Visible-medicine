import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';

const built=await build({stdin:{contents:"export {getRegionalReferenceDrafts,postRegionalReferenceDraft} from './lib/regional-reference-draft-api.ts'; export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue.ts'; export {regionalReferenceDraftContext} from './lib/regional-reference-draft-contract.ts'; export {regionalReferenceDraftHeaders} from './lib/regional-reference-draft-client.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
const {getRegionalReferenceDrafts,postRegionalReferenceDraft,buildRegionalMri3dCatalogue,regionalReferenceDraftContext,regionalReferenceDraftHeaders}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64')) as any;
const h=(digit:string)=>digit.repeat(64);
const source={revision:h('a'),region:'knee'};
const catalogue=await buildRegionalMri3dCatalogue(source);
assert(catalogue?.learning?.entries?.length>1);
const entry=catalogue.learning.entries[0];
const selection={target:entry.target.id,relation:entry.target.relation,atlasRevision:catalogue.atlasRevision,mappingRevision:catalogue.mappingRevision,teachingRevision:entry.revision};
const context=regionalReferenceDraftContext({atlasRevision:catalogue.atlasRevision,mappingRevision:catalogue.mappingRevision,entry});
const draft={status:'draft',notes:'Synthetic correction note',checks:{facts:false,scope:false,imaging:false,sources:false},attested:false};
const payload=(expectedVersion=0,selected:unknown=context,notes=draft.notes)=>({context:selected,expectedVersion,draft:{...draft,notes}});
const user=(account='account-a',institution='org-a')=>JSON.stringify(['vm-website-personal-review-1',account,institution]);

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
function request(method:'GET'|'POST',body?:unknown,options:{headers?:Record<string,string>;query?:string;account?:string;institution?:string;path?:string}={}){
 const headers:Record<string,string>={'oai-authenticated-user-id':user(options.account,options.institution),...regionalReferenceDraftHeaders(context),...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{}),...options.headers};
 return new Request('https://review.test/'+(options.path??'api/atlas-review/reference-learning')+(options.query??''),{method,headers,...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
async function call(db:any,method:'GET'|'POST',body?:unknown,options:Parameters<typeof request>[2]={},selected:any=catalogue){
 const req=request(method,body,options);
 return method==='GET'?getRegionalReferenceDrafts(req,db,selected):postRegionalReferenceDraft(req,db,selected);
}

test('untrusted request shape, stale exact selection and non-draft flags fail before storage',async()=>{
 const f=fixture();try{
  const cases:Array<[string,Request,any,number|undefined]>=[
   ['identity',request('GET',undefined,{headers:{'oai-authenticated-user-id':''}}),catalogue,401],
   ['missing catalogue',request('GET'),null,503],
   ['missing catalogue write',request('POST',payload()),null,503],
   ['query',request('GET',undefined,{query:'?user=other'}),catalogue,400],
   ['write query',request('POST',payload(),{query:'?before=1'}),catalogue,400],
   ['write cursor',request('POST',payload(),{headers:{'X-Reference-Teaching-Before':'2'}}),catalogue,400],
   ['missing target',request('GET',undefined,{headers:{'X-Reference-Teaching-Target':''}}),catalogue,undefined],
   ['wrong relation',request('GET',undefined,{headers:{'X-Reference-Teaching-Relation':'group-reference'}}),catalogue,undefined],
   ['stale atlas',request('GET',undefined,{headers:{'X-Reference-Teaching-Atlas':'0'.repeat(40)}}),catalogue,undefined],
   ['stale mapping',request('GET',undefined,{headers:{'X-Reference-Teaching-Mapping':h('0')}}),catalogue,undefined],
   ['stale teaching',request('GET',undefined,{headers:{'X-Reference-Teaching-Revision':h('0')}}),catalogue,undefined],
   ['bad cursor',request('GET',undefined,{headers:{'X-Reference-Teaching-Before':'01'}}),catalogue,400],
   ['cursor overflow',request('GET',undefined,{headers:{'X-Reference-Teaching-Before':'2147483649'}}),catalogue,400],
   ['duplicate target',request('GET',undefined,{headers:{'X-Reference-Teaching-Target':context.target.id+','+context.target.id}}),catalogue,undefined],
   ['foreign origin',request('POST',payload(),{headers:{origin:'https://evil.test'}}),catalogue,403],
   ['cross site',request('POST',payload(),{headers:{'sec-fetch-site':'cross-site'}}),catalogue,403],
   ['content type',request('POST',payload(),{headers:{'content-type':'text/plain'}}),catalogue,415],
   ['unknown body field',request('POST',{...payload(),reviewer:'spoof'}),catalogue,400],
   ['version',request('POST',payload(-1)),catalogue,400],
   ['attested',request('POST',{...payload(),draft:{...draft,attested:true}}),catalogue,422],
   ['approved',request('POST',{...payload(),draft:{...draft,status:'approved'}}),catalogue,422],
   ['weak changes required',request('POST',{...payload(),draft:{...draft,status:'changes-required',notes:'short'}}),catalogue,422],
   ['oversize',request('POST',payload(0,context,'x'.repeat(33000))),catalogue,413],
  ];
  for(const [label,req,selected,status] of cases){
   const response=req.method==='GET'?await getRegionalReferenceDrafts(req,f.db,selected):await postRegionalReferenceDraft(req,f.db,selected);
   if(status)assert.equal(response.status,status,label+' '+await response.clone().text());else assert.ok(response.status>=400,label);
   if(label.startsWith('stale '))assert.equal((await response.clone().json() as any).code,'source-changed',label);
   assert.equal(f.prepares,0,label);
  }
  const malformed=new Request('https://review.test/api/atlas-review/reference-learning',{method:'POST',headers:{'oai-authenticated-user-id':user(),...regionalReferenceDraftHeaders(context),origin:'https://review.test','content-type':'application/json'},body:'{'});
  assert.equal((await postRegionalReferenceDraft(malformed,f.db,catalogue)).status,400);
  assert.equal(f.prepares,0,'malformed JSON');
  for(const field of Object.keys(context)){
   const altered={...context,[field]:field==='target'?{...context.target,label:'Other public target'}:field.endsWith('Approval')||field==='patientRegistration'?true:'changed'};
   const response=await call(f.db,'POST',payload(0,altered));
   assert.equal(response.status,409,field);assert.equal((await response.json() as any).code,'source-changed',field);assert.equal(f.prepares,0,field);
  }
  assert.equal(f.count(),0);
 }finally{f.close();}
});

test('real SQLite keeps append-only exact history with atomic versions and private namespaces',async()=>{
 const f=fixture();try{
  const first=await call(f.db,'POST',payload());assert.equal(first.status,201,await first.clone().text());
  const duplicate=await call(f.db,'POST',payload());assert.equal(duplicate.status,409);
  assert.equal((await duplicate.json() as any).code,'version-conflict');
  const race=await Promise.all([call(f.db,'POST',payload(1,context,'Racer one')),call(f.db,'POST',payload(1,context,'Racer two'))]);
  assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
  assert.equal((await race.find(r=>r.status===409)!.json() as any).code,'version-conflict');
  for(let version=2;version<22;version++)assert.equal((await call(f.db,'POST',payload(version))).status,201);
  assert.equal(f.count(),22);
  const latest=await (await call(f.db,'GET')).json() as any;
  assert.deepEqual(latest.history.map((event:any)=>event.version),Array.from({length:20},(_,i)=>22-i));
  assert.equal(latest.latestVersion,22);assert.equal(latest.nextBefore,3);
  assert.equal(latest.scope,'private-to-signed-in-account-and-institution');
  const old=await (await call(f.db,'GET',undefined,{headers:{'X-Reference-Teaching-Before':'3'}})).json() as any;
  assert.deepEqual(old.history.map((event:any)=>event.version),[2,1]);assert.equal(old.latestVersion,22);
  for(const variation of [{account:'account-b'},{institution:'org-b'},{headers:{'X-Reference-Teaching-Target':catalogue.learning.entries[1].target.id,'X-Reference-Teaching-Relation':catalogue.learning.entries[1].target.relation,'X-Reference-Teaching-Revision':catalogue.learning.entries[1].revision}}]){
   const response=await call(f.db,'GET',undefined,variation);assert.equal(response.status,200,await response.clone().text());
   assert.deepEqual((await response.json() as any).history,[],JSON.stringify(variation));
  }
  const rows=f.sql.prepare('SELECT user_id,nested_key,structure_id,track,payload FROM atlas_personal_nested_review_events ORDER BY version').all() as any[];
  assert.ok(rows.every(row=>row.track==='teaching'&&row.structure_id===context.target.id&&JSON.parse(row.nested_key)[0]==='vm-regional-reference-teaching-drafts-1'));
  assert.ok(rows.every(row=>row.user_id===JSON.stringify(['vm-regional-reference-teaching-private-1',user()])));
  assert.ok(rows.every(row=>{
   const parts=JSON.parse(row.nested_key);
   return [context.atlasRevision,context.mappingRevision,context.teachingRevision,context.target.id,context.target.relation].every(part=>parts.includes(part));
  }));
  assert.equal(JSON.parse(rows[0].payload).version,1);
  assert.equal((await call(f.db,'POST',payload(0),{account:'account-b'})).status,201);
  assert.equal((await call(f.db,'POST',payload(0),{institution:'org-b'})).status,201);
 }finally{f.close();}
});

test('corrupt event envelopes and storage errors cannot appear as an empty or confirmed history',async()=>{
 for(const [label,column,replacement] of [
  ['version','version',2],['timestamp','saved_at','2020-01-01T00:00:00.000Z'],
  ['invalid JSON','payload','{}'],
  ['approval','payload',(event:any)=>JSON.stringify({...event,context:{...event.context,clinicalApproval:true}})],
  ['wrong draft','payload',(event:any)=>JSON.stringify({...event,draft:{...event.draft,attested:true}})],
  ['wrong context','payload',(event:any)=>JSON.stringify({...event,context:{...event.context,mappingRevision:h('0')}})],
 ] as const){
  const f=fixture();try{
   assert.equal((await call(f.db,'POST',payload())).status,201);
   const event=JSON.parse((f.sql.prepare('SELECT payload FROM atlas_personal_nested_review_events').get() as any).payload);
   f.sql.prepare(`UPDATE atlas_personal_nested_review_events SET ${column}=?`).run(typeof replacement==='function'?replacement(event):replacement);
   const result=await call(f.db,'GET');assert.equal(result.status,503,label);
   assert.doesNotMatch(await result.text(),/invalid JSON|SQL|payload/i,label);
  }finally{f.close();}
 }
 const failed=await call({prepare(){throw Error('private SQL sentinel');}},'GET');
 assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/sentinel|SQL/i);
 const falseRead=await call({prepare(){return {bind(){return {async all(){return {success:false,results:[]};}};}}}},'GET');
 assert.equal(falseRead.status,503,'an unsuccessful D1 read cannot masquerade as empty history');
 const falseWrite=await call({prepare(){return {bind(){return {async all(){return {success:true,results:[]};},async run(){return {success:false,meta:{changes:1}};}};}}}},'POST',payload());
 assert.equal(falseWrite.status,503,'an unsuccessful D1 write cannot be confirmed');
});

test('isolated Miniflare D1 has one winner for a concurrent expected version', {timeout:120000},async()=>{
 const worker=`import {getRegionalReferenceDrafts,postRegionalReferenceDraft} from './lib/regional-reference-draft-api.ts';
 const catalogue=${JSON.stringify(catalogue)};
 export default {async fetch(request,env){return request.method==='GET'?getRegionalReferenceDrafts(request,env.DB,catalogue):postRegionalReferenceDraft(request,env.DB,catalogue);}};`;
 const output=await build({stdin:{contents:worker,resolveDir:process.cwd(),sourcefile:'regional-reference-draft-d1-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/regional-reference-draft-d1-fixture.mjs'),contents:output.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
 try{
  const db=await mf.getD1Database('DB');const migration=readFileSync(new URL('../drizzle/0008_solid_infant_terrible.sql',import.meta.url),'utf8');
  await db.prepare(migration.split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`'))!.trim()).run();
  const send=(method:'GET'|'POST',body?:unknown)=>mf.dispatchFetch('https://review.test/api/atlas-review/reference-learning',{method,headers:{'oai-authenticated-user-id':user(),...regionalReferenceDraftHeaders(context),...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  assert.equal((await send('POST',payload())).status,201);
  const race=await Promise.all([send('POST',payload(1)),send('POST',payload(1))]);
  assert.deepEqual(race.map(r=>r.status).sort(),[201,409],(await Promise.all(race.map(r=>r.clone().text()))).join('\n'));
  assert.equal((await race.find(r=>r.status===409)!.json() as any).code,'version-conflict');
  const history=await (await send('GET')).json() as any;assert.deepEqual(history.history.map((event:any)=>event.version),[2,1]);
  const rows=await db.prepare('SELECT track,structure_id,version,payload FROM atlas_personal_nested_review_events ORDER BY version').all<any>();
  assert.deepEqual(rows.results.map(row=>row.version),[1,2]);
  assert.ok(rows.results.every(row=>row.track==='teaching'&&row.structure_id===context.target.id));
 }finally{await mf.dispose();}
});
