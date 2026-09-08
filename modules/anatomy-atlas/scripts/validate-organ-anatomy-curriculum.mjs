import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeOrganAnatomy } from './organ-anatomy-curriculum-transition.mjs';
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
const context = await contentContext(),
  { api, catalog, body } = context;
const before = await readContentJson(
  'content/organ-anatomy-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeOrganAnatomy(context);
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
// Pinned independently of runtime definitions; complete source file lists live in the hash-locked before record.
const identities = {
  FMA7088: ['unpaired', 'thorax', 56, 83],
  FMA7309: ['right', 'thorax', 156, 156],
  FMA7310: ['left', 'thorax', 124, 124],
  FMA7197: ['unpaired', 'abdomen', 57, 60],
  FMA7198: ['unpaired', 'abdomen', 4, 4],
  FMA7148: ['unpaired', 'abdomen', 1, 1],
  FMA7200: ['unpaired', 'abdomen', 55, 56],
  FMA7201: ['unpaired', 'abdomen', 6, 8],
  FMA7202: ['unpaired', 'abdomen', 1, 1],
  FMA7204: ['right', 'abdomen', 1, 1],
  FMA7205: ['left', 'abdomen', 1, 1],
  FMA15900: ['unpaired', 'pelvis', 1, 1],
  FMA7131: ['unpaired', 'thorax', 1, 1],
  FMA7394: ['unpaired', 'thorax', 1, 1],
  FMA7196: ['unpaired', 'abdomen', 1, 1],
  FMA15629: ['right', 'abdomen', 1, 1],
  FMA15630: ['left', 'abdomen', 1, 1],
  FMA7395: ['right', 'thorax', 1, 1],
  FMA7396: ['left', 'thorax', 1, 1],
  FMA14539: ['unpaired', 'abdomen', 1, 1],
  FMA14668: ['unpaired', 'abdomen', 1, 1],
};
same(
  api.organAnatomyLessons.map((l) => l.fmaId).sort(),
  Object.keys(identities).sort(),
);
same(before.entries.map((e) => e.fmaId).sort(), Object.keys(identities).sort());
for (const e of before.entries) {
  const s = catalog.structures.find((s) => s.id === e.id),
    l = api.organAnatomyLessons.find((l) => l.fmaId === e.fmaId);
  same(
    [s.laterality, s.region, s.sources.length, e.sourceIndexFiles.length],
    identities[e.fmaId],
  );
  same(s.regions, [s.region]);
  same(s.system, 'organs');
  same(s.category, 'organ');
  same(
    e.omittedSourceFiles,
    e.sourceIndexFiles.filter((f) => !e.files.includes(f)),
  );
  const section = api.organAnatomyLesson(s, 'anatomy');
  same(section, api.bodyLesson(s, 'anatomy'));
  same(section.body, l.anatomy);
  same(section.bullets[0], l.distinction);
  same(section.citations, l.references);
  same(section.readiness, 'draft');
  check(section.title.startsWith(s.name + ' ·'));
  check(section.bullets[1].includes(e.fmaId));
  check(section.bullets[1].includes(e.files.length + ' source component'));
  check(section.note.includes('clinical review pending'));
  check(section.note.includes('not physiological motion'));
  if (s.coverageNote) check(section.note.includes(s.coverageNote));
  check(
    api
      .organAnatomyLesson(
        { ...s, coverageNote: 'Keep source limitation' },
        'anatomy',
      )
      .note.includes('Keep source limitation'),
  );
  for (const url of section.citations) same(new URL(url).protocol, 'https:');
  const detached = structuredClone(section);
  section.bullets.push('mutation');
  section.citations.push('mutation');
  same(api.bodyLesson(s, 'anatomy'), detached);
  const exported = body.find((r) => r.id === s.id);
  same(JSON.parse(JSON.stringify(detached)), exported.content.anatomy);
  same(exported.validation.clinicalApproval, 'not-included');
  same(exported.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'nerves' },
    { category: 'nerve' },
    { region: 'head-neck' },
    { regions: [] },
    { laterality: s.laterality === 'left' ? 'right' : 'left' },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.organAnatomyLesson({ ...s, ...mutation }, 'anatomy'), undefined);
  for (const t of api.contentTabs.filter((t) => t !== 'anatomy')) {
    same(api.organAnatomyLesson(s, t), undefined);
    same(api.bodyLesson(s, t), previous.bodyLesson(s, t));
  }
}
for (const s of catalog.structures)
  if (!identities[s.fmaId])
    for (const t of api.contentTabs)
      same(api.organAnatomyLesson(s, t), undefined);
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, fragment] of [
  ['FMA7310', 'lingula belongs to the upper lobe'],
  ['FMA7201', 'ascending, transverse, descending and sigmoid'],
  ['FMA15629', 'outer cortex'],
  ['FMA14539', 'common hepatic duct'],
  ['FMA14668', 'downstream channel'],
])
  check(api.bodyLesson(entry(f), 'anatomy').body.includes(fragment));
check(entry('FMA7202').id.includes(':pelvis:'));
same(entry('FMA7202').region, 'abdomen');
const unresolved = ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'];
for (const f of unresolved)
  same(api.bodyLesson(entry(f), 'function').readiness, 'pending');
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
  for (const e of before.entries) {
    same(
      indexes[e.tree].filter((r) => r[0] === e.fmaId),
      e.sourceIndexFiles.map((f) => [e.fmaId, e.name.toLowerCase(), f]),
    );
    for (const f of e.files) check(e.sourceIndexFiles.includes(f));
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA7088', 'anatomy', 'body'],
  ['FMA7310', 'anatomy', 'readiness'],
  ['FMA7202', 'anatomy', 'body'],
  ['FMA14668', 'anatomy', 'body'],
  ['FMA7198', 'function', 'body'],
  ['FMA7088', 'clinical', 'body'],
  ['FMA52699', 'function', 'body'],
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
                ? identities[f]
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
same(counts('anatomy'), {
  draft: 994,
  'identity-only': 28,
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
      s.system === 'organs' &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const sourceComponents = before.entries.reduce((n, e) => n + e.files.length, 0),
  sourceMemberships = before.entries.reduce(
    (n, e) => n + e.sourceIndexFiles.length,
    0,
  );
same(sourceComponents, 472);
same(sourceMemberships, 505);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 21,
  sourceComponents,
  sourceIndexMemberships: sourceMemberships,
  excludedAggregateMemberships: 33,
  explicitTopicEdits: 21,
  combinedPinnedCurriculumSections: 1576,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  existingFunctionPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original basic Anatomy drafts, not validated tissue interiors, physiological motion, operative landmarks, scan registration or complete clinical curricula.',
};
await writeFile(
  new URL('docs/organ-anatomy-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
