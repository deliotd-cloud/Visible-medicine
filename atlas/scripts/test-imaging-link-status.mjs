import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

// Compile the actual component; the shared builder treats its CSS as empty and
// leaves the installed React runtime external for server rendering.
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const built = await build({
  stdin: {
    contents: "export { ImagingLink } from './app/imaging-link';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const module = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module,
  exports: module.exports,
  require,
});
const { ImagingLink } = module.exports;

const candidate = {
  id: 'vm:anatomy:test-candidate',
  name: 'Test anatomy candidate',
  sources: [],
  reference: {
    frame: 'test-reference',
    kind: 'surface-bounds-centre',
    point: [0, 0, 0],
  },
};
const adapter = { id: 'test-viewer', label: 'Didanix Education', modality: 'MRI' };
const fixture = (overrides = {}) => ({
  enabled: false,
  adapter: null,
  notice: '',
  choice: { status: 'choice-required', mapping: 'components', candidates: [candidate] },
  disabled: false,
  publish() {},
  choose() {},
  setEnabled() {},
  clearChoice() {},
  allowedIds: [candidate.id],
  ...overrides,
});
const render = (overrides) =>
  renderToStaticMarkup(React.createElement(ImagingLink, { link: fixture(overrides) }));
const summary = (html) => html.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? '';
const checkbox = (html) => html.match(/<input\b[^>]*type="checkbox"[^>]*\/?>(?:<\/input>)?/)?.[0] ?? '';
const assertBoundary = (html) => {
  assert.match(html, /Selection only/);
  assert.match(html, /no patient registration/i);
  assert.match(html, /not patient coordinates/i);
  assert.match(html, /No scans are included/i);
  assert.doesNotMatch(html, /\b(?:study|scan) loaded\b|\bpatient registered\b|\bregistration complete\b/i);
  const content = html.match(/<div class="vm-imaging-content">([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.match(content, /website/i);
  assert.match(content, /CT/i);
  assert.match(content, /MRI/i);
  assert.match(content, /comparison/i);
  assert.match(content, /separate links/i);
};

const absent = render();
const semanticOnly = renderToStaticMarkup(React.createElement(ImagingLink, {
  link: fixture(), coordinateContext: 'none',
}));
assert.match(semanticOnly, /structure identities only; it has no coordinate mapping/);
assert.match(semanticOnly, /no patient registration/);
assert.doesNotMatch(semanticOnly, /assembled source-model millimetres/);
assert.match(summary(absent), /Didanix live link/);
assert.match(summary(absent), /No live viewer/);
assert.match(checkbox(absent), /disabled=""/);
assert.doesNotMatch(absent, /<button\b/);
assertBoundary(absent);

const paused = render({ adapter });
assert.match(summary(paused), /Didanix live link/);
assert.match(summary(paused), /Selection paused/);
assert.doesNotMatch(checkbox(paused), /disabled=""/);
assert.match(paused, /adapter registered/);
assert.match(paused, /does not verify that a study is loaded/);
assert.doesNotMatch(paused, /<button\b/);
assertBoundary(paused);

const active = render({ adapter, enabled: true });
assert.match(summary(active), /Didanix live link/);
assert.match(summary(active), /Selection linked/);
assert.match(checkbox(active), /checked=""/);
assert.doesNotMatch(checkbox(active), /disabled=""/);
assert.match(active, /<button\b[^>]*>Test anatomy candidate<\/button>/);
assert.match(active, /<button\b[^>]*>Dismiss choice<\/button>/);
assertBoundary(active);

const assessment = render({ adapter, enabled: true, disabled: true });
assert.match(summary(assessment), /Didanix live link/);
assert.match(summary(assessment), /Selection paused/);
assert.match(checkbox(assessment), /checked=""/);
assert.match(checkbox(assessment), /disabled=""/);
assert.match(assessment, /Linked selection is paused in this view/);
assert.doesNotMatch(assessment, /<button\b/);
assertBoundary(assessment);

console.log(JSON.stringify({
  passed: true,
  productionComponent: true,
  states: ['no adapter', 'registered paused', 'enabled active', 'disabled assessment'],
  serverRendered: true,
}));
