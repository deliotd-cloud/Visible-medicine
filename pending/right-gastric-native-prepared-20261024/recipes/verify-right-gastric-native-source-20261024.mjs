import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { read, json, sha } from './source-only-backup-20261019.mjs';
import { nativeAtlasEnvironment } from './native-atlas-environment-20261022.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-native';
const preparation = json(stage + '/PREPARATION.json'), root = preparation.atlas;
const parent = json(preparation.parentReceipt), partial = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-proposal';
assert.equal(sha(read(stage + '/PREPARATION.json')), 'c53ac83ba02a651cbab983de46188c6ffb1806655a250abc35100ad9c1da287a');
nativeAtlasEnvironment({ atlas: parent.atlas, revision: parent.atlasHead, tree: parent.atlasTree });
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted, false);
const changedPaths = [...preparation.expectedChanges].sort();
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, stdio: 'pipe' }).trim();
assert.equal(git('rev-parse', 'HEAD'), parent.atlasHead);
assert.equal(git('rev-parse', 'HEAD^{tree}'), parent.atlasTree);
const dirty = git('status', '--porcelain').split(/\r?\n/).map(line => line.replace(/^(?:\?\?| ?M|M ) /, '')).sort();
// Avoid trim() removing the leading porcelain status space from the first row.
const actualPaths = execFileSync('git', ['-C', root, 'status', '--porcelain', '-z'], { encoding: 'utf8', windowsHide: true }).split('\0').filter(Boolean).map(line => line.slice(3)).sort();
assert.deepEqual(actualPaths, changedPaths, 'Only the six intended source changes may exist');
const sourceRows = [];
for (const row of parent.sourceRows) {
  assert.equal(sha(read(parent.atlas + '/' + row.path)), row.sha256, 'parent ' + row.path);
  const bytes = read(root + '/' + row.path);
  if (!changedPaths.includes(row.path)) assert.equal(sha(bytes), row.sha256, 'unchanged successor ' + row.path);
  sourceRows.push({ path: row.path, bytes: bytes.length, sha256: sha(bytes) });
}
for (const path of changedPaths.filter(path => !parent.sourceRows.some(row => row.path === path))) {
  const bytes = read(root + '/' + path); sourceRows.push({ path, bytes: bytes.length, sha256: sha(bytes) });
}
sourceRows.sort((a, b) => a.path.localeCompare(b.path));
assert.equal(sourceRows.length, 6389);
for (const row of preparation.copiedSourceRows) assert.equal(sha(read(root + '/' + row.path)), row.sha256);
const inverses = json(partial + '/checks/SOURCE_INVERSE.json');
for (const row of inverses.rows) {
  let before = read(root + '/' + row.path).toString();
  for (const seam of row.additions) { assert.equal(before.split(seam).length, 2); before = before.replace(seam, ''); }
  assert.deepEqual(Buffer.from(before), read(parent.atlas + '/' + row.path));
}
const noticePath = 'LICENSES/THIRD_PARTY_NOTICES.md';
const oldNotice = read(parent.atlas + '/' + noticePath), notice = read(root + '/' + noticePath);
assert(notice.subarray(0, oldNotice.length).equals(oldNotice), 'Whole prior licensing notice stays exact');
assert.match(notice.subarray(oldNotice.length).toString(), /^\n## Right gastric vein linear-EUS orientation/);
const packageText = read(root + '/package.json').toString();
const packageSeams = packageText.match(/^    "right-gastric-eus:test":.*\r?\n/gm);
assert.equal(packageSeams?.length, 1);
assert.deepEqual(Buffer.from(packageText.replace(packageSeams[0], '')), read(parent.atlas + '/package.json'));
const a = json(root + '/package.json'), b = json(parent.atlas + '/package.json');
delete a.scripts['right-gastric-eus:test']; assert.deepEqual(a, b, 'No dependency or pre-existing command changes');
const unitEvidence = json(partial + '/checks/TERMINAL.json');
assert.equal(unitEvidence.exitCode, 0); assert.equal(unitEvidence.unitCases, 7);
const state = {
  at: new Date().toISOString(), kind: 'complete-native-source-preparation-only', atlas: root,
  parentReceipt: preparation.parentReceipt, parentReceiptSha256: sha(read(preparation.parentReceipt)),
  parentHead: parent.atlasHead, parentTree: parent.atlasTree, actualHeadStillParent: true,
  sourceRows, sourcePaths: sourceRows.length, parentPathsVerifiedUnchanged: parent.sourceRows.length,
  changedPaths, changedRows: sourceRows.filter(row => changedPaths.includes(row.path)),
  wholeExistingSourceInverses: inverses.rows.length, wholePriorPackageRestored: true,
  wholePriorNoticePreserved: true, packageSeam: packageSeams[0],
  previousUnitEvidence: partial + '/checks/TERMINAL.json', previousUnitEvidenceSha256: sha(read(partial + '/checks/TERMINAL.json')),
  previousUnitSourceAndBuilderPreserved: true, priorUnitCases: 7,
  correctedIntegrationSourceSha256: sha(read(root + '/scripts/test-right-gastric-eus-integration.mjs')),
  workerOriginalSha256: sha(read(stage + '/WORKER_ORIGINAL.integration.mjs.raw')),
  objectClosureReceipt: stage + '/OBJECT_STORE_CLOSURE.json', objectClosureReceiptSha256: sha(read(stage + '/OBJECT_STORE_CLOSURE.json')),
  generatorsPending: ['regional-teaching-snapshots', 'body-renderer-revisions', 'generate-body-review-display-pins'],
  queuedVerification: ['original generator freshness checks', 'right-gastric-eus:test (7 unit +6 integration cases)', 'retained abdominal-eus-orientation theorem', 'actual configured strict TypeScript graph', 'stock native build', 'all four original learner exports', 'fresh protected Website Review integration'],
  fullIntegrationCasesRun: false, strictTypesRun: false, generatedRevisionsStillParent: true,
  productionBuild: false, websiteIntegration: false, installed: false, previewChanged: false,
  clinicalApproval: false, patientSpaceRegistration: false,
};
fs.writeFileSync(stage + '/SOURCE_STATE.json', JSON.stringify(state, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(stage + '/INITIAL_SHELL_REFUSAL.json', JSON.stringify({ at: new Date().toISOString(), failedOperation: 'Inline Node regex preservation check passed through PowerShell quoting', category: 'shell quoting, not an application or test failure', error: 'SyntaxError: Invalid regular expression: missing /', anyChecksExecutedByThatInvocation: false, replacement: 'This authored verification recipe executes the package and notice byte assertions without inline shell regex quoting.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ receipt: stage + '/SOURCE_STATE.json', sha256: sha(read(stage + '/SOURCE_STATE.json')), sourcePaths: sourceRows.length, changedPaths: changedPaths.length, wholeSourceInverses: inverses.rows.length, originalPackageAndNoticePreserved: true, integrationExecuted: false }));
