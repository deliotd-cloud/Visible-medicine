import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const previous = 'F:/VisibleMedicine/staging/20261021-review-queue-return-native-proof';
const prep = json(previous + '/PREPARATION.json'), first = json(previous + '/REVIEW_RETURN_CONTEXT.json');
assert.equal(first.code, 1); assert.equal(sha(read(first.log)), first.logSha256);
assert(first.footer.includes('ℹ pass 8') && first.footer.includes('ℹ fail 32'));
const proposal = 'F:/VisibleMedicine/staging/20261021-review-queue-return-proposal';
assert.equal(sha(read(proposal + '/components/ClinicalReviewInbox.tsx')), prep.proposed[0].sha256);
const nextTestSha = '6d7e4d25b01ddb5a0576d6af8a23ffb527a98b70bce5ae72ebf71cd3c26d0e89';
assert.equal(sha(read(proposal + '/tests/clinical-review-inbox-return-context.test.mjs')), nextTestSha);
const config = json(prep.sourceSite + '/tsconfig.json'); assert.equal(config.compilerOptions.jsx, 'react-jsx');
const stage = 'F:/VisibleMedicine/staging/20261021-review-queue-return-native-proof-v2';
assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
const harness = stage + '/native-check'; fs.mkdirSync(harness);
for (const folder of prep.readOnlyJunctions) fs.symlinkSync(prep.sourceSite + '/' + folder, harness + '/' + folder, 'junction');
const originalPaths = [...prep.unchangedExistingTests.map(row => row.path), 'package.json', 'tsconfig.json', 'components/clinical-review-inbox.css'];
for (const p of originalPaths) {
  const target = harness + '/' + p; fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(prep.sourceSite + '/' + p, target, fs.constants.COPYFILE_EXCL);
  assert.equal(sha(read(target)), sha(read(prep.sourceSite + '/' + p)));
}
const proposed = prep.proposed.map(row => row.path.startsWith('tests/') ? { ...row, sha256: nextTestSha } : row);
for (const row of proposed) {
  const target = harness + '/' + row.path; fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(row.from, target, fs.constants.COPYFILE_EXCL); assert.equal(sha(read(target)), row.sha256);
}
for (const row of json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json'))
  assert.equal(sha(read(prep.sourceSite + '/' + row.path)), row.sha256, row.path);
const next = { ...prep, stage, site: harness, proposed, firstFailure: previous + '/REVIEW_RETURN_CONTEXT.json',
  firstFailureLogSha256: first.logSha256, sourceTsconfigSha256: sha(read(prep.sourceSite + '/tsconfig.json')),
  correction: 'Restore actual source react-jsx configuration to the isolated harness. Own new test asserts the actual one-page partial summary and absent pager while preserving requestedURLpage2. Existing five test files and proposed application component are unchanged.' };
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(next, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, sourceJsx: config.compilerOptions.jsx, originalTestsUnchanged: 5, applicationComponentUnchanged: true }));
