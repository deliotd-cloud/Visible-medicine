import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeNeuralAnatomy } from './neural-anatomy-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson(
  'content/neural-anatomy-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeNeuralAnatomy(context);
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
// Independently pinned observations from the original source indexes, not lesson text.
const expected = {
  FMA52698: ['right', 'nerve', 'isa', ['FJ1347']],
  FMA52699: ['left', 'nerve', 'isa', ['FJ1296']],
  FMA52643: ['right', 'nerve', 'isa', ['FJ1377']],
  FMA52644: ['left', 'nerve', 'isa', ['FJ1326']],
  FMA52673: ['right', 'nerve', 'isa', ['FJ1362']],
  FMA52674: ['left', 'nerve', 'isa', ['FJ1311']],
  FMA50881: ['right', 'nerve', 'isa', ['FJ1381']],
  FMA50882: ['left', 'nerve', 'isa', ['FJ1330']],
  FMA53549: ['right', 'organ', 'isa', ['FJ1339']],
  FMA53550: ['left', 'organ', 'isa', ['FJ1288']],
  FMA50801: [
    'midline',
    'organ',
    'partof',
    [
      'FJ1730',
      'FJ1731',
      'FJ1732',
      'FJ1733',
      'FJ1738',
      'FJ1739',
      'FJ1740',
      'FJ1743',
      'FJ1744',
      'FJ1745',
      'FJ1746',
      'FJ1747',
      'FJ1748',
      'FJ1749',
      'FJ1750',
      'FJ1751',
      'FJ1758',
      'FJ1759',
      'FJ1760',
      'FJ1762',
      'FJ1767',
      'FJ1769',
      'FJ1770',
      'FJ1775',
      'FJ1779',
      'FJ1780',
      'FJ1781',
      'FJ1783',
      'FJ1784',
      'FJ1785',
      'FJ1786',
      'FJ1787',
      'FJ1788',
      'FJ1789',
      'FJ1790',
      'FJ1791',
      'FJ1792',
      'FJ1795',
      'FJ1797',
      'FJ1798',
      'FJ1800',
      'FJ1801',
      'FJ1806',
      'FJ1807',
      'FJ1808',
      'FJ1810',
      'FJ1814',
      'FJ1817',
      'FJ1822',
      'FJ1826',
      'FJ1828',
      'FJ1830',
      'FJ1831',
      'FJ1833',
      'FJ1834',
      'FJ1835',
      'FJ1836',
      'FJ1841',
      'FJ1842',
    ],
  ],
};
const corrected = new Set([
  'FMA52698',
  'FMA52699',
  'FMA52643',
  'FMA52644',
  'FMA52673',
  'FMA52674',
]);
same(api.neuralAnatomyLessons.length, 11);
same(
  api.neuralAnatomyLessons.map((l) => l.fmaId).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
let edits = 0;
for (const [fma, [side, category, tree, files]] of Object.entries(expected)) {
  const s = entry(fma),
    l = api.neuralAnatomyLessons.find((l) => l.fmaId === fma);
  check(s && l);
  same(s.system, 'nerves');
  same(s.category, category);
  same(s.laterality, side);
  same(s.region, 'head-neck');
  same(s.regions, ['head-neck']);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  const original = before.entries.find((e) => e.fmaId === fma);
  same(
    Object.keys(original.sections),
    corrected.has(fma) ? ['anatomy', 'function'] : ['anatomy'],
  );
  for (const t of api.contentTabs) {
    const result = api.neuralAnatomyLesson(s, t);
    if (!(t === 'anatomy' || (t === 'function' && corrected.has(fma)))) {
      same(result, undefined);
      same(api.bodyLesson(s, t), previous.bodyLesson(s, t));
      continue;
    }
    edits++;
    same(result, api.bodyLesson(s, t));
    same(
      JSON.parse(JSON.stringify(result)),
      body.find((r) => r.id === s.id).content[t],
    );
    same(result.readiness, 'draft');
    same(result.body, t === 'anatomy' ? l.anatomy : l.correctedFunction);
    same(result.bullets[0], l.distinction);
    same(result.citations, l.references);
    check(result.citations.length > 0);
    check(result.title.startsWith(s.name + ' ·'));
    check(result.note.includes('clinical review pending'));
    check(result.note.includes('not physiological nerve motion'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .neuralAnatomyLesson({ ...s, coverageNote: 'Retain source hold' }, t)
        .note.includes('Retain source hold'),
    );
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const detached = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), detached);
    if (t === 'anatomy') {
      check(result.bullets[1].includes(fma));
      check(result.bullets[1].includes(files.length + ' source component'));
    }
  }
  const exported = body.find((r) => r.id === s.id);
  same(exported.validation.clinicalApproval, 'not-included');
  same(exported.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'organs' },
    { category: category === 'nerve' ? 'organ' : 'nerve' },
    { region: 'spine' },
    { regions: [] },
    { laterality: side === 'left' ? 'right' : 'left' },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    for (const t of ['anatomy', 'function'])
      same(api.neuralAnatomyLesson({ ...s, ...mutation }, t), undefined);
}
same(edits, 17);
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.neuralAnatomyLesson(s, t), undefined);
const lesson = (fma, t = 'anatomy') => api.bodyLesson(entry(fma), t);
for (const [fma, t, fragment] of [
  ['FMA52698', 'anatomy', 'nasociliary branch'],
  ['FMA52699', 'function', 'Carries sensation'],
  ['FMA52643', 'anatomy', 'frontal-nerve branch'],
  ['FMA52644', 'function', 'medial forehead'],
  ['FMA52673', 'anatomy', 'sensory root'],
  ['FMA52674', 'function', 'without synapsing'],
  ['FMA50881', 'anatomy', 'dorsal midbrain'],
  ['FMA53549', 'anatomy', 'lateral to the optic nerve'],
  ['FMA50801', 'anatomy', 'midbrain, pons and medulla'],
])
  check(lesson(fma, t).body.includes(fragment));
check(lesson('FMA50801').bullets[0].includes('59 PART-OF'));
for (const fma of corrected) {
  check(!lesson(fma, 'function').title.startsWith('Trochlear nerve (CN IV)'));
  check(!lesson(fma, 'function').title.startsWith('Ciliary ganglion'));
  check(
    lesson(fma, 'function').body !==
      previous.bodyLesson(entry(fma), 'function').body,
  );
  const forged = { ...entry(fma), fmaId: 'FMA_UNKNOWN' };
  check(
    !['Trochlear nerve (CN IV) · draft', 'Ciliary ganglion · draft'].includes(
      api.bodyLesson(forged, 'function').title,
    ),
    'No substring fallback',
  );
}
for (const fma of ['FMA50881', 'FMA50882', 'FMA53549', 'FMA53550', 'FMA50801'])
  same(
    lesson(fma, 'function'),
    previous.bodyLesson(entry(fma), 'function'),
    'Correct existing Function preserved',
  );
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
  same(lesson(fma, 'function').readiness, 'pending');
const sourceComponents = Object.values(expected).reduce(
  (n, e) => n + e[3].length,
  0,
);
same(sourceComponents, 69);
let sourceIndexChecks = 0;
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
      .map((l) => l.split('\t'));
  for (const [fma, [, , tree, files]] of Object.entries(expected)) {
    same(
      indexes[tree].filter((r) => r[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA52698', 'anatomy', 'body'],
  ['FMA52699', 'function', 'body'],
  ['FMA52644', 'function', 'body'],
  ['FMA52673', 'function', 'body'],
  ['FMA50801', 'anatomy', 'body'],
  ['FMA53549', 'anatomy', 'readiness'],
  ['FMA50881', 'function', 'body'],
  ['FMA53550', 'ultrasound', 'body'],
  ['FMA3941', 'anatomy', 'body'],
  ...['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'].map((f) => [
    f,
    'function',
    'readiness',
  ]),
];
for (const [fma, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === fma && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? expected[fma]
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === fma && tab === t && field === 'body'
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
  draft: 973,
  'identity-only': 49,
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
      s.system === 'nerves' &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 11,
  sourceComponents,
  lessonGroups: 6,
  explicitTopicEdits: 17,
  correctedFunctionDescriptions: 6,
  combinedPinnedCurriculumSections: 1555,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Draft factual teaching and exact-ID routing corrections; source boundaries, complete nerve connectivity, fibre composition, sensory territories and clinical/device acceptance remain unvalidated.',
};
await writeFile(
  new URL('docs/neural-anatomy-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
