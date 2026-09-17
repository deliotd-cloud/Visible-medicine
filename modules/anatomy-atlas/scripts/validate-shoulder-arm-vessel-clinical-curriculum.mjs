import assert from 'node:assert/strict';
import { authoringBeforeForearmVesselClinical } from './forearm-vessel-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeShoulderArmVesselClinical } from './shoulder-arm-vessel-clinical-curriculum-transition.mjs';
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
  'content/shoulder-arm-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeShoulderArmVesselClinical(context);
const milestone = await authoringBeforeForearmVesselClinical(context);
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
    'FMA22655',
    'right',
    'isa',
    ['FJ2268'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22656',
    'left',
    'isa',
    ['FJ2216'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22691',
    'right',
    'isa',
    ['FJ2271'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22692',
    'left',
    'isa',
    ['FJ2219'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22696',
    'right',
    'isa',
    ['FJ2277'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22697',
    'left',
    'isa',
    ['FJ2225'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22682',
    'right',
    'isa',
    ['FJ2264'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22683',
    'left',
    'isa',
    ['FJ2212'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22685',
    'right',
    'isa',
    ['FJ2291', 'FJ2292'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA22687',
    'left',
    'isa',
    ['FJ2239', 'FJ2240'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA23180',
    'right',
    'isa',
    ['FJ2273'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA23181',
    'left',
    'isa',
    ['FJ2221'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA66321',
    'right',
    'isa',
    ['FJ2305'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA66322',
    'left',
    'isa',
    ['FJ2253'],
    'shoulder-arm',
    ['shoulder-arm'],
    'vessel',
  ],
  [
    'FMA3992',
    'right',
    'isa',
    ['FJ2307'],
    'shoulder-arm',
    ['shoulder-arm', 'head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4084',
    'left',
    'isa',
    ['FJ2255'],
    'shoulder-arm',
    ['shoulder-arm', 'head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA5039',
    'right',
    'isa',
    ['FJ2276'],
    'shoulder-arm',
    ['shoulder-arm', 'head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4086',
    'left',
    'isa',
    ['FJ2224'],
    'shoulder-arm',
    ['shoulder-arm', 'head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4057',
    'right',
    'isa',
    ['FJ2284'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA10552',
    'left',
    'isa',
    ['FJ2232'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA10698',
    'right',
    'isa',
    ['FJ2303'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA10681',
    'left',
    'isa',
    ['FJ2251'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA13330',
    'right',
    'isa',
    ['FJ2269'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA13331',
    'left',
    'isa',
    ['FJ2217'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA50859',
    'right',
    'isa',
    ['FJ2302'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA50860',
    'left',
    'isa',
    ['FJ2250'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA66563',
    'right',
    'isa',
    ['FJ2304'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA66564',
    'left',
    'isa',
    ['FJ2252'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA23063',
    'right',
    'isa',
    ['FJ2361'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA23064',
    'left',
    'isa',
    ['FJ2330'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA23068',
    'right',
    'isa',
    ['FJ2263'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA23069',
    'left',
    'isa',
    ['FJ2211'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA23072',
    'right',
    'isa',
    ['FJ2282'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
  [
    'FMA23073',
    'left',
    'isa',
    ['FJ2230'],
    'shoulder-arm',
    ['shoulder-arm', 'thorax'],
    'vessel',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.shoulderArmVesselClinicalGroups.length, 17);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.shoulderArmVesselClinicalGroups
    .flatMap((g) => g.identities)
    .sort(byIdentity),
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
  const group = api.shoulderArmVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.shoulderArmVesselClinicalLesson(s, t);
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
        .shoulderArmVesselClinicalLesson(
          { ...s, coverageNote: 'Keep warning' },
          t,
        )
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
        api.shoulderArmVesselClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.shoulderArmVesselClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 34);
same(new Set(ids).size, 34);
same(new Set(expected.flatMap((e) => e[3])).size, 36);
same(expected.filter((e) => e[1] === 'left').length, 17);
same(expected.filter((e) => e[1] === 'right').length, 17);
same(expected.filter((e) => e[1] === 'midline').length, 0);
same(expected.filter((e) => e[2] === 'isa').length, 34);
same(expected.filter((e) => e[2] === 'partof').length, 0);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(expected.flatMap((e) => e[3]).filter((f) => f.endsWith('M')).length, 0);
same(
  api.shoulderArmVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['axillary-arteries', 2],
    ['brachial-arteries', 2],
    ['deep-brachial-arteries', 2],
    ['anterior-circumflex-humeral-arteries', 2],
    ['posterior-circumflex-humeral-arteries', 2],
    ['circumflex-scapular-arteries', 2],
    ['thoracodorsal-arteries', 2],
    ['thyrocervical-trunks', 2],
    ['costocervical-trunks', 2],
    ['dorsal-scapular-arteries', 2],
    ['suprascapular-arteries', 2],
    ['axillary-veins', 2],
    ['suprascapular-veins', 2],
    ['thoracoacromial-trunks', 2],
    ['pectoral-thoracoacromial-branches', 2],
    ['acromial-thoracoacromial-branches', 2],
    ['deltoid-thoracoacromial-branches', 2],
  ],
);
for (const g of api.shoulderArmVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
for (const f of ['FMA22685', 'FMA22687']) same(entry(f).sources.length, 2);
same(
  api.shoulderArmVesselClinicalGroups
    .find((g) => g.key === 'brachial-arteries')
    .scope.includes("not a child's"),
  true,
);
same(
  api.shoulderArmVesselClinicalGroups
    .find((g) => g.key === 'deep-brachial-arteries')
    .pathology.bullets.some((b) => b.includes('normal neurovascular')),
  true,
);
same(
  api.shoulderArmVesselClinicalGroups
    .find((g) => g.key === 'suprascapular-veins')
    .pathology.body.includes('above or below'),
  true,
);
same(
  api.shoulderArmVesselClinicalGroups
    .find((g) => g.key === 'thoracoacromial-trunks')
    .scope.includes('No missing clavicular branch'),
  true,
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'shoulder-arm' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.shoulderArmVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.shoulderArmVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA22655', 'pathology', 'readiness'],
  ['FMA22656', 'clinical', 'body'],
  ['FMA22691', 'pathology', 'body'],
  ['FMA22692', 'clinical', 'body'],
  ['FMA22696', 'pathology', 'readiness'],
  ['FMA22697', 'clinical', 'body'],
  ['FMA22682', 'pathology', 'body'],
  ['FMA22683', 'clinical', 'body'],
  ['FMA22685', 'pathology', 'readiness'],
  ['FMA22687', 'clinical', 'body'],
  ['FMA23180', 'pathology', 'body'],
  ['FMA23181', 'clinical', 'body'],
  ['FMA66321', 'pathology', 'readiness'],
  ['FMA66322', 'clinical', 'body'],
  ['FMA3992', 'pathology', 'body'],
  ['FMA4084', 'clinical', 'body'],
  ['FMA5039', 'pathology', 'readiness'],
  ['FMA4086', 'clinical', 'body'],
  ['FMA4057', 'pathology', 'body'],
  ['FMA10552', 'clinical', 'body'],
  ['FMA10698', 'pathology', 'readiness'],
  ['FMA10681', 'clinical', 'body'],
  ['FMA13330', 'pathology', 'body'],
  ['FMA13331', 'clinical', 'body'],
  ['FMA50859', 'pathology', 'readiness'],
  ['FMA50860', 'clinical', 'body'],
  ['FMA66563', 'pathology', 'body'],
  ['FMA66564', 'clinical', 'body'],
  ['FMA23063', 'pathology', 'readiness'],
  ['FMA23064', 'clinical', 'body'],
  ['FMA23068', 'pathology', 'body'],
  ['FMA23069', 'clinical', 'body'],
  ['FMA23072', 'pathology', 'readiness'],
  ['FMA23073', 'clinical', 'body'],
  ['FMA22655', 'anatomy', 'body'],
  ['FMA23073', 'function', 'body'],
  ['FMA13330', 'ct', 'body'],
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
    draft: 930,
    'identity-only': 0,
    pending: 92,
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
  bodyRepresentations: 34,
  sourceComponents: 36,
  lessonGroups: 17,
  explicitTopicEdits: 68,
  combinedPinnedCurriculumSections: 3440,
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
    'Original primary-shoulder-arm vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/shoulder-arm-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
