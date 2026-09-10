import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

const root = new URL('../', import.meta.url),
  read = (path) => readFile(new URL(path, root), 'utf8');
const hash = (text) => createHash('sha256').update(text).digest('hex');
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/learning-resources'; export * from './lib/learning-anatomy'; export * from './lib/learning-entitlements'; export { structures } from './app/anatomy-data';",
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
const catalogBytes = await read(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const manifestBytes = await read('public/models/bodyparts3d/manifest.json');
const catalog = JSON.parse(catalogBytes),
  manifest = JSON.parse(manifestBytes);
const anatomy = api.learningAnatomyRepresentations(
  catalog,
  manifest,
  api.structures,
);
let checks = 0,
  rejections = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const reject = (fn) => {
  rejections++;
  checks++;
  assert.throws(fn);
};
same(anatomy.length, 1031);
same(
  hash(catalogBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const originalCatalog = JSON.stringify(catalog);
const empty = api.parseLearningJson(
  await read('content/learning-resources.v1.json'),
);
same(
  empty,
  { schemaVersion: 1, resources: [], links: [] },
  'No provisional project is silently published',
);
same(
  api
    .createLearningRegistry(empty, anatomy)
    .related('body', anatomy[0].structureId),
  [],
);

// Entirely synthetic transport fixtures. None are production scans, slide IDs,
// rights evidence, clinical approvals or external resources.
const testHash = 'a'.repeat(64);
const fixtures = [
  [
    'ct',
    {
      type: 'volume',
      id: 'test-anchor',
      seriesId: 'test-ct-series',
      frameId: 'test-ct-frame',
      annotationId: 'test-partial',
      geometry: 'partial-mask',
    },
  ],
  [
    'mri',
    {
      type: 'volume',
      id: 'test-anchor',
      seriesId: 'test-mri-t2-series',
      frameId: 'test-mri-frame',
      annotationId: 'test-region',
      geometry: 'region',
    },
  ],
  [
    'xray',
    {
      type: 'projection',
      id: 'test-anchor',
      imageId: 'test-xray',
      annotationId: 'test-landmark',
      projectionId: 'test-projection',
    },
  ],
  [
    'ultrasound',
    {
      type: 'ultrasound',
      id: 'test-anchor',
      clipId: 'test-clip',
      annotationId: 'test-annotation',
      viewId: 'test-view',
      frameIndex: 0,
      timeMs: null,
    },
  ],
  [
    'lecture',
    {
      type: 'slide',
      id: 'test-anchor',
      courseId: 'test-course',
      lessonId: 'test-lesson',
      slideId: 'test-stable-slide',
      buildId: 'test-build',
    },
  ],
  [
    'quiz',
    {
      type: 'question',
      id: 'test-anchor',
      questionId: 'test-question',
      objectiveId: 'test-objective',
    },
  ],
];
const resources = fixtures.map(([kind, anchor]) => ({
  id: 'vm:resource:test:' + kind,
  revision: 1,
  kind,
  title: 'Synthetic test fixture ' + kind,
  ageGroup: 'unspecified',
  laterality: 'unspecified',
  regionIds: ['head-neck'],
  material: {
    sha256: testHash,
    origin: ['lecture', 'quiz'].includes(kind) ? 'authored' : 'synthetic',
  },
  anchors: [anchor],
}));
const target = anatomy.find(
  (t) =>
    t.scope === 'body' &&
    catalog.structures
      .find((s) => s.id === t.structureId)
      ?.regions.includes('head-neck'),
);
const links = resources.map((r, i) => ({
  id: 'vm:link:test:' + i,
  revision: 1,
  anatomy: target,
  resourceId: r.id,
  resourceRevision: r.revision,
  materialSha256: r.material.sha256,
  anchorId: r.anchors[0].id,
  relation: i % 2 ? 'related' : 'exact',
}));
const document = { schemaVersion: 1, resources, links };
const unchanged = JSON.stringify(document);
let allowAccess = true,
  allowAnatomy = true,
  allowResource = true,
  allowLink = true,
  allowNavigation = true;
const policy = {
  canNavigate: () => allowNavigation,
  canAccessAnatomy: () => allowAnatomy,
  canAccess: () => allowAccess,
  resourceCleared: () => allowResource,
  correspondenceCleared: () => allowLink,
};
const registry = api.createLearningRegistry(document, anatomy, policy);
same(
  api
    .createLearningRegistry(document, anatomy)
    .related(target.scope, target.structureId),
  [],
  'Default denied',
);
same(registry.related(target.scope, target.structureId).length, 6);
same(
  registry.related('shoulder-pilot', target.structureId),
  [],
  'Scope is part of identity',
);
same(registry.related('body', 'guessed-name'), []);
for (const r of resources) {
  const matches = registry.anatomyFor(r.id, r.anchors[0].id);
  same(matches.length, 1);
  same(matches[0].resource.kind, r.kind);
  same(matches[0].anchor, r.anchors[0]);
  same(matches[0].link.anatomy, target);
  const locator = matches[0].locator;
  same(registry.resolve(locator).status, 'ready');
  same(api.decodeLearningLocator(api.encodeLearningLocator(locator)), locator);
  same(
    registry.resolve(Object.fromEntries(Object.entries(locator).reverse()))
      .status,
    'ready',
    'Object key order is irrelevant',
  );
  for (const patch of [
    { linkRevision: 2 },
    { resourceRevision: 2 },
    { anchorId: 'removed-anchor' },
    { resourceId: 'vm:resource:missing' },
    { linkId: 'vm:link:missing' },
  ])
    same(
      registry.resolve({ ...locator, ...patch }),
      { status: 'unavailable' },
      'Stale/foreign anchor does not navigate',
    );
  matches[0].resource.title = 'Mutated copy';
  matches[0].link.anatomy.sources[0].sha256 = 'b'.repeat(64);
  same(
    registry.resolve(locator).match.resource.title,
    r.title,
    'Caller cannot mutate registry',
  );
}
const locator = registry.related(target.scope, target.structureId)[0].locator;
for (const gate of ['access', 'anatomy', 'resource', 'link', 'navigation']) {
  allowAccess = gate !== 'access';
  allowAnatomy = gate !== 'anatomy';
  allowResource = gate !== 'resource';
  allowLink = gate !== 'link';
  allowNavigation = gate !== 'navigation';
  same(registry.related(target.scope, target.structureId), []);
  same(registry.anatomyFor(resources[0].id, 'test-anchor'), []);
  same(
    registry.resolve(locator),
    { status: 'unavailable' },
    'Revocation rechecked per lookup',
  );
}
allowAccess = allowAnatomy = allowResource = allowLink = allowNavigation = true;
same(registry.resolve(locator).status, 'ready');
for (const key of Object.keys(policy)) {
  const broken = {
    ...policy,
    [key]: () => {
      throw Error('Policy unavailable');
    },
  };
  same(api.createLearningRegistry(document, anatomy, broken).resolve(locator), {
    status: 'unavailable',
  });
  const asynchronous = { ...policy, [key]: () => Promise.resolve(true) };
  same(
    api
      .createLearningRegistry(document, anatomy, asynchronous)
      .resolve(locator),
    { status: 'unavailable' },
    'Async policy is not accidentally truthy',
  );
}
const mutating = {
  ...policy,
  canAccess: (r) => {
    r.material.sha256 = 'b'.repeat(64);
    return true;
  },
  correspondenceCleared: (l) => {
    l.relation = 'broader';
    return true;
  },
};
same(
  api.createLearningRegistry(document, anatomy, mutating).resolve(locator).match
    .link.relation,
  'exact',
  'Policy receives detached values',
);
same(JSON.stringify(document), unchanged);
same(JSON.stringify(catalog), originalCatalog);
const reviewedResources = new Set(resources.map(api.learningReviewPayload));
const reviewedLinks = new Set(links.map(api.learningReviewPayload));
const exactReviewPolicy = {
  ...policy,
  resourceCleared: (r) => reviewedResources.has(api.learningReviewPayload(r)),
  correspondenceCleared: (l) => reviewedLinks.has(api.learningReviewPayload(l)),
};
same(
  api
    .createLearningRegistry(document, anatomy, exactReviewPolicy)
    .resolve(locator).status,
  'ready',
);
for (const mutate of [
  (d) => (d.resources[0].anchors[0].frameId = 'different-frame'),
  (d) => (d.resources[0].anchors[0].geometry = 'mask'),
  (d) => (d.resources[0].ageGroup = 'paediatric'),
  (d) => (d.resources[0].laterality = 'right'),
  (d) => (d.links[0].relation = 'broader'),
]) {
  const changed = structuredClone(document);
  mutate(changed);
  same(
    api
      .createLearningRegistry(changed, anatomy, exactReviewPolicy)
      .resolve(locator),
    { status: 'unavailable' },
    'Changed full record loses review even with unchanged asset digest/version',
  );
}
same(
  api.learningReviewPayload(
    Object.fromEntries(Object.entries(resources[0]).reverse()),
  ),
  api.learningReviewPayload(resources[0]),
);
same(api.learningReviewPayload({ ...resources[0], approved: true }), null);

for (const mutate of [
  (d) => (d.schemaVersion = 3),
  (d) => (d.approved = true),
  (d) => (d.patientId = 'test-only'),
  (d) => (d.resources[0].url = 'https://example.test/untrusted'),
  (d) => (d.resources[0].material.sha256 = 'bad'),
  (d) => (d.resources[0].revision = 0),
  (d) => (d.resources[0].ageGroup = 'guessed'),
  (d) => (d.resources[0].laterality = 'both'),
  (d) => (d.resources[0].regionIds = ['unknown']),
  (d) => (d.resources[0].regionIds = ['head-neck', 'head-neck']),
  (d) => (d.resources[0].anchors[0].transform = [1, 0, 0]),
  (d) => (d.resources[0].anchors[0].patientCoordinates = [0, 0, 0]),
  (d) => (d.resources[0].anchors[0].geometry = 'complete-approved'),
  (d) => (d.resources[0].anchors = [resources[2].anchors[0]]),
  (d) => d.resources[0].anchors.push(d.resources[0].anchors[0]),
  (d) => d.resources.push(d.resources[0]),
  (d) => d.links.push(d.links[0]),
  (d) => d.links[0].anatomy.sources.push(d.links[0].anatomy.sources[0]),
  (d) => (d.links[0].relation = 'registered'),
  (d) => (d.links[0].approved = true),
  (d) => (d.resources[3].anchors[0].timeMs = 10),
  (d) => (d.resources[3].anchors[0].frameIndex = -1),
  (d) => (d.resources[3].anchors[0].frameIndex = 0.5),
  (d) => (d.resources[4].anchors[0].slideId = ''),
  (d) => (d.resources[0].id = 'vm:resource:'),
]) {
  const copy = structuredClone(document);
  mutate(copy);
  rejections++;
  same(api.parseLearningDocument(copy), null);
}
for (const mutate of [
  (d) => (d.links[0].resourceRevision = 2),
  (d) => (d.links[0].materialSha256 = 'b'.repeat(64)),
  (d) => (d.links[0].resourceId = 'vm:resource:absent'),
  (d) => (d.links[0].anchorId = 'missing'),
  (d) => (d.links[0].anatomy.scope = 'shoulder-pilot'),
  (d) => (d.links[0].anatomy.structureId = 'vm:anatomy:unknown'),
  (d) => (d.links[0].anatomy.sources[0].sha256 = 'b'.repeat(64)),
  (d) => d.links.push({ ...d.links[0], id: 'vm:link:duplicate-target' }),
]) {
  const copy = structuredClone(document);
  mutate(copy);
  reject(() => api.createLearningRegistry(copy, anatomy, policy));
}
const copiedSources = structuredClone(document);
copiedSources.links[0].anatomy.sources = copiedSources.links[0].anatomy.sources
  .reverse()
  .map((s) => ({ sha256: s.sha256, file: s.file }));
same(
  api.createLearningRegistry(copiedSources, anatomy, policy).resolve(locator)
    .status,
  'ready',
  'Source order/key order independent',
);
const missingPart = anatomy.find(
  (t) => t.scope === 'shoulder-pilot' && t.sources.length > 1,
);
const multipart = structuredClone(document);
multipart.links[0].anatomy = structuredClone(missingPart);
check(api.createLearningRegistry(multipart, anatomy, policy));
multipart.links[0].anatomy.sources.pop();
reject(() => api.createLearningRegistry(multipart, anatomy, policy));
let getterCalled = false;
const getters = Object.defineProperty({ ...document }, 'resources', {
  get() {
    getterCalled = true;
    return [];
  },
  enumerable: true,
});
same(api.parseLearningDocument(getters), null);
same(getterCalled, false);
const hidden = Object.defineProperty({ ...document }, 'patientMetadata', {
  value: 'test-only',
  enumerable: false,
});
same(api.parseLearningDocument(hidden), null);
same(
  api.parseLearningDocument(
    new Proxy(
      {},
      {
        ownKeys() {
          throw Error('bad proxy');
        },
      },
    ),
  ),
  null,
);
same(api.parseLearningJson('{bad'), null);
same(api.parseLearningJson(' '.repeat(2_000_001)), null);
const parsed = api.parseLearningDocument(document);
parsed.resources[0].title = 'Changed';
same(JSON.stringify(document), unchanged);
const query = api.encodeLearningLocator(locator);
for (const text of [
  query + '&resource=x',
  query + '&patient=test-only',
  query.replace('learning=1', 'learning=2'),
  query.replace('linkRevision=1', 'linkRevision=01'),
  query.replace('resourceRevision=1', 'resourceRevision=1.5'),
  'https://example.test/?' + query,
  'x'.repeat(4097),
]) {
  rejections++;
  same(api.decodeLearningLocator(text), null);
}
same(api.parseLearningLocator({ ...locator, matrix: [] }), null);
same(api.encodeLearningLocator({ ...locator, linkRevision: NaN }), null);
const longestLocator = {
  ...locator,
  linkId: 'vm:link:' + ':'.repeat(212),
  resourceId: 'vm:resource:' + ':'.repeat(208),
  anchorId: ':'.repeat(220),
  linkRevision: Number.MAX_SAFE_INTEGER,
  resourceRevision: Number.MAX_SAFE_INTEGER,
};
same(
  api.decodeLearningLocator(api.encodeLearningLocator(longestLocator)),
  longestLocator,
  'Maximum legal fields round-trip after URL escaping',
);
const us = structuredClone(document);
us.resources[3].anchors[0].frameIndex = null;
us.resources[3].anchors[0].timeMs = 1250;
check(api.parseLearningDocument(us));
const renamed = structuredClone(document);
renamed.resources[4].title = 'A revised display title';
same(
  api
    .createLearningRegistry(renamed, anatomy, policy)
    .anatomyFor(resources[4].id, 'test-anchor')[0].anchor.slideId,
  'test-stable-slide',
);
// Fictional product/subject IDs only; no prices, billing integration or real grants.
const entitlementChecksStart = checks;
const now = 2000;
const atlasRule = { kind: 'products', anyOf: ['test-atlas'] };
const lectureRule = { kind: 'products', anyOf: ['test-lecture'] };
const grant = (productId, patch = {}) => ({
  subjectId: 'test-learner',
  productId,
  status: 'active',
  validFrom: 1000,
  validUntil: 3000,
  ...patch,
});
const entitled = (rule, grants, time = now, subject = 'test-learner') =>
  api.hasLearningEntitlement(rule, subject, grants, time);
same(entitled(atlasRule, [grant('test-atlas')]), true);
same(
  entitled(lectureRule, [grant('test-atlas')]),
  false,
  'Atlas is not a lecture pass',
);
same(
  entitled(atlasRule, [grant('test-lecture')]),
  false,
  'Lecture is not an Atlas pass',
);
same(entitled(lectureRule, [grant('test-lecture')]), true);
for (const rule of [atlasRule, lectureRule]) {
  same(entitled(rule, [grant('test-atlas'), grant('test-lecture')]), true);
  same(entitled(rule, [grant('test-bundle')]), false, 'No inferred bundle');
  same(
    entitled({ ...rule, anyOf: [...rule.anyOf, 'test-bundle'] }, [
      grant('test-bundle'),
    ]),
    true,
  );
}
same(entitled({ kind: 'public' }, [], now, null), true);
same(entitled(lectureRule, [], now, null), false);
same(entitled(lectureRule, []), false);
same(entitled(lectureRule, [grant('test-lecture')], 1000), true);
same(entitled(lectureRule, [grant('test-lecture')], 999), false);
same(entitled(lectureRule, [grant('test-lecture')], 3000), false);
same(
  entitled(lectureRule, [grant('test-lecture', { validUntil: null })], 4000),
  true,
);
for (const patch of [
  { status: 'revoked' },
  { subjectId: 'different-learner' },
  { validFrom: 2500 },
  { validUntil: 2000 },
  { validUntil: 1000 },
  { validUntil: undefined },
  { validUntil: NaN },
  { validFrom: -1 },
  { status: 'pending' },
  { status: true },
  { productId: '' },
  { clientApproved: true },
])
  same(entitled(lectureRule, [grant('test-lecture', patch)]), false);
for (const invalidRule of [
  null,
  {},
  { kind: 'public', products: [] },
  { kind: 'products', anyOf: [] },
  { kind: 'products', anyOf: ['test-lecture', 'test-lecture'] },
  { kind: 'products', anyOf: ['test-*'] },
  { kind: 'subscription', anyOf: ['test-lecture'] },
])
  same(entitled(invalidRule, [grant('test-lecture')]), false);
same(entitled(lectureRule, [grant('test-lecture')], NaN), false);
same(entitled(lectureRule, [grant('test-lecture')], -1), false);
same(
  entitled(lectureRule, [
    grant('test-lecture'),
    grant('test-lecture', { status: 'revoked' }),
  ]),
  false,
);
same(
  entitled(lectureRule, [
    grant('test-lecture', { status: 'revoked' }),
    grant('test-lecture'),
  ]),
  false,
);
let currentGrants = [grant('test-atlas')];
const commercialPolicy = {
  ...policy,
  canAccessAnatomy: () => entitled(atlasRule, currentGrants),
  canAccess: () => entitled(lectureRule, currentGrants),
};
const paidRegistry = api.createLearningRegistry(
  document,
  anatomy,
  commercialPolicy,
);
for (const grants of [[grant('test-atlas')], [grant('test-lecture')], []]) {
  currentGrants = grants;
  same(paidRegistry.related(target.scope, target.structureId), []);
  same(paidRegistry.anatomyFor(resources[4].id, 'test-anchor'), []);
  same(
    paidRegistry.resolve(locator),
    { status: 'unavailable' },
    'No restricted metadata returned',
  );
}
currentGrants = [grant('test-atlas'), grant('test-lecture')];
same(paidRegistry.resolve(locator).status, 'ready');
currentGrants[1].status = 'revoked';
same(
  paidRegistry.resolve(locator),
  { status: 'unavailable' },
  'Current entitlement rechecked',
);
const entitlementChecks = checks - entitlementChecksStart;
const report = {
  schemaVersion: 1,
  checks,
  rejectionCases: rejections,
  entitlementChecks,
  anatomyRepresentations: anatomy.length,
  resourceKinds: fixtures.map((f) => f[0]),
  productionResources: empty.resources.length,
  productionCorrespondences: empty.links.length,
  catalogSha256: hash(catalogBytes),
  shoulderManifestSha256: hash(manifestBytes),
  features: [
    'Strict versioned transport',
    'Exact multipart source/representation binding',
    'Stable modality and lecture anchors',
    'Bidirectional lookups',
    'Current host-policy gates with default denial',
    'Separate Atlas/lecture products; explicit bundles; expiry/revocation',
    'Detached data and deterministic locators',
    'No URL/coordinate forwarding',
  ],
  boundaries: {
    clinicalApproval: false,
    rightsApproval: false,
    patientDataImported: false,
    imagingRegistration: false,
    authenticationImplemented: false,
    externalViewerConnected: false,
    browserTesting: false,
  },
};
await writeFile(
  new URL('docs/learning-resources-validation.json', root),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
