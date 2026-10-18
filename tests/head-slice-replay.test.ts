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
    fire() {
      const [id, task] = pending.entries().next().value ?? [];
      assert(task && id !== undefined, 'one timer is pending');
      pending.delete(id);
      task.callback();
    },
  };
}

test('reverse advances native indices toward zero, stops there, and never wraps', () => {
  const timer = clock(), emitted: number[] = [], states: boolean[] = [];
  const player = createHeadSlicePlaybackController({slice: 3, sliceCount: 4, fps: 2, direction: -1,
    onSlice: value => emitted.push(value), onPlayingChange: value => states.push(value), ...timer});
  assert.equal(player.play(), true);
  assert.equal([...timer.pending.values()][0].delay, 500);
  timer.fire();
  timer.fire();
  timer.fire();
  assert.deepEqual(emitted, [2, 1, 0]);
  assert.deepEqual(states, [true, false]);
  assert.equal(timer.pending.size, 0);
  assert.equal(player.play(), false, 'endpoint does not automatically loop');
});

test('direction changes pause and invalidate callbacks, then play resumes from the current index', () => {
  const timer = clock(), emitted: number[] = [];
  const player = createHeadSlicePlaybackController({slice: 2, sliceCount: 5, fps: 4,
    onSlice: value => emitted.push(value), ...timer});
  assert.equal(player.play(), true);
  const retired = timer.callbacks.get(1)!;
  player.setDirection(-1);
  assert.equal(player.isPlaying(), false);
  assert.equal(timer.pending.size, 0);
  retired();
  assert.deepEqual(emitted, []);
  assert.equal(player.play(), true);
  timer.fire();
  assert.deepEqual(emitted, [1]);
  player.setDirection(1);
  assert.equal(player.isPlaying(), false);
  assert.equal(player.play(), true);
  timer.fire();
  assert.deepEqual(emitted, [1, 2]);
});

test('explicit replay emits the directional start and plays without a wraparound tick', () => {
  const timer = clock(), emitted: number[] = [];
  const player = createHeadSlicePlaybackController({slice: 3, sliceCount: 4, fps: 6,
    onSlice: value => emitted.push(value), ...timer});
  assert.equal(player.play(), false);
  assert.equal(player.restart(), true);
  assert.deepEqual(emitted, [0]);
  assert.equal(player.isPlaying(), true);
  assert.equal(timer.pending.size, 1);
  timer.fire();
  assert.deepEqual(emitted, [0, 1]);
  const retired = [...timer.callbacks.values()].at(-1)!;
  player.pause();
  retired();
  assert.deepEqual(emitted, [0, 1], 'paused replay ignores a retired tick');
  player.setDirection(-1);
  assert.equal(player.restart(), true);
  assert.deepEqual(emitted, [0, 1, 3]);
  timer.fire();
  assert.deepEqual(emitted, [0, 1, 3, 2]);
});

test('reentrant pause or reset from onSlice cannot revive a replay or leave a timer', () => {
  for (const action of ['pause', 'reset'] as const) {
    const timer = clock(), emitted: number[] = [];
    let player: ReturnType<typeof createHeadSlicePlaybackController>;
    player = createHeadSlicePlaybackController({slice: 2, sliceCount: 4, fps: 4,
      onSlice: value => {
        emitted.push(value);
        if (action === 'pause') player.pause();
        else player.reset(2, 4, 4);
      }, ...timer});
    assert.equal(player.restart(), false, `${action} cancels replay during start emission`);
    assert.deepEqual(emitted, [0]);
    assert.equal(player.isPlaying(), false);
    assert.equal(timer.pending.size, 0);
  }
});

test('invalid direction, indices, count, and speed fail closed for play and replay', () => {
  for (const [slice, count, fps] of [[-1, 4, 4], [4, 4, 4], [0.5, 4, 4], [0, 1, 4], [0, NaN, 4], [0, 4, 3]]) {
    const timer = clock(), emitted: number[] = [];
    const player = createHeadSlicePlaybackController({slice, sliceCount: count, fps,
      onSlice: value => emitted.push(value), ...timer});
    assert.equal(player.play(), false);
    assert.equal(player.restart(), false);
    assert.equal(player.isPlaying(), false);
    assert.deepEqual(emitted, []);
    assert.equal(timer.pending.size, 0);
  }
  const timer = clock(), emitted: number[] = [];
  const player = createHeadSlicePlaybackController({slice: 1, sliceCount: 4, fps: 4,
    direction: 0 as 1, onSlice: value => emitted.push(value), ...timer});
  assert.equal(player.play(), false);
  assert.equal(player.restart(), false);
  player.setDirection(-1);
  assert.equal(player.play(), true);
  player.setDirection(2 as 1);
  assert.equal(player.isPlaying(), false);
  assert.equal(player.restart(), false);
  assert.deepEqual(emitted, []);
  assert.equal(timer.pending.size, 0);
});

test('component exposes direction and replay controls with endpoint and hidden-tab guards', () => {
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const timer = clock();
  const browserWindow = new EventTarget() as EventTarget & {setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout};
  browserWindow.setTimeout = timer.schedule as typeof setTimeout;
  browserWindow.clearTimeout = timer.cancel as typeof clearTimeout;
  const documentTarget = new EventTarget() as EventTarget & {hidden: boolean};
  documentTarget.hidden = false;
  (globalThis as any).window = browserWindow;
  (globalThis as any).document = documentTarget;
  try {
    const require = createRequire(import.meta.url);
    const source = readFileSync(new URL('../components/HeadSlicePlayback.tsx', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
    const slots: any[] = [], effects = new Map<number, {deps: unknown[]; cleanup?: () => void}>();
    let hook = 0;
    const same = (a: unknown[] | undefined, b: unknown[]) => !!a && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
    const hooks = {
      useState(initial: unknown) {const i = hook++; if (!(i in slots)) slots[i] = initial; return [slots[i], (value: unknown) => {slots[i] = value;}];},
      useRef(initial: unknown) {const i = hook++; if (!(i in slots)) slots[i] = {current: initial}; return slots[i];},
      useEffect(create: () => void | (() => void), deps: unknown[]) {
        const i = hook++, prior = effects.get(i);
        if (!same(prior?.deps, deps)) {
          prior?.cleanup?.();
          const cleanup = create();
          effects.set(i, {deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined});
        }
      },
    };
    const module = {exports: {} as Record<string, any>};
    new Function('require', 'module', 'exports', compiled)((name: string) => {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '../lib/head-slice-playback') return {createHeadSlicePlaybackController};
      throw new Error(`Unexpected import ${name}`);
    }, module, module.exports);
    const emitted: number[] = [];
    let slice = 3;
    const render = () => {hook = 0; const rendered = module.exports.default({plane: 'axial', slice, sliceCount: 4,
      onSlice: (value: number) => {emitted.push(value); slice = value;}, interactionRoot: {current: null},
      resetIdentity: 'study', resetVersion: 0});
      // React commits the controls DOM ref before users can operate playback.
      // This fixture has no enclosing tools disclosure, so it is always open.
      rendered.props.ref.current ??= {closest: () => null};
      return rendered;
    };
    const find = (node: any, predicate: (value: any) => boolean): any => {
      if (Array.isArray(node)) return node.map(item => find(item, predicate)).find(Boolean);
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) return node;
      return find(node.props?.children, predicate);
    };
    let tree = render();
    const control = (type: string, label: RegExp) => find(tree, node => node.type === type && label.test(String(node.props?.['aria-label'] ?? node.props?.children ?? '')));
    assert.equal(control('button', /play slices/i).props.disabled, true, 'forward endpoint cannot play');
    const replay = control('button', /replay/i);
    assert(replay, 'explicit replay button is present');
    assert.equal(replay.props.disabled, false);
    const direction = control('select', /direction/i);
    assert(direction, 'direction selector is present');
    direction.props.onChange({target: {value: '-1'}});
    tree = render();
    assert.equal(control('button', /play slices/i).props.disabled, false, 'reverse can play from the last index');
    documentTarget.hidden = true;
    control('button', /replay/i).props.onClick();
    assert.deepEqual(emitted, [], 'hidden document refuses replay');
    documentTarget.hidden = false;
    control('button', /replay/i).props.onClick();
    assert.deepEqual(emitted, [3], 'reverse replay starts from the last native index');
    tree = render();
    assert.equal(control('button', /replay/i).props.disabled, true, 'replay is disabled while playing');
    for (const effect of effects.values()) effect.cleanup?.();
  } finally {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  }
});
