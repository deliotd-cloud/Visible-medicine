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
const entries={preferences:'app/api/learner/preferences/route.ts',data:'app/api/learner/data/route.ts',pilot:'app/api/institutions/pilot/route.ts',readiness:'app/api/platform/readiness/route.ts',people:'app/api/platform/people/route.ts',accept:'app/api/platform/people/accept/route.ts'};
const paths=[...Object.values(entries),'lib/request-security.ts',...(!baseline?['lib/mutation-json.ts']:[])];
let sources;
if(baseline){
 assert.ok(process.argv[baselineIndex+1],'baseline mode requires --baseline <snapshot.json>');
 const snapshot=JSON.parse(readFileSync(resolve(process.argv[baselineIndex+1]),'utf8'));
 for(const[path,text]of Object.entries(snapshot.sources))assert.equal(sha(text),snapshot.pins[path]);
 sources=Object.fromEntries(paths.map(path=>{assert.ok(snapshot.sources[path],`baseline source missing: ${path}`);return[path,snapshot.sources[path]];}));
}else{
 sources=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(site,path),'utf8')]));
}
console.log(JSON.stringify({mode:baseline?'baseline':'actual',sourcePins:Object.fromEntries(Object.entries(sources).map(([path,text])=>[path,sha(text)])),synthetic:'server auth, institution services/class/limiter and domain sha; actual route/security; no DB'}));
class InstitutionOperationsError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const auth={userId:'synthetic-server-user',role:'synthetic-server-role'};let state;
const seams={InstitutionOperationsError,
 async getAuthContext(){state.events.push('auth');return state.auth;},
 async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
 async sha256(){state.events.push('hash');return'synthetic-sha256-digest-fixture';},
 async exportLearnerData(actor){state.events.push('snapshot');assert.equal(actor,auth);return{requests:[]};},
 async getReadinessSnapshot(actor){state.events.push('snapshot');assert.equal(actor,auth);return{synthetic:true};},
 async getPeopleSnapshot(actor){state.events.push('snapshot');assert.equal(actor,auth);return{synthetic:true};},
};
const mutations=['saveNotificationPreferences','createAccountRequest','submitPilotApplication','saveReadinessCheck','createOrganizationInvitations','acceptOrganizationInvitation'];
for(const name of mutations)seams[name]=async(actor,input)=>{state.events.push('mutation');state.writeMethod=name;assert.equal(actor,auth);state.input=input;return{synthetic:true};};
const modules={'lib/auth':['getAuthContext'],'lib/domain':['sha256'],'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit','exportLearnerData','getReadinessSnapshot','getPeopleSnapshot',...mutations]};
const routes={};
for(const[name,path]of Object.entries(entries)){
 const built=await build({entryPoints:[`./${path}`],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'explicit-synthetic-server-seams',setup(b){
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
 const module={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});routes[name]=module.exports;
 console.log(JSON.stringify({bundle:name,sha256:sha(built.outputFiles[0].contents)}));
}
const actions={preferences:'save',data:'export',pilot:'submit',readiness:'save-check',people:'invite',accept:'accept'};
const scopes={preferences:['notification-preferences',12,60],data:['account-request',6,3600],pilot:['pilot-application',5,3600],readiness:['readiness-write',30,60],people:['institution-people',12,60],accept:['accept-organization-invitation',8,300]};
const generic={preferences:'Preferences could not be saved.',data:'The learner-data request could not be completed.',pilot:'The pilot brief could not be recorded.',readiness:'Readiness evidence could not be updated.',people:'The institution roster could not be updated.',accept:'The invitation could not be accepted.'};
const streamed=new Set(['preferences','data','pilot','readiness','people','accept']);
function reset(){state={auth,events:[],reads:0};}
function request(name,headers={}){
 const req=new Request('https://synthetic.invalid/api',{method:'POST',body:JSON.stringify({action:actions[name],token:'synthetic-token',userId:'body-forged'}),headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 const real=req.json.bind(req);req.json=async()=>{state.reads++;state.events.push('parse');return real();};
 if(!baseline&&streamed.has(name)&&req.body){
  const getReader=req.body.getReader.bind(req.body);
  req.body.getReader=()=>{const reader=getReader();let recorded=false;return{
   read(){if(!recorded){state.reads++;state.events.push('parse');recorded=true;}return reader.read();},
   cancel:reader.cancel.bind(reader),releaseLock:reader.releaseLock.bind(reader),
  };};
 }
 return req;
}
async function invoke(name,headers){const logs=[];const previous=console.error;console.error=(...args)=>logs.push(args);try{return{response:await routes[name].POST(request(name,headers)),logs};}finally{console.error=previous;}}
function beforeMutation(name){const parsed=!baseline&&streamed.has(name);assert.deepEqual(state.events,parsed?['parse','auth','rate']:['auth','rate']);assert.equal(state.reads,parsed?1:0);assert.equal(state.writeMethod,undefined);assert.deepEqual(state.rateArgs[0],auth.userId);}
if(baseline){
 for(const name of Object.keys(routes))test(`baseline ${name}: failures lack private cache headers; unexpected log carries raw error`,async()=>{
  for(const[status,error]of [[429,new InstitutionOperationsError('Please wait.',429)],[500,new InstitutionOperationsError('Known database refusal.',500)],[500,new Error('SECRET_SYNTHETIC_TOKEN')]]){
   reset();state.rateError=error;const{response,logs}=await invoke(name);assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),null);beforeMutation(name);
   if(!(error instanceof InstitutionOperationsError)){assert.equal(logs.length,1);assert.equal(logs[0][1],error);assert.equal(logs[0][1].message,'SECRET_SYNTHETIC_TOKEN');}
   console.log(JSON.stringify({baselineNegative:name,status,cacheControl:null,rawErrorLogged:logs.length>0,parse:false,serviceWrite:false}));
  }
 });
}else{
 for(const name of Object.keys(routes)){
  test(`${name}: limiter429 stays429 private/no-store before mutation`,async()=>{
   reset();state.rateError=new InstitutionOperationsError('Please wait.',429);const{response,logs}=await invoke(name);assert.equal(response.status,429);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),{error:'Please wait.'});assert.equal(logs.length,0);beforeMutation(name);
  });
  test(`${name}: known limiter500 preserved private/no-store`,async()=>{
   reset();state.rateError=new InstitutionOperationsError('Known database refusal.',500);const{response}=await invoke(name);assert.equal(response.status,500);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),{error:'Known database refusal.'});beforeMutation(name);
  });
  test(`${name}: unexpected secret500 redacted and logged by type only`,async()=>{
   reset();state.rateError=new Error('SECRET_SYNTHETIC_TOKEN');const{response,logs}=await invoke(name);assert.equal(response.status,500);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),{error:generic[name]});assert.equal(logs.length,1);assert.deepEqual(logs[0][1],{type:'Error'});beforeMutation(name);
  });
  test(`${name}: authenticated success preserves actor/order/rate parameters`,async()=>{
   reset();const{response}=await invoke(name);assert.equal(response.status,name==='pilot'?201:200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(state.rateArgs,[auth.userId,...scopes[name]]);assert.deepEqual(state.events,[...(streamed.has(name)?['parse','auth','rate']:['auth','rate','parse']),'mutation',...(['data','readiness','people'].includes(name)?['snapshot']:[])]);assert.equal(state.writeMethod,mutations[Object.keys(routes).indexOf(name)]);if(name==='accept')assert.equal(state.input,'synthetic-token');else assert.equal(state.input.userId,'body-forged');
  });
 }
 test('pilot direct415/413 failures also private/no-store before auth',async()=>{
  for(const[headers,status]of [[{'content-type':'text/plain'},415],[{'content-length':'24001'},413]]){reset();const{response}=await invoke('pilot',headers);assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(state.events,[]);}
 });
}
