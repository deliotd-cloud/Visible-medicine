import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {isSameOriginMutation} from "../lib/request-security.ts";
import {StudioMutationContextError} from "../lib/studio-mutation-context.ts";

class TestError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status;}}
const compiledModule={exports:{} as {readLectureRequest:(request:Request)=>Promise<Record<string,unknown>>;lectureApiFailure:(error:unknown)=>Response}};
const code=ts.transpileModule(readFileSync(new URL("../lib/lecture-api.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function("require","module","exports",code)((name:string)=>{
  if(name==="@/lib/education-api")return {EducationApiError:TestError};
  if(name==="@/lib/lecture-repository")return {LectureError:TestError};
  if(name==="@/lib/request-security")return {isSameOriginMutation};
  if(name==="@/lib/institution-operations")return {InstitutionOperationsError:TestError};
  if(name==="@/lib/studio-mutation-context")return {StudioMutationContextError};
  throw new Error(`Unexpected dependency ${name}`);
},compiledModule,compiledModule.exports);
const {readLectureRequest,lectureApiFailure}=compiledModule.exports;
const url="https://visiblemedicine.com/api/studio/workbooks/test/lecture";
const request=(body:string,headers:Record<string,string>={})=>new Request(url,{method:"POST",headers:{"content-type":"application/json",...headers},body});

test("lecture request is byte bounded without trusting content-length",async()=>{
  assert.deepEqual(await readLectureRequest(request('{"action":"save"}')),{action:"save"});
  await assert.rejects(readLectureRequest(request(JSON.stringify({text:"a".repeat(64_000)}))),{status:413});
  await assert.rejects(readLectureRequest(request(JSON.stringify({text:"臨".repeat(22_000)}))),{status:413});
  await assert.rejects(readLectureRequest(request("{}",{"content-length":"64001"})),{status:413});
});
test("lecture mutations reject cross-origin, non-JSON and malformed payloads",async()=>{
  await assert.rejects(readLectureRequest(request("{}",{origin:"https://attacker.example"})),{status:403});
  await assert.rejects(readLectureRequest(request("{}",{"content-type":"application/jsonp"})),{status:415});
  for(const text of ["null","[]","invalid"])
    await assert.rejects(readLectureRequest(request(text)),{status:422});
  assert.deepEqual(await readLectureRequest(request("{}",{origin:"https://visiblemedicine.com","content-type":"application/json; charset=utf-8"})),{});
});
test("lecture denials are private and never cacheable",async()=>{
  const response=lectureApiFailure(new TestError("Not allowed",403));
  assert.equal(response.status,403);assert.equal(response.headers.get("cache-control"),"private, no-store");
  assert.deepEqual(await response.json(),{error:"Not allowed"});
});

// Additional context-error cases; every original test body above is unchanged.
test("lecture context errors retain their structured refusal and private no-store response",async()=>{
  for(const reason of ["changed","unavailable"] as const){
    const error=new StudioMutationContextError(reason);
    const response=lectureApiFailure(error);
    assert.equal(response.status,reason==="changed"?409:503);
    assert.equal(response.headers.get("cache-control"),"private, no-store");
    assert.deepEqual(await response.json(),{
      error:error.message,
      code:reason==="changed"?"STUDIO_CONTEXT_CHANGED":"STUDIO_CONTEXT_UNAVAILABLE",
    });
  }
});

test("unknown lecture errors remain generic and do not leak private diagnostic text",async()=>{
  const saved=console.error;
  const diagnostics:unknown[][]=[];
  console.error=(...args:unknown[])=>{diagnostics.push(args);};
  try{
    const response=lectureApiFailure(new Error("SYNTHETIC_PRIVATE_DATABASE_DIAGNOSTIC"));
    assert.equal(response.status,500);
    assert.equal(response.headers.get("cache-control"),"private, no-store");
    const body=await response.json();
    assert.deepEqual(body,{error:"The lecture service could not complete this request."});
    assert(!JSON.stringify(body).includes("SYNTHETIC_PRIVATE_DATABASE_DIAGNOSTIC"));
    assert.equal(diagnostics.length,1);
    assert(!JSON.stringify(diagnostics).includes("SYNTHETIC_PRIVATE_DATABASE_DIAGNOSTIC"));
  }finally{console.error=saved;}
});
