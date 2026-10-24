import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { read, json, sha } from './source-only-backup-20261019.mjs';
import { nativeAtlasEnvironment } from './native-atlas-environment-20261022.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-native';
const proposal = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-proposal';
const prep = json(proposal + '/PREPARATION.json'), parent = json(prep.parentReceipt);
const checkpoint = 'F:/VisibleMedicine/recovery/checkpoints/20261024-right-gastric-eus-proposal/checkpoint.json';
assert.equal(sha(read(checkpoint)), '467508169162329a31d95b2fe64a4417bd321fe16205e739cfe3780b31e9eaaa');
const verified = json(checkpoint);
assert.equal(sha(read(prep.parentReceipt)), prep.parentReceiptSha256);
assert.equal(parent.atlas, prep.parentNative);
nativeAtlasEnvironment({ atlas: parent.atlas, revision: parent.atlasHead, tree: parent.atlasTree });
const pointer = json('CURRENT_CHECKPOINT.json');
assert.equal(pointer.goal.status, 'active'); assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert(!fs.existsSync(stage));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0' } }).trim();
fs.mkdirSync(stage);
const atlas = stage + '/atlas';
git('clone', '--shared', '--no-checkout', parent.atlas, atlas);
git('-C', atlas, 'read-tree', 'HEAD');
for (const row of parent.sourceRows) {
  const bytes = read(parent.atlas + '/' + row.path); assert.equal(sha(bytes), row.sha256);
  const destination = path.resolve(atlas, row.path);
  assert(destination.startsWith(path.resolve(atlas) + path.sep));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes, { flag: 'wx' });
}
fs.symlinkSync(parent.atlas + '/node_modules', atlas + '/node_modules', 'junction');
assert.equal(git('-C', atlas, 'status', '--porcelain'), '');
for (const row of verified.sourceRows) {
  assert.equal(sha(read(proposal + '/atlas/' + row.path)), row.sha256);
  if (parent.sourceRows.some(r => r.path === row.path)) {
    assert.equal(sha(read(atlas + '/' + row.path)), parent.sourceRows.find(r => r.path === row.path).sha256);
    fs.copyFileSync(proposal + '/atlas/' + row.path, atlas + '/' + row.path);
  } else fs.copyFileSync(proposal + '/atlas/' + row.path, atlas + '/' + row.path, fs.constants.COPYFILE_EXCL);
}
const preparation = {
  at: new Date().toISOString(), kind: 'complete-source-tree-with-unbuilt-native-draft', atlas,
  parentReceipt: prep.parentReceipt, parentReceiptSha256: prep.parentReceiptSha256,
  parentAtlas: parent.atlas, parentHead: parent.atlasHead, parentTree: parent.atlasTree,
  parentSourcePaths: parent.sourceRows.length, copiedVerifiedProposal: checkpoint, copiedVerifiedProposalSha256: sha(read(checkpoint)),
  copiedSourceRows: verified.sourceRows, baselinePackageSha256: sha(read(atlas + '/package.json')),
  baselineNoticeSha256: sha(read(atlas + '/LICENSES/THIRD_PARTY_NOTICES.md')),
  expectedChanges: [...verified.sourceRows.map(r => r.path), 'LICENSES/THIRD_PARTY_NOTICES.md', 'package.json', 'scripts/test-right-gastric-eus-integration.mjs'],
  target: { id: prep.targetId, fmaId: 'FMA15400', topic: 'ultrasound', readiness: 'draft' },
  generatedRevisionsStillParent: true, strictTypecheck: false, productionBuild: false,
  learnerOrReviewExports: false, websiteIntegration: false, installed: false,
  previewChanged: false, clinicalApproval: false, patientSpaceRegistration: false,
};
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(preparation, null, 2) + '\n', { flag: 'wx' });
nativeAtlasEnvironment({ atlas: parent.atlas, revision: parent.atlasHead, tree: parent.atlasTree });
console.log(JSON.stringify({ preparation: stage + '/PREPARATION.json', sha256: sha(read(stage + '/PREPARATION.json')), completeParentSourcePaths: parent.sourceRows.length, proposalPaths: verified.sourceRows.length, previewChanged: false, built: false }));
