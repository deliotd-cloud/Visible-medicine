import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images', site = root + '/website';
const authoredPin = root + '/AUTHORED_SOURCE.json', source = json(authoredPin);
assert.equal(hash(authoredPin), '651d0ff8ab11044594538e16e0979a780a082e1320ff2ec4bc7b500489fee6fb');
for (const r of source.sourceRows) assert.equal(hash(site + '/' + r.path), r.sha256, r.path);
const run = args => execFileSync(process.execPath, args, {cwd: site, stdio: 'inherit', windowsHide: true, env: {...process.env, npm_config_cache: root + '/tmp/npm-cache'}});
const original = json(site + '/atlas-review/integration-inputs.json');
const bodyBefore = json(site + '/atlas-review/content/body-renderer-revision.json');
const shoulderBefore = json(site + '/atlas-review/content/review-revisions.json');
run(['scripts/bind-clinical-review.mjs']);
const bound = json(site + '/atlas-review/integration-inputs.json');
const previous = new Map(original.inputs.map(r => [r.path, r.sha256]));
const changed = bound.inputs.filter(r => previous.has(r.path) && previous.get(r.path) !== r.sha256).map(r => r.path).sort();
const added = bound.inputs.filter(r => !previous.has(r.path)).map(r => r.path).sort();
assert.equal(bound.inputs.length, original.inputs.length + 4);
assert.deepEqual(changed, ['scripts/bind-clinical-review.mjs', 'vite.config.ts']);
assert.deepEqual(added, [...source.bindingInputsAdded].sort());
for (const r of original.inputs) assert(bound.inputs.some(x => x.path === r.path), r.path);
assert.equal(json(site + '/atlas-review/content/body-renderer-revision.json').sourceRendererSha256, bodyBefore.sourceRendererSha256);
assert.deepEqual(json(site + '/atlas-review/content/review-revisions.json').sourceRevisions, shoulderBefore.sourceRevisions);
run(['scripts/build-clinical-review-viewer.mjs']);
run(['scripts/verify-clinical-review.mjs']);
const currentPinPath = site + '/tests/fixtures/current-atlas-delivery.json', currentPin = json(currentPinPath);
fs.writeFileSync(root + '/CURRENT_PIN_BEFORE.json', fs.readFileSync(currentPinPath), {flag: 'wx'});
currentPin.reviewIntegration = bound.sha256;
for (const p of Object.keys(currentPin.documents)) currentPin.documents[p] = hash(site + '/' + p);
fs.writeFileSync(currentPinPath, JSON.stringify(currentPin, null, 2) + '\n');
const viewer = json(site + '/public/atlas-review-viewer/manifest.json');
assert.equal(viewer.files.length, currentPin.viewerFiles);
assert.equal(viewer.packages.length, currentPin.viewerPackages);
const generated = new Set(['atlas-review/content/body-renderer-revision.json', 'atlas-review/content/review-revisions.json', 'atlas-review/integration-inputs.json', 'atlas-review/manifest.json', 'public/atlas-review-viewer/index.html', 'public/atlas-review-viewer/manifest.json', 'tests/fixtures/current-atlas-delivery.json']);
const removed = [];
for (const r of source.sourceRows) {
  if (!fs.existsSync(site + '/' + r.path)) {assert(r.path.startsWith('public/atlas-review-viewer/assets/')); removed.push(r.path);}
  else if (hash(site + '/' + r.path) !== r.sha256) assert(generated.has(r.path), r.path);
}
const paths = [...new Set([...source.sourcePaths.filter(p => !removed.includes(p)), ...viewer.files.map(r => 'public/atlas-review-viewer/' + r.path)])].sort();
const ready = {...source, at: new Date().toISOString(), authoredSource: {path: authoredPin, sha256: hash(authoredPin)}, sourcePaths: paths,
  sourceRows: paths.map(p => ({path: p, sha256: hash(site + '/' + p), bytes: fs.statSync(site + '/' + p).size})),
  reviewBindingPending: false, binding: {prior: original.sha256, current: bound.sha256, inputs: bound.inputs.length, changed, added, geometryAndTeachingSourceRevisionsUnchanged: true},
  generatedChanges: [...generated], removedGeneratedFiles: removed, fullBuildPassed: false};
fs.writeFileSync(root + '/SOURCE_READY.json', JSON.stringify(ready, null, 2) + '\n', {flag: 'wx'});
run(['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js', 'run', 'build']);
for (const r of ready.sourceRows) assert.equal(hash(site + '/' + r.path), r.sha256, r.path);
fs.writeFileSync(root + '/BINDING.json', JSON.stringify({...ready.binding, at: new Date().toISOString(), source: bound.sourceCommit, reviewBundleFiles: viewer.files.length, reviewPackages: viewer.packages.length, buildPassed: true, clinicalApproval: false, installed: false}, null, 2) + '\n', {flag: 'wx'});
