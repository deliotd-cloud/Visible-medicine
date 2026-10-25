// Current 665c Review binding. Historical transition roots run in their own
// authenticated source contexts; this file reads the actual current receipt.
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
const direct = Object.freeze({
  'components/HeadAtlasViewer.tsx': '9797cd2ce54405d0909d125f38fa4ea0184f367b7ac772406952f6dacd0b7ae5',
  'scripts/bind-clinical-review.mjs': '1c43d98bd38117d371eafc48e13d37511951f8bfc7b180641f5c1a78c635fec0',
  'lib/head-window-drag.ts': '02f1ccfe8b5f6fc5cfcec9ffacdbdc511b5fa079b63a60bb9fdd32b08c55effa',
});
function currentRole() {
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
  for (const [path, fingerprint] of Object.entries(direct)) {
    const rows = receipt.inputs.filter(row => row.path === path);
    assert.equal(rows.length, 1, `Missing current source: ${path}`);
    assert.equal(rows[0].sha256, fingerprint, `Changed current source: ${path}`);
  }
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
  for (const [path, fingerprint] of Object.entries(direct)) {
    const rows = receipt.inputs.filter(row => row.path === path);
    assert.equal(rows.length, 1, `Missing current source: ${path}`);
    assert.equal(rows[0].sha256, fingerprint, `Changed current source: ${path}`);
  }
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
  for (const [path, fingerprint] of Object.entries(direct))
    assert.equal(sha(read(path)), fingerprint, path);
  const component = read('components/HeadAtlasViewer.tsx').toString();
  const binder = read('scripts/bind-clinical-review.mjs').toString();
  assert(component.includes("import {bindHeadWindowDrag} from '../lib/head-window-drag';"));
  assert(component.includes('return bindHeadWindowDrag(canvas,{getWindow:()=>liveWindow.current,onChange:onWindowing});'));
  assert(binder.includes("'lib/head-window-drag.ts'"));
  assert.notEqual(direct['components/HeadAtlasViewer.tsx'],
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
    direct['components/HeadAtlasViewer.tsx']);
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
  for (const [path, fingerprint] of [
    ['tests/head-pan-review-binding.test.mjs', '13997d80944480b4cc8c379dadfe8f1cc68fd9f02dee6a1aafb06b4bdc4c7181'],
    ['tests/head-review-compact-preservation.test.mjs', '46e360890cabd5e44ef89bb5aa4c3c8fd5a0a809832a275de966a0372bff4355'],
    ['tests/window-drag-review-binding.test.mjs', 'caebbf23fa4e365d0b5474794802dd16b83520322d3759be7b4da9d3f8e80155'],
  ]) assert.equal(sha(read(path)), fingerprint, `Historical root changed: ${path}`);
});
