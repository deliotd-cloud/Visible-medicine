import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
import {adjacentRolePath} from './adjacent-role-context.mjs';
import {restoreAdjacentPortableRole} from './adjacent-role-proposal-inverse.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
import {adjacentRoleRecords,restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';
import {restoreRelease18AdjacentHelper} from './release18-continuous-playback-inverse.mjs';
import {assertCurrentTourSource,assertCurrentTourDelivery,assertCompleteGuidedReview} from './adjacent-b79-tour-source-role.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(new URL('./'+p,import.meta.url));
const transitionBytes=readFileSync(adjacentRolePath('VM_ADJACENT_TRANSITION'));
assert.equal(sha(transitionBytes),'2092d001e2d94ad2f630bcdcb54ac37a3d9ba05b2980e3acd4438c66cb102f7f');
const transition=JSON.parse(transitionBytes);
assert.equal(sha(readFileSync(new URL('./fixtures/adjacent-portable-before/adjacent-b79-tour-source-role.mjs.raw',import.meta.url))),
 '56534358796baebd68291bda23afa5e19f01c47462f6c4ff14a132499d93db8f');
const historicalAtlas=adjacentRolePath('VM_ADJACENT_B79_ATLAS');

test('complete shared source-role inverses preserve every old helper and reject mutations',()=>{
 assert.equal(sha(restoreReleaseDiagnosticContext('tests/adjacent-current-role-inverse.mjs',restoreRelease18AdjacentHelper(read('adjacent-current-role-inverse.mjs')))),'c2df3cea3cebd3dd340d62407e14dd1b17b66f2c2d34ea226bff74a49bc7ee04');
 assert.deepEqual(adjacentRoleRecords,transition.records);
 for(const name of new Set(adjacentRoleRecords.map(r=>r.name))){
  const file=name==='release-to-lower'?'release-epoch-composition-preservation.test.mjs':name.slice(6);
  const bytes=read(file),restored=restoreAdjacentSharedRole(name,bytes),first=adjacentRoleRecords.find(r=>r.name===name);
  assert.equal(sha(restored),first.beforeSha256);
  const original=name==='release-to-lower'?read('fixtures/adjacent-b79-preimage/release-epoch-composition-preservation.test.mjs.raw'):readFileSync(new URL('../'+first.preimage,import.meta.url));
  assert.deepEqual(restored,original,name+': whole exact historical endpoint');
  const changed=Buffer.from(bytes);changed[0]^=1;
  assert.throws(()=>restoreAdjacentSharedRole(name,changed));
  assert.throws(()=>restoreAdjacentSharedRole(name,Buffer.concat([bytes,Buffer.from('/* foreign */')])));
  const removed=Buffer.from(bytes.toString().replace('assert.equal(', 'void('));
  assert.notDeepEqual(removed,bytes);assert.throws(()=>restoreAdjacentSharedRole(name,removed));
 }
 assert.throws(()=>restoreAdjacentSharedRole('unknown',Buffer.alloc(0)));
});

test('outer hooks retain complete old inverse implementations and the prior lower-limb theorem',()=>{
 for(const row of transition.copied.filter(r=>r.wrapper||r.lowerWrapper)){
  const bytes=read(row.path.slice(6));assert.equal(sha(bytes),row.wrappedSha256);
  let text=bytes.toString();const header="import {restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';\n";
  assert(text.startsWith(header));text=text.slice(header.length);
  const hook=row.lowerWrapper?"function restoreRelease(bytes){\n bytes=restoreAdjacentSharedRole('release-to-lower',bytes);":
   'export function '+row.wrapper.fn+"(bytes){\n bytes=restoreAdjacentSharedRole('"+row.wrapper.subject+"',bytes);";
  const original=row.lowerWrapper?'function restoreRelease(bytes){':'export function '+row.wrapper.fn+'(bytes){';
  assert.equal(text.split(hook).length,2);text=text.replace(hook,original);
  assert.equal(sha(text),row.beforeWrappedSha256,row.path+': complete old implementation');
 }
});

test('current b79 bank and complete real structure membership remain distinct from genuine historical sources',
 {timeout:120000},async()=>{
 const atlasRoot=historicalAtlas;assert(atlasRoot);
 assertCurrentTourSource({atlasRoot,sourceCommit:'b79e110d2d28f18993263926ba35aa7a3f478b20'});
 assert.throws(()=>assertCurrentTourSource({atlasRoot,sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'}));
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlasRoot+'/scripts/exact-source-history-api.mjs').href);
 const renal=await exactSourceHistoryApi('2381efe43b75f8a7fb768a069eecd7268c508dac','regional-tour-review');
 const current=await exactSourceHistoryApi('b79e110d2d28f18993263926ba35aa7a3f478b20','regional-tour-review');
 assertCurrentTourDelivery(renal.regionalTours,current.regionalTours,{atlasRoot,sourceCommit:'b79e110d2d28f18993263926ba35aa7a3f478b20'});
 const id='vm:anatomy:body:thigh:left:bone:left-femur';
 const before=await renal.bodyReviewMaterial(id),now=await current.bodyReviewMaterial(id);
 assert(now.guidedTours.some(g=>g.tour.id==='left-hamstring-orientation'));
 assertCompleteGuidedReview(id,before.guidedTours,now.guidedTours,current.regionalTours);
 for(let i=0;i<now.guidedTours.length;i++){
  const missing=now.guidedTours.filter((_,n)=>n!==i);
  assert.throws(()=>assertCompleteGuidedReview(id,before.guidedTours,missing,current.regionalTours));
 }
 assert.throws(()=>assertCompleteGuidedReview(id,before.guidedTours,[],current.regionalTours));
 assert.throws(()=>assertCompleteGuidedReview(id,before.guidedTours,[...now.guidedTours,now.guidedTours[0]],current.regionalTours));
 const forged=structuredClone(current.regionalTours);forged[0].steps[0].caption+=' forged';
 assert.throws(()=>assertCurrentTourDelivery(renal.regionalTours,forged,{atlasRoot,sourceCommit:'b79e110d2d28f18993263926ba35aa7a3f478b20'}));
});

test('portable setup seams retain every complete original root and b79 helper',()=>{
 for(const name of ['adjacent-current-tour-source-roles.test.mjs','adjacent-shoulder-source-roles.test.mjs','adjacent-clinical-source-roles.test.mjs','adjacent-b79-tour-source-role.mjs']){
  const bytes=read(name),original=read('fixtures/adjacent-portable-before/'+name+'.raw');
  assert.deepEqual(restoreAdjacentPortableRole(name,bytes),original);const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>restoreAdjacentPortableRole(name,changed));
 }
});
