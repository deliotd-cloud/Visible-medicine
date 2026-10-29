// Current source-bound Review validation. Historical transition roots run in
// their own authenticated source contexts; this file reads the pinned receipt.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateCurrentAtlasDelivery, currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const safe = path => path === 'app/api/atlas-delivery/references/[...asset]/route.ts' ||
  /^[A-Za-z0-9_./-]+$/.test(path) && !path.split('/').some(part =>
    !part || part === '.' || part === '..' ||
    ['private', 'scans', 'datasets', '.local'].includes(part) || part.startsWith('.env'));
const read = path => { assert(safe(path), `Unsafe current source path: ${path}`); return readFileSync(root + path); };
const json = path => JSON.parse(read(path));
// The pin is part of the frozen source closure. Its exact bytes are a separate
// fixed anchor; a newly written receipt or pin cannot authorize changed input.
const currentPinSha = '7b14a7455de0b87e781192d5b1072c9c17c42ab5611c96247a0e7e677b416ac8';
const direct = Object.freeze([
  'components/HeadAtlasViewer.tsx',
  'scripts/bind-clinical-review.mjs',
  'lib/head-window-drag.ts',
]);
const historicalViewerSha = '9797cd2ce54405d0909d125f38fa4ea0184f367b7ac772406952f6dacd0b7ae5';
const historicalBinderSha = '1c43d98bd38117d371eafc48e13d37511951f8bfc7b180641f5c1a78c635fec0';
function directRow(receipt, path) {
  const rows = receipt.inputs.filter(row => row.path === path);
  assert.equal(rows.length, 1, `Missing current source: ${path}`);
  return rows[0];
}
function assertHistoricalDirectSources() {
  const sealPath = 'F:/VisibleMedicine/staging/20261024-head-study-set-website/SOURCE_BOUND.json';
  const sealBytes = readFileSync(sealPath);
  assert.equal(sha(sealBytes), '37ea31d0ab36e57311e11dcdb9c01a93770220cbf8c40d439fa35b08aff9c968');
  const seal = JSON.parse(sealBytes);
  assert.equal(seal.website, 'F:/VisibleMedicine/staging/20261024-head-study-set-website/website');
  assert.equal(seal.sourceRows.find(row => row.path === direct[0])?.sha256, historicalViewerSha);
  assert.equal(sha(readFileSync(seal.website + '/' + direct[0])), historicalViewerSha);
  const binderBytes = read('tests/fixtures/current-delivery-before-help-d55/integration-inputs.json.raw');
  assert.equal(sha(binderBytes), 'c063a72346a42b1e33e9c6b7064f28d91e25c1841608b5ec4bd2b0a782cefede');
  const oldReceipt = JSON.parse(binderBytes);
  assert.equal(oldReceipt.sourceCommit, 'a01ea4a00740dee0905204a33893761b8ae1ff1e');
  assert.equal(directRow(oldReceipt, direct[1]).sha256, historicalBinderSha);
}
function currentRole() {
  assert.equal(sha(read('tests/fixtures/current-atlas-delivery.json')), currentPinSha,
    'Exact frozen current-delivery pin');
  const pin = validateCurrentAtlasDelivery();
  const atlas = currentAtlasDeliveryRoot();
  assert(atlas, 'The exact current Atlas checkout is required');
  const receipt = json('atlas-review/integration-inputs.json');
  assert.equal(sha(read('atlas-review/integration-inputs.json')),
    pin.documents['atlas-review/integration-inputs.json']);
  assert.equal(receipt.sourceCommit, pin.source);
  assert.equal(receipt.sha256, pin.reviewIntegration);
  assert.equal(sha(Buffer.from(JSON.stringify(receipt.inputs))), pin.reviewIntegration);
  assert(Array.isArray(receipt.inputs));
  assert.equal(new Set(receipt.inputs.map(row => row.path)).size, receipt.inputs.length);
  for (const row of receipt.inputs) {
    assert(safe(row.path), `Unsafe Review input: ${row.path}`);
    assert.match(row.sha256, /^[a-f0-9]{64}$/);
  }
  for (const path of direct)
    assert.equal(sha(read(path)), directRow(receipt, path).sha256, `Changed current source: ${path}`);
  return { pin, receipt, trusted: structuredClone(receipt) };
}
function assertCurrentReceipt(receipt, trusted, pin, checkFiles = false) {
  assert.equal(receipt.sourceCommit, pin.source);
  assert(Array.isArray(receipt.inputs));
  assert.equal(receipt.inputs.length, trusted.inputs.length);
  assert.equal(new Set(receipt.inputs.map(row => row.path)).size, trusted.inputs.length, 'Duplicate Review input');
  for (let index = 0; index < receipt.inputs.length; index++) {
    const row = receipt.inputs[index];
    assert(safe(row.path), `Unsafe Review input: ${row.path}`);
    assert.match(row.sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(row, trusted.inputs[index], `Foreign or repinned Review input: ${index}`);
  }
  assert.equal(receipt.sha256, pin.reviewIntegration);
  assert.equal(sha(Buffer.from(JSON.stringify(receipt.inputs))), pin.reviewIntegration);
  for (const path of direct)
    assert.deepEqual(directRow(receipt, path), directRow(trusted, path), `Changed current source: ${path}`);
  if (checkFiles) for (const row of receipt.inputs)
    assert.equal(sha(read(row.path)), row.sha256, `Current input differs: ${row.path}`);
  return pin.reviewIntegration;
}
function assertCurrentLinks(receipt, trusted, manifest, viewer, pin) {
  const digest = assertCurrentReceipt(receipt, trusted, pin);
  assert.equal(manifest.revision, pin.source);
  assert.equal(manifest.files.length, pin.reviewSourceFiles);
  assert.equal(manifest.websiteIntegrationSha256, digest);
  assert.equal(viewer.sourceCommit, pin.source);
  assert.equal(viewer.websiteIntegrationSha256, digest);
  assert.equal(viewer.mode, 'production');
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(viewer.modelDelivery, 'existing-protected-inventory');
  assert.equal(viewer.files.length, pin.viewerFiles);
  assert.equal(viewer.packages.length, pin.viewerPackages);
}

test('current presentation and binder are exact source-bound records with the drag helper', () => {
  const {pin, receipt, trusted} = currentRole();
  assertCurrentReceipt(receipt, trusted, pin, true);
  for (const path of direct)
    assert.equal(sha(read(path)), directRow(receipt, path).sha256, path);
  const component = read('components/HeadAtlasViewer.tsx').toString();
  const binder = read('scripts/bind-clinical-review.mjs').toString();
  assert(component.includes("import {bindHeadWindowDrag} from '../lib/head-window-drag';"));
  assert(component.includes('return bindHeadWindowDrag(canvas,{getWindow:()=>liveWindow.current,onChange:onWindowing});'));
  assert(binder.includes("'lib/head-window-drag.ts'"));
  assertHistoricalDirectSources();
  assert.notEqual(directRow(receipt, direct[0]).sha256, historicalViewerSha);
  assert.notEqual(directRow(receipt, direct[1]).sha256, historicalBinderSha);
  assert.notEqual(directRow(receipt, direct[0]).sha256,
    '180d034774956e77d62a0b2d0ad517b38d70581dfc8da935fd937f1c8f4dc08a',
    'Historical pan-presentation admission is a separate epoch');
});

test('current Review manifest and production viewer bind the same complete receipt', () => {
  const {pin, receipt, trusted} = currentRole();
  const manifest = json('atlas-review/manifest.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  assertCurrentLinks(receipt, trusted, manifest, viewer, pin);
  assert.equal(new Set(manifest.files.map(row => row.path)).size, manifest.files.length);
  assert.equal(new Set(viewer.files.map(row => row.path)).size, viewer.files.length);
  for (const row of viewer.files) {
    assert(safe(row.path));
    assert.equal(sha(read('public/atlas-review-viewer/' + row.path)), row.sha256, row.path);
  }
  assert(viewer.files.some(row => row.path === 'THIRD_PARTY_NOTICES.txt'));
});

test('missing, duplicate, foreign, repinned and tampered current inputs are refused', () => {
  const {pin, receipt: actual, trusted} = currentRole();
  const mutations = [
    receipt => { receipt.inputs.pop(); },
    receipt => { receipt.inputs.push(structuredClone(receipt.inputs[0])); },
    receipt => { receipt.inputs[0].path = 'foreign.ts'; },
    receipt => { receipt.inputs.find(row => row.path === 'components/HeadAtlasViewer.tsx').sha256 = '0'.repeat(64); },
    receipt => { receipt.sourceCommit = '0'.repeat(40); },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(actual);
    mutate(changed);
    changed.sha256 = sha(Buffer.from(JSON.stringify(changed.inputs)));
    assert.throws(() => assertCurrentReceipt(changed, trusted, pin));
  }
  const sourceBytes = read('components/HeadAtlasViewer.tsx');
  assert.notEqual(sha(Buffer.concat([sourceBytes, Buffer.from('\n// tampered\n')])),
    directRow(trusted, direct[0]).sha256);
  const manifest = json('atlas-review/manifest.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  for (const mutate of [
    (m, _v) => { m.websiteIntegrationSha256 = '0'.repeat(64); },
    (_m, v) => { v.personalRecordsIncluded = true; },
    (_m, v) => { v.mode = 'debug'; },
    (_m, v) => { v.websiteIntegrationSha256 = '0'.repeat(64); },
  ]) {
    const m = structuredClone(manifest), v = structuredClone(viewer);
    mutate(m, v);
    assert.throws(() => assertCurrentLinks(actual, trusted, m, v, pin));
  }
  const foreignPin = structuredClone(pin);
  foreignPin.reviewIntegration = '0'.repeat(64);
  assert.throws(() => validateCurrentAtlasDelivery({pin: foreignPin}));
});

test('the three complete historical roots retain their exact authenticated source bytes', () => {
  assert.equal(sha(read('tests/fixtures/current-private-review-binding-before-20261028.test.mjs.raw')),
    '0fd540b7a8443a0a6a794a24b13b3d4ad9330d9113e8341fce1921c7f325b57f',
    'Whole preceding current Review-binding root remains recoverable');
  const oldRoot = 'F:/VisibleMedicine/staging/20261023-head-pan-bound/website/';
  const sealBytes = readFileSync('F:/VisibleMedicine/staging/20261023-head-pan-bound/SOURCE_BOUND.json');
  assert.equal(sha(sealBytes), 'd41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a');
  const seal = JSON.parse(sealBytes);
  assert.equal(seal.website, oldRoot.slice(0, -1));
  for (const [name, originalSha, wrapperSha] of [
    ['head-pan-review-binding.test.mjs', '13997d80944480b4cc8c379dadfe8f1cc68fd9f02dee6a1aafb06b4bdc4c7181', 'e6c5e1f6a558e9ba96a267def4293ab17fda378dc8a635c44f8ce77aa7a81d75'],
    ['window-drag-review-binding.test.mjs', 'caebbf23fa4e365d0b5474794802dd16b83520322d3759be7b4da9d3f8e80155', '787ee550103e1412a16d40256c82541f573ae242256b9d0ec8cf0ee263d3001c'],
  ]) {
    const path = 'tests/' + name;
    assert.equal(seal.sourceRows.find(row => row.path === path)?.sha256, originalSha);
    assert.equal(sha(readFileSync(oldRoot + path)), originalSha, `Historical root changed: ${path}`);
    assert.equal(sha(read('tests/fixtures/historical-9e-ui-roots/' + name + '.raw')),
      originalSha, `Preserved whole historical root: ${path}`);
    assert.equal(sha(read(path)), wrapperSha, `Current replay wrapper changed: ${path}`);
  }
  assert.equal(sha(read('tests/fixtures/current-private-review-compact-445.test.mjs.raw')),
    '46e360890cabd5e44ef89bb5aa4c3c8fd5a0a809832a275de966a0372bff4355',
    'Complete authenticated compact445 root remains unchanged');
  assert.equal(sha(read('tests/head-review-compact-preservation.test.mjs')),
    'd2ba20516d2de0c5c79fcbc1ea66e5c062538ef530b27174f43441be5eb8251b',
    'Current compact replay and source witness remain exact');
});
