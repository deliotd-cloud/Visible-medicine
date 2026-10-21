import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-review-queue-return-native-proof';
const proposal = 'F:/VisibleMedicine/staging/20261021-review-queue-return-proposal';
const sourceSite = 'F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const component = 'components/ClinicalReviewInbox.tsx';
assert.equal(sha(read(sourceSite + '/' + component)), '59605fcb29edecede8f6412842ad8ba760161b928b78657045c52388894984cd');
assert.equal(sha(read('F:/VisibleMedicine/website/' + component)), '59605fcb29edecede8f6412842ad8ba760161b928b78657045c52388894984cd');
const proposed = [
  [component, 'f7324e4be67bb1027c403c89a85cb84579fa9f5fcf99a8944b27b11b8537642d'],
  ['tests/clinical-review-inbox-return-context.test.mjs', '831100d168ece1e3009f5ac1525ea52545d3b17aaa528086b781c5bb6c5d012c'],
].map(([p, hash]) => { assert.equal(sha(read(proposal + '/' + p)), hash); return { path: p, from: proposal + '/' + p, sha256: hash }; });
const preserved = [
  'tests/clinical-review-inbox-filter-recovery.test.mjs',
  'tests/clinical-review-inbox-scan-focus.test.mjs',
  'tests/clinical-review-inbox-pagination-focus.test.mjs',
  'tests/clinical-review-inbox-workbench.test.mjs',
  'tests/clinical-review-inbox-ui.test.mjs',
  'package.json', 'components/clinical-review-inbox.css',
];
const frozen = json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
for (const row of frozen) assert.equal(sha(read(sourceSite + '/' + row.path)), row.sha256, row.path);
assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
const harness = stage + '/native-check'; fs.mkdirSync(harness);
for (const folder of ['lib', 'node_modules']) fs.symlinkSync(sourceSite + '/' + folder, harness + '/' + folder, 'junction');
for (const p of preserved) {
  const target = harness + '/' + p; fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(sourceSite + '/' + p, target, fs.constants.COPYFILE_EXCL);
  assert.equal(sha(read(target)), sha(read(sourceSite + '/' + p)), p);
}
for (const row of proposed) {
  const target = harness + '/' + row.path; fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(row.from, target, fs.constants.COPYFILE_EXCL);
  assert.equal(sha(read(target)), row.sha256);
}
const prep = { stage, site: harness, sourceSite, atlas, proposed,
  unchangedExistingTests: preserved.filter(p => p.startsWith('tests/')).map(p => ({ path: p, sha256: sha(read(sourceSite + '/' + p)) })),
  readOnlyJunctions: ['lib', 'node_modules'], frozenInputsUnchanged: frozen.length,
  scope: 'Six focused controlled-component files only. Existing tests execute against proposed component in this isolated root, not the original component. Small in-process component transforms only, no production build, full TypeScript, broad validator or second whole-suite job. No owner preview/draft or private data changes. Do not recursively delete/package the harness through junctions.' };
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(prep, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, harness, proposedPaths: proposed.length, originalTestFiles: 5, frozenInputs: frozen.length }));
