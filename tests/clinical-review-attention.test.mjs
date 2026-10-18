// Actual canonical imported component and website continuity wrapper; synthetic status responses only.
/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';
const require = createRequire(import.meta.url), React = require('react');
let states, cursor, effect, calls;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
  useEffect(fn) { effect = fn; },
};
const built = await build({ stdin: { contents: "export { ClinicalReviewResults } from './atlas-review/app/review/overview/results';",
  resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, AbortController, Headers, Response,
  fetch(url, options) { return new Promise((resolve, reject) => calls.push({ url, options, resolve: value => resolve({ headers: new Headers(), ...value }), reject })); },
  require: name => name === 'react' ? shim : name === 'next/link' ? () => null : require(name),
});
const { ClinicalReviewResults } = scope.exports;
const entry = { key: 'body:a', name: 'Synthetic selection', context: 'Synthetic model', laterality: 'left',
  href: '/workspace/atlas-review/body?structure=a', id: 'a', scope: 'body' };
let props = { entries: [entry], query: '?scope=body' };
const walk = (node, predicate, result = []) => {
  if (React.isValidElement(node)) { if (predicate(node)) result.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, result)); }
  return result;
};
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const render = () => { cursor = 0; return ClinicalReviewResults(props); };
const reset = () => { states = []; calls = []; render(); return effect(); };
const settle = () => new Promise(resolve => setImmediate(resolve));
const response = (geometry = 'approval-recorded') => ({ ok: true, status: 200, async json() {
  return { scope: 'private-to-signed-in-user', items: [{ key: entry.key, geometry, teaching: 'changes-required' }] }; } });

test('loading is not unreviewed, successful status is explicit and refresh clears old snapshot', async () => {
  let cleanup = reset();
  assert(text(render()).includes('Status not loaded'));
  assert(!text(render()).includes('Not started'));
  assert.equal(calls[0].url, '/api/atlas-review/review-overview?scope=body');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.credentials, 'same-origin');
  calls[0].resolve(response()); await settle();
  const tree = render();
  assert(text(tree).includes('Anatomy: Approval recorded'));
  assert(text(tree).includes('Teaching: Changes required'));
  assert(text(tree).includes('not institutional or publication approval'));
  const originalList = walk(tree, n => n.props.className === 'clinical-review-results')[0];
  assert.equal(walk(originalList, n => n.props.href === entry.href).length, 1);
  walk(tree, n => n.type === 'button')[0].props.onClick();
  assert.equal(states[0], 1);
  cleanup(); render(); cleanup = effect();
  assert(!text(render()).includes('Anatomy: Approval recorded'));
  calls[1].resolve(response('re-review')); await settle();
  assert(text(render()).includes('Anatomy: Re-review required'));
  cleanup();
});

test('signed-out, failed and mismatched responses do not imply empty history', async () => {
  for (const result of [{ ok: false, status: 401 }, { ok: false, status: 503 },
    { ok: true, status: 200, async json() { return { scope: 'public', items: [] }; } }]) {
    const cleanup = reset(); calls[0].resolve(result); await settle();
    const tree = render();
    assert(!text(tree).includes('Not started'));
    assert(text(tree).includes(result.status === 401 ? 'Sign in through a review workspace' : 'Saved status is unavailable'));
    assert.equal(walk(tree, n => n.type === 'button')[0].props.disabled, false);
    cleanup();
  }
});

test('unmount and slower superseded responses cannot restore obsolete approvals', async () => {
  let cleanup = reset();
  const old = calls[0]; cleanup();
  assert(old.options.signal.aborted);
  render(); cleanup = effect();
  calls[1].resolve(response('changes-required')); await settle();
  old.resolve(response()); await settle();
  assert(text(render()).includes('Anatomy: Changes required'));
  assert(!text(render()).includes('Anatomy: Approval recorded'));
  cleanup();
});

test('a response cancelled during body parsing cannot commit its results', async () => {
  const cleanup = reset(); let finish;
  calls[0].resolve({ ok: true, status: 200, json: () => new Promise(resolve => { finish = resolve; }) });
  await settle(); cleanup();
  finish(await response().json()); await settle();
  assert(!text(render()).includes('Anatomy: Approval recorded'));
});

const attentionSection = tree => walk(tree, n => n.props['aria-label'] === 'Review attention on this page');
const selections = length => Array.from({ length }, (_, index) => ({ ...entry,
  id: String(index), key: 'body:' + index, name: 'Selection ' + index,
  href: '/workspace/atlas-review/body?structure=' + index }));
const pageResponse = items => ({ ok: true, status: 200, async json() {
  return { scope: 'private-to-signed-in-user', items };
} });
const item = (selection, geometry, teaching = 'approval-recorded') => ({ key: selection.key, geometry, teaching });

test('page-local attention keeps independent track priorities, exact links and original list order', async () => {
  const entries = selections(11); props = { entries, query: '?scope=pilot' };
  const cleanup = reset(); assert.equal(attentionSection(render()).length, 0);
  const statuses = ['not-started', 'in-progress', 'changes-required', 're-review', 're-review',
    'approval-recorded', 'unavailable', 'approval-recorded', 'approval-recorded', 'approval-recorded', 'approval-recorded'];
  calls[0].resolve(pageResponse(entries.map((e, i) => item(e, statuses[i], i === 8 ? 'changes-required' : i === 9 ? 'not-started' : 'approval-recorded'))));
  await settle(); const tree = render(), [section] = attentionSection(tree);
  assert(text(section).includes('on this page'));
  assert(text(section).includes('11 selections'));
  assert(text(section).includes('Anatomy · 5 needing review'));
  assert(text(section).includes('Teaching · 2 needing review'));
  assert(text(section).includes('1 status unavailable — not counted as reviewed or unreviewed'));
  assert(text(section).includes('Recorded approvals are not publication approval'));
  assert(text(section).includes('then choose Anatomy or Teaching'));
  const links = walk(section, n => n.props.href);
  assert.deepEqual(Array.from(links, n => n.props.href), [entries[3].href, entries[8].href]);
  assert(links.every(n => n.props.prefetch === false));
  assert(text(links[0]).includes('Next Anatomy selection'));
  assert(text(links[1]).includes('Next Teaching selection'));
  const list = walk(tree, n => n.props.className === 'clinical-review-results')[0];
  assert.deepEqual(Array.from(walk(list, n => n.props.href), n => n.props.href), entries.map(e => e.href));
  cleanup();
});

test('each priority wins without reordering ties; unknown status and recorded approval are not pending', async () => {
  const entries = selections(4); props = { entries, query: '?scope=body&page=2' };
  for (const [statuses, expected] of [
    [['not-started', 'in-progress', 'changes-required', 're-review'], 3],
    [['not-started', 'in-progress', 'changes-required', 'approval-recorded'], 2],
    [['not-started', 'in-progress', 'in-progress', 'approval-recorded'], 1],
    [['not-started', 'not-started', 'unavailable', 'approval-recorded'], 0],
  ]) {
    const cleanup = reset(); calls[0].resolve(pageResponse(entries.map((e, i) => item(e, statuses[i]))));
    await settle(); const [section] = attentionSection(render());
    assert.equal(walk(section, n => n.props.href)[0].props.href, entries[expected].href);
    assert(text(section).includes('4 selections')); assert(text(section).includes('on this page'));
    assert(!text(section).includes('All reviews complete')); cleanup();
  }
  const cleanup = reset(); calls[0].resolve(pageResponse(entries.map(e => item(e, 'unavailable'))));
  await settle(); const [section] = attentionSection(render());
  assert.equal(walk(section, n => n.props.href).length, 0);
  assert(text(section).includes('Anatomy · 0 needing review'));
  assert(text(section).includes('4 statuses unavailable'));
  assert(text(section).includes('No known items needing review on this page'));
  cleanup();
});

test('failed or foreign private snapshots never show attention counts or next-item links', async () => {
  const entries = selections(2); props = { entries, query: '?scope=body' };
  const good = entries.map(e => item(e, 'not-started'));
  const badPages = [
    { ok: false, status: 401 }, { ok: false, status: 503 },
    { ok: true, status: 200, json: async () => ({ scope: 'public', items: good }) },
    pageResponse(good.slice(1)), pageResponse([...good, good[0]]),
    pageResponse(good.map((row, i) => i ? row : { ...row, key: 'foreign' })),
    pageResponse([...good].reverse()),
    pageResponse(good.map((row, i) => i ? row : { ...row, teaching: 'unknown' })),
  ];
  for (const response of badPages) {
    const cleanup = reset(); calls[0].resolve(response); await settle();
    assert.equal(attentionSection(render()).length, 0); cleanup();
  }
});

test('refresh and page remount cannot retain old attention or accept a slower superseded snapshot', async () => {
  const entries = selections(2); props = { entries, query: '?scope=body' };
  let cleanup = reset(); calls[0].resolve(pageResponse(entries.map(e => item(e, 're-review'))));
  await settle(); assert.equal(attentionSection(render()).length, 1);
  walk(render(), n => n.type === 'button')[0].props.onClick();
  assert.equal(attentionSection(render()).length, 0);
  cleanup(); render(); cleanup = effect(); const old = calls[1];
  walk(render(), n => n.type === 'button')[0].props.onClick(); cleanup(); render(); cleanup = effect();
  calls[2].resolve(pageResponse(entries.map(e => item(e, 'approval-recorded')))); await settle();
  old.resolve(pageResponse(entries.map(e => item(e, 're-review')))); await settle();
  const [section] = attentionSection(render()); assert.equal(walk(section, n => n.props.href).length, 0);
  assert(text(section).includes('Anatomy · 0 needing review')); assert(old.options.signal.aborted);
  cleanup();
  // page.tsx keys this component by the canonical href; changed pages remount.
  props = { entries: [entries[1]], query: '?scope=body&page=2' }; cleanup = reset();
  assert.equal(attentionSection(render()).length, 0); assert.equal(calls[0].url, '/api/atlas-review/review-overview?scope=body&page=2');
  calls[0].resolve(pageResponse([item(entries[1], 'not-started')])); await settle();
  assert.equal(walk(attentionSection(render())[0], n => n.props.href)[0].props.href, entries[1].href);
  assert(!text(attentionSection(render())[0]).includes('2 selections')); cleanup();
});
