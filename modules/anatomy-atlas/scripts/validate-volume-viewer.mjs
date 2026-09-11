import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
const bundle = await build({
  stdin: {
    contents: `export * from './lib/volume-reslice'; export * from './lib/volume-comparison'; export * from './lib/volume-canvas'; export * from './lib/imaging-sync'; export * from './lib/imaging-comparison'; export { VolumeImage } from './app/volume-image'; export { createElement } from 'react'; export { renderToStaticMarkup } from 'react-dom/server';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  loader: { '.css': 'empty' },
});
const temporary = new URL(
  '../node_modules/.vm-volume-test.mjs',
  import.meta.url,
);
await writeFile(temporary, bundle.outputFiles[0].text);
try {
  const a = await import(temporary.href);
  let checks = 0;
  const same = (x, y, reason) => {
    checks++;
    assert.deepEqual(x, y, reason);
  };
  const near = (x, y) => {
    checks++;
    assert(Math.abs(x - y) < 1e-8, `${x} != ${y}`);
  };
  const rejects = (fn) => {
    checks++;
    assert.throws(fn);
  };
  const raw = (
    dimensions = [2, 3, 4],
    stepsLps = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  ) => ({
    values: Float32Array.from(
      { length: dimensions.reduce((a, b) => a * b, 1) },
      (_, n) =>
        (n % dimensions[0]) +
        10 * (Math.floor(n / dimensions[0]) % dimensions[1]) +
        100 * Math.floor(n / (dimensions[0] * dimensions[1])),
    ),
    dimensions,
    stepsLps,
    originLps: [0, 0, 0],
    units: 'HU',
  });
  const linear = {
    center: 128,
    width: 256,
    function: 'LINEAR',
    inverted: false,
  };
  const exact = {
    center: 128,
    width: 256,
    function: 'LINEAR_EXACT',
    inverted: false,
  };
  const volume = a.prepareVolume(raw());
  same(volume.indexToLps([1, 2, 3]), [1, 2, 3]);
  same(volume.lpsToIndex([1, 2, 3]), [1, 2, 3]);
  same(a.sampleTrilinear(volume, 1, 2, 3), 321);
  near(a.sampleTrilinear(volume, 0.5, 0.5, 0.5), 55.5);
  same(a.sampleTrilinear(volume, -0.5, 0, 0), 0);
  same(a.sampleTrilinear(volume, 1.5, 0, 0), null);
  same(a.sampleTrilinear(volume, 0, Infinity, 0), null);
  const missing = raw();
  missing.values[1] = NaN;
  same(
    a.sampleTrilinear(a.prepareVolume(missing), 0, 0, 0),
    0,
    'Zero-weight NaN does not poison an exact valid voxel',
  );
  same(a.sampleTrilinear(a.prepareVolume(missing), 0.5, 0, 0), null);
  const missingRgba = a.renderReslice(
    a.prepareVolume(missing),
    a.createResliceGrid(a.prepareVolume(missing), 'axial'),
    0,
    { ...linear, inverted: true },
  );
  same(
    [...missingRgba.slice(4, 8)],
    [0, 0, 0, 255],
    'Missing pixels stay black even when inverted',
  );

  for (const steps of [
    [
      [2, 0, 0],
      [0, 3, 0],
      [0, 0, 5],
    ],
    [
      [0, 2, 0],
      [-3, 0, 0],
      [0, 0, 5],
    ],
    [
      [2, 0, 0],
      [0, 3, 0],
      [0.5, 1, -5],
    ],
  ]) {
    const v = a.prepareVolume({
      ...raw([3, 4, 5], steps),
      originLps: [80, -20, 7],
    });
    for (const index of [
      [0, 0, 0],
      [2, 3, 4],
      [0.2, 1.3, 2.4],
    ]) {
      const point = v.indexToLps(index);
      for (let axis = 0; axis < 3; axis++)
        near(
          point[axis],
          [80, -20, 7][axis] +
            steps[0][axis] * index[0] +
            steps[1][axis] * index[1] +
            steps[2][axis] * index[2],
        );
      v.lpsToIndex(point).forEach((n, axis) => near(n, index[axis]));
    }
    for (const p of a.imagePlanes) {
      const grid = a.createResliceGrid(v, p);
      same(
        a.renderReslice(v, grid, 0, linear).length,
        grid.width * grid.height * 4,
      );
      near(
        Math.hypot(
          ...grid.point(1, 0, 0).map((n, k) => n - grid.point(0, 0, 0)[k]),
        ),
        grid.pixelSpacing,
      );
      near(
        Math.hypot(
          ...grid.point(0, 1, 0).map((n, k) => n - grid.point(0, 0, 0)[k]),
        ),
        grid.pixelSpacing,
      );
    }
  }
  const anisotropic = a.prepareVolume(
    raw(
      [2, 3, 4],
      [
        [2, 0, 0],
        [0, 3, 0],
        [0, 0, 5],
      ],
    ),
  );
  same(
    a.createResliceGrid(anisotropic, 'axial').sliceCount,
    4,
    'Do not invent native axial slices for an aligned anisotropic stack',
  );
  same(a.createResliceGrid(anisotropic, 'axial').sliceSpacing, 5);
  for (const [plane, width, height, labels] of [
    ['axial', 2, 3, ['R', 'L', 'A', 'P']],
    ['coronal', 2, 4, ['R', 'L', 'S', 'I']],
    ['sagittal', 3, 4, ['A', 'P', 'S', 'I']],
  ]) {
    const grid = a.createResliceGrid(volume, plane);
    same([grid.width, grid.height, grid.labels], [width, height, labels]);
    const pixels = a.renderReslice(volume, grid, 1, linear);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const value =
          plane === 'axial'
            ? x + 10 * y + 100
            : plane === 'coronal'
              ? x + 10 + 100 * (3 - y)
              : 1 + 10 * x + 100 * (3 - y);
        same(
          [...pixels.slice((y * width + x) * 4, (y * width + x + 1) * 4)],
          [
            Math.min(255, value),
            Math.min(255, value),
            Math.min(255, value),
            255,
          ],
        );
      }
    for (let slice = 0; slice < grid.sliceCount; slice++)
      same(grid.sliceForPoint(grid.point(0, 0, slice)), slice);
  }
  // Independently hand-calculated VOI examples, including DICOM's half-unit offset.
  same(
    [0, 127, 128, 255].map((v) => a.windowIntensity(v, linear)),
    [0, 127, 128, 255],
  );
  same(
    [-1, 0, 128, 256, 257].map((v) => a.windowIntensity(v, exact)),
    [0, 0, 128, 255, 255],
  );
  same(
    [4, 4.5, 4.50001, 5].map((v) =>
      a.windowIntensity(v, { ...linear, center: 5, width: 1 }),
    ),
    [0, 0, 255, 255],
  );
  same(a.windowIntensity(40, { ...linear, center: 40, width: 80 }), 129);
  same(a.windowIntensity(128, { ...exact, inverted: true }), 128);
  rejects(() => a.windowIntensity(NaN, linear));
  for (const window of [
    { ...linear, width: 0 },
    { ...exact, width: 0 },
    { ...linear, width: 0.1 },
    { ...linear, center: Infinity },
    { ...linear, function: 'SIGMOID' },
  ])
    rejects(() => a.validateWindow(window));
  for (const patch of [
    { dimensions: [1, 1, 1] },
    { dimensions: [0, 3, 4] },
    {
      stepsLps: [
        [1, 0, 0],
        [2, 0, 0],
        [0, 0, 1],
      ],
    },
    { originLps: [Infinity, 0, 0] },
    { values: new Uint8Array(24) },
    { units: 'unknown' },
  ])
    rejects(() => a.prepareVolume({ ...raw(), ...patch }));
  for (const plane of ['constructor', 'unknown'])
    rejects(() => a.createResliceGrid(volume, plane));
  rejects(() => a.createResliceGrid(volume, 'axial', 1));
  rejects(() =>
    a.renderReslice(volume, a.createResliceGrid(volume, 'axial'), 4, linear),
  );
  rejects(() => {
    volume.corners[0][0] = 99;
  });
  rejects(() => {
    a.createResliceGrid(volume, 'axial').u[0] = 99;
  });
  const large = a.createResliceGrid(
    a.prepareVolume(raw([100, 5, 2])),
    'axial',
    16,
  );
  same(large.width, 16);
  same(large.height <= 16, true);
  const detached = raw();
  structuredClone(detached.values.buffer, {
    transfer: [detached.values.buffer],
  });
  rejects(() => a.prepareVolume(detached));

  // Exercise actual pixel output to the Canvas API without browser/device claims.
  let painted;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: (data, x, y) => {
        painted = { data: [...data.data], x, y };
      },
    }),
  };
  const view = {
    volume,
    grid: a.createResliceGrid(volume, 'axial'),
    slice: 1,
    window: linear,
    setWindow: () => true,
  };
  a.paintVolumeSlice(canvas, view);
  same([canvas.width, canvas.height, painted.x, painted.y], [2, 3, 0, 0]);
  same(painted.data.slice(0, 4), [100, 100, 100, 255]);
  rejects(() =>
    a.paintVolumeSlice({ ...canvas, getContext: () => null }, view),
  );
  const markup = a.renderToStaticMarkup(
    a.createElement(a.VolumeImage, { view }),
  );
  same(markup.includes('Window / level'), true);
  same(markup.includes('Reformatted'), true);
  same(markup.includes('Left R, right L, top A, bottom P.'), true);
  same(
    markup.includes('<details open'),
    false,
    'Window tools stay collapsed initially',
  );

  const entry = (side = 'left') => ({
    id: `vm:anatomy:fixture:${side}`,
    sources: [{ file: `fixture-${side}`, sha256: 'a'.repeat(64) }],
    name: 'Synthetic non-patient fixture',
  });
  const resolveReady = (anatomy) => ({
    status: 'ready',
    resourceId: 'synthetic-volume',
    resourceRevision: 'fixture-v1',
    anatomy,
    volume: raw(),
    window: linear,
    focusLps: [1, 1, 2],
  });
  const imaging = a.createImagingBridge(),
    comparison = a.createComparisonBridge();
  const pending = [];
  let mountView,
    cleaned = 0,
    emptied = 0;
  const session = a.connectVolumeComparison({
    id: 'fixture-ct',
    label: 'Synthetic teaching fixture',
    modality: 'CT',
    imaging,
    comparison,
    resolve: (anatomy, signal) =>
      new Promise((resolve, reject) =>
        pending.push({ anatomy, signal, resolve, reject }),
      ),
    mount: (_element, v) => {
      mountView = v;
      return () => {
        cleaned++;
      };
    },
  });
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  same(comparison.getSnapshot().frame.status, 'unmapped');
  imaging.publish(entry());
  same(comparison.getSnapshot().frame.status, 'loading');
  imaging.publish(entry('right'));
  same(pending[0].signal.aborted, true);
  pending[0].resolve(resolveReady(entry()));
  await tick();
  same(
    comparison.getSnapshot().frame.status,
    'loading',
    'Late old-study result never mounts',
  );
  pending[1].resolve(resolveReady(entry('right')));
  await tick();
  const ready = comparison.getSnapshot();
  same(ready.frame.status, 'ready');
  same(ready.frame.slice, 2);
  same(
    a.comparisonAvailability(ready, entry(), 'fixture-ct', true, false),
    'unmapped',
  );
  const unmount = comparison.mount({ replaceChildren: () => emptied++ }, ready);
  same(mountView.slice, 2);
  same(mountView.setWindow(exact), true);
  same(comparison.request(ready, { plane: 'coronal' }), true);
  same(
    [cleaned, emptied],
    [1, 1],
    'Plane change clears the prior mounted image immediately',
  );
  same(
    mountView.setWindow(linear),
    false,
    'Retired image controls cannot change the replacement',
  );
  same(comparison.getSnapshot().frame.slice, 1);
  same(
    comparison.request(ready, { slice: 0 }),
    false,
    'Old controls are rejected',
  );
  comparison.mount(
    { replaceChildren: () => emptied++ },
    comparison.getSnapshot(),
  );
  same(mountView.window, exact, 'Window persists across plane changes');
  same(comparison.request(comparison.getSnapshot(), { slice: 2 }), true);
  same(
    comparison.request(comparison.getSnapshot(), { plane: 'sagittal' }),
    true,
  );
  same(
    comparison.getSnapshot().frame.slice,
    1,
    'Switching plane preserves the image-space location',
  );
  imaging.publish(entry());
  pending[2].resolve({
    ...resolveReady(entry()),
    anatomy: {
      ...entry(),
      sources: [{ file: 'fixture-left', sha256: 'b'.repeat(64) }],
    },
  });
  await tick();
  same(
    comparison.getSnapshot().frame.status,
    'unmapped',
    'Changed source hashes are withheld',
  );
  imaging.publish(entry());
  pending[3].resolve({ status: 'access-denied' });
  await tick();
  same(comparison.getSnapshot().frame.status, 'access-denied');
  imaging.publish(entry());
  pending[4].resolve({ ...resolveReady(entry()), focusLps: [999, 0, 0] });
  await tick();
  same(comparison.getSnapshot().frame.status, 'error');
  imaging.publish(entry());
  pending[5].resolve({
    ...resolveReady(entry()),
    volume: { ...raw(), units: 'relative' },
  });
  await tick();
  same(comparison.getSnapshot().frame.status, 'error');
  imaging.publish(entry());
  session.clear();
  pending[6].resolve(resolveReady(entry()));
  await tick();
  same(comparison.getSnapshot().frame.status, 'unmapped');
  imaging.publish(entry());
  session.revoke();
  pending[7].resolve(resolveReady(entry()));
  await tick();
  same(comparison.getSnapshot().frame.status, 'access-denied');
  const requests = pending.length;
  imaging.publish(entry());
  await tick();
  same(
    pending.length,
    requests,
    'Revoked sessions never request another volume',
  );
  session.clear();
  same(comparison.getSnapshot().frame.status, 'access-denied');
  session.dispose();
  unmount();
  session.dispose();
  same(imaging.getAdapter(), null);
  same(comparison.getSnapshot(), null);
  same(cleaned, 2);

  const occupied = a.createImagingBridge(),
    spare = a.createComparisonBridge();
  occupied.registerAdapter({
    id: 'busy',
    label: 'Busy',
    modality: 'CT',
    onAtlasSelection: () => {},
  });
  rejects(() =>
    a.connectVolumeComparison({
      id: 'new',
      label: 'New',
      modality: 'CT',
      imaging: occupied,
      comparison: spare,
      resolve: async () => ({ status: 'unmapped' }),
      mount: () => () => {},
    }),
  );
  same(
    spare.getSnapshot(),
    null,
    'Failed dual registration rolls back ownership',
  );
  const brokenImaging = a.createImagingBridge(),
    brokenComparison = a.createComparisonBridge();
  let failuresCleared = 0,
    throwMount = true;
  const broken = a.connectVolumeComparison({
    id: 'repairable',
    label: 'Synthetic MRI',
    modality: 'MRI',
    imaging: brokenImaging,
    comparison: brokenComparison,
    resolve: async (anatomy) => ({
      ...resolveReady(anatomy),
      volume: { ...raw(), units: 'relative' },
    }),
    mount: () => {
      if (throwMount) throw new Error('Synthetic renderer failure');
      return () => {};
    },
  });
  brokenImaging.publish(entry());
  await tick();
  same(
    brokenComparison.getSnapshot().frame.status,
    'ready',
    'MRI accepts relative intensities',
  );
  brokenComparison.mount(
    { replaceChildren: () => failuresCleared++ },
    brokenComparison.getSnapshot(),
  );
  same(brokenComparison.getSnapshot().frame.status, 'error');
  same(failuresCleared, 1);
  throwMount = false;
  brokenImaging.publish(entry());
  await tick();
  same(
    brokenComparison.getSnapshot().frame.status,
    'ready',
    'Fresh selection recovers after the bridge advances its own error revision',
  );
  broken.dispose();

  // Small CPU timing observation, not a browser or clinical benchmark.
  const timedVolume = a.prepareVolume({
    ...raw([2, 2, 2]),
    dimensions: [256, 256, 16],
    values: new Int16Array(256 * 256 * 16).fill(40),
  });
  const timedGrid = a.createResliceGrid(timedVolume, 'axial');
  const started = performance.now();
  const timedPixels = a.renderReslice(timedVolume, timedGrid, 8, linear);
  same(timedPixels.length, 256 * 256 * 4);
  console.log(
    `Synthetic 256x256 CPU reslice: ${(performance.now() - started).toFixed(1)} ms (local Node, not browser performance).`,
  );
  console.log(
    `Volume viewer: ${checks} checks passed (synthetic geometry/pixels, affine math, VOI, source matching, races, revocation, disposal, Canvas calls and component markup). No patient or browser/GPU validation claimed.`,
  );
} finally {
  await unlink(temporary);
}
