import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type {PluginBuild} from 'esbuild';
import type {ComponentType} from 'react';
import type {CoverageRegion,CoverageView} from '../lib/anatomy-coverage-view';

const websiteRequire = createRequire(import.meta.url);
const { build } = websiteRequire('esbuild');
const React = websiteRequire('react');
const { renderToStaticMarkup } = websiteRequire('react-dom/server');

const componentPath = fileURLToPath(new URL('../components/AnatomyCoverageReview.tsx', import.meta.url));
const dtoPath = fileURLToPath(new URL('../lib/anatomy-coverage-view.ts', import.meta.url));
const built = await build({
  entryPoints: [componentPath], bundle: true, write: false, format: 'cjs', platform: 'node',
  jsx: 'automatic', packages: 'external', loader: { '.css': 'empty' },
  plugins: [{ name: 'staged-dto', setup(api:PluginBuild) {
    api.onResolve({ filter: /^\.\.\/lib\/anatomy-coverage-view$/ }, () => ({ path: dtoPath }));
  } }],
});
const moduleOutput = { exports: {} as {AnatomyCoverageReview:ComponentType<{view:CoverageView;region:CoverageRegion|null}>} };
new Function('require', 'module', 'exports', built.outputFiles[0].text)(websiteRequire, moduleOutput, moduleOutput.exports);
const { AnatomyCoverageReview } = moduleOutput.exports;

const view:CoverageView = {
  sourceRevision: '0123456789abcdef0123456789abcdef01234567',
  inventoryRevision: 'a'.repeat(64),
  counts: { root: 10, nested: 20, specimenViews: 3, specimenMemberships: 30, specimenSelections: 25, shoulder: 4 },
  targets: [
    { id: 'nerve', label: 'Peripheral nerves', state: 'missing', regions: ['shoulder-arm'], reason: 'No source-bound geometry.' },
    { id: 'cord', label: 'Spinal cord tissue', state: 'held', regions: ['spine'], reason: 'Source identity requires adjudication.' },
    { id: 'brain', label: 'Nervous-system coverage', state: 'partial', regions: ['head-neck'], reason: 'Selected landmarks are present.' },
    { id: 'lymph', label: 'Lymphatic curriculum', state: 'not-yet-inventoried', regions: ['thorax'], reason: 'Curriculum is not inventoried.' },
  ],
  reference: { files: 100, differences: 40, nested: 2, corrected: 1, held: 7, unsupported: 30 },
};
const render = (region:CoverageRegion|null = null, fixture = view) => renderToStaticMarkup(React.createElement(AnatomyCoverageReview, { view: fixture, region }));

test('renders the desktop inventory structure as accessible server markup', () => {
  const html = render();
  assert.match(html, /<main class="anatomy-coverage-review">/);
  assert.match(html, /<h1>Anatomy coverage and gaps<\/h1>/);
  assert.match(html, /href="\/workspace\/clinical-review-inbox"/);
  assert.match(html, /<section aria-labelledby="coverage-counts-heading"/);
  assert.match(html, /<section aria-labelledby="coverage-targets-heading"/);
  assert.match(html, /<details class="anatomy-coverage-review-backlog/);
  assert.match(html, /<details class="anatomy-coverage-review-snapshot/);
  assert.match(html, /not an exhaustive curriculum/);
  assert.match(html, /does not establish clinical approval or patient-space registration/);
});

test('native GET filter has one labelled region select, all eleven values, and selected state', () => {
  const html = render('spine');
  assert.match(html, /<form[^>]*action="\/workspace\/atlas-review\/anatomy-coverage"[^>]*method="get"/);
  assert.match(html, /<label for="coverage-region">Filter documented targets by region<\/label>/);
  assert.match(html, /<select id="coverage-region" name="region"/);
  assert.match(html, /<option value="">All regions<\/option>/);
  for (const value of ['head-neck','spine','thorax','abdomen','pelvis','shoulder-arm','forearm','hand','thigh','leg','foot']) {
    assert.match(html, new RegExp(`<option value="${value}"`));
  }
  assert.equal((html.match(/<option value=/g) ?? []).length, 12);
  assert.match(html, /<option value="spine" selected="">Spine<\/option>/);
  assert.match(html, /<button type="submit">Apply filter<\/button>/);
  assert(html.indexOf('Inventoried scopes · all regions')<html.indexOf('<form'));
  assert(html.indexOf('Documented targets')<html.indexOf('<form'));
});

test('filters documented targets and has a truthful zero-match state', () => {
  const spine = render('spine');
  assert.match(spine, /Spinal cord tissue/);
  assert.doesNotMatch(spine, /Peripheral nerves|Lymphatic curriculum/);
  const empty = render('foot');
  assert.match(empty, /No documented targets match this region in this snapshot/);
  assert.match(empty, /does not establish complete coverage/);
  assert.doesNotMatch(empty, /<li>/);
});

test('keeps overlapping units and reference file counts separate from anatomy totals', () => {
  const html = render();
  for (const label of ['Root representations','Nested selections','Independent specimen views','Dedicated shoulder selections']) assert.match(html, new RegExp(label));
  assert.match(html, /distinct, overlapping units across separate scopes/);
  assert.match(html, /cannot be added into a unique anatomy total or a completion percentage/);
  assert.doesNotMatch(html, />37<|37 unique|37 total/);
  assert.match(html, /Reference backlog · separate file inventory/);
  assert.match(html, /file and difference counts, not missing structure counts/);
  assert.match(html, /Original OBJ bytes were not revalidated/);
});

test('shows explicit states and provenance without decision controls or unsupported links', () => {
  const html = render();
  for (const label of ['Missing','Held','Partial','Not inventoried']) assert.match(html, new RegExp(`>${label}<`));
  assert.equal((html.match(/<details/g) ?? []).length, view.targets.length + 3);
  assert.match(html, /Snapshot provenance/);
  assert.match(html, /Inventory snapshot SHA-256/);
  assert.equal((html.match(/<button/g) ?? []).length, 1);
  assert.equal((html.match(/href=/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<input|<textarea|method="post"|\/nerve-model/);
});
