import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {diagnosticContextInput,releaseDiagnosticContexts,restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
const name="tests/atlas-back-topic-completion.test.ts",bytes=readFileSync(new URL('./atlas-back-topic-completion.test.ts',import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
test('corrected back-topic source restores its exact complete earlier diagnostic and original epoch',()=>{
 const row=releaseDiagnosticContexts().find(r=>r.path===name);assert(row);assert.equal(row.afterSha256,"abf8805953e77b91596ee1f775b29f15961976c8ea60a4ed19da2f092844944e");assert.equal(sha(bytes),"b91845f88daa8cbed299cbe565b8a589744a6596d745a4952936d2006d4116b4");
 assert.equal(sha(diagnosticContextInput(name,bytes)),row.afterSha256);
 const original=readFileSync('F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website/'+name);assert.equal(sha(original),row.beforeSha256);assert.deepEqual(restoreReleaseDiagnosticContext(name,bytes),original);
});
test('foreign edits, removed assertions and partly reverted repairs cannot enter the exact type-repair layer',()=>{
 for(const changed of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),Buffer.from(bytes.toString().replace('assert.','void.')),Buffer.from(bytes.toString().replace("Buffer.from(currentRegistryBytes).toString('utf8')","currentRegistryBytes.toString('utf8')"))]){assert.notDeepEqual(changed,bytes);assert.throws(()=>diagnosticContextInput(name,changed));assert.throws(()=>restoreReleaseDiagnosticContext(name,changed));}
});
test('the genuine old diagnostic epoch and all11private metadata rows retain their exact roles',()=>{
 const prior=diagnosticContextInput(name,bytes);assert.equal(diagnosticContextInput(name,prior),prior);const table=JSON.parse(readFileSync(new URL('./fixtures/release-diagnostic-repair-20261024.json',import.meta.url)));assert.equal(table.records.length,11);assert.deepEqual(releaseDiagnosticContexts(),table.records);const sentinel=Buffer.from('undeclared');assert.equal(diagnosticContextInput('undeclared',sentinel),sentinel);
});
