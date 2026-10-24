import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash, json } from './seal-simple-website-successor.mjs';

const receipt = 'F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/SOURCE_BOUND.json';
const stage = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft';
const proposal = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-proposal';
assert.equal(hash(receipt), 'f93d90a9a91462c4f706a9613800c221a59432a34630f4b6af495b6d8d2d0af2');
assert.equal(hash(proposal + '/HANDOFF.json'), '48fa838438a15769e7769b3074a830b05a5bd3c87ca35c87a619db105e4c14be');
const parent = json(receipt), handoff = json(proposal + '/HANDOFF.json');
const current = json('CURRENT_CHECKPOINT.json');
assert.equal(current.goal.status, 'active');
assert.equal(current.activeWork.current.activeExecutionSessions.length, 0);
assert.equal(current.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert(!fs.existsSync(stage));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', windowsHide: true, stdio: 'pipe' }).trim();
assert.equal(git('-C', parent.atlas, 'rev-parse', 'HEAD'), 'b8ec59eeb0ec554b86d7ce01be992967e203b6a5');
assert.equal(git('-C', parent.atlas, 'status', '--porcelain'), '');
for (const row of handoff.proposalFiles) assert.equal(hash(proposal + '/' + row.path), row.sha256.toLowerCase());
fs.mkdirSync(stage);
const atlas = stage + '/atlas';
git('clone', '--shared', '--no-checkout', parent.atlas, atlas);
git('-C', atlas, 'read-tree', 'HEAD');
for (const row of parent.sourceRows) {
  assert.equal(hash(parent.atlas + '/' + row.path), row.sha256);
  const to = path.resolve(atlas, row.path);
  assert(to.startsWith(path.resolve(atlas) + path.sep));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(parent.atlas + '/' + row.path, to, fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(parent.atlas + '/node_modules', atlas + '/node_modules', 'junction');
assert.equal(git('-C', atlas, 'status', '--porcelain'), '');
for (const row of handoff.proposalFiles) fs.copyFileSync(proposal + '/' + row.path, atlas + '/' + row.path, fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify({
  at: new Date().toISOString(), atlas, parentReceipt: receipt, parentReceiptSha256: hash(receipt),
  parentAtlas: parent.atlas, parentHead: parent.atlasHead, parentTree: parent.atlasTree,
  parentSourcePaths: parent.sourceRows.length, workerHandoff: proposal + '/HANDOFF.json', workerHandoffSha256: hash(proposal + '/HANDOFF.json'),
  expectedChanges: ['app/body-content.ts', 'package.json', 'lib/body-pancreatic-venous-us.ts', 'scripts/test-body-pancreatic-venous-us.mjs', 'scripts/test-pancreatic-venous-us-unit.mjs'],
  target: { fmaId: 'FMA15398', topic: 'ultrasound', sourceComponents: 3, readiness: 'draft' },
  pending: ['Integration and strict types', 'Original renderer/review revision generators', 'Focused integration/cohort tests', 'Stock native build and all four original learner exports', 'Fresh protected Website Review import, staged Website build and source-only recovery'],
  generatedRevisionsUnchangedAndNotReadyForInstallation: true,
  previewChanged: false, installed: false, clinicalApproval: false, patientSpaceRegistration: false,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({stage, parentSourcePaths: parent.sourceRows.length, head: parent.atlasHead, copiedProposalFiles: handoff.proposalFiles.length}));
