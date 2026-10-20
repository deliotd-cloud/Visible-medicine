/* oxlint-disable react-hooks/rules-of-hooks -- controlled component hook harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { build as componentBuild } from '../scripts/workspace-component-test-build.mjs';
import { build as materialBuild } from '../scripts/workspace-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const materialOutput = await materialBuild({
  stdin: { contents: `
    export { nestedReviewRows, nestedReviewMaterial } from './lib/nested-review-material';
    export { specimenReviewRows, specimenReviewMaterial } from './lib/specimen-review-material';
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const materials = await import('data:text/javascript;base64,' +
  Buffer.from(materialOutput.outputFiles[0].text).toString('base64'));
const componentOutput = await componentBuild({
  stdin: { contents: `
    export { NestedReviewWorkspace } from './app/review/nested/workspace';
    export { SpecimenReviewWorkspace } from './app/review/specimens/workspace';
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs',
});

function walk(node, predicate) {
  if (!React.isValidElement(node)) return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const found = walk(child, predicate);
    if (found) return found;
  }
  return null;
}

for (const kind of ['nested', 'specimen']) {
  test(`${kind}: verified next bypasses only its stale unload guard`, async () => {
    const rows = materials[`${kind}ReviewRows`];
    const group = rows.find((row) => row.surfaces.length >= 2);
    assert(group);
    const packet = await materials[`${kind}ReviewMaterial`](group.key, group.surfaces[0].id);
    assert(packet);
    const events = new Map(), pushed = [];
    let states = [], refs = [], effects = [], pending = [];
    let stateIndex = 0, refIndex = 0, effectIndex = 0;
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
      useEffect(effect, deps) {
        const index = effectIndex++, old = effects[index];
        if (!old || deps.some((value, offset) => !Object.is(value, old.deps[offset]))) {
          pending.push(() => {
            old?.cleanup?.();
            effects[index] = { deps, cleanup: effect() };
          });
        }
      },
    };
    const beforeUnload = () => {
      let prevented = false;
      events.get('beforeunload')?.({ preventDefault() { prevented = true; }, returnValue: undefined });
      return prevented;
    };
    const module = { exports: {} };
    runInNewContext(componentOutput.outputFiles[0].text, {
      module, exports: module.exports, URL, URLSearchParams, AbortController,
      TextEncoder, structuredClone, console,
      window: {
        addEventListener(name, handler) { events.set(name, handler); },
        removeEventListener(name, handler) { if (events.get(name) === handler) events.delete(name); },
        confirm() { return false; },
      },
      document: {
        addEventListener(name, handler) { events.set(name, handler); },
        removeEventListener(name, handler) { if (events.get(name) === handler) events.delete(name); },
      },
      require(name) {
        if (name === 'react') return shim;
        if (name === 'next/navigation') return { useRouter: () => ({
          push(href) { pushed.push({ href, blocked: beforeUnload() }); },
        }) };
        return require(name);
      },
    });
    const Component = module.exports[kind === 'nested'
      ? 'NestedReviewWorkspace' : 'SpecimenReviewWorkspace'];
    const render = () => {
      stateIndex = refIndex = effectIndex = 0;
      const tree = Component({ rows, packet, invalid: false });
      const scheduled = pending; pending = [];
      scheduled.forEach((effect) => effect());
      return tree;
    };
    let tree = render();
    let editor = walk(tree, (node) => typeof node.props.onApprovedNext === 'function');
    assert(editor);
    editor.props.onDirty(true);
    tree = render();
    editor = walk(tree, (node) => typeof node.props.onApprovedNext === 'function');
    assert.equal(beforeUnload(), true, 'ordinary dirty navigation still warns');
    editor.props.onApprovedNext();
    assert.equal(pushed.length, 1);
    assert.equal(pushed[0].blocked, false, 'verified approval does not show stale warning');
    assert.equal(beforeUnload(), false);
    let skippedWithoutConfirm = false;
    events.get('click')?.({
      target: { closest: () => ({ target: '', hasAttribute: () => false }) },
      preventDefault() { skippedWithoutConfirm = true; },
      stopPropagation() {},
    });
    assert.equal(skippedWithoutConfirm, true, 'ordinary links retain their dirty guard');
    editor.props.onEdited();
    assert.equal(beforeUnload(), true, 'a new edit restores the warning');
    const oldNext = editor.props.onApprovedNext;
    const searchId = kind === 'nested' ? 'nested-review-search' : 'specimen-review-search';
    const search = walk(tree, (node) => node.props.id === searchId);
    assert(search);
    search.props.onChange({ target: { value: 'NO_MATCH_AT_ALL' } });
    render();
    oldNext();
    assert.equal(pushed.length, 1, 'retired queue callback cannot navigate');
    effects.forEach((effect) => effect.cleanup?.());
  });
}
