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
const snapshot=baselineAt<0?null:JSON.parse(readFileSync(resolve(process.argv[baselineAt+1]),'utf8'));
if(snapshot)for(const[path,source]of Object.entries(snapshot.sources))assert.equal(sha(source),snapshot.pins[path],`baseline pin ${path}`);
const paths=['app/api/app/route.ts','app/api/learner/portfolio/route.ts','lib/mutation-json.ts','lib/request-security.ts','lib/learner-portfolio-pagination.ts'];
const sources=Object.fromEntries(paths.filter(path=>!snapshot||snapshot.sources[path]).map(path=>[path,snapshot?snapshot.sources[path]:readFileSync(resolve(site,path),'utf8')]));
console.log(JSON.stringify({mode:snapshot?'pinned-before':'actual',sources:Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,sha(s)])),seams:'synthetic auth/repository/governance; no DB or HTTP'}));

class DomainError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class PlatformGovernanceError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'server-user',role:'learner'};
let state;
function reset(){state={auth:actor,events:[],reads:0,cancels:0,releases:0,pulls:0};}
const appActions={
 'save-answer':'saveAnswer','add-annotation':'addAnnotation','add-key-image':'addKeyImage','set-case-flag':'setCaseFlag',
 'submit-attempt':'submitAttempt','finalize-timed-attempt':'finalizeTimedAttempt','create-ingestion':'createIngestion',
 'review-ingestion':'reviewIngestion','assign-workbook':'assignWorkbook','revoke-workbook-assignment':'revokeWorkbookAssignment',
 'create-cohort':'createCohort','add-cohort-member':'addCohortMember','remove-cohort-member':'removeCohortMember',
 'assign-cohort-workbook':'assignCohortWorkbook','revoke-cohort-workbook-assignment':'revokeCohortWorkbookAssignment',
 'record-workbook-progress':'recordWorkbookProgress','request-accommodation':'requestAccommodation',
 'approve-accommodation':'approveAccommodation','revoke-accommodation':'revokeAccommodation',
 'record-display-launch':'recordDisplayLaunch','record-exam-preflight':'recordExamPreflight',
 'save-mark':'saveMark','moderate-mark':'moderateMark','release-result':'releaseResult',
};
const authoring=['create-workbook','update-workbook-draft','clone-workbook','create-assessment-recovery-draft','convert-teaching-to-exam','publish-workbook','request-workbook-review','review-workbook','delete-workbook-draft','retire-published-workbook'];
const portfolioActions={'save-note':'saveLearnerNote','schedule-review':'scheduleLearnerReview','complete-review':'completeLearnerReview'};
const seams={DomainError,PlatformGovernanceError,
 async getAuthContext(){state.events.push('auth');return state.auth;},
 async getAppSnapshot(a,id){state.events.push('app-snapshot');assert.equal(a,actor);state.selected=id;return{kind:'app',selected:id??null};},
 async getLearnerPortfolio(a){state.events.push('portfolio-snapshot');assert.equal(a,actor);return{kind:'portfolio'};},
};
for(const method of Object.values(appActions))seams[method]=async(a,body)=>{state.events.push(method);state.input=body;assert.equal(a,actor);if(state.downstreamError)throw state.downstreamError;};
for(const method of Object.values(portfolioActions))seams[method]=async(a,value)=>{state.events.push(method);state.input=value;assert.equal(a,actor);if(state.downstreamError)throw state.downstreamError;};
const modules={
 'lib/auth':['getAuthContext'],
 'lib/repository':['DomainError','getAppSnapshot',...Object.values(appActions)],
 'lib/platform-governance':['PlatformGovernanceError','getLearnerPortfolio','getLearnerPortfolioPage',...Object.values(portfolioActions)],
};
const routes={};
for(const[name,path]of Object.entries({app:'app/api/app/route.ts',portfolio:'app/api/learner/portfolio/route.ts'})){
 const result=await build({entryPoints:[`./${path}`],bundle:true,metafile:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'synthetic-runtime-seams',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
   const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
   if(modules[key])return{path:key,namespace:'seam'};
   const actual=sources[key]?key:`${key}.ts`;
   if(sources[actual])return{path:actual,namespace:'actual'};
   throw Error(`Unexpected dependency ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${modules[args.path].map(n=>`export const ${n}=seams.${n};`).join('\n')}`,loader:'js'}));
 }}]});
 const included=Object.keys(result.metafile.inputs);
 assert.ok(included.some(p=>p.endsWith(path)),`actual ${name} route included`);
 if(!snapshot)for(const dependency of ['lib/mutation-json.ts','lib/request-security.ts'])
  assert.ok(included.some(p=>p.endsWith(dependency)),`actual ${name} bundle missing ${dependency}`);
 const module={exports:{}};
 new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
 routes[name]=module.exports;
 console.log(JSON.stringify({route:name,bundleSha256:sha(result.outputFiles[0].contents),included}));
}

const limits={app:64_000,portfolio:12_000};
const encoder=new TextEncoder();
const payload=(name,action=name==='app'?'save-answer':'save-note')=>JSON.stringify({action,userId:'forged-body-user',role:'administrator',name:'é😀',selectedWorkbookId:'chosen-workbook',reviewId:'review-1'});
function request(name,{text=payload(name),chunks,headers={},noBody=false,cancelThrows=false,readThrows=false}={}){
 let index=0;const pieces=chunks??[encoder.encode(text)];
 const body=noBody?undefined:new ReadableStream({pull(controller){state.pulls++;if(readThrows){controller.error(Error('PRIVATE_STREAM_DETAIL'));return;}if(index===pieces.length)controller.close();else controller.enqueue(pieces[index++]);},cancel(){if(cancelThrows)throw Error('PRIVATE_CANCEL_DETAIL');}},{highWaterMark:0});
 const req=new Request(`https://synthetic.invalid/api/${name}`,{method:'POST',body,duplex:'half',headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(req.body){const getReader=req.body.getReader.bind(req.body);req.body.getReader=()=>{const reader=getReader();return{async read(){state.reads++;state.events.push('read');return reader.read();},async cancel(){state.cancels++;return reader.cancel();},releaseLock(){state.releases++;state.events.push('release');return reader.releaseLock();}};};}
 return req;
}
async function post(name,options){const req=request(name,options);const old=console.error;const logs=[];console.error=(...args)=>logs.push(args);try{return{response:await routes[name].POST(req),req,logs};}finally{console.error=old;}}
function privateHeaders(response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
async function refused(name,options,status,{allowAuth=false}={}){
 reset();const out=await post(name,options);assert.equal(out.response.status,status);privateHeaders(out.response);
 assert.ok(!state.events.some(e=>e in seams&&e!=='getAuthContext'),`downstream before refusal: ${state.events}`);
 if(!allowAuth)assert.ok(!state.events.includes('auth'),`auth before refusal: ${state.events}`);
 assert.equal(out.req.body?.locked??false,false);
 if(out.req.body){assert.equal(state.cancels,1);assert.equal(state.releases,1);}
 return out;
}
const mutationNames=new Set([...Object.values(appActions),...Object.values(portfolioActions)]);
function noDownstream(){assert.ok(!state.events.some(e=>mutationNames.has(e)||e.endsWith('snapshot')),`unexpected service: ${state.events}`);}

for(const name of Object.keys(routes)){
 test(`${name}: missing, forged and understated lengths enforce actual streamed byte cap`,async()=>{
  for(const length of [undefined,'1','bad','-1']){
   const headers=length===undefined?{}:{'content-length':length};
   await refused(name,{chunks:[encoder.encode(payload(name)),encoder.encode(' '.repeat(limits[name])),encoder.encode('unread-tail')],headers},413);
   assert.equal(state.reads,2);noDownstream();
  }
 });
 test(`${name}: exact UTF8 byte boundary succeeds; one extra byte refuses`,async()=>{
  const first=encoder.encode(payload(name));const pad=new Uint8Array(limits[name]-first.byteLength).fill(32);
  reset();let out=await post(name,{chunks:[first,pad],headers:{'content-length':'0'}});
  assert.equal(out.response.status,200);privateHeaders(out.response);assert.equal(state.releases,1);assert.equal(state.cancels,0);assert.equal(out.req.body.locked,false);
  assert.equal(state.input.name,'é😀');assert.equal(state.input.userId,'forged-body-user');
  await refused(name,{chunks:[first,pad,new Uint8Array([32])]},413);noDownstream();
 });
 test(`${name}: cross-site, foreign and malformed origins refuse before auth`,async()=>{
  for(const headers of [{'sec-fetch-site':'cross-site'},{origin:'https://foreign.invalid'},{origin:'not-an-origin'}]){
   await refused(name,{headers},403);assert.equal(state.reads,0);noDownstream();
  }
 });
 test(`${name}: exact JSON media type accepts parameters and refuses prefixes`,async()=>{
  for(const type of ['application/json-evil','application/jsonp','text/plain','']){
   await refused(name,{headers:{'content-type':type}},415);assert.equal(state.reads,0);noDownstream();
  }
  reset();const out=await post(name,{headers:{'content-type':'Application/JSON; charset=utf-8'}});assert.equal(out.response.status,200);privateHeaders(out.response);
 });
 test(`${name}: malformed, non-object, absent and fatal UTF8 bodies refuse before auth`,async()=>{
  for(const text of ['{','null','[]','true','1','"string"','']){await refused(name,{text},422);noDownstream();}
  await refused(name,{noBody:true},422);noDownstream();
  await refused(name,{chunks:[encoder.encode('{"action":"'),new Uint8Array([0xff]),encoder.encode('"}')]},422);noDownstream();
  await refused(name,{chunks:[encoder.encode('{"action":"'),new Uint8Array([0xe2,0x82])]},422);noDownstream();
 });
 test(`${name}: split multibyte payload and no-Origin policy retain authenticated dispatch`,async()=>{
  reset();const chunks=Array.from(encoder.encode(payload(name)),byte=>new Uint8Array([byte]));
  let out=await post(name,{chunks});assert.equal(out.response.status,200);privateHeaders(out.response);
  assert.ok(state.events.indexOf('release')<state.events.indexOf('auth'));assert.equal(state.input.name,'é😀');assert.equal(state.input.role,'administrator');
  assert.equal(state.events.filter(e=>mutationNames.has(e)).length,1);
  reset();const req=request(name);req.headers.delete('origin');out={response:await routes[name].POST(req)};assert.equal(out.response.status,200);privateHeaders(out.response);
 });
 test(`${name}: declared oversize, cancellation and read errors release stream without detail leak`,async()=>{
  await refused(name,{headers:{'content-length':String(limits[name]+1)}},413);assert.equal(state.reads,0);
  let out=await refused(name,{chunks:[new Uint8Array(limits[name]+1)],cancelThrows:true},413);
  assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
  out=await refused(name,{readThrows:true},422);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
 });
 test(`${name}: absent identity and unknown action preserve 401/404 boundaries`,async()=>{
  reset();state.auth=null;let out=await post(name);assert.equal(out.response.status,401);privateHeaders(out.response);noDownstream();
  reset();out=await post(name,{text:'{"action":"not-supported"}'});assert.equal(out.response.status,404);privateHeaders(out.response);noDownstream();
 });
 test(`${name}: GET and error responses are private and suppress unexpected details`,async()=>{
  reset();let response=await routes[name].GET(new Request(`https://synthetic.invalid/api/${name}?workbookId=from-query`));assert.equal(response.status,200);privateHeaders(response);
  if(name==='app')assert.equal(state.selected,'from-query');
  reset();state.auth=null;response=await routes[name].GET(new Request(`https://synthetic.invalid/api/${name}`));assert.equal(response.status,401);privateHeaders(response);
  reset();state.downstreamError=Error('PRIVATE_USER_RECORD_DETAIL');const out=await post(name);
  assert.equal(out.response.status,500);privateHeaders(out.response);assert.doesNotMatch(await out.response.text(),/PRIVATE_/);
  assert.doesNotMatch(JSON.stringify(out.logs),/PRIVATE_/);
 });
}
test('app: every existing action dispatches once with server actor and selected workbook',async()=>{
 for(const[action,method]of Object.entries(appActions)){
  reset();const out=await post('app',{text:payload('app',action)});assert.equal(out.response.status,200,action);privateHeaders(out.response);
  assert.deepEqual(state.events.filter(e=>mutationNames.has(e)),[method]);assert.equal(state.selected,'chosen-workbook');
  assert.equal(state.input.userId,'forged-body-user');
 }
});
test('app: authoring guard retains 409 before mutation and snapshot',async()=>{
 for(const action of authoring){reset();const out=await post('app',{text:payload('app',action)});assert.equal(out.response.status,409,action);privateHeaders(out.response);noDownstream();}
});
test('portfolio: all three actions dispatch once using server actor',async()=>{
 for(const[action,method]of Object.entries(portfolioActions)){
  reset();const out=await post('portfolio',{text:payload('portfolio',action)});assert.equal(out.response.status,200,action);privateHeaders(out.response);
  assert.deepEqual(state.events.filter(e=>mutationNames.has(e)),[method]);assert.equal(state.events.filter(e=>e==='portfolio-snapshot').length,1);
  if(action!=='complete-review')assert.equal(state.input.userId,'forged-body-user');else assert.equal(state.input,'review-1');
 }
});
test('app and portfolio retain downstream 403 and 404 without exposing private details',async()=>{
 for(const name of Object.keys(routes))for(const status of [403,404]){
  reset();state.downstreamError=name==='app'?new DomainError('Forbidden education record.',status):new PlatformGovernanceError('Forbidden learner record.',status);
  const out=await post(name);assert.equal(out.response.status,status);privateHeaders(out.response);assert.equal(state.events.filter(e=>mutationNames.has(e)).length,1);
 }
});
