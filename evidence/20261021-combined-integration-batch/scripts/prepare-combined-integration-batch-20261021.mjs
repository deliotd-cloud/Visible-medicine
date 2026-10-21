import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';

const root = 'F:/VisibleMedicine/staging/20261021-combined-integration-batch';
const atlas = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const website = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const source = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
const recovery = 'F:/VisibleMedicine/recovery/checkpoints/';
assert(!fs.existsSync(root), 'Create-only batch');
assert.equal(runGit(['-C', atlas, 'rev-parse', 'HEAD']).toString().trim(), source);
assert.equal(runGit(['-C', atlas, 'status', '--porcelain']).toString().trim(), '');
assert.equal(runGit(['-C', website, 'rev-parse', 'HEAD']).toString().trim(), 'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const rows = [], proofRows = [];
function copy(from, relative) {
  assert(!relative.includes('..') && !path.isAbsolute(relative));
  const to = root + '/' + relative;
  assert(!fs.existsSync(to), 'Exclusive destination ' + relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
  assert.deepEqual(read(to), read(from));
}
function checkpoint(name, expected) {
  const base = recovery + name, file = base + '/checkpoint.json';
  assert.equal(sha(read(file)), expected, 'Exact reviewed checkpoint ' + name);
  proofRows.push({ checkpoint: file, sha256: expected });
  return { base, value: json(file) };
}
function select(proof, prefix, paths, lane, diskPrefix = '') {
  for (const p of paths) {
    const rel = prefix + p;
    const proofRow = proof.value.files.find(r => r.path === rel);
    assert(proofRow, 'Checkpoint contains ' + rel);
    assert.equal(sha(read(proof.base + '/' + diskPrefix + rel)), proofRow.sha256);
    admit(proof.base + '/' + diskPrefix + rel, p, lane, { checkpoint: proof.base + '/checkpoint.json', path: diskPrefix + rel, sha256: proofRow.sha256 });
  }
}
function admit(from, p, lane, provenance) {
  assert(!p.includes('..') && !path.isAbsolute(p));
  assert(/\.(?:ts|tsx|mjs|css|json|md|raw)$/.test(p));
  assert(!p.startsWith('public/') && !p.startsWith('modules/'), 'No generated module or model edits');
  const base = lane === 'atlas' ? atlas : website;
  const old = fs.existsSync(base + '/' + p) ? read(base + '/' + p) : null;
  if (old && lane === 'atlas') assert.deepEqual(old, runGit(['-C', atlas, 'show', source + ':' + p]));
  const laneRoot = lane === 'atlas' ? 'atlas' : lane;
  assert(!rows.some(r => r.lane === lane && r.path === p), 'No implicit collisions');
  copy(from, laneRoot + '/' + p);
  if (old) copy(base + '/' + p, 'originals/' + laneRoot + '/' + p + '.raw');
  rows.push({ lane, path: p, beforeSha256: old ? sha(old) : null, proposedSha256: sha(read(from)), provenance });
}
const hip = checkpoint('20261021-hip-history-guard-proposal', '17b2ad4b9961cd325ed6199a66722aab31ce80a9a1e7368c8c06be89f82e78c5');
select(hip, '', ['scripts/test-hip-quick-check-history.mjs', 'scripts/hip-quick-check-history-context.mjs', 'scripts/test-hip-history-entry-refusals.mjs'], 'atlas', 'source/');
const dental = checkpoint('20261021-dental-mri-proposal', '391f277a361654090b203093aa6fdd54d8f7ea5322c93998a8eb18cc69ba0573');
select(dental, 'proposal/', ['app/body-content.ts', 'content/dental-mri.ts', 'content/dental-mri-pins.json', 'lib/dental-mri.ts', 'docs/DENTAL_MRI_EVIDENCE.md'], 'atlas');
const keyboard = checkpoint('20261021-keyboard-zoom-proposal-ready', '623c2e5b1fd1bb8d42ebb72827ea05e68e3e83a09d6d5a5d261a332a6550b97b');
select(keyboard, 'proposal/', ['app/fitted-camera.tsx', 'lib/camera-keyboard.ts', 'package.json', 'scripts/test-camera-keyboard-zoom.mjs', 'docs/KEYBOARD_ZOOM.md'], 'atlas');
const nativeRoot = 'F:/VisibleMedicine/staging/20261021-dental-native-gate/worker';
const native = json(nativeRoot + '/FILES.json').files.find(r => r.path === 'scripts/test-dental-mri-native.mjs');
assert.equal(native.sha256, 'de724a2777ff8bf16ac5ed42984c20bf27b0498a6f94eaca35feae427519d9ad');
assert.equal(sha(read(nativeRoot + '/' + native.path)), native.sha256);
admit(nativeRoot + '/' + native.path, native.path, 'atlas', { workerManifest: nativeRoot + '/FILES.json', sha256: native.sha256 });
admit(atlas + '/LICENSES/THIRD_PARTY_NOTICES.md', 'LICENSES/THIRD_PARTY_NOTICES.md', 'atlas', { role: 'Exact baseline; main will prepend an original-draft reference notice' });
const header = checkpoint('20261021-header-joint-evidence', 'c4d5be8924051932c4d4dbd80529a5c6fb584bb78020ff3c7bd69aab99f34bb0');
select(header, 'header/', ['components/SiteHeader.tsx', 'tests/header-workspace-destination.test.mjs', 'tests/header-tab-focus.test.mjs', 'tests/fixtures/header-before-keyboard-focus/SiteHeader.tsx.raw', 'tests/fixtures/header-before-keyboard-focus/header-workspace-destination.test.mjs.raw'], 'website-ui');
const credits = checkpoint('20261021-source-credits-notices', '84fc04e1aba8e761c56a7477eadba16ef7f2d05faa7ad4883e987fc5550db230');
select(credits, 'page/', ['app/credits/page.tsx', 'app/credits/source-credits.css', 'lib/source-credits.ts', 'components/SiteFooter.tsx', 'tests/source-credits.test.mjs', 'tests/fixtures/source-credits/SiteFooter.tsx.raw'], 'website-ui');
const assurance = 'F:/VisibleMedicine/staging/20261021-coverage-arterial-contract-proposal';
const assurances = json(assurance + '/FILES.json');
assert.equal(assurances.atlasHead, source);
for (const p of assurances.onlyProposedIntegrationPaths) {
  const row = assurances.files.find(r => r.path === p);
  const old = assurances.files.find(r => r.path === 'originals/' + p);
  assert.equal(sha(read(assurance + '/' + p)), row.sha256);
  assert.equal(sha(read(website + '/' + p)), old.sha256);
  admit(assurance + '/' + p, p, 'website-485-assurance', { manifest: assurance + '/FILES.json', sha256: row.sha256 });
}
fs.writeFileSync(root + '/PREPARATION.json', JSON.stringify({ schema: 'visible-medicine.combined-staged-batch/1', root, atlas, website, source,
  createdAt: new Date().toISOString(), reviewedProofs: proofRows, paths: rows,
  phases: [
    'Current485 assurance: run the two real Website test modules only after the live full suite actually terminates. Do not reuse their current485 assertion as future-source admission.',
    'On original485 hip stage: run the new whole historical wrapper before source integration. Do not conflate the older author witness with this new gate.',
    'Atlas: portable dental gate and existing keyboard gates, then full source/current-history/stock binding/Review/learner/type/build and affected camera gates. No predicted source identity or hand-edited generated modules.',
    'Website UI: apply disjoint header/credits paths only after source integration gates; re-admit actual new source through stock generation/import and run actual native/integrated desktop checks before a safe local cutover.'
  ], excludedPrototypeTests: ['tests/test-dental-mri-content.mjs', 'tests/test-dental-mri-binding.mjs'],
  installed: false, sourceCommitted: false, fullSuitePassed: false, clinicalApproval: false, spatialRegistration: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ root, source, atlasPaths: rows.filter(r => r.lane === 'atlas').length, websiteUiPaths: 11, website485AssurancePaths: 2, installed: false }));
