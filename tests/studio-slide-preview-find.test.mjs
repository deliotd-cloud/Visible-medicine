import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const requireSite = createRequire(new URL('../package.json', import.meta.url));
const React = requireSite('react');
const {renderToStaticMarkup} = requireSite('react-dom/server');
const ts = requireSite('typescript');
const tick = () => new Promise(resolve => setImmediate(resolve));
const textOf = node => Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : React.isValidElement(node) ? [node, ...nodes(node.props.children)] : [];

function manifest(titles = ['Intro', 'Brain Stem', 'Review']) {
  return {source: {label: 'Synthetic source', sha256: 'a'.repeat(64)}, intakeSha256: 'b'.repeat(64), renderer: {name: 'Synthetic', version: '1'},
    slides: titles.map((title, index) => ({position: index + 1, part: `ppt/slides/slide${index + 1}.xml`, partSha256: 'c'.repeat(64),
      title, notes: `Synthetic note ${index + 1}`, image: {path: `slides/slide-${index + 1}.png`, sha256: 'd'.repeat(64), width: 1, height: 1}}))};
}

function harness() {
  const priorFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const priorStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const priorCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const priorRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  let fetches = 0, stores = 0, urlCounter = 0, cursor = 0, tree, changed = false, disposed = false, lateWrites = 0;
  const slots = [], effects = new Map(), reads = [], revoked = [], packages = [], delayed = new Map(), failImages = new Set();
  Object.defineProperty(globalThis, 'fetch', {configurable: true, value: async () => {fetches++; throw Error('No network allowed');}});
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, get() {stores++; throw Error('No storage allowed');}});
  Object.defineProperty(URL, 'createObjectURL', {configurable: true, value: () => `blob:synthetic-${++urlCounter}`});
  Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: value => revoked.push(value)});
  const react = {...React,
    useRef(seed) { const at = cursor++; return slots[at] ?? (slots[at] = {current: seed}); },
    useState(seed) { const at = cursor++; if (!(at in slots)) slots[at] = typeof seed === 'function' ? seed() : seed;
      return [slots[at], value => {if (disposed) {lateWrites++; return;} slots[at] = typeof value === 'function' ? value(slots[at]) : value; changed = true;}]; },
    useEffect(effect, deps) { const at = cursor++, old = effects.get(at);
      if (!old || deps.some((value, i) => value !== old.deps[i])) {old?.cleanup?.(); effects.set(at, {deps, cleanup: effect()});} },
  };
  const source = readFileSync(new URL('../components/StudioSlidePreview.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? react : name.endsWith('.css') ? {} : name === '../lib/lecture-slide-preview.ts' ? {
    readSlidePreviewPackage: async () => {assert(packages.length); const next = packages.shift(); if (next instanceof Error) throw next; return {manifest: next, images: new Map(next.slides.map(slide => [slide.image.path, {name: slide.image.path}]))};},
    readSlidePreviewImage: async (_file, image) => {reads.push(image.path); if (failImages.has(image.path)) throw Error('Synthetic image verification failure'); if (delayed.has(image.path)) return new Promise(resolve => delayed.get(image.path).push(resolve)); return Uint8Array.of(137, 80, 78, 71);},
  } : requireSite(name), module, module.exports);
  function flush() {assert(!disposed); let turns = 0; do {assert(++turns < 20); changed = false; cursor = 0; tree = module.exports.StudioSlidePreview();} while (changed); return tree;}
  const all = () => nodes(tree);
  const find = predicate => {const node = all().find(predicate); assert(node, 'Expected node'); return node;};
  const button = label => find(node => node.type === 'button' && textOf(node) === label);
  async function settle() {for (let i = 0; i < 5; i++) {await tick(); flush();}}
  flush();
  return {flush, all, find, button, settle, reads, revoked, delayed, failImages,
    get text() {return textOf(tree);}, get tree() {return tree;}, get fetches() {return fetches;}, get stores() {return stores;}, get lateWrites() {return lateWrites;},
    async choose(next) {packages.push(next); findInput('file').props.onChange({currentTarget: {files: [{}], value: 'selected'}}); await settle();},
    findInput(type) {return findInput(type);},
    search(value) {findInput('search').props.onChange({currentTarget: {value}}); flush();},
    result(position) {return find(node => node.type === 'button' && node.props['aria-current'] !== undefined && textOf(node).startsWith(`${position}.`));},
    release(path) {for (const resolve of delayed.get(path) ?? []) resolve(Uint8Array.of(137, 80, 78, 71)); delayed.delete(path);},
    dispose() {if (disposed) return; disposed = true; for (const entry of effects.values()) entry.cleanup?.();
      for (const [name, descriptor] of [['fetch', priorFetch], ['localStorage', priorStorage]]) if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
      if (priorCreate) Object.defineProperty(URL, 'createObjectURL', priorCreate); else delete URL.createObjectURL;
      if (priorRevoke) Object.defineProperty(URL, 'revokeObjectURL', priorRevoke); else delete URL.revokeObjectURL;},
  };
  function findInput(type) {return find(node => node.type === 'input' && node.props.type === type);}
}

test('slide search filters locally in source order without selecting or reading another image', async () => {
  const h = harness(); try {
    await h.choose(manifest(['Introduction', 'Brain Stem', 'Brain Vessels', 'Summary']));
    assert.equal(h.findInput('search').props.maxLength, 80);
    assert.equal(h.findInput('search').props.autoComplete, 'off');
    assert(h.all().some(node => node.type === 'label' && node.props.htmlFor === 'slide-preview-title-search' && textOf(node) === 'Find a slide'));
    assert.match(h.text, /Search titles and slide text/);
    assert.equal(h.all().some(node => node.type === 'select' || node.type === 'option'), false);
    h.search('  BRAIN  ');
    assert.match(h.text, /2 of 4 slides match/);
    assert.match(h.text, /Current slide 1 is outside these results/);
    const results = h.all().filter(node => node.type === 'li' && node.props.children?.type === 'button');
    assert.deepEqual(results.map(textOf), ['2. Brain Stem', '3. Brain Vessels']);
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
    assert.match(h.text, /1 \/ 4/);
    assert.equal(h.fetches, 0); assert.equal(h.stores, 0);
  } finally {h.dispose();}
});

test('explicit result selection uses existing image request path and keeps the filter', async () => {
  const h = harness(); try {
    await h.choose(manifest()); h.search('brain');
    const result = h.all().find(node => node.type === 'button' && textOf(node) === '2. Brain Stem');
    assert(result); result.props.onClick(); await h.settle();
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-2.png']);
    assert.match(h.text, /2 \/ 3/);
    assert.equal(h.findInput('search').props.value, 'brain');
    assert.equal(h.all().find(node => node.type === 'button' && textOf(node) === '2. Brain Stem').props['aria-current'], 'true');
    assert.doesNotMatch(h.text, /outside these results/);
  } finally {h.dispose();}
});

test('bounded search, no match and clear preserve current slide and return focus', async () => {
  const h = harness(); try {
    await h.choose(manifest());
    h.search('  nothing\t HERE  ');
    assert.match(h.text, /0 of 3 slides match/);
    assert.match(h.text, /No slides match/);
    assert.match(h.text, /1 \/ 3/);
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
    let focused = 0;
    h.findInput('search').props.ref.current = {focus() {focused++;}};
    h.button('Clear find').props.onClick(); h.flush();
    assert.equal(focused, 1); assert.equal(h.findInput('search').props.value, '');
    assert.equal(h.all().some(node => node.type === 'li'), false);
    h.search('x'.repeat(200));
    assert.equal(h.findInput('search').props.value.length, 80);
    assert.equal(h.button('Clear find').props.disabled, false);
    assert.equal(h.fetches, 0); assert.equal(h.stores, 0);
  } finally {h.dispose();}
});

test('500 loaded titles remain searchable without a 500-option picker or eager image reads', async () => {
  const h = harness(); try {
    await h.choose(manifest(Array.from({length: 500}, (_, index) => `Topic ${index + 1}`)));
    h.search('Topic 499');
    assert.match(h.text, /1 of 500 slides match/);
    assert.equal(h.all().filter(node => node.type === 'li').length, 1);
    assert.equal(h.all().some(node => node.type === 'option'), false);
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
  } finally {h.dispose();}
});

test('untitled display fallback is not indexed and source title/query render as escaped text', async () => {
  const h = harness(); try {
    await h.choose(manifest(['Intro', '', '<script>Brain</script>']));
    h.search('untitled');
    assert.match(h.text, /0 of 3 slides match/);
    assert.doesNotMatch(h.text, /2\. Untitled source slide/);
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
    h.search('<script>');
    const markup = renderToStaticMarkup(h.tree);
    assert.doesNotMatch(markup, /<script>/);
    assert.match(markup, /&lt;script&gt;Brain&lt;\/script&gt;/);
    assert.match(markup, /value="&lt;script&gt;"/);
  } finally {h.dispose();}
});

test('custom heading text is searchable on an untitled slide without changing its title', async () => {
  const h = harness(); try {
    const data = manifest(['Intro', '', 'Brain atlas', 'Notes only']);
    data.slides[1].sourceText = '  BRaIN\n  ATLAS   custom heading  ';
    data.slides[2].sourceText = 'Brain atlas body';
    data.slides[3].notes = 'Custom heading appears only in speaker notes';
    await h.choose(data);
    h.search('brain atlas');
    assert.match(h.text, /2 of 4 slides match/);
    const results = h.all().filter(node => node.type === 'li' && node.props.children?.type === 'button');
    assert.deepEqual(results.map(textOf), ['2. Untitled source slide BRaIN ATLAS custom heading', '3. Brain atlas Brain atlas body']);
    assert.equal(data.slides[1].title, '');
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
    results[0].props.children.props.onClick(); await h.settle();
    assert.match(textOf(h.find(node => node.type === 'figcaption')), /2 \/ 4 · Slide 2/);
    assert.equal(data.slides[1].title, '');
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-2.png']);
    h.search('custom heading');
    assert.match(h.text, /1 of 4 slides match/);
    assert.deepEqual(h.all().filter(node => node.type === 'li').map(textOf), ['2. Untitled source slide BRaIN ATLAS custom heading']);
    h.search('speaker notes');
    assert.match(h.text, /0 of 4 slides match/);
    assert.equal(data.slides[3].title, 'Notes only');
    assert.equal(h.fetches, 0); assert.equal(h.stores, 0);
  } finally {h.dispose();}
});

test('search results quote a bounded matching excerpt without notes or altered source titles', async () => {
  const h = harness(); try {
    const data = manifest(['', 'Legacy title']);
    data.slides[0].sourceText = 'İ '.repeat(90) + '🫁'.repeat(70) + ' TARGET\n VIEW ' + '🧠'.repeat(120);
    data.slides[0].notes = 'Private answer key';
    const original = structuredClone(data);
    await h.choose(data); h.search('target view');
    const excerpt = textOf(h.find(node => node.props.className === 'slide-preview-result-excerpt'));
    assert.match(excerpt, /TARGET VIEW/);
    assert.match(excerpt, /^….*…$/u);
    assert(excerpt.length <= 184, 'excerpt remains compact with intact Unicode boundaries');
    assert(excerpt.isWellFormed(), 'do not split supplementary Unicode characters');
    const result = h.find(node => node.type === 'li');
    assert.doesNotMatch(textOf(result), /Private answer key/);
    assert.match(textOf(result), /^1\. Untitled source slide /);
    assert.deepEqual(data, original);
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
    h.search('legacy');
    assert.deepEqual(h.all().filter(node => node.type === 'li').map(textOf), ['2. Legacy title']);
    assert.equal(h.all().some(node => node.props.className === 'slide-preview-result-excerpt'), false);
    assert.equal(h.fetches, 0); assert.equal(h.stores, 0);
  } finally { h.dispose(); }
});

test('source excerpts are literal text, including HTML-looking content', async () => {
  const h = harness(); try {
    const data = manifest(['']);
    data.slides[0].sourceText = 'Heading <script>widget</script> plain text';
    await h.choose(data); h.search('widget');
    const result = h.find(node => node.type === 'li');
    assert.match(textOf(result), /Heading <script>widget<\/script> plain text/);
    const markup = renderToStaticMarkup(result);
    assert.doesNotMatch(markup, /<script>/);
    assert.match(markup, /&lt;script&gt;widget&lt;\/script&gt;/);
    assert.equal(data.slides[0].title, '');
  } finally { h.dispose(); }
});

test('replacement, verification error and clear retire stale result actions and search state', async () => {
  const h = harness(); try {
    await h.choose(manifest(['First', 'Find old'])); h.search('find');
    const stale = h.all().find(node => node.type === 'button' && textOf(node) === '2. Find old').props.onClick;
    await h.choose(manifest(['New source', 'Other']));
    assert.equal(h.findInput('search').props.value, '');
    stale(); await h.settle();
    assert.match(h.text, /1 \/ 2/);
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-1.png']);
    h.search('other');
    h.failImages.add('slides/slide-2.png');
    h.all().find(node => node.type === 'button' && textOf(node) === '2. Other').props.onClick();
    await h.settle();
    assert.match(h.text, /This slide could not be verified/);
    assert.equal(h.findInput('search').props.value, 'other');
    assert.match(h.text, /2 \/ 2/);
    h.button('Clear preview').props.onClick(); h.flush();
    stale(); h.flush();
    assert.equal(h.all().some(node => node.type === 'input' && node.props.type === 'search'), false);
    assert.match(h.text, /No preview selected/);
    assert.equal(h.fetches, 0); assert.equal(h.stores, 0);
  } finally {h.dispose();}
});

test('a result chosen while another image is busy retires the older response', async () => {
  const h = harness(); try {
    await h.choose(manifest(['Intro', 'Brain One', 'Brain Two'])); h.search('brain');
    h.delayed.set('slides/slide-2.png', []);
    h.all().find(node => node.type === 'button' && textOf(node) === '2. Brain One').props.onClick();
    await h.settle();
    assert.match(h.text, /Checking local preview/);
    h.all().find(node => node.type === 'button' && textOf(node) === '3. Brain Two').props.onClick();
    await h.settle();
    assert.match(h.text, /3 \/ 3/);
    const url = h.find(node => node.type === 'img').props.src;
    h.release('slides/slide-2.png'); await h.settle();
    assert.equal(h.find(node => node.type === 'img').props.src, url);
    assert.match(h.text, /3 \/ 3/);
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-2.png', 'slides/slide-3.png']);
  } finally {h.dispose();}
});

test('number jump waits for explicit Go or unmodified Enter and uses the verified image path', async () => {
  const h = harness(); try {
    await h.choose(manifest(['One', 'Two', 'Three']));
    const field = h.findInput('number');
    assert.equal(field.props.min, 1); assert.equal(field.props.max, 3); assert.equal(field.props.step, 1);
    assert(h.all().some(node => node.type === 'label' && node.props.htmlFor === 'slide-preview-jump-input'));
    field.props.onChange({currentTarget: {value: '3'}}); h.flush();
    assert.match(h.text, /1 \/ 3/);
    assert.deepEqual(h.reads, ['slides/slide-1.png']);
    h.button('Go').props.onClick(); await h.settle();
    assert.match(h.text, /3 \/ 3/);
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-3.png']);
    h.findInput('number').props.onChange({currentTarget: {value: '2'}}); h.flush();
    let prevented = 0;
    h.findInput('number').props.onKeyDown({key: 'Enter', altKey: true, ctrlKey: false, metaKey: false, preventDefault() {prevented++;}});
    h.flush(); assert.equal(prevented, 0); assert.match(h.text, /3 \/ 3/);
    h.findInput('number').props.onKeyDown({key: 'Enter', altKey: false, ctrlKey: false, metaKey: false, preventDefault() {prevented++;}});
    await h.settle(); assert.equal(prevented, 1); assert.match(h.text, /2 \/ 3/);
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-3.png', 'slides/slide-2.png']);
  } finally {h.dispose();}
});

test('blank, fractional, nonnumeric and out-of-range jumps are refused without image reads', async () => {
  const h = harness(); try {
    await h.choose(manifest(['One', 'Two', 'Three']));
    let focused = 0;
    h.findInput('number').props.ref.current = {focus() {focused++;}};
    for (const value of ['', '0', '4', '1.5', 'not a number', '9999999999']) {
      h.findInput('number').props.onChange({currentTarget: {value}}); h.flush();
      h.button('Go').props.onClick(); h.flush();
      assert.match(h.text, /Enter a whole slide number from 1 to 3/);
      assert.equal(h.findInput('number').props['aria-invalid'], true);
      assert.match(h.text, /1 \/ 3/);
      assert.deepEqual(h.reads, ['slides/slide-1.png']);
    }
    assert.equal(focused, 6);
    assert.equal(h.fetches, 0); assert.equal(h.stores, 0);
  } finally {h.dispose();}
});

test('stale number handlers after package replacement or clear cannot change the new preview', async () => {
  const h = harness(); try {
    await h.choose(manifest(['Old one', 'Old two', 'Old three']));
    h.findInput('number').props.onChange({currentTarget: {value: '3'}}); h.flush();
    const oldGo = h.button('Go').props.onClick;
    const oldEnter = h.findInput('number').props.onKeyDown;
    const oldChange = h.findInput('number').props.onChange;
    h.search('Old');
    const oldSearchChange = h.findInput('search').props.onChange;
    const oldClearFind = h.button('Clear find').props.onClick;
    await h.choose(manifest(['New one', 'New two']));
    assert.equal(h.findInput('number').props.value, '');
    h.search('New');
    oldChange({currentTarget: {value: '2'}}); oldGo();
    let prevented = 0;
    oldEnter({key: 'Enter', altKey: false, ctrlKey: false, metaKey: false, preventDefault() {prevented++;}});
    oldSearchChange({currentTarget: {value: 'Old'}}); oldClearFind();
    await h.settle();
    assert.equal(prevented, 0);
    assert.equal(h.findInput('number').props.value, '');
    assert.equal(h.findInput('search').props.value, 'New');
    assert.match(h.text, /1 \/ 2/);
    assert.deepEqual(h.reads, ['slides/slide-1.png', 'slides/slide-1.png']);
    h.button('Clear preview').props.onClick(); h.flush();
    oldGo(); h.flush();
    assert.match(h.text, /No preview selected/);
    assert.equal(h.all().some(node => node.type === 'input' && node.props.type === 'number'), false);
  } finally {h.dispose();}
});

test('desktop find column sits beside the image and stacks after it on narrow screens', async () => {
  const h = harness(); try {
    await h.choose(manifest());
    const view = h.find(node => node.props.className === 'slide-preview-view');
    assert.equal(view.props.children[0].type, 'figure');
    assert.equal(view.props.children[1].props.className, 'slide-preview-find');
    assert.equal(h.all().some(node => node.type === 'form'), false);
    const css = readFileSync(new URL('../components/studio-slide-preview.css', import.meta.url), 'utf8');
    assert.match(css, /\.slide-preview-view\s*\{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0,1fr\) minmax\(220px,290px\)/);
    assert.match(css, /@media \(max-width: 900px\)\s*\{\s*\.slide-preview-view\s*\{ display: block; \}/);
    assert.match(css, /\.slide-preview-find-results\s*\{[^}]*max-height: 252px;[^}]*overflow: auto/);
  } finally {h.dispose();}
});
