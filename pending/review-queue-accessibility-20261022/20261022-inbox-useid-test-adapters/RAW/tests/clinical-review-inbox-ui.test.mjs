/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url), React = require('react');
let slots = [], cursor = 0, cleanup, calls = [], reloads = 0, previousSummaryRef;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useEffect(fn, deps) {
    const i = cursor++, prior = slots[i];
    if (!prior || !deps || deps.some((value, index) => !Object.is(value, prior.deps?.[index]))) {
      prior?.dispose?.();
      const dispose = fn(); slots[i] = { deps, dispose }; cleanup = dispose;
    }
  },
};
const built = await build({ stdin: { contents: "export { ClinicalReviewInbox } from './components/ClinicalReviewInbox';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, AbortController, Headers, Response, URL, structuredClone,
  window: { location: { reload() { reloads++; } } },
  fetch(url, options) { return new Promise(resolve => calls.push({ url, options, resolve })); },
  require: name => name === 'react' ? shim : require(name),
});
const { ClinicalReviewInbox } = scope.exports;
const render = () => {
  cursor = 0; const tree = ClinicalReviewInbox();
  const summary = walk(tree, n => n.props.className === 'clinical-review-inbox-result')[0];
  previousSummaryRef?.(null); previousSummaryRef = summary?.props.ref; previousSummaryRef?.({ focus() {} });
  return tree;
};
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const worksheetLinks = () => walk(render(), n => n.type === 'ol' && n.props.className === 'clinical-review-inbox-list').flatMap(list => walk(list, n => n.type === 'a'));
const button = name => { const label = name === 'Restart scan' ? 'Refresh reviews' : name; const found = walk(render(), n => n.type === 'button' && words(n).includes(label))[0]; assert(found, `button ${name}`); return found; };
const controls = () => walk(render(), n => n.type === 'select' || n.type === 'input');
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = char => char.repeat(64), context = sha('a'), revision = sha('b');
const item = (key, status = 'not-started', overrides = {}) => ({ key, title: `Synthetic ${key}`, area: 'structures', scopeLabel: 'Body', href: `/workspace/atlas-review?selection=${key}`, trackLabel: 'Anatomy', revision: sha('c'), status, capability: 'decision', ...overrides });
const batch = (page, pageCount, items, overrides = {}) => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: revision, page, pageCount, selectionTotal: 20, nextPage: page < pageCount ? page + 1 : null, items, approval: false, ...overrides });
const response = (body, token = context) => ({ ok: true, status: 200, headers: new Headers(token ? { 'X-Clinical-Review-Context': token } : {}), json: async () => body });
const begin = () => { cleanup?.(); slots = []; calls = []; cleanup = null; render(); assert.equal(calls.length, 1); assert(words(render()).includes('loading')); };
const finish = () => { cleanup?.(); cleanup = null; previousSummaryRef?.(null); previousSummaryRef = null; };

test('automatic sequential load shows loaded-only progress, honest statuses and new-tab links', async () => {
  begin(); assert.equal(calls[0].url, '/api/atlas-review/inbox?page=1'); assert.equal(calls[0].options.cache, 'no-store');
  calls[0].resolve(response(batch(1, 2, [item('a', 're-review'), item('b', 'unavailable', { revision: null, capability: 'inspection-only' })]))); await tick();
  assert.equal(calls.length, 2); assert.equal(calls[1].url, `/api/atlas-review/inbox?page=2&revision=${revision}`);
  assert(words(render()).includes('1 known needing review, 1 unavailable')); assert(words(render()).includes('loaded-page counts only'));
  assert.equal(worksheetLinks().length, 1); // unavailable excluded by default
  calls[1].resolve(response(batch(2, 2, [item('c', 'approval-recorded'), item('d', 'inspection-required', { capability: 'inspection-only' })]))); await tick();
  assert(words(render()).includes('2 known needing review, 1 unavailable, 1 recorded decisions'));
  assert(words(render()).includes('All catalogue pages in this scan were checked'));
  const anchor = worksheetLinks()[0]; assert.equal(anchor.props.target, '_blank'); assert.equal(anchor.props.rel, 'noopener noreferrer');
  assert(words(render()).includes('Exact worksheet revision')); finish();
});

test('request failure preserves cursor; pause and restart refuse late response', async () => {
  begin(); calls[0].resolve(response(batch(1, 3, [item('a')]))); await tick();
  calls[1].resolve({ ok: false, status: 503, headers: new Headers() }); await tick();
  assert(words(render()).includes('1 status rows loaded')); button('Resume from page 2').props.onClick();
  assert.equal(calls[2].url, `/api/atlas-review/inbox?page=2&revision=${revision}`);
  button('Pause').props.onClick(); assert(calls[2].options.signal.aborted);
  calls[2].resolve(response(batch(2, 3, [item('late')]))); await tick(); assert(!words(render()).includes('Synthetic late'));
  button('Resume from page 2').props.onClick(); assert.equal(calls[3].url, calls[2].url);
  button('Restart scan').props.onClick(); assert.equal(calls[4].url, '/api/atlas-review/inbox?page=1'); assert(!words(render()).includes('Synthetic a'));
  calls[3].resolve(response(batch(2, 3, [item('stale')]))); await tick(); assert(!words(render()).includes('Synthetic stale')); finish();
});

test('cross-page duplicate, changed catalogue and malformed scope invalidate all loaded rows', async () => {
  for (const bad of [batch(2, 2, [item('a')]), batch(2, 2, [item('z')], { selectionTotal: 21 }), batch(2, 2, [item('z')], { scope: 'public' }), batch(2, 2, [item('z')], { catalogRevision: sha('d') }), batch(2, 2, [item('z', 'not-started', { revision: null })])]) {
    begin(); calls[0].resolve(response(batch(1, 2, [item('a')]))); await tick(); calls[1].resolve(response(bad)); await tick();
    assert(words(render()).includes('Scan invalidated')); assert.equal(worksheetLinks().length, 0); finish();
  }
});

test('missing or changed context, and unmount during body parse, cannot commit statuses', async () => {
  begin(); calls[0].resolve(response(batch(1, 1, [item('a')]), null)); await tick(); assert(words(render()).includes('Scan invalidated')); finish();
  begin(); calls[0].resolve(response(batch(1, 2, [item('a')]))); await tick(); calls[1].resolve(response(batch(2, 2, [item('b')]), sha('d'))); await tick(); assert(words(render()).includes('Scan invalidated')); finish();
  begin(); let resolveBody; calls[0].resolve({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': context }), json: () => new Promise(resolve => { resolveBody = resolve; }) }); await tick();
  finish(); resolveBody(batch(1, 1, [item('late')])); await tick(); assert(!words(render()).includes('Synthetic late'));
});

test('401, 403 and 409 invalidate loaded rows and require native document reload', async () => {
  for (const code of [401, 403, 409]) {
    begin(); calls[0].resolve(response(batch(1, 2, [item('a')]))); await tick();
    calls[1].resolve({ ok: false, status: code, headers: new Headers() }); await tick();
    assert(words(render()).includes('Scan invalidated'));
    assert(words(render()).includes('access, account context, or source material changed'));
    assert.equal(worksheetLinks().length, 0);
    const before = reloads; button('Reload page').props.onClick(); assert.equal(reloads, before + 1);
    assert.equal(walk(render(), n => n.type === 'button' && words(n).includes('Load all review statuses')).length, 0);
    finish();
  }
});

test('pageCount and cursor changes invalidate rather than displaying partial rows', async () => {
  for (const bad of [batch(2, 3, [item('b')]), batch(2, 2, [item('b')], { nextPage: 3 }), batch(1, 2, [item('b')]), batch(2, 2, [item('b')], { pageCount: 0 })]) {
    begin(); calls[0].resolve(response(batch(1, 2, [item('a')]))); await tick();
    calls[1].resolve(response(bad)); await tick();
    assert(words(render()).includes('Scan invalidated')); assert.equal(worksheetLinks().length, 0); finish();
  }
});

test('late old page body cannot repopulate an invalidated restart', async () => {
  begin(); calls[0].resolve(response(batch(1, 3, [item('old')]))); await tick();
  let resolveBody; calls[1].resolve({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': context }), json: () => new Promise(resolve => { resolveBody = resolve; }) }); await tick();
  button('Restart scan').props.onClick(); assert(calls[1].options.signal.aborted);
  calls[2].resolve({ ok: false, status: 409, headers: new Headers() }); await tick();
  resolveBody(batch(2, 3, [item('late')])); await tick();
  assert(words(render()).includes('Scan invalidated')); assert.equal(worksheetLinks().length, 0); finish();
});

test('filters and bounded row pagination include unavailable only on request', async () => {
  begin(); const rows = Array.from({ length: 29 }, (_, i) => item(`row-${i}`, 'not-started', { area: i % 2 ? 'head-learning' : 'structures' }));
  rows.push(item('missing', 'unavailable', { revision: null, capability: 'inspection-only' }));
  calls[0].resolve(response(batch(1, 1, rows))); await tick();
  assert.equal(worksheetLinks().length, 24); button('Next').props.onClick(); assert.equal(worksheetLinks().length, 5);
  const [search, area, status] = controls(); status.props.onChange({ target: { value: 'unavailable' } });
  assert.equal(worksheetLinks().length, 1); assert(words(render()).includes('Status unavailable'));
  controls()[0].props.onChange({ target: { value: 'row-1' } }); assert.equal(worksheetLinks().length, 0);
  controls()[0].props.onChange({ target: { value: '' } }); controls()[1].props.onChange({ target: { value: 'head-learning' } }); assert.equal(worksheetLinks().length, 0);
  finish();
});

test('other guarded workflows stay in a closed disclosure outside inbox counts', () => {
  slots = []; calls = []; render();
  const disclosure = walk(render(), n => n.type === 'details' && n.props.className === 'clinical-review-inbox-other')[0];
  assert(disclosure); assert.equal(disclosure.props.open, undefined);
  assert(words(disclosure).includes('Other review workflows (not included in these counts)'));
  assert(words(disclosure).includes('Specialist CT-head mask and accepted-boundary sign-off remains separate'));
  const links = walk(disclosure, n => n.type === 'a');
  assert.deepEqual(links.map(link => link.props.href), ['/workspace/atlas-review/anatomy-coverage', '/learn/fracture-review', '/studio/workspace', '/workspace/atlas-review/regional-mri', '/workspace/atlas-review/reference-learning']);
  assert.deepEqual(links.map(link => words(link)), ['Anatomy coverage and gaps · source inventory ↗', 'Fracture examination pilot ↗', 'Course and lecture publishing ↗', 'Regional MRI inspection · corrections and recovery ↗', 'Regional reference teaching · draft catalogue and private corrections ↗']);
  assert(links.every(link => link.props.target === '_blank' && link.props.rel === 'noopener noreferrer'));
  assert.equal(worksheetLinks().length, 0);
  finish();
});

test('inbox area links remain available during automatic loading and preserve an in-flight status scan', async () => {
  begin(); const active = calls[0];
  const areaLinks = () => walk(render(), n => n.type === 'nav' && n.props['aria-label'] === 'Browse clinical review worksheets')
    .flatMap(nav => walk(nav, n => n.type === 'a'));
  const previous = ['/workspace/atlas-review', '/workspace/atlas-review/head-learning', '/workspace/atlas-review/source-comparisons'];
  const expected = ['/workspace/atlas-review', '/workspace/atlas-review/head-learning', '/workspace/atlas-review/regional-guides', '/workspace/atlas-review/source-comparisons', '/workspace/review-candidates'];
  assert.deepEqual(areaLinks().filter(link => !['/workspace/atlas-review/regional-guides','/workspace/review-candidates'].includes(link.props.href)).map(link => link.props.href), previous);
  assert.deepEqual(areaLinks().map(link => link.props.href), expected);
  assert.deepEqual(areaLinks().map(link => words(link)),
    ['3D anatomy & teaching ↗', 'CT/MRI head learning ↗', 'Native MRI guide teaching ↗', 'Held source comparisons ↗', 'Saved inspections · read-only ↗']);
  assert(areaLinks().every(link => link.props.target === '_blank' && link.props.rel === 'noopener noreferrer' &&
    link.props['aria-label'].includes('opens in a new tab') && link.props.onClick === undefined));
  assert.equal(calls.length, 1, 'area discovery must not restart the automatic scan');
  assert.deepEqual(areaLinks().map(link => link.props.href), expected);
  assert.equal(active.options.signal.aborted, false);
  active.resolve(response(batch(1, 1, [item('retained')]))); await tick();
  assert(words(render()).includes('Synthetic retained'));
  assert.deepEqual(areaLinks().map(link => link.props.href), expected);
  assert.equal(calls.length, 1, 'links do not issue requests or change review state');
  assert.equal(active.options.signal.aborted, false);
  finish();
});

test('mount loads once, rerenders do not reload, and effect replay retires the old request', async () => {
  begin(); const first = calls[0];
  render(); render(); assert.equal(calls.length, 1);
  // React strict-mode effect replay preserves hook state but runs cleanup/setup.
  finish();
  const effect = slots.find(slot => slot && Array.isArray(slot.deps));
  assert(effect); slots[slots.indexOf(effect)] = undefined;
  render(); assert(first.options.signal.aborted); assert.equal(calls.length, 2);
  first.resolve(response(batch(1, 1, [item('retired')]))); await tick();
  assert(!words(render()).includes('Synthetic retired'));
  calls[1].resolve(response(batch(1, 1, [item('current')]))); await tick();
  assert(words(render()).includes('Synthetic current'));
  assert.equal(worksheetLinks().length, 1);
  finish();
});


test('ordinary region spacing, punctuation and word order search only the authorized loaded rows', async () => {
  begin();
  calls[0].resolve(response(batch(1, 1, [
    item('brain', 'not-started', {title:'Anterior commissure',scopeLabel:'Whole body · head-neck · nerves · FMA61961 · midline',trackLabel:'Teaching'}),
    item('biceps', 'not-started', {title:'Biceps · long head',scopeLabel:'Whole body · shoulder-arm · muscles · FMA37686 · right'}),
    item('ligament', 'not-started', {title:'Cooper’s ligament',scopeLabel:'Thorax'}),
    item('coeliac', 'not-started', {title:'Coeliac trunk',scopeLabel:'Abdomen'}),
    item('hidden', 'unavailable', {title:'Unavailable head-neck',scopeLabel:'head-neck',revision:null,capability:'inspection-only'}),
    item('approved', 'approval-recorded', {title:'Recorded head-neck',scopeLabel:'head-neck'}),
  ])));
  await tick();
  const search = value => { controls().find(n=>n.type==='input'&&n.props.type==='search').props.onChange({target:{value}}); };
  const titles = () => worksheetLinks().map(n=>n.props['aria-label'].split(', ')[0]);
  const requestCount=calls.length;
  for(const query of ['head neck','head-neck','HEAD—NECK','neck head','head neck teaching','ＦＭＡ ６１９６１','fma61961']){
    search(query);assert.deepEqual(titles(),['Anterior commissure'],query);
  }
  for(const query of ['right biceps','biceps right','shoulder arm biceps']){
    search(query);assert.deepEqual(titles(),['Biceps · long head'],query);
  }
  for(const query of ["cooper's",'Cooper’s','coopers']){
    search(query);assert.deepEqual(titles(),['Cooper’s ligament'],query);
  }
  search('Coélìac');assert.deepEqual(titles(),['Coeliac trunk']);
  for(const query of ['biceps left','FMA9999999','.*[','<script>']){
    search(query);assert.deepEqual(titles(),[],query);
  }
  search('  ');assert.equal(titles().length,4,'Whitespace query restores only the default eligible statuses');
  assert.equal(calls.length,requestCount,'Local search neither broadens the scan nor fetches other contexts');
  finish();
});

test('partial default empty results distinguish loaded statuses from rows needing review', async () => {
  for (const status of ['approval-recorded', 'unavailable']) {
    begin();
    const overrides = status === 'unavailable' ? { revision: null, capability: 'inspection-only' } : {};
    calls[0].resolve(response(batch(1, 2, [item('already-loaded', status, overrides)]))); await tick();
    const tree = render();
    const empty = walk(tree, n => n.props.className === 'clinical-review-inbox-empty')[0];
    assert(words(tree).includes('1 status rows loaded'));
    assert(words(tree).includes('0 loaded review items need attention'));
    assert.equal(words(empty), 'No known review items need attention in the loaded rows yet. This scan is incomplete.');
    assert.equal(worksheetLinks().length, 0);
    assert.equal(calls.length, 2, 'The normal sequential scan continues unchanged');
    assert.equal(calls[1].url, `/api/atlas-review/inbox?page=2&revision=${revision}`);
    assert.equal(calls[1].options.signal.aborted, false);
    finish();
  }
});

test('complete and filtered empty results retain their separate approval and reset guidance', async () => {
  begin(); calls[0].resolve(response(batch(1, 1, [item('recorded', 'approval-recorded')]))); await tick();
  const empty = () => words(walk(render(), n => n.props.className === 'clinical-review-inbox-empty')[0]);
  assert.equal(empty(), 'No known review items need attention in this completed scan. This does not record an approval.');
  const requestCount = calls.length;
  controls().find(n => n.type === 'input' && n.props.type === 'search').props.onChange({ target: { value: 'unmatched search' } });
  assert.equal(empty(), 'No loaded rows match these filters. Use Reset filters to return to known items needing review.');
  assert.equal(calls.length, requestCount, 'Empty-state guidance must not change requests or create decisions');
  finish();
});
