import fs from 'node:fs/promises';
/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Deliberately injected hooks exercise the monitor outside React; actual components retain normal hook rules. */
/* oxlint-disable typescript/unbound-method -- Tests retain original method identities and invoke retired methods with an explicit receiver. */
import assert from 'node:assert/strict';
import { historicalRecipeProfiles } from './recipe-history.mjs';
import { reviewDisplayPaths } from './review-revision-evidence.mjs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import ts from 'typescript';
import {
  observeRenderer,
  rendererReady,
  copyRecoveryCamera,
  guardRenderer,
} from '../lib/renderer-health.ts';
import { dissectionProfiles } from '../app/dissection-data.ts';
let checks = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const states = ['starting', 'ready', 'lost', 'restoring', 'failed'];
const raw = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  ),
  catalog = JSON.parse(raw);
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(JSON.stringify(historicalRecipeProfiles(dissectionProfiles))),
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c',
);
for (const b of catalog.bundles)
  same(
    hash(
      await fs.readFile('public/models/bodyparts3d/full-body/' + b.id + '.glb'),
    ),
    b.sha256,
  );
for (const s of states) same(rendererReady(s), s === 'ready');
const camera = {
  direction: [0, 0, 1],
  up: [0, 1, 0],
  pan: [0.2, 0, 0],
  scale: 0.8,
};
const clone = copyRecoveryCamera(camera);
same(clone, camera);
check(clone !== camera);
for (const k of ['direction', 'up', 'pan']) check(clone[k] !== camera[k]);
same(copyRecoveryCamera(null), null);
class Target extends EventTarget {
  listeners = 0;
  addEventListener(...args) {
    super.addEventListener(...args);
    this.listeners++;
  }
  removeEventListener(...args) {
    super.removeEventListener(...args);
    this.listeners--;
  }
}
let eventSequences = 0;
for (const initiallyLost of [false, true])
  for (let repetitions = 1; repetitions <= 6; repetitions++) {
    const canvas = new Target(),
      seen = [];
    let lost = initiallyLost,
      invalidations = 0;
    const observer = observeRenderer(
      canvas,
      () => lost,
      (s) => seen.push(s),
      () => invalidations++,
    );
    same(seen, ['starting']);
    same(canvas.listeners, 2);
    same(invalidations, 1);
    observer.frame();
    same(seen.at(-1), lost ? 'lost' : 'ready');
    for (let i = 0; i < repetitions; i++) {
      lost = true;
      const event = new Event('webglcontextlost', { cancelable: true });
      canvas.dispatchEvent(event);
      check(event.defaultPrevented);
      same(seen.at(-1), 'lost');
      const count = seen.length;
      observer.frame();
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      same(seen.length, count);
      lost = false;
      observer.frame();
      same(
        seen.at(-1),
        'lost',
        'A healthy probe cannot bypass the restoration event',
      );
      canvas.dispatchEvent(new Event('webglcontextrestored'));
      same(seen.at(-1), 'restoring');
      observer.frame();
      same(seen.at(-1), 'ready');
      const readyCount = seen.length;
      observer.frame();
      canvas.dispatchEvent(new Event('webglcontextrestored'));
      same(seen.length, readyCount);
    }
    observer.dispose();
    same(canvas.listeners, 0);
    const count = seen.length;
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    observer.frame();
    same(seen.length, count);
    eventSequences++;
  }
{
  const seen = [],
    canvas = new Target();
  const observer = observeRenderer(
    canvas,
    () => {
      throw Error('context unavailable');
    },
    (s) => seen.push(s),
    () => {},
  );
  observer.frame();
  same(seen, ['starting', 'failed']);
  observer.frame();
  same(seen.length, 2);
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  observer.frame();
  same(
    seen,
    ['starting', 'failed'],
    'Failure is terminal until a new observer',
  );
  observer.dispose();
}

let rendererFaultCases = 0;
for (const mode of [
  'healthy',
  'render-throw',
  'shader',
  'shader-handler-throw',
]) {
  const messages = [],
    canvas = new Target(),
    scene = {},
    camera = {};
  let calls = 0,
    chained = 0;
  const observer = observeRenderer(
    canvas,
    () => false,
    (s) => messages.push(s),
    () => {},
  );
  const renderer = {
    debug: {
      checkShaderErrors: true,
      onShaderError: function (...args) {
        same(this, renderer.debug);
        same(args, ['context', 'program', 'vertex', 'fragment']);
        chained++;
        if (mode === 'shader-handler-throw') throw Error('handler failed');
      },
    },
    render: function (s, c) {
      same(this, renderer, 'Preserve render receiver');
      same([s, c], [scene, camera]);
      calls++;
      if (mode === 'render-throw') throw Error('draw failed');
      if (mode.startsWith('shader'))
        this.debug.onShaderError('context', 'program', 'vertex', 'fragment');
    },
  };
  const originalRender = renderer.render,
    originalShader = renderer.debug.onShaderError;
  const guard = guardRenderer(renderer, observer.fail, observer.frame);
  const retiredRender = renderer.render,
    retiredShader = renderer.debug.onShaderError;
  renderer.render(scene, camera);
  same(messages, ['starting', mode === 'healthy' ? 'ready' : 'failed']);
  same(calls, 1);
  same(chained, mode.startsWith('shader') ? 1 : 0);
  renderer.render(scene, camera);
  same(calls, mode === 'healthy' ? 2 : 1, 'Failed render cannot keep drawing');
  if (mode !== 'healthy') {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    observer.frame();
    same(messages, ['starting', 'failed']);
  }
  guard.dispose();
  observer.dispose();
  same(renderer.render, originalRender);
  same(renderer.debug.onShaderError, originalShader);
  same(renderer.debug.checkShaderErrors, true);
  const before = [...messages];
  try {
    retiredRender.call(renderer, scene, camera);
  } catch {
    /* Original behaviour restored. */
  }
  try {
    retiredShader.call(
      renderer.debug,
      'context',
      'program',
      'vertex',
      'fragment',
    );
  } catch {
    /* Original handler. */
  }
  same(messages, before, 'Retired instrumentation cannot send health events');
  guard.dispose();
  rendererFaultCases++;
}
{
  let faults = 0,
    frames = 0;
  const renderer = {
    render: () => {},
    debug: { checkShaderErrors: true, onShaderError: null },
  };
  const guard = guardRenderer(
    renderer,
    () => faults++,
    () => frames++,
  );
  renderer.debug.onShaderError(null, null, null, null);
  renderer.debug.onShaderError(null, null, null, null);
  renderer.render({}, {});
  same([faults, frames], [1, 0]);
  const laterRender = () => {},
    laterShader = () => {};
  renderer.render = laterRender;
  renderer.debug.onShaderError = laterShader;
  guard.dispose();
  same(renderer.render, laterRender);
  same(renderer.debug.onShaderError, laterShader);
  rendererFaultCases++;
}

// Real recovery components; injected hooks exercise the monitor without a browser.
const require = createRequire(import.meta.url),
  React = require('react'),
  { renderToStaticMarkup } = require('react-dom/server');
let monitorMode = false,
  cleanup,
  invalidations = 0;
const monitorCanvas = new Target(),
  monitorMessages = [];
let monitorLost = false;
const rootState = {
  gl: {
    domElement: monitorCanvas,
    getContext: () => ({ isContextLost: () => monitorLost }),
    render: () => {},
    debug: { checkShaderErrors: true, onShaderError: null },
  },
  invalidate: () => invalidations++,
};
const reactShim = {
  ...React,
  useRef: (value) => (monitorMode ? { current: value } : React.useRef(value)),
  useLayoutEffect: (fn, deps) =>
    monitorMode ? (cleanup = fn()) : React.useLayoutEffect(fn, deps),
};
// Transform an explicit in-workspace module set. Unlike bundler resolution,
// this does not search restricted ancestor directories for configuration.
// The actual notice, installed Button primitive and utilities remain exercised.
const moduleSources = [];
for (const file of [
  'lib/utils.ts',
  'components/ui/button.tsx',
  'lib/renderer-health.ts',
  'app/scene-recovery.tsx',
]) {
  const code = transformSync(await fs.readFile(file, 'utf8'), {
    loader: file.endsWith('tsx') ? 'tsx' : 'ts',
    format: 'cjs',
    jsx: 'automatic',
  }).code;
  moduleSources.push(`modules[${JSON.stringify('@/' + file.replace(/\.tsx?$/, ''))}] = (() => {
    const module = { exports: {} }; const exports = module.exports;
    ${code}
    return module.exports;
  })();`);
}
const output = `const modules = {}; const externalRequire = require;
  require = (id) => id.endsWith('.css') ? {} :
    Object.hasOwn(modules, id) ? modules[id] : externalRequire(id);
  ${moduleSources.join('\n')}
  module.exports = modules['@/app/scene-recovery'];`;
const vmModule = { exports: {} },
  document = { body: {}, activeElement: null };
runInNewContext(output, {
  module: vmModule,
  exports: vmModule.exports,
  console,
  document,
  process: { env: { NODE_ENV: 'test' } },
  require: (id) =>
    id === 'react'
      ? reactShim
      : id === '@react-three/fiber'
        ? {
            useThree: () => rootState,
          }
        : require(id),
});
const api = vmModule.exports;
monitorMode = true;
api.RendererMonitor({ onHealth: (s) => monitorMessages.push(s) });
monitorMode = false;
same(monitorMessages, ['starting']);
rootState.gl.render({}, {});
same(monitorMessages.at(-1), 'ready');
monitorLost = true;
monitorCanvas.dispatchEvent(
  new Event('webglcontextlost', { cancelable: true }),
);
same(monitorMessages.at(-1), 'lost');
monitorLost = false;
monitorCanvas.dispatchEvent(new Event('webglcontextrestored'));
same(monitorMessages.at(-1), 'restoring');
rootState.gl.render({}, {});
same(monitorMessages.at(-1), 'ready');
cleanup();
same(monitorCanvas.listeners, 0);
const monitorCount = monitorMessages.length;
rootState.gl.render({}, {});
same(monitorMessages.length, monitorCount);
// Reinstall the actual monitor with the same renderer (Strict Mode-style cleanup).
monitorMode = true;
api.RendererMonitor({ onHealth: (s) => monitorMessages.push(s) });
monitorMode = false;
same(monitorMessages.at(-1), 'starting');
rootState.gl.debug.onShaderError(null, null, null, null);
same(monitorMessages.at(-1), 'failed');
rootState.gl.render({}, {});
same(monitorMessages.at(-1), 'failed');
cleanup();
same(monitorCanvas.listeners, 0);
same(rootState.gl.debug.onShaderError, null);
let markupCases = 0;
for (const health of states) {
  const html = renderToStaticMarkup(
    React.createElement(api.SceneRecoveryNotice, { health, onRetry: () => {} }),
  );
  markupCases++;
  if (health === 'ready') same(html, '');
  else {
    check(html.includes('<output'));
    check(html.includes('aria-live="polite"'));
    check(html.includes('Restart 3D view'));
    check(html.includes('answers are retained'));
    check(!html.includes('role="dialog"'));
  }
}
const notices = [],
  capture = { current: camera },
  restore = { current: null };
const recovery = new api.SceneRecovery({
  className: 'body-scene',
  cameraKey: 'posterior/1/0',
  onHealth: (h) => notices.push(h),
  cameraCapture: capture,
  cameraRestore: restore,
  children: () => null,
});
recovery.setState = (update) => {
  recovery.state = {
    ...recovery.state,
    ...(typeof update === 'function' ? update(recovery.state) : update),
  };
};
recovery.componentDidMount();
same(notices, ['starting']);
const oldReport = recovery.report;
oldReport('ready');
same(recovery.state.health, 'ready');
recovery.retry();
same(recovery.state.attempt, 0);
oldReport('lost');
recovery.retry();
same(recovery.state.attempt, 1);
same(recovery.state.health, 'starting');
same(JSON.stringify(restore.current), JSON.stringify(camera));
check(restore.current !== camera);
oldReport('ready');
same(
  recovery.state.health,
  'starting',
  'Retired viewer cannot resume practice',
);
recovery.report('ready');
same(recovery.state.health, 'ready');
const pendingCamera = { ...camera, scale: 0.35 };
restore.current = pendingCamera;
recovery.report('lost');
recovery.retry();
same(restore.current, pendingCamera);
recovery.state = {
  ...recovery.state,
  ...api.SceneRecovery.getDerivedStateFromError(),
};
recovery.componentDidCatch();
same(notices.at(-1), 'failed');
recovery.report('ready');
same(recovery.state.health, 'failed');
recovery.retry();
same(recovery.state.attempt, 3);
same(recovery.state.health, 'starting');
let focused = 0;
recovery.container.current = { contains: () => false, focus: () => focused++ };
document.activeElement = document.body;
const previous = { ...recovery.state };
recovery.report('ready');
recovery.componentDidUpdate(recovery.props, previous);
same(focused, 1);
recovery.report('lost');
recovery.retry();
document.activeElement = { outside: true };
const before = { ...recovery.state };
recovery.report('ready');
recovery.componentDidUpdate(recovery.props, before);
same(focused, 1, 'No focus stealing');
recovery.report('lost');
restore.current = null;
recovery.props = { ...recovery.props, cameraKey: 'anterior/1/1' };
recovery.retry();
same(
  restore.current,
  null,
  'A camera preset chosen while interrupted takes precedence',
);
recovery.report('ready');
{
  const freshRestore = { current: null };
  const fresh = new api.SceneRecovery({
    className: 'body-scene',
    cameraKey: 'new-view',
    onHealth: () => {},
    cameraCapture: capture,
    cameraRestore: freshRestore,
    children: () => null,
  });
  fresh.setState = (update) => {
    fresh.state = { ...fresh.state, ...update };
  };
  fresh.componentDidMount();
  fresh.retry();
  same(
    freshRestore.current,
    null,
    'A never-ready viewer must not reuse a previous viewer camera',
  );
  fresh.componentWillUnmount();
}
recovery.componentWillUnmount();
const terminal = notices.length;
recovery.report('lost');
recovery.retry();
same(notices.length, terminal);

// Execute extracted application handlers and their actual readiness expressions.
const body = await fs.readFile('app/body-explorer.tsx', 'utf8'),
  shoulder = await fs.readFile('app/shoulder-explorer.tsx', 'utf8');
function extract(source, name) {
  const ast = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let text;
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && n.name?.text === name)
      text = n.getText(ast);
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === name)
      text = 'const ' + n.getText(ast) + ';';
    ts.forEachChild(n, visit);
  }
  visit(ast);
  check(text);
  return transformSync(text, { loader: 'ts' }).code;
}
const paused = extract(body, 'practicePaused'),
  blocked = extract(body, 'practiceBlocked');
let handlerCases = 0;
for (const displayReady of [false, true])
  for (const missing of [false, true])
    for (const failed of [false, true]) {
      const context = {
        displayReady,
        exam: true,
        pending: missing ? ['x'] : [],
        loadStatus: { failed: failed ? ['x'] : [] },
      };
      same(
        runInNewContext(paused + ';practicePaused;', context),
        !displayReady || missing || failed,
      );
      same(
        runInNewContext(blocked + ';practiceBlocked;', {
          displayReady,
          practiceReady: true,
          practiceLoadStatus: { pending: missing ? ['x'] : [] },
        }),
        !displayReady || missing,
      );
      for (const name of ['submitPractice', 'nextQuestion']) {
        for (const answered of [false, true]) {
        const calls = [];
        let restored = 0;
        runInNewContext(
          paused +
            extract(body, name) +
            ';' +
            name +
            '(' +
            (name === 'submitPractice' ? "'target'" : '') +
            ');',
          {
            ...context,
            practice: { id: 1, mode: 'find', questions: [{ target: 'target' }] },
            question: 0,
            answered,
            restorePracticeView: () => { restored++; },
            practiceDispatch: (a) => calls.push(a),
            setZoom: () => {},
            setReset: () => {},
          },
        );
        same(calls.length, displayReady && !missing && !failed ? 1 : 0);
        same(restored, name === 'nextQuestion' && answered && displayReady && !missing && !failed ? 1 : 0);
        handlerCases++;
        }
      }
    }
for (const displayReady of [false, true])
  for (const mode of ['study', 'exam']) {
    const calls = [];
    runInNewContext(
      extract(shoulder, 'handleSceneSelect') + ";handleSceneSelect('id');",
      {
        displayReady,
        mode,
        selectStructure: (id) => calls.push(id),
        practiceDispatch: (a) => calls.push(a),
        shoulderPractice: { id: 1 },
        questionIndex: 0,
      },
    );
    same(calls.length, displayReady ? (mode === 'exam' ? 2 : 1) : 0);
    handlerCases++;
  }
for (const name of ['nextQuestion', 'beginShoulderPractice', 'toggleMode']) {
  const calls = [];
  runInNewContext(extract(shoulder, name) + ';' + name + '();', {
    displayReady: false,
    mode: 'study',
    practiceDispatch: (a) => calls.push(a),
  });
  same(calls, []);
  handlerCases++;
}
for (const [file, source] of [
  ['app/body-scene.tsx', body],
  ['app/anatomy-scene.tsx', shoulder],
]) {
  const scene = await fs.readFile(file, 'utf8');
  check(scene.includes('<SceneRecovery'));
  check(scene.includes('<RendererMonitor onHealth={onHealth}'));
  check(scene.includes('cameraRestore={props.cameraRestore}'));
  check(scene.includes('onHealth={props.onRendererHealth}'));
  check(scene.includes('cameraKey={'));
  check(source.includes('onRendererHealth={setRendererHealth}'));
}
check(shoulder.includes('onModelReady={setModelReady}'));
check(shoulder.includes('rendererReady(rendererHealth) && modelReady'));
check(shoulder.includes("mode === 'study' && !displayReady"));
check(shoulder.includes('onClick={nextQuestion} disabled={!displayReady}'));
check(body.includes('Practice paused while the 3D view recovers.'));
// Exit stays usable during a graphics interruption; no exam restart is invoked.
for (const saved of [null, {view:{layout:'tray',selectedId:'original'},zoomStep:3}]) {
  const calls = [];
  const spy = (name) => (value) =>
    calls.push([name, typeof value === 'function' ? value('exam') : value]);
  const beforeExam = {current:saved};
  runInNewContext(extract(shoulder, 'toggleMode') + ';toggleMode();', {
    displayReady: false,
    mode: 'exam',
    beforeExam,
    applyStudyView: spy('restore'),
    setZoomStep: spy('zoomStep'),
    setPlate: spy('plate'),
    setLayout: spy('layout'),
    setSyncPlane: spy('plane'),
    setMode: spy('mode'),
    practiceDispatch: spy('practice'),
    setIsolated: spy('isolate'),
    setLayer: spy('layer'),
    setVisibleSystems: spy('systems'),
    setExplode: spy('explode'),
    beginShoulderPractice: () => {
      throw Error('Must not restart an unavailable exam');
    },
  });
  same(calls.find((c) => c[0] === 'mode')?.[1], 'study');
  same(calls.find((c) => c[0] === 'restore')?.[1], saved?.view);
  same(calls.find((c) => c[0] === 'zoomStep')?.[1], saved?.zoomStep);
  same(beforeExam.current, null);
  check(!calls.some(c => ['layout','layer','systems','explode'].includes(c[0])),
    'Unavailable exit must not overwrite the saved presentation with exam defaults');
  same(calls.find((c) => c[0] === 'practice')?.[1].type, 'dismiss');
  handlerCases++;
}
check(body.includes('disabled={!exam && practiceBlocked}'));
for (const health of states) {
  const surface = new api.SceneRecovery({
    className: 'body-scene',
    onHealth: () => {},
    children: () => React.createElement('div', null, 'canvas test double'),
  });
  surface.state = { health, attempt: 0 };
  const html = renderToStaticMarkup(surface.render());
  check(html.includes('aria-label="Interactive 3D anatomy"'));
  same(html.includes('inert=""'), health !== 'ready');
  same(html.includes('aria-hidden="true"'), health !== 'ready');
  same(html.includes('canvas test double'), health !== 'failed');
  markupCases++;
}
const css = await fs.readFile('app/scene-recovery.css', 'utf8');
check(css.includes('visibility: hidden'));
check(css.includes('pointer-events: none'));
check(css.includes('var(--vm-teal)'));
const revisions = JSON.parse(await fs.readFile('content/review-revisions.json', 'utf8'));
for (const path of [
  'app/scene-recovery.tsx',
  'app/scene-recovery.css',
  'lib/renderer-health.ts',
]) {
  check(reviewDisplayPaths.includes(path), `${path} must be part of the actual review generator`);
  const entries = revisions.display.filter(([entry]) => entry === path);
  same(entries.length, 1, `${path} must have one saved review binding`);
  same(entries[0][1], hash((await fs.readFile(path, 'utf8')).replace(/\r\n/g, '\n')),
    `${path} binding must match current source`);
}
const result = {
  passed: true,
  checks,
  eventSequences,
  rendererFaultCases,
  handlerCases,
  markupCases,
  bodyStructures: 1022,
  bodyBundles: 86,
  regions: 11,
  wholeBody: true,
  shoulder: true,
  catalogSha256: hash(raw),
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'Real observer events, per-renderer guard and recovery methods, injected monitor hooks, extracted application handlers and server-rendered notices. Synchronous render exceptions and shader-error callbacks use test doubles, not a GPU. No hardware reset, pixels, async browser/WebGL initialization failure, unrelated frame-callback failure, touch or assistive-technology acceptance is claimed.',
};
await fs.writeFile(
  'docs/scene-recovery-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
