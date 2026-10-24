import assert from 'node:assert/strict';
import { saveProposal } from './source-proposal-checkpoint.mjs';
import { nativeAtlasEnvironment } from './native-atlas-environment-20261022.mjs';
import { read, json, sha } from './source-only-backup-20261019.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-proposal', site = stage + '/atlas';
const preparation = json(stage + '/PREPARATION.json');
const terminal = json(stage + '/checks/TERMINAL.json');
const inverse = json(stage + '/checks/SOURCE_INVERSE.json');
assert.equal(sha(read(stage + '/PREPARATION.json')), 'e618d406bab6a423d181349a8075f2ae274fdc5ecfce816ecb753fe579d10b06');
assert.equal(sha(read(stage + '/checks/TERMINAL.json')), 'cdf1e36f5ea723ecdce6a15b86765f730d117526a404d53882b6a4986327722a');
assert.equal(terminal.exitCode, 0); assert.equal(terminal.unitCases, 7);
assert.equal(terminal.exactWholeSourceInverses, 2); assert.equal(inverse.rows.length, 2);
const sourcePaths = ['content/abdominal-eus-orientation.ts', 'lib/abdominal-eus-orientation.ts', 'scripts/test-right-gastric-eus-unit.mjs'];
const rows = sourcePaths.map(path => ({ path, bytes: read(site + '/' + path).length, sha256: sha(read(site + '/' + path)) }));
const localPaths = ['PREPARATION.json', 'EVIDENCE.md', 'THIRD_PARTY_NOTICE_ADDENDUM.md', 'HANDOFF.md', 'checks/STARTED.json', 'checks/TERMINAL.json', 'checks/SOURCE_INVERSE.json', 'checks/stdout.log', 'checks/stderr.log'];
const localArtifacts = localPaths.map(path => [stage + '/' + path, path]);
for (const row of preparation.files) localArtifacts.push([stage + '/preimages/' + row.path + '.raw', 'preimages/' + row.path + '.raw']);
localArtifacts.push([preparation.parentReceipt, 'PARENT_SOURCE_BOUND.json'], [preparation.pendingReport, 'PARENT_PENDING.json']);
const localHashes = localArtifacts.map(([from]) => [from, sha(read(from))]);
function verify() {
  assert.equal(sha(read(preparation.parentReceipt)), preparation.parentReceiptSha256);
  nativeAtlasEnvironment({ atlas: preparation.parentNative, revision: preparation.atlasHead, tree: preparation.atlasTree });
  for (const row of preparation.files) {
    assert.equal(sha(read(preparation.parentNative + '/' + row.path)), row.sha256);
    assert.equal(sha(read(stage + '/preimages/' + row.path + '.raw')), row.sha256);
    assert.equal(sha(read(site + '/' + row.path)), rows.find(r => r.path === row.path)?.sha256 ?? row.sha256);
  }
  for (const row of rows) assert.equal(sha(read(site + '/' + row.path)), row.sha256);
  for (const [from, hash] of localHashes) assert.equal(sha(read(from)), hash);
  for (const row of inverse.rows) {
    assert.equal(sha(read(preparation.parentNative + '/' + row.path)), row.parentSha256);
    let restored = read(site + '/' + row.path).toString('utf8');
    for (const addition of row.additions) { assert.equal(restored.split(addition).length, 2); restored = restored.replace(addition, ''); }
    assert.deepEqual(Buffer.from(restored), read(preparation.parentNative + '/' + row.path));
  }
  const current = json('CURRENT_CHECKPOINT.json');
  assert.equal(current.goal.status, 'active'); assert.equal(current.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
}
const remoteArtifacts = rows.map(row => [row.path, site + '/' + row.path]);
for (const path of ['prepare-right-gastric-eus-proposal-20261024.mjs', 'run-right-gastric-eus-unit-20261024.mjs', 'save-right-gastric-eus-proposal-20261024.mjs']) remoteArtifacts.push(['recipes/' + path, path]);
const result = saveProposal({
  id: 'right-gastric-eus-proposal-20261024', key: 'pendingRightGastricEusProposal',
  root: 'F:/VisibleMedicine/recovery/checkpoints/20261024-right-gastric-eus-proposal', stage, site, rows, verify,
  milestone: 'Source-bound right gastric vein linear-EUS teaching: seven focused cases, partial native proposal only',
  parent: { receipt: 'F:/VisibleMedicine/recovery/checkpoints/20261024-release-repair-batch-proposal-source-backup/github-backup.json', receiptSha256: 'e33fb135b8f524c94e1feb9f9e37d90dcba7d8066bb71751218f6ce9a93a2bf0', repo: 'F:/VisibleMedicine/history/website-work/github-release-diagnostic-repairs-20261024.git' },
  backupRepo: 'F:/VisibleMedicine/history/website-work/github-right-gastric-eus-proposal-20261024.git',
  sourceIdentity: { parentNative: preparation.atlasHead, parentNativeTree: preparation.atlasTree, kind: 'partial-original-educational-draft-only', target: preparation.targetId },
  backupScope: 'Verified inherited filtered source ancestry plus two changed original educational/binder source files, one unit test and three recipes. No copied publisher assets/text, scans, masks, models, patient identifiers, private references/decisions, generated delivery, dependencies, build output or raw QA. Notice addendum, evidence ledger, current inventory and later coordination remain F-local. Not a whole/private/runnable off-device backup; no deployment or installation.',
  proof: { partialOnly: true, actualModuleUnitCases: 7, wrongSelectionMutations: 28, sequentialSmallBundles: 2, wholeOriginalSourceInverses: 2, previousThreeLessonsExactlyPreserved: true, sourceUnvalidated: true, noNewAssetDependencyOrFee: true, articleAssetLicenceReliedUpon: false, fullResolverCohortRun: false, strictTypecheck: false, generatorsOrBuild: false, learnerOrReviewExport: false, websiteIntegration: false },
  review: { at: new Date().toISOString(), primary: preparation.primaryReference, factualBasis: 'Official indexed primary text; direct reader access limited. No publisher media downloaded/copied.', targetIdentity: preparation.targetIdentity, sourceRows: rows, unitEvidence: terminal, wholeFileInverseSha256: sha(read(stage + '/checks/SOURCE_INVERSE.json')), noticeAddendumSha256: sha(read(stage + '/THIRD_PARTY_NOTICE_ADDENDUM.md')), clinicalApproval: false, patientSpaceRegistration: false, originalLessonTitleAvoidsDuplicateStructureName: true, pending: 'Coherent native resolver cohort, types/generators/build, four exports, Review and Website integration followed by exact-revision clinical review. Keep frozen full diagnostic and owner preview unchanged.' },
  localArtifacts, remoteArtifacts,
  pending: 'Partial draft only; complete candidate remains cf587b/native6e. All complete resolver, build, export, Review and clinical gates remain. Keep ordinary preview unchanged.',
  summary: { unitCases: 7, originalWholeFilesRestored: 2, priorLessonsPreserved: 3, fullResolverCohortRun: false, integrated: false },
});
console.log(JSON.stringify(result));
