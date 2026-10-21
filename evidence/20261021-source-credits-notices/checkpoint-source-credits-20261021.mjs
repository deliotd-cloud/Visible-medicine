import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-source-credits-proposal';
const audit = 'F:/VisibleMedicine/staging/20261021-runtime-notice-audit';
const candidate = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const atlas = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-source-credits-notices';
assert(!fs.existsSync(root));
function proof(base, label, tests) {
  const r = json(base + '/' + label + '.json'); assert.equal(r.code, 0); assert.equal(r.signal, null);
  assert.equal(sha(read(r.log)), r.logSha256);
  if (tests) for (const line of [`# tests ${tests}`, `# pass ${tests}`, '# fail 0', '# skipped 0', '# cancelled 0']) assert(r.footer.includes(line));
  return r;
}
const pageProof = proof(stage, 'CREDITS_NATIVE_FINAL', 5), noticeProof = proof(audit, 'NOTICE_NATIVE', 9);
proof(audit, 'NOTICE_CURRENT');
assert.equal(json(stage + '/CREDITS_NATIVE.json').code, 1, 'Initial newline failure retained');
const initial = json(audit + '/worker/findings.json'); assert.equal(initial.allConsistent, false);
const current = json(audit + '/MAIN_FINDINGS.json'); assert.deepEqual(current, json(audit + '/worker/findings-reviewed.json'));
assert.equal(current.websiteHead, 'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(current.sourceCommit, source); assert.equal(current.allConsistent, true); assert.equal(current.inspectedFiles.length, 34);
assert.deepEqual(current.scopes.map(s => [s.declaredPackages, s.parsedNotices, s.problems.length]), Array.from({ length: 5 }, () => [22, 22, 0]));
const browser = json(stage + '/BROWSER_LIMITS.json'); assert.equal(browser.checks.metrics.width, 1280);
assert.equal(browser.checks.metrics.scrollWidth, browser.checks.metrics.clientWidth);
assert.equal(browser.checks.metrics.main, 1); assert.equal(browser.previewStopped, true);
assert.equal(browser.publicFontHttp.checks[1].sha256, '1781d2806a07d91c4edf4740b88449fab7d0eadad53f7c351b94cd4d4eb8c00f');
const footerOriginal = read(stage + '/tests/fixtures/source-credits/SiteFooter.tsx.raw');
assert.deepEqual(footerOriginal, read(candidate + '/components/SiteFooter.tsx'));
assert.equal(read(stage + '/components/SiteFooter.tsx').toString().replace('<Link href="/credits">Source credits</Link>', ''), footerOriginal.toString());
const admissionPaths = ['app/credits/page.tsx', 'app/credits/source-credits.css', 'lib/source-credits.ts', 'components/SiteFooter.tsx', 'tests/source-credits.test.mjs', 'tests/fixtures/source-credits/SiteFooter.tsx.raw'];
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T00-26-49.461Z/observation.json';
const observation = json(observationPath); assert.equal(observation.namedInputsVerified, 5053); assert.equal(observation.ownerPreviewRunning, true);
const final = { at: new Date().toISOString(), phase: 'uninstalled source credits page and verified declared-viewer-notice audit', source,
  candidate, sourceFiles: admissionPaths.map(p => ({ path: p, sha256: sha(read(stage + '/' + p)) })),
  actualPageTests: 5, actualNoticeTests: 9, pageProof: pageProof.logSha256, noticeProof: noticeProof.logSha256,
  publicPage: 'One Governance footer link and five native grouped disclosures. No new main navigation, media/font/dependency/service or licence grant. Existing exact public notice destinations, credit/adaptation/source/preview/private-imaging limits retained.',
  notices: '34 inspected file hashes. Four learner dependency files and the existing Review manifest.packages each declare22packages, each with matching name/version/licence-expression notice. This is per-bundle declaration-to-notice consistency, not110unique packages, independent bundle closure or rights clearance.',
  reviewCorrection: 'Worker initially inferred missing Review declaration from absence of a standalone dependency JSON. Main found the existing generated manifest.packages; worker corrected parser and added refusal tests. Initial complete files/findings are retained. Cross-bundle use-sync-external-store1.6/1.7 difference is not an error by itself.',
  pageCorrection: 'First4/5 run preserved. Formatting-only repair restores one changed newline in the mixed-newline original footer; final5/5 retains whole original byte inverse. Native project default root works without sandbox-specific environment.',
  browser: { localEvidence: stage + '/BROWSER_LIMITS.json', screenshot: stage + '/credits-component-preview.png', screenshotSha256: sha(read(stage + '/credits-component-preview.png')),
    scope: browser.limit, previewStopped: true, ownedTabClosed: true, ownerFormsUntouched: true },
  fullSuiteObservation: { path: observationPath, sha256: sha(read(observationPath)), liveAtObservation: observation.processesConfirmedLive, terminalAtObservation: observation.terminalReceiptObserved, frozenInputs: 5053 },
  canonicalInstalled: false, frozenCandidateChanged: false, sourceAdmission: false, newNativeWebsiteBrowserAcceptance: false,
  fullSuitePass: false, exhaustiveRightsClearance: false, clinicalApproval: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true,
  limits: 'Staged source and read-only notice evidence. Static component browser check mocks Link/brand and omits app shell/generated styles. Font-link activation stayed in the component; direct HTTP200 and exact OFL bytes pass, browser document read not verified. No private content/decision reads, generated renderer rebind, type/build/native full-browser or clinical acceptance.' };
fs.mkdirSync(root);
const files = [];
function copy(from, rel) { const b = read(from), to = root + '/' + rel; fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, b, { flag: 'wx' }); assert.equal(sha(read(to)), sha(b)); files.push({ path: rel, bytes: b.length, sha256: sha(b) }); }
for (const p of [...admissionPaths, 'preview.mjs', 'package.json', 'PREPARATION.json', 'HANDOFF.md', 'CREDITS_NATIVE.json', 'CREDITS_NATIVE.log', 'CREDITS_NATIVE_FIXED.json', 'CREDITS_NATIVE_FIXED.log', 'CREDITS_NATIVE_FINAL.json', 'CREDITS_NATIVE_FINAL.log', 'HTTP_LINK_CHECK.json', 'BROWSER_COMPONENT.json', 'BROWSER_LIMITS.json']) copy(stage + '/' + p, 'page/' + p);
for (const p of ['audit.mjs', 'audit.test.mjs', 'findings.json', 'findings-reviewed.json', 'HANDOFF.md', 'FILES.md']) copy(audit + '/worker/' + p, 'audit/worker/' + p);
for (const p of fs.readdirSync(audit + '/worker/originals')) { assert(fs.statSync(audit + '/worker/originals/' + p).isFile()); copy(audit + '/worker/originals/' + p, 'audit/worker/originals/' + p); }
for (const p of ['PREPARATION.json', 'MAIN_FINDINGS.json', 'NOTICE_NATIVE.json', 'NOTICE_NATIVE.log', 'NOTICE_CURRENT.json', 'NOTICE_CURRENT.log']) copy(audit + '/' + p, 'audit/' + p);
copy(observationPath, 'full-suite/observation.json'); copy(import.meta.filename, 'checkpoint-source-credits-20261021.mjs');
// Browser pixels remain local and are deliberately absent from GitHub selection.
copy(stage + '/credits-component-preview.png', 'local-browser/credits-component-preview.png');
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(final, null, 2) + '\n', { flag: 'wx' });
files.push({ path: 'MAIN_REVIEW.json', bytes: read(root + '/MAIN_REVIEW.json').length, sha256: sha(read(root + '/MAIN_REVIEW.json')) });
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-header-joint-evidence-backup', parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
const previous = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(previous.files.map(r => { const b = read(parentRoot + '/remote-source-restored/' + r.path); assert.equal(sha(b), r.sha256); return [r.path, b]; }));
for (const row of files.filter(r => !r.path.startsWith('local-browser/'))) values.set('evidence/20261021-source-credits-notices/' + row.path, read(root + '/' + row.path));
function verify() {
  assert.equal(runGit(['-C', atlas, 'rev-parse', 'HEAD']).toString().trim(), source);
  assert.equal(runGit(['-C', atlas, 'status', '--porcelain']).toString().trim(), '');
  assert.deepEqual(read(candidate + '/components/SiteFooter.tsx'), footerOriginal);
  for (const r of current.inspectedFiles) assert.equal(sha(read(candidate + '/' + r.path)), r.sha256);
  for (const r of files) assert.equal(sha(read(root + '/' + r.path)), r.sha256);
  for (const r of final.sourceFiles) assert.equal(sha(read(stage + '/' + r.path)), r.sha256);
}
verify();
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-source-credits-notices-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-source-credits-notices-20261021.git', branch: 'backup/website-source-credits-notices-20261021',
  files: [...values].map(([path, b]) => ({ path, bytes: b.length, sha256: sha(b) })).sort((a, b) => a.path.localeCompare(b.path)), bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlas: source, website: current.websiteHead, uninstalled: true, sourceFiles: final.sourceFiles, canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { pageTests: 5, noticeTests: 9, inspectedNoticeFiles: 34, consistentDeclaredScopes: 5, exhaustiveRightsClearance: false, clinicalApproval: false },
  scope: 'Selected uninstalled source-credits/footer/test code, notice-checker source/originals/hash-only current findings and focused evidence on previously filtered source ancestry. Browser screenshot stays F-local; no browser DOM, raw canonical ancestry, scans, masks, meshes, private modules/reviews/databases/secrets. Not a whole/runnable/private-data backup or legal/release acceptance.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...final, files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')), head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths },
  next: 'Keep frozen Website/source unchanged until actual full run terminal. Inspect complete inventory, coherently admit verified contract/hip/header/credits changes, then native types/build/browser/local delivery. Declared-notice consistency does not close REL-02 legal/source/dependency-graph/asset gates. Preserve all71/eight full roadmap and independent draft clinical review.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')), pageTests: 5, noticeTests: 9, backup: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths, canonicalInstalled: false }));
