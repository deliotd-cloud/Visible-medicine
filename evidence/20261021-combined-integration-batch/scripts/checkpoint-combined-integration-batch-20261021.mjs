import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-combined-integration-batch';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-combined-integration-batch-ready';
const atlas = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T01-02-30.477Z/observation.json';
assert(!fs.existsSync(root));
const manifest = json(stage + '/BATCH_MANIFEST.json');
assert.equal(sha(read(stage + '/BATCH_MANIFEST.json')), '2558e591cc2afd389fc802d0646db6f39034156266649ce4986f7c08b55a21e7');
assert.equal(manifest.source, source); assert.equal(manifest.paths.length, 28);
assert(manifest.bodyDispatcherInverse && manifest.packageOtherFieldsPreserved && manifest.earlierNoticesPreserved);
assert.equal(manifest.nativeGate.cases, 4); assert(manifest.nativeGate.actualPackageAliasPass);
const observation = json(observationPath);
assert.equal(sha(read(observationPath)), '319402bd9f0ed0b753ff66843917f98e3ad12c7d2e6814f7347f454034202b65');
assert(observation.processesConfirmedLive && !observation.terminalReceiptObserved && observation.ownerPreviewRunning);
assert.equal(observation.namedInputsVerified, 5053);
const files = [], selected = [];
fs.mkdirSync(root);
function copy(from, rel, remote = true) {
  const bytes = read(from), dest = root + '/' + rel;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, bytes, { flag: 'wx' }); assert.equal(sha(read(dest)), sha(bytes));
  const row = { path: rel, bytes: bytes.length, sha256: sha(bytes), remoteSelected: remote };
  files.push(row); if (remote) selected.push(row);
}
for (const row of manifest.paths) {
  assert.equal(sha(read(stage + '/' + row.lane + '/' + row.path)), row.finalSha256);
  copy(stage + '/' + row.lane + '/' + row.path, 'batch/' + row.lane + '/' + row.path);
  if (row.beforeSha256) copy(stage + '/originals/' + row.lane + '/' + row.path + '.raw', 'originals/' + row.lane + '/' + row.path + '.raw');
}
for (const p of ['PREPARATION.json', 'BATCH_MANIFEST.json', 'README.md', 'seal-batch.mjs']) copy(stage + '/' + p, 'batch/' + p);
const context = stage + '/native-dental-context', contextPrep = json(context + '/PREPARATION.json');
for (const row of contextPrep.copiedInputs) {
  assert.equal(sha(read(context + '/' + row.path)), row.sha256);
  copy(context + '/' + row.path, 'local-native-context/' + row.path, false);
}
for (const p of ['PREPARATION.json', 'DENTAL_NATIVE_ALIAS.log', 'DENTAL_NATIVE_ALIAS.json']) copy(context + '/' + p, 'native-evidence/' + p);
copy('F:/VisibleMedicine/staging/20261021-dental-native-gate/worker/HANDOFF.md', 'native-worker/HANDOFF.md');
copy('F:/VisibleMedicine/staging/20261021-dental-native-gate/worker/FILES.json', 'native-worker/FILES.json');
copy(observationPath, 'full-suite/observation.json');
for (const p of ['prepare-combined-integration-batch-20261021.mjs', 'prepare-dental-native-context-20261021.mjs', 'checkpoint-combined-integration-batch-20261021.mjs']) copy(p, 'scripts/' + p);
const summary = {
  at: new Date().toISOString(), phase: 'coherent staged integration lanes and portable native dental gate; not source admission', source,
  stagedPaths: 28, atlasPaths: 15, websiteUiPaths: 11, website485AssurancePaths: 2,
  phasesKeptSeparate: true, checkpointOriginsVerified: true,
  nativeCases: 4, exactRawAndDisplayDentalRecords: 28, sharedMethodNotes: 4,
  wrongTabOrRecordMutationsRefused: 868, unrelatedRawRecordsRefused: true,
  actualPackageAliasPass: true, nativeLogSha256: manifest.nativeGate.logSha256,
  contextInputs: contextPrep.copiedInputs.length, contextBytes: manifest.nativeGate.contextBytes,
  fullBodyDispatcherExecuted: false, wholeOriginalBodyInverse: true,
  allOtherPackageFieldsPreserved: true, previousNoticesPreserved: true,
  prototypeOnlyTestsExcluded: true,
  firstPreparationCorrection: 'Initial create-only preflight failed before its first file copy because hip checkpoint files live under source/ although their manifest paths are relative. Exact error remains in the tool transcript; no raw log file is claimed. Corrected only the recovery disk prefix; full batch seal then passed. Frozen Website, source and owner preview unchanged.',
  scope: 'One checkpoint-backed source/test/UI batch, with current485 assurance separate from future-source admission. Portable gate executes the actual pure dental helper/display catalogue and records whole identities, source frame/catalogue/member metadata, refusal/copy safety and explicit primary-study limits. Project-MIT factual-note reference notice added without importing cited assets. No new asset/dependency/fee or clinical/registration grant.',
  observation: { path: observationPath, sha256: sha(read(observationPath)), live: true, terminal: false, frozenInputs: 5053 },
  limits: 'Uncommitted flat batch and partial native metadata context only. Full actual body dispatcher/history/topic/packet transition, new hip wrapper end-to-end, renderer binding, stock Review/learner generation, source/Website types/build/native integration and actual integrated browser gates remain. Native dependency contents reused, not installed or lockfile-byte attested. Four shared method notes are not28unique lessons, source meshes or acquired MRI.',
  sourceCommitted: false, newHipWrapperEndToEndPass: false, fullResolverTransitionPass: false,
  stockExportsGenerated: false, websiteImported: false, canonicalInstalled: false,
  fullSuitePass: false, newIntegratedBrowserAcceptance: false, clinicalApproval: false,
  spatialRegistration: false, publicDeployment: false, fullGoalActive: true,
};
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
copy(root + '/MAIN_REVIEW.json', 'evidence/MAIN_REVIEW.json');
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-keyboard-zoom-proposal-backup';
const parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
assert.equal(parent.head, '4918047dc57a6bf0060ac3f686a75b889403c7a2');
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(r => {
  const b = read(parentRoot + '/remote-source-restored/' + r.path); assert.equal(sha(b), r.sha256); return [r.path, b];
}));
for (const row of selected) values.set('evidence/20261021-combined-integration-batch/' + row.path, read(root + '/' + row.path));
const verify = () => {
  assert.equal(runGit(['-C', atlas, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', atlas, 'status', '--porcelain']).toString().trim(), '');
  for (const r of files) assert.equal(sha(read(root + '/' + r.path)), r.sha256);
  for (const r of manifest.paths) assert.equal(sha(read(stage + '/' + r.lane + '/' + r.path)), r.finalSha256);
};
verify();
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-combined-integration-batch-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-combined-integration-batch-20261021.git', branch: 'backup/atlas-combined-integration-batch-20261021',
  files: [...values].map(([path, b]) => ({ path, bytes: b.length, sha256: sha(b) })).sort((a, b) => a.path.localeCompare(b.path)),
  bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlas: source, proposalOnly: true, manifestSha256: sha(read(stage + '/BATCH_MANIFEST.json')), canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { focusedNativeCases: 4, exactSourceDentalRecords: 28, aliasPass: true, fullResolverTransitionPass: false, fullSuitePass: false, clinicalApproval: false },
  scope: 'Selected uninstalled28-path staged source/test/UI batch, native gate, notices, exact preimages and focused proof on prior filtered ancestry.112-file partial native metadata context remains F-local. No raw canonical ancestry, models/scans/masks, private modules/reviews/databases/secrets or browser media/DOM. Not whole/runnable/private-data backup, generated source admission or clinical acceptance.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...summary, manifestSha256: sha(read(stage + '/BATCH_MANIFEST.json')), files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')), head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'Wait for actual terminal of already-running frozen Website suite, inspect all failure receipts, run actual current485 two-module repair and original485 new hip wrapper, then admit coherent source lanes through unchanged full current/history/topic/packet/renderer/export/Review/Website gates. No synthetic current-source hash updates or hand-edited generated modules. Preserve all71/eight roadmap, independent clinical review and owner open forms.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')), paths: 28, nativeCases: 4, backup: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths, canonicalInstalled: false }));
