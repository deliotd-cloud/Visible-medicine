import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const routeText=readFileSync(new URL('../app/api/atlas-review/reference-learning/route.ts',import.meta.url),'utf8');
const wrapperText=readFileSync(new URL('../lib/clinical-review-server.ts',import.meta.url),'utf8');
const accessText=readFileSync(new URL('../lib/clinical-review-access.ts',import.meta.url),'utf8');
function evaluate(source:string,mocks:Record<string,unknown>){
 const module={exports:{} as Record<string,any>};
 const code=ts.transpileModule(source.replaceAll('import.meta.env.DEV','false'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)((id:string)=>{assert.ok(Object.hasOwn(mocks,id),'unmocked '+id);return mocks[id];},module,module.exports);
 return module.exports;
}
function fixture(allowed:boolean){
 let authorizations=0,sources=0,catalogues=0,sessions=0,handlers=0;
 const principal={storageKey:JSON.stringify(['vm-website-personal-review-1','edu:synthetic','org-a'])};
 const access=evaluate(accessText,{});
 const wrapper=evaluate(wrapperText,{
  'cloudflare:workers':{env:{DB:{}}},'@/app/chatgpt-auth':{getChatGPTUser:async()=>{authorizations++;return allowed?{userId:'synthetic'}:null;}},
  './clinical-review-access':{ClinicalReviewAccessError:access.ClinicalReviewAccessError,clinicalReviewPrincipal:async()=>principal},
 });
 const source={revision:'server-source'},catalogue={schema:'server-catalogue'};
 const binding={prepare(){throw Error('unexpected database prepare');}};
 const route=evaluate(routeText,{
  'cloudflare:workers':{env:{DB:{withSession(mode:string){assert.equal(mode,'first-primary');sessions++;return binding;}}}},
  '@/lib/clinical-review-server':{runClinicalReview:wrapper.runClinicalReview},
  '@/lib/regional-mri-review-source':{regionalMriReviewSource:()=>{sources++;return source;}},
  '@/lib/regional-mri-3d-catalogue':{buildRegionalMri3dCatalogue:async(value:unknown)=>{assert.strictEqual(value,source);catalogues++;return catalogue;}},
  '@/lib/regional-reference-draft-api':{
   getRegionalReferenceDrafts:async(request:Request,db:unknown,selected:unknown)=>{handlers++;assert.strictEqual(db,binding);assert.strictEqual(selected,catalogue);return Response.json({user:request.headers.get('oai-authenticated-user-id')});},
   postRegionalReferenceDraft:async(request:Request,db:unknown,selected:unknown)=>{handlers++;assert.strictEqual(db,binding);assert.strictEqual(selected,catalogue);return Response.json({user:request.headers.get('oai-authenticated-user-id')});},
  },
 });
 return {route,principal,get counts(){return {authorizations,sources,catalogues,sessions,handlers};}};
}
function request(method:'GET'|'POST',headers:Record<string,string>={}){
 return new Request('https://review.test/api/atlas-review/reference-learning',{method,headers:{'oai-authenticated-user-id':'spoofed-user',...headers},...(method==='POST'?{body:'{}'}:{})});
}
test('actual route denies before reading private source, catalogue, config or D1',async()=>{
 const f=fixture(false);
 for(const method of ['GET','POST'] as const){
  const response=await f.route[method](request(method));assert.equal(response.status,401);
  assert.match(response.headers.get('Cache-Control')??'',/private, no-store/);
 }
 assert.deepEqual(f.counts,{authorizations:2,sources:0,catalogues:0,sessions:0,handlers:0});
});
test('actual route overwrites spoofed identity and enforces account-context continuity before writes',async()=>{
 const f=fixture(true);
 const get=await f.route.GET(request('GET'));
 assert.equal(get.status,200);assert.equal((await get.json()).user,f.principal.storageKey);
 assert.match(get.headers.get('Cache-Control')??'',/private, no-store/);
 assert.ok(get.headers.get('X-Clinical-Review-Context'));
 const missing=await f.route.POST(request('POST'));
 assert.equal(missing.status,409,'account and institution continuity belongs to the existing wrapper');
 assert.deepEqual(f.counts,{authorizations:2,sources:1,catalogues:1,sessions:1,handlers:1});
 const post=await f.route.POST(request('POST',{'X-Clinical-Review-Context':get.headers.get('X-Clinical-Review-Context')!}));
 assert.equal(post.status,200);assert.equal((await post.json()).user,f.principal.storageKey);
 assert.deepEqual(f.counts,{authorizations:3,sources:2,catalogues:2,sessions:2,handlers:2});
});
test('route keeps canonical source construction behind shared authorization wrapper',()=>{
 assert.match(routeText,/runClinicalReview\(request,async guarded/);
 assert.match(routeText,/regionalMriReviewSource\(\)/);
 assert.match(routeText,/buildRegionalMri3dCatalogue\(source\)/);
 assert.doesNotMatch(routeText,/request\.json\(|request\.headers\.get\(|searchParams|node:fs/);
 assert.match(wrapperText,/request\.method === 'POST' && request\.headers\.get\('X-Clinical-Review-Context'\) !== context/);
 assert.match(wrapperText,/headers\.set\('oai-authenticated-user-id', principal\.storageKey\)/);
 assert.match(readFileSync(new URL('../lib/regional-mri-review-source.ts',import.meta.url),'utf8'),/import\.meta\.env\.DEV/);
});
