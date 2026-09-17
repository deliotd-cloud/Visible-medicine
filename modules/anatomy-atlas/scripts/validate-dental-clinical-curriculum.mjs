import assert from 'node:assert/strict';
import { authoringBeforeLimbConnectiveClinical } from './limb-connective-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeDentalClinical } from './dental-clinical-curriculum-transition.mjs';
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
  'content/dental-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeDentalClinical(context);
const milestone = await authoringBeforeLimbConnectiveClinical(context);
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
/** @type {Record<string, string[]>} */
const omittedByFma = {};
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  ['FMA55680', 'right', 'isa', ['FJ1280'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55681', 'right', 'isa', ['FJ1279'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55682', 'left', 'isa', ['FJ1265'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55683', 'left', 'isa', ['FJ1266'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55686', 'right', 'isa', ['FJ1274'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55687', 'left', 'isa', ['FJ1260'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55688', 'right', 'isa', ['FJ1278'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55689', 'right', 'isa', ['FJ1277'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55690', 'left', 'isa', ['FJ1262'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55691', 'left', 'isa', ['FJ1264'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55692', 'left', 'isa', ['FJ1257'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55693', 'left', 'isa', ['FJ1255'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55694', 'right', 'isa', ['FJ1269'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55695', 'right', 'isa', ['FJ1271'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55697', 'right', 'isa', ['FJ1275'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55698', 'right', 'isa', ['FJ1276'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55699', 'left', 'isa', ['FJ1261'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55700', 'left', 'isa', ['FJ1263'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55703', 'left', 'isa', ['FJ1256'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55704', 'left', 'isa', ['FJ1254'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55705', 'right', 'isa', ['FJ1268'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55706', 'right', 'isa', ['FJ1270'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55798', 'right', 'isa', ['FJ1281'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA55799', 'left', 'isa', ['FJ1267'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA57140', 'right', 'isa', ['FJ1273'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA57141', 'left', 'isa', ['FJ1259'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA57142', 'right', 'isa', ['FJ1272'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA57143', 'left', 'isa', ['FJ1258'], 'head-neck', ['head-neck'], 'organ'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.dentalClinicalGroups.length, 6);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.dentalClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['organs', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
  );
  same(e.omittedSourceFiles, omittedByFma[f] ?? []);
  const group = api.dentalClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.dentalClinicalLesson(s, t);
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
        .dentalClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { category: category === 'organ' ? 'space' : 'organ' },
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
      same(api.dentalClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.dentalClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 28);
same(new Set(ids).size, 28);
same(new Set(expected.flatMap((e) => e[3])).size, 28);
same(expected.filter((e) => e[2] === 'isa' && e[6] === 'organ').length, 28);
same(expected.filter((e) => e[1] === 'left').length, 14);
same(expected.filter((e) => e[1] === 'right').length, 14);
for (const f of ids) {
  same(entry(f).region, 'head-neck');
  same(entry(f).regions, ['head-neck']);
  same(entry(f).sources.length, 1);
  check(entry(f).name.includes('secondary'));
  check(!/third|wisdom|primary/i.test(entry(f).name));
}
same(
  api.dentalClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['incisors', 8],
    ['upper-canines', 2],
    ['lower-canines', 2],
    ['premolars', 8],
    ['upper-molars', 4],
    ['lower-molars', 4],
  ],
);
for (const g of api.dentalClinicalGroups) {
  check(g.scope.includes('not independently segmented'));
  check(g.scope.includes('No dental numbering'));
}
check(
  api.dentalClinicalGroups
    .find((g) => g.key === 'incisors')
    .clinical.body.includes('Do not reinsert a baby tooth'),
);
check(
  api.dentalClinicalGroups
    .find((g) => g.key === 'lower-molars')
    .clinical.body.includes('call 999'),
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.dentalClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.dentalClinicalLesson(entry(f), tab), undefined);
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
    same(
      rows.map((r) => r[2]).sort(),
      [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
    );
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}

const negatives = [
  ['FMA55680', 'pathology', 'readiness'],
  ['FMA55681', 'clinical', 'body'],
  ['FMA55682', 'pathology', 'body'],
  ['FMA55683', 'clinical', 'body'],
  ['FMA55686', 'pathology', 'body'],
  ['FMA55687', 'clinical', 'readiness'],
  ['FMA55688', 'pathology', 'body'],
  ['FMA55689', 'clinical', 'body'],
  ['FMA55690', 'pathology', 'body'],
  ['FMA55691', 'clinical', 'body'],
  ['FMA55692', 'pathology', 'readiness'],
  ['FMA55693', 'clinical', 'body'],
  ['FMA55694', 'pathology', 'body'],
  ['FMA55695', 'clinical', 'body'],
  ['FMA55697', 'pathology', 'body'],
  ['FMA55698', 'clinical', 'readiness'],
  ['FMA55699', 'pathology', 'body'],
  ['FMA55700', 'clinical', 'body'],
  ['FMA55703', 'pathology', 'body'],
  ['FMA55704', 'clinical', 'body'],
  ['FMA55705', 'pathology', 'readiness'],
  ['FMA55706', 'clinical', 'body'],
  ['FMA55798', 'pathology', 'body'],
  ['FMA55799', 'clinical', 'body'],
  ['FMA57140', 'pathology', 'body'],
  ['FMA57141', 'clinical', 'readiness'],
  ['FMA57142', 'pathology', 'body'],
  ['FMA57143', 'clinical', 'body'],
  ['FMA55680', 'anatomy', 'body'],
  ['FMA55681', 'function', 'body'],
  ['FMA55682', 'ct', 'body'],
  ['FMA13889', 'clinical', 'body'],
  ['FMA12514', 'clinical', 'body'],
  ['FMA45097', 'clinical', 'readiness'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'clinical', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA61970', 'clinical', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'clinical', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
  ['FMA13322', 'clinical', 'body'],
  ['FMA23130', 'clinical', 'body'],
  ['FMA13395', 'clinical', 'body'],
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
    draft: 702,
    'identity-only': 0,
    pending: 320,
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
  bodyRepresentations: 28,
  sourceComponents: 28,
  lessonGroups: 6,
  explicitTopicEdits: 56,
  combinedPinnedCurriculumSections: 2984,
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
    'Original permanent-tooth clinical drafts; exact sides, arches and named tooth positions retained. No wisdom-tooth addition, invented clinical numbering, internal dental segmentation, patient diagnosis, procedure, scan or clinical approval.',
};
await writeFile(
  new URL('docs/dental-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
