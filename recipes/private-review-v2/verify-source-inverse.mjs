// Static complete-source inverse witness. No test or application module is loaded.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const v1 = readFileSync(new URL('./fixtures/current-private-review-binding.v1.mjs.raw', import.meta.url));
const v2 = readFileSync(new URL('./files/tests/current-private-review-binding.test.mjs', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(v1), '9c2054a7d53b8d20bfa32ab55755fa7339232f251bcc763c145370af31d6d042');
assert.equal(sha(v2), '0fd540b7a8443a0a6a794a24b13b3d4ad9330d9113e8341fce1921c7f325b57f');

// Exact zero-context line seams: [v1 start, v1 count, v2 start, v2 count].
// All other lines must be identical in order, and the reconstructed full bytes
// must equal the complete v1 fixture. The ranges are the only allowed edit seams.
const seams = [
  [7,0,8,1], [17,2,17,0], [24,2,23,10], [27,2,34,1],
  [33,2,39,20], [42,1,66,1], [44,4,68,4], [49,1,73,1],
  [54,2,78,2], [59,2,83,2], [74,1,98,1], [77,1,101,1],
  [88,1,112,1], [100,1,124,1], [115,1,139,1], [116,0,141,3]
];
function inverse() {
  const older = v1.toString('utf8').split('\n');
  const newer = v2.toString('utf8').split('\n');
  let oldAt = 0, newAt = 0;
  const restored = [];
  for (const [oldStart, oldCount, newStart, newCount] of seams) {
    const oldBefore = oldStart - (oldCount === 0 ? 0 : 1);
    const newBefore = newStart - (newCount === 0 ? 0 : 1);
    assert.deepEqual(newer.slice(newAt, newBefore), older.slice(oldAt, oldBefore),
      `Unchanged source before seam ${oldStart}/${newStart}`);
    restored.push(...newer.slice(newAt, newBefore), ...older.slice(oldBefore, oldBefore + oldCount));
    oldAt = oldBefore + oldCount;
    newAt = newBefore + newCount;
  }
  assert.deepEqual(newer.slice(newAt), older.slice(oldAt), 'Unchanged source after final seam');
  restored.push(...newer.slice(newAt));
  const bytes = Buffer.from(restored.join('\n'));
  assert.deepEqual(bytes, v1, 'Full v1 source inverse');
  return {v1Sha256:sha(bytes),v2Sha256:sha(v2),seams:seams.length};
}
if (process.argv[1] && import.meta.url === new URL('file:///' + process.argv[1].replaceAll('\\','/')).href)
  process.stdout.write(JSON.stringify(inverse())+'\n');
export {inverse};
