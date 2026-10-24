// Lossless historical-detail compaction. No source, goal or process-state change.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261024-independent-qa-index-history';
const beforeBytes = read('CURRENT_CHECKPOINT.json'), before = JSON.parse(beforeBytes), after = structuredClone(before);
assert.equal(before.goal.status, 'active'); assert.equal(before.goal.requirements, 71); assert.equal(before.goal.optionalIdeas, 8);
assert.equal(sha(read(before.historyArchive.path)), before.historyArchive.sha256); assert(!fs.existsSync(root));
const keys = ['pendingHeadLayoutHistory', 'pendingLoaderPreservation', 'pendingGuidedReviewCompleteness'];
const archive = { at: new Date().toISOString(), previousArchive: before.historyArchive, activeWork: { current: {} } };
for (const key of keys) { const old = before.activeWork.current[key]; assert(old?.checkpoint && old.checkpointSha256); archive.activeWork.current[key] = old; }
fs.mkdirSync(root);
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(root + '/CURRENT_BEFORE.json', beforeBytes, { flag: 'wx' }); write(root + '/history.json', archive);
const historySha = sha(read(root + '/history.json'));
for (const key of keys) {
  const old = before.activeWork.current[key];
  after.activeWork.current[key] = { checkpoint: old.checkpoint, checkpointSha256: old.checkpointSha256, detailsIn: root + '/history.json', originalJsonPath: 'activeWork.current.' + key, policy: 'Full original proposal, pending flags and source-backup scope retained; no later integration, completion, approval or permission inferred.' };
}
after.historyArchive = { path: root + '/history.json', sha256: historySha, fieldIndex: root + '/field-index.json', allHistoryRetained: true, priorArchiveIn: 'previousArchive', readPolicy: before.historyArchive.readPolicy };
const restored = structuredClone(after); restored.historyArchive = archive.previousArchive;
for (const key of keys) restored.activeWork.current[key] = archive.activeWork.current[key];
assert.deepEqual(restored, before);
for (const key of ['goal', 'safety', 'ownerWithdrawnHistoryPolicy', 'coordination']) assert.deepEqual(after[key], before[key]);
for (const key of ['ownerPreviewPolicy', 'activeExecutionSessions', 'currentInstalled', 'latestWebsiteCandidate', 'runningExactReleaseDiagnostic', 'pendingReleaseRepairBatch', 'pendingRightGastricEusProposal', 'latestChecklistUpdate']) assert.deepEqual(after.activeWork.current[key], before.activeWork.current[key]);
const bytes = Buffer.from(JSON.stringify(after, null, 2) + '\n'); assert(bytes.length < 63000 && bytes.length < beforeBytes.length);
write(root + '/field-index.json', { at: archive.at, fields: keys.map(k => 'activeWork.current.' + k), historySha256: historySha, previousArchive: archive.previousArchive });
fs.writeFileSync('CURRENT_CHECKPOINT.json', bytes); fs.writeFileSync(root + '/CURRENT_AFTER.json', bytes, { flag: 'wx' });
const result = { at: archive.at, beforeBytes: beforeBytes.length, afterBytes: bytes.length, beforeSha256: sha(beforeBytes), afterSha256: sha(bytes), history: root + '/history.json', historySha256: historySha, wholeOriginalReconstructs: true, fullGoalAndPoliciesPreserved: true, sourceCandidateAndProcessHandlesPreserved: true, sourceOrPreviewChanged: false, remotelyBackedUp: false };
write(root + '/COORDINATION.json', result); console.log(JSON.stringify(result));
