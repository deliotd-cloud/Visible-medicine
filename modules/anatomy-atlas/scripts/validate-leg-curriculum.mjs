import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeLeg } from './leg-curriculum-transition.mjs';
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
const before = await readContentJson('content/leg-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeLeg(context);
const copy = (a) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      api.contentTabs.map((t) => [t, a.bodyContent(s, t)]),
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
  'Five pinned transitions preserve original baseline',
);
const definitions = api.legMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
same(definitions.length, 14);
same(ids.length, 28);
same(new Set(ids).size, 28);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same([...ids].sort(compare), before.entries.map((s) => s.fmaId).sort(compare));
same(definitions.filter((l) => l.representation === 'head').length, 2);
for (const l of definitions) {
  same(l.fmaIds.length, 2);
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].trim().length > 8);
  check(l.references.length > 0);
  for (const url of l.references) same(new URL(url).protocol, 'https:');
  same(
    l.motorSupply,
    l.compartment === 'Anterior'
      ? 'Deep fibular (peroneal) nerve.'
      : l.compartment === 'Lateral'
        ? 'Superficial fibular (peroneal) nerve.'
        : 'Tibial nerve.',
  );
  for (const fma of l.fmaIds) {
    const s = catalog.structures.find((s) => s.fmaId === fma);
    check(s);
    same(s.sources.length, 1);
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.legMuscleLesson(s, t);
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
      if (l.caution) check(lesson.note.includes(l.caution));
      same(
        api
          .legMuscleLesson({ ...s, coverageNote: 'Test source limitation' }, t)
          .note.endsWith('Test source limitation'),
        true,
      );
      same(lesson.citations, l.references);
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(s.fmaId)));
        check(lesson.bullets[0].includes(l.compartment));
        if (l.representation === 'head')
          check(lesson.body.includes('not the whole muscle'));
      } else check(lesson.bullets[1].includes('not rendered'));
      const unchanged = structuredClone(lesson);
      lesson.citations.push('mutation');
      lesson.bullets.push('mutation');
      same(api.bodyLesson(s, t), unchanged, 'Fresh arrays for every lesson');
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
    for (const t of api.contentTabs) same(api.legMuscleLesson(s, t), undefined);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
const fixture = entry('FMA22548');
for (const change of [
  { system: 'nerves' },
  { regions: ['hand'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.legMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const lesson = (key) => definitions.find((l) => l.key === key);
same(lesson('gastrocnemius-medial-head').fmaIds, ['FMA45957', 'FMA45958']);
same(lesson('gastrocnemius-lateral-head').fmaIds, ['FMA45960', 'FMA45961']);
check(lesson('gastrocnemius-medial-head').origin.includes('medial'));
check(lesson('gastrocnemius-lateral-head').origin.includes('lateral'));
for (const key of ['gastrocnemius-medial-head', 'gastrocnemius-lateral-head']) {
  check(lesson(key).action.includes('crosses both joints'));
  same(lesson(key).insertion, lesson('soleus').insertion);
}
check(lesson('soleus').action.includes('does not cross the knee'));
check(lesson('popliteus').action.includes('free tibia'));
check(lesson('popliteus').action.includes('fixed tibia'));
check(lesson('popliteus').action.includes('does not act across the ankle'));
same(lesson('fibularis-tertius').compartment, 'Anterior');
check(lesson('plantaris').caution.includes('can be absent'));
check(lesson('plantaris').caution.includes('not a nerve'));
check(
  lesson('tibialis-posterior').caution.includes('not a single navicular point'),
);
check(lesson('fibularis-longus').insertion.includes('first-metatarsal'));
check(lesson('fibularis-brevis').insertion.includes('metatarsal 5'));
check(
  lesson('flexor-digitorum-longus').insertion.includes(
    'distal phalanges of toes 2–5',
  ),
);
check(
  lesson('extensor-digitorum-longus').insertion.includes('middle and distal'),
);
const negatives = [
  [fixture, 'function', 'body'],
  [fixture, 'anatomy', 'readiness'],
  ...['FMA22452', 'FMA37396', 'FMA38479', 'FMA13398'].map((fma) => [
    entry(fma),
    'function',
    'body',
  ]),
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
const counts = (t, scope = catalog.structures) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        scope.filter((s) => api.bodyLesson(s, t).readiness === r).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 371,
  'identity-only': 651,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 427,
  'identity-only': 146,
  pending: 449,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('leg') &&
      api.bodyLesson(s, 'function').readiness !== 'draft',
  ).length,
  0,
);
const regional = catalog.structures.filter((s) => s.regions.includes('leg'));
const report = {
  passed: true,
  checks,
  lessonDefinitions: 14,
  bodyRepresentations: 28,
  authoredSections: 56,
  combinedPinnedCurriculumSections: 352,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  legReadiness: {
    entries: regional.length,
    anatomy: counts('anatomy', regional),
    function: counts('function', regional),
  },
  negativeCases: negatives.length,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software checks for exact identities, heads, display/export, source warnings and preservation; not medical accuracy, tendon/nerve mapping, clinical completeness or device acceptance.',
};
await writeFile(
  new URL('docs/leg-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
