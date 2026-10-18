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
const sha=s=>createHash('sha256').update(s).digest('hex');
const baselineAt=process.argv.indexOf('--baseline');
assert.ok(baselineAt<0||process.argv[baselineAt+1],'--baseline requires a snapshot path');
const snapshot=baselineAt<0?null:JSON.parse(readFileSync(resolve(process.argv[baselineAt+1]),'utf8'));
const routePaths={control:'app/api/platform/control/route.ts',readiness:'app/api/platform/readiness/route.ts',people:'app/api/platform/people/route.ts',accept:'app/api/platform/people/accept/route.ts'};
const helperPaths=['lib/mutation-json.ts','lib/request-security.ts'];
const paths=[...Object.values(routePaths),...helperPaths];
if(snapshot){
 assert.deepEqual(Object.keys(snapshot.sources).sort(),[...paths].sort(),'pinned source set');
 for(const path of paths)assert.equal(sha(snapshot.sources[path]),snapshot.pins[path],`baseline pin ${path}`);
}
const sources=Object.fromEntries(paths.map(path=>[path,snapshot?snapshot.sources[path]:readFileSync(resolve(site,path),'utf8')]));
console.log(JSON.stringify({mode:snapshot?'pinned-before':'actual',sources:Object.fromEntries(paths.map(path=>[path,sha(sources[path])])),seams:'synthetic auth/governance/institution operations; no DB or HTTP'}));

class PlatformGovernanceError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'server-actor',role:'learner'};
const controlSnapshot={kind:'control',owner:actor.userId};
const readinessSnapshot={kind:'readiness',owner:actor.userId};
const peopleSnapshot={kind:'people',owner:actor.userId};
const invitation={created:1};
const acceptance={accepted:true};
const launch={url:'https://synthetic.invalid/launch'};
const controlActions={
 'save-organization-profile':'saveOrganizationProfile','save-identity-draft':'saveIdentityDraft',
 'create-atlas-draft':'createAtlasDraft','add-atlas-annotation':'addAtlasAnnotation',
 'submit-atlas-review':'submitAtlasForReview','review-atlas-publication':'reviewAtlasPublication',
 'publish-atlas-publication':'publishAtlasPublication','save-billing-intent':'saveBillingIntent',
 'issue-embed-launch':'issueEmbedLaunch',
};
const limits={control:48_000,readiness:24_000,people:64_000,accept:4_000};
const rates={readiness:['readiness-write',30,60],people:['institution-people',12,60],accept:['accept-organization-invitation',8,300]};
let state;
function reset(){state={auth:actor,events:[],reads:0,cancels:0,releases:0,calls:[]};}
function service(name,actorArg,value,result){
 state.events.push(name);state.calls.push({name,value});assert.equal(actorArg,actor,`${name} must use server auth`);
 if(state.serviceError)throw state.serviceError;return result;
}
const seams={PlatformGovernanceError,InstitutionOperationsError,
 async getAuthContext(){state.events.push('auth');return state.auth;},
 async enforceRateLimit(...args){state.events.push('limit');state.rateArgs=args;if(state.limitError)throw state.limitError;},
 async getControlCentreSnapshot(a){return service('controlSnapshot',a,undefined,controlSnapshot);},
 async getReadinessSnapshot(a){return service('readinessSnapshot',a,undefined,readinessSnapshot);},
 async getPeopleSnapshot(a){return service('peopleSnapshot',a,undefined,peopleSnapshot);},
 async saveReadinessCheck(a,v){return service('saveReadinessCheck',a,v);},
 async createOrganizationInvitations(a,v){return service('createOrganizationInvitations',a,v,invitation);},
 async acceptOrganizationInvitation(a,v){return service('acceptOrganizationInvitation',a,v,acceptance);},
};
for(const method of Object.values(controlActions))seams[method]=async(a,v)=>service(method,a,v,method==='issueEmbedLaunch'?launch:undefined);
const seamModules={
 'lib/auth':['getAuthContext'],
 'lib/platform-governance':['PlatformGovernanceError','getControlCentreSnapshot',...Object.values(controlActions)],
 'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit','getReadinessSnapshot','saveReadinessCheck','getPeopleSnapshot','createOrganizationInvitations','acceptOrganizationInvitation'],
};
const routes={};
for(const[name,path]of Object.entries(routePaths)){
 const result=await build({entryPoints:[`./${path}`],bundle:true,metafile:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'platform-envelope-seams',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
   const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
   if(seamModules[key])return{path:key,namespace:'seam'};
   const actual=sources[key]?key:`${key}.ts`;
   if(sources[actual])return{path:actual,namespace:'actual'};
   throw Error(`Unexpected dependency ${args.path} from ${args.importer}`);
  });
  b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamModules[args.path].map(n=>`export const ${n}=seams.${n};`).join('\n')}`,loader:'js'}));
 }}]});
 const included=Object.keys(result.metafile.inputs);
 assert.ok(included.some(p=>p.endsWith(path)),`route missing from ${name} bundle`);
 if(!snapshot)for(const dependency of helperPaths)assert.ok(included.some(p=>p.endsWith(dependency)),`actual ${name} bundle missing ${dependency}`);
 const module={exports:{}};
 new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
 routes[name]=module.exports;
 console.log(JSON.stringify({route:name,bundleSha256:sha(result.outputFiles[0].contents),included}));
}

const encoder=new TextEncoder();
const payload=(name,action)=>JSON.stringify({action:action??(name==='control'?'save-organization-profile':name==='readiness'?'save-check':name==='people'?'invite':undefined),token:'invite-token',userId:'forged-user',role:'administrator',name:'é😀',publicationId:'publication-1',service:'evidence'});
function request(name,{text=payload(name),chunks,headers={},noBody=false,readThrows=false,cancelThrows=false}={}){
 let index=0;const pieces=chunks??[encoder.encode(text)];
 const body=noBody?undefined:new ReadableStream({pull(controller){if(readThrows){controller.error(Error('PRIVATE_STREAM_DETAIL'));return;}if(index===pieces.length)controller.close();else controller.enqueue(pieces[index++]);},cancel(){if(cancelThrows)throw Error('PRIVATE_CANCEL_DETAIL');}},{highWaterMark:0});
 const req=new Request(`https://synthetic.invalid/api/platform/${name==='accept'?'people/accept':name}`,{method:'POST',body,duplex:'half',headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(req.body){const getReader=req.body.getReader.bind(req.body);req.body.getReader=()=>{const reader=getReader();return{async read(){state.reads++;state.events.push('read');return reader.read();},async cancel(){state.cancels++;return reader.cancel();},releaseLock(){state.releases++;state.events.push('release');return reader.releaseLock();}};};}
 return req;
}
async function post(name,options){const req=request(name,options);const old=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await routes[name].POST(req),req,logs};}finally{console.error=old;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
function noServices(){assert.ok(!state.events.some(e=>e==='auth'||e==='limit'||e in seams),`service before envelope refusal: ${state.events}`);}
async function refused(name,options,status){reset();const out=await post(name,options);assert.equal(out.response.status,status);privateHeaders(out.response);noServices();assert.equal(out.req.body?.locked??false,false);if(out.req.body){assert.equal(state.cancels,1);assert.equal(state.releases,1);}return out;}
async function valid(name,options){reset();const out=await post(name,options);assert.equal(out.response.status,200);privateHeaders(out.response);assert.ok(state.events.indexOf('release')<state.events.indexOf('auth'),`parse must precede auth: ${state.events}`);assert.equal(state.cancels,0);assert.equal(state.releases,1);assert.equal(out.req.body.locked,false);if(rates[name])assert.deepEqual(state.rateArgs,[actor.userId,...rates[name]]);else assert.ok(!state.events.includes('limit'));return out;}

for(const name of Object.keys(routes)){
 test(`${name}: missing and forged length cannot bypass streamed byte cap`,async()=>{
  for(const length of [undefined,'1','bad','-1']){const headers=length===undefined?{}:{'content-length':length};await refused(name,{chunks:[encoder.encode(payload(name)),encoder.encode(' '.repeat(limits[name])),encoder.encode('unread-tail')],headers},413);assert.equal(state.reads,2);}
 });
 test(`${name}: exact UTF8 byte cap succeeds and one extra byte refuses`,async()=>{
  const first=encoder.encode(payload(name));const pad=new Uint8Array(limits[name]-first.byteLength).fill(32);
  await valid(name,{chunks:[first,pad],headers:{'content-length':'0'}});
  await refused(name,{chunks:[first,pad,new Uint8Array([32])]},413);
 });
 test(`${name}: cross-site, foreign and malformed origins refuse before auth`,async()=>{
  for(const headers of [{'sec-fetch-site':'cross-site'},{origin:'https://foreign.invalid'},{origin:'not-an-origin'}]){await refused(name,{headers},403);assert.equal(state.reads,0);}
 });
 test(`${name}: exact JSON media type accepts parameters and refuses prefixes`,async()=>{
  for(const type of ['application/json-evil','application/jsonp','text/plain','']){await refused(name,{headers:{'content-type':type}},415);assert.equal(state.reads,0);}
  await valid(name,{headers:{'content-type':'Application/JSON; charset=utf-8'}});
 });
 test(`${name}: malformed, non-object, missing and invalid UTF8 bodies refuse`,async()=>{
  for(const text of ['{','null','[]','true','1','"string"',''])await refused(name,{text},422);
  await refused(name,{noBody:true},422);
  await refused(name,{chunks:[encoder.encode('{"name":"'),new Uint8Array([0xff]),encoder.encode('"}')]},422);
  await refused(name,{chunks:[encoder.encode('{"name":"'),new Uint8Array([0xe2,0x82])]},422);
 });
 test(`${name}: split UTF8 and absent Origin retain dispatch`,async()=>{
  await valid(name,{chunks:Array.from(encoder.encode(payload(name)),byte=>new Uint8Array([byte]))});
  await valid(name,{headers:{origin:''}});
 });
 test(`${name}: early oversize, cancellation and stream errors release without details`,async()=>{
  const declared=await refused(name,{headers:{'content-length':String(limits[name]+1)}},413);assert.equal(state.reads,0);
  assert.equal((await declared.response.json()).error,name==='people'?'The roster is too large.':'The request is too large.');
  let out=await refused(name,{chunks:[new Uint8Array(limits[name]+1)],cancelThrows:true},413);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
  out=await refused(name,{readThrows:true},422);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
 });
 test(`${name}: authenticated identity, limiter and domain errors stay private`,async()=>{
  reset();state.auth=null;let out=await post(name);assert.equal(out.response.status,401);privateHeaders(out.response);assert.deepEqual(state.events.filter(e=>e==='auth'||e==='limit'),['auth']);
  if(rates[name]){reset();state.limitError=new InstitutionOperationsError('Rate limit reached.',429);out=await post(name);assert.equal(out.response.status,429);privateHeaders(out.response);assert.deepEqual(state.events.filter(e=>e==='auth'||e==='limit'),['auth','limit']);assert.equal(state.calls.length,0);}
  for(const status of [400,403,404,409]){reset();state.serviceError=name==='control'?new PlatformGovernanceError('Allowed domain message.',status):new InstitutionOperationsError('Allowed domain message.',status);out=await post(name);assert.equal(out.response.status,status);privateHeaders(out.response);assert.ok(state.calls.length>0);}
  reset();state.serviceError=Error('PRIVATE_USER_RECORD_DETAIL');out=await post(name);assert.equal(out.response.status,500);privateHeaders(out.response);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);assert.ok(out.logs.length>0);assert.deepEqual(Object.keys(out.logs[0].at(-1)),['type']);
 });
}

test('control: nine actions dispatch once with server actor and original response shape',async()=>{
 for(const[action,method]of Object.entries(controlActions)){
  const out=await valid('control',{text:payload('control',action)});
  assert.deepEqual(state.calls.map(c=>c.name),[method,'controlSnapshot'],action);
  const value=state.calls[0].value;
  assert.equal(method==='submitAtlasForReview'||method==='publishAtlasPublication'?value:value.userId,method==='submitAtlasForReview'||method==='publishAtlasPublication'?'publication-1':'forged-user');
  if(typeof value==='object')assert.equal(value.role,'administrator');
  const json=await out.response.json();assert.deepEqual(json,{snapshot:controlSnapshot,...(action==='issue-embed-launch'?{launch}:{})});
 }
 reset();const out=await post('control',{text:payload('control','unsupported')});assert.equal(out.response.status,404);privateHeaders(out.response);assert.equal(state.calls.length,0);
});
test('readiness: save-check dispatches and unknown action refuses before mutation',async()=>{
 const out=await valid('readiness');assert.deepEqual(state.calls.map(c=>c.name),['saveReadinessCheck','readinessSnapshot']);assert.equal(state.calls[0].value.role,'administrator');assert.deepEqual(await out.response.json(),readinessSnapshot);
 reset();const unknown=await post('readiness',{text:payload('readiness','unsupported')});assert.equal(unknown.response.status,404);privateHeaders(unknown.response);assert.equal(state.calls.length,0);
});
test('readiness: full escaped evidence and owner values fit 24000 bytes',async()=>{
 const text=`{"action":"save-check","evidence":"${'\\ud83d\\ude00'.repeat(1000)}","owner":"${'\\ud83d\\ude00'.repeat(60)}"}`;
 assert.ok(encoder.encode(text).byteLength<limits.readiness);
 await valid('readiness',{text});assert.equal(state.calls[0].value.evidence.length,2000);assert.equal(state.calls[0].value.owner.length,120);
});
test('people: invite dispatches once with server actor and combined snapshot',async()=>{
 const out=await valid('people');assert.deepEqual(state.calls.map(c=>c.name),['createOrganizationInvitations','peopleSnapshot']);assert.equal(state.calls[0].value.role,'administrator');assert.deepEqual(await out.response.json(),{...invitation,snapshot:peopleSnapshot});
 reset();const unknown=await post('people',{text:payload('people','unsupported')});assert.equal(unknown.response.status,404);privateHeaders(unknown.response);assert.equal(state.calls.length,0);
});
test('accept: forwards only input.token and has no action gate or GET',async()=>{
 assert.equal(routes.accept.GET,undefined);
 const out=await valid('accept',{text:JSON.stringify({action:'unsupported',token:'invite-token',userId:'forged-user',role:'administrator'})});
 assert.deepEqual(state.calls,[{name:'acceptOrganizationInvitation',value:'invite-token'}]);assert.deepEqual(await out.response.json(),acceptance);
 const escaped=`{"token":"${'\\ud83d\\ude00'.repeat(40)}"}`;assert.ok(encoder.encode(escaped).byteLength<limits.accept);
 await valid('accept',{text:escaped});assert.equal(state.calls[0].value.length,80);
});
for(const name of ['control','readiness','people'])test(`${name}: GET snapshot and errors remain private`,async()=>{
 reset();let response=await routes[name].GET();assert.equal(response.status,200);privateHeaders(response);assert.equal(state.calls.length,1);
 reset();state.auth=null;response=await routes[name].GET();assert.equal(response.status,401);privateHeaders(response);assert.equal(state.calls.length,0);
 reset();state.serviceError=Error('PRIVATE_USER_RECORD_DETAIL');const old=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{response=await routes[name].GET();}finally{console.error=old;}
 assert.equal(response.status,500);privateHeaders(response);assert.doesNotMatch(await response.text(),/PRIVATE_/);assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_/);assert.ok(logs.length>0);assert.deepEqual(Object.keys(logs[0].at(-1)),['type']);
});
