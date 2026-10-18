import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import ts from 'typescript';
import {createRequire} from 'node:module';
const sha=(x:string)=>createHash('sha256').update(x).digest('hex'),require=createRequire(import.meta.url);
// Bundle actual modules to compile the existing ReviewHttpError parameter
// property; Node's strip-only loader cannot evaluate that legacy dependency.
const bundled=await build({stdin:{contents:["export {regionalMriGuideDrafts} from './lib/regional-mri-guided-study';","export * from './lib/regional-guide-review';","export * from './lib/regional-guide-review-contract';","export * from './lib/regional-guide-review-api';","export * from './lib/regional-guide-review-inbox';","export * as access from './lib/clinical-review-access';"].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {regionalMriGuideDrafts,regionalGuideReviewPackets,parseRegionalGuideReviewSelection,resolveRegionalGuideReview,regionalGuideReviewHref,regionalGuideReviewContext,blankRegionalGuideDecision,parseRegionalGuideReviewHistory,getRegionalGuideReviews,postRegionalGuideReview,nativeGuideInboxCatalog,nativeGuideInboxStatuses,access}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].contents).toString('base64'));
const packets:readonly import('../lib/regional-guide-review.ts').RegionalGuideReviewPacket[]=await regionalGuideReviewPackets();
function database(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').find(s=>s.includes('CREATE TABLE `atlas_personal_nested_review_events`'))!);
 const queries:{sql:string;params:unknown[]}[]=[];
 const db={prepare(query:string){return{bind(...params:unknown[]){const statement=sql.prepare(query);queries.push({sql:query,params});return{async all(){return{success:true,results:statement.all(...params as any[])};},async run(){const result=statement.run(...params as any[]);return{success:true,meta:{changes:Number(result.changes)}};}};}};}};
 return{sql,db,queries,close:()=>sql.close()};}
function request(packet=packets[4],method='GET',body?:unknown,extra:Record<string,string>={}){return new Request('https://review.test/api/atlas-review/regional-guides?'+new URLSearchParams({region:packet.region,guide:packet.guideId,revision:packet.contentRevision}),{method,headers:{'oai-authenticated-user-id':'server-opaque-principal',...(method==='POST'?{origin:'https://review.test','content-type':'application/json'}:{}),...extra},...(method==='POST'?{body:JSON.stringify(body)}:{})});}
const approval={...blankRegionalGuideDecision(),status:'approved' as const,checks:{facts:true,scope:true,sources:true,navigation:true},attested:true,notes:'Synthetic review only.'};

test('all five actual authored guides expose exact source-free metadata and full content hashes',async()=>{
 assert.equal(packets.length,5);assert.equal(packets.reduce((n,p)=>n+p.steps.length,0),12);
 assert.equal(sha(JSON.stringify(regionalMriGuideDrafts('knee'))),'42703e05b0be7769bb44f7a34a78852cf33467d00d6cc5903aa65393cb695506');assert.deepEqual(regionalMriGuideDrafts('leg'),[]);
 for(const p of packets){assert(Object.isFrozen(p));assert(Object.isFrozen(p.steps));for(const s of p.steps){assert(Object.isFrozen(s));assert(Object.isFrozen(s.source));}
  assert.equal(p.contentRevision,sha(JSON.stringify({region:p.region,guideId:p.guideId,title:p.title,guideRevision:p.guideRevision,steps:p.steps})));
  const url=new URL(regionalGuideReviewHref(p),'https://review.test'),selection=parseRegionalGuideReviewSelection(Object.fromEntries(url.searchParams));assert(selection);assert.deepEqual(await resolveRegionalGuideReview(selection),p);
  assert.equal(await resolveRegionalGuideReview({...selection,revision:'0'.repeat(64)}),null);
  assert.equal(p.approvalScope,'guide-teaching-only');assert.equal(p.patientRegistration,false);assert.equal(p.publicationApproval,false);
  assert.doesNotMatch(JSON.stringify(p),/imageSha256|sourceRevision|seriesId|annotationId|points_ras_mm|ijk_to_ras|candidates/);
 }
 for(const v of [null,{}, {region:'knee',guide:'posterior-knee',revision:'bad'},{region:'leg',guide:'posterior-knee',revision:'a'.repeat(64)},{region:'knee',guide:'unknown',revision:'a'.repeat(64)},{region:'knee',guide:['posterior-knee'],revision:'a'.repeat(64)},{region:'knee',guide:'posterior-knee',revision:'a'.repeat(64),extra:1}])assert.equal(parseRegionalGuideReviewSelection(v),null);
});

test('real canonical packet API persists distinct guide-only decisions and rejects stale public selection',async()=>{
 const f=database();try{for(const p of packets){const context=regionalGuideReviewContext(p);const before=await getRegionalGuideReviews(request(p),f.db as never);assert.equal(before.status,200);assert.equal(parseRegionalGuideReviewHistory(await before.json(),context).latestVersion,0);
  const saved=await postRegionalGuideReview(request(p,'POST',{context,expectedVersion:0,decision:approval}),f.db as never);assert.equal(saved.status,201);const event=(await saved.json()).review;assert.equal(event.context.contentRevision,p.contentRevision);assert.equal(event.decision.status,'approved');
 }
 assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM atlas_personal_nested_review_events').get()!.n,5);
 const bad={...packets[4],contentRevision:'0'.repeat(64)};assert.equal((await getRegionalGuideReviews(request(bad),f.db as never)).status,409);
 }finally{f.close();}
});

test('real inbox reads only statuses, marks stale approval re-review and never returns notes',async()=>{
 const f=database();try{const catalog=await nativeGuideInboxCatalog();assert.equal(catalog.length,5);
  for(const d of catalog){assert.equal(d.area,'regional-learning');assert.equal(d.capability,'decision');assert.equal(d.revision,packets.find(p=>d.key.endsWith(':'+p.guideId))!.contentRevision);}
  const context=regionalGuideReviewContext(packets[4]);assert.equal((await postRegionalGuideReview(request(packets[4],'POST',{context,expectedVersion:0,decision:approval}),f.db as never)).status,201);
  const before=f.queries.length;let status=await nativeGuideInboxStatuses(request(packets[4],'GET',undefined,{'X-Regional-Guide-Before':'1'}),f.db as never,catalog);
  assert.equal(status[4].status,'approval-recorded');assert(status.slice(0,4).every((s:any)=>s.status==='not-started'));
  assert(f.queries.slice(before).every(q=>/^\s*SELECT\b/i.test(q.sql)));assert(!JSON.stringify(status).includes('Synthetic review only.'));
  const row=f.sql.prepare('SELECT payload FROM atlas_personal_nested_review_events').get()!,old=JSON.parse(String(row.payload));
  f.sql.prepare('UPDATE atlas_personal_nested_review_events SET payload=?').run(JSON.stringify({...old,context:{...old.context,contentRevision:'f'.repeat(64)}}));
  status=await nativeGuideInboxStatuses(request(),f.db as never,catalog);assert.equal(status[4].status,'re-review');
  assert.equal((await nativeGuideInboxStatuses(request(),f.db as never,[{...catalog[4],revision:'0'.repeat(64)}]))[0].status,'unavailable');
  assert((await nativeGuideInboxStatuses(request(),{prepare(){throw Error('Storage unconfirmed');}},catalog)).every((s:any)=>s.status==='unavailable'));
 }finally{f.close();}
});

function compile(file:string,imports:Record<string,unknown>){const output=ts.transpileModule(readFileSync(file,'utf8').replaceAll('import.meta.env.DEV','false'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;const module={exports:{} as Record<string,any>};new Function('require','module','exports',output)((name:string)=>imports[name]??require(name),module,module.exports);return module.exports;}
test('actual route and server access wrapper reject forged identities, missing context and changed institutions',async()=>{
 const f=database();let subject:string|null=null,membership={roles:'learner',organization_id:'org-a',role:'member'};try{
  const binding={withSession(constraint:string){assert.equal(constraint,'first-primary');return{prepare(sql:string){if(sql.includes('FROM users u'))return{bind(){return{async first(){return membership;}};}};return f.db.prepare(sql);}};}};
  const guard=compile('lib/clinical-review-server.ts',{'cloudflare:workers':{env:{DB:binding}},'@/app/chatgpt-auth':{getChatGPTUser:async()=>subject?{userId:subject}:null},'./clinical-review-access':access});
  const route=compile('app/api/atlas-review/regional-guides/route.ts',{'cloudflare:workers':{env:{DB:binding}},'@/lib/clinical-review-server':guard,'@/lib/regional-guide-review-api':{getRegionalGuideReviews,postRegionalGuideReview}});
  assert.equal((await route.GET(request())).status,401);subject='owner';assert.equal((await route.GET(request())).status,403);assert.equal(f.queries.length,0);
  membership={...membership,roles:'administrator',role:'owner'};const get=await route.GET(request());assert.equal(get.status,200);const token=get.headers.get('X-Clinical-Review-Context')!;assert.match(token,/^[a-f0-9]{64}$/);assert.equal(get.headers.get('Cache-Control'),'private, no-store');
  const context=regionalGuideReviewContext(packets[4]),body={context,expectedVersion:0,decision:approval};
  assert.equal((await route.POST(request(packets[4],'POST',body))).status,409);
  assert.equal((await route.POST(request(packets[4],'POST',body,{'X-Clinical-Review-Context':token}))).status,201);
  const rows=f.sql.prepare('SELECT user_id FROM atlas_personal_nested_review_events').all();assert(!JSON.stringify(rows).includes('server-opaque-principal'));assert(JSON.stringify(rows).includes('edu:owner'));assert(JSON.stringify(rows).includes('org-a'));
  membership.organization_id='org-b';assert.equal((await route.POST(request(packets[4],'POST',{...body,expectedVersion:1},{'X-Clinical-Review-Context':token}))).status,409);
  const other=await route.GET(request());assert.notEqual(other.headers.get('X-Clinical-Review-Context'),token);assert.deepEqual((await other.json()).history,[]);
 }finally{f.close();}
});

test('protected teaching page authenticates before material resolution and fails closed on stale selection',async()=>{
 let permitted=false,resolved=0;const React=require('react'),nav={notFound(){throw Error('NOT_FOUND');}};
 const page=compile('app/workspace/atlas-review/regional-guides/page.tsx',{'react/jsx-runtime':require('react/jsx-runtime'),'next/navigation':nav,'@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{if(!permitted)throw Error('No review access');}},'@/lib/regional-guide-review':{regionalGuideReviewPackets:async()=>{resolved++;return packets;},parseRegionalGuideReviewSelection,resolveRegionalGuideReview,regionalGuideReviewHref},'@/lib/regional-guide-review-contract':{regionalGuideReviewContext},'@/components/RegionalGuideReviewNotes':{RegionalGuideReviewNotes:'review-notes'}});
 const text=(v:any):string=>Array.isArray(v)?v.map(text).join(''):React.isValidElement(v)?text(v.props.children):v==null?'':String(v);
 let tree=await page.default({searchParams:Promise.resolve({})});assert.match(text(tree),/authorized administrator/);assert.equal(resolved,0);assert.doesNotMatch(text(tree),/Posterior knee/);
 permitted=true;tree=await page.default({searchParams:Promise.resolve({})});assert.match(text(tree),/Posterior knee: popliteus and vessels/);assert.equal(resolved,1);
 const params=Object.fromEntries(new URL(regionalGuideReviewHref(packets[4]),'https://review.test').searchParams);tree=await page.default({searchParams:Promise.resolve(params)});assert.match(text(tree),/not approve any MRI annotation/);
 const walk=(v:any):any[]=>Array.isArray(v)?v.flatMap(walk):React.isValidElement(v)?[v,...walk(v.props.children)]:[];
 assert.equal(walk(tree).find(n=>n.type==='review-notes')!.key,null,'A source refresh must not force-remount and destroy the retained dirty review owner');
 const held=await page.default({searchParams:Promise.resolve({...params,revision:'0'.repeat(64)})});assert.match(text(held),/Current teaching withheld/);
 assert.equal(walk(held).find(n=>n.type==='review-notes')!.key,null);assert.equal(walk(held).find(n=>n.type==='review-notes')!.props.externallyRetired,true);
 assert.doesNotMatch(text(held),/Inspect the saved popliteus extent|Cadaveric artery–vein/,'Stale URL cannot substitute current teaching');
 await assert.rejects(page.default({searchParams:Promise.resolve({...params,guide:[params.guide,params.guide]})}),/NOT_FOUND/);
});
