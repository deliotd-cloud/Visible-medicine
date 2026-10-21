import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const sourceRoot = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const target = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const evidence = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db', tree = 'f5af5162af89bae05b9ece240f6f158401c5bd15';
const resume = process.argv.slice(2);
assert(resume.length === 0 || resume.length === 1 && resume[0] === '--resume-clean-clone');
const resumeCleanClone = resume.length === 1;
if (resumeCleanClone) {
  assert(fs.existsSync(target) && fs.existsSync(evidence));
  assert(!fs.existsSync(evidence + '/ASSEMBLY.json') && !fs.existsSync(evidence + '/RESUME.json'));
  assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD^{tree}']).toString().trim(), tree);
  assert.equal(runGit(['-C', target, 'status', '--porcelain']).toString().trim(), '');
  assert.equal(fs.realpathSync(runGit(['-C', target, 'remote', 'get-url', 'origin']).toString().trim()), fs.realpathSync(sourceRoot));
} else assert(!fs.existsSync(target) && !fs.existsSync(evidence), 'Create-only local source assembly');
assert(path.resolve(target).startsWith(path.resolve('F:/VisibleMedicine/staging') + path.sep));
assert.equal(runGit(['-C', sourceRoot, 'rev-parse', 'HEAD']).toString().trim(), source);
assert.equal(runGit(['-C', sourceRoot, 'rev-parse', 'HEAD^{tree}']).toString().trim(), tree);
assert.equal(runGit(['-C', sourceRoot, 'status', '--porcelain']).toString().trim(), '');
const topologyBefore = runGit(['-C', sourceRoot, 'worktree', 'list', '--porcelain', '-z']);
const referencesBefore = runGit(['-C', sourceRoot, 'show-ref']);
const batchRoot = 'F:/VisibleMedicine/staging/20261021-combined-integration-batch';
const batchFile = batchRoot + '/BATCH_MANIFEST.json';
assert.equal(sha(read(batchFile)), '2558e591cc2afd389fc802d0646db6f39034156266649ce4986f7c08b55a21e7');
const batch = json(batchFile);
const hintRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-tour-start-hint-ready';
assert.equal(sha(read(hintRoot + '/checkpoint.json')), 'b11a5157eeb32fd57dc90559f3e388a25326ab25feb027bf466f489ada277221');
const hint = json(hintRoot + '/checkpoint.json');
const rows = batch.paths.filter(r => r.lane === 'atlas').map(r => ({
  path: r.path, from: batchRoot + '/atlas/' + r.path, beforeSha256: r.beforeSha256, finalSha256: r.finalSha256,
}));
for (const p of hint.sourcePaths) {
  const file = hint.files.find(r => r.path === 'proposal/' + p);
  const old = hint.files.find(r => r.path === 'originals/' + p + '.raw');
  assert(file && old);
  rows.push({ path: p, from: hintRoot + '/proposal/' + p, beforeSha256: old.sha256, finalSha256: file.sha256 });
}
assert.equal(rows.length, 17); assert.equal(new Set(rows.map(r => r.path)).size, 17);
for (const r of rows) {
  assert(!r.path.includes('..') && !path.isAbsolute(r.path));
  assert(/^(?:app|lib|content|docs|scripts|LICENSES)\//.test(r.path) || r.path === 'package.json');
  assert(!/\.(?:glb|obj|stl|dcm|nii|nrrd|sqlite|db)$/i.test(r.path));
  assert.equal(sha(read(r.from)), r.finalSha256);
}
if (!resumeCleanClone) fs.mkdirSync(evidence);
// A separate local clone, not another registered worktree of the running test
// source. Its refs/worktree topology cannot change that suite's history search.
// Existing objects are local hardlinks; this is not off-device recovery.
if (!resumeCleanClone) {
fs.writeFileSync(evidence + '/CLONE.log', runGit(['clone', '--local', '--no-checkout', sourceRoot, target]), { flag: 'wx' });
execFileSync('git', ['-C', target, '-c', 'core.autocrlf=false', 'checkout', '--detach', source], {
  windowsHide: true, maxBuffer: 8e6, stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' },
});
} else fs.writeFileSync(evidence + '/RESUME.json', JSON.stringify({ at: new Date().toISOString(),
  cause: 'First command cloned/checked out exact485cleanly, then stopped before source application when a path join appended an already-absolute Git common directory. Exact error remains in tool transcript, not a claimed raw log.',
  correction: 'Use path.resolve for absolute/relative Git common directories. Explicit resume revalidates exact clean clone HEAD/tree/local origin and all preimages; no delete, second clone or frozen-source mutation.',
  cloneLogScope: 'CLONE.log captures initial Git stdout only, which is empty; stderr was not persisted as a raw log.' }, null, 2) + '\n', { flag: 'wx' });
assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD']).toString().trim(), source);
assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD^{tree}']).toString().trim(), tree);
assert.equal(runGit(['-C', target, 'status', '--porcelain']).toString().trim(), '');
const sourceCommon = fs.realpathSync(path.resolve(sourceRoot, runGit(['-C', sourceRoot, 'rev-parse', '--git-common-dir']).toString().trim()));
const targetCommon = fs.realpathSync(path.resolve(target, runGit(['-C', target, 'rev-parse', '--git-common-dir']).toString().trim()));
assert.notEqual(sourceCommon.toLowerCase(), targetCommon.toLowerCase());
for (const r of rows) {
  const dest = target + '/' + r.path;
  assert.equal(fs.existsSync(dest) ? sha(read(dest)) : null, r.beforeSha256, 'Exact source preimage ' + r.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(r.from, dest);
  assert.equal(sha(read(dest)), r.finalSha256);
}
const changes = runGit(['-C', target, '-c', 'core.autocrlf=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all']).toString().split('\0').filter(Boolean);
const changedPaths = changes.map(line => line.slice(3).replaceAll('\\', '/')).sort();
assert.deepEqual(changedPaths, rows.map(r => r.path).sort(), 'Only reviewed17paths changed');
assert.deepEqual(runGit(['-C', sourceRoot, 'worktree', 'list', '--porcelain', '-z']), topologyBefore);
assert.deepEqual(runGit(['-C', sourceRoot, 'show-ref']), referencesBefore);
assert.equal(runGit(['-C', sourceRoot, 'status', '--porcelain']).toString().trim(), '');
assert(!fs.existsSync(target + '/node_modules'), 'No hidden dependency install, foreign junction or confinement bypass');
const report = { at: new Date().toISOString(), phase: 'actual isolated uncommitted Atlas source assembly', sourceRoot, target, source, tree,
  sourceCommon, targetCommon, resumedCleanClone: resumeCleanClone, sourceWorktreeTopologyUnchangedDuringApplication: true, sourceReferencesUnchangedDuringApplication: true,
  appliedPaths: rows.map(({ from, ...r }) => r), changedPaths, trackedChangesOnlyReviewed: true,
  dependencyState: 'Not prepared. Before actual gates, provide installed dependencies inside this clone scope without altering frozen source or weakening the hip author/dependency confinement. No install/network/model fetch was performed.',
  historicalState: 'Original485 hip stage and trusted6d7author witness remain untouched. First run the new whole wrapper in original485 stage after Website terminal. A later equivalent trusted author checkout for this independent clone must be registered in this clone, not reused across repositories.',
  websiteUiPathsNotAppliedHere: 11, current485AssurancePathsNotAppliedHere: 2,
  sourceCommitted: false, fullResolverTransitionPass: false, newHipWrapperEndToEndPass: false,
  generatedOutputsChanged: false, websiteImported: false, canonicalInstalled: false,
  fullSuitePass: false, clinicalApproval: false, spatialRegistration: false, publicDeployment: false,
  limits: 'Actual full source checkout and exact17path application, not a running/buildable/accepted delivery. Unchanged models/source history are local-only; no scans, Website data or generated modules copied from the Website. Local object hardlinks are not off-device backup. No source or approval identity was predicted.',
};
fs.writeFileSync(evidence + '/ASSEMBLY.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ evidence: evidence + '/ASSEMBLY.json', sha256: sha(read(evidence + '/ASSEMBLY.json')), source, paths: 17, target, committed: false, installed: false }));
