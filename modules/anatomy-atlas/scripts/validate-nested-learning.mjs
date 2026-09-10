import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const compiled = await build({
  stdin: {
    contents: `export * from './lib/learning-resources';
    export * from './lib/learning-anatomy'; export * from './lib/nested-learning-anatomy';
    export * from './lib/learning-entitlements';
    export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { nestedStudyTargets } from './lib/nested-anatomy';
    export { makeStudyLink, parseStudyLink, resolveStudyLink } from './lib/study-links';
    export { structures } from './app/anatomy-data';`,
    resolveDir: fileURLToPath(root),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const catalog = JSON.parse(
  await read('public/models/bodyparts3d/full-body/catalog.json'),
);
const manifest = JSON.parse(
  await read('public/models/bodyparts3d/manifest.json'),
);
const current = api.bodyDisplayCatalog(catalog);
const legacy = api.learningAnatomyRepresentations(
  catalog,
  manifest,
  api.structures,
);
const anatomy = api.allLearningAnatomyRepresentations(
  catalog,
  manifest,
  api.structures,
);
const nested = anatomy.filter((t) => t.scope === 'nested');
const targets = api.nestedStudyTargets(current);
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const reject = (fn, message) => {
  checks++;
  assert.throws(fn, message);
};
same(legacy.length, 1031);
same(anatomy.length, 1091);
same(
  anatomy.filter((t) => t.scope !== 'nested'),
  legacy,
  'Legacy 1,031 bindings unchanged',
);
same(nested.length, 60);
same(
  nested.map((t) => t.structureId).sort(),
  targets.map((t) => t.structureId).sort(),
);
same(
  api.nestedLearningAnatomyRepresentations(current),
  nested,
  'Corrected-display input is idempotent',
);
const empty = JSON.parse(await read('content/learning-resources.v1.json'));
same(empty, { schemaVersion: 1, resources: [], links: [] });
same(api.parseLearningDocument({ ...empty, schemaVersion: 2 }), {
  ...empty,
  schemaVersion: 2,
});
const before = JSON.stringify({ catalog, anatomy, empty });

// Synthetic transport-only examples, never real images, lectures or approvals.
const anchors = {
  ct: {
    type: 'volume',
    id: 'test-anchor',
    seriesId: 'test-ct',
    frameId: 'test-ct-frame',
    annotationId: 'test-partial',
    geometry: 'partial-mask',
  },
  mri: {
    type: 'volume',
    id: 'test-anchor',
    seriesId: 'test-mri',
    frameId: 'test-mri-frame',
    annotationId: 'test-region',
    geometry: 'region',
  },
  xray: {
    type: 'projection',
    id: 'test-anchor',
    imageId: 'test-xray',
    annotationId: 'test-landmark',
    projectionId: 'test-projection',
  },
  ultrasound: {
    type: 'ultrasound',
    id: 'test-anchor',
    clipId: 'test-clip',
    annotationId: 'test-us-landmark',
    viewId: 'test-view',
    frameIndex: 0,
    timeMs: null,
  },
  lecture: {
    type: 'slide',
    id: 'test-anchor',
    courseId: 'test-course',
    lessonId: 'test-restricted-section',
    slideId: 'test-slide',
    buildId: 'test-build',
  },
  quiz: {
    type: 'question',
    id: 'test-anchor',
    questionId: 'test-question',
    objectiveId: 'test-objective',
  },
};
const resources = Object.entries(anchors).map(([kind, anchor]) => ({
  id: 'vm:resource:nested-test:' + kind,
  revision: 1,
  kind,
  title: 'Synthetic transport test ' + kind,
  ageGroup: 'unspecified',
  laterality: 'unspecified',
  regionIds: ['head-neck'],
  material: {
    sha256: 'a'.repeat(64),
    origin: ['lecture', 'quiz'].includes(kind) ? 'authored' : 'synthetic',
  },
  anchors: [anchor],
}));
const links = nested.flatMap((target, i) =>
  resources.map((resource) => ({
    id: 'vm:link:nested-test:' + i + ':' + resource.kind,
    revision: 1,
    anatomy: target,
    resourceId: resource.id,
    resourceRevision: resource.revision,
    materialSha256: resource.material.sha256,
    anchorId: 'test-anchor',
    relation: 'related',
  })),
);
const document = { schemaVersion: 2, resources, links };
// All 360 synthetic links now exceed the deliberate 2 MB transport cap.
// Keep that production limit and exercise every link through bounded batches.
const encodedDocument = JSON.stringify(document);
check(new TextEncoder().encode(encodedDocument).length > 2_000_000);
same(
  api.parseLearningJson(encodedDocument),
  null,
  'Oversized transport stays rejected',
);
for (let start = 0; start < links.length; start += 100) {
  const batch = { ...document, links: links.slice(start, start + 100) };
  const decoded = api.parseLearningJson(JSON.stringify(batch));
  check(decoded, 'Bounded transport parses');
  same(decoded, batch, 'v2 JSON transport round trip');
}
const allow = {
  canNavigate: () => true,
  canAccessAnatomy: () => true,
  canAccess: () => true,
  resourceCleared: () => true,
  correspondenceCleared: () => true,
};
const registry = api.createLearningRegistry(document, anatomy, allow);
same(
  api.parseLearningDocument({ ...document, schemaVersion: 1 }),
  null,
  'v1 cannot silently admit nested anatomy',
);
const legacyV2 = { ...document, links: [{ ...links[0], anatomy: legacy[0] }] };
check(api.createLearningRegistry(legacyV2, anatomy, allow));
same(api.parseLearningDocument({ ...legacyV2, schemaVersion: 1 }), {
  ...legacyV2,
  schemaVersion: 1,
});
let studyRoutes = 0;
for (const entry of nested) {
  const target = targets.find((t) => t.structureId === entry.structureId);
  same(entry.sources, target.structure.sources);
  same(
    entry.nested.parentSources,
    current.structures.find((p) => p.id === target.parentId).sources,
  );
  const matches = registry.related('nested', entry.structureId);
  same(matches.length, 6);
  same(registry.related('body', entry.structureId), []);
  same(
    api
      .createLearningRegistry(document, anatomy)
      .related('nested', entry.structureId),
    [],
  );
  const selection = api.nestedLearningSelection(catalog, entry);
  same(selection, {
    study: target.study,
    parentId: target.parentId,
    parentHash: target.parentHash,
    structureId: target.structureId,
    sourceHash: target.sourceHash,
  });
  for (const side of ['both', 'left', 'right']) {
    const accepted =
      !['left', 'right'].includes(target.structure.laterality) ||
      side === 'both' ||
      side === target.structure.laterality;
    same(
      !!api.nestedLearningSelection(catalog, entry, side),
      accepted,
      'Child side is checked, not only parent',
    );
    if (!accepted) continue;
    for (const region of [target.structure.region, 'whole-body']) {
      const href = api.makeStudyLink(
        current,
        region,
        selection.parentId,
        side,
        null,
        selection,
      );
      check(href && href.startsWith('/'));
      const request = api.parseStudyLink(
        Object.fromEntries(new URLSearchParams(href.split('?')[1])),
      );
      const resolved = api.resolveStudyLink(current, region, request);
      same(resolved.status, 'ready');
      same(resolved.nested.structureId, entry.structureId);
      studyRoutes++;
    }
  }
  for (const match of matches) {
    const locator = api.decodeLearningLocator(
      api.encodeLearningLocator(match.locator),
    );
    same(registry.resolve(locator).match.link.anatomy, entry);
    check(
      registry
        .anatomyFor(match.resource.id, 'test-anchor')
        .some((m) => m.link.anatomy.structureId === entry.structureId),
    );
    same(api.nestedLearningSelection(catalog, match.link.anatomy), selection);
  }
  const reversed = structuredClone(entry);
  reversed.sources.reverse();
  reversed.nested.parentSources.reverse();
  same(
    api.learningAnatomyBindingKey(reversed),
    api.learningAnatomyBindingKey(entry),
  );
  same(api.nestedLearningSelection(catalog, reversed), selection);
  for (const mutate of [
    (e) => (e.sources[0].sha256 = 'b'.repeat(64)),
    (e) => (e.nested.parentSources[0].sha256 = 'b'.repeat(64)),
    (e) => (e.nested.parentId = 'vm:anatomy:wrong-parent'),
    (e) => (e.nested.study = entry.nested.study === 'eye' ? 'cerebral' : 'eye'),
    (e) => (e.nested.bundleSha256 = 'b'.repeat(64)),
    (e) => (e.nested.parentBundleSha256 = 'b'.repeat(64)),
    (e) => (e.structureId = 'vm:anatomy:unknown-child'),
  ]) {
    const changed = structuredClone(entry);
    mutate(changed);
    same(api.nestedLearningSelection(catalog, changed), null);
    const changedDocument = {
      schemaVersion: 2,
      resources,
      links: [{ ...links[0], anatomy: changed }],
    };
    reject(() => api.createLearningRegistry(changedDocument, anatomy, allow));
    check(
      api.learningReviewPayload(changedDocument.links[0]) !==
        api.learningReviewPayload({ ...links[0], anatomy: entry }),
    );
  }
}

const sample = nested[0];
for (const mutate of [
  (e) => delete e.nested,
  (e) => (e.scope = 'body'),
  (e) => (e.nested.study = 'guessed-study'),
  (e) => (e.nested.parentId = e.structureId),
  (e) => (e.nested.parentSources = []),
  (e) => e.nested.parentSources.push(e.nested.parentSources[0]),
  (e) => (e.nested.parentBundleSha256 = 'bad'),
  (e) => (e.nested.bundleSha256 = 'BAD'),
  (e) => (e.nested.transform = [1, 0, 0]),
  (e) => (e.nested.approved = true),
  (e) => (e.nested.patientId = 'synthetic-test-only'),
  (e) => (e.nested.url = 'https://example.test'),
]) {
  const changed = structuredClone(sample);
  mutate(changed);
  same(api.learningAnatomyBindingKey(changed), null);
  same(
    api.parseLearningDocument({
      schemaVersion: 2,
      resources,
      links: [{ ...links[0], anatomy: changed }],
    }),
    null,
  );
}
let getters = 0;
const getter = Object.defineProperty({ ...sample }, 'nested', {
  get() {
    getters++;
    throw Error('No getter');
  },
  enumerable: true,
});
same(api.learningAnatomyBindingKey(getter), null);
same(getters, 0);
for (const legacyEntry of legacy)
  same(api.nestedLearningSelection(catalog, legacyEntry), null);
const detached = api.nestedLearningAnatomyRepresentations(catalog);
detached[0].sources[0].file = 'changed';
detached[0].nested.parentSources.length = 0;
same(api.nestedLearningAnatomyRepresentations(catalog), nested);
for (const patch of [
  { sourceVersion: '3.0' },
  { coordinateSystem: { ...catalog.coordinateSystem, unitsPerMillimetre: 1 } },
])
  reject(() =>
    api.nestedLearningAnatomyRepresentations({ ...catalog, ...patch }),
  );
const changedParent = structuredClone(catalog);
changedParent.bundles.find(
  (b) =>
    b.id ===
    current.structures.find((s) => s.id === sample.nested.parentId).bundle,
).sha256 = 'c'.repeat(64);
same(api.nestedLearningSelection(changedParent, sample), null);

// Eligibility is re-evaluated on all three lookup directions, including nested ones.
const gatedLink = links.find((l) => l.resourceId.endsWith(':lecture'));
const reviewed = new Set([api.learningReviewPayload(gatedLink)]);
let grants = [],
  now = 2000,
  navigate = true,
  resourceCleared = true,
  correspondenceCleared = true;
const grant = (productId) => ({
  subjectId: 'test-learner',
  productId,
  status: 'active',
  validFrom: 1000,
  validUntil: 3000,
});
const entitled = (product) =>
  api.hasLearningEntitlement(
    { kind: 'products', anyOf: [product] },
    'test-learner',
    grants,
    now,
  );
const policy = {
  canNavigate: () => navigate,
  canAccessAnatomy: () => entitled('test-atlas'),
  canAccess: () => entitled('test-lecture'),
  resourceCleared: () => resourceCleared,
  correspondenceCleared: (l) =>
    correspondenceCleared && reviewed.has(api.learningReviewPayload(l)),
};
const gated = api.createLearningRegistry(
  { schemaVersion: 2, resources, links: [gatedLink] },
  anatomy,
  policy,
);
const locator = registry
  .related('nested', gatedLink.anatomy.structureId)
  .find((m) => m.link.id === gatedLink.id).locator;
const denied = () => {
  same(gated.related('nested', gatedLink.anatomy.structureId), []);
  same(gated.anatomyFor(gatedLink.resourceId, 'test-anchor'), []);
  same(gated.resolve(locator), { status: 'unavailable' });
};
for (const products of [
  [],
  ['test-atlas'],
  ['test-lecture'],
  ['test-bundle'],
]) {
  grants = products.map(grant);
  denied();
}
grants = ['test-atlas', 'test-lecture'].map(grant);
same(gated.resolve(locator).status, 'ready');
grants[1].status = 'revoked';
denied();
grants[1].status = 'active';
now = 3000;
denied();
now = 2000;
navigate = false;
denied();
navigate = true;
resourceCleared = false;
denied();
resourceCleared = true;
correspondenceCleared = false;
denied();
correspondenceCleared = true;
for (const gate of Object.keys(policy))
  for (const bad of [
    () => Promise.resolve(true),
    () => {
      throw Error('Unavailable policy');
    },
  ]) {
    same(
      api
        .createLearningRegistry(
          { schemaVersion: 2, resources, links: [gatedLink] },
          anatomy,
          { ...policy, [gate]: bad },
        )
        .resolve(locator),
      { status: 'unavailable' },
    );
  }
const changedRelation = { ...gatedLink, relation: 'exact' };
same(
  api
    .createLearningRegistry(
      { schemaVersion: 2, resources, links: [changedRelation] },
      anatomy,
      policy,
    )
    .resolve(locator),
  { status: 'unavailable' },
);
same(
  JSON.stringify({ catalog, anatomy, empty }),
  before,
  'No catalog or production-content mutation',
);
const report = {
  schemaVersion: 1,
  passed: true,
  checks,
  legacyRepresentations: legacy.length,
  nestedRepresentations: nested.length,
  combinedRepresentations: anatomy.length,
  syntheticCorrespondences: links.length,
  resourceKinds: Object.keys(anchors),
  studyRoutes,
  supportedDocumentVersions: [1, 2],
  locatorVersion: 1,
  productionResources: empty.resources.length,
  productionCorrespondences: empty.links.length,
  geometryChanged: false,
  patientDataImported: false,
  clinicalApproval: false,
  externalViewerConnected: false,
  browserTesting: false,
};
await writeFile(
  new URL('docs/nested-learning-validation.json', root),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
