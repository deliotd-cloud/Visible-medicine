import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const site=resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),{build}=require('esbuild');
const routePath='app/api/studio/workbooks/[workbook_id]/correction-lineage/route.ts';
class EducationApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends EducationApiError{}
const id='draft:one',actor={userId:'educator'},input={action:'workbook-correction-lineage',id,expectedVersion:1,expectedMode:'teaching',expectedStatus:'draft'};
const answer={ok:true,action:input.action,workbookId:id,workbookVersion:1,mode:'teaching',status:'draft',outcome:'verified',source:{workbookId:'source:one',version:4,hash:'a'.repeat(64)}};
let state;
const seams={EducationApiError,InstitutionOperationsError,
 async authenticateEducationApi(){state.events.push('auth');if(state.authError)throw state.authError;return actor;},
 async enforceRateLimit(...args){state.events.push('rate');assert.deepEqual(args,[actor.userId,'studio-write',45,60]);if(state.rateError)throw state.rateError;},
 async getStudioWorkbookCorrectionLineage(auth,receivedId,parsed){state.events.push('lineage');assert.equal(auth,actor);assert.equal(receivedId,id);state.input=parsed;if(state.error)throw state.error;return state.answer;},
};
const imports={'@/lib/education-api':['EducationApiError','authenticateEducationApi'],
 '@/lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
 '@/lib/workbook-correction-lineage-repository':['getStudioWorkbookCorrectionLineage']};
const built=await build({stdin:{contents:`export {POST} from './${routePath}'; export * from './lib/workbook-correction-lineage-contract.ts'; export {WorkbookCorrectionError} from './lib/workbook-correction-contract.ts';`,resolveDir:site,sourcefile:'lineage-route-test-entry.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'route-seams',setup(builder){
 builder.onResolve({filter:/.*/},args=>{
  if(args.path==='test-seams')return{path:args.path,external:true};
  if(imports[args.path])return{path:args.path,namespace:'seam'};
  if(args.path.startsWith('@/'))return{path:resolve(site,args.path.slice(2))+'.ts'};
  return null;
 });
 builder.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams'; ${imports[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const module={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,dep=>{assert.equal(dep,'test-seams');return seams;});
const route=module.exports,context={params:Promise.resolve({workbook_id:id})};
function reset(){state={events:[],answer:structuredClone(answer)};}
const request=(body=input,headers={},suffix='')=>new Request('https://synthetic.invalid/api/studio/workbooks/draft%3Aone/correction-lineage'+suffix,{method:'POST',headers:{origin:'https://synthetic.invalid','content-type':'application/json',...headers},body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)});
async function call(req=request(),ctx=context){const old=console.error;console.error=()=>{};try{const response=await route.POST(req,ctx);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');return response;}finally{console.error=old;}}
async function refused(body,status,headers={},suffix='',ctx=context){reset();const response=await call(request(body,headers,suffix),ctx);assert.equal(response.status,status);assert.ok(!state.events.includes('lineage'));return response;}

test('production parsers accept only exact context and minimal source-bound receipts in all modes',()=>{
 for(const mode of ['teaching','assessment','lecture']){
  const expected={...input,expectedMode:mode};assert.deepEqual(route.parseWorkbookCorrectionLineageRequest(expected,id),expected);
  for(const outcome of ['verified','unavailable']){
   const value={...answer,mode,outcome,source:outcome==='verified'?answer.source:null};
   assert.deepEqual(route.parseWorkbookCorrectionLineage(value,expected),value);
  }
 }
 for(const patch of [{id:'other'},{expectedVersion:0},{expectedVersion:'1'},{expectedStatus:'published'},{expectedMode:{}},{reason:'private'},{confirmed:true}])assert.equal(route.parseWorkbookCorrectionLineageRequest({...input,...patch},id),null);
 for(const patch of [{workbookId:'other'},{workbookVersion:2},{status:'published'},{mode:'lecture'},{reason:'private'},{outcome:'unknown'},{source:{...answer.source,reason:'private'}},{source:{...answer.source,workbookId:id}},{source:{...answer.source,hash:'bad'}},{source:{...answer.source,version:0}},{source:{...answer.source,workbookId:'https://foreign.invalid'}}])assert.equal(route.parseWorkbookCorrectionLineage({...answer,...patch},input),null);
 const accessor={...answer};Object.defineProperty(accessor,'source',{get(){throw Error('getter must not run');},enumerable:true});
 assert.equal(route.parseWorkbookCorrectionLineage(accessor,input),null);
 assert.equal(route.parseWorkbookCorrectionLineage({...answer,[Symbol('extra')]:true},input),null);
 assert.equal(route.parseWorkbookCorrectionLineage(Object.assign(Object.create({}),answer),input),null);
});
test('route authenticates, rate-limits and returns minimal verified/unavailable lineage',async()=>{
 for(const outcome of ['verified','unavailable']){reset();state.answer={...answer,outcome,source:outcome==='verified'?answer.source:null};
  const response=await call();assert.equal(response.status,200);assert.deepEqual(await response.json(),state.answer);assert.deepEqual(state.events,['auth','rate','lineage']);assert.deepEqual(state.input,input);
 }
});
test('authentication and rate-limit refusals precede request inspection',async()=>{
 reset();state.authError=new EducationApiError('Sign in.',401);assert.equal((await call()).status,401);assert.deepEqual(state.events,['auth']);
 reset();state.rateError=new InstitutionOperationsError('Wait.',429);assert.equal((await call()).status,429);assert.deepEqual(state.events,['auth','rate']);
});
test('query, origin, UTF-8, JSON, size and exact request guards reject before repository',async()=>{
 await refused(input,422,{},'?');await refused(input,422,{},'?source=secret');
 await refused(input,403,{origin:'https://foreign.invalid'});await refused(input,415,{'content-type':'text/plain'});
 await refused('{',422);await refused(new Uint8Array([0xff,0xfe]),422);await refused(' '.repeat(8001),413);
 await refused('{}',413,{'content-length':'8001'});
 for(const patch of [{id:'other'},{expectedStatus:'published'},{expectedVersion:2.5},{expectedMode:'unknown'},{extra:'PRIVATE_REASON'}]){
  assert.doesNotMatch(await(await refused({...input,...patch},422)).text(),/PRIVATE_REASON/);
 }
 await refused(input,422,{},'',{params:Promise.resolve({workbook_id:'../other'})});
});
test('domain failures and malformed repository replies never expose private details',async()=>{
 reset();state.error=new route.WorkbookCorrectionError('Access changed.',409);assert.equal((await call()).status,409);
 reset();state.error=new Error('PRIVATE_SQL');let response=await call();assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_SQL/);
 for(const patch of [{workbookId:'other'},{reason:'PRIVATE_REASON'},{source:{...answer.source,reason:'PRIVATE_REASON'}},{source:{...answer.source,hash:'bad'}}]){
  reset();state.answer={...answer,...patch};response=await call();assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_REASON/);
 }
});
