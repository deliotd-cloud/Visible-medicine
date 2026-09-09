import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeLowerLimbVesselClinical } from './lower-limb-vessel-clinical-curriculum-transition.mjs';
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
  'content/lower-limb-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeLowerLimbVesselClinical(context);
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
    'FMA70249',
    'right',
    'isa',
    ['FJ2143'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA70250',
    'left',
    'isa',
    ['FJ2074'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA20796',
    'right',
    'partof',
    ['FJ2137', 'FJ2158'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA20797',
    'left',
    'partof',
    ['FJ2069', 'FJ2078'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA21188',
    'right',
    'isa',
    ['FJ2144'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA21189',
    'left',
    'isa',
    ['FJ2102'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA21379',
    'right',
    'isa',
    ['FJ2145'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  [
    'FMA21380',
    'left',
    'isa',
    ['FJ2103'],
    'thigh',
    ['thigh', 'pelvis', 'leg'],
    'vessel',
  ],
  ['FMA77380', 'right', 'isa', ['FJ2170'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA77381', 'left', 'isa', ['FJ2086'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA43896', 'right', 'isa', ['FJ2130'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA43897', 'left', 'isa', ['FJ2065'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA43898', 'right', 'isa', ['FJ2172'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA43899', 'left', 'isa', ['FJ2087'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA44328', 'right', 'isa', ['FJ2171'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA44329', 'left', 'isa', ['FJ2117'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA44334', 'right', 'isa', ['FJ2176'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA44335', 'left', 'isa', ['FJ2121'], 'leg', ['leg', 'foot'], 'vessel'],
  ['FMA43916', 'right', 'isa', ['FJ2055'], 'foot', ['foot'], 'vessel'],
  ['FMA43917', 'left', 'isa', ['FJ2073'], 'foot', ['foot'], 'vessel'],
  ['FMA43929', 'right', 'isa', ['FJ2164'], 'foot', ['foot'], 'vessel'],
  ['FMA43930', 'left', 'isa', ['FJ2082'], 'foot', ['foot'], 'vessel'],
  ['FMA43931', 'right', 'isa', ['FJ2159'], 'foot', ['foot'], 'vessel'],
  ['FMA43932', 'left', 'isa', ['FJ2079'], 'foot', ['foot'], 'vessel'],
  ['FMA43943', 'right', 'isa', ['FJ2169'], 'foot', ['foot'], 'vessel'],
  ['FMA43944', 'left', 'isa', ['FJ2085'], 'foot', ['foot'], 'vessel'],
  ['FMA69514', 'right', 'isa', ['FJ2136'], 'foot', ['foot'], 'vessel'],
  ['FMA69515', 'left', 'isa', ['FJ2068'], 'foot', ['foot'], 'vessel'],
  ['FMA43937', 'right', 'isa', ['FJ2179'], 'foot', ['foot'], 'vessel'],
  ['FMA43938', 'left', 'isa', ['FJ2089'], 'foot', ['foot'], 'vessel'],
  [
    'FMA44881',
    'right',
    'isa',
    ['FJ2061', 'FJ2062'],
    'foot',
    ['foot'],
    'vessel',
  ],
  ['FMA44882', 'left', 'isa', ['FJ2059', 'FJ2060'], 'foot', ['foot'], 'vessel'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.lowerLimbVesselClinicalGroups.length, 16);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.lowerLimbVesselClinicalGroups
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
  const group = api.lowerLimbVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.lowerLimbVesselClinicalLesson(s, t);
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
        .lowerLimbVesselClinicalLesson(
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
        api.lowerLimbVesselClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.lowerLimbVesselClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 32);
same(new Set(ids).size, 32);
same(new Set(expected.flatMap((e) => e[3])).size, 36);
same(expected.filter((e) => e[1] === 'left').length, 16);
same(expected.filter((e) => e[1] === 'right').length, 16);
same(expected.filter((e) => e[1] === 'midline').length, 0);
same(expected.filter((e) => e[2] === 'isa').length, 30);
same(expected.filter((e) => e[2] === 'partof').length, 2);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(expected.flatMap((e) => e[3]).filter((f) => f.endsWith('M')).length, 0);
same(
  api.lowerLimbVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['femoral-arteries', 2],
    ['deep-femoral-arteries', 2],
    ['femoral-veins', 2],
    ['great-saphenous-veins', 2],
    ['popliteal-arteries', 2],
    ['anterior-tibial-arteries', 2],
    ['posterior-tibial-arteries', 2],
    ['popliteal-veins', 2],
    ['small-saphenous-veins', 2],
    ['dorsalis-pedis-arteries', 2],
    ['medial-plantar-arteries', 2],
    ['lateral-plantar-arteries', 2],
    ['plantar-arterial-arches', 2],
    ['deep-plantar-arteries', 2],
    ['superficial-medial-plantar-arteries', 2],
    ['dorsal-foot-venous-arches', 2],
  ],
);
for (const g of api.lowerLimbVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
const groupByKey = (key) =>
  api.lowerLimbVesselClinicalGroups.find((g) => g.key === key);

for (const f of ['FMA20796', 'FMA20797']) {
  same(entry(f).sourceTree, 'partof');
  same(entry(f).sources.length, 2);
}
for (const f of ['FMA44881', 'FMA44882']) same(entry(f).sources.length, 2);
check(
  groupByKey('femoral-veins').pathology.body.includes('deep-vein thrombosis'),
);
check(
  groupByKey('posterior-tibial-arteries').pathology.body.includes(
    'does not by itself exclude',
  ),
);
check(
  groupByKey('plantar-arterial-arches').pathology.bullets.some((b) =>
    b.includes('does not prove'),
  ),
);
check(groupByKey('deep-plantar-arteries').scope.includes('do not establish'));
check(
  groupByKey('superficial-medial-plantar-arteries').scope.includes(
    'no newly numbered perforators',
  ),
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      ['thigh', 'leg', 'foot'].includes(s.region) &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.lowerLimbVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.lowerLimbVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA70249', 'pathology', 'readiness'],
  ['FMA70250', 'clinical', 'body'],
  ['FMA20796', 'pathology', 'body'],
  ['FMA20797', 'clinical', 'body'],
  ['FMA21188', 'pathology', 'readiness'],
  ['FMA21189', 'clinical', 'body'],
  ['FMA21379', 'pathology', 'body'],
  ['FMA21380', 'clinical', 'body'],
  ['FMA77380', 'pathology', 'readiness'],
  ['FMA77381', 'clinical', 'body'],
  ['FMA43896', 'pathology', 'body'],
  ['FMA43897', 'clinical', 'body'],
  ['FMA43898', 'pathology', 'readiness'],
  ['FMA43899', 'clinical', 'body'],
  ['FMA44328', 'pathology', 'body'],
  ['FMA44329', 'clinical', 'body'],
  ['FMA44334', 'pathology', 'readiness'],
  ['FMA44335', 'clinical', 'body'],
  ['FMA43916', 'pathology', 'body'],
  ['FMA43917', 'clinical', 'body'],
  ['FMA43929', 'pathology', 'readiness'],
  ['FMA43930', 'clinical', 'body'],
  ['FMA43931', 'pathology', 'body'],
  ['FMA43932', 'clinical', 'body'],
  ['FMA43943', 'pathology', 'readiness'],
  ['FMA43944', 'clinical', 'body'],
  ['FMA69514', 'pathology', 'body'],
  ['FMA69515', 'clinical', 'body'],
  ['FMA43937', 'pathology', 'readiness'],
  ['FMA43938', 'clinical', 'body'],
  ['FMA44881', 'pathology', 'body'],
  ['FMA44882', 'clinical', 'body'],
  ['FMA70249', 'anatomy', 'body'],
  ['FMA44882', 'function', 'body'],
  ['FMA20796', 'ct', 'body'],
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
    draft: 1018,
    'identity-only': 0,
    pending: 4,
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
  bodyRepresentations: 32,
  sourceComponents: 36,
  lessonGroups: 16,
  explicitTopicEdits: 64,
  combinedPinnedCurriculumSections: 3616,
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
    'Original primary-thigh/leg/foot vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/lower-limb-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
