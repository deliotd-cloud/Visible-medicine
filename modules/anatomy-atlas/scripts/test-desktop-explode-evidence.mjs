import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDesktopExplodeEvidence } from './desktop-explode-evidence.mjs';

// Synthetic fixtures test the checker only; they are never browser acceptance evidence.
const syntheticReport = () => ({
  schema: 'vm-desktop-explode-qa/1',
  sourceCommit: 'a'.repeat(40),
  websiteCommit: 'b'.repeat(40),
  runtimeManifestSha256: 'c'.repeat(64),
  scope: 'synthetic layout check',
  viewport: { width: 1200, height: 800 },
  metadata: { notes: ['synthetic'], consoleErrors: [], observedWarnings: [] },
  cases: [{
    id: 'synthetic-spread', mechanism: 'spread', amount: 50, cameraView: 'front',
    page: { scrollWidth: 1200, scrollHeight: 800, viewportWidth: 1200, viewportHeight: 800 },
    labels: { width: 1200, height: 800, items: [
      { name: 'A', side: 'left', anchor: { x: 200, y: 250 }, box: { x: 40, y: 230, width: 120, height: 30 } },
      { name: 'B', side: 'left', anchor: { x: 280, y: 350 }, box: { x: 40, y: 330, width: 120, height: 30 } },
      { name: 'C', side: 'right', anchor: { x: 900, y: 250 }, box: { x: 1010, y: 230, width: 120, height: 30 } },
    ] },
    screenshotSha256: 'd'.repeat(64), domSha256: 'e'.repeat(64),
  }],
});

const invalid = (mutate, pattern) => {
  const report = syntheticReport();
  mutate(report);
  const outcome = validateDesktopExplodeEvidence(report);
  assert.equal(outcome.ok, false);
  assert.match(outcome.errors.join('\n'), pattern);
};

test('accepts a synthetic report and states evidence limits', () => {
  const outcome = validateDesktopExplodeEvidence(syntheticReport());
  assert.equal(outcome.ok, true, outcome.errors.join('\n'));
  assert.equal(outcome.cases, 1);
  assert.equal(outcome.labels, 3);
  assert.ok(outcome.checks > 0);
  assert.equal(outcome.anatomicalValidation, false);
  assert.equal(outcome.cameraSmoothnessProven, false);
});

test('centre tolerance accepts either anchor side within one pixel', () => {
  const report = syntheticReport();
  report.cases[0].labels.items[0].anchor.x = 601;
  report.cases[0].labels.items[2].anchor.x = 599;
  assert.equal(validateDesktopExplodeEvidence(report).ok, true);
});

test('rejects wrong sides, overlaps, and out of bounds coordinates', () => {
  invalid((r) => { r.cases[0].labels.items[0].anchor.x = 900; }, /anchor is on the wrong side/);
  invalid((r) => { r.cases[0].labels.items[0].box.x = 580; }, /box crosses into right half/);
  invalid((r) => { r.cases[0].labels.items[1].box.y = 250; }, /box overlaps another label box/);
  invalid((r) => { r.cases[0].labels.items[2].box.x = 1100; }, /box exits overlay horizontally/);
  invalid((r) => { r.cases[0].labels.items[0].anchor.y = -2; }, /anchor.y must be finite/);
});

test('rejects page overflow beyond one pixel and mismatched viewports', () => {
  invalid((r) => { r.cases[0].page.scrollWidth = 1201.1; }, /horizontal overflow/);
  invalid((r) => { r.cases[0].page.scrollHeight = 802; }, /vertical overflow/);
  invalid((r) => { r.cases[0].page.viewportWidth = 1199; }, /differs from report.viewport.width/);
});

test('rejects empty, duplicate, nonfinite, and stale input shapes', () => {
  invalid((r) => { r.cases = []; }, /nonempty array/);
  invalid((r) => { r.cases.push(structuredClone(r.cases[0])); }, /duplicated/);
  invalid((r) => { r.cases[0].amount = Number.NaN; }, /amount must be finite/);
  invalid((r) => { r.cases[0].labels.items[0].box.width = Infinity; }, /box.width must be finite/);
  invalid((r) => { r.schema = 'vm-desktop-explode-qa/0'; }, /report.schema/);
  invalid((r) => { r.cases[0].labels.items[0].position = { x: 1 }; }, /position is unknown/);
  invalid((r) => { r.cases[0].labels.items[0].box = { left: 1, top: 1 }; }, /box.left is unknown/);
  invalid((r) => { r.metadata.consoleErrors = [42]; }, /consoleErrors\[0\]/);
  invalid((r) => { r.sourceCommit = 'stale'; }, /sourceCommit has invalid/);
  invalid((r) => { r.cases[0].domSha256 = 'stale'; }, /domSha256 has invalid/);
});

test('permits zero labels without claiming multi-label acceptance', () => {
  const report = syntheticReport();
  report.cases[0].labels.items = [];
  const outcome = validateDesktopExplodeEvidence(report);
  assert.equal(outcome.ok, true, outcome.errors.join('\n'));
  assert.equal(outcome.labels, 0);
});
