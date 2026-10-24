import assert from 'node:assert/strict';
import fs from 'node:fs';
import { saveProposal } from './source-proposal-checkpoint.mjs';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-review-heading-proposal';
const terminalPath = stage + '/checks/main-portable/TERMINAL.json';
const terminal = json(terminalPath), prep = json(stage + '/PREPARATION.json');
assert.equal(terminal.exitCode, 0);
assert.deepEqual(terminal.counts, { tests: 6, pass: 6, fail: 0, cancelled: 0, skipped: 0, todo: 0 });
const rows = terminal.rows.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }));
const installed = [
  ['F:/VisibleMedicine/website', 'b953ff3f5f1891599cb6e91cb91311d9d6006270'],
  ['F:/VisibleMedicine/atlas', '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],
];
const verify = () => {
  assert.equal(sha(read(prep.parentReceipt)), prep.parentReceiptSha256);
  assert.equal(sha(read(terminalPath)), terminalHash);
  assert.equal(sha(read(stage + '/checks/main-portable/stdout.log')), terminal.stdoutSha256);
  assert.equal(sha(read(stage + '/checks/main-portable/stderr.log')), terminal.stderrSha256);
  for (const row of terminal.rows) {
    assert.equal(sha(read(stage + '/atlas/' + row.path)), row.sha256);
    assert.equal(sha(read(prep.parentAtlas + '/' + row.path)), row.parentSha256);
    assert.equal(sha(read(stage + '/preimages/' + row.path + '.raw')), row.parentSha256);
  }
  for (const [repo, revision] of installed) assert.equal(runGit(['-C', repo, 'rev-parse', 'HEAD']).toString().trim(), revision);
  for (const row of terminal.routeRows) assert.equal(sha(read(row.path)), row.sha256);
  const p = json('CURRENT_CHECKPOINT.json'); assert.equal(p.goal.status, 'active');
  assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
};
const terminalHash = sha(read(terminalPath));
const localArtifacts = [
  [stage + '/INITIAL_PREFLIGHT_REFUSAL.json', 'INITIAL_PREFLIGHT_REFUSAL.json'],
  [stage + '/PREPARATION.json', 'PREPARATION.json'], [stage + '/HANDOFF.json', 'WORKER_HANDOFF.json'],
  ...['STARTED.json', 'TERMINAL.json', 'stdout.log', 'stderr.log'].map(p => [stage + '/checks/main-portable/' + p, 'checks/' + p]),
  ...rows.map(r => [stage + '/preimages/' + r.path + '.raw', 'preimages/' + r.path + '.raw']),
];
const recipes = ['prepare-review-heading-proposal-20261024.mjs', 'run-review-heading-proposal-20261024.mjs', 'save-review-heading-proposal-20261024.mjs', 'finalize-review-heading-proposal-20261024.mjs'];
const result = saveProposal({
  id: 'review-heading-proposal-20261024', key: 'pendingReviewHeadingProposal', stage,
  root: 'F:/VisibleMedicine/recovery/checkpoints/20261024-review-heading-proposal', site: stage + '/atlas', rows, verify,
  milestone: 'Display-only Clinical Review heading consistency; narrow real-component SSR verified, unintegrated',
  parent: { receipt: 'F:/VisibleMedicine/recovery/checkpoints/20261024-independent-qa-proposals-source-backup/github-backup.json', receiptSha256: '3406d91f892488ea9002325aabf431c4da0d774720f65bec7615d46b1d8420de', repo: 'F:/VisibleMedicine/history/website-work/github-independent-qa-proposals-20261024.git' },
  backupRepo: 'F:/VisibleMedicine/history/website-work/github-review-heading-proposal-20261024.git',
  sourceIdentity: { kind: 'partial-native-display-proposal', parentReceipt: prep.parentReceiptSha256, parentHead: prep.parentHead, parentTree: prep.parentTree, explicitPathsOnly: true },
  backupScope: 'Verified inherited filtered source plus four explicit native source/support paths and four recipes. Raw QA, worksheet examples, handoffs, preimages, manifests and later coordination remain F-local. No patient/account data, scans, masks, models, private identifiers, generated delivery/build/dependencies or raw logs uploaded. Not a whole/private/runnable off-device backup. No preview installation or deployment.',
  review: {
    at: new Date().toISOString(), parentReceipt: prep.parentReceiptSha256, rows, worker: 'review_heading_render_1024, gpt-6-sol medium, no nested delegation', workerTokens: 'unavailable',
    productChange: 'Only import the existing teachingHeading and use it at BodyReviewDetails visible h4. Learner/helper, canonical topics, worksheets, access and actions unchanged.',
    mainCorrections: ['Removed dated sibling-checkout dependency from the regression and resolve genuine installed dependencies from the test location. Partial QA supplies existing NODE_PATH process-locally only.', 'Kept whole prior dashboard reconstruction through two exact seams in the independent source-bound runner, and preserved the original four tests byte-for-byte.', 'Distinguished narrow real-component excerpt SSR from the full configured compiler/import graph and browser acceptance.'],
    checks: terminal.counts, wholeGenuineParentInverse: true, deeplyFrozenSyntheticProps: 6, wholeRenderedMarkupCompared: true, existingDependenciesOnly: true,
    fullAppGraphOrStrictCompilerRun: false, integrated: false, browserAccepted: false, previewChanged: false,
  },
  proof: { focusedCases: 6, originalTestsPreserved: 4, wholeOriginalDashboardTwoSeamInverse: true, unchangedHelperAndLearner: true, syntheticRenderedFixtures: 6, sourceAndWorksheetMutation: false, fullAppGraphOrStrictCompiler: false, noNewAssetsOrDependencies: true },
  localArtifacts,
  remoteArtifacts: [...rows.map(r => ['atlas/' + r.path, stage + '/atlas/' + r.path]), ...recipes.map(file => ['recipes/' + file, file])],
  pending: 'Compose the two changed source paths with the prepared right-gastric native on a NEW coherent source, regenerate Review bindings, then run focused original tests, actual strict graph/build and exports serially after the frozen full run is terminal. No Website generated Review hand edits. Browser/signed-in acceptance pending; preserve current preview.',
  summary: { focusedCases: 6, wholePriorInverse: true, integrated: false, browserAccepted: false },
});
console.log(JSON.stringify(result));
