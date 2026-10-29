/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import type {PreviewLocalFile, SlidePreviewManifest} from '../lib/lecture-slide-preview.ts';

const require = createRequire(import.meta.url);
const tick = () => new Promise(resolve => setImmediate(resolve));
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const nodes = (node: any): any[] => Array.isArray(node) ? node.flatMap(nodes) : React.isValidElement(node) ? [node, ...nodes((node as any).props.children)] : [];
const content = (node: any): string => Array.isArray(node) ? node.map(content).join('') : React.isValidElement(node) ? content((node as any).props.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';

function fixture(count = 2, label = '<Synthetic & source>'): SlidePreviewManifest {
  const hex = 'a'.repeat(64);
  return {schema: 'vm-lecture-slide-preview-v1', state: 'review-only',
    source: {label, sha256: hex, bytes: 123}, intakeSha256: 'b'.repeat(64),
    renderer: {name: 'Synthetic renderer', version: '1'}, sourceSlideCount: count,
    slides: Array.from({length: count}, (_, index) => ({
      position: index + 1, part: `ppt/slides/slide${index + 1}.xml`, partSha256: hex,
      title: `<Slide ${index + 1}>`, notes: `Original notes ${index + 1}\n<teaching text>`,
      image: {path: `slides/slide-${String(index + 1).padStart(4, '0')}.png`, sha256: sha(png), bytes: png.length, width: 1, height: 1},
    }))};
}

type Deferred = {resolve(bytes: Uint8Array): void};
type Folder = {files: PreviewLocalFile[]; reads: number[]; pending: Map<number, Deferred[]>};
function folder(manifest = fixture(), root = 'synthetic', delayed: number[] = []): Folder {
  const reads = Array(manifest.slides.length).fill(0), pending = new Map<number, Deferred[]>();
  const files: PreviewLocalFile[] = [{name: 'preview.json', webkitRelativePath: `${root}/preview.json`,
    size: new TextEncoder().encode(JSON.stringify(manifest)).length,
    async arrayBuffer() { return new TextEncoder().encode(JSON.stringify(manifest)).buffer; }}];
  for (let i = 0; i < manifest.slides.length; i++) {
    const name = manifest.slides[i].image.path.split('/').at(-1)!;
    files.push({name, webkitRelativePath: `${root}/${manifest.slides[i].image.path}`, size: png.length,
      async arrayBuffer() {
        reads[i]++;
        if (!delayed.includes(i)) return Uint8Array.from(png).buffer;
        return new Promise<ArrayBuffer>(resolve => {
          const queued = pending.get(i) || [];
          queued.push({resolve: bytes => resolve(Uint8Array.from(bytes).buffer)});
          pending.set(i, queued);
        });
      }});
  }
  return {files, reads, pending};
}

function harness() {
  const previous = new Map(['fetch', 'localStorage'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const create = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const revoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  const created: string[] = [], revoked: string[] = [];
  let fetched = 0, stored = 0;
  Object.defineProperty(globalThis, 'fetch', {configurable: true, value: async () => { fetched++; throw Error('unexpected fetch'); }});
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, get() { stored++; throw Error('unexpected storage'); }});
  Object.defineProperty(URL, 'createObjectURL', {configurable: true, value: () => { const url = `blob:synthetic-${created.length + 1}`; created.push(url); return url; }});
  Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: (url: string) => { revoked.push(url); }});
  const values: any[] = [], effects = new Map<number, {deps: unknown[]; cleanup?: () => void}>();
  let index = 0, tree: any, changed = false, queued: Array<() => void> = [], disposed = false, lateWrites = 0;
  const react = {...React,
    useRef: (seed: unknown) => { const i = index++; return values[i] ?? (values[i] = {current: seed}); },
    useState: (seed: unknown) => { const i = index++; if (!(i in values)) values[i] = typeof seed === 'function' ? (seed as () => unknown)() : seed;
      return [values[i], (next: any) => { if (disposed) { lateWrites++; return; }
        values[i] = typeof next === 'function' ? next(values[i]) : next; changed = true; }]; },
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => { const i = index++, old = effects.get(i);
      if (!old || deps.length !== old.deps.length || deps.some((value, j) => value !== old.deps[j])) queued.push(() => {
        old?.cleanup?.(); const cleanup = effect(); effects.set(i, {deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined});
      }); },
  };
  const compiled = ts.transpileModule(readFileSync('components/StudioSlidePreview.tsx', 'utf8'),
    {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
  const module = {exports: {} as any};
  new Function('require', 'module', 'exports', compiled)((name: string) => name === 'react' ? react : name.endsWith('.css') ? {} : require(name), module, module.exports);
  const flush = () => { assert(!disposed); let turns = 0; do {
    assert(++turns < 12, 'render settled'); index = 0; changed = false; queued = [];
    tree = module.exports.StudioSlidePreview(); for (const run of queued) run();
  } while (changed); return tree; };
  const all = () => nodes(tree);
  const find = (predicate: (node: any) => boolean) => { const found = all().find(predicate); assert(found, 'expected component node'); return found; };
  const button = (label: string) => find(node => node.type === 'button' && content(node) === label);
  const choose = (selection: Folder | PreviewLocalFile[]) => {
    const input = find(node => node.type === 'input' && node.props.type === 'file');
    const event = {currentTarget: {files: Array.isArray(selection) ? selection : selection.files, value: 'synthetic'}};
    input.props.onChange(event); assert.equal(event.currentTarget.value, '');
  };
  const settle = async () => { for (let i = 0; i < 5; i++) { await tick(); flush(); } };
  flush();
  return {flush, all, find, button, choose, settle, created, revoked,
    text: () => content(tree), get tree() { return tree; }, get fetched() { return fetched; },
    get stored() { return stored; }, get lateWrites() { return lateWrites; },
    dispose() { if (disposed) return; disposed = true; for (const effect of effects.values()) effect.cleanup?.();
      for (const [name, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete (globalThis as any)[name]; }
      if (create) Object.defineProperty(URL, 'createObjectURL', create); else delete (URL as any).createObjectURL;
      if (revoke) Object.defineProperty(URL, 'revokeObjectURL', revoke); else delete (URL as any).revokeObjectURL;
    }};
}

test('empty render is SSR-safe; private route authenticates before snapshot and client', () => {
  const h = harness(); try {
    assert.match(h.text(), /No preview selected/);
    assert.equal(h.all().some(node => node.type === 'img'), false);
    const source = readFileSync('app/studio/presentation-preview/page.tsx', 'utf8');
    assert(source.indexOf('await requireChatGPTUser(') >= 0);
    assert(source.indexOf('await requireChatGPTUser(') < source.indexOf('await getStudioSnapshot('));
    assert(source.indexOf('await getStudioSnapshot(') < source.indexOf('<StudioSlidePreview'));
  } finally { h.dispose(); }
});

test('local folder presents all source claims as text, full notes, and only selected PNG reads', async () => {
  const h = harness(), f = folder(); try {
    h.choose(f); await h.settle();
    assert.deepEqual(f.reads, [1, 0]);
    assert.equal(h.created.length, 1);
    const img = h.find(node => node.type === 'img');
    assert.equal(img.props.src, h.created[0]);
    img.props.onLoad(); h.flush();
    assert.match(h.text(), /Slide 1 of 2\. Image bytes verified/);
    assert.match(h.text(), /Original notes 1\n<teaching text>/);
    assert.match(h.text(), /<Synthetic & source>/);
    assert.equal(h.all().some(node => node.type === 'a' || node.type === 'form'), false);
    assert.equal(h.fetched, 0); assert.equal(h.stored, 0);
  } finally { h.dispose(); }
});

test('validated slide text finds an untitled source slide without indexing speaker notes', async () => {
  const data = fixture(3);
  data.slides[0].title = '';
  data.slides[0].sourceText = '  CUSTOM\n  heading  in a text box ';
  data.slides[1].title = 'Custom heading';
  data.slides[1].sourceText = 'Custom heading in the body too';
  data.slides[2].title = '';
  data.slides[2].notes = 'Custom heading in notes only';
  const h = harness(), f = folder(data);
  try {
    h.choose(f); await h.settle();
    const input = h.find(node => node.type === 'input' && node.props.type === 'search');
    input.props.onChange({currentTarget: {value: 'custom heading'}}); h.flush();
    assert.match(h.text(), /2 of 3 slides match/);
    const results = h.all().filter(node => node.type === 'li' && node.props.children?.type === 'button');
    assert.deepEqual(results.map(content), ['1. Untitled source slide CUSTOM heading in a text box', '2. Custom heading Custom heading in the body too']);
    assert.equal(data.slides[0].title, '');
    assert.deepEqual(f.reads, [1, 0, 0]);
    input.props.onChange({currentTarget: {value: 'notes only'}}); h.flush();
    assert.match(h.text(), /0 of 3 slides match/);
    assert.deepEqual(f.reads, [1, 0, 0]);
  } finally { h.dispose(); }
});

test('React server markup escapes source label, title, and full notes as text', async () => {
  const h = harness(), data = fixture(1, '<script>source</script>');
  data.slides[0].title = '<script>title</script>';
  data.slides[0].notes = '<script>notes</script>\nSecond line';
  try {
    h.choose(folder(data)); await h.settle();
    const markup = renderToStaticMarkup(h.tree);
    assert.doesNotMatch(markup, /<script>/);
    assert.match(markup, /&lt;script&gt;source&lt;\/script&gt;/);
    assert.match(markup, /&lt;script&gt;title&lt;\/script&gt;/);
    assert.match(markup, /&lt;script&gt;notes&lt;\/script&gt;\nSecond line/);
  } finally { h.dispose(); }
});

test('file picker reset may clear its live FileList after selection without losing the package', async () => {
  const h = harness(), selected = folder();
  try {
    const input = h.find(node => node.type === 'input' && node.props.type === 'file');
    const liveFiles = [...selected.files];
    const target = {files: liveFiles, get value() { return 'selected'; }, set value(next: string) {
      assert.equal(next, ''); liveFiles.length = 0;
    }};
    input.props.onChange({currentTarget: target});
    await h.settle();
    assert.equal(liveFiles.length, 0);
    assert.match(h.text(), /1 \/ 2/);
    assert.deepEqual(selected.reads, [1, 0]);
  } finally { h.dispose(); }
});

test('next and previous respect bounds, revoke URLs, and keyboard acts only on the focused canvas', async () => {
  const h = harness(), f = folder(fixture(3)); try {
    h.choose(f); await h.settle();
    assert.equal(h.button('Previous slide').props.disabled, true);
    const canvas = h.find(node => node.type === 'figure');
    let prevented = 0;
    const event = (key: string, target: object, modifiers = {}) => ({key, target, currentTarget: canvas, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
      preventDefault() { prevented++; }, ...modifiers});
    canvas.props.onKeyDown(event('ArrowRight', {})); h.flush();
    canvas.props.onKeyDown(event('ArrowRight', canvas, {ctrlKey: true})); h.flush();
    assert.deepEqual(f.reads, [1, 0, 0]); assert.equal(prevented, 0);
    canvas.props.onKeyDown(event('End', canvas)); await h.settle();
    assert.deepEqual(f.reads, [1, 0, 1]); assert.equal(h.button('Next slide').props.disabled, true);
    assert.deepEqual(h.revoked, [h.created[0]]);
    const lastCanvas = h.find(node => node.type === 'figure');
    lastCanvas.props.onKeyDown({...event('ArrowRight', lastCanvas), currentTarget: lastCanvas}); await h.settle();
    assert.deepEqual(f.reads, [1, 0, 1]);
    h.button('Previous slide').props.onClick(); await h.settle();
    assert.deepEqual(f.reads, [1, 1, 1]); assert.equal(prevented, 2);
  } finally { h.dispose(); }
});

test('rapid navigation retires an older delayed PNG and its callbacks cannot alter the new slide', async () => {
  const h = harness(), f = folder(fixture(3), 'synthetic', [1]); try {
    h.choose(f); await h.settle();
    h.button('Next slide').props.onClick(); h.flush();
    assert.equal(f.pending.get(1)?.length, 1);
    h.button('Next slide').props.onClick(); await h.settle();
    assert.match(h.text(), /3 \/ 3/); assert.equal(h.created.length, 2);
    f.pending.get(1)![0].resolve(png); await h.settle();
    assert.match(h.text(), /3 \/ 3/); assert.equal(h.created.length, 2);
  } finally { h.dispose(); }
});

test('older first PNG resolving while next PNG is pending cannot clear checking state', async () => {
  const h = harness(), f = folder(fixture(2), 'synthetic', [0, 1]);
  try {
    h.choose(f); await h.settle();
    assert.equal(f.pending.get(0)?.length, 1);
    h.button('Next slide').props.onClick(); await h.settle();
    assert.equal(f.pending.get(1)?.length, 1);
    f.pending.get(0)![0].resolve(png); await h.settle();
    assert.match(h.text(), /Checking local preview/);
    assert.equal(h.created.length, 0);
    f.pending.get(1)![0].resolve(png); await h.settle();
    assert.equal(h.created.length, 1);
    assert.match(h.text(), /2 \/ 2/);
  } finally { h.dispose(); }
});

test('folder replacement and clear retire pending package, image, and decode callbacks', async () => {
  const h = harness(), first = folder(), second = folder(fixture(2, 'New source'), 'new'); try {
    h.choose(first); await h.settle();
    const oldImage = h.find(node => node.type === 'img');
    const oldNext = h.button('Next slide').props.onClick;
    const oldCanvas = h.find(node => node.type === 'figure');
    h.choose(second); await h.settle();
    assert.deepEqual(h.revoked, [h.created[0]]);
    oldImage.props.onError(); oldImage.props.onLoad(); h.flush();
    oldNext();
    oldCanvas.props.onKeyDown({key: 'End', target: oldCanvas, currentTarget: oldCanvas,
      altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, preventDefault() {}});
    await h.settle();
    assert.match(h.text(), /New source/); assert.doesNotMatch(h.text(), /could not be displayed/);
    assert.match(h.text(), /1 \/ 2/);
    const newNext = h.button('Next slide').props.onClick;
    h.button('Clear preview').props.onClick(); h.flush();
    newNext(); oldImage.props.onError(); h.flush();
    assert.match(h.text(), /No preview selected/); assert.equal(h.all().some(node => node.type === 'img'), false);
    assert.deepEqual(h.revoked, h.created);
  } finally { h.dispose(); }
});

test('malformed replacement clears old source; pending image and unmount callbacks cannot revive it', async () => {
  const h = harness(), old = folder(), slow = folder(fixture(2, 'Slow source'), 'slow', [0]); try {
    h.choose(old); await h.settle();
    h.choose(slow); await h.settle();
    assert.equal(slow.pending.get(0)?.length, 1);
    const invalid = folder(); invalid.files.pop();
    h.choose(invalid); await h.settle();
    assert.match(h.text(), /Could not open this preview/);
    assert.doesNotMatch(h.text(), /Slow source|<Synthetic & source>/);
    slow.pending.get(0)![0].resolve(png); await h.settle();
    assert.equal(h.all().some(node => node.type === 'img'), false);
    h.dispose();
    assert.deepEqual(h.revoked, h.created);
  } finally { h.dispose(); }
});

test('late manifest read cannot replace a newer folder, including after unmount', async () => {
  const h = harness(), slow = folder(fixture(1, 'Retired package')), newer = folder(fixture(1, 'Current package'));
  let finish!: (buffer: ArrayBuffer) => void;
  slow.files[0] = {...slow.files[0], arrayBuffer: () => new Promise(resolve => { finish = resolve; })};
  try {
    h.choose(slow); h.flush();
    h.choose(newer); await h.settle();
    assert.match(h.text(), /Current package/);
    finish(new TextEncoder().encode(JSON.stringify(fixture(1, 'Retired package'))).buffer);
    await h.settle();
    assert.match(h.text(), /Current package/); assert.doesNotMatch(h.text(), /Retired package/);
    const image = h.find(node => node.type === 'img');
    const navigation = h.find(node => node.type === 'figure').props.onKeyDown;
    h.dispose();
    image.props.onError(); image.props.onLoad();
    navigation({key: 'Home', target: {}, currentTarget: {}, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, preventDefault() {}});
    assert.deepEqual(h.revoked, h.created);
  } finally { h.dispose(); }
});

test('manifest read settling after unmount makes no state write or object URL', async () => {
  const h = harness(), slow = folder(fixture(1));
  let finish!: (buffer: ArrayBuffer) => void;
  slow.files[0] = {...slow.files[0], arrayBuffer: () => new Promise(resolve => { finish = resolve; })};
  h.choose(slow); h.flush();
  h.dispose();
  finish(new TextEncoder().encode(JSON.stringify(fixture(1))).buffer);
  for (let i = 0; i < 5; i++) await tick();
  assert.equal(h.lateWrites, 0);
  assert.equal(h.created.length, 0);
});

test('PNG read settling after unmount makes no state write or object URL', async () => {
  const h = harness(), slow = folder(fixture(1), 'synthetic', [0]);
  h.choose(slow); await h.settle();
  assert.equal(slow.pending.get(0)?.length, 1);
  h.dispose();
  slow.pending.get(0)![0].resolve(png);
  for (let i = 0; i < 5; i++) await tick();
  assert.equal(h.lateWrites, 0);
  assert.equal(h.created.length, 0);
});
