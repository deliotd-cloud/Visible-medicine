import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-keyboard-zoom-proposal';
const atlas = 'F:/VisibleMedicine/staging/20261020-inbox-material-source', source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-keyboard-zoom-proposal-ready'; assert(!fs.existsSync(root));
const prep = json(stage + '/PREPARATION.json'), changed = ['app/fitted-camera.tsx', 'lib/camera-keyboard.ts'];
const gitBytes = p => runGit(['-C', atlas, 'show', source + ':' + p]);
for (const row of prep.copiedInputs) {
  assert.equal(sha(read(atlas + '/' + row.path)), row.sha256);
  if (!changed.includes(row.path)) assert.equal(sha(read(stage + '/' + row.path)), row.sha256, 'Unchanged native context ' + row.path);
}
for (const p of [...changed, 'scripts/test-camera-keyboard.mjs']) assert.deepEqual(read(stage + '/originals/' + p + '.raw'), gitBytes(p));
for (const p of ['public/models/bodyparts3d/full-body/catalog.json', 'scripts/test-guided-camera-interruption.mjs']) assert.deepEqual(read(stage + '/' + p), gitBytes(p));
const pkg = json(stage + '/package.json'), oldPkg = JSON.parse(gitBytes('package.json'));
assert.deepEqual(read(stage + '/originals/package.json.raw'), gitBytes('package.json'));
const expectedAlias = oldPkg.scripts['camera-keyboard:test'].replace('scripts/test-camera-keyboard.mjs &&', 'scripts/test-camera-keyboard.mjs scripts/test-camera-keyboard-zoom.mjs &&');
assert.equal(pkg.scripts['camera-keyboard:test'], expectedAlias); const pkgInverse = structuredClone(pkg); pkgInverse.scripts['camera-keyboard:test'] = oldPkg.scripts['camera-keyboard:test']; assert.deepEqual(pkgInverse, oldPkg);
function check(label, pass = 0) {
  const r = json(stage + '/' + label + '.json'); assert.equal(r.code, 0); assert.equal(r.signal, null); assert.equal(sha(read(r.log)), r.logSha256);
  if (pass) assert(r.footer.some(l => l.endsWith('pass ' + pass)) && r.footer.some(l => l.endsWith('fail 0')) && r.footer.some(l => l.endsWith('skipped 0')));
  return r;
}
const unit = check('KEYBOARD_ZOOM_FINAL', 23), alias = check('KEYBOARD_PACKAGE_ALIAS_NODE', 23);
const interruption = read(alias.log).toString().split(/\r?\n/).filter(l => l.startsWith('{')).map(l => JSON.parse(l)).find(r => r.normalAndShiftInterruptions);
assert(interruption?.passed && interruption.lockedAndNonArrowRejection && interruption.capturePersistence);
assert.equal(json(stage + '/KEYBOARD_EXISTING.json').code, 1); assert.equal(json(stage + '/KEYBOARD_ZOOM_NATIVE.json').code, 1);
const admission = [...changed, 'package.json', 'scripts/test-camera-keyboard-zoom.mjs', 'docs/KEYBOARD_ZOOM.md'];
const files = [], scopeFiles = [];
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T00-42-28.195Z/observation.json';
const observation = json(observationPath); assert.equal(observation.namedInputsVerified, 5053); assert.equal(observation.ownerPreviewRunning, true);
const summary = { at: new Date().toISOString(), phase: 'uncommitted source-only anatomical camera keyboard zoom proposal', source,
  runtimeFiles: changed, admissionPaths: admission, actualNativeTests: 23, originalKeyboardCases: 14, newZoomCases: 9,
  originalKeyboardScriptUnchanged: true, originalGuidedInterruptionScriptUnchanged: true, completePackageAliasPass: true,
  unitLogSha256: unit.logSha256, aliasLogSha256: alias.logSha256, guidedInterruption: interruption,
  behavior: 'Focused shared anatomical camera +/= in and -/_ out; one existing listener. Perspective distance and orthographic scale preserve target/direction. Existing bounds, saved-scale/pan/refit/resize, ordinary arrows and lock/modifier/composition/focus guards retained. No new revision input path; affected runtime files already renderer-bound. No source geometry, selection, physical measurement, scan position or clinical state change.',
  originalFailures: ['13/14 old-suite sandbox lacked a literal-read catalogue; exact unchanged source metadata added without removing assertions.', '22/23 new batch wrongly asserted raw orthographic zoom rather than equivalent world frustum. Original new test saved; corrected test proves extent and relative saved scale/pan across refits and resize.', 'Attempt to spawn npm.cmd through the no-shell logger failed EINVAL synchronously before its pending log stream opened; original exec tool output is recorded in structured evidence. Normal alias then executed successfully through existing installed npm CLI on Node.'],
  preservedPartialRecovery: 'F:/VisibleMedicine/recovery/checkpoints/20261021-keyboard-zoom-proposal remains untouched as partial preflight evidence; its first checkpoint helper expected a log the synchronous launcher never wrote. No remote backup had started. This create-only ready checkpoint is the complete one.',
  limits: 'Native focused component/input and actual existing package alias only. Not full types/build, stock renderer/selection checks, browser/GPU, generated source/Review/learner/Website admission or clinical acceptance. Dependencies reused, not installed or claimed lockfile-byte-attested. All original failure receipts/preimages remain.',
  observation: { path: observationPath, sha256: sha(read(observationPath)), liveAtObservation: observation.processesConfirmedLive, terminalAtObservation: observation.terminalReceiptObserved, frozenInputs: 5053 },
  sourceCommitted: false, stockExportsGenerated: false, websiteImported: false, canonicalInstalled: false, newBrowserAcceptance: false,
  fullSuitePass: false, geometryChanged: false, clinicalApproval: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true };
fs.mkdirSync(root);
function copy(from, rel, remote = true) {
  const b = read(from), to = root + '/' + rel; fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, b, { flag: 'wx' }); assert.equal(sha(read(to)), sha(b));
  const row = { path: rel, bytes: b.length, sha256: sha(b), remoteSelected: remote }; files.push(row); if (remote) scopeFiles.push(row);
}
for (const p of [...new Set([...prep.copiedInputs.map(r => r.path), 'public/models/bodyparts3d/full-body/catalog.json', 'scripts/test-guided-camera-interruption.mjs'])]) copy(stage + '/' + p, 'local-native-context/' + p, false);
for (const p of admission) copy(stage + '/' + p, 'proposal/' + p);
for (const p of ['app/fitted-camera.tsx.raw', 'lib/camera-keyboard.ts.raw', 'scripts/test-camera-keyboard.mjs.raw', 'package.json.raw', 'test-camera-keyboard-zoom-before-world-extent.mjs.raw']) copy(stage + '/originals/' + p, 'originals/' + p);
for (const p of ['PREPARATION.json', 'HANDOFF.md', 'KEYBOARD_EXISTING.log', 'KEYBOARD_EXISTING.json', 'KEYBOARD_EXISTING_WITH_CATALOG.log', 'KEYBOARD_EXISTING_WITH_CATALOG.json', 'KEYBOARD_ZOOM_NATIVE.log', 'KEYBOARD_ZOOM_NATIVE.json', 'KEYBOARD_ZOOM_WORLD_EXTENT.log', 'KEYBOARD_ZOOM_WORLD_EXTENT.json', 'KEYBOARD_ZOOM_FINAL.log', 'KEYBOARD_ZOOM_FINAL.json', 'WINDOWS_NPM_SPAWN_FAILURE.json', 'KEYBOARD_PACKAGE_ALIAS_NODE.log', 'KEYBOARD_PACKAGE_ALIAS_NODE.json']) copy(stage + '/' + p, 'evidence/' + p);
copy(stage + '/scripts/test-guided-camera-interruption.mjs', 'originals/scripts/test-guided-camera-interruption.mjs');
copy(observationPath, 'full-suite/observation.json'); copy(import.meta.filename, 'checkpoint-keyboard-zoom-20261021.mjs');
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' }); copy(root + '/MAIN_REVIEW.json', 'evidence/MAIN_REVIEW.json');
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-source-credits-notices-backup', parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(r => { const b = read(parentRoot + '/remote-source-restored/' + r.path); assert.equal(sha(b), r.sha256); return [r.path, b]; }));
for (const row of scopeFiles) values.set('evidence/20261021-keyboard-zoom-proposal/' + row.path, read(root + '/' + row.path));
const verify = () => { assert.equal(runGit(['-C', atlas, 'rev-parse', 'HEAD']).toString().trim(), source); assert.equal(runGit(['-C', atlas, 'status', '--porcelain']).toString().trim(), ''); for (const r of files) assert.equal(sha(read(root + '/' + r.path)), r.sha256); for (const p of admission) assert.deepEqual(read(stage + '/' + p), read(root + '/proposal/' + p)); };
verify();
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-keyboard-zoom-proposal-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-keyboard-zoom-proposal-20261021.git', branch: 'backup/atlas-keyboard-zoom-proposal-20261021',
  files: [...values].map(([path, b]) => ({ path, bytes: b.length, sha256: sha(b) })).sort((a, b) => a.path.localeCompare(b.path)), bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlas: source, proposalOnly: true, sourceFiles: admission.map(p => ({ path: p, sha256: sha(read(stage + '/' + p)) })), canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { focusedTests: 23, originalCasesRetained: 14, newCases: 9, completeCameraKeyboardAliasPass: true, fullSuitePass: false, clinicalApproval: false },
  scope: 'Selected uninstalled anatomical-camera/test/docs/package-script source, original preimages and actual focused proof on prior filtered ancestry only. Full native context remains F-local. No raw canonical ancestry, scans/masks/models, browser pixels/DOM, private modules/reviews/databases/secrets. Not whole/runnable/private-data backup or new renderer/application/clinical acceptance.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...summary, files, backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')), head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'After actual full Website terminal, inspect all results and coherently admit bounded source/test/header/credits/keyboard work via unchanged stock generation/binding. Run remaining affected camera/renderer/selection/navigation tests, full source/Website types/build and actual integrated browser checks before local cutover. Preserve all71/eight roadmap, independent private clinical decisions and owner forms.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')), nativeCases: 23, originalCases: 14, packageAliasPass: true, backup: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths, canonicalInstalled: false }));
