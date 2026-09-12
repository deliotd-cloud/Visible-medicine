import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const compiled = await build({
  stdin: { contents: `export * from './lib/independent-specimen.ts';
    export { limbDefinitions } from './lib/um-limb-studies.ts';
    export { abdominalWallDefinition } from './lib/abdominal-wall.ts';
    export { hraPelvisDefinition } from './lib/hra-pelvis.ts';
    export { backLayersDefinition } from './lib/back-layers.ts';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const definitions = [...Object.values(api.limbDefinitions), api.abdominalWallDefinition, api.hraPelvisDefinition, api.backLayersDefinition];
let checks = 0;
const same = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const ok = (condition) => { assert.ok(condition); checks++; };
const ids = (definition, query) => api.filterSpecimen(definition, query).map(s => s.id);
const snapshots = definitions.map(def => JSON.stringify(def));
for (const def of definitions) {
  const before = api.initialSpecimen(def);
  same(ids(def, '  '), def.surfaces.map(s => s.id));
  same(ids(def, '---'), []);
  same(ids(def, 'not-in-this-specimen'), []);
  const empty = api.filterSpecimen(def, ''); empty.pop();
  same(def.surfaces.length, JSON.parse(snapshots[definitions.indexOf(def)]).surfaces.length);
  for (const surface of def.surfaces) {
    ok(ids(def, surface.name).includes(surface.id));
    ok(ids(def, surface.sourceName).includes(surface.id));
    ok(ids(def, surface.id).includes(surface.id));
    ok(ids(def, `${surface.laterality} ${surface.tissue}`).includes(surface.id));
    if (surface.fmaId) {
      ok(ids(def, surface.fmaId).includes(surface.id));
      same(ids(def, surface.fmaId.replace('FMA', 'fma: ')), ids(def, surface.fmaId));
    }
  }
  // Searching neither changes the dissection nor imports a candidate from another source.
  same(api.initialSpecimen(def), before);
  same(JSON.stringify(def), snapshots[definitions.indexOf(def)]);
}
const back = api.backLayersDefinition;
const left = back.surfaces.find(s => s.fmaId === 'FMA22879');
same(ids(back, 'left multifidus'), [left.id]);
same(ids(back, '  MULTIFÍDUS — LEFT  '), [left.id]);
same(ids(back, 'fma # 22879'), [left.id]);
same(ids(back, 'FMA22879 right'), []);
same(ids(back, 'FMA2287'), []);
same(ids(back, 'FMA1335'), []);
same(ids(api.limbDefinitions.knee, 'FMA22879'), []);
same(ids(back, 'multifidus right left'), []);
const unmapped = { ...back, surfaces: [{ ...left, fmaId: null }] };
same(ids(unmapped, 'FMA22879'), []); // Even when a local ID contains those digits.
const state = api.initialSpecimen(back);
const hidden = api.reduceSpecimen(back, state, { type: 'visibility', id: left.id, visible: false });
same(api.filterSpecimen(back, 'left multifidus')[0].id, left.id);
same(hidden.hidden.includes(left.id), true);
const selected = api.reduceSpecimen(back, hidden, { type: 'select', id: left.id });
same(selected.selectedId, left.id);
same(selected.hidden.includes(left.id), false);
same(api.reduceSpecimen(back, selected, { type: 'undo' }).hidden, hidden.hidden);

// Actual React markup and component callbacks; no browser, GPU or physical focus claim.
const ui = await componentBuild({
  entryPoints: ['app/specimen-structure-search.tsx'], bundle: true, write: false,
  platform: 'node', format: 'cjs',
});
const require = createRequire(import.meta.url);
const React = require('react'), runtime = require('react/jsx-runtime');
let controls = {};
const wrap = fn => (type, props, ...rest) => {
  if (type?.name === 'Input') controls.input = props;
  if (type?.name === 'Button' && props.children === 'Clear search') controls.clear = props;
  if (type?.name === 'Button' && props.children === left.name) controls.select = props;
  if (type?.name === 'Switch' && props['aria-label'] === `Show ${left.name}`) controls.visibility = props;
  return fn(type, props, ...rest);
};
const mod = { exports: {} };
runInNewContext(ui.outputFiles[0].text, {
  module: mod, exports: mod.exports,
  require: id => id === 'react/jsx-runtime' ? { ...runtime, jsx: wrap(runtime.jsx), jsxs: wrap(runtime.jsxs) } : require(id),
  console, process: { env: { NODE_ENV: 'test' } },
});
let queryChanged, selectedChanged, visibilityChanged, focused = false;
const props = { specimen: back, query: 'left multifidus', selectedId: null, hidden: [left.id],
  onQueryChange: value => { queryChanged = value; },
  onSelect: value => { selectedChanged = value; },
  onVisibility: (id, visible) => { visibilityChanged = [id, visible]; },
};
const render = overrides => {
  controls = {};
  return require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.SpecimenStructureSearch, { ...props, ...overrides }));
};
let html = render({});
ok(html.includes('1 of 48 structures') && html.includes('1 hidden'));
ok(html.includes('aria-live="polite"') && html.includes('aria-describedby='));
same((html.match(/<li>/g) ?? []).length, 1);
controls.input.onChange({ target: { value: 'FMA22879' } }); same(queryChanged, 'FMA22879');
controls.select.onClick(); same(selectedChanged, left.id);
controls.visibility.onCheckedChange(true); same(visibilityChanged, [left.id, true]);
controls.input.ref.current = { focus() { focused = true; } };
controls.clear.onClick(); same(queryChanged, ''); same(focused, true);
html = render({ query: '' });
same((html.match(/<li>/g) ?? []).length, 48);
same(html.includes('Clear search'), false);
html = render({ query: 'FMA2287' });
ok(html.includes('No matching tissue in this specimen'));
same((html.match(/<li>/g) ?? []).length, 0);
same(JSON.stringify(back), snapshots.at(-1));
console.log(JSON.stringify({ checks, specimenScopes: definitions.length, sourceGeometryChanged: false, browserOrClinicalAcceptance: false }));
