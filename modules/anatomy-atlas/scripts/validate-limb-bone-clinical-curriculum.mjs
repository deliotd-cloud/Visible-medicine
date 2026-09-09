import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeLimbBoneClinical } from './limb-bone-clinical-curriculum-transition.mjs';
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
  'content/limb-bone-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeLimbBoneClinical(context);
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
/** @type {Array<[string, string, string, string[], string, string[]]>} */
const expected = [
  ['FMA16586', 'right', 'isa', ['FJ3152'], 'pelvis', ['pelvis', 'thigh']],
  ['FMA13323', 'left', 'isa', ['FJ3237'], 'shoulder-arm', ['shoulder-arm']],
  ['FMA24475', 'left', 'isa', ['FJ3259'], 'thigh', ['thigh', 'pelvis', 'leg']],
  ['FMA24481', 'left', 'isa', ['FJ3260'], 'leg', ['leg']],
  [
    'FMA23131',
    'left',
    'isa',
    ['FJ3262'],
    'shoulder-arm',
    ['shoulder-arm', 'forearm'],
  ],
  ['FMA24487', 'left', 'isa', ['FJ3275'], 'leg', ['leg']],
  ['FMA23465', 'left', 'isa', ['FJ3277'], 'forearm', ['forearm']],
  ['FMA13396', 'left', 'isa', ['FJ3279'], 'shoulder-arm', ['shoulder-arm']],
  ['FMA24478', 'left', 'isa', ['FJ3282'], 'leg', ['leg']],
  ['FMA23468', 'left', 'isa', ['FJ3286'], 'forearm', ['forearm']],
  ['FMA16587', 'left', 'isa', ['FJ3288'], 'pelvis', ['pelvis', 'thigh']],
  ['FMA23464', 'right', 'isa', ['FJ3349'], 'forearm', ['forearm']],
  ['FMA24474', 'right', 'isa', ['FJ3365'], 'thigh', ['thigh', 'pelvis', 'leg']],
  ['FMA24480', 'right', 'isa', ['FJ3366'], 'leg', ['leg']],
  ['FMA24486', 'right', 'isa', ['FJ3381'], 'leg', ['leg']],
  ['FMA24477', 'right', 'isa', ['FJ3387'], 'leg', ['leg']],
  ['FMA23467', 'right', 'isa', ['FJ3391'], 'forearm', ['forearm']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.limbBoneClinicalGroups.length, 10);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.limbBoneClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, tree, files, region, regions] of expected) {
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
    ['skeleton', 'bone', side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files].sort(),
  );
  same(e.omittedSourceFiles, []);
  const group = api.limbBoneClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.limbBoneClinicalLesson(s, t);
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
        .limbBoneClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { category: 'tendon' },
      { region: 'thorax' },
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
      same(api.limbBoneClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.limbBoneClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.limbBoneClinicalGroups.find((g) => g.key === k);

check(group('clavicle').pathology.body.includes('not interchangeable'));
check(group('scapula').pathology.bullets[0].includes('not automatically'));
check(group('humerus').pathology.body.includes('axillary nerve'));
check(group('humerus').pathology.body.includes('radial nerve'));
check(group('radius').pathology.body.includes('Galeazzi'));
check(group('radius').pathology.body.includes('distal radioulnar'));
check(group('ulna').pathology.body.includes('Monteggia'));
check(group('ulna').pathology.body.includes('radial-head dislocation'));
check(group('hip-bone').scope.includes('not the complete pelvic ring'));
check(group('hip-bone').pathology.bullets[0].includes('emergency'));
check(group('femur').pathology.bullets[0].includes('does not exclude'));
check(group('femur').clinical.bullets[0].includes('occult'));
check(group('tibia').pathology.body.includes('do not enter the joint'));
check(group('tibia').pathology.bullets[0].includes('medical emergency'));
check(group('fibula').pathology.body.includes('syndesmosis'));
check(group('fibula').pathology.bullets[0].includes('Do not assume every'));
check(
  group('patella').clinical.bullets[0].includes('cannot test active extension'),
);
same(ids.length, 17);
same(new Set(ids).size, 17);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  17,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.limbBoneClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
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
    same(rows.map((r) => r[2]).sort(), [...files].sort());
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA13323', 'clinical', 'body'],
  ['FMA23131', 'pathology', 'readiness'],
  ['FMA23465', 'clinical', 'body'],
  ['FMA16586', 'pathology', 'body'],
  ['FMA24475', 'clinical', 'body'],
  ['FMA24481', 'pathology', 'body'],
  ['FMA24487', 'clinical', 'body'],
  ['FMA24478', 'anatomy', 'body'],
  ['FMA23468', 'function', 'body'],
  ['FMA13396', 'ultrasound', 'body'],
  ...legacyRightShoulder.map((f) => [f, 'clinical', 'body']),
  ...unresolved.map((f) => [f, 'function', 'readiness']),
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
for (const t of tabs)
  same(counts(t), {
    draft: 388,
    'identity-only': 0,
    pending: 634,
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
  sourceComponents: 17,
  lessonGroups: 10,
  explicitTopicEdits: 34,
  combinedPinnedCurriculumSections: 2356,
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
    'Original short major limb/hip bone clinical drafts; not validated fractures, neurovascular lesions, ligament stability, patient scans, procedural guidance or clinical approval.',
};
await writeFile(
  new URL('docs/limb-bone-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
