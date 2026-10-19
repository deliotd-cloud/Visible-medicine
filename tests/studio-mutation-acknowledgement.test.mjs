import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const paths=['app/api/studio/route.ts','lib/mutation-json.ts','lib/request-security.ts','lib/studio-mutation-context.ts'];
const sources=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(site,path),'utf8')]));
const sha=value=>createHash('sha256').update(value).digest('hex');
console.log(JSON.stringify({sourcePins:Object.fromEntries(paths.map(path=>[path,sha(sources[path])])),mode:'actual route and bounded JSON/security helpers; synthetic server-only dependencies'}));

class EducationPlatformError extends Error {constructor(message,status=400){super(message);this.status=status;}}
class InstitutionOperationsError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const actor={userId:'edu:synthetic-server-user',role:'instructor'};
let state;
const actions=[
  ['create-course','createStudioCourse','courseId','course:synthetic'],
  ['update-course','updateStudioCourse','courseId','course:synthetic'],
  ['create-course-from-template','createStudioCourseFromTemplate','courseId','course:synthetic'],
  ['duplicate-course','duplicateStudioCourse','courseId','course:synthetic'],
  ['create-workbook','createStudioWorkbook','workbookId','workbook:synthetic'],
  ['duplicate-workbook','duplicateStudioWorkbook','workbookId','workbook:synthetic'],
  ['create-cohort','createStudioCohort','cohortId','cohort:synthetic'],
  ['assign-cohort-workbook','assignStudioCohortWorkbook',null,null],
  ['save-release','saveCourseReleaseDraft','releaseId','release:synthetic'],
  ['submit-release','submitCourseRelease',null,null],
  ['review-release','reviewCourseRelease',null,null],
  ['publish-release','publishCourseRelease',null,null],
  ['create-invitation','createCourseInvitation','invitationCode','ELV-ABCDEF123456'],
];
const methodNames=actions.map(([,method])=>method);
const seams={EducationPlatformError,InstitutionOperationsError,
  async assertStudioMutationContext(received,expected){assert.equal(received,actor);assert.deepEqual(expected,{actorId:actor.userId,organizationId:'org:synthetic'});},
  async getAuthContext(){state.events.push('auth');return state.auth;},
  async enforceRateLimit(...args){state.events.push('rate');state.rateArgs=args;if(state.rateError)throw state.rateError;},
  async getStudioSnapshot(received){state.events.push('snapshot');assert.equal(received,actor);if(state.snapshotError)throw state.snapshotError;return{syntheticSnapshot:true};},
};
for(const[,method,,value]of actions)seams[method]=async(received,input)=>{
  state.events.push(method);assert.equal(received,actor);state.input=input;
  if(state.mutationError)throw state.mutationError;
  return value;
};
const modules={
  'lib/studio-mutation-context-server':['assertStudioMutationContext'],
  'lib/auth':['getAuthContext'],
  'lib/institution-operations':['InstitutionOperationsError','enforceRateLimit'],
  'lib/education-platform':['EducationPlatformError','getStudioSnapshot',...methodNames],
};
const result=await build({entryPoints:['./app/api/studio/route.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'synthetic-studio-boundary',setup(builder){
  builder.onResolve({filter:/.*/},args=>{
    if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
    const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
    if(modules[key])return{path:key,namespace:'seam'};
    const actual=sources[key]?key:`${key}.ts`;
    if(sources[actual])return{path:actual,namespace:'actual'};
    throw Error(`Unexpected dependency: ${args.path}`);
  });
  builder.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  builder.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${modules[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const module={exports:{}};
new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const route=module.exports;
console.log(JSON.stringify({bundleSha256:sha(result.outputFiles[0].contents)}));

function reset(){state={auth:actor,events:[],rateArgs:undefined,input:undefined,snapshotError:undefined,mutationError:undefined,rateError:undefined};}
function request(input,headers={}){
  return new Request('https://synthetic.invalid/api/studio',{method:'POST',headers:{origin:'https://synthetic.invalid','content-type':'application/json',...headers},body:typeof input==='string'?input:JSON.stringify(input)});
}
async function post(input,headers){const prior=console.error;console.error=()=>{};try{return await route.POST(request(input,headers));}finally{console.error=prior;}}
async function get(){const prior=console.error;console.error=()=>{};try{return await route.GET();}finally{console.error=prior;}}
function noStore(response){assert.equal(response.headers.get('cache-control'),'private, no-store');}
const exactInput=action=>({action,expectedStudioContext:{actorId:actor.userId,organizationId:'org:synthetic'},userId:'body-forged',name:'Synthetic title',courseId:'course:owned',workbookId:'workbook:owned',cohortId:'cohort:owned',releaseId:'release:owned',expectedVersion:4,expectedMaterialRevision:'a'.repeat(64)});

for(const[action,method,key,value]of actions)test(`POST ${action}: exact acknowledgement without snapshot read`,async()=>{
  reset();state.snapshotError=Error('SECRET_SNAPSHOT_ERROR');
  const input=exactInput(action);
  const response=await post(input);
  assert.equal(response.status,200);noStore(response);
  assert.deepEqual(await response.json(),{ok:true,action,...(key?{[key]:value}:{})});
  assert.deepEqual(state.events,['auth','rate',method]);
  assert.deepEqual(state.rateArgs,[actor.userId,'studio-write',45,60]);
  assert.deepEqual(state.input,input);
});

test('GET still authenticates, reads snapshot and keeps private cache policy',async()=>{
  reset();let response=await get();assert.equal(response.status,200);noStore(response);
  assert.deepEqual(await response.json(),{syntheticSnapshot:true});assert.deepEqual(state.events,['auth','snapshot']);
  reset();state.auth=null;response=await get();assert.equal(response.status,401);noStore(response);
  assert.deepEqual(state.events,['auth']);
  reset();state.snapshotError=Error('SECRET_SNAPSHOT_ERROR');response=await get();assert.equal(response.status,500);noStore(response);
  assert.deepEqual(await response.json(),{error:'Studio could not complete this request.'});
  assert.deepEqual(state.events,['auth','snapshot']);
});

test('POST healthy snapshot provider is not consulted',async()=>{
  reset();const response=await post(exactInput('create-course'));
  assert.equal(response.status,200);noStore(response);
  assert.deepEqual(state.events,['auth','rate','createStudioCourse']);
  assert.equal('snapshot'in await response.json(),false);
});

test('POST unauthenticated, rate-limited and unknown actions preserve refusals',async()=>{
  reset();state.auth=null;let response=await post(exactInput('create-course'));
  assert.equal(response.status,401);noStore(response);assert.deepEqual(state.events,['auth']);
  reset();state.rateError=new InstitutionOperationsError('Please wait.',429);
  response=await post(exactInput('create-course'));
  assert.equal(response.status,429);noStore(response);assert.deepEqual(await response.json(),{error:'Please wait.'});
  assert.deepEqual(state.events,['auth','rate']);
  reset();response=await post(exactInput('unknown-action'));
  assert.equal(response.status,404);noStore(response);assert.deepEqual(await response.json(),{error:'Unknown Studio action.'});
  assert.deepEqual(state.events,['auth','rate']);
});

test('POST domain errors and unexpected errors do not leak snapshot or internals',async()=>{
  reset();state.mutationError=new EducationPlatformError('Existing education denial.',403);
  let response=await post(exactInput('create-course'));
  assert.equal(response.status,403);noStore(response);assert.deepEqual(await response.json(),{error:'Existing education denial.'});
  assert.deepEqual(state.events,['auth','rate','createStudioCourse']);
  reset();state.mutationError=Error('SECRET_INTERNAL_ERROR');response=await post(exactInput('create-course'));
  assert.equal(response.status,500);noStore(response);
  assert.deepEqual(await response.json(),{error:'Studio could not complete this request.'});
  assert.deepEqual(state.events,['auth','rate','createStudioCourse']);
});

test('POST actual envelope rejects cross-origin, wrong media, malformed and oversized bodies before authentication',async()=>{
  const cases=[
    ['foreign origin',exactInput('create-course'),{origin:'https://foreign.invalid'},403],
    ['cross-site',exactInput('create-course'),{'sec-fetch-site':'cross-site'},403],
    ['wrong media',exactInput('create-course'),{'content-type':'text/plain'},415],
    ['malformed','{',{},422],
    ['non-object','null',{},422],
    ['oversize',JSON.stringify(exactInput('create-course'))+' '.repeat(48_000),{},413],
  ];
  for(const[label,input,headers,status]of cases){
    reset();const response=await post(input,headers);
    assert.equal(response.status,status,label);noStore(response);
    assert.deepEqual(state.events,[],label);
    assert.equal('snapshot'in await response.json(),false,label);
  }
});
