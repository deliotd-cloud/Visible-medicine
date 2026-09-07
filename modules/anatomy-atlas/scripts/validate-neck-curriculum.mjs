import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeNeck } from './neck-curriculum-transition.mjs';
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
const before = await readContentJson('content/neck-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeNeck(context);
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
  'Ten pinned transitions preserve original baseline',
);
const definitions = api.neckMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
same(definitions.length, 7);
same(ids.length, 14);
same(new Set(ids).size, 14);
// Independent identity/component/motor expectations, not derived from lessons.
const expected = {
  subclavius: ['FMA13411', 'FMA13412', 'FJ1460M', 'FJ1460', 'C5–C6'],
  'cervical-rotator': [
    'FMA81753',
    'FMA81752',
    'FJ1524M',
    'FJ1524',
    'posterior rami',
  ],
  platysma: ['FMA45740', 'FMA45739', 'FJ1558', 'FJ1587', 'CN VII'],
  'scalenus-anterior': ['FMA13393', 'FMA13392', 'FJ1570', 'FJ1592', 'C4–C6'],
  'scalenus-medius': ['FMA13391', 'FMA13390', 'FJ1571', 'FJ1593', 'C3–C8'],
  'scalenus-posterior': ['FMA13389', 'FMA13388', 'FJ1572', 'FJ1594', 'C6–C8'],
  sternocleidomastoid: ['FMA13409', 'FMA13408', 'FJ1573', 'FJ1595', 'CN XI'],
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
      const lesson = api.neckMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t));
      same(JSON.parse(JSON.stringify(lesson)), exported.content[t]);
      same(lesson.readiness, 'draft');
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      check(lesson.note.includes('does not simulate neck movement'));
      if (l.caution) check(lesson.note.includes(l.caution));
      same(lesson.citations, l.references);
      for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
      check(
        api
          .neckMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
          .note.endsWith('Source warning'),
      );
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(fma)));
        same(
          lesson.body.includes('regional source'),
          Boolean(l.representation),
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
      same(api.neckMuscleLesson(s, t), undefined);
const fixture = entry('FMA13409');
for (const change of [
  { system: 'nerves' },
  { regions: ['shoulder'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.neckMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const lesson = (key) => definitions.find((l) => l.key === key);
check(lesson('subclavius').motorSupply.includes('upper brachial-plexus trunk'));
check(lesson('subclavius').caution.includes('shoulder-girdle'));
check(lesson('cervical-rotator').caution.includes('Do not transfer thoracic'));
same(lesson('cervical-rotator').representation, 'regional-group');
check(
  lesson('cervical-rotator').insertion.includes(
    'does not identify short versus long',
  ),
);
check(lesson('cervical-rotator').action.includes('has not been established'));
for (const fma of ['FMA81753', 'FMA81752']) {
  check(entry(fma).id.includes(':spine:'));
  check(
    api.bodyLesson(entry(fma), 'function').title.includes('Regional overview'),
  );
}
check(
  lesson('platysma').motorSupply.includes(
    'cervical branch of the facial nerve',
  ),
);
check(lesson('platysma').caution.includes('not a primary cervical flexor'));
check(lesson('scalenus-anterior').insertion.includes('in front of'));
check(lesson('scalenus-medius').insertion.includes('behind'));
check(
  lesson('scalenus-posterior').insertion.includes('rib 2, not the first rib'),
);
for (const key of [
  'scalenus-anterior',
  'scalenus-medius',
  'scalenus-posterior',
])
  check(lesson(key).motorSupply.includes('anterior rami'));
check(lesson('sternocleidomastoid').action.includes('turns the face away'));
check(
  lesson('sternocleidomastoid').action.includes(
    'tilting the head towards itself',
  ),
);
check(lesson('sternocleidomastoid').motorSupply.includes('proprioceptive'));
check(
  lesson('sternocleidomastoid').caution.includes(
    'does not separately identify',
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
  draft: 465,
  'identity-only': 557,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 520,
  'identity-only': 146,
  pending: 356,
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
  lessonDefinitions: 7,
  bodyRepresentations: 14,
  authoredSections: 28,
  combinedPinnedCurriculumSections: 540,
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
    'Software and optional source-index checks, not cervical-slip/head identity, measured attachments, movement/breathing simulation, complete head/neck curriculum or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/neck-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
