import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {restoreUiV5Source} from './ui-current-v5-source-inverse.mjs';

const root = process.env.VM_WEBSITE_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
const rawUrl = join(root, 'tests/fixtures/ui-teaching-current-delivery-c237.mjs.raw');
const candidateUrl = join(root, 'tests/ui-teaching-current-delivery.test.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rawSha = 'e0aed39045349b6ed6eecd95e08fde0df56b805d242f2e527301b0df2af0b884';
const candidateSha = '8dac3b76e058953603aac3b7124fb19f3b754870cac0d88166ba2531efde13a8';
const currentSha = '1a7c9da0824b4c52ba40ca308f9ff2924d6f9d375f0ae8d077888dbf1d90eb7d';
const previousCurrentSha = '2d654b875fb68520036e2288cad70e08a4a8da885391196f715168f339418a4f';
const previousAdmissionSha = '8d585dd4af1fa8e5c3ed6256e822cdffa9dbbff0e09428aebeb1bf26961b5ed7';
// The present source has four exact delivery-count changes relative to the earlier complete current source.
function currentUi(bytes) {
  assert.equal(sha(bytes), currentSha, 'Exact complete current UI source required');
  const text = bytes.toString('utf8');
  assert.deepEqual(Buffer.from(text), bytes);
  let prior = replaceOnce(text,
    '  assert.equal(delivery.reviewSourceFiles, 1605);',
    '  assert.equal(delivery.reviewSourceFiles, 1562);');
  prior = replaceOnce(prior,
    '  assert.equal(inputs.inputs.length, 1808);',
    '  assert.equal(inputs.inputs.length, 1729);');
  prior = replaceOnce(prior,
    '  assert.equal(delivery.viewerFiles, 54);',
    '  assert.equal(delivery.viewerFiles, 46);');
  prior = replaceOnce(prior,
    '  assert.equal(delivery.viewerPackages, 24);',
    '  assert.equal(delivery.viewerPackages, 22);');
  const previous = Buffer.from(prior);
  assert.equal(sha(previous), previousCurrentSha, 'Only the four authenticated current count seams are inverted');
  return previous;
}
// Retain the prior complete current stage before the original lifecycle admission.
function previousAdmission(bytes) {
  assert.equal(sha(bytes), previousCurrentSha, 'Exact complete earlier current UI source required');
  const text = bytes.toString('utf8');
  assert.deepEqual(Buffer.from(text), bytes);
  let prior = replaceOnce(text,
    '  assert.equal(delivery.reviewSourceFiles, 1562);',
    '  assert.equal(delivery.reviewSourceFiles, 1558);');
  prior = replaceOnce(prior,
    '  assert.equal(inputs.inputs.length, 1729);',
    '  assert.equal(inputs.inputs.length, 1724);');
  const admitted = Buffer.from(prior);
  assert.equal(sha(admitted), previousAdmissionSha, 'Only the two authenticated earlier count seams are inverted');
  return admitted;
}
// Authenticate the sole current loading count before the retained complete-source inverse.
function priorUi(bytes) {
  assert.equal(sha(bytes), previousAdmissionSha);
  const text = bytes.toString('utf8');
  assert.deepEqual(Buffer.from(text), bytes);
  const prior = Buffer.from(replaceOnce(text,
    '  assert.equal(inputs.inputs.length, 1724);',
    '  assert.equal(inputs.inputs.length, 1723);'));
  assert.equal(sha(prior), '89125a0699029efb7186800ba761ecbe0748c052753424fc02fc36231f5f5913');
  return prior;
}
// The complete historical lifecycle is replayed only after the later source is authenticated.
const historicalUi = encoding => {const bytes=restoreUiV5Source(priorUi(previousAdmission(currentUi(readFileSync(candidateUrl)))));return encoding?bytes.toString(encoding):bytes;};

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
    '  assert.equal(delivery.reviewSourceFiles, 1553);\n',
    '  assert.equal(delivery.reviewSourceFiles, 1538);\n');
  reconstructed = replaceOnce(reconstructed,
    '  assert.equal(inputs.inputs.length, 1710);\n',
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
  admit(historicalUi(), readFileSync(rawUrl));
});
test('altered old refusal and admission proof are both rejected', () => {
  const rawBytes = readFileSync(rawUrl);
  const current = historicalUi().toString('utf8');
  const oldAssertion = replaceOnce(current,
    "assert.equal(storage.calls, 0, 'Every invalid submission refused before the synthetic store');",
    "assert.equal(storage.calls, 1, 'Every invalid submission refused before the synthetic store');");
  assert.notEqual(sha(Buffer.from(reconstruct(Buffer.from(oldAssertion)))), rawSha);
  assert.throws(() => admit(Buffer.from(oldAssertion), rawBytes));
  const admission = replaceOnce(current,
    '  assert.equal(pin60.reviewIntegration, introducedReviewDigest);',
    '  assert.equal(pin60.reviewIntegration, reviewDigest);');
  assert.throws(() => admit(Buffer.from(admission), rawBytes));
  const count = replaceOnce(current, '  assert.equal(inputs.inputs.length, 1710);',
    '  assert.equal(inputs.inputs.length, 1679);');
  assert.throws(() => admit(Buffer.from(count), rawBytes));
});

test('complete previous current UI contract advances only the two observed count seams', () => {
  const before = readFileSync(join(root, 'tests/fixtures/ui-teaching-current-delivery.test.mjs.raw'));
  assert.equal(sha(before), 'afcfd94cb82c7289f525521f533839526cfdbad94d9686bf91251108c5cf5285');
  let expected = before.toString();
  expected = replaceOnce(expected, '  assert.equal(delivery.reviewSourceFiles, 1550);',
    '  assert.equal(delivery.reviewSourceFiles, 1553);');
  expected = replaceOnce(expected, '  assert.equal(inputs.inputs.length, 1707);',
    '  assert.equal(inputs.inputs.length, 1710);');
  assert.equal(historicalUi('utf8'), expected,
    'Whole UI source, emitted teaching, rejected decisions and private dialog assertions remain exact');
});

test('later UI source is authenticated before the full historical lifecycle replay',()=>{
 const bytes=readFileSync(candidateUrl);assert.equal(sha(bytes),currentSha);
 const admitted=previousAdmission(currentUi(bytes));assert.equal(sha(admitted),previousAdmissionSha);
 const prior=priorUi(admitted);assert.equal(sha(restoreUiV5Source(prior)),candidateSha);
 assert.throws(()=>restoreUiV5Source(Buffer.concat([prior,Buffer.from('\n// unknown')])));
 assert.throws(()=>priorUi(Buffer.concat([admitted,Buffer.from('\n// unknown')])));
});

test('complete current count seams refuse unknown, deleted, duplicated or shifted source',()=>{
 const bytes=readFileSync(candidateUrl), text=bytes.toString('utf8');
 const earlier=currentUi(bytes), admitted=previousAdmission(earlier);
 assert.equal(sha(earlier),previousCurrentSha);
 assert.equal(sha(admitted),previousAdmissionSha);
 for(const [from,to] of [
  ['  assert.equal(delivery.reviewSourceFiles, 1605);','  assert.equal(delivery.reviewSourceFiles, 1604);'],
  ['  assert.equal(inputs.inputs.length, 1808);','  assert.equal(inputs.inputs.length, 1807);'],
  ['  assert.equal(delivery.viewerFiles, 54);','  assert.equal(delivery.viewerFiles, 53);'],
  ['  assert.equal(delivery.viewerPackages, 24);','  assert.equal(delivery.viewerPackages, 23);'],
 ]){
  assert.throws(()=>currentUi(Buffer.from(replaceOnce(text,from,to))));
  assert.throws(()=>currentUi(Buffer.from(replaceOnce(text,from,from+from))));
  assert.throws(()=>currentUi(Buffer.from(replaceOnce(text,from,''))));
 }
 assert.throws(()=>currentUi(Buffer.concat([bytes,Buffer.from('\n// unknown current source')])));
 assert.throws(()=>previousAdmission(Buffer.concat([earlier,Buffer.from('\n// unknown earlier source')])));
 assert.throws(()=>priorUi(Buffer.concat([admitted,Buffer.from('\n// unknown admitted source')])));
});
