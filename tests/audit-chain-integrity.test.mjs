import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {auditHashInput,inspectAuditChain} from '../scripts/audit-chain-integrity.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'package.json'));
const ts=require('typescript');
const {build}=require('esbuild');
const bootstrap=readFileSync(resolve(root,'db/bootstrap.ts'),'utf8');
const ast=ts.createSourceFile('bootstrap.ts',bootstrap,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
assert.equal(ast.parseDiagnostics.length,0);
const declarations=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='appendAudit');
assert.equal(declarations.length,1);
// Execute the unchanged production function body with the actual hash/collision
// helpers. Only env.DB is replaced by disposable synthetic in-memory SQLite.
const compiled=await build({stdin:{contents:`import {sha256} from './lib/domain.ts';import {isAuditSequenceCollision} from './lib/audit-errors.ts';const env=globalThis.__auditChainCheckEnv;${declarations[0].getText(ast)}`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{}});
const env={};globalThis.__auditChainCheckEnv=env;
const {appendAudit}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const committedMigration=readFileSync(resolve(root,'drizzle/0002_clumsy_sage.sql'),'utf8');
const auditDdl=committedMigration.match(/CREATE TABLE `audit_events` \([\s\S]*?\n\);/g);
assert.equal(auditDdl?.length,1);
const sha=s=>createHash('sha256').update(new TextEncoder().encode(s)).digest('hex');

async function actualRows(){
  const db=new DatabaseSync(':memory:');db.exec(auditDdl[0]);
  const writes=[];
  env.DB={prepare(sql){return {async first(){assert.equal(sql,'SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1');return db.prepare(sql).get()??null;},bind(...values){return {async run(){writes.push(sql);return db.prepare(sql).run(...values);}};}};}};
  try{
    await appendAudit('synthetic-actor','synthetic-read','synthetic','fixture-one');
    await appendAudit('synthetic-\ud83e\udde0','synthetic|pipe','synthetic','fixture-two','success','');
    await appendAudit('synthetic-actor','synthetic-read','synthetic','fixture-three','denied','synthetic-\ud800-\0');
    assert.equal(writes.length,3);
    return db.prepare('SELECT * FROM audit_events ORDER BY sequence').all().map(r=>({...r}));
  }finally{db.close();}
}

const rows=await actualRows();
const clone=()=>structuredClone(rows);
const head={rows:rows.length,sequence:rows.at(-1).sequence,integrityHash:rows.at(-1).integrity_hash};
async function refusal(input,code,options){const result=await inspectAuditChain(input,options);assert.equal(result.integrity,'refused');assert.equal(result.failure.code,code);assert.equal(result.readyForProduction,false);return result;}

test('actual appendAudit exports produce the exact accepted chain; no caller mutation',async()=>{
  const frozen=clone();for(const row of frozen)Object.freeze(row);Object.freeze(frozen);
  const before=JSON.stringify(frozen);const result=await inspectAuditChain(frozen,{expectedHead:head});
  assert.equal(result.integrity,'consistent');assert.equal(result.checkedRows,3);assert.deepEqual(result.head,{sequence:3,integrityHash:head.integrityHash});assert.equal(result.snapshotMatches,true);assert.equal(result.readyForProduction,false);assert.equal(result.completeness,'not-established');assert.equal(result.authenticity,'not-established');assert.equal(JSON.stringify(frozen),before);
  let previous='GENESIS';for(const row of rows){assert.equal(sha(auditHashInput(previous,row)),row.integrity_hash);previous=row.integrity_hash;}
});
test('empty supplied chain is allowed but never certifies production',async()=>{
  const result=await inspectAuditChain([],{expectedHead:{rows:0,sequence:0,integrityHash:null}});assert.equal(result.integrity,'consistent');assert.equal(result.snapshotMatches,true);assert.deepEqual(result.head,{sequence:0,integrityHash:null});assert.equal(result.readyForProduction,false);
});
for(const key of ['actor_id','action','target_type','target_id','outcome','reason','occurred_at'])test(`altered ${key} is refused without disclosing values`,async()=>{
  const input=clone();input[1][key]='PRIVATE_TEST_SENTINEL';const report=await refusal(input,'HASH_MISMATCH');assert.equal(report.failure.rowNumber,2);assert(!JSON.stringify(report).includes('PRIVATE_TEST_SENTINEL'));
});
test('valid-looking forged tail is refused; hash syntax is not integrity',async()=>{const input=clone();input[2].integrity_hash='a'.repeat(64);await refusal(input,'HASH_MISMATCH');});
test('reordered records and missing interior record are refused',async()=>{await refusal([rows[1],rows[0],rows[2]],'SEQUENCE_ORDER');await refusal([rows[0],rows[2]],'SEQUENCE_ORDER');});
test('missing beginning is refused rather than treating a partial page as genesis',async()=>{await refusal(rows.slice(1),'SEQUENCE_ORDER');});
test('missing tail requires a separately captured boundary to detect',async()=>{
  const subset=rows.slice(0,2);const prefix=await inspectAuditChain(subset);assert.equal(prefix.integrity,'consistent');assert.equal(prefix.completeness,'not-established');assert.equal(prefix.snapshotMatches,null);await refusal(subset,'HEAD_BOUNDARY_MISMATCH',{expectedHead:head});
});
test('head mismatch and extra tail are refused',async()=>{await refusal(rows,'HEAD_BOUNDARY_MISMATCH',{expectedHead:{...head,integrityHash:'a'.repeat(64)}});await refusal(rows,'HEAD_BOUNDARY_MISMATCH',{expectedHead:{rows:2,sequence:2,integrityHash:rows[1].integrity_hash}});});
test('duplicate primary keys are refused even though IDs are not in the digest',async()=>{const input=clone();input[1].id=input[0].id;await refusal(input,'DUPLICATE_ID');});
test('unique changed IDs and a fully rehashed rewrite cannot establish authenticity',async()=>{
  const input=clone();input[0].id='replaced-primary-key';input[0].action='rewritten';let previous='GENESIS';for(const row of input){row.integrity_hash=sha(auditHashInput(previous,row));previous=row.integrity_hash;}
  const result=await inspectAuditChain(input);assert.equal(result.integrity,'consistent');assert.equal(result.authenticity,'not-established');assert.equal(result.readyForProduction,false);
});
for(const sequence of [0,-1,1.5,'1',NaN,Infinity,Number.MAX_SAFE_INTEGER+1])test(`invalid sequence ${String(sequence)} is refused`,async()=>{const input=clone();input[0].sequence=sequence;await refusal(input,'SEQUENCE_TYPE');});
test('uppercase, short and non-string hashes are refused',async()=>{for(const value of [rows[0].integrity_hash.toUpperCase(),'abc',null,8]){const input=clone();input[0].integrity_hash=value;await refusal(input,'HASH_SHAPE');}});
test('missing/nonstring fields and empty primary key are refused',async()=>{for(const mutate of [r=>{delete r.reason;},r=>{r.id='';},r=>{r.reason=null;},r=>{r.actor_id=3;}]){const input=clone();mutate(input[0]);await refusal(input,Object.hasOwn(input[0],'reason')?'FIELD_TYPE':'ROW_SHAPE');}});
test('accessors are refused without invoking them',async()=>{let invoked=false;const input=clone();Object.defineProperty(input[0],'action',{get(){invoked=true;throw Error('PRIVATE_TEST_SENTINEL');}});await refusal(input,'ROW_SHAPE');assert.equal(invoked,false);});
test('null-prototype native-like records are supported; foreign class instances are refused',async()=>{const input=rows.map(r=>Object.assign(Object.create(null),r));assert.equal((await inspectAuditChain(input)).integrity,'consistent');class Record{}await refusal([Object.assign(new Record(),rows[0])],'ROW_SHAPE');});
test('stream failure redacts the original error and never reports a consistent prefix',async()=>{async function* input(){yield rows[0];throw Error('PRIVATE_TEST_SENTINEL');}const result=await refusal(input(),'SOURCE_FAILURE');assert.equal(result.checkedRows,1);assert(!JSON.stringify(result).includes('PRIVATE_TEST_SENTINEL'));});
test('iterator capability getter and proxy failures are redacted before enumeration',async()=>{
  for(const input of [Object.defineProperty({},Symbol.iterator,{get(){throw Error('PRIVATE_TEST_SENTINEL');}}),Object.defineProperty({},Symbol.asyncIterator,{get(){throw Error('PRIVATE_TEST_SENTINEL');}}),new Proxy({}, {get(){throw Error('PRIVATE_TEST_SENTINEL');}})]){
    const report=await refusal(input,'SOURCE_FAILURE');assert.equal(report.checkedRows,0);assert(!JSON.stringify(report).includes('PRIVATE_TEST_SENTINEL'));
  }
});
test('async chunks retain the same hash chain and copied head boundary',async()=>{const boundary={...head};async function* input(){yield rows[0];boundary.integrityHash='b'.repeat(64);await Promise.resolve();yield rows[1];yield rows[2];}assert.equal((await inspectAuditChain(input(),{expectedHead:boundary})).snapshotMatches,true);});
test('row and UTF-8 byte limits fail closed',async()=>{await refusal(rows,'ROW_LIMIT',{maxRows:2});await refusal(rows,'BYTE_LIMIT',{maxBytes:1});const result=await inspectAuditChain(rows);assert.equal((await inspectAuditChain(rows,{maxBytes:result.encodedBytes})).integrity,'consistent');await refusal(rows,'BYTE_LIMIT',{maxBytes:result.encodedBytes-1});});
test('chunked UTF-8 preserves surrogate pairs at both sides of the chunk edge',async()=>{
  for(const prefix of [4094,4095,4096]){
    const row={...rows[0],action:'a'.repeat(prefix)+'\ud83e\udde0'+'b'.repeat(8193)+'\ud800'};row.integrity_hash=sha(auditHashInput('GENESIS',row));
    const result=await inspectAuditChain([row]);assert.equal(result.integrity,'consistent');assert.equal((await inspectAuditChain([row],{maxBytes:result.encodedBytes})).integrity,'consistent');await refusal([row],'BYTE_LIMIT',{maxBytes:result.encodedBytes-1});
  }
});
test('large single fields are refused with bounded encoder chunks',async()=>{
  const row={...rows[0],reason:'\ud83e\udde0'.repeat(100_000)};row.integrity_hash=sha(auditHashInput('GENESIS',row));
  const original=TextEncoder.prototype.encode;let largest=0;
  TextEncoder.prototype.encode=function(value){largest=Math.max(largest,value.length);return original.call(this,value);};
  try{await refusal([row],'BYTE_LIMIT',{maxBytes:20_000});assert(largest<=4096);}finally{TextEncoder.prototype.encode=original;}
});
test('invalid iterable, limits and head boundaries cannot downgrade checks',async()=>{
  for(const input of [null,{},3])await assert.rejects(inspectAuditChain(input),TypeError);
  for(const options of [{maxRows:0},{maxRows:100001},{maxBytes:0},{maxBytes:64*1024*1024+1},{maxRows:1.2},{maxBytes:'1'}])await assert.rejects(inspectAuditChain(rows,options),TypeError);
  for(const expectedHead of [null,{},head.integrityHash,{...head,rows:0},{...head,sequence:'3'},{...head,extra:true},{rows:0,sequence:0,integrityHash:'GENESIS'}])await assert.rejects(inspectAuditChain(rows,{expectedHead}),TypeError);
  await assert.rejects(inspectAuditChain(rows,{expectedHead:new Proxy({}, {ownKeys(){throw Error('PRIVATE_TEST_SENTINEL');}})}),e=>e instanceof TypeError && !e.message.includes('PRIVATE_TEST_SENTINEL'));
});
