import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const require=createRequire(new URL('../package.json',import.meta.url));
const ts=require('typescript');
const compileSource=(source,path,mocks)=>{
 const code=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)((name)=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];},module,module.exports);
 return module.exports;
};
const compile=(path,mocks)=>compileSource(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path,mocks);
const canonical=(path,mocks)=>compileSource(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path,mocks);
class DomainError extends Error{constructor(message,status=409){super(message);this.status=status;}}
const auth={userId:'edu:author'};
let organization='org:one',available=true,rate=0,mutations=[],domainRefusal=null;
const actualContext=canonical('lib/studio-mutation-context.ts',{});
const actualServerContext=canonical('lib/studio-mutation-context-server.ts',{
 'cloudflare:workers':{env:{DB:{withSession:(mode)=>{
  assert.equal(mode,'first-primary');return{prepare:(sql)=>{
   assert.match(sql,/organization_memberships/);return{bind:(user)=>{
    assert.equal(user,auth.userId);return{first:async()=>{if(!available)throw Error('Synthetic database unavailable');return{id:organization};}};
   }};
  }};
 }}}},
 './studio-mutation-context':actualContext,
});
const ContextError=actualContext.StudioMutationContextError;
const failure=compile('lib/lecture-api.ts',{
 '@/lib/education-api':{EducationApiError:DomainError},
 '@/lib/lecture-repository':{LectureError:DomainError},
 '@/lib/request-security':{isSameOriginMutation:request=>request.headers.get('origin')==='https://studio.test'},
 '@/lib/institution-operations':{InstitutionOperationsError:DomainError},
 '@/lib/studio-mutation-context':{StudioMutationContextError:ContextError},
});
const route=compile('app/api/studio/workbooks/[workbook_id]/lecture/route.ts',{
 '@/lib/education-api':{authenticateEducationApi:async()=>auth},
 '@/lib/lecture-repository':{getLectureStudio:async()=>({}),mutateLecture:async(_auth,id,input)=>{mutations.push({id,input});if(domainRefusal)throw domainRefusal;return {id,version:2};}},
 '@/lib/lecture-api':failure,
 '@/lib/institution-operations':{enforceRateLimit:async()=>{rate++;}},
 '@/lib/studio-mutation-context-server':actualServerContext,
});
const context={actorId:'edu:author',organizationId:'org:one'};
const request=(payload,origin='https://studio.test')=>new Request('https://studio.test/api/studio/workbooks/lecture:one/lecture',{
 method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(payload),
});
const post=(payload,origin)=>route.POST(request(payload,origin),{params:Promise.resolve({workbook_id:'lecture:one'})});

test('only exact page-opening actor and organization reach rate and domain mutation',async()=>{
 rate=0;mutations=[];available=true;organization='org:one';
 const base={action:'save',id:'lecture:one',expectedVersion:1,title:'Lecture',slides:[]};
 for(const value of [undefined,{...context,actorId:'edu:forged'},{...context,organizationId:'org:other'},
  {...context,actorId:'author'},{...context,organizationId:' org:one'},{...context,extra:'forged'}]){
  const response=await post({...base,...(value?{expectedStudioContext:value}:{})});
  assert.equal(response.status,409);assert.equal((await response.json()).code,'STUDIO_CONTEXT_CHANGED');
  assert.equal(rate,0);assert.equal(mutations.length,0);
 }
 organization='org:later';
 const stale=await post({...base,expectedStudioContext:context});assert.equal(stale.status,409);assert.equal(rate,0);
 available=false;
 const unavailable=await post({...base,expectedStudioContext:context});
 assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).code,'STUDIO_CONTEXT_UNAVAILABLE');assert.equal(rate,0);
 available=true;organization='org:one';
 const exact=await post({...base,expectedStudioContext:context});assert.equal(exact.status,200);
 assert.equal(rate,1);assert.deepEqual(mutations,[{id:'lecture:one',input:base}]);
});

test('bounded same-origin parse and domain refusals remain independent',async()=>{
 rate=0;mutations=[];available=true;organization='org:one';domainRefusal=null;
 const body={action:'save',id:'lecture:one',expectedVersion:1,expectedStudioContext:context};
 const foreign=await post(body,'https://foreign.test');assert.equal(foreign.status,403);assert.equal(rate,0);
 const malformed=new Request('https://studio.test/api/studio/workbooks/lecture:one/lecture',{method:'POST',headers:{origin:'https://studio.test','content-type':'text/plain'},body:'x'});
 const bad=await route.POST(malformed,{params:Promise.resolve({workbook_id:'lecture:one'})});assert.equal(bad.status,415);assert.equal(rate,0);
 domainRefusal=new DomainError('Independent review is required before publication.',409);
 const refused=await post({...body,action:'publish'});assert.equal(refused.status,409);
 assert.match((await refused.json()).error,/Independent review/);assert.equal(rate,1);
 assert.deepEqual(mutations,[{id:'lecture:one',input:{action:'publish',id:'lecture:one',expectedVersion:1}}]);
 domainRefusal=null;
});

test('actual canonical context helpers and unchanged domain repository stay byte-bound',()=>{
 const sha=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');
 assert.equal(sha('lib/studio-mutation-context.ts'),'50aec554c758d2239283cc9f7c42e5468e08a2baac365f16c5112ababaa4f048');
 assert.equal(sha('lib/studio-mutation-context-server.ts'),'5e05879d9068226db57d2ddcb9a853f417a257c7a65b7b3ef8e17e69c1ed6985');
 assert.equal(sha('lib/lecture-repository.ts'),'21b4b3ae6dffffc367205a973e6cbc8a27222e30a9c2311f5a874e7fec2e27b8');
 assert.equal(actualContext.parseStudioMutationContext(context).actorId,'edu:author');
});
