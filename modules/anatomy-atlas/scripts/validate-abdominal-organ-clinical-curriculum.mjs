import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforePelvicOrganClinical } from './pelvic-organ-clinical-curriculum-transition.mjs';
import { authoringBeforeAbdominalOrganClinical } from './abdominal-organ-clinical-curriculum-transition.mjs';
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
  'content/abdominal-organ-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAbdominalOrganClinical(context);
const milestone = await authoringBeforePelvicOrganClinical(context);
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
const omittedByFma = {
  FMA7197: ['FJ2415', 'FJ2416', 'FJ3081'],
  FMA7200: ['FJ2599'],
  FMA7201: ['FJ2571', 'FJ2599'],
};
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  [
    'FMA7197',
    'unpaired',
    'partof',
    [
      'FJ1883',
      'FJ1893',
      'FJ1913',
      'FJ1914',
      'FJ1916',
      'FJ2386',
      'FJ2404',
      'FJ2405',
      'FJ2409',
      'FJ2816',
      'FJ2818',
      'FJ2819',
      'FJ2820',
      'FJ2821',
      'FJ2822',
      'FJ2823',
      'FJ2824',
      'FJ3071',
      'FJ3072',
      'FJ3073',
      'FJ3074',
      'FJ3075',
      'FJ3076',
      'FJ3077',
      'FJ3083',
      'FJ3086',
      'FJ3088',
      'FJ3089',
      'FJ3090',
      'FJ3091',
      'FJ3092',
      'FJ3093',
      'FJ3095',
      'FJ3096',
      'FJ3102',
      'FJ3103',
      'FJ3104',
      'FJ3105',
      'FJ3106',
      'FJ3107',
      'FJ3108',
      'FJ3109',
      'FJ3110',
      'FJ3111',
      'FJ3112',
      'FJ3113',
      'FJ3114',
      'FJ3115',
      'FJ3116',
      'FJ3117',
      'FJ3122',
      'FJ3123',
      'FJ3124',
      'FJ3125',
      'FJ3126',
      'FJ3127',
      'FJ3128',
    ],
    'abdomen',
    ['abdomen'],
    'organ',
  ],
  [
    'FMA7198',
    'unpaired',
    'partof',
    ['FJ1895', 'FJ1896', 'FJ2629', 'FJ2630'],
    'abdomen',
    ['abdomen'],
    'organ',
  ],
  [
    'FMA7148',
    'unpaired',
    'partof',
    ['FJ2564'],
    'abdomen',
    ['abdomen'],
    'organ',
  ],
  [
    'FMA7200',
    'unpaired',
    'partof',
    [
      'FJ2573',
      'FJ2574',
      'FJ2575',
      'FJ2576',
      'FJ2577',
      'FJ2578',
      'FJ2579',
      'FJ2580',
      'FJ2581',
      'FJ2582',
      'FJ2583',
      'FJ2584',
      'FJ2585',
      'FJ2586',
      'FJ2587',
      'FJ2588',
      'FJ2589',
      'FJ2590',
      'FJ2591',
      'FJ2592',
      'FJ2593',
      'FJ2594',
      'FJ2595',
      'FJ2596',
      'FJ2597',
      'FJ2598',
      'FJ2600',
      'FJ2601',
      'FJ2602',
      'FJ2603',
      'FJ2604',
      'FJ2605',
      'FJ2606',
      'FJ2607',
      'FJ2608',
      'FJ2609',
      'FJ2610',
      'FJ2611',
      'FJ2612',
      'FJ2613',
      'FJ2614',
      'FJ2615',
      'FJ2616',
      'FJ2617',
      'FJ2618',
      'FJ2619',
      'FJ2620',
      'FJ2621',
      'FJ2622',
      'FJ2623',
      'FJ2624',
      'FJ2625',
      'FJ2626',
      'FJ2627',
      'FJ2628',
    ],
    'abdomen',
    ['abdomen'],
    'organ',
  ],
  [
    'FMA7201',
    'unpaired',
    'partof',
    ['FJ2566', 'FJ2567', 'FJ2568', 'FJ2569', 'FJ2570', 'FJ2572'],
    'abdomen',
    ['abdomen'],
    'organ',
  ],
  [
    'FMA7202',
    'unpaired',
    'partof',
    ['FJ2817'],
    'abdomen',
    ['abdomen'],
    'organ',
  ],
  ['FMA7204', 'right', 'partof', ['FJ3147'], 'abdomen', ['abdomen'], 'organ'],
  ['FMA7205', 'left', 'partof', ['FJ3145'], 'abdomen', ['abdomen'], 'organ'],
  ['FMA7196', 'unpaired', 'isa', ['FJ2561'], 'abdomen', ['abdomen'], 'organ'],
  ['FMA15629', 'right', 'isa', ['FJ3130'], 'abdomen', ['abdomen'], 'organ'],
  ['FMA15630', 'left', 'isa', ['FJ3129'], 'abdomen', ['abdomen'], 'organ'],
  [
    'FMA15571',
    'right',
    'partof',
    ['FJ3146'],
    'abdomen',
    ['abdomen', 'pelvis'],
    'organ',
  ],
  [
    'FMA15572',
    'left',
    'partof',
    ['FJ3144'],
    'abdomen',
    ['abdomen', 'pelvis'],
    'organ',
  ],
  ['FMA14539', 'unpaired', 'isa', ['FJ3080'], 'abdomen', ['abdomen'], 'organ'],
  ['FMA14668', 'unpaired', 'isa', ['FJ3079'], 'abdomen', ['abdomen'], 'organ'],
  [
    'FMA14542',
    'unpaired',
    'isa',
    ['FJ2565'],
    'abdomen',
    ['abdomen', 'pelvis'],
    'organ',
  ],
  ['FMA11338', 'unpaired', 'isa', ['FJ2599'], 'abdomen', ['abdomen'], 'organ'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.abdominalOrganClinicalGroups.length, 14);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.abdominalOrganClinicalGroups
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
    ['organs', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
  );
  same(e.omittedSourceFiles, omittedByFma[f] ?? []);
  const group = api.abdominalOrganClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.abdominalOrganClinicalLesson(s, t);
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
        .abdominalOrganClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(
        api.abdominalOrganClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.abdominalOrganClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.abdominalOrganClinicalGroups.find((g) => g.key === k);
same(ids.length, 17);
same(new Set(ids).size, 17);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  135,
);
same(expected.filter((e) => e[6] === 'organ').length, 17);
same(
  ['FMA7197', 'FMA7198', 'FMA7200', 'FMA7201'].map(
    (f) => entry(f).sources.length,
  ),
  [57, 4, 55, 6],
);
same(entry('FMA7202').id, 'vm:anatomy:body:pelvis:unpaired:organ:gallbladder');
same(entry('FMA7202').region, 'abdomen');
for (const f of ['FMA15571', 'FMA15572', 'FMA14542'])
  same(entry(f).regions, ['abdomen', 'pelvis']);
check(group('liver').pathology.body.includes('portal hypertension'));
check(group('pancreas').pathology.body.includes('sometimes no cause'));
check(group('stomach').pathology.body.includes('Helicobacter pylori'));
check(group('small-intestine').pathology.body.includes('partial or complete'));
check(
  group('large-intestine').pathology.body.includes('not be used as synonyms'),
);
check(group('gallbladder').pathology.body.includes('not the same'));
check(group('kidneys').clinical.body.includes('urine albumin'));
check(group('spleen').clinical.body.includes('medical emergency'));
check(group('adrenals').pathology.body.includes('pituitary'));
check(group('ureters').clinical.body.includes('fever, chills'));
check(group('cystic-duct').pathology.body.includes('cholecystitis'));
check(group('common-hepatic-duct').clinical.body.includes('upstream'));
check(group('appendix').clinical.body.includes('not universal'));
check(group('appendix').scope.includes('separately represented mesoappendix'));
check(
  group('ileocecal-junction').scope.includes(
    'not make it a validated complete cecum',
  ),
);
check(
  group('ileocecal-junction').clinical.body.includes('exclude other causes'),
);
const omittedOwners = {
  FJ2415: 'FMA14339',
  FJ2416: 'FMA14338',
  FJ3081: 'FMA14772',
  FJ2571: 'FMA14544',
  FJ2599: 'FMA11338',
};
same(Object.values(omittedByFma).flat().length, 6);
same(
  [...new Set(Object.values(omittedByFma).flat())].sort(),
  Object.keys(omittedOwners).sort(),
);
for (const [file, owner] of Object.entries(omittedOwners))
  same(
    catalog.structures
      .filter((s) => s.sources.some((p) => p.file === file))
      .map((s) => s.fmaId),
    [owner],
  );
for (const tab of tabs) {
  same(api.bodyLesson(entry('FMA61970'), tab).readiness, 'pending');
  same(api.abdominalOrganClinicalLesson(entry('FMA61970'), tab), undefined);
}
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      s.region === 'abdomen' &&
      milestone.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      milestone.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  55,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.abdominalOrganClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.abdominalOrganClinicalLesson(entry(f), tab), undefined);
  }
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'skeleton' &&
        milestone.bodyLesson(s, 'clinical').readiness === 'pending',
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
  ['FMA7197', 'clinical', 'body'],
  ['FMA7198', 'pathology', 'body'],
  ['FMA7148', 'clinical', 'body'],
  ['FMA7200', 'pathology', 'readiness'],
  ['FMA7201', 'clinical', 'body'],
  ['FMA7202', 'pathology', 'body'],
  ['FMA7204', 'clinical', 'body'],
  ['FMA7205', 'pathology', 'body'],
  ['FMA7196', 'clinical', 'body'],
  ['FMA15629', 'pathology', 'body'],
  ['FMA15630', 'clinical', 'body'],
  ['FMA15571', 'pathology', 'body'],
  ['FMA15572', 'clinical', 'body'],
  ['FMA14539', 'pathology', 'body'],
  ['FMA14668', 'clinical', 'body'],
  ['FMA14542', 'pathology', 'body'],
  ['FMA11338', 'clinical', 'body'],
  ['FMA7197', 'anatomy', 'body'],
  ['FMA7198', 'function', 'body'],
  ['FMA7204', 'ct', 'body'],
  ['FMA7088', 'clinical', 'body'],
  ['FMA50801', 'clinical', 'body'],
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
    draft: 647,
    'identity-only': 0,
    pending: 375,
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
  bodyRepresentations: 17,
  sourceComponents: 135,
  lessonGroups: 14,
  explicitTopicEdits: 34,
  combinedPinnedCurriculumSections: 2874,
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
    'Original abdominal organ clinical drafts; aggregate liver/bowel boundaries, duct identities, paired sides and cross-region IDs remain exact. Not validated internal tissue, luminal patency, disease simulation, patient scans, procedural guidance or clinical approval.',
};
await writeFile(
  new URL(
    'docs/abdominal-organ-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
