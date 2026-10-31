import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {validateCurrentAtlasDelivery} from 'file:///F:/VisibleMedicine/staging/20261024-imaging-desktop-layout/website/tests/current-atlas-delivery.mjs';

// This whole-source transition belongs to its archived 24 October candidate.
// A later website checkout cannot provide that candidate's PRODUCT_CHANGE receipt.
const stage = 'F:/VisibleMedicine/staging/20261024-imaging-desktop-layout';
const website = join(stage, 'website');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(join(stage,'PREPARATION.json'))),'40b508fd27d6aeefbf0d8e923c4e597ffe32ae88224e4d498f1058d509568d3a');
assert.equal(sha(readFileSync(join(stage,'PRODUCT_CHANGE.json'))),'20a8d2e67483d57aa622144741099e809637aec3a0cc9f26593f76e65338a66e');
assert.equal(sha(readFileSync(join(stage,'SOURCE_BOUND.json'))),'60d396a0aa37cb827fcaaafe6b06de90ded0c8ea39c01c528c718ff4b11f3199');
assert.equal(sha(readFileSync(join(website,'tests/current-atlas-delivery.mjs'))),'02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e');
assert.equal(sha(readFileSync(join(website,'tests/head-practice-navigation-delivery.test.mjs'))),'87bb0e737434becc7082d2955753b1466b033aa6b21492f33133a2cecaaeb301');
const preparation = JSON.parse(readFileSync(join(stage, 'PREPARATION.json')));
const change = JSON.parse(readFileSync(join(stage, 'PRODUCT_CHANGE.json')));
const parentReceiptBytes = readFileSync(preparation.parentReceipt);
const parent = JSON.parse(parentReceiptBytes);
const read = (root, path) => readFileSync(join(root, path));
const inputPath = 'atlas-review/integration-inputs.json';
const oldInputs = JSON.parse(read(preparation.parentWebsite, inputPath));
const currentInputBytes = read(website, inputPath);
const currentInputs = JSON.parse(currentInputBytes);
const added = ['components/AtlasRegionNavigation.tsx', 'components/AtlasWorkspaceNavigation.tsx', 'lib/head-practice-navigation.ts'];
const changed = ['components/HeadAtlasViewer.tsx', 'components/ImagingAtlasShell.tsx', 'scripts/bind-clinical-review.mjs'];

function verifyInputs(inputs, root) {
  assert.equal(new Set(inputs.inputs.map(row => row.path)).size, inputs.inputs.length, 'Unique bound paths');
  for (const row of inputs.inputs) {
    const bytes = read(root, row.path);
    assert.equal(row.sha256, sha(bytes), `Exact bound bytes: ${row.path}`);
  }
  assert.equal(inputs.sha256, sha(JSON.stringify(inputs.inputs)), 'Exact binding digest');
}

test('parent source receipt is authenticated before comparison', () => {
  assert.equal(sha(parentReceiptBytes), '89711b205a711008b0fcc1524acb15d5fa2d16e752fc5962fcce679d6375f6b7');
  assert.equal(preparation.parentReceiptSha256, sha(parentReceiptBytes));
  assert.equal(change.parentReceiptSha256, sha(parentReceiptBytes));
  assert.equal(parent.website, preparation.parentWebsite);
  assert.equal(parent.reviewBindingSha256, change.reviewBefore);
  assert.equal(parent.reviewInputs, 1783);
});

test('binding delta is exactly three additions and three changed existing inputs', () => {
  assert.equal(oldInputs.inputs.length, 1783);
  assert.equal(currentInputs.inputs.length, 1786);
  const before = new Map(oldInputs.inputs.map(row => [row.path, row.sha256]));
  const after = new Map(currentInputs.inputs.map(row => [row.path, row.sha256]));
  assert.deepEqual([...after.keys()].filter(path => !before.has(path)).sort(), added.sort());
  assert.deepEqual([...before.keys()].filter(path => !after.has(path)), []);
  assert.deepEqual([...before.keys()].filter(path => before.get(path) !== after.get(path)).sort(), changed.sort());
  assert.deepEqual([...change.boundAdded].sort(), added);
  assert.deepEqual([...change.boundChanged].sort(), changed);
  assert.equal(oldInputs.sha256, '35fdca381e22b1c9a5fad703d673fd8fdac427aeb9580f3375243be5f7c06709');
  assert.equal(currentInputs.sha256, '66fbc8e06fb904de670300fa4418cb297a16950dbc2e7c25ad28a5eab1415f2a');
  verifyInputs(currentInputs, website);
});

test('current strict delivery pin admits the current four-module Atlas and rejects its predecessor', () => {
  const validatorRow = parent.sourceRows.find(row => row.path === 'tests/current-atlas-delivery.mjs');
  assert.equal(sha(read(website, validatorRow.path)), validatorRow.sha256, 'Original strict validator is unchanged');
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, 'd143c28fb1e5da200712af6629a375c25d17dad7');
  assert.equal(pin.reviewIntegration, currentInputs.sha256);
  assert.deepEqual(Object.keys(pin.runtimeSources).sort(), ['female-pelvis', 'head-neck', 'lower-limb', 'shoulder'].sort());
  assert(Object.values(pin.runtimeSources).every(source => source === pin.source));
  assert.equal(pin.viewerFiles, 54);
  assert.equal(pin.viewerPackages, 24);
  const stale = structuredClone(pin);
  stale.reviewIntegration = '35fdca381e22b1c9a5fad703d673fd8fdac427aeb9580f3375243be5f7c06709';
  assert.throws(() => validateCurrentAtlasDelivery({pin: stale}));
  const predecessor = JSON.parse(read(preparation.parentWebsite, 'tests/fixtures/current-atlas-delivery.json'));
  assert.throws(() => validateCurrentAtlasDelivery({pin: predecessor}));
  assert.throws(() => validateCurrentAtlasDelivery({read: path => path === inputPath ? Buffer.from('{}') : read(website, path)}));
});

test('runtime, model inventory and licence bytes are identical to authenticated parent source rows', () => {
  // Review viewer chunks legitimately change with their new bound revision;
  // licensed meshes, learner runtimes and notices must remain byte-exact.
  const rows = parent.sourceRows.filter(row => /^(LICENSES\/|atlas-review\/LICENSES\/|atlas-review\/public\/models\/|public\/licenses\/|public\/atlas-runtime\/|lib\/atlas-model-inventory\.json$)/.test(row.path));
  assert.equal(rows.length, 348, 'All exact parent runtime/model/licence rows');
  for (const [prefix, count] of [['LICENSES/',8],['atlas-review/LICENSES/',1],['atlas-review/public/models/',54],['public/licenses/',2],['public/atlas-runtime/',282]]) {
    assert.equal(rows.filter(row => row.path.startsWith(prefix)).length, count, prefix);
  }
  for (const row of rows) {
    const bytes = read(website, row.path);
    assert.equal(bytes.length, row.bytes, `Parent byte length: ${row.path}`);
    assert.equal(sha(bytes), row.sha256, `Parent byte digest: ${row.path}`);
    assert.deepEqual(bytes, read(preparation.parentWebsite, row.path), `Parent bytes: ${row.path}`);
  }
});

test('in-memory binding mutations are rejected without writing to disk', () => {
  const altered = structuredClone(currentInputs);
  altered.inputs.find(row => row.path === added[0]).sha256 = '0'.repeat(64);
  assert.throws(() => verifyInputs(altered, website));
  const missing = structuredClone(currentInputs);
  missing.inputs.pop();
  assert.throws(() => verifyInputs(missing, website));
  assert.deepEqual(read(website, inputPath), currentInputBytes);
});
