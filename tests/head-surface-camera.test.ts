import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { moveHeadSurfaceCamera, type HeadSurfaceCameraControls } from '../lib/head-surface-camera.ts';

// The focused staging command runs from the Website root; this also works after integration.
const requireSite = createRequire(resolve(process.cwd(), 'package.json'));
const { PerspectiveCamera, Vector3 } = requireSite('three') as typeof import('three');
const { OrbitControls } = requireSite('three-stdlib') as typeof import('three-stdlib');

function realControls() {
  const camera = new PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);
  const controls = new OrbitControls(camera);
  controls.target.set(0, 0, 0);
  controls.enableDamping = false;
  controls.update();
  return { camera, controls };
}

test('installed OrbitControls moves left/right, up/down, and in/out from current camera state', () => {
  const { camera, controls } = realControls();
  const start = camera.position.clone();
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-left'), true);
  assert.ok(camera.position.x < 0);
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-right'), true);
  assert.ok(camera.position.distanceTo(start) < 1e-8);

  assert.equal(moveHeadSurfaceCamera(controls, 'tilt-up'), true);
  assert.ok(camera.position.y > 0);
  assert.equal(moveHeadSurfaceCamera(controls, 'tilt-down'), true);
  assert.ok(camera.position.distanceTo(start) < 1e-8);

  const distance = controls.getDistance();
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-in'), true);
  assert.ok(controls.getDistance() < distance);
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-out'), true);
  assert.ok(Math.abs(controls.getDistance() - distance) < 1e-8);
  controls.dispose();
});

test('polar margin and distance limits keep actual camera state finite', () => {
  const { camera, controls } = realControls();
  controls.setPolarAngle(1e-4);
  assert.equal(moveHeadSurfaceCamera(controls, 'tilt-up'), false);
  assert.ok(controls.getPolarAngle() >= 1e-4 - 1e-10);
  controls.setPolarAngle(Math.PI - 1e-4);
  assert.equal(moveHeadSurfaceCamera(controls, 'tilt-down'), false);
  assert.ok(controls.getPolarAngle() <= Math.PI - 1e-4 + 1e-10);

  controls.setPolarAngle(Math.PI / 2);
  controls.minDistance = 9;
  controls.maxDistance = 11;
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-in'), true);
  assert.ok(Math.abs(controls.getDistance() - 9) < 1e-8);
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-in'), false);
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-out'), true);
  assert.ok(controls.getDistance() > 9 && controls.getDistance() <= 11);
  assert.ok([camera.position.x, camera.position.y, camera.position.z].every(Number.isFinite));
  controls.dispose();
});

function stub() {
  let distance = 10, polar = Math.PI / 2, azimuth = 0;
  const writes: string[] = [];
  const controls = {
    enabled: true, enableRotate: true, enableZoom: true,
    object: { position: new Vector3(0, 0, 10), zoom: 1 },
    target: new Vector3(), minDistance: 1, maxDistance: 20,
    minPolarAngle: 0, maxPolarAngle: Math.PI,
    minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity,
    getDistance: () => distance,
    getPolarAngle: () => polar,
    getAzimuthalAngle: () => azimuth,
    setPolarAngle: (value: number) => { writes.push('polar'); polar = value; },
    setAzimuthalAngle: (value: number) => { writes.push('azimuth'); azimuth = value; },
    dollyIn: (scale: number) => { writes.push('in'); distance *= scale; },
    dollyOut: (scale: number) => { writes.push('out'); distance /= scale; },
  };
  return { controls: controls as unknown as HeadSurfaceCameraControls, writes };
}

test('missing, disabled, nonfinite, unknown, and limit-bound actions make no writes', () => {
  assert.equal(moveHeadSurfaceCamera(null, 'zoom-in'), false);
  const { controls, writes } = stub();
  controls.enabled = false;
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-left'), false);
  controls.enabled = true;
  assert.equal(moveHeadSurfaceCamera(controls, 'unexpected' as never), false);
  controls.object.position.x = Infinity;
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-in'), false);
  controls.object.position.x = 0;
  controls.target.y = NaN;
  assert.equal(moveHeadSurfaceCamera(controls, 'tilt-up'), false);
  controls.target.y = 0;
  controls.minDistance = NaN;
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-in'), false);
  controls.minDistance = 1;
  controls.minPolarAngle = NaN;
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-right'), false);
  controls.minPolarAngle = 0;
  controls.minAzimuthAngle = Infinity;
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-right'), false);
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = -Infinity;
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-right'), false);
  controls.maxAzimuthAngle = Infinity;
  controls.object.zoom = 0;
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-in'), false);
  controls.object.zoom = 1;
  controls.enableRotate = false;
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-left'), false);
  controls.enableRotate = true;
  controls.enableZoom = false;
  assert.equal(moveHeadSurfaceCamera(controls, 'zoom-out'), false);
  controls.enableZoom = true;
  controls.minAzimuthAngle = 0;
  assert.equal(moveHeadSurfaceCamera(controls, 'rotate-left'), false);
  assert.deepEqual(writes, []);
});

test('native Z-up camera keeps its original target and supports opposite view actions', () => {
  const camera = new PerspectiveCamera(40, 1, 0.1, 1000);
  camera.up.set(0, 0, 1);
  camera.position.set(0, 10, 5);
  const controls = new OrbitControls(camera);
  controls.target.set(1, 2, 3);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.update();
  const start = camera.position.clone(), target = controls.target.clone();
  for (const [forward, backward] of [['rotate-left', 'rotate-right'], ['tilt-up', 'tilt-down'], ['zoom-in', 'zoom-out']] as const) {
    assert.equal(moveHeadSurfaceCamera(controls, forward), true);
    assert.ok(camera.position.distanceTo(start) > 1e-6);
    // Match the live renderer: damping completes over frames, not in the first
    // update. Each command starts from the current view, not a queued old pose.
    for (let frame = 0; frame < 240; frame++) controls.update();
    assert.equal(moveHeadSurfaceCamera(controls, backward), true);
    for (let frame = 0; frame < 240; frame++) controls.update();
    assert.ok(camera.position.distanceTo(start) < 1e-8);
    assert.deepEqual(controls.target.toArray(), target.toArray());
    assert.deepEqual(camera.up.toArray(), [0, 0, 1]);
  }
  controls.dispose();
});

test('the shipped native surface, loader, styling and helpers are exact Review inputs', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path));
  const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const inputs = JSON.parse(read('atlas-review/integration-inputs.json').toString());
  for (const path of ['components/HeadAtlasSurface.tsx', 'components/HeadAtlasSurfaceLoader.tsx', 'components/head-surface.css', 'lib/head-surface-context.ts', 'lib/head-surface-camera.ts']) {
    const matching = inputs.inputs.filter((row: { path: string }) => row.path === path);
    assert.equal(matching.length, 1, `one exact bound input: ${path}`);
    assert.equal(matching[0].sha256, sha(read(path)), path);
  }
});
