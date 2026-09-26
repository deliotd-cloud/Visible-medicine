/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url), React = require('react');
let states, cursor, effect, calls;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
  useEffect(fn) { effect = fn; },
};
const built = await build({ stdin: { contents: "export { ClinicalReviewResults } from './app/review/overview/results';",
  resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'cjs' });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, AbortController,
  fetch(url, options) { return new Promise((resolve, reject) => calls.push({ url, options, resolve, reject })); },
  require: name => name === 'react' ? shim : name === 'next/link' ? () => null : require(name),
});
const { ClinicalReviewResults } = scope.exports;
const entry = { key: 'body:a', name: 'Synthetic selection', context: 'Synthetic model', laterality: 'left',
  href: '/review/body?structure=a', id: 'a', scope: 'body' };
const props = { entries: [entry], query: '?scope=body' };
const walk = (node, predicate, result = []) => {
  if (React.isValidElement(node)) { if (predicate(node)) result.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, result)); }
  return result;
};
const text = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const render = () => { cursor = 0; return ClinicalReviewResults(props); };
const reset = () => { states = []; calls = []; render(); return effect(); };
const settle = () => new Promise(resolve => setImmediate(resolve));
const response = (geometry = 'approval-recorded') => ({ ok: true, status: 200, async json() {
  return { scope: 'private-to-signed-in-user', items: [{ key: entry.key, geometry, teaching: 'changes-required' }] }; } });

test('loading is not unreviewed, successful status is explicit and refresh clears old snapshot', async () => {
  let cleanup = reset();
  assert(text(render()).includes('Status not loaded'));
  assert(!text(render()).includes('Not started'));
  assert.equal(calls[0].url, '/api/review-overview?scope=body');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.credentials, 'same-origin');
  calls[0].resolve(response()); await settle();
  const tree = render();
  assert(text(tree).includes('Anatomy: Approval recorded'));
  assert(text(tree).includes('Teaching: Changes required'));
  assert(text(tree).includes('not institutional or publication approval'));
  assert.equal(walk(tree, n => n.props.href === entry.href).length, 1);
  walk(tree, n => n.type === 'button')[0].props.onClick();
  assert.equal(states[0], 1);
  cleanup(); render(); cleanup = effect();
  assert(!text(render()).includes('Anatomy: Approval recorded'));
  calls[1].resolve(response('re-review')); await settle();
  assert(text(render()).includes('Anatomy: Re-review required'));
  cleanup();
});

test('signed-out, failed and mismatched responses do not imply empty history', async () => {
  for (const result of [{ ok: false, status: 401 }, { ok: false, status: 503 },
    { ok: true, status: 200, async json() { return { scope: 'public', items: [] }; } }]) {
    const cleanup = reset(); calls[0].resolve(result); await settle();
    const tree = render();
    assert(!text(tree).includes('Not started'));
    assert(text(tree).includes(result.status === 401 ? 'Sign in through a review workspace' : 'Saved status is unavailable'));
    assert.equal(walk(tree, n => n.type === 'button')[0].props.disabled, false);
    cleanup();
  }
});

test('unmount and slower superseded responses cannot restore obsolete approvals', async () => {
  let cleanup = reset();
  const old = calls[0]; cleanup();
  assert(old.options.signal.aborted);
  render(); cleanup = effect();
  calls[1].resolve(response('changes-required')); await settle();
  old.resolve(response()); await settle();
  assert(text(render()).includes('Anatomy: Changes required'));
  assert(!text(render()).includes('Anatomy: Approval recorded'));
  cleanup();
});

test('a response cancelled during body parsing cannot commit its results', async () => {
  const cleanup = reset(); let finish;
  calls[0].resolve({ ok: true, status: 200, json: () => new Promise(resolve => { finish = resolve; }) });
  await settle(); cleanup();
  finish(await response().json()); await settle();
  assert(!text(render()).includes('Anatomy: Approval recorded'));
});
