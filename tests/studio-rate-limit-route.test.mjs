import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const separator=process.argv.indexOf('--');
const site=separator>=0&&process.argv[separator+1]?resolve(process.argv[separator+1]):resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseline=process.argv.includes('--baseline');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const paths={studio:'app/api/studio/route.ts',lecture:'app/api/studio/workbooks/[workbook_id]/lecture/route.ts'};
const sources={};
for(const path of [...Object.values(paths),'lib/lecture-api.ts','lib/request-security.ts',...(!baseline?['lib/mutation-json.ts']:[])]) {
 const bytes=baseline?execFileSync('git',['-C',site,'show',`7c46160:${path}`]):readFileSync(resolve(site,path));
 sources[path]=bytes.toString('utf8');
 if(!process.argv.includes('--snapshot'))console.log(JSON.stringify({source:path,baseline,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}));
}
if(process.argv.includes('--snapshot')){console.log(JSON.stringify({baseline:'7c46160af0c7901b9eda48e9d770d6b86a5a16de',sources},null,2));process.exit(0);}
class InstitutionOperationsError extends Error {constructor(message,status=400){super(message);this.status=status;}}
class EducationPlatformError extends Error {constructor(message,status=400){super(message);this.status=status;}}
class EducationApiError extends Error {constructor(message,status=400){super(message);this.status=status;}}
class LectureError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const auth={userId:'synthetic-server-user',role:'synthetic-instructor'};
let state;
const seams={InstitutionOperationsError,EducationPlatformError,EducationApiError,LectureError,
 async getAuthContext(){state.calls.push('auth');return state.auth;},
 async authenticateEducationApi(){state.calls.push('auth');if(!state.auth)throw new EducationApiError('Education sign-in is required.',401);return state.auth;},
 async enforceRateLimit(...args){state.calls.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
 async getStudioSnapshot(actor){state.calls.push('snapshot');assert.equal(actor,auth);return {synthetic:true};},
 async getLectureStudio(actor){state.calls.push('snapshot');assert.equal(actor,auth);return {synthetic:true};},
 async mutateLecture(actor,id,input){state.calls.push('mutation');assert.equal(actor,auth);assert.equal(id,'synthetic-workbook');state.input=input;if(state.mutationError)throw state.mutationError;return {synthetic:true};},
};
const methods=['createCourseInvitation','assignStudioCohortWorkbook','createStudioCohort','createStudioCourse','createStudioCourseFromTemplate','createStudioWorkbook','duplicateStudioCourse','duplicateStudioWorkbook','publishCourseRelease','reviewCourseRelease','saveCourseReleaseDraft','submitCourseRelease'];
for(const method of methods)seams[method]=async(actor,input)=>{state.calls.push('mutation');assert.equal(actor,auth);state.input=input;if(state.mutationError)throw state.mutationError;return 'synthetic-created';};
const seamModules={
 'lib/auth':['getAuthContext'],
 'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
 'lib/education-platform':['EducationPlatformError','getStudioSnapshot',...methods],
 'lib/education-api':['EducationApiError','authenticateEducationApi'],
 'lib/lecture-repository':['LectureError','getLectureStudio','mutateLecture'],
};
const routes={};
for(const [name,path]of Object.entries(paths)){
 const built=await build({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
  name:'explicit-synthetic-server-seams',setup(b){
   b.onResolve({filter:/.*/},args=>{
    if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
    const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
    if(seamModules[key])return{path:key,namespace:'seam'};
    if(sources[key]||sources[`${key}.ts`])return{path:sources[key]?key:`${key}.ts`,namespace:'actual'};
    throw Error(`Unexpected dependency ${args.path}`);
   });
   b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
   b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamModules[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
  }
 }]});
 const module={exports:{}};
 new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
 routes[name]=module.exports;
 console.log(JSON.stringify({bundle:name,sha256:createHash('sha256').update(built.outputFiles[0].contents).digest('hex'),syntheticSeams:Object.keys(seamModules),actualHelpers:name==='lecture'?['lib/lecture-api.ts','lib/request-security.ts']:baseline?[]:['lib/mutation-json.ts','lib/request-security.ts']}));
}
function reset(){state={auth,calls:[],reads:0};}
function request(name,body='{"action":"create-course","userId":"body-forged"}',headers={}){
 const req=new Request('https://synthetic.invalid/api',{method:'POST',body,headers:{'content-type':'application/json',origin:'https://synthetic.invalid',...headers}});
 if(name==='studio'&&baseline){const real=req.json.bind(req);req.json=async()=>{state.reads++;return real();};}
 else{const reader=req.body.getReader.bind(req.body);req.body.getReader=()=>{state.reads++;return reader();};}
 return req;
}
const context={params:Promise.resolve({workbook_id:'synthetic-workbook'})};
async function invoke(name,req=request(name)){
 const logs=[];const previous=console.error;console.error=(...args)=>logs.push(args);
 try{return{response:await routes[name].POST(req,context),logs};}finally{console.error=previous;}
}
if(baseline){
 for(const name of Object.keys(routes))test(`baseline actual ${name} InstitutionOperationsError 429 becomes 500`,async()=>{
  reset();state.rateError=new InstitutionOperationsError('Please wait.',429);
  const {response}=await invoke(name);assert.equal(response.status,500);
  assert.deepEqual(state.calls,['auth','rate']);assert.equal(state.reads,name==='studio'?1:0);
  console.log(JSON.stringify({baselineNegative:name,actualStatus:response.status,requiredStatus:429,cacheControl:response.headers.get('cache-control'),parserReads:state.reads,mutation:false,snapshot:false}));
 });
}else{
 for(const name of Object.keys(routes)){
  test(`${name}: rate429 before services; lecture before actual parser`,async()=>{
   reset();state.rateError=new InstitutionOperationsError('Please wait.',429);
   const {response}=await invoke(name);assert.equal(response.status,429);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),{error:'Please wait.'});
   assert.deepEqual(state.calls,['auth','rate']);assert.equal(state.reads,name==='studio'?1:0);
  });
  test(`${name}: known rate500 stays private/no-store and blocks services`,async()=>{
   reset();state.rateError=new InstitutionOperationsError('The request limit could not be checked.',500);
   const {response}=await invoke(name);assert.equal(response.status,500);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),{error:'The request limit could not be checked.'});assert.deepEqual(state.calls,['auth','rate']);
  });
  test(`${name}: unexpected secret error returns redacted private500`,async()=>{
   reset();state.rateError=new Error('SECRET_SYNTHETIC_TOKEN');
   const {response,logs}=await invoke(name);assert.equal(response.status,500);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.doesNotMatch(await response.text(),/SECRET_SYNTHETIC_TOKEN/);assert.equal(logs.length,1);assert.deepEqual(logs[0][1],{type:'Error'});assert.deepEqual(state.calls,['auth','rate']);
  });
  test(`${name}: existing domain error preserved`,async()=>{
   reset();state.mutationError=name==='studio'?new EducationPlatformError('Existing education denial.',403):new LectureError('Existing lecture denial.',409);
   const {response}=await invoke(name);assert.equal(response.status,name==='studio'?403:409);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(await response.json(),{error:state.mutationError.message});assert.ok(!state.calls.includes('snapshot'));
  });
  test(`${name}: authenticated success uses server actor`,async()=>{
   reset();const {response}=await invoke(name);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(state.rateArgs,['synthetic-server-user','studio-write',45,60]);assert.ok(state.calls.includes('mutation'));assert.equal(state.input.userId,'body-forged');assert.equal(state.reads,1);
  });
  test(`${name}: authentication401 refuses rate and mutation`,async()=>{
   reset();state.auth=null;const {response}=await invoke(name);assert.equal(response.status,401);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(state.calls,['auth']);assert.equal(state.reads,name==='studio'?1:0);
  });
 }
 test('lecture actual parser/security existing errors retained',async()=>{
  for(const [body,headers,status]of [['{}',{origin:'https://foreign.invalid'},403],['{}',{'content-type':'text/plain'},415],['{',{},422]]){
   reset();const{response}=await invoke('lecture',request('lecture',body,headers));assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(state.calls,['auth','rate']);
  }
 });
}
