import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const site=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const routePath='app/api/studio/workbooks/[workbook_id]/retirement/route.ts';
const actualPaths=[routePath,'lib/mutation-json.ts','lib/request-security.ts','lib/workbook-retirement-contract.ts'];
const sources=Object.fromEntries(actualPaths.map(path=>[path,readFileSync(resolve(site,path),'utf8')]));
const hash=source=>createHash('sha256').update(source).digest('hex');
console.log(JSON.stringify({sourcePins:Object.fromEntries(actualPaths.map(path=>[path,hash(sources[path])])),mode:'actual route, contract, bounded JSON and origin check; synthetic identity/rate/mutation only'}));

class EducationApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class WorkbookRetirementError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'synthetic-educator'};
const receipt={ok:true,action:'retire-published-workbook',workbookId:'workbook:one',workbookVersion:4,disposition:'archived',auditId:'12345678-1234-1234-1234-123456789abc',auditHash:'a'.repeat(64),retiredAt:'2026-10-16T10:00:00.000Z'};
let state;
const seams={EducationApiError,InstitutionOperationsError,WorkbookRetirementError,
  async authenticateEducationApi(){state.events.push('auth');if(!state.auth)throw new EducationApiError('Sign in required.',401);return state.auth;},
  async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
  async retireStudioWorkbook(received,id,input){state.events.push('retire');assert.equal(received,actor);state.id=id;state.input=input;if(state.mutationError)throw state.mutationError;return receipt;},
};
const imports={
  'lib/education-api':['EducationApiError','authenticateEducationApi'],
  'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
  'lib/workbook-retirement-repository':['WorkbookRetirementError','retireStudioWorkbook'],
};
const result=await build({entryPoints:[`./${routePath}`],absWorkingDir:site,bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'retirement-route-boundary',setup(builder){
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
new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const route=module.exports;
console.log(JSON.stringify({bundleSha256:hash(result.outputFiles[0].contents)}));

function reset(){state={auth:actor,events:[]};}
function input(extra={}){return{action:'retire-published-workbook',id:'workbook:one',expectedVersion:4,expectedStatus:'published',disposition:'archived',reason:'Synthetic retirement reason',confirmed:true,...extra};}
function request(body=input(),headers={}){
  return new Request('https://synthetic.invalid/api/studio/workbooks/workbook%3Aone/retirement',{method:'POST',headers:{origin:'https://synthetic.invalid','content-type':'application/json',...headers},body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)});
}
const context={params:Promise.resolve({workbook_id:'workbook:one'})};
async function post(req=request(),ctx=context){const previous=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await route.POST(req,ctx),logs};}finally{console.error=previous;}}
async function refusal(body,expectedStatus,headers={},ctx=context){reset();const {response}=await post(request(body,headers),ctx);assert.equal(response.status,expectedStatus);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.ok(!state.events.includes('retire'));return response;}

test('positive receipt is exact, private and has no postcommit snapshot',async()=>{
  reset();const {response}=await post();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.deepEqual(await response.json(),receipt);assert.deepEqual(state.events,['auth','rate','retire']);assert.deepEqual(state.rateArgs,[actor.userId,'studio-write',45,60]);assert.equal(state.id,'workbook:one');assert.deepEqual(state.input,input());
});
test('authentication and rate-limit refuse before mutation',async()=>{
  reset();state.auth=null;let {response}=await post();assert.equal(response.status,401);assert.deepEqual(state.events,['auth']);
  reset();state.rateError=new InstitutionOperationsError('Please wait.',429);({response}=await post());assert.equal(response.status,429);assert.deepEqual(state.events,['auth','rate']);
});
test('origin, media type, malformed JSON, invalid UTF-8 and streamed oversize refuse',async()=>{
  await refusal('{}',403,{origin:'https://foreign.invalid'});
  await refusal('{}',415,{'content-type':'text/plain'});
  await refusal('{',422);
  await refusal(new Uint8Array([0xff,0xfe]),422);
  await refusal(' '.repeat(8001),413);
});
test('strict contract rejects unknown fields, id mismatch, stale version and unconfirmed reason',async()=>{
  for(const candidate of [input({other:'body-forged'}),input({id:'workbook:other'}),input({expectedVersion:0}),input({expectedVersion:'4'}),input({expectedStatus:'draft'}),input({confirmed:false}),input({reason:'   '})]){
    const response=await refusal(candidate,422);assert.doesNotMatch(await response.text(),/body-forged/);
  }
});
test('domain errors preserve safe status; unknown errors hide private payload',async()=>{
  reset();state.mutationError=new WorkbookRetirementError('Workbook changed.',409);let {response}=await post();assert.equal(response.status,409);assert.deepEqual(await response.json(),{error:'Workbook changed.'});
  reset();state.mutationError=new Error('PRIVATE_SQL_TOKEN');({response}=await post());assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE_SQL_TOKEN/);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');
});
