import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha = value => createHash('sha256').update(value).digest('hex');
const seamBytes = readFileSync(new URL('./release18-continuous-playback-seams.json', import.meta.url));
assert.equal(sha(seamBytes), '496c394b79ab8157bedeff70eaf7c5727300ca95275339dba50e547571606293');
const seams = JSON.parse(seamBytes);
assert.equal(seams.schema, 'vm-release18-continuous-playback-exact-seams/1');
assert.equal(seams.baselineSha256, 'bcfce60a62b8a63841badbee0741ff78d5c08d09ba1d9da890d22d5d87098d24');
assert.equal(seams.successorSha256, '6df5f1aca55129508bd12a7a60c7857666d090c083f2cd77654e991fc248e3b0');
assert.equal(seams.hunks.length, 8);

/** Restore only the exact current-delivery test changes before older inverses. */
export function restoreRelease18ContinuousPlayback(source) {
  let bytes = Buffer.from(source);
  if (sha(bytes) === seams.baselineSha256) return bytes; // Authenticated older callers.
  assert.equal(sha(bytes), seams.successorSha256, 'Exact release-18 continuous-playback test');
  for (const hunk of [...seams.hunks].reverse()) {
    assert(Number.isSafeInteger(hunk.at) && hunk.at >= 0 && hunk.at <= bytes.length);
    const before = Buffer.from(hunk.before, 'utf8'), after = Buffer.from(hunk.after, 'utf8');
    assert.deepEqual(bytes.subarray(hunk.at, hunk.at + after.length), after, 'Exact declared successor seam');
    bytes = Buffer.concat([bytes.subarray(0, hunk.at), before, bytes.subarray(hunk.at + after.length)]);
  }
  assert.equal(sha(bytes), seams.baselineSha256, 'Complete prior playback test restored');
  return bytes;
}

/** Preserve the complete prior adjacent-role helper when auditing its new hook. */
export function restoreRelease18AdjacentHelper(source) {
  const bytes = Buffer.from(source);
  assert.equal(sha(bytes), 'a288f6eddd7e6241903b8a8c5a10d8601eb83a320108f4076ea5746b088cfe9a');
  let text = bytes.toString();
  const added = "import {restoreRelease18ContinuousPlayback} from './release18-continuous-playback-inverse.mjs';\n";
  const hook = "export function restoreAdjacentSharedRole(name,bytes){if(name==='tests/clinical-review-continuous-guided-playback.test.ts')bytes=restoreRelease18ContinuousPlayback(bytes);bytes=restoreReleaseDiagnosticContext(name,bytes);";
  const prior = 'export function restoreAdjacentSharedRole(name,bytes){bytes=restoreReleaseDiagnosticContext(name,bytes);';
  assert.equal(text.split(added).length, 2);
  assert.equal(text.split(hook).length, 2);
  text = text.replace(added, '').replace(hook, prior);
  const restored = Buffer.from(text);
  assert.equal(sha(restored), '064c45e32a766fe893bd07f72df6476da7bd8fd6231054b5f1c32223b7a43c46');
  return restored;
}
