import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
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
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const before = await readContentJson(
  'content/orbital-nerve-curriculum.before.json',
);
const previous = await authoringBeforeOrbitalNerve(context);
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
  'Unrelated copy and recipes remain exact',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'Thirteen explicit transitions preserve the original baseline',
);
// Independent source-index observations, not inferred from authored definitions.
const expected = {
  ophthalmic: [
    ['FMA52623', 'left', 'FJ1312'],
    ['FMA52622', 'right', 'FJ1363'],
  ],
  frontal: [
    ['FMA52640', 'left', 'FJ1290'],
    ['FMA52639', 'right', 'FJ1341'],
  ],
  supraorbital: [
    ['FMA52657', 'left', 'FJ1325'],
    ['FMA52656', 'right', 'FJ1376'],
  ],
  lacrimal: [
    ['FMA52630', 'left', 'FJ1300'],
    ['FMA52629', 'right', 'FJ1351'],
  ],
  nasociliary: [
    ['FMA52670', 'left', 'FJ1310'],
    ['FMA52669', 'right', 'FJ1361'],
  ],
  'anterior-ethmoidal': [
    ['FMA52677', 'left', 'FJ1283'],
    ['FMA52676', 'right', 'FJ1333'],
  ],
  'posterior-ethmoidal': [
    ['FMA52716', 'left', 'FJ1315'],
    ['FMA52715', 'right', 'FJ1366'],
  ],
  'long-ciliary': [
    ['FMA82735', 'left', 'FJ1318'],
    ['FMA82734', 'right', 'FJ1369'],
  ],
  'oculomotor-superior': [
    ['FMA52575', 'left', 'FJ1321'],
    ['FMA52574', 'right', 'FJ1372'],
  ],
  'oculomotor-inferior': [
    ['FMA52577', 'left', 'FJ1293'],
    ['FMA52576', 'right', 'FJ1344'],
  ],
};
const definitions = api.orbitalNerveLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
same(definitions.length, 10);
same(ids.length, 20);
same(new Set(ids).size, 20);
same(definitions.map((l) => l.key).sort(), Object.keys(expected).sort());
for (const l of definitions) {
  same(
    l.fmaIds,
    expected[l.key].map((row) => row[0]),
  );
  for (const field of [
    'origin',
    'course',
    'function',
    'distinction',
    'caution',
  ])
    check(l[field].length > 12);
  for (const [fma, side, file] of expected[l.key]) {
    const s = entry(fma);
    check(s);
    same(s.laterality, side);
    same(s.regions, ['head-neck']);
    same(s.system, 'nerves');
    same(s.sourceTree, 'isa');
    same(
      s.sources.map((p) => p.file),
      [file],
    );
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.orbitalNerveLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t));
      same(JSON.parse(JSON.stringify(lesson)), exported.content[t]);
      same(lesson.readiness, 'draft');
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      check(lesson.note.includes('do not simulate nerve conduction'));
      check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
      check(
        api
          .orbitalNerveLesson({ ...s, coverageNote: 'Keep source warning' }, t)
          .note.endsWith('Keep source warning'),
      );
      if (t === 'anatomy') {
        same(lesson.body, l.course);
        check(lesson.bullets[0].includes(l.origin));
        check(lesson.bullets[1].includes(fma));
        check(lesson.bullets[2].includes('not a measured'));
      } else {
        same(lesson.body, l.function);
        same(lesson.bullets, [l.distinction]);
      }
      const original = structuredClone(lesson);
      lesson.bullets.push('mutation');
      lesson.citations.push('mutation');
      same(api.bodyLesson(s, t), original, 'No shared mutable arrays');
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
      same(api.orbitalNerveLesson(s, t), undefined);
const fixture = entry('FMA52623');
for (const change of [
  { system: 'muscles' },
  { regions: ['spine'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(
    api.orbitalNerveLesson({ ...fixture, ...change }, 'function'),
    undefined,
  );
const lesson = (key) => definitions.find((l) => l.key === key);
check(lesson('ophthalmic').distinction.includes('not the optic nerve'));
check(lesson('frontal').course.includes('above levator'));
check(lesson('supraorbital').course.includes('notch or foramen'));
check(lesson('supraorbital').caution.includes('not a nerve-block guide'));
check(lesson('lacrimal').distinction.includes('postganglionic'));
check(lesson('lacrimal').distinction.includes('pterygopalatine'));
check(lesson('lacrimal').distinction.includes('CN VII'));
check(lesson('nasociliary').distinction.includes('without synapsing'));
check(
  lesson('anterior-ethmoidal').distinction.includes('different from olfaction'),
);
check(lesson('posterior-ethmoidal').function.includes('sphenoidal'));
check(lesson('long-ciliary').function.includes('sympathetic'));
check(lesson('long-ciliary').function.includes('dilation'));
check(
  lesson('long-ciliary').distinction.includes('short ciliary parasympathetic'),
);
check(
  lesson('oculomotor-superior').course.includes('superior rectus and levator'),
);
check(!lesson('oculomotor-superior').course.includes('inferior oblique'));
check(
  lesson('oculomotor-inferior').course.includes(
    'medial rectus, inferior rectus and inferior oblique',
  ),
);
check(lesson('oculomotor-inferior').function.includes('preganglionic'));
check(lesson('oculomotor-inferior').distinction.includes('After synapsing'));
check(lesson('oculomotor-inferior').distinction.includes('short ciliary'));
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
  [fixture, 'anatomy', 'body'],
  [fixture, 'function', 'readiness'],
  [fixture, 'mri', 'body'],
  [entry('FMA19728'), 'function', 'readiness'],
  [entry('FMA78497'), 'anatomy', 'body'],
  [entry('FMA61970'), 'function', 'body'],
  [entry('FMA62072'), 'function', 'body'],
  [entry('FMA13373'), 'function', 'body'],
  [entry('FMA13398'), 'function', 'body'],
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
  draft: 551,
  'identity-only': 471,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 606,
  'identity-only': 146,
  pending: 270,
  'generated-identification': 0,
});
const pendingNervous = catalog.structures
  .filter(
    (s) =>
      s.system === 'nerves' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  )
  .map((s) => s.fmaId)
  .sort();
same(pendingNervous, ['FMA61970', 'FMA62072', 'FMA78497']);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 10,
  bodyRepresentations: 20,
  authoredSections: 40,
  combinedPinnedCurriculumSections: 712,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  pendingNervousSystemFunctions: pendingNervous,
  sourceIndexChecks,
  negativeCases: negatives.length,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software/source-index evidence, not validated nerve courses, every branch or fibre pathway, reflex simulation, clinical or device acceptance.',
};
await writeFile(
  new URL('docs/orbital-nerve-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
