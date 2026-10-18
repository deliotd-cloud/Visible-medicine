import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync(new URL('../lib/workbook-correction-contract.ts',import.meta.url),'utf8');
const module={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {parseWorkbookCorrectionLookupRequest:parseRequest,parseWorkbookCorrectionLookup:parseLookup}=module.exports;
const id='workbook:one',requestId='12345678-1234-4123-8123-123456789abc';
const input={action:'lookup-workbook-correction',id,expectedVersion:4,expectedMode:'teaching',expectedSourceHash:'a'.repeat(64),requestId};
const receipt={ok:true,action:'create-workbook-correction',requestId,sourceWorkbookId:id,sourceVersion:4,sourceHash:input.expectedSourceHash,mode:'teaching',draftWorkbookId:'87654321-4321-4321-8321-abcdefabcdef',draftVersion:1,draftStatus:'draft',auditId:requestId,auditHash:'b'.repeat(64),createdAt:'2026-10-16T10:00:00.000Z'};
const envelope={ok:true,action:input.action,requestId,sourceWorkbookId:id,sourceVersion:4,sourceHash:input.expectedSourceHash,mode:'teaching',outcome:'unconfirmed',receipt:null};

test('lookup request accepts only an exact source-bound identity for all modes',()=>{
  for(const mode of ['teaching','assessment','lecture'])assert.deepEqual(parseRequest({...input,expectedMode:mode},id),{...input,expectedMode:mode});
  for(const change of [{action:'create-workbook-correction'},{id:'other'},{expectedVersion:0},{expectedVersion:'4'},{expectedVersion:Infinity},{expectedVersion:2**53},{expectedMode:'case'},{expectedSourceHash:'A'.repeat(64)},{expectedSourceHash:'a'.repeat(63)},{requestId:'bad'},{reason:'private'},{confirmed:true}])
    assert.equal(parseRequest({...input,...change},id),null);
  for(const key of Object.keys(input)){const missing={...input};delete missing[key];assert.equal(parseRequest(missing,id),null);}
  for(const badId of ['', '../one','one/two','one%3Atwo','é','x'.repeat(141)])assert.equal(parseRequest({...input,id:badId},badId),null);
});

test('lookup response binds both outcomes and any receipt to the same request',()=>{
  for(const mode of ['teaching','assessment','lecture']){
    const expected={...input,expectedMode:mode};
    const base={...envelope,mode};
    assert.deepEqual(parseLookup(base,expected),base);
    const confirmed={...base,outcome:'confirmed',receipt:{...receipt,mode}};
    assert.deepEqual(parseLookup(confirmed,expected),confirmed);
  }
  for(const change of [{ok:false},{action:'other'},{requestId:'87654321-4321-4321-8321-abcdefabcdef'},{sourceWorkbookId:'other'},{sourceVersion:5},{sourceHash:'c'.repeat(64)},{mode:'lecture'},{outcome:'unknown'},{receipt:receipt},{privateData:'secret'}])
    assert.equal(parseLookup({...envelope,...change},input),null);
  assert.equal(parseLookup({...envelope,outcome:'confirmed'},input),null);
  for(const change of [{requestId:'87654321-4321-4321-8321-abcdefabcdef'},{sourceVersion:5},{sourceHash:'c'.repeat(64)},{mode:'lecture'},{draftStatus:'published'},{auditHash:'A'.repeat(64)},{privateData:'secret'}])
    assert.equal(parseLookup({...envelope,outcome:'confirmed',receipt:{...receipt,...change}},input),null);
  for(const key of Object.keys(envelope)){const missing={...envelope};delete missing[key];assert.equal(parseLookup(missing,input),null);}
  for(const wrong of [{id:'other'},{expectedVersion:5},{expectedMode:'lecture'},{expectedSourceHash:'c'.repeat(64)},{requestId:'87654321-4321-4321-8321-abcdefabcdef'}])
    assert.equal(parseLookup(envelope,{...input,...wrong}),null);
});

test('accessors, inherited and symbol properties are refused without evaluation',()=>{
  let calls=0;
  for(const [parser,good,args] of [[parseRequest,input,[id]],[parseLookup,envelope,[input]]]){
    const getter={...good};const key=Object.keys(good)[0];
    Object.defineProperty(getter,key,{enumerable:true,get(){calls++;throw Error('getter ran');}});
    const inherited=Object.assign(Object.create({private:true}),good);
    const symbol={...good,[Symbol('private')]:true};
    const nested={...good,[key]:{toString(){calls++;return good[key];}}};
    for(const bad of [null,[],getter,inherited,symbol,nested])assert.equal(parser(bad,...args),null);
    assert.ok(parser(Object.assign(Object.create(null),good),...args));
  }
  assert.equal(calls,0);
});
