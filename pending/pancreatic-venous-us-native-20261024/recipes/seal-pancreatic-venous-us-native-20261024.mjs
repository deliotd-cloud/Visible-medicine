import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash, json} from './seal-simple-website-successor.mjs';
const stage = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft';
const prep = json(stage + '/PREPARATION.json'), root = prep.atlas, parent = json(prep.parentReceipt);
const index = json('CURRENT_CHECKPOINT.json');
assert.equal(index.goal.status, 'active'); assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert.equal(index.activeWork.current.activeExecutionSessions.length, 0);
assert(!fs.existsSync(stage + '/SOURCE_BOUND.json'));
assert.equal(hash(prep.parentReceipt), prep.parentReceiptSha256);
const allowed = ['LICENSES/THIRD_PARTY_NOTICES.md', 'app/body-content.ts', 'content/body-renderer-revision.json', 'content/body-review-display-pins.json', 'content/regional-teaching/abdomen.json', 'package.json'].sort();
const newPaths = ['lib/body-pancreatic-venous-us.ts', 'scripts/test-body-pancreatic-venous-us.mjs', 'scripts/test-pancreatic-venous-us-cohort.mjs', 'scripts/test-pancreatic-venous-us-unit.mjs'];
const changed = [];
for (const row of parent.sourceRows) {
  assert.equal(hash(prep.parentAtlas + '/' + row.path), row.sha256);
  if (hash(root + '/' + row.path) !== row.sha256) changed.push(row.path);
}
assert.deepEqual(changed.sort(), allowed);
const sourceRows = [...parent.sourceRows.map(r => r.path), ...newPaths].sort().map(p => ({path: p, bytes: fs.statSync(root + '/' + p).size, sha256: hash(root + '/' + p)}));
assert.equal(sourceRows.length, 6387);
const phases = ['regional', 'renderer', 'display', 'regionalCheck', 'rendererCheck', 'displayCheck', 'build', 'cohortV2', 'typesV2', 'unitV2'];
const checks = phases.map(phase => {
  const base = stage + '/checks/' + phase, terminal = json(base + '/TERMINAL.json');
  assert.equal(terminal.code, 0, phase); assert.equal(terminal.sourceError, undefined, phase);
  for (const name of ['stdout', 'stderr']) assert.equal(hash(base + '/' + name + '.log'), terminal[name + 'Sha256']);
  assert.equal(hash(base + '/INPUTS.json'), terminal.inputManifestSha256);
  return terminal;
});
for (const [phase, count] of [['cohortV2', 4], ['unitV2', 6]]) assert.deepEqual(checks.find(r => r.phase === phase).counts, {tests: count, pass: count, fail: 0, skipped: 0, cancelled: 0});
for (const row of json(stage + '/checks/unitV2/INPUTS.json')) assert.equal(hash(root + '/' + row.path), row.sha256);
const types = json(stage + '/checks/typesV2/RESULT.json');
assert.equal(types.diagnosticCount, 0); assert.equal(types.roots.length, 2);
assert.deepEqual(types.ambient, [root + '/next-env.d.ts', root + '/worker-configuration.d.ts', root + '/.next/types/routes.d.ts']);
assert.equal(types.sourceOverlayCount, 0); assert.equal(types.typeShims, false);
for (const row of types.sourceFiles) assert.equal(hash(row.path), row.sha256);
const git = (...args) => execFileSync('git', args, {encoding: 'utf8', windowsHide: true, stdio: 'pipe'}).trim();
for (const [where, head] of [['F:/VisibleMedicine/website', 'b953ff3f5f1891599cb6e91cb91311d9d6006270'], ['F:/VisibleMedicine/atlas', '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'], [root, prep.parentHead], [prep.parentAtlas, prep.parentHead]]) assert.equal(git('-C', where, 'rev-parse', 'HEAD'), head);
assert.equal(git('-C', prep.parentAtlas, 'status', '--porcelain'), '');
const status = execFileSync('git', ['-C', root, 'status', '--porcelain'], {encoding: 'utf8', windowsHide: true});
assert.deepEqual(status.trimEnd().split('\n').map(line => line.slice(3).trimEnd().replaceAll('\\', '/')).sort(), [...allowed, ...newPaths].sort());
const files = [];
function walk(dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    assert(!entry.isSymbolicLink()); const p = prefix + entry.name;
    if (entry.isDirectory()) walk(dir + '/' + entry.name, p + '/');
    else files.push({path: p, bytes: fs.statSync(dir + '/' + entry.name).size, sha256: hash(dir + '/' + entry.name)});
  }
}
walk(root + '/dist'); assert(files.length > 500); files.sort((a, b) => a.path.localeCompare(b.path));
assert(files.some(r => r.path.endsWith('.js') && fs.readFileSync(root + '/dist/' + r.path).includes('posterior superior pancreaticoduodenal vein')));
git('-C', root, 'add', '--', ...allowed, ...newPaths);
git('-C', root, 'commit', '-m', 'Add source-bound pancreatic venous ultrasound teaching draft');
const head = git('-C', root, 'rev-parse', 'HEAD'), tree = git('-C', root, 'rev-parse', 'HEAD^{tree}');
assert.equal(git('-C', root, 'rev-parse', 'HEAD^'), prep.parentHead);
assert.deepEqual(git('-C', root, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n').sort(), [...allowed, ...newPaths].sort());
assert.equal(git('-C', root, 'status', '--porcelain'), '');
for (const row of sourceRows) assert.equal(hash(root + '/' + row.path), row.sha256);
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', {flag: 'wx'});
write(stage + '/BUILD_ARTIFACTS.json', {at: new Date().toISOString(), root: root + '/dist', files, localOnly: true});
write(stage + '/SOURCE_BOUND.json', {
  at: new Date().toISOString(), atlas: root, atlasHead: head, atlasTree: tree,
  parentReceipt: prep.parentReceipt, parentReceiptSha256: prep.parentReceiptSha256, parentHead: prep.parentHead,
  sourceRows, sourcePaths: sourceRows.length, changedPaths: allowed, newPaths, checks,
  focusedCasesPassed: 10, cohortRoots: 2, standaloneResolverIntegrationPassed: true, strictTypeRoots: 2, strictTypeFiles: types.sourceFiles.length, typeDiagnostics: 0,
  changedUltrasoundLessons: 1, preservedRootBodyLessons: 9935, preservedWorksheets: 1103, all1104SourceChecklistsReasoningAndToursPreserved: true,
  currentTeachingPassesDisplayAdmission: true, staleTeachingPostRejectedBeforeStorage: true, forgedTeachingPacketsRejected: 3,
  actualStockNativeBuildPassed: true, buildArtifacts: stage + '/BUILD_ARTIFACTS.json', buildArtifactsSha256: hash(stage + '/BUILD_ARTIFACTS.json'), buildFiles: files.length,
  originalRegionalRendererAndDisplayGeneratorsPassed: true, shoulderRevisionsAndAllModelsDependenciesUnchanged: true,
  priorDraft: stage + '/SOURCE_DRAFT.json', priorDraftSha256: hash(stage + '/SOURCE_DRAFT.json'),
  retainedInitialCohort: stage + '/checks/cohort/TERMINAL.json', retainedInitialCohortSha256: hash(stage + '/checks/cohort/TERMINAL.json'), initialCohortCounts: json(stage + '/checks/cohort/TERMINAL.json').counts,
  pending: ['All four original exact-source learner exporters', 'Fresh protected Website Review composition/build and source-bound cohort', 'Real signed-in/browser/AT/full-release acceptance', 'Exact-revision radiologist approval'],
  websiteIntegrationPending: true, currentWebsiteCandidateUnchanged: index.activeWork.current.latestWebsiteCandidate.sourceReceipt,
  fullProjectTypesPassed: false, wholeSuitePassing: false, clinicalApproval: false, patientSpaceRegistration: false,
  privateDecisionsReadOrMigrated: false, previewChanged: false, installed: false, publicDeployment: false,
});
console.log(JSON.stringify({source: stage + '/SOURCE_BOUND.json', sha256: hash(stage + '/SOURCE_BOUND.json'), head, tree, sourcePaths: sourceRows.length, buildFiles: files.length, focusedCases: 10, strictFiles: types.sourceFiles.length, websiteIntegrationPending: true}));
