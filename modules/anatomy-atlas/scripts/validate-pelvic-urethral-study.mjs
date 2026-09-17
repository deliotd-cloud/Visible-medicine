import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import {
  pelvicUrethralRecipeBaseline,
  pelvicUrethralRecipeRevision,
  prePelvicUrethralProfiles,
} from './pelvic-urethral-study-history.mjs';

const compiled = await build({
  stdin: {
    contents: `
      export * from './app/dissection-data';
      export { bodyLesson } from './app/body-content';
      export * from './content/pelvic-urethral-study';
      export * from './lib/body-display-catalog';
      export * from './lib/body-source-additions';
      export * from './lib/corpus-spongiosum';
      export * from './lib/dissection-guidance';
      export * from './lib/study-library';
      export * from './lib/study-links';
      export * from './lib/study-navigation';
    `,
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
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const raw = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const source = JSON.parse(
  await readFile('public/models/bodyparts3d/corpus-spongiosum/catalog.json', 'utf8'),
);
const rawBefore = JSON.stringify(raw);
const catalog = api.bodyDisplayCatalog(raw);
const catalogBefore = JSON.stringify(catalog);
const id = 'pelvis-urethral-context';
const requiredFmas = ['FMA19617', 'FMA19667', 'FMA15900', 'FMA9600'];
const contextFmas = ['FMA16586', 'FMA16587'];
const allFmas = [...requiredFmas, ...contextFmas];
const ids = (items) => items.map((item) => item.id).sort();
const fmas = (items) => items.map((item) => item.fmaId).sort();

assert.equal(source.clinicalApproval, false);
assert.equal(source.structures.length, 1);
assert.equal(source.contextRecords.length, 5);
assert.deepEqual(
  fmas(source.structures),
  ['FMA19617'],
  'The new display source is the corpus spongiosum record only',
);
assert.deepEqual(
  fmas(source.contextRecords.filter((item) => item.system !== 'skeleton')),
  ['FMA15900', 'FMA19667', 'FMA9600'].sort(),
);
assert.deepEqual(
  fmas(source.contextRecords.filter((item) => item.system === 'skeleton')),
  contextFmas.slice().sort(),
);
assert(!raw.structures.some((item) => item.fmaId === 'FMA19617'));
assert(catalog.structures.some((item) => item.fmaId === 'FMA19617'));
assert.equal(JSON.stringify(raw), rawBefore, 'Display admission must not mutate input');
assert.equal(api.bodyDisplayCatalog(catalog), catalog, 'Admission is idempotent');
const detachedAddition = api.addCorpusSpongiosum(raw);
detachedAddition.structures.at(-1).sources[0].sha256 = 'synthetic mutation';
assert.notEqual(
  api.addCorpusSpongiosum(raw).structures.at(-1).sources[0].sha256,
  'synthetic mutation',
);
const sourceBundle = source.bundles[0];
const sourceBytes = await readFile(
  'public' + sourceBundle.url.split('?')[0],
);
assert.equal(
  createHash('sha256').update(sourceBytes).digest('hex'),
  sourceBundle.sha256,
);
const sourceScene = (
  await new GLTFLoader().parseAsync(
    sourceBytes.buffer.slice(
      sourceBytes.byteOffset,
      sourceBytes.byteOffset + sourceBytes.byteLength,
    ),
    '',
  )
).scene;
assert(sourceScene.getObjectByName(source.structures[0].nodeName)?.isMesh);
for (const forbidden of [
  'patientId',
  'patientName',
  'studyInstanceUid',
  'frameOfReferenceUid',
])
  assert(!Object.hasOwn(source, forbidden));

const focus = api.pelvicUrethralFocus;
assert.equal(focus.id, id);
assert.deepEqual(focus.rule.fmaIds.slice().sort(), ['FMA19617', 'FMA19667']);
assert.deepEqual(
  focus.context.flatMap((rule) => rule.fmaIds).sort(),
  ['FMA15900', 'FMA16586', 'FMA16587', 'FMA9600'].sort(),
);
assert.deepEqual(fmas(focus.requiredSources), requiredFmas.slice().sort());
assert.deepEqual(fmas(focus.contextSources), contextFmas.slice().sort());
assert.equal(focus.requiredSources.length, 4);
assert.equal(focus.contextSources.length, 2);
assert.equal(focus.view, 'posterior');
assert.match(focus.description, /source/i);
assert.match(focus.inspect, /not establish/i);
assert.match(focus.inspect, /Radiologist review is pending/i);

const containingProfiles = Object.entries(api.dissectionProfiles)
  .filter(([, profile]) => profile.focuses.some((item) => item.id === id))
  .map(([region]) => region)
  .sort();
assert.deepEqual(containingProfiles, ['pelvis', 'whole-body']);
assert(
  Object.entries(api.dissectionProfiles)
    .filter(([region]) => !containingProfiles.includes(region))
    .every(([, profile]) => !profile.focuses.some((item) => item.id === id)),
);

const sourceRecord = catalog.structures.find((item) => item.fmaId === 'FMA19617');
for (const tab of ['anatomy', 'function', 'quiz']) {
  const lesson = api.bodyLesson(sourceRecord, tab);
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.note, /review pending/i);
  assert(lesson.citations.every((url) => new URL(url).protocol === 'https:'));
}
for (const tab of ['ct', 'mri', 'xray', 'ultrasound']) {
  const lesson = api.bodyLesson(sourceRecord, tab);
  assert.equal(lesson.readiness, 'pending');
  assert.match(lesson.note, /No patient scan/i);
}
const detachedLesson = api.bodyLesson(sourceRecord, 'anatomy');
detachedLesson.bullets[0] = 'synthetic mutation';
detachedLesson.citations.push('https://example.invalid');
assert.notEqual(api.bodyLesson(sourceRecord, 'anatomy').bullets[0], 'synthetic mutation');
assert.equal(api.bodyLesson(sourceRecord, 'anatomy').citations.length, 1);

let scopes = 0;
let focusedLinks = 0;
let plainLinks = 0;
let navigationViews = 0;
let previews = 0;
for (const region of containingProfiles) {
  const profile = api.dissectionProfiles[region];
  assert.equal(profile.focuses.filter((item) => item.id === id).length, 1);
  assert(!profile.stages.some((item) => item.id === id));
  for (const side of ['both', 'left', 'right']) {
    const scope = api.bodyStudyScope(catalog, region, side);
    const expected = scope.filter((item) => allFmas.includes(item.fmaId));
    const state = api.dissectionReducer(api.initialDissection, {
      type: 'focus',
      id,
    });
    const visible = api.resolveDissection(scope, profile, state).visible;
    assert.equal(visible.length, side === 'both' ? 6 : 5);
    assert.deepEqual(ids(visible), ids(expected));
    assert.equal(visible.filter((item) => ['unpaired', 'midline'].includes(item.laterality) && focus.rule.fmaIds.includes(item.fmaId)).length, 2);
    assert(visible.every((item) => allFmas.includes(item.fmaId)), 'No unauthored structure enters the focus');
    if (side !== 'both') {
      const absent = side === 'left' ? 'FMA16586' : 'FMA16587';
      assert(!visible.some((item) => item.fmaId === absent));
    }

    const card = api.studyLibrary(scope, profile).find(
      (item) => item.key === `focus:${id}`,
    );
    assert(card);
    assert.equal(card.recipes.length, 1);
    const recipe = card.recipes[0];
    assert.equal(recipe.available, true);
    assert.equal(recipe.targets.length, 2);
    assert.deepEqual(ids(recipe.visible), ids(visible));
    assert.deepEqual(api.studyLibraryAction(scope, profile, card.key, false), {
      kind: 'focus',
      id,
    });
    assert.equal(api.studyLibraryAction(scope, profile, card.key, true), null);
    const preview = api.studyRecipePreview(
      recipe,
      scope,
      scope.map((item) => item.id),
      catalog.bundles.map((bundle) => bundle.id),
      [],
    );
    assert.deepEqual(ids(preview.keep), ids(visible));
    assert.deepEqual(ids(preview.hide), ids(scope.filter((item) => !visible.includes(item))));
    assert.equal(preview.restore.length, 0);
    assert.equal(preview.waiting.length, 0);
    assert.equal(preview.failed.length, 0);
    previews++;

    for (const selected of visible) {
      const href = api.makeStudyLink(catalog, region, selected.id, side, id);
      assert(href);
      const parsed = api.parseStudyLink(
        Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
      );
      const resolved = api.resolveStudyLink(catalog, region, parsed);
      assert.equal(resolved.status, 'ready');
      assert.deepEqual(resolved.visibleIds.slice().sort(), ids(visible));
      focusedLinks++;

      const plain = api.makeStudyLink(catalog, region, selected.id, side);
      assert(plain && !new URL(plain, 'https://atlas.invalid').searchParams.has('focus'));
      const plainParsed = api.parseStudyLink(
        Object.fromEntries(new URL(plain, 'https://atlas.invalid').searchParams),
      );
      assert.equal(api.resolveStudyLink(catalog, region, plainParsed).status, 'ready');
      plainLinks++;

      const views = api.relatedStudyViews(scope, profile, selected.id);
      const view = views.find((item) => item.focusId === id);
      assert(view);
      assert.equal(view.role, focus.rule.fmaIds.includes(selected.fmaId) ? 'target' : 'context');
      assert.deepEqual(view.visibleIds.slice().sort(), ids(visible));
      navigationViews++;
    }
    const target = visible.find((item) => item.fmaId === 'FMA19617');
    const removed = api.dissectionReducer(state, { type: 'remove', id: target.id });
    assert(!api.resolveDissection(scope, profile, removed).visible.includes(target));
    const undone = api.dissectionReducer(removed, { type: 'undo' });
    assert.deepEqual(ids(api.resolveDissection(scope, profile, undone).visible), ids(visible));
    scopes++;
  }
}

for (const region of containingProfiles) {
  const destination = api
    .studyDestinations(catalog, sourceRecord, region, 'both')
    .find((item) => item.region === (region === 'pelvis' ? 'whole-body' : 'pelvis'));
  assert(destination);
  assert(destination.focuses.some((item) => item.focusId === id && item.href.includes(`focus=${id}`)));
}

const emptyCard = api
  .studyLibrary([], api.dissectionProfiles.pelvis)
  .find((item) => item.key === `focus:${id}`);
assert(emptyCard && !emptyCard.recipes[0].available);
assert.equal(api.studyLibraryAction([], api.dissectionProfiles.pelvis, `focus:${id}`, false), null);
assert.deepEqual(api.stageStructures([], api.dissectionProfiles.pelvis, 'free', id), []);

const sourceAbsent = structuredClone(raw);
assert(!sourceAbsent.structures.some((item) => item.fmaId === 'FMA19617'));
const absentScope = api.bodyStudyScope(sourceAbsent, 'pelvis', 'both');
assert.deepEqual(api.stageStructures(absentScope, api.dissectionProfiles.pelvis, 'free', id), []);

let guardRejections = 0;
const mutations = [
  (item) => (item.id += '-changed'),
  (item) => (item.fmaId = 'FMA0'),
  (item) => (item.sources[0].sha256 = '0'.repeat(64)),
  (item) => (item.bounds.min[0] += 0.01),
  (item) => (item.nodeName += '-changed'),
  (item) => (item.laterality = 'unspecified'),
  (item) => (item.validation.anatomicalReview = true),
];
for (const fmaId of allFmas) {
  for (const mutate of mutations) {
    const changed = structuredClone(catalog);
    mutate(changed.structures.find((item) => item.fmaId === fmaId));
    const scope = api.bodyStudyScope(changed, 'pelvis', 'both');
    assert.deepEqual(api.stageStructures(scope, api.dissectionProfiles.pelvis, 'free', id), []);
    assert.equal(api.studyLibraryAction(scope, api.dissectionProfiles.pelvis, `focus:${id}`, false), null);
    guardRejections++;
  }
  const duplicated = structuredClone(catalog);
  duplicated.structures.push(structuredClone(duplicated.structures.find((item) => item.fmaId === fmaId)));
  assert.deepEqual(
    api.stageStructures(api.bodyStudyScope(duplicated, 'pelvis', 'both'), api.dissectionProfiles.pelvis, 'free', id),
    [],
  );
  guardRejections++;
}
let missingRequiredRejected = 0;
for (const fmaId of requiredFmas) {
  const changed = structuredClone(catalog);
  changed.structures = changed.structures.filter((item) => item.fmaId !== fmaId);
  assert.deepEqual(
    api.stageStructures(api.bodyStudyScope(changed, 'pelvis', 'both'), api.dissectionProfiles.pelvis, 'free', id),
    [],
  );
  missingRequiredRejected++;
}
let missingOptionalAllowed = 0;
for (const fmaId of contextFmas) {
  const changed = structuredClone(catalog);
  changed.structures = changed.structures.filter((item) => item.fmaId !== fmaId);
  const visible = api.stageStructures(
    api.bodyStudyScope(changed, 'pelvis', 'both'),
    api.dissectionProfiles.pelvis,
    'free',
    id,
  );
  assert.equal(visible.length, 5);
  assert.deepEqual(fmas(visible), allFmas.filter((item) => item !== fmaId).sort());
  missingOptionalAllowed++;
}

let unavailableMembershipCases = 0;
const rejectUnavailableMembership = (mutate) => {
  const changed = structuredClone(catalog);
  mutate(changed);
  const scope = api.bodyStudyScope(changed, 'pelvis', 'both');
  const profile = api.dissectionProfiles.pelvis;
  const state = api.dissectionReducer(api.initialDissection, {
    type: 'focus',
    id,
  });
  const card = api
    .studyLibrary(scope, profile)
    .find((item) => item.key === `focus:${id}`);
  assert(card);
  assert.equal(card.recipes[0].available, false);
  assert.deepEqual(card.recipes[0].visible, []);
  assert.deepEqual(card.recipes[0].targets, []);
  const guide = api.dissectionGuidance(
    scope,
    profile,
    state,
    [],
    [],
    [],
    [],
  );
  assert.deepEqual(guide.expected, []);
  assert.deepEqual(guide.targets, []);
  assert.deepEqual(guide.context, []);
  assert.deepEqual(guide.members, []);
  assert.equal(api.guidanceRecipeAction(guide, 'recipe', false), null);
  unavailableMembershipCases++;
};
rejectUnavailableMembership((changed) => {
  changed.structures = changed.structures.filter(
    (item) => item.fmaId !== requiredFmas[0],
  );
});
rejectUnavailableMembership((changed) => {
  changed.structures.find((item) => item.fmaId === requiredFmas[1]).sources[0].sha256 =
    '0'.repeat(64);
});
rejectUnavailableMembership((changed) => {
  changed.structures.find((item) => item.fmaId === contextFmas[0]).bounds.min[0] +=
    0.01;
});

const clonedCatalog = structuredClone(catalog);
const clonedFocus = structuredClone(focus);
api.stageStructures(
  api.bodyStudyScope(clonedCatalog, 'pelvis', 'both'),
  api.dissectionProfiles.pelvis,
  'free',
  id,
);
assert.equal(JSON.stringify(catalog), catalogBefore);
assert.deepEqual(focus, clonedFocus);

const profileHash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(profileHash(api.dissectionProfiles), pelvicUrethralRecipeRevision);
const previousProfiles = prePelvicUrethralProfiles(api.dissectionProfiles);
assert.equal(profileHash(previousProfiles), pelvicUrethralRecipeBaseline);
assert.equal(
  prePelvicUrethralProfiles(previousProfiles),
  previousProfiles,
  'The exact baseline is an idempotent history state',
);
for (const [region, profile] of Object.entries(api.dissectionProfiles)) {
  if (!containingProfiles.includes(region)) {
    assert.deepEqual(previousProfiles[region], profile);
    continue;
  }
  assert.deepEqual(
    previousProfiles[region].focuses,
    profile.focuses.filter((item) => item.id !== id),
    `${region} differs only by the exact recorded focus`,
  );
  assert.deepEqual(
    { ...previousProfiles[region], focuses: profile.focuses },
    profile,
    `${region} has no non-focus recipe drift`,
  );
}
let historyRejections = 0;
const rejectHistory = (mutate) => {
  const changed = structuredClone(api.dissectionProfiles);
  mutate(changed);
  assert.throws(
    () => prePelvicUrethralProfiles(changed),
    /Unrecorded pelvic urethral recipe change|Expected values to be strictly equal/,
  );
  historyRejections++;
};
for (const region of containingProfiles) {
  rejectHistory((profiles) => {
    profiles[region].focuses.find((item) => item.id === id).title += ' changed';
  });
  rejectHistory((profiles) => {
    profiles[region].focuses = profiles[region].focuses.filter(
      (item) => item.id !== id,
    );
  });
  rejectHistory((profiles) => {
    profiles[region].focuses.push(
      structuredClone(profiles[region].focuses.find((item) => item.id === id)),
    );
  });
  rejectHistory((profiles) => {
    profiles[region].focuses.find((item) => item.id === id).id += '-renamed';
  });
}
const unrelatedRegion = Object.keys(api.dissectionProfiles).find(
  (region) => !containingProfiles.includes(region),
);
assert(unrelatedRegion);
rejectHistory((profiles) => {
  profiles[unrelatedRegion].title += ' unrelated drift';
});

const report = {
  passed: true,
  sourceRecords: 6,
  requiredSources: 4,
  optionalSideContextSources: 2,
  regions: containingProfiles,
  sideCounts: { both: 6, left: 5, right: 5 },
  targetCount: 2,
  scopes,
  libraryPreviews: previews,
  focusedDeepLinks: focusedLinks,
  plainDeepLinks: plainLinks,
  navigationViews,
  identityGuardRejections: guardRejections,
  missingRequiredRejected,
  missingOptionalAllowed,
  unavailableMembershipCases,
  emptyScopeRejected: true,
  missingWholeSourceRejected: true,
  sourceAssetHashAndNodeVerified: true,
  inputAndDefinitionsUnchanged: true,
  historyBaselineHash: pelvicUrethralRecipeBaseline,
  historyRevisionHash: pelvicUrethralRecipeRevision,
  strictHistoryStates: 2,
  strictHistoryRejections: historyRejections,
  previousRecipesRetained: true,
  patientDataUsed: false,
  browserTesting: false,
  clinicalApproval: false,
  limitations:
    'Software validation of source-pinned display and navigation only. This is not browser/device testing, patient registration, clinical validation or radiologist approval.',
};
await writeFile(
  'docs/pelvic-urethral-study-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
