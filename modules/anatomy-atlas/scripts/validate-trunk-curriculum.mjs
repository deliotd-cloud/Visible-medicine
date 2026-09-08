import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeTrunk } from './trunk-curriculum-transition.mjs';
import { authoringBeforeOrbitalNerve } from './orbital-nerve-curriculum-transition.mjs';
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
const before = await readContentJson('content/trunk-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeTrunk(context);
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
  'Twelve pinned transitions preserve original baseline',
);
const definitions = api.trunkMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
same(definitions.length, 23);
same(ids.length, 38);
same(new Set(ids).size, 38);
// Independent identity/component/motor expectations, not derived from lessons.
const expected = {
  'external-intercostal': [
    ['FMA9756', 'midline', 'FJ1451,FJ1451M'],
    'thorax',
    'isa',
  ],
  'internal-intercostal': [
    ['FMA9757', 'midline', 'FJ1455,FJ1455M'],
    'thorax',
    'isa',
  ],
  'innermost-intercostal': [
    ['FMA9758', 'midline', 'FJ1454,FJ1454M'],
    'thorax',
    'isa',
  ],
  'external-oblique': [
    ['FMA13337', 'left', 'FJ1452M'],
    ['FMA13336', 'right', 'FJ1452'],
    'abdomen',
    'isa',
  ],
  'pectoralis-minor': [
    ['FMA13376', 'left', 'FJ1456M'],
    ['FMA13375', 'right', 'FJ1456'],
    'thorax',
    'isa',
  ],
  'pectoralis-major': [
    ['FMA13374', 'left', 'FJ1446M,FJ1464M'],
    ['FMA13373', 'right', 'FJ1446,FJ1464'],
    'thorax',
    'partof',
  ],
  'transversus-thoracis': [
    ['FMA9762', 'left', 'FJ1461M'],
    ['FMA9761', 'right', 'FJ1461'],
    'thorax',
    'isa',
  ],
  diaphragm: [['FMA13295', 'midline', 'FJ3131'], 'thorax', 'isa'],
  'trapezius-ascending': [
    ['FMA33583', 'left', 'FJ1520M'],
    ['FMA33581', 'right', 'FJ1520'],
    'spine',
    'isa',
  ],
  'trapezius-transverse': [
    ['FMA33585', 'left', 'FJ1554M'],
    ['FMA33584', 'right', 'FJ1554'],
    'spine',
    'isa',
  ],
  'trapezius-descending': [
    ['FMA33587', 'left', 'FJ1521M'],
    ['FMA33586', 'right', 'FJ1521'],
    'spine',
    'isa',
  ],
  'lumbar-rotator': [
    ['FMA23090', 'left', 'FJ1522M'],
    ['FMA23089', 'right', 'FJ1522'],
    'spine',
    'isa',
  ],
  'thoracic-rotator': [
    ['FMA23083', 'midline', 'FJ1525,FJ1525M'],
    'spine',
    'isa',
  ],
  'iliocostalis-lumborum': [
    ['FMA22741', 'left', 'FJ1527M'],
    ['FMA22740', 'right', 'FJ1527'],
    'spine',
    'isa',
  ],
  'iliocostalis-thoracis': [
    ['FMA22743', 'left', 'FJ1528M'],
    ['FMA22742', 'right', 'FJ1528'],
    'spine',
    'isa',
  ],
  'longissimus-thoracis': [
    ['FMA22753', 'left', 'FJ1535M'],
    ['FMA22751', 'right', 'FJ1535'],
    'spine',
    'isa',
  ],
  'semispinalis-thoracis': [
    ['FMA22873', 'left', 'FJ1540M'],
    ['FMA22872', 'right', 'FJ1540'],
    'spine',
    'isa',
  ],
  'serratus-posterior-inferior': [
    ['FMA13406', 'left', 'FJ1541M'],
    ['FMA13405', 'right', 'FJ1541'],
    'spine',
    'isa',
  ],
  'serratus-posterior-superior': [
    ['FMA13404', 'left', 'FJ1542M'],
    ['FMA13403', 'right', 'FJ1542'],
    'spine',
    'isa',
  ],
  spinalis: [
    ['FMA77179', 'midline', 'FJ1543,FJ1543M,FJ1544,FJ1544M'],
    'spine',
    'isa',
  ],
  'lateral-lumbar-intertransversarius': [
    ['FMA22850', 'midline', 'FJ1547,FJ1547M'],
    'spine',
    'isa',
  ],
  'medial-lumbar-intertransversarius': [
    ['FMA22851', 'midline', 'FJ1548,FJ1548M'],
    'spine',
    'isa',
  ],
  'interspinalis-thoracis': [
    ['FMA22891', 'left', 'FJ1551M'],
    ['FMA22890', 'right', 'FJ1551'],
    'spine',
    'isa',
  ],
};
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const l of definitions) {
  const identityRows = expected[l.key].filter(Array.isArray);
  same(
    l.fmaIds,
    identityRows.map((row) => row[0]),
  );
  same(l.region, expected[l.key].at(-2));
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].length > 8);

  for (const [i, fma] of l.fmaIds.entries()) {
    const s = entry(fma);
    same(s.laterality, identityRows[i][1]);
    same(s.sourceTree, expected[l.key].at(-1));
    same(
      api.trunkMuscleLesson(
        {
          ...s,
          regions: ['thorax', 'spine', 'abdomen'].filter(
            (region) => region !== l.region,
          ),
        },
        'function',
      ),
      undefined,
    );
    same(
      s.sources.map((p) => p.file),
      identityRows[i][2].split(','),
    );
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.trunkMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t));
      same(JSON.parse(JSON.stringify(lesson)), exported.content[t]);
      same(lesson.readiness, 'draft');
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      check(lesson.note.includes('do not simulate contraction'));
      if (l.caution) check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
      check(
        api
          .trunkMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
          .note.endsWith('Source warning'),
      );
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(fma)));
        check(lesson.body.includes('measured footprints'));
        same(
          lesson.body.startsWith('Partial source-group'),
          l.representation === 'group',
        );
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
      same(api.trunkMuscleLesson(s, t), undefined);
const fixture = entry('FMA13373');
for (const change of [
  { system: 'nerves' },
  { regions: ['shoulder'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.trunkMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const lesson = (key) => definitions.find((l) => l.key === key);
check(lesson('internal-intercostal').action.includes('interosseous'));
check(
  lesson('internal-intercostal').action.includes('parasternal/interchondral'),
);
check(lesson('internal-intercostal').action.includes('inspiration'));
check(lesson('innermost-intercostal').action.includes('forced expiration'));
check(lesson('external-oblique').action.includes('rotate away'));
check(lesson('pectoralis-minor').insertion.includes('coracoid'));
check(lesson('pectoralis-minor').motorSupply.includes('medial pectoral'));
check(
  lesson('pectoralis-major').caution.includes('clavicular component is absent'),
);
check(!lesson('pectoralis-major').origin.includes('clavicle'));
check(lesson('pectoralis-major').action.includes('already flexed arm'));
check(lesson('diaphragm').motorSupply.includes('Phrenic nerves C3–C5'));
check(lesson('diaphragm').insertion.includes('Central tendon'));
check(lesson('trapezius-ascending').action.includes('depress'));
check(lesson('trapezius-descending').action.includes('elevate'));
check(
  lesson('trapezius-transverse').action.includes(
    'towards the vertebral column',
  ),
);
for (const key of [
  'trapezius-ascending',
  'trapezius-transverse',
  'trapezius-descending',
])
  check(lesson(key).motorSupply.includes('CN XI'));
check(lesson('lumbar-rotator').caution.includes('Do not transfer thoracic'));
check(lesson('thoracic-rotator').insertion.includes('one or two levels'));
check(lesson('semispinalis-thoracis').caution.includes('not on the skull'));
check(lesson('serratus-posterior-superior').motorSupply.includes('T2–T5'));
check(
  lesson('serratus-posterior-inferior').motorSupply.includes(
    'subcostal nerve T12',
  ),
);
for (const key of [
  'serratus-posterior-superior',
  'serratus-posterior-inferior',
])
  check(lesson(key).action.includes('remains debated'));
check(
  lesson('lateral-lumbar-intertransversarius').motorSupply.includes(
    'Anterior rami',
  ),
);
check(
  lesson('medial-lumbar-intertransversarius').motorSupply.includes(
    'Posterior rami',
  ),
);
check(
  lesson('medial-lumbar-intertransversarius').insertion.includes('Mammillary'),
);
check(
  lesson('spinalis').caution.includes(
    'does not justify labelling FJ1543/FJ1543M',
  ),
);
check(lesson('interspinalis-thoracis').caution.includes('sparse and variable'));
same(
  definitions
    .filter((l) => l.representation === 'group')
    .map((l) => l.key)
    .sort(),
  [
    'external-intercostal',
    'internal-intercostal',
    'innermost-intercostal',
    'pectoralis-major',
    'lumbar-rotator',
    'thoracic-rotator',
    'spinalis',
    'lateral-lumbar-intertransversarius',
    'medial-lumbar-intertransversarius',
    'interspinalis-thoracis',
  ].sort(),
);
let sourceIndexChecks = 0;
let sourceComponentChecks = 0;
if (process.argv.includes('--source')) {
  const indexes = {};
  for (const tree of ['isa', 'partof'])
    indexes[tree] = (
      await readFile(
        new URL(
          '../../work/bodyparts3d/' + tree + '_element_parts.txt',
          import.meta.url,
        ),
        'utf8',
      )
    )
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split('\t'));
  for (const fma of ids) {
    const rows = indexes[entry(fma).sourceTree];
    const s = entry(fma);
    same(
      rows.filter((row) => row[0] === fma).map((row) => [row[1], row[2]]),
      s.sources.map((p) => [s.name.toLowerCase(), p.file]),
    );
    sourceIndexChecks++;
  }
  for (const expectedRow of [
    ['FMA45874', 'abdominal part of right pectoralis major', 'FJ1446'],
    ['FMA45875', 'abdominal part of left pectoralis major', 'FJ1446M'],
    ['FMA79979', 'sternocostal part of right pectoralis major', 'FJ1464'],
    ['FMA79980', 'sternocostal part of left pectoralis major', 'FJ1464M'],
    ['FMA22779', 'right spinalis thoracis', 'FJ1544'],
    ['FMA22780', 'left spinalis thoracis', 'FJ1544M'],
  ]) {
    same(
      indexes.isa.filter((row) => row[0] === expectedRow[0]),
      [expectedRow],
    );
    sourceComponentChecks++;
  }
  same(
    indexes.isa.filter(
      (row) =>
        ['FJ1543', 'FJ1543M'].includes(row[2]) &&
        /spinalis (capitis|cervicis)/.test(row[1]),
    ),
    [],
  );
  sourceComponentChecks++;
}
const negatives = [
  [fixture, 'function', 'body'],
  [fixture, 'anatomy', 'readiness'],
  [entry('FMA19728'), 'function', 'readiness'],
  [fixture, 'ct', 'body'],
  ...[
    'FMA32531',
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
const trunkMilestone = await authoringBeforeOrbitalNerve(context);
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter(
          (s) => trunkMilestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 531,
  'identity-only': 491,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 586,
  'identity-only': 146,
  pending: 290,
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
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'muscles' &&
        api.bodyLesson(s, 'function').readiness === 'pending',
    )
    .map((s) => s.fmaId),
  ['FMA19728'],
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 23,
  bodyRepresentations: 38,
  authoredSections: 76,
  combinedPinnedCurriculumSections: 672,
  bodyReadinessAtTrunkMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  pendingMuscleFunctions: 1,
  unresolvedMuscleIdentity: 'FMA19728',
  negativeCases: negatives.length,
  sourceIndexChecks,
  sourceComponentChecks,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software and optional source-index checks, not complete muscle parts, segmental slips, measured attachments, respiratory biomechanics or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/trunk-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
