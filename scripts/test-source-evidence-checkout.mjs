// Regression: Windows checkout filters must preserve pinned evidence bytes.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, {windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const paths = [
  ['content/source-inventory.json', 'unset', 'unspecified'],
  ['content/nested-review-bindings.json', 'set', 'lf'],
  ['docs/tibial-recurrent-source-disposition.json', 'unset', 'unspecified'],
  ['docs/limbic-landmark-source-audit.json', 'unset', 'unspecified'],
  ['docs/pelvic-vein-source-audit.json', 'unset', 'unspecified'],
  ['docs/collicular-brachia-source-audit.json', 'unset', 'unspecified'],
  ['docs/deep-leg-vein-source-audit.json', 'unset', 'unspecified'],
];
for (const [path, text, eol] of paths) {
  assert.deepEqual(git('check-attr', '-z', 'text', 'eol', '--', path).toString().split('\0').filter(Boolean),
    [path, 'text', text, path, 'eol', eol]);
  const blob = git('show', `HEAD:${path}`);
  assert.equal(sha(readFileSync(path)), sha(blob), `Working evidence differs from its committed bytes: ${path}`);
  for (const autocrlf of ['true', 'false', 'input'])
    assert.equal(sha(git('-c', `core.autocrlf=${autocrlf}`, '-c', 'core.eol=crlf', 'cat-file', '--filters', `HEAD:${path}`)),
      sha(blob), `Checkout filter changed pinned evidence: ${path} (${autocrlf})`);
}
console.log(JSON.stringify({evidencePaths: paths.length, simulatedCheckoutConfigurations: 3,
  expectedEvidenceHashesChanged: false, holdPolicyChanged: false}));
