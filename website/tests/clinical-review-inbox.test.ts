import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import ts from 'typescript';
import {parseInboxBatch,type InboxBatch,type InboxItem} from '../lib/clinical-review-inbox-contract.ts';
import * as access from '../lib/clinical-review-access.ts';

const require=createRequire(import.meta.url),hash='a'.repeat(64);
const item:InboxItem={key:'synthetic',title:'Synthetic structure',area:'structures',scopeLabel:'Body',href:'/workspace/atlas-review/body?structure=synthetic',trackLabel:'Anatomy',revision:hash,status:'not-started',capability:'decision'};
const batch:InboxBatch={schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:hash,page:1,pageCount:1,selectionTotal:1,nextPage:null,items:[item],approval:false};
function compile(file:string,imports:Record<string,unknown>){
 const code=ts.transpileModule(readFileSync(resolve(file),'utf8').replaceAll('import.meta.env.DEV','false'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{} as Record<string,any>};
 new Function('require','module','exports',code)((name:string)=>imports[name]??require(name),mod,mod.exports);return mod.exports;
}
const built=await build({stdin:{contents:"export * from './lib/clinical-review-inbox'; export {clinicalReviewEntries,findClinicalReviewEntries} from './atlas-review/lib/clinical-review-index'; export {extraInboxCatalog} from './lib/clinical-review-extra-inbox';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const mod={exports:{} as Record<string,any>};
new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),mod,mod.exports);
const {getClinicalReviewInbox,inboxReadOnlyDatabase,clinicalReviewEntries,findClinicalReviewEntries,extraInboxCatalog}=mod.exports;
const request=(query='',user='server-bound-person')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
function database(result:unknown={success:true,results:[]}){
 const reads:{sql:string;args:unknown[]}[]=[];
 return {reads,prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);let args:unknown[]=[];const statement={bind(...values:unknown[]){args=values;return statement;},async all(){reads.push({sql,args});return result;},async run(){throw Error('Unexpected write');}};return statement;}};
}

test('summary contract rejects private extras, unsafe links, duplicate keys and false approval capabilities',()=>{
 assert.deepEqual(parseInboxBatch(batch,1,null),batch);
 const changed=[{scope:'public'},{approval:true},{page:0},{pageCount:0},{nextPage:2},{catalogRevision:'stale'},{history:[]},{items:[item,item]},{items:[{...item,notes:'private'}]},{items:[{...item,revision:null}]},{items:[{...item,status:'approval-recorded',capability:'corrections'}]}];
 for(const patch of changed)assert.throws(()=>parseInboxBatch({...batch,...patch},1,null));
 for(const href of ['https://external.invalid/','//external.invalid/','/workspace/atlas-review/../../admin','/workspace/atlas-review/%2e%2e/admin','/workspace/atlas-review/source-comparisons/unknown','/workspace/atlas-review\\admin','/workspace/atlas-review\n'])assert.throws(()=>parseInboxBatch({...batch,items:[{...item,href}]},1,null));
 assert.throws(()=>parseInboxBatch(batch,2,null));assert.throws(()=>parseInboxBatch(batch,1,'b'.repeat(64)));
 const copy=parseInboxBatch(batch,1,null);copy.items[0].title='Mutated';assert.equal(item.title,'Synthetic structure');
});

test('read-only database refuses writes, unconfirmed history and preserves bound statement methods',async()=>{
 const db=database(),read=inboxReadOnlyDatabase(db);
 assert.deepEqual(await read.prepare('SELECT value FROM reviews WHERE id=?').bind('private-key').all(),{success:true,results:[]});
 assert.deepEqual(db.reads[0].args,['private-key']);
 for(const sql of ['INSERT INTO reviews VALUES (1)','DELETE FROM reviews','UPDATE reviews SET value=1','PRAGMA table_info(reviews)'])assert.throws(()=>read.prepare(sql));
 assert.throws(()=>read.prepare('SELECT 1').run());assert.throws(()=>read.prepare('SELECT 1').raw());
 for(const value of [{success:false,results:[]},{results:[]},{success:true},null])await assert.rejects(inboxReadOnlyDatabase(database(value)).prepare('SELECT 1').all());
});

test('inbox binds continuation before history reads and has no caller-selected identity, scope or cursor ambiguity',async()=>{
 const db=database();
 assert.equal((await getClinicalReviewInbox(request('', ''),db)).status,401);
 for(const query of ['?page=0','?page=01','?page=1&page=2','?q=brain','?reviewer=another','?revision=stale','?page=1&revision='+hash+'&revision='+hash])assert.equal((await getClinicalReviewInbox(request(query),db)).status,400,query);
 assert.equal((await getClinicalReviewInbox(request('?page=2'),db)).status,409);
 assert.equal((await getClinicalReviewInbox(request('?page=2&revision='+hash),db)).status,409);
 assert.equal((await getClinicalReviewInbox(request('?page=99999&revision='+hash),db)).status,400);
 assert.equal(db.reads.length,0,'invalid requests must not read saved history');
 assert.equal((await getClinicalReviewInbox(request(),undefined)).status,503);
});

test('real catalogue keeps every 3D selection and both exact tracks, bounded pages and all extra scopes',async()=>{
 const db=database(),first=await getClinicalReviewInbox(request(),db);assert.equal(first.status,200);
 const start=parseInboxBatch(await first.json(),1,null),extra=await extraInboxCatalog();
 assert.equal(start.items.filter(row=>row.area!=='regional-learning').length,59);
 assert.equal(start.items.length,64);assert(start.items.length<=64);assert.equal(start.items.filter(row=>row.area==='regional-learning').length,5);assert.equal(start.items.length,extra.length);
 const added=['schematic:prostate-zones:inspection','source:foot','head:ct-facial-comparison','head:ct-facial-learning','head:ct-facial-review:teaching','head:ct-facial-review:clinical',...['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'].map(id=>`head:ct-bone:${id}`)];
 assert.equal(start.items.filter(row=>!added.includes(row.key)).length,55);
 for(const key of added)assert.equal(start.items.filter(row=>row.key===key).length,1);
 const prostate=start.items.find(row=>row.key==='schematic:prostate-zones:inspection')!;
 assert.equal(prostate.capability,'decision');assert.equal(prostate.status,'not-started');assert.match(prostate.revision!,/^[a-f0-9]{64}$/);
 assert.equal(prostate.href,'/workspace/atlas-review/prostate?revision='+prostate.revision);
 assert.equal(start.items.find(row=>row.key==='head:ct-facial-learning')?.capability,'inspection-only');
 assert.equal(start.items.find(row=>row.key==='source:foot')?.capability,'inspection-only');
 assert.equal(start.items.find(row=>row.key==='source:foot')?.status,'inspection-required');
 for(const kind of ['teaching','clinical'])assert.equal(start.items.find(row=>row.key===`head:ct-facial-review:${kind}`)?.capability,'decision');
 assert.equal(start.pageCount,findClinicalReviewEntries().pageCount+1);
 assert.equal(start.selectionTotal,clinicalReviewEntries.length+extra.length);
 assert(start.items.every((row:InboxItem)=>row.status==='not-started'||row.status==='inspection-required'));
 assert.equal(start.items.filter((row:InboxItem)=>row.area==='source-comparisons').length,5);
 // Exercise one full real page per catalogue family, plus the last boundary.
 const pages=new Set<number>([2,start.pageCount]);
 for(const scope of ['shoulder','body','nested','specimens']){
  const index=clinicalReviewEntries.findIndex((entry:any)=>entry.scope===scope);assert(index>=0);pages.add(Math.floor(index/12)+2);
 }
 for(const page of pages){
  const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${start.catalogRevision}`),db);assert.equal(response.status,200);
  const result=parseInboxBatch(await response.json(),page,start.catalogRevision),entries=findClinicalReviewEntries({page:page-1}).entries;
  assert.equal(result.items.length,entries.length*2);assert(result.items.length<=24);
  for(const [index,entry]of entries.entries())for(const [offset,track]of ['geometry','teaching'].entries()){
   const row=result.items[index*2+offset];assert.equal(row.key,JSON.stringify([entry.key,track]));assert.equal(row.href,track==='teaching'?entry.href+(entry.href.includes('?')?'&':'?')+'t=teaching':entry.href);assert.equal(row.title,entry.name);assert.match(row.revision!,/^[a-f0-9]{64}$/);assert.equal(row.status,'not-started');
   const target=new URL(row.href,'https://review.invalid'),original=new URL(entry.href,'https://review.invalid');
   assert.equal(target.pathname,original.pathname);assert.equal(target.hash,original.hash);assert.equal(row.trackLabel,track==='teaching'?'Teaching':'Anatomy');
   if(track==='teaching'){assert.deepEqual(target.searchParams.getAll('t'),['teaching']);target.searchParams.delete('t');}
   assert.deepEqual([...target.searchParams],[...original.searchParams],'track entry must preserve the exact structure, parent, study, source and specimen query');
  }
 }
 // Static index pagination itself is exhaustive: no missing or duplicate selection.
 const selections=Array.from({length:findClinicalReviewEntries().pageCount},(_,i)=>findClinicalReviewEntries({page:i+1}).entries).flat();
 assert.deepEqual(selections.map((entry:any)=>entry.key),clinicalReviewEntries.map((entry:any)=>entry.key));
 assert.equal(new Set(selections.map((entry:any)=>entry.key)).size,selections.length);
 assert(db.reads.length>0);assert(db.reads.every(read=>JSON.stringify(read.args).includes('server-bound-person')));
 assert(!JSON.stringify(start).includes('server-bound-person'));assert(!JSON.stringify(start).includes('history'));
});

test('failed or corrupt 3D history never becomes a not-started or inherited approval',async()=>{
 const revision=(await (await getClinicalReviewInbox(request(),database())).json()).catalogRevision;
 for(const result of [{success:false,results:[]},{success:true,results:[{payload:'invalid',version:1}]}]){
  const response=await getClinicalReviewInbox(request('?page=2&revision='+revision),database(result));assert.equal(response.status,200);
  const value=parseInboxBatch(await response.json(),2,revision);assert(value.items.every(row=>row.status==='unavailable'));
 }
});

test('actual inbox route runs real account/institution guard and overwrites claimed reviewer identity',async()=>{
 let subject:string|null=null,membership:any=null;const db=database();let principalReads=0;
 const binding={withSession(){return {prepare(sql:string){
  if(sql.includes('FROM users u'))return {bind(user:string,external:string){assert.equal(user,`edu:${subject}`);assert.equal(external,`sites:${subject}`);return {async first(){principalReads++;return membership;}};}};
  return db.prepare(sql);
 }};}};
 const guard=compile('lib/clinical-review-server.ts',{'cloudflare:workers':{env:{DB:binding}},'@/app/chatgpt-auth':{getChatGPTUser:async()=>subject?{userId:subject}:null},'./clinical-review-access':access});
 const route=compile('app/api/atlas-review/inbox/route.ts',{'cloudflare:workers':{env:{DB:binding}},'@/lib/clinical-review-server':guard,'@/lib/clinical-review-inbox':{getClinicalReviewInbox}});
 assert.equal(route.dynamic,'force-dynamic');assert.equal(route.POST,undefined);
 const claimed=request('','forged-owner');assert.equal((await route.GET(claimed)).status,401);assert.equal(principalReads,0);assert.equal(db.reads.length,0);
 subject='alice';assert.equal((await route.GET(claimed)).status,403);assert.equal(db.reads.length,0);
 membership={roles:'learner',organization_id:'institution-a',role:'owner'};assert.equal((await route.GET(claimed)).status,403);
 membership={...membership,roles:'administrator'};
 const a=await route.GET(claimed);assert.equal(a.status,200);assert.equal(a.headers.get('Cache-Control'),'private, no-store');assert.match(a.headers.get('Vary')!,/Cookie/);
 const contextA=a.headers.get('X-Clinical-Review-Context');assert.match(contextA!,/^[a-f0-9]{64}$/);
 const userA=JSON.stringify(['vm-website-personal-review-1','edu:alice','institution-a']);
 const contains=(value:unknown,expected:string):boolean=>value===expected||typeof value==='string'&&(()=>{try{return contains(JSON.parse(value),expected);}catch{return false;}})()||Array.isArray(value)&&value.some(child=>contains(child,expected));
 assert(db.reads.length>0);assert(db.reads.every(read=>contains(read.args,userA)));assert(!JSON.stringify(db.reads).includes('forged-owner'));
 db.reads.length=0;membership.organization_id='institution-b';
 const b=await route.GET(claimed);assert.equal(b.status,200);assert.notEqual(b.headers.get('X-Clinical-Review-Context'),contextA);
 assert(!JSON.stringify(db.reads).includes('institution-a'));assert(JSON.stringify(db.reads).includes('institution-b'));
});

test('inbox entry is outside the bound clinical renderer, uses its dedicated authorized layout and keeps catalogue link',()=>{
 const page=readFileSync('app/workspace/clinical-review-inbox/page.tsx','utf8'),workspace=readFileSync('app/workspace/page.tsx','utf8');
 const layout=readFileSync('app/workspace/clinical-review-inbox/layout.tsx','utf8');
 assert.match(page,/return <ClinicalReviewInbox\/>/);assert.doesNotMatch(page,/ClinicalReviewLayout/);assert.match(page,/index:false,follow:false/);
 assert.match(layout,/import \{ authorizeClinicalReview \} from '@\/lib\/clinical-review-server'/);assert.match(layout,/await authorizeClinicalReview\(\)/);assert.match(layout,/chatGPTSignInPath\('\/workspace\/clinical-review-inbox'\)/);
 assert.match(workspace,/href="\/workspace\/clinical-review-inbox"/);assert.match(workspace,/href="\/workspace\/atlas-review"/);assert.match(workspace,/roles\.includes\(["']administrator["']\)/);
});
