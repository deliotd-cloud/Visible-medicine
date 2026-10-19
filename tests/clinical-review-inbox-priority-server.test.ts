import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const files=['../atlas-review/manifest.json','../atlas-review/content/body-renderer-revision.json','../atlas-review/content/review-revisions.json',
 '../atlas-review/lib/clinical-review-index','../atlas-review/lib/clinical-review-priority','../atlas-review/lib/body-review-context',
 '../atlas-review/lib/nested-review-material','../atlas-review/lib/specimen-review-material','../atlas-review/lib/review-http',
 './clinical-review-extra-inbox','./clinical-review-inbox-contract'];
const contents=files.map((name,index)=>`import * as m${index} from ${JSON.stringify(name)};`).join('\n')+
 '\nexport const modules={'+files.map((name,index)=>`${JSON.stringify(name)}:m${index}`).join(',')+'};';
const built=await build({stdin:{contents,resolveDir:process.cwd()+'/lib',loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const bundle={exports:{} as any};new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),bundle,bundle.exports);
const imports=bundle.exports.modules;
for(const name of files.filter(name=>name.endsWith('.json')))imports[name]=imports[name].default;
const {clinicalReviewEntries,findClinicalReviewEntries}=imports['../atlas-review/lib/clinical-review-index'];
let transform:(rows:any[])=>any[]=rows=>rows,extraTransform:(rows:any[])=>any[]=rows=>rows;
const canonicalExtra=imports['./clinical-review-extra-inbox'];
imports['./clinical-review-extra-inbox']={...canonicalExtra,extraInboxStatuses:async(...args:any[])=>extraTransform(await canonicalExtra.extraInboxStatuses(...args))};
imports['../atlas-review/lib/clinical-review-queue']={getClinicalReviewQueueWithReasons:async(request:Request)=>{
 const params=new URL(request.url).searchParams;assert.deepEqual([...params.keys()],['page']);assert.equal(request.headers.get('oai-authenticated-user-id'),'synthetic-person');
 const selected=findClinicalReviewEntries({page:Number(params.get('page'))}).entries;
 return Response.json({schema:'vm-clinical-priority-1',scope:'private-to-signed-in-user',items:transform(selected.map((entry:any)=>({key:entry.key,geometry:'re-review',teaching:'not-started',
  geometryReason:entry.scope==='shoulder'?null:entry.scope==='body'?'viewer-only':entry.scope==='nested'?'source-or-teaching':'other-review-material',teachingReason:null})))});
}};
const code=ts.transpileModule(readFileSync('lib/clinical-review-inbox.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const mod={exports:{} as any};new Function('require','module','exports',code)((name:string)=>imports[name]??require(name),mod,mod.exports);
const {getClinicalReviewInbox}=mod.exports;
const request=(query='',user='synthetic-person')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
const db={prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);const statement={bind(){return statement;},async all(){return {success:true,results:[]};}};return statement;}};

test('website adapter exposes only validated optional reasons for exact eligible tracks',async()=>{
 transform=rows=>rows;extraTransform=rows=>rows;
 const first=await getClinicalReviewInbox(request(),db);assert.equal(first.status,200);const start=await first.json();assert(start.items.every((item:any)=>!Object.hasOwn(item,'changeReason')));
 const pages=new Set<number>();for(const scope of['shoulder','body','nested','specimens'])pages.add(Math.floor(clinicalReviewEntries.findIndex((entry:any)=>entry.scope===scope)/12)+2);
 for(const page of pages){
  const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${start.catalogRevision}`),db);assert.equal(response.status,200);const batch=await response.json();
  const entries=findClinicalReviewEntries({page:page-1}).entries;assert.equal(batch.items.length,entries.length*2);
  for(const [index,entry]of entries.entries()){
   const geometry=batch.items[index*2],teaching=batch.items[index*2+1];assert.equal(geometry.status,'re-review');assert.equal(teaching.status,'not-started');assert(!Object.hasOwn(teaching,'changeReason'));
   if(entry.scope==='shoulder')assert(!Object.hasOwn(geometry,'changeReason'));
   else assert.equal(geometry.changeReason,entry.scope==='body'?'viewer-only':entry.scope==='nested'?'source-or-teaching':'other-review-material');
   assert.equal(geometry.href,entry.href);assert.match(geometry.revision,/^[a-f0-9]{64}$/);
  }
  assert.doesNotMatch(JSON.stringify(batch),/geometryReason|teachingReason|sourceHash|materialHash|reviewerId|private-note/);
 }
});

test('private adapter refuses untrusted, shoulder or non-re-review reason injection',async()=>{
 const start=await (await getClinicalReviewInbox(request(),db)).json();
 for(const change of[
  (row:any)=>({...row,geometryReason:'unknown'}),
  (row:any)=>({...row,privateNote:'private-note'}),
  (row:any)=>({...row,geometry:'not-started',geometryReason:'viewer-only'}),
  (row:any)=>({...row,geometryReason:'viewer-only'}), // page2 starts with unsupported shoulder
 ]){
  transform=rows=>rows.map((row,index)=>index===0?change(row):row);
  const response=await getClinicalReviewInbox(request('?page=2&revision='+start.catalogRevision),db);assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private-note|viewer-only/);
 }
 transform=rows=>rows.map(row=>({...row,geometryReason:null}));
 const noReason=await getClinicalReviewInbox(request('?page=2&revision='+start.catalogRevision),db);assert.equal(noReason.status,200);assert((await noReason.json()).items.every((item:any)=>!Object.hasOwn(item,'changeReason')));
 transform=rows=>rows;extraTransform=rows=>rows.map((row,index)=>index===0?{...row,changeReason:'viewer-only'}:row);
 assert.equal((await getClinicalReviewInbox(request(),db)).status,503);extraTransform=rows=>rows;
 assert.equal((await getClinicalReviewInbox(request('',''),db)).status,401);
 for(const query of['?changeReason=viewer-only','?reviewer=another'])assert.equal((await getClinicalReviewInbox(request(query),db)).status,400);
});
