import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const site = process.env.VISIBLE_MEDICINE_WEBSITE ?? process.cwd();
const require = createRequire(resolve(site, 'package.json'));
const ts = require('typescript');
const React = require('react');
const source = readFileSync(resolve(site, 'components/LearnerPortfolio.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const helperSource = readFileSync(resolve(site, 'lib/learner-portfolio-pagination.ts'), 'utf8');
const helperCompiled = ts.transpileModule(helperSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const helperModule = { exports: {} };
new Function('module', 'exports', helperCompiled)(helperModule, helperModule.exports);
const pagination = helperModule.exports;
const note = id => ({ id, resourceType: 'atlas', resourceId: 'ct-head', title: id, body: 'Learning', updatedAt: '2026-10-27T10:00:00.000Z' });
const review = id => ({ id, resourceType: 'atlas', resourceId: 'ct-head', title: id, prompt: 'Recall', dueAt: '2026-10-27T10:00:00.000Z', intervalDays: 7, status: 'active', updatedAt: '2026-10-27T10:00:00.000Z' });
const cursor = pagination.encodePortfolioCursor({ section: 'notes', updatedAt: '2026-10-27T10:00:00.000Z', id: 'n1' });
const reviewCursor = pagination.encodePortfolioCursor({ section: 'reviews', rank: 0, dueAt: '2026-10-27T10:00:00.000Z', id: 'r1' });
const settle = () => new Promise(resolve => setImmediate(resolve));

function walk(node, predicate, found = []) {
  if (Array.isArray(node)) { node.forEach(item => walk(item, predicate, found)); return found; }
  if (!node?.props) return found;
  if (predicate(node)) found.push(node);
  walk(node.props.children, predicate, found);
  return found;
}

function harness(initialPortfolio) {
  const states = [], refs = [], calls = [], pending = [];
  let position = 0;
  const hooks = { ...React, useEffect() {},
    useState(initial) { const slot = position++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }]; },
    useRef(initial) { const slot = position++; if (!(slot in refs)) refs[slot] = { current: initial }; return refs[slot]; },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '../lib/learning-draft-navigation.ts') return { registerLearningDraftGuard() { return () => {}; } };
    if (name === '../lib/learner-portfolio-pagination') return pagination;
    throw new Error(name);
  }, module, module.exports);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = (url, options) => { calls.push({ url, options }); return new Promise((resolve, reject) => pending.push({ resolve, reject })); };
  const render = () => { position = 0; return module.exports.LearnerPortfolio({ initialPortfolio, resources: [] }); };
  const button = label => walk(render(), node => node.type === 'button' && typeof node.props.children === 'string' && node.props.children.includes(label))[0];
  return { render, button, calls, pending, dispose() { globalThis.fetch = oldFetch; } };
}

test('load more serializes requests, deduplicates ids and preserves the button at exhaustion', async () => {
  const h = harness({ notes: [note('n1')], reviews: [review('r1')], completions: [], notesNextCursor: cursor, reviewsNextCursor: reviewCursor });
  try {
    const action = h.button('Load more notes').props.onClick;
    action(); action();
    assert.equal(h.calls.length, 1);
    assert.match(h.calls[0].url, /section=notes&cursor=/);
    assert.equal(walk(h.render(), node => node.type === 'button' && node.props.className === 'portfolio-load-more').every(button => button.props['aria-disabled']), true);
    h.pending[0].resolve({ ok: true, json: async () => ({ section: 'notes', notes: [note('n1'), note('n2'), note('n2')], nextCursor: null }) });
    await settle();
    assert.equal(walk(h.render(), node => node.type === 'article' && node.props.children?.some?.(child => child?.props?.children === 'n2')).length, 1);
    assert.equal(h.button('All notes loaded').props['aria-disabled'], true);
    assert.equal(h.button('Load more reviews').props['aria-disabled'], false);
  } finally { h.dispose(); }
});

test('failed page and malformed page preserve current items and allow retry', async () => {
  const h = harness({ notes: [note('n1')], reviews: [], completions: [], notesNextCursor: cursor, reviewsNextCursor: null });
  try {
    h.button('Load more notes').props.onClick();
    h.pending[0].reject(new Error('Offline'));
    await settle();
    assert.equal(h.button('Load more notes').props['aria-disabled'], false);
    assert.equal(walk(h.render(), node => node.type === 'article').length, 1);
    h.button('Load more notes').props.onClick();
    h.pending[1].resolve({ ok: true, json: async () => ({ section: 'notes', notes: [note('n2')], nextCursor: 7 }) });
    await settle();
    assert.equal(h.button('Load more notes').props['aria-disabled'], false);
    assert.equal(walk(h.render(), node => node.type === 'article').length, 1);
  } finally { h.dispose(); }
});

test('unchanged continuation cursor refuses stale page and leaves retry available', async () => {
  const h = harness({ notes: [note('n1')], reviews: [], completions: [], notesNextCursor: cursor, reviewsNextCursor: null });
  try {
    h.button('Load more notes').props.onClick();
    h.pending[0].resolve({ ok: true, json: async () => ({ section: 'notes', notes: [note('n2')], nextCursor: cursor }) });
    await settle();
    assert.equal(h.button('Load more notes').props['aria-disabled'], false);
    assert.equal(walk(h.render(), node => node.type === 'article').length, 1);
    assert.match(walk(h.render(), node => node.props.role === 'alert')[0].props.children, /did not advance/);
    h.button('Load more notes').props.onClick();
    assert.equal(h.calls.length, 2);
  } finally { h.dispose(); }
});

test('valid old snapshots render without pagination metadata; malformed provided metadata rejects POST confirmation', async () => {
  const h = harness({ notes: [], reviews: [review('r1')], completions: [] });
  try {
    assert.equal(h.button('Load more notes'), undefined);
    h.button('Reviewed today').props.onClick();
    h.pending[0].resolve({ ok: true, json: async () => ({ notes: [], reviews: [], completions: [], notesNextCursor: 7 }) });
    await settle();
    assert.equal(walk(h.render(), node => node.props.role === 'alert').length, 1);
    assert.equal(walk(h.render(), node => node.type === 'article').length, 1);
  } finally { h.dispose(); }
});
