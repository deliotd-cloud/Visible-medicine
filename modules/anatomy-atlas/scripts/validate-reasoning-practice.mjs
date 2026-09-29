import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-component-test-build.mjs';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const require = createRequire(new URL('package.json', root));
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  stdin: {
    contents: `export * from './lib/atlas-practice';
export * from './lib/reasoning-questions';
export * from './lib/body-display-catalog';
export { copyRecoveryCamera } from './lib/renderer-health';
export { ReasoningFeedback } from './app/reasoning-feedback';
export * as base from './lib/anatomy-practice';`,
    resolveDir: fileURLToPath(root),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const testModule = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  require,
  module: testModule,
  exports: testModule.exports,
});
const api = testModule.exports;
const read = (path) => readFile(new URL(path, root), 'utf8');
const hash = (text) => createHash('sha256').update(text).digest('hex');
const catalogBytes = await read(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogBytes);
const indexBytes = await read(
  'LICENSES/bodyparts3d-v4-index/isa_element_parts.txt',
);
const rows = indexBytes
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split('\t'));
const partofIndexBytes = await read('LICENSES/bodyparts3d-v4-index/partof_element_parts.txt');
const partofRows = partofIndexBytes.trim().split(/\r?\n/).slice(1).map(line => line.split('\t'));
const loaded = catalog.bundles.map((b) => b.id);
const all = catalog.structures;
const definitionsBefore = JSON.stringify(api.reasoningConcepts);
let checks = 0,
  serial = 0,
  negativeCases = 0;
const same = (a, b, message) => {
  checks++;
  // Executed source lives in a VM realm; compare cloned values, not prototypes.
  assert.deepEqual(structuredClone(a), structuredClone(b), message);
};
const check = (condition, message) => {
  checks++;
  assert(condition, message);
};
const options = (extra) => ({
  id: ++serial,
  mode: 'reason',
  sampling: 'all',
  count: 20,
  ...extra,
});
const create = (
  scope = all,
  extra = {},
  bundles = loaded,
  random = () => 0.314159,
) => api.createPracticeSession(scope, bundles, options(extra), random);
const bound = all.filter(api.reasoningConceptFor);
const precedingConcepts = api.reasoningConcepts.slice(0, 104);
same(api.reasoningConcepts.slice(104,116).map(c => c.key), [
  'limb-deltoid-clavicular', 'limb-deltoid-acromial', 'limb-deltoid-spinal',
  'limb-abductor-pollicis-longus', 'limb-extensor-pollicis-brevis', 'limb-extensor-pollicis-longus',
  'limb-iliacus', 'limb-piriformis', 'limb-obturator-internus', 'limb-quadratus-femoris',
  'limb-gemellus-superior', 'limb-gemellus-inferior',
], 'Only the twelve reviewed concepts are appended');
same(precedingConcepts.length, 104);
same(hash(JSON.stringify(precedingConcepts)), '6aa090bb8f9142fd266af59df995b4c2c7b7f8bef425318c34ebf7332cb69899', 'All preceding 104 concepts remain unchanged and ordered');
same(hash(JSON.stringify(api.reasoningConcepts.slice(0,116))), 'c78bf5e2c3eee38966910f94ad97dbbf898ae73999b52e8e7a6a71db5aaa3520', 'All preceding 116 concepts remain unchanged and ordered');
same(api.reasoningConcepts.slice(116,123).map(c => c.key), ['abdominal-stomach','abdominal-gallbladder','abdominal-spleen','abdominal-cystic-duct','abdominal-common-hepatic-duct','abdominal-ileocecal-junction','abdominal-appendix']);
same(hash(JSON.stringify(api.reasoningConcepts.slice(0,123))), '3052d88e4b5e2c1dd55f34d37989a4d847e91e41d5707a48a6a876c2d15fb883', 'All preceding 123 concepts remain unchanged and ordered');
same(api.reasoningConcepts.slice(123,126).map(c => c.key), ['thoracic-trachea','thoracic-esophagus','thoracic-thymus']);
same(hash(JSON.stringify(api.reasoningConcepts.slice(0,126))), '523ab89c9c6313eec445979978777283e316b118328bd18ddde80a47ecfd3a32', 'All preceding 126 concepts remain unchanged and ordered');
same(hash(JSON.stringify(api.reasoningConcepts.slice(0,132))), '256305e55245d7595c03cc888c3bb8a4918debd6bf6055419860cf66555c892e', 'All preceding 132 concepts remain unchanged and ordered');
same(hash(JSON.stringify(api.reasoningConcepts.slice(0,140))), '2b5f7d7e84abdb80f494c0e0a6d3b371e8cb122abf46b9da69b8d555a9eebe66', 'All preceding 140 concepts remain unchanged and ordered');
same(api.reasoningConcepts.length, 153);
same(bound.length, 282);
same(bound.filter((s) => s.region === 'shoulder-arm').length, 40);
same(bound.filter((s) => s.region === 'forearm').length, 18);
same(bound.filter((s) => s.region === 'hand').length, 20);
same(bound.filter((s) => s.region === 'thigh').length, 36);
same(bound.filter((s) => s.region === 'leg').length, 28);
same(bound.filter((s) => s.region === 'foot').length, 16);
same(bound.filter((s) => s.region === 'head-neck').length, 60);
same(bound.filter((s) => s.region === 'spine').length, 24);
same(bound.filter((s) => s.region === 'thorax').length, 19);
same(bound.filter((s) => s.region === 'abdomen').length, 11);
same(bound.filter((s) => s.region === 'pelvis').length, 10);
same(new Set(api.reasoningConcepts.map((c) => c.key)).size, 153);
same(hash(JSON.stringify(precedingConcepts.filter(c => !c.key.startsWith('neck-')))),
  'caafb323ca7d5a04971f91ad369d68c3a8da5e43839b39d8cd76192d1497bad2',
  'All 100 preceding concepts remain unchanged and in order');
same(hash(JSON.stringify(precedingConcepts.filter(c => !c.key.startsWith('trunk-') && !c.key.startsWith('neck-')))),
  '309529bda0dd03063b56bfb2af9272fba105d083f8cad728008d1095c92cc9d1',
  'All 80 previously authored concepts remain unchanged');
same(
  hash(
    JSON.stringify(
      precedingConcepts.filter((c) =>
        ['shoulder-arm', 'forearm'].includes(c.region),
      ),
    ),
  ),
  'f4003687431080f6978cfd5fec6400cb0ee309d0a2c62119251558e3d647089e',
  'Existing shoulder/forearm question records are unchanged',
);
same(
  hash(
    JSON.stringify(
      precedingConcepts.filter((c) =>
        ['shoulder-arm', 'forearm', 'hand'].includes(c.region),
      ),
    ),
  ),
  '4d38a5948cf93eb4e58d5666805d02b00f0d4d844fb5528e5d7208b9d93dc60b',
  'All 26 earlier question records are unchanged',
);
same(
  hash(
    JSON.stringify(
      precedingConcepts.filter(
        (c) => !['leg', 'foot', 'head-neck'].includes(c.region) && !c.key.startsWith('trunk-'),
      ),
    ),
  ),
  'bd2679e4ab16c7308d6f789b940a2180f9bbeb415037a19417a0f33a4a205aad',
  'All 38 earlier question records are unchanged',
);
same(
  hash(
    JSON.stringify(
      precedingConcepts.filter((c) => c.region !== 'head-neck' && !c.key.startsWith('trunk-')),
    ),
  ),
  '719a8996a39b802df8cd26153fc29d8df53ada101c31426713486e8264089ec3',
  'All 60 earlier question records are unchanged',
);
same(
  hash(catalogBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
  'Catalogue remains source-audited, not repinned for this feature',
);
for (const concept of api.reasoningConcepts) {
  same(concept.readiness, 'draft');
  same(concept.revision, 1);
  const grouped = ['trunk-diaphragm', 'trunk-external-intercostal', 'trunk-internal-intercostal', 'trunk-innermost-intercostal'].includes(concept.key);
  const organ = concept.sourceTissue === 'organ';
  const neuralOrgan = concept.sourceTissue === 'neural-organ';
  const vessel = concept.sourceTissue === 'vessel';
  const vesselSides = { FMA3736: 'midline', FMA3768: 'midline', FMA87217: 'unspecified', FMA4720: 'unspecified', FMA4838: 'unspecified', FMA4944: 'midline' };
  const pairedOrgan = ['pelvic-testis', 'pelvic-epididymis', 'pelvic-seminal-vesicle', 'pelvic-ureter'].includes(concept.key);
  same(concept.bindings.length, vessel || grouped || (organ && !pairedOrgan) ? 1 : 2);
  if (vessel) check(Object.hasOwn(vesselSides, concept.bindings[0].fma), 'Only the six explicitly authored vessels');
  same([...new Set(concept.bindings.map(b => b.side))].sort((a, b) => a.localeCompare(b)), vessel ? [vesselSides[concept.bindings[0].fma]] : organ && !pairedOrgan ? ['unpaired'] : grouped ? ['midline'] : ['left', 'right']);
  same(new Set(concept.distractors).size, 3);
  check(!concept.distractors.includes(concept.key));
  check(concept.prompt.length > 40 && concept.explanation.length > 40);
  check(concept.references.length > 0);
  for (const ref of concept.references)
    check(new URL(ref.url).protocol === 'https:');
  for (const binding of concept.bindings) {
    const files = binding.files ?? [binding.file];
    same(new Set(files).size, files.length, 'No repeated source part');
    check(
      files.length > 0 &&
        files.every((file) => typeof file === 'string' && file.length > 0),
    );
    check(
      'file' in binding !== 'files' in binding,
      'One unambiguous binding format',
    );
    same(
      (concept.sourceTree === 'partof' ? partofRows : rows).filter((row) => row[0] === binding.fma).map((row) => row[2]),
      files,
      'Complete official element-file membership',
    );
    const s = bound.find((s) => s.fmaId === binding.fma);
    check(s && s.laterality === binding.side);
    same(s.system, vessel ? 'vessels' : neuralOrgan ? 'nerves' : organ ? 'organs' : 'muscles');
    same(s.category, vessel ? 'vessel' : neuralOrgan || organ ? 'organ' : 'muscle');
    same(s.region, concept.region);
    same(s.sourceTree, concept.sourceTree ?? 'isa');
    same(s.regions, concept.sourceRegions ?? [concept.region]);
    same(api.reasoningConceptFor(s)?.key, concept.key);
    same(
      api.reasoningConceptFor({
        ...s,
        name: 'Unrelated display label',
        sourceName: 'Changed display label',
      })?.key,
      concept.key,
      'No display-name matching',
    );
    for (const mutation of [
      { fmaId: 'FMA000000' },
      { laterality: s.laterality === 'unpaired' ? 'midline' : 'unpaired' },
      { system: s.system === 'organs' ? 'muscles' : 'organs' },
      ...(neuralOrgan ? [{ system: 'muscles' }, { category: 'nerve' }] : []),
      { category: 'unknown' },
      { sourceTree: s.sourceTree === 'partof' ? 'isa' : 'partof' },
      { region: concept.region === 'thorax' ? 'abdomen' : 'thorax' },
      { region: concept.region === 'forearm' ? 'shoulder-arm' : 'forearm' },
      { regions: [concept.region === 'forearm' ? 'shoulder-arm' : 'forearm'] },
      { regions: ['shoulder-arm', 'hand'] },
      { regions: [concept.region === 'thorax' ? 'abdomen' : 'thorax'] },
      { regions: [] },
      { regions: [...s.regions, 'spine'] },
      ...(s.regions.length > 1
        ? [
            { regions: [s.regions[0]] },
            { regions: [...s.regions].reverse() },
            { regions: [s.regions[0], s.regions[0]] },
          ]
        : []),
      { sources: [] },
      { sources: [...s.sources, ...s.sources] },
      { sources: [{ ...s.sources[0], file: 'FJ0000' }] },
      ...(s.sources.length > 1
        ? [
            { sources: [s.sources[0]] },
            { sources: s.sources.slice(1) },
            { sources: [...s.sources].reverse() },
            {
              sources: [
                s.sources[0],
                ...s.sources.slice(1).map((p) => ({ ...p, file: 'FJ0000' })),
              ],
            },
          ]
        : []),
    ]) {
      negativeCases++;
      same(
        api.reasoningConceptFor({ ...s, ...mutation }),
        undefined,
        'Changed identity/scope/component rejected',
      );
    }
  }
}
same(
  bound
    .filter((s) => s.system === 'muscles' && s.sources.length > 1)
    .map((s) => [s.fmaId, s.sources.map((p) => p.file)]),
  [
    ['FMA9756', ['FJ1451', 'FJ1451M']],
    ['FMA9758', ['FJ1454', 'FJ1454M']],
    ['FMA9757', ['FJ1455', 'FJ1455M']],
    ['FMA46293', ['FJ1555', 'FJ1560', 'FJ1578']],
    ['FMA46292', ['FJ1556', 'FJ1579']],
    ['FMA46590', ['FJ2784', 'FJ2785']],
    ['FMA46589', ['FJ2802', 'FJ2803']],
    ['FMA13373', ['FJ1446', 'FJ1464']],
    ['FMA13374', ['FJ1446M', 'FJ1464M']],
  ],
  'Only nine explicitly authored multi-part source representations are admitted',
);
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
  for (const side of ['both', 'left', 'right']) {
    const scope = all.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' || s.laterality === side || ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    const session = create(scope);
    const count = api.practiceQuestionCount(scope, 'reason');
    same(
      session?.questions.length ?? 0,
      Math.min(20, count),
      'Available concept count respects the existing 20-question session cap',
    );
    same(api.practiceCanStart(scope, 'reason'), count > 0);
    if (
      ![
        'whole-body',
        'shoulder-arm',
        'forearm',
        'hand',
        'thigh',
        'pelvis',
        'leg',
        'foot',
        'head-neck',
        'thorax',
        'abdomen',
        'spine',
      ].includes(region)
    )
      same(session, null, 'No unbound regional question is invented');
    if (!session) continue;
    const expected = { 'whole-body': 20, 'head-neck': 20, 'shoulder-arm': 20, forearm: 9,
      hand: 10, thigh: 18, pelvis: 16, leg: 14, foot: 8, spine: 12, thorax: 16, abdomen: 9 }[region];
    same(session.questions.length, expected);
    same(
      new Set(session.questions.map((q) => q.reasoning.key)).size,
      expected,
      'Do not repeat contralateral versions',
    );
    for (const q of session.questions) {
      const target = scope.find((s) => s.id === q.target),
        concept = api.reasoningConceptFor(target);
      same(q.choices.length, 1 + scope.filter(s => s.laterality === target.laterality && concept.distractors.includes(api.reasoningConceptFor(s)?.key)).length);
      same(new Set(q.choices).size, q.choices.length);
      check(q.choices.includes(q.target));
      for (const id of q.choices) {
        const choice = scope.find((s) => s.id === id);
        check(choice && choice.laterality === target.laterality);
        check(
          id === q.target ||
            concept.distractors.includes(api.reasoningConceptFor(choice)?.key),
        );
      }
    }
  }
}
same(create(all, {}, []), null, 'Unloaded questions excluded');
same(create(all, { sampling: 'focus', focusIds: [] }), null);
same(create([bound[0]]), null, 'No single-answer question');
const target = bound.find((s) => s.fmaId === 'FMA32544');
const alternative = bound.find((s) => s.fmaId === 'FMA32547');
const pair = [target, alternative];
const targetIds = pair.map((s) => s.id);
same(
  create(all, { sampling: 'focus', focusIds: targetIds })?.questions.length,
  2,
);
same(
  create(pair)?.questions.every((q) => q.choices.length === 2),
  true,
  'Narrow focus still has honest alternatives',
);
same(create(all, { sampling: 'focus', focusIds: [target.id] }), null);
same(create(all, { retryIds: [] }), null);
same(create(all, { retryIds: ['not-in-catalogue'] }), null);
const twoSides = bound
  .filter((s) => api.reasoningConceptFor(s).key === 'supraspinatus')
  .map((s) => s.id);
same(api.practiceQuestionCount(all, 'reason', twoSides), 1);
same(
  create(all, { retryIds: twoSides })?.questions.length,
  1,
  'Retry count is concept-based',
);
same(
  api.practiceQuestionCount([target], 'reason', [target.id]),
  0,
  'Lost distractor disables retry',
);
same(create([target], { retryIds: [target.id] }), null);
for (const count of [1, 5, 10, 20, 100, NaN, Infinity, -10]) {
  same(
    create(all, { count }).questions.length,
    Math.min(
      153,
      Math.max(1, Math.min(20, Math.floor(Number.isFinite(count) ? count : 5))),
    ),
  );
}
for (const value of [NaN, Infinity, -Infinity, -1, 0, 1, 20])
  check(
    create(all, {}, loaded, () => value)?.questions.length === 20,
    'Random edge remains finite',
  );
same(create(all, { id: 0 }), null);
same(create(all, { id: 1.5 }), null);
const newConcepts = api.reasoningConcepts.filter(c => c.key.startsWith('trunk-') || c.key.startsWith('neck-') || c.key.startsWith('limb-') || c.key.startsWith('abdominal-') || c.key.startsWith('thoracic-'));
const referenceWords = {};
same(newConcepts.length, 52);
const limbConcepts = newConcepts.filter(c => c.key.startsWith('limb-'));
const organConcepts = newConcepts.filter(c => c.sourceTissue === 'organ');
same(organConcepts.length, 10);
const liveDisplay = api.bodyDisplayCatalog(catalog);
const pelvicConcepts = api.reasoningConcepts.slice(132,140);
same(pelvicConcepts.map(c => c.key), [
  'pelvic-bladder', 'pelvic-prostate', 'pelvic-rectum', 'pelvic-urethra',
  'pelvic-testis', 'pelvic-epididymis', 'pelvic-seminal-vesicle', 'pelvic-ureter',
]);
const pelvicDisplay = liveDisplay.structures.filter(s => api.reasoningConceptFor(s)?.key.startsWith('pelvic-'));
same(pelvicDisplay.length, 12, 'Twelve actual display identities, not fabricated organ geometry');
same(pelvicDisplay.map(s => s.fmaId).sort(), ['FMA15900','FMA9600','FMA14544','FMA19667','FMA7211','FMA7212','FMA18256','FMA18257','FMA19387','FMA19388','FMA15571','FMA15572'].sort());
same(create(pelvicDisplay)?.questions.length, 8, 'Eight concepts, without contralateral duplicates');
for (const side of ['both', 'left', 'right']) {
  const scope = pelvicDisplay.filter(s => side === 'both' || s.laterality === side || s.laterality === 'unpaired');
  const session = create(scope);
  same(session?.questions.length, 8, 'Either source side plus unpaired organs supports all eight questions');
  same(new Set(session.questions.map(q => q.reasoning.key)).size, 8);
  same(session.questions.every(q => q.choices.length === 4), true);
}
for (const target of pelvicDisplay) {
  const concept = api.reasoningConceptFor(target);
  same(concept.sourceTissue, 'organ');
  same(target.category, 'organ');
  for (const region of ['whole-body', 'pelvis']) {
    const scope = liveDisplay.structures.filter(s => region === 'whole-body' || s.regions.includes(region));
    const session = create(scope, { retryIds: [target.id] }, liveDisplay.bundles.map(b => b.id));
    same(session?.questions.length, 1, 'Every pelvic organ playable in regional and whole-body display scope');
    const question = session.questions[0];
    same(question.choices.length, 4);
    for (const id of question.choices) {
      const choice = scope.find(s => s.id === id);
      same(choice.system, 'organs');
      same(choice.laterality, target.laterality);
      check(id === target.id || concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
    }
    same(create(scope.filter(s => s.id !== target.id), { retryIds: [target.id] }), null, 'Hidden target excluded');
    same(create(scope, { retryIds: [target.id] }, liveDisplay.bundles.map(b => b.id).filter(id => id !== target.bundle)), null, 'Unloaded target excluded');
    same(create([target]), null, 'No isolated-organ answer giveaway');
    same(create(scope, { sampling: 'focus', focusIds: [target.id], retryIds: [target.id] }), null);
    const partialIds = [target.id, ...question.choices.filter(id => id !== target.id).slice(0, 1)];
    same(create(scope, { sampling: 'focus', focusIds: partialIds, retryIds: [target.id] })?.questions[0].choices.length, 2, 'Focus uses only its loaded visible alternative');
    for (const chosen of [...question.choices, null]) {
      same(renderToStaticMarkup(createElement(api.ReasoningFeedback, { session })), '', 'Feedback is hidden until answer or skip');
      const answered = api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen });
      same(api.practiceScore(answered), Number(chosen === target.id));
      const markup = renderToStaticMarkup(createElement(api.ReasoningFeedback, { session: answered }));
      check(markup.includes(concept.references[0].url), 'Actual pelvic feedback renders source link');
      check(markup.includes(concept.explanation), 'Actual pelvic feedback renders exact original explanation');
      same(api.practiceReducer(answered, { type: 'answer', sessionId: session.id, index: 0, chosen: target.id }), answered, 'Cannot answer twice');
    }
  }
  same(create(liveDisplay.structures.filter(s => s.regions.includes('thorax')), { retryIds: [target.id] }), null);
  if (concept.key === 'pelvic-ureter') {
    same(target.region, 'abdomen');
    same(target.regions, ['abdomen', 'pelvis'], 'Ureter remains cross-region, not relabelled as pelvis-only');
    same(create(liveDisplay.structures.filter(s => s.regions.includes('abdomen')), { retryIds: [target.id] }), null, 'Abdomen alone has no curated same-side ureter alternative');
  }
  for (const other of pelvicDisplay.filter(s => s.id !== target.id)) {
    same(api.reasoningConceptFor({ ...target, sources: other.sources }), undefined, 'Wrong pelvic surface cannot inherit another question');
  }
}
const deepConcepts = api.reasoningConcepts.slice(126,132);
same(deepConcepts.map(c => c.key), [
  'deep-brain-caudate', 'deep-brain-putamen', 'deep-brain-pallidum',
  'deep-brain-thalamus', 'deep-brain-lateral-geniculate', 'deep-brain-medial-geniculate',
]);
same(deepConcepts.every(c => c.sourceTissue === 'neural-organ'), true);
const deepDisplay = liveDisplay.structures.filter(s => api.reasoningConceptFor(s)?.key.startsWith('deep-brain-'));
same(deepDisplay.length, 12, 'Actual display catalogue retains all twelve exact neural-organ bindings');
const deepBoth = create(deepDisplay);
same(deepBoth?.questions.length, 6, 'Both-side deep-brain session has six concepts');
same(new Set(deepBoth.questions.map(q => q.reasoning.key)).size, 6, 'Contralateral versions do not repeat');
for (const side of ['left', 'right']) {
  const sideSession = create(deepDisplay.filter(s => s.laterality === side));
  same(sideSession?.questions.length, 6, 'Each side alone admits all six concepts');
  same(sideSession.questions.every(q => q.choices.length === 4), true);
}
for (const concept of deepConcepts) {
  if (concept.key.includes('geniculate')) check(!concept.distractors.includes('deep-brain-thalamus'), 'Avoid parent thalamus as a geniculate distractor');
  for (const side of ['left', 'right']) {
    const target = deepDisplay.find(s => s.laterality === side && api.reasoningConceptFor(s)?.key === concept.key);
    check(target && target.system === 'nerves' && target.category === 'organ' && target.sourceTree === 'isa');
    for (const region of ['whole-body', 'head-neck']) {
      const scope = liveDisplay.structures.filter(s =>
        (region === 'whole-body' || s.regions.includes(region)) && s.laterality === side);
      const session = create(scope, { retryIds: [target.id] }, liveDisplay.bundles.map(b => b.id));
      same(session?.questions.length, 1, 'Deep-brain question playable in display scope');
      const q = session.questions[0];
      same(q.choices.length, 4, 'Three actual same-side alternatives');
      for (const id of q.choices) {
        const choice = scope.find(s => s.id === id);
        check(choice && choice.system === 'nerves' && choice.category === 'organ' && choice.laterality === side);
        check(id === target.id || concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
      }
      same(create(scope.filter(s => s.id !== target.id), { retryIds: [target.id] }), null, 'Hidden target excluded');
      same(create(scope, { retryIds: [target.id] }, liveDisplay.bundles.map(b => b.id).filter(id => id !== target.bundle)), null, 'Unloaded target excluded');
      same(create([target]), null, 'Isolated target cannot give away its answer');
      same(create(scope, { sampling: 'focus', focusIds: [target.id], retryIds: [target.id] }), null, 'Focus without alternatives excluded');
      same(create(scope, { sampling: 'focus', focusIds: q.choices, retryIds: [target.id] })?.questions.length, 1, 'Focused visible choices remain playable');
      const threeIds = [target.id, ...q.choices.filter(id => id !== target.id).slice(0, 2)];
      same(create(scope, { sampling: 'focus', focusIds: threeIds, retryIds: [target.id] })?.questions[0].choices.length, 3, 'Partial focus offers only its two visible alternatives');
    }
    same(create(liveDisplay.structures.filter(s => s.regions.includes('thorax')), { retryIds: [target.id] }), null, 'Other region excludes deep-brain target');
  }
}
for (const concept of organConcepts) {
  const target = liveDisplay.structures.find(s => api.reasoningConceptFor(s)?.key === concept.key);
  check(target && target.laterality === 'unpaired' && target.system === 'organs');
  for (const region of ['whole-body', concept.region]) for (const side of ['both','left','right']) {
    const scope = liveDisplay.structures.filter(s => (region === 'whole-body' || s.regions.includes(region)) &&
      (side === 'both' || s.laterality === side || ['unpaired','midline','unspecified'].includes(s.laterality)));
    const session = create(scope, {retryIds:[target.id]}, liveDisplay.bundles.map(b => b.id));
    same(session.questions.length, 1, 'Actual display catalogue admits one source-bound organ question');
    same(session.questions[0].choices.length, region === 'thorax' ? 3 : 4, 'Only actual curated alternatives in this view are offered');
    for(const id of session.questions[0].choices) same(liveDisplay.structures.find(s => s.id === id).system,'organs');
    same(create(scope, {retryIds:[target.id]}, liveDisplay.bundles.filter(b => b.id !== target.bundle).map(b=>b.id)),null);
  }
  same(create([target]),null,'No isolated-organ answer giveaway');
}
same(api.reasoningConceptFor(liveDisplay.structures.find(s=>s.fmaId==='FMA7201')),undefined,'Partial large-intestine group is not silently admitted');
same(limbConcepts.length, 12);
for (const concept of limbConcepts) for (const side of ['left', 'right']) {
  const target = bound.find(s => s.laterality === side && api.reasoningConceptFor(s).key === concept.key);
  for (const region of ['whole-body', ...(concept.sourceRegions ?? [concept.region])]) {
    const scope = all.filter(s => s.laterality === side && (region === 'whole-body' || s.regions.includes(region)));
    const session = create(scope, { retryIds: [target.id] });
    same(session.questions.length, 1, 'New target playable in each declared region and side');
    same(session.questions[0].choices.length, 4, 'Three curated same-side alternatives in each scope');
    same(create([target]), null, 'No lone-target fallback');
    same(create(scope, {retryIds: [target.id]}, loaded.filter(id => id !== target.bundle)), null, 'Unloaded target excluded');
  }
}
const neckConcepts = newConcepts.filter(c => c.key.startsWith('neck-'));
same(neckConcepts.length, 4);
for (const side of ['left', 'right']) {
  const scope = bound.filter(s => s.laterality === side && api.reasoningConceptFor(s).key.startsWith('neck-'));
  const session = create(scope);
  same(session.questions.length, 4, 'All four neck concepts playable on each actual source side');
  for (const q of session.questions) same(q.choices.length, 4, 'All four same-side neck choices loaded');
  for (const target of scope) same(create([target]), null, 'No lone-neck-target fallback');
}
for (const concept of [...newConcepts, ...deepConcepts, ...pelvicConcepts]) {
  for (const ref of concept.references) referenceWords[ref.url] = (referenceWords[ref.url] ?? 0) + (concept.prompt + ' ' + concept.explanation).split(/\s+/).length;
  const identities = bound.filter(s => api.reasoningConceptFor(s).key === concept.key);
  const oneQuestion = create(all, { retryIds: identities.map(s => s.id) });
  same(oneQuestion.questions.length, 1, 'Every new concept is playable, without contralateral duplication');
  same(api.reasoningFeedback(oneQuestion), undefined);
  same(renderToStaticMarkup(createElement(api.ReasoningFeedback, { session: oneQuestion })), '', 'No new explanation before an answer');
  for (const chosen of [...oneQuestion.questions[0].choices, null]) {
    const answered = api.practiceReducer(oneQuestion, { type: 'answer', sessionId: oneQuestion.id, index: 0, chosen });
    same(api.practiceScore(answered), Number(chosen === oneQuestion.questions[0].target));
    check(api.reasoningFeedback(answered)?.explanation === concept.explanation);
    check(renderToStaticMarkup(createElement(api.ReasoningFeedback, { session: answered })).includes(concept.references[0].url), 'Actual feedback includes the authored reference after each answer or skip');
  }
}
for (const [url, words] of Object.entries(referenceWords)) check(words <= 200, `Brief original synthesis per reference: ${url} (${words})`);
const groupedTargets = bound.filter(s => s.laterality === 'midline');
same(bound.filter(s => s.sourceTree === 'partof').map(s => s.fmaId).sort(), ['FMA13373', 'FMA13374', 'FMA15571', 'FMA15572', 'FMA15900', 'FMA7131', 'FMA7148', 'FMA7202', 'FMA7394', 'FMA9600', 'FMA9607']);
same(groupedTargets.map(s => s.fmaId).sort(), ['FMA13295', 'FMA9756', 'FMA9757', 'FMA9758', 'FMA3736', 'FMA3768', 'FMA4944'].sort());
same(create(groupedTargets).questions.length, 7, 'Four prior muscle groups and three exact catalogue-midline vessels work together');
for (const group of groupedTargets) {
  for (const laterality of ['left', 'right', 'unpaired', 'unspecified'])
    same(api.reasoningConceptFor({ ...group, laterality }), undefined, 'Never split/relabel a catalogue group');
  same(create([group]), null, 'A lone group cannot create a single-choice question');
}
const session = create(all, { count: 10 });
const markup = (session, index) =>
  renderToStaticMarkup(
    createElement(api.ReasoningFeedback, { session, index }),
  );
same(
  markup(session),
  '',
  'Real React component reveals no feedback before an answer',
);
same(
  api.practiceRenderIds(session),
  session.questions[0].choices,
  'Reasoning renders all alternatives, not just the correct answer',
);
for (const chosen of [
  session.questions[0].target,
  session.questions[0].choices.find((id) => id !== session.questions[0].target),
  null,
]) {
  const answered = api.practiceReducer(session, {
    type: 'answer',
    sessionId: session.id,
    index: 0,
    chosen,
  });
  same(answered.responses.length, 1);
  check(markup(answered).includes('Sources &amp; scope'));
  check(markup(answered).includes('educator review pending'));
  check(
    markup(answered).includes(session.questions[0].reasoning.references[0].url),
  );
  same(
    api.practiceReducer(answered, {
      type: 'answer',
      sessionId: session.id,
      index: 0,
      chosen,
    }),
    answered,
    'Answer once',
  );
  const next = api.practiceReducer(answered, {
    type: 'next',
    sessionId: session.id,
    index: 0,
  });
  same(next.index, 1);
  same(markup(next), '', 'Next unanswered explanation stays hidden');
  check(markup(next, 0).length > 0, 'Answered result remains reviewable');
  same(api.practiceRenderIds(next), next.questions[1].choices);
}
for (const action of [
  { type: 'answer', sessionId: session.id + 1, index: 0, chosen: null },
  { type: 'answer', sessionId: session.id, index: 1, chosen: null },
  { type: 'answer', sessionId: session.id, index: 0, chosen: 'foreign-choice' },
  { type: 'next', sessionId: session.id, index: 0 },
  { type: 'start', session: create() },
])
  same(
    api.practiceReducer(session, action),
    session,
    'Stale/foreign/premature action ignored',
  );
let completed = session;
for (let i = 0; i < session.questions.length; i++) {
  const chosen =
    i % 3 === 0
      ? completed.questions[i].target
      : i % 3 === 1
        ? null
        : completed.questions[i].choices.find(
            (id) => id !== completed.questions[i].target,
          );
  completed = api.practiceReducer(completed, {
    type: 'answer',
    sessionId: session.id,
    index: i,
    chosen,
  });
  completed = api.practiceReducer(completed, {
    type: 'next',
    sessionId: session.id,
    index: i,
  });
}
same(completed.status, 'complete');
same(api.practiceScore(completed), 4);
same(api.missedPracticeIds(completed.responses).length, 6);
same(api.practiceRenderIds(completed), []);
same(
  create(all, { retryIds: api.missedPracticeIds(completed.responses) })
    .questions.length,
  6,
);
for (let i = 0; i < 10; i++) check(markup(completed, i).length > 0);
for (const index of [-1, 0.5, 10, NaN, Infinity])
  same(markup(completed, index), '', 'Invalid/unanswered index stays hidden');
same(api.practiceReducer(session, { type: 'exit' }).status, 'idle');
same(api.practiceReducer(completed, { type: 'dismiss' }), {
  ...api.initialPractice,
  id: completed.id,
});
same(
  api.practiceReducer(completed, { type: 'start', session }),
  completed,
  'Same session cannot restart',
);
session.questions[0].reasoning.references[0].title = 'Session-local edit';
same(
  JSON.stringify(api.reasoningConcepts),
  definitionsBefore,
  'Session references are detached',
);
same(
  JSON.stringify(catalog),
  JSON.stringify(JSON.parse(catalogBytes)),
  'Catalogue untouched',
);
for (const mode of ['find', 'name'])
  for (const sampling of ['all', 'landmarks', 'focus']) {
    const opts = options({ mode, sampling, count: 5, focusIds: targetIds });
    const actual = api.createPracticeSession(all, loaded, opts, () => 0.31);
    const expected = api.base.createPracticeSession(
      all,
      loaded,
      opts,
      () => 0.31,
    );
    same(actual, expected, 'Existing modes preserve original algorithm');
    same(api.practiceRenderIds(actual), api.base.practiceRenderIds(expected));
    for (const action of [
      { type: 'answer', sessionId: actual.id, index: 0, chosen: null },
      { type: 'exit' },
      { type: 'dismiss' },
    ])
      same(
        api.practiceReducer(actual, action),
        api.base.practiceReducer(expected, action),
      );
  }
const explorer = await read('app/body-explorer.tsx');
// Execute the three changed real handler bodies with explicit state/callback
// fixtures. This is not a browser or a replacement implementation of the handlers.
const ast = ts.createSourceFile(
  'body.tsx',
  explorer,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const handlers = new Map();
let modeSelector;
function visit(node) {
  if (
    ts.isFunctionDeclaration(node) &&
    ['onSceneSelect', 'startExam', 'nextQuestion'].includes(node.name?.text)
  )
    handlers.set(node.name.text, node.getText(ast));
  if (
    ts.isJsxAttribute(node) &&
    node.name.text === 'onValueChange' &&
    node.initializer?.expression?.getText(ast).includes('setPracticeMode')
  )
    modeSelector = node.initializer.expression.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
function handler(name, env) {
  const text = handlers.get(name);
  check(text, 'Actual handler exists: ' + name);
  const code = ts.transpileModule(text, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return runInNewContext(code + '; ' + name, env);
}
for (const mode of ['find', 'name', 'reason'])
  for (const exam of [false, true])
    for (const displayReady of [false, true]) {
      const calls = [];
      handler('onSceneSelect', {
        displayReady,
        exam,
        practice: { mode },
        submitPractice: (id) => calls.push(['answer', id]),
        select: (id) => calls.push(['select', id]),
      })(target.id);
      same(
        calls,
        !displayReady || (exam && mode === 'name')
          ? []
          : [[exam ? 'answer' : 'select', target.id]],
        'Picking routes only to permitted practice modes',
      );
    }
for (const mode of ['find', 'name', 'reason'])
  for (const practicePaused of [false, true]) for (const finalQuestion of [false, true]) {
    const calls = [];
    handler('nextQuestion', {
      practicePaused,
      practice: { mode, id: 7, questions: Array(finalQuestion ? 3 : 4).fill({}) },
      question: 2,
      answered: true,
      restorePracticeView: () => calls.push('restore-study-view'),
      practiceDispatch: (a) => calls.push(a),
      setZoom: (z) => calls.push(z),
      setReset: (f) => calls.push(f(10)),
    })();
    same(
      calls,
      practicePaused
        ? []
        : [
            { type: 'next', sessionId: 7, index: 2 },
            ...(finalQuestion ? ['restore-study-view'] : mode === 'find' ? [] : [1, 11]),
          ],
      'Next respects pause, restores completed study view, otherwise resets reasoning camera',
    );
  }
for (const gate of ['ready', 'exam', 'blocked', 'no-retry']) {
  const calls = [];
  const env = {
    exam: gate === 'exam',
    practiceBlocked: gate === 'blocked',
    retryCount: gate === 'no-retry' ? 0 : 1,
    retryIds: [target.id],
    available: all,
    practiceLoadStatus: { loaded },
    practiceSerial: { current: 100 },
    practiceMode: 'reason',
    practiceCount: 5,
    practiceSampling: 'all',
    focusTargetIds: [],
    createPracticeSession: api.createPracticeSession,
    layout: 'tray',
    selectedId: target.id, isolated: true, focus: true, explode: 35,
    plate: true, zoom: 1.4, view: 'posterior',
    practiceReturnView: { current: null },
    cameraCapture: { current: null }, cameraRestore: { current: null },
    copyRecoveryCamera: api.copyRecoveryCamera,
    practiceDispatch: (a) => calls.push(['dispatch', a]),
  };
  for (const key of [
    'setPlate',
    'setLayout',
    'setSelectedId',
    'setIsolated',
    'setFocus',
    'setExplode',
    'setZoom',
    'setReset',
  ])
    env[key] = (value) =>
      calls.push([key, typeof value === 'function' ? value(3) : value]);
  handler('startExam', env)(true);
  if (gate !== 'ready') {
    same(calls, []);
    same(env.practiceSerial.current, 100);
    same(env.practiceReturnView.current, null, 'Blocked starts do not replace saved view');
  } else {
    const started = calls.find((c) => c[0] === 'dispatch')[1].session;
    same(started.mode, 'reason');
    same(started.questions.length, 1);
    same(started.questions[0].target, target.id);
    check(
      calls.some((c) => c[0] === 'setSelectedId' && c[1] === null),
      'Start clears answer highlighting',
    );
    check(calls.some((c) => c[0] === 'setExplode' && c[1] === 0));
    check(calls.some((c) => c[0] === 'setPlate' && c[1] === false));
    same(env.practiceReturnView.current, {
      selectedId: target.id, isolated: true, focus: true, explode: 35,
      layout: 'tray', plate: true, zoom: 1.4, view: 'posterior', camera: null,
    }, 'Actual start handler preserves the study view before hiding answers');
  }
}
check(modeSelector, 'Actual practice selector found');
const selectorCode = ts.transpileModule('const selector = ' + modeSelector, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const selectedModes = [];
const selector = runInNewContext(selectorCode + '; selector', {
  setPracticeMode: (value) => selectedModes.push(value),
});
for (const mode of ['find', 'name', 'reason', 'unknown']) selector(mode);
same(selectedModes, ['find', 'name', 'reason']);
for (const guard of [
  'labels={labels && !exam}',
  'landmarks={exam ? [] : stageLandmarks}',
  'inspection={exam ? initialInspection : inspection}',
  'plate={plate && !exam}',
  'practiceBlocked || retryCount === 0',
])
  check(explorer.includes(guard), 'Preserved exam/scope guard: ' + guard);
const report = {
  schemaVersion: 1,
  checks,
  negativeIdentityCases: negativeCases,
  concepts: api.reasoningConcepts.length,
  exactRepresentations: bound.length,
  regionalConcepts: Object.fromEntries([...new Set(api.reasoningConcepts.map(c => c.region))].map(region => [region, api.reasoningConcepts.filter(c => c.region === region).length])),
  multiPartRepresentations: bound.filter((s) => s.sources.length > 1).length,
  sharedRegionConcepts: { pelvis: 9, abdomen: 1, thigh: 1 },
  sharedRegionNote: 'Membership does not guarantee question eligibility without a curated visible alternative; psoas remains unavailable in thigh-only reasoning and ureters in abdomen-only reasoning.',
  groupedOrMidlineRepresentations: groupedTargets.length,
  newReferenceWords: referenceWords,
  sourceHashes: {
    catalog: hash(catalogBytes),
    officialElementIndex: hash(indexBytes),
    officialPartofElementIndex: hash(partofIndexBytes),
    questions: hash(definitionsBefore),
  },
  verification: [
    'Official complete FMA/file membership',
    'Ordered multi-part bindings reject partial, reordered and substituted components',
    'Exact identity/scope rejection',
    'Visible/loaded/focus/retry eligibility',
    'One question per concept',
    'Same-side curated alternatives',
    'Answer-once and stale-response guards',
    'Actual React server-rendered feedback gate',
    'Actual scene-pick, start, next and mode-selector handler execution',
    'Existing identification algorithm parity',
  ],
  boundaries: {
    clinicalApproval: false,
    educatorApproval: false,
    browserInteraction: false,
    spatialValidation: false,
    validatedAssessment: false,
  },
};
await writeFile(
  new URL('docs/reasoning-practice-validation.json', root),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
