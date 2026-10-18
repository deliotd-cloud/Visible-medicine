import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript');
const source=readFileSync(new URL('../lib/workbook-retirement-contract.ts',import.meta.url),'utf8');
const module={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {parseWorkbookRetirementRequest:request,parseWorkbookRetirementReceipt:receipt}=module.exports;
const expected={id:'workbook:one',expectedVersion:4,disposition:'archived'};
const input={action:'retire-published-workbook',...expected,expectedStatus:'published',reason:' A bounded reason ',confirmed:true};
const ack={ok:true,action:input.action,workbookId:input.id,workbookVersion:4,disposition:'archived',
  auditId:'12345678-1234-1234-1234-123456789abc',auditHash:'a'.repeat(64),retiredAt:'2026-10-16T10:00:00.000Z'};
test('strict retirement envelope normalizes reason only, never identity/version/confirmation',()=>{
  assert.deepEqual(request(input,input.id),{...input,reason:input.reason.trim()});
  for(const id of ['', '../one','one/two','one%3Atwo','é', 'a'.repeat(101)])assert.equal(request({...input,id},id),null);
  for(const change of [{id:'other'},{expectedVersion:'4'},{expectedVersion:NaN},{expectedVersion:Infinity},{expectedVersion:0},
    {expectedVersion:1.5},{expectedVersion:2**53},{expectedStatus:'draft'},{confirmed:1},{confirmed:false},
    {reason:''},{reason:' '},{reason:'x'.repeat(1001)},{reason:'bad\0reason'},{disposition:'delete'},
    {action:'delete'},{extra:true}])assert.equal(request({...input,...change},input.id),null);
  assert.equal(request({...input,reason:'x'.repeat(1000)},input.id)?.reason.length,1000);
});
test('accessors, exotic prototypes, symbols and coercible nested values never execute',()=>{
  let calls=0;
  const accessor={...input};Object.defineProperty(accessor,'reason',{get(){calls++;throw Error('getter executed');},enumerable:true});
  const nested={...input,disposition:{toString(){calls++;return 'archived';}}};
  for(const bad of [null,[],Object.assign(Object.create({}),input),accessor,nested,{...input,[Symbol('x')]:true}])assert.equal(request(bad,input.id),null);
  assert.equal(calls,0);assert.ok(request(Object.assign(Object.create(null),input),input.id));
});
test('receipts require exact operation, version, disposition, audit hash and canonical timestamp',()=>{
  assert.deepEqual(receipt(ack,expected),ack);
  for(const change of [{ok:false},{action:'archive'},{workbookId:'other'},{workbookVersion:5},{workbookVersion:'4'},
    {disposition:'withdrawn'},{auditId:'not-uuid'},{auditHash:'A'.repeat(64)},{auditHash:'a'.repeat(63)},
    {retiredAt:'2026-02-30T10:00:00.000Z'},{retiredAt:'2026-10-16'},{extra:true}])assert.equal(receipt({...ack,...change},expected),null);
  for(const key of Object.keys(ack)){const missing={...ack};delete missing[key];assert.equal(receipt(missing,expected),null);}
});
test('parent Studio integrations use the protected control, not the rejected global authoring action',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const runtime=read('components/EducationRuntime.tsx'),lecture=read('components/LectureEditor.tsx');
  assert.ok(runtime.includes('<WorkbookRetirement id={focusedWorkbook.id}'));
  assert.ok(runtime.includes('Manage published workbook'));assert.ok(!runtime.includes('action: "retire-published-workbook"'));
  assert.ok(lecture.includes('view.status === "published" && <WorkbookRetirement'));
  assert.ok(lecture.includes('Historical published version'));
  assert.ok(read('app/studio/workbooks/[workbookId]/page.tsx').includes('<WorkbookRetirement id={workbook.id}'));
  assert.ok(read('app/api/app/route.ts').includes('retire-published-workbook'));
});
