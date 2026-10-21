import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const { Box3, PerspectiveCamera, Vector3 } = require('three');
const { OrbitControls } = require('three-stdlib');
const baseline = process.argv.includes('--baseline');
const baselineRevision = '952d758104102f5853e00e846cb3448511daa960';
const baselineSource = baseline
  ? execFileSync('git', ['show', `${baselineRevision}:app/fitted-camera.tsx`], { encoding: 'utf8' })
  : null;

class Surface {
  attributes = new Map();
  handlers = new Set();
  ownerDocument = { activeElement: this };
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  removeAttribute(key) { this.attributes.delete(key); }
  addEventListener(name, fn) { assert.equal(name, 'keydown'); this.handlers.add(fn); }
  removeEventListener(name, fn) { assert.equal(name, 'keydown'); this.handlers.delete(fn); }
  key(key, options = {}) {
    const event = {
      key, target: this, defaultPrevented: false, stopped: false,
      isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; },
      ...options,
    };
    for (const handler of this.handlers) handler(event);
    return event;
  }
}

const near = (actual, expected, label, tolerance = 1e-7) =>
  assert(Math.abs(actual - expected) < tolerance, `${label}: ${actual} != ${expected}`);
const nearVector = (actual, expected, label) =>
  near(actual.distanceTo(expected), 0, label);

const compiled = await build({
  stdin: { contents: "export { FittedCamera } from './app/fitted-camera';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: baseline ? [{
    name: 'exact-baseline-fitted-camera',
    setup(api) {
      api.onLoad({ filter: /[\\/]app[\\/]fitted-camera\.tsx$/, namespace: 'component-test' },
        args => ({ contents: baselineSource, loader: 'tsx', resolveDir: dirname(args.path) }));
    },
  }] : [],
});
const camera = new PerspectiveCamera(39, 1.5, .01, 150);
const controls = new OrbitControls(camera);
const surface = new Surface();
const gl = { domElement: surface }, size = { width: 900, height: 600 };
const refs = [], memo = [], effectSlots = [], module = { exports: {} };
let refIndex = 0, memoIndex = 0, effectIndex = 0, frame, pending = [], invalidations = 0;
const invalidate = () => { invalidations++; };
const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
runInNewContext(compiled.outputFiles[0].text, {
  module, exports: module.exports,
  require(name) {
    if (name === 'react') return {
      useRef(value) { return refs[refIndex++] ?? (refs[refIndex - 1] = { current: value }); },
      useCallback(fn, deps) {
        const slot = memoIndex++;
        if (!same(memo[slot]?.deps, deps)) memo[slot] = { deps, fn };
        return memo[slot].fn;
      },
      useEffect(fn, deps) {
        const slot = effectIndex++;
        if (!same(effectSlots[slot]?.deps, deps)) pending.push({ slot, fn, deps });
      },
    };
    if (name === '@react-three/fiber') return {
      useThree: () => ({ camera, size, gl, invalidate }),
      useFrame(fn) { frame = fn; },
    };
    if (name === '@react-three/drei') return { OrbitControls: 'OrbitControls' };
    return require(name);
  },
});
const capture = { current: null };
const props = {
  bounds: new Box3(new Vector3(-1, -2, -.5), new Vector3(1, 2, .5)),
  direction: [0, 0, 1], viewKey: 'anterior', zoom: 1, reset: 0,
  cameraCapture: capture, transitionMs: 1000,
};
function render(changes = {}) {
  pending = []; refIndex = 0; memoIndex = 0; effectIndex = 0;
  Object.assign(props, changes);
  const element = module.exports.FittedCamera(props);
  element.props.ref.current = controls;
  controls.enabled = true;
  controls.enableRotate = element.props.enableRotate;
  controls.enablePan = element.props.enablePan;
  controls.enableZoom = element.props.enableZoom;
  for (const { slot, fn, deps } of pending) {
    effectSlots[slot]?.cleanup?.();
    effectSlots[slot] = { deps, cleanup: fn() };
  }
  return element;
}
function advance(count) { for (let i = 0; i < count; i++) frame(null, .05); }
function startSweep(viewKey, direction, changes = {}) {
  const before = camera.position.clone();
  render({ viewKey, direction, transitionPaused: false, ...changes });
  nearVector(camera.position, before, `${viewKey} begins at current pose`);
  advance(5);
  assert(camera.position.distanceTo(before) > .01, `${viewKey} sweep advances`);
}

render();
assert.equal(surface.handlers.size, 1);
startSweep('posterior', [0, 0, -1]);
const beforeKey = camera.position.clone(), target = controls.target.clone();
const radius = controls.getDistance(), zoom = camera.zoom;
const azimuth = controls.getAzimuthalAngle();
const event = surface.key('ArrowRight');
assert.equal(event.defaultPrevented, true);
near(controls.getAzimuthalAngle(), azimuth + Math.PI / 18, 'normal arrow rotates ten degrees');
assert(camera.position.distanceTo(beforeKey) > .01, 'actual controls move camera');
nearVector(controls.target, target, 'rotation retains target');
near(controls.getDistance(), radius, 'rotation retains radius');
near(camera.zoom, zoom, 'rotation retains zoom');
const chosen = camera.position.clone(), saved = structuredClone(capture.current);
assert(saved, 'keyboard rotation captures the view');
const capturesBeforeFrame = invalidations;
advance(25);
if (baseline) {
  assert(camera.position.distanceTo(chosen) > .1, 'baseline sweep overwrites the keyed pose');
  console.log(JSON.stringify({ passed: true, baselineDefectConfirmed: true, actualKeyListener: true }));
  process.exit(0);
}
nearVector(camera.position, chosen, 'normal arrow interrupts guided sweep');
assert.equal(invalidations, capturesBeforeFrame, 'interrupted sweep stops demand frames');
assert.equal(JSON.stringify(capture.current), JSON.stringify(saved), 'capture retains the keyed pose after frames');

// A fresh preset remains available after the interruption. Fine input works
// while the tour is paused and remains authoritative when playback resumes.
startSweep('lateral', [1, 0, 0]);
render({ transitionPaused: true });
const paused = camera.position.clone(), fineAzimuth = controls.getAzimuthalAngle();
advance(10);
nearVector(camera.position, paused, 'paused sweep holds still');
const fine = surface.key('ArrowLeft', { shiftKey: true });
assert.equal(fine.defaultPrevented, true);
near(controls.getAzimuthalAngle(), fineAzimuth - Math.PI / 90, 'Shift arrow rotates two degrees');
const fineChosen = camera.position.clone(), fineCapture = structuredClone(capture.current);
render({ transitionPaused: false });
advance(25);
nearVector(camera.position, fineChosen, 'resume does not overwrite paused keyboard input');
assert.equal(JSON.stringify(capture.current), JSON.stringify(fineCapture), 'paused keyed capture survives resume');

// Rejected input must leave a live sweep running. It must also leave capture
// untouched, so other controls and application state are not commandeered.
startSweep('anterior-again', [0, 0, 1]);
const rejectedCapture = structuredClone(capture.current);
const rejectedPosition = camera.position.clone();
assert.equal(surface.key('Tab').defaultPrevented, false);
assert.equal(JSON.stringify(capture.current), JSON.stringify(rejectedCapture));
nearVector(camera.position, rejectedPosition, 'non-arrow does not move camera');
advance(1);
assert(camera.position.distanceTo(rejectedPosition) > .001, 'non-arrow leaves sweep active');

startSweep('posterior-locked', [0, 0, -1], { locked: true });
assert.equal(surface.handlers.size, 0, 'locked view has no keyboard binding');
const lockedPosition = camera.position.clone(), lockedCapture = structuredClone(capture.current);
assert.equal(surface.key('ArrowRight').defaultPrevented, false);
nearVector(camera.position, lockedPosition, 'locked arrow does not move camera');
assert.equal(JSON.stringify(capture.current), JSON.stringify(lockedCapture));
advance(1);
assert(camera.position.distanceTo(lockedPosition) > .001, 'locked rejection leaves sweep active');
advance(25);
assert(camera.position.z < controls.target.z, 'subsequent preset reaches posterior endpoint');
const arrived = camera.position.clone(), endInvalidations = invalidations;
advance(1);
nearVector(camera.position, arrived, 'arrived camera remains stable');
assert.equal(invalidations, endInvalidations, 'arrival stops demand frames');
assert.equal(props.viewKey, 'posterior-locked', 'key input does not alter preset state');
for (const effect of effectSlots) effect?.cleanup?.();
assert.equal(surface.handlers.size, 0);
console.log(JSON.stringify({
  passed: true, normalAndShiftInterruptions: true, pausedResume: true,
  lockedAndNonArrowRejection: true, subsequentPresetEndpoint: true,
  capturePersistence: true, actualKeyListener: true,
}));
