import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash, json} from './seal-simple-website-successor.mjs';
import {backup, runGit} from './source-only-backup-20261019.mjs';
import {planProposalSourceSelection} from './source-proposal-checkpoint.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft';
const sourcePath = stage + '/SOURCE_BOUND.json', source = json(sourcePath);
const recovery = 'F:/VisibleMedicine/recovery/checkpoints/20261024-pancreatic-venous-us-native';
const id = 'pancreatic-venous-us-native-20261024', backupRoot = recovery + '-source-backup';
const repo = 'F:/VisibleMedicine/history/website-work/github-' + id + '.git';
const parentReceipt = 'F:/VisibleMedicine/recovery/checkpoints/20261024-review-pager-website-source-backup/github-backup.json';
const parentRepo = 'F:/VisibleMedicine/history/website-work/github-review-pager-website-20261024.git';
assert.equal(hash(parentReceipt), '196cd8c8c024b6e1f6009c1207d78fabba37ca22fda0a20a7f3876cdec2fea96');
const parent = json(parentReceipt); assert(parent.sourceBackupVerified && parent.strictIntegrity);
assert.equal(parent.head, '330543ffa4211a01be7b8caf7d8ef612ddf61e5b');
const before = json('CURRENT_CHECKPOINT.json');
assert.equal(before.goal.status, 'active'); assert.equal(before.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert.equal(before.activeWork.current.activeExecutionSessions.length, 0);
assert.equal(source.actualStockNativeBuildPassed, true); assert.equal(source.focusedCasesPassed, 10); assert.equal(source.typeDiagnostics, 0);
assert(!fs.existsSync(recovery));
const authored = ['LICENSES/THIRD_PARTY_NOTICES.md', 'app/body-content.ts', 'package.json', ...source.newPaths];
const recipes = ['prepare-pancreatic-venous-us-20261024.mjs', 'check-pancreatic-venous-us-20261024.mjs', 'check-pancreatic-venous-us-types-20261024.mjs', 'run-pancreatic-venous-us-series-20261024.mjs', 'seal-pancreatic-venous-us-native-20261024.mjs', 'checkpoint-pancreatic-venous-us-20261024.mjs', 'preflight-current-release-20261024.mjs', 'compact-pancreatic-index-history-20261024.mjs', 'backup-pancreatic-venous-us-native-20261024.mjs', 'finish-pancreatic-venous-us-native-20261024.mjs'];
const selected = new Map();
const inherited = JSON.parse(runGit(['--git-dir=' + parentRepo, 'show', parent.head + ':.source-backup/manifest.json']));
for (const row of inherited.files) selected.set(row.path, path.dirname(parentReceipt) + '/remote-source-restored/' + row.path);
const additions = new Map([
  ...authored.map(p => ['pending/' + id + '/atlas/' + p, source.atlas + '/' + p]),
  ...recipes.map(p => ['pending/' + id + '/recipes/' + p, p]),
]);
// Exact explicit source selection only: the notice is original prose, no linked article/media.
for (const [p, from] of additions) {
  assert(!selected.has(p)); assert(fs.statSync(from).isFile());
  assert(/\.(?:ts|tsx|mjs|md)$/.test(p) || p.endsWith('/atlas/package.json'));
  new TextDecoder('utf-8', {fatal: true}).decode(fs.readFileSync(from));
}
const planned = planProposalSourceSelection({
  inheritedFiles: inherited.files, inheritedBytesFor: p => fs.readFileSync(selected.get(p)),
  newPaths: [...additions.keys()], newBytesFor: p => fs.readFileSync(additions.get(p)), id,
  exactDuplicateConsolidation: {targetCount: 5900, maxOmissions: 128, protectedPaths: inherited.sourceIdentity.sourceArtifactBindings.map(r => r.snapshotPath)},
  parentHead: parent.head, parentTree: parent.tree,
});
for (const alias of planned.aliases) selected.delete(alias.omittedPath);
for (const [p, from] of additions) selected.set(p, from);
fs.mkdirSync(recovery);
const copy = (from, to) => {fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL); assert.equal(hash(from), hash(to));};
for (const [from, to] of [['CURRENT_CHECKPOINT.json', 'CURRENT_BEFORE.json'], ['WORKSPACE_MAP.md', 'WORKSPACE_MAP.before.md'], ['F:/VisibleMedicine/website/docs/master-plan.md', 'master-plan.before.md'], ['F:/VisibleMedicine/website/docs/completion-checklist.json', 'completion-checklist.before.json']]) copy(from, recovery + '/' + to);
for (const p of [...source.changedPaths, ...source.newPaths]) copy(source.atlas + '/' + p, recovery + '/source/atlas/' + p);
for (const p of recipes) copy(p, recovery + '/recipes/' + p);
copy(sourcePath, recovery + '/SOURCE_BOUND.json'); copy(stage + '/BUILD_ARTIFACTS.json', recovery + '/BUILD_ARTIFACTS.json');
const verify = () => {
  assert.equal(runGit(['-C', source.atlas, 'rev-parse', 'HEAD']).toString().trim(), source.atlasHead);
  assert.equal(runGit(['-C', source.atlas, 'status', '--porcelain']).toString().trim(), '');
  for (const row of source.sourceRows) assert.equal(hash(source.atlas + '/' + row.path), row.sha256);
  const current = json('CURRENT_CHECKPOINT.json'); assert.deepEqual(current.goal, before.goal); assert.deepEqual(current.safety, before.safety);
  assert.deepEqual(current.activeWork.current.ownerPreviewPolicy, before.activeWork.current.ownerPreviewPolicy);
  assert.deepEqual(current.activeWork.current.latestWebsiteCandidate, before.activeWork.current.latestWebsiteCandidate);
};
const live = active => {
  const current = json('CURRENT_CHECKPOINT.json');
  current.activeWork.current.activeExecutionSessions = current.activeWork.current.activeExecutionSessions.filter(r => r.role !== 'pancreatic-venous-source-backup');
  if (active) current.activeWork.current.activeExecutionSessions.push({role: 'pancreatic-venous-source-backup', pid: process.pid, evidence: backupRoot, previewChanged: false});
  const text = JSON.stringify(current, null, 2) + '\n'; assert(Buffer.byteLength(text) < 65536); fs.writeFileSync('CURRENT_CHECKPOINT.json', text);
};
live(true);
try {
  const result = backup({root: backupRoot, repo, branch: 'backup/' + id, files: planned.files, bytesFor: p => fs.readFileSync(selected.get(p)),
    parent: parent.head, parentRepo, parentTree: parent.tree, carryParent: true, verifySource: verify,
    sourceIdentity: {atlas: source.atlasHead, atlasTree: source.atlasTree, sourceReceiptSha256: hash(sourcePath), currentWebsiteSourceReceiptSha256: before.activeWork.current.latestWebsiteCandidate.sourceReceiptSha256, sourceArtifactBindings: authored.map(p => ({nativePath: p, sha256: hash(source.atlas + '/' + p), snapshotPath: 'pending/' + id + '/atlas/' + p}))},
    scope: 'Selected original authored native Atlas teaching, tests, notices and recipes on the verified filtered source parent; exact inherited duplicate aliases retain reconstructible bytes. Not a whole project, private data, generated Review/learner delivery, model/media/build/dependency or runnable backup. Native candidate is built but not Website-integrated, installed, clinically approved or patient-space registered.',
    proof: {nativeSourceReceiptSha256: hash(sourcePath), focusedCasesPassed: 10, strictTypeFiles: source.strictTypeFiles, typeDiagnostics: 0, stockNativeBuildPassed: true, websiteIntegrationPending: true, exactDuplicateConsolidation: planned.consolidation, previewChanged: false, clinicalApproval: false, patientSpaceRegistration: false},
  });
  const parentReadback = backupRoot + '/alias-parent-readback.git';
  runGit(['init', '--bare', '-q', parentReadback]);
  runGit(['--git-dir=' + parentReadback, 'fetch', '--depth=1', '--no-tags', parent.repository, 'refs/heads/' + parent.branch]);
  assert.equal(runGit(['--git-dir=' + parentReadback, 'rev-parse', 'FETCH_HEAD']).toString().trim(), parent.head);
  assert.equal(runGit(['--git-dir=' + parentReadback, 'rev-parse', 'FETCH_HEAD^{tree}']).toString().trim(), parent.tree);
  for (const alias of planned.aliases) {
    const restored = backupRoot + '/remote-source-restored/' + alias.retainedPath;
    const original = runGit(['--git-dir=' + parentReadback, 'show', parent.head + ':' + alias.omittedPath]);
    assert.equal(hash(restored), alias.sha256); assert(original.equals(fs.readFileSync(restored)));
  }
  runGit(['--git-dir=' + parentReadback, 'fsck', '--strict', '--no-reflogs']); verify();
  fs.writeFileSync(recovery + '/ALIASES_VERIFIED.json', JSON.stringify({at: new Date().toISOString(), parentHead: parent.head, parentTree: parent.tree, independentParentRepo: parentReadback, aliases: planned.aliases, aliasCount: planned.aliases.length, allAliasBytesComparedWithIndependentlyFetchedParent: true, uniqueSourceOmissions: 0, workingFilesDeleted: 0}, null, 2) + '\n', {flag: 'wx'});
  fs.writeFileSync(recovery + '/BACKUP_VERIFIED.json', JSON.stringify({at: new Date().toISOString(), receipt: backupRoot + '/github-backup.json', receiptSha256: hash(backupRoot + '/github-backup.json'), head: result.head, tree: result.tree, newPaths: additions.size, sourcePaths: result.sourcePaths, restoredPaths: result.restoredPaths, aliasesReceipt: recovery + '/ALIASES_VERIFIED.json', aliasesReceiptSha256: hash(recovery + '/ALIASES_VERIFIED.json'), independentlyVerified: true, wholeOrPrivateOrRunnableBackup: false, previewChanged: false}, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({backupVerified: recovery + '/BACKUP_VERIFIED.json', sha256: hash(recovery + '/BACKUP_VERIFIED.json'), head: result.head, sourcePaths: result.sourcePaths, aliases: planned.aliases.length, newPaths: additions.size}));
} finally {live(false);}
