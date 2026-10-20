import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {CURRENT_ATLAS_REVISION, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const original = readFileSync(new URL('./fixtures/atlas-shoulder-girdle-arterial-ultrasound.original.txt', import.meta.url));
const active = readFileSync(new URL('./atlas-shoulder-girdle-arterial-ultrasound-checks.mjs', import.meta.url));
const originalHash = 'bd61aea631565966cf7d2f3b083b2868cee7d13d2bf11ada7a25642915daa6e0';
const activeHash = '3b0d208653dfea66c2e7ad0d045d5916b9b45e8028a947d58b93eee5e4855725';
const substitutions = [
  ["import {validateCurrentAtlasDelivery, currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",
   "import {validateCurrentAtlasDelivery, currentAtlasDeliveryRoot, CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';"],
  ["assert.equal(currentPin.source, '3e66d2a7cb1807f792929cbe292a4cfc81e4e79e');",
   'assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);'],
  ["assert.equal(currentPin.reviewIntegration, '245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37');",
   "assert.equal(currentPin.reviewIntegration, hash(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs));"],
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function verify(originalBytes, activeBytes) {
  assert.equal(sha(originalBytes), originalHash, 'Exact historical and pre-repair source');
  let expected = originalBytes.toString('utf8');
  for (const [before, after] of substitutions) {
    assert.equal(expected.split(before).length - 1, 1, `Unique substitution: ${before}`);
    expected = expected.replace(before, after);
  }
  assert.equal(sha(activeBytes), activeHash, 'Reviewed source postimage');
  assert.deepEqual(activeBytes, Buffer.from(expected, 'utf8'), 'All other graph, emitted, Review, refusal and count assertions remain exact');
}

test('shoulder arterial historical proof changes only three current-admission expressions', () => {
  verify(original, active);
  assert.throws(() => verify(Buffer.from(original.toString('utf8').replace('const websiteBaseline', 'const alteredBaseline')), active));
  assert.throws(() => verify(original, Buffer.from(active.toString('utf8').replace('const websiteBaseline', 'const alteredBaseline'))));
  assert.throws(() => verify(original, Buffer.from(active.toString('utf8').replace(
    "hash(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs)", "'0'.repeat(64)"))));
});

test('shoulder arterial current admission follows the validated producer and rejects the closed7b pin', () => {
  const pin = validateCurrentAtlasDelivery();
  const currentFixture = JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json', import.meta.url)));
  assert.deepEqual(pin, currentFixture);
  assert.equal(pin.source, CURRENT_ATLAS_REVISION);
  const historical = JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-7b3e678a.json', import.meta.url)));
  assert.equal(historical.reviewIntegration, '245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37');
  assert.notEqual(pin.reviewIntegration, historical.reviewIntegration);
  assert.throws(() => validateCurrentAtlasDelivery({pin: historical}));
  const stale = structuredClone(pin);
  stale.source = '3e66d2a7cb1807f792929cbe292a4cfc81e4e79e';
  assert.throws(() => validateCurrentAtlasDelivery({pin: stale}));
  const staleReview = structuredClone(pin);
  staleReview.reviewIntegration = historical.reviewIntegration;
  assert.throws(() => validateCurrentAtlasDelivery({pin: staleReview}));
});
