import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync(new URL('../lib/workbook-correction-contract.ts',import.meta.url),'utf8');
const module={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {parseWorkbookCorrectionRequest:request,parseWorkbookCorrectionSource:parseSource,parseWorkbookCorrectionReceipt:receipt}=module.exports;
const id='workbook:one',requestId='12345678-1234-4123-8123-123456789abc',draftId='87654321-4321-4321-8321-abcdefabcdef';
const input={action:'create-workbook-correction',id,expectedVersion:4,expectedStatus:'published',expectedMode:'teaching',expectedSourceHash:'a'.repeat(64),reason:' A correction reason ',confirmed:true,requestId};
const sourceEnvelope={ok:true,action:'workbook-correction-source',workbookId:id,workbookVersion:4,mode:'teaching',sourceHash:input.expectedSourceHash};
const expectedSource={id,version:4,mode:'teaching'};
const ack={ok:true,action:input.action,requestId,sourceWorkbookId:id,sourceVersion:4,sourceHash:input.expectedSourceHash,mode:'teaching',draftWorkbookId:draftId,draftVersion:1,draftStatus:'draft',auditId:requestId,auditHash:'b'.repeat(64),createdAt:'2026-10-16T10:00:00.000Z'};

test('request requires exact source, published state, confirmation, UUID and all supported modes',()=>{
  for(const mode of ['teaching','assessment','lecture'])assert.deepEqual(request({...input,expectedMode:mode},id),{...input,expectedMode:mode,reason:input.reason.trim()});
  for(const change of [{action:'retire-published-workbook'},{id:'other'},{expectedVersion:0},{expectedVersion:'4'},{expectedVersion:Infinity},{expectedVersion:2**53},{expectedStatus:'draft'},{expectedMode:'case'},{expectedSourceHash:'A'.repeat(64)},{reason:' '},{reason:'x'.repeat(1001)},{reason:'bad\0reason'},{confirmed:false},{requestId:'bad'},{requestId:'12345678-1234-1123-8123-123456789abc'},{other:'hidden'}])
    assert.equal(request({...input,...change},id),null);
  for(const badId of ['', '../one','one/two','one%3Atwo','é','x'.repeat(141)])assert.equal(request({...input,id:badId},badId),null);
  assert.equal(request({...input,reason:'x'.repeat(1000)},id)?.reason.length,1000);
});

test('source metadata refuses forged context, extra fields and malformed shapes',()=>{
  assert.deepEqual(parseSource(sourceEnvelope,expectedSource),sourceEnvelope);
  for(const mode of ['teaching','assessment','lecture'])assert.deepEqual(parseSource({...sourceEnvelope,mode},{...expectedSource,mode}),{...sourceEnvelope,mode});
  for(const change of [{ok:false},{action:'other'},{workbookId:'other'},{workbookVersion:5},{workbookVersion:'4'},{mode:'other'},{sourceHash:'A'.repeat(64)},{sourceHash:'a'.repeat(63)},{draftStatus:'draft'}])
    assert.equal(parseSource({...sourceEnvelope,...change},expectedSource),null);
  for(const wrong of [{id:'other'}, {version:5}, {mode:'assessment'}])assert.equal(parseSource(sourceEnvelope,{...expectedSource,...wrong}),null);
  for(const key of Object.keys(sourceEnvelope)){const missing={...sourceEnvelope};delete missing[key];assert.equal(parseSource(missing,expectedSource),null);}
});

test('receipt binds request, source and new draft with canonical audit timestamp',()=>{
  assert.deepEqual(receipt(ack,{...input,reason:input.reason.trim()}),ack);
  for(const change of [{ok:false},{action:'other'},{requestId:draftId},{sourceWorkbookId:'other'},{sourceVersion:5},{sourceHash:'c'.repeat(64)},{mode:'lecture'},{draftWorkbookId:id},{draftWorkbookId:'not-uuid'},{draftVersion:2},{draftStatus:'published'},{auditId:draftId},{auditHash:'A'.repeat(64)},{createdAt:'2026-02-30T10:00:00.000Z'},{createdAt:'2026-10-16T10:00:00Z'},{createdAt:'2026-10-16T25:00:00.000Z'},{privateData:'forged'}])
    assert.equal(receipt({...ack,...change},input),null);
  for(const key of Object.keys(ack)){const missing={...ack};delete missing[key];assert.equal(receipt(missing,input),null);}
});

test('accessors, inherited fields, symbols and coercible objects cannot execute',()=>{
  let calls=0;
  for(const [parser,good,args] of [[request,input,[id]],[parseSource,sourceEnvelope,[expectedSource]],[receipt,ack,[input]]]){
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
