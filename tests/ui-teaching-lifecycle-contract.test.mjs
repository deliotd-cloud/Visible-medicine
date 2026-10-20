import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.VM_WEBSITE_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
const rawUrl = join(root, 'tests/fixtures/ui-teaching-current-delivery-c237.mjs.raw');
const candidateUrl = join(root, 'tests/ui-teaching-current-delivery.test.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rawSha = 'e0aed39045349b6ed6eecd95e08fde0df56b805d242f2e527301b0df2af0b884';
const candidateSha = '78919d9a82605a2c24bb4a490e0a5e5cc04549d15e2990107c3c7618dfec2189';

function replaceOnce(text, from, to) {
  assert(text.includes(from), `Missing declared seam: ${from.slice(0, 70)}`);
  assert.equal(text.split(from).length, 2, `Duplicate declared seam: ${from.slice(0, 70)}`);
  return text.replace(from, to);
}
function removeBetween(text, start, end) {
  const first = text.indexOf(start);
  assert(first >= 0, `Missing seam start: ${start}`);
  assert.equal(text.indexOf(start, first + start.length), -1, `Duplicate seam start: ${start}`);
  const last = text.indexOf(end, first + start.length);
  assert(last >= 0, `Missing seam end: ${end}`);
  return text.slice(0, first) + text.slice(last);
}

function reconstruct(candidateBytes) {
  let reconstructed = candidateBytes.toString('utf8');
  // Exact later current-delivery admission counts; inverse them before replaying c237.
  reconstructed = replaceOnce(reconstructed,
    '  assert.equal(delivery.reviewSourceFiles, 1548);\n',
    '  assert.equal(delivery.reviewSourceFiles, 1538);\n');
  reconstructed = replaceOnce(reconstructed,
    '  assert.equal(inputs.inputs.length, 1685);\n',
    '  assert.equal(inputs.inputs.length, 1668);\n');
  reconstructed = replaceOnce(reconstructed,
    "const introduced = 'c237fa215f061147975e91b01fa830b3f44458c7';\n" +
    "const introducedTree = '29fb723e34279d3e586f52f380128b430cd07325';\n" +
    "const introducedReviewDigest = 'cd20387aee9e0c5f03d02ba9f83c347a588df371c497efad5c7e337ad83df984';\n",
    "const current = 'c237fa215f061147975e91b01fa830b3f44458c7';\n" +
    "const tree = '29fb723e34279d3e586f52f380128b430cd07325';\n" +
    "const reviewDigest = 'cd20387aee9e0c5f03d02ba9f83c347a588df371c497efad5c7e337ad83df984';\n");
  reconstructed = removeBetween(reconstructed,
    '  const current = delivery.source;\n',
    '  assert.equal(CURRENT_ATLAS_REVISION, current);\n');
  reconstructed = replaceOnce(reconstructed,
    "  assert.equal(delivery.sourceTree, execFileSync('git', ['rev-parse', 'HEAD^{tree}'], gitOptions).toString().trim());\n",
    '  assert.equal(delivery.sourceTree, tree);\n');
  reconstructed = removeBetween(reconstructed,
    '  for (const path of sourcePaths.slice(0, 4))\n    assert.equal(sha(gitSource(atlas, current, path)),',
    '  for (const path of sourcePaths) {\n');
  reconstructed = replaceOnce(reconstructed,
    '    const current = validateCurrentAtlasDelivery().source;\n', '');
  const uiStart = "\ntest('current Review UI import binds primary region and accepted worksheet URL navigation to exact Atlas source', () => {\n";
  const uiIndex = reconstructed.indexOf(uiStart);
  assert(uiIndex >= 0, 'Missing declared UI source-binding test');
  assert.equal(reconstructed.lastIndexOf(uiStart), uiIndex);
  reconstructed = reconstructed.slice(0, uiIndex);
  return reconstructed;
}
function admit(candidateBytes, rawBytes) {
  assert.equal(sha(rawBytes), rawSha, 'Check raw fixture SHA before any text normalization');
  assert.equal(sha(candidateBytes), candidateSha, 'Only the reviewed admission/UI test candidate is allowed');
  const reconstructed = reconstruct(candidateBytes);
  assert.equal(reconstructed, rawBytes.toString('utf8'),
    'Baseline teaching, source identity, storage refusal and dialog assertions must reconstruct byte-for-byte');
  assert.equal(sha(Buffer.from(reconstructed)), rawSha);
}
test('the c237 fixture is byte-exact and current admission changes only declared seams', () => {
  admit(readFileSync(candidateUrl), readFileSync(rawUrl));
});
test('altered old refusal and admission proof are both rejected', () => {
  const rawBytes = readFileSync(rawUrl);
  const current = readFileSync(candidateUrl).toString('utf8');
  const oldAssertion = replaceOnce(current,
    "assert.equal(storage.calls, 0, 'Every invalid submission refused before the synthetic store');",
    "assert.equal(storage.calls, 1, 'Every invalid submission refused before the synthetic store');");
  assert.notEqual(sha(Buffer.from(reconstruct(Buffer.from(oldAssertion)))), rawSha);
  assert.throws(() => admit(Buffer.from(oldAssertion), rawBytes));
  const admission = replaceOnce(current,
    '  assert.equal(pin60.reviewIntegration, introducedReviewDigest);',
    '  assert.equal(pin60.reviewIntegration, reviewDigest);');
  assert.throws(() => admit(Buffer.from(admission), rawBytes));
  const count = replaceOnce(current, '  assert.equal(inputs.inputs.length, 1685);',
    '  assert.equal(inputs.inputs.length, 1679);');
  assert.throws(() => admit(Buffer.from(count), rawBytes));
});
