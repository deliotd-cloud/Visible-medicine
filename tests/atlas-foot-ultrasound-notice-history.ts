// Test-only reversal of the midfoot follow-up notice; never a learner fallback.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const priorRevision = 'ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb';
const notice = 'LICENSES/THIRD_PARTY_NOTICES.md';
const title = Buffer.from('# Third-party notices\n\n');
const heading = Buffer.from('## Midfoot ultrasound and hallux-note follow-up (4 October 2026)\n');
const nextHeading = Buffer.from('## Toe-phalanx ultrasound teaching (4 October 2026)\n');
const sectionSha256 = 'ceed8d40342f7b70072d22f02a9f2e5dc1f8f5228e31955f7fc248cf9313d61b';
const priorNotice = execFileSync('git', ['show', `${priorRevision}:${notice}`], {
  cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** Remove only the complete fixed section and recover every prior notice byte. */
export function withoutMidfootNotice(bytes: Buffer): Buffer {
  assert.deepEqual(bytes.subarray(0, title.length), title, 'Source notice title changed');
  const start = bytes.indexOf(heading);
  assert.equal(start, title.length, 'Midfoot notice missing or moved');
  assert.equal(bytes.indexOf(heading, start + heading.length), -1, 'Duplicate midfoot notice');
  const end = bytes.indexOf(nextHeading, start + heading.length);
  assert(end > start, 'Midfoot notice boundary missing');
  assert.equal(sha(bytes.subarray(start, end)), sectionSha256, 'Midfoot notice changed');
  const recovered = Buffer.concat([bytes.subarray(0, start), bytes.subarray(end)]);
  assert.deepEqual(recovered, priorNotice, 'Complete pre-midfoot notice changed');
  return recovered;
}
