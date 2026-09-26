/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component hooks */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url), React = require('react');
let states, refs, cursor, refCursor, effects, requests, firstRender;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
  useRef(initial) { const i = refCursor++; return refs[i] ??= { current: initial }; },
  useEffect(fn) { if (firstRender) effects.push(fn); },
};
const compiled = await build({ stdin: { contents: `
  export { NestedDecisionEditor } from './app/review/nested/workspace';
  export { SpecimenDecisionEditor } from './app/review/specimens/workspace';
  export { nestedReviewRows, nestedReviewMaterial } from './lib/nested-review-material';
  export { specimenReviewRows, specimenReviewMaterial } from './lib/specimen-review-material';
  export { blankNestedReview } from './lib/nested-review';
  export { blankSpecimenReview } from './lib/specimen-review';
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'cjs' });
const sandboxModule = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, { module: sandboxModule, exports: sandboxModule.exports,
  AbortController, URLSearchParams, structuredClone, crypto: webcrypto, TextEncoder,
  fetch(url, options) { return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })); },
  require: name => name === 'react' ? shim : require(name),
});
const api = sandboxModule.exports;
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) { if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found)); }
  return found;
};
const text = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const button = (tree, label) => walk(tree, n => typeof n.props.onClick === 'function' && text(n) === label)[0];
const settle = () => new Promise(resolve => setImmediate(resolve));
async function setup(kind) {
  states = []; refs = []; effects = []; requests = []; firstRender = true;
  const group = api[kind + 'ReviewRows'][0];
  const packet = await api[kind + 'ReviewMaterial'](group.key, group.surfaces[0].id);
  const Component = api[kind === 'nested' ? 'NestedDecisionEditor' : 'SpecimenDecisionEditor'];
  const render = () => { cursor = 0; refCursor = 0; return Component({ packet, track: 'geometry', onDirty() {} }); };
  render(); firstRender = false;
  const cleanups = effects.map(fn => fn());
  const c = packet.context;
  const response = (history = []) => ({ ok: true, status: 200, json: async () => ({
    scope: 'private-to-signed-in-user', context: c, track: 'geometry', history,
    nextBefore: history.length === 20 ? history.at(-1).version : null,
  }) });
  const record = version => ({
    ...api[kind === 'nested' ? 'blankNestedReview' : 'blankSpecimenReview'](c, 'geometry'),
    eventSchema: `vm-${kind}-review-event-1`, catalogScope: c.catalogScope,
    ...(kind === 'nested' ? { nestedKey: c.nestedKey } : { specimenKey: c.specimenKey }),
    sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'geometry', version,
    savedAt: '2026-09-26T00:00:00.000Z', reviewedAt: null, revisionHash: c.revisions.geometry,
    checklistVersion: c.checklistVersion, checklist: c.checklists.geometry,
    material: { materialHash: c.materialHash, sourceHash: c.sourceHash, teachingHash: c.teachingHash,
      rendererHash: c.rendererHash, teachingTabs: c.teachingTabs },
    notes: 'Synthetic saved notes ' + version,
  });
  const edit = value => {
    const tree = render();
    assert.equal(walk(tree, n => n.type === 'fieldset')[0].props.disabled, false, 'Editing must actually be enabled');
    walk(tree, n => n.type === 'textarea' && n.props.rows === 3)[0].props.onChange({ target: { value } });
  };
  const notes = () => walk(render(), n => n.type === 'textarea' && n.props.rows === 3)[0].props.value;
  return { render, response, record, edit, notes, cleanup: () => cleanups.forEach(fn => fn?.()) };
}

for (const kind of ['nested', 'specimen']) {
  test(kind + ': late initial history cannot replace edits made after refresh', async () => {
    const h = await setup(kind), initial = requests[0];
    const refresh = button(h.render(), 'Refresh saved history').props.onClick();
    requests[1].resolve(h.response()); await refresh; await settle();
    h.edit('Keep my anatomical correction');
    initial.resolve(h.response()); await settle();
    assert.equal(h.notes(), 'Keep my anatomical correction');
    assert.equal(initial.options.signal.aborted, true);
    h.cleanup();
  });

  test(kind + ': superseded initial errors do not replace a successful refresh', async () => {
    const h = await setup(kind), initial = requests[0];
    const refresh = button(h.render(), 'Refresh saved history').props.onClick();
    requests[1].resolve(h.response()); await refresh;
    initial.reject(new Error('obsolete initial failure')); await settle();
    assert(!text(h.render()).includes('obsolete initial failure'));
    h.cleanup();
  });

  test(kind + ': unmount aborts refresh and ignores its late body', async () => {
    const h = await setup(kind);
    requests[0].resolve(h.response()); await settle();
    const refresh = button(h.render(), 'Refresh saved history').props.onClick();
    let completeBody;
    requests[1].resolve({ ok: true, status: 200, json: () => new Promise(resolve => { completeBody = resolve; }) });
    await settle(); h.cleanup();
    assert.equal(requests[1].options.signal?.aborted, true);
    const before = JSON.stringify(states);
    completeBody(await h.response().json()); await refresh; await settle();
    assert.equal(JSON.stringify(states), before);
  });

  test(kind + ': refresh retains dirty edits and requires explicit reconciliation', async () => {
    const h = await setup(kind);
    requests[0].resolve(h.response()); await settle();
    h.edit('Keep my review notes');
    const refresh = button(h.render(), 'Refresh saved history').props.onClick();
    assert.equal(walk(h.render(), n => n.type === 'fieldset')[0].props.disabled, true);
    requests[1].resolve(h.response()); await refresh;
    assert.equal(h.notes(), 'Keep my review notes');
    assert(button(h.render(), 'Load saved draft after comparing'));
    assert(text(h.render()).includes('Your edits are retained'));
    h.cleanup();
  });

  test(kind + ': failed refresh does not allow an old initial result to enable editing', async () => {
    const h = await setup(kind), initial = requests[0];
    const refresh = button(h.render(), 'Refresh saved history').props.onClick();
    requests[1].reject(new Error('Current refresh failed')); await refresh;
    initial.resolve(h.response()); await settle();
    assert.equal(walk(h.render(), n => n.type === 'fieldset')[0].props.disabled, true);
    assert(text(h.render()).includes('Current refresh failed'));
    const retry = button(h.render(), 'Refresh saved history').props.onClick();
    requests[2].resolve(h.response()); await retry;
    h.edit('Recovered after retry'); assert.equal(h.notes(), 'Recovered after retry');
    h.cleanup();
  });

  test(kind + ': older history reads leave the current draft/version intact and cancel on unmount', async () => {
    const h = await setup(kind);
    requests[0].resolve(h.response(Array.from({ length: 20 }, (_, i) => h.record(40 - i)))); await settle();
    h.edit('Current unsaved correction');
    const older = button(h.render(), 'Older records').props.onClick();
    assert.equal(new URL(requests[1].url, 'https://atlas.test').searchParams.get('before'), '21');
    requests[1].resolve(h.response(Array.from({ length: 20 }, (_, i) => h.record(20 - i)))); await older;
    assert.equal(h.notes(), 'Current unsaved correction');
    assert.equal(states[1].history[0].version, 40, 'Save comparison stays on latest loaded version');
    assert.equal(states[2].history[0].version, 20);
    const last = button(h.render(), 'Older records').props.onClick();
    h.cleanup(); assert.equal(requests[2].options.signal.aborted, true);
    const before = JSON.stringify(states);
    requests[2].resolve(h.response()); await last;
    assert.equal(JSON.stringify(states), before);
  });
}
