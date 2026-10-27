import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const site = process.env.VISIBLE_MEDICINE_WEBSITE ?? process.cwd();
const require = createRequire(resolve(site, 'package.json'));
const ts = require('typescript');
const source = readFileSync(resolve(site, 'lib/learner-portfolio-pagination.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function('module', 'exports', compiled)(module, module.exports);
const { portfolioPage, encodePortfolioCursor, parsePortfolioCursor, parsePortfolioSection } = module.exports;

test('notes page uses a 51st row only to show continuation and preserves equal-time key', () => {
  const rows = Array.from({ length: 52 }, (_, index) => ({ id: `n-${String(52 - index).padStart(3, '0')}`, updated_at: '2026-10-27T10:00:00.000Z' }));
  const first = portfolioPage(rows, row => ({ section: 'notes', updatedAt: row.updated_at, id: row.id }));
  assert.equal(first.items.length, 50);
  assert.deepEqual(parsePortfolioCursor(first.nextCursor, 'notes'), { section: 'notes', updatedAt: rows[49].updated_at, id: rows[49].id });
  assert.equal(portfolioPage(rows.slice(50), row => ({ section: 'notes', updatedAt: row.updated_at, id: row.id })).nextCursor, null);
});

test('review cursor retains rank, due date and equal-date id', () => {
  const cursor = { section: 'reviews', rank: 1, dueAt: '2026-10-27T10:00:00.000Z', id: 'review-50' };
  assert.deepEqual(parsePortfolioCursor(encodePortfolioCursor(cursor), 'reviews'), cursor);
  assert.throws(() => parsePortfolioCursor(encodePortfolioCursor(cursor), 'notes'));
  assert.throws(() => parsePortfolioSection('completions'));
});

test('malformed and oversized cursors are refused', () => {
  for (const cursor of ['', 'not-base64?', 'a'.repeat(513), btoa(JSON.stringify({ section: 'notes', updatedAt: '2026-10-27T10:00:00.000Z', id: 'n', learnerId: 'other' }))])
    assert.throws(() => parsePortfolioCursor(cursor, 'notes'));
});

test('queries preserve learner ownership and deterministic keyset predicates', () => {
  const governance = readFileSync(resolve(site, 'lib/platform-governance.ts'), 'utf8');
  const section = governance.slice(governance.indexOf('export async function getLearnerPortfolio('), governance.indexOf('export async function saveLearnerNote('));
  assert.match(section, /learner_notes WHERE learner_id=\? AND \(updated_at < \? OR \(updated_at = \? AND id < \?\)\)/);
  assert.match(section, /learner_review_queue WHERE learner_id=\? AND \(CASE status WHEN 'active' THEN 0 ELSE 1 END > \?/);
  assert.match(section, /ORDER BY updated_at DESC, id DESC LIMIT 51/);
  assert.match(section, /ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, due_at ASC, id ASC LIMIT 51/);
  assert.match(section, /\.bind\(auth\.userId, cursor\.rank, cursor\.rank, cursor\.dueAt, cursor\.dueAt, cursor\.id\)/);
});
