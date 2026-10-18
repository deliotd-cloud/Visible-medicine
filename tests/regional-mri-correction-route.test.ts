import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const routeText=readFileSync(new URL('../app/api/atlas-review/regional-mri/route.ts',import.meta.url),'utf8');
const wrapperText=readFileSync(new URL('../lib/clinical-review-server.ts',import.meta.url),'utf8');
const accessText=readFileSync(new URL('../lib/clinical-review-access.ts',import.meta.url),'utf8');
function evaluate(source:string,mocks:Record<string,unknown>){
 const module={exports:{} as Record<string,any>};
 const code=ts.transpileModule(source.replaceAll('import.meta.env.DEV','false'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)((id:string)=>{assert.ok(Object.hasOwn(mocks,id),'unmocked '+id);return mocks[id];},module,module.exports);
 return module.exports;
}
function fixture(allowed:boolean,projection:unknown={projectionRevision:'server-projection'}){
 let authorizations=0,sources=0,projections=0,sessions=0,handlers=0;
 const principal={storageKey:JSON.stringify(['vm-website-personal-review-1','edu:synthetic','org-a'])};
 const access=evaluate(accessText,{});
 const wrapper=evaluate(wrapperText,{
  'cloudflare:workers':{env:{DB:{}}},'@/app/chatgpt-auth':{getChatGPTUser:async()=>{authorizations++;return allowed?{userId:'synthetic'}:null;}},'./clinical-review-access':{
   ClinicalReviewAccessError:access.ClinicalReviewAccessError,
   clinicalReviewPrincipal:async()=>principal,
  },
 });
 const source={revision:'server-source'};
 const binding={prepare(){throw Error('unexpected database prepare');}};
 const route=evaluate(routeText,{
  'cloudflare:workers':{env:{DB:{withSession(mode:string){assert.equal(mode,'first-primary');sessions++;return binding;}}}},
  '@/lib/clinical-review-server':{runClinicalReview:wrapper.runClinicalReview},
  '@/lib/regional-mri-review-source':{regionalMriReviewSource:()=>{sources++;return source;}},
  '@/lib/regional-mri-review-context':{regionalMriReviewContext:async(input:unknown)=>{projections++;assert.strictEqual(input,source);return projection;}},
  '@/lib/regional-mri-correction-api':{
   getRegionalMriCorrections:async(request:Request,db:unknown,selected:unknown)=>{handlers++;assert.strictEqual(db,binding);assert.strictEqual(selected,projection);return Response.json({user:request.headers.get('oai-authenticated-user-id')});},
   postRegionalMriCorrection:async(request:Request,db:unknown,selected:unknown)=>{handlers++;assert.strictEqual(db,binding);assert.strictEqual(selected,projection);return Response.json({user:request.headers.get('oai-authenticated-user-id')});},
  },
 });
 return {route,principal,get counts(){return {authorizations,sources,projections,sessions,handlers};}};
}
function request(method:'GET'|'POST',headers:Record<string,string>={}){
 return new Request('https://review.test/api/atlas-review/regional-mri',{method,headers:{'oai-authenticated-user-id':'spoofed-user',...headers},...(method==='POST'?{body:'{}'}:{})});
}
test('denial prevents route source, projection, session and handler use',async()=>{
 const f=fixture(false);
 for(const method of ['GET','POST'] as const){
  const response=await f.route[method](request(method));
  assert.equal(response.status,401);assert.match(response.headers.get('Cache-Control')??'',/private, no-store/);
 }
 assert.deepEqual(f.counts,{authorizations:2,sources:0,projections:0,sessions:0,handlers:0});
});
test('authorized route passes independent projection and server-derived identity',async()=>{
 const projection={projectionRevision:'bound-projection'};
 const f=fixture(true,projection);
 const get=await f.route.GET(request('GET',{'X-Regional-MRI-Projection':'client-projection'}));
 assert.equal(get.status,200);assert.equal((await get.json()).user,f.principal.storageKey);
 assert.match(get.headers.get('Cache-Control')??'',/private, no-store/);
 assert.ok(get.headers.get('X-Clinical-Review-Context'));
 const postMissing=await f.route.POST(request('POST'));
 assert.equal(postMissing.status,409,'existing account and institution continuity gate');
 assert.deepEqual(f.counts,{authorizations:2,sources:1,projections:1,sessions:1,handlers:1});
 const post=await f.route.POST(request('POST',{'X-Clinical-Review-Context':get.headers.get('X-Clinical-Review-Context')!}));
 assert.equal(post.status,200);assert.equal((await post.json()).user,f.principal.storageKey);
 assert.deepEqual(f.counts,{authorizations:3,sources:2,projections:2,sessions:2,handlers:2});
});
test('route has no client projection or identity source and retains production source gate',()=>{
 assert.doesNotMatch(routeText,/searchParams|request\.json\(|request\.headers\.get\(|node:fs/);
 assert.match(routeText,/runClinicalReview\(request,async guarded/);
 assert.match(routeText,/regionalMriReviewContext\(source\)/);
 assert.match(wrapperText,/request\.method === 'POST' && request\.headers\.get\('X-Clinical-Review-Context'\) !== context/);
 assert.match(wrapperText,/headers\.set\('oai-authenticated-user-id', principal\.storageKey\)/);
 assert.match(readFileSync(new URL('../lib/regional-mri-review-context.ts',import.meta.url),'utf8'),/import\.meta\.env\.DEV/);
});
