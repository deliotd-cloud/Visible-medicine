import assert from 'node:assert/strict';
import { authoringBeforeAcralBoneClinical } from './acral-bone-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeCranialBoneClinical } from './cranial-bone-clinical-curriculum-transition.mjs';
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
  'content/cranial-bone-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeCranialBoneClinical(context);
const milestone = await authoringBeforeAcralBoneClinical(context);
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
/** @type {Array<[string, string, string, string[], string, string[]]>} */
const expected = [
  [
    'FMA52749',
    'midline',
    'isa',
    ['FJ2772', 'FJ3201'],
    'head-neck',
    ['head-neck'],
  ],
  ['FMA52740', 'midline', 'isa', ['FJ3199'], 'head-neck', ['head-neck']],
  ['FMA52734', 'midline', 'isa', ['FJ3200'], 'head-neck', ['head-neck']],
  ['FMA54738', 'left', 'isa', ['FJ3263'], 'head-neck', ['head-neck']],
  ['FMA53646', 'left', 'isa', ['FJ3265'], 'head-neck', ['head-neck']],
  ['FMA53650', 'left', 'isa', ['FJ3269'], 'head-neck', ['head-neck']],
  ['FMA53648', 'left', 'isa', ['FJ3272'], 'head-neck', ['head-neck']],
  ['FMA53656', 'left', 'isa', ['FJ3273'], 'head-neck', ['head-neck']],
  ['FMA52789', 'left', 'isa', ['FJ3274'], 'head-neck', ['head-neck']],
  ['FMA52739', 'left', 'isa', ['FJ3281'], 'head-neck', ['head-neck']],
  ['FMA52893', 'left', 'isa', ['FJ3287'], 'head-neck', ['head-neck']],
  ['FMA52748', 'midline', 'isa', ['FJ3289'], 'head-neck', ['head-neck']],
  ['FMA52735', 'midline', 'isa', ['FJ3309'], 'head-neck', ['head-neck']],
  ['FMA54737', 'right', 'isa', ['FJ3369'], 'head-neck', ['head-neck']],
  ['FMA53645', 'right', 'isa', ['FJ3371'], 'head-neck', ['head-neck']],
  ['FMA53649', 'right', 'isa', ['FJ3375'], 'head-neck', ['head-neck']],
  ['FMA53647', 'right', 'isa', ['FJ3378'], 'head-neck', ['head-neck']],
  ['FMA53655', 'right', 'isa', ['FJ3379'], 'head-neck', ['head-neck']],
  ['FMA52788', 'right', 'isa', ['FJ3380'], 'head-neck', ['head-neck']],
  ['FMA52738', 'right', 'isa', ['FJ3386'], 'head-neck', ['head-neck']],
  ['FMA52892', 'right', 'isa', ['FJ3392'], 'head-neck', ['head-neck']],
  ['FMA52736', 'midline', 'isa', ['FJ3394'], 'head-neck', ['head-neck']],
  ['FMA9710', 'midline', 'isa', ['FJ3395'], 'head-neck', ['head-neck']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.cranialBoneClinicalGroups.length, 15);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.cranialBoneClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, tree, files, region, regions] of expected) {
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
    ['skeleton', 'bone', side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files].sort(),
  );
  same(e.omittedSourceFiles, []);
  const group = api.cranialBoneClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.cranialBoneClinicalLesson(s, t);
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
        .cranialBoneClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { category: 'tendon' },
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
      same(api.cranialBoneClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.cranialBoneClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved at the historical cranial-bone milestone',
      );
    }
  }
const group = (k) => api.cranialBoneClinicalGroups.find((g) => g.key === k);

check(group('hyoid').scope.includes('two source components'));
check(group('hyoid').scope.includes('not part of the skull'));
check(group('hyoid').pathology.body.includes('does not by itself'));
check(group('hyoid').pathology.bullets[0].includes('emergency'));
check(group('ethmoid').scope.includes('No dural defect'));
check(group('ethmoid').pathology.bullets[0].includes('does not confirm'));
check(group('frontal').pathology.body.includes('not equivalent'));
check(group('inferior-concha').scope.includes('mucosal'));
check(
  group('inferior-concha').pathology.bullets[0].includes('normal nasal cycle'),
);
check(group('lacrimal').scope.includes('neither'));
check(group('maxilla').pathology.bullets[0].includes('does not automatically'));
check(group('nasal').pathology.body.includes('appears straight'));
check(group('nasal').pathology.bullets[0].includes('same-day emergency'));
check(group('palatine').pathology.body.includes('submucous'));
check(
  group('parietal').clinical.bullets[0].includes(
    'does not recommend plain skull',
  ),
);
check(group('temporal').pathology.body.includes('without'));
check(group('zygomatic').scope.includes('not the whole zygomatic arch'));
check(group('mandible').scope.includes('one bone with two sides'));
check(group('occipital').scope.includes('No craniocervical ligament'));
check(group('sphenoid').clinical.body.includes('optic canal'));
check(group('vomer').scope.includes('only part'));
same(ids.length, 23);
same(new Set(ids).size, 23);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  24,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.cranialBoneClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
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
  ['FMA52749', 'clinical', 'body'],
  ['FMA52740', 'pathology', 'readiness'],
  ['FMA52734', 'clinical', 'body'],
  ['FMA54738', 'pathology', 'body'],
  ['FMA53646', 'clinical', 'body'],
  ['FMA53650', 'pathology', 'body'],
  ['FMA53648', 'clinical', 'body'],
  ['FMA53656', 'pathology', 'body'],
  ['FMA52789', 'clinical', 'body'],
  ['FMA52739', 'anatomy', 'body'],
  ['FMA52893', 'function', 'body'],
  ['FMA52748', 'ultrasound', 'body'],
  ['FMA52735', 'clinical', 'body'],
  ['FMA52736', 'pathology', 'body'],
  ['FMA9710', 'clinical', 'body'],
  ...legacyRightShoulder.map((f) => [f, 'clinical', 'body']),
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
        catalog.structures.filter(
          (s) => milestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 463,
    'identity-only': 0,
    pending: 559,
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
  bodyRepresentations: 23,
  sourceComponents: 24,
  lessonGroups: 15,
  explicitTopicEdits: 46,
  combinedPinnedCurriculumSections: 2506,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: Object.fromEntries(api.contentTabs.map((t) => [t, counts(t)])),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  countsScope:
    'Historical cranial-bone milestone; current direct/export assertions remain active',
  copyAndRecipeHash: curriculumHash(copy(milestone)),
  limitations:
    'Original short skull/facial/hyoid clinical drafts; not validated fractures, cranial-nerve lesions, airway or visual function, patient scans, procedural guidance or clinical approval.',
};
await writeFile(
  new URL('docs/cranial-bone-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
