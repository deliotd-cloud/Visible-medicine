// Test-only reversal of the shoulder-girdle arterial ultrasound notice.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const priorRevision = 'bbe33ea6ffff3503ae9cdabc0dd41350cece28cd';
const notice = 'LICENSES/THIRD_PARTY_NOTICES.md';
const title = Buffer.from('# Third-party notices\n\n');
const heading = Buffer.from('## Shoulder-girdle arterial ultrasound teaching (4 October 2026)\n');
const nextHeading = Buffer.from('## Midfoot ultrasound and hallux-note follow-up (4 October 2026)\n');
const sectionSha256 = 'b2ac91b7117c877afdcf74b482faf2c78c21faddad45aade19881207657ca6a8';
const priorNotice = execFileSync('git', ['show', `${priorRevision}:${notice}`], {
  cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** Remove one complete hash-pinned section and recover every bbe notice byte. */
export function withoutShoulderGirdleArterialNotice(bytes: Buffer): Buffer {
  assert.deepEqual(bytes.subarray(0, title.length), title, 'Source notice title changed');
  const start = bytes.indexOf(heading);
  assert.equal(start, title.length, 'Shoulder-girdle notice missing or moved');
  assert.equal(bytes.indexOf(heading, start + heading.length), -1, 'Duplicate shoulder-girdle notice');
  const end = bytes.indexOf(nextHeading, start + heading.length);
  assert(end > start, 'Shoulder-girdle notice boundary missing');
  assert.equal(sha(bytes.subarray(start, end)), sectionSha256, 'Shoulder-girdle notice changed');
  const recovered = Buffer.concat([bytes.subarray(0, start), bytes.subarray(end)]);
  assert.deepEqual(recovered, priorNotice, 'Complete pre-shoulder-girdle notice changed');
  return recovered;
}
