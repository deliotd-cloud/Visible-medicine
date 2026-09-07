import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeThigh } from './thigh-curriculum-transition.mjs';
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
const before = await readContentJson('content/thigh-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeThigh(context);
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
  'Four pinned transitions preserve original baseline',
);
same(api.thighMuscleLessons.length, 27);
const ids = api.thighMuscleLessons.flatMap((l) => l.fmaIds);
same(ids.length, 54);
same(new Set(ids).size, 54);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same([...ids].sort(compare), before.entries.map((s) => s.fmaId).sort(compare));
same(
  api.thighMuscleLessons.filter((l) => l.representation === 'head').length,
  2,
);
same(
  api.thighMuscleLessons.filter((l) => l.representation === 'portion').length,
  1,
);
for (const l of api.thighMuscleLessons) {
  same(l.fmaIds.length, 2);
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].trim().length > 8);
  check(l.references.length > 0);
  for (const url of l.references) same(new URL(url).protocol, 'https:');
  for (const fma of l.fmaIds) {
    const s = catalog.structures.find((s) => s.fmaId === fma);
    check(s);
    same(s.sources.length, 1);
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.thighMuscleLesson(s, t);
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
        if (l.representation === 'head')
          check(lesson.body.includes('not the whole muscle'));
        if (l.representation === 'portion')
          check(lesson.body.includes('variably separate'));
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
      same(api.thighMuscleLesson(s, t), undefined);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
const fixture = entry('FMA22452');
for (const change of [
  { system: 'nerves' },
  { regions: ['hand'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.thighMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const lesson = (key) => api.thighMuscleLessons.find((l) => l.key === key);
same(
  lesson('adductor-brevis').fmaIds,
  ['FMA22452', 'FMA22454'],
  'Left identity is not right + 1',
);
same(lesson('biceps-femoris-short-head').fmaIds, ['FMA45891', 'FMA45892']);
check(
  lesson('biceps-femoris-short-head').action.includes(
    'does not cross or extend the hip',
  ),
);
check(
  lesson('biceps-femoris-short-head').motorSupply.includes('Common fibular'),
);
check(lesson('biceps-femoris-long-head').motorSupply.startsWith('Tibial'));
check(lesson('adductor-magnus').motorSupply.includes('overlapping supply'));
check(lesson('adductor-minimus').caution.includes('variable separation'));
same(lesson('gemellus-superior').motorSupply, 'Nerve to obturator internus.');
same(lesson('gemellus-inferior').motorSupply, 'Nerve to quadratus femoris.');
check(
  lesson('obturator-internus').motorSupply.includes('not the obturator nerve'),
);
check(lesson('iliacus').motorSupply === 'Femoral nerve.');
check(
  lesson('psoas-major').motorSupply.includes(
    'Direct branches of lumbar anterior rami',
  ),
);
check(lesson('pectineus').motorSupply.includes('additional obturator supply'));
for (const key of [
  'vastus-medialis',
  'vastus-lateralis',
  'vastus-intermedius',
]) {
  check(lesson(key).action.includes('does not cross the hip'));
  check(lesson(key).insertion.includes('patellar ligament'));
}
check(lesson('rectus-femoris').action.includes('crosses both joints'));
check(lesson('tensor-fasciae-latae').caution.includes('fascial continuation'));
check(lesson('gluteus-minimus').origin.includes('anterior and inferior'));
check(lesson('gluteus-medius').origin.includes('anterior and posterior'));
check(lesson('semimembranosus').insertion.includes('medial tibial condyle'));
for (const key of ['sartorius', 'gracilis', 'semitendinosus'])
  check(lesson(key).insertion.includes('pes anserinus'));
const negatives = [
  [fixture, 'function', 'body'],
  [fixture, 'anatomy', 'readiness'],
  [entry('FMA37396'), 'function', 'body'],
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
  draft: 343,
  'identity-only': 679,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 399,
  'identity-only': 146,
  pending: 477,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('thigh') &&
      api.bodyLesson(s, 'function').readiness !== 'draft',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 27,
  bodyRepresentations: 54,
  authoredSections: 108,
  combinedPinnedCurriculumSections: 296,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  negativeCases: negatives.length,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software checks for exact identities, heads/portions, display/export and preservation. Not anatomical accuracy, attachment/nerve territory mapping, medical completeness or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/thigh-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
