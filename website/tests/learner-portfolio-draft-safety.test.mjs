import {portfolioPagination} from './learner-portfolio-pagination-loader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const website = process.env.VISIBLE_MEDICINE_WEBSITE ?? process.cwd();
const require = createRequire(resolve(website, 'package.json'));
const ts = require('typescript');
const React = require('react');
const source = readFileSync(resolve(website, 'components/LearnerPortfolio.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const empty = { notes: [], reviews: [], completions: [] };
const resources = [{ resourceType: 'atlas', resourceId: 'head::native', label: 'Head' }];
const review = { id: 'review-1', resourceType: 'atlas', resourceId: 'head::native', title: 'Recall',
  prompt: 'Prompt', dueAt: '2026-10-15', intervalDays: 7, status: 'due', updatedAt: '2026-10-15' };
const cases = [
  { name: 'note', position: 0, action: 'save-note', textKey: 'body', fields: {
    resource: 'atlas::head::native', title: 'Recall', body: 'Private learning text' } },
  { name: 'revision', position: 1, action: 'schedule-review', textKey: 'prompt', fields: {
    resource: 'atlas::head::native', title: 'Recall', prompt: 'Private recall prompt', intervalDays: '7' } },
];

function walk(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = walk(child, predicate); if (result) return result; } return null; }
  if (!node?.props) return null;
  if (predicate(node)) return node;
  return walk(node.props.children, predicate);
}

function harness(fields = {}, initialPortfolio = empty) {
  const previous = { FormData: globalThis.FormData, fetch: globalThis.fetch };
  const states = [], refs = []; let cursor = 0;
  const hooks = { ...React,
    useEffect() {},
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '../lib/learner-portfolio-pagination') return portfolioPagination;
    if (name === '../lib/learning-draft-navigation.ts') return {registerLearningDraftGuard(){return()=>{};}};
    throw new Error(`Unexpected dependency: ${name}`);
  }, module, module.exports);
  const form = { fields: { ...fields }, resets: 0, reset() { this.resets++; this.fields = {}; } };
  globalThis.FormData = class {
    constructor(target) { assert.equal(target, form); }
    *[Symbol.iterator]() { yield* Object.entries(form.fields); }
  };
  let currentTarget = form;
  const event = { preventDefault() {}, get currentTarget() { return currentTarget; } };
  const render = () => { cursor = 0; return module.exports.LearnerPortfolio({ initialPortfolio, resources }); };
  const forms = () => {
    const found = [];
    function visit(node) {
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (!node?.props) return;
      if (node.type === 'form') found.push(node);
      visit(node.props.children);
    }
    visit(render()); return found;
  };
  return { form, event, render, forms, clearEvent() { currentTarget = null; },
    dispose() { globalThis.FormData = previous.FormData; globalThis.fetch = previous.fetch; } };
}

function delayedFetch() {
  const calls = [], pending = [];
  globalThis.fetch = (url, options) => {
    calls.push({ url, options, payload: JSON.parse(options.body) });
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  };
  return { calls,
    resolve(index, body = empty, ok = true) { pending[index].resolve({ ok, json: async () => body }); },
    reject(index, message = 'Network unavailable.') { pending[index].reject(new Error(message)); },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const status = h => walk(h.render(), node => node.props.role === 'status');
const alert = h => walk(h.render(), node => node.props.role === 'alert');

for (const scenario of cases) {
  test(`${scenario.name}: confirmed save preserves edits made during request`, async () => {
    const h = harness(scenario.fields); try {
      const api = delayedFetch();
      h.forms()[scenario.position].props.onSubmit(h.event); h.clearEvent();
      h.form.fields[scenario.textKey] = 'Newer unsaved draft';
      api.resolve(0); await settle();
      assert.equal(h.form.resets, 0);
      assert.equal(h.form.fields[scenario.textKey], 'Newer unsaved draft');
      assert.match(status(h)?.props.children ?? '', /Newer edits are still unsaved\./);
      assert.equal(alert(h), null);
    } finally { h.dispose(); }
  });

  test(`${scenario.name}: unchanged confirmed save resets once with exact payload`, async () => {
    const h = harness(scenario.fields); try {
      const api = delayedFetch();
      h.forms()[scenario.position].props.onSubmit(h.event); h.clearEvent();
      assert.equal(h.form.resets, 0);
      assert.equal(api.calls.length, 1);
      assert.equal(api.calls[0].url, '/api/learner/portfolio');
      assert.equal(api.calls[0].options.method, 'POST');
      assert.deepEqual(api.calls[0].payload, { action: scenario.action,
        ...Object.fromEntries(Object.entries(scenario.fields).filter(([key]) => key !== 'resource')),
        resourceType: 'atlas', resourceId: 'head::native' });
      api.resolve(0); await settle();
      assert.equal(h.form.resets, 1);
      assert.equal(alert(h), null);
    } finally { h.dispose(); }
  });

  test(`${scenario.name}: immediate duplicate submit sends one request`, async () => {
    const h = harness(scenario.fields); try {
      const api = delayedFetch();
      const submit = h.forms()[scenario.position].props.onSubmit;
      submit(h.event); submit(h.event); h.clearEvent();
      assert.equal(api.calls.length, 1);
      api.resolve(0); await settle();
      assert.equal(h.form.resets, 1);
    } finally { h.dispose(); }
  });

  for (const changedField of scenario.name === 'revision' ? ['resource', 'title', 'intervalDays'] : ['resource', 'title']) {
    test(`${scenario.name}: changing ${changedField} during request keeps the draft`, async () => {
      const h = harness(scenario.fields); try {
        const api = delayedFetch();
        h.forms()[scenario.position].props.onSubmit(h.event); h.clearEvent();
        const newValue = changedField === 'resource' ? 'case::other::chapter' : changedField === 'intervalDays' ? '14' : 'New draft value';
        h.form.fields[changedField] = newValue;
        api.resolve(0); await settle();
        assert.equal(h.form.resets, 0);
        assert.equal(h.form.fields[changedField], newValue);
        assert.match(status(h)?.props.children ?? '', /Newer edits are still unsaved\./);
      } finally { h.dispose(); }
    });
  }

  test(`${scenario.name}: failed request releases latch for a deliberate retry`, async () => {
    const h = harness(scenario.fields); try {
      const api = delayedFetch();
      h.forms()[scenario.position].props.onSubmit(h.event);
      api.resolve(0, { error: 'Save rejected.' }, false); await settle();
      assert.equal(h.form.resets, 0);
      h.forms()[scenario.position].props.onSubmit(h.event); h.clearEvent();
      assert.equal(api.calls.length, 2);
      assert.deepEqual(api.calls[1].payload, api.calls[0].payload);
      api.resolve(1); await settle();
      assert.equal(h.form.resets, 1);
      assert.equal(alert(h), null);
    } finally { h.dispose(); }
  });

  for (const failure of ['api', 'network', 'malformed-envelope']) {
    test(`${scenario.name}: ${failure} failure retains draft`, async () => {
      const h = harness(scenario.fields); try {
        const api = delayedFetch();
        h.forms()[scenario.position].props.onSubmit(h.event); h.clearEvent();
        if (failure === 'api') api.resolve(0, { error: 'Save rejected.' }, false);
        if (failure === 'network') api.reject(0);
        if (failure === 'malformed-envelope') api.resolve(0, { message: 'ok' });
        await settle();
        assert.equal(h.form.resets, 0);
        assert.deepEqual(h.form.fields, scenario.fields);
        assert.ok(alert(h));
        assert.equal(walk(h.forms()[scenario.position], node => node.type === 'button').props.disabled, false);
      } finally { h.dispose(); }
    });
  }
}

for (const scenario of cases) for (const [label, envelope] of [
  ['null root', null], ['array root', []], ['null note', { ...empty, notes: [null] }],
  ['object note body', { ...empty, notes: [{ id:'n',resourceType:'atlas',resourceId:'head',title:'Note',body:{private:'invalid'},updatedAt:'2026-10-16' }] }],
  ['incomplete revision', { ...empty, reviews: [{ id:'r' }] }],
  ['invalid completion', { ...empty, completions: [{ id:'c',courseSlug:'head',courseTitle:'Head',completedAt:'2026-10-16',status:'complete',percentComplete:'100',certificateCode:null,certificateTitle:null,issuedAt:null,revokedAt:null }] }],
]) test(`${scenario.name}: ${label} success response cannot replace records or clear drafts`, async () => {
  const h=harness(scenario.fields);try{
    const api=delayedFetch();h.forms()[scenario.position].props.onSubmit(h.event);h.clearEvent();
    api.resolve(0,envelope);await settle();
    assert.equal(h.form.resets,0);assert.deepEqual(h.form.fields,scenario.fields);
    assert.match(alert(h)?.props.children??'',/could not be confirmed/);
    assert.equal(walk(h.forms()[scenario.position],node=>node.type==='button').props.disabled,false);
  }finally{h.dispose();}
});

test('confirmed nonempty server records render without changing the private mutation contract',async()=>{
  const h=harness(cases[0].fields);try{
    const api=delayedFetch();h.forms()[0].props.onSubmit(h.event);h.clearEvent();
    api.resolve(0,{notes:[{id:'note-1',resourceType:'atlas',resourceId:'head::native',title:'Confirmed note',body:'Educational note',updatedAt:'2026-10-16'}],
      reviews:[review],completions:[{id:'completion-1',courseSlug:'head',courseTitle:'Head anatomy',percentComplete:100,completedAt:'2026-10-16',status:'complete',certificateCode:null,certificateTitle:null,issuedAt:null,revokedAt:null}]});
    await settle();assert.equal(h.form.resets,1);assert.equal(alert(h),null);
    assert(walk(h.render(),node=>node.type==='h4'&&node.props.children==='Confirmed note'));
    assert(walk(h.render(),node=>node.type==='h4'&&node.props.children==='Head anatomy'));
    assert.doesNotMatch(source,/localStorage|sessionStorage|sendBeacon|console\./);
  }finally{h.dispose();}
});

test('complete-review action has the same immediate submission latch', async () => {
  const h = harness({}, { ...empty, reviews: [review] }); try {
    const api = delayedFetch();
    const button = walk(h.render(), node => node.type === 'button' && node.props.children === 'Reviewed today →');
    button.props.onClick(); button.props.onClick();
    assert.equal(api.calls.length, 1);
    assert.deepEqual(api.calls[0].payload, { action: 'complete-review', reviewId: 'review-1' });
    api.resolve(0); await settle();
    assert.equal(alert(h), null);
  } finally { h.dispose(); }
});
