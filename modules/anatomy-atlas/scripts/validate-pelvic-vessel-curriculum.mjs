import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforePelvicVessels } from './pelvic-vessel-curriculum-transition.mjs';
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
  'content/pelvic-vessel-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforePelvicVessels(context);
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
  FMA14765: ['right', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3565']],
  FMA14766: ['left', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3464']],
  FMA18806: ['right', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3567']],
  FMA18807: ['left', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3466']],
  FMA18809: ['right', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3569']],
  FMA18810: ['left', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3468']],
  FMA21387: ['right', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3566']],
  FMA21388: ['left', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3465']],
  FMA18885: ['right', ['pelvis', 'abdomen', 'thigh'], 'isa', ['FJ3568']],
  FMA18886: [
    'left',
    ['pelvis', 'abdomen', 'thigh'],
    'isa',
    ['FJ3484', 'FJ3522', 'FJ3523', 'FJ3524'],
  ],
  FMA18887: [
    'right',
    ['pelvis', 'abdomen', 'thigh'],
    'isa',
    ['FJ3570', 'FJ3571', 'FJ3572', 'FJ3607', 'FJ3608', 'FJ3609'],
  ],
  FMA18888: [
    'left',
    ['pelvis', 'abdomen', 'thigh'],
    'isa',
    ['FJ3469', 'FJ3470', 'FJ3471'],
  ],
};
same(api.pelvicVesselLessons.length, 12);
same(
  api.pelvicVesselLessons.map((l) => l.fmaId).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, regions, tree, files]] of Object.entries(expected)) {
  const s = entry(fma);
  const l = api.pelvicVesselLessons.find((l) => l.fmaId === fma);
  check(s && l);
  same(s.system, 'vessels');
  same(s.category, 'vessel');
  same(s.region, 'pelvis');
  same(s.regions, regions);
  same(s.laterality, side);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  for (const t of api.contentTabs) {
    const result = api.pelvicVesselLesson(s, t);
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
        .pelvicVesselLesson(
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
    same(api.pelvicVesselLesson({ ...s, ...mutation }, 'anatomy'), undefined);
  for (const missing of regions)
    same(
      api.pelvicVesselLesson(
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
      same(api.pelvicVesselLesson(s, t), undefined);
const lesson = (fma, t = 'anatomy') => api.bodyLesson(entry(fma), t);
for (const [fma, t, fragment] of [
  ['FMA14765', 'anatomy', 'aortic bifurcation'],
  ['FMA14766', 'function', 'left pelvic and lower-limb'],
  ['FMA18806', 'anatomy', 'beneath the inguinal ligament'],
  ['FMA18807', 'function', 'left lower limb'],
  ['FMA18809', 'anatomy', 'anterior and posterior trunks'],
  ['FMA18810', 'function', 'perineum, gluteal region and thigh'],
  ['FMA21387', 'anatomy', 'relatively direct course'],
  ['FMA21388', 'anatomy', 'beneath the right common iliac artery'],
  ['FMA18885', 'anatomy', 'femoral vein above the inguinal ligament'],
  ['FMA18886', 'function', 'left common iliac vein'],
  ['FMA18887', 'function', 'pelvic, gluteal and perineal tissues'],
  ['FMA18888', 'anatomy', 'joins the external iliac vein'],
])
  check(lesson(fma, t).body.includes(fragment));
check(lesson('FMA14765').bullets[0].includes('not the internal or external'));
check(lesson('FMA18807').bullets[0].includes('not a simulated join'));
check(lesson('FMA18809').bullets[0].includes('does not provide a female'));
check(lesson('FMA21388').bullets[0].includes('does not by itself diagnose'));
check(lesson('FMA18886').bullets[0].includes('Four source components'));
check(lesson('FMA18887').bullets[0].includes('six-file source group'));
check(lesson('FMA18888').bullets[0].includes('three named tributaries'));
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
  same(lesson(fma, 'function').readiness, 'pending');
const sourceComponents = Object.values(expected).reduce(
  (n, e) => n + e[3].length,
  0,
);
same(sourceComponents, 22);
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
  ['FMA14765', 'anatomy', 'body'],
  ['FMA18809', 'function', 'readiness'],
  ['FMA21387', 'anatomy', 'body'],
  ['FMA21388', 'function', 'body'],
  ['FMA18886', 'function', 'body'],
  ['FMA18887', 'ultrasound', 'body'],
  ['FMA18888', 'anatomy', 'body'],
  ['FMA3789', 'function', 'body'],
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
  draft: 876,
  'identity-only': 146,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 932,
  'identity-only': 86,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'pelvis' &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 12,
  sourceComponents,
  lessonGroups: 12,
  explicitTopicEdits: 24,
  combinedPinnedCurriculumSections: 1366,
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
  new URL('docs/pelvic-vessel-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
