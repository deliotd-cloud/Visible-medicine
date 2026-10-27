/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component hooks */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
const here = dirname(fileURLToPath(import.meta.url));
const atlas = process.env.VM_ATLAS_ROOT || (existsSync(resolve(here, '../package.json'))
  ? resolve(here, '..') : resolve(here, '../../../atlas'));
const source = resolve(here, '../app/review/body/review-dashboard.tsx');
const { build } = await import(pathToFileURL(resolve(atlas, 'scripts/workspace-component-test-build.mjs')).href);
const { build: materialBuild } = await import(pathToFileURL(resolve(atlas, 'scripts/workspace-test-build.mjs')).href);
const require = createRequire(resolve(atlas, 'package.json')), React = require('react');
let states, cursor, refs, refCursor, effectCursor, effectSlots, layoutCursor, layoutSlots, pending, requests;
let verificationPromises = [];
const shim = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  },
  useMemo(fn) { return fn(); },
  useRef(initial) {
    const i = refCursor++;
    if (!(i in refs)) refs[i] = { current: initial };
    return refs[i];
  },
  useEffect(fn, deps) {
    const i = effectCursor++, previous = effectSlots[i];
    if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
      pending.push(() => {
        previous?.cleanup?.();
        effectSlots[i] = { deps, cleanup: fn() };
      });
    }
  },
  useLayoutEffect(fn, deps) {
    const i = layoutCursor++, previous = layoutSlots[i];
    if (!previous || !deps || deps.some((value, index) => !Object.is(value, previous.deps?.[index]))) {
      pending.push(() => {
        previous?.cleanup?.();
        layoutSlots[i] = { deps, cleanup: fn() };
      });
    }
  },
};
const compiled = await build({ stdin: {
  contents: "export { BodyReviewDashboard } from './app/review/body/review-dashboard';",
  resolveDir: atlas, loader: 'tsx',
}, bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{
  name: 'staged-dashboard-source',
  setup(api) {
    api.onLoad({ filter: /[\\/]app[\\/]review[\\/]body[\\/]review-dashboard\.tsx$/, namespace: 'component-test' },
      async () => ({ contents: await readFile(source, 'utf8'), loader: 'tsx',
        resolveDir: resolve(atlas, 'app/review/body') }));
  },
}] });
const scope = { exports: {} };
const browserLocation = new URL('https://local.test/review/body');
runInNewContext(compiled.outputFiles[0].text, {
  module: scope, exports: scope.exports, AbortController, URL, URLSearchParams, Error, structuredClone, TextEncoder,
  HTMLElement: class HTMLElement { focus() {} }, document: { activeElement: null },
  requestAnimationFrame(callback) { callback(); },
  crypto: { subtle: { digest(...args) {
    const promise = crypto.subtle.digest(...args);
    verificationPromises.push(promise);
    return promise;
  } } },
  window: {
    location: browserLocation,
    history: { state: null, replaceState(_state, _title, href) {
      browserLocation.href = new URL(href, browserLocation).href;
    } },
    addEventListener() {}, removeEventListener() {},
  },
  fetch(url, options) { return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })); },
  require(name) {
    if (name === 'react') return shim;
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (name === 'next/image') return ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props);
    return require(name);
  },
});
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const button = (tree, label) => walk(tree, n => typeof n.props.onClick === 'function' && text(n) === label)[0];
const dialog = tree => walk(tree, n => typeof n.props.onOpenChange === 'function' && typeof n.props.open === 'boolean')[0];
const discard = tree => button(tree, 'Discard edits and continue').props.onClick();
const keepEditing = tree => dialog(tree).props.onOpenChange(false);
const currentId = () => new URL(requests.at(-1).url, 'https://local.test').searchParams.get('structure');
const syntheticRows = Array.from({ length: 25 }, (_, i) => ({
  id: `synthetic-${i}`, name: `Structure ${String(i).padStart(2, '0')}`,
  fmaId: `FMA${i + 1}`, system: i % 2 ? 'muscles' : 'skeleton',
  laterality: 'left', regions: [i % 2 ? 'forearm' : 'thorax'],
}));
// Pure queue-only tests retain synthetic rows. Tests that load a worksheet use
// actual current-build evidence: invented source IDs must not pass the parser.
const materialBundle = await materialBuild({
  stdin: { contents: "export * from './lib/body-review-material.ts';", resolveDir: atlas, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const materialApi = await import('data:text/javascript;base64,' + Buffer.from(materialBundle.outputFiles[0].text).toString('base64'));
const realRows = materialApi.bodyReviewSummaries.slice(0, 25)
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
const worksheets = new Map(await Promise.all(realRows.map(async row => [row.id, await materialApi.bodyReviewMaterial(row.id)])));
const worksheet = id => {
  assert(worksheets.has(id), 'Loaded fixture must be an actual current-build structure');
  return JSON.parse(JSON.stringify(worksheets.get(id)));
};
const settle = async () => {
  let quiet = 0;
  for (let round = 0; round < 16; round++) {
    await new Promise(resolve => setImmediate(resolve));
    const active = verificationPromises.splice(0);
    await Promise.all(active);
    quiet = active.length ? 0 : quiet + 1;
    if (quiet === 2) return;
  }
  assert.fail('Actual worksheet verification did not settle within 16 digest rounds');
};
const click = (tree, label) => button(tree, label).props.onClick({
  currentTarget: { isConnected: true, disabled: false, focus() {} },
});
function setup({ rows = syntheticRows, initialId = rows[0]?.id ?? null, initialRegion = 'all' } = {}) {
  browserLocation.href = 'https://local.test/review/body';
  states = []; refs = []; effectSlots = []; layoutSlots = []; pending = []; requests = []; verificationPromises = [];
  const render = () => {
    cursor = refCursor = effectCursor = layoutCursor = 0;
    const tree = scope.exports.BodyReviewDashboard({ rows, initialId, initialRegion,
      regions: [{ id: 'forearm', name: 'Forearm' }, { id: 'thorax', name: 'Thorax' }] });
    const updates = pending; pending = []; updates.forEach(fn => fn());
    return tree;
  };
  render();
  const navigation = () => walk(render(), n => n.props['aria-label'] === 'Structures in the filtered review queue')[0];
  const move = direction => click(navigation(), `${direction} structure`);
  const selected = () => walk(render(), n => n.props['aria-pressed'] === true)[0];
  const selectedId = () => rows.find(row => text(selected()) === `${row.name}${row.fmaId} · ${row.laterality}`)?.id ?? null;
  const pageLabel = () => text(walk(render(), n => n.props['aria-label'] === 'Review queue pages')[0]);
  const dirty = async () => {
    let editor = walk(render(), n => typeof n.props.onDirty === 'function')[0];
    if (!editor) {
      requests.at(-1).resolve({ ok: true, json: async () => worksheet(currentId()) });
      await settle();
      editor = walk(render(), n => typeof n.props.onDirty === 'function')[0];
    }
    assert(editor, 'Valid worksheet exposes the actual decision editor callback');
    editor.props.onDirty(true);
  };
  return { render, navigation, move, selected, selectedId, pageLabel, dirty,
    cleanup() { effectSlots.forEach(slot => slot.cleanup?.()); layoutSlots.forEach(slot => slot.cleanup?.()); } };
}

test('navigation bounds are disabled and position announces queue order without approval claims', () => {
  const h = setup();
  assert.equal(button(h.navigation(), 'Previous structure').props.disabled, true);
  assert.equal(button(h.navigation(), 'Next structure').props.disabled, false);
  assert(text(h.navigation()).includes('Structure 1 of 25 in the filtered queue'));
  const status = walk(h.navigation(), n => n.props.role === 'status')[0];
  assert.equal(status.props['aria-atomic'], 'true');
  h.move('Previous'); assert.equal(h.selectedId(), 'synthetic-0');
  for (let i = 0; i < 24; i++) h.move('Next');
  assert.equal(h.selectedId(), 'synthetic-24');
  assert.equal(button(h.navigation(), 'Next structure').props.disabled, true);
  h.move('Next'); assert.equal(h.selectedId(), 'synthetic-24');
  assert(!/approved|reviewed|saved/i.test(text(h.navigation())));
  h.cleanup();
});

test('sequential selection crosses both directions of the 20-row page boundary', () => {
  const h = setup({ initialId: 'synthetic-19' });
  h.move('Next');
  assert.match(h.pageLabel(), /2 \/ 2/); assert.equal(h.selectedId(), 'synthetic-20');
  assert(text(h.selected()).startsWith('Structure 20'));
  h.move('Previous');
  assert.match(h.pageLabel(), /1 \/ 2/); assert.equal(h.selectedId(), 'synthetic-19');
  assert(text(h.selected()).startsWith('Structure 19'));
  h.cleanup();
});

test('a deep-linked selection opens its queue page while manual paging retains selection', () => {
  const h = setup({ initialId: 'synthetic-24' });
  assert.match(h.pageLabel(), /2 \/ 2/);
  assert(text(h.selected()).startsWith('Structure 24'));
  assert(text(h.navigation()).includes('Structure 25 of 25 in the filtered queue'));
  const requestCount = requests.length;
  click(h.render(), 'Previous');
  assert.match(h.pageLabel(), /1 \/ 2/);
  assert.equal(h.selected(), undefined);
  assert.equal(requests.length, requestCount);
  click(h.render(), 'Next');
  assert.match(h.pageLabel(), /2 \/ 2/); assert.equal(h.selectedId(), 'synthetic-24');
  assert(text(h.selected()).startsWith('Structure 24'));
  h.cleanup();
});

test('region, system and search remain in force when moving within the filtered subset', () => {
  const h = setup({ initialId: 'synthetic-1', initialRegion: 'forearm' });
  const selects = walk(h.render(), n => typeof n.props.onValueChange === 'function');
  selects[1].props.onValueChange('muscles');
  walk(h.render(), n => n.props.id === 'body-review-query')[0].props.onChange({ target: { value: 'Structure 0' } });
  button(h.render(), 'Structure 01FMA2 · left').props.onClick();
  h.move('Next');
  assert.equal(h.selectedId(), 'synthetic-3');
  const activeFilters = walk(h.render(), n => typeof n.props.onValueChange === 'function');
  assert.equal(activeFilters[0].props.value, 'forearm');
  assert.equal(activeFilters[1].props.value, 'muscles');
  assert.equal(walk(h.render(), n => n.props.id === 'body-review-query')[0].props.value, 'Structure 0');
  // FMA20 also matches the bounded term "0", so the real search includes row 19.
  assert(text(h.navigation()).includes('Structure 2 of 6 in the filtered queue'));
  h.cleanup();
});

test('empty, unselected and outside-filter selections cannot navigate', () => {
  for (const options of [{ rows: [] }, { initialId: null }, { initialId: 'missing' },
    { initialId: 'synthetic-0', initialRegion: 'forearm' }]) {
    const h = setup(options);
    assert.equal(button(h.navigation(), 'Previous structure').props.disabled, true);
    assert.equal(button(h.navigation(), 'Next structure').props.disabled, true);
    const before = text(h.navigation());
    const selectedBefore = h.selectedId(), requestCount = requests.length;
    const editorBefore = walk(h.render(), n => typeof n.props.onDirty === 'function')[0]?.key;
    const alertsBefore = walk(h.render(), n => n.props.role === 'alert').map(text);
    h.move('Next'); h.move('Previous');
    assert.equal(text(h.navigation()), before);
    assert.equal(h.selectedId(), selectedBefore, 'Invalid navigation cannot change the active source');
    assert.equal(requests.length, requestCount, 'Invalid navigation cannot fetch another worksheet');
    assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function')[0]?.key, editorBefore);
    assert.deepEqual(walk(h.render(), n => n.props.role === 'alert').map(text), alertsBefore);
    h.cleanup();
  }
});

test('dirty cancellation retains selection, material and draft; confirmation only navigates', async () => {
  const h = setup({ rows: realRows }); await h.dirty();
  const before = h.selectedId(), requestCount = requests.length;
  const editor = walk(h.render(), n => typeof n.props.onDirty === 'function')[0];
  h.move('Next');
  assert.equal(dialog(h.render()).props.open, true);
  keepEditing(h.render());
  assert.equal(h.selectedId(), before);
  assert.equal(requests.length, requestCount);
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function')[0].key, editor.key);
  h.move('Next'); discard(h.render());
  assert.equal(h.selectedId(), realRows[1].id);
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function').length, 0);
  assert(!text(h.render()).includes('Unable to load the worksheet.'));
  h.render();
  assert.equal(requests.length, requestCount + 1);
  assert(requests.every(request => request.url.startsWith('/api/body-review?structure=') && !request.options.method));
  h.cleanup();
});

test('clicking the selected queue row is a no-op even with dirty edits', async () => {
  const h = setup({ rows: realRows }); await h.dirty();
  const before = h.selectedId(), requestCount = requests.length;
  h.selected().props.onClick(); h.render();
  assert.equal(h.selectedId(), before); assert.equal(dialog(h.render()).props.open, false);
  assert.equal(requests.length, requestCount);
  h.cleanup();
});

test('actual navigation clears stale errors and superseded requests cannot replace the new worksheet', async () => {
  const h = setup({ rows: realRows }), initial = requests[0];
  h.move('Next'); h.render();
  assert.equal(initial.options.signal.aborted, true);
  initial.reject(new Error('Obsolete worksheet failure')); await settle();
  assert(!text(h.render()).includes('Obsolete worksheet failure'));
  requests.at(-1).reject(new Error('Current worksheet failure')); await settle();
  assert(text(h.render()).includes('Current worksheet failure'));
  h.move('Next');
  assert(!text(h.render()).includes('Current worksheet failure'));
  assert.equal(walk(h.render(), n => n.props.role === 'alert').length, 0);
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function').length, 0);
  h.render();
  requests.at(-1).resolve({ ok: true, json: async () => worksheet(realRows[2].id) }); await settle();
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function')[0].props.id, realRows[2].id);
  h.cleanup();
});

test('altered evidence cannot expose the decision editor; retry accepts the trusted worksheet', async () => {
  const h = setup({ rows: realRows });
  const altered = worksheet(realRows[0].id);
  altered.topics[0].body += ' Altered teaching under an unchanged revision.';
  requests.at(-1).resolve({ ok: true, json: async () => altered }); await settle();
  assert(text(h.render()).includes('Unexpected worksheet. Please retry.'));
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function').length, 0);
  button(h.render(), 'Retry').props.onClick(); h.render();
  requests.at(-1).resolve({ ok: true, json: async () => worksheet(realRows[0].id) }); await settle();
  assert(!text(h.render()).includes('Unexpected worksheet. Please retry.'));
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function').length, 1);
  h.cleanup();
});

test('navigation styles provide wrapping, visible focus and 44px targets without a fixed overlay', async () => {
  const css = await readFile(resolve(atlas, 'app/review/body/body-review.css'), 'utf8');
  const rules = css.slice(css.indexOf('.body-review-structure-navigation {'), css.indexOf('.body-review-paper details {'));
  assert(rules.includes('flex-wrap: wrap'));
  assert(rules.includes('min-height: 44px')); assert(rules.includes('min-width: 44px'));
  assert(rules.includes('white-space: normal')); assert(rules.includes(':focus-visible'));
  assert(!rules.includes('position: fixed'));
});

test('combined model follows only the parsed worksheet and retires with selection', async () => {
  const h = setup({ rows: realRows });
  const previews = () => walk(h.render(), n => typeof n.props.revision === 'string' && Object.hasOwn(n.props, 'href'));
  assert.equal(previews().length, 0, 'No model is guessed while material loads');
  const first = worksheet(realRows[0].id);
  requests.at(-1).resolve({ok:true,json:async()=>first}); await settle();
  const preview = previews()[0]; assert(preview);
  assert.equal(preview.props.href, first.atlasLink);
  assert.equal(preview.props.revision, first.materialHash);
  assert.equal(preview.key, first.materialHash);
  await h.dirty(); h.move('Next'); keepEditing(h.render());
  assert.equal(previews()[0].key, first.materialHash, 'Cancelled dirty navigation retains the same model and worksheet');
  h.move('Next'); discard(h.render());
  assert.equal(previews().length, 0, 'Old preview unmounts before the new request completes');
  const second = worksheet(realRows[1].id);
  requests.at(-1).resolve({ok:true,json:async()=>second}); await settle();
  assert.equal(previews()[0].props.href, second.atlasLink);
  assert.equal(previews()[0].key, second.materialHash);
  assert(requests.every(request=>!request.options.method),'Inspecting and navigating never writes a decision');
  h.cleanup();
});

test('confirmed-approval continuation uses the current filtered queue and rejects a retired callback', async () => {
  const h = setup({ rows: realRows });
  requests.at(-1).resolve({ok:true,json:async()=>worksheet(realRows[0].id)}); await settle();
  const editor = walk(h.render(), n => typeof n.props.onApproved === 'function')[0];
  assert.equal(editor.props.canAdvance, true);
  editor.props.onApproved(); h.render();
  assert.equal(h.selectedId(), realRows[1].id);
  const count = requests.length;
  editor.props.onApproved(); h.render();
  assert.equal(h.selectedId(), realRows[1].id, 'Retired worksheet cannot advance another item');
  assert.equal(requests.length, count);
  assert(requests.every(request=>!request.options.method), 'Adapter performs navigation, never an approval write');
  h.cleanup();
});

test('Skip for now retains the existing dirty-leave confirmation and never approves', async () => {
  const h = setup({ rows: realRows }); await h.dirty();
  button(h.render(), 'Skip for now').props.onClick({currentTarget:null}); h.render();
  assert.equal(dialog(h.render()).props.open, true);
  keepEditing(h.render());
  assert.equal(h.selectedId(), realRows[0].id);
  button(h.render(), 'Skip for now').props.onClick({currentTarget:null}); h.render();
  discard(h.render());
  assert.equal(h.selectedId(), realRows[1].id);
  assert(requests.every(request=>!request.options.method));
  h.cleanup();
});
