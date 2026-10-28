import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const React = require('react');

// Bundle the live source graph, so these expectations follow authored tours and
// current source bindings instead of a historical snapshot of tour metadata.
const projection = await build({ stdin: { contents: `
  export {regionalLearningCatalogue,buildRegionalLearningCatalogue} from './lib/regional-learning-catalogue';
  export {regionalTourMatchesRegion} from './lib/regional-learning-discovery';
  export {atlasBodyRegions} from './lib/atlas-navigation';
  export {regionalTours,regionalTourStructures,quadricepsTour} from './atlas-review/lib/regional-tours';
  import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
  import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
  import review from './atlas-review/manifest.json';
  import learner from './public/atlas-runtime/head-neck/manifest.json';
  import viewer from './public/atlas-review-viewer/manifest.json';
  export const catalog=bodyDisplayCatalog(raw);
  export const binding={reviewRevision:review.revision,learnerRevision:learner.sourceCommit,
    viewerRevision:viewer.sourceCommit,reviewIntegration:review.websiteIntegrationSha256,
    viewerIntegration:viewer.websiteIntegrationSha256};
`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const source = await import('data:text/javascript;base64,' + Buffer.from(projection.outputFiles[0].text).toString('base64'));

test('current 55-tour projection preserves canonical launch and exact authored scope', () => {
  const actual = source.regionalLearningCatalogue();
  assert.equal(actual.available, true);
  assert.equal(actual.unavailableTours, 0);
  assert.equal(source.regionalTours.length, 55);
  assert.equal(actual.tours.length, source.regionalTours.length);
  assert.equal(actual.sourceRevision, source.binding.reviewRevision);
  assert.deepEqual(actual.tours.map(t => t.id), source.regionalTours.map(t => t.id));
  const regions = new Map(source.atlasBodyRegions.map(r => [r.id, r]));
  const permitted = ['id', 'title', 'description', 'revision', 'regionId', 'regionLabel', 'href',
    'limitations', 'steps', 'scopeRegionIds', 'continuousPlaybackMs'];
  for (const [index, projected] of actual.tours.entries()) {
    const authored = source.regionalTours[index];
    const region = regions.get(authored.region);
    assert(region, authored.id);
    assert.equal(projected.regionId, authored.region);
    assert.equal(projected.regionLabel, region.label);
    assert.equal(projected.href, region.href);
    assert.equal(projected.revision, authored.revision);
    assert.equal(projected.title, authored.title);
    assert.equal(projected.description, authored.description);
    assert.deepEqual(projected.scopeRegionIds, authored.scopeRegions?.length ? authored.scopeRegions : undefined);
    assert.deepEqual(projected.steps, authored.steps.map(step => ({
      title: step.title,
      structureName: source.regionalTourStructures(source.catalog, authored).find(s => s.id === step.selectedId)?.name,
    })));
    assert(projected.steps.every(step => typeof step.structureName === 'string' && step.structureName.length));
    assert(Object.keys(projected).every(key => permitted.includes(key)), authored.id);
    assert.deepEqual(Object.keys(projected.steps[0]).sort(), ['structureName', 'title']);
    const url = new URL(projected.href, 'https://example.invalid');
    assert.equal(url.origin, 'https://example.invalid');
    assert(!url.searchParams.has('autoplay'));
    assert(!url.searchParams.has('regionalTour'));
  }
  const quadriceps = actual.tours.find(t => t.id === source.quadricepsTour.id);
  assert(quadriceps);
  assert.deepEqual(quadriceps.scopeRegionIds, source.quadricepsTour.scopeRegions);
  assert.equal(quadriceps.regionId, 'whole-body');
  assert.deepEqual(actual.regions, source.atlasBodyRegions.filter(region =>
    actual.tours.some(tour => source.regionalTourMatchesRegion(tour, region.id)))
    .map(({ id, label }) => ({ id, label })));
  const serial = JSON.stringify(actual);
  for (const field of ['nodeName', 'sources', 'bounds', 'anchor', 'mask', 'positions_file',
    'credential', 'reviewer', 'requiredDisplayBundles', 'contextIds', 'selectedId'])
    assert(!serial.includes('"' + field + '":'), field);
});

test('scope edits are withheld by source identity without changing other projected tours', () => {
  const baseline = source.regionalLearningCatalogue();
  const authored = source.regionalTours.find(t => t.id === source.quadricepsTour.id);
  assert(authored);
  for (const change of [scope => scope.reverse(), scope => scope.push('foot')]) {
    const tours = structuredClone(source.regionalTours);
    change(tours.find(t => t.id === authored.id).scopeRegions);
    const actual = source.buildRegionalLearningCatalogue(source.catalog, tours, source.binding);
    assert.equal(actual.available, true);
    assert.equal(actual.unavailableTours, 1);
    assert.deepEqual(actual.tours, baseline.tours.filter(t => t.id !== authored.id));
  }
});

let slots = [], cursor = 0;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
};
const componentBundle = await build({ stdin: { contents: "export {RegionalLearningCatalogue} from './components/RegionalLearningCatalogue';",
  resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'cjs',
  packages: 'external', loader: { '.css': 'empty' } });
const module = { exports: {} };
runInNewContext(componentBundle.outputFiles[0].text,
  { module, exports: module.exports, URLSearchParams, require: name => name === 'react' ? shim : require(name) });
const { RegionalLearningCatalogue } = module.exports;
const reset = () => { slots = []; cursor = 0; };
const render = (catalogue, props = {}) => { cursor = 0; return RegionalLearningCatalogue({ catalogue, ...props }); };
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) {
  if (predicate(node)) out.push(node);
  React.Children.forEach(node.props.children, child => walk(child, predicate, out));
} return out; };
const nodes = (tree, type) => walk(tree, node => node.type === type);
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' :
  Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const rows = tree => React.Children.toArray(walk(tree, node => node.props?.className === 'regional-learning-catalogue-list')[0]?.props.children);
const count = tree => words(walk(tree, node => node.props?.className === 'regional-learning-catalogue-results')[0]);
const select = (tree, id) => nodes(tree, 'select')[0].props.onChange({ target: { value: id } });
const search = (tree, value) => nodes(tree, 'input')[0].props.onChange({ target: { value } });
const fixture = (id, changes = {}) => ({ id, title: id, description: `Teaching ${id}`, revision: `revision-${id}`,
  regionId: 'whole-body', regionLabel: 'Whole body', href: '/atlas/3d', limitations: 'Draft',
  steps: [{ title: `Step ${id}`, structureName: `Structure ${id}` }], ...changes });
const cross = fixture('cross', { title: 'Cross region tour', scopeRegionIds: ['thigh', 'pelvis', 'leg'],
  steps: [{ title: 'Cross step', structureName: 'Quadriceps' }] });
const legacy = fixture('legacy', { title: 'Legacy whole body' });
const direct = fixture('direct', { title: 'Direct thigh', regionId: 'thigh', regionLabel: 'Hip & thigh',
  href: '/atlas/3d?region=thigh' });
const data = (tours = [cross, legacy, direct]) => ({ available: true, sourceRevision: 'a'.repeat(40),
  unavailableTours: 0, regions: [
    { id: 'whole-body', label: 'Whole body' }, { id: 'thigh', label: 'Hip & thigh' },
    { id: 'pelvis', label: 'Pelvis' }, { id: 'leg', label: 'Knee & leg' }, { id: 'foot', label: 'Ankle & foot' },
  ], tours });

test('scope filters discover one whole-body tour in each authored region and preserve exact paused links', () => {
  for (const region of ['thigh', 'pelvis', 'leg']) {
    reset(); const catalogue = data(); select(render(catalogue), region);
    const tree = render(catalogue), visible = rows(tree);
    assert.equal(visible.filter(row => words(row).includes('Cross region tour')).length, 1);
    assert.equal(visible.some(row => words(row).includes('Legacy whole body')), false);
    assert.match(count(tree), region === 'thigh' ? /^2 matching tours · showing 1–2 of 2/ : /^1 matching tour · showing 1–1 of 1/);
    const row = visible.find(item => words(item).includes('Cross region tour'));
    assert.match(words(row), /Opens in Whole body/);
    const links = nodes(row, 'a');
    assert.equal(links.length, 2);
    for (const link of links) {
      const url = new URL(link.props.href, 'https://example.invalid');
      assert.equal(url.pathname, '/atlas/3d');
      assert.equal(url.searchParams.get('region'), 'whole-body');
      assert.equal(url.searchParams.get('regionalTour'), 'cross');
      assert.equal(url.searchParams.get('tourRevision'), cross.revision);
      assert.equal(url.searchParams.get('tourSource'), catalogue.sourceRevision);
      assert.equal(url.searchParams.has('autoplay'), false);
    }
    assert.equal(new URL(links[0].props.href, 'https://example.invalid').searchParams.has('regionalStep'), false);
    assert.equal(new URL(links[1].props.href, 'https://example.invalid').searchParams.get('regionalStep'), '1');
  }
  reset(); const catalogue = data(); select(render(catalogue), 'foot');
  assert.equal(rows(render(catalogue)).length, 0);
  reset(); select(render(catalogue), 'whole-body');
  assert.deepEqual(rows(render(catalogue)).map(row => words(nodes(row, 'h3')[0])), ['Cross region tour', 'Legacy whole body']);
  reset(); const fixed = render(catalogue, { initialRegion: 'pelvis', fixedRegion: true });
  assert.equal(nodes(fixed, 'select').length, 0);
  assert.equal(rows(fixed).length, 1);
  assert.match(words(rows(fixed)[0]), /Opens in Whole body/);
});

test('search, pagination and a new source retain unique matches and reset stale filters', () => {
  reset(); const catalogue = data([cross, legacy, direct, ...Array.from({ length: 7 }, (_, i) => fixture(`extra-${i}`))]);
  let tree = render(catalogue);
  assert.equal(rows(tree).length, 6);
  assert.match(count(tree), /^10 matching tours · showing 1–6 of 10/);
  nodes(tree, 'button').find(button => words(button) === 'Next').props.onClick();
  tree = render(catalogue);
  assert.equal(rows(tree).length, 4);
  assert.match(count(tree), /^10 matching tours · showing 7–10 of 10/);
  search(tree, 'Quadriceps'); tree = render(catalogue);
  assert.deepEqual(rows(tree).map(row => words(nodes(row, 'h3')[0])), ['Cross region tour']);
  assert.match(count(tree), /^1 matching tour · showing 1–1 of 1/);
  select(tree, 'pelvis'); tree = render(catalogue);
  assert.equal(rows(tree).length, 1);
  const newer = data([fixture('new-tour', { regionId: 'thigh', regionLabel: 'Hip & thigh', href: '/atlas/3d?region=thigh' })]);
  newer.sourceRevision = 'b'.repeat(40);
  tree = render(newer);
  assert.equal(rows(tree).length, 1);
  assert.match(count(tree), /^1 matching tour · showing 1–1 of 1/);
  assert.equal(nodes(tree, 'input')[0].props.value, '');
  assert.equal(nodes(tree, 'select')[0].props.value, 'all');
});
