import assert from 'node:assert/strict';
import { authoringBeforePelvicVesselClinical } from './pelvic-vessel-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAbdominalVesselClinical } from './abdominal-vessel-clinical-curriculum-transition.mjs';
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
  'content/abdominal-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAbdominalVesselClinical(context);
const milestone = await authoringBeforePelvicVesselClinical(context);
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
    'FMA3789',
    'midline',
    'isa',
    ['FJ1932'],
    'abdomen',
    ['abdomen', 'pelvis', 'thorax'],
    'vessel',
  ],
  [
    'FMA10951',
    'unspecified',
    'isa',
    ['FJ3441', 'FJ3659'],
    'abdomen',
    ['abdomen', 'pelvis', 'thorax'],
    'vessel',
  ],
  [
    'FMA50737',
    'unspecified',
    'isa',
    ['FJ1846', 'FJ2013'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14749',
    'midline',
    'isa',
    ['FJ1928', 'FJ2011'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14750',
    'unspecified',
    'isa',
    ['FJ3442'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  ['FMA14771', 'midline', 'isa', ['FJ3078'], 'abdomen', ['abdomen'], 'vessel'],
  [
    'FMA14772',
    'unspecified',
    'isa',
    ['FJ3081'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14773',
    'unspecified',
    'isa',
    ['FJ2562', 'FJ3420', 'FJ3544', 'FJ3640'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  ['FMA14768', 'left', 'isa', ['FJ3499'], 'abdomen', ['abdomen'], 'vessel'],
  [
    'FMA50735',
    'unspecified',
    'isa',
    ['FJ1853'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  ['FMA14752', 'right', 'isa', ['FJ2038'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14753', 'left', 'isa', ['FJ2046'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14338', 'right', 'isa', ['FJ2416'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14339', 'left', 'isa', ['FJ2415'], 'abdomen', ['abdomen'], 'vessel'],
  [
    'FMA14332',
    'unspecified',
    'isa',
    ['FJ3647'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  ['FMA14810', 'midline', 'isa', ['FJ3542'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14811', 'right', 'isa', ['FJ3590'], 'abdomen', ['abdomen'], 'vessel'],
  [
    'FMA14815',
    'unspecified',
    'isa',
    ['FJ3439'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14818',
    'unspecified',
    'isa',
    ['FJ3410'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14820',
    'unspecified',
    'isa',
    ['FJ3414'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  ['FMA14824', 'midline', 'isa', ['FJ2025'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14826', 'left', 'isa', ['FJ3494'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14828', 'left', 'isa', ['FJ3399'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA14829', 'left', 'isa', ['FJ3428'], 'abdomen', ['abdomen'], 'vessel'],
  [
    'FMA15391',
    'unspecified',
    'isa',
    ['FJ3443'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA15405',
    'unspecified',
    'isa',
    ['FJ3438'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  ['FMA15406', 'midline', 'isa', ['FJ3543'], 'abdomen', ['abdomen'], 'vessel'],
  ['FMA15407', 'right', 'isa', ['FJ3591'], 'abdomen', ['abdomen'], 'vessel'],
  [
    'FMA14782',
    'unspecified',
    'isa',
    ['FJ3409'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14784',
    'unspecified',
    'isa',
    ['FJ3557'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14787',
    'unspecified',
    'isa',
    ['FJ3430'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14790',
    'unspecified',
    'isa',
    ['FJ3444'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14792',
    'unspecified',
    'isa',
    ['FJ3433'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14793',
    'unspecified',
    'isa',
    ['FJ3419'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA14805',
    'unspecified',
    'isa',
    ['FJ3446'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA15398',
    'unspecified',
    'isa',
    ['FJ3545', 'FJ3646', 'FJ3655'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA70479',
    'unspecified',
    'isa',
    ['FJ3401'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA70480',
    'unspecified',
    'isa',
    ['FJ3546'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
  [
    'FMA76574',
    'unspecified',
    'isa',
    ['FJ3432'],
    'abdomen',
    ['abdomen'],
    'vessel',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.abdominalVesselClinicalGroups.length, 21);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.abdominalVesselClinicalGroups
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
  const group = api.abdominalVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.abdominalVesselClinicalLesson(s, t);
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
        .abdominalVesselClinicalLesson(
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
        api.abdominalVesselClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.abdominalVesselClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 39);
same(new Set(ids).size, 39);
same(new Set(expected.flatMap((e) => e[3])).size, 47);
same(expected.filter((e) => e[1] === 'left').length, 6);
same(expected.filter((e) => e[1] === 'right').length, 4);
same(expected.filter((e) => e[1] === 'midline').length, 6);
same(expected.filter((e) => e[1] === 'unspecified').length, 23);
same(expected.filter((e) => e[2] === 'partof').length, 0);
same(expected.filter((e) => e[2] === 'isa').length, 39);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(
  api.abdominalVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['abdominal-aorta', 1],
    ['inferior-vena-cava', 1],
    ['celiac-artery', 1],
    ['superior-mesenteric-artery', 1],
    ['inferior-mesenteric-artery', 1],
    ['hepatic-arterial-inflow', 2],
    ['splenic-artery', 1],
    ['left-gastric-artery', 1],
    ['portal-venous-inflow', 1],
    ['renal-arteries', 2],
    ['hepatic-venous-outflow', 2],
    ['mesenteric-veins', 5],
    ['middle-and-right-colic-arteries', 2],
    ['ileocolic-arterial-branches', 2],
    ['appendicular-artery', 1],
    ['marginal-colic-artery', 1],
    ['left-colic-branches', 3],
    ['pancreaticoduodenal-arteries', 5],
    ['gastroduodenal-artery', 1],
    ['pancreatic-body-tail-arteries', 4],
    ['pancreaticoduodenal-vein', 1],
  ],
);
for (const g of api.abdominalVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
for (const [f, n] of [
  ['FMA10951', 2],
  ['FMA50737', 2],
  ['FMA14749', 2],
  ['FMA14773', 4],
  ['FMA15398', 3],
])
  same(entry(f).sources.length, n);
for (const e of expected) same(entry(e[0]).sourceTree, 'isa');
for (const f of ['FMA3789', 'FMA10951'])
  same(entry(f).regions, ['abdomen', 'pelvis', 'thorax']);
same(
  entry('FMA14820').name,
  'Ascending branch of inferior branch of ileocolic artery',
);
same(
  entry('FMA15398').sources.map((s) => s.file),
  ['FJ3545', 'FJ3646', 'FJ3655'],
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'abdomen' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.abdominalVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.abdominalVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA3789', 'pathology', 'readiness'],
  ['FMA10951', 'clinical', 'body'],
  ['FMA50737', 'pathology', 'body'],
  ['FMA14749', 'clinical', 'body'],
  ['FMA14750', 'pathology', 'readiness'],
  ['FMA14771', 'clinical', 'body'],
  ['FMA14772', 'pathology', 'body'],
  ['FMA14773', 'clinical', 'body'],
  ['FMA14768', 'pathology', 'readiness'],
  ['FMA50735', 'clinical', 'body'],
  ['FMA14752', 'pathology', 'body'],
  ['FMA14753', 'clinical', 'body'],
  ['FMA14338', 'pathology', 'readiness'],
  ['FMA14339', 'clinical', 'body'],
  ['FMA14332', 'pathology', 'body'],
  ['FMA14810', 'clinical', 'body'],
  ['FMA14811', 'pathology', 'readiness'],
  ['FMA14815', 'clinical', 'body'],
  ['FMA14818', 'pathology', 'body'],
  ['FMA14820', 'clinical', 'body'],
  ['FMA14824', 'pathology', 'readiness'],
  ['FMA14826', 'clinical', 'body'],
  ['FMA14828', 'pathology', 'body'],
  ['FMA14829', 'clinical', 'body'],
  ['FMA15391', 'pathology', 'readiness'],
  ['FMA15405', 'clinical', 'body'],
  ['FMA15406', 'pathology', 'body'],
  ['FMA15407', 'clinical', 'body'],
  ['FMA14782', 'pathology', 'readiness'],
  ['FMA14784', 'clinical', 'body'],
  ['FMA14787', 'pathology', 'body'],
  ['FMA14790', 'clinical', 'body'],
  ['FMA14792', 'pathology', 'readiness'],
  ['FMA14793', 'clinical', 'body'],
  ['FMA14805', 'pathology', 'body'],
  ['FMA15398', 'clinical', 'body'],
  ['FMA70479', 'pathology', 'readiness'],
  ['FMA70480', 'clinical', 'body'],
  ['FMA76574', 'pathology', 'body'],
  ['FMA3789', 'anatomy', 'body'],
  ['FMA15398', 'function', 'body'],
  ['FMA14749', 'ct', 'body'],
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
    draft: 868,
    'identity-only': 0,
    pending: 154,
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
  bodyRepresentations: 39,
  sourceComponents: 47,
  lessonGroups: 21,
  explicitTopicEdits: 78,
  combinedPinnedCurriculumSections: 3316,
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
    'Original primary-abdomen vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/abdominal-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
