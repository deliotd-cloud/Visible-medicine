import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  stdin: {
    contents: `export { bodyDisplayCatalog } from './lib/body-display-catalog';
      export { nestedStudyTargets } from './lib/nested-anatomy';
      export { nestedReviewHref } from './lib/nested-review-links';
      export { NestedTeaching } from './app/nested-teaching';
      export { EyeLayerView } from './app/eye-layers';
      export { VentricularView } from './app/ventricles';
      export { FemoralComponentView } from './app/femoral-components';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [{
    name: 'gpu-only-fixture',
    setup(builder) {
      builder.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
        contents: 'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',
        loader: 'tsx',
      }));
    },
  }],
});
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  URLSearchParams,
  module,
  exports: module.exports,
  console,
  window: { innerWidth: 1280, innerHeight: 720 },
  process: { env: { NODE_ENV: 'test' } },
  require: (id) => id === 'next/link' ? () => null : require(id),
});
const api = module.exports;
const catalog = api.bodyDisplayCatalog(
  JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8')),
);
const targets = api.nestedStudyTargets(catalog);
let checked = 0;
for (const study of ['cardiac', 'eye', 'femoral-components']) {
  const target = targets.find((entry) => {
    if (entry.study !== study) return false;
    const parent = catalog.structures.find((structure) => structure.id === entry.parentId);
    return parent && api.nestedReviewHref(parent, study, entry.structure);
  });
  assert(target, `Source-bound ${study} review target`);
  const parent = catalog.structures.find((structure) => structure.id === target.parentId);
  const href = api.nestedReviewHref(parent, study, target.structure);
  const props = { parent, study, selected: target.structure };
  const standalone = renderToStaticMarkup(React.createElement(api.NestedTeaching, props));
  const contained = renderToStaticMarkup(
    React.createElement(api.NestedTeaching, { ...props, reviewAvailable: false }),
  );
  assert(standalone.includes(`href="${href.replaceAll('&', '&amp;')}"`), `${study} standalone exact review link`);
  assert(standalone.includes('Review this structure'), `${study} standalone review action`);
  assert(!contained.includes('/review/nested'), `${study} contained review route suppressed`);
  assert(!contained.includes('Review this structure'), `${study} contained review action suppressed`);
  for (const html of [standalone, contained]) {
    assert(html.includes('Learn more'), `${study} teaching retained`);
    assert(html.includes('Self-check'), `${study} self-check retained`);
  }
  checked++;
}
let viewerChecks = 0;
for (const study of ['coronary-venous', 'cardiac', 'eye', 'femoral-components', 'cranial-artery-components']) {
  const target = targets.find((entry) => {
    if (entry.study !== study) return false;
    const parent = catalog.structures.find((structure) => structure.id === entry.parentId);
    return parent && api.nestedReviewHref(parent, study, entry.structure);
  });
  assert(target, `Source-bound ${study} viewer target`);
  const parent = catalog.structures.find((structure) => structure.id === target.parentId);
  const href = api.nestedReviewHref(parent, study, target.structure);
  const View = study === 'eye'
    ? api.EyeLayerView
    : study === 'femoral-components' || study === 'cranial-artery-components'
      ? api.FemoralComponentView
      : api.VentricularView;
  const props = { parent, study, initialSelectedId: target.structureId };
  const standalone = renderToStaticMarkup(React.createElement(View, props));
  const contained = renderToStaticMarkup(
    React.createElement(View, { ...props, assetBase: '/atlas-runtime/head-neck' }),
  );
  assert(standalone.includes(`href="${href.replaceAll('&', '&amp;')}"`), `${study} viewer standalone exact review link`);
  assert(!contained.includes('/review/nested'), `${study} viewer contained review route suppressed`);
  assert(!contained.includes('Review this structure'), `${study} viewer contained review action suppressed`);
  viewerChecks++;
}
console.log(JSON.stringify({ teachingStudies: checked, viewerStudies: viewerChecks, standaloneExactLinks: checked + viewerChecks, containedSuppressed: checked + viewerChecks }));
