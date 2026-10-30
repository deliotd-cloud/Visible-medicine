import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const website = root;
const require = createRequire(`${website}/package.json`);
const ts = require('typescript');
const source = readFileSync(`${root}/lib/clinical-review-quick-start.ts`, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
runInNewContext(compiled, { module, exports: module.exports });
const { selectQuickReview } = module.exports;
const revision = 'a'.repeat(64);
const make = (key, status = 'not-started', overrides = {}) => ({
  key, title: `Structure ${key}`, area: 'structures', scopeLabel: 'Right shoulder · Right',
  href: `/workspace/atlas-review/body?selection=${key}&revision=${revision}`,
  trackLabel: 'Anatomy', revision, status, capability: 'decision', ...overrides,
});

test('groups use exact source scope labels and retain exact href, track and revision', () => {
  const left = make('left', 'in-progress', { scopeLabel: 'Left shoulder · Left',
    trackLabel: 'Teaching', href: `/workspace/atlas-review/body?selection=left&revision=${revision}&t=teaching` });
  const right = make('right', 'changes-required');
  const result = selectQuickReview([left, right], 'Teaching', null, true);
  assert.deepEqual([...result.groups], ['Left shoulder · Left']);
  assert.equal(result.count, 1);
  assert.strictEqual(result.item, left);
  assert.equal(result.item.href, left.href);
  assert.equal(result.item.revision, revision);
  assert.equal(selectQuickReview([left, right], 'Anatomy', 'Left shoulder · Left', true).count, 0);
});

test('priority is changes required, re-review, in progress, then not started', () => {
  const rows = ['not-started', 'in-progress', 're-review', 'changes-required'].map((status, i) => make(String(i), status));
  for (let index = 3; index >= 0; index--) {
    const result = selectQuickReview(rows.slice(0, index + 1), 'Anatomy', null, true);
    assert.strictEqual(result.item, rows[index]);
  }
});

test('excludes recorded, unavailable, inspection, corrections, missing revisions and other areas', () => {
  const excluded = [
    make('approved', 'approval-recorded'), make('unavailable', 'unavailable', { revision: null }),
    make('inspection', 'inspection-required'), make('inspection-capability', 'changes-required', { capability: 'inspection-only' }),
    make('corrections', 'changes-required', { capability: 'corrections' }),
    make('null', 'changes-required', { revision: null }),
    make('bad-revision', 'changes-required', { revision: 'not-a-revision' }),
    make('short-revision', 'changes-required', { revision: 'a'.repeat(63) }),
    make('head', 'changes-required', { area: 'head-learning' }),
  ];
  const result = selectQuickReview(excluded, 'Anatomy', null, true);
  assert.equal(result.count, 0);
  assert.equal(result.item, null);
  assert.deepEqual([...result.groups], []);
});

test('loaded count stays partial until scan completion', () => {
  const rows = [make('one'), make('two')];
  const partial = selectQuickReview(rows, 'Anatomy', null, false);
  assert.equal(partial.count, 2);
  assert.equal(partial.groups[0], 'Right shoulder · Right');
  assert.equal(partial.partial, true);
  assert.equal(selectQuickReview(rows, 'Anatomy', null, true).partial, false);
});
