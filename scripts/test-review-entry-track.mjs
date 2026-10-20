import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: `export { default as shoulder } from './app/review/page';
export { default as body } from './app/review/body/page';
export { default as specimens } from './app/review/specimens/page';
export { ReviewDashboard } from './app/review/review-dashboard';
export { BodyDecisionEditor } from './app/review/body/body-decision-editor';
export { SpecimenReviewWorkspace } from './app/review/specimens/workspace';
export { reviewEntryTrack } from './lib/review-entry-track';
export { nestedReviewNavigationTrack } from './lib/nested-review-queue';`,
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs',
});
const realRequire = createRequire(import.meta.url);
const React = realRequire('react');
const { renderToStaticMarkup } = realRequire('react-dom/server');
let initialStates = [];
const hookedReact = { ...React, useState(initial) {
  initialStates.push(typeof initial === 'function' ? initial() : initial);
  return React.useState(initial);
} };
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope, exports: scope.exports,
  require: id => {
    if (id === 'react') return hookedReact;
    if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (id === 'next/image') return ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props);
    return realRequire(id);
  },
  URL, URLSearchParams, AbortController, setTimeout, clearTimeout,
  console, structuredClone,
});
const api = scope.exports;
for (const value of [undefined, null, 'geometry', 'imaging', 'unknown', ['teaching'], ['geometry'], {}]) {
  assert.equal(api.reviewEntryTrack(value), 'geometry');
  assert.equal(api.reviewEntryTrack(value), api.nestedReviewNavigationTrack(value));
}
assert.equal(api.reviewEntryTrack('teaching'), 'teaching');
assert.equal(api.reviewEntryTrack('teaching'), api.nestedReviewNavigationTrack('teaching'));

const pages = [
  ['shoulder', api.shoulder, 'ReviewDashboard'],
  ['body', api.body, 'BodyReviewDashboard'],
  ['specimens', api.specimens, 'SpecimenReviewWorkspace'],
];
let shoulderId;
for (const [name, page, component] of pages) {
  for (const [query, expected] of [
    [{ t: 'teaching' }, 'teaching'], [{}, 'geometry'],
    [{ t: 'imaging' }, 'geometry'], [{ t: ['teaching'] }, 'geometry'],
  ]) {
    const element = await page({ searchParams: Promise.resolve(query) });
    const target = name === 'specimens' ? element.props.children[1].props.children[2] : element;
    assert.equal(target.type.name, component, `${name} compiled page component`);
    assert.equal(target.props.initialTrack, expected, `${name} query ${JSON.stringify(query)}`);
    if (name === 'shoulder') shoulderId = target.props.initialId;
  }
}

function renderedTrack(component, props, slot, expected) {
  initialStates = [];
  renderToStaticMarkup(React.createElement(component, props));
  assert.equal(initialStates[slot], expected, `compiled ${component.name} track state`);
}
for (const track of ['geometry', 'teaching']) {
  renderedTrack(api.ReviewDashboard, { initialId: shoulderId, initialTrack: track }, 1, track);
  renderedTrack(api.BodyDecisionEditor,
    { id: 'sample', materialHash: 'sample', initialTrack: track, onDirty() {} }, 2, track);
  // An unselected specimen still renders the real selector and track state.
  renderedTrack(api.SpecimenReviewWorkspace,
    { rows: [{ key: 'sample', surfaces: [] }], packet: null, invalid: false, initialTrack: track }, 3, track);
}
console.log('review entry tracks: 3 compiled pages, 3 initial components, nested preference parity, invalid fallbacks passed');
