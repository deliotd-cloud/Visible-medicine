import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import ts from 'typescript';
const require=createRequire(import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const atlas=process.env.VM_ATLAS_SOURCE_REPO;assert(atlas,'Supply the exact candidate Atlas source');
const base='97e75c01f5b65f83a7edd607681cd6fdf50af7b6';
const oldQueue=execFileSync('git',['show',base+':lib/clinical-review-queue.ts'],{cwd:atlas,windowsHide:true,maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
const oldInbox=readFileSync('tests/fixtures/inbox-material-reuse-before-97e75.ts.raw','utf8');
const newInbox=readFileSync('lib/clinical-review-inbox.ts','utf8'),newQueue=readFileSync('atlas-review/lib/clinical-review-queue.ts','utf8');
const queueImport=JSON.parse(readFileSync('atlas-review/manifest.json')).files.find(row=>row.path==='lib/clinical-review-queue.ts');
assert(queueImport);assert.equal(queueImport.importedSha256,sha(Buffer.from(newQueue)));
assert.equal(queueImport.sourceSha256,sha(readFileSync(resolve(atlas,'lib/clinical-review-queue.ts'))),'Test the real import of this exact source, not an unimported prototype');
const queueNames=['clinical-review-index','review-http','review-store','body-review-store','nested-review-store','specimen-review-store','body-review-context','nested-review-material','specimen-review-material','review-workspace','body-review-decisions','nested-review','specimen-review','review-change-reason'];
const inboxNames=['../atlas-review/manifest.json','../atlas-review/content/body-renderer-revision.json','../atlas-review/content/review-revisions.json','../atlas-review/lib/clinical-review-index','../atlas-review/lib/clinical-review-priority','../atlas-review/lib/body-review-context','../atlas-review/lib/nested-review-material','../atlas-review/lib/specimen-review-material','../atlas-review/lib/review-http','./clinical-review-extra-inbox','./clinical-review-inbox-contract'];
const names=[...new Set([...inboxNames,...queueNames.map(n=>'../atlas-review/lib/'+n)])];
const contents=names.map((n,i)=>`import * as m${i} from ${JSON.stringify(n)};`).join('\n')+'\nexport const modules={'+names.map((n,i)=>`${JSON.stringify(n)}:m${i}`).join(',')+'};';
const built=await build({stdin:{contents,resolveDir:process.cwd()+'/lib',loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const bundle={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(n=>n==='server-only'?{}:require(n),bundle,bundle.exports);
const actual=bundle.exports.modules;for(const n of names.filter(n=>n.endsWith('.json')))actual[n]=actual[n].default;
const {clinicalReviewEntries,findClinicalReviewEntries}=actual['../atlas-review/lib/clinical-review-index'];
function compile(text,imports){const code=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const m={exports:{}};new Function('require','module','exports',code)(n=>Object.hasOwn(imports,n)?imports[n]:require(n),m,m.exports);return m.exports;}
const request=(query='',user='synthetic-inbox-person')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
const scopes=['body','nested','specimens'];
const pageFor=scope=>Math.floor(clinicalReviewEntries.findIndex(e=>e.scope===scope)/12)+2;
function harness({baseline=false,failedMaterial=null,failedDb=false,legacy=false,badCapture=null}={}){
 const calls={body:0,nested:0,specimens:0},reads=[];
 const wrappers={};
 for(const[scope,name,fn]of [['body','body-review-context','bodyReviewContext'],['nested','nested-review-material','nestedReviewMaterial'],['specimens','specimen-review-material','specimenReviewMaterial']]){
  wrappers[name]={...actual['../atlas-review/lib/'+name],[fn]:(...args)=>{calls[scope]++;if(failedMaterial===scope)return Promise.reject(Error('PRIVATE SOURCE FAILURE'));return actual['../atlas-review/lib/'+name][fn](...args);}};
 }
 const qImports=Object.fromEntries(queueNames.map(n=>['./'+n,wrappers[n]??actual['../atlas-review/lib/'+n]]));
 const q=compile(baseline?oldQueue:newQueue,qImports),imports={...actual};
 for(const[name,value]of Object.entries(wrappers))imports['../atlas-review/lib/'+name]=value;
 imports['../atlas-review/lib/clinical-review-queue']={getClinicalReviewQueueWithReasons:async(req,db,observe)=>{
  if(legacy)return q.getClinicalReviewQueueWithReasons(req,db);
  return q.getClinicalReviewQueueWithReasons(req,db,badCapture?(key,pending)=>{observe(key,pending);observe(badCapture==='duplicate'?key:'foreign-key',pending);}:observe);
 }};
 const api=compile(baseline?oldInbox:newInbox,imports);
 const db={prepare(sql){assert.match(sql,/^\s*SELECT\b/i);if(failedDb)throw Error('PRIVATE DATABASE FAILURE');let args=[];const statement={bind(...values){args=values;return statement;},async all(){reads.push({sql,args});return{success:true,results:[]};},async run(){throw Error('Unexpected write');}};return statement;}};
 return{...api,calls,reads,db,reset(){for(const k of scopes)calls[k]=0;reads.length=0;}};
}
async function revision(h){const response=await h.getClinicalReviewInbox(request(),h.db);assert.equal(response.status,200);return(await response.json()).catalogRevision;}
async function readPage(h,page,catalogRevision,user){const r=await h.getClinicalReviewInbox(request('?page='+page+'&revision='+catalogRevision,user),h.db);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');return r.json();}

test('unchanged baseline worksheet adapter is preserved as an exact fixture',()=>{
 assert.equal(sha(Buffer.from(oldInbox)),'ecfac64ead278ec2e7798a523bc847ff15db9690d00b8d9fb7cc362b7923ef4c');
 assert(oldInbox.includes('revisions=await trackRevisions(entry)'));
 assert.notEqual(oldInbox,newInbox);assert.notEqual(oldQueue,newQueue);
});

test('actual inbox responses stay identical while each source family resolves once instead of twice',async()=>{
 const before=harness({baseline:true}),after=harness();const rev=await revision(before);assert.equal(await revision(after),rev);
 const measured=[];
 for(const scope of scopes){
  const page=pageFor(scope),selected=findClinicalReviewEntries({page:page-1}).entries;
  before.reset();after.reset();const original=await readPage(before,page,rev),current=await readPage(after,page,rev);assert.deepEqual(current,original);
  for(const family of scopes){const n=selected.filter(e=>e.scope===family).length;assert.equal(before.calls[family],n*2);assert.equal(after.calls[family],n);}
  // Independent entries are deliberately read concurrently. Compare the exact
  // query/argument multiset, not WebCrypto completion order across entries.
  assert.deepEqual(after.reads.map(r=>JSON.stringify(r)).sort(),before.reads.map(r=>JSON.stringify(r)).sort(),'No status query or saved-decision cache');
  assert.doesNotMatch(JSON.stringify(current),/sourceHash|materialHash|privateNote|PRIVATE|captured/);
  measured.push({scope,page,before:{...before.calls},after:{...after.calls}});
 }
 console.log('Measured source-resolution calls (not a wall-clock benchmark): '+JSON.stringify(measured));
});

test('new requests and another account recompute material and independently read saved history',async()=>{
 const h=harness(),rev=await revision(h),page=pageFor('body'),count=findClinicalReviewEntries({page:page-1}).entries.filter(e=>e.scope==='body').length;h.reset();
 const first=await readPage(h,page,rev,'synthetic-person-a');assert.equal(h.calls.body,count);const reads=h.reads.length;
 assert.deepEqual(await readPage(h,page,rev,'synthetic-person-b'),first);assert.equal(h.calls.body,count*2);assert.equal(h.reads.length,reads*2);assert(reads>0);
 assert(h.reads.some(r=>r.args.includes('synthetic-person-a')));assert(h.reads.some(r=>r.args.includes('synthetic-person-b')));
});

test('invalid, unauthenticated and stale-catalogue requests resolve no source and read no history',async()=>{
 const h=harness(),rev=await revision(h);h.reset();
 for(const[query,user,status]of [['?page=2&revision='+rev,'',401],['?page=2','synthetic',409],['?page=2&revision='+'0'.repeat(64),'synthetic',409],['?page=2&page=3','synthetic',400],['?reviewer=foreign','synthetic',400]])assert.equal((await h.getClinicalReviewInbox(request(query,user),h.db)).status,status);
 assert.deepEqual(h.calls,{body:0,nested:0,specimens:0});assert.equal(h.reads.length,0);
});

test('failed material is unavailable without a second attempt or private-detail leakage',async()=>{
 const normal=harness(),rev=await revision(normal);
 for(const scope of scopes){const before=harness({baseline:true,failedMaterial:scope}),after=harness({failedMaterial:scope}),page=pageFor(scope),n=findClinicalReviewEntries({page:page-1}).entries.filter(e=>e.scope===scope).length;
  const original=await readPage(before,page,rev),current=await readPage(after,page,rev);assert.deepEqual(current,original);assert.equal(after.calls[scope],n);assert.equal(before.calls[scope],n*2);assert.doesNotMatch(JSON.stringify(current),/PRIVATE/);
 }
});

test('failed saved-status reads preserve valid revision hashes but cannot become empty history or approval',async()=>{
 const rev=await revision(harness());for(const scope of scopes){const page=pageFor(scope),before=harness({baseline:true,failedDb:true}),after=harness({failedDb:true});const old=await readPage(before,page,rev),current=await readPage(after,page,rev);assert.deepEqual(current,old);assert(current.items.every(item=>item.status==='unavailable'));assert(current.items.some(item=>/^[a-f0-9]{64}$/.test(item.revision??'')));assert.doesNotMatch(JSON.stringify(current),/PRIVATE/);}
});

test('legacy queue callers retain direct resolution; duplicate or foreign captures fail closed',async()=>{
 const normal=harness(),rev=await revision(normal),page=pageFor('body'),legacy=harness({legacy:true});
 assert.deepEqual(await readPage(legacy,page,rev),await readPage(normal,page,rev));assert.equal(legacy.calls.body,normal.calls.body*2);
 for(const badCapture of ['duplicate','foreign']){const h=harness({badCapture}),r=await h.getClinicalReviewInbox(request('?page='+page+'&revision='+rev),h.db);assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/foreign-key|PRIVATE|materialHash/);}
});
