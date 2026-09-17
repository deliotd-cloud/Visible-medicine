import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import {
  clinicalReferenceRevisionHash as hash,
  currentClinicalReferenceProjection,
} from './clinical-reference-revision-tools.mjs';

const baselinePath = 'content/clinical-reference-revision.baseline.json';
const transitionPath = 'content/clinical-reference-revision.transition.json';
const projection = await currentClinicalReferenceProjection();
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

if (process.argv.includes('--capture-baseline')) {
  assert.equal(head, '3584fc178a408b42caf430b9084e55198a0d18c6');
  const result = {
    schemaVersion: 1,
    purpose: 'Exact pre-revision factual teaching projection; no source admission, clinical approval or licence expansion',
    sourceCommit: head,
    ...projection,
  };
  await writeFile(baselinePath, JSON.stringify(result, null, 2) + '\n', {
    flag: 'wx',
  });
  console.log(JSON.stringify({ baseline: baselinePath, sourceCommit: head, selectedHash: result.selectedHash, wholeBodyHash: result.wholeBodyHash }));
  process.exit(0);
}

const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
assert.equal(hash(baseline.selected), baseline.selectedHash, 'Baseline selected projection hash');
assert.equal(baseline.sourceCommit, '3584fc178a408b42caf430b9084e55198a0d18c6');
const result = {
  schemaVersion: 1,
  purpose: 'Exact post-revision factual teaching projection; historical baseline remains immutable',
  parentCommit: baseline.sourceCommit,
  status: projection.selectedHash === baseline.selectedHash ? 'pending' : 'recorded',
  ...projection,
};
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--record-transition')) {
  assert.equal(result.status, 'recorded', 'Refuse to record a no-op transition');
  const existing = await readFile(transitionPath, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (existing === null) await writeFile(transitionPath, text, { flag: 'wx' });
  else assert.equal(existing.replaceAll('\r\n', '\n'), text, 'Refuse to overwrite a recorded transition');
} else {
  assert.equal(
    (await readFile(transitionPath, 'utf8')).replaceAll('\r\n', '\n'),
    text,
    'Clinical reference transition is absent or stale; record only after scoped editorial review',
  );
}
console.log(JSON.stringify({ transition: transitionPath, status: result.status, selectedHash: result.selectedHash, wholeBodyHash: result.wholeBodyHash }));
