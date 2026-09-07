import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeHand } from './hand-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (v, label) => {
  checks++;
  assert(v, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson('content/hand-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeHand(context);
const copy = (authoring) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      api.contentTabs.map((t) => [t, authoring.bodyContent(s, t)]),
    ),
  })),
  shoulder: api.structures,
  dissectionProfiles: api.dissectionProfiles,
});
same(
  curriculumHash(copy(previous)),
  before.copyAndRecipeHash,
  'Every unrelated section and recipe preserved',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'All three transitions preserve original baseline',
);
same(api.handMuscleLessons.length, 10);
const ids = api.handMuscleLessons.flatMap((l) => l.fmaIds);
same(ids.length, 20);
same(new Set(ids).size, 20);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same([...ids].sort(compare), before.entries.map((s) => s.fmaId).sort(compare));
same(
  api.handMuscleLessons.filter((l) => l.representation === 'head').length,
  2,
);
same(
  api.handMuscleLessons.filter((l) => l.representation === 'group').length,
  3,
);
same(
  before.entries.filter((e) => e.sections.anatomy.readiness === 'identity-only')
    .length,
  20,
);
same(
  before.entries.filter((e) => e.sections.function.readiness === 'draft')
    .length,
  6,
);
same(
  before.entries.filter((e) => e.sections.function.readiness === 'pending')
    .length,
  14,
);
for (const l of api.handMuscleLessons) {
  same(l.fmaIds.length, 2);
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].trim().length > 8);
  check(l.references.length > 0);
  for (const url of l.references) same(new URL(url).protocol, 'https:');
  for (const fma of l.fmaIds) {
    const s = catalog.structures.find((s) => s.fmaId === fma);
    check(s);
    same(
      s.sources.length,
      1,
      'Retain source component count; a group is not separate slips',
    );
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.handMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t), 'Actual runtime routing');
      same(lesson.readiness, 'draft');
      same(
        JSON.parse(JSON.stringify(lesson)),
        exported.content[t],
        'Actual exporter parity',
      );
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      if (s.coverageNote) check(lesson.note.includes(s.coverageNote));
      if (l.caution) check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(s.fmaId)));
        if (l.representation === 'group')
          check(lesson.body.includes('not individually numbered'));
        if (l.representation === 'head')
          check(lesson.body.includes('not the whole muscle'));
      } else check(lesson.bullets[1].includes('not rendered'));
      const unchanged = structuredClone(lesson);
      lesson.citations.push('mutation');
      lesson.bullets.push('mutation');
      same(api.bodyLesson(s, t), unchanged);
    }
    same(exported.validation.clinicalApproval, 'not-included');
    same(exported.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
  }
}
for (const s of catalog.structures)
  if (!ids.includes(s.fmaId))
    for (const t of api.contentTabs)
      same(api.handMuscleLesson(s, t), undefined);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
const fixture = entry('FMA37396');
for (const change of [
  { system: 'nerves' },
  { regions: ['forearm'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.handMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const lesson = (key) => api.handMuscleLessons.find((l) => l.key === key);
same(lesson('adductor-pollicis-oblique-head').fmaIds, ['FMA46121', 'FMA46122']);
same(lesson('adductor-pollicis-transverse-head').fmaIds, [
  'FMA46123',
  'FMA46124',
]);
check(lesson('adductor-pollicis-oblique-head').origin.includes('bases'));
check(lesson('adductor-pollicis-transverse-head').origin.includes('shaft'));
check(lesson('opponens-digiti-minimi').insertion.includes('fifth metacarpal'));
check(lesson('opponens-pollicis').insertion.includes('first metacarpal'));
check(
  lesson('lumbrical-group').motorSupply.includes(
    'median nerve for lumbricals 1–2',
  ),
);
check(
  lesson('lumbrical-group').motorSupply.includes('deep ulnar branch for 3–4'),
);
check(
  lesson('palmar-interosseous-group').caution.includes(
    'Neither its presence nor an individual muscle count',
  ),
);
check(lesson('dorsal-interosseous-group').action.includes('fingers 2–4'));
same(
  api.handMuscleLesson(
    { ...fixture, fmaId: 'FMA37388', name: 'Flexor pollicis brevis' },
    'anatomy',
  ),
  undefined,
  'Missing/held thumb source is not admitted by name',
);
const negatives = [
  [fixture, 'function', 'body'],
  [fixture, 'anatomy', 'readiness'],
  [entry('FMA38479'), 'function', 'body'],
  [entry('FMA13398'), 'function', 'body'],
  [fixture, 'ct', 'body'],
  [catalog.structures.find((s) => s.system === 'skeleton'), 'anatomy', 'body'],
];
for (const [s, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (candidate, tab) =>
      candidate.id === s.id && tab === t
        ? { ...api.bodyLesson(candidate, tab), [field]: 'unrecorded' }
        : api.bodyLesson(candidate, tab),
    bodyContent: (candidate, tab) =>
      candidate.id === s.id && tab === t && field === 'body'
        ? { ...api.bodyContent(candidate, tab), body: 'unrecorded' }
        : api.bodyContent(candidate, tab),
  };
  await assert.rejects(async () =>
    assert.equal(
      curriculumHash(
        await copyBeforeShoulderArmCurriculum({ ...context, api: changed }),
      ),
      baseline.copyAndRecipeHash,
    ),
  );
  checks++;
}
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter((s) => api.bodyLesson(s, t).readiness === r)
          .length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 289,
  'identity-only': 733,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 345,
  'identity-only': 146,
  pending: 531,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('hand') &&
      api.bodyLesson(s, 'function').readiness !== 'draft',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 10,
  bodyRepresentations: 20,
  authoredSections: 40,
  newlyDraftSections: 34,
  enrichedPriorDrafts: 6,
  combinedPinnedCurriculumSections: 188,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  negativeCases: negatives.length,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software evidence for exact identities, groups, source-bound display/export, preservation and rejection cases; not anatomical accuracy, tendon-slip segmentation, variant/nerve mapping or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/hand-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
