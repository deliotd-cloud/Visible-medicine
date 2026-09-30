import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { anteriorChoroidalSourceReport, currentInputs, hash } from './anterior-choroidal-source-report.mjs';

const target = 'content/anterior-choroidal-source-audit.json';
const report = await anteriorChoroidalSourceReport(await currentInputs());
const bytes = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(target, 'utf8')).replaceAll('\r\n', '\n'), bytes, 'Anterior choroidal source audit is stale');
else if (process.argv.includes('--refresh')) await writeFile(target, bytes);
else await writeFile(target, bytes, { flag: 'wx' });
console.log(JSON.stringify({ report: target, sha256: hash(bytes), ...report.summary, clinicalValidation: false }));
