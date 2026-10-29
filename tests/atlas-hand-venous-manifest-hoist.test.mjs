import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const text = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
const digest = value => createHash('sha256').update(value).digest('hex');
const oldSeam = "assert.deepEqual(review.packages,JSON.parse(old('atlas-review/manifest.json')).packages);\nassert.deepEqual(review.files.filter(f=>!JSON.parse(old('atlas-review/manifest.json')).files.some(p=>p.path===f.path)).map(f=>f.path).sort(),['content/hand-venous-imaging-pins.json','content/hand-venous-imaging.ts','lib/hand-venous-imaging.ts']);";
const newSeam = "const historicalReview=JSON.parse(old('atlas-review/manifest.json'));\nassert.deepEqual(review.packages,historicalReview.packages);\nassert.deepEqual(review.files.filter(f=>!historicalReview.files.some(p=>p.path===f.path)).map(f=>f.path).sort(),['content/hand-venous-imaging-pins.json','content/hand-venous-imaging.ts','lib/hand-venous-imaging.ts']);";
const expectedMissing = ['content/hand-venous-imaging-pins.json','content/hand-venous-imaging.ts','lib/hand-venous-imaging.ts'];

test('only the exact two-read seam changes, and the source is reversible', () => {
  const before = text('./fixtures/atlas-hand-venous-imaging-checks.before.mjs.txt');
  const after = text('./atlas-hand-venous-imaging-checks.mjs');
  assert.equal(digest(before), '47aa86d4eb510df4e0a0cfc6fe28af3ec86429eecb8762718975dda478da7fa5');
  assert.equal(before.split(oldSeam).length, 2);
  assert.equal(after, before.replace(oldSeam, newSeam));
  assert.equal(after.replace(newSeam, oldSeam), before);
  assert.equal(digest(after), '57fb43899e34ad091b2bf4f5b1f812009fe85db4b08f94ec21971ad5a7cf88a5');
});

const manifests = [
  ['historical', 'a79ba68ae71d426d33a0e6397642711717f1a5eb4ea9c4069bdecd95faf7bdae', 999],
  ['reviewed', '755e62678a49f5bdff84764a8ad3b9f0bbd02389daa89a822f290cb1c3b272c5', 1002],
];
const loaded = new Map(manifests.map(([name, hash, count]) => {
  const raw = text('./fixtures/atlas-review-manifest-' + name + '.json');
  assert.equal(digest(raw), hash, name + ' pinned Git object bytes');
  const parsed = JSON.parse(raw);
  assert.equal(parsed.files.length, count);
  return [name, {raw, parsed}];
}));

function evaluate(review, readHistorical, hoisted) {
  const historicalReview = hoisted ? JSON.parse(readHistorical('atlas-review/manifest.json')) : undefined;
  const packages = hoisted ? historicalReview.packages : JSON.parse(readHistorical('atlas-review/manifest.json')).packages;
  const missing = review.files.filter(f => !(hoisted ? historicalReview : JSON.parse(readHistorical('atlas-review/manifest.json'))).files.some(p => p.path === f.path)).map(f => f.path).sort();
  const assertions = [];
  for (const [actual, expected] of [[review.packages, packages], [missing, expectedMissing]]) {
    try { assert.deepEqual(actual, expected); assertions.push('pass'); }
    catch (error) { assert.equal(error.code, 'ERR_ASSERTION'); assertions.push('fail'); }
  }
  return {packages, missing, assertions};
}

test('real pinned manifests and missing, extra, and package mismatch cases preserve predicates and assertions', () => {
  const prior = loaded.get('historical');
  const current = loaded.get('reviewed');
  const missing = structuredClone(current.parsed);
  missing.files = missing.files.filter(f => f.path !== expectedMissing[0]);
  const extra = structuredClone(current.parsed);
  extra.files.push({path: 'content/synthetic-extra.json'});
  const mismatch = structuredClone(current.parsed);
  mismatch.packages.push({name: 'synthetic-package'});
  const cases = [
    ['reviewed', current.parsed, prior.raw],
    ['historical', prior.parsed, prior.raw],
    ['missing current path', missing, prior.raw],
    ['extra current path', extra, prior.raw],
    ['package mismatch', mismatch, prior.raw],
    ['extra historical path', prior.parsed, current.raw],
  ];
  for (const [name, review, raw] of cases) {
    const original = evaluate(review, () => raw, false);
    const hoisted = evaluate(review, () => raw, true);
    assert.deepEqual(hoisted, original, name);
  }
  assert.deepEqual(evaluate(current.parsed, () => prior.raw, true).missing, expectedMissing);
  assert.equal(evaluate(extra, () => prior.raw, true).missing.includes('content/synthetic-extra.json'), true);
  assert.deepEqual(evaluate(mismatch, () => prior.raw, true).assertions, ['fail', 'pass']);
});

test('the 1002 file reader calls fall from 1003 to one with a stub', () => {
  const prior = loaded.get('historical');
  const current = loaded.get('reviewed');
  let originalCalls = 0;
  let hoistedCalls = 0;
  const original = evaluate(current.parsed, path => { assert.equal(path, 'atlas-review/manifest.json'); originalCalls++; return prior.raw; }, false);
  const hoisted = evaluate(current.parsed, path => { assert.equal(path, 'atlas-review/manifest.json'); hoistedCalls++; return prior.raw; }, true);
  assert.deepEqual(original, hoisted);
  assert.equal(originalCalls, 1003);
  assert.equal(hoistedCalls, 1);
});
