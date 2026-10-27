import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha = value => createHash('sha256').update(value).digest('hex');
const raw = readFileSync(new URL('./fixtures/review-filter-scroll-transition.json', import.meta.url));
assert.equal(sha(raw), 'a3c07a505cc6c4c64853568dac717b24e86f6652a4d9f1c067e3c6c3e77bf9bc');
const {records} = JSON.parse(raw);
/** Historical diff tests only. All interaction tests still execute current product code. */
export function beforeFilterScrollSource(path, current) {
  const record = records.find(item => item.path === path);
  if (!record) return current;
  if (sha(current) === record.beforeSha256) return current;
  assert.equal(sha(current), record.afterSha256, 'Only exact sealed filter-scroll source can reconstruct history');
  let source = current.toString();
  for (const {from, to} of [...record.operations].reverse()) {
    assert.equal(source.split(to).length, 2, 'One exact historical transition');
    source = source.replace(to, from);
  }
  assert.equal(sha(source), record.beforeSha256, 'Historical assertions retain their original source');
  return typeof current === 'string' ? source : Buffer.from(source);
}
