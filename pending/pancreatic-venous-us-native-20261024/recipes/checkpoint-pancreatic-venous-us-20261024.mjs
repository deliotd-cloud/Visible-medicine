import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash, json } from './seal-simple-website-successor.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft';
const recovery = 'F:/VisibleMedicine/recovery/checkpoints/20261024-pancreatic-venous-us-draft';
const prep = json(stage + '/PREPARATION.json'), parent = json(prep.parentReceipt), root = prep.atlas;
const indexPath = 'CURRENT_CHECKPOINT.json', before = json(indexPath);
const mapPath = 'WORKSPACE_MAP.md', planPath = 'F:/VisibleMedicine/website/docs/master-plan.md';
const checklistPath = 'F:/VisibleMedicine/website/docs/completion-checklist.json';
const checklist = json(checklistPath), previousChecklist = structuredClone(checklist);
assert.equal(before.goal.status, 'active'); assert.equal(before.goal.requirements, 71); assert.equal(before.goal.optionalIdeas, 8);
assert.equal(before.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert.equal(before.activeWork.current.activeExecutionSessions.length, 0);
assert.equal(checklist.revision, 200);
assert(!fs.existsSync(recovery)); assert(!fs.existsSync(stage + '/SOURCE_DRAFT.json'));
assert.equal(hash(prep.parentReceipt), prep.parentReceiptSha256);
const newPaths = ['lib/body-pancreatic-venous-us.ts', 'scripts/test-body-pancreatic-venous-us.mjs', 'scripts/test-pancreatic-venous-us-unit.mjs'];
const changed = [];
for (const row of parent.sourceRows) {
  assert.equal(hash(prep.parentAtlas + '/' + row.path), row.sha256);
  if (hash(root + '/' + row.path) !== row.sha256) changed.push(row.path);
}
assert.deepEqual(changed.sort(), ['app/body-content.ts', 'package.json']);
// The declared integration is exactly one import and one guarded dispatch, not a rewrite.
const resolver = fs.readFileSync(root + '/app/body-content.ts', 'utf8');
const parentResolver = fs.readFileSync(prep.parentAtlas + '/app/body-content.ts', 'utf8');
const seams = ["import { bodyPancreaticVenousUsLesson } from '../lib/body-pancreatic-venous-us';\n", '  const pancreaticVenousUs = bodyPancreaticVenousUsLesson(s, tab);\n  if (pancreaticVenousUs) return pancreaticVenousUs;\n'];
let inverse = resolver; for (const seam of seams) { assert.equal(inverse.split(seam).length, 2); inverse = inverse.replace(seam, ''); }
assert.equal(inverse, parentResolver);
const pkg = fs.readFileSync(root + '/package.json', 'utf8');
const scriptLine = '    "pancreatic-venous-us:test": "node --test scripts/test-pancreatic-venous-us-unit.mjs && node scripts/test-body-pancreatic-venous-us.mjs",\n';
assert.equal(pkg.split(scriptLine).length, 2); assert.equal(pkg.replace(scriptLine, ''), fs.readFileSync(prep.parentAtlas + '/package.json', 'utf8'));
const run = stage + '/checks/unit', terminal = json(run + '/TERMINAL.json'), inputs = json(run + '/INPUTS.json');
assert.equal(terminal.code, 0); assert.equal(terminal.sourceError, undefined);
assert.deepEqual(terminal.counts, {tests: 6, pass: 6, fail: 0, skipped: 0, cancelled: 0});
for (const name of ['stdout', 'stderr']) assert.equal(hash(run + '/' + name + '.log'), terminal[name + 'Sha256']);
assert.equal(hash(run + '/INPUTS.json'), terminal.inputManifestSha256);
for (const row of inputs) assert.equal(hash(root + '/' + row.path), row.sha256);
const sourceRows = [...parent.sourceRows.map(row => row.path), ...newPaths].sort().map(p => ({path: p, bytes: fs.statSync(root + '/' + p).size, sha256: hash(root + '/' + p)}));
assert.equal(sourceRows.length, 6386); assert.equal(inputs.length, sourceRows.length);
const git = (...args) => execFileSync('git', args, {encoding: 'utf8', windowsHide: true, stdio: 'pipe'}).trim();
for (const [where, head] of [['F:/VisibleMedicine/website', 'b953ff3f5f1891599cb6e91cb91311d9d6006270'], ['F:/VisibleMedicine/atlas', '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'], [root, prep.parentHead], [prep.parentAtlas, prep.parentHead]]) assert.equal(git('-C', where, 'rev-parse', 'HEAD'), head);
assert.equal(git('-C', prep.parentAtlas, 'status', '--porcelain'), '');
const status = git('-C', root, 'status', '--porcelain').split('\n').map(line => line.slice(3).replaceAll('\\', '/')).sort();
// trim() above removes the first status line's leading space, so compare paths from an untrimmed call.
const porcelain = execFileSync('git', ['-C', root, 'status', '--porcelain'], {encoding: 'utf8', windowsHide: true});
assert.deepEqual(porcelain.trimEnd().split('\n').map(line => line.slice(3).trimEnd().replaceAll('\\', '/')).sort(), [...changed, ...newPaths].sort());
const preflight = 'F:/VisibleMedicine/staging/20261024-release-preflight/PREFLIGHT.json';
assert.equal(hash(preflight), '74c3b27f55b7fc7485da8648951b6e7a5845ea7837568fc01df502d5cd6a2520');
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL); assert.equal(hash(from), hash(to)); };
fs.mkdirSync(recovery);
for (const [from, name] of [[indexPath, 'CURRENT_BEFORE.json'], [mapPath, 'WORKSPACE_MAP.before.md'], [planPath, 'master-plan.before.md'], [checklistPath, 'completion-checklist.before.json']]) copy(from, recovery + '/' + name);
const sourceReceipt = stage + '/SOURCE_DRAFT.json';
write(sourceReceipt, {
  schema: 'vm-native-teaching-source-draft-1', at: new Date().toISOString(), atlas: root,
  parentReceipt: prep.parentReceipt, parentReceiptSha256: prep.parentReceiptSha256, parentHead: prep.parentHead, parentTree: prep.parentTree,
  candidateGitHeadStillParent: true, committed: false, changedPaths: changed, newPaths, sourcePaths: sourceRows.length, sourceRows,
  sourceTarget: {id: 'vm:anatomy:body:abdomen:unspecified:vessel:pancreaticoduodenal-vein', fmaId: 'FMA15398', modality: 'ultrasound', components: 3, readiness: 'draft'},
  primaryReference: 'https://pubmed.ncbi.nlm.nih.gov/8470571/', primaryDoi: '10.2214/ajr.160.5.8470571',
  unitEvidence: run + '/TERMINAL.json', unitEvidenceSha256: hash(run + '/TERMINAL.json'), unitCasesPassed: 6,
  parentSourceRowsPreserved: 6383, changedSourcePaths: 2, noModelOrIdentityChanges: true,
  currentWebsitePreflight: preflight, currentWebsitePreflightSha256: hash(preflight), fullWebsiteEntryRootsInventoried: 1286,
  pending: prep.pending, generatedRendererAndReviewPinsStale: true, installationForbidden: true,
  resolverIntegrationTestRun: false, strictTypesRun: false, productionBuildRun: false, allFourExportsRebuilt: false, websiteReviewImported: false,
  fullSuiteRun: false, systemMemoryLimitation: 'Free physical RAM fluctuated roughly 0.13–0.56 GiB. Only small unit graph and read-only preflight were run; no applications were closed.',
  wholeSuitePassing: false, authenticatedAcceptance: false, clinicalApproval: false, patientSpaceRegistration: false,
  currentWebsiteCandidateUnchanged: before.activeWork.current.latestWebsiteCandidate.sourceReceipt,
  previewChanged: false, installed: false, publicDeployment: false, newSourceOffDeviceBackupVerified: false,
});
copy(sourceReceipt, recovery + '/SOURCE_DRAFT.json');
for (const p of [...changed, ...newPaths]) copy(root + '/' + p, recovery + '/source/atlas/' + p);
for (const p of ['preflight-current-release-20261024.mjs', 'prepare-pancreatic-venous-us-20261024.mjs', 'check-pancreatic-venous-us-20261024.mjs', 'checkpoint-pancreatic-venous-us-20261024.mjs']) copy(p, recovery + '/recipes/' + p);
for (const p of ['STARTED.json', 'INPUTS.json', 'stdout.log', 'stderr.log', 'TERMINAL.json']) copy(run + '/' + p, recovery + '/checks/unit/' + p);
copy(stage + '/PREPARATION.json', recovery + '/PREPARATION.json'); copy(preflight, recovery + '/PREFLIGHT.json');
const checkpoint = recovery + '/checkpoint.json';
write(checkpoint, {at: new Date().toISOString(), kind: 'Recoverable unbuilt native source draft plus current Website preflight', sourceReceipt, sourceReceiptSha256: hash(sourceReceipt), goal: before.goal, unitCasesPassed: 6, exactSourcePaths: 6386, parentSourcePaths: 6383, changedPaths: changed, newPaths, pending: prep.pending, currentWebsiteCandidateRetained: before.activeWork.current.latestWebsiteCandidate.sourceReceipt, memoryConstrainedHeavyChecksDeferred: true, previewChanged: false, installed: false, clinicalApproval: false, patientSpaceRegistration: false, newSourceOffDeviceBackupVerified: false});
const next = 'Keep preview unchanged; full71/eight goal active. Complete pending pancreatic venous US draft integration/types, stock revision generators/build and original exporters when memory permits; then compose fresh Website Review without approval transfer. Current built Website remains review-pager4058a3a3. Full1286-root suite is inventoried/preflighted, not run. Advance safe work; no install, auth widening, private upload or registration.';
const summary = 'One exact-source pancreaticoduodenal venous ultrasound draft is staged; six real-module unit cases pass. The current Website passes pinned public-asset/history preflight with1286test roots inventoried. Severe system memory pressure defers integration/types/generators/build/full release. Preview unchanged; no new clinical or spatial approval.';
const prefix = `## Current: source-bound pancreatic venous US draft — 24 October 2026\n\n${summary}\n\nNative draft ${root}; source ${sourceReceipt} (${hash(sourceReceipt)}). Only one guarded resolver route and one test command change existing source; all other6381parent paths remain exact, including geometry, models, source identities, dependencies and licence notices. Three new module/test files are retained. The original teaching cites the primary Wachsberg1993study and distinguishes selected-window visualization from Doppler flow; the three FMA15398components remain grouped, unnamed and unvalidated. No article images/text or patient data are imported. Other pending US identities, including right gastric vein, are not promoted by this draft.\n\nSix unit cases test exact whole-record admission, all component memberships/hashes/order, geometry/provenance/validation/unknown-field rejection, study limitations, reference and defensive-copy isolation. All6386candidate/6383parent inputs remain hash-stable. The full resolver integration script is authored but not run; strict types, original renderer/review generators, stock build, all four original learner exports and protected Website Review import remain required. Generated metadata is deliberately still the parent revision: this source MUST NOT be installed or presented as a complete built successor.\n\nCurrent complete Website stays F:/VisibleMedicine/staging/20261024-review-pager-website/website, source4058a3a368dc9573efc74c16d3b7e636057566bebfbb88232095322a459d21ea, nativeb8ec/Review51e53. Read-only preflight checks all6600sources before/after, five known public preview tiles/notices, seven historical Git commits and144indexed models. Stock list inventories1286entry roots and explicitly does not launch tests. Free physical RAM was roughly0.13–0.56GiB, so no heavy release run/compiler/build was launched and no owner application was closed. Historical full-release failures are not inferred solved.\n\nRecovery ${checkpoint} (${hash(checkpoint)}) includes all five changed/new native source paths, recipes, full source manifest, unit evidence and pre-edit coordination copies. This new draft is F-local only; no new GitHub/off-device backup is claimed. Existing verified Website source-only backup remains330543ff. Checklist201 preserves all71requirements/eightideas/statuses/baselines. No restart, installation, tab refresh, public deployment, access change, clinical approval, patient registration or accepted-mask/desktop PACS edit.\n\nNEXT: ${next}\n\n`;
checklist.revision = 201; checklist.updatedAt = '2026-10-24';
checklist.changeLog.unshift({revision: 201, date: '2026-10-24', summary, checkpoint, checkpointSha256: hash(checkpoint), sourceReceipt, sourceReceiptSha256: hash(sourceReceipt), previewChanged: false, clinicalApproval: false, patientSpaceRegistration: false});
assert.deepEqual(checklist.items, previousChecklist.items); assert.deepEqual(checklist.baseline, previousChecklist.baseline);
const after = structuredClone(before);
after.activeWork.current.pendingPancreaticVenousUs = {checkpoint, sha256: hash(checkpoint), source: sourceReceipt, sourceSha256: hash(sourceReceipt), unitPass: 6, unbuilt: true, offDeviceBackup: false};
after.activeWork.current.next = next; after.activeWork.current.beforeFurtherWork = next;
const coordination = recovery + '/COORDINATION.json';
write(coordination, {at: new Date().toISOString(), checkpoint, checkpointSha256: hash(checkpoint), checklistRevision: 201, statusesAndBaselinePreserved: true, fullGoalActive: true, installedAndBuiltCandidateUnchanged: true, previewChanged: false});
after.activeWork.current.latestCoordination = {receipt: coordination, sha256: hash(coordination)};
after.activeWork.current.latestChecklistUpdate = {receipt: coordination, sha256: hash(coordination), revision: 201};
for (const key of ['goal', 'safety', 'historyArchive']) assert.deepEqual(after[key], before[key]);
assert.deepEqual(after.activeWork.current.currentInstalled, before.activeWork.current.currentInstalled);
assert.deepEqual(after.activeWork.current.latestWebsiteCandidate, before.activeWork.current.latestWebsiteCandidate);
const text = JSON.stringify(after, null, 2) + '\n'; assert(Buffer.byteLength(text) < 65536, 'Index would exceed64KiB; do not partially update docs');
// Guarded mechanical checkpoint/log update, preserving every prior byte below the prefix.
for (const [target, saved] of [[mapPath, 'WORKSPACE_MAP.before.md'], [planPath, 'master-plan.before.md'], [checklistPath, 'completion-checklist.before.json'], [indexPath, 'CURRENT_BEFORE.json']]) assert.equal(hash(target), hash(recovery + '/' + saved));
for (const target of [mapPath, planPath]) fs.writeFileSync(target, prefix + fs.readFileSync(target, 'utf8'));
fs.writeFileSync(checklistPath, JSON.stringify(checklist, null, 2) + '\n'); fs.writeFileSync(indexPath, text);
for (const row of sourceRows) assert.equal(hash(root + '/' + row.path), row.sha256);
console.log(JSON.stringify({checkpoint, sha256: hash(checkpoint), sourceReceipt, sourceSha256: hash(sourceReceipt), checklistRevision: 201, indexBytes: Buffer.byteLength(text), unitCasesPassed: 6, built: false, previewChanged: false, offDeviceBackup: false}));
