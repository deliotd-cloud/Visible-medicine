import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { contentContext, readContentJson } from './content-contract-tools.mjs';
import { curriculumHash } from './curriculum-transition.mjs';
import { authoringBeforeKneeImaging } from './knee-imaging-transition.mjs';
import {
  kneeImagingLesson,
  kneeImagingIdentities,
} from '../lib/knee-imaging.ts';
import { bodyStudyScope } from '../lib/study-links.ts';
const context = await contentContext();
const { api, catalog, body } = context;
const previous = await authoringBeforeKneeImaging(context);
const before = await readContentJson('content/knee-imaging.before.json');
assert.equal(
  createHash('sha256')
    .update(await readFile('public/models/bodyparts3d/full-body/catalog.json'))
    .digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
assert.equal(
  curriculumHash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        previous.contentTabs.map((t) => [t, previous.bodyContent(s, t)]),
      ),
    })),
    shoulder: previous.structures,
    dissectionProfiles: api.dissectionProfiles,
  }),
  before.copyAndRecipeHash,
  'All other lessons, original shoulder teaching and study recipes remain exact',
);
const rows = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((l) => l.split('\t'));
let sections = 0,
  unchangedSections = 0,
  rejectedBindings = 0,
  sourceRowsVerified = 0;
const topics = new Set();
for (const s of catalog.structures)
  for (const tab of previous.contentTabs) {
    const lesson = kneeImagingLesson(s, tab);
    if (!lesson) {
      unchangedSections++;
      assert.deepEqual(api.bodyLesson(s, tab), previous.bodyLesson(s, tab));
      continue;
    }
    sections++;
    topics.add(s.name.replace(/^(Left|Right) /, '') + '/' + tab);
    assert.deepEqual(api.bodyLesson(s, tab), lesson);
    const record = body.find((r) => r.id === s.id);
    assert.equal(record.content[tab].body, lesson.body);
    assert.equal(record.content[tab].readiness, 'draft');
    assert.equal(lesson.readiness, 'draft');
    assert(lesson.title.startsWith(s.name));
    assert(lesson.title.endsWith('draft'));
    assert.match(lesson.note, /No patient images/);
    assert.match(lesson.note, /review pending/);
    assert.equal(lesson.bullets.length, 4);
    for (const u of lesson.citations)
      assert.equal(new URL(u).protocol, 'https:');
    const original = structuredClone(lesson);
    lesson.bullets[0] = 'mutated';
    lesson.citations.push('https://example.invalid');
    assert.deepEqual(
      kneeImagingLesson(s, tab),
      original,
      'Detached display data',
    );
  }
assert.equal(sections, 14);
assert.equal(unchangedSections, 8162);
assert.equal(topics.size, 7);
for (const i of kneeImagingIdentities) {
  const s = catalog.structures.find((s) => s.fmaId === i.fmaId);
  assert.deepEqual(
    rows.filter((r) => r[0] === i.fmaId).map((r) => [r[1], r[2]]),
    [[i.side + ' ' + i.bone, i.file]],
  );
  sourceRowsVerified++;
  for (const region of ['leg', 'whole-body']) {
    assert(bodyStudyScope(catalog, region, i.side).some((v) => v.id === s.id));
    assert(
      !bodyStudyScope(
        catalog,
        region,
        i.side === 'left' ? 'right' : 'left',
      ).some((v) => v.id === s.id),
    );
  }
  const mutations = [
    { fmaId: 'FMA0' },
    { id: s.id + '-other' },
    { name: 'Knee' },
    { system: 'muscles' },
    { category: 'tendon' },
    { laterality: i.side === 'left' ? 'right' : 'left' },
    { sourceTree: 'partof' },
    { region: 'foot' },
    { regions: ['foot'] },
    { bundle: 'other' },
    { nodeName: 'other' },
    { sources: [] },
    { sources: [...s.sources, ...s.sources] },
    { sources: [{ ...s.sources[0], file: 'FJ0' }] },
    { sources: [{ ...s.sources[0], sha256: '0'.repeat(64) }] },
  ];
  if (s.regions.length > 1)
    mutations.push({ regions: [...s.regions].reverse() });
  for (const mutation of mutations)
    for (const tab of ['ct', 'mri', 'ultrasound']) {
      assert.equal(
        kneeImagingLesson({ ...structuredClone(s), ...mutation }, tab),
        undefined,
      );
      rejectedBindings++;
    }
  if (i.bone !== 'patella')
    assert.equal(api.bodyLesson(s, 'ultrasound').readiness, 'pending');
}
const changedApi = {
  ...api,
  bodyLesson(s, t) {
    const lesson = api.bodyLesson(s, t);
    return s.fmaId === 'FMA24487' && t === 'mri'
      ? { ...lesson, body: 'unrecorded change' }
      : lesson;
  },
};
await assert.rejects(
  () => authoringBeforeKneeImaging({ api: changedApi, catalog }),
  /Unrecorded knee imaging edit/,
);
const registry = await readContentJson('content/learning-resources.v1.json');
assert.deepEqual(registry.resources, []);
assert.deepEqual(registry.links, []);
const report = {
  passed: true,
  newDraftSections: sections,
  representations: 6,
  uniqueTopicDrafts: topics.size,
  unchangedBodySections: unchangedSections,
  officialSourceRowsVerified: sourceRowsVerified,
  rejectedBindings,
  unrecordedLessonRejected: true,
  catalogueAndRecipesUnchanged: true,
  noNewControls: true,
  patientScansLoaded: false,
  registrationAdded: false,
  clinicalApproval: false,
  browserTesting: false,
  limitations:
    'Knee-focused CT/MRI notes for whole femur/tibia/patella surfaces and patellar ultrasound landmarks. No separate cartilage, menisci, cruciate ligaments, extensor tendons, marrow or patient images added. Independent radiologist/educator review and device acceptance remain required.',
};
await writeFile(
  'docs/knee-imaging-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
