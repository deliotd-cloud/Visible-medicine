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
const baselineAt=process.argv.indexOf('--baseline');
assert.ok(baselineAt<0||process.argv[baselineAt+1],'--baseline requires a snapshot path');
const snapshot=baselineAt<0?null:JSON.parse(readFileSync(resolve(process.argv[baselineAt+1]),'utf8'));
const paths=['app/api/progress/route.ts','lib/mutation-json.ts','lib/request-security.ts'];
if(snapshot){
 assert.deepEqual(Object.keys(snapshot.sources).sort(),[...paths].sort(),'baseline source paths');
 assert.deepEqual(Object.keys(snapshot.pins).sort(),[...paths].sort(),'baseline pin paths');
 for(const path of paths)assert.equal(sha(snapshot.sources[path]),snapshot.pins[path],`baseline pin ${path}`);
}
const sources=Object.fromEntries(paths.map(path=>[path,snapshot?snapshot.sources[path]:readFileSync(resolve(site,path),'utf8')]));
console.log(JSON.stringify({mode:snapshot?'pinned-before':'actual',sources:Object.fromEntries(paths.map(path=>[path,sha(sources[path])])),seams:'synthetic auth/progress/completion; no DB or HTTP'}));

const actor={userId:'raw-server-user',email:'learner@example.invalid',displayName:'Learner'};
const listed=[{resourceType:'atlas',resourceSlug:'head',progress:10,lastPosition:1,updatedAt:'2026-01-01T00:00:00.000Z'}];
const saved={resourceType:'course',resourceSlug:'anatomy-1',progress:100,lastPosition:2,updatedAt:'2026-01-02T00:00:00.000Z'};
let state;
function reset(){state={auth:actor,events:[],reads:0,cancels:0,releases:0};}
const seams={
 async getChatGPTUser(){state.events.push('auth');if(state.authError)throw state.authError;return state.auth;},
 async listProgress(...args){state.events.push('list');state.listArgs=args;if(state.listError)throw state.listError;return listed;},
 async saveProgress(...args){state.events.push('save');state.saveArgs=args;if(state.saveError)throw state.saveError;return state.saved??saved;},
 async syncCourseCompletion(...args){state.events.push('completion');state.completionArgs=args;if(state.completionError)throw state.completionError;return 'completion-1';},
};
const seamModules={
 'app/chatgpt-auth':['getChatGPTUser'],
 'db/progress':['listProgress','saveProgress'],
 'lib/platform-governance':['syncCourseCompletion'],
};
const result=await build({entryPoints:['./app/api/progress/route.ts'],bundle:true,metafile:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'progress-envelope-seams',setup(b){
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
const included=Object.keys(result.metafile.inputs);
for(const path of snapshot?paths.slice(0,1):paths)assert.ok(included.some(input=>input.endsWith(path)),`actual bundle missing ${path}`);
const module={exports:{}};
new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const route=module.exports;
console.log(JSON.stringify({bundleSha256:sha(result.outputFiles[0].contents),included}));

const encoder=new TextEncoder();
const maxBytes=4000;
const payload=(overrides={})=>JSON.stringify({resourceType:'course',resourceSlug:'anatomy-1',progress:100,lastPosition:2,userId:'forged-body-user',...overrides});
function request({text=payload(),chunks,headers={},noBody=false,cancelThrows=false,readThrows=false}={}){
 let index=0;const pieces=chunks??[encoder.encode(text)];
 const body=noBody?undefined:new ReadableStream({pull(controller){if(readThrows){controller.error(Error('PRIVATE_STREAM_DETAIL'));return;}if(index===pieces.length)controller.close();else controller.enqueue(pieces[index++]);},cancel(){if(cancelThrows)throw Error('PRIVATE_CANCEL_DETAIL');}},{highWaterMark:0});
 const req=new Request('https://synthetic.invalid/api/progress',{method:'POST',body,duplex:'half',headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(req.body){const getReader=req.body.getReader.bind(req.body);req.body.getReader=()=>{const reader=getReader();return{async read(){state.reads++;state.events.push('read');return reader.read();},async cancel(){state.cancels++;return reader.cancel();},releaseLock(){state.releases++;state.events.push('release');return reader.releaseLock();}};};}
 return req;
}
async function post(options){const req=request(options);const previous=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await route.POST(req),req,logs};}finally{console.error=previous;}}
async function get(){const previous=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await route.GET(),logs};}finally{console.error=previous;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
function noServices(){assert.ok(!state.events.some(event=>['auth','list','save','completion'].includes(event)),`called before envelope refusal: ${state.events}`);}
async function refused(options,status){reset();const out=await post(options);assert.equal(out.response.status,status);privateHeaders(out.response);noServices();assert.equal(out.req.body?.locked??false,false);if(out.req.body){assert.equal(state.cancels,1);assert.equal(state.releases,1);}return out;}
async function success(options){reset();const out=await post(options);assert.equal(out.response.status,200);privateHeaders(out.response);assert.ok(state.events.indexOf('release')<state.events.indexOf('auth'),`parse before auth: ${state.events}`);assert.equal(out.req.body.locked,false);assert.equal(state.cancels,0);assert.equal(state.releases,1);return out;}

test('streamed actual UTF8 bytes enforce 4000 cap despite absent or forged length',async()=>{
 for(const length of [undefined,'1','bad','-1']){
  const headers=length===undefined?{}:{'content-length':length};
  await refused({chunks:[encoder.encode(payload()),encoder.encode(' '.repeat(maxBytes)),encoder.encode('unread-tail')],headers},413);
  assert.equal(state.reads,2);
 }
});
test('exact byte boundary succeeds and next byte refuses',async()=>{
 const first=encoder.encode(payload());const pad=new Uint8Array(maxBytes-first.byteLength).fill(32);
 await success({chunks:[first,pad],headers:{'content-length':'0'}});
 await refused({chunks:[first,pad,new Uint8Array([32])]},413);
});
test('cross-site, foreign and malformed origins refuse before auth',async()=>{
 for(const headers of [{'sec-fetch-site':'cross-site'},{origin:'https://foreign.invalid'},{origin:'not-an-origin'}]){
  await refused({headers},403);assert.equal(state.reads,0);
 }
});
test('exact JSON media type accepts parameters and rejects prefixes',async()=>{
 for(const type of ['application/json-evil','application/jsonp','text/plain','']){
  await refused({headers:{'content-type':type}},415);assert.equal(state.reads,0);
 }
 await success({headers:{'content-type':'Application/JSON; charset=utf-8'}});
});
test('invalid JSON, non-object, missing body and invalid UTF8 refuse before auth',async()=>{
 for(const text of ['{','null','[]','true','1','"string"',''])await refused({text},422);
 await refused({noBody:true},422);
 await refused({chunks:[encoder.encode('{"x":"'),new Uint8Array([0xff]),encoder.encode('"}')]},422);
 await refused({chunks:[encoder.encode('{"x":"'),new Uint8Array([0xe2,0x82])]},422);
});
test('split UTF8 and missing Origin retain dispatch',async()=>{
 await success({chunks:Array.from(encoder.encode(payload()),byte=>new Uint8Array([byte]))});
 await success({headers:{origin:''}});
});
test('early declared oversize and stream errors release lock without detail',async()=>{
 await refused({headers:{'content-length':String(maxBytes+1)}},413);assert.equal(state.reads,0);
 let out=await refused({chunks:[new Uint8Array(maxBytes+1)],cancelThrows:true},413);
 assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
 out=await refused({readThrows:true},422);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
});
test('valid envelope authenticates and ignores forged body identity',async()=>{
 const out=await success();
 assert.deepEqual(state.events.filter(x=>['auth','list','save','completion'].includes(x)),['auth','save','completion']);
 assert.deepEqual(state.saveArgs,['raw-server-user',{resourceType:'course',resourceSlug:'anatomy-1',progress:100,lastPosition:2}]);
 assert.deepEqual(state.completionArgs,[{userId:'edu:raw-server-user',externalSubject:'sites:raw-server-user',email:actor.email,displayName:actor.displayName},'anatomy-1',100]);
 assert.deepEqual(await out.response.json(),{progress:saved,completionId:'completion-1'});
});
test('Atlas and partial course progress save without completion service',async()=>{
 for(const input of [{resourceType:'atlas',progress:100},{resourceType:'course',progress:5}]){
  const out=await success({text:payload(input)});
  assert.deepEqual(state.events.filter(x=>['auth','list','save','completion'].includes(x)),['auth','save']);
  assert.deepEqual(state.saveArgs,['raw-server-user',{resourceType:input.resourceType,resourceSlug:'anatomy-1',progress:input.progress,lastPosition:2}]);
  assert.deepEqual(await out.response.json(),{progress:saved,completionId:null});
 }
});
test('schema rejects invalid fields before save; maximum safe position is accepted',async()=>{
 const invalid=[{resourceType:'case'},{resourceSlug:''},{resourceSlug:'a'.repeat(81)},{resourceSlug:'Bad_slug'},{progress:-1},{progress:101},{progress:1.5},{progress:'5'},{lastPosition:-1},{lastPosition:1.5},{lastPosition:'2'},{lastPosition:Number.MAX_SAFE_INTEGER+1}];
 for(const value of invalid){reset();const out=await post({text:payload(value)});assert.equal(out.response.status,400);privateHeaders(out.response);assert.deepEqual(await out.response.json(),{error:'Invalid progress record'});assert.ok(!state.events.includes('save'));assert.ok(!state.events.includes('completion'));}
 await success({text:payload({resourceType:'atlas',lastPosition:Number.MAX_SAFE_INTEGER})});
 assert.equal(state.saveArgs[1].lastPosition,Number.MAX_SAFE_INTEGER);
});
test('authentication refusal and unexpected auth and DB errors are private and redacted',async()=>{
 reset();state.auth=null;let out=await post();assert.equal(out.response.status,401);privateHeaders(out.response);assert.deepEqual(await out.response.json(),{error:'Authentication required'});assert.deepEqual(state.events.filter(x=>['auth','list','save','completion'].includes(x)),['auth']);
 for(const key of ['authError','saveError']){
  reset();state[key]=Error('PRIVATE_USER_RECORD_DETAIL');out=await post();assert.equal(out.response.status,500);privateHeaders(out.response);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);
 }
});

test('a failing completion service acknowledges committed progress without inventing a completion record',async()=>{
 reset();state.completionError=Error('PRIVATE_USER_RECORD_DETAIL');const out=await post();
 assert.equal(out.response.status,200);privateHeaders(out.response);
 assert.deepEqual(await out.response.json(),{progress:saved,completionId:null});
 assert.deepEqual(state.events.filter(x=>['auth','save','completion'].includes(x)),['auth','save','completion']);
 assert.deepEqual(state.saveArgs,['raw-server-user',{resourceType:'course',resourceSlug:'anatomy-1',progress:100,lastPosition:2}]);
 assert.equal(out.logs.length,1);assert.deepEqual(out.logs[0],['Course completion could not be confirmed',{type:'Error'}]);
 assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);
});

test('a bookmark acknowledges preserved100 progress without issuing another completion record',async()=>{
 reset();state.saved={...saved,progress:100,lastPosition:999};const out=await post({text:payload({progress:5,lastPosition:1})});
 assert.equal(out.response.status,200);privateHeaders(out.response);assert.deepEqual(await out.response.json(),{progress:state.saved,completionId:null});
 assert.deepEqual(state.saveArgs,['raw-server-user',{resourceType:'course',resourceSlug:'anatomy-1',progress:5,lastPosition:1}]);
 assert.deepEqual(state.events.filter(x=>['auth','save','completion'].includes(x)),['auth','save']);
});
test('GET list uses raw server identity and all response paths are private',async()=>{
 reset();let out=await get();assert.equal(out.response.status,200);privateHeaders(out.response);assert.deepEqual(state.events,['auth','list']);assert.deepEqual(state.listArgs,['raw-server-user']);assert.deepEqual(await out.response.json(),{progress:listed});
 reset();state.auth=null;out=await get();assert.equal(out.response.status,401);privateHeaders(out.response);assert.deepEqual(await out.response.json(),{error:'Authentication required'});assert.deepEqual(state.events,['auth']);
 for(const key of ['authError','listError']){reset();state[key]=Error('PRIVATE_USER_RECORD_DETAIL');out=await get();assert.equal(out.response.status,500);privateHeaders(out.response);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);}
});
