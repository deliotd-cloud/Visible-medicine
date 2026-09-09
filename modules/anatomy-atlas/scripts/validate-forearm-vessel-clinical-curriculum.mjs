import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeForearmVesselClinical } from './forearm-vessel-clinical-curriculum-transition.mjs';
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
  'content/forearm-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeForearmVesselClinical(context);
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
// Independently observed official source rows, not inferred from runtime lessons.
/** @type {Record<string, string[]>} */
const omittedByFma = {};
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  [
    'FMA22733',
    'right',
    'isa',
    ['FJ2294'],
    'forearm',
    ['forearm', 'hand'],
    'vessel',
  ],
  [
    'FMA22734',
    'left',
    'isa',
    ['FJ2242'],
    'forearm',
    ['forearm', 'hand'],
    'vessel',
  ],
  [
    'FMA22797',
    'right',
    'isa',
    ['FJ2310'],
    'forearm',
    ['forearm', 'hand'],
    'vessel',
  ],
  [
    'FMA22798',
    'left',
    'isa',
    ['FJ2258'],
    'forearm',
    ['forearm', 'hand'],
    'vessel',
  ],
  [
    'FMA22812',
    'right',
    'isa',
    ['FJ2266'],
    'forearm',
    ['forearm', 'hand'],
    'vessel',
  ],
  [
    'FMA22813',
    'left',
    'isa',
    ['FJ2214'],
    'forearm',
    ['forearm', 'hand'],
    'vessel',
  ],
  [
    'FMA13325',
    'right',
    'isa',
    ['FJ2272'],
    'forearm',
    ['forearm', 'shoulder-arm'],
    'vessel',
  ],
  [
    'FMA13326',
    'left',
    'isa',
    ['FJ2220'],
    'forearm',
    ['forearm', 'shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22909',
    'right',
    'isa',
    ['FJ2270'],
    'forearm',
    ['forearm', 'shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22910',
    'left',
    'isa',
    ['FJ2218'],
    'forearm',
    ['forearm', 'shoulder-arm'],
    'vessel',
  ],
  ['FMA22808', 'left', 'isa', ['FJ2223'], 'forearm', ['forearm'], 'vessel'],
  ['FMA22807', 'right', 'isa', ['FJ2275'], 'forearm', ['forearm'], 'vessel'],
  ['FMA268669', 'left', 'isa', ['FJ2245'], 'forearm', ['forearm'], 'vessel'],
  ['FMA268667', 'right', 'isa', ['FJ2297'], 'forearm', ['forearm'], 'vessel'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.forearmVesselClinicalGroups.length, 7);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.forearmVesselClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.forearmVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.forearmVesselClinicalLesson(s, t);
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
        .forearmVesselClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(
        api.forearmVesselClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.forearmVesselClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 14);
same(new Set(ids).size, 14);
same(new Set(expected.flatMap((e) => e[3])).size, 14);
same(expected.filter((e) => e[1] === 'left').length, 7);
same(expected.filter((e) => e[1] === 'right').length, 7);
same(expected.filter((e) => e[1] === 'midline').length, 0);
same(expected.filter((e) => e[2] === 'isa').length, 14);
same(expected.filter((e) => e[2] === 'partof').length, 0);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(expected.flatMap((e) => e[3]).filter((f) => f.endsWith('M')).length, 0);
same(
  api.forearmVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['radial-arteries', 2],
    ['ulnar-arteries', 2],
    ['anterior-interosseous-arteries', 2],
    ['cephalic-veins', 2],
    ['basilic-veins', 2],
    ['common-interosseous-arteries', 2],
    ['recurrent-interosseous-arteries', 2],
  ],
);
for (const g of api.forearmVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
const groupByKey = (key) =>
  api.forearmVesselClinicalGroups.find((g) => g.key === key);
check(
  groupByKey('radial-arteries').pathology.body.includes(
    'without obvious symptoms',
  ),
);
check(
  groupByKey('ulnar-arteries').pathology.bullets.some((b) =>
    b.includes('hypothesis'),
  ),
);
check(
  groupByKey('anterior-interosseous-arteries').scope.includes(
    'not their namesake nerves',
  ),
);
check(
  groupByKey('cephalic-veins').clinical.body.includes(
    'not the normal venous anatomy',
  ),
);
check(
  groupByKey('basilic-veins').clinical.bullets.some((b) =>
    b.includes('No universal preferred vein'),
  ),
);
check(
  groupByKey('common-interosseous-arteries').pathology.bullets.some((b) =>
    b.includes('not a population prevalence'),
  ),
);
check(
  groupByKey('recurrent-interosseous-arteries').clinical.bullets.some((b) =>
    b.includes('No flap dimensions'),
  ),
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'forearm' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.forearmVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.forearmVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA22733', 'pathology', 'readiness'],
  ['FMA22734', 'clinical', 'body'],
  ['FMA22797', 'pathology', 'body'],
  ['FMA22798', 'clinical', 'body'],
  ['FMA22812', 'pathology', 'readiness'],
  ['FMA22813', 'clinical', 'body'],
  ['FMA13325', 'pathology', 'body'],
  ['FMA13326', 'clinical', 'body'],
  ['FMA22909', 'pathology', 'readiness'],
  ['FMA22910', 'clinical', 'body'],
  ['FMA22808', 'pathology', 'body'],
  ['FMA22807', 'clinical', 'body'],
  ['FMA268669', 'pathology', 'readiness'],
  ['FMA268667', 'clinical', 'body'],
  ['FMA22733', 'anatomy', 'body'],
  ['FMA268669', 'function', 'body'],
  ['FMA13325', 'ct', 'body'],
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
        catalog.structures.filter((s) => api.bodyLesson(s, t).readiness === r)
          .length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 944,
    'identity-only': 0,
    pending: 78,
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
  bodyRepresentations: 14,
  sourceComponents: 14,
  lessonGroups: 7,
  explicitTopicEdits: 28,
  combinedPinnedCurriculumSections: 3468,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: Object.fromEntries(api.contentTabs.map((t) => [t, counts(t)])),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(api)),
  limitations:
    'Original primary-forearm vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/forearm-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
