import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const actualLink = await import('vinext/shims/link');
const built = await build({
  stdin: { contents: `export { EyeLayerView } from './app/eye-layers';
    export { VentricularView } from './app/ventricles';
    export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { eyeLayersFor } from './lib/eye-layers';
    export { ventriclesFor } from './lib/ventricles';
    export { eyeLayerGuide } from './lib/eye-layer-guide';
    export { ventricularGuide } from './lib/ventricular-guide';
    export { guidedPlaybackDuration, guidedSweepDuration, isGuidedPlaybackRate } from './lib/guided-playback';
    export { default as raw } from './public/models/bodyparts3d/full-body/catalog.json';`,
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'controlled-nested-boundaries', setup(api) {
    api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
      contents: 'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};', loader: 'tsx',
    }));
    api.onLoad({ filter: /nested-teaching\.tsx$/ }, () => ({
      contents: 'export const NestedTeaching=()=>null;', loader: 'tsx',
    }));
    api.onLoad({ filter: /nested-education-link\.ts$/ }, () => ({
      contents: 'export const useNestedEducationLink=options=>globalThis.education.use(options);', loader: 'ts',
    }));
  } }],
});

let slots = [], cursor = 0, after = [];
const state = value => { const index = cursor++;
  if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
  return [slots[index], next => slots[index] = typeof next === 'function' ? next(slots[index]) : next];
};
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const memo = (fn, deps) => { const index = cursor++;
  if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { deps, value: fn() };
  return slots[index].value;
};
const effect = (fn, deps) => { const index = cursor++;
  if (!sameDeps(slots[index]?.deps, deps)) {
    slots[index]?.cleanup?.(); slots[index] = { deps };
    after.push(() => slots[index].cleanup = fn());
  }
};
const shim = { ...React, useContext: () => null, useState: state, useMemo: memo,
  useCallback: (fn, deps) => memo(() => fn, deps),
  useRef: value => state(() => ({ current: value }))[0],
  useEffect: effect, useLayoutEffect: effect,
  useReducer: (reduce, arg, init) => { const [value, set] = state(() => init ? init(arg) : arg);
    return [value, action => set(old => reduce(old, action))]; },
};
const education = { use() { return { adapter: null, publish() {} }; } };
const events = new Map();
const preference = { matches: false,
  addEventListener: (name, fn) => events.set(`motion:${name}`, fn),
  removeEventListener: name => events.delete(`motion:${name}`),
};
const document = { hidden: false,
  addEventListener: (name, fn) => events.set(name, fn),
  removeEventListener: name => events.delete(name),
};
const timers = new Map(); let timerSerial = 0;
const window = { matchMedia: () => preference,
  setTimeout(fn, delay) { const id = ++timerSerial; timers.set(id, { fn, delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
  addEventListener: (name, fn) => events.set(`window:${name}`, fn),
  removeEventListener: name => events.delete(`window:${name}`),
};
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : id === 'next/link' ? { __esModule: true, ...actualLink } : require(id),
  education, structuredClone, window, document,
});
const api = scope.exports;
const nodes = node => !node || typeof node !== 'object' ? [] :
  Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) :
  !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const catalog = api.bodyDisplayCatalog(api.raw);

for (const value of [0.5, 1, 1.5, 2, 3]) assert(api.isGuidedPlaybackRate(value));
for (const value of ['2', 0, 0.75, 4, Infinity, NaN, null, undefined, {}])
  assert(!api.isGuidedPlaybackRate(value), `Invalid rate ${String(value)} rejected`);

const cases = [
  { name: 'eye', view: api.EyeLayerView,
    parent: catalog.structures.find(item => api.eyeLayersFor(item).length), guide: api.eyeLayerGuide,
    ready: scene => { scene.onLoaded(); scene.onRendererHealth('ready'); } },
  { name: 'ventricular', view: api.VentricularView,
    parent: catalog.structures.find(item => api.ventriclesFor(item).length === 4), guide: api.ventricularGuide,
    ready: scene => { for (const bundle of scene.catalog.bundles) scene.onLoaded(bundle.id);
      scene.onRendererHealth('ready'); } },
];

for (const testCase of cases) {
  assert(testCase.parent, `${testCase.name} parent exists`);
  slots = []; events.clear(); timers.clear(); preference.matches = false; document.hidden = false;
  let tree;
  const render = () => { cursor = 0; after = [];
    tree = testCase.view({ parent: testCase.parent, educationCatalog: catalog });
    after.forEach(fn => fn());
  };
  const scene = () => nodes(tree).find(node => node.props?.onRendererHealth)?.props;
  const button = label => nodes(tree).find(node => node.props?.onClick && text(node).trim() === label)?.props;
  const speed = () => nodes(tree).find(node => node.type?.name === 'TourSpeedControl')?.props;
  const currentTimer = () => [...timers.values()][0];
  render(); render(); testCase.ready(scene()); render();
  assert.equal(speed()?.rate, 1, `${testCase.name} default is 1x`);
  const guide = testCase.guide(testCase.parent);
  speed().onRateChange('2'); render();
  assert.equal(speed().rate, 1, `${testCase.name} rejects nonnumeric rate`);
  speed().onRateChange(2); render();
  assert.equal(speed().rate, 2, `${testCase.name} idle rate changes`);
  button('Play full tour').onClick(); render();
  assert.equal(currentTimer().delay, api.guidedPlaybackDuration(guide.steps[0].caption, 0, 2));
  assert.equal(scene().transitionMs, api.guidedSweepDuration(2));
  const selected = scene().selectedId;
  const staleTimer = currentTimer();
  speed().onRateChange(3); render();
  assert.equal(speed().rate, 3);
  assert.equal(scene().selectedId, selected, `${testCase.name} rate preserves current stop`);
  assert.equal(timers.size, 1, `${testCase.name} rate replaces timer`);
  assert.equal(currentTimer().delay, api.guidedPlaybackDuration(guide.steps[0].caption, 0, 3));
  assert.equal(scene().transitionMs, api.guidedSweepDuration(3));
  staleTimer.fn(); render();
  assert.equal(scene().selectedId, selected, `${testCase.name} stale timer cannot advance`);
  assert.equal(timers.size, 1);
  button('Pause full tour').onClick(); render();
  assert.equal(timers.size, 0);
  speed().onRateChange(0.5); render();
  assert.equal(speed().rate, 0.5);
  assert.equal(timers.size, 0, `${testCase.name} paused rate does not restart`);
  assert.equal(scene().selectedId, selected);
  button('Resume full tour').onClick(); render();
  assert.equal(currentTimer().delay, api.guidedPlaybackDuration(guide.steps[0].caption, 0, 0.5));
  preference.matches = true; events.get('motion:change')(); render();
  assert.equal(timers.size, 0, `${testCase.name} reduced motion cancels timer`);
  assert.equal(scene().transitionMs, 0);
  speed().onRateChange(1.5); render();
  assert.equal(timers.size, 0, `${testCase.name} reduced motion rate cannot restart`);
  button('Resume full tour').onClick(); render();
  assert.equal(currentTimer().delay, api.guidedPlaybackDuration(guide.steps[0].caption, 0, 1.5),
    `${testCase.name} explicit reduced-motion Resume uses selected rate`);
  assert.equal(scene().transitionMs, 0, `${testCase.name} explicit reduced-motion Resume has no camera sweep`);
  currentTimer().fn(); render();
  assert.equal(scene().selectedId, guide.steps[1].selectedId,
    `${testCase.name} explicit reduced-motion Resume advances captions`);
  button('Pause full tour').onClick(); render();
  assert.equal(timers.size, 0);
  preference.matches = false; events.get('motion:change')(); render();
  assert.equal(timers.size, 0, `${testCase.name} preference reset after Pause does not auto resume`);
  button('Resume full tour').onClick(); render();
  assert.equal(timers.size, 1);
  document.hidden = true; events.get('visibilitychange')(); render();
  assert.equal(timers.size, 0, `${testCase.name} hiding pauses playback`);
  speed().onRateChange(2); render();
  assert.equal(timers.size, 0, `${testCase.name} hidden rate change does not resume`);
  document.hidden = false; events.get('visibilitychange')(); render();
  assert.equal(timers.size, 0, `${testCase.name} becoming visible does not auto resume`);
  scene().onRendererHealth('lost'); render();
  speed().onRateChange(3); render();
  assert.equal(timers.size, 0, `${testCase.name} not-ready rate change does not resume`);
  scene().onRendererHealth('ready'); render();
  assert.equal(timers.size, 0, `${testCase.name} renderer recovery does not auto resume`);
}

console.log('Nested guided tour speed: rates, active and stale timers, pause, reduced motion, visibility and readiness pass.');
