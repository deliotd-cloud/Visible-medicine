import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const sha=value=>createHash('sha256').update(value).digest('hex');
const baselineAt=process.argv.indexOf('--baseline');
assert.ok(baselineAt<0||process.argv[baselineAt+1],'--baseline requires a snapshot path');
const snapshot=baselineAt<0?null:JSON.parse(readFileSync(resolve(process.argv[baselineAt+1]),'utf8'));
if(snapshot)for(const[path,source]of Object.entries(snapshot.sources))
 assert.equal(sha(source),snapshot.pins[path],`baseline pin ${path}`);
const paths=['app/api/learner/preferences/route.ts','app/api/learner/data/route.ts','lib/mutation-json.ts','lib/request-security.ts'];
const sources=Object.fromEntries(paths.map(path=>[path,snapshot?snapshot.sources[path]:readFileSync(resolve(site,path),'utf8')]));
console.log(JSON.stringify({mode:snapshot?'pinned-before':'actual',sources:Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,sha(s)])),seams:'synthetic auth/institution operations; no DB or HTTP'}));

class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'server-user',role:'learner'};
const exported={requests:[{id:'server-request',status:'submitted'}],account:{id:actor.userId}};
const saved={courseUpdates:true,deliveryMode:'in-app-only'};
const created={id:'server-request',status:'submitted'};
let state;
function reset(){state={auth:actor,events:[],reads:0,cancels:0,releases:0};}
const seams={InstitutionOperationsError,
 async getAuthContext(){state.events.push('auth');return state.auth;},
 async enforceRateLimit(...args){state.events.push('limit');state.limitArgs=args;if(state.limitError)throw state.limitError;},
 async saveNotificationPreferences(a,input){state.events.push('save');assert.equal(a,actor);state.input=input;if(state.serviceError)throw state.serviceError;return saved;},
 async createAccountRequest(a,input){state.events.push('create');assert.equal(a,actor);state.input=input;if(state.serviceError)throw state.serviceError;return created;},
 async exportLearnerData(a){state.events.push('export');assert.equal(a,actor);if(state.exportError)throw state.exportError;return exported;},
};
const seamModules={
 'lib/auth':['getAuthContext'],
 'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit','saveNotificationPreferences','createAccountRequest','exportLearnerData'],
};
const routes={};
for(const[name,path]of Object.entries({preferences:paths[0],data:paths[1]})){
 const result=await build({entryPoints:[`./${path}`],bundle:true,metafile:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'learner-envelope-seams',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
   const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
   if(seamModules[key])return{path:key,namespace:'seam'};
   const actual=sources[key]?key:`${key}.ts`;
   if(sources[actual])return{path:actual,namespace:'actual'};
   throw Error(`Unexpected dependency ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamModules[args.path].map(n=>`export const ${n}=seams.${n};`).join('\n')}`,loader:'js'}));
 }}]});
 const included=Object.keys(result.metafile.inputs);
 assert.ok(included.some(p=>p.endsWith(path)),`route missing from ${name} bundle`);
 if(!snapshot)for(const dependency of ['lib/mutation-json.ts','lib/request-security.ts'])
  assert.ok(included.some(p=>p.endsWith(dependency)),`actual ${name} bundle missing ${dependency}`);
 const module={exports:{}};
 new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
 routes[name]=module.exports;
 console.log(JSON.stringify({route:name,bundleSha256:sha(result.outputFiles[0].contents),included}));
}

const limits={preferences:4_000,data:12_000};
const rate={preferences:['notification-preferences',12,60],data:['account-request',6,3600]};
const encoder=new TextEncoder();
const payload=()=>JSON.stringify({userId:'forged-body-user',role:'administrator',name:'é😀',requestType:'correction',detail:'Correction to my details',courseUpdates:true});
function request(name,{text=payload(),chunks,headers={},noBody=false,cancelThrows=false,readThrows=false}={}){
 let index=0;const pieces=chunks??[encoder.encode(text)];
 const body=noBody?undefined:new ReadableStream({pull(controller){if(readThrows){controller.error(Error('PRIVATE_STREAM_DETAIL'));return;}if(index===pieces.length)controller.close();else controller.enqueue(pieces[index++]);},cancel(){if(cancelThrows)throw Error('PRIVATE_CANCEL_DETAIL');}},{highWaterMark:0});
 const req=new Request(`https://synthetic.invalid/api/learner/${name}`,{method:'POST',body,duplex:'half',headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(req.body){const getReader=req.body.getReader.bind(req.body);req.body.getReader=()=>{const reader=getReader();return{async read(){state.reads++;state.events.push('read');return reader.read();},async cancel(){state.cancels++;return reader.cancel();},releaseLock(){state.releases++;state.events.push('release');return reader.releaseLock();}};};}
 return req;
}
async function post(name,options){const req=request(name,options);const previous=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await routes[name].POST(req),req,logs};}finally{console.error=previous;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
function noServices(){assert.ok(!state.events.some(event=>['auth','limit','save','create','export'].includes(event)),`service called before envelope refusal: ${state.events}`);}
async function refused(name,options,status,{beforeAuth=true}={}){
 reset();const out=await post(name,options);assert.equal(out.response.status,status);privateHeaders(out.response);
 if(beforeAuth)noServices();assert.equal(out.req.body?.locked??false,false);
 if(out.req.body){assert.equal(state.cancels,1);assert.equal(state.releases,1);}
 return out;
}
async function valid(name,options){reset();const out=await post(name,options);assert.equal(out.response.status,200);privateHeaders(out.response);
 assert.deepEqual(state.limitArgs,[actor.userId,...rate[name]]);
 assert.ok(state.events.indexOf('release')<state.events.indexOf('auth'),`parse must complete before auth: ${state.events}`);
 assert.deepEqual(state.events.filter(e=>['auth','limit','save','create','export'].includes(e)),name==='preferences'?['auth','limit','save']:['auth','limit','create','export']);
 assert.equal(state.input.userId,'forged-body-user');assert.equal(state.input.role,'administrator');
 assert.equal(out.req.body.locked,false);assert.equal(state.cancels,0);assert.equal(state.releases,1);
 assert.deepEqual(await out.response.json(),name==='preferences'?saved:{request:created,requests:exported.requests});return out;
}

for(const name of Object.keys(routes)){
 test(`${name}: streamed actual UTF8 bytes enforce cap despite absent or forged length`,async()=>{
  for(const length of [undefined,'1','bad','-1']){
   const headers=length===undefined?{}:{'content-length':length};
   await refused(name,{chunks:[encoder.encode(payload()),encoder.encode(' '.repeat(limits[name])),encoder.encode('unread-tail')],headers},413);
   assert.equal(state.reads,2);
  }
 });
 test(`${name}: exact byte boundary succeeds and the next byte refuses`,async()=>{
  const first=encoder.encode(payload());const pad=new Uint8Array(limits[name]-first.byteLength).fill(32);
  await valid(name,{chunks:[first,pad],headers:{'content-length':'0'}});
  await refused(name,{chunks:[first,pad,new Uint8Array([32])]},413);
 });
 test(`${name}: cross-site, foreign and malformed origins refuse before auth`,async()=>{
  for(const headers of [{'sec-fetch-site':'cross-site'},{origin:'https://foreign.invalid'},{origin:'not-an-origin'}]){
   await refused(name,{headers},403);assert.equal(state.reads,0);
  }
 });
 test(`${name}: exact JSON media type accepts parameters and rejects prefixes`,async()=>{
  for(const type of ['application/json-evil','application/jsonp','text/plain','']){
   await refused(name,{headers:{'content-type':type}},415);assert.equal(state.reads,0);
  }
  await valid(name,{headers:{'content-type':'Application/JSON; charset=utf-8'}});
 });
 test(`${name}: invalid JSON, non-object, absent body and invalid UTF8 refuse`,async()=>{
  for(const text of ['{','null','[]','true','1','"string"',''])await refused(name,{text},422);
  await refused(name,{noBody:true},422);
  await refused(name,{chunks:[encoder.encode('{"name":"'),new Uint8Array([0xff]),encoder.encode('"}')]},422);
  await refused(name,{chunks:[encoder.encode('{"name":"'),new Uint8Array([0xe2,0x82])]},422);
 });
 test(`${name}: split UTF8 and missing Origin retain authenticated dispatch`,async()=>{
  await valid(name,{chunks:Array.from(encoder.encode(payload()),byte=>new Uint8Array([byte]))});
  const out=await valid(name,{headers:{origin:''}});assert.equal(out.response.status,200);
 });
 test(`${name}: early declared oversize and stream failures release lock without detail`,async()=>{
  await refused(name,{headers:{'content-length':String(limits[name]+1)}},413);assert.equal(state.reads,0);
  let out=await refused(name,{chunks:[new Uint8Array(limits[name]+1)],cancelThrows:true},413);
  assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
  out=await refused(name,{readThrows:true},422);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
 });
 test(`${name}: auth and limiter follow a valid envelope before mutation`,async()=>{
  reset();state.auth=null;let out=await post(name);assert.equal(out.response.status,401);privateHeaders(out.response);
  assert.deepEqual(state.events.filter(e=>['auth','limit','save','create','export'].includes(e)),['auth']);
  reset();state.limitError=new InstitutionOperationsError('Too many requests.',429);out=await post(name);
  assert.equal(out.response.status,429);privateHeaders(out.response);
  assert.deepEqual(state.events.filter(e=>['auth','limit','save','create','export'].includes(e)),['auth','limit']);
 });
 test(`${name}: downstream domain errors and unknown errors preserve private responses`,async()=>{
  for(const status of [400,403,409]){
   reset();state.serviceError=new InstitutionOperationsError('Allowed domain message.',status);
   const out=await post(name);assert.equal(out.response.status,status);privateHeaders(out.response);
   assert.ok(state.events.includes(name==='preferences'?'save':'create'));
  }
  reset();state.serviceError=Error('PRIVATE_USER_RECORD_DETAIL');const out=await post(name);
  assert.equal(out.response.status,500);privateHeaders(out.response);
  assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
  assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);
  assert.ok(out.logs.length>0);assert.deepEqual(Object.keys(out.logs[0].at(-1)),['type']);
 });
}

test('existing client fields and a fully escaped 1200-character account detail fit the caps',async()=>{
 const preferences={courseUpdates:true,assignmentReminders:false,reviewReminders:true,productUpdates:false};
 reset();let out=await post('preferences',{text:JSON.stringify(preferences)});
 assert.equal(out.response.status,200);assert.deepEqual(state.input,preferences);
 for(const requestType of ['correction','restriction','deletion']){
  // 600 surrogate pairs = 1200 UTF16 characters, escaped to 7200 JSON bytes.
  const text=`{"requestType":"${requestType}","detail":"${'\\ud83d\\ude00'.repeat(600)}"}`;
  assert(encoder.encode(text).byteLength<limits.data);
  reset();out=await post('data',{text});assert.equal(out.response.status,200);
  assert.equal(state.input.detail.length,1200);assert.equal(state.input.requestType,requestType);
  assert.deepEqual(state.events.filter(e=>['auth','limit','create','export'].includes(e)),['auth','limit','create','export']);
 }
});

test('data: GET export shape and authenticated errors remain private',async()=>{
 reset();let response=await routes.data.GET();assert.equal(response.status,200);privateHeaders(response);
 assert.equal(response.headers.get('content-disposition')?.startsWith('attachment; filename="visible-medicine-data-'),true);
 assert.deepEqual(await response.json(),exported);assert.deepEqual(state.events,['auth','export']);
 reset();state.auth=null;response=await routes.data.GET();assert.equal(response.status,401);privateHeaders(response);
 assert.deepEqual(state.events,['auth']);
 reset();state.exportError=Error('PRIVATE_USER_RECORD_DETAIL');const previous=console.error;const logs=[];
 console.error=(...args)=>logs.push(args);try{response=await routes.data.GET();}finally{console.error=previous;}
 assert.equal(response.status,500);privateHeaders(response);
 assert.doesNotMatch(await response.text(),/PRIVATE_/);assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_/);
 assert.ok(logs.length>0);assert.deepEqual(Object.keys(logs[0].at(-1)),['type']);
});
