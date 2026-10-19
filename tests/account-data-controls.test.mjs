import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const source = readFileSync(new URL('../components/AccountDataControls.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;

function walk(node, predicate) {
  if (Array.isArray(node)) {
    for (const child of node) { const found = walk(child, predicate); if (found) return found; }
    return null;
  }
  if (!node?.props) return null;
  if (predicate(node)) return node;
  return walk(node.props.children, predicate);
}

function harness() {
  const originals = { FormData: globalThis.FormData, fetch: globalThis.fetch };
  const states = []; let cursor = 0; let refreshes = 0;
  const hooks = { ...React, useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  }};
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    name => {
      if (name === 'react') return hooks;
      if (name === 'next/navigation') return { useRouter: () => ({ refresh: () => refreshes++ }) };
      if (name === 'react/jsx-runtime') return require(name);
      throw new Error(`Unexpected account-form dependency: ${name}`);
    },
    module, module.exports,
  );
  globalThis.FormData = class {
    constructor(form) { assert.ok(form?.fields, 'FormData receives the original form'); this.form = form; }
    *[Symbol.iterator]() { yield* Object.entries(this.form.fields); }
  };
  const form = {
    fields: { requestType: 'correction', detail: 'Please correct my education record.' },
    resets: 0,
    reset() { this.resets++; this.fields.requestType = 'correction'; this.fields.detail = ''; },
  };
  let currentTarget = form; let reads = 0; let prevented = 0;
  const event = { preventDefault() { prevented++; }, get currentTarget() { reads++; return currentTarget; } };
  const render = () => { cursor = 0; return module.exports.AccountDataControls({ existingRequests: [] }); };
  const submit = () => walk(render(), node => node.type === 'form').props.onSubmit(event);
  const feedback = () => walk(render(), node => node.props.role === 'alert' || node.props.role === 'status');
  const button = () => walk(render(), node => node.type === 'button');
  return { form, submit, feedback, button, event, clearEvent() { currentTarget = null; },
    get reads() { return reads; }, get prevented() { return prevented; },
    get refreshes() { return refreshes; },
    dispose() { globalThis.FormData = originals.FormData; globalThis.fetch = originals.fetch; },
  };
}

test('successful async account request resets its original form once after the event target clears', async () => {
  const h = harness();
  try {
    let complete;
    globalThis.fetch = (url, options) => {
      assert.equal(url, '/api/learner/data');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), h.form.fields);
      return new Promise(resolve => { complete = resolve; });
    };
    const pending = h.submit();
    assert.equal(h.prevented, 1);
    assert.equal(h.button().props.disabled, true);
    assert.equal(h.button().props.children, 'Recording…');
    h.clearEvent();
    complete({ ok: true, json: async () => ({ request: { id: 'abcdef12' }, requests: [] }) });
    await pending;
    assert.equal(h.reads, 1, 'currentTarget is captured before awaiting');
    assert.equal(h.form.resets, 1);
    assert.equal(h.form.fields.detail, '');
    assert.equal(h.refreshes, 1);
    assert.equal(h.feedback().props.role, 'status');
    assert.match(h.feedback().props.children, /ABCDEF12 recorded/);
    assert.equal(h.button().props.disabled, false);
  } finally { h.dispose(); }
});

test('backend rejection retains draft and clears busy feedback without refresh', async () => {
  const h = harness();
  try {
    let complete;
    globalThis.fetch = () => new Promise(resolve => { complete = resolve; });
    const pending = h.submit();
    h.clearEvent();
    complete({ ok: false, json: async () => ({ error: 'Review unavailable.' }) });
    await pending;
    assert.equal(h.form.resets, 0);
    assert.equal(h.form.fields.detail, 'Please correct my education record.');
    assert.equal(h.refreshes, 0);
    assert.equal(h.feedback().props.role, 'alert');
    assert.equal(h.feedback().props.children, 'Review unavailable.');
    assert.equal(h.button().props.disabled, false);
  } finally { h.dispose(); }
});

test('network rejection retains draft and clears busy feedback without refresh', async () => {
  const h = harness();
  try {
    let fail;
    globalThis.fetch = () => new Promise((_, reject) => { fail = reject; });
    const pending = h.submit();
    h.clearEvent();
    fail(new Error('Network unavailable.'));
    await pending;
    assert.equal(h.form.resets, 0);
    assert.equal(h.form.fields.detail, 'Please correct my education record.');
    assert.equal(h.refreshes, 0);
    assert.equal(h.feedback().props.role, 'alert');
    assert.equal(h.feedback().props.children, 'Network unavailable.');
    assert.equal(h.button().props.disabled, false);
  } finally { h.dispose(); }
});
