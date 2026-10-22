import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const stage = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const receiptPath = resolve(stage, '../20261022-final-loading-history-closures/APPLIED_SOURCE.json');
const receiptBytes = readFileSync(receiptPath);
const receipt = JSON.parse(receiptBytes.toString('utf8'));
const row = receipt.sourceRows.find(value => value.path === 'components/ClinicalReviewInbox.tsx');
assert(row, 'source receipt row missing');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = {
  candidate: resolve(receipt.website, row.path),
  raw: resolve(stage, 'RAW/components/ClinicalReviewInbox.tsx'),
  code: resolve(stage, 'CODE/components/ClinicalReviewInbox.tsx'),
  test: resolve(stage, 'CODE/tests/clinical-review-inbox-link-context.test.mjs'),
  adapter: resolve(stage, 'PROOF/source-adapter.mjs'),
};
const read = path => readFileSync(path);
const hashes = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, sha(read(path))]));
for (const value of [sha(receiptBytes), row.sha256, ...Object.values(hashes)]) assert.match(value, /^[a-f0-9]{64}$/);
assert.equal(hashes.candidate, row.sha256, 'candidate differs from source receipt');
assert.equal(hashes.raw, row.sha256, 'RAW differs from source receipt');
assert.equal(read(files.raw).length, row.bytes, 'RAW byte length differs from receipt');

function replaceOnce(text, from, to) {
  assert.equal(text.split(from).length, 2, `inverse preimage must occur exactly once: ${from.slice(0, 54)}`);
  return text.replace(from, to);
}
let inverse = read(files.code).toString('utf8');
inverse = replaceOnce(inverse, "import { useEffect, useId, useRef, useState } from 'react';",
  "import { useEffect, useRef, useState } from 'react';");
inverse = replaceOnce(inverse, `
// The UTF-16 code-unit encoding is injective even for unusual validated keys.
// It keeps arbitrary key text out of IDREF tokens and remains stable as rows move.
function rowContextId(instanceId: string, key: string): string {
  let encoded = '';
  for (let index = 0; index < key.length; index++) encoded += key.charCodeAt(index).toString(16).padStart(4, '0');
  return \`\${instanceId}-review-\${encoded}\`;
}
`, '');
inverse = replaceOnce(inverse, 'export function ClinicalReviewInbox() {\n  const instanceId = useId();',
  'export function ClinicalReviewInbox() {');
inverse = replaceOnce(inverse, `>{rows.map(item => {
        const contextId = rowContextId(instanceId, item.key);
        return <li key={item.key}>`, '>{rows.map(item => <li key={item.key}>');
inverse = replaceOnce(inverse,
  " aria-describedby={`${contextId}-status ${contextId}-capability${item.changeReason ? ` ${contextId}-reason` : ''}`}", '');
for (const suffix of ['status', 'capability', 'reason'])
  inverse = replaceOnce(inverse, " id={`${contextId}-" + suffix + "`}", '');
inverse = replaceOnce(inverse, '</li>; })}</ol>', '</li>)}</ol>');
assert.equal(Buffer.compare(Buffer.from(inverse), read(files.raw)), 0,
  'exact inverse failed; visual copy, href, target, rel, handlers or other source changed');

function focusedRun(baseline) {
  const result = spawnSync(process.execPath,
    ['--test-reporter=tap', '--import', './PROOF/source-adapter.mjs', '--test', './CODE/tests/clinical-review-inbox-link-context.test.mjs'],
    { cwd: stage, encoding: 'utf8', env: { ...process.env, VM_REVIEW_PROOF_BASELINE: baseline ? '1' : '0' } });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const count = label => Number(output.match(new RegExp(`# ${label} (\\d+)`))?.[1]);
  const summary = { exitCode: result.status, tests: count('tests'), pass: count('pass'), fail: count('fail'), skipped: count('skipped') };
  assert.equal(summary.tests, 3, output);
  if (baseline) { assert.equal(summary.pass, 1, output); assert.equal(summary.fail, 2, output); assert.equal(summary.exitCode, 1, output); }
  else { assert.equal(summary.pass, 3, output); assert.equal(summary.fail, 0, output); assert.equal(summary.exitCode, 0, output); }
  return summary;
}
const baseline = focusedRun(true);
const fixed = focusedRun(false);
const controlledHarnesses = [
  'tests/clinical-review-inbox-filter-recovery.test.mjs',
  'tests/clinical-review-inbox-pagination-focus.test.mjs',
  'tests/clinical-review-inbox-ui.test.mjs',
  'tests/clinical-review-inbox-return-context.test.mjs',
  'tests/clinical-review-inbox-scan-focus.test.mjs',
  'tests/clinical-review-inbox-workbench.test.mjs',
  'tests/clinical-review-inbox-priority.test.mjs',
];
for (const path of controlledHarnesses) {
  const content = readFileSync(resolve(receipt.website, path), 'utf8');
  assert.match(content, /ClinicalReviewInbox/);
  assert.match(content, /useRef\(/);
  assert.doesNotMatch(content, /useId\(/);
}
const evidence = {
  kind: 'isolated source proof; no candidate writes',
  sourceReceipt: receiptPath.replaceAll('\\', '/'),
  receiptSha256: sha(receiptBytes),
  sourceRow: row,
  hashes,
  exactInverseToRaw: true,
  inverseScope: 'Only useId, key encoding and same-row aria-describedby/id associations; all other source bytes identical',
  baseline,
  fixed,
  controlledHarnessesNeedingUseIdMock: controlledHarnesses,
  smallestMockAddition: "useId() { const i = cursor++; if (!(i in slots)) slots[i] = 'inbox-test-instance'; return slots[i]; } (use a distinct value for each mounted instance)",
  browserAssistiveAcceptance: 'pending',
};
writeFileSync(resolve(stage, 'EVIDENCE.json'), `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(JSON.stringify({ hashes, exactInverseToRaw: true, baseline, fixed }) + '\n');
