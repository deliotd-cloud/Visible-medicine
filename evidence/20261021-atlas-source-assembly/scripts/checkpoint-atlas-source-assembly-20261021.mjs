import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const target = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const original = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-atlas-source-assembly-ready';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T01-38-45.750Z/observation.json';
assert(!fs.existsSync(root));
const assembly = json(stage + '/ASSEMBLY.json'), dependencies = json(stage + '/DEPENDENCIES.json');
assert.equal(sha(read(stage + '/ASSEMBLY.json')), '714d0229a92386147fb30dea77e4128e93f5dab625c4dd4c0ebf9ef3231eb5c0');
assert.equal(sha(read(stage + '/DEPENDENCIES.json')), 'cad2c45082ff0eb28a08a27aab76af26dd90390e814ca3379a63afa456745ee0');
assert.equal(dependencies.files.length, 47605); assert.equal(dependencies.totalBytes, 726814102);
const fixes = ['scripts/test-camera-keyboard-zoom.mjs', 'scripts/test-hip-history-entry-refusals.mjs'];
const paths = assembly.appliedPaths.map(r => {
  const b = read(target + '/' + r.path);
  if (!fixes.includes(r.path)) assert.equal(sha(b), r.finalSha256);
  return { ...r, proposedSha256: r.finalSha256, finalSha256: sha(b), bytes: b.length };
});
assert.equal(paths.length, 17);
const camera = read(target + '/' + fixes[0]).toString();
const beforeCamera = read(stage + '/camera-zoom-before-portable-source-pin.mjs.raw').toString();
const cameraAdded = "  // Pin the complete unchanged original suite, without an untracked proposal\n  // directory. This is the exact original485 file hash, not a partial adapter.\n  const original = await readFile(new URL('./test-camera-keyboard.mjs', import.meta.url));\n  assert.equal(createHash('sha256').update(original).digest('hex'), 'd4a5d5a386f7997e2cd4716f4ca966513199239810a4c418113d44e3805241b3');";
assert.equal(camera.replace(cameraAdded, "  const old = await readFile('originals/scripts/test-camera-keyboard.mjs.raw');\n  assert.deepEqual(await readFile('scripts/test-camera-keyboard.mjs'), old);"), beforeCamera);
const nativeScript = read(target + '/scripts/test-camera-keyboard.mjs');
assert.deepEqual(nativeScript, runGit(['-C', original, 'show', source + ':scripts/test-camera-keyboard.mjs']));
assert.equal(sha(nativeScript), 'd4a5d5a386f7997e2cd4716f4ca966513199239810a4c418113d44e3805241b3');
const hip = read(target + '/' + fixes[1]).toString();
const added = "const samePath=(left,right)=>process.platform==='win32'\n ?resolve(left).toLowerCase()===resolve(right).toLowerCase():resolve(left)===resolve(right);\nconst authorCall=(cwd,args)=>samePath(cwd,author.path);\nif(process.platform==='win32')assert(samePath(root,root.replaceAll('\\\\','/').toUpperCase()),'Windows slash/case variants identify the same current root');";
assert.equal(hip.replace(added, 'const authorCall=(cwd,args)=>resolve(cwd).toLowerCase()===resolve(author.path).toLowerCase();')
  .replace('!samePath(entry.path,root)', 'entry.path!==root'), read(stage + '/hip-guards-before-canonical-paths.mjs.raw').toString());
function receipt(label, pass) {
  const r = json(stage + '/' + label + '.json'); assert.equal(r.code, 0); assert.equal(r.signal, null); assert.equal(sha(read(r.log)), r.logSha256);
  if (pass) for (const end of ['pass ' + pass, 'fail 0', 'skipped 0']) assert(r.footer.some(l => l.endsWith(end)));
  return r;
}
const dental = receipt('ASSEMBLED_DENTAL_NATIVE', 4), keyboard = receipt('ASSEMBLED_CAMERA_KEYBOARD_PORTABLE', 23);
const guards = receipt('ASSEMBLED_HIP_GUARDS_CANONICAL'), defaultGit = receipt('ASSEMBLED_HIP_DEFAULT_WITH_FOREIGN');
const guarded = read(guards.log).toString().split(/\r?\n/).filter(l => l.startsWith('{')).map(l => JSON.parse(l)).find(r => r.refusals === 20);
assert(guarded && guarded.originalChildLaunched === false);
const interruption = read(keyboard.log).toString().split(/\r?\n/).filter(l => l.startsWith('{')).map(l => JSON.parse(l)).find(r => r.actualKeyListener);
assert(interruption?.passed && interruption.capturePersistence && interruption.lockedAndNonArrowRejection);
assert.equal(json(stage + '/ASSEMBLED_CAMERA_KEYBOARD.json').code, 1);
assert.equal(json(stage + '/ASSEMBLED_HIP_GUARDS.json').code, 1);
const observation = json(observationPath);
assert.equal(sha(read(observationPath)), 'b1d4fdc2b23b81a04b7dc52c758b5e61244d0f431ac63610c63b799080c8a29b');
assert(observation.processesConfirmedLive && !observation.terminalReceiptObserved && observation.ownerPreviewRunning);
assert.equal(observation.namedInputsVerified, 5053);
const dependencySummary = { files: dependencies.files.length, links: dependencies.links.length, bytes: dependencies.totalBytes,
  manifestSha256: sha(read(stage + '/DEPENDENCIES.json')), originalUnchanged: dependencies.originalUnchanged,
  trackedSourceUnchanged: dependencies.trackedSourceUnchanged, separatePhysicalCopies: true, packageFieldsAndLockPreserved: true,
  installedFromNetwork: false, lockfileByteAttested: false, cachesExcluded: dependencies.excludedRootCaches,
  correction: dependencies.correction };
const summary = { at: new Date().toISOString(), phase: 'isolated actual source assembly with focused combined-source checks', source, target,
  previousGoalTurnClassification: 'progress: browser-observed tour start hint, original test preservation, verified filtered509blob backup; not status-only',
  baseTree: assembly.tree, appliedPaths: paths, sourceCommonSeparate: true,
  frozenOriginalRefsAndTopologyUnaffectedByApplication: true, dependencies: dependencySummary,
  actualDentalNativeCases: 4, actualKeyboardCases: 23, originalKeyboardCases: 14, newKeyboardCases: 9,
  completeKeyboardAliasPass: true, originalGuidedInterruptionPass: interruption, historyGuardRefusals: 20,
  actualDefaultGitHistoryResolverPass: true, wholeHipWrapperExecuted: false, fullBodyTransitionPass: false,
  integrationCorrections: [
    'Camera new test depended on untracked proposal originals/. Replaced only that dependency with a portable URL read and immutable whole-original485SHA. All original14cases and new9cases retained; whole inverse of new test proves no other assertions changed.',
    'History guard test raw path comparison accidentally selected its current root on Windows. Canonical slash/case-aware comparison now excludes current root, with POSIX case retained and a positive Windows alias assertion. Real registered no-checkout wrong-commit fixture exercises the unchanged foreign-commit rejection. All prior guard assertions retained; runtime context/launcher unchanged.'
  ],
  setupCorrections: 'Initial clone succeeded but absolute Git common-dir join failed before source application; explicit clean-clone resume revalidated root/tree/origin/preimages. Dependency64MB preflight rejected existing98MB official workerd before copying; preserved helper and corrected to128KB streaming hashes/kernel copies with256MB/3GB bounds. Early author setup refused before dependency receipt; retried only after actual completion. No original source/dependency mutation or invented raw error log.',
  websiteUiPathsStillSeparate: 11, website485AssurancePathsStillSeparate: 2,
  wholeSuite: { observation: observationPath, sha256: sha(read(observationPath)), live: true, terminal: false, frozenInputs: 5053 },
  limits: 'Actual complete source checkout and focused native checks, not committed/generated/imported/installed or full current/history/topic/packet/renderer/types/build/Review/learner/Website/browser acceptance. New tour-player case still unrun. Historical fixtures/dependency copies are local, not lockfile-byte, clinical or off-device proof. No new assets/dependencies/fees/permissions or desktop PACS changes.',
  sourceCommitted: false, stockExportsGenerated: false, websiteImported: false, canonicalInstalled: false,
  fullSuitePass: false, newBrowserAcceptance: false, clinicalApproval: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true };
fs.mkdirSync(root); const files = [], selected = [];
function copy(from, rel, remote = true) { const b = read(from), to = root + '/' + rel; fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, b, { flag: 'wx' }); assert.equal(sha(read(to)), sha(b)); const r = { path: rel, bytes: b.length, sha256: sha(b), remoteSelected: remote }; files.push(r); if (remote) selected.push(r); }
for (const r of paths) copy(target + '/' + r.path, 'source/' + r.path);
for (const p of ['ASSEMBLY.json', 'RESUME.json', 'PREPARATION.json', 'HIP_AUTHOR.json', 'camera-zoom-before-portable-source-pin.mjs.raw', 'hip-guards-before-canonical-paths.mjs.raw', 'dependency-copy-before-streaming.mjs.raw']) copy(stage + '/' + p, 'evidence/' + p);
copy(stage + '/DEPENDENCIES.json', 'local-dependencies/DEPENDENCIES.json', false);
for (const label of ['ASSEMBLED_DENTAL_NATIVE', 'ASSEMBLED_CAMERA_KEYBOARD', 'ASSEMBLED_CAMERA_KEYBOARD_PORTABLE', 'ASSEMBLED_HIP_GUARDS', 'ASSEMBLED_HIP_GUARDS_CANONICAL', 'ASSEMBLED_HIP_DEFAULT', 'ASSEMBLED_HIP_DEFAULT_WITH_FOREIGN', 'HIP_FOREIGN_FIXTURE']) for (const ext of ['log', 'json']) copy(stage + '/' + label + '.' + ext, 'evidence/' + label + '.' + ext);
for (const p of ['assemble-atlas-source-20261021.mjs', 'prepare-assembled-atlas-dependencies-20261021.mjs', 'prepare-assembled-hip-author-20261021.mjs', 'checkpoint-atlas-source-assembly-20261021.mjs']) copy(p, 'scripts/' + p);
copy(observationPath, 'full-suite/observation.json');
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' }); copy(root + '/MAIN_REVIEW.json', 'evidence/MAIN_REVIEW.json');
const verify = () => {
  assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', original, 'status', '--porcelain']).toString().trim(), '');
  const changed = runGit(['-C', target, 'status', '--porcelain=v1', '-z', '--untracked-files=all']).toString().split('\0').filter(Boolean).map(l => l.slice(3).replaceAll('\\', '/')).sort();
  assert.deepEqual(changed, paths.map(r => r.path).sort());
  for (const r of paths) assert.equal(sha(read(target + '/' + r.path)), r.finalSha256);
  for (const r of files) assert.equal(sha(read(root + '/' + r.path)), r.sha256);
}; verify();
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-tour-start-hint-backup', parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(r => { const b = read(parentRoot + '/remote-source-restored/' + r.path); assert.equal(sha(b), r.sha256); return [r.path, b]; }));
for (const r of selected) values.set('evidence/20261021-atlas-source-assembly/' + r.path, read(root + '/' + r.path));
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-atlas-source-assembly-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-atlas-source-assembly-20261021.git', branch: 'backup/atlas-source-assembly-20261021',
  files: [...values].map(([path, b]) => ({ path, bytes: b.length, sha256: sha(b) })).sort((a, b) => a.path.localeCompare(b.path)), bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlasBase: source, uncommittedPaths: paths, sourceCommitted: false, canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { actualDentalCases: 4, actualCameraCases: 23, completeCameraAliasPass: true, historyGuardRefusals: 20, actualDefaultGitResolverPass: true, wholeHipWrapperPass: false, fullSuitePass: false, clinicalApproval: false },
  scope: 'Selected17actual uncommitted source paths, exact test preimages, setup/check scripts and focused receipts on prior filtered ancestry. Full source clone/raw ancestry/historical worktrees, source geometry,47605installed dependencies/full manifest remain F-local; no scans/private modules/reviews/databases/secrets/browser pixels/DOM. Not whole/runnable/private-data backup or new generated/clinical admission.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...summary, files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')), head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'Revalidate actual frozen full-run handle/terminal, inspect final failures, run actual original485two-module assurance and original485newhip wrapper, then complete actual combined-source transition/new whole wrapper/regional player/renderer/stock exports/Review/Website/type/build/browser gates before local cutover. Source and clone author contexts ready; do not recreate them or copy dependencies again. All71/eight roadmap and independent clinical review retained.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')), sourcePaths: paths.length, dentalCases: 4, cameraCases: 23, historyRefusals: 20, backup: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths, installed: false }));
