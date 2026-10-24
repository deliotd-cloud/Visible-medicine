import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { saveProposal } from './source-proposal-checkpoint.mjs';
import { read, json, sha } from './source-only-backup-20261019.mjs';

const site = 'F:/VisibleMedicine/staging', stage = site + '/20261024-independent-qa-proposals';
if (process.argv[2] === '--resume-after-verified-preflight') {
  assert.deepEqual(fs.readdirSync(stage), ['INITIAL_PREFLIGHT_REFUSAL.json']);
  assert.equal(json(stage + '/INITIAL_PREFLIGHT_REFUSAL.json').backupStarted, false);
} else { assert(!fs.existsSync(stage)); fs.mkdirSync(stage); }
const eye = site + '/20261024-eye-epoch-repair-main';
const studio = site + '/20261024-studio-storage-browser-preparation/proposal';
const sourceReceipt = site + '/20261024-pancreatic-us-website/SOURCE_BOUND.json';
assert.equal(sha(read(sourceReceipt)), 'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
const source = json(sourceReceipt), sourceRows = new Map(source.sourceRows.map(row => [row.path, row]));
const controls = json(eye + '/checks/stdin-v3/TERMINAL.json');
assert.equal(controls.exitCode, 0); assert.deepEqual(controls.counts, { tests: 11, pass: 11, fail: 0, cancelled: 0, skipped: 0, todo: 0 });
const inverse = json(eye + '/checks/stdin-v3/MAIN_INVERSE.json');
assert.equal(inverse.candidateSha256, '34028e3a00d5b015b1332dc989b70a0289bc80cb7419270d8fd01152228df660');
assert.equal(inverse.seams.length, 3);
const selected = [eye + '/candidate/tests/atlas-eye-layer-guide.test.ts', eye + '/test-eye-history-closure-unit.mjs', ...['bundle.mjs', 'entry.mjs', 'router.mjs', 'server.mjs', 'fixture.css', 'index.html', 'REPLAY.md'].map(p => studio + '/' + p)];
const rows = selected.map(file => {
  const relative = path.relative(site, file).replaceAll('\\', '/'); assert(!relative.startsWith('../') && !path.isAbsolute(relative));
  const bytes = read(file); new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) };
});
const studioV1 = json(studio + '/HANDOFF.json'), studioV2 = json(studio + '/HANDOFF.v2.json');
for (const [file, hash] of Object.entries(studioV1.fixtureHashes)) assert.equal(sha(read(studio + '/v1/' + file)), hash);
assert.equal(sha(read(studio + '/v1/HANDOFF.json')), studioV2.v1Hashes['HANDOFF.json']);
for (const [file, hash] of Object.entries(studioV2.currentHashes)) {
  const preserved = file === 'HANDOFF.json' ? studio + '/v1/' + file : studio + '/main-v2-original/' + file;
  assert.equal(sha(read(preserved)), hash);
  if (file === 'HANDOFF.json') assert.equal(sha(read(studio + '/' + file)), hash);
}
const baselineStudio = Object.entries(studioV1.sourceHashes).map(([file, hash]) => ({ file, hash }));
for (const { file, hash } of baselineStudio) { assert.equal(sourceRows.get(file).sha256, hash); assert.equal(sha(read(source.website + '/' + file)), hash); }
const restoreEye = text => {
  for (const seam of inverse.seams) { assert.equal(text.split(seam.after).length, 2); text = text.replace(seam.after, seam.before); }
  assert.equal(sha(text), inverse.originalSha256); return text;
};
assert.deepEqual(Buffer.from(restoreEye(read(eye + '/candidate/tests/atlas-eye-layer-guide.test.ts').toString())), read(source.website + '/tests/atlas-eye-layer-guide.test.ts'));
const localArtifacts = [
  [stage + '/INITIAL_PREFLIGHT_REFUSAL.json', 'INITIAL_PREFLIGHT_REFUSAL.json'],
  [eye + '/WORKER.HANDOFF.json', 'eye/WORKER.HANDOFF.json'], [eye + '/WORKER.INVERSE_PROOF.json', 'eye/WORKER.INVERSE_PROOF.json'],
  [eye + '/WORKER.test.ts.raw', 'eye/WORKER.test.ts.raw'], [eye + '/STDIN_ABI_CONTROL.json', 'eye/STDIN_ABI_CONTROL.json'],
  ...['STARTED.json', 'TERMINAL.json', 'MAIN_INVERSE.json', 'stdout.log', 'stderr.log'].map(p => [eye + '/checks/stdin-v3/' + p, 'eye/final/' + p]),
  ...['STARTED.json', 'TERMINAL.json', 'MAIN_INVERSE.json', 'stdout.log', 'stderr.log', 'unit.mjs.raw', 'candidate.test.ts.raw'].map(p => [eye + '/checks/callback-v2/' + p, 'eye/initial-stdin/' + p]),
  ...['unit.mjs.raw', 'MAIN_INVERSE.json', 'FAILURE.json'].map(p => [eye + '/initial-callback-extraction/' + p, 'eye/initial-extraction/' + p]),
  [studio + '/HANDOFF.json', 'studio/HANDOFF.json'], [studio + '/HANDOFF.v2.json', 'studio/HANDOFF.v2.json'],
  [sourceReceipt, 'FROZEN_SOURCE_BOUND.json'],
];
for (const folder of ['v1', 'main-v2-original']) for (const file of fs.readdirSync(studio + '/' + folder)) localArtifacts.push([studio + '/' + folder + '/' + file, 'studio/' + folder + '/' + file]);
const localHashes = localArtifacts.map(([file]) => [file, sha(read(file))]);
const reviewed = { at: new Date().toISOString(), rows, sourceReceipt, sourceReceiptSha256: sha(read(sourceReceipt)), eyeControls: controls.counts, realApplicationGraphBundled: false, originalMedicalTestsRun: false, studioRuntimeOrBrowserRun: false, ownerPreviewChanged: false };
fs.writeFileSync(stage + '/PROPOSALS_BOUND.json', JSON.stringify(reviewed, null, 2) + '\n', { flag: 'wx' });
localArtifacts.push([stage + '/PROPOSALS_BOUND.json', 'PROPOSALS_BOUND.json']);
const verify = () => {
  assert.equal(sha(read(sourceReceipt)), reviewed.sourceReceiptSha256);
  for (const row of rows) assert.equal(sha(read(site + '/' + row.path)), row.sha256);
  for (const [file, hash] of localHashes) assert.equal(sha(read(file)), hash);
  assert.equal(sha(read(source.website + '/tests/atlas-eye-layer-guide.test.ts')), inverse.originalSha256);
  assert.deepEqual(Buffer.from(restoreEye(read(eye + '/candidate/tests/atlas-eye-layer-guide.test.ts').toString())), read(source.website + '/tests/atlas-eye-layer-guide.test.ts'));
  for (const { file, hash } of baselineStudio) assert.equal(sha(read(source.website + '/' + file)), hash);
  const p = json('CURRENT_CHECKPOINT.json'); assert.equal(p.goal.status, 'active'); assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
};
const remoteArtifacts = rows.filter(row => /\.(?:mjs|ts|css)$/.test(row.path)).map(row => [row.path, site + '/' + row.path]);
for (const file of ['run-eye-history-pure-20261024.mjs', 'inspect-esbuild-stdin-20261024.mjs', 'compact-independent-qa-index-20261024.mjs', 'save-independent-qa-proposals-20261024.mjs']) remoteArtifacts.push(['recipes/' + file, file]);
const result = saveProposal({
  id: 'independent-qa-proposals-20261024', key: 'pendingIndependentQaProposals', root: 'F:/VisibleMedicine/recovery/checkpoints/20261024-independent-qa-proposals', stage, site, rows, verify,
  milestone: 'Exact eye-history loader repair and source-bound synthetic Studio QA preparation; no original integration/browser acceptance',
  parent: { receipt: 'F:/VisibleMedicine/recovery/checkpoints/20261024-right-gastric-eus-native-prepared-source-backup/github-backup.json', receiptSha256: '805168c521d67d6926c74c18a53abcdea0df005505d84c6ce6bde6ec2f984694', repo: 'F:/VisibleMedicine/history/website-work/github-right-gastric-native-prepared-20261024.git' },
  backupRepo: 'F:/VisibleMedicine/history/website-work/github-independent-qa-proposals-20261024.git',
  sourceIdentity: { frozenWebsiteReceipt: reviewed.sourceReceiptSha256, kind: 'two-unintegrated-QA-only-proposals', selectedPhysicalRoot: site, explicitPathsOnly: true },
  backupScope: 'Verified inherited filtered source plus the candidate eye theorem, lightweight control script, four Studio fixture scripts/CSS and four recipes. HTML/replay instructions, original/v2 handoffs, manifests, raw/initial QA, history archive and later coordination remain F-local. No product source installation, scans, masks, models, patient/private account data, publisher assets, generated runtime/build/dependencies or raw logs uploaded. Not whole/private/runnable off-device recovery; restore selected files to their recorded physical paths before use. No public deployment.',
  proof: { selectedTextPaths: rows.length, eyeLightweightControls: 11, tinyEsbuildStdinABIProbeApplicationInputs: 0, oldOriginalTestWholeFileInverse: true, originalAssertionChanges: 0, namedHistoricalRoles: 2, windowsPosixFileUrlAndUnknownPathRefusals: true, historicalGitReplacementDisabled: true, candidateSyntaxChecked: true, studioSyntaxSources: 4, studioActualFrozenSourceChecksPrepared: true, studioStorageFailureAndHeldSaveRemainSynthetic: true, studioCssWhitelistedWithoutSourceOutputCollision: true, studioCompiledOutputsIsolated: true, originalApplicationTestOrBundleRun: false, studioRuntimeOrBrowserRun: false },
  review: { at: new Date().toISOString(), baselineSource: reviewed.sourceReceiptSha256, workerModels: 'existing specialist chat settings retained', workerTokens: 'unavailable', mainCorrections: ['Historical stdin namespace is empty in the actual pinned esbuild API; permit only that genuine stdin importer, never current filesystem importers.', 'Refuse Windows, POSIX and file-URL absolute paths and bind both historical trees with replacement objects disabled.', 'Preserve exact original test bytes through three hash-bound seams; exercise the actual callback bodies on real historical Git data.', 'Studio source closure is bound to frozen input rows; props refresh only through the real form\u2019s router.refresh after response.', 'The fixture imports CSS: whitelist its exact bytes, accept separate JS/CSS outputs under .bundle, and never overwrite authored CSS. Resolve the actual existing node_modules root.'], initialFailuresRetained: ['3pass/8fail callback extraction harness', '10pass/1fail actual stdin API contract'], eyeCounts: controls.counts, runtimeAcceptancePending: true, productSourceChanges: 0, previewChanged: false },
  localArtifacts, remoteArtifacts,
  pending: 'After the same frozen1288-root diagnostic is terminal, apply the eye repair alongside the prior11test-only repairs in a coherent successor and run the original eye medical/Review/history/current-refusal cases. Execute the source-bound Studio bundle and real-browser replay separately; do not infer a product defect or signed-in acceptance from synthetic fixture preparation.',
  summary: { eyeControls: 11, originalAssertionsChanged: 0, originalSuitesRun: false, studioRuntimeRun: false, integrated: false },
});
console.log(JSON.stringify(result));
