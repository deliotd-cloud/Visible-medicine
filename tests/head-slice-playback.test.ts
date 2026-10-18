import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createHeadSlicePlaybackController} from '../lib/head-slice-playback.ts';

function clock() {
  let next = 0;
  const pending = new Map<number, {callback: () => void; delay: number}>();
  const callbacks = new Map<number, () => void>();
  return {
    pending,
    callbacks,
    schedule(callback: () => void, delay: number) {
      const id = ++next;
      callbacks.set(id, callback);
      pending.set(id, {callback, delay});
      return id;
    },
    cancel(handle: unknown) { pending.delete(handle as number); },
    fire(id: number) {
      const task = pending.get(id);
      assert(task, `timer ${id} is pending`);
      pending.delete(id);
      task.callback();
    },
  };
}

test('explicit playback advances one native index per tick and stops at the last slice', () => {
  const timer = clock(), emitted: number[] = [], states: boolean[] = [];
  const player = createHeadSlicePlaybackController({slice: 1, sliceCount: 4, fps: 4,
    onSlice: value => emitted.push(value), onPlayingChange: value => states.push(value), ...timer});
  assert.equal(player.isPlaying(), false);
  assert.equal(timer.pending.size, 0);
  assert.equal(player.play(), true);
  assert.equal([...timer.pending.values()][0].delay, 250);
  timer.fire(1);
  assert.deepEqual(emitted, [2]);
  timer.fire(2);
  assert.deepEqual(emitted, [2, 3]);
  assert.deepEqual(states, [true, false]);
  assert.equal(timer.pending.size, 0);
  assert.equal(player.play(), false, 'no loop or silent rewind');
});

test('pause, reset, count changes, and speed changes cancel or reschedule one timer', () => {
  const timer = clock(), emitted: number[] = [];
  const player = createHeadSlicePlaybackController({slice: 0, sliceCount: 5, fps: 4,
    onSlice: value => emitted.push(value), ...timer});
  player.play();
  const staleAfterSpeed = timer.callbacks.get(1)!;
  player.configure(5, 6);
  assert.equal(timer.pending.size, 1);
  assert.equal([...timer.pending.values()][0].delay, 1000 / 6);
  staleAfterSpeed();
  assert.deepEqual(emitted, [], 'cancelled callback is generation guarded');
  timer.fire(2);
  assert.deepEqual(emitted, [1]);
  const staleAfterPause = timer.callbacks.get(3)!;
  player.pause();
  staleAfterPause();
  assert.deepEqual(emitted, [1]);
  player.play();
  const staleAfterCount = timer.callbacks.get(4)!;
  player.configure(3, 6);
  assert.equal(player.isPlaying(), false);
  staleAfterCount();
  assert.deepEqual(emitted, [1]);
  player.reset(0, 5, 2);
  player.play();
  const staleAfterReset = timer.callbacks.get(5)!;
  player.reset(2, 5, 2);
  staleAfterReset();
  assert.deepEqual(emitted, [1]);
  assert.equal(timer.pending.size, 0);
});

test('external slice changes use the latest index and invalid inputs cannot start', () => {
  const timer = clock(), emitted: number[] = [];
  const player = createHeadSlicePlaybackController({slice: 0, sliceCount: 6, fps: 2,
    onSlice: value => emitted.push(value), ...timer});
  player.play();
  player.setSlice(3);
  timer.fire(1);
  assert.deepEqual(emitted, [4]);
  player.setSlice(5);
  assert.equal(player.isPlaying(), false);
  assert.equal(timer.pending.size, 0);
  for (const value of [NaN, Infinity, -1, 1.5, 6]) {
    player.reset(value, 6, 4);
    assert.equal(player.play(), false);
  }
  player.reset(0, 1, 4);
  assert.equal(player.play(), false);
  player.reset(0, NaN, 4);
  assert.equal(player.play(), false);
  player.reset(0, 6, 3);
  assert.equal(player.play(), false);
});

test('component pauses for manual root input, hidden tab, blur, Escape and unmount; own controls remain usable', () => {
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const browserWindow = new EventTarget() as EventTarget & {setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout};
  browserWindow.setTimeout = setTimeout;
  browserWindow.clearTimeout = clearTimeout;
  const documentTarget = new EventTarget() as EventTarget & {hidden: boolean};
  documentTarget.hidden = false;
  (globalThis as any).window = browserWindow;
  (globalThis as any).document = documentTarget;
  let lifecycleController: ReturnType<typeof createHeadSlicePlaybackController> | undefined;
  try {
    const require = createRequire(import.meta.url);
    const source = readFileSync(new URL('../components/HeadSlicePlayback.tsx', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
    const slots: any[] = [], effects = new Map<number, {deps: unknown[]; cleanup?: () => void}>();
    const pendingEffects: Array<() => void> = [];
    let hook = 0;
    const same = (a: unknown[] | undefined, b: unknown[]) => !!a && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
    const hooks = {
      useState(initial: unknown) {const i = hook++; if (!(i in slots)) slots[i] = initial; return [slots[i], (value: unknown) => {slots[i] = value;}];},
      useRef(initial: unknown) {const i = hook++; if (!(i in slots)) slots[i] = {current: initial}; return slots[i];},
      useEffect(create: () => void | (() => void), deps: unknown[]) {const i = hook++; const prior = effects.get(i); if (!same(prior?.deps, deps)) pendingEffects.push(() => {prior?.cleanup?.(); const cleanup = create(); effects.set(i, {deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined});});},
    };
    const module = {exports: {} as Record<string, any>};
    new Function('require', 'module', 'exports', compiled)((name: string) => {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '../lib/head-slice-playback') return {createHeadSlicePlaybackController};
      throw new Error(`Unexpected import ${name}`);
    }, module, module.exports);
    const rootListeners = new Map<string, Set<(event: Event) => void>>();
    const root = {
      addEventListener(type: string, listener: (event: Event) => void) {
        if (!rootListeners.has(type)) rootListeners.set(type, new Set());
        rootListeners.get(type)!.add(listener);
      },
      removeEventListener(type: string, listener: (event: Event) => void) {rootListeners.get(type)?.delete(listener);},
      dispatchEvent(event: Event) {for (const listener of rootListeners.get(event.type) ?? []) listener(event); return true;},
    };
    const interactionRoot = {current: root};
    const onSlice = () => {};
    const render = () => {hook = 0; return module.exports.default({plane: 'axial', slice: 0, sliceCount: 4, onSlice, interactionRoot, resetIdentity: 'study', resetVersion: 0});};
    const find = (node: any, predicate: (value: any) => boolean): any => {
      if (Array.isArray(node)) return node.map(item => find(item, predicate)).find(Boolean);
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) return node;
      return find(node.props?.children, predicate);
    };
    let tree = render();
    const group = () => find(tree, node => node.props?.role === 'group');
    const button = () => find(tree, node => node.type === 'button');
    const controller = slots.find(value => value?.current?.isPlaying)?.current;
    lifecycleController = controller;
    const controls = slots.find(value => value?.current === null);
    const ownTarget = new EventTarget();
    const details = new EventTarget() as EventTarget & {open: boolean};
    details.open = true;
    controls.current = {contains: (target: unknown) => target === ownTarget, closest: () => details};
    for (const effect of pendingEffects) effect();
    button().props.onClick();
    assert.equal(controller.isPlaying(), true);
    const ownEvent = new Event('pointerdown');
    Object.defineProperty(ownEvent, 'target', {value: ownTarget});
    root.dispatchEvent(ownEvent);
    assert.equal(controller.isPlaying(), true);
    root.dispatchEvent(new Event('wheel'));
    assert.equal(controller.isPlaying(), false);
    button().props.onClick();
    root.dispatchEvent(new Event('keydown'));
    assert.equal(controller.isPlaying(), false);
    button().props.onClick();
    group().props.onKeyDown({key: 'Escape'});
    assert.equal(controller.isPlaying(), false);
    button().props.onClick();
    documentTarget.hidden = true;
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    assert.equal(controller.isPlaying(), false);
    documentTarget.hidden = false;
    button().props.onClick();
    browserWindow.dispatchEvent(new Event('blur'));
    assert.equal(controller.isPlaying(), false);
    button().props.onClick();
    browserWindow.dispatchEvent(new Event('pagehide'));
    assert.equal(controller.isPlaying(), false);
    button().props.onClick();
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    assert.equal(controller.isPlaying(), false);
    documentTarget.hidden = true;
    button().props.onClick();
    assert.equal(controller.isPlaying(), false, 'explicit start is refused while hidden');
    documentTarget.hidden = false;
    details.open = true;
    button().props.onClick();
    for (const effect of effects.values()) effect.cleanup?.();
    assert.equal(controller.isPlaying(), false);
    assert.equal([...rootListeners.values()].reduce((total, listeners) => total + listeners.size, 0), 0, 'root listeners removed on unmount');
    button().props.onClick();
    assert.equal(controller.isPlaying(), false, 'a retired control cannot restart playback after unmount');
    root.dispatchEvent(new Event('pointerdown'));
    assert.equal(controller.isPlaying(), false, 'unmounted playback stays retired');
    controller.pause();
  } finally {
    lifecycleController?.pause();
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  }
});

test('viewer only offers playback in expanded, disclosed, non-quiz native images and binds reset identity', () => {
  const source = readFileSync(new URL('../components/HeadAtlasViewer.tsx', import.meta.url), 'utf8');
  assert.match(source, /allowPlayback=\{!quizActive&&expanded===plane\}/);
  assert.match(source, /allowPlayback&&expanded&&showName&&!onAnswer&&<HeadSlicePlayback/);
  assert.match(source, /key=\{`\$\{plane\}:\$\{selected\?\.entry\.id\?\?''\}`\}/);
  assert.match(source, /resetIdentity=\{study\} resetVersion=\{viewResetVersion\}/);
});

// Mount the actual component with a deterministic timer and effect lifecycle.
// In particular, exercise the render-to-passive-cleanup interval rather than
// assuming cleanup has already run when a study or display identity changes.
function playbackComponentFixture() {
  const originalWindow = (globalThis as any).window, originalDocument = (globalThis as any).document;
  const timer = clock(), emitted: number[] = [], replacementEmitted: number[] = [];
  const browserWindow = Object.assign(new EventTarget(), {setTimeout: timer.schedule, clearTimeout: timer.cancel});
  const browserDocument = Object.assign(new EventTarget(), {hidden: false});
  (globalThis as any).window = browserWindow;(globalThis as any).document = browserDocument;
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL('../components/HeadSlicePlayback.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const slots: any[] = [], effects = new Map<number, {deps: unknown[]; create: () => void | (() => void); cleanup?: () => void}>();
  const pending: Array<() => void> = [];
  let hook = 0, tree: any;
  const same = (a: unknown[] | undefined, b: unknown[]) => !!a && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    useState(initial: unknown) {const index = hook++;if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value: unknown) => {slots[index] = typeof value === 'function' ? (value as Function)(slots[index]) : value;}];},
    useRef(initial: unknown) {const index = hook++;if (!(index in slots)) slots[index] = {current: initial};return slots[index];},
    useEffect(create: () => void | (() => void), deps: unknown[]) {const index = hook++, previous = effects.get(index);
      if (!same(previous?.deps, deps)) pending.push(() => {previous?.cleanup?.();const cleanup = create();effects.set(index, {deps, create, cleanup: typeof cleanup === 'function' ? cleanup : undefined});});},
  };
  let controller: ReturnType<typeof createHeadSlicePlaybackController>;
  const module = {exports: {} as Record<string, any>};
  new Function('require', 'module', 'exports', compiled)((name: string) => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '../lib/head-slice-playback') return {createHeadSlicePlaybackController: (options: Parameters<typeof createHeadSlicePlaybackController>[0]) => (controller = createHeadSlicePlaybackController(options))};
    throw Error(`Unexpected import ${name}`);
  }, module, module.exports);
  const details = Object.assign(new EventTarget(), {open: true}), root = new EventTarget();
  const controls = {contains: () => true, closest: () => details};
  let props: any = {plane: 'axial', slice: 0, sliceCount: 5, onSlice: (value: number) => emitted.push(value), interactionRoot: {current: root}, resetIdentity: {}, resetVersion: 0};
  function find(node: any, predicate: (value: any) => boolean): any {
    if (Array.isArray(node)) {for (const child of node) {const match = find(child, predicate);if (match) return match;}return;}
    if (!node || typeof node !== 'object') return;
    return predicate(node) ? node : find(node.props?.children, predicate);
  }
  function render(next: Record<string, unknown> = {}, commit = true) {
    props = {...props, ...next};hook = 0;tree = module.exports.default(props);
    find(tree, node => node.props?.role === 'group').props.ref.current = controls;
    if (commit) flush();
  }
  function flush() {for (const effect of pending.splice(0)) effect();}
  const button = () => find(tree, node => node.type === 'button');
  const replay = () => find(tree, node => node.type === 'button' && String(node.props['aria-label']).includes('replay from'));
  const speed = () => find(tree, node => node.type === 'select' && String(node.props['aria-label']).includes('speed'));
  const direction = () => find(tree, node => node.type === 'select' && String(node.props['aria-label']).includes('direction'));
  const group = () => find(tree, node => node.props?.role === 'group');
  const cleanup = () => {for (const effect of effects.values()) effect.cleanup?.();};
  render();
  return {timer, emitted, replacementEmitted, details, browserDocument, render, flush, button, replay, speed, direction, group,
    get controller() {return controller!;},
    next() {assert.equal(timer.pending.size, 1);timer.fire([...timer.pending.keys()][0]);},
    cleanup,
    replayEffects() {cleanup();for (const effect of effects.values()) {const result = effect.create();effect.cleanup = typeof result === 'function' ? result : undefined;}},
    close() {cleanup();(globalThis as any).window = originalWindow;(globalThis as any).document = originalDocument;},
  };
}

test('closed image tools refuse queued playback and replay before the toggle event is delivered', () => {
  const f = playbackComponentFixture();
  try {
    f.button().props.onClick();f.details.open = false;
    f.next();assert.deepEqual(f.emitted, []);assert.equal(f.controller.isPlaying(), false);
    f.button().props.onClick();f.replay().props.onClick();
    assert.equal(f.timer.pending.size, 0);assert.deepEqual(f.emitted, []);
    f.details.open = true;f.button().props.onClick();f.next();assert.deepEqual(f.emitted, [1], 'a refused tick must not skip the next displayed slice');
  } finally {f.close();}
});

test('rendering a replacement study, plane, reset or slice count immediately retires old playback', () => {
  for (const change of [{resetIdentity: {}}, {plane: 'coronal'}, {resetVersion: 1}, {sliceCount: 6}]) {
    const f = playbackComponentFixture();
    try {
      const oldButton = f.button(), oldReplay = f.replay(), oldSpeed = f.speed(), oldDirection = f.direction(), oldGroup = f.group();
      oldButton.props.onClick();
      f.render({...change, onSlice: (value: number) => f.replacementEmitted.push(value)}, false);
      f.next();assert.deepEqual(f.emitted, []);assert.deepEqual(f.replacementEmitted, []);
      oldButton.props.onClick();oldReplay.props.onClick();f.button().props.onClick();
      assert.equal(f.timer.pending.size, 0, 'neither old nor uncommitted new controls can start');
      f.flush();f.render();f.button().props.onClick();
      const handle = [...f.timer.pending.keys()][0];
      oldButton.props.onClick();oldReplay.props.onClick();oldSpeed.props.onChange({target: {value: '6'}});
      oldDirection.props.onChange({target: {value: '-1'}});oldGroup.props.onKeyDown({key: 'Escape'});
      assert.deepEqual([...f.timer.pending.keys()], [handle], 'retired controls cannot alter new playback');
      f.next();assert.deepEqual(f.emitted, []);assert.deepEqual(f.replacementEmitted, [1]);
    } finally {f.close();}
  }
});

test('unmount retires timers and all controls while effect replay remains restartable explicitly', () => {
  const f = playbackComponentFixture();
  try {
    const oldButton = f.button(), oldReplay = f.replay(), oldSpeed = f.speed(), oldDirection = f.direction();
    oldButton.props.onClick();const stale = [...f.timer.callbacks.values()][0];f.cleanup();
    oldButton.props.onClick();oldReplay.props.onClick();oldSpeed.props.onChange({target: {value: '6'}});oldDirection.props.onChange({target: {value: '-1'}});stale();
    assert.equal(f.timer.pending.size, 0);assert.deepEqual(f.emitted, []);
    f.replayEffects();assert.equal(f.timer.pending.size, 0, 'effect replay does not auto-start');
    f.render();f.button().props.onClick();f.next();assert.deepEqual(f.emitted, [1]);
  } finally {f.close();}
});

test('normal slice updates retain playback and valid speed changes retire the previous tick', () => {
  const f = playbackComponentFixture();
  try {
    f.button().props.onClick();f.next();assert.deepEqual(f.emitted, [1]);
    f.render({slice: 1});const stale = f.timer.callbacks.get([...f.timer.pending.keys()][0])!;
    f.speed().props.onChange({target: {value: '6'}});stale();assert.deepEqual(f.emitted, [1]);
    assert.equal([...f.timer.pending.values()][0].delay, 1000 / 6);
    f.render({slice: 1});f.next();assert.deepEqual(f.emitted, [1, 2]);
    f.speed().props.onChange({target: {value: 'NaN'}});f.direction().props.onChange({target: {value: '0'}});
    assert.equal(f.controller.isPlaying(), true);assert.equal(f.timer.pending.size, 1);
    f.browserDocument.hidden = true;f.next();assert.deepEqual(f.emitted, [1, 2]);assert.equal(f.timer.pending.size, 0);
  } finally {f.close();}
});
