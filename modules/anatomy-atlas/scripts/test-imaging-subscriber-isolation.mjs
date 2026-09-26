import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

// Real same-document bridges; all anatomy/frame values below are synthetic.
const built = await build({
  stdin: { contents: "export {createImagingBridge} from './lib/imaging-sync'; export {createComparisonBridge} from './lib/imaging-comparison';", resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { createImagingBridge, createComparisonBridge } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`
);
const anatomy = { id: 'vm:anatomy:synthetic', sources: [{ file: 'synthetic.obj', sha256: 'a'.repeat(64) }] };
const frame = (revision = 0) => ({ revision, status: 'ready', anatomy, plane: 'axial', slice: 0, sliceCount: 3 });
function fixture(kind) {
  if (kind === 'imaging') {
    const bridge = createImagingBridge();
    return { bridge, register: () => bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic fixture', modality: 'MRI', onAtlasSelection() {} }), signal: handle => handle.pause(), state: () => bridge.getAdapter() };
  }
  const bridge = createComparisonBridge();
  return { bridge, register: () => bridge.register({ id: 'synthetic', label: 'Synthetic fixture', modality: 'CT', onPlane() {}, onSlice() {}, mount: () => () => {} }, frame()), signal: handle => handle.update(frame(bridge.getSnapshot().frame.revision + 1)), state: () => bridge.getSnapshot() };
}
for (const kind of ['imaging', 'comparison']) {
  test(`${kind}: a transient throwing subscriber remains subscribed and recovers`, () => {
    const f = fixture(kind); let attempts = 0; let recovered = 0; let healthy = 0;
    const off = f.bridge.subscribe(() => { attempts++; if (attempts === 1) throw Error('Transient subscriber'); recovered++; });
    const offHealthy = f.bridge.subscribe(() => healthy++);
    const handle = f.register(); assert.equal(attempts, 1); assert.equal(recovered, 0); assert.equal(healthy, 1);
    f.signal(handle); assert.equal(attempts, 2); assert.equal(recovered, 1); assert.equal(healthy, 2);
    off(); offHealthy(); handle.dispose(); assert.equal(attempts, 2);
  });
  test(`${kind}: throwing subscriber cannot prevent registration, update or cleanup`, () => {
    const f = fixture(kind); let healthy = 0;
    const offBad = f.bridge.subscribe(() => { throw Error('Synthetic subscriber failure'); });
    const offGood = f.bridge.subscribe(() => healthy++);
    let handle;
    assert.doesNotThrow(() => { handle = f.register(); }, 'register must return its owned disposer despite a subscriber exception');
    assert.equal(healthy, 1); assert.ok(f.state());
    assert.doesNotThrow(() => f.signal(handle)); assert.equal(healthy, 2);
    assert.doesNotThrow(() => handle.dispose()); assert.equal(healthy, 3); assert.equal(f.state(), null);
    handle.dispose(); assert.equal(healthy, 3);
    offBad(); offBad(); offGood(); offGood();
    const next = f.register(); handle.dispose(); assert.ok(f.state()); next.dispose(); assert.equal(f.state(), null);
  });
  test(`${kind}: delivery snapshots defer new subscribers and skip removed subscribers`, () => {
    const f = fixture(kind); const calls = []; let offAdded;
    const offFirst = f.bridge.subscribe(() => { calls.push('first'); offRemoved(); offAdded ??= f.bridge.subscribe(() => calls.push('added')); });
    const offRemoved = f.bridge.subscribe(() => calls.push('removed'));
    const offLast = f.bridge.subscribe(() => calls.push('last'));
    const handle = f.register(); assert.deepEqual(calls, ['first', 'last']);
    calls.length = 0; f.signal(handle); assert.deepEqual(calls, ['first', 'last', 'added']);
    offFirst(); offLast(); offAdded(); handle.dispose();
  });
  test(`${kind}: self-unsubscribe and rebind runs only once per delivery`, () => {
    const f = fixture(kind); let calls = 0; let off;
    const listener = () => { calls++; off(); off = f.bridge.subscribe(listener); if (calls > 3) throw Error('Revisited within delivery'); };
    off = f.bridge.subscribe(listener);
    const handle = f.register(); assert.equal(calls, 1);
    f.signal(handle); assert.equal(calls, 2); off(); handle.dispose();
  });
}
test('imaging: failed publish remains fail-closed and delivers healthy subscribers', async () => {
  for (const asynchronous of [false, true]) {
    const bridge = createImagingBridge(); let changes = 0;
    bridge.subscribe(() => { throw Error('Subscriber'); }); bridge.subscribe(() => changes++);
    const handle = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic', modality: 'MRI', onAtlasSelection() { if (asynchronous) return Promise.reject(Error('Adapter')); throw Error('Adapter'); } });
    assert.equal(bridge.publish(anatomy), asynchronous); await new Promise(resolve => setImmediate(resolve));
    assert.equal(bridge.getAdapter(), null); assert.equal(changes, 2);
    assert.equal(handle.selectStructure({ version: 1, origin: 'imaging', messageId: 'synthetic-message', structureId: anatomy.id }).status, 'disconnected');
    handle.dispose(); assert.equal(changes, 2);
  }
});
test('imaging: failed receiver request does not corrupt adapter ownership', () => {
  const bridge = createImagingBridge(); let changes = 0;
  bridge.subscribe(() => { throw Error('Subscriber'); }); bridge.subscribe(() => changes++);
  const detach = bridge.attachAtlas(() => { throw Error('Receiver'); });
  const handle = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic', modality: 'CT', onAtlasSelection() {} });
  assert.equal(handle.selectStructure({ version: 1, origin: 'imaging', messageId: 'request', structureId: anatomy.id }).status, 'adapter-error');
  assert.ok(bridge.getAdapter()); handle.pause(); assert.equal(changes, 2); detach(); handle.dispose(); assert.equal(changes, 3);
});
test('comparison: failed plane/slice requests publish error despite throwing subscriber', async () => {
  for (const asynchronous of [false, true]) for (const request of [{ plane: 'coronal' }, { slice: 1 }]) {
    const bridge = createComparisonBridge(); let changes = 0;
    bridge.subscribe(() => { throw Error('Subscriber'); }); bridge.subscribe(() => changes++);
    const fail = () => { if (asynchronous) return Promise.reject(Error('Adapter')); throw Error('Adapter'); };
    const handle = bridge.register({ id: 'synthetic', label: 'Synthetic', modality: 'MRI', onPlane: fail, onSlice: fail, mount: () => () => {} }, frame());
    assert.equal(bridge.request(bridge.getSnapshot(), request), asynchronous);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(bridge.getSnapshot().frame.status, 'error'); assert.equal(changes, 2);
    handle.dispose(); assert.equal(changes, 3); handle.dispose(); assert.equal(changes, 3);
  }
});
