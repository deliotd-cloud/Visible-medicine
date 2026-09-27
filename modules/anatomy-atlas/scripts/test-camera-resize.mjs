import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const three = require('three');
const baseline = process.argv.includes('--baseline');
const fiberDist = 'node_modules/@react-three/fiber/dist';
const eventModules = (await readdir(fiberDist)).filter(name => /^events-.*\.esm\.js$/.test(name));
assert.equal(eventModules.length, 1, 'exactly one installed R3F ESM events module');
const source = await readFile(`${fiberDist}/${eventModules[0]}`, 'utf8');
const start = source.indexOf('function updateCamera(camera, size) {');
assert(start >= 0, 'installed R3F updateCamera is present');
let depth = 0, end = -1;
for (let i = source.indexOf('{', start); i < source.length; i++) {
  if (source[i] === '{') depth++;
  if (source[i] === '}' && --depth === 0) { end = i + 1; break; }
}
assert(end > start, 'installed R3F updateCamera is complete');
const updateCamera = runInNewContext(
  `${source.slice(start, end)}; updateCamera`,
  { isOrthographicCamera: camera => camera.isOrthographicCamera },
);
const baselineSource = baseline
  ? execFileSync('git', ['show', '0cd212522768621f1933a9a11c50adf0cbcefef9:app/fitted-camera.tsx'], { encoding: 'utf8' })
  : null;
const compiled = await build({
  stdin: baseline
    ? { contents: baselineSource, resolveDir: `${process.cwd()}/app`, sourcefile: 'fitted-camera.tsx', loader: 'tsx' }
    : { contents: "export { FittedCamera } from './app/fitted-camera'; export { captureStudyCamera } from './lib/study-camera';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'cjs',
});

let checks = 0;
function near(actual, expected, label) {
  checks++;
  assert(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} / ${expected}`);
}
function yes(value, label) { checks++; assert(value, label); }

function harness(orthographic, width = 390, height = 844) {
  const camera = orthographic
    ? new three.OrthographicCamera()
    : new three.PerspectiveCamera(38, width / height, .01, 150);
  const size = { width, height };
  const controls = { target: new three.Vector3(), update() { camera.updateMatrixWorld(); } };
  const refs = [];
  let index = 0, effects = [];
  const mod = { exports: {} };
  runInNewContext(compiled.outputFiles[0].text, {
    module: mod, exports: mod.exports,
    require(name) {
      if (name === 'react') return {
        useRef(value) { return refs[index++] ?? (refs[index - 1] = { current: value }); },
        useCallback: fn => fn, useEffect: fn => effects.push(fn),
      };
      if (name === '@react-three/fiber') return { useThree: () => ({ camera, size, invalidate() {} }), useFrame() {} };
      if (name === '@react-three/drei') return { OrbitControls: 'OrbitControls' };
      return require(name);
    },
  });
  const tray = new three.Box3(new three.Vector3(-2, -1, -.4), new three.Vector3(2, 1, .4));
  const assembled = new three.Box3(new three.Vector3(-1, -2, -.4), new three.Vector3(1, 2, .4));
  const capture = { current: null }, restore = { current: null };
  const props = {
    bounds: tray, direction: [0, 0, 1], viewKey: 'hand/dissect/stage2',
    zoom: 1, zoomStep: 0, reset: 0, cameraCapture: capture, cameraRestore: restore,
  };
  function render(changes = {}) {
    Object.assign(props, changes);
    index = 0; effects = [];
    const element = mod.exports.FittedCamera(props);
    element.props.ref.current = controls;
    for (const effect of effects) effect();
    return capture.current;
  }
  function resize(width, height) {
    size.width = width; size.height = height;
    updateCamera(camera, size); // R3F runs this before React's camera effect.
    return render();
  }
  function gesture(factor) {
    if (orthographic) camera.zoom /= factor;
    else camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return render();
  }
  return { camera, size, controls, props, tray, assembled, capture, restore, render, resize, gesture };
}

for (const orthographic of [true, false]) {
  const kind = orthographic ? 'orthographic' : 'perspective';
  const h = harness(orthographic);
  near(h.render().scale, 1, `${kind} mobile initial fit`);
  if (orthographic && !baseline) yes(h.camera.manual === true, 'fitted orthographic camera owns its frustum');
  else yes(!h.camera.manual, 'perspective camera keeps R3F automatic aspect');
  near(h.gesture(.6).scale, .6, `${kind} gesture before resize`);
  near(h.render({ zoomStep: 1 }).scale, .6 * .85, `${kind} slider after gesture`);
  near(h.resize(390, 600).scale, .6 * .85, `${kind} caption height change keeps zoom`);
  near(h.resize(844, 390).scale, .6 * .85, `${kind} landscape resize keeps zoom`);
  near(h.resize(390, 844).scale, .6 * .85, `${kind} portrait return keeps zoom`);
  if (!orthographic) near(h.camera.aspect, 390 / 844, 'perspective automatic aspect updated');
  near(h.render({ bounds: h.assembled }).scale, .6 * .85, `${kind} tray to assembled keeps zoom`);
  const saved = structuredClone(h.capture.current);
  near(h.render({ reset: 1 }).scale, 1, `${kind} reset recovers fit`);
  h.restore.current = saved;
  near(h.render().scale, saved.scale, `${kind} saved view restored`);
  near(h.resize(390, 600).scale, saved.scale, `${kind} saved view survives height change`);
}
// The reported mobile sequence combines a slider return with a canvas resize
// in one React effect, after R3F has already updated the camera.
for (const orthographic of [true, false]) {
  const kind = orthographic ? 'orthographic' : 'perspective';
  const h = harness(orthographic);
  h.render();
  h.render({ zoomStep: 1 });
  h.size.height = 600;
  updateCamera(h.camera, h.size);
  near(h.render({ zoomStep: 0 }).scale, 1, `${kind} tray slider return and resize together`);
  near(h.resize(780, 1200).scale, 1, `${kind} doubled canvas dimensions keep relative fit`);
}
console.log(JSON.stringify({ checks, baseline, installedR3FUpdateCamera: true, actualFittedCameraEffect: true }));
