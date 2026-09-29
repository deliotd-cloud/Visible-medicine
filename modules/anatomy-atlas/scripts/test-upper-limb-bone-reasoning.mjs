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
const baselineHead = '2bf25d326e6f3890a69a34673127a6e04ecae7aa';
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
export * from './lib/upper-limb-bone-reasoning';
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
const expected = [
  ['upper-limb-bone-clavicle', ['shoulder-arm'], ['FMA13322', 'right', 'FJ3362'], ['FMA13323', 'left', 'FJ3237']],
  ['upper-limb-bone-scapula', ['shoulder-arm'], ['FMA13395', 'right', 'FJ3384'], ['FMA13396', 'left', 'FJ3279']],
  ['upper-limb-bone-humerus', ['shoulder-arm', 'forearm'], ['FMA23130', 'right', 'FJ3368'], ['FMA23131', 'left', 'FJ3262']],
  ['upper-limb-bone-radius', ['forearm'], ['FMA23464', 'right', 'FJ3349'], ['FMA23465', 'left', 'FJ3277']],
  ['upper-limb-bone-ulna', ['forearm'], ['FMA23467', 'right', 'FJ3391'], ['FMA23468', 'left', 'FJ3286']],
];
const keys = expected.map(([key]) => key);
same(baseline.reasoningConcepts.length, 153);
same(api.reasoningConcepts.slice(0, 153), baseline.reasoningConcepts, 'Exact ordered old153 concepts preserved');
same(api.reasoningConcepts.length, 158);
same(api.reasoningConcepts.slice(153), api.upperLimbBoneReasoningConcepts);
same(api.upperLimbBoneReasoningConcepts.map(c => c.key), keys);
same(new Set(api.reasoningConcepts.map(c => c.key)).size, 158);
same(catalog.structures.filter(api.reasoningConceptFor).length, 292);
same(catalog.structures.filter(s => s.region === 'shoulder-arm' && api.reasoningConceptFor(s)).length, 46);
same(catalog.structures.filter(s => s.region === 'forearm' && api.reasoningConceptFor(s)).length, 22);
same(api.upperLimbBoneReasoningSourceMatches(display.structures[0], 'unknown'), false);
const targets = [];
const referenceWords = {};
for (const [key, regions, ...bindings] of expected) {
  const concept = api.upperLimbBoneReasoningConcepts.find(c => c.key === key);
  same(concept.region, regions[0]);
  same(concept.sourceTissue, 'bone');
  same(concept.sourceTree ?? 'isa', 'isa');
  same(concept.sourceRegions ?? [concept.region], regions);
  same(concept.readiness, 'draft');
  same(concept.revision, 1);
  same(concept.bindings.map(b => [b.fma, b.side, b.file]), bindings);
  same([...concept.distractors].sort(), keys.filter(k => k !== key).sort(), 'All other four authored bone alternatives');
  check(concept.prompt.length > 40 && concept.explanation.length > 40);
  check(concept.references.length > 0);
  for (const reference of concept.references) {
    same(new URL(reference.url).protocol, 'https:');
    referenceWords[reference.url] = (referenceWords[reference.url] ?? 0) + (concept.prompt + ' ' + concept.explanation).split(/\s+/).length;
  }
  for (const [fma, side, file] of bindings) {
    same(officialRows.filter(row => row[0] === fma).map(row => row[2]), [file], 'Complete official ISA element membership');
    const source = catalog.structures.find(s => s.fmaId === fma);
    const target = display.structures.find(s => s.fmaId === fma);
    check(source && target, 'Existing source and display representations');
    targets.push(target);
    const bone = key.slice('upper-limb-bone-'.length);
    const id = side === 'right' && regions[0] === 'shoulder-arm'
      ? `vm:anatomy:upper-limb:shoulder:right:bone:${bone}`
      : `vm:anatomy:body:${regions[0]}:${side}:bone:${side}-${bone}`;
    same([source.id, source.nodeName, source.bundle, source.system, source.category, source.sourceTree, source.region, source.laterality],
      [id, fma, `${regions[0]}-skeleton`, 'skeleton', 'bone', 'isa', regions[0], side], 'Exact identities include legacy right shoulder IDs');
    same(source.regions, regions);
    same(source.sources.map(part => part.file), [file]);
    check(/^[a-f0-9]{64}$/.test(source.sources[0].sha256));
    same(api.reasoningConceptFor(source)?.key, key);
    same(api.reasoningConceptFor(target)?.key, key);
    same(api.upperLimbBoneReasoningSourceMatches(source, key), true);
    same(api.upperLimbBoneReasoningSourceMatches(target, key), true);
    same(api.upperLimbBoneReasoningSourceMatches(target, keys.find(k => k !== key)), false, 'No pin accepted under another bone concept');
    same(api.reasoningConceptFor({ ...target, name: 'Changed display label', sourceName: 'Changed label' })?.key, key, 'Labels do not determine source binding');
    const mutations = [
      { id: target.id + '-changed' }, { fmaId: 'FMA0000' }, { nodeName: 'wrong-node' }, { bundle: 'wrong-bundle' },
      { laterality: side === 'right' ? 'left' : 'right' }, { system: 'muscles' }, { category: 'organ' }, { sourceTree: 'partof' },
      { region: regions[0] === 'forearm' ? 'shoulder-arm' : 'forearm' }, { regions: [] }, { regions: ['spine'] },
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
      same(api.upperLimbBoneReasoningSourceMatches(changed, key), false);
      same(create([changed, ...display.structures.filter(s => s.id !== target.id)], { retryIds: [changed.id] }), null, 'Rejected target cannot enter retry');
    }
    for (const region of [...regions, 'whole-body']) {
      regionalTargets++;
      const scope = display.structures.filter(s => region === 'whole-body' || s.regions.includes(region));
      const session = create(scope, { retryIds: [target.id] });
      same(session?.questions.length, 1, 'Every bilateral target playable in every supported region');
      const q = session.questions[0];
      const choices = region === 'whole-body' ? 5 : 3;
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
same(targets.length, 10);
same(new Set(targets.map(s => s.id)).size, 10);
same(regionalTargets, 22, 'Humeri exercise both regional memberships and whole-body');
for (const [key, , ...bindings] of expected) same(api.practiceQuestionCount(display.structures, 'reason', targets.filter(s => bindings.some(([fma]) => fma === s.fmaId)).map(s => s.id)), 1, `Contralateral retry deduplicates ${key}`);
same(create(targets, {}, []), null);
same(create(targets, { sampling: 'focus', focusIds: [] }), null);
same(create(targets, { retryIds: [] }), null);
same(create(targets, { retryIds: ['unknown'] }), null);
same(create(display.structures, { retryIds: targets.map(s => s.id) })?.questions.length, 5);
same(create(targets, { id: 111 }).questions, create(targets, { id: 111 }).questions, 'Deterministic question generation');
same(catalog.structures.filter(s => s.category === 'bone' && api.reasoningConceptFor(s)).map(s => s.fmaId).sort(), targets.map(s => s.fmaId).sort(), 'Only ten authored bones admitted');
for (const words of Object.values(referenceWords)) check(words <= 200, 'At most 200 new words per reference');
same(hash(api.reasoningConcepts.slice(0, 153)), hash(baseline.reasoningConcepts), 'Runtime does not mutate old153 concepts');
console.log(JSON.stringify({ checks, negativeSourceCases, regionalTargets, concepts: 158, bindings: 292, addedConcepts: 5, addedBindings: 10, baselineHead, baseline153Hash: hash(baseline.reasoningConcepts), referenceWords, boundaries: 'Draft teaching only; no clinical, spatial, browser or deployment validation.' }, null, 2));
