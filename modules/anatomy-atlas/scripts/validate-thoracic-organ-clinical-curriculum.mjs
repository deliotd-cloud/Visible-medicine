import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAbdominalOrganClinical } from './abdominal-organ-clinical-curriculum-transition.mjs';
import { authoringBeforeThoracicOrganClinical } from './thoracic-organ-clinical-curriculum-transition.mjs';
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
  'content/thoracic-organ-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeThoracicOrganClinical(context);
const milestone = await authoringBeforeAbdominalOrganClinical(context);
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
const omittedHeartFiles = [
  'FJ2631',
  'FJ2632',
  'FJ2633',
  'FJ2634',
  'FJ2635',
  'FJ2636',
  'FJ2637',
  'FJ2638',
  'FJ2639',
  'FJ2640',
  'FJ2641',
  'FJ2642',
  'FJ2643',
  'FJ2644',
  'FJ2645',
  'FJ2646',
  'FJ2647',
  'FJ2648',
  'FJ2649',
  'FJ2650',
  'FJ2651',
  'FJ2652',
  'FJ2653',
  'FJ2654',
  'FJ2656',
  'FJ2723',
  'FJ2737',
];
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  [
    'FMA7088',
    'unpaired',
    'partof',
    [
      'FJ2417',
      'FJ2418',
      'FJ2419',
      'FJ2420',
      'FJ2421',
      'FJ2422',
      'FJ2423',
      'FJ2424',
      'FJ2425',
      'FJ2426',
      'FJ2427',
      'FJ2429',
      'FJ2430',
      'FJ2431',
      'FJ2432',
      'FJ2433',
      'FJ2434',
      'FJ2435',
      'FJ2436',
      'FJ2437',
      'FJ2438',
      'FJ2439',
      'FJ2655',
      'FJ2667',
      'FJ2668',
      'FJ2670',
      'FJ2671',
      'FJ2672',
      'FJ2673',
      'FJ2674',
      'FJ2675',
      'FJ2676',
      'FJ2677',
      'FJ2692',
      'FJ2693',
      'FJ2694',
      'FJ2695',
      'FJ2696',
      'FJ2697',
      'FJ2698',
      'FJ2699',
      'FJ2700',
      'FJ2714',
      'FJ2715',
      'FJ2716',
      'FJ2717',
      'FJ2718',
      'FJ2719',
      'FJ2720',
      'FJ2721',
      'FJ2722',
      'FJ2724',
      'FJ2727',
      'FJ2728',
      'FJ2729',
      'FJ2731',
    ],
    'thorax',
    ['thorax'],
    'organ',
  ],
  [
    'FMA7309',
    'right',
    'partof',
    [
      'FJ2041',
      'FJ2044',
      'FJ2449',
      'FJ2451',
      'FJ2452',
      'FJ2453',
      'FJ2454',
      'FJ2455',
      'FJ2456',
      'FJ2457',
      'FJ2458',
      'FJ2459',
      'FJ2470',
      'FJ2481',
      'FJ2486',
      'FJ2487',
      'FJ2488',
      'FJ2489',
      'FJ2490',
      'FJ2491',
      'FJ2492',
      'FJ2493',
      'FJ2494',
      'FJ2495',
      'FJ2496',
      'FJ2497',
      'FJ2498',
      'FJ2499',
      'FJ2500',
      'FJ2501',
      'FJ2502',
      'FJ2503',
      'FJ2504',
      'FJ2505',
      'FJ2506',
      'FJ2507',
      'FJ2508',
      'FJ2509',
      'FJ2510',
      'FJ2511',
      'FJ2512',
      'FJ2513',
      'FJ2514',
      'FJ2515',
      'FJ2516',
      'FJ2517',
      'FJ2518',
      'FJ2519',
      'FJ2520',
      'FJ2521',
      'FJ2522',
      'FJ2523',
      'FJ2524',
      'FJ2525',
      'FJ2526',
      'FJ2967',
      'FJ2968',
      'FJ2969',
      'FJ2970',
      'FJ2971',
      'FJ2972',
      'FJ2973',
      'FJ2974',
      'FJ2975',
      'FJ2976',
      'FJ2977',
      'FJ2978',
      'FJ2979',
      'FJ2980',
      'FJ2981',
      'FJ2982',
      'FJ2983',
      'FJ2984',
      'FJ2985',
      'FJ2986',
      'FJ2987',
      'FJ2988',
      'FJ2989',
      'FJ2990',
      'FJ2991',
      'FJ2992',
      'FJ2993',
      'FJ2994',
      'FJ2995',
      'FJ2996',
      'FJ2997',
      'FJ2998',
      'FJ2999',
      'FJ3000',
      'FJ3001',
      'FJ3002',
      'FJ3003',
      'FJ3004',
      'FJ3005',
      'FJ3006',
      'FJ3007',
      'FJ3008',
      'FJ3009',
      'FJ3010',
      'FJ3011',
      'FJ3012',
      'FJ3013',
      'FJ3014',
      'FJ3015',
      'FJ3016',
      'FJ3017',
      'FJ3018',
      'FJ3021',
      'FJ3022',
      'FJ3023',
      'FJ3024',
      'FJ3025',
      'FJ3026',
      'FJ3027',
      'FJ3028',
      'FJ3029',
      'FJ3030',
      'FJ3031',
      'FJ3032',
      'FJ3033',
      'FJ3034',
      'FJ3035',
      'FJ3036',
      'FJ3037',
      'FJ3038',
      'FJ3039',
      'FJ3041',
      'FJ3042',
      'FJ3043',
      'FJ3044',
      'FJ3045',
      'FJ3046',
      'FJ3047',
      'FJ3048',
      'FJ3049',
      'FJ3050',
      'FJ3051',
      'FJ3052',
      'FJ3053',
      'FJ3054',
      'FJ3055',
      'FJ3056',
      'FJ3057',
      'FJ3058',
      'FJ3059',
      'FJ3060',
      'FJ3061',
      'FJ3062',
      'FJ3063',
      'FJ3064',
      'FJ3065',
      'FJ3066',
      'FJ3067',
      'FJ3068',
      'FJ3069',
      'FJ3070',
    ],
    'thorax',
    ['thorax'],
    'organ',
  ],
  [
    'FMA7310',
    'left',
    'partof',
    [
      'FJ2441',
      'FJ2442',
      'FJ2443',
      'FJ2444',
      'FJ2445',
      'FJ2446',
      'FJ2447',
      'FJ2448',
      'FJ2460',
      'FJ2461',
      'FJ2462',
      'FJ2463',
      'FJ2464',
      'FJ2465',
      'FJ2466',
      'FJ2467',
      'FJ2468',
      'FJ2469',
      'FJ2471',
      'FJ2472',
      'FJ2473',
      'FJ2474',
      'FJ2475',
      'FJ2476',
      'FJ2477',
      'FJ2478',
      'FJ2479',
      'FJ2480',
      'FJ2482',
      'FJ2483',
      'FJ2484',
      'FJ2485',
      'FJ2527',
      'FJ2528',
      'FJ2529',
      'FJ2530',
      'FJ2531',
      'FJ2532',
      'FJ2533',
      'FJ2534',
      'FJ2535',
      'FJ2536',
      'FJ2537',
      'FJ2538',
      'FJ2540',
      'FJ2881',
      'FJ2882',
      'FJ2883',
      'FJ2884',
      'FJ2885',
      'FJ2886',
      'FJ2887',
      'FJ2888',
      'FJ2889',
      'FJ2890',
      'FJ2891',
      'FJ2892',
      'FJ2893',
      'FJ2894',
      'FJ2895',
      'FJ2896',
      'FJ2897',
      'FJ2898',
      'FJ2899',
      'FJ2900',
      'FJ2901',
      'FJ2902',
      'FJ2903',
      'FJ2904',
      'FJ2905',
      'FJ2906',
      'FJ2907',
      'FJ2908',
      'FJ2909',
      'FJ2910',
      'FJ2911',
      'FJ2912',
      'FJ2913',
      'FJ2914',
      'FJ2915',
      'FJ2916',
      'FJ2917',
      'FJ2918',
      'FJ2919',
      'FJ2920',
      'FJ2921',
      'FJ2922',
      'FJ2923',
      'FJ2926',
      'FJ2927',
      'FJ2928',
      'FJ2929',
      'FJ2930',
      'FJ2931',
      'FJ2932',
      'FJ2934',
      'FJ2935',
      'FJ2936',
      'FJ2937',
      'FJ2938',
      'FJ2939',
      'FJ2940',
      'FJ2941',
      'FJ2942',
      'FJ2943',
      'FJ2945',
      'FJ2946',
      'FJ2947',
      'FJ2948',
      'FJ2949',
      'FJ2951',
      'FJ2952',
      'FJ2953',
      'FJ2954',
      'FJ2956',
      'FJ2957',
      'FJ2958',
      'FJ2959',
      'FJ2960',
      'FJ2961',
      'FJ2962',
      'FJ2963',
      'FJ2964',
      'FJ2965',
    ],
    'thorax',
    ['thorax'],
    'organ',
  ],
  ['FMA7131', 'unpaired', 'partof', ['FJ2563'], 'thorax', ['thorax'], 'organ'],
  ['FMA7394', 'unpaired', 'partof', ['FJ2541'], 'thorax', ['thorax'], 'organ'],
  [
    'FMA9607',
    'unpaired',
    'partof',
    ['FJ3150', 'FJ3151'],
    'thorax',
    ['thorax'],
    'organ',
  ],
  ['FMA7395', 'right', 'partof', ['FJ2539'], 'thorax', ['thorax'], 'organ'],
  ['FMA7396', 'left', 'isa', ['FJ2450'], 'thorax', ['thorax'], 'organ'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.thoracicOrganClinicalGroups.length, 6);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.thoracicOrganClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    [...files, ...(f === 'FMA7088' ? omittedHeartFiles : [])].sort(),
  );
  same(e.omittedSourceFiles, f === 'FMA7088' ? omittedHeartFiles : []);
  const group = api.thoracicOrganClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.thoracicOrganClinicalLesson(s, t);
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
        .thoracicOrganClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
        api.thoracicOrganClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.thoracicOrganClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.thoracicOrganClinicalGroups.find((g) => g.key === k);
same(ids.length, 8);
same(new Set(ids).size, 8);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  342,
);
same(expected.filter((e) => e[6] === 'organ').length, 8);
same(
  [
    entry('FMA7088').sources.length,
    entry('FMA7309').sources.length,
    entry('FMA7310').sources.length,
  ],
  [56, 156, 124],
);
same(entry('FMA9607').sources.length, 2);
same(
  [entry('FMA7395').sourceTree, entry('FMA7396').sourceTree],
  ['partof', 'isa'],
);
check(group('heart').pathology.bullets.some((b) => b.includes('filling')));
check(group('heart').clinical.body.includes('ECG'));
check(group('lungs').pathology.body.includes('alveoli'));
check(
  group('lungs').pathology.bullets.some((b) => b.includes('pleural space')),
);
check(
  group('esophagus').pathology.bullets.some((b) =>
    b.includes('not itself a diagnosis of cancer'),
  ),
);
check(group('trachea').pathology.body.includes('intubation'));
check(group('thymus').pathology.body.includes('myasthenia'));
check(group('main-bronchi').clinical.body.includes('does not exclude'));
check(group('main-bronchi').scope.includes('paediatric'));
for (const k of ['heart', 'lungs', 'esophagus', 'trachea', 'main-bronchi'])
  check(group(k).clinical.bullets.some((b) => b.includes('999')));
const omittedOwners = {
  FMA3862: [
    'FJ2631',
    'FJ2632',
    'FJ2633',
    'FJ2634',
    'FJ2635',
    'FJ2636',
    'FJ2637',
    'FJ2638',
    'FJ2639',
    'FJ2640',
    'FJ2641',
    'FJ2642',
    'FJ2643',
    'FJ2644',
    'FJ2645',
    'FJ2646',
    'FJ2647',
    'FJ2648',
  ],
  FMA3895: ['FJ2649', 'FJ2650', 'FJ2651', 'FJ2652', 'FJ2653', 'FJ2654'],
  FMA4707: ['FJ2656'],
  FMA3802: ['FJ2723'],
  FMA3855: ['FJ2737'],
};
same(Object.values(omittedOwners).flat().sort(), [...omittedHeartFiles].sort());
for (const [owner, files] of Object.entries(omittedOwners))
  for (const file of files)
    same(
      catalog.structures
        .filter((s) => s.sources.some((p) => p.file === file))
        .map((s) => s.fmaId),
      [owner],
    );
for (const tab of tabs) {
  same(api.bodyLesson(entry('FMA61970'), tab).readiness, 'pending');
  same(api.thoracicOrganClinicalLesson(entry('FMA61970'), tab), undefined);
}
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      s.region === 'thorax' &&
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
  72,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.thoracicOrganClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.thoracicOrganClinicalLesson(entry(f), tab), undefined);
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
      [...files, ...(f === 'FMA7088' ? omittedHeartFiles : [])].sort(),
    );
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA7088', 'clinical', 'body'],
  ['FMA7309', 'pathology', 'body'],
  ['FMA7310', 'clinical', 'body'],
  ['FMA7131', 'pathology', 'readiness'],
  ['FMA7394', 'clinical', 'body'],
  ['FMA9607', 'pathology', 'body'],
  ['FMA7395', 'clinical', 'body'],
  ['FMA7396', 'pathology', 'body'],
  ['FMA7088', 'anatomy', 'body'],
  ['FMA7394', 'function', 'body'],
  ['FMA7309', 'ct', 'body'],
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
    draft: 630,
    'identity-only': 0,
    pending: 392,
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
  bodyRepresentations: 8,
  sourceComponents: 342,
  lessonGroups: 6,
  explicitTopicEdits: 16,
  combinedPinnedCurriculumSections: 2840,
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
    'Original thoracic organ clinical drafts; aggregate heart/lung boundaries and separately owned coronary components remain exact. Not validated cardiac function, airway lumen, disease simulation, paediatric anatomy, patient scans, procedural guidance or clinical approval.',
};
await writeFile(
  new URL(
    'docs/thoracic-organ-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
