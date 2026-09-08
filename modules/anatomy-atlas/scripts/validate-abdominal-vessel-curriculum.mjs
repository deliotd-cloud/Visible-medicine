import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAbdominalVessels } from './abdominal-vessel-curriculum-transition.mjs';
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
  'content/abdominal-vessel-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAbdominalVessels(context);
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
  FMA3789: ['midline', ['abdomen', 'pelvis', 'thorax'], 'isa', ['FJ1932']],
  FMA10951: [
    'unspecified',
    ['abdomen', 'pelvis', 'thorax'],
    'isa',
    ['FJ3441', 'FJ3659'],
  ],
  FMA50737: ['unspecified', ['abdomen'], 'isa', ['FJ1846', 'FJ2013']],
  FMA14749: ['midline', ['abdomen'], 'isa', ['FJ1928', 'FJ2011']],
  FMA14750: ['unspecified', ['abdomen'], 'isa', ['FJ3442']],
  FMA14771: ['midline', ['abdomen'], 'isa', ['FJ3078']],
  FMA14772: ['unspecified', ['abdomen'], 'isa', ['FJ3081']],
  FMA14773: [
    'unspecified',
    ['abdomen'],
    'isa',
    ['FJ2562', 'FJ3420', 'FJ3544', 'FJ3640'],
  ],
  FMA14768: ['left', ['abdomen'], 'isa', ['FJ3499']],
  FMA50735: ['unspecified', ['abdomen'], 'isa', ['FJ1853']],
  FMA14752: ['right', ['abdomen'], 'isa', ['FJ2038']],
  FMA14753: ['left', ['abdomen'], 'isa', ['FJ2046']],
  FMA14338: ['right', ['abdomen'], 'isa', ['FJ2416']],
  FMA14339: ['left', ['abdomen'], 'isa', ['FJ2415']],
};
same(api.abdominalVesselLessons.length, 14);
same(
  api.abdominalVesselLessons.map((l) => l.fmaId).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, regions, tree, files]] of Object.entries(expected)) {
  const s = entry(fma);
  const l = api.abdominalVesselLessons.find((l) => l.fmaId === fma);
  check(s && l);
  same(s.system, 'vessels');
  same(s.category, 'vessel');
  same(s.region, 'abdomen');
  same(s.regions, regions);
  same(s.laterality, side);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  for (const t of api.contentTabs) {
    const result = api.abdominalVesselLesson(s, t);
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
        .abdominalVesselLesson(
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
    same(
      api.abdominalVesselLesson({ ...s, ...mutation }, 'anatomy'),
      undefined,
    );
  for (const missing of regions)
    same(
      api.abdominalVesselLesson(
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
      same(api.abdominalVesselLesson(s, t), undefined);
const lesson = (fma, t = 'anatomy') => api.bodyLesson(entry(fma), t);
for (const [fma, t, fragment] of [
  ['FMA3789', 'anatomy', 'common iliac arteries'],
  ['FMA10951', 'function', 'after passing through the liver'],
  ['FMA50737', 'anatomy', 'left gastric, splenic and common hepatic'],
  ['FMA14749', 'anatomy', 'third part of the duodenum'],
  ['FMA14749', 'function', 'midgut'],
  ['FMA14750', 'anatomy', 'superior rectal'],
  ['FMA14750', 'function', 'upper rectum'],
  ['FMA14771', 'anatomy', 'beyond the gastroduodenal origin'],
  ['FMA14772', 'function', 'complementing portal venous inflow'],
  ['FMA14773', 'anatomy', 'superior pancreatic border'],
  ['FMA14768', 'anatomy', 'lesser gastric curvature'],
  ['FMA50735', 'anatomy', 'splenic and superior mesenteric veins unite'],
  ['FMA50735', 'function', 'an inflow vessel'],
  ['FMA14752', 'anatomy', 'behind the inferior vena cava'],
  ['FMA14753', 'anatomy', 'posterior to the left renal vein'],
  ['FMA14338', 'anatomy', 'joins the inferior vena cava'],
  ['FMA14339', 'anatomy', 'hepatic venous outflow'],
])
  check(lesson(fma, t).body.includes(fragment));
check(lesson('FMA50737').bullets[0].includes('not a gut derivative'));
check(lesson('FMA14750').bullets[0].includes('not exclusively supplied'));
check(lesson('FMA14771').bullets[0].includes('Replaced/accessory'));
check(lesson('FMA14773').bullets[0].includes('four source components'));
check(lesson('FMA14752').bullets[0].includes('not the ureter'));
check(lesson('FMA14339').bullets[0].includes('Do not infer a separate ostium'));
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
  same(lesson(fma, 'function').readiness, 'pending');
const sourceComponents = Object.values(expected).reduce(
  (n, e) => n + e[3].length,
  0,
);
same(sourceComponents, 20);
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
  ['FMA3789', 'anatomy', 'body'],
  ['FMA10951', 'function', 'readiness'],
  ['FMA14749', 'anatomy', 'body'],
  ['FMA14750', 'function', 'body'],
  ['FMA50735', 'function', 'body'],
  ['FMA14752', 'ultrasound', 'body'],
  ['FMA14339', 'anatomy', 'body'],
  ['FMA3736', 'function', 'body'],
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
        catalog.structures.filter((s) => api.bodyLesson(s, t).readiness === r)
          .length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 864,
  'identity-only': 158,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 920,
  'identity-only': 98,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'abdomen' &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 14,
  sourceComponents,
  lessonGroups: 14,
  explicitTopicEdits: 28,
  combinedPinnedCurriculumSections: 1342,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Draft reference teaching only. Compound source membership, vascular variants, branch continuity, lumen patency and circulation require review. No acquired imaging, haemodynamic simulation or clinical approval.',
};
await writeFile(
  new URL('docs/abdominal-vessel-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
