import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {restoreHeadToolsTestRole} from './tests/head-tools-test-source-role.mjs';

const source='F:/VisibleMedicine/staging/20261022-review-ui-source-successor/website/tests/';
const local=new URL('./tests/',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const roles=[
 ['head-disclosure-current-delivery.test.mjs','999704133a16bff87fb69948a0ef67ba3b5973218235ee3b99ef2d455cbfe58d','4faa65190f46ff6b4a247d4e39b864d8739d50281c5f5efb1833bc29aa4e0538',[32,34,35,47]],
 ['head-history-role-preservation.test.mjs','969472e3491b6aff691228a5f7a6af09f9ea10bfbe44f474dc51d3469c5c799e','30af3e370151316a876c83fc45a930c03407e7decb34a9427d35911ab1b8e8f3',[57,63]],
];
for(const [name,priorHash,currentHash,changedLines] of roles){
 const prior=readFileSync(source+name),current=readFileSync(new URL(name,local));
 assert.equal(sha(prior),priorHash,name+' exact baseline');
 assert.equal(sha(current),currentHash,name+' exact proposal');
 const before=prior.toString('utf8').split('\n'),after=current.toString('utf8').split('\n');
 if(name==='head-history-role-preservation.test.mjs'){
  assert.equal(after[5],"import {restoreMigrationLaterRole} from './head-manual-migration-later-inverse.mjs';");
  after.splice(5,1);
  assert.match(after[64],/if\(name===rows\[3\]\[0\]\)assert\.throws\(\(\)=>restoreMigrationLaterRole/);
  after.splice(64,1);
 }
 const changed=[];
 for(let line=1;line<=Math.max(before.length,after.length);line++)if(before[line-1]!==after[line-1])changed.push(line);
 assert.deepEqual(changed,changedLines,name+' only enumerated complete-line source changes');
 assert.throws(()=>assert.equal(sha(Buffer.concat([current,Buffer.from('\n// forged')])),currentHash),name+' mutation refusal');
 console.log(name+': '+priorHash+' -> '+currentHash+'; changed lines '+changed.join(','));
}
assert.equal(sha(restoreHeadToolsTestRole('head-disclosure-current-delivery.test.mjs',readFileSync(source+roles[0][0]))),
 '6feb900f5db6124b287629a669267736baf22751d3142aea15f8d4eda87d0e31');
console.log('head disclosure baseline reverses exactly to authenticated pre-tools complete source');
