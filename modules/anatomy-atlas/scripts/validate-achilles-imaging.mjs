import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { contentContext, readContentJson } from './content-contract-tools.mjs';
import { curriculumHash } from './curriculum-transition.mjs';
import { authoringBeforeAchillesImaging } from './achilles-imaging-transition.mjs';
import { authoringBeforeKneeImaging } from './knee-imaging-transition.mjs';
import { achillesImagingLesson } from '../lib/achilles-imaging.ts';
import { bodyStudyScope, studyDestinations } from '../lib/study-links.ts';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const context = await contentContext();
const { catalog, body } = context;
// The separately verified knee addition is removed only for historical comparisons.
const api = await authoringBeforeKneeImaging(context);
const previous = await authoringBeforeAchillesImaging(context);
const before = await readContentJson('content/achilles-imaging.before.json');
assert.equal(
  hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
assert.equal(
  curriculumHash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((t) => [t, previous.bodyContent(s, t)]),
      ),
    })),
    shoulder: api.structures,
    dissectionProfiles: api.dissectionProfiles,
  }),
  before.copyAndRecipeHash,
  'Only the four pinned sections may change; all other content and recipes remain exact',
);
const expected = [
  ['FMA258847', 'right', 'FJ1405'],
  ['FMA264844', 'left', 'FJ1405M'],
];
const sourceRows = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split('\t'));
let sections = 0,
  unchangedSections = 0,
  sourceRowsVerified = 0,
  rejectedBindings = 0;
for (const s of catalog.structures)
  for (const tab of api.contentTabs) {
    const lesson = achillesImagingLesson(s, tab);
    if (!lesson) {
      unchangedSections++;
      assert.deepEqual(api.bodyLesson(s, tab), previous.bodyLesson(s, tab));
      continue;
    }
    sections++;
    assert(expected.some(([fma]) => fma === s.fmaId));
    assert(['mri', 'ultrasound'].includes(tab));
    assert.deepEqual(lesson, api.bodyLesson(s, tab));
    assert.equal(lesson.readiness, 'draft');
    assert.match(lesson.title, /draft$/);
    assert.match(lesson.note, /No patient images/);
    assert.equal(lesson.bullets.length, 4);
    for (const url of lesson.citations)
      assert.equal(new URL(url).protocol, 'https:');
    const record = body.find((r) => r.id === s.id);
    assert.equal(record.content[tab].body, lesson.body);
    assert.equal(record.content[tab].readiness, 'draft');
    // Returned display data must not mutate the shared authoring definition.
    lesson.bullets[0] = 'test mutation';
    lesson.citations.push('https://example.invalid');
    assert.notEqual(achillesImagingLesson(s, tab).bullets[0], 'test mutation');
    assert.equal(achillesImagingLesson(s, tab).citations.length, 2);
  }
assert.equal(sections, 4);
assert.equal(unchangedSections, 8172);
for (const [fma, side, file] of expected) {
  const s = catalog.structures.find((s) => s.fmaId === fma);
  const official = sourceRows.filter((row) => row[0] === fma);
  assert.deepEqual(
    official.map((row) => [row[1], row[2]]),
    [[side + ' calcaneal tendon', file]],
  );
  sourceRowsVerified += official.length;
  assert.equal(api.bodyLesson(s, 'ct').readiness, 'pending');
  for (const region of ['leg', 'foot', 'whole-body'])
    assert(
      bodyStudyScope(catalog, region, side).some((item) => item.id === s.id),
    );
  const destinations = studyDestinations(catalog, s, 'whole-body', side);
  assert(destinations.some((d) => d.region === 'leg'));
  assert(destinations.some((d) => d.region === 'foot'));
  const mutations = [
    (v) => {
      v.fmaId = 'FMA258848';
    },
    (v) => {
      v.id += '-other';
    },
    (v) => {
      v.name = 'Achilles';
    },
    (v) => {
      v.system = 'muscles';
    },
    (v) => {
      v.category = 'ligament';
    },
    (v) => {
      v.laterality = side === 'left' ? 'right' : 'left';
    },
    (v) => {
      v.sourceTree = 'partof';
    },
    (v) => {
      v.region = 'foot';
    },
    (v) => {
      v.regions.reverse();
    },
    (v) => {
      v.bundle = 'other';
    },
    (v) => {
      v.nodeName = 'other';
    },
    (v) => {
      v.sources[0].file += 'M';
    },
    (v) => {
      v.sources[0].sha256 = '0'.repeat(64);
    },
    (v) => {
      v.sources.push(structuredClone(v.sources[0]));
    },
    (v) => {
      v.sources = [];
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(s);
    mutate(changed);
    for (const tab of ['mri', 'ultrasound']) {
      assert.equal(achillesImagingLesson(changed, tab), undefined);
      rejectedBindings++;
    }
  }
}
const modifiedApi = {
  ...context.api,
  bodyLesson(s, tab) {
    const lesson = context.api.bodyLesson(s, tab);
    return s.fmaId === expected[0][0] && tab === 'mri'
      ? { ...lesson, body: 'unrecorded change' }
      : lesson;
  },
};
await assert.rejects(
  () => authoringBeforeAchillesImaging({ api: modifiedApi, catalog }),
  /Unrecorded Achilles imaging edit/,
);
const registry = await readContentJson('content/learning-resources.v1.json');
assert.equal(registry.resources.length, 0);
assert.equal(registry.links.length, 0);
const report = {
  passed: true,
  newDraftSections: sections,
  representations: 2,
  uniqueTopicDrafts: 2,
  unchangedBodySections: unchangedSections,
  officialSourceRowsVerified: sourceRowsVerified,
  rejectedBindings,
  unrecordedLessonRejected: true,
  ctRemainsPending: true,
  catalogueAndRecipesUnchanged: true,
  patientScansLoaded: false,
  registrationAdded: false,
  clinicalApproval: false,
  browserTesting: false,
  limitations:
    'Source-bound educational notes and software checks only. Independent radiologist/educator review and device acceptance remain required. No MRI signal, ultrasound beam, tissue mechanics or acquired patient data is simulated.',
};
await writeFile(
  'docs/achilles-imaging-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
