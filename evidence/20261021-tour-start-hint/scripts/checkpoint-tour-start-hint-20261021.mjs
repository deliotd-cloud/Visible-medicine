import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-tour-start-hint';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-tour-start-hint-ready';
const sourceRoot = 'F:/VisibleMedicine/staging/20261020-inbox-material-source', source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T01-14-28.928Z/observation.json';
assert(!fs.existsSync(root));
const prep = json(stage + '/PREPARATION.json'), scope = json(stage + '/TEXT_SCOPE.json'), browser = json(stage + '/BROWSER_SUMMARY.json');
assert(scope.exactComponentInverse && scope.preStartOnlyJsxAst && scope.componentParsePass && scope.originalNativeTestsPreserved && !scope.newNativeTestExecuted);
const batch = json('F:/VisibleMedicine/staging/20261021-combined-integration-batch/BATCH_MANIFEST.json');
for (const r of prep.paths) {
  assert.equal(sha(read(sourceRoot + '/' + r.path)), r.beforeSha256);
  assert.equal(sha(read(stage + '/originals/' + r.path + '.raw')), r.beforeSha256);
  assert(!batch.paths.some(p => p.lane === 'atlas' && p.path === r.path), 'Disjoint addendum, no package collision');
}
assert.equal(sha(read(stage + '/app/regional-guided-learning.tsx')), scope.componentSha256);
assert.equal(sha(read(stage + '/scripts/test-regional-tour-player.mjs')), scope.nativeTestSha256);
const rendererRow = json(sourceRoot + '/content/body-renderer-revision.json').dependencies.find(r => r.path === 'app/regional-guided-learning.tsx');
assert(rendererRow); assert.equal(rendererRow.sha256, sha(read(sourceRoot + '/' + rendererRow.path).toString().replace(/\r\n/g, '\n')));
const observation = json(observationPath);
assert.equal(sha(read(observationPath)), '1f7bec488f9140bb60f3fcc7a9aa10ea50e42981eceabd280ca7a85e1034413c');
assert(observation.processesConfirmedLive && !observation.terminalReceiptObserved && observation.ownerPreviewRunning);
assert.equal(observation.namedInputsVerified, 5053);
fs.mkdirSync(root);
const files = [], selected = [];
function copy(from, rel, remote = true) {
  const b = read(from), to = root + '/' + rel; fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, b, { flag: 'wx' }); assert.equal(sha(read(to)), sha(b));
  const row = { path: rel, bytes: b.length, sha256: sha(b), remoteSelected: remote }; files.push(row); if (remote) selected.push(row);
}
for (const r of prep.paths) {
  copy(stage + '/' + r.path, 'proposal/' + r.path);
  copy(stage + '/originals/' + r.path + '.raw', 'originals/' + r.path + '.raw');
}
for (const p of ['PREPARATION.json', 'TEXT_SCOPE.json', 'verify-text-scope.mjs', 'BROWSER_SUMMARY.json']) copy(stage + '/' + p, 'evidence/' + p);
copy(browser.screenshot, 'local-browser/guided-mode-native.png', false);
copy(observationPath, 'full-suite/observation.json');
for (const p of ['prepare-tour-start-hint-20261021.mjs', 'checkpoint-tour-start-hint-20261021.mjs']) copy(p, 'scripts/' + p);
const summary = { at: new Date().toISOString(), phase: 'browser-observed pre-start clarity fix; two-path uncommitted source addendum', source,
  precedingGoalTurnClassification: 'progress: coherent28path batch, real4case native alias and verified497blob filtered backup; not status-only',
  sourcePaths: prep.paths.map(r => r.path), disjointFromCombined28PathBatch: true,
  runtimeChange: 'One conditional pre-start paragraph explains Play full tour/manual entry and available notes/imaging/quick checks; active teaching/readiness/playback/timing/source guards untouched.',
  syntaxAndAstPass: true, entireOriginalComponentInverse: true, allOriginalPlayerTestsPreserved: true,
  newNativePlayerCaseAdded: true, newNativePlayerCaseExecuted: false,
  existingAliasRegistersPlayerModule: true, existingRendererBoundFile: rendererRow,
  actualInstalledBrowser: 'Learner native Atlas-to-Whole-body route, Explore→Dissect→Guided ArrowRight/roving focus and rendered initial hip-bone view checked at1280x720; open owner forms untouched. Hidden Base UI inputs correctly aria-hidden/tabindex=-1; no false semantic fix. One ineffective zoom shortcut is a limit, not200% acceptance.',
  fullSuite: { observation: observationPath, sha256: sha(read(observationPath)), live: true, terminal: false, frozenInputs: 5053 },
  limits: 'Only parse/AST/full-byte inverses for new source; real complete player case waits for heavy slot. Browser observation is existing installed98d7, not a preview of the hint. Native full player/current-history/renderer/Review/learner/Website/type/build and integrated browser gates remain. No GPU performance,200% text or clinical acceptance.',
  sourceCommitted: false, stockExportsGenerated: false, websiteImported: false, canonicalInstalled: false,
  fullSuitePass: false, newHintBrowserAccepted: false, clinicalApproval: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true };
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' }); copy(root + '/MAIN_REVIEW.json', 'evidence/MAIN_REVIEW.json');
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-combined-integration-batch-backup', parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
assert.equal(parent.head, '5864b23f75a3ac5722aff9101b6395eb360ed771');
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(r => { const b = read(parentRoot + '/remote-source-restored/' + r.path); assert.equal(sha(b), r.sha256); return [r.path, b]; }));
for (const r of selected) values.set('evidence/20261021-tour-start-hint/' + r.path, read(root + '/' + r.path));
const verify = () => {
  assert.equal(runGit(['-C', sourceRoot, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', sourceRoot, 'status', '--porcelain']).toString().trim(), '');
  for (const r of files) assert.equal(sha(read(root + '/' + r.path)), r.sha256);
};
verify(); const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-tour-start-hint-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-tour-start-hint-20261021.git', branch: 'backup/atlas-tour-start-hint-20261021',
  files: [...values].map(([path, b]) => ({ path, bytes: b.length, sha256: sha(b) })).sort((a, b) => a.path.localeCompare(b.path)), bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlas: source, proposalOnly: true, sourcePaths: prep.paths, canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { sourceSyntaxAstInversePass: true, newPlayerCaseExecuted: false, newHintInstalledBrowserPass: false, fullSuitePass: false, clinicalApproval: false },
  scope: 'Two uninstalled text/test source paths, exact preimages, scope checker and structured non-private evidence on prior filtered ancestry. Browser screenshot remains F-local. No scans/models/masks/private records/raw canonical history/browser pixels/DOM. Not full/runnable/private-data backup or new renderer/application/clinical acceptance.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...summary, files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')), head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'After real full Website terminal and485repair/hip gates, combine this disjoint two-path addendum with the28path batch before one coherent source commit. Run the actual complete existing regional-tour-player module, all normal source/renderer/export/Review/Website and browser gates. Do not suppress guard tests or claim prototype/AST as acceptance. All71/eight roadmap remains.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')), paths: 2, nativeNewCaseExecuted: false, backup: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths, installed: false }));
