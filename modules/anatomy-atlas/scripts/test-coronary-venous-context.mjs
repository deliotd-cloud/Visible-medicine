import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import raw from '../public/models/bodyparts3d/full-body/catalog.json' with { type: 'json' };
import { bodyDisplayCatalog } from '../lib/body-display-catalog.ts';
import { coronaryVenousCatalog, coronaryVenousFor } from '../lib/coronary-venous.ts';
import {
  coronaryVenousContextFor,
  coronaryVenousContextViewCatalog,
  coronaryVenousContextMaterial,
  coronaryVenousContextCopy,
} from '../lib/coronary-venous-context.ts';
import { coronaryVenousPresets } from '../lib/coronary-venous.ts';
import { initialVentricles, reduceVentricles } from '../lib/ventricles.ts';

const root = bodyDisplayCatalog(raw);
const parent = root.structures.find((s) => s.fmaId === 'FMA7088');
assert(parent);
const context = coronaryVenousContextFor(parent, root);
assert.deepEqual(context.map((s) => s.fmaId), ['FMA76767', 'FMA4707', 'FMA4713']);
assert.deepEqual(context.map((s) => s.sources.map((f) => f.file)),
  [['FJ2725', 'FJ2730'], ['FJ2656'],
    ['FJ2678', 'FJ2679', 'FJ2680', 'FJ2681', 'FJ2682', 'FJ2683',
      'FJ2684', 'FJ2685', 'FJ2686', 'FJ2687', 'FJ2688', 'FJ2689', 'FJ2690', 'FJ2691']]);
const children = coronaryVenousFor(parent);
assert.deepEqual(children.map((s) => s.fmaId), ['FMA4706', 'FMA4714']);
assert.deepEqual(coronaryVenousCatalog.contextIds, []);
const files = [...children, ...context].flatMap((s) => s.sources.map((f) => f.file));
assert.equal(new Set(files).size, files.length, 'Root context may not duplicate a nested source');
const shown = coronaryVenousContextViewCatalog(parent, true, root);
assert.deepEqual(shown.structures.map((s) => s.id),
  [...children, ...context].map((s) => s.id));
assert.deepEqual(shown.contextIds, context.map((s) => s.id));
assert(!shown.structures.some((s) => s.id === parent.id), 'Heart aggregate excluded');
assert.deepEqual(coronaryVenousContextViewCatalog(parent, false, root), coronaryVenousCatalog);
const material = coronaryVenousContextMaterial(parent, root);
assert(material);
assert.deepEqual(material.structures, context);
assert.equal(material.copy.guide, coronaryVenousContextCopy.guide);
assert.equal(material.parentBundle.id, parent.bundle);
assert.equal(material.license, root.license);
const detached = coronaryVenousContextFor(parent, root);
detached[0].sources[0].sha256 = '0'.repeat(64);
assert.deepEqual(coronaryVenousContextFor(parent, root), context,
  'Caller mutation cannot change pinned context');
for (const bundle of [...material.bundles, material.parentBundle]) {
  const bytes = await readFile('public' + new URL(bundle.url, 'https://atlas.invalid').pathname);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
for (const mutate of [
  (catalog) => { catalog.structures.find((s) => s.fmaId === 'FMA4707').sources[0].sha256 = '0'.repeat(64); },
  (catalog) => { catalog.structures.find((s) => s.fmaId === 'FMA76767').sources.pop(); },
  (catalog) => { catalog.structures.find((s) => s.fmaId === 'FMA4713').name += ' changed'; },
  (catalog) => { catalog.bundles.find((b) => b.id === 'thorax-vessels-recovery').sha256 = '0'.repeat(64); },
  (catalog) => { catalog.bundles.find((b) => b.id === 'anterior-cardiac-vein').bytes++; },
  (catalog) => { catalog.bundles.find((b) => b.id === parent.bundle).sha256 = '0'.repeat(64); },
  (catalog) => { catalog.bundles.push(structuredClone(material.parentBundle)); },
  (catalog) => { catalog.license = 'other'; },
  (catalog) => { catalog.credit = 'other'; },
  (catalog) => { catalog.structures.find((s) => s.id === parent.id).sources.pop(); },
  (catalog) => { catalog.coordinateSystem.unitsPerMillimetre = 2; },
  (catalog) => { catalog.structures.push(structuredClone(context[0])); },
]) {
  const altered = structuredClone(root);
  mutate(altered);
  assert.deepEqual(coronaryVenousContextFor(parent, altered), []);
  assert.equal(coronaryVenousContextMaterial(parent, altered), null);
  assert.deepEqual(coronaryVenousContextViewCatalog(parent, true, altered),
    coronaryVenousCatalog);
}
for (const mutate of [
  (p) => { p.sources[0].sha256 = '0'.repeat(64); },
  (p) => { p.id += '-other'; },
  (p) => { p.bounds.min[0] += 0.1; },
]) {
  const altered = structuredClone(parent);
  mutate(altered);
  assert.deepEqual(coronaryVenousContextFor(altered, root), []);
}
const presets = coronaryVenousPresets(children);
let state = initialVentricles(children);
for (const action of [
  { type: 'visibility', id: children[0].id, visible: false },
  { type: 'select', id: children[1].id },
  { type: 'undo' }, { type: 'redo' },
  { type: 'preset', value: 'all' },
]) {
  state = reduceVentricles(children, state, action, presets);
  assert(!state.hidden.some((id) => context.some((s) => s.id === id)));
}
assert.deepEqual(state.hidden, []);

// Exercise the actual workbench callbacks with controlled hooks and no GPU mount.
const require = createRequire(import.meta.url), React = require('react');
const actualLink = await import('vinext/shims/link');
const built = await build({
  stdin: {
    contents: "export { VentricularView } from './app/ventricles';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'gpu-boundary', setup(builder) {
    builder.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
      contents: 'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',
      loader: 'tsx',
    }));
  } }],
});
let slots = [], cursor = 0;
const useState = (initial) => {
  const i = cursor++;
  if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
  return [slots[i], (next) => {
    slots[i] = typeof next === 'function' ? next(slots[i]) : next;
  }];
};
const shim = {
  ...React, useState,
  useReducer: (reduce, initial, init) => {
    const [value, set] = useState(() => init ? init(initial) : initial);
    return [value, (action) => set((prior) => reduce(prior, action))];
  },
  useRef: (value) => useState(() => ({ current: value }))[0],
  useMemo: (fn) => fn(), useCallback: (fn) => fn,
  useEffect: () => {}, useLayoutEffect: () => {},
};
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: scope, exports: scope.exports,
  require: (id) => id === 'react' ? shim
    : id === 'next/link' ? { __esModule: true, ...actualLink } : require(id),
  structuredClone, requestAnimationFrame: (fn) => fn(),
});
const nodes = (value) => !value || typeof value !== 'object' ? []
  : Array.isArray(value) ? value.flatMap(nodes)
    : [value, ...nodes(value.props?.children)];
const label = (value) => typeof value === 'string' ? value
  : !value ? '' : Array.isArray(value) ? value.map(label).join('')
    : label(value.props?.children);
let tree;
const render = () => {
  cursor = 0;
  tree = scope.exports.VentricularView({
    parent, educationCatalog: root, study: 'coronary-venous',
  });
};
const scene = () => nodes(tree).find((n) => n.props?.onRendererHealth)?.props;
const button = (name) => nodes(tree).find((n) =>
  n.props?.onClick && label(n) === name)?.props;
render();
assert.deepEqual(Array.from(scene().structures, (s) => s.id),
  children.map((s) => s.id));
assert.equal(scene().contextIds.length, 0);
assert.equal(scene().landmarks.length, 2);
assert(button(coronaryVenousContextCopy.button));
button(coronaryVenousContextCopy.button).onClick(); render();
assert.deepEqual(Array.from(scene().contextIds), context.map((s) => s.id));
assert.equal(scene().structures.length, 5);
assert.equal(scene().landmarks.length, 2, 'Context never becomes selectable');
const selectedBefore = scene().selectedId;
scene().onSelect(context[0].id); render();
assert.equal(scene().selectedId, selectedBefore, 'Context pick ignored');
assert(label(tree).includes(coronaryVenousContextCopy.guide));
const childSwitch = nodes(tree).find((n) => n.props?.onCheckedChange &&
  n.props?.['aria-label'] === `Show ${children[0].name.toLowerCase()}`)?.props;
assert(childSwitch);
childSwitch.onCheckedChange(false); render();
assert(scene().hiddenIds.includes(children[0].id));
assert.equal(scene().contextIds.length, 3);
button('Undo layers').onClick(); render();
assert(!scene().hiddenIds.includes(children[0].id));
button('Redo layers').onClick(); render();
assert(scene().hiddenIds.includes(children[0].id));
button('Reassemble').onClick(); render();
assert(!scene().hiddenIds.includes(children[0].id));
assert.equal(scene().contextIds.length, 3);
const slider = () => nodes(tree).find((n) => n.props?.['aria-label'] ===
  'Coronary venous separation')?.props;
assert(slider());
slider().onValueChange([25]); render();
assert.equal(scene().contextIds.length, 0, 'Context absent while separated');
slider().onValueChange([0]); render();
assert.equal(scene().contextIds.length, 3, 'Context restored at zero');
button('Reassemble').onClick(); render();
assert.equal(scene().contextIds.length, 3);
button(coronaryVenousContextCopy.button).onClick(); render();
assert.equal(scene().contextIds.length, 0);
assert.equal(scene().structures.length, 2);
console.log(JSON.stringify({
  passed: true, context: 3, children: 2, sourceFiles: files.length,
  bundleHashesChecked: material.bundles.length + 1,
  rejectionCases: 15, actualHandlerWiring: true, clinicalApproval: false,
}));
