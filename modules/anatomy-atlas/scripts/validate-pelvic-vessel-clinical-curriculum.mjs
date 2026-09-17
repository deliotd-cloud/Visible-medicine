import assert from 'node:assert/strict';
import { authoringBeforeHeadNeckVesselClinical } from './head-neck-vessel-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforePelvicVesselClinical } from './pelvic-vessel-clinical-curriculum-transition.mjs';
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
  'content/pelvic-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforePelvicVesselClinical(context);
const milestone = await authoringBeforeHeadNeckVesselClinical(context);
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
  [
    'FMA14765',
    'right',
    'isa',
    ['FJ3565'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA14766',
    'left',
    'isa',
    ['FJ3464'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18806',
    'right',
    'isa',
    ['FJ3567'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18807',
    'left',
    'isa',
    ['FJ3466'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18809',
    'right',
    'isa',
    ['FJ3569'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18810',
    'left',
    'isa',
    ['FJ3468'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA21387',
    'right',
    'isa',
    ['FJ3566'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA21388',
    'left',
    'isa',
    ['FJ3465'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18885',
    'right',
    'isa',
    ['FJ3568'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18886',
    'left',
    'isa',
    ['FJ3484', 'FJ3522', 'FJ3523', 'FJ3524'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18887',
    'right',
    'isa',
    ['FJ3570', 'FJ3571', 'FJ3572', 'FJ3607', 'FJ3608', 'FJ3609'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
  [
    'FMA18888',
    'left',
    'isa',
    ['FJ3469', 'FJ3470', 'FJ3471'],
    'pelvis',
    ['pelvis', 'abdomen', 'thigh'],
    'vessel',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.pelvicVesselClinicalGroups.length, 7);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.pelvicVesselClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['vessels', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
  );
  same(e.omittedSourceFiles, omittedByFma[f] ?? []);
  const group = api.pelvicVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.pelvicVesselClinicalLesson(s, t);
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
        .pelvicVesselClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { category: category === 'ligament' ? 'fascia' : 'ligament' },
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
      same(api.pelvicVesselClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.pelvicVesselClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 12);
same(new Set(ids).size, 12);
same(new Set(expected.flatMap((e) => e[3])).size, 22);
same(expected.filter((e) => e[1] === 'left').length, 6);
same(expected.filter((e) => e[1] === 'right').length, 6);
same(
  expected.every((e) => e[2] === 'isa' && e[6] === 'vessel'),
  true,
);
same(
  api.pelvicVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['common-iliac-arteries', 2],
    ['external-iliac-arteries', 2],
    ['internal-iliac-arteries', 2],
    ['right-common-iliac-vein', 1],
    ['left-common-iliac-vein', 1],
    ['external-iliac-veins', 2],
    ['internal-iliac-veins', 2],
  ],
);
for (const g of api.pelvicVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
for (const [f, n] of [
  ['FMA18885', 1],
  ['FMA18886', 4],
  ['FMA18887', 6],
  ['FMA18888', 3],
])
  same(entry(f).sources.length, n);
for (const f of ids) same(entry(f).regions, ['pelvis', 'abdomen', 'thigh']);
same(
  api.pelvicVesselClinicalGroups
    .find((g) => g.key === 'left-common-iliac-vein')
    .pathology.body.includes('right common iliac artery'),
  true,
);
same(
  api.pelvicVesselClinicalGroups
    .find((g) => g.key === 'internal-iliac-veins')
    .scope.includes('Six right and three left'),
  true,
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'pelvis' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.pelvicVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.pelvicVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA14765', 'pathology', 'readiness'],
  ['FMA14766', 'clinical', 'body'],
  ['FMA18806', 'pathology', 'body'],
  ['FMA18807', 'clinical', 'body'],
  ['FMA18809', 'pathology', 'readiness'],
  ['FMA18810', 'clinical', 'body'],
  ['FMA21387', 'pathology', 'body'],
  ['FMA21388', 'clinical', 'body'],
  ['FMA18885', 'pathology', 'readiness'],
  ['FMA18886', 'clinical', 'body'],
  ['FMA18887', 'pathology', 'body'],
  ['FMA18888', 'clinical', 'body'],
  ['FMA14765', 'anatomy', 'body'],
  ['FMA18888', 'function', 'body'],
  ['FMA21388', 'ct', 'body'],
  ['FMA16037', 'clinical', 'body'],
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
    draft: 880,
    'identity-only': 0,
    pending: 142,
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
  bodyRepresentations: 12,
  sourceComponents: 22,
  lessonGroups: 7,
  explicitTopicEdits: 24,
  combinedPinnedCurriculumSections: 3340,
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
    'Original primary-pelvis vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/pelvic-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
