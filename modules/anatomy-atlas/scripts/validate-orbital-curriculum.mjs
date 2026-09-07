import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeOrbital } from './orbital-curriculum-transition.mjs';
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
const before = await readContentJson('content/orbital-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeOrbital(context);
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
  'Every unrelated topic/recipe preserved',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'Eight transitions preserve original baseline',
);
const definitions = api.orbitalMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
same(definitions.length, 7);
same(ids.length, 14);
same(new Set(ids).size, 14);
const expected = {
  'superior-rectus': ['FMA49045', 'FMA49044', 'FJ1323', 'FJ1374', 'CN III'],
  'inferior-rectus': ['FMA49047', 'FMA49046', 'FJ1295', 'FJ1346', 'CN III'],
  'levator-palpebrae-superioris': [
    'FMA49049',
    'FMA49048',
    'FJ1306',
    'FJ1357',
    'CN III',
  ],
  'inferior-oblique': ['FMA49051', 'FMA49050', 'FJ1294', 'FJ1345', 'CN III'],
  'superior-oblique': ['FMA49053', 'FMA49052', 'FJ1322', 'FJ1373', 'CN IV'],
  'lateral-rectus': ['FMA49055', 'FMA49054', 'FJ1304', 'FJ1355', 'CN VI'],
  'medial-rectus': ['FMA49057', 'FMA49056', 'FJ1308', 'FJ1359', 'CN III'],
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
      [expected[l.key][i + 2]],
    );
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.orbitalMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t), 'Actual runtime routing');
      same(
        JSON.parse(JSON.stringify(lesson)),
        exported.content[t],
        'Actual export parity',
      );
      same(lesson.readiness, 'draft');
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      check(
        lesson.note.includes(
          'not a gaze, muscle-force or diagnostic simulation',
        ),
      );
      if (l.caution) check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
      check(
        api
          .orbitalMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
          .note.endsWith('Source warning'),
      );
      if (t === 'anatomy') check(lesson.bullets.some((b) => b.includes(fma)));
      else {
        if (l.gazeNote) check(lesson.bullets.includes(l.gazeNote));
        same(
          lesson.bullets.some((b) => b.includes('Intorsion turns')),
          l.target === 'globe',
        );
      }
      const original = structuredClone(lesson);
      lesson.bullets.push('mutation');
      lesson.citations.push('mutation');
      same(api.bodyLesson(s, t), original, 'Detached output arrays');
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
      same(api.orbitalMuscleLesson(s, t), undefined);
const fixture = entry('FMA49045');
for (const change of [
  { system: 'nerves' },
  { regions: ['shoulder'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(
    api.orbitalMuscleLesson({ ...fixture, ...change }, 'anatomy'),
    undefined,
  );
const lesson = (key) => definitions.find((l) => l.key === key);
for (const key of ['superior-rectus', 'inferior-rectus'])
  check(lesson(key).gazeNote.includes('abducted'));
for (const key of ['superior-oblique', 'inferior-oblique'])
  check(lesson(key).gazeNote.includes('adducted'));
check(lesson('superior-rectus').action.includes('intorsion and adduction'));
check(lesson('inferior-rectus').action.includes('extorsion and adduction'));
check(lesson('superior-oblique').action.includes('Intorts'));
check(lesson('inferior-oblique').action.includes('Extorts'));
check(lesson('superior-oblique').insertion.includes('trochlea'));
check(lesson('inferior-oblique').origin.includes('orbital floor'));
check(!lesson('inferior-oblique').origin.includes('ring'));
const lid = lesson('levator-palpebrae-superioris');
same(lid.target, 'upper-eyelid');
same(lid.gazeNote, undefined);
check(lid.action.includes('does not rotate the eyeball'));
check(lid.caution.includes('superior tarsal smooth muscle'));
check(lid.insertion.includes('aponeurosis'));
check(lesson('superior-rectus').motorSupply.startsWith('Superior division'));
check(lid.motorSupply.startsWith('Superior division'));
for (const key of ['medial-rectus', 'inferior-rectus', 'inferior-oblique'])
  check(lesson(key).motorSupply.startsWith('Inferior division'));
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
      [[s.name.toLowerCase(), s.sources[0].file]],
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
  draft: 424,
  'identity-only': 598,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 479,
  'identity-only': 146,
  pending: 397,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('head-neck') &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  41,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 7,
  bodyRepresentations: 14,
  authoredSections: 28,
  combinedPinnedCurriculumSections: 458,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  negativeCases: negatives.length,
  sourceIndexChecks,
  pendingHeadNeckMuscleFunctions: 41,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software and optional source-index checks; not tendon/pulley validation, measured attachments, gaze dynamics, complete orbital anatomy or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/orbital-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
