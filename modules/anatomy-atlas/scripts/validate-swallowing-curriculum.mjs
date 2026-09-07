import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeSwallowing } from './swallowing-curriculum-transition.mjs';
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
  'content/swallowing-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeSwallowing(context);
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
  'Nine pinned transitions preserve original baseline',
);
const definitions = api.swallowingMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
same(definitions.length, 14);
same(ids.length, 27);
same(new Set(ids).size, 27);
// Independent identity/component/motor expectations, not derived from lessons.
const expected = {
  digastric: [
    'FMA46293',
    'FMA46292',
    'FJ1555,FJ1560,FJ1578',
    'FJ1556,FJ1579',
    'CN VII',
  ],
  mylohyoid: ['FMA46322', 'FMA46321', 'FJ1562', 'FJ1583', 'V3'],
  geniohyoid: ['FMA46327', 'FMA46326', 'FJ1559', 'FJ1580', 'C1'],
  stylohyoid: ['FMA45827', 'FMA45826', 'FJ1576', 'FJ1598', 'CN VII'],
  omohyoid: ['FMA13349', 'FMA13348', 'FJ1565', 'FJ1586', 'Ansa cervicalis'],
  sternohyoid: ['FMA13347', 'FMA13346', 'FJ1574', 'FJ1596', 'Ansa cervicalis'],
  sternothyroid: [
    'FMA13351',
    'FMA13350',
    'FJ1575',
    'FJ1597',
    'Ansa cervicalis',
  ],
  thyrohyoid: ['FMA13353', 'FMA13352', 'FJ1577', 'FJ1599', 'C1'],
  genioglossus: ['FMA46702', 'FMA46698', 'FJ2738', 'FJ2750', 'CN XII'],
  hyoglossus: ['FMA46704', 'FMA46703', 'FJ2739', 'FJ2751', 'CN XII'],
  'levator-veli-palatini': ['FMA46729', 'FMA46728', 'FJ2741', 'FJ2753', 'CN X'],
  'tensor-veli-palatini': ['FMA46732', 'FMA46731', 'FJ2748', 'FJ2760', 'V3'],
  'uvular-muscle': ['FMA46733', null, 'FJ2762', null, 'CN X'],
  'thyro-arytenoid': [
    'FMA46590',
    'FMA46589',
    'FJ2784,FJ2785',
    'FJ2802,FJ2803',
    'CN X',
  ],
};
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const l of definitions) {
  same(l.fmaIds, expected[l.key].slice(0, l.key === 'uvular-muscle' ? 1 : 2));
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].length > 8);
  check(l.motorSupply.includes(expected[l.key][4]));
  for (const [i, fma] of l.fmaIds.entries()) {
    const s = entry(fma);
    same(
      s.laterality,
      l.key === 'uvular-muscle' ? 'midline' : i === 0 ? 'left' : 'right',
    );
    same(
      s.sources.map((p) => p.file),
      expected[l.key][i + 2].split(','),
    );
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.swallowingMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t));
      same(JSON.parse(JSON.stringify(lesson)), exported.content[t]);
      same(lesson.readiness, 'draft');
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      check(lesson.note.includes('does not simulate swallowing'));
      if (l.caution) check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
      check(
        api
          .swallowingMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
          .note.endsWith('Source warning'),
      );
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(fma)));
        same(lesson.body.includes('grouped source'), Boolean(l.representation));
      } else check(lesson.bullets[1].includes('does not map'));
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
      same(api.swallowingMuscleLesson(s, t), undefined);
const fixture = entry('FMA46293');
for (const change of [
  { system: 'nerves' },
  { regions: ['shoulder'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(
    api.swallowingMuscleLesson({ ...fixture, ...change }, 'anatomy'),
    undefined,
  );
const lesson = (key) => definitions.find((l) => l.key === key);
check(lesson('digastric').motorSupply.includes('V3'));
check(lesson('digastric').caution.includes('File counts are not belly counts'));
check(lesson('digastric').insertion.includes('fibrous sling'));
for (const key of ['geniohyoid', 'thyrohyoid']) {
  check(
    lesson(key).motorSupply.includes(
      'not motor fibres originating in the hypoglossal nucleus',
    ),
  );
  check(!lesson(key).motorSupply.includes('Ansa cervicalis'));
}
check(lesson('geniohyoid').origin.includes('Inferior mental'));
check(lesson('genioglossus').origin.includes('Superior mental'));
check(lesson('omohyoid').origin.includes('scapula'));
check(lesson('omohyoid').caution.includes('two bellies'));
check(lesson('sternothyroid').insertion.includes('thyroid cartilage'));
check(lesson('thyrohyoid').action.includes('when the hyoid is fixed'));
check(lesson('hyoglossus').caution.includes('extrinsic tongue'));
check(lesson('tensor-veli-palatini').insertion.includes('hamulus'));
check(lesson('tensor-veli-palatini').motorSupply.includes('medial pterygoid'));
check(
  lesson('levator-veli-palatini').caution.includes('source-specific review'),
);
check(lesson('thyro-arytenoid').motorSupply.includes('Recurrent laryngeal'));
check(
  lesson('thyro-arytenoid').caution.includes(
    'not independently validated vocalis',
  ),
);
same(lesson('uvular-muscle').representation, 'midline-group');
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
  draft: 451,
  'identity-only': 571,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 506,
  'identity-only': 146,
  pending: 370,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('head-neck') &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  14,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 14,
  bodyRepresentations: 27,
  authoredSections: 54,
  combinedPinnedCurriculumSections: 512,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  pendingHeadNeckMuscleFunctions: 14,
  negativeCases: negatives.length,
  sourceIndexChecks,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software and optional source-index checks, not individual belly/tendon/vocal-fold adjudication, measured attachments, swallowing/voice simulation or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/swallowing-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
