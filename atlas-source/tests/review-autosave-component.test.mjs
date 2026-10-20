/* oxlint-disable react-hooks/rules-of-hooks -- controlled component hook harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from '../scripts/workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const output = await build({
  entryPoints: ['app/review/body/body-decision-editor.tsx'],
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const hash = 'a'.repeat(64);
const checklist = [{ id: 'criterion', label: 'Exact source check' }];
const payload = {
  scope: 'private-to-signed-in-user', track: 'geometry',
  context: {
    catalogScope: 'body-display-catalog', structureId: 'body-1',
    structureName: 'Body', materialHash: hash, sourceHash: hash,
    teachingHash: hash, rendererHash: hash, checklistVersion: 'body-review-1',
    teachingTabs: [],
    revisions: { geometry: hash, teaching: hash, imaging: null },
    blockers: { geometry: [], teaching: [], imaging: ['Unavailable'] },
    checklists: { geometry: checklist, teaching: checklist, imaging: checklist },
  },
  reviews: [], history: [], nextBefore: null,
};
let states = [], refs = [], effects = [], pending = [];
let stateIndex = 0, refIndex = 0, effectIndex = 0, nextTimer = 0;
const timers = new Map(), writes = [];
const shim = {
  ...React,
  useState(initial) {
    const index = stateIndex++;
    if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
    return [states[index], (value) => {
      states[index] = typeof value === 'function' ? value(states[index]) : value;
    }];
  },
  useRef(initial) {
    const index = refIndex++;
    if (!(index in refs)) refs[index] = { current: initial };
    return refs[index];
  },
  useEffect(effect, dependencies) {
    const index = effectIndex++, old = effects[index];
    if (!old || dependencies.some((value, offset) => !Object.is(value, old.dependencies[offset]))) {
      pending.push(() => {
        old?.cleanup?.();
        effects[index] = { dependencies, cleanup: effect() };
      });
    }
  },
};
const module = { exports: {} };
runInNewContext(output.outputFiles[0].text, {
  module, exports: module.exports, process: { env: { NODE_ENV: 'test' } },
  require(name) { return name === 'react' ? shim : require(name); },
  URL, AbortController, TextEncoder, structuredClone, console,
  setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
  fetch(_url, options) {
    if (options?.method === 'POST') {
      writes.push(JSON.parse(options.body));
      return Promise.resolve(new Response(JSON.stringify({ error: 'conflict' }), { status: 409 }));
    }
    return Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }));
  },
});
function render() {
  stateIndex = refIndex = effectIndex = 0;
  const tree = module.exports.BodyDecisionEditor({
    id: 'body-1', materialHash: hash, onDirty() {},
  });
  const scheduled = pending; pending = [];
  scheduled.forEach((effect) => effect());
  return tree;
}
function find(node, predicate) {
  if (!React.isValidElement(node)) return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}
async function settle() { await new Promise((resolve) => setImmediate(resolve)); }

test('body editor debounces only touched draft and locks after an uncertain save', async () => {
  render();
  await settle();
  let tree = render();
  assert.equal(timers.size, 0, 'loading and untouched profile never autosave');
  const fields = find(tree, (node) => node.type === module.exports.BodyDecisionFields);
  assert(fields);
  fields.props.change({ notes: 'Source-specific correction note' });
  tree = render();
  assert.equal(timers.size, 1);
  const teaching = find(tree, (node) => typeof node.props.onClick === 'function' &&
    node.props['aria-pressed'] === false && node.props.children?.[0] === 'Teaching copy');
  assert(teaching);
  teaching.props.onClick();
  tree = render();
  assert.equal(timers.size, 0, 'other untouched track never inherits dirty autosave');
  const geometry = find(tree, (node) => typeof node.props.onClick === 'function' &&
    node.props['aria-pressed'] === false && node.props.children?.[0] === '3D anatomy');
  assert(geometry);
  geometry.props.onClick();
  render();
  assert.equal(timers.size, 1);
  const timer = [...timers.values()][0];
  assert.equal(timer.delay, 2500);
  timer.callback();
  await settle();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].track, 'geometry');
  assert.equal(writes[0].draft.status, 'draft');
  assert.equal(writes[0].draft.attested, false);
  assert.equal(writes[0].draft.notes, 'Source-specific correction note');
  render();
  assert.equal(timers.size, 0, 'failed write cannot arm a second autosave');
  effects.forEach((effect) => effect.cleanup?.());
});
