import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,posix,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const sha=value=>createHash('sha256').update(value).digest('hex');
const paths=['app/api/institutions/pilot/route.ts','lib/mutation-json.ts','lib/request-security.ts'];
const baselineAt=process.argv.indexOf('--baseline');
assert.ok(baselineAt<0||process.argv[baselineAt+1],'--baseline requires a snapshot path');
const snapshot=baselineAt<0?null:JSON.parse(readFileSync(resolve(process.argv[baselineAt+1]),'utf8'));
if(snapshot){
 assert.deepEqual(Object.keys(snapshot.sources).sort(),[...paths].sort(),'baseline source paths');
 assert.deepEqual(Object.keys(snapshot.pins).sort(),[...paths].sort(),'baseline pin paths');
 for(const path of paths)assert.equal(sha(snapshot.sources[path]),snapshot.pins[path],`baseline pin ${path}`);
}
const sources=Object.fromEntries(paths.map(path=>[path,snapshot?snapshot.sources[path]:readFileSync(resolve(site,path),'utf8')]));
console.log(JSON.stringify({mode:snapshot?'pinned-before':'actual',sources:Object.fromEntries(paths.map(path=>[path,sha(sources[path])])),seams:'synthetic auth/hash/rate/submit; no DB or HTTP'}));

class InstitutionOperationsError extends Error{constructor(message,status=422){super(message);this.status=status;}}
const actor={userId:'server-user',email:'server@example.invalid',role:'learner'};
const resultBody={id:'synthetic-pilot',status:'submitted'};
let state;
function reset(){state={auth:actor,events:[],reads:0,cancels:0,releases:0};}
const seams={
 InstitutionOperationsError,
 async getAuthContext(){state.events.push('auth');if(state.authError)throw state.authError;return state.auth;},
 async sha256(value){state.events.push('hash');state.hashInput=value;if(state.hashError)throw state.hashError;return 'a'.repeat(24)+'b'.repeat(40);},
 async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
 async submitPilotApplication(...args){state.events.push('submit');state.submitArgs=args;if(state.submitError)throw state.submitError;return resultBody;},
};
const seamModules={
 'lib/auth':['getAuthContext'],
 'lib/domain':['sha256'],
 'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit','submitPilotApplication'],
};
const bundle=await build({entryPoints:[`./${paths[0]}`],bundle:true,metafile:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'pilot-envelope-seams',setup(b){
 b.onResolve({filter:/.*/},args=>{
  if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
  const key=args.path.startsWith('@/')?args.path.slice(2):args.path.startsWith('.')?posix.normalize(posix.join(posix.dirname(args.importer),args.path)):args.path;
  if(seamModules[key])return{path:key,namespace:'seam'};
  const actual=sources[key]?key:`${key}.ts`;
  if(sources[actual])return{path:actual,namespace:'actual'};
  throw Error(`Unexpected dependency ${args.path} from ${args.importer}`);
 });
 b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
 b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamModules[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const included=Object.keys(bundle.metafile.inputs);
for(const path of snapshot?paths.slice(0,1):paths)assert.ok(included.some(input=>input.endsWith(path)),`actual bundle missing ${path}`);
const module={exports:{}};
new Function('module','exports','require',bundle.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const route=module.exports;
console.log(JSON.stringify({bundleSha256:sha(bundle.outputFiles[0].contents),included}));

const encoder=new TextEncoder();
const maxBytes=24_000;
const payload=(overrides={})=>JSON.stringify({organizationName:'Synthetic school',contactName:'Example Person',contactEmail:'person@example.invalid',jurisdiction:'Exampleland',learnerBand:'1-100',educatorBand:'1-10',contentScope:'A synthetic anatomy education pilot',goals:'Evaluate learning outcomes safely',supportNeeds:'None',userId:'forged-body-user',role:'administrator',...overrides});
function request({text=payload(),chunks,headers={},noBody=false,cancelThrows=false,readThrows=false}={}){
 let index=0;const pieces=chunks??[encoder.encode(text)];
 const body=noBody?undefined:new ReadableStream({pull(controller){if(readThrows){controller.error(Error('PRIVATE_STREAM_DETAIL'));return;}if(index===pieces.length)controller.close();else controller.enqueue(pieces[index++]);},cancel(){if(cancelThrows)throw Error('PRIVATE_CANCEL_DETAIL');}},{highWaterMark:0});
 const req=new Request('https://synthetic.invalid/api/institutions/pilot',{method:'POST',body,duplex:'half',headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(req.body){const getReader=req.body.getReader.bind(req.body);req.body.getReader=()=>{const reader=getReader();return{async read(){state.reads++;state.events.push('read');return reader.read();},async cancel(){state.cancels++;return reader.cancel();},releaseLock(){state.releases++;state.events.push('release');return reader.releaseLock();}};};}
 return req;
}
async function post(options){const req=request(options);const previous=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await route.POST(req),req,logs};}finally{console.error=previous;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
function noServices(){assert.ok(!state.events.some(e=>['auth','hash','rate','submit'].includes(e)),`service called before envelope refusal: ${state.events}`);}
async function refused(options,status){reset();const out=await post(options);assert.equal(out.response.status,status);privateHeaders(out.response);noServices();assert.equal(out.req.body?.locked??false,false);if(out.req.body){assert.equal(state.cancels,1);assert.equal(state.releases,1);}return out;}
async function accepted(options,{anonymous=false}={}){reset();if(anonymous)state.auth=null;const out=await post(options);assert.equal(out.response.status,201);privateHeaders(out.response);assert.ok(state.events.indexOf('release')<state.events.indexOf('auth'),`parse before auth: ${state.events}`);assert.deepEqual(state.events.filter(e=>['auth','hash','rate','submit'].includes(e)),anonymous?['auth','hash','rate','submit']:['auth','rate','submit']);assert.deepEqual(state.rateArgs,[anonymous?'anonymous:'+ 'a'.repeat(24):actor.userId,'pilot-application',5,3600]);assert.deepEqual(state.submitArgs,[anonymous?null:actor,JSON.parse(options?.text??payload())]);assert.equal(out.req.body.locked,false);assert.equal(state.cancels,0);assert.equal(state.releases,1);assert.deepEqual(await out.response.json(),resultBody);return out;}

test('actual UTF8 bytes enforce cap with absent, small, invalid or negative length hints',async()=>{
 for(const length of [undefined,'1','bad','-1']){
  const headers=length===undefined?{}:{'content-length':length};
  const out=await refused({chunks:[encoder.encode(payload()),encoder.encode(' '.repeat(maxBytes)),encoder.encode('unread-tail')],headers},413);
  assert.deepEqual(await out.response.json(),{error:'The pilot brief is too large.'});assert.equal(state.reads,2);
 }
});
test('exact 24000 byte boundary accepts; the next byte refuses',async()=>{
 const first=encoder.encode(payload());const pad=new Uint8Array(maxBytes-first.byteLength).fill(32);
 reset();let out=await post({chunks:[first,pad],headers:{'content-length':'0'}});assert.equal(out.response.status,201);privateHeaders(out.response);assert.deepEqual(state.submitArgs,[actor,JSON.parse(payload())]);
 out=await refused({chunks:[first,pad,new Uint8Array([32])]},413);assert.deepEqual(await out.response.json(),{error:'The pilot brief is too large.'});
});
test('declared oversize refuses before stream reads or services',async()=>{
 const out=await refused({headers:{'content-length':String(maxBytes+1)}},413);assert.equal(state.reads,0);assert.deepEqual(await out.response.json(),{error:'The pilot brief is too large.'});
});
test('cross-site and foreign or malformed Origin refuse before parsing',async()=>{
 for(const headers of [{'sec-fetch-site':'cross-site'},{origin:'https://foreign.invalid'},{origin:'not-an-origin'}]){await refused({headers},403);assert.equal(state.reads,0);}
});
test('missing Origin retains existing allow policy',async()=>{await accepted({headers:{origin:''}});});
test('exact JSON media type accepts parameters and rejects prefixes',async()=>{
 for(const type of ['application/json-evil','application/jsonp','text/plain','']){await refused({headers:{'content-type':type}},415);assert.equal(state.reads,0);}
 await accepted({headers:{'content-type':'Application/JSON; charset=utf-8'}});
});
test('malformed JSON, non-objects and missing body refuse before services',async()=>{
 for(const text of ['{','null','[]','true','1','"string"',''])await refused({text},422);
 await refused({noBody:true},422);
});
test('invalid and truncated UTF8 refuse; split valid UTF8 parses',async()=>{
 await refused({chunks:[encoder.encode('{"x":"'),new Uint8Array([0xff]),encoder.encode('"}')]},422);
 await refused({chunks:[encoder.encode('{"x":"'),new Uint8Array([0xe2,0x82])]},422);
 const text=payload({goals:'Evaluate learning outcomes safely 😀'});await accepted({text,chunks:Array.from(encoder.encode(text),byte=>new Uint8Array([byte]))});
});
test('failed body read and failed cancellation release lock and redact details',async()=>{
 let out=await refused({readThrows:true},422);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
 out=await refused({chunks:[new Uint8Array(maxBytes+1)],cancelThrows:true},413);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
});
test('anonymous request hashes selected peer and keeps null auth',async()=>{
 for(const [headers,peer] of [[{'cf-connecting-ip':'198.51.100.1','x-forwarded-for':'203.0.113.7, 203.0.113.8'},'198.51.100.1'],[{'x-forwarded-for':' 203.0.113.7 , 203.0.113.8'},'203.0.113.7'],[{},'unavailable']]){
  await accepted({headers},{anonymous:true});assert.equal(state.hashInput,`pilot:${peer}`);
 }
});
test('signed-in request uses server actor and never hashes peer',async()=>{
 await accepted({headers:{'cf-connecting-ip':'198.51.100.2'}});assert.equal(state.hashInput,undefined);
});
test('pilot input is forwarded verbatim while forged identity never selects actor',async()=>{
 const text=payload({userId:'body-admin',role:'owner',organizationName:'Example \"escaped\" school',goals:'Evaluate anatomy learning 😀 and safe participation'});
 await accepted({text});assert.equal(state.rateArgs[0],actor.userId);assert.equal(state.submitArgs[1].userId,'body-admin');
});
test('representative escaped fields fit; permitted field lengths can still exceed the byte cap',async()=>{
 const sample=payload();
 const escaped='\\ud83d\\ude00';
 const text=sample.replace('"contentScope":"A synthetic anatomy education pilot"',`"contentScope":"${escaped.repeat(600)}"`).replace('"goals":"Evaluate learning outcomes safely"',`"goals":"${escaped.repeat(800)}"`);
 assert.ok(encoder.encode(text).byteLength<=maxBytes);await accepted({text});
 const oversized=text.replace('"supportNeeds":"None"',`"supportNeeds":"${escaped.repeat(600)}"`);
 const decoded=JSON.parse(oversized);assert.equal(decoded.contentScope.length,1200);assert.equal(decoded.goals.length,1600);assert.equal(decoded.supportNeeds.length,1200);
 assert.ok(encoder.encode(oversized).byteLength>maxBytes);await refused({text:oversized},413);
});
test('rate refusal follows auth and never submits',async()=>{
 reset();state.rateError=new InstitutionOperationsError('Too many requests. Please wait and try again.',429);
 const out=await post();assert.equal(out.response.status,429);privateHeaders(out.response);assert.deepEqual(state.events.filter(e=>['auth','hash','rate','submit'].includes(e)),['auth','rate']);assert.deepEqual(await out.response.json(),{error:state.rateError.message});
});
test('known domain errors preserve status and private headers',async()=>{
 for(const status of [400,403,409]){reset();state.submitError=new InstitutionOperationsError('Allowed domain message.',status);const out=await post();assert.equal(out.response.status,status);privateHeaders(out.response);assert.deepEqual(await out.response.json(),{error:'Allowed domain message.'});}
});
test('unexpected auth, hash, rate and submit errors redact detail and log type only',async()=>{
 for(const key of ['authError','hashError','rateError','submitError']){
  reset();if(key==='hashError')state.auth=null;state[key]=Error('PRIVATE_USER_RECORD_DETAIL');const out=await post();assert.equal(out.response.status,500);privateHeaders(out.response);assert.deepEqual(await out.response.json(),{error:'The pilot brief could not be recorded.'});assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);assert.ok(out.logs.length>0);assert.deepEqual(Object.keys(out.logs[0].at(-1)),['type']);
 }
});
