// Test-only replay of the exact foot notice appendix; never a learner fallback.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const footSourceRevision = 'cdc6ad23ad5c3c13a2f6588019a057d0a063818f';
export const preFootWebsiteEpoch = 'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const noticePath = 'atlas-review/LICENSES/THIRD_PARTY_NOTICES.md';
const marker = '\n## Foot ultrasound surface orientation — 3 October 2026\n';
const normalize = (text: string) => text.replaceAll('\r', '');

export const preFootNoticeBytes = execFileSync('git', ['show', `${preFootWebsiteEpoch}:${noticePath}`], {
  maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
export const sourceFootNoticeBytes = execFileSync('git', ['show', `${footSourceRevision}:LICENSES/THIRD_PARTY_NOTICES.md`], {
  cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
export const preFootNotice = normalize(preFootNoticeBytes.toString());
const sourceNotice = normalize(sourceFootNoticeBytes.toString());
const appendix = sourceNotice.slice(preFootNotice.length);
assert(sourceNotice.startsWith(preFootNotice), 'Pre-foot notice prefix changed in source');
assert(appendix.startsWith(marker), 'Foot notice is not the terminal source appendix');
assert.equal(appendix.indexOf(marker, marker.length), -1, 'Duplicate foot source appendix');
assert.equal(createHash('sha256').update(appendix).digest('hex'),
  'd8b0616fa0f847300666bd698efe385464e961d54e35ac0b389487bcc230cb5f', 'Foot appendix changed');

/** Remove only the complete, hash-pinned foot appendix; preserve all older bytes. */
export function withoutFootNotice(text: string): string {
  const normalized = normalize(text);
  const start = normalized.indexOf(marker);
  assert(start >= 0, 'Foot notice missing or incomplete');
  assert.equal(normalized.indexOf(marker, start + marker.length), -1, 'Duplicate foot notice');
  assert.equal(start, preFootNotice.length, 'Altered or moved preceding notice');
  assert.equal(normalized.slice(0, start), preFootNotice, 'Altered preceding notice');
  assert.equal(normalized.slice(start), appendix, 'Altered or incomplete foot appendix');
  return normalized.slice(0, start);
}
