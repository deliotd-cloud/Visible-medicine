import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build as sourceBuild } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = await sourceBuild({
  stdin: { contents: `
    export * from './lib/review-change-summary';
    export { bodyReviewContext } from './lib/body-review-context';
    export { bodyReviewSummaries } from './lib/body-review-material';
    export { nestedReviewRows, nestedReviewMaterial } from './lib/nested-review-material';
    export { specimenReviewRows, specimenReviewMaterial } from './lib/specimen-review-material';
    export { bodyReviewStale, bodyDecisionLabel } from './lib/body-review-decisions';
    export { nestedReviewStale, nestedDecisionLabel } from './lib/nested-review';
    export { specimenReviewStale, specimenDecisionLabel } from './lib/specimen-review';
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(source.outputFiles[0].text).toString('base64'));
const component = await componentBuild({
  stdin: { contents: "export { ReviewChangeNotice } from './app/review/review-change-notice';",
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs',
});
const scope = { exports: {} };
runInNewContext(component.outputFiles[0].text, {
  module: scope, exports: scope.exports,
  require(name) { return require(name); },
});
const ReviewChangeNotice = scope.exports.ReviewChangeNotice;
const clone = value => structuredClone(value);
const changedHash = hash => (hash[0] === 'a' ? 'b' : 'a') + hash.slice(1);
const states = summary => Object.fromEntries(summary.comparisons.map(c => [c.key, c.state]));
const secret = 'PRIVATE-REVIEW-TEXT-DO-NOT-RENDER';

function saved(scopeName, context, track = 'geometry') {
  return {
    eventSchema: `vm-${scopeName}-review-event-1`,
    catalogScope: context.catalogScope,
    structureId: context.structureId,
    ...(scopeName === 'nested' ? { nestedKey: context.nestedKey, sourceFrame: context.sourceFrame } : {}),
    ...(scopeName === 'specimen' ? { specimenKey: context.specimenKey, sourceFrame: context.sourceFrame } : {}),
    track, version: 1, savedAt: '2026-10-14T00:00:00.000Z', reviewedAt: null,
    revisionHash: context.revisions[track], checklistVersion: context.checklistVersion,
    checklist: clone(context.checklists[track]),
    material: Object.fromEntries(['sourceHash', 'teachingHash', 'rendererHash', 'materialHash', 'teachingTabs']
      .map(key => [key, clone(context[key])])),
    status: 'draft', reviewer: secret, qualification: '', scope: '', notes: secret,
    checks: Object.fromEntries(context.checklists[track].map(c => [c.id, false])),
    evidence: [], issues: [], attested: false,
  };
}

const body = await api.bodyReviewContext(api.bodyReviewSummaries[0].id);
const nestedRow = api.nestedReviewRows.find(row => row.surfaces.length);
const nestedPacket = await api.nestedReviewMaterial(nestedRow.key, nestedRow.surfaces[0].id);
const nested = nestedPacket?.context;
const specimenRow = api.specimenReviewRows.find(row => row.surfaces.length);
const specimenPacket = await api.specimenReviewMaterial(specimenRow.key, specimenRow.surfaces[0].id);
const specimen = specimenPacket?.context;
assert(body && nested && specimen, 'All fixtures must be admitted current source contexts');
const cases = [
  ['body', body, api.bodyReviewChanges, api.bodyReviewStale, api.bodyDecisionLabel],
  ['nested', nested, api.nestedReviewChanges, api.nestedReviewStale, api.nestedDecisionLabel],
  ['specimen', specimen, api.specimenReviewChanges, api.specimenReviewStale, api.specimenDecisionLabel],
];

for (const [name, context, explain, stale, label] of cases) {
  test(`${name}: absent/current records and teaching renderer-only changes stay quiet`, () => {
    for (const track of ['geometry', 'teaching']) {
      assert.equal(explain(undefined, context, track), null);
      const record = saved(name, context, track);
      assert.equal(explain(record, context, track), null);
      assert.equal(stale(record, context), false);
      const renderer = clone(record);
      renderer.material.rendererHash = changedHash(context.rendererHash);
      assert.equal(explain(renderer, context, track), null,
        'A current revision must not acquire a spurious review notice');
      assert.equal(stale(renderer, context), false);
    }
  });

  test(`${name}: stale geometry identifies renderer without claiming changed source`, () => {
    const record = saved(name, context);
    record.revisionHash = changedHash(record.revisionHash);
    record.material.rendererHash = changedHash(context.rendererHash);
    const result = explain(record, context, 'geometry');
    assert(result && result.headline && result.explanation);
    assert.equal(states(result).source, 'same');
    assert.equal(states(result).teaching, 'same');
    assert.equal(states(result).renderer, 'changed');
    assert.match(JSON.stringify(result).toLowerCase(), /view|render/);
    assert.doesNotMatch(JSON.stringify(result).toLowerCase(), /anatomy (has |was )?changed/);
    assert.equal(stale(record, context), true);
    assert.equal(label(record, context), 'Re-review required');
  });

  test(`${name}: source, teaching, checklist and material changes are separated`, () => {
    for (const key of ['sourceHash', 'teachingHash', 'materialHash']) {
      const record = saved(name, context, 'teaching');
      record.revisionHash = changedHash(record.revisionHash);
      record.material[key] = changedHash(record.material[key]);
      const result = explain(record, context, 'teaching');
      assert(result, `${key} must be explained`);
      assert.equal(states(result)[key.replace('Hash', '')], 'changed');
    }
    const record = saved(name, context);
    record.revisionHash = changedHash(record.revisionHash);
    record.checklist[0].label += ' Previous wording';
    assert.equal(states(explain(record, context, 'geometry')).checklist, 'changed');
    const version = saved(name, context);
    version.checklistVersion += '-old';
    assert.equal(states(explain(version, context, 'geometry')).checklist, 'changed');
  });

  test(`${name}: unavailable current revision and foreign or malformed records disclose no private metadata`, () => {
    const record = saved(name, context);
    const unavailable = clone(context);
    unavailable.revisions.geometry = null;
    const missing = explain(record, unavailable, 'geometry');
    assert(missing);
    assert(Object.values(states(missing)).includes('unavailable'));
    const mutations = [
      { catalogScope: 'foreign-scope' }, { structureId: 'foreign-id' },
      { track: 'teaching' }, { eventSchema: 'foreign-schema' },
      { material: { sourceHash: secret } }, { checklist: 'bad-checklist' },
      ...(name === 'body' ? [] : [
        { [name === 'nested' ? 'nestedKey' : 'specimenKey']: 'foreign-key' },
        { sourceFrame: 'foreign-frame' },
      ]),
    ];
    for (const patch of mutations) {
      const foreign = { ...clone(record), ...patch };
      const result = explain(foreign, context, 'geometry');
      assert(result, JSON.stringify(patch));
      assert.match(result.headline.toLowerCase(), /cannot be compared/, JSON.stringify(patch));
      assert.equal(result.comparisons.length, 0, 'Foreign metadata must not receive invented field diagnoses');
      const rendered = JSON.stringify(result);
      for (const forbidden of [secret, context.structureId, context.sourceHash,
        context.teachingHash, context.rendererHash, context.materialHash]) {
        assert(!rendered.includes(forbidden), 'Private content and identities must not enter the notice');
      }
    }
  });

  test(`${name}: frozen inputs are untouched and no prior approval is inferred`, () => {
    const record = saved(name, context);
    record.revisionHash = changedHash(record.revisionHash);
    const before = JSON.stringify([record, context]);
    const freeze = obj => { if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
      Object.values(obj).forEach(freeze); Object.freeze(obj);
    } return obj; };
    const result = explain(freeze(record), freeze(clone(context)), 'geometry');
    assert(result);
    assert.equal(JSON.stringify([record, context]), before);
    assert(!JSON.stringify(result).includes(secret));
    assert.doesNotMatch(JSON.stringify(result), /approval recorded|prior (teaching|anatomy) content/i);
  });
}

test('actual notice renders as a collapsed, accessible and inert native disclosure', () => {
  const record = saved('body', body);
  record.revisionHash = changedHash(record.revisionHash);
  record.material.sourceHash = changedHash(body.sourceHash);
  const change = api.bodyReviewChanges(record, body, 'geometry');
  assert(change);
  const html = renderToStaticMarkup(React.createElement(ReviewChangeNotice, { change }));
  assert.match(html, /role="note"/);
  assert.match(html, /<details(?:\s|>)/);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.match(html, /<summary/);
  assert.match(html, /<table/);
  assert.doesNotMatch(html, /<(?:button|a|form|iframe)\b/i);
  assert.doesNotMatch(html, /(?:href|onClick|onSubmit|data-fetch)=/i);
  assert(!html.includes(secret));
  const hostile = { headline: '<script>alert(1)</script>', explanation: '&private',
    comparisons: [{ key: 'source', label: '<img src=x>', state: 'changed' }] };
  const escaped = renderToStaticMarkup(React.createElement(ReviewChangeNotice, { change: hostile }));
  assert(!escaped.includes('<script>') && !escaped.includes('<img src=x>'));
  assert(escaped.includes('&lt;script&gt;') && escaped.includes('&lt;img src=x&gt;'));
});

// Render the real editor functions with their already-loaded state. Network effects
// are intentionally inert here; the existing client parsers protect that boundary.
const editors = await componentBuild({
  stdin: { contents: `
    export { BodyDecisionEditor } from './app/review/body/body-decision-editor';
    export { NestedDecisionEditor } from './app/review/nested/workspace';
    export { SpecimenDecisionEditor } from './app/review/specimens/workspace';
    export { ReviewChangeNotice } from './app/review/review-change-notice';
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs',
});
const editorScope = { exports: {} };
let stateSlots = [], stateCursor = 0;
const hooks = {
  ...React,
  useState(initial) {
    const slot = stateCursor++;
    return [Object.hasOwn(stateSlots, slot) ? stateSlots[slot]
      : typeof initial === 'function' ? initial() : initial, () => {}];
  },
  useEffect() {},
  useRef(value) { return { current: value }; },
  useMemo(fn) { return fn(); },
};
runInNewContext(editors.outputFiles[0].text, {
  module: editorScope, exports: editorScope.exports,
  URL, URLSearchParams, AbortController, TextEncoder, crypto: webcrypto, structuredClone,
  require(name) {
    if (name === 'react') return hooks;
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (name === 'next/image') return () => null;
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
function loadedNotice(Component, props, slots) {
  stateSlots = slots; stateCursor = 0;
  const tree = Component(props);
  return walk(tree, node => node.type === editorScope.exports.ReviewChangeNotice)
    .filter(node => node.props.change !== null);
}
test('body editor mounts selected-track notice only from loaded current page and saved record', () => {
  const Component = editorScope.exports.BodyDecisionEditor;
  const props = { id: body.structureId, materialHash: body.materialHash, onDirty() {} };
  const old = saved('body', body); old.revisionHash = changedHash(old.revisionHash);
  const page = { context: body, reviews: [old], history: [old], track: 'geometry', nextBefore: null };
  assert.equal(loadedNotice(Component, props, []).length, 0);
  assert.equal(loadedNotice(Component, props, [page, { geometry: old }, 'geometry']).length, 1);
  const current = saved('body', body);
  assert.equal(loadedNotice(Component, props,
    [{ ...page, reviews: [current] }, { geometry: current }, 'geometry']).length, 0);
  assert.equal(loadedNotice(Component, props, [page, { geometry: old }, 'teaching']).length, 0);
  assert.equal(loadedNotice(Component, props, [{ ...page, reviews: [] }, { geometry: old }, 'geometry']).length, 0);
  assert.equal(loadedNotice(Component, props, [{ ...page, reviews: [{ ...old, structureId: 'foreign' }] }, { geometry: old }, 'geometry']).length, 1);
  // A foreign record may produce a generic unavailable notice, never its contents.
  const foreign = loadedNotice(Component, props,
    [{ ...page, reviews: [{ ...old, structureId: 'foreign' }] }, { geometry: old }, 'geometry'])[0];
  assert(!JSON.stringify(foreign.props).includes(secret));
});

for (const [name, packet, context, Component] of [
  ['nested', nestedPacket, nested, editorScope.exports.NestedDecisionEditor],
  ['specimen', specimenPacket, specimen, editorScope.exports.SpecimenDecisionEditor],
]) {
  test(`${name} editor mounts notice only from loaded selected-track history`, () => {
    const props = { packet, track: 'geometry', onDirty() {} };
    const old = saved(name, context); old.revisionHash = changedHash(old.revisionHash);
    assert.equal(loadedNotice(Component, props, []).length, 0);
    assert.equal(loadedNotice(Component, props, [, { history: [old], nextBefore: null }]).length, 1);
    const current = saved(name, context);
    assert.equal(loadedNotice(Component, props, [, { history: [current], nextBefore: null }]).length, 0);
    assert.equal(loadedNotice(Component, props, [, { history: [], nextBefore: null }]).length, 0);
    const foreign = { ...old, structureId: 'foreign' };
    const notice = loadedNotice(Component, props, [, { history: [foreign], nextBefore: null }]);
    assert.equal(notice.length, 1);
    assert(!JSON.stringify(notice[0].props).includes(secret));
    const wrongTrack = loadedNotice(Component, { ...props, track: 'teaching' },
      [, { history: [old], nextBefore: null }]);
    assert.equal(wrongTrack.length, 1);
    assert.match(wrongTrack[0].props.change.headline.toLowerCase(), /cannot be compared/);
  });
}
