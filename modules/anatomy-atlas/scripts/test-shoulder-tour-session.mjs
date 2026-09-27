/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks run the production component */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const built = await build({ stdin: { contents: "export { default as ShoulderExplorer } from './app/shoulder-explorer'; export { WorkspaceModes } from './app/atlas-workspace'; export { shoulderTour, shoulderTourStepView } from './lib/shoulder-tours';", loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'cjs', write: false, loader: { '.css': 'empty' }, plugins: [{ name: 'session-boundaries', setup(api) {
    api.onLoad({ filter: /[\\/]app[\\/]anatomy-scene\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export function AnatomyScene(){return null;}' }));
    api.onLoad({ filter: /[\\/]app[\\/]workspace-session\.tsx?$/ }, () => ({ loader: 'ts', contents: 'export function useWorkspaceSession(){return window.__workspace;}' }));
    api.onLoad({ filter: /[\\/]app[\\/]imaging-link\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export function ImagingLink(){return null;} export function useImagingLink(options){window.__imaging=options;return {publish(){}};}' }));
  } }] });
const plain = value => JSON.parse(JSON.stringify(value));
const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
function harness() {
  const slots = [], setters = [], timers = new Map(), events = new Map(), tools = new Map();
  let cursor = 0, pending = [], dirty = false, tree, serial = 0;
  const depsChanged = (old, next) => !old || !next || old.length !== next.length || old.some((v, i) => !Object.is(v, next[i]));
  const shim = { ...React,
    useContext() { return win.__modeContext; }, useId() { return 'session-workspace-modes'; },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; setters[i] ??= value => { const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }; return [slots[i], setters[i]]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useMemo(fn, deps) { const i = cursor++; if (depsChanged(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return shim.useMemo(() => fn, deps); },
    useReducer(reducer, initial) { const [state, set] = shim.useState(initial); return [state, action => set(value => reducer(value, action))]; },
    useEffect(fn, deps) { const i = cursor++; if (depsChanged(slots[i]?.deps, deps)) pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const preference = { matches: false, addEventListener(_name, fn) { events.set('motion', fn); }, removeEventListener() { events.delete('motion'); } };
  const doc = { hidden: false, modelContext: { registerTool(tool) { tools.set(tool.name, tool); } }, addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); } };
  const win = { __workspace: { mode: 'explore', chooseMode(mode) { this.mode = mode; } }, matchMedia: () => preference,
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  const mod = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: mod, exports: mod.exports, structuredClone, AbortController, window: win, document: doc, console,
    require(id) { if (id === 'react') return shim; if (id === 'next/dynamic') return () => 'AnatomyScene'; if (id === 'next/link') return 'a'; if (id === 'next/image') return 'img'; if (id === 'next/navigation') return { useRouter: () => ({}), useSearchParams: () => new URLSearchParams(), usePathname: () => '/shoulder' }; return require(id); } });
  function render() { let count = 0; do { dirty = false; cursor = 0; pending = []; tree = mod.exports.ShoulderExplorer({ connectedReviews: false }); for (const fn of pending) fn(); assert(++count < 15, 'Hook render settles'); } while (dirty); return tree; }
  const find = predicate => { const matches = nodes(tree).filter(predicate); assert.equal(matches.length, 1, 'Find one production element'); return matches[0].props; };
  const player = () => find(n => n.type?.name === 'ShoulderTourPlayer');
  const hasPlayer = () => nodes(tree).some(n => n.type?.name === 'ShoulderTourPlayer');
  const scene = () => find(n => n.type === 'AnatomyScene');
  const views = () => find(n => n.type?.name === 'StudyViews');
  const modes = () => find(n => n.type?.name === 'WorkspaceModes');
  const panelCalls = [];
  function modeRadio(guidedLearning = modes().guidedLearning, overrides = {}) {
    win.__modeContext = { mode: win.__workspace.mode, exam: false,
      chooseMode: mode => win.__workspace.chooseMode(mode), setPanelOpen: (...args) => panelCalls.push(args), ...overrides };
    return mod.exports.WorkspaceModes({ guidedLearning });
  }
  function choose(value) { modeRadio().props.onValueChange(value); render(); }
  const enter = () => choose('guided-learning');
  function ready() { scene().onRendererHealth('ready'); scene().onModelReady(true); render(); }
  function tick() { assert.equal(timers.size, 1, 'Exactly one autoplay timer'); const [id, timer] = [...timers][0]; timers.delete(id); assert.equal(timer.delay, mod.exports.shoulderTour.steps[player().index].durationMs); timer.fn(); render(); }
  render();
  return { render, find, player, hasPlayer, scene, views, modes, modeRadio, panelCalls, choose, enter, ready, tick, timers, tools, doc, win, preference, events, api: mod.exports };
}

test('Production session starts manually, steps, pauses, autoplays and stops on final step', () => {
  const h = harness(); h.ready(); h.enter(); h.player().onStart(); h.render();
  assert.equal(h.player().index, 0); assert.equal(h.player().playing, false); assert.equal(h.timers.size, 0);
  assert.equal(h.scene().tourLocked, true); assert.equal(h.scene().transitionMs, 1800);
  const reset = h.scene().resetNonce;
  h.player().onStep(1); h.render(); assert.equal(h.player().index, 1); assert(h.scene().resetNonce > reset);
  h.player().onStep(-1); h.render(); assert.equal(h.player().index, 1, 'Invalid step does not alter session');
  h.player().onPlayPause(); h.render(); assert.equal(h.player().playing, true); assert.equal(h.timers.size, 1);
  h.player().onPlayPause(); h.render(); assert.equal(h.timers.size, 0); assert.equal(h.scene().transitionPaused, true);
  h.player().onPlayPause(); h.render(); assert.equal(h.scene().transitionPaused, false);
  while (h.player().index < 4) h.tick();
  h.tick(); assert.equal(h.player().index, 4); assert.equal(h.player().playing, false); assert.equal(h.timers.size, 0);
  h.player().onExit(); h.render(); assert.equal(h.player().index, null); assert.equal(h.scene().tourLocked, false);
});

test('Exit restores every captured display field, live camera and relative zoom step as detached state', () => {
  const h = harness(); h.ready();
  const saved = h.api.shoulderTourStepView(4);
  Object.assign(saved, { layout: 'tray', plate: true, explode: 72, zoom: 1.8, isolated: true, labels: false, anchorSkeleton: true, showOrigins: true, referencePlane: true, systems: { skeleton: false, muscles: true, 'soft-tissue': false }, camera: { direction: [1, 0, 0], up: [0, 1, 0], pan: [.3, .2, 0], scale: .65 }, inspection: { plane: 'coronal', position: 62, flipped: true, opacity: { muscles: 45 }, keepSelectedSolid: false } });
  h.views().restore(saved); h.render();
  h.scene().cameraCapture.current = saved.camera;
  h.find(n => n.props?.['aria-label'] === 'Zoom in').onClick(); h.render();
  h.find(n => n.props?.['aria-label'] === 'Zoom in').onClick(); h.render();
  const captured = plain(h.views().capture()), step = h.scene().zoomStep;
  h.enter();
  h.player().onStart(); h.render();
  assert.equal(h.scene().zoomStep, 0); assert.equal(h.scene().cameraRestore.current, null);
  saved.camera.pan[0] = 99; saved.systems.skeleton = true;
  const blocked = h.api.shoulderTourStepView(2); h.views().restore(blocked); h.render();
  assert.equal(h.player().index, 0, 'Saved-view restoration guarded during tour');
  assert.equal(h.scene().selectedId, h.api.shoulderTour.steps[0].selectedId);
  h.player().onExit(); h.render();
  // Capture reports cameraCapture, so compare restored camera separately.
  const restored = plain(h.views().capture()); restored.camera = plain(h.scene().cameraRestore.current);
  assert.deepEqual(restored, captured); assert.equal(h.scene().zoomStep, step);
});

test('Context failure and hidden tab pause without automatic resumption; exit remains callable', () => {
  for (const cause of ['lost', 'failed', 'model', 'hidden']) {
    const h = harness(); h.ready(); h.enter(); h.player().onStart(); h.render(); h.player().onPlayPause(); h.render();
    if (cause === 'hidden') { h.doc.hidden = true; h.events.get('visibilitychange')(); }
    else if (cause === 'model') h.scene().onModelReady(false);
    else h.scene().onRendererHealth(cause);
    h.render(); assert.equal(h.player().playing, false); assert.equal(h.timers.size, 0); assert.equal(h.scene().transitionPaused, true);
    h.doc.hidden = false; h.scene().onRendererHealth('ready'); h.scene().onModelReady(true); h.render();
    assert.equal(h.player().playing, false, `${cause}: recovery needs explicit play`); assert.equal(h.timers.size, 0);
    h.player().onExit(); h.render(); assert.equal(h.player().index, null);
  }
});

test('Readiness/start/selection guards and reduced-motion camera option use actual session callbacks', async () => {
  const h = harness(); assert.equal(h.hasPlayer(), false); h.enter(); h.player().onStart(); h.render(); assert.equal(h.player().index, null);
  h.ready(); h.win.__workspace.mode = 'practice'; const staleStart = h.player().onStart; staleStart(); h.render();
  assert.equal(h.scene().tourLocked, false); h.win.__workspace.mode = 'explore'; h.render();
  h.player().onStart(); h.render(); const first = h.scene().selectedId;
  h.player().onStart(); h.render(); assert.equal(h.player().index, 0);
  h.scene().onSelect(h.api.shoulderTour.steps[4].selectedId); h.render(); assert.equal(h.scene().selectedId, first);
  assert.equal(h.win.__imaging.disabled, true);
  h.preference.matches = true; h.events.get('motion')(); h.render(); assert.equal(h.scene().transitionMs, 0);
  await Promise.resolve(); await Promise.resolve();
  assert.throws(() => h.tools.get('configure_anatomy_view').execute({ view: 'anterior' }), /Exit the guided tour/);
  assert.throws(() => h.tools.get('select_anatomy_structure').execute({ structureId: h.api.shoulderTour.steps[4].selectedId }), /Unknown structureId/);
  h.scene().onRendererHealth('lost'); h.render(); const index = h.player().index;
  h.player().onStep(2); h.player().onPlayPause(); h.render(); assert.equal(h.player().index, index); assert.equal(h.player().playing, false);
  h.player().onExit(); h.render(); assert.equal(h.scene().tourLocked, false); assert.equal(h.timers.size, 0);
});

test('Guided learning is a separate subtab: Explore has no player, normal modes return, Practice entry restores Explore', () => {
  const h = harness(); h.ready();
  assert.equal(h.win.__workspace.mode, 'explore'); assert.equal(h.hasPlayer(), false);
  const saved = plain(h.views().capture());
  h.enter(); assert.equal(h.hasPlayer(), true); assert.equal(h.player().index, null);
  assert.equal(h.modes().guidedLearning.active, true);
  assert.deepEqual(plain(h.views().capture()), saved, 'Opening library does not start a tour or alter the current view');
  for (const mode of ['explore', 'dissect', 'practice']) {
    h.choose(mode);
    assert.equal(h.hasPlayer(), false, `${mode}: player absent`);
    assert.equal(h.modes().guidedLearning.active, false);
    assert.equal(h.win.__workspace.mode, mode);
    h.enter(); assert.equal(h.hasPlayer(), true);
    assert.equal(h.player().index, null, 'Reentry remains manual');
    assert.equal(h.win.__workspace.mode, mode === 'practice' ? 'explore' : mode, 'Practice entry switches back to Explore; Dissect/Explore remain selected');
  }
  h.choose('explore'); assert.equal(h.hasPlayer(), false); assert.equal(h.scene().tourLocked, false);
});

test('Actual WorkspaceModes radio callback keeps optional API at three/four options, closes panels and guards exam entry', () => {
  const h = harness(), changes = [], choices = [];
  const guided = { active: false, onChange: active => changes.push(active) };
  // Initialize controlled context, then invoke the real component without props.
  h.modeRadio(guided, { chooseMode: mode => choices.push(mode) });
  const defaultGroup = h.api.WorkspaceModes();
  assert.equal(nodes(defaultGroup).filter(n => n.type === 'label').length, 3);
  defaultGroup.props.onValueChange('guided-learning');
  assert.deepEqual(changes, []); assert.deepEqual(choices, []);
  const group = h.modeRadio(guided, { chooseMode: mode => choices.push(mode) });
  assert.equal(nodes(group).filter(n => n.type === 'label').length, 4);
  group.props.onValueChange('guided-learning');
  assert.deepEqual(changes.splice(0), [true]);
  assert.deepEqual(h.panelCalls.splice(0), [[false, false], [true, false]], 'Both tools and information panels close');
  assert.deepEqual(choices, [], 'Library entry preserves underlying mode');
  for (const mode of ['explore', 'dissect', 'practice']) {
    group.props.onValueChange(mode);
    assert.deepEqual(changes.splice(0), [false]); assert.deepEqual(choices.splice(0), [mode]);
  }
  group.props.onValueChange('unknown'); assert.deepEqual(changes, []); assert.deepEqual(choices, []);
  const active = h.modeRadio({ ...guided, active: true });
  assert.equal(active.props.value, 'guided-learning');
  const exam = h.modeRadio(guided, { mode: 'practice', exam: true });
  const radios = nodes(exam).filter(n => n.props?.value && n !== exam);
  assert.equal(radios.length, 4);
  for (const radio of radios) assert.equal(radio.props.disabled, radio.props.value !== 'practice');
  exam.props.onValueChange('guided-learning');
  assert.deepEqual(changes, []); assert.deepEqual(h.panelCalls, [], 'Exam does not open library or close panels');
});
