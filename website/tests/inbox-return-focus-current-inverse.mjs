import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=readFileSync(new URL('./inbox-return-focus-current-inverse.json',import.meta.url));
assert.equal(sha(raw),'69a921f5c0ae5c007c4aef3449ffb917c4cee2909c3a32a70245e6f7568e0623','Exact reviewed return-focus transition');
const record=JSON.parse(raw);
assert.equal(record.schema,'vm-inbox-return-focus-current-inverse/1');
assert.equal(record.path,'components/ClinicalReviewInbox.tsx');
assert.equal(record.beforeSha256,'3d465094abf32796d8baa72d0f131011873d989d7ac8ce9c0a0517cb289c1299');
assert.equal(record.afterSha256,'bf300c65bb4b6af2482ecad157d160e3a95d72d60e10ecca2e34926171e01ec4');
const lines=text=>text.match(/[^\n]*\n|[^\n]+$/g)??[];
/** Exact test-only projection to the independently pinned quick-review epoch. */
export function beforeCurrentInboxReturnFocusSource(path,current){
 assert.equal(path,record.path,'Only current inbox focus source');
 assert(Buffer.isBuffer(current),'Raw current source bytes required');
 assert.equal(sha(current),record.afterSha256,'Only exact current inbox bytes admitted');
 const inverse=lines(current.toString('utf8'));
 for(const edit of [...record.edits].reverse()){
  assert.deepEqual(inverse.slice(edit.afterLine,edit.afterLine+edit.after.length),edit.after,'Exact inverse focus seam');
  inverse.splice(edit.afterLine,edit.after.length,...edit.before);
 }
 const prior=inverse.join('');
 assert.equal(sha(prior),record.beforeSha256,'Exact preceding quick-review source');
 const forward=lines(prior);
 for(const edit of [...record.edits].reverse()){
  assert.deepEqual(forward.slice(edit.beforeLine,edit.beforeLine+edit.before.length),edit.before,'Exact forward focus seam');
  forward.splice(edit.beforeLine,edit.before.length,...edit.after);
 }
 assert.equal(forward.join(''),current.toString('utf8'),'Complete current source reproduced');
 return Buffer.from(prior);
}
