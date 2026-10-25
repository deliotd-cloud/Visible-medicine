import {restoreAdjacentPortableRole} from './adjacent-role-proposal-inverse.mjs';
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
const portableDiagnosticRoles=new Map([
 ['tests/adjacent-current-tour-source-roles.test.mjs','66cb2d654960cb270564da64478a21672ff84fddba89b6b56f6a56d2450eb99c'],
 ['tests/adjacent-shoulder-source-roles.test.mjs','00a8f433689d35e859d1b9c52856f96b100fb0e136b5ae693ffb3a9e8ccbff4e'],
]);
/** Authenticate the later portable layer before executing the unchanged older inverse. */
export function diagnosticContextInput(name,bytes){
 // Authenticate and unwrap only the later syntax/byte-type repair. The
 // historical11-row metadata and all its original assertions stay unchanged.
 if(name==="tests/atlas-back-topic-completion.test.ts"){
  assert(Buffer.isBuffer(bytes),'Source bytes required');
  if(sha(bytes)!=="abf8805953e77b91596ee1f775b29f15961976c8ea60a4ed19da2f092844944e"){
   assert.equal(sha(bytes),"b91845f88daa8cbed299cbe565b8a589744a6596d745a4952936d2006d4116b4",'Exact back-topic type-repair successor');
   let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
   for(const [before,after]of [["      plugin.onLoad({filter: /[\\\\/]lib[\\\\/]specimen-review-material\\.ts$/, args => ({","      plugin.onLoad({filter: /[\\\\/]lib[\\\\/]specimen-review-material\\.ts$/}, args => ({"],["currentRegistryBytes.toString('utf8')","Buffer.from(currentRegistryBytes).toString('utf8')"],["fdaCatalogueBytes.toString('utf8')","Buffer.from(fdaCatalogueBytes).toString('utf8')"]].toReversed()){assert.equal(text.split(after).length,2);text=text.replace(after,before);}
   bytes=Buffer.from(text);assert.equal(sha(bytes),"abf8805953e77b91596ee1f775b29f15961976c8ea60a4ed19da2f092844944e",'Complete prior back-topic diagnostic source recovered');
  }
 }

 const current=portableDiagnosticRoles.get(name);if(!current)return bytes;
 assert(Buffer.isBuffer(bytes),'Source bytes required');const previous=records.get(name).afterSha256;
 if(sha(bytes)===previous)return bytes; // Explicit genuine earlier diagnostic epoch.
 assert.equal(sha(bytes),current,'Exact portable diagnostic successor: '+name);
 const restored=restoreAdjacentPortableRole(name.slice(6),bytes);assert.equal(sha(restored),previous);return restored;
}
export function releaseDiagnosticContexts(){return structuredClone([...records.values()]);}
export function restoreReleaseDiagnosticContext(name,bytes){
 bytes=diagnosticContextInput(name,bytes);
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
