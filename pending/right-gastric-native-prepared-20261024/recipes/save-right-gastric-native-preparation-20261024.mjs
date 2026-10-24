import assert from 'node:assert/strict';
import { saveProposal } from './source-proposal-checkpoint.mjs';
import { read, json, sha } from './source-only-backup-20261019.mjs';
import { nativeAtlasEnvironment } from './native-atlas-environment-20261022.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-native', site = stage + '/atlas';
const statePath = stage + '/SOURCE_STATE.json', state = json(statePath), preparation = json(stage + '/PREPARATION.json');
assert.equal(sha(read(statePath)), '2f4fd70257a5fe0ceeb88725a4dd27712d1a2ad09b0f5f34e0ddd55db4fbc111');
assert.equal(state.sourcePaths, 6389); assert.equal(state.changedPaths.length, 6);
const rows = state.changedRows;
const localArtifacts = [
  [statePath, 'SOURCE_STATE.json'], [stage + '/PREPARATION.json', 'PREPARATION.json'],
  [stage + '/OBJECT_STORE_CLOSURE.before.json', 'OBJECT_STORE_CLOSURE.before.json'],
  [stage + '/OBJECT_STORE_CLOSURE.json', 'OBJECT_STORE_CLOSURE.json'],
  [stage + '/HANDOFF.integration.md', 'HANDOFF.integration.md'],
  [stage + '/WORKER_ORIGINAL.integration.mjs.raw', 'WORKER_ORIGINAL.integration.mjs.raw'],
  [stage + '/INITIAL_SHELL_REFUSAL.json', 'INITIAL_SHELL_REFUSAL.json'],
  [state.parentReceipt, 'PARENT_SOURCE_BOUND.json'],
  ['F:/VisibleMedicine/staging/20261024-studio-storage-browser-preparation/ASSIGNMENT.json', 'STUDIO_ASSIGNMENT.json'],
];
const localHashes = localArtifacts.map(([p]) => [p, sha(read(p))]);
function verify() {
  assert.equal(sha(read(statePath)), '2f4fd70257a5fe0ceeb88725a4dd27712d1a2ad09b0f5f34e0ddd55db4fbc111');
  for (const row of state.sourceRows) assert.equal(sha(read(site + '/' + row.path)), row.sha256, row.path);
  for (const [p, expected] of localHashes) assert.equal(sha(read(p)), expected);
  assert.equal(sha(read(state.parentReceipt)), state.parentReceiptSha256);
  nativeAtlasEnvironment({ atlas: preparation.parentAtlas, revision: state.parentHead, tree: state.parentTree });
  const current = json('CURRENT_CHECKPOINT.json'); assert.equal(current.goal.status, 'active');
  assert.equal(current.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
}
const remoteArtifacts = [
  ['atlas/scripts/test-right-gastric-eus-integration.mjs', site + '/scripts/test-right-gastric-eus-integration.mjs'],
  ['atlas/package.json', site + '/package.json'],
];
for (const file of ['prepare-right-gastric-eus-native-20261024.mjs', 'flatten-right-gastric-native-objects-20261024.mjs', 'verify-right-gastric-native-source-20261024.mjs', 'save-right-gastric-native-preparation-20261024.mjs']) remoteArtifacts.push(['recipes/' + file, file]);
const result = saveProposal({
  id: 'right-gastric-native-prepared-20261024', key: 'pendingRightGastricEusProposal',
  root: 'F:/VisibleMedicine/recovery/checkpoints/20261024-right-gastric-eus-native-prepared', stage, site, rows, verify,
  milestone: 'Complete source-tree preparation for right gastric EUS integration; no fresh generated revisions/build or runtime integration acceptance',
  parent: { receipt: 'F:/VisibleMedicine/recovery/checkpoints/20261024-right-gastric-eus-proposal-source-backup/github-backup.json', receiptSha256: '9d53077a547510394835849f7821c1a09b633f151eb0f3c8b55c56ed32a14e6b', repo: 'F:/VisibleMedicine/history/website-work/github-right-gastric-eus-proposal-20261024.git' },
  backupRepo: 'F:/VisibleMedicine/history/website-work/github-right-gastric-native-prepared-20261024.git',
  sourceIdentity: { nativeParent: state.parentHead, nativeParentTree: state.parentTree, preparedSourceManifest: statePath, preparedSourceManifestSha256: sha(read(statePath)), kind: 'uncommitted-unbuilt-native-source-preparation' },
  backupScope: 'Verified filtered source ancestry, the new actual integration regression, package command and four preparation/verification/recovery recipes. The two authored EUS source edits and unit test remain in inherited verified backup5dcf. Native notice addition, complete local manifests, QA/assignment evidence and later coordination remain F-local. No scans, masks, models, patient data, private decisions/references, generated runtime/build/dependencies or raw logs. Not whole/private/runnable off-device recovery; no installation or public deployment.',
  proof: {
    preparedSourcePaths: state.sourcePaths, intendedChangedPaths: 6, unaffectedSuccessorParentPaths: 6383,
    wholeOriginalSourceInverses: 2, wholePreviousPackageRestored: true, wholePreviousNoticePreserved: true,
    dependenciesAndDispatchUnchanged: true, actualHeadStillParent: true, sourceUnitCasesPreviouslyPassed: 7,
    workerOriginalSyntaxChecked: true, correctedIntegrationSyntaxChecked: true, integrationCasesAuthored: 6,
    integrationCasesExecuted: false, generatedRevisionsStillParent: true, strictTypesRun: false,
    productionBuild: false, learnerOrReviewExport: false, websiteIntegration: false,
  },
  review: {
    at: new Date().toISOString(), classification: 'Prepared complete native source, not a sealed/built revision or Website successor',
    sourceState: statePath, sourceStateSha256: sha(read(statePath)), rows,
    workerModel: 'gpt-6-sol', workerEffort: 'medium', workerTokens: 'unavailable',
    mainCorrections: [
      'Preserved unchanged geometry/source records while independently recomputing actual renderer-bound geometry revision; a changed renderer cannot inherit prior display approval.',
      'Replaced an arbitrary malformed geometry revision with another actual source selection\u2019s well-formed geometry revision as the foreign-source refusal case.',
      'Flattened only the newly-created clone\u2019s object-store index, preserving all source/parent stores and required historical commits after clone depth warnings.',
    ],
    syntaxEvidence: { workerOriginalSha256: state.workerOriginalSha256, mainCorrectedSourceSha256: state.correctedIntegrationSourceSha256, mainNodeCheckExitCode: 0, observedToolChunk: '888385', mainNodeCheckOnly: true },
    pending: state.queuedVerification, noClinicalOrSpatialApproval: true,
  },
  localArtifacts, remoteArtifacts,
  pending: 'Run stock native generators and freshness checks, actual13unit/integration cases and retained historical EUS theorem, configured strict graph and build serially after the same frozen full diagnostic is terminal. Then all four learner exports and fresh protected Review/Website integration. Keep preview unchanged.',
  summary: { priorProposalCheckpoint: preparation.copiedVerifiedProposal, priorProposalSha256: preparation.copiedVerifiedProposalSha256, preparedSourcePaths: 6389, priorUnitCases: 7, authoredIntegrationCases: 6, integrationExecuted: false, generatedRevisionsStillParent: true, nativeBuilt: false, integrated: false },
});
console.log(JSON.stringify(result));
