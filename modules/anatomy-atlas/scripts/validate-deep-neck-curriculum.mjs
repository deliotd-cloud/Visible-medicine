import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeDeepNeck } from './deep-neck-curriculum-transition.mjs';
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
const before = await readContentJson(
  'content/deep-neck-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeDeepNeck(context);
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
  'All unrelated topics and recipes preserved',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'Eleven pinned transitions preserve original baseline',
);
const definitions = api.deepNeckMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
same(definitions.length, 14);
same(ids.length, 28);
same(new Set(ids).size, 28);
// Independent identity/component/motor expectations, not derived from lessons.
const expected = {
  'iliocostalis-cervicis': [
    'FMA22745',
    'FMA22744',
    'FJ1526M',
    'FJ1526',
    'posterior rami',
  ],
  'longissimus-capitis': [
    'FMA22756',
    'FMA22754',
    'FJ1533M',
    'FJ1533',
    'posterior rami',
  ],
  'longissimus-cervicis': [
    'FMA22758',
    'FMA22757',
    'FJ1534M',
    'FJ1534',
    'posterior rami',
  ],
  'semispinalis-capitis': [
    'FMA22877',
    'FMA22876',
    'FJ1538M',
    'FJ1538',
    'C2 and C3',
  ],
  'semispinalis-cervicis': [
    'FMA22875',
    'FMA22874',
    'FJ1539M',
    'FJ1539',
    'posterior rami',
  ],
  'splenius-capitis': [
    'FMA22729',
    'FMA22728',
    'FJ1545M',
    'FJ1545',
    'posterior rami',
  ],
  'splenius-cervicis': [
    'FMA22727',
    'FMA22726',
    'FJ1546M',
    'FJ1546',
    'posterior rami',
  ],
  'longus-capitis': ['FMA46310', 'FMA46309', 'FJ1561', 'FJ1582', 'C1–C3'],
  'obliquus-capitis-inferior': [
    'FMA32537',
    'FMA32536',
    'FJ1563',
    'FJ1584',
    'posterior ramus of C1',
  ],
  'obliquus-capitis-superior': [
    'FMA32535',
    'FMA32534',
    'FJ1564',
    'FJ1585',
    'posterior ramus of C1',
  ],
  'rectus-capitis-anterior': [
    'FMA46314',
    'FMA46313',
    'FJ1566',
    'FJ1588',
    'anterior rami',
  ],
  'rectus-capitis-posterior-major': [
    'FMA32531',
    'FMA32530',
    'FJ1567',
    'FJ1589',
    'posterior ramus of C1',
  ],
  'rectus-capitis-posterior-minor': [
    'FMA32533',
    'FMA32532',
    'FJ1568',
    'FJ1590',
    'posterior ramus of C1',
  ],
  'rectus-capitis-lateralis': [
    'FMA46318',
    'FMA46317',
    'FJ1569',
    'FJ1591',
    'anterior rami',
  ],
};
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const l of definitions) {
  same(l.fmaIds, expected[l.key].slice(0, 2));
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].length > 8);
  check(l.motorSupply.includes(expected[l.key][4]));
  for (const [i, fma] of l.fmaIds.entries()) {
    const s = entry(fma);
    same(s.laterality, i === 0 ? 'left' : 'right');
    same(
      s.sources.map((p) => p.file),
      expected[l.key][i + 2].split(','),
    );
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.deepNeckMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t));
      same(JSON.parse(JSON.stringify(lesson)), exported.content[t]);
      same(lesson.readiness, 'draft');
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      check(lesson.note.includes('do not simulate muscle contraction'));
      if (l.caution) check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
      check(
        api
          .deepNeckMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
          .note.endsWith('Source warning'),
      );
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(fma)));
        check(lesson.body.includes('not measured footprints'));
      } else check(lesson.bullets[1].includes('not validated nerve courses'));
      const original = structuredClone(lesson);
      lesson.bullets.push('mutation');
      lesson.citations.push('mutation');
      same(api.bodyLesson(s, t), original, 'Detached arrays');
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
      same(api.deepNeckMuscleLesson(s, t), undefined);
const fixture = entry('FMA32531');
for (const change of [
  { system: 'nerves' },
  { regions: ['shoulder'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(
    api.deepNeckMuscleLesson({ ...fixture, ...change }, 'anatomy'),
    undefined,
  );
const lesson = (key) => definitions.find((l) => l.key === key);
for (const key of [
  'longus-capitis',
  'rectus-capitis-anterior',
  'rectus-capitis-lateralis',
])
  check(lesson(key).motorSupply.includes('anterior rami'));
check(
  lesson('rectus-capitis-anterior').insertion.includes(
    'anterior to its condyle',
  ),
);
check(lesson('rectus-capitis-lateralis').insertion.includes('jugular process'));
check(
  lesson('rectus-capitis-posterior-minor').caution.includes(
    'not one of the three muscle borders',
  ),
);
check(lesson('obliquus-capitis-inferior').origin.includes('C2'));
check(lesson('obliquus-capitis-inferior').insertion.includes('C1'));
check(
  lesson('obliquus-capitis-inferior').insertion.includes('no skull attachment'),
);
check(lesson('obliquus-capitis-superior').insertion.includes('Occipital bone'));
for (const key of ['semispinalis-capitis', 'semispinalis-cervicis'])
  check(lesson(key).action.includes('opposite-side rotation'));
check(lesson('splenius-capitis').action.includes('towards itself'));
check(lesson('splenius-cervicis').action.includes('towards itself'));
check(lesson('longissimus-capitis').action.includes('same-side'));
check(
  lesson('longissimus-capitis').origin.includes('need source-specific review'),
);
check(lesson('iliocostalis-cervicis').origin.includes('ribs 3–6'));
check(
  lesson('iliocostalis-cervicis').caution.includes(
    'not directly on the iliac crest',
  ),
);
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rows = (
    await readFile(
      new URL('../../work/bodyparts3d/isa_element_parts.txt', import.meta.url),
      'utf8',
    )
  )
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split('\t'));
  for (const fma of ids) {
    const s = entry(fma);
    same(
      rows.filter((row) => row[0] === fma).map((row) => [row[1], row[2]]),
      s.sources.map((p) => [s.name.toLowerCase(), p.file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  [fixture, 'function', 'body'],
  [fixture, 'anatomy', 'readiness'],
  [entry('FMA19728'), 'function', 'readiness'],
  [fixture, 'ct', 'body'],
  ...[
    'FMA13409',
    'FMA46293',
    'FMA49045',
    'FMA37717',
    'FMA22548',
    'FMA22452',
    'FMA37396',
    'FMA38479',
    'FMA13398',
  ].map((fma) => [entry(fma), 'function', 'body']),
  [catalog.structures.find((s) => s.system === 'skeleton'), 'anatomy', 'body'],
];
for (const [s, t, field] of negatives) {
  check(s);
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
  draft: 493,
  'identity-only': 529,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 548,
  'identity-only': 146,
  pending: 328,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('head-neck') &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 14,
  bodyRepresentations: 28,
  authoredSections: 56,
  combinedPinnedCurriculumSections: 596,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  pendingHeadNeckMuscleFunctions: 0,
  negativeCases: negatives.length,
  sourceIndexChecks,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software and optional source-index checks, not segmental slip/nerve validation, measured attachments, joint mechanics, complete neck curriculum or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/deep-neck-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
