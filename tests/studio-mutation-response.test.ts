import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const source=readFileSync(process.env.STUDIO_FORMS_SOURCE??new URL('../components/StudioForms.tsx',import.meta.url),'utf8');
console.log(JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),mode:'actual internal postStudio; synthetic fetch only'}));
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{} as {postStudio:(payload:Record<string,unknown>,context?:{actorId:string;organizationId:string})=>Promise<Record<string,unknown>>}};
new Function('require','module','exports',code+'\nmodule.exports.postStudio=postStudio;')((id:string)=>id==='next/navigation'?{}:id==='@/lib/studio-templates'?{STUDIO_COURSE_TEMPLATES:[]}:require(id),module,module.exports);
const actions=[
 ['create-course','courseId','new-course'],['update-course','courseId','owned-course'],['create-course-from-template','courseId','new-course'],['duplicate-course','courseId','new-course'],
 ['create-workbook','workbookId','new-workbook'],['duplicate-workbook','workbookId','new-workbook'],['create-cohort','cohortId','new-cohort'],['save-release','releaseId','owned-release'],
 ['create-invitation','invitationCode','ELV-ABCDEF123456'],['assign-cohort-workbook',null,null],['submit-release',null,null],['review-release',null,null],['publish-release',null,null],
] as const;
const guardedActions=new Set(['create-course','update-course','create-course-from-template','create-workbook','save-release','duplicate-course','duplicate-workbook','create-invitation','create-cohort','assign-cohort-workbook','submit-release','review-release','publish-release']);
const trustedScope={actorId:'edu:synthetic-editor',organizationId:'synthetic-school'};
const uncertain=/could not confirm whether this save completed|could not confirm this save/i;
function post(input:Record<string,unknown>){return guardedActions.has(String(input.action))?module.exports.postStudio(input,trustedScope):module.exports.postStudio(input);}
const payload=(action:string)=>({action,courseId:'owned-course',releaseId:action==='save-release'?'owned-release':'other-release'});
async function withResponse(body:unknown,fn:(requests:Array<{url:unknown;init:RequestInit}>)=>Promise<void>,ok=true,status=200,jsonThrows=false){
 const original=globalThis.fetch,requests:Array<{url:unknown;init:RequestInit}>=[];
 globalThis.fetch=(async(url,init)=>{requests.push({url,init:init!});
  if(url==='/api/studio?mutationContext=1')return{ok:true,status:200,json:async()=>({ok:true,action:'verify-studio-mutation-context'})} as Response;
  assert.equal(url,'/api/studio');return{ok,status,json:async()=>{if(jsonThrows)throw Error('PRIVATE_PARSE_DETAIL');return body;}} as Response;
 }) as typeof fetch;
 try{await fn(requests);}finally{globalThis.fetch=original;}
}
function assertWire(requests:Array<{url:unknown;init:RequestInit}>,input:Record<string,unknown>){
 const guarded=guardedActions.has(String(input.action));
 assert.equal(requests.length,guarded?3:1,'one POST, with before/after GET only when guarded');
 const postRequest=requests[guarded?1:0];assert.equal(postRequest.url,'/api/studio');assert.equal(postRequest.init.method,'POST');
 assert.deepEqual(JSON.parse(String(postRequest.init.body)),guarded?{...input,expectedStudioContext:trustedScope}:input);
 if(guarded)for(const index of [0,2]){
  assert.equal(requests[index].url,'/api/studio?mutationContext=1');assert.equal(requests[index].init.method,'GET');
  assert.equal((requests[index].init.headers as Record<string,string>)['X-Studio-Mutation-Context'],JSON.stringify(trustedScope));
 }
}
for(const[action,key,value]of actions){
 const acknowledgement={ok:true,action,...(key?{[key]:value}:{})};
 test(`${action}: accepts exact acknowledgement and sends one unchanged POST`,async()=>{
  await withResponse(acknowledgement,async requests=>{
   assert.deepEqual(await post(payload(action)),acknowledgement);
   assertWire(requests,payload(action));
  });
 });
 test(`${action}: missing, wrong or contradictory acknowledgement never succeeds or auto-retries`,async()=>{
  for(const body of [{},null,[],true,'saved',{...acknowledgement,ok:false},{...acknowledgement,ok:'true'},{...acknowledgement,action:'other-action'},{...acknowledgement,error:'Actually failed'},{...acknowledgement,error:null}]){
   await withResponse(body,async requests=>{await assert.rejects(post(payload(action)),uncertain);assertWire(requests,payload(action));});
  }
 });
 if(key)test(`${action}: requires a usable action-specific result`,async()=>{
  for(const value of [undefined,null,1,{},[],true,'',' ',' padded ','x'.repeat(201),'bad\nvalue','bad\u007fvalue']){
   await withResponse({...acknowledgement,[key]:value},async()=>{await assert.rejects(post(payload(action)),uncertain);});
  }
 });
}
test('update-course and existing release save reject another item identity',async()=>{
 for(const[action,key]of [['update-course','courseId'],['save-release','releaseId']] as const){
  await withResponse({ok:true,action,[key]:'another-item'},async()=>{await assert.rejects(post(payload(action)),uncertain);});
 }
});
test('new release receives its new id rather than requiring an absent previous id',async()=>{
 await withResponse({ok:true,action:'save-release',releaseId:'release:new'},async requests=>{const input={action:'save-release',releaseId:''};const result=await post(input);assert.equal(result.releaseId,'release:new');assertWire(requests,input);});
});
test('invitation needs the complete generated one-time code',async()=>{
 for(const invitationCode of ['ELV','ELV-ABCDEF','ELV-ABCDEF1234567','ELV-abcdef123456','OTHER-ABCDEF123456']){
  await withResponse({ok:true,action:'create-invitation',invitationCode},async()=>{await assert.rejects(post(payload('create-invitation')),uncertain);});
 }
});
test('invalid JSON success is uncertain, not a success or an automatic retry',async()=>{
 await withResponse(null,async requests=>{const input=payload('create-course');await assert.rejects(post(input),uncertain);assertWire(requests,input);},true,200,true);
});
test('guarded explicit 4xx retain status while ambiguous 408 and 5xx require reconciliation',async()=>{
 for(const status of [401,403,409,422,429])for(const body of [{error:'Exact safe failure'},null,[],{error:42}]){
  await withResponse(body,async requests=>{const input=payload('update-course');await assert.rejects(post(input),(error:Error&{status?:number})=>{assert.equal(error.status,status);assert.equal(error.message,(body as any)?.error==='Exact safe failure'?'Exact safe failure':'Studio could not complete this action.');return true;});assertWire(requests,input);},false,status);
 }
 for(const status of [408,500,503])await withResponse({error:'PRIVATE_SERVER_DETAIL'},async requests=>{const input=payload('update-course');await assert.rejects(post(input),(error:Error&{status?:number})=>{assert.match(error.message,/could not confirm whether this save completed/i);assert.doesNotMatch(error.message,/PRIVATE_SERVER_DETAIL/);assert.equal(error.status,undefined);return true;});assertWire(requests,input);},false,status);
 await withResponse(null,async()=>{await assert.rejects(post(payload('update-course')),(error:Error&{status?:number})=>{assert.equal(error.status,409);assert.doesNotMatch(error.message,/PRIVATE_/);return true;});},false,409,true);
 await withResponse({error:'PRIVATE_SERVER_DETAIL'},async requests=>{const input=payload('duplicate-course');await assert.rejects(post(input),(error:Error&{status?:number})=>{assert.match(error.message,/could not confirm whether this save completed/i);assert.doesNotMatch(error.message,/PRIVATE_SERVER_DETAIL/);assert.equal(error.status,undefined);return true;});assertWire(requests,input);},false,500);
});
test('coded Studio context responses take priority over generic status handling',async()=>{
 const input=payload('duplicate-course');
 await withResponse({code:'STUDIO_CONTEXT_CHANGED',error:'PRIVATE_CONTEXT'},async requests=>{
  await assert.rejects(post(input),(error:Error&{reason?:string;mayHaveCommitted?:boolean})=>{
   assert.equal(error.reason,'changed');assert.equal(error.mayHaveCommitted,false);assert.doesNotMatch(error.message,/PRIVATE_CONTEXT/);return true;
  });assertWire(requests,input);
 },false,409);
 await withResponse({code:'STUDIO_CONTEXT_UNAVAILABLE',error:'PRIVATE_CONTEXT'},async requests=>{
  await assert.rejects(post(input),(error:Error&{reason?:string;mayHaveCommitted?:boolean})=>{
   assert.equal(error.reason,'unavailable');assert.equal(error.mayHaveCommitted,false);assert.doesNotMatch(error.message,/PRIVATE_CONTEXT/);return true;
  });assertWire(requests,input);
 },false,503);
 await withResponse({error:'PRIVATE_GENERIC'},async requests=>{
  await assert.rejects(post(input),(error:Error&{reason?:string})=>{
   assert.equal(error.reason,undefined);assert.match(error.message,/could not confirm whether this save completed/i);assert.doesNotMatch(error.message,/PRIVATE_GENERIC/);return true;
  });assertWire(requests,input);
 },false,503);
});
test('unsupported actions including inherited object keys cannot produce confirmed success',async()=>{
 for(const action of ['unknown','__proto__','constructor','toString'])await withResponse({ok:true,action},async()=>{await assert.rejects(post({action}),uncertain);});
});
