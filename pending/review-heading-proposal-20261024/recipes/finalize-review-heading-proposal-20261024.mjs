import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261024-review-heading-proposal';
const checkpoint = root + '/checkpoint.json', saved = json(checkpoint);
const docs = [['WORKSPACE_MAP.md', 'WORKSPACE_MAP.before.md'], ['F:/VisibleMedicine/website/docs/master-plan.md', 'master-plan.before.md']];
const register = 'F:/VisibleMedicine/website/docs/completion-checklist.json';
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
if (process.argv[2] === 'prepare') {
  assert(saved.sourceBackup.independentlyVerified);
  const receipt = json(saved.sourceBackup.receipt);
  const entry = '## Current: Review heading consistency verified as a local proposal — 24 October 2026\n\nClinical Review now has a two-seam native proposal to reuse the learner\u2019s existing heading formatter. Six focused cases pass: four original tests remain byte-exact, and the real BodyReviewDetails excerpt renders six deeply frozen synthetic worksheets with whole-markup comparisons. Only a repeated exact selected-name prefix is removed from the visible heading; canonical lessons, worksheet/source fingerprints, actions, helper and learner are unchanged. Main removed a dated sibling-checkout dependency from the regression and independently reconstructed the whole genuine prior dashboard through the two exact seams. Existing React/TypeScript only; no assets/dependencies or fees added. This is narrow component-excerpt SSR, NOT a full configured graph, browser/signed-in check or clinical acceptance.\n\nPartial source F:/VisibleMedicine/staging/20261024-review-heading-proposal/atlas; recovery ' + checkpoint + ' (' + sha(read(checkpoint)) + '). Verified filtered source-only GitHub ' + receipt.branch + ', HEAD' + receipt.head + '/tree' + receipt.tree + ': ' + receipt.sourcePaths + ' selected / ' + receipt.restoredPaths + ' independently restored, no removed paths. Four explicit source/support paths and four recipes added; raw QA, preimages, handoff and later coordination stay F-local. Not a whole/private/runnable off-device backup.\n\nAll71requirements/eightideas/checklist203statuses remain. Complete Website cf587b/native6e/Review8e87, prepared right-gastric source and this partial UI proposal stay distinct; no complete-candidate replacement. Current preview unchanged: no install/restart/refresh/deployment, private upload, mask/PACS edit or approval/registration claim. The same1288-root stock full diagnostic is observed through its indexed actual handles, not duplicated.\n\nNEXT: At full-run terminal, classify every failure and compose the exact test repairs in a NEW Website. Compose the two Review changes with the prepared right-gastric native before its original generators/focused tests/strict graph/build/four exports and fresh protected Review. Execute the independent Studio runtime/browser fixture separately.\n\n';
  const rows = docs.map(([file, prior]) => {
    const old = read(root + '/' + prior); assert.deepEqual(read(file), old);
    return { file, beforeSha256: sha(old), afterSha256: sha(entry + old.toString()), patch: '*** Update File: ' + file + '\n@@\n+' + entry.trimEnd().split('\n').join('\n+') + '\n+\n ' + old.toString().split(/\r?\n/)[0] + '\n' };
  });
  write(root + '/METADATA_PATCH.json', { docs: rows.map(({ patch, ...row }) => row), checklistSha256: sha(read(register)), patch: '*** Begin Patch\n' + rows.map(row => row.patch).join('') + '*** End Patch' });
  console.log(JSON.stringify({ patch: root + '/METADATA_PATCH.json' }));
} else if (process.argv[2] === 'finish') {
  const meta = json(root + '/METADATA_PATCH.json');
  for (const row of meta.docs) {
    assert.equal(sha(read(row.file)), row.afterSha256);
    const old = read(root + '/' + docs.find(([file]) => file === row.file)[1]);
    assert.deepEqual(read(row.file).subarray(-old.length), old);
  }
  const p = json('CURRENT_CHECKPOINT.json'), before = json(root + '/CURRENT_BEFORE.json');
  for (const key of ['goal', 'safety', 'historyArchive', 'coordination']) assert.deepEqual(p[key], before[key]);
  for (const key of ['ownerPreviewPolicy', 'currentInstalled', 'latestWebsiteCandidate', 'pendingRightGastricEusProposal', 'pendingIndependentQaProposals', 'pendingReleaseRepairBatch']) assert.deepEqual(p.activeWork.current[key], before.activeWork.current[key]);
  assert.equal(sha(read(register)), meta.checklistSha256); assert.equal(json(register).revision, 203); assert.equal(json(register).items.length, 71);
  const next = 'Keep current preview unchanged; full71/eight goal active. Observe same frozen cf587b1288-root diagnostic until terminal, then classify and compose original test repairs into NEW Website. Review heading partial:6focused cases pass; compose2native changes with prepared right-gastric EUS before stock metadata generators,13EUS cases/retained theorem/heading tests/strict graph/build/four exports/fresh Review. Run source-bound Studio browser fixture separately. No full-app/browser/clinical/spatial acceptance inferred from narrow tests.';
  p.next = next; p.activeWork.current.next = next; p.activeWork.updated = new Date().toISOString();
  const run = p.activeWork.current.runningExactReleaseDiagnostic; assert.equal(sha(read(run.latestObservation)), run.latestObservationSha256);
  const receipt = { at: p.activeWork.updated, checkpoint, checkpointSha256: sha(read(checkpoint)), documents: meta.docs, sourceBackup: saved.sourceBackup, latestActualProcessObservation: run.latestObservation, latestActualProcessObservationSha256: run.latestObservationSha256, checklistRevision: 203, checklistSha256: sha(read(register)), fullGoalAndPoliciesPreserved: true, fullAppOrBrowserAccepted: false, previewChanged: false, installed: false, fullSuitePassed: false, clinicalApproval: false, patientSpaceRegistration: false, laterCoordinationRemotelyBackedUp: false };
  write(root + '/COORDINATION.json', receipt);
  p.activeWork.current.latestCoordination = { receipt: root + '/COORDINATION.json', sha256: sha(read(root + '/COORDINATION.json')) };
  const bytes = Buffer.from(JSON.stringify(p, null, 2) + '\n'); assert(bytes.length < 65536);
  fs.writeFileSync('CURRENT_CHECKPOINT.json', bytes); fs.copyFileSync('CURRENT_CHECKPOINT.json', root + '/CURRENT_AFTER.json', fs.constants.COPYFILE_EXCL);
  for (const [file] of docs) fs.copyFileSync(file, root + '/' + (file === 'WORKSPACE_MAP.md' ? 'WORKSPACE_MAP.after.md' : 'master-plan.after.md'), fs.constants.COPYFILE_EXCL);
  console.log(JSON.stringify({ receipt: root + '/COORDINATION.json', sha256: sha(read(root + '/COORDINATION.json')), indexBytes: bytes.length, goal: 'active', previewChanged: false }));
} else throw Error('Use prepare or finish');
