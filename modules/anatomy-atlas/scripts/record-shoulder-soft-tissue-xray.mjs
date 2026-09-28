import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as xray from '../lib/xray-teaching.ts';
import { structures } from '../app/anatomy-data.ts';
const parent = 'bc948b52e8f63c12305bda6eb3e902c5d74e18dc';
const source = execFileSync('git', ['show', `${parent}:app/anatomy-data.ts`], { encoding: 'utf8' });
const exports = {};
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, require(path) { assert.equal(path, '../lib/xray-teaching.ts'); return xray; } });
const old = JSON.parse(JSON.stringify(exports.structures));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const entries = [];
assert.equal(structures.length, old.length);
for (const [i, now] of structures.entries()) {
  const before = old[i];
  const expected = structuredClone(before);
  if (before.sections.xray.readiness === 'pending') {
    assert.equal(now.sections.xray.readiness, 'draft');
    expected.sections.xray = now.sections.xray;
    entries.push({ id: now.id, previous: before.sections.xray, currentHash: hash(now.sections.xray) });
  }
  assert.deepEqual(now, expected, 'Only the six previously pending X-ray lessons may change');
}
assert.equal(entries.length, 6);
const document = { parentCommit: parent, previousStructuresHash: hash(old), currentStructuresHash: hash(structures), entries };
const path = 'content/shoulder-soft-tissue-xray-transition.json';
const text = JSON.stringify(document, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8').replace(/\r\n/g, '\n'), text);
else writeFileSync(path, text);
console.log('Six shoulder X-ray lessons verified; all other shoulder teaching and identity unchanged.');
