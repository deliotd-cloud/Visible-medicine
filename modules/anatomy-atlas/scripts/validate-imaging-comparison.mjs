import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({
  stdin: {
    contents: `export * from './lib/imaging-comparison'; export * from './lib/imaging-sync'; export { ComparisonPanel, ImagingComparisonWorkspace } from './app/imaging-comparison'; export { createElement } from 'react'; export { renderToStaticMarkup } from 'react-dom/server';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  loader: { '.css': 'empty' },
});
// External imports need a normal file URL; keep transient output out of the source tree.
import { writeFile, unlink } from 'node:fs/promises';
const file = new URL(
  '../node_modules/.vm-comparison-test.mjs',
  import.meta.url,
);
await writeFile(file, result.outputFiles[0].text);
try {
  const a = await import(file.href);
  const entry = {
    id: 'vm:anatomy:test:left',
    name: 'Synthetic mapping fixture — no patient image',
    sources: [{ file: 'fixture', sha256: 'a'.repeat(64) }],
    reference: {
      frame: 'fixture',
      kind: 'surface-bounds-centre',
      point: [0, 0, 0],
    },
  };
  const initial = {
    revision: 1,
    status: 'ready',
    anatomy: entry,
    plane: 'axial',
    slice: 0,
    sliceCount: 4,
  };
  const bridge = a.createComparisonBridge();
  const calls = [];
  let disposals = 0,
    notifications = 0;
  const detach = bridge.subscribe(() => notifications++);
  const adapter = {
    id: 'fixture-ct',
    label: 'Integration fixture',
    modality: 'CT',
    onPlane: (p) => calls.push(p),
    onSlice: (i) => calls.push(i),
    mount: (_element, frame) => {
      calls.push(frame.plane);
      return () => disposals++;
    },
  };
  const handle = bridge.register(adapter, initial);
  const first = bridge.getSnapshot();
  assert.equal(
    first.frame.anatomy.reference,
    undefined,
    'No patient or reference-coordinate metadata retained',
  );
  assert.equal(first.frame.anatomy.name, undefined);
  assert.throws(() => {
    first.frame.slice = 2;
  });
  assert.throws(() => {
    first.frame.anatomy.sources[0].sha256 = 'b'.repeat(64);
  });
  assert.throws(() => bridge.register(adapter, initial));
  const availability = (
    snapshot = first,
    selected = entry,
    id = adapter.id,
    enabled = true,
    disabled = false,
  ) => a.comparisonAvailability(snapshot, selected, id, enabled, disabled);
  assert.equal(availability(), 'ready');
  assert.equal(availability(null), 'disconnected');
  assert.equal(availability(first, entry, 'other'), 'disconnected');
  assert.equal(availability(first, entry, adapter.id, false), 'paused');
  assert.equal(availability(first, entry, adapter.id, true, true), 'paused');
  assert.equal(availability(first, null), 'select-structure');
  assert.equal(
    availability(first, { ...entry, id: 'vm:anatomy:test:right' }),
    'unmapped',
  );
  assert.equal(
    availability(first, {
      ...entry,
      sources: [{ file: 'fixture', sha256: 'b'.repeat(64) }],
    }),
    'source-mismatch',
  );
  assert.equal(bridge.request(first, { slice: -1 }), false);
  assert.equal(bridge.request(first, { slice: 4 }), false);
  assert.equal(bridge.request(first, { slice: 1.2 }), false);
  assert.equal(bridge.request(first, { plane: 'oblique-guessed' }), false);
  assert.equal(bridge.request(first, { slice: 3 }), true);
  assert.equal(bridge.request(first, { plane: 'coronal' }), true);
  const unmount = bridge.mount({}, first);
  unmount();
  unmount();
  assert.equal(disposals, 1);
  assert.deepEqual(calls, [3, 'coronal', 'axial']);
  assert.equal(handle.update({ ...initial, revision: 1 }), false);
  assert.equal(
    handle.update({ ...initial, revision: 2, sliceCount: 0 }),
    false,
  );
  assert.equal(
    handle.update({ ...initial, revision: 2, anatomy: null }),
    false,
  );
  assert.equal(handle.update(null), false);
  let revision = 2;
  for (const status of ['loading', 'unmapped', 'access-denied', 'error']) {
    assert.equal(
      handle.update({
        ...initial,
        revision: revision++,
        status,
        anatomy: null,
      }),
      true,
    );
    const current = bridge.getSnapshot();
    assert.equal(availability(current), status);
    assert.equal(bridge.request(current, { slice: 1 }), false);
    const html = a.renderToStaticMarkup(
      a.createElement(a.ComparisonPanel, { snapshot: current, status }),
    );
    assert.match(html, /not spatially registered/);
    assert.doesNotMatch(html, /vm-comparison-surface|Image slice/);
  }
  assert.equal(
    bridge.request(first, { slice: 1 }),
    false,
    'Stale controls cannot request a frame',
  );
  assert.equal(handle.update({ ...initial, revision: revision++ }), true);
  const ready = bridge.getSnapshot();
  const readyHtml = a.renderToStaticMarkup(
    a.createElement(a.ComparisonPanel, { snapshot: ready, status: 'ready' }),
  );
  assert.match(readyHtml, /Imaging plane/);
  assert.match(readyHtml, /Next image slice/);
  for (const status of [
    'paused',
    'source-mismatch',
    'disconnected',
    'select-structure',
  ]) {
    const html = a.renderToStaticMarkup(
      a.createElement(a.ComparisonPanel, { snapshot: ready, status }),
    );
    assert.doesNotMatch(html, /vm-comparison-surface/);
  }
  const defaultHtml = a.renderToStaticMarkup(
    a.createElement(
      a.ImagingComparisonWorkspace,
      {
        selected: entry,
        link: { adapter: null, enabled: false, disabled: false },
      },
      a.createElement('div', { id: 'real-anatomy-slot' }),
    ),
  );
  assert.match(defaultHtml, /real-anatomy-slot/);
  assert.doesNotMatch(defaultHtml, /Compare CT|Compare MRI|Image slice/);
  handle.dispose();
  assert.equal(bridge.getSnapshot(), null);
  assert.equal(handle.update({ ...initial, revision: 999 }), false);
  const replacement = bridge.register(
    {
      ...adapter,
      onSlice: () => {
        throw new Error('Viewer failed');
      },
    },
    initial,
  );
  handle.dispose();
  assert.notEqual(
    bridge.getSnapshot(),
    null,
    'Old disposer cannot remove new viewer',
  );
  assert.equal(bridge.request(bridge.getSnapshot(), { slice: 1 }), false);
  assert.equal(bridge.getSnapshot().frame.status, 'error');
  replacement.dispose();
  const asyncHandle = bridge.register(
    {
      ...adapter,
      onSlice: async () => {
        throw new Error('Async failure');
      },
    },
    initial,
  );
  bridge.request(bridge.getSnapshot(), { slice: 1 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(bridge.getSnapshot().frame.status, 'error');
  asyncHandle.dispose();
  // A host callback may publish a newer result before throwing/rejecting.
  // Errors belong only to the exact snapshot that initiated the work.
  let supersededCases = 0;
  for (const operation of ['slice', 'plane', 'mount']) {
    for (const outcome of ['ready', 'loading', 'access-denied']) {
      for (const failure of operation === 'mount' ? ['throw', 'invalid-disposer'] : ['throw', 'reject']) {
        const isolated = a.createComparisonBridge();
        let control, newer;
        const replaceThenFail = () => {
          assert.equal(control.update({
            ...initial, revision: 2, status: outcome,
            anatomy: outcome === 'ready' ? entry : null, slice: 2,
          }), true);
          newer = isolated.getSnapshot();
          if (failure === 'throw') throw new Error('Superseded host work');
          if (failure === 'reject') return Promise.reject(new Error('Superseded async work'));
          return undefined;
        };
        control = isolated.register({
          ...adapter,
          ...(operation === 'mount' ? {mount: replaceThenFail} :
            operation === 'slice' ? {onSlice: replaceThenFail} : {onPlane: replaceThenFail}),
        }, initial);
        const before = isolated.getSnapshot();
        if (operation === 'mount') isolated.mount({}, before)();
        else isolated.request(before, operation === 'slice' ? {slice: 2} : {plane: 'coronal'});
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(isolated.getSnapshot(), newer,
          `${operation}/${outcome}/${failure}: old failure must not overwrite newer host state`);
        assert.equal(isolated.getSnapshot().frame.status, outcome);
        assert.equal(isolated.request(before, {slice: 1}), false);
        control.dispose();
        supersededCases++;
      }
    }
  }
  // Current mount failures still fail closed; invalid disposers are not success.
  for (const invalid of [false, true]) {
    const isolated = a.createComparisonBridge();
    const control = isolated.register({...adapter, mount: () => {
      if (invalid) return undefined;
      throw new Error('Current mount failure');
    }}, initial);
    isolated.mount({}, isolated.getSnapshot())();
    assert.equal(isolated.getSnapshot().frame.status, 'error');
    assert.equal(isolated.getSnapshot().frame.anatomy, null);
    control.dispose();
  }
  assert.equal(supersededCases, 18);
  detach();
  assert.ok(notifications >= 9);
  // Exercise the installed identity bridge alongside the new comparison contract.
  const identity = a.createImagingBridge();
  const mapped = bridge.register(adapter, {
    ...initial,
    status: 'unmapped',
    anatomy: null,
  });
  const connected = identity.registerAdapter({
    ...adapter,
    onAtlasSelection: (selection) =>
      mapped.update({ ...initial, revision: 2, anatomy: selection.anatomy }),
  });
  assert.equal(identity.publish(entry), true);
  assert.equal(availability(bridge.getSnapshot()), 'ready');
  connected.dispose();
  mapped.dispose();
  console.log(
    'Imaging comparison: source/side gates, access/exam states, lifecycle/revision guards, control bounds, errors, identity bridge and actual component markup passed. Synthetic fixtures only; no browser or clinical acceptance.',
  );
} finally {
  await unlink(file);
}
