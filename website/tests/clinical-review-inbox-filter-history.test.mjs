import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {beforeFilterScrollSource} from './review-filter-scroll-source-role.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
const {records} = JSON.parse(readFileSync(new URL('./fixtures/review-filter-scroll-transition.json', import.meta.url)));
for (const row of records) {
  test('exact historical source projection and tamper rejection: ' + row.path, () => {
    // Historical projection uses its exact portable epoch; behavior tests use the current component.
    const current = readFileSync(new URL(row.path === 'components/ClinicalReviewInbox.tsx' ? './fixtures/inbox-filter-scroll-7b124e30.tsx.raw' : '../' + row.path, import.meta.url));
    assert.equal(sha(current), row.afterSha256);
    const before = beforeFilterScrollSource(row.path, current);
    assert.equal(sha(before), row.beforeSha256);
    assert.equal(beforeFilterScrollSource(row.path, before), before);
    assert.equal(sha(beforeFilterScrollSource(row.path, current.toString())), row.beforeSha256);
    assert.throws(() => beforeFilterScrollSource(row.path, Buffer.concat([current, Buffer.from(' ')])), /Only exact sealed/);
  });
}
test('unrelated source is never rewritten by the historical adapter', () => {
  const source = Buffer.from('unchanged contract');
  assert.equal(beforeFilterScrollSource('lib/clinical-review-inbox-contract.ts', source), source);
});
