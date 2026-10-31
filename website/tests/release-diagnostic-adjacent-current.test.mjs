import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {diagnosticContextInput,releaseDiagnosticContexts,restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),names=['adjacent-current-tour-source-roles.test.mjs','adjacent-shoulder-source-roles.test.mjs'];
test('current portable diagnostic inputs restore complete original source through both exact layers',()=>{
 for(const name of names){const path='tests/'+name,bytes=readFileSync(new URL('./'+name,import.meta.url)),prior=readFileSync(new URL('./fixtures/adjacent-portable-before/'+name+'.raw',import.meta.url)),row=releaseDiagnosticContexts().find(r=>r.path===path);assert.deepEqual(diagnosticContextInput(path,bytes),prior);assert.equal(sha(prior),row.afterSha256);assert.equal(sha(restoreReleaseDiagnosticContext(path,bytes)),row.beforeSha256);assert.deepEqual(restoreReleaseDiagnosticContext(path,bytes),restoreReleaseDiagnosticContext(path,prior));}
});
test('foreign edits and removed assertions cannot enter either exact diagnostic layer',()=>{
 for(const name of names){
  const path='tests/'+name,wrapper=readFileSync(new URL('./'+name,import.meta.url)),portable=readFileSync(new URL('./nine-history-original-'+name.replace('.test.mjs','.mjs'),import.meta.url)),previous=readFileSync(new URL('./fixtures/adjacent-portable-before/'+name+'.raw',import.meta.url));
  for(const [bytes,needle]of [[wrapper,'runNineHistory('],[portable,'assert.equal('],[previous,'assert.equal(']]){
   assert(bytes.toString().includes(needle),'Mutation reaches an actual dispatcher/assertion');
   for(const changed of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),Buffer.from(bytes.toString().replace(needle,'void('))]){assert.notDeepEqual(changed,bytes);assert.throws(()=>diagnosticContextInput(path,changed));assert.throws(()=>restoreReleaseDiagnosticContext(path,changed));}
  }
 }
});
test('diagnostic contexts retain original private metadata and reject another source role',()=>{
 const raw=JSON.parse(readFileSync(new URL('./fixtures/release-diagnostic-repair-20261024.json',import.meta.url)));assert.deepEqual(releaseDiagnosticContexts(),raw.records);const bytes=readFileSync(new URL('./'+names[0],import.meta.url));assert.throws(()=>diagnosticContextInput('tests/'+names[1],bytes));const untouched=Buffer.from('undeclared');assert.equal(diagnosticContextInput('undeclared',untouched),untouched);
});
