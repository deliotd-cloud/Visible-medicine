import {beforeReviewSuccessorSource} from './review-successor-source-role.mjs';
import {authenticateArterialCollector} from './arterial-delivery-roles.mjs';
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
const wrappedDiagnosticRoles=new Map([
 ['tests/adjacent-current-tour-source-roles.test.mjs',['feb235b2ddee8f3e0a2c252bb76a7c2f14ed39bbfb4d8b8c31f940951b3128c5','nine-history-original-adjacent-current-tour-source-roles.mjs']],
 ['tests/adjacent-shoulder-source-roles.test.mjs',['b6c3593fb8f80821d418d8d5aaeea06708bb4418d208655ed8fe9eeae585b7ab','nine-history-original-adjacent-shoulder-source-roles.mjs']],
]);
const completeReleaseRoles=new Map([
 ['tests/complete-release-followup-preservation.test.mjs',{current:'2bbf0a65414a20b995ed3223649d37c45b526eb0d6e01d469823ba0239e796c4',previous:'05ddef14443fa4c4866b574ac678bb13c2a1962a93c81e9af67e4a08a130970a',start:'function recoverFiveFollowupSuccessor(row,bytes){',end:'function original(row,bytes){',call:'bytes=recoverFiveFollowupSuccessor(row,bytes);'}],
 ['tests/complete-release-five-followups-preservation.test.mjs',{current:'7a82b36f76b883fb16df1af64adeb329f7ff7418658131fcda2060f9c0201bfb',previous:'fcb713b0f6f27456101f3ee06bd69d066be1d8021658371d804190f7a61bb4c4',start:'const successorRoles=',end:'function inverse(row,bytes){',call:'bytes=recoverSuccessor(row,bytes);'}],
]);
function recoverCompleteReleaseSource(name,bytes){
 const role=completeReleaseRoles.get(name);if(!role||sha(bytes)===role.previous)return bytes;
 assert.equal(sha(bytes),role.current,'Exact later complete-release root: '+name);
 let source=bytes.toString('utf8');assert.deepEqual(Buffer.from(source),bytes,'Lossless complete-release source');
 const start=source.indexOf(role.start),end=source.indexOf(role.end,start);
 assert(start>=0&&end>start,'Declared successor function block: '+name);
 source=source.slice(0,start)+source.slice(end);
 assert.equal(source.split(role.call).length,2,'One named successor invocation: '+name);
 source=source.replace(role.call,'');
 const restored=Buffer.from(source);assert.equal(sha(restored),role.previous,'Exact preceding complete-release root: '+name);
 return restored;
}
/** Authenticate the later portable layer before executing the unchanged older inverse. */
export function diagnosticContextInput(name,bytes){
 bytes=authenticateArterialCollector(name,bytes);
 const wrapped=wrappedDiagnosticRoles.get(name);if(wrapped&&sha(bytes)===wrapped[0]){
  const fixture=readFileSync(new URL('./'+wrapped[1],import.meta.url));
  assert.equal(sha(fixture),portableDiagnosticRoles.get(name),'Exact complete historical module behind wrapper: '+name);
  bytes=fixture;
 }
 bytes=recoverCompleteReleaseSource(name,bytes);
 if(name==='tests/arterial-history-preservation.test.mjs')bytes=beforeReviewSuccessorSource(name,bytes);
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
