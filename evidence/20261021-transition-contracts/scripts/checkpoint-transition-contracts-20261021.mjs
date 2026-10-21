import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const target = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const stage = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const proposal = 'F:/VisibleMedicine/staging/20261021-spinal-ct-contract-proposal';
const frozen = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const website = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-transition-contracts-ready';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T01-57-38.440Z/observation.json';
const observation = json(observationPath);
assert.equal(sha(read(observationPath)), 'c8a0a218ec7321aded6dd7d4ae5435866abcff20f297cf5495ab58d6a82208bd');
assert(observation.processesConfirmedLive && !observation.terminalReceiptObserved && observation.ownerPreviewRunning);
assert.equal(observation.namedInputsVerified, 5053);
assert(!fs.existsSync(root));
const reviewed = json(stage + '/DENTAL_TRANSITION_STATIC.json');
assert.equal(reviewed.sourcePaths.length, 20);
assert(reviewed.wholeWorkerInverseVerified && !reviewed.runtimeGateExecuted);
const spinalPath = 'tests/atlas-spinal-muscle-xray.test.mjs';
const spinalOriginal = 'tests/fixtures/atlas-spinal-muscle-xray-original.raw';
assert.equal(sha(read(proposal + '/' + spinalPath)), 'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa');
assert.equal(sha(read(proposal + '/' + spinalOriginal)), 'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13');
assert.deepEqual(read(proposal + '/' + spinalOriginal), read(website + '/' + spinalPath));
const labels = ['ASSEMBLED_RENDERER_GENERATE', 'ASSEMBLED_RENDERER_CHECK', 'DENTAL_TRANSITION_SOURCE_REVIEW',
  'DENTAL_TRANSITION_SYNTAX', 'SPINAL_CT_PROPOSAL_INVERSE', 'SPINAL_CT_PROPOSAL_SYNTAX'];
const receipts = labels.map(label => {
  const receipt = json(stage + '/' + label + '.json');
  assert.equal(receipt.code, 0); assert.equal(receipt.signal, null);
  assert.equal(sha(read(receipt.log)), receipt.logSha256);
  return receipt;
});
const tap = read(observation.output + '/child.tap').toString();
const failureMarkers = tap.split(/\r?\n/).filter(line => /^not ok \d+ - /.test(line));
assert(failureMarkers.some(line => line.startsWith('not ok 503 - spinal X-ray')));
assert.equal(failureMarkers.length, 6, 'This snapshot is partial; new markers require explicit review');
const summary = { at: new Date().toISOString(), phase: 'exact transition gates and renderer binding prepared; runtime integration pending',
  previousGoalTurnClassification: 'progress: actual source assembly/native checks, two portability corrections and555blob filtered backup',
  source, target, sourcePaths: reviewed.sourcePaths,
  dental: { workerModel: 'gpt-6-sol', workerEffort: 'medium', nestedDelegation: false,
    originalGateSha256: reviewed.workerOriginalSha256, finalGateSha256: reviewed.finalGateSha256,
    wholeWorkerInverseVerified: true, syntaxPass: true, actualFullGatePass: false,
    scope: '28exact MRI placements/four shared method bodies; baseline/current/genuine-introduction full resolver and Review theorem. Strengthened current display/Review source joins and real generated-display parsing; separate stale material/null imaging and forged imaging revision refusals,0storage calls expected. Imaging revision remains unavailable/null, not changed or approved.',
    generationOrder: 'Existing trusted display-pin generator must run before full gate; renderer already generated with stock script. Commit real complete source only after source gates, then replay actual introduction via unmodified review-security history profile.' },
  renderer: { files: reviewed.renderer.files, sha256: reviewed.renderer.sha256,
    stockGenerateAndCheckPass: true, exactChangedDependencies: reviewed.renderer.exactChangedDependencies,
    geometryChanged: false, geometryApproval: false },
  spinal: { proposal, workerModel: 'gpt-6-sol', workerEffort: 'medium', nestedDelegation: false,
    paths: [spinalPath, spinalOriginal].map(p => ({ path: p, sha256: sha(read(proposal + '/' + p)) })),
    originalFrozenFileUnchanged: true, syntaxPass: true, controlledInverseHunks: 20,
    actualWebsiteModulePass: false, applied: false,
    scope: 'Add exact genuine9296CT versus87edparent source/Review/current/emitted teaching branch for one corpus cell. Preserve whole original theorem/fixtures/security and9910/9818total sums; preserved counters each decrease exactly1. No blanket exception, future API substitution or new test skip.' },
  correction: 'Main static reviewer initially sliced Unicode prose with Buffer-byte length instead of JS character length; corrected reviewer only, preimage retained. Initial failure is in tool output, not an invented raw log. Source and assertions unchanged by this correction.',
  receipts, wholeSuite: { observation: observationPath, sha256: sha(read(observationPath)),
    live: true, terminal: false, frozenInputs: 5053, entryCount: 1050, partialFailureMarkers: failureMarkers },
  tokens: 'Per-run token measurements unavailable; no claimed measured saving.',
  websiteUiPathsSeparate: 11, previousWebsiteAssurancePathsSeparate: 2, newWebsiteAssurancePathsSeparate: 2,
  currentGeneratedDisplayPinsRefreshed: false, sourceCommitted: false, stockExportsGenerated: false,
  websiteImported: false, canonicalInstalled: false, fullSuitePass: false,
  clinicalApproval: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true,
  limits: 'Static and stock renderer-source checks only, not full resolver/current-history/Review security/actual Website module/player/types/build/stock exports/import/browser acceptance. Prior native4/23/20checks remain exact unchanged runtime evidence, not full acceptance. Frozen full suite continues unchanged; owner98d7/Reviewb2bd/3000and open forms untouched. No masks/scans/private records/assets/dependencies/fees/permissions or clinical PACS changes.' };
fs.mkdirSync(root); const files = [], selected = [];
function copy(from, relative, remote = true) {
  const bytes = read(from), destination = root + '/' + relative;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes, { flag: 'wx' });
  assert.equal(sha(read(destination)), sha(bytes));
  const row = { path: relative, bytes: bytes.length, sha256: sha(bytes), remoteSelected: remote };
  files.push(row); if (remote) selected.push(row);
}
for (const row of reviewed.sourcePaths) copy(target + '/' + row.path, 'source/' + row.path);
for (const p of [spinalPath, spinalOriginal, 'INVERSE_CHECK.mjs', 'HANDOFF.md', 'FILES.md'])
  copy(proposal + '/' + p, 'website-proposal/' + p);
for (const p of ['DENTAL_TRANSITION_STATIC.json', 'dental-transition-worker-original.mjs.raw',
  'package-before-dental-transition.json.raw', 'gitattributes-before-dental-transition.raw',
  'dental-evidence-before-transition-doc.md.raw', 'renderer-before-dental-transition.json.raw',
  'static-review-before-unicode-length.mjs.raw']) copy(stage + '/' + p, 'evidence/' + p);
for (const label of labels) for (const ext of ['log', 'json']) copy(stage + '/' + label + '.' + ext, 'evidence/' + label + '.' + ext);
for (const script of ['verify-dental-transition-source-20261021.mjs', 'checkpoint-transition-contracts-20261021.mjs']) copy(script, 'scripts/' + script);
copy(observationPath, 'full-suite/observation.json', false);
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
copy(root + '/MAIN_REVIEW.json', 'evidence/MAIN_REVIEW.json');
const verify = () => {
  assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', frozen, 'status', '--porcelain']).toString().trim(), '');
  assert.equal(runGit(['-C', 'F:/VisibleMedicine/atlas', 'rev-parse', 'HEAD']).toString().trim(), '98d7f17e2d120b031633e59e47fc50c82d44b2d0');
  const changed = runGit(['-C', target, 'status', '--porcelain=v1', '-z', '--untracked-files=all'])
    .toString().split('\0').filter(Boolean).map(line => line.slice(3).replaceAll('\\', '/')).sort();
  assert.deepEqual(changed, reviewed.sourcePaths.map(row => row.path).sort());
  for (const row of reviewed.sourcePaths) assert.equal(sha(read(target + '/' + row.path)), row.sha256, row.path);
  assert.deepEqual(read(proposal + '/' + spinalOriginal), read(website + '/' + spinalPath));
  for (const row of files) assert.equal(sha(read(root + '/' + row.path)), row.sha256, row.path);
}; verify();
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-atlas-source-assembly-backup';
const parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(row => {
  const bytes = read(parentRoot + '/remote-source-restored/' + row.path);
  assert.equal(sha(bytes), row.sha256); return [row.path, bytes];
}));
for (const row of selected) values.set('evidence/20261021-transition-contracts/' + row.path, read(root + '/' + row.path));
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-transition-contracts-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-atlas-transition-contracts-20261021.git',
  branch: 'backup/atlas-transition-contracts-20261021',
  files: [...values].map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha(bytes) })).sort((a,b) => a.path.localeCompare(b.path)),
  bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlasBase: source, sourcePaths: reviewed.sourcePaths, sourceCommitted: false, canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { staticGateInversePass: true, rendererGenerateAndCheckPass: true, rendererFiles: 1479,
    spinalWholeInverseHunks: 20, actualFullTransitionPass: false, actualWebsiteModulePass: false, fullSuitePass: false, clinicalApproval: false },
  scope: 'Selected20actual uncommitted source paths,2Website assurance proposal paths, source preimages and bounded main-review/renderer/syntax/inverse proof on filtered ancestry. No full clone/raw canonical Git history, geometry, dependencies, scans/masks/private modules/reviews/databases/secrets/browser pixels/DOM. Observation/coordination local only. Not whole/runnable/private-data backup or generated/clinical admission.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...summary, files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')),
    head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'Wait for actual frozen full-run terminal inventory without timeout restart. Then exact original485twoassurance+newspinal module and original485newhipwrapper; trusted current display-pin generation, complete combined-source dental transition/newwholehip/player/renderer/types/build/stock exports/Review/Website/browser admission in sequence. Commit only real source and replay genuine introduction. Never claim current20paths installed. Preserve all71/eight roadmap and separate radiologist signoff; no more unrelated staging.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')),
  sourcePaths: 20, rendererFiles: 1479, websiteProposalPaths: 2, backup: remote.head, tree: remote.tree,
  restoredPaths: remote.restoredPaths, fullRuntimePass: false, installed: false }));
