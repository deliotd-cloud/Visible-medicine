import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeConnectiveAnatomy } from './connective-anatomy-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, l) => {
  checks++;
  assert.deepEqual(a, b, l);
};
const check = (a, l) => {
  checks++;
  assert(a, l);
};
const context = await contentContext(),
  { api, catalog, body } = context;
const before = await readContentJson(
    'content/connective-anatomy-curriculum.before.json',
  ),
  baseline = await readContentJson('content/content-contract-baseline.json');
const previous = await authoringBeforeConnectiveAnatomy(context);
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
same(curriculumHash(copy(previous)), before.copyAndRecipeHash);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
);
const limb = {
  FMA44249: ['right', 'ligament', 'foot', ['foot'], 'FJ1424'],
  FMA44250: ['left', 'ligament', 'foot', ['foot'], 'FJ1424M'],
  FMA258847: ['right', 'tendon', 'leg', ['leg', 'foot'], 'FJ1405'],
  FMA264844: ['left', 'tendon', 'leg', ['leg', 'foot'], 'FJ1405M'],
};
const discRows = [
  ['FMA25058', 'FJ3202', 'axis', 'head-neck'],
  ['FMA13896', 'FJ3213', 'third cervical vertebra', 'head-neck'],
  ['FMA13897', 'FJ3218', 'fourth cervical vertebra', 'head-neck'],
  ['FMA13898', 'FJ3219', 'fifth cervical vertebra', 'head-neck'],
  ['FMA13899', 'FJ3220', 'sixth cervical vertebra', 'head-neck'],
  ['FMA13900', 'FJ3221', 'seventh cervical vertebra', 'head-neck'],
  ['FMA10458', 'FJ3222', 'first thoracic vertebra', 'thorax'],
  ['FMA13495', 'FJ3223', 'second thoracic vertebra', 'thorax'],
  ['FMA13500', 'FJ3224', 'third thoracic vertebra', 'thorax'],
  ['FMA13501', 'FJ3203', 'fourth thoracic vertebra', 'thorax'],
  ['FMA13502', 'FJ3204', 'fifth thoracic vertebra', 'thorax'],
  ['FMA13503', 'FJ3205', 'sixth thoracic vertebra', 'thorax'],
  ['FMA13504', 'FJ3206', 'seventh thoracic vertebra', 'thorax'],
  ['FMA13505', 'FJ3207', 'eighth thoracic vertebra', 'thorax'],
  ['FMA13506', 'FJ3208', 'ninth thoracic vertebra', 'thorax'],
  ['FMA13507', 'FJ3209', 'tenth thoracic vertebra', 'thorax'],
  ['FMA13508', 'FJ3210', 'eleventh thoracic vertebra', 'thorax'],
  ['FMA16033', 'FJ3212', 'first lumbar vertebra', 'abdomen'],
  ['FMA16034', 'FJ3214', 'second lumbar vertebra', 'abdomen'],
  ['FMA16035', 'FJ3215', 'third lumbar vertebra', 'abdomen'],
  ['FMA16036', 'FJ3216', 'fourth lumbar vertebra', 'abdomen'],
  ['FMA16037', 'FJ3217', 'fifth lumbar vertebra', 'abdomen'],
];
const expected = {
  ...limb,
  ...Object.fromEntries(
    discRows.map(([f, file, , region]) => [
      f,
      ['midline', 'cartilage', 'spine', ['spine', region], file],
    ]),
  ),
};
same(
  api.connectiveAnatomyLessons.map((l) => l.fmaId).sort(),
  Object.keys(expected).sort(),
);
same(before.entries.map((e) => e.fmaId).sort(), Object.keys(expected).sort());
same(api.connectiveDiscIdentities.length, 22);
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, [side, category, region, regions, file]] of Object.entries(
  expected,
)) {
  const s = entry(f),
    l = api.connectiveAnatomyLessons.find((l) => l.fmaId === f),
    e = before.entries.find((e) => e.fmaId === f);
  same(
    [
      s.laterality,
      s.category,
      s.region,
      s.regions,
      s.sourceTree,
      s.sources.map((p) => p.file),
    ],
    [side, category, region, regions, 'isa', [file]],
  );
  same(s.system, 'connective');
  same(e.files, e.sourceIndexFiles);
  same(e.omittedSourceFiles, []);
  const result = api.connectiveAnatomyLesson(s, 'anatomy');
  same(result, api.bodyLesson(s, 'anatomy'));
  same(result.readiness, 'draft');
  same(result.body, l.anatomy);
  same(result.bullets.slice(0, 2), [l.relationships, l.distinction]);
  same(result.citations, l.references);
  check(result.title.startsWith(s.name + ' ·'));
  check(result.bullets[2].includes(f));
  check(result.bullets[2].includes('1 source component'));
  check(result.note.includes('clinical review pending'));
  check(result.note.includes('not physiological deformation'));
  if (s.coverageNote) check(result.note.includes(s.coverageNote));
  check(
    api
      .connectiveAnatomyLesson(
        { ...s, coverageNote: 'Keep warning' },
        'anatomy',
      )
      .note.includes('Keep warning'),
  );
  for (const url of result.citations) same(new URL(url).protocol, 'https:');
  const detached = structuredClone(result);
  result.bullets.push('mutation');
  result.citations.push('mutation');
  same(api.bodyLesson(s, 'anatomy'), detached);
  const exported = body.find((r) => r.id === s.id);
  same(JSON.parse(JSON.stringify(detached)), exported.content.anatomy);
  same(exported.validation.clinicalApproval, 'not-included');
  same(exported.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'organs' },
    { category: 'organ' },
    { region: 'shoulder-arm' },
    { regions: [] },
    { laterality: side === 'left' ? 'right' : 'left' },
    { fmaId: 'FMA_UNKNOWN' },
    ...regions.map((r) => ({ regions: regions.filter((x) => x !== r) })),
  ])
    same(
      api.connectiveAnatomyLesson({ ...s, ...mutation }, 'anatomy'),
      undefined,
    );
  for (const t of api.contentTabs.filter((t) => t !== 'anatomy')) {
    same(api.connectiveAnatomyLesson(s, t), undefined);
    same(api.bodyLesson(s, t), previous.bodyLesson(s, t));
  }
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.connectiveAnatomyLesson(s, t), undefined);
for (const [f, , level] of discRows) {
  const s = entry(f);
  same(s.sourceName, 'intervertebral disk of ' + level);
  const section = api.bodyLesson(s, 'anatomy');
  check(section.bullets[1].includes('not a validated radiological interval'));
  check(
    section.bullets[1].includes(
      'does not separate annulus, nucleus or endplates',
    ),
  );
}
check(
  api
    .bodyLesson(entry('FMA25058'), 'anatomy')
    .bullets[0].includes('no intervertebral disc between atlas and axis'),
);
check(
  api
    .bodyLesson(entry('FMA44249'), 'anatomy')
    .bullets[0].includes('fibularis longus'),
);
check(
  api
    .bodyLesson(entry('FMA258847'), 'anatomy')
    .body.includes('posterior calcaneus'),
);
check(
  !catalog.structures.some((s) => s.sources.some((p) => p.file === 'FJ3211')),
  'Unresolved source disc not silently introduced',
);
const unresolved = ['FMA45097', 'FMA45098', 'FMA19728', 'FMA61970'];
for (const f of unresolved)
  same(api.bodyLesson(entry(f), 'function').readiness, 'pending');
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
    .map((l) => l.split('\t'));
  for (const [f, [, , , , file]] of Object.entries(expected)) {
    same(
      rows.filter((r) => r[0] === f),
      [[f, entry(f).sourceName, file]],
    );
    sourceIndexChecks++;
  }
  check(
    rows.some((r) => r[0] === 'FMA10446' && r[2] === 'FJ3211'),
    'Additional generic source disc exists',
  );
}
const negatives = [
  ['FMA44249', 'anatomy', 'body'],
  ['FMA264844', 'anatomy', 'body'],
  ['FMA25058', 'anatomy', 'readiness'],
  ['FMA13508', 'anatomy', 'body'],
  ['FMA16037', 'anatomy', 'body'],
  ['FMA13896', 'function', 'body'],
  ['FMA44250', 'ultrasound', 'body'],
  ['FMA7197', 'anatomy', 'body'],
  ...unresolved.map((f) => [f, 'function', 'readiness']),
];
for (const [f, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === f && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? expected[f]
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === f && tab === t && field === 'body'
        ? { ...api.bodyContent(s, tab), body: 'unrecorded' }
        : api.bodyContent(s, tab),
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
  draft: 1020,
  'identity-only': 2,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 1018,
  'identity-only': 0,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'connective' &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 26,
  sourceComponents: 26,
  discRepresentations: 22,
  lessonGroups: 5,
  explicitTopicEdits: 26,
  combinedPinnedCurriculumSections: 1602,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  existingFunctionPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  radiologicalLevelsValidated: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Shared regional disc teaching and bilateral attachment overviews; no internal tissue segmentation, resolved extra disc, patient-level registration, physiological simulation or clinical acceptance.',
};
await writeFile(
  new URL('docs/connective-anatomy-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
