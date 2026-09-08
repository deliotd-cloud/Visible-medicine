import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeCentralNeuro } from './central-neuro-curriculum-transition.mjs';
import { authoringBeforeOrgans } from './organ-curriculum-transition.mjs';
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
  'content/central-neuro-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeCentralNeuro(context);
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
// Independent exact source observations; spaces and commissural tissues differ.
const expected = {
  FMA61970: ['FJ1741', 'head-neck', 'organ', 'pending'],
  FMA62072: ['FJ1799', 'head-neck', 'organ', 'draft'],
  FMA78497: ['FJ1737', 'spine', 'space', 'draft'],
};
const definitions = api.centralNeuroLessons;
same(definitions.map((l) => l.fmaId).sort(), Object.keys(expected).sort());
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const l of definitions) {
  const s = entry(l.fmaId);
  const [file, region, category, functionReadiness] = expected[l.fmaId];
  check(s);
  same(s.system, 'nerves');
  same(s.laterality, 'midline');
  same(s.sourceTree, 'isa');
  same(
    s.sources.map((p) => p.file),
    [file],
  );
  same(s.regions, [region]);
  same(s.category, category);
  same(l.region, region);
  same(l.category, category);
  same(l.functionReadiness, functionReadiness);
  for (const t of api.contentTabs) {
    const result = api.centralNeuroLesson(s, t);
    if (!before.tabs.includes(t)) {
      same(result, undefined);
      continue;
    }
    same(result, api.bodyLesson(s, t));
    same(
      JSON.parse(JSON.stringify(result)),
      body.find((r) => r.id === s.id).content[t],
    );
    same(result.readiness, t === 'anatomy' ? 'draft' : functionReadiness);
    same(result.body, l[t]);
    check(result.note.includes('clinical review pending'));
    check(result.note.includes(s.coverageNote));
    check(result.note.includes('not tissue interiors'));
    same(result.bullets[0], l.distinction);
    same(result.citations, l.references);
    check(result.citations.length > 0);
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const original = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached arrays');
  }
  const exported = body.find((r) => r.id === s.id);
  same(exported.validation.clinicalApproval, 'not-included');
  same(exported.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const change of [
    { category: category === 'space' ? 'organ' : 'space' },
    { regions: region === 'spine' ? ['head-neck'] : ['spine'] },
    { system: 'organs' },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.centralNeuroLesson({ ...s, ...change }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.centralNeuroLesson(s, t), undefined);
for (const fma of ['FMA61970', 'FMA62072'])
  check(
    api
      .bodyContent(entry(fma), 'anatomy')
      .body.startsWith(previous.bodyContent(entry(fma), 'anatomy').body),
    'Retain original source identity caution',
  );
check(
  api.bodyLesson(entry('FMA61970'), 'function').title.includes('unresolved'),
);
check(
  api
    .bodyLesson(entry('FMA61970'), 'function')
    .body.includes('remain disputed'),
);
check(
  api
    .bodyLesson(entry('FMA62072'), 'function')
    .body.includes('one part of distributed'),
);
check(
  api
    .bodyLesson(entry('FMA78497'), 'anatomy')
    .body.includes('open lumen is often absent'),
);
check(
  api.bodyLesson(entry('FMA78497'), 'function').body.startsWith('Where patent'),
);
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rows = (
    await readFile(
      new URL('../../work/bodyparts3d/isa_element_parts.txt', import.meta.url),
      'utf8',
    )
  )
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split('\t'));
  for (const [fma, [file]] of Object.entries(expected)) {
    same(
      rows.filter((row) => row[0] === fma),
      [[fma, entry(fma).name.toLowerCase(), file]],
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA61970', 'function', 'readiness'],
  ['FMA61970', 'anatomy', 'body'],
  ['FMA62072', 'function', 'body'],
  ['FMA78497', 'anatomy', 'body'],
  ['FMA78497', 'ct', 'body'],
  ['FMA52623', 'function', 'body'],
  ['FMA13373', 'function', 'body'],
  ['FMA19728', 'function', 'readiness'],
];
for (const [fma, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === fma && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]: field === 'readiness' ? 'draft' : 'unrecorded',
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
const centralNeuroMilestone = await authoringBeforeOrgans(context);
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter(
          (s) => centralNeuroMilestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 552,
  'identity-only': 470,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 608,
  'identity-only': 146,
  pending: 268,
  'generated-identification': 0,
});
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'nerves' &&
        api.bodyLesson(s, 'function').readiness === 'pending',
    )
    .map((s) => s.fmaId),
  ['FMA61970'],
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 3,
  explicitTopicEdits: 6,
  newDrafts: 3,
  enrichedAnatomyDrafts: 2,
  preservedPendingFunction: 'FMA61970',
  combinedPinnedCurriculumSections: 718,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtCentralNeuroMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Evidence-aware teaching only; unresolved forniceal function, source boundaries and adult canal patency are not clinically adjudicated. No complete cord, axonal connectivity or acquired imaging.',
};
await writeFile(
  new URL('docs/central-neuro-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
