import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { AnatomyRootSession } from '../lib/anatomy-root-session.ts';
import React, { act, useLayoutEffect } from 'react';
import {
  createRoot,
  extend,
  events,
  useFrame,
  useThree,
  _roots,
} from '@react-three/fiber';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { transformSync } from 'esbuild';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
function frames() {
  let serial = 0;
  const pending = new Map();
  return {
    pending,
    request: (callback) => {
      const id = ++serial;
      pending.set(id, callback);
      return id;
    },
    cancel: (id) => pending.delete(id),
    tick: (time) => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((fn) => fn(time));
    },
  };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function fixture({ setup, advance, resize, connect, renderFailure } = {}) {
  const queue = frames(),
    notices = [],
    renders = [],
    connections = [],
    times = [],
    sizes = [];
  let config,
    unmounts = 0;
  const subscribers = new Set();
  const state = {
    size: { width: 100, height: 100, top: 0, left: 0 },
    invalidate: () => {},
    advance: (...args) => {
      times.push(args);
      advance?.(session);
    },
    events: {
      connect: (target) => {
        connections.push(target);
        connect?.();
      },
    },
    setSize: (width, height, top, left) => {
      resize?.();
      state.size = { width, height, top, left };
      sizes.push(state.size);
    },
    setDpr: (value) => {
      state.dpr = value;
    },
  };
  const store = {
    getState: () => state,
    setState: (patch) => {
      Object.assign(state, patch);
      subscribers.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
  const root = {
    configure: async (value) => {
      config = value;
      await setup?.();
    },
    render: (node) => {
      renders.push(node);
      if (renderFailure) throw Error('secondary render failure');
      return store;
    },
    unmount: () => unmounts++,
  };
  const host = {};
  const session = new AnatomyRootSession({
    root,
    host,
    onFailure: () => notices.push('failed'),
    requestFrame: queue.request,
    cancelFrame: queue.cancel,
  });
  return {
    session,
    state,
    store,
    host,
    queue,
    notices,
    renders,
    connections,
    times,
    sizes,
    subscribers,
    created: () => config.onCreated(state),
    get unmounts() {
      return unmounts;
    },
    get config() {
      return config;
    },
  };
}

const config = {
  size: { width: 100, height: 100, top: 0, left: 0 },
  dpr: [1, 1.6],
  camera: { position: [0, 0, 28], fov: 38 },
  gl: { antialias: true, alpha: true, localClippingEnabled: true },
  events: () => ({}),
};
let schedulerCases = 0;
for (let repeats = 1; repeats <= 12; repeats++) {
  const f = fixture();
  const original = f.state.invalidate;
  await f.session.start(config, 'initial');
  same(f.config.frameloop, 'never');
  same(f.config.camera, config.camera);
  same(f.config.gl, config.gl);
  same(f.queue.pending.size, 0, 'No draw before created');
  f.created();
  same(f.connections, [f.host]);
  for (let i = 0; i < repeats; i++) f.state.invalidate();
  same(f.queue.pending.size, 1, 'Invalidations coalesce');
  f.queue.tick(5000);
  same(f.times, [[0, false]]);
  same(f.queue.pending.size, 0, 'Idle demand view stops');
  f.state.invalidate(3);
  f.queue.tick(5016);
  f.queue.tick(5032);
  f.queue.tick(5048);
  same(f.times.length, 4);
  same(f.times.at(-1), [0.048, false]);
  same(f.queue.pending.size, 0);
  f.session.render('latest');
  same(f.renders.at(-1), 'latest');
  f.queue.tick(5064);
  f.store.setState({ arbitrary: 1 });
  same(f.queue.pending.size, 1);
  const retired = [...f.queue.pending.values()][0];
  f.session.dispose();
  same(f.queue.pending.size, 0);
  same(f.unmounts, 1);
  same(f.subscribers.size, 0);
  same(f.state.invalidate, original);
  const before = f.times.length;
  retired(5080);
  f.session.invalidate();
  f.session.fail();
  f.session.dispose();
  same(f.times.length, before);
  same(f.notices, []);
  same(f.unmounts, 1);
  schedulerCases++;
}
{
  let runs = 0;
  const f = fixture({
    advance: (s) => {
      if (++runs < 4) s.invalidate();
    },
  });
  await f.session.start(config, 'orbit');
  f.created();
  for (let i = 0; i < 4; i++) f.queue.tick(10 + i * 16);
  same(runs, 4);
  same(
    f.queue.pending.size,
    0,
    'Damping stops once no further frame requested',
  );
  f.session.invalidate(99999);
  for (let i = 0; i < 60; i++) f.queue.tick(1000 + i * 16);
  same(f.queue.pending.size, 0, 'Bounded requested frame count');
  f.session.dispose();
  schedulerCases++;
}
let faultCases = 0;
{
  const f = fixture({
    setup: () => {
      throw Error('initial setup failure');
    },
    renderFailure: true,
  });
  await f.session.start(config, null);
  same(
    f.notices,
    ['failed'],
    'Secondary cleanup failure does not escape startup',
  );
  f.session.dispose();
  same(f.unmounts, 1);
  faultCases++;
}
for (const mode of [
  'configure-throw',
  'configure-reject',
  'frame',
  'connect',
  'resize',
]) {
  const f = fixture({
    setup:
      mode === 'configure-reject'
        ? () => Promise.reject(Error(mode))
        : mode === 'configure-throw'
          ? () => {
              throw Error(mode);
            }
          : undefined,
    advance:
      mode === 'frame'
        ? () => {
            throw Error(mode);
          }
        : undefined,
    connect:
      mode === 'connect'
        ? () => {
            throw Error(mode);
          }
        : undefined,
    resize:
      mode === 'resize'
        ? () => {
            throw Error(mode);
          }
        : undefined,
  });
  await f.session.start(config, 'root');
  if (!mode.startsWith('configure')) {
    f.created();
    if (mode === 'resize')
      f.session.resize({ ...config.size, width: 200 }, 1.5);
    else f.queue.tick(0);
  }
  same(f.notices, ['failed'], mode);
  same(f.queue.pending.size, 0);
  f.created();
  f.session.render('ignored');
  f.session.invalidate();
  f.queue.tick(16);
  f.session.fail();
  same(f.notices, ['failed']);
  same(f.queue.pending.size, 0);
  f.session.dispose();
  same(f.unmounts, 1);
  faultCases++;
}
for (const outcome of ['resolve', 'reject']) {
  const gate = deferred(),
    f = fixture({ setup: () => gate.promise });
  const pending = f.session.start(config, 'old');
  f.session.render('pending update');
  f.session.resize({ ...config.size, width: 333 }, [1, 1.8]);
  f.session.dispose();
  same(f.unmounts, 0);
  if (outcome === 'resolve') gate.resolve();
  else gate.reject(Error('late'));
  await pending;
  same(f.unmounts, 1);
  same(f.renders, outcome === 'reject' ? [null] : []);
  same(f.notices, []);
  same(f.queue.pending.size, 0);
  faultCases++;
}
{
  const gate = deferred(),
    f = fixture({ setup: () => gate.promise });
  const pending = f.session.start(config, 'old');
  f.session.render('updated during setup');
  f.session.resize({ ...config.size, width: 333 }, 1.25);
  gate.resolve();
  await pending;
  f.created();
  same(f.renders, ['updated during setup']);
  same(f.state.size.width, 333);
  same(f.state.dpr, 1.25);
  const lateOwner = () => {};
  f.store.setState({ invalidate: lateOwner });
  f.session.dispose();
  same(f.state.invalidate, lateOwner);
}

// Real installed R3F reconciler, camera, meshes, event manager and frame hooks.
// Only DOM surface, RAF scheduling and WebGL renderer are doubles; no browser/GPU.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let globalFrames = 0;
globalThis.requestAnimationFrame = () => {
  globalFrames++;
  return 1;
};
globalThis.cancelAnimationFrame = () => {};
extend({ Mesh, BoxGeometry, MeshBasicMaterial });
const require = createRequire(import.meta.url);
// Compile exact local modules without walking parent directories for config.
// The unrendered recovery-notice Button/CSS are outside these graphics tests.
const locals = {};
const domFrames = frames();
const windowListeners = new Map();
const observers = [];
const testWindow = {
  requestAnimationFrame: domFrames.request,
  cancelAnimationFrame: domFrames.cancel,
  addEventListener: (name, fn) => windowListeners.set(name, fn),
  removeEventListener: (name, fn) => {
    if (windowListeners.get(name) === fn) windowListeners.delete(name);
  },
};
class TestResizeObserver {
  constructor(callback) {
    this.callback = callback;
    observers.push(this);
  }
  observe(host) {
    this.host = host;
  }
  disconnect() {
    this.host = null;
  }
}
for (const file of [
  'lib/anatomy-root-session.ts',
  'lib/renderer-health.ts',
  'app/anatomy-canvas.tsx',
  'app/scene-recovery.tsx',
]) {
  const code = transformSync(await fs.readFile(file, 'utf8'), {
    loader: file.endsWith('tsx') ? 'tsx' : 'ts',
    format: 'cjs',
    jsx: 'automatic',
  }).code;
  const vmModule = { exports: {} };
  runInNewContext(code, {
    module: vmModule,
    exports: vmModule.exports,
    console,
    process,
    window: testWindow,
    document: { createElement: () => new Surface() },
    ResizeObserver: TestResizeObserver,
    require: (id) => {
      if (id.endsWith('.css')) return {};
      if (id === '@/components/ui/button') return { Button: () => null };
      if (id.startsWith('@/')) {
        const key = id.slice(2) + '.ts';
        assert(key in locals, 'Explicit local module: ' + key);
        return locals[key];
      }
      return require(id);
    },
  });
  locals[file] = vmModule.exports;
}
const { AnatomyCanvas, AnatomyCanvasBoundary } =
  locals['app/anatomy-canvas.tsx'];
const { RendererMonitor } = locals['app/scene-recovery.tsx'];
{
  const reported = [],
    updates = [];
  const recovery = new locals['app/scene-recovery.tsx'].SceneRecovery({
    onHealth: (h) => reported.push(h),
    cameraKey: 'unchanged',
    className: 'test',
    children: () => null,
  });
  recovery.setState = (patch) => updates.push(patch);
  recovery.report('failed');
  recovery.report('ready');
  recovery.report('restoring');
  same(
    reported,
    ['failed'],
    'Failure cannot be undone by batched late health callbacks',
  );
  same(
    updates.map((update) => update.health),
    ['failed'],
  );
  recovery.componentDidMount();
  same(reported.at(-1), 'failed');
  recovery.state = { health: 'failed', attempt: 0 };
  recovery.retry();
  recovery.state = { health: 'starting', attempt: 1 };
  recovery.report('ready');
  same(reported.at(-1), 'ready');
  recovery.componentWillUnmount();
}
class Surface extends EventTarget {
  style = {};
  width = 100;
  height = 100;
  setPointerCapture() {}
  releasePointerCapture() {}
  remove() {
    this.removed = true;
  }
}
let integrationCases = 0;
const retiredSurfaces = [];
for (const orthographic of [false, true])
  for (const mode of [
    'healthy',
    'frame-before-draw',
    'render',
    'shader',
    'configure',
    'scene-react',
  ]) {
    const surface = new Surface(),
      queue = frames(),
      notices = [],
      visited = [],
      deltas = [];
    let state,
      draws = 0,
      lost = false,
      picks = 0;
    const gl = {
      domElement: surface,
      renderLists: { dispose() {} },
      xr: {
        isPresenting: false,
        addEventListener() {},
        removeEventListener() {},
      },
      shadowMap: {},
      debug: { checkShaderErrors: true, onShaderError: null },
      setSize() {},
      setPixelRatio() {},
      getContext: () => ({ isContextLost: () => lost }),
      forceContextLoss() {},
      render(scene, camera) {
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        draws++;
        if (mode === 'render') throw Error('render');
        if (mode === 'shader') gl.debug.onShaderError(null, null, null, null);
      },
    };
    const root = createRoot(surface);
    const session = new AnatomyRootSession({
      root,
      host: surface,
      onFailure: () => notices.push('failed'),
      requestFrame: queue.request,
      cancelFrame: queue.cancel,
    });
    function Scene() {
      const current = useThree();
      useFrame((_state, delta) => {
        visited.push('first');
        deltas.push(delta);
        if (mode === 'frame-before-draw') throw Error('frame');
      }, -1);
      useFrame(() => {
        visited.push('second');
      }, 0);
      useLayoutEffect(() => {
        state = current;
        current.invalidate();
      }, [current]);
      if (mode === 'scene-react') throw Error('Deliberate scene test failure');
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(RendererMonitor, {
          onHealth: (h) => {
            notices.push(h);
            if (h === 'failed') session.fail();
          },
        }),
        React.createElement(
          'mesh',
          { name: 'probe', onClick: () => picks++ },
          React.createElement('boxGeometry'),
          React.createElement('meshBasicMaterial'),
        ),
      );
    }
    await act(async () => {
      await session.start(
        {
          ...config,
          orthographic,
          events,
          gl:
            mode === 'configure'
              ? async () => {
                  throw Error('creation failed');
                }
              : gl,
        },
        React.createElement(
          AnatomyCanvasBoundary,
          { onFailure: session.fail },
          React.createElement(Scene),
        ),
      );
    });
    if (mode === 'configure' || mode === 'scene-react') {
      same(notices, ['failed']);
      same(queue.pending.size, 0);
    } else {
      check(state);
      same(state.camera.isOrthographicCamera === true, orthographic);
      same(state.frameloop, 'never');
      same(state.scene.getObjectByName('probe')?.isMesh, true);
      same(state.events.connected, surface);
      await act(async () => queue.tick(1000));
      if (mode === 'healthy') {
        same(notices.at(-1), 'ready');
        same(visited, ['first', 'second']);
        same(draws, 1);
        same(deltas, [0]);
        const click = {
          offsetX: 50,
          offsetY: 50,
          clientX: 50,
          clientY: 50,
          pointerId: 1,
          button: 0,
          target: surface,
        };
        state.events.handlers.onPointerDown({ ...click, type: 'pointerdown' });
        state.events.handlers.onClick({ ...click, type: 'click' });
        same(picks, 1, 'Installed event manager still selects the mesh');
        same(queue.pending.size, 0);
        state.invalidate();
        await act(async () => queue.tick(1016));
        same(deltas.at(-1), 0.016);
        await act(async () => {
          lost = true;
          surface.dispatchEvent(
            new Event('webglcontextlost', { cancelable: true }),
          );
        });
        same(notices.at(-1), 'lost');
        await act(async () => {
          lost = false;
          surface.dispatchEvent(new Event('webglcontextrestored'));
        });
        same(notices.at(-1), 'restoring');
        await act(async () => queue.tick(1032));
        same(notices.at(-1), 'ready');
        await act(async () =>
          session.resize({ width: 240, height: 120, top: 10, left: 20 }, 1.4),
        );
        same(state.get().size.width, 240);
        same(state.get().viewport.dpr, 1.4);
      } else {
        same(notices.at(-1), 'failed');
        same(notices.includes('ready'), false);
        same(queue.pending.size, 0);
        same(draws, mode === 'frame-before-draw' ? 0 : 1);
        if (mode === 'frame-before-draw')
          same(
            visited,
            ['first'],
            'Later subscriber and draw not run after failure',
          );
      }
    }
    await act(async () => session.dispose());
    retiredSurfaces.push(surface);
    integrationCases++;
  }

// Exercise the actual atlas canvas class with a deterministic DOM/RAF adapter.
// This covers mount/observe/update/retire lifetimes, not browser layout or touch.
let lifecycleCases = 0;
{
  let rect = { width: 0, height: 0, top: 0, left: 0 };
  const host = new Surface();
  const surfaces = [];
  host.getBoundingClientRect = () => rect;
  host.appendChild = (surface) => surfaces.push(surface);
  const failures = [];
  const renderer = ({ canvas }) => ({
    domElement: canvas,
    renderLists: { dispose() {} },
    xr: {
      isPresenting: false,
      addEventListener() {},
      removeEventListener() {},
    },
    shadowMap: {},
    setSize() {},
    setPixelRatio() {},
    forceContextLoss() {},
    render(scene, camera) {
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
    },
  });
  const child = (name) =>
    React.createElement(
      'mesh',
      { name },
      React.createElement('boxGeometry'),
      React.createElement('meshBasicMaterial'),
    );
  const canvas = new AnatomyCanvas({
    ...config,
    gl: renderer,
    frameloop: 'demand',
    children: child('original'),
    onFailure: () => failures.push('failed'),
  });
  canvas.host.current = host;
  await act(async () => canvas.componentDidMount());
  same(surfaces.length, 1);
  same(_roots.has(surfaces[0]), false, 'Zero-size host defers root creation');
  same(windowListeners.size, 2);
  same(observers.at(-1).host, host);
  rect = { width: 320, height: 180, top: 12, left: 24 };
  await act(async () => observers.at(-1).callback());
  const first = surfaces[0];
  const store = _roots.get(first).store;
  same(store.getState().scene.getObjectByName('original')?.isMesh, true);
  same(store.getState().events.connected, host);
  same(store.getState().size.width, 320);
  same(domFrames.pending.size, 1);
  await act(async () => domFrames.tick(10));
  same(domFrames.pending.size, 0);
  const oldFailure = canvas.contents().props.onFailure;
  canvas.props = { ...canvas.props, children: child('updated'), dpr: 1.25 };
  await act(async () => canvas.componentDidUpdate());
  same(store.getState().scene.getObjectByName('original'), undefined);
  same(store.getState().scene.getObjectByName('updated')?.isMesh, true);
  same(store.getState().viewport.dpr, 1.25);
  rect = { width: 500, height: 250, top: 8, left: 16 };
  await act(async () => windowListeners.get('resize')());
  same(store.getState().size.width, 500);
  rect = { ...rect, top: -20 };
  await act(async () => windowListeners.get('scroll')());
  same(store.getState().size.top, -20);
  const oldObserver = observers.at(-1);
  await act(async () => canvas.componentWillUnmount());
  same(first.removed, true);
  same(domFrames.pending.size, 0);
  same(windowListeners.size, 0);
  same(oldObserver.host, null);
  await act(async () => oldObserver.callback());
  same(domFrames.pending.size, 0);
  await act(async () => canvas.componentDidMount());
  const fresh = surfaces[1];
  check(
    fresh !== first,
    'Strict Mode-style restart owns a fresh physical canvas',
  );
  check(_roots.has(fresh));
  oldFailure();
  same(failures, [], 'Old React boundary cannot fail new canvas session');
  await new Promise((resolve) => setTimeout(resolve, 650));
  same(_roots.has(first), false);
  check(_roots.has(fresh), 'Retired root disposal leaves new attempt intact');
  canvas.contents().props.onFailure();
  canvas.contents().props.onFailure();
  same(failures, ['failed']);
  same(domFrames.pending.size, 0);
  await act(async () => canvas.componentWillUnmount());
  same(windowListeners.size, 0);
  same(observers.at(-1).host, null);
  retiredSurfaces.push(fresh);
  lifecycleCases++;
}
same(globalFrames, 0, 'Never join the shared frame loop');
await new Promise((resolve) => setTimeout(resolve, 650));
for (const surface of retiredSurfaces)
  same(_roots.has(surface), false, 'R3F retired root released');

const catalogRaw = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(catalogRaw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
for (const bundle of JSON.parse(catalogRaw).bundles)
  same(
    hash(
      await fs.readFile(
        'public/models/bodyparts3d/full-body/' + bundle.id + '.glb',
      ),
    ),
    bundle.sha256,
  );
for (const file of ['app/body-scene.tsx', 'app/anatomy-scene.tsx']) {
  const source = await fs.readFile(file, 'utf8');
  check(source.includes('AnatomyCanvas as Canvas'));
  check(source.includes("onFailure={() => onHealth('failed')}"));
  check(source.includes('<RendererMonitor onHealth={onHealth}'));
}
const result = {
  passed: true,
  checks,
  schedulerCases,
  faultCases,
  integrationCases,
  lifecycleCases,
  sourceGeometryChanged: false,
  browserInteractionTesting: false,
  clinicalValidation: false,
  limitations:
    'Installed R3F reconciler, mesh/camera/event state and hooks with a fake WebGL renderer, DOM surface and RAF queue. Not browser, GPU, touch, pixel or clinical acceptance.',
};
await fs.writeFile(
  'docs/anatomy-root-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
