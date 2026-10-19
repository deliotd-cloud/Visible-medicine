import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const baselineIndex = process.argv.indexOf('--baseline');
const snapshot = baselineIndex < 0 ? null : JSON.parse(readFileSync(process.argv[baselineIndex + 1], 'utf8'));
const originalSources = new Map();
if (snapshot) {
  assert.equal(snapshot.baselineHead, 'b953ff3f5f1891599cb6e91cb91311d9d6006270');
  assert.deepEqual(snapshot.files.map(record => record.path.replaceAll('\\', '/').split('/').at(-1)).sort(),
    ['InstitutionPeopleManager.tsx', 'LearnerPortfolio.tsx', 'PilotApplicationForm.tsx']);
  for (const record of snapshot.files) {
    assert.equal(createHash('sha256').update(record.source).digest('hex'), record.sha256.toLowerCase());
    originalSources.set(record.path.replaceAll('\\', '/').split('/').at(-1), record.source);
  }
}
console.log(JSON.stringify({mode:snapshot?'pinned-before':'actual',sourcePins:snapshot?snapshot.files.map(({path,sha256})=>({path,sha256})):null,synthetic:'actual component handlers; React state/FormData/fetch seams, no live requests'}));

function walk(node, predicate) {
  if (Array.isArray(node)) {
    for (const child of node) { const found = walk(child, predicate); if (found) return found; }
    return null;
  }
  if (!node?.props) return null;
  if (predicate(node)) return node;
  return walk(node.props.children, predicate);
}

function harness(file, exportName, props, fields) {
  const original = { FormData: globalThis.FormData, fetch: globalThis.fetch };
  const source = snapshot ? originalSources.get(file) : readFileSync(new URL(`../components/${file}`, import.meta.url), 'utf8');
  assert.equal(typeof source, 'string');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const states = []; let cursor = 0;
  const hooks = { ...React, useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  }, useEffect() {}, useRef(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = { current: initial };
    return states[index];
  }};
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '../lib/learning-draft-navigation.ts') return {registerLearningDraftGuard(){return()=>{};}};
    throw new Error(`Unexpected component dependency: ${name}`);
  }, module, module.exports);
  globalThis.FormData = class {
    constructor(form) { assert.equal(form, target); }
    get(name) { return target.fields[name] ?? null; }
    *[Symbol.iterator]() { yield* Object.entries(target.fields); }
  };
  const target = { fields: { ...fields }, resets: 0, reset() { this.resets++; this.fields = {}; } };
  let currentTarget = target; let reads = 0;
  const event = { preventDefault() {}, get currentTarget() { reads++; return currentTarget; } };
  const render = () => { cursor = 0; return module.exports[exportName](props); };
  const findForm = (position = 0) => {
    const found = [];
    function all(node) {
      if (Array.isArray(node)) { node.forEach(all); return; }
      if (!node?.props) return;
      if (node.type === 'form') found.push(node);
      all(node.props.children);
    }
    all(render());
    return found[position];
  };
  return { target, event, render, findForm, clearEvent() { currentTarget = null; },
    get reads() { return reads; }, dispose() { globalThis.FormData = original.FormData; globalThis.fetch = original.fetch; } };
}

function deferredFetch() {
  let complete, reject;
  globalThis.fetch = () => new Promise((resolve, fail) => { complete = resolve; reject = fail; });
  return { resolve(body, ok = true) { complete({ ok, json: async () => body }); }, reject(error) { reject(error); } };
}

const people = { organization: { name: 'Example' }, entitlement: { learnerLimit: 10, educatorLimit: 3 },
  members: [], invitations: [], outbox: {} };

test('institution invitation succeeds after event target clears and resets once', async () => {
  const h = harness('InstitutionPeopleManager.tsx', 'InstitutionPeopleManager', { initialSnapshot: people }, { roster: 'learner@example.edu,learner', validDays: '14' });
  try {
    const pendingResponse = deferredFetch();
    const pending = h.findForm().props.onSubmit(h.event);
    h.clearEvent();
    pendingResponse.resolve({ snapshot: people, created: [{ email: 'learner@example.edu', role: 'learner', invitationPath: '/join/example', emailDelivery: 'held' }] });
    await pending;
    assert.equal(h.reads, 1);
    assert.equal(h.target.resets, 1);
    assert.equal(walk(h.render(), node => node.props.role === 'alert'), null);
    assert.ok(walk(h.render(), node => node.props.className === 'invitation-handoff'));
  } finally { h.dispose(); }
});

test('institution invitation rejection retains roster and shows error', async () => {
  const h = harness('InstitutionPeopleManager.tsx', 'InstitutionPeopleManager', { initialSnapshot: people }, { roster: 'learner@example.edu,learner', validDays: '14' });
  try {
    const pendingResponse = deferredFetch();
    const pending = h.findForm().props.onSubmit(h.event);
    h.clearEvent(); pendingResponse.resolve({ error: 'Roster rejected.' }, false);
    await pending;
    assert.equal(h.target.resets, 0);
    assert.equal(h.target.fields.roster, 'learner@example.edu,learner');
    assert.equal(walk(h.render(), node => node.props.role === 'alert').props.children, 'Roster rejected.');
    assert.equal(walk(h.findForm(), node => node.type === 'button').props.disabled, false);
  } finally { h.dispose(); }
});

test('pilot brief success resets once and submitting another shows a fresh form', async () => {
  const h = harness('PilotApplicationForm.tsx', 'PilotApplicationForm', {}, { organizationName: 'Example', goals: 'A scoped educational pilot.' });
  try {
    const pendingResponse = deferredFetch();
    const pending = h.findForm().props.onSubmit(h.event);
    h.clearEvent(); pendingResponse.resolve({ id: 'abcdef12', status: 'submitted' });
    await pending;
    assert.equal(h.reads, 1);
    assert.equal(h.target.resets, 1);
    assert.ok(walk(h.render(), node => node.props.className === 'pilot-application-success'));
    walk(h.render(), node => node.type === 'button').props.onClick();
    assert.ok(h.findForm());
    assert.equal(walk(h.render(), node => node.props.role === 'alert'), null);
  } finally { h.dispose(); }
});

test('pilot network failure retains draft and shows error', async () => {
  const h = harness('PilotApplicationForm.tsx', 'PilotApplicationForm', {}, { organizationName: 'Example', goals: 'A scoped educational pilot.' });
  try {
    const pendingResponse = deferredFetch();
    const pending = h.findForm().props.onSubmit(h.event);
    h.clearEvent(); pendingResponse.reject(new Error('Network unavailable.'));
    await pending;
    assert.equal(h.target.resets, 0);
    assert.equal(h.target.fields.goals, 'A scoped educational pilot.');
    assert.equal(walk(h.render(), node => node.props.role === 'alert').props.children, 'Network unavailable.');
    assert.equal(walk(h.findForm(), node => node.type === 'button').props.disabled, false);
  } finally { h.dispose(); }
});

const portfolio = { notes: [], reviews: [], completions: [] };
const resources = [{ resourceType: 'atlas', resourceId: 'head::native', label: 'Head' }];

for (const [position, expectedAction, bodyKey] of [[0, 'save-note', 'body'], [1, 'schedule-review', 'prompt']]) {
  test(`${expectedAction} backend rejection keeps the draft and resource identity`, async () => {
    const h = harness('LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: portfolio, resources },
      { resource: 'atlas::head::native', title: 'Recall', [bodyKey]: 'Private learning text', intervalDays: '7' });
    try {
      let payload;
      globalThis.fetch = (_url, options) => { payload = JSON.parse(options.body); return Promise.resolve({ ok: false, json: async () => ({ error: 'Save rejected.' }) }); };
      h.findForm(position).props.onSubmit(h.event);
      h.clearEvent();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(payload.action, expectedAction);
      assert.equal(payload.resourceType, 'atlas');
      assert.equal(payload.resourceId, 'head::native');
      assert.equal(h.target.resets, 0);
      assert.equal(h.target.fields[bodyKey], 'Private learning text');
      assert.equal(walk(h.render(), node => node.props.role === 'alert').props.children, 'Save rejected.');
      assert.equal(walk(h.findForm(position), node => node.type === 'button').props.disabled, false);
    } finally { h.dispose(); }
  });
}

test('portfolio note success resets once and complete-review payload remains unchanged', async () => {
  const h = harness('LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: { ...portfolio, reviews: [{ id: 'review-1', resourceType: 'atlas', resourceId: 'head::native', title: 'Recall', prompt: 'Prompt', dueAt: '2026-10-15', intervalDays: 7, status: 'due', updatedAt: '2026-10-15' }] }, resources },
    { resource: 'atlas::head::native', title: 'Recall', body: 'Private learning text' });
  try {
    const payloads = [];
    globalThis.fetch = (_url, options) => { payloads.push(JSON.parse(options.body)); return Promise.resolve({ ok: true, json: async () => portfolio }); };
    h.findForm(0).props.onSubmit(h.event);
    h.clearEvent();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.target.resets, 1);
    assert.equal(payloads[0].resourceId, 'head::native');
    // Render a review action from the original fixture rather than the updated empty response.
    const reviewHarness = harness('LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: { ...portfolio, reviews: [{ id: 'review-1', resourceType: 'atlas', resourceId: 'head::native', title: 'Recall', prompt: 'Prompt', dueAt: '2026-10-15', intervalDays: 7, status: 'due', updatedAt: '2026-10-15' }] }, resources }, {});
    try {
      walk(reviewHarness.render(), node => node.type === 'button' && node.props.children === 'Reviewed today →').props.onClick();
      await new Promise(resolve => setImmediate(resolve));
      assert.deepEqual(payloads[1], { action: 'complete-review', reviewId: 'review-1' });
    } finally { reviewHarness.dispose(); }
  } finally { h.dispose(); }
});

for (const [file, exportName, props, fields, formPosition] of [
  ['InstitutionPeopleManager.tsx', 'InstitutionPeopleManager', { initialSnapshot: people }, { roster: 'learner@example.edu,learner', validDays: '14' }, 0],
  ['PilotApplicationForm.tsx', 'PilotApplicationForm', {}, { organizationName: 'Example', goals: 'A scoped educational pilot.' }, 0],
  ['LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: portfolio, resources }, { resource: 'atlas::head::native', title: 'Recall', body: 'Private learning text' }, 0],
]) {
  test(`${exportName} malformed response retains draft and clears busy state`, async () => {
    const h = harness(file, exportName, props, fields);
    try {
      globalThis.fetch = async () => ({ ok: true, json: async () => { throw new SyntaxError('Malformed response.'); } });
      h.findForm(formPosition).props.onSubmit(h.event);
      h.clearEvent();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(h.target.resets, 0);
      assert.deepEqual(h.target.fields, fields);
      assert.equal(walk(h.render(), node => node.props.role === 'alert').props.children, 'Malformed response.');
      assert.equal(walk(h.findForm(formPosition), node => node.type === 'button').props.disabled, false);
    } finally { h.dispose(); }
  });
}

test('portfolio note network failure retains draft', async () => {
  const fields = { resource: 'atlas::head::native', title: 'Recall', body: 'Private learning text' };
  const h = harness('LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: portfolio, resources }, fields);
  try {
    globalThis.fetch = async () => { throw new Error('Network unavailable.'); };
    h.findForm().props.onSubmit(h.event);
    h.clearEvent();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.target.resets, 0);
    assert.deepEqual(h.target.fields, fields);
    assert.equal(walk(h.render(), node => node.props.role === 'alert').props.children, 'Network unavailable.');
    assert.equal(walk(h.findForm(), node => node.type === 'button').props.disabled, false);
  } finally { h.dispose(); }
});

for (const [file, exportName, props, fields, position, failure] of [
  ['InstitutionPeopleManager.tsx', 'InstitutionPeopleManager', { initialSnapshot: people }, { roster: 'learner@example.edu,learner', validDays: '14' }, 0, 'network'],
  ['PilotApplicationForm.tsx', 'PilotApplicationForm', {}, { organizationName: 'Example', goals: 'Keep this draft.' }, 0, 'backend'],
  ['LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: portfolio, resources }, { resource: 'atlas::head::native', title: 'Recall', prompt: 'Keep this prompt.', intervalDays: '7' }, 1, 'network'],
  ['LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: portfolio, resources }, { resource: 'atlas::head::native', title: 'Recall', prompt: 'Keep this prompt.', intervalDays: '7' }, 1, 'malformed'],
]) {
  test(`${exportName} form ${position} ${failure} failure preserves its draft`, async () => {
    const h = harness(file, exportName, props, fields);
    try {
      globalThis.fetch = async () => {
        if (failure === 'network') throw new Error('Network unavailable.');
        return { ok: failure !== 'backend', json: async () => {
          if (failure === 'malformed') throw new SyntaxError('Malformed response.');
          return { error: 'Request rejected.' };
        }};
      };
      h.findForm(position).props.onSubmit(h.event); h.clearEvent();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(h.target.resets, 0); assert.deepEqual(h.target.fields, fields);
      assert.ok(walk(h.render(), node => node.props.role === 'alert'));
      assert.equal(walk(h.findForm(position), node => node.type === 'button').props.disabled, false);
    } finally { h.dispose(); }
  });
}

test('portfolio review success resets once only after the saved response', async () => {
  const fields = { resource: 'atlas::head::native', title: 'Recall', prompt: 'Keep this prompt.', intervalDays: '7' };
  const h = harness('LearnerPortfolio.tsx', 'LearnerPortfolio', { initialPortfolio: portfolio, resources }, fields);
  try {
    const response = deferredFetch();
    h.findForm(1).props.onSubmit(h.event); h.clearEvent();
    assert.equal(h.target.resets, 0);
    assert.equal(walk(h.findForm(1), node => node.type === 'button').props.disabled, true);
    response.resolve(portfolio);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.target.resets, 1);
    assert.equal(walk(h.render(), node => node.props.role === 'alert'), null);
    assert.match(walk(h.render(), node => node.props.role === 'status').props.children, /Review item added/);
    assert.equal(walk(h.findForm(1), node => node.type === 'button').props.disabled, false);
  } finally { h.dispose(); }
});
