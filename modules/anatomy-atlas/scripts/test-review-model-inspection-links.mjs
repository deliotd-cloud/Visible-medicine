import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

// Test-only overrides permit the same checks against a copied E candidate.
const atlasRoot = resolve(process.env.VM_ATLAS_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const requireFromAtlas = createRequire(pathToFileURL(join(atlasRoot, 'package.json')));
const { transform } = requireFromAtlas('esbuild');
const candidateRoot = resolve(process.env.VM_REVIEW_SOURCE_ROOT || atlasRoot);

function text(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return text(node.props?.children);
}
function walk(node, predicate, matches = []) {
  if (Array.isArray(node)) { node.forEach(child => walk(child, predicate, matches)); return matches; }
  if (!node || typeof node !== 'object' || !node.props) return matches;
  if (predicate(node)) matches.push(node);
  walk(node.props.children, predicate, matches);
  return matches;
}
function harness({ dirtySlot = -1 } = {}) {
  const state = [], listeners = new Map();
  if (dirtySlot >= 0) state[dirtySlot] = true;
  let cursor = 0, confirms = 0;
  const h = (type, props, ...children) => ({ type, props: { ...props, children } });
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    },
    useMemo(fn) { return fn(); },
    useEffect(fn) { fn(); },
    useRef(initial) { return { current: initial }; },
  };
  const context = {
    exports: {}, h, Fragment: 'Fragment', AbortController,
    window: {
      addEventListener(type, callback) { listeners.set(`window:${type}`, callback); },
      removeEventListener(type) { listeners.delete(`window:${type}`); },
      confirm() { confirms++; return false; },
    },
    document: {
      addEventListener(type, callback) { listeners.set(`document:${type}`, callback); },
      removeEventListener(type) { listeners.delete(`document:${type}`); },
    },
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'next/link') return () => null;
      if (name.includes('body-review-search')) return { bodyReviewQueue: rows => rows };
      if (name.includes('body-types')) return { bodySystems: {} };
      if (name.includes('nested-review-queue')) return {
        nestedReviewQuery: value => value,
        nestedReviewNavigationTrack: value => value,
        nestedReviewQueue: () => ({ entries: [], previous: null, next: null, index: -1 }),
      };
      if (name.includes('nested-review') && !name.includes('material') && !name.includes('client'))
        return { nestedReviewTracks: ['geometry', 'teaching', 'imaging'] };
      return new Proxy({}, { get: (_target, key) => String(key) });
    },
  };
  return {
    context, listeners,
    render(component, props) { cursor = 0; return component(props); },
    confirms: () => confirms,
  };
}
async function load(relative, h) {
  const source = await readFile(join(candidateRoot, relative), 'utf8');
  const result = await transform(source, {
    loader: 'tsx', format: 'cjs', target: 'es2022', jsx: 'transform',
    jsxFactory: 'h', jsxFragment: 'Fragment',
  });
  const module = { exports: {} };
  runInNewContext(result.code, { ...h.context, module, exports: module.exports });
  return module.exports;
}
function modelLinks(tree) {
  return walk(tree, node => node.type === 'a' && text(node).includes('separate tab'));
}
function checkLink(node, expected) {
  assert.equal(node.props.href, expected);
  assert.equal(node.props.target, '_blank');
  assert.deepEqual(new Set(node.props.rel.split(/\s+/)), new Set(['noopener', 'noreferrer']));
  assert.match(text(node), /model|dissection/);
  assert.match(text(node), /separate tab/);
}

test('actual body details render the unchanged exact model URL as separate-tab inspection', async () => {
  const h = harness(), { BodyReviewDetails } = await load('app/review/body/review-dashboard.tsx', h);
  const material = {
    atlasLink: '/regions/abdomen?structure=exact%3Achild&mode=both',
    source: { structure: { id: 'exact:child', name: 'Child', fmaId: 'FMA:1', laterality: 'left', sources: [], sourceTree: 'source' },
      bundle: { sha256: 'fixture-hash' }, credit: 'fixture', licence: 'fixture', sourceVersion: 'fixture' },
    materialHash: 'fixture-material', limits: [], topics: [], guidedTours: [], reasoning: null, checklist: {},
  };
  const links = modelLinks(h.render(BodyReviewDetails, { material }));
  assert.equal(links.length, 1);
  checkLink(links[0], material.atlasLink);
  assert.equal(modelLinks(h.render(BodyReviewDetails, { material: { ...material, atlasLink: null } })).length, 0);
});

test('actual body dashboard guard exempts separate-tab inspection but still guards ordinary navigation', async () => {
  const h = harness({ dirtySlot: 5 });
  const { BodyReviewDashboard } = await load('app/review/body/review-dashboard.tsx', h);
  const tree = h.render(BodyReviewDashboard, { rows: [], regions: [], initialId: null, initialRegion: 'all' });
  const click = target => {
    let prevented = false;
    tree.props.onClickCapture({ target: { closest: () => target }, preventDefault() { prevented = true; }, stopPropagation() {} });
    return prevented;
  };
  assert.equal(click({ target: '_blank', hasAttribute: () => false, getAttribute: () => '/regions/abdomen' }), false);
  assert.equal(h.confirms(), 0);
  assert.equal(click({ target: '', hasAttribute: () => false, getAttribute: () => '/review/overview' }), true);
  assert.equal(h.confirms(), 1);
});

test('actual nested workspace renders exact separate-tab link and leaves the dirty Review tab in place', async () => {
  const h = harness(), { NestedReviewWorkspace } = await load('app/review/nested/workspace.tsx', h);
  const packet = {
    atlasLink: '/regions/head?study=ventricles&structure=exact%3Achild',
    context: { nestedKey: 'study', structureId: 'exact:child', structureName: 'Child', sourceFrame: 'fixture-frame', materialHash: 'fixture-hash', teachingTabs: [] },
    source: { parent: { name: 'Parent' }, studyTitle: 'Study', limitations: 'fixture', credit: 'fixture',
      structure: { name: 'Child', laterality: 'left' }, orientationContext: null },
    teaching: { topics: [], orientationContext: null, guidedLearning: null, csfMotion: null, lesson: null, referenceTitles: {} },
  };
  const props = { rows: [{ key: 'study', name: 'Study' }], packet, invalid: false };
  let tree = h.render(NestedReviewWorkspace, props);
  let links = modelLinks(tree);
  assert.equal(links.length, 1);
  checkLink(links[0], packet.atlasLink);
  const editor = walk(tree, node => typeof node.props.onDirty === 'function')[0];
  assert(editor, 'Review editor exposes dirty callback');
  editor.props.onDirty(true);
  tree = h.render(NestedReviewWorkspace, props);
  links = modelLinks(tree);
  checkLink(links[0], packet.atlasLink);
  assert.equal(h.confirms(), 0);
  const guard = h.listeners.get('document:click');
  assert.equal(typeof guard, 'function');
  let prevented = false;
  guard({ target: { closest: () => ({ target: '_blank', hasAttribute: () => false }) }, preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.equal(prevented, false);
  assert.equal(h.confirms(), 0);
  guard({ target: { closest: () => ({ target: '', hasAttribute: () => false }) }, preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.equal(prevented, true);
  assert.equal(h.confirms(), 1);
  assert.equal(modelLinks(h.render(NestedReviewWorkspace, { ...props, packet: { ...packet, atlasLink: null } })).length, 0);
});

test('current-build body and nested packets preserve exact links and unsigned material', async () => {
  const { build } = await import('./workspace-test-build.mjs');
  const result = await build({
    stdin: {
      contents: "export {bodyReviewSummaries,bodyReviewMaterial} from './lib/body-review-material';export {nestedReviewRows,nestedReviewMaterial} from './lib/nested-review-material';",
      resolveDir: atlasRoot, loader: 'ts',
    },
    bundle: true, write: false, platform: 'node', format: 'esm',
  });
  const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  const bodyHarness = harness();
  const { BodyReviewDetails } = await load('app/review/body/review-dashboard.tsx', bodyHarness);
  const selectedBody = ['thorax', 'abdomen', 'forearm'].map(region => {
    const row = api.bodyReviewSummaries.find(value => value.regions.includes(region));
    assert(row, `Current body catalog contains ${region}`);
    return row;
  });
  assert.equal(new Set(selectedBody.map(row => row.id)).size, selectedBody.length);
  for (const row of selectedBody) {
    const material = await api.bodyReviewMaterial(row.id);
    assert(material?.atlasLink, `Current ${row.id} has an exact model link`);
    assert.equal(material.status, 'worksheet-not-submitted');
    assert.equal(material.approval, false);
    const prior = structuredClone(material);
    const links = modelLinks(bodyHarness.render(BodyReviewDetails, { material }));
    assert.equal(links.length, 1, `${row.id} exact-model anchor`);
    checkLink(links[0], prior.atlasLink);
    assert.deepEqual(material, prior, `${row.id} packet remains unchanged by rendering`);
  }

  for (const study of ['ventricles', 'eye', 'femoral']) {
    const nestedHarness = harness();
    const { NestedReviewWorkspace } = await load('app/review/nested/workspace.tsx', nestedHarness);
    const row = api.nestedReviewRows.find(value => value.study === study || value.study.includes(study));
    assert(row?.surfaces.length, `Current nested catalog contains ${study}`);
    const packet = await api.nestedReviewMaterial(row.key, row.surfaces[0].id);
    assert(packet?.atlasLink, `${study} has an exact child model link`);
    assert.equal(Object.hasOwn(packet, 'approval'), false, `${study} worksheet is not a decision`);
    const prior = structuredClone(packet);
    const links = modelLinks(nestedHarness.render(NestedReviewWorkspace, {
      rows: api.nestedReviewRows, packet, invalid: false,
    }));
    assert.equal(links.length, 1, `${study} exact-model anchor`);
    checkLink(links[0], prior.atlasLink);
    assert.deepEqual(packet, prior, `${study} packet remains unchanged by rendering`);
  }
});
