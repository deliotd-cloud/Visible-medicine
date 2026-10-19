import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const site=resolve(import.meta.dirname,'..'),require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const routePath='app/api/studio/workbooks/[workbook_id]/corrections/lookup/route.ts';
const actualPaths=[routePath,'lib/mutation-json.ts','lib/request-security.ts','lib/workbook-correction-contract.ts'];
const sources=Object.fromEntries(actualPaths.map(path=>[path,readFileSync(resolve(site,path),'utf8')]));
const hash=source=>createHash('sha256').update(source).digest('hex');
console.log(JSON.stringify({sourcePins:Object.fromEntries(actualPaths.map(path=>[path,hash(sources[path])])),mode:'actual lookup route/contract/bounded JSON/origin; synthetic auth/rate/repository'}));

class EducationApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'synthetic-educator'},id='workbook:one',requestId='12345678-1234-4123-8123-123456789abc';
const input={action:'lookup-workbook-correction',id,expectedVersion:4,expectedMode:'teaching',expectedSourceHash:'a'.repeat(64),requestId};
const receipt={ok:true,action:'create-workbook-correction',requestId,sourceWorkbookId:id,sourceVersion:4,sourceHash:input.expectedSourceHash,mode:'teaching',draftWorkbookId:'87654321-4321-4321-8321-abcdefabcdef',draftVersion:1,draftStatus:'draft',auditId:requestId,auditHash:'b'.repeat(64),createdAt:'2026-10-16T10:00:00.000Z'};
const unconfirmed={ok:true,action:input.action,requestId,sourceWorkbookId:id,sourceVersion:4,sourceHash:input.expectedSourceHash,mode:'teaching',outcome:'unconfirmed',receipt:null};
let state;
const seams={EducationApiError,InstitutionOperationsError,
  async authenticateEducationApi(){state.events.push('auth');if(!state.auth)throw new EducationApiError('Sign in required.',401);return state.auth;},
  async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
  async lookupStudioWorkbookCorrection(auth,receivedId,parsed){state.events.push('lookup');assert.equal(auth,actor);state.id=receivedId;state.input=parsed;if(state.lookupError)throw state.lookupError;return state.lookup??unconfirmed;},
};
const imports={
  'lib/education-api':['EducationApiError','authenticateEducationApi'],
  'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
  'lib/workbook-correction-repository':['lookupStudioWorkbookCorrection'],
};
const built=await build({stdin:{contents:`export { POST } from './${routePath}';\nexport { WorkbookCorrectionError } from './lib/workbook-correction-contract.ts';`,resolveDir:site,sourcefile:'correction-lookup-route-test-entry.ts',loader:'ts'},absWorkingDir:site,bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'correction-lookup-route-boundary',setup(builder){
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
const request=(body=input,headers={},url='https://synthetic.invalid/api/studio/workbooks/workbook%3Aone/corrections/lookup')=>new Request(url,{method:'POST',headers:{origin:'https://synthetic.invalid','content-type':'application/json',...headers},body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)});
function reset(){state={auth:actor,events:[]};}
async function call(req,ctx=context){const previous=console.error,logs=[];console.error=(...args)=>logs.push(args);try{return{response:await route.POST(req,ctx),logs};}finally{console.error=previous;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
async function refused(body,status,headers={},ctx=context,url){reset();const {response}=await call(request(body,headers,url),ctx);assert.equal(response.status,status);privateHeaders(response);assert.ok(!state.events.includes('lookup'));return response;}

test('POST resolves only a source-bound confirmed or unconfirmed lookup',async()=>{
  assert.equal(route.GET,undefined);
  for(const mode of ['teaching','assessment','lecture']){
    const identity={...input,expectedMode:mode};
    for(const outcome of ['unconfirmed','confirmed']){
      reset();state.lookup={...unconfirmed,mode,outcome,receipt:outcome==='confirmed'?{...receipt,mode}:null};
      const {response}=await call(request(identity));assert.equal(response.status,200);privateHeaders(response);
      assert.deepEqual(await response.json(),state.lookup);assert.deepEqual(state.events,['auth','rate','lookup']);
      assert.deepEqual(state.rateArgs,[actor.userId,'studio-write',45,60]);assert.equal(state.id,id);assert.deepEqual(state.input,identity);
    }
  }
});

test('authentication and limiter precede request inspection',async()=>{
  reset();state.auth=null;let {response}=await call(request(input));assert.equal(response.status,401);assert.deepEqual(state.events,['auth']);privateHeaders(response);
  reset();state.rateError=new InstitutionOperationsError('Please wait.',429);({response}=await call(request(input)));assert.equal(response.status,429);assert.deepEqual(state.events,['auth','rate']);privateHeaders(response);
});

test('query, origin, media type, malformed JSON, invalid UTF-8 and streamed byte limit refuse',async()=>{
  await refused(input,422,{},context,'https://synthetic.invalid/api/studio/workbooks/workbook%3Aone/corrections/lookup?requestId='+requestId);
  await refused(input,422,{},context,'https://synthetic.invalid/api/studio/workbooks/workbook%3Aone/corrections/lookup?');
  await refused('{}',403,{origin:'https://foreign.invalid'});
  await refused('{}',415,{'content-type':'text/plain'});
  await refused('{',422);
  await refused(new Uint8Array([0xff,0xfe]),422);
  await refused(' '.repeat(8001),413);
  await refused('{}',413,{'content-length':'8001'});
});

test('body and route require exact identity, no extra fields or mutation intent',async()=>{
  await refused(input,422,{}, {params:Promise.resolve({workbook_id:'../other'})});
  for(const change of [{other:'PRIVATE_BODY'},{id:'other'},{expectedVersion:0},{expectedVersion:'4'},{expectedMode:'case'},{expectedSourceHash:'A'.repeat(64)},{requestId:'bad'},{reason:'create'},{confirmed:true}]){
    const response=await refused({...input,...change},422);assert.doesNotMatch(await response.text(),/PRIVATE_BODY/);
  }
});

test('known domain failure retains status while unexpected or forged responses stay opaque',async()=>{
  reset();state.lookupError=new route.WorkbookCorrectionError('Workbook changed.',409);let {response}=await call(request());assert.equal(response.status,409);assert.deepEqual(await response.json(),{error:'Workbook changed.'});privateHeaders(response);
  reset();state.lookupError=new Error('PRIVATE_SQL_TOKEN');({response}=await call(request()));assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_SQL_TOKEN/);privateHeaders(response);
  for(const forged of [{...unconfirmed,sourceWorkbookId:'other'},{...unconfirmed,privateData:'PRIVATE_REASON'},{...unconfirmed,outcome:'confirmed',receipt:{...receipt,requestId:'87654321-4321-4321-8321-abcdefabcdef'}},{...unconfirmed,outcome:'confirmed',receipt:{...receipt,privateData:'PRIVATE_REASON'}}]){
    reset();state.lookup=forged;({response}=await call(request()));assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_REASON|privateData/i);privateHeaders(response);
  }
});
