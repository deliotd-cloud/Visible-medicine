// Test-only outer inverse. The existing historical contracts run unchanged next.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const evidence=JSON.parse(readFileSync(new URL('./fixtures/release-diagnostic-repair-20261024.json',import.meta.url)));
assert.equal(evidence.schema,'vm-release-diagnostic-source-inverse-1');
assert.equal(evidence.parentSha256,'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
const records=new Map();
for(const row of evidence.records){
 assert.match(row.path,/^tests\/[a-z0-9-]+(?:\.test)?\.(?:mjs|ts)$/);
 assert(!records.has(row.path),'Unique source context');
 for(const key of ['beforeSha256','afterSha256'])assert.match(row[key],/^[a-f0-9]{64}$/);
 assert(row.seams.length>0);
 for(const [before,after]of row.seams)assert(typeof before==='string'&&before.length>0&&typeof after==='string'&&after.length>0&&before!==after);
 records.set(row.path,row);
}
export function releaseDiagnosticContexts(){return structuredClone([...records.values()]);}
export function restoreReleaseDiagnosticContext(name,bytes){
 const row=records.get(name);if(!row)return bytes; // Preserve undeclared old readers' own refusal behavior.
 assert(Buffer.isBuffer(bytes),'Source bytes required');
 assert.equal(sha(bytes),row.afterSha256,'Exact reviewed diagnostic successor: '+name);
 let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes,'Lossless source decoding');
 for(const [before,after]of row.seams.toReversed()){
  assert.equal(text.split(after).length,2,'One exact diagnostic inverse seam: '+name);
  text=text.replace(after,before);
 }
 const restored=Buffer.from(text);assert.equal(sha(restored),row.beforeSha256,'Complete original source recovered: '+name);
 return restored;
}
