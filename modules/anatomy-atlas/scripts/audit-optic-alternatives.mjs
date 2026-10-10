import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { opticAlternativeReport } from './optic-alternative-report.mjs';

const target = 'docs/optic-nerve-alternatives.json';
const { report } = await opticAlternativeReport();
const rendered = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(await readFile(target, 'utf8'), rendered, `${target} is stale`);
  console.log(`Pinned optic comparison current: ${report.reportRevision}`);
} else {
  await writeFile(target, rendered);
  console.log(`Pinned optic comparison written: ${report.reportRevision}`);
}
