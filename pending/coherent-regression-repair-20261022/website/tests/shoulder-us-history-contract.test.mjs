import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {validateCurrentAtlasDelivery, currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

const feature = 'ec85edb86bb34c92c66e2f310da09904f27ea7c4';
const source = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const baseline = '37e2e9e900ef2cdd1b6b9000fb1a813b69e8495e';
const options = {windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const git = (revision, path, cwd = process.cwd()) => execFileSync('git', ['show', `${revision}:${path}`], {...options, cwd});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const selected = ['lib/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound-pins.json'];
const archive = JSON.parse(readFileSync(new URL('./fixtures/shoulder-us-589-delivery-archive.json', import.meta.url)));
const historicalPinBytes = readFileSync(new URL('./fixtures/current-atlas-delivery-58926355.json', import.meta.url));
assert.equal(sha(historicalPinBytes), '3a29ea22a99e88869409f164ad50598e69106484e9b4f0603e4434e92d7df1f4');
const historicalPin = JSON.parse(historicalPinBytes);
assert.equal(archive.schema, 'vm-shoulder-us-589-delivery-archive-1');
assert.equal(archive.provenance, 'hash-bound recovered website source snapshot; no website Git epoch claim');
assert.equal(archive.source, historicalPin.source);
assert.deepEqual(archive.documents, historicalPin.documents);
const archived = new Map();
for (const row of archive.records) {
  assert(!archived.has(row.path), row.path);
  const bytes = gunzipSync(Buffer.from(row.gzipBase64, 'base64'));
  assert.equal(sha(bytes), row.sha256, row.path);
  archived.set(row.path, bytes);
}
assert.deepEqual([...archived.keys()].sort(), [...Object.keys(historicalPin.documents), ...selected.map(path => `atlas-review/${path}`), 'tests/shoulder-us-history-contract.original.mjs'].sort());
const original = archived.get('tests/shoulder-us-history-contract.original.mjs');
assert.equal(sha(original), 'bdfff9559edcd25dfb2f3effa47be14887c7a45b7c6a215d305c00e7de555972');
const historicalRead = path => {
  assert(archived.has(path), `Unarchived historical delivery document: ${path}`);
  return archived.get(path);
};

test('the original shoulder history cases and their assertions remain exact', () => {
  const old = original.toString();
  const now = readFileSync(new URL('./shoulder-us-history-contract.test.mjs', import.meta.url), 'utf8');
  const names = [...old.matchAll(/^test\('([^']+)'/gm)].map(match => match[1]);
  assert.equal(names.length, 5);
  for (const name of [names[0], names[1], names[2], names[4]]) {
    const start = `test('${name}'`;
    const oldPart = old.slice(old.indexOf(start), old.indexOf('\n});', old.indexOf(start)) + 4);
    assert(now.includes(oldPart), `Original case changed: ${name}`);
  }
  assert(now.includes("assert.equal(pin.source, '589263554141ba94548f9073327d4e51674bc33b');"));
  for (const epoch of [feature, source, baseline, 'c5c99ba11e6533d306587e71f5fc2854d882fbd6']) assert(now.includes(epoch), epoch);
  assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(now));
});

test('historical Review and selected imported source are bound to their immutable export', () => {
  const review = JSON.parse(git(feature, 'atlas-review/manifest.json'));
  const inputs = JSON.parse(git(feature, 'atlas-review/integration-inputs.json'));
  assert.equal(review.revision, source);
  assert.equal(inputs.sourceCommit, source);
  assert.equal(inputs.sha256, review.websiteIntegrationSha256);
  assert.equal(sha(JSON.stringify(inputs.inputs)), inputs.sha256);
  for (const path of ['lib/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound-pins.json']) {
    const file = review.files.find(item => item.path === path);
    assert(file, path);
    assert.equal(sha(git(feature, `atlas-review/${path}`)), file.importedSha256);
    assert.equal(sha(git(source, path, 'F:/VisibleMedicine/atlas')), file.sourceSha256);
  }
});

test('mixed latest and historical tours are distinguishable, while historical tours preserve the baseline', async () => {
  const entry = "export {regionalTours} from './atlas-review/lib/regional-tours';";
  const before = await atlasExactGitApi(baseline, entry);
  const historical = await atlasExactGitApi(feature, entry);
  assert.deepEqual(historical.regionalTours, before.regionalTours);
  const latest = readFileSync('atlas-review/lib/regional-tours.ts');
  assert.notEqual(sha(latest), sha(git(feature, 'atlas-review/lib/regional-tours.ts')));
});

test('selected historical teaching executes from one Git feature graph', async () => {
  const entry = "export {bodyLesson} from './atlas-review/app/body-content';export {shoulderGirdleArterialUltrasoundLesson} from './atlas-review/lib/shoulder-girdle-arterial-ultrasound';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';";
  const historical = await atlasExactGitApi(feature, entry);
  const pins = JSON.parse(git('c5c99ba11e6533d306587e71f5fc2854d882fbd6', 'content/shoulder-girdle-arterial-ultrasound-pins.json', 'F:/VisibleMedicine/atlas'));
  for (const {identity} of [pins.entries[0], pins.entries.at(-1)]) {
    const lesson = historical.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound');
    assert.equal(lesson?.readiness, 'draft');
    assert.deepEqual(historical.bodyLesson(identity, 'ultrasound'), lesson);
    const material = await historical.bodyReviewMaterial(identity.id);
    assert.deepEqual(material.topics.find(topic => topic.tab === 'ultrasound'), {tab: 'ultrasound', ...lesson});
  }
});

test('archived 589 delivery retains its closed pin and selected exact source bytes', () => {
  const pin = historicalPin;
  assert.equal(sha(readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Frozen schema1 validator changed');
  validateHistoricalAtlasDelivery({pin, read: historicalRead});
  assert.equal(pin.source, '589263554141ba94548f9073327d4e51674bc33b');
  const root = checkedAtlasHistoryRepo(pin.source);
  const review = JSON.parse(historicalRead('atlas-review/manifest.json'));
  for (const path of selected) {
    const file = review.files.find(item => item.path === path);
    assert(file);
    assert.equal(sha(historicalRead(`atlas-review/${path}`)), file.importedSha256);
    assert.equal(sha(git(pin.source, path, root)), file.sourceSha256);
  }
});

test('current closed admission retains the selected shoulder ultrasound source and pins', () => {
  const pin = validateCurrentAtlasDelivery();
  const root = currentAtlasDeliveryRoot();
  const review = JSON.parse(readFileSync('atlas-review/manifest.json'));
  const oldReview = JSON.parse(historicalRead('atlas-review/manifest.json'));
  assert.equal(review.revision, pin.source);
  for (const path of selected) {
    const file = review.files.find(item => item.path === path);
    const oldFile = oldReview.files.find(item => item.path === path);
    assert(file && oldFile, path);
    const imported = readFileSync(`atlas-review/${path}`);
    assert.equal(sha(imported), file.importedSha256, path);
    assert.equal(sha(git(pin.source, path, root)), file.sourceSha256, path);
    assert.deepEqual(imported, historicalRead(`atlas-review/${path}`), path);
    assert.equal(file.importedSha256, oldFile.importedSha256, path);
    assert.equal(file.sourceSha256, oldFile.sourceSha256, path);
  }
});

test('selected current arterial ultrasound lessons resolve from the pinned imported graph', async () => {
  validateCurrentAtlasDelivery();
  const compiled = await build({stdin: {contents: "export {bodyLesson} from './atlas-review/app/body-content';export {shoulderGirdleArterialUltrasoundLesson} from './atlas-review/lib/shoulder-girdle-arterial-ultrasound';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const latest = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const pins = JSON.parse(git('c5c99ba11e6533d306587e71f5fc2854d882fbd6', 'content/shoulder-girdle-arterial-ultrasound-pins.json', 'F:/VisibleMedicine/atlas'));
  for (const {identity} of [pins.entries[0], pins.entries.at(-1)]) {
    const lesson = latest.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound');
    assert.equal(lesson?.readiness, 'draft');
    assert.deepEqual(latest.bodyLesson(identity, 'ultrasound'), lesson);
  }
});
