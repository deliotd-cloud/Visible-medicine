import {beforeInboxRequestRecoverySource} from './inbox-request-recovery-inverse.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreExactReviewSource,beforeReviewSuccessorSource} from './review-successor-source-role.mjs';
import {beforeQuickReviewSource} from './quick-review-source-role.mjs';
import {beforeCurrentInboxReturnFocusSource} from './inbox-return-focus-current-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=JSON.parse(readFileSync(new URL('./fixtures/review-successor-source-transitions.json',import.meta.url))).records;
for(const row of rows){
 test('complete historical reconstruction and refusal: '+row.path,()=>{
  const current=beforeInboxRequestRecoverySource(row.path,readFileSync(new URL('../'+row.path,import.meta.url)));
  const epoch=row.path==='components/ClinicalReviewInbox.tsx'
   ?beforeCurrentInboxReturnFocusSource(row.path,current):current;
  const successor=beforeQuickReviewSource(row.path,epoch);
  const prior=beforeReviewSuccessorSource(row.path,epoch);
  assert.equal(sha(prior),row.beforeSha256);
  assert.equal(sha(successor),row.afterSha256);
  assert.deepEqual(beforeReviewSuccessorSource(row.path,prior),prior);
  assert.equal(beforeReviewSuccessorSource(row.path,epoch.toString()),prior.toString());
  assert.throws(()=>beforeReviewSuccessorSource('unknown',epoch));
  assert.throws(()=>beforeReviewSuccessorSource(row.path,Buffer.concat([epoch,Buffer.from('foreign')])));
  assert.throws(()=>restoreExactReviewSource({...row,removed:row.removed+'foreign'},successor));
  assert.throws(()=>restoreExactReviewSource({...row,inserted:row.inserted+'foreign'},successor));
  assert.throws(()=>restoreExactReviewSource({...row,start:row.start+1},successor));
 });
}
test('current inbox focus source rejects a one-byte mutation before historical projection',()=>{
 const path='components/ClinicalReviewInbox.tsx';
 const current=Buffer.from(beforeInboxRequestRecoverySource(path,readFileSync(new URL('../'+path,import.meta.url))));
 current[0]^=1;
 assert.throws(()=>beforeCurrentInboxReturnFocusSource(path,current),/Only exact current inbox bytes admitted/);
});

test('request-recovery admission refuses forged bytes for both current source roles',()=>{
 for(const path of ['components/ClinicalReviewInbox.tsx','tests/clinical-review-inbox-workbench.test.mjs']){
  const current=readFileSync(new URL('../'+path,import.meta.url));
  assert.throws(()=>beforeInboxRequestRecoverySource(path,Buffer.concat([current,Buffer.from('foreign')])));
  const altered=Buffer.from(current);altered[Math.floor(altered.length/2)]^=1;
  assert.throws(()=>beforeInboxRequestRecoverySource(path,altered));
 }
});
