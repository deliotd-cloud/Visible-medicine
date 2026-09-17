import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
// Match the application's installed Vinext link implementation in this Node
// harness. A fake anchor would not test the actual navigation component.
import * as frameworkLink from 'vinext/shims/link';
const result = await build({
  stdin: {
    contents: `export * from './lib/independent-study-links';export * from './lib/specimen-review-material';export * from './lib/specimen-review';export * from './lib/specimen-review-store';export * from './lib/hra-renal';export * from './lib/hra-pelvis';export * from './lib/back-layers';export * from './lib/abdominal-wall';export * from './lib/um-limb-studies';export * from './lib/um-limb-navigation';export * from './lib/specimen-links';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(result.outputFiles[0].text).toString('base64')
);
const defs = [
  api.hraRenalDefinition,
  api.hraPelvisDefinition,
  api.abdominalWallDefinition,
  api.backLayersDefinition,
];
const dictionary = (url) => {
  const q = new URL(url, 'https://atlas.test').searchParams;
  return Object.fromEntries(
    [...new Set(q.keys())].map((k) => [
      k,
      q.getAll(k).length === 1 ? q.get(k) : q.getAll(k),
    ]),
  );
};
let links = 0,
  studies = 0,
  rejections = 0,
  scopeLinks = 0;
for (const d of defs) {
  for (const study of d.studies) {
    studies++;
    for (const id of study.ids) {
      const href = await api.makeIndependentStudyLink(d, {
        selectedId: id,
        studyId: study.id,
        view: study.view,
      });
      assert(href);
      const parsed = api.parseIndependentStudyLink(dictionary(href)),
        r = await api.resolveIndependentStudyLink(parsed, d);
      assert.equal(r.status, 'ready');
      assert.equal(r.selectedId, id);
      assert.equal(r.focusSelection, true);
      assert.equal(r.structureOnly, false);
      assert.equal(r.state.selectedId, id);
      assert.equal(r.view, study.view);
      assert.equal(r.state.history.length, 0);
      assert.equal(r.state.future.length, 0);
      assert.deepEqual(
        new Set(
          d.surfaces
            .filter((s) => !r.state.hidden.includes(s.id))
            .map((s) => s.id),
        ),
        new Set(study.ids),
      );
      assert.equal(
        new URL(href, 'https://atlas.test').pathname,
        api.independentStudyRoutes.find((x) => x.key === d.key).path,
      );
      links++;
    }
  }
  const id = d.surfaces[0].id,
    href = await api.makeIndependentStudyLink(d, {
      selectedId: id,
      view: 'anterior',
    }),
    parsed = api.parseIndependentStudyLink(dictionary(href));
  const isolated = await api.resolveIndependentStudyLink(parsed, d);
  assert.equal(isolated.structureOnly, true);
  for (const patch of [
    { refSource: '0'.repeat(64) },
    { refRevision: '0'.repeat(64) },
    { refStructure: 'missing' },
    { refStudy: 'missing' },
    { refFrame: 'patient-frame' },
    { refSpecimen: 'other' },
    { refView: 'diagonal' },
    { refSpecimen: [d.key, d.key] },
    { ref: 'bad' },
    { refUnknown: 'bad' },
    { specimen: 'um-limb-1' },
    { structure: id },
    { refStudy: ['all', 'all'] },
  ]) {
    const p = api.parseIndependentStudyLink({ ...dictionary(href), ...patch });
    assert.equal(
      (await api.resolveIndependentStudyLink(p, d)).status,
      'rejected',
    );
    rejections++;
  }
  for (const k of [
    'ref',
    'refSpecimen',
    'refFrame',
    'refStructure',
    'refSource',
    'refRevision',
    'refView',
  ]) {
    const p = dictionary(href);
    delete p[k];
    assert.equal(api.parseIndependentStudyLink(p).status, 'invalid');
    rejections++;
  }
  for (const mutate of [
    (x) => (x.source.version += 'changed'),
    (x) => (x.catalog.bundles[0].sha256 = '0'.repeat(64)),
    (x) => (x.catalog.coordinateSystem.sourceToSceneColumnMajor[0] *= 2),
    (x) => (x.surfaces[0].laterality = 'changed'),
    (x) => x.studies[0].ids.reverse(),
    (x) => (x.initialStudy = 'different'),
    (x) => (x.limitations += 'new limit'),
    (x) => x.omittedFaces++,
  ]) {
    const changed = structuredClone(d);
    mutate(changed);
    assert.equal(
      (await api.resolveIndependentStudyLink(parsed, changed)).status,
      'rejected',
    );
    rejections++;
  }
  const other = defs.find((x) => x.key !== d.key);
  assert.equal(
    (await api.resolveIndependentStudyLink(parsed, other)).status,
    'rejected',
  );
  rejections++;
  assert.equal(
    await api.makeIndependentStudyLink(d, {
      selectedId: 'bad',
      view: 'anterior',
    }),
    null,
  );
  assert.equal(api.parseIndependentStudyLink({}).status, 'none');
}
// Every review worksheet has a round-tripping exact source link, including
// overlapping UM regional contexts; identifiers never confer clinical approval.
const sourceIds = new Set(),
  fingerprints = new Set(),
  byId = new Map();
const specimens = new Map(
  [...defs, ...Object.values(api.limbDefinitions)].map((d) => [d.key, d]),
);
for (const group of api.specimenReviewRows)
  for (const row of group.surfaces) {
    const p = await api.specimenReviewMaterial(group.key, row.id),
      d = specimens.get(group.key);
    assert(p.atlasLink);
    scopeLinks++;
    const r = group.key.startsWith('um-')
      ? api.resolveSpecimenLink(api.parseSpecimenLink(dictionary(p.atlasLink)))
      : await api.resolveIndependentStudyLink(
          api.parseIndependentStudyLink(dictionary(p.atlasLink)),
          d,
        );
    assert.equal(r.status, 'ready');
    assert.equal(r.selectedId, row.id);
    assert.equal(r.state.selectedId, row.id);
    assert.equal(r.focusSelection, true);
    sourceIds.add(row.id);
    fingerprints.add(p.context.materialHash);
    const prior = byId.get(row.id);
    if (prior) {
      assert.notEqual(prior.specimenKey, group.key);
      assert.notEqual(prior.materialHash, p.context.materialHash);
      assert.notEqual(prior.revisions.geometry, p.context.revisions.geometry);
    }
    byId.set(row.id, p.context);
  }
assert.equal(scopeLinks, 354);
assert.equal(sourceIds.size, 267);
assert.equal(fingerprints.size, 354);
// This is the original navigation milestone's preservation claim, not a ban
// on subsequent source-bound teaching/UI work. Compare its two immutable commits;
// all navigation, model hashes and component checks here still use current code.
const navigationBefore='3d3909597ce063f3b928c0fff47a1398c6cb5294';
const navigationMilestone='f82bfdf411a10667a1c3aa5f3efdc05e55051ee8';
const unchanged = [
  'public/models/hra-renal/catalog.json',
  'public/models/hra-renal/kidneys.glb',
  'public/models/hra-pelvis/catalog.json',
  'public/models/hra-pelvis/pelvis.glb',
  'public/models/bodyparts3d-v3/back-layers/catalog.json',
  'public/models/bodyparts3d-v3/back-layers/back-layers.glb',
  'public/models/bodyparts3d-v3/abdominal-wall/catalog.json',
  'public/models/bodyparts3d-v3/abdominal-wall/abdominal-wall.glb',
  'public/models/um-limb/catalog.json',
  'public/models/um-knee/catalog.json',
  'content/hra-renal-teaching.ts',
  'content/hra-renal-clinical.ts',
  'content/hra-pelvic-teaching.ts',
  'content/um-limb-teaching-bindings.v1.json',
  'content/um-limb-navigation.v1.json',
  'content/back-layers-teaching.ts',
  'content/abdominal-wall-teaching.ts',
  'drizzle/0002_specimen_review_events.sql',
  'drizzle/meta/0002_snapshot.json',
  'drizzle/meta/_journal.json',
  'package-lock.json',
];
for (const path of unchanged) {
  const disk = execFileSync('git', ['show', navigationMilestone + ':' + path], { maxBuffer: 25e6 }),
    prior = execFileSync(
      'git',
      ['show', navigationBefore + ':' + path],
      { maxBuffer: 25e6 },
    );
  assert.deepEqual(
    path.endsWith('.glb') ? disk : disk.toString().replaceAll('\r\n', '\n'),
    path.endsWith('.glb') ? prior : prior.toString().replaceAll('\r\n', '\n'),
  );
}
const checkedBundles = new Set();
for (const d of specimens.values())
  for (const b of d.catalog.bundles) {
    if (checkedBundles.has(b.url)) continue;
    checkedBundles.add(b.url);
    const url = new URL(b.url, 'https://atlas.test');
    assert.equal(url.origin, 'https://atlas.test');
    assert(url.pathname.startsWith('/models/'));
    assert.equal(
      createHash('sha256')
        .update(await readFile('public' + url.pathname))
        .digest('hex'),
      b.sha256,
    );
  }
// Exercise actual shared React initialization/scene props. Scene rendering is
// deliberately intercepted: this is not browser or GPU testing.
const component = await componentBuild({
  stdin: {
    contents: `export { KneeSpecimenView } from './app/um-knee-study'; export { IndependentStudyView } from './app/independent-study-navigation'; export {hraRenalSupplement} from './app/hra-renal-study';export {hraPelvisSupplement} from './app/hra-pelvis-study';export {abdominalWallSupplement} from './app/abdominal-wall-study';export {backLayersSupplement} from './app/back-layers-study';export {SpecimenReviewWorkspace} from './app/review/specimens/workspace';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  plugins: [
    {
      name: 'scene-boundary',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          loader: 'js',
          contents:
            'export function BodyScene(props){globalThis.sceneProps=props;return null;} export function retryBodyAssets(){}',
        }));
      },
    },
  ],
});
const require = createRequire(new URL('../package.json', import.meta.url)),
  React = require('react'),
  { renderToStaticMarkup } = require('react-dom/server');
const module = { exports: {} },
  sandbox = {
    module,
    exports: module.exports,
    require: name => name === 'next/link' ? frameworkLink : require(name),
    console,
    URL,
    crypto,
    TextEncoder,
    TextDecoder,
    structuredClone,
    setTimeout,
    clearTimeout,
  };
vm.runInNewContext(component.outputFiles[0].text, sandbox);
const supplements = [
  module.exports.hraRenalSupplement,
  module.exports.hraPelvisSupplement,
  module.exports.abdominalWallSupplement,
  module.exports.backLayersSupplement,
];
let rendered = 0;
for (let index = 0; index < defs.length; index++) {
  const d = defs[index],
    supplement = supplements[index];
  for (const study of d.studies) {
    const href = await api.makeIndependentStudyLink(d, {
        selectedId: study.selectedId,
        studyId: study.id,
        view: study.view,
      }),
      navigation = await api.resolveIndependentStudyLink(
        api.parseIndependentStudyLink(dictionary(href)),
        d,
      );
    const html = renderToStaticMarkup(
      React.createElement(module.exports.KneeSpecimenView, {
        specimen: d,
        supplement,
        initialNavigation: navigation,
      }),
    );
    assert.equal(sandbox.sceneProps.selectedId, study.selectedId);
    assert.equal(sandbox.sceneProps.focus, true);
    assert.equal(sandbox.sceneProps.explode, 0);
    assert.equal(sandbox.sceneProps.isolated, false);
    assert.equal(sandbox.sceneProps.cameraBounds, null);
    assert.match(html, /Link &amp; review this structure/);
    assert(html.includes(encodeURIComponent(study.selectedId)));
    rendered++;
  }
  sandbox.sceneProps = null;
  const href = await api.makeIndependentStudyLink(d, {
    selectedId: d.surfaces[0].id,
    view: 'anterior',
  });
  const loading = renderToStaticMarkup(
    React.createElement(module.exports.IndependentStudyView, {
      definition: d,
      supplement,
      link: api.parseIndependentStudyLink(dictionary(href)),
    }),
  );
  assert.match(loading, /Checking the exact source selection/);
  assert.equal(sandbox.sceneProps, null);
}
const muscle = api.wholeLimbDefinition.surfaces.find(
    (s) => s.slug === 'adductor-magnus',
  ),
  packet = await api.specimenReviewMaterial(
    api.wholeLimbDefinition.key,
    muscle.id,
  );
const html = renderToStaticMarkup(
  React.createElement(module.exports.SpecimenReviewWorkspace, {
    rows: api.specimenReviewRows,
    packet,
    invalid: false,
  }),
);
assert.match(html, /Open this exact structure in 3D/);
assert.match(html, /Motor supply/);
assert.match(html, /Adductor part/);
assert.match(html, /Hamstring part/);
assert.match(html, /Proximal attachment/);
assert(!html.includes('Approval recorded'));
const report = {
  schemaVersion: 1,
  scope: 'independent-reference-navigation-and-review-software-only',
  sourceStudies: studies,
  studySelectionRoundTrips: links,
  invalidOrChangedSourceRejections: rejections,
  reviewScopes: api.specimenReviewRows.map((r) => ({
    key: r.key,
    selections: r.surfaces.length,
  })),
  reviewSelectionLinks: scopeLinks,
  distinctSourceIds: sourceIds.size,
  distinctReviewFingerprints: fingerprints.size,
  scenePropChecks: rendered,
  verifiedModelBundles: checkedBundles.size,
  historicalPreservation: { before: navigationBefore, after: navigationMilestone, preservedFiles: unchanged.length },
  sourceGeometryChanged: false,
  privateRecordsRead: false,
  clinicalApproval: false,
  browserGpuTesting: false,
};
await writeFile(
  'docs/independent-navigation-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report));
