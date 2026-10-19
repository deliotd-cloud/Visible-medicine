import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url),source=readFileSync(new URL('../app/api/platform/report/route.ts',import.meta.url),'utf8');
class InstitutionOperationsError extends Error {status:number;constructor(message:string,status:number){super(message);this.status=status;}}
const actualUser={userId:'synthetic-verified-staff',email:'staff@example.invalid',displayName:'Synthetic educator',fullName:null};
let user:typeof actualUser|null=null,calls:unknown[]=[],failure:Error|null=null;
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{} as {GET:()=>Promise<Response>}};
new Function('require','module','exports',code)((id:string)=>{
 if(id==='@/app/chatgpt-auth')return{getChatGPTUser:async()=>user};
 if(id==='@/lib/institution-operations')return{InstitutionOperationsError,institutionProgressCsv:async(auth:unknown)=>{calls.push(auth);if(failure)throw failure;return 'Learner,Completion\r\nSynthetic,50';}};
 if(id==='@/lib/auth')throw Error('Report must not import the demo fallback');
 return require(id);
},module,module.exports);

function privateResponse(response:Response){assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
test('anonymous report export rejects before the reporting service, including local development',async()=>{
 const previous=Object.getOwnPropertyDescriptor(process.env,'NODE_ENV');
 try{for(const environment of ['development','test','production']){
  Object.defineProperty(process.env,'NODE_ENV',{value:environment,writable:true,enumerable:true,configurable:true});user=null;calls=[];failure=null;
  const response=await module.exports.GET();privateResponse(response);assert.equal(response.status,401);
  assert.deepEqual(calls,[]);assert.deepEqual(await response.json(),{error:'Education sign-in is required.'});assert.equal(response.headers.get('content-disposition'),null);
 }}finally{if(previous===undefined)Reflect.deleteProperty(process.env,'NODE_ENV');else Object.defineProperty(process.env,'NODE_ENV',previous);}
 assert.doesNotMatch(source,/getAuthContext|local-demo-user|local:demo-user/);
});
test('reporting receives only the verified server identity and retains CSV download semantics',async()=>{
 user=actualUser;calls=[];failure=null;const response=await module.exports.GET();privateResponse(response);
 assert.equal(response.status,200);assert.deepEqual(calls,[{userId:'edu:'+actualUser.userId,externalSubject:'sites:'+actualUser.userId,email:actualUser.email,displayName:actualUser.displayName}]);
 assert.equal(response.headers.get('content-type'),'text/csv; charset=utf-8');assert.match(response.headers.get('content-disposition')!,/^attachment; filename="visible-medicine-progress-\d{4}-\d{2}-\d{2}\.csv"$/);
 const bytes=new Uint8Array(await response.arrayBuffer());assert.deepEqual([...bytes.slice(0,3)],[239,187,191]);assert.equal(new TextDecoder().decode(bytes),'Learner,Completion\r\nSynthetic,50');
});
test('existing administrator and organization service refusals remain authoritative and uncached',async()=>{
 for(const status of [401,403]){user=actualUser;calls=[];failure=new InstitutionOperationsError('Access denied.',status);
  const response=await module.exports.GET();privateResponse(response);assert.equal(response.status,status);assert.equal(calls.length,1);
  assert.deepEqual(await response.json(),{error:'Access denied.'});assert.equal(response.headers.get('content-disposition'),null);
 }
});
test('unexpected service failures disclose no learner details in response or error log',async()=>{
 user=actualUser;calls=[];failure=new Error('SENSITIVE_SYNTHETIC_REPORT_DETAIL');const logged:unknown[][]=[];const previous=console.error;console.error=(...args)=>logged.push(args);
 try{const response=await module.exports.GET();privateResponse(response);assert.equal(response.status,500);assert.deepEqual(await response.json(),{error:'The report could not be generated.'});assert.equal(calls.length,1);assert.doesNotMatch(JSON.stringify(logged),/SENSITIVE_SYNTHETIC_REPORT_DETAIL/);assert.deepEqual(logged,[['Institution report error',{type:'Error'}]]);}finally{console.error=previous;failure=null;}
});
