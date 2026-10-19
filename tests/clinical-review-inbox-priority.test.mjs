/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url), React = require('react');
let slots = [], cursor = 0, cleanup, calls = [], previousSummaryRef;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useEffect(fn, deps) { const i = cursor++, prior = slots[i];
    if (!prior || !deps || deps.some((value, index) => !Object.is(value, prior.deps?.[index]))) {
      prior?.dispose?.(); const dispose = fn(); slots[i] = { deps, dispose }; cleanup = dispose;
    } },
};
const built = await build({ stdin: { contents: "export { ClinicalReviewInbox } from './components/ClinicalReviewInbox'; export { parseInboxBatch } from './lib/clinical-review-inbox-contract';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, AbortController, Headers, Response, URL, structuredClone,
  window: { location: { reload() {} } }, fetch(url, options) { return new Promise(resolve => calls.push({ url, options, resolve })); },
  require: name => name === 'react' ? shim : require(name),
});
const { ClinicalReviewInbox, parseInboxBatch } = scope.exports;
const render = () => {
  cursor = 0; const tree = ClinicalReviewInbox();
  const summary = walk(tree, n => n.props.className === 'clinical-review-inbox-result')[0];
  previousSummaryRef?.(null); previousSummaryRef = summary?.props.ref; previousSummaryRef?.({ focus() {} });
  return tree;
};
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const list = () => walk(render(), n => n.type === 'ol' && n.props.className === 'clinical-review-inbox-list')[0];
const titles = () => list() ? walk(list(), n => n.type === 'li').map(li => words(walk(li, n => n.type === 'a')[0]).match(/Synthetic (.*?)Body/)?.[1]) : [];
const select = label => { const found = walk(render(), n => n.type === 'label' && words(n).startsWith(label))[0]; assert(found, label); return walk(found, n => n.type === 'select')[0]; };
const click = label => { const found = walk(render(), n => n.type === 'button' && words(n) === label)[0]; assert(found, label); found.props.onClick(); };
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = char => char.repeat(64), context = sha('a'), revision = sha('b');
const item = (key, status = 're-review', overrides = {}) => ({ key, title: `Synthetic ${key}`, area: 'structures', scopeLabel: 'Body', href: `/workspace/atlas-review?selection=${key}`, trackLabel: 'Anatomy', revision: sha('c'), status, capability: 'decision', ...overrides });
const batch = items => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: revision, page: 1, pageCount: 1, selectionTotal: items.length, nextPage: null, items, approval: false });
const response = body => ({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': context }), json: async () => body });
const begin = async items => { cleanup?.(); slots = []; calls = []; cleanup = null; render(); assert.equal(calls.length, 1); calls[0].resolve(response(batch(items))); await tick(); };
const finish = () => { cleanup?.(); cleanup = null; previousSummaryRef?.(null); previousSummaryRef = null; };

test('optional priority metadata accepts legacy and exact eligible rows only', () => {
  const legacy = item('legacy');
  assert.equal(parseInboxBatch(batch([legacy]), 1, null).items[0].changeReason, undefined);
  for (const changeReason of ['source-or-teaching', 'other-review-material', 'viewer-only', 'unavailable'])
    assert.equal(parseInboxBatch(batch([item(changeReason, 're-review', { changeReason })]), 1, null).items[0].changeReason, changeReason);
  for (const mutation of [
    { changeReason: 'unknown' }, { changeReason: null }, { changeReason: undefined }, { changeReason: 'toString' },
    { changeReason: 'source-or-teaching', status: 'approval-recorded' },
    { changeReason: 'viewer-only', status: 'not-started' },
    { changeReason: 'viewer-only', area: 'head-learning' },
    { changeReason: 'viewer-only', area: 'regional-learning' },
    { changeReason: 'viewer-only', area: 'source-comparisons' },
    { changeReason: 'viewer-only', capability: 'corrections' },
    { changeReason: 'viewer-only', capability: 'inspection-only' },
    { changeReason: 'viewer-only', revision: null },
    { changeReason: 'viewer-only', revision: [sha('c')] },
    { changeReason: 'viewer-only', revision: { value: sha('c') } },
    { changeReason: 'viewer-only', revision: 123 },
    { changeReason: 'viewer-only', revision: 'stale' },
    { changeReason: 'viewer-only', extra: true },
  ]) assert.throws(() => parseInboxBatch(batch([item('bad', 're-review', mutation)]), 1, null), /Invalid review inbox entry/);
  const inherited = Object.create({ changeReason: 'viewer-only' }); Object.assign(inherited, item('inherited'));
  assert.throws(() => parseInboxBatch(batch([inherited]), 1, null), /Invalid review inbox entry/);
});

test('explicit reasons label and rank only within re-review; filters reset with status and area', async () => {
  await begin([
    item('viewer', 're-review', { changeReason: 'viewer-only' }),
    item('legacy'), item('other', 're-review', { changeReason: 'other-review-material' }),
    item('unclassified', 're-review', { changeReason: 'unavailable' }),
    item('source', 're-review', { changeReason: 'source-or-teaching' }),
    item('changes', 'changes-required'), item('head', 're-review', { area: 'head-learning' }),
    item('unsupported', 'unavailable', { revision: null, capability: 'inspection-only', area: 'regional-learning' }),
  ]);
  assert.deepEqual(titles(), ['source', 'other', 'head', 'legacy', 'unclassified', 'viewer', 'changes']);
  assert(words(render()).includes('Source/teaching changed'));
  assert(words(render()).includes('Review material changed'));
  assert(words(render()).includes('Viewer update'));
  assert(words(render()).includes('Check worksheet'));
  assert(!words(render()).includes('Other/unclassified'));
  select('Status').props.onChange({ target: { value: 're-review' } });
  assert(select('Change')); assert(words(render()).includes('About change reasons'));
  select('Change').props.onChange({ target: { value: 'source-or-teaching' } }); assert.deepEqual(titles(), ['source']);
  select('Change').props.onChange({ target: { value: 'viewer-only' } }); assert.deepEqual(titles(), ['viewer']);
  select('Change').props.onChange({ target: { value: 'other-unclassified' } }); assert.deepEqual(titles(), ['other', 'head', 'legacy', 'unclassified']);
  select('Area').props.onChange({ target: { value: 'head-learning' } }); assert.deepEqual(titles(), ['head']);
  assert.equal(walk(render(), n => n.type === 'label' && words(n).startsWith('Change')).length, 0);
  select('Area').props.onChange({ target: { value: 'all' } }); assert.equal(select('Change').props.value, 'all');
  select('Status').props.onChange({ target: { value: 'all' } }); assert.equal(walk(render(), n => n.type === 'label' && words(n).startsWith('Change')).length, 0);
  assert(titles().includes('unsupported')); assert(words(render()).includes('Status unavailable'));
  finish();
});

test('change filter resets row pagination and keeps other or unavailable reasons reachable', async () => {
  const rows = Array.from({ length: 26 }, (_, i) => item(`source-${String(i).padStart(2, '0')}`, 're-review', { changeReason: 'source-or-teaching' }));
  rows.push(item('other', 're-review', { changeReason: 'other-review-material' }), item('missing', 're-review'), item('unknown', 're-review', { changeReason: 'unavailable' }));
  await begin(rows); select('Status').props.onChange({ target: { value: 're-review' } });
  assert.equal(titles().length, 24); click('Next'); assert.equal(titles().length, 5);
  select('Change').props.onChange({ target: { value: 'other-unclassified' } });
  assert.deepEqual(titles(), ['other', 'missing', 'unknown']);
  assert(words(render()).includes('Page') === false || !words(render()).includes('Page 2 of'));
  finish();
});
