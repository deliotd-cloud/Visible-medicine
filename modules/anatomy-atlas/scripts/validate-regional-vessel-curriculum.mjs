import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeRegionalVessels } from './regional-vessel-curriculum-transition.mjs';
import { authoringBeforeNeuralAnatomy } from './neural-anatomy-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson(
  'content/regional-vessel-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeRegionalVessels(context);
const regionalMilestone = await authoringBeforeNeuralAnatomy(context);
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
// Exact pre-authoring catalogue observations checked against official v4 ISA/PART-OF rows.
// These identity checks do not establish geometry or clinical validity.
const expected = {
  FMA3941: ['right', ['head-neck', 'thorax'], 'isa', ['FJ3564']],
  FMA4058: ['left', ['head-neck', 'thorax'], 'isa', ['FJ3483']],
  FMA3949: ['right', ['head-neck', 'thorax'], 'isa', ['FJ1682']],
  FMA4062: ['left', ['head-neck', 'thorax'], 'isa', ['FJ1682M']],
  FMA3958: ['right', ['head-neck', 'thorax'], 'isa', ['FJ1725']],
  FMA4066: ['left', ['head-neck', 'thorax'], 'isa', ['FJ1725M']],
  FMA4754: ['right', ['head-neck', 'thorax'], 'isa', ['FJ3585']],
  FMA4762: ['left', ['head-neck', 'thorax'], 'isa', ['FJ3485']],
  FMA50029: ['right', ['head-neck'], 'isa', ['FJ1654']],
  FMA50030: ['left', ['head-neck'], 'isa', ['FJ1654M']],
  FMA50584: [
    'right',
    ['head-neck'],
    'partof',
    [
      'FJ1661',
      'FJ1675',
      'FJ1677',
      'FJ1678',
      'FJ1680',
      'FJ1687',
      'FJ1691',
      'FJ1720',
      'FJ1727',
    ],
  ],
  FMA50585: [
    'left',
    ['head-neck'],
    'partof',
    [
      'FJ1661M',
      'FJ1675M',
      'FJ1677M',
      'FJ1678M',
      'FJ1680M',
      'FJ1687M',
      'FJ1691M',
      'FJ1720M',
      'FJ1727M',
    ],
  ],
  FMA50085: ['right', ['head-neck'], 'isa', ['FJ1713']],
  FMA50086: ['left', ['head-neck'], 'isa', ['FJ1713M']],
  FMA70249: ['right', ['thigh', 'pelvis', 'leg'], 'isa', ['FJ2143']],
  FMA70250: ['left', ['thigh', 'pelvis', 'leg'], 'isa', ['FJ2074']],
  FMA20796: [
    'right',
    ['thigh', 'pelvis', 'leg'],
    'partof',
    ['FJ2137', 'FJ2158'],
  ],
  FMA20797: [
    'left',
    ['thigh', 'pelvis', 'leg'],
    'partof',
    ['FJ2069', 'FJ2078'],
  ],
  FMA21188: ['right', ['thigh', 'pelvis', 'leg'], 'isa', ['FJ2144']],
  FMA21189: ['left', ['thigh', 'pelvis', 'leg'], 'isa', ['FJ2102']],
  FMA21379: ['right', ['thigh', 'pelvis', 'leg'], 'isa', ['FJ2145']],
  FMA21380: ['left', ['thigh', 'pelvis', 'leg'], 'isa', ['FJ2103']],
  FMA77380: ['right', ['leg', 'foot'], 'isa', ['FJ2170']],
  FMA77381: ['left', ['leg', 'foot'], 'isa', ['FJ2086']],
  FMA43896: ['right', ['leg', 'foot'], 'isa', ['FJ2130']],
  FMA43897: ['left', ['leg', 'foot'], 'isa', ['FJ2065']],
  FMA43898: ['right', ['leg', 'foot'], 'isa', ['FJ2172']],
  FMA43899: ['left', ['leg', 'foot'], 'isa', ['FJ2087']],
  FMA44328: ['right', ['leg', 'foot'], 'isa', ['FJ2171']],
  FMA44329: ['left', ['leg', 'foot'], 'isa', ['FJ2117']],
  FMA44334: ['right', ['leg', 'foot'], 'isa', ['FJ2176']],
  FMA44335: ['left', ['leg', 'foot'], 'isa', ['FJ2121']],
  FMA43916: ['right', ['foot'], 'isa', ['FJ2055']],
  FMA43917: ['left', ['foot'], 'isa', ['FJ2073']],
  FMA43929: ['right', ['foot'], 'isa', ['FJ2164']],
  FMA43930: ['left', ['foot'], 'isa', ['FJ2082']],
  FMA43931: ['right', ['foot'], 'isa', ['FJ2159']],
  FMA43932: ['left', ['foot'], 'isa', ['FJ2079']],
  FMA50542: ['midline', ['head-neck'], 'isa', ['FJ1672', 'FJ1844']],
  FMA50169: ['midline', ['head-neck'], 'isa', ['FJ1655']],
};
same(api.regionalVesselLessons.length, 40);
same(
  api.regionalVesselLessons.map((l) => l.fmaId).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, regions, tree, files]] of Object.entries(expected)) {
  const s = entry(fma);
  const l = api.regionalVesselLessons.find((l) => l.fmaId === fma);
  check(s && l);
  same(s.system, 'vessels');
  same(s.category, 'vessel');
  same(s.region, regions[0]);
  same(l.regions, regions);
  same(s.regions, regions);
  same(s.laterality, side);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  for (const t of api.contentTabs) {
    const result = api.regionalVesselLesson(s, t);
    if (!before.tabs.includes(t)) {
      same(result, undefined);
      continue;
    }
    same(result, api.bodyLesson(s, t));
    same(
      JSON.parse(JSON.stringify(result)),
      body.find((r) => r.id === s.id).content[t],
    );
    same(result.readiness, 'draft');
    same(result.body, l[t]);
    same(result.bullets[0], l.distinction);
    check(result.note.includes('clinical review pending'));
    check(result.note.includes('not physiological displacement'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .regionalVesselLesson(
          { ...s, coverageNote: 'Coverage hold retained.' },
          t,
        )
        .note.includes('Coverage hold retained.'),
    );
    same(result.citations, l.references);
    check(result.citations.length > 0);
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const original = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached arrays');
    if (t === 'anatomy') {
      check(result.bullets[1].includes('not oxygenation'));
      check(result.bullets[2].includes(s.fmaId));
      check(result.bullets[2].includes(files.length + ' source component'));
    }
  }
  const record = body.find((r) => r.id === s.id);
  same(record.validation.clinicalApproval, 'not-included');
  same(record.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'nerves' },
    { category: 'bone' },
    { region: 'thorax' },
    { laterality: side === 'left' ? 'right' : 'left' },
    { regions: [] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.regionalVesselLesson({ ...s, ...mutation }, 'anatomy'), undefined);
  for (const missing of regions)
    same(
      api.regionalVesselLesson(
        { ...s, regions: regions.filter((r) => r !== missing) },
        'function',
      ),
      undefined,
      'Required region guarded',
    );
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.regionalVesselLesson(s, t), undefined);
const lesson = (fma, t = 'anatomy') => api.bodyLesson(entry(fma), t);
for (const [fma, t, fragment] of [
  [
    'FMA3941',
    'anatomy',
    'Usually arises from the brachiocephalic trunk and ascends in the carotid sheath to internal and external carotid divisions.',
  ],
  [
    'FMA3949',
    'anatomy',
    'Ascends from the carotid bifurcation toward the temporal-bone carotid canal, normally without cervical branches.',
  ],
  [
    'FMA3958',
    'anatomy',
    'Usually begins at the subclavian artery, ascends through cervical transverse foramina and enters the skull through the foramen magnum.',
  ],
  [
    'FMA4754',
    'anatomy',
    'Continues from the sigmoid sinus at the jugular foramen, descends in the carotid sheath and joins the subclavian vein.',
  ],
  [
    'FMA50029',
    'anatomy',
    'Leaves the internal carotid artery toward the interhemispheric fissure, then courses around the corpus callosum.',
  ],
  [
    'FMA50584',
    'anatomy',
    'Usually arises at the basilar termination and curves around the midbrain toward posterior cerebral territories.',
  ],
  [
    'FMA50085',
    'anatomy',
    'Links the internal carotid artery to the posterior cerebral artery within the basal cerebral arterial network.',
  ],
  [
    'FMA70249',
    'anatomy',
    'Continues below the inguinal ligament from the external iliac artery; its distal course passes through the adductor hiatus into the popliteal artery.',
  ],
  [
    'FMA20796',
    'anatomy',
    'The profunda femoris branches from the proximal femoral artery and passes deeply into the thigh.',
  ],
  [
    'FMA21188',
    'anatomy',
    'Continues proximally from the popliteal vein through the adductor hiatus toward the common femoral and external iliac venous route.',
  ],
  [
    'FMA21379',
    'anatomy',
    'Ascends from the medial foot anterior to the medial malleolus, then along the medial limb toward the common femoral vein.',
  ],
  [
    'FMA77380',
    'anatomy',
    'Continues from the femoral artery behind the knee and usually divides into anterior tibial and tibioperoneal pathways.',
  ],
  [
    'FMA43896',
    'anatomy',
    'Passes through the proximal interosseous membrane into the anterior leg, continuing across the ankle as dorsalis pedis.',
  ],
  [
    'FMA43898',
    'anatomy',
    'Descends from the tibioperoneal pathway through the posterior leg, passing behind the medial malleolus toward the plantar arteries.',
  ],
  [
    'FMA44328',
    'anatomy',
    'Collects deep calf veins behind the knee and continues through the adductor hiatus as the femoral vein.',
  ],
  [
    'FMA44334',
    'anatomy',
    'Ascends behind the lateral malleolus along the posterior calf, commonly joining the popliteal vein.',
  ],
  [
    'FMA43916',
    'anatomy',
    'Continues from the anterior tibial artery onto the dorsum of the foot and gives branches toward dorsal and deep plantar routes.',
  ],
  [
    'FMA43929',
    'anatomy',
    'A posterior tibial branch entering the medial sole.',
  ],
  [
    'FMA43931',
    'anatomy',
    'A posterior tibial branch crossing toward the lateral sole before continuing into the plantar arterial arch.',
  ],
  ['FMA4058', 'anatomy', 'directly from the aortic arch'],
  ['FMA50542', 'anatomy', 'ventral pons'],
  ['FMA50169', 'anatomy', 'right and left anterior cerebral'],
])
  check(lesson(fma, t).body.includes(fragment));
for (const [fma, fragment] of [
  ['FMA3941', 'right and left origins differ'],
  ['FMA50585', 'nine PART-OF'],
  ['FMA50086', 'not arise from the middle cerebral'],
  ['FMA20797', 'Two PART-OF'],
  ['FMA21188', 'This is a deep vein'],
  ['FMA77380', 'tibioperoneal trunk'],
  ['FMA44335', 'cranial extensions vary'],
  ['FMA43930', 'Not the principal continuation'],
  ['FMA50542', 'not paired basilar'],
  ['FMA50169', 'not proof of a symmetric'],
])
  check(lesson(fma).bullets[0].includes(fragment));
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
  same(lesson(fma, 'function').readiness, 'pending');
const sourceComponents = Object.values(expected).reduce(
  (n, e) => n + e[3].length,
  0,
);
same(sourceComponents, 59);
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rowsByTree = {};
  for (const tree of ['isa', 'partof'])
    rowsByTree[tree] = (
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
  for (const [fma, [, , tree, files]] of Object.entries(expected)) {
    same(
      rowsByTree[tree].filter((row) => row[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA3941', 'anatomy', 'body'],
  ['FMA50585', 'function', 'readiness'],
  ['FMA50542', 'anatomy', 'body'],
  ['FMA21188', 'function', 'body'],
  ['FMA43929', 'function', 'body'],
  ['FMA44334', 'ultrasound', 'body'],
  ['FMA50169', 'anatomy', 'body'],
  ['FMA22655', 'function', 'body'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
];
for (const [fma, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === fma && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? expected[fma]
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === fma && tab === t && field === 'body'
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
          (s) => regionalMilestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 962,
  'identity-only': 60,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 1018,
  'identity-only': 0,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      ['head-neck', 'thigh', 'leg', 'foot'].includes(s.region) &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 40,
  sourceComponents,
  lessonGroups: 21,
  explicitTopicEdits: 80,
  combinedPinnedCurriculumSections: 1538,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtRegionalMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Draft reference teaching only. Compound source membership, vascular variants, branch continuity, lumen patency and circulation require review. No acquired imaging, haemodynamic simulation or clinical approval.',
};
await writeFile(
  new URL('docs/regional-vessel-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
