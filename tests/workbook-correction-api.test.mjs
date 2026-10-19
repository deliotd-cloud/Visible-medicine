import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const site=resolve(import.meta.dirname,'..'),require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const routePath='app/api/studio/workbooks/[workbook_id]/corrections/route.ts';
const actualPaths=[routePath,'lib/mutation-json.ts','lib/request-security.ts','lib/workbook-correction-contract.ts'];
const sources=Object.fromEntries(actualPaths.map(path=>[path,readFileSync(resolve(site,path),'utf8')]));
const hash=source=>createHash('sha256').update(source).digest('hex');
console.log(JSON.stringify({sourcePins:Object.fromEntries(actualPaths.map(path=>[path,hash(sources[path])])),mode:'actual route/contract/bounded JSON/origin; synthetic auth/rate/repository'}));

class EducationApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'synthetic-educator'},id='workbook:one',requestId='12345678-1234-4123-8123-123456789abc';
const source={ok:true,action:'workbook-correction-source',workbookId:id,workbookVersion:4,mode:'teaching',sourceHash:'a'.repeat(64)};
const ack={ok:true,action:'create-workbook-correction',requestId,sourceWorkbookId:id,sourceVersion:4,sourceHash:source.sourceHash,mode:'teaching',draftWorkbookId:'87654321-4321-4321-8321-abcdefabcdef',draftVersion:1,draftStatus:'draft',auditId:requestId,auditHash:'b'.repeat(64),createdAt:'2026-10-16T10:00:00.000Z'};
let state;
const seams={EducationApiError,InstitutionOperationsError,
  async authenticateEducationApi(){state.events.push('auth');if(!state.auth)throw new EducationApiError('Sign in required.',401);return state.auth;},
  async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
  async getWorkbookCorrectionSource(auth,receivedId){state.events.push('source');assert.equal(auth,actor);state.id=receivedId;if(state.sourceError)throw state.sourceError;return state.source??source;},
  async createStudioWorkbookCorrection(auth,receivedId,parsed){state.events.push('create');assert.equal(auth,actor);state.id=receivedId;state.input=parsed;if(state.createError)throw state.createError;return state.receipt??ack;},
};
const imports={
  'lib/education-api':['EducationApiError','authenticateEducationApi'],
  'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
  'lib/workbook-correction-repository':['getWorkbookCorrectionSource','createStudioWorkbookCorrection'],
};
const built=await build({stdin:{contents:`export { GET, POST } from './${routePath}';\nexport { WorkbookCorrectionError } from './lib/workbook-correction-contract.ts';`,resolveDir:site,sourcefile:'correction-route-test-entry.ts',loader:'ts'},absWorkingDir:site,bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'correction-route-boundary',setup(builder){
  builder.onResolve({filter:/.*/},args=>{
    if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
    const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
    if(imports[key])return{path:key,namespace:'seam'};
    const actual=sources[key]?key:`${key}.ts`;
    if(sources[actual])return{path:actual,namespace:'actual'};
    throw Error(`Unexpected route dependency: ${args.path}`);
  });
  builder.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  builder.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${imports[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const module={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,dep=>{assert.equal(dep,'test-seams');return seams;});
const route=module.exports;
console.log(JSON.stringify({bundleSha256:hash(built.outputFiles[0].contents)}));
const context={params:Promise.resolve({workbook_id:id})};
const input=(extra={})=>({action:ack.action,id,expectedVersion:4,expectedStatus:'published',expectedMode:'teaching',expectedSourceHash:source.sourceHash,reason:' Synthetic correction reason ',confirmed:true,requestId,...extra});
const request=(body=input(),headers={})=>new Request('https://synthetic.invalid/api/studio/workbooks/workbook%3Aone/corrections',{method:'POST',headers:{origin:'https://synthetic.invalid','content-type':'application/json',...headers},body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)});
function reset(){state={auth:actor,events:[]};}
async function call(method,req,ctx=context){const previous=console.error,logs=[];console.error=(...args)=>logs.push(args);try{return{response:await route[method](req,ctx),logs};}finally{console.error=previous;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
async function refused(body,status,headers={},ctx=context){reset();const {response}=await call('POST',request(body,headers),ctx);assert.equal(response.status,status);privateHeaders(response);assert.ok(!state.events.includes('create'));return response;}

test('GET returns only verified source metadata for the route identity',async()=>{
  reset();const {response}=await call('GET',new Request('https://synthetic.invalid'),context);
  assert.equal(response.status,200);privateHeaders(response);assert.deepEqual(await response.json(),source);
  assert.deepEqual(state.events,['auth','rate','source']);assert.deepEqual(state.rateArgs,[actor.userId,'studio-write',45,60]);assert.equal(state.id,id);
  for(const mode of ['teaching','assessment','lecture']){reset();state.source={...source,mode};const result=await call('GET',new Request('https://synthetic.invalid'));assert.equal(result.response.status,200);assert.equal((await result.response.json()).mode,mode);}
});
test('GET enforces auth, rate and valid ID before repository; stale or forged source is refused',async()=>{
  reset();state.auth=null;let result=await call('GET',new Request('https://synthetic.invalid'));assert.equal(result.response.status,401);assert.deepEqual(state.events,['auth']);privateHeaders(result.response);
  reset();state.rateError=new InstitutionOperationsError('Please wait.',429);result=await call('GET',new Request('https://synthetic.invalid'));assert.equal(result.response.status,429);assert.deepEqual(state.events,['auth','rate']);
  reset();result=await call('GET',new Request('https://synthetic.invalid'),{params:Promise.resolve({workbook_id:'../other'})});assert.equal(result.response.status,422);assert.deepEqual(state.events,['auth','rate']);
  reset();state.sourceError=new route.WorkbookCorrectionError('Published source changed.',409);result=await call('GET',new Request('https://synthetic.invalid'));assert.equal(result.response.status,409);assert.deepEqual(await result.response.json(),{error:'Published source changed.'});
  reset();state.sourceError=new route.WorkbookCorrectionError('Studio authority is required.',403);result=await call('GET',new Request('https://synthetic.invalid'));assert.equal(result.response.status,403);
  for(const forged of [{...source,workbookId:'other'},{...source,workbookVersion:0},{...source,sourceHash:'A'.repeat(64)},{...source,privateInfo:'private'}]){
    reset();state.source=forged;result=await call('GET',new Request('https://synthetic.invalid'));assert.equal(result.response.status,500);privateHeaders(result.response);assert.doesNotMatch(await result.response.text(),/privateInfo|private|SQL|reason/i);
  }
});
test('POST returns exact bound receipt without a postcommit source read',async()=>{
  for(const mode of ['teaching','assessment','lecture']){
    reset();state.receipt={...ack,mode};const {response}=await call('POST',request(input({expectedMode:mode})));
    assert.equal(response.status,200);privateHeaders(response);assert.deepEqual(await response.json(),state.receipt);
    assert.deepEqual(state.events,['auth','rate','create']);assert.deepEqual(state.rateArgs,[actor.userId,'studio-write',45,60]);assert.equal(state.id,id);
    assert.deepEqual(state.input,input({expectedMode:mode,reason:'Synthetic correction reason'}));
  }
});
test('POST authenticates and rate limits before reading or creating',async()=>{
  reset();state.auth=null;let {response}=await call('POST',request());assert.equal(response.status,401);assert.deepEqual(state.events,['auth']);privateHeaders(response);
  reset();state.rateError=new InstitutionOperationsError('Please wait.',429);({response}=await call('POST',request()));assert.equal(response.status,429);assert.deepEqual(state.events,['auth','rate']);
});
test('origin, media type, malformed JSON, invalid UTF-8 and streamed limit refuse',async()=>{
  await refused('{}',403,{origin:'https://foreign.invalid'});
  await refused('{}',415,{'content-type':'text/plain'});
  await refused('{',422);
  await refused(new Uint8Array([0xff,0xfe]),422);
  await refused(' '.repeat(8001),413);
  await refused('{}',413,{'content-length':'8001'});
});
test('POST requires exact request and route ID, version, state, mode, hash, reason, UUID and confirmation',async()=>{
  const wrongContext={params:Promise.resolve({workbook_id:'../other'})};await refused(input(),422,{},wrongContext);
  for(const candidate of [input({other:'PRIVATE_BODY'}),input({id:'other'}),input({expectedVersion:0}),input({expectedVersion:'4'}),input({expectedStatus:'draft'}),input({expectedMode:'other'}),input({expectedSourceHash:'A'.repeat(64)}),input({reason:' '}),input({confirmed:false}),input({requestId:'bad'})]){
    const response=await refused(candidate,422);assert.doesNotMatch(await response.text(),/PRIVATE_BODY/);
  }
});
test('domain failures retain safe status; unknown failures and bad repository receipts remain private',async()=>{
  reset();state.createError=new route.WorkbookCorrectionError('Workbook changed.',409);let {response}=await call('POST',request());assert.equal(response.status,409);assert.deepEqual(await response.json(),{error:'Workbook changed.'});privateHeaders(response);
  reset();state.createError=new Error('PRIVATE_SQL_TOKEN');({response}=await call('POST',request()));assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_SQL_TOKEN/);privateHeaders(response);
  reset();state.receipt={...ack,draftStatus:'published',privateData:'PRIVATE_REASON'};({response}=await call('POST',request()));assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_REASON/);privateHeaders(response);
  reset();state.sourceError=new Error('PRIVATE_SQL_TOKEN');({response}=await call('GET',new Request('https://synthetic.invalid')));assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_SQL_TOKEN/);privateHeaders(response);
});
test('request UUID replay cannot produce an unbound success response',async()=>{
  reset();state.receipt={...ack,requestId:'87654321-4321-4321-8321-abcdefabcdef'};
  const {response}=await call('POST',request());assert.equal(response.status,500);privateHeaders(response);assert.deepEqual(state.events,['auth','rate','create']);
  assert.match((await response.text()).toLowerCase(),/check the workbook/);
});
