import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const separator=process.argv.indexOf('--');
if(separator>=0)assert.ok(process.argv[separator+1],'pass -- <site-root>');
const site=separator>=0?resolve(process.argv[separator+1]):resolve(here,'..');
const baselineIndex=process.argv.indexOf('--baseline');
const baseline=baselineIndex>=0;
const require=createRequire(resolve(site,'package.json'));const{build}=require('esbuild');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['app/api/learner/account/route.ts','app/api/studio/route.ts','lib/request-security.ts',...(!baseline?['lib/mutation-json.ts']:[])];
let sources;
if(baseline){
 assert.ok(process.argv[baselineIndex+1],'baseline mode requires --baseline <snapshot.json>');
 const snapshot=JSON.parse(readFileSync(resolve(process.argv[baselineIndex+1]),'utf8'));
 for(const[path,source]of Object.entries(snapshot.sources))assert.equal(sha(source),snapshot.pins[path]);
 sources=Object.fromEntries(paths.map(path=>{assert.ok(snapshot.sources[path],`baseline source missing: ${path}`);return[path,snapshot.sources[path]];}));
}else{
 sources=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(site,path),'utf8')]));
}
console.log(JSON.stringify({mode:baseline?'baseline':'actual',sourcePins:Object.fromEntries(Object.entries(sources).map(([path,text])=>[path,sha(text)])),synthetic:'server auth/services/InstitutionOperationsError/limiter; actual route/helper/security; no DB'}));
class EducationPlatformError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const auth={userId:'synthetic-server-user'};let state;
const seams={EducationPlatformError,InstitutionOperationsError,
 async getAuthContext(){state.events.push('auth');return state.auth;},
 async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
 async saveLearnerProfile(actor,input){state.events.push('mutation');assert.equal(actor,auth);state.input=input;return{synthetic:true};},
 async enrolInCourse(actor){state.events.push('mutation');assert.equal(actor,auth);return{synthetic:true};},
 async getLearnerProfile(){state.events.push('snapshot');return{};},async getLearnerEnrolments(){state.events.push('snapshot');return[];},
 async getStudioSnapshot(actor){state.events.push('snapshot');assert.equal(actor,auth);return{synthetic:true};},
};
const studioMethods=['createCourseInvitation','assignStudioCohortWorkbook','createStudioCohort','createStudioCourse','createStudioCourseFromTemplate','createStudioWorkbook','duplicateStudioCourse','duplicateStudioWorkbook','publishCourseRelease','reviewCourseRelease','saveCourseReleaseDraft','submitCourseRelease'];
for(const method of studioMethods)seams[method]=async(actor,input)=>{state.events.push('mutation');assert.equal(actor,auth);state.input=input;return'synthetic-created';};
const modules={
 'lib/auth':['getAuthContext'],
 'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
 'lib/education-platform':['EducationPlatformError','saveLearnerProfile','enrolInCourse','getLearnerProfile','getLearnerEnrolments','getStudioSnapshot',...studioMethods],
};
const routes={};
for(const[name,path]of Object.entries({learner:'app/api/learner/account/route.ts',studio:'app/api/studio/route.ts'})){
 const result=await build({entryPoints:[`./${path}`],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'bounded-synthetic-seams',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
   const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
   if(modules[key])return{path:key,namespace:'seam'};
   const actual=sources[key]?key:`${key}.ts`;if(sources[actual])return{path:actual,namespace:'actual'};
   throw Error(`Unexpected dependency ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${modules[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
 }}]});
 const module={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});routes[name]=module.exports;
 console.log(JSON.stringify({bundle:name,sha256:sha(result.outputFiles[0].contents)}));
}
const limits={learner:24_000,studio:48_000};
const encoder=new TextEncoder();
const input=name=>JSON.stringify({action:name==='learner'?'save-profile':'create-course',userId:'body-forged',name:'é😀'});
function reset(){state={auth,events:[],input:undefined,reads:0,cancels:0,releases:0,pulls:0};}
function request(name,{text=input(name),chunks,headers={},noBody=false,cancelThrows=false,readThrows=false}={}){
 let index=0;const pieces=chunks??[encoder.encode(text)];
 const stream=noBody?undefined:new ReadableStream({pull(controller){state.pulls++;if(readThrows){controller.error(Error('SECRET_STREAM_ERROR'));return;}if(index===pieces.length)controller.close();else controller.enqueue(pieces[index++]);},cancel(){if(cancelThrows)throw Error('SECRET_CANCEL_ERROR');}},{highWaterMark:0});
 const req=new Request('https://synthetic.invalid/api',{method:'POST',body:stream,duplex:'half',headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(req.body){const real=req.body.getReader.bind(req.body);req.body.getReader=()=>{const reader=real();return{async read(){state.reads++;state.events.push('read');return reader.read();},async cancel(){state.cancels++;return reader.cancel();},releaseLock(){state.releases++;state.events.push('release');return reader.releaseLock();}};};}
 return req;
}
async function invoke(name,options){const req=request(name,options);const previous=console.error;console.error=()=>{};try{return{response:await routes[name].POST(req),req};}finally{console.error=previous;}}
async function refused(name,options,status){reset();const{response,req}=await invoke(name,options);assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.ok(!state.events.includes('auth'));assert.ok(!state.events.includes('rate'));assert.ok(!state.events.includes('mutation'));assert.ok(!state.events.includes('snapshot'));assert.equal(req.body?.locked??false,false);if(req.body){assert.equal(state.cancels,1);assert.equal(state.releases,1);}return response;}
if(baseline){
 for(const name of Object.keys(routes))test(`baseline ${name}: header-trusted JSON negatives`,async()=>{
  const cases=[['oversize-missing',{text:input(name)+' '.repeat(limits[name])},200],['oversize-understated',{text:input(name)+' '.repeat(limits[name]),headers:{'content-length':'1'}},200],['json-suffix',{headers:{'content-type':'application/json-evil'}},200],['malformed',{text:'{'},500],['null',{text:'null'},500]];
  if(name==='studio')cases.push(['foreign-origin',{headers:{origin:'https://foreign.invalid'}},200],['cross-site',{headers:{'sec-fetch-site':'cross-site'}},200],['plain-text',{headers:{'content-type':'text/plain'}},200]);
  const before=encoder.encode(input(name).replace('é😀','x'));const position=Array.from(before).indexOf(120);const invalid=before.slice();invalid[position]=0xff;
  cases.push(['nonfatal-utf8',{chunks:[invalid]},200]);
  for(const[label,options,status]of cases){reset();const{response}=await invoke(name,options);assert.equal(response.status,status);console.log(JSON.stringify({baselineNegative:name,case:label,status,events:state.events}));}
 });
}else{
 for(const name of Object.keys(routes)){
  test(`${name}: streamed missing/false/non-numeric lengths enforce byte cap`,async()=>{
   for(const length of [undefined,'1','bad','-1']){const headers=length===undefined?{}:{'content-length':length};await refused(name,{chunks:[encoder.encode(input(name)),encoder.encode(' '.repeat(limits[name])),encoder.encode('unread-tail')],headers},413);assert.equal(state.reads,2);assert.equal(state.pulls,2);}
  });
  test(`${name}: exact byte boundary succeeds; one extra byte refuses`,async()=>{
   const body=encoder.encode(input(name));const padding=new Uint8Array(limits[name]-body.length).fill(32);
   reset();const{response,req}=await invoke(name,{chunks:[body,padding],headers:{'content-length':'0'}});assert.equal(response.status,200);assert.equal(state.releases,1);assert.equal(state.cancels,0);assert.equal(req.body.locked,false);assert.equal(state.input.name,'é😀');
   await refused(name,{chunks:[body,padding,new Uint8Array([32])]},413);
  });
  test(`${name}: cross-site and foreign/malformed Origin refuse before auth`,async()=>{
   for(const headers of [{'sec-fetch-site':'cross-site'},{origin:'https://foreign.invalid'},{origin:'not an origin'}]){await refused(name,{headers},403);assert.equal(state.reads,0);}
  });
  test(`${name}: exact JSON media type with parameters; suffix/plain refuse`,async()=>{
   for(const type of ['application/json-evil','application/jsonp','text/plain',''])await refused(name,{headers:{'content-type':type}},415);
   reset();const{response}=await invoke(name,{headers:{'content-type':'Application/JSON; charset=utf-8'}});assert.equal(response.status,200);
  });
  test(`${name}: malformed/nonobject/empty/fatal UTF8 are422`,async()=>{
   for(const text of ['{','null','[]','true','1','"string"',''])await refused(name,{text},422);
   await refused(name,{noBody:true},422);
   await refused(name,{chunks:[encoder.encode('{"action":"'),new Uint8Array([0xff]),encoder.encode('"}')]},422);
   await refused(name,{chunks:[encoder.encode('{"action":"'),new Uint8Array([0xe2,0x82])]},422);
  });
  test(`${name}: split multibyte success retains parser/auth/rate/action order`,async()=>{
   reset();const body=encoder.encode(input(name));const chunks=Array.from(body,byte=>new Uint8Array([byte]));const{response}=await invoke(name,{chunks});assert.equal(response.status,200);assert.equal(state.input.name,'é😀');assert.equal(state.input.userId,'body-forged');assert.ok(state.events.indexOf('release')<state.events.indexOf('auth'));assert.deepEqual(state.events.filter(e=>!['read','release'].includes(e)),name==='studio'?['auth','rate','mutation','snapshot']:['auth','rate','mutation']);assert.equal(state.rateArgs[0],auth.userId);
  });
  test(`${name}: absent Origin accepted under existing policy`,async()=>{
   reset();const req=request(name);req.headers.delete('origin');const response=await routes[name].POST(req);assert.equal(response.status,200);
  });
  test(`${name}: early declared oversize and cancellation/read failure preserve refusal`,async()=>{
   await refused(name,{headers:{'content-length':String(limits[name]+1)}},413);assert.equal(state.reads,0);
   const response=await refused(name,{chunks:[new Uint8Array(limits[name]+1)],cancelThrows:true},413);assert.doesNotMatch(await response.text(),/SECRET/);
   const readResponse=await refused(name,{readThrows:true},422);assert.doesNotMatch(await readResponse.text(),/SECRET/);
  });
  test(`${name}: valid auth401, rate429, unknown action404 preserve existing boundaries`,async()=>{
   reset();state.auth=null;let result=await invoke(name);assert.equal(result.response.status,401);assert.deepEqual(state.events.filter(e=>!['read','release'].includes(e)),['auth']);
   reset();state.rateError=new InstitutionOperationsError('Please wait.',429);result=await invoke(name);assert.equal(result.response.status,429);assert.deepEqual(state.events.filter(e=>!['read','release'].includes(e)),['auth','rate']);
   reset();result=await invoke(name,{text:'{"action":"unknown"}'});assert.equal(result.response.status,404);assert.deepEqual(state.events.filter(e=>!['read','release'].includes(e)),['auth','rate']);
  });
 }
}
