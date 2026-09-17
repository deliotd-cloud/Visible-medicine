import assert from 'node:assert/strict';
import { authoringBeforeCentralNeuralClinical } from './central-neural-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeOrbitalNeuralClinical } from './orbital-neural-clinical-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, l) => {
  checks++;
  assert.deepEqual(a, b, l);
};
const check = (v, l) => {
  checks++;
  assert(v, l);
};
const context = await contentContext(),
  { api, catalog, body } = context;
const before = await readContentJson(
  'content/orbital-neural-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeOrbitalNeuralClinical(context);
const milestone = await authoringBeforeCentralNeuralClinical(context);
const copy = (a) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      a.contentTabs.map((t) => [t, a.bodyContent(s, t)]),
    ),
  })),
  shoulder: a.structures,
  dissectionProfiles: a.dissectionProfiles,
});
same(curriculumHash(copy(previous)), before.copyAndRecipeHash);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
);
// Independently observed official source rows, not inferred from runtime lessons.
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  ['FMA52677', 'left', 'isa', ['FJ1283'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52640', 'left', 'isa', ['FJ1290'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52577', 'left', 'isa', ['FJ1293'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52699', 'left', 'isa', ['FJ1296'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52630', 'left', 'isa', ['FJ1300'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52670', 'left', 'isa', ['FJ1310'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52674', 'left', 'isa', ['FJ1311'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52623', 'left', 'isa', ['FJ1312'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52716', 'left', 'isa', ['FJ1315'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA82735', 'left', 'isa', ['FJ1318'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52575', 'left', 'isa', ['FJ1321'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52657', 'left', 'isa', ['FJ1325'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52644', 'left', 'isa', ['FJ1326'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52676', 'right', 'isa', ['FJ1333'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52639', 'right', 'isa', ['FJ1341'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52576', 'right', 'isa', ['FJ1344'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52698', 'right', 'isa', ['FJ1347'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52629', 'right', 'isa', ['FJ1351'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52669', 'right', 'isa', ['FJ1361'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52673', 'right', 'isa', ['FJ1362'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52622', 'right', 'isa', ['FJ1363'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52715', 'right', 'isa', ['FJ1366'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA82734', 'right', 'isa', ['FJ1369'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52574', 'right', 'isa', ['FJ1372'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52656', 'right', 'isa', ['FJ1376'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA52643', 'right', 'isa', ['FJ1377'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA50881', 'right', 'isa', ['FJ1381'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA50882', 'left', 'isa', ['FJ1330'], 'head-neck', ['head-neck'], 'nerve'],
  ['FMA53549', 'right', 'isa', ['FJ1339'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA53550', 'left', 'isa', ['FJ1288'], 'head-neck', ['head-neck'], 'organ'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.orbitalNeuralClinicalGroups.length, 15);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.orbitalNeuralClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, tree, files, region, regions, category] of expected) {
  const s = entry(f),
    e = before.entries.find((e) => e.fmaId === f);
  same(
    [
      s.system,
      s.category,
      s.laterality,
      s.region,
      s.regions,
      s.sourceTree,
      s.sources.map((p) => p.file),
    ],
    ['nerves', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files].sort(),
  );
  same(e.omittedSourceFiles, []);
  const group = api.orbitalNeuralClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.orbitalNeuralClinicalLesson(s, t);
    same(result, api.bodyLesson(s, t));
    same(result.readiness, 'draft');
    same(result.body, group[t].body);
    same(result.bullets, [...group[t].bullets, group.scope]);
    same(result.citations, group.references);
    check(result.title.startsWith(s.name + ' ·'));
    check(result.note.includes('clinical review pending'));
    check(result.note.includes('not a patient diagnosis'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .orbitalNeuralClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
        .note.includes('Keep warning'),
    );
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const detached = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), detached);
    same(JSON.parse(JSON.stringify(detached)), record.content[t]);
    same(record.validation.clinicalApproval, 'not-included');
    same(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
    for (const mutation of [
      { system: 'muscles' },
      { category: category === 'nerve' ? 'organ' : 'nerve' },
      { region: region === 'thorax' ? 'spine' : 'thorax' },
      { regions: [] },
      { regions: [...regions, 'thorax'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: tree === 'isa' ? 'partof' : 'isa' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
      ...(s.sources.length > 1
        ? [
            { sources: s.sources.slice(1) },
            { sources: [...s.sources].reverse() },
          ]
        : []),
      ...(s.regions.length > 1 ? [{ regions: [...s.regions].reverse() }] : []),
    ])
      same(
        api.orbitalNeuralClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.orbitalNeuralClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.orbitalNeuralClinicalGroups.find((g) => g.key === k);

check(
  group('ophthalmic')
    .pathology.body.toLowerCase()
    .includes('ophthalmic trigeminal'),
);
check(
  group('frontal')
    .pathology.body.toLowerCase()
    .includes('anatomical inference'),
);
check(group('supraorbital').pathology.body.toLowerCase().includes('trauma'));
check(group('supratrochlear').clinical.body.toLowerCase().includes('cn iv'));
check(
  group('infratrochlear')
    .clinical.body.toLowerCase()
    .includes('different pathways'),
);
check(group('lacrimal').clinical.body.toLowerCase().includes('cn vii'));
check(
  group('nasociliary')
    .pathology.body.toLowerCase()
    .includes('does not exclude'),
);
check(
  group('anterior-ethmoidal')
    .pathology.body.toLowerCase()
    .includes('loss of smell'),
);
check(
  group('posterior-ethmoidal')
    .clinical.body.toLowerCase()
    .includes('olfaction'),
);
check(
  group('long-ciliary').clinical.body.toLowerCase().includes('sympathetic'),
);
check(
  group('sensory-root')
    .clinical.body.toLowerCase()
    .includes('without synapsing'),
);
check(
  group('superior-oculomotor').pathology.body.toLowerCase().includes('levator'),
);
check(
  group('inferior-oculomotor')
    .pathology.body.toLowerCase()
    .includes('preganglionic'),
);
check(group('trochlear').pathology.body.toLowerCase().includes('binocular'));
check(
  group('ciliary-ganglion')
    .pathology.body.toLowerCase()
    .includes('tonic pupil'),
);
same(ids.length, 30);
same(new Set(ids).size, 30);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  30,
);
same(expected.filter((e) => e[6] === 'nerve').length, 28);
same(expected.filter((e) => e[6] === 'organ').length, 2);
for (const key of [
  'superior-oculomotor',
  'inferior-oculomotor',
  'trochlear',
  'ciliary-ganglion',
])
  check(group(key).clinical.bullets.some((b) => b.includes('999/A&E')));
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.orbitalNeuralClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.orbitalNeuralClinicalLesson(entry(f), tab), undefined);
  }
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'skeleton' &&
        api.bodyLesson(s, 'clinical').readiness === 'pending',
    )
    .map((s) => s.fmaId)
    .sort(),
  ['FMA45097', 'FMA45098'],
);
const unresolved = ['FMA45097', 'FMA45098', 'FMA19728', 'FMA61970'];
for (const f of unresolved)
  same(api.bodyLesson(entry(f), 'function').readiness, 'pending');
for (const f of unresolved.slice(0, 2))
  same(api.bodyLesson(entry(f), 'anatomy').readiness, 'identity-only');
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
  for (const [f, , tree, files] of expected) {
    const rows = indexes[tree].filter((r) => r[0] === f);
    same(rows.map((r) => r[2]).sort(), [...files].sort());
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA52622', 'clinical', 'body'],
  ['FMA52639', 'pathology', 'readiness'],
  ['FMA52656', 'clinical', 'body'],
  ['FMA52643', 'pathology', 'body'],
  ['FMA52698', 'clinical', 'body'],
  ['FMA52629', 'pathology', 'body'],
  ['FMA52669', 'clinical', 'body'],
  ['FMA52676', 'pathology', 'body'],
  ['FMA52715', 'clinical', 'body'],
  ['FMA82734', 'pathology', 'body'],
  ['FMA52673', 'clinical', 'body'],
  ['FMA52574', 'pathology', 'body'],
  ['FMA52576', 'clinical', 'body'],
  ['FMA50881', 'pathology', 'body'],
  ['FMA53549', 'clinical', 'body'],
  ['FMA52622', 'anatomy', 'body'],
  ['FMA53549', 'function', 'body'],
  ['FMA50881', 'ultrasound', 'body'],
  ['FMA45097', 'clinical', 'readiness'],
  ['FMA45098', 'clinical', 'readiness'],
  ['FMA61970', 'clinical', 'readiness'],
  ['FMA19728', 'clinical', 'readiness'],
  ['FMA13322', 'clinical', 'body'],
  ['FMA23130', 'clinical', 'body'],
  ['FMA13395', 'clinical', 'body'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
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
                ? ids.includes(f)
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
  await assert.rejects(
    async () => {
      // Readiness is omitted from the displayed-copy hash: test held states directly.
      for (const held of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
        for (const tab of tabs)
          assert.equal(
            changed.bodyLesson(entry(held), tab).readiness,
            'pending',
          );
      assert.equal(
        curriculumHash(
          await copyBeforeShoulderArmCurriculum({ ...context, api: changed }),
        ),
        baseline.copyAndRecipeHash,
      );
    },
    f + ' / ' + t + ' / ' + field,
  );
  checks++;
}
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter(
          (s) => milestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 599,
    'identity-only': 0,
    pending: 423,
    'generated-identification': 0,
  });
for (const t of ['ct', 'mri', 'ultrasound'])
  same(counts(t), {
    draft: 11,
    'identity-only': 0,
    pending: 1011,
    'generated-identification': 0,
  });
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
same(counts('quiz'), {
  draft: 11,
  'identity-only': 0,
  pending: 0,
  'generated-identification': 1011,
});
for (const f of api.shoulderArmLessons.flatMap((l) => l.fmaIds))
  for (const t of tabs) same(api.bodyLesson(entry(f), t).readiness, 'draft');
const report = {
  passed: true,
  checks,
  bodyRepresentations: 30,
  sourceComponents: 30,
  lessonGroups: 15,
  explicitTopicEdits: 60,
  combinedPinnedCurriculumSections: 2778,
  sourceIndexChecks,
  negativeCases: negatives.length,
  historicalMilestoneReadiness: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(api)),
  limitations:
    'Original orbital nerve/ganglion clinical drafts; central neural entries and all unresolved holds remain unchanged. Not lesion mapping, corneal or pupil testing, disease simulation, nerve-block guidance, patient scans or clinical approval.',
};
await writeFile(
  new URL(
    'docs/orbital-neural-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
