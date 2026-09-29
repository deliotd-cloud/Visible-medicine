import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-component-test-build.mjs';

const root = new URL('../', import.meta.url);
const require = createRequire(new URL('package.json', root));
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const baselineHead = 'a3f12f72d660bcbe7b27e172eaadafa8d9d09e44';
const read = path => readFile(new URL(path, root), 'utf8');
const gitSource = path => execFileSync('git', ['show', `${baselineHead}:${path}`], { cwd: fileURLToPath(root), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function load(contents, resolveDir = fileURLToPath(root)) {
  const result = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { require, module, exports: module.exports });
  return module.exports;
}
let checks = 0, serial = 0, negativeSourceCases = 0, regionalTargets = 0;
const same = (actual, expected, message) => { checks++; assert.deepEqual(structuredClone(actual), structuredClone(expected), message); };
const check = (value, message) => { checks++; assert(value, message); };
const baselineSource = gitSource('lib/reasoning-questions.ts');
// Resolve historical imports locally only after checking every imported definition
// against the exact source baseline, including prior strict vessel pins.
for (const [, relative] of baselineSource.matchAll(/from '([^']+reasoning)'/g)) {
  const path = `lib/${relative.slice(2)}.ts`;
  same(await read(path), gitSource(path), `Historical imported definition unchanged: ${path}`);
}
const baseline = await load(baselineSource, fileURLToPath(new URL('lib/', root)));
const api = await load(`export * from './lib/reasoning-questions';
export * from './lib/lower-limb-bone-reasoning';
export * from './lib/atlas-practice';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ReasoningFeedback } from './app/reasoning-feedback';`);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
same(await read(catalogPath), gitSource(catalogPath), 'Authoring leaves entire source catalogue unchanged');
const catalog = JSON.parse(await read(catalogPath));
const officialRows = (await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).slice(1).map(line => line.split('\t'));
const display = api.bodyDisplayCatalog(catalog);
const loaded = display.bundles.map(bundle => bundle.id);
const create = (scope = display.structures, extra = {}, bundles = loaded, random = () => 0.314159) => api.createPracticeSession(scope, bundles, { id: ++serial, mode: 'reason', sampling: 'all', count: 20, ...extra }, random);
// Independent expectations from the baseline catalogue and official ISA index.
const expected = [
  [
    "lower-limb-bone-femur",
    [
      "thigh",
      "pelvis",
      "leg"
    ],
    [
      "FMA24474",
      "right",
      "FJ3365",
      "5eff0f92905dd45bd0e79b1de0144dc15988c73c683468163255ba1452d58037"
    ],
    [
      "FMA24475",
      "left",
      "FJ3259",
      "d291cc3619c32c68edb9d29e0b755634c2cb85e3db89f0d0b63a316f879ef86d"
    ]
  ],
  [
    "lower-limb-bone-patella",
    [
      "leg"
    ],
    [
      "FMA24486",
      "right",
      "FJ3381",
      "b513b8cb6b37e3eb4211fd35a4469efdf79de37887a0af8c582efc836a6f6307"
    ],
    [
      "FMA24487",
      "left",
      "FJ3275",
      "768362d04f0f91cea9a28f4aeae9d9f63f3c82450b68d185fa4afefe75d75cc1"
    ]
  ],
  [
    "lower-limb-bone-tibia",
    [
      "leg"
    ],
    [
      "FMA24477",
      "right",
      "FJ3387",
      "01879d7310938e82eecc02e1115332497e94085ff5cc1fa8eeee47ad1f5d3578"
    ],
    [
      "FMA24478",
      "left",
      "FJ3282",
      "40e55d7d28f060be61815603ee5eb1c0ba4c2e93af6fed6b5db7ca88d4ed82ef"
    ]
  ],
  [
    "lower-limb-bone-fibula",
    [
      "leg"
    ],
    [
      "FMA24480",
      "right",
      "FJ3366",
      "d03fee02cf8eefad1ecfcb9246e3f43ad3c4615c21ce08dc5e2b6901c6395a86"
    ],
    [
      "FMA24481",
      "left",
      "FJ3260",
      "b5fbb694e1d881033ec8318b97c41e9d9bedc89a8df9845573b1aac528829331"
    ]
  ],
  [
    "lower-limb-bone-talus",
    [
      "foot"
    ],
    [
      "FMA24482",
      "right",
      "FJ3385",
      "8b35f0132c1a05b64f26746fdd0496a2495280cd0c2ac90dbf637fd74f79f54f"
    ],
    [
      "FMA24483",
      "left",
      "FJ3280",
      "56b40cfe8944df25ebed250dbcc80794ee5435e6ab667edddabf4324553bdb3c"
    ]
  ],
  [
    "lower-limb-bone-calcaneus",
    [
      "foot"
    ],
    [
      "FMA24497",
      "right",
      "FJ3360",
      "b53e7970e822e997e1b05f94f42514d07a3f98edcc63ec7dd7219354ce1d8176"
    ],
    [
      "FMA24498",
      "left",
      "FJ3256",
      "5424e3e394e233213071fbf46f178ed9123da4763d6b64125f32e7b8af1803d8"
    ]
  ],
  [
    "lower-limb-bone-navicular",
    [
      "foot"
    ],
    [
      "FMA24500",
      "right",
      "FJ3308",
      "0e08f1570755a9675e2556013eda861f00f31fe7ae2139e24584129dfe78d2c2"
    ],
    [
      "FMA24501",
      "left",
      "FJ3307",
      "a9608a209e96492213275d1592554855a6acbf0d3a5ec8b05fb5fadfceb5df6c"
    ]
  ],
  [
    "lower-limb-bone-cuboid",
    [
      "foot"
    ],
    [
      "FMA24528",
      "right",
      "FJ3364",
      "d5ac55e9aa466b0e14d8d7760f7ef2a6edb0d95cfea56205557f647c451a8079"
    ],
    [
      "FMA24529",
      "left",
      "FJ3258",
      "1d9269949005e15c6a39fc30cbe5499468e99c074d5ccf48e1032c8689e12664"
    ]
  ]
];
const keys = expected.map(([key]) => key);
same(baseline.reasoningConcepts.length, 158);
same(api.reasoningConcepts.slice(0, 158), baseline.reasoningConcepts, 'Exact ordered old158 concepts preserved');
same(api.reasoningConcepts.length, 166);
same(api.reasoningConcepts.slice(158), api.lowerLimbBoneReasoningConcepts);
same(api.lowerLimbBoneReasoningConcepts.map(c => c.key), keys);
same(new Set(api.reasoningConcepts.map(c => c.key)).size, 166);
same(catalog.structures.filter(api.reasoningConceptFor).length, 308);
same(api.lowerLimbBoneReasoningSourceMatches(display.structures[0], 'unknown'), false);
const targets = [];
const referenceWords = {};
for (const [key, regions, ...bindings] of expected) {
  const concept = api.lowerLimbBoneReasoningConcepts.find(c => c.key === key);
  same(concept.region, regions[0]);
  same(concept.sourceTissue, 'bone');
  same(concept.sourceTree ?? 'isa', 'isa');
  same(concept.sourceRegions ?? [concept.region], regions);
  same(concept.readiness, 'draft');
  same(concept.revision, 1);
  same(concept.bindings.map(b => [b.fma, b.side, b.file]).sort(), bindings.map(b => b.slice(0, 3)).sort());
  same([...concept.distractors].sort(), keys.filter(k => k !== key && (keys.indexOf(k) < 4) === (keys.indexOf(key) < 4)).sort(), 'All other three alternatives in the authored four-bone group');
  check(concept.prompt.length > 40 && concept.explanation.length > 40);
  check(concept.references.length > 0);
  for (const reference of concept.references) {
    same(new URL(reference.url).protocol, 'https:');
    referenceWords[reference.url] = (referenceWords[reference.url] ?? 0) + (concept.prompt + ' ' + concept.explanation).split(/\s+/).length;
  }
  for (const [fma, side, file, sha256] of bindings) {
    same(officialRows.filter(row => row[0] === fma).map(row => row[2]), [file], 'Complete official ISA element membership');
    const source = catalog.structures.find(s => s.fmaId === fma);
    const target = display.structures.find(s => s.fmaId === fma);
    check(source && target, 'Existing source and display representations');
    targets.push(target);
    const bone = key.slice('lower-limb-bone-'.length);
    const suffix = bone === 'navicular' ? `navicular-bone-of-${side}-foot` : bone === 'cuboid' ? `${side}-cuboid-bone` : `${side}-${bone}`;
    const id = `vm:anatomy:body:${regions[0]}:${side}:bone:${suffix}`;
    same([source.id, source.nodeName, source.bundle, source.system, source.category, source.sourceTree, source.region, source.laterality],
      [id, fma, `${regions[0]}-skeleton`, 'skeleton', 'bone', 'isa', regions[0], side], 'Exact original ISA identity');
    same(source.regions, regions);
    same(source.sources.map(part => part.file), [file]);
    same(source.sources[0].sha256, sha256, 'Independent exact hash pin');
    same(api.reasoningConceptFor(source)?.key, key);
    same(api.reasoningConceptFor(target)?.key, key);
    same(api.lowerLimbBoneReasoningSourceMatches(source, key), true);
    same(api.lowerLimbBoneReasoningSourceMatches(target, key), true);
    same(api.lowerLimbBoneReasoningSourceMatches(target, keys.find(k => k !== key)), false, 'No pin accepted under another bone concept');
    same(api.reasoningConceptFor({ ...target, name: 'Changed display label', sourceName: 'Changed label' })?.key, key, 'Labels do not determine source binding');
    const mutations = [
      { id: target.id + '-changed' }, { fmaId: 'FMA0000' }, { nodeName: 'wrong-node' }, { bundle: 'wrong-bundle' },
      { laterality: side === 'right' ? 'left' : 'right' }, { system: 'muscles' }, { category: 'organ' }, { sourceTree: 'partof' },
      { region: regions[0] === 'foot' ? 'leg' : 'foot' }, { regions: [] }, { regions: ['spine'] },
      { regions: [...regions, 'spine'] }, { regions: [...regions, regions[0]] },
      { sources: [] }, { sources: [...target.sources, ...target.sources] },
      { sources: [{ ...target.sources[0], file: 'FJ0000' }] },
      { sources: [{ ...target.sources[0], sha256: '0'.repeat(64) }] },
      { sources: [{ file: target.sources[0].file }] },
    ];
    if (regions.length > 1) mutations.push({ regions: [...regions].reverse() }, { regions: [regions[0]] }, { regions: [regions[1]] });
    for (const mutation of mutations) {
      negativeSourceCases++;
      const changed = { ...target, ...mutation };
      same(api.reasoningConceptFor(changed), undefined, 'Changed bone source pin rejected');
      same(api.lowerLimbBoneReasoningSourceMatches(changed, key), false);
      same(create([changed, ...display.structures.filter(s => s.id !== target.id)], { retryIds: [changed.id] }), null, 'Rejected target cannot enter retry');
    }
    for (const region of [...regions, 'whole-body']) {
      if (region === 'thigh' || region === 'pelvis') {
        const scope = display.structures.filter(s => s.regions.includes(region));
        same(create(scope, { retryIds: [target.id] }), null, 'Femur has no authored bone alternatives in thigh/pelvis');
        continue;
      }
      regionalTargets++;
      const scope = display.structures.filter(s => region === 'whole-body' || s.regions.includes(region));
      const session = create(scope, { retryIds: [target.id] });
      same(session?.questions.length, 1, 'Every bilateral target playable in every supported region');
      const q = session.questions[0];
      const choices = 4;
      same(q.target, target.id);
      same(q.reasoning.key, key);
      same(q.choices.length, choices);
      same(new Set(q.choices).size, choices);
      for (const choiceId of q.choices) {
        const choice = scope.find(s => s.id === choiceId);
        check(choice, 'Choice belongs to visible scope');
        same(choice.laterality, side);
        check(choiceId === target.id || concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
      }
      same(create(scope, { retryIds: [target.id] }, loaded.filter(bundle => bundle !== target.bundle)), null, 'Unloaded target excluded');
      same(create(scope.filter(s => s.id !== target.id), { retryIds: [target.id] }), null, 'Hidden target excluded');
      same(create(scope, { sampling: 'focus', focusIds: [target.id], retryIds: [target.id] }), null, 'No single-answer focus question');
      same(create(scope, { sampling: 'focus', focusIds: q.choices, retryIds: [target.id] })?.questions[0].choices.length, choices);
      const wrongSide = scope.filter(s => s.id === target.id || s.laterality !== side);
      same(create(wrongSide, { retryIds: [target.id] }), null, 'Wrong-side alternatives excluded');
      same(create(scope, { sampling: 'focus', focusIds: wrongSide.map(s => s.id), retryIds: [target.id] }), null, 'Wrong-side focus alternatives excluded');
      const render = state => renderToStaticMarkup(createElement(api.ReasoningFeedback, { session: state }));
      same(render(session), '', 'Feedback and citations hidden before answer');
      same(api.practiceReducer(session, { type: 'answer', sessionId: session.id + 1, index: 0, chosen: target.id }), session);
      same(api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen: 'foreign-pick' }), session);
      const wrongChoice = q.choices.find(choiceId => choiceId !== target.id);
      for (const chosen of [target.id, wrongChoice]) {
        const answered = api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen });
        same(answered.responses.length, 1);
        same(api.practiceScore(answered), Number(chosen === target.id));
        const markup = render(answered);
        for (const reference of concept.references) check(markup.includes(reference.url), 'Actual SSR includes authored reference');
        check(markup.includes('review pending'), 'Draft review gate remains visible');
        check(markup.includes('Not') && markup.includes('validated assessment'));
        same(api.practiceReducer(answered, { type: 'answer', sessionId: session.id, index: 0, chosen: chosen === target.id ? wrongChoice : target.id }), answered, 'Answer once');
        const complete = api.practiceReducer(answered, { type: 'next', sessionId: session.id, index: 0 });
        same(complete.status, 'complete');
        const missed = api.missedPracticeIds(complete.responses);
        same(missed, chosen === target.id ? [] : [target.id]);
        const retry = create(scope, { retryIds: missed });
        same(retry?.questions.length ?? 0, chosen === target.id ? 0 : 1);
        if (retry) same(api.practiceReducer(complete, { type: 'start', session: retry }).questions[0].target, target.id);
      }
    }
    same(create([target], { retryIds: [target.id] }), null);
  }
}
same(targets.length, 16);
same(new Set(targets.map(s => s.id)).size, 16);
same(regionalTargets, 32, 'Each bilateral lower-limb target has a playable regional and whole-body scope');
for (const [key, , ...bindings] of expected) same(api.practiceQuestionCount(display.structures, 'reason', targets.filter(s => bindings.some(([fma]) => fma === s.fmaId)).map(s => s.id)), 1, `Contralateral retry deduplicates ${key}`);
same(create(targets, {}, []), null);
same(create(targets, { sampling: 'focus', focusIds: [] }), null);
same(create(targets, { retryIds: [] }), null);
same(create(targets, { retryIds: ['unknown'] }), null);
same(create(display.structures, { retryIds: targets.map(s => s.id) })?.questions.length, 8);
same(create(targets, { id: 111 }).questions, create(targets, { id: 111 }).questions, 'Deterministic question generation');
same(catalog.structures.filter(s => s.category === 'bone' && api.reasoningConceptFor(s)).length, 26, 'Ten historical and sixteen new bone bindings');
for (const region of ['leg', 'foot', 'whole-body']) {
  const bones = display.structures.filter(s => s.category === 'bone' && (region === 'whole-body' || s.regions.includes(region)));
  const session = create(bones);
  same(session.questions.length, region === 'whole-body' ? 13 : 4);
  for (const q of session.questions) same(q.choices.length, q.reasoning.key.startsWith('upper-limb-bone-') ? (region === 'whole-body' ? 5 : 3) : 4);
}
for (const words of Object.values(referenceWords)) check(words <= 200, 'At most 200 new words per reference');
same(hash(api.reasoningConcepts.slice(0, 158)), hash(baseline.reasoningConcepts), 'Runtime does not mutate old158 concepts');
console.log(JSON.stringify({ checks, negativeSourceCases, regionalTargets, concepts: 166, bindings: 308, addedConcepts: 8, addedBindings: 16, baselineHead, baseline158Hash: hash(baseline.reasoningConcepts), referenceWords, boundaries: 'Draft teaching only; no clinical, spatial, browser or deployment validation.' }, null, 2));
