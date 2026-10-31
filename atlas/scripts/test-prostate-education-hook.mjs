import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';

const compiled = await build({ stdin: { contents:
  "export * from './lib/root-education-api'; export * from './lib/imaging-sync'; export * from './lib/prostate-education-binding'; export * from './lib/prostate-zones'; export * from './lib/body-display-catalog'; export * from './lib/learning-resources';",
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const display = api.bodyDisplayCatalog(catalog);
const parent = display.structures.find(s => s.id === api.PROSTATE_PARENT_ID);
assert(parent);
const binding = api.prostateEducationBinding(catalog, parent);
assert.equal(binding.records.length, 4);
assert(binding.entries.every(e => e.reference === null));

// Deterministic effect/state harness for the actual hooks. This is not DOM or browser acceptance.
function runtime() {
  const slots = [], pending = []; let cursor = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(value) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof value === 'function' ? value() : value };
      return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useMemo(fn, deps) { const i = cursor++; if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
  };
  const effect = (fn, deps) => { const i = cursor++; if (!slots[i] || !same(slots[i].deps, deps))
    pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); };
  react.useEffect = effect; react.useLayoutEffect = effect;
  return { react, render(fn) { cursor = 0; const result = fn(); while (pending.length) pending.shift()(); return result; },
    unmount() { for (const slot of slots) slot?.cleanup?.(); } };
}
async function loadHook(path, imports, window, document) {
  const source = await readFile(path, 'utf8'), exports = {};
  runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText,
  { exports, require: name => { if (name.endsWith('.css')) return {}; assert(name in imports, name); return imports[name]; },
    window, document, Set, Object, JSON });
  return exports;
}
const r = runtime(), winEvents = new Map(), docEvents = new Map();
const window = { addEventListener: (name, fn) => winEvents.set(name, fn),
  removeEventListener: (name, fn) => { if (winEvents.get(name) === fn) winEvents.delete(name); } };
const document = { hidden: false, addEventListener: (name, fn) => docEvents.set(name, fn),
  removeEventListener: (name, fn) => { if (docEvents.get(name) === fn) docEvents.delete(name); } };
const imaging = await loadHook('app/imaging-link.tsx', { react: r.react,
  '@/lib/imaging-sync': api, '@/lib/anatomy-link-registry': {} }, window, document);
const hook = await loadHook('app/prostate-education-link.ts', { react: r.react,
  '../lib/imaging-sync': api, '../lib/learning-resources': api,
  '../lib/prostate-education-binding': api, '../lib/root-education-api': api,
  './imaging-link': { useImagingLink(...args) { const result = imaging.useImagingLink(...args);
    assert.equal(typeof result.publish, 'function', 'base imaging hook publish'); return result; } } }, window, document);
const selected = []; let props = { catalog, parent, disabled: false, onSelect: id => selected.push(id) };
const render = () => r.render(() => hook.useProstateEducationLink(props));
let link = render(); link = render();
const root = api.imagingBridge.registerAdapter({ id: 'root-test', label: 'Independent root', modality: 'MRI', onAtlasSelection: () => {} });
const detachRoot = api.imagingBridge.attachAtlas(req => ({ messageId: req.messageId, status: 'selected' }));
const facade = window.visibleMedicineNestedEducation; assert(facade);

const material = 'c'.repeat(64);
const resource = { id: 'vm:resource:synthetic-prostate-mri', revision: 1, kind: 'mri', title: 'Synthetic MRI fixture',
  ageGroup: 'adult', laterality: 'midline', regionIds: ['pelvis'], material: { sha256: material, origin: 'synthetic' },
  anchors: binding.records.map((_, i) => ({ type: 'volume', id: `zone-${i}`, seriesId: 'synthetic-series',
    frameId: 'synthetic-frame', annotationId: `synthetic-${i}`, geometry: 'region' })) };
const links = binding.records.map((anatomy, i) => ({ id: `vm:link:prostate-hook-${i}`, revision: 1, anatomy,
  resourceId: resource.id, resourceRevision: 1, materialSha256: material, anchorId: resource.anchors[i].id, relation: 'exact' }));
const learning = { schemaVersion: 2, resources: [resource], links };
const policy = { canNavigate: () => true, canAccessAnatomy: () => true, canAccess: () => true,
  resourceCleared: () => true, correspondenceCleared: () => true };
const locator = i => ({ version: 1, linkId: links[i].id, linkRevision: 1,
  resourceId: resource.id, resourceRevision: 1, anchorId: resource.anchors[i].id });
let incoming, pending = null; const guards = [], revealed = [];
const viewer = { getStudy: () => ({ resourceId: resource.id, revision: 1, materialSha256: material }),
  canNavigate: () => true, async reveal(match, guard) { guards.push(guard); if (pending) await pending;
    if (guard.isCurrent()) revealed.push(match); },
  subscribeSelection(fn) { incoming = fn; return () => { incoming = null; }; }, subscribeContext() { return () => {}; } };
let connection = facade.connect({ document: learning, policy, viewer });
link = render(); assert(link.adapter);
connection.setEnabled(true);
assert.equal(incoming({ messageId: 'before-local-optin', locator: locator(0) }).status, 'paused');
link.setEnabled(true); link = render();
assert.equal(incoming({ messageId: 'user-select', locator: locator(0) }).status, 'selected');
assert.deepEqual(selected, [binding.records[0].structureId]);
assert.equal(revealed.length, 0, 'incoming user selection must not echo');
assert.equal(typeof link.publish, 'function');
link.publish(binding.records[1].structureId);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(revealed.length, 1); assert.equal(revealed[0].link.anatomy.structureId, binding.records[1].structureId);
assert.equal(revealed[0].link.anatomy.sources[0].file, 'vm-prostate-zones');
assert.equal('reference' in revealed[0], false);
props = { ...props, parent: { ...parent }, onSelect: id => selected.push(id) };
link = render(); assert.equal(link.enabled, true, 'equal-source rerender retains opt-in');
assert.equal(incoming({ messageId: 'after-rerender', locator: locator(0) }).status, 'selected');
connection.setEnabled(false); link = render();
link.setEnabled(true); link = render();
assert.equal(incoming({ messageId: 'host-off', locator: locator(0) }).status, 'paused');
connection.setEnabled(true); link.setEnabled(true); link = render();
assert.equal(incoming({ messageId: 'both-opted-in', locator: locator(0) }).status, 'selected');

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function cancelledBy(change) {
  let release; pending = new Promise(resolve => { release = resolve; });
  link.publish(binding.records[2].structureId);
  assert(guards.at(-1) && !guards.at(-1).signal.aborted);
  change();
  assert.equal(guards.at(-1).signal.aborted, true);
  release(); pending = null; await tick();
  assert.equal(revealed.length, 1);
}
await cancelledBy(() => { link.setEnabled(false); });
link = render(); assert.equal(link.enabled, false);
assert.equal(incoming({ messageId: 'after-local-off', locator: locator(0) }).status, 'paused');
connection.setEnabled(true); link.setEnabled(true); link = render();
await cancelledBy(() => { props = { ...props, disabled: true }; link = render(); });
props = { ...props, disabled: false }; link = render();
assert.equal(link.enabled, false); assert.equal(incoming({ messageId: 'after-disabled', locator: locator(0) }).status, 'paused');
connection.setEnabled(true); link.setEnabled(true); link = render();
await cancelledBy(() => { document.hidden = true; docEvents.get('visibilitychange')(); });
document.hidden = false; docEvents.get('visibilitychange')(); link = render();
assert.equal(link.enabled, false); assert.equal(incoming({ messageId: 'after-hidden', locator: locator(0) }).status, 'paused');

winEvents.get('pagehide')();
assert.equal(Object.hasOwn(window, 'visibleMedicineNestedEducation'), false);
assert.throws(() => facade.connect({ document: learning, policy, viewer }), /removed/);
winEvents.get('pageshow')(); assert(window.visibleMedicineNestedEducation);
assert.notEqual(window.visibleMedicineNestedEducation, facade);
connection = window.visibleMedicineNestedEducation.connect({ document: learning, policy, viewer });
link = render(); assert.equal(link.enabled, false);
connection.setEnabled(true); link.setEnabled(true); link = render();
const stale = structuredClone(parent); stale.sources[0].sha256 = 'd'.repeat(64);
props = { ...props, parent: stale }; link = render();
assert.equal(Object.hasOwn(window, 'visibleMedicineNestedEducation'), false);
link = render();
assert.equal(link.adapter, null);
assert.equal(api.imagingBridge.getAdapter().id, 'root-test');
assert.equal(root.selectStructure({ version: 1, origin: 'imaging', messageId: 'root-still-independent',
  structureId: 'vm:anatomy:root' }).status, 'selected');
props = { ...props, parent }; link = render();
assert(window.visibleMedicineNestedEducation);
r.unmount();
assert.equal(Object.hasOwn(window, 'visibleMedicineNestedEducation'), false);
assert.equal(api.imagingBridge.getAdapter().id, 'root-test');
detachRoot(); root.dispose();
console.log('Prostate Education hook lifecycle passed (synthetic MRI; deterministic effects only).');
