import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
import { verifyInventory, loadActual } from 'file:///F:/VisibleMedicine/staging/20261021-joint-soft-tissue-inventory/main/verify-inventory.mjs';

const header = 'F:/VisibleMedicine/staging/20261021-header-native-proposal';
const inventory = 'F:/VisibleMedicine/staging/20261021-joint-soft-tissue-inventory';
const atlas = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const candidate = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-header-joint-evidence';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
assert(!fs.existsSync(root), 'Create-only recovery checkpoint');
const result = (stage, label, tests) => {
  const r = json(stage + '/' + label + '.json');
  assert.equal(r.code, 0); assert.equal(r.signal, null);
  assert.equal(sha(read(r.log)), r.logSha256);
  if (tests) for (const text of [`# tests ${tests}`, `# pass ${tests}`, '# fail 0', '# skipped 0', '# cancelled 0']) assert(r.footer.includes(text));
  return { logSha256: r.logSha256, tests: tests || null, code: r.code };
};
const headerProof = result(header, 'HEADER_NATIVE_WITH_LAYOUT', 13);
const inventoryProof = result(inventory, 'INVENTORY_NATIVE', 13);
result(inventory, 'INVENTORY_REPORT');
assert.equal(json(header + '/HEADER_NATIVE.json').code, 1, 'Original incomplete-sandbox failure is retained');
assert.equal(sha(read(header + '/HEADER_NATIVE.log')), json(header + '/HEADER_NATIVE.json').logSha256);
const prep = json(header + '/PREPARATION.json');
assert.equal(prep.copiedInputs.length, 6);
for (const r of prep.copiedInputs) {
  assert.equal(sha(read(candidate + '/' + r.path)), r.sha256, 'Frozen original input ' + r.path);
  if (!['components/SiteHeader.tsx', 'tests/header-workspace-destination.test.mjs'].includes(r.path))
    assert.deepEqual(read(header + '/' + r.path), read(candidate + '/' + r.path));
}
assert.equal(sha(read(header + '/components/SiteHeader.tsx')), 'a4a85f4da9f956fe8d59024cd2c220266d385579d969799680a5dacaec65ca6b');
assert.deepEqual(read(header + '/tests/fixtures/header-before-keyboard-focus/SiteHeader.tsx.raw'), read(candidate + '/components/SiteHeader.tsx'));
assert.deepEqual(read(header + '/tests/fixtures/header-before-keyboard-focus/header-workspace-destination.test.mjs.raw'), read(candidate + '/tests/header-workspace-destination.test.mjs'));
const report = verifyInventory(loadActual(atlas, inventory + '/worker/inventory.json'));
assert.deepEqual(report, json(inventory + '/INVENTORY_REPORT.log'));
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T00-09-38.100Z/observation.json';
const observation = json(observationPath);
assert.equal(observation.namedInputsVerified, 5053);
assert.equal(observation.source, source);
assert.equal(observation.ownerPreviewRunning, true);

const headerPaths = ['components/SiteHeader.tsx', 'components/SiteFrame.tsx', 'lib/public-route-focus.ts', 'app/layout.tsx',
  'tests/header-session.test.ts', 'tests/header-workspace-destination.test.mjs', 'tests/header-tab-focus.test.mjs',
  'tests/fixtures/header-before-keyboard-focus/SiteHeader.tsx.raw',
  'tests/fixtures/header-before-keyboard-focus/header-workspace-destination.test.mjs.raw',
  'PREPARATION.json', 'HANDOFF.md', 'package.json', 'HEADER_NATIVE.log', 'HEADER_NATIVE.json',
  'HEADER_NATIVE_WITH_LAYOUT.log', 'HEADER_NATIVE_WITH_LAYOUT.json'];
const inventoryPaths = ['worker/inventory.json', 'worker/README.md', 'main/verify-inventory.mjs', 'main/verify-inventory.test.mjs',
  'main/HANDOFF.md', 'PREPARATION.json', 'INVENTORY_NATIVE.log', 'INVENTORY_NATIVE.json', 'INVENTORY_REPORT.log', 'INVENTORY_REPORT.json'];
const admissionPaths = ['components/SiteHeader.tsx', 'tests/header-workspace-destination.test.mjs', 'tests/header-tab-focus.test.mjs',
  'tests/fixtures/header-before-keyboard-focus/SiteHeader.tsx.raw', 'tests/fixtures/header-before-keyboard-focus/header-workspace-destination.test.mjs.raw'];
const final = {
  at: new Date().toISOString(), phase: 'native header proposal and exact-revision joint metadata verification', source,
  candidate, headerStage: header, inventoryStage: inventory,
  headerProof, inventoryProof, headerAdmissionPaths: admissionPaths,
  actualFocusedTests: 26, inventorySelectedRecordsBySource: [10, 10, 2],
  headerWholeOriginalInverse: true, workspaceWholeOriginalTestInverse: true, originalSessionTestUnchanged: true,
  initialHeaderFailure: 'Isolated sandbox omitted unchanged app/layout.tsx; exact frozen layout added, all original assertions retained, 13/13 subsequent pass. Original 12/13 receipt preserved.',
  jointScope: 'Six-region bounded named-metadata evidence: 22 exact records from 3 separately identified catalogues; no unique-anatomy or completeness claim. Twelve negative mutation cases plus one actual source check. Independent UM scopes stay unregistered; grouped surfaces and literal filenames retained. Source credit/licences retained.',
  observation: { path: observationPath, sha256: sha(read(observationPath)), liveAtObservation: observation.processesConfirmedLive,
    terminalAtObservation: observation.terminalReceiptObserved, frozenInputs: 5053 },
  canonicalInstalled: false, candidateChanged: false, sourceCommitted: false,
  reviewPacketGenerated: false, newHeaderBrowserAccepted: false, fullSuitePass: false,
  clinicalApproval: false, geometryDecoded: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true,
  limits: 'Focused native tests and source-bound metadata only. No new full Website type/build/browser, source/mesh admission, complete anatomy curriculum or clinical acceptance. Frozen 5053 candidate/source485 and owner98d7/Reviewb2bd/manual-reload3000 remain untouched.'
};
fs.mkdirSync(root);
const files = [];
const copy = (from, relative) => {
  const bytes = read(from), to = root + '/' + relative;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, bytes, { flag: 'wx' });
  assert.equal(sha(read(to)), sha(bytes));
  files.push({ path: relative, bytes: bytes.length, sha256: sha(bytes) });
};
for (const p of headerPaths) copy(header + '/' + p, 'header/' + p);
for (const p of inventoryPaths) copy(inventory + '/' + p, 'inventory/' + p);
copy(observationPath, 'full-suite/observation.json');
copy(import.meta.filename, 'checkpoint-header-inventory-20261021.mjs');
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(final, null, 2) + '\n', { flag: 'wx' });
files.push({ path: 'MAIN_REVIEW.json', bytes: read(root + '/MAIN_REVIEW.json').length, sha256: sha(read(root + '/MAIN_REVIEW.json')) });

const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-dental-mri-proposal-backup';
const parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(r => {
  const bytes = read(parentRoot + '/remote-source-restored/' + r.path); assert.equal(sha(bytes), r.sha256);
  return [r.path, bytes];
}));
for (const row of files) values.set('evidence/20261021-header-joint-evidence/' + row.path, read(root + '/' + row.path));
const verify = () => {
  assert.equal(runGit(['-C', atlas, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', atlas, 'status', '--porcelain']).toString().trim(), '');
  for (const r of prep.copiedInputs) assert.equal(sha(read(candidate + '/' + r.path)), r.sha256);
  for (const row of files) assert.equal(sha(read(root + '/' + row.path)), row.sha256);
};
verify();
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-header-joint-evidence-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-header-joint-evidence-20261021.git',
  branch: 'backup/website-header-joint-evidence-20261021',
  files: [...values].map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha(bytes) })).sort((a, b) => a.path.localeCompare(b.path)),
  bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlas: source, uninstalledHeaderSha256: prep.proposedHeaderSha256, proposalOnly: true, canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { actualHeaderTests: 13, actualInventoryTests: 13, namedRecords: 22, wholeOriginalInverses: true,
    fullSuitePass: false, clinicalApproval: false, sourceAdmission: false },
  scope: 'Selected uninstalled public header/test source, exact-revision named metadata, original fixtures and actual focused proof, retaining previously filtered source ancestry only. No raw canonical ancestry, scans, masks, geometry, browser pixels/DOM, private modules/reviews/databases or secrets. Not a complete/runnable/private-data backup, source admission or release.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...final, files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')),
    head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'After actual full Website terminal inspect all results and perform coherent native admission of bounded test/source/header proposals. New header still needs native integrated browser QA. Joint report informs source priorities without inventing geometry, clinical approval or registration. Preserve all71/eight roadmap and owner review forms.'
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')),
  actualFocusedTests: 26, backup: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths, canonicalInstalled: false }));
