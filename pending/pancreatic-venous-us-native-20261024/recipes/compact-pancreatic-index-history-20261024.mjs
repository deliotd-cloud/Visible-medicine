import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash, json} from './seal-simple-website-successor.mjs';
const file = 'CURRENT_CHECKPOINT.json', before = json(file);
assert.equal(before.goal.status, 'active'); assert.equal(before.goal.requirements, 71); assert.equal(before.goal.optionalIdeas, 8);
assert.equal(before.activeWork.current.activeExecutionSessions.length, 0);
assert.equal(before.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert.equal(hash(before.historyArchive.path), before.historyArchive.sha256);
const destination = 'F:/VisibleMedicine/recovery/checkpoints/20261024-pancreatic-venous-index-history';
assert(!fs.existsSync(destination));
const fields = ['pendingOrbitalCtTeaching', 'pendingToolbarButtonContrast'];
const selected = Object.fromEntries(fields.map(key => {
  const value = before.activeWork.current[key]; assert(value);
  assert.equal(hash(value.checkpoint), value.checkpointSha256);
  assert.equal(hash(value.sourceReceipt), value.sourceReceiptSha256);
  return [key, value];
}));
const archive = {schema: 'visible-medicine.index-history/1', at: new Date().toISOString(), previousArchive: before.historyArchive, activeWork: {current: selected}};
const after = structuredClone(before);
fs.mkdirSync(destination);
fs.copyFileSync(file, destination + '/CURRENT_BEFORE.json', fs.constants.COPYFILE_EXCL);
fs.writeFileSync(destination + '/history.json', JSON.stringify(archive, null, 2) + '\n', {flag: 'wx'});
fs.writeFileSync(destination + '/field-index.json', JSON.stringify({paths: fields.map(key => 'activeWork.current.' + key), priorArchiveIn: 'previousArchive'}, null, 2) + '\n', {flag: 'wx'});
const archivePath = destination + '/history.json', archiveSha = hash(archivePath);
for (const key of fields) {
  const value = selected[key];
  after.activeWork.current[key] = {checkpoint: value.checkpoint, checkpointSha256: value.checkpointSha256, archivedDetails: {path: archivePath, sha256: archiveSha, field: 'activeWork.current.' + key}, previewChanged: false, installed: false};
}
after.historyArchive = {path: archivePath, sha256: archiveSha, fieldIndex: destination + '/field-index.json', allHistoryRetained: true, priorArchiveIn: 'previousArchive', readPolicy: before.historyArchive.readPolicy};
const reconstructed = structuredClone(after);
reconstructed.historyArchive = before.historyArchive;
for (const key of fields) reconstructed.activeWork.current[key] = json(archivePath).activeWork.current[key];
assert.deepEqual(reconstructed, before, 'Full inverse must reconstruct every original value');
const text = JSON.stringify(after, null, 2) + '\n'; assert(Buffer.byteLength(text) < 63000);
assert.equal(hash(file), hash(destination + '/CURRENT_BEFORE.json'));
fs.writeFileSync(file, text);
fs.writeFileSync(destination + '/COMPACTION.json', JSON.stringify({at: new Date().toISOString(), beforeSha256: hash(destination + '/CURRENT_BEFORE.json'), afterSha256: hash(file), archive: archivePath, archiveSha256: archiveSha, fields, completeInverseVerified: true, bytes: Buffer.byteLength(text), goalInstalledCandidateAndRealProcessHandlesPreserved: true}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({archive: archivePath, sha256: archiveSha, indexBytes: Buffer.byteLength(text), inverseVerified: true}));
