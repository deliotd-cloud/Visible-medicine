import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash, json} from './seal-simple-website-successor.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft';
const recovery = 'F:/VisibleMedicine/recovery/checkpoints/20261024-pancreatic-venous-us-native';
const sourcePath = stage + '/SOURCE_BOUND.json', source = json(sourcePath);
const backed = json(recovery + '/BACKUP_VERIFIED.json'), backup = json(backed.receipt);
assert(backed.independentlyVerified && backup.sourceBackupVerified && backup.strictIntegrity);
assert.equal(hash(backed.receipt), backed.receiptSha256);
assert.equal(hash(backed.aliasesReceipt), backed.aliasesReceiptSha256);
assert.equal(json(backed.aliasesReceipt).uniqueSourceOmissions, 0);
for (const row of source.sourceRows) assert.equal(hash(source.atlas + '/' + row.path), row.sha256);
const artifacts = json(source.buildArtifacts);
assert.equal(hash(source.buildArtifacts), source.buildArtifactsSha256);
for (const row of artifacts.files) assert.equal(hash(artifacts.root + '/' + row.path), row.sha256);
const oldIndex = json(recovery + '/CURRENT_BEFORE.json'), current = json('CURRENT_CHECKPOINT.json');
for (const key of ['goal', 'safety', 'historyArchive']) assert.deepEqual(current[key], oldIndex[key]);
assert.equal(current.activeWork.current.activeExecutionSessions.length, 0);
assert.deepEqual(current.activeWork.current.currentInstalled, oldIndex.activeWork.current.currentInstalled);
assert.deepEqual(current.activeWork.current.latestWebsiteCandidate, oldIndex.activeWork.current.latestWebsiteCandidate);
assert.equal(current.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
const checklistFile = 'F:/VisibleMedicine/website/docs/completion-checklist.json';
const oldChecklist = json(recovery + '/completion-checklist.before.json'), checklist = json(checklistFile);
assert.deepEqual(checklist, oldChecklist); assert.equal(checklist.revision, 201);
const checkpointPath = recovery + '/checkpoint.json'; assert(!fs.existsSync(checkpointPath));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', {flag: 'wx'});
const copy = (from, to) => {fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL); assert.equal(hash(from), hash(to));};
for (const phase of ['unit', 'integration', 'types', 'regional', 'renderer', 'display', 'regionalCheck', 'rendererCheck', 'displayCheck', 'build', 'cohort', 'cohortV2', 'typesV2', 'unitV2', 'sealAmbientPreflight']) {
  const from = stage + '/checks/' + phase;
  for (const file of fs.readdirSync(from)) copy(from + '/' + file, recovery + '/checks/' + phase + '/' + file);
}
write(checkpointPath, {
  at: new Date().toISOString(), milestone: 'Source-bound pancreatic venous US teaching, coherent native build and filtered source recovery',
  sourceReceipt: sourcePath, sourceReceiptSha256: hash(sourcePath), atlas: source.atlas, atlasHead: source.atlasHead, atlasTree: source.atlasTree,
  sourcePaths: source.sourcePaths, changedPaths: source.changedPaths, newPaths: source.newPaths,
  focusedCasesPassed: source.focusedCasesPassed, strictTypeRoots: 2, strictTypeFiles: source.strictTypeFiles, typeDiagnostics: 0,
  originalRegionalRendererDisplayGeneratorsAndStockBuildPassed: true, buildArtifacts: source.buildArtifacts, buildArtifactsSha256: source.buildArtifactsSha256, buildFiles: source.buildFiles,
  changedUsLessons: 1, preservedLessons: 9935, preservedWorksheets: 1103, all1104SourcesChecksReasoningToursPreserved: true,
  sourceBackup: backed, exactInheritedDuplicateAliases: json(backed.aliasesReceipt).aliasCount, uniqueSourceOmissions: 0,
  initialCohortFailureRetained: {receipt: source.retainedInitialCohort, sha256: source.retainedInitialCohortSha256, counts: source.initialCohortCounts, cause: 'Current teaching packet correctly refused by stale parent display pins; original metadata generation followed by the identical test passes.'},
  goal: current.goal, pending: source.pending, currentBuiltWebsiteUnchanged: current.activeWork.current.latestWebsiteCandidate.sourceReceipt,
  laterCoordinationRawQaGeneratedModelsBuildsDependenciesPrivateDataNotInRemoteSelection: true,
  fullSuitePassing: false, clinicalApproval: false, patientSpaceRegistration: false, websiteIntegrated: false, previewChanged: false, installed: false,
});
const next = 'Keep preview unchanged; full71/eight goal active. Native pancreatic venous US draft now has fresh original metadata,10focused cases, strict1530-file graph and stock build. Compose its exact commit through all four original learner exporters and fresh protected Website Review, preserving review-pager UI and source gates. Current complete Website remains4058a3a3. Continue full-release/signed-in/AT and substantive teaching; no approval transfer or patient registration.';
const summary = `One exact-source pancreaticoduodenal venous US draft now has a coherent native build:10focused cases pass, actual strict${source.strictTypeFiles}-file graph0diagnostics and original metadata checks pass. All9935other root-body lessons and1103other worksheets remain exact. Filtered source backup independently verified; Website integration remains pending and owner preview unchanged.`;
const prefix = `## Current: pancreatic venous US native build ready — 24 October 2026\n\n${summary}\n\nNative ${source.atlasHead}/${source.atlasTree}; source ${sourcePath} (${hash(sourcePath)}),${source.sourcePaths}paths and${source.buildFiles}stock build outputs. FMA15398 retains all three unnamed, unvalidated components. Original primary-source teaching changes only one US placement; all1104worksheet source/checklist/reasoning/tour contexts and model/dependency/licence terms remain unchanged. Stale packets and three forged packets are refused before storage. Initial3pass/1failstale-display-metadata evidence is retained; identical final4casecohort passes after the stock generators. This is not clinical, spatial, browser, signed-in or full-release acceptance.\n\nRecovery ${checkpointPath} (${hash(checkpointPath)}). Source-only GitHub ${backup.branch}, HEAD${backup.head}:${backup.sourcePaths}selected/${backup.restoredPaths}independently restored,${backed.newPaths}new paths and${json(backed.aliasesReceipt).aliasCount}exact inherited duplicate aliases verified against separately fetched parent Git; no unique source omission or working-file deletion. Generated delivery/private data/models/build/dependencies/raw QA and later coordination remain F-local, not whole/private/runnable off-device recovery. Checklist202 preserves all71requirements/eightideas/statuses/baselines. Current complete Website4058a3a3/nativeb8ec/Review51e53 remains unchanged; new native source is not yet Website-integrated or installed.\n\nNEXT: ${next}\n\n`;
const updated = structuredClone(current);
updated.activeWork.current.pendingPancreaticVenousUs = {checkpoint: checkpointPath, sha256: hash(checkpointPath), source: sourcePath, sourceSha256: hash(sourcePath), nativeHead: source.atlasHead, nativeBuildPassed: true, unitAndCohortPass: 10, typeFiles: source.strictTypeFiles, sourceBackup: {receipt: backed.receipt, sha256: backed.receiptSha256, head: backup.head, independentlyVerified: true}, websiteIntegrationPending: true, installed: false};
updated.activeWork.current.next = next; updated.activeWork.current.beforeFurtherWork = next; updated.next = next;
const coordinationPath = recovery + '/COORDINATION.json';
write(coordinationPath, {at: new Date().toISOString(), checkpoint: checkpointPath, checkpointSha256: hash(checkpointPath), checklistRevision: 202, allRequirementAndIdeaStatusesAndBaselinePreserved: true, fullGoalActive: true, installedAndCurrentWebsiteCandidateUnchanged: true, previewChanged: false});
updated.activeWork.current.latestCoordination = {receipt: coordinationPath, sha256: hash(coordinationPath)};
updated.activeWork.current.latestChecklistUpdate = {receipt: coordinationPath, sha256: hash(coordinationPath), revision: 202};
updated.activeWork.updated = new Date().toISOString();
const text = JSON.stringify(updated, null, 2) + '\n'; assert(Buffer.byteLength(text) < 65536);
checklist.revision = 202; checklist.updatedAt = '2026-10-24';
checklist.changeLog.unshift({revision: 202, date: '2026-10-24', summary, checkpoint: checkpointPath, checkpointSha256: hash(checkpointPath), sourceReceipt: sourcePath, sourceReceiptSha256: hash(sourcePath), previewChanged: false, clinicalApproval: false, patientSpaceRegistration: false});
assert.deepEqual(checklist.items, oldChecklist.items); assert.deepEqual(checklist.baseline, oldChecklist.baseline);
for (const [from, saved] of [['WORKSPACE_MAP.md', 'WORKSPACE_MAP.before.md'], ['F:/VisibleMedicine/website/docs/master-plan.md', 'master-plan.before.md'], [checklistFile, 'completion-checklist.before.json']]) assert.equal(hash(from), hash(recovery + '/' + saved));
for (const file of ['WORKSPACE_MAP.md', 'F:/VisibleMedicine/website/docs/master-plan.md']) fs.writeFileSync(file, prefix + fs.readFileSync(file, 'utf8'));
fs.writeFileSync(checklistFile, JSON.stringify(checklist, null, 2) + '\n'); fs.writeFileSync('CURRENT_CHECKPOINT.json', text);
console.log(JSON.stringify({checkpoint: checkpointPath, sha256: hash(checkpointPath), sourceSha256: hash(sourcePath), nativeHead: source.atlasHead, backupHead: backup.head, indexBytes: Buffer.byteLength(text), checklistRevision: 202, websiteIntegrated: false, previewChanged: false}));
