import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import ts from 'typescript';

// Synthetic status/material fixtures keep exhaustive pagination bounded. The
// production inbox, real discovery index and response contract are executed.
const require=createRequire(import.meta.url),hash=c=>c.repeat(64);
const bundled=await build({stdin:{contents:"export * as index from './atlas-review/lib/clinical-review-index'; export * as contract from './lib/clinical-review-inbox-contract'; export * as http from './atlas-review/lib/review-http';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const modules={exports:{}};
new Function('require','module','exports',bundled.outputFiles[0].text)((name)=>name==='server-only'?{}:require(name),modules,modules.exports);
const {index,contract,http}=modules.exports;
const manifest={revision:'synthetic-source-a',websiteIntegrationSha256:hash('a')};
const revisions={revisions:Object.fromEntries(index.clinicalReviewEntries.filter(e=>e.scope==='shoulder').map(e=>[e.id,{geometry:hash('b'),teaching:hash('c')}]))};
const extra=[{key:'synthetic-extra',title:'Synthetic held source',area:'source-comparisons',scopeLabel:'Synthetic source',href:'/workspace/atlas-review/source-comparisons/foot',trackLabel:'Inspection',revision:hash('d'),capability:'inspection-only'}];
const state={catalogCalls:0,extraStatusCalls:0,queuePages:[],history:[],failure:null,mutation:null,capture:null};
const imports={
 '../atlas-review/manifest.json':manifest,
 '../atlas-review/content/body-renderer-revision.json':{sha256:hash('e')},
 '../atlas-review/content/review-revisions.json':revisions,
 '../atlas-review/lib/clinical-review-index':index,
 '../atlas-review/lib/clinical-review-priority':await priorityModule(),
 '../atlas-review/lib/body-review-context':{bodyReviewContext:async()=>({revisions:{geometry:hash('f'),teaching:hash('1')}})},
 '../atlas-review/lib/nested-review-material':{nestedReviewMaterial:async()=>({context:{revisions:{geometry:hash('f'),teaching:hash('1')}}})},
 '../atlas-review/lib/specimen-review-material':{specimenReviewMaterial:async()=>({context:{revisions:{geometry:hash('f'),teaching:hash('1')}}})},
 '../atlas-review/lib/review-http':http,
 './clinical-review-inbox-contract':contract,
 './clinical-review-extra-inbox':{
  extraInboxCatalog:async()=>{state.catalogCalls++;return extra;},
  extraInboxStatuses:async(request,db)=>{state.extraStatusCalls++;await db.prepare('SELECT synthetic_extra_status').bind(request.headers.get('oai-authenticated-user-id')).all();return extra.map(e=>({...e,status:'inspection-required'}));},
 },
 '../atlas-review/lib/clinical-review-queue':{getClinicalReviewQueueWithReasons:async(request,db,observe)=>{
  const page=Number(new URL(request.url).searchParams.get('page')),user=request.headers.get('oai-authenticated-user-id');
  state.queuePages.push(page);
  const selected=index.findClinicalReviewEntries({page}).entries;
  await db.prepare('SELECT synthetic_queue_status').bind(user,page).all();
  if(state.failure?.page===page)return Response.json({error:'synthetic-private-error'},{status:state.failure.status});
  if(state.capture?.page===page){const key=selected.find(e=>e.scope!=='shoulder')?.key;if(key){observe(key,Promise.resolve({geometry:hash('f'),teaching:hash('1')}));observe(state.capture.kind==='foreign'?'foreign-selection':key,Promise.resolve({geometry:hash('f'),teaching:hash('1')}));}}
  const rows=selected.map(e=>({key:e.key,geometry:user==='alice'?'re-review':'not-started',teaching:'not-started',geometryReason:null,teachingReason:null}));
  if(state.mutation?.page===page){const row=rows[0];rows[0]=state.mutation.kind==='foreign'?{...row,key:'foreign-selection'}:{...row,geometry:'not-a-status'};}
  return Response.json({schema:'vm-clinical-priority-1',scope:'private-to-signed-in-user',items:rows});
 }},
};
async function priorityModule(){
 const result=await build({stdin:{contents:"export * from './atlas-review/lib/clinical-review-priority';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
 const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)((name)=>name==='server-only'?{}:require(name),mod,mod.exports);return mod.exports;
}
const oldSource=readFileSync('tests/fixtures/inbox-before-batching.ts.raw','utf8');
assert.equal(createHash('sha256').update(oldSource).digest('hex'),'060b4451447121dc91e616d40af6b68f0707ca83453936ecea4703cc26e7b365');
// VM_INBOX_NEGATIVE_CONTROL=1 runs the same acceptance against the exact
// prechange helper; the batch=2 success assertion must then fail.
const source=process.env.VM_INBOX_NEGATIVE_CONTROL==='1'?oldSource:readFileSync('lib/clinical-review-inbox.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
function loadInbox(overrides={}){const loaded={exports:{}};new Function('require','module','exports',compiled)((name)=>Object.hasOwn(overrides,name)?overrides[name]:Object.hasOwn(imports,name)?imports[name]:require(name),loaded,loaded.exports);return loaded.exports.getClinicalReviewInbox;}
const getClinicalReviewInbox=loadInbox();
const request=(query='',user='alice')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
const db={prepare(sql){assert.match(sql,/^SELECT /);let args=[];const statement={bind(...values){args=values;return statement;},async all(){state.history.push({sql,args});return {success:true,results:[]};}};return statement;}};
async function read(query='',user='alice'){const response=await getClinicalReviewInbox(request(query,user),db);return {status:response.status,body:await response.json()};}
function reset(){state.catalogCalls=0;state.extraStatusCalls=0;state.queuePages=[];state.history=[];state.failure=null;state.mutation=null;state.capture=null;}

test('synthetic exhaustive scan matches default ordered rows and uses fewer fresh catalogue verifications',async()=>{
 reset();const legacy=await read(),two=await read('?batch=2');assert.equal(legacy.status,200);assert.equal(two.status,200);
 assert.deepEqual(two.body.items,legacy.body.items);assert.notEqual(two.body.catalogRevision,legacy.body.catalogRevision);
 const bodyPages=index.findClinicalReviewEntries().pageCount;
 assert.equal(legacy.body.pageCount,bodyPages+1);assert.equal(two.body.pageCount,Math.ceil(bodyPages/2)+1);
 const oldRows=[...legacy.body.items],newRows=[...two.body.items],oldStart=state.catalogCalls;
 for(let page=2;page<=legacy.body.pageCount;page++){const result=await read(`?page=${page}&revision=${legacy.body.catalogRevision}`);assert.equal(result.status,200);oldRows.push(...result.body.items);}
 const oldCalls=state.catalogCalls-oldStart,newStart=state.catalogCalls;state.queuePages=[];
 for(let page=2;page<=two.body.pageCount;page++){
  const result=await read(`?page=${page}&revision=${two.body.catalogRevision}&batch=2`);assert.equal(result.status,200);
  const expected=[(page-2)*2+1,(page-2)*2+2].filter(value=>value<=bodyPages);
  assert.deepEqual(state.queuePages.splice(0),expected);assert.equal(result.body.items.length,expected.flatMap(value=>index.findClinicalReviewEntries({page:value}).entries).length*2);
  assert(result.body.items.length<=48);newRows.push(...result.body.items);
 }
 assert.deepEqual(newRows,oldRows);assert.equal(new Set(newRows.map(row=>row.key)).size,newRows.length);
 assert.equal(oldCalls,bodyPages);assert.equal(state.catalogCalls-newStart,Math.ceil(bodyPages/2));assert.equal(state.extraStatusCalls,2);
 assert.equal(newRows.length,extra.length+index.clinicalReviewEntries.length*2);
});

test('synthetic strict batch cursors and source changes fail before private history',async()=>{
 reset();const legacy=await read(),one=await read('?batch=1'),two=await read('?batch=2');
 assert.equal(one.body.catalogRevision,legacy.body.catalogRevision);assert.deepEqual(one.body,legacy.body);
 for(const query of['?batch=0','?batch=02','?batch=3','?batch=1&batch=2','?batch=2&batch=2']){const before=state.history.length;assert.equal((await read(query)).status,400);assert.equal(state.history.length,before);}
 assert.equal((await read(`?page=2&revision=${legacy.body.catalogRevision}&batch=2`)).status,409);
 assert.equal((await read(`?page=2&revision=${two.body.catalogRevision}`)).status,409);
 manifest.revision='synthetic-source-b';const before=state.history.length;
 assert.equal((await read(`?page=2&revision=${two.body.catalogRevision}&batch=2`)).status,409);assert.equal(state.history.length,before);
 manifest.revision='synthetic-source-a';
});

test('synthetic odd final chunk and empty body catalogue keep exact page bounds',async()=>{
 reset();
 const limited={...index,clinicalReviewEntries:index.clinicalReviewEntries.slice(0,36),findClinicalReviewEntries:(input={})=>({...index.findClinicalReviewEntries(input),pageCount:3})};
 const odd=loadInbox({'../atlas-review/lib/clinical-review-index':limited});
 const first=await odd(request('?batch=2'),db);assert.equal(first.status,200);const cursor=(await first.json()).catalogRevision;
 assert.equal((await(await odd(request(`?page=2&revision=${cursor}&batch=2`),db)).json()).items.length,48);
 state.queuePages=[];const last=await odd(request(`?page=3&revision=${cursor}&batch=2`),db);assert.equal(last.status,200);
 const body=await last.json();assert.equal(body.pageCount,3);assert.equal(body.nextPage,null);assert.equal(body.items.length,24);assert.deepEqual(state.queuePages,[3]);
 assert.equal((await odd(request(`?page=4&revision=${cursor}&batch=2`),db)).status,400);
 const emptyIndex={...index,clinicalReviewEntries:[],findClinicalReviewEntries:()=>({pageCount:0,entries:[]})};
 const empty=loadInbox({'../atlas-review/lib/clinical-review-index':emptyIndex});
 const extraOnly=await empty(request('?batch=2'),db);assert.equal(extraOnly.status,200);
 const extraBody=await extraOnly.json();assert.equal(extraBody.pageCount,1);assert.equal(extraBody.nextPage,null);assert.equal(extraBody.selectionTotal,extra.length);assert.equal(extraBody.items.length,extra.length);
});

test('synthetic second-chunk failures, malformed status and captured source mismatch refuse entire batch',async()=>{
 reset();const first=await read('?batch=2'),cursor=first.body.catalogRevision,query=`?page=2&revision=${cursor}&batch=2`;
 for(const status of[503,401]){state.failure={page:2,status};state.queuePages=[];const result=await read(query);assert.equal(result.status,status);assert.deepEqual(state.queuePages,[1,2]);assert(!Object.hasOwn(result.body,'items'));}
 state.failure=null;
 for(const kind of['invalid','foreign']){state.mutation={page:2,kind};state.queuePages=[];const result=await read(query);assert.equal(result.status,503);assert.deepEqual(state.queuePages,[1,2]);assert(!Object.hasOwn(result.body,'items'));}
 state.mutation=null;
 const page=Array.from({length:Math.floor(index.findClinicalReviewEntries().pageCount/2)},(_,i)=>(i+1)*2).find(n=>index.findClinicalReviewEntries({page:n}).entries.some(e=>e.scope!=='shoulder'));
 assert(page);
 for(const kind of['duplicate','foreign']){state.capture={page,kind};state.queuePages=[];const result=await read(`?page=${page/2+1}&revision=${cursor}&batch=2`);assert.equal(result.status,503);assert.deepEqual(state.queuePages,[page-1,page]);assert(!Object.hasOwn(result.body,'items'));}
 state.capture=null;
});

test('synthetic status reads remain fresh for each chunk and signed-in user',async()=>{
 reset();const first=await read('?batch=2'),query=`?page=2&revision=${first.body.catalogRevision}&batch=2`;
 const alice=await read(query,'alice');assert.equal(alice.status,200);assert.deepEqual(state.history.slice(-2).map(r=>r.args),[['alice',1],['alice',2]]);
 const bob=await read(query,'bob');assert.equal(bob.status,200);assert.deepEqual(state.history.slice(-2).map(r=>r.args),[['bob',1],['bob',2]]);
 assert(alice.body.items.some(row=>row.status==='re-review'));assert(bob.body.items.every(row=>row.status!=='re-review'));
 assert.equal(state.catalogCalls,3,'catalogue is verified for each request');
});
