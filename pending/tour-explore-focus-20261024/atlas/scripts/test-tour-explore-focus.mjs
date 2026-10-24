/* oxlint-disable react-hooks/rules-of-hooks -- controlled production component harness */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const raw = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));
const built = await build({
  stdin: { contents: "export {TourExploreAttention,revealTourExploreHeading} from './app/tour-explore-attention'; export {tourExploreRequest} from './lib/tour-explore'; export {thoraxTour} from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog';", loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  plugins: [{ name: 'workspace-context-boundary', setup(api) {
    api.onLoad({ filter: /[\\/]app[\\/]atlas-workspace\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export const useAtlasWorkspace=()=>globalThis.testWorkspace;' }));
  }}],
});

function harness({ sheet = false, focusView = false, hidden = false, closedInert = false } = {}) {
  const slots = [], frames = new Map();
  let cursor = 0, serial = 0, effects = [], layouts = [];
  const calls = [];
  const documentListeners = new Map(), windowListeners = new Map();
  const eventTarget = (listeners, state = {}) => ({ ...state,
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name, listener) { if (listeners.get(name) === listener) listeners.delete(name); },
  });
  const popup = { scrollTop: 30, closed: sheet, inert: closedInert, getAttribute: () => 'right', hasAttribute(name) { return name === 'data-closed' && this.closed; }, getBoundingClientRect: () => ({ top: 0, bottom: 100 }) };
  const info = { isConnected: true, scrollTop: 30, closest(selector) { return selector === '.anatomy-controls-popup' && sheet ? popup : null; }, getBoundingClientRect: () => ({ top: 0, bottom: 100 }),
    querySelector(selector) { return selector === '[data-structure-study-heading]' ? heading : null; } };
  const root = { isConnected: true, contains: target => !sheet && target === info, closest: () => null };
  const marker = { closest: selector => selector === '.body-app' ? root : null };
  const panelMarker = { closest: selector => selector === '.body-info' ? info : null };
  const heading = {
    isConnected: true,
    closest(selector) {
      if (selector === '.body-info') return info;
      if (selector === '.anatomy-controls-popup') return sheet ? popup : null;
      if (selector === '[hidden], [inert]') return popup.inert ? popup : null;
      return null;
    },
    focus(options) { calls.push(['focus', options]); },
    getBoundingClientRect: () => ({ top: 140, bottom: 165 }),
  };
  const workspace = { mode: 'explore', focusView, panelLayout: sheet ? { info: true } : null,
    showInfo() { calls.push('showInfo'); } };
  const hook = {
    ...require('react'),
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(fn, deps) {
      const i = cursor++;
      const old = slots[i];
      if (!old || deps.some((value, j) => !Object.is(value, old.deps[j])))
        effects.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
    },
    useLayoutEffect(fn, deps) {
      const i = cursor++;
      const old = slots[i];
      if (!old || !deps || deps.some((value, j) => !Object.is(value, old.deps[j])))
        layouts.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
    },
  };
  const mod = { exports: {} };
  const context = { module: mod, exports: mod.exports,
    document: eventTarget(documentListeners, { hidden }), window: eventTarget(windowListeners), structuredClone,
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    testWorkspace: workspace,
    require(id) { if (id === 'react') return hook; return require(id); },
  };
  runInNewContext(built.outputFiles[0].text, context);
  const api = mod.exports;
  const catalog = api.bodyDisplayCatalog(structuredClone(raw));
  const request = api.tourExploreRequest(catalog, api.thoraxTour, 0);
  assert(request, 'real registered source-bound stop');
  const panelMarkerRef = { current: panelMarker };
  const props = { request, catalog, region: 'thorax', side: 'both',
    selectedId: request.selectedId, guided: false, exam: false, inlineStudy: false, panelMarkerRef };
  function render() {
    cursor = 0; effects = []; layouts = [];
    const markerNode = api.TourExploreAttention(props);
    markerNode.props.ref.current = marker;
    for (const layout of layouts) layout();
    for (const effect of effects) effect();
  }
  function tick() {
    const pending = [...frames.values()]; frames.clear();
    for (const fn of pending) fn();
  }
  return { api, props, request, heading, root, info, popup, calls, context, render, tick, frames,
    listeners: { document: documentListeners, window: windowListeners },
    emitVisibility(hiddenNow) { context.document.hidden = hiddenNow; documentListeners.get('visibilitychange')?.(); },
    emitPagehide() { windowListeners.get('pagehide')?.(); },
    retire() { for (const slot of slots) slot?.cleanup?.(); } };
}

test('production attention focuses once and scrolls only the desktop info panel', () => {
  const h = harness(); h.render(); h.tick();
  assert.equal(h.calls.filter(call => Array.isArray(call)).length, 1);
  assert.equal(h.calls[0][1].preventScroll, true);
  assert.equal(h.info.scrollTop, 158);
  h.render(); h.tick();
  assert.equal(h.calls.length, 1, 'no duplicate focus after rerender');
  h.retire();
});

test('compact or focus sheet opens before targeting its own scroller', () => {
  const h = harness({ sheet: true, focusView: true, closedInert: true }); h.render(); h.tick();
  assert.deepEqual(h.calls, ['showInfo']);
  h.popup.closed = false;
  h.popup.inert = false;
  h.tick();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1][1].preventScroll, true);
  assert.equal(h.popup.scrollTop, 158);
  assert.equal(h.info.scrollTop, 30);
  h.retire();
});

test('stale, hidden, detached, and cancelled requests never steal focus', () => {
  for (const change of [
    h => { h.props.selectedId = 'other'; },
    h => { h.props.side = 'left'; },
    h => { h.props.exam = true; },
    h => { h.props.guided = true; },
    h => { h.props.inlineStudy = true; },
    h => { h.props.catalog = h.api.bodyDisplayCatalog(structuredClone(raw)); },
    h => { h.props.region = 'abdomen'; },
    h => { h.context.testWorkspace.mode = 'dissect'; },
    h => { h.context.document.hidden = true; },
    h => { h.heading.isConnected = false; },
  ]) {
    const h = harness(); h.render(); change(h); h.render();
    for (let i = 0; i < 15; i++) h.tick();
    assert.equal(h.calls.length, 0);
    h.retire();
  }
  const h = harness(); h.render(); h.retire(); h.tick();
  assert.equal(h.calls.length, 0, 'unmount cancels pending frame');
});

test('focus helper rejects a foreign or closed panel', () => {
  const h = harness({ sheet: true });
  assert.equal(h.api.revealTourExploreHeading(h.root, h.info, h.heading), false);
  h.popup.closed = false;
  assert.equal(h.api.revealTourExploreHeading(h.root, { isConnected: true, closest: () => h.popup }, h.heading), false);
  assert.equal(h.api.revealTourExploreHeading(h.root, h.info, h.heading), true);
});

test('source record, catalogue, and registered tour mutations before the frame retire attention', () => {
  for (const change of [
    h => { h.request.sourceRecord.name += ' altered'; },
    h => { h.props.catalog.structures.find(s => s.id === h.request.selectedId).name += ' altered'; },
    h => { h.request.tour.steps[0].id += '-altered'; },
  ]) {
    const h = harness(); h.render(); change(h); h.tick();
    assert.equal(h.calls.length, 0);
    assert.equal(h.frames.size, 0, 'invalid payload does not retry');
    h.retire();
  }
});

test('visibilitychange and pagehide retire queued focus before suspended frames resume', () => {
  const initiallyHidden = harness({ hidden: true }); initiallyHidden.render();
  assert.equal(initiallyHidden.frames.size, 0);
  assert.equal(initiallyHidden.listeners.document.size, 0);
  initiallyHidden.context.document.hidden = false;
  initiallyHidden.render(); initiallyHidden.tick();
  assert.equal(initiallyHidden.calls.length, 0);
  initiallyHidden.retire();

  const hidden = harness(); hidden.render();
  assert.equal(hidden.listeners.document.size, 1);
  assert.equal(hidden.listeners.window.size, 1);
  hidden.emitVisibility(true);
  assert.equal(hidden.frames.size, 0, 'pending frame cancelled while page is hidden');
  hidden.emitVisibility(false);
  hidden.tick(); hidden.render(); hidden.tick();
  assert.equal(hidden.calls.length, 0, 'focus does not resume on return');
  hidden.retire();
  assert.equal(hidden.listeners.document.size, 0);
  assert.equal(hidden.listeners.window.size, 0);

  const navigating = harness(); navigating.render(); navigating.emitPagehide();
  assert.equal(navigating.frames.size, 0);
  navigating.tick();
  assert.equal(navigating.calls.length, 0);
  navigating.retire();
  assert.equal(navigating.listeners.document.size, 0);
  assert.equal(navigating.listeners.window.size, 0);
});
