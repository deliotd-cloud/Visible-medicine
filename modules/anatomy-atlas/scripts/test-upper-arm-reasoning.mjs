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
const baselineHead = '08ef3834b790763917fd45ad5a3e404da3cdf2f0';
const read = path => readFile(new URL(path, root), 'utf8');
const gitSource = path => execFileSync('git', ['show', `${baselineHead}:${path}`], { cwd: fileURLToPath(root), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function load(contents, resolveDir = fileURLToPath(root)) {
  const result = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { require, module, exports: module.exports });
  return module.exports;
}
let checks = 0, serial = 0, negativeSourceCases = 0;
const same = (actual, expected, message) => { checks++; assert.deepEqual(structuredClone(actual), structuredClone(expected), message); };
const check = (value, message) => { checks++; assert(value, message); };
const baselineSource = gitSource('lib/reasoning-questions.ts');
// Historical source imports resolve to the live lib directory, so verify each
// imported question module against Git before using it as baseline evidence.
for (const [, relative] of baselineSource.matchAll(/from '([^']+reasoning)'/g)) {
  const path = `lib/${relative.slice(2)}.ts`;
  same(await read(path), gitSource(path), `Historical imported module unchanged: ${path}`);
}
const baseline = await load(baselineSource, fileURLToPath(new URL('lib/', root)));
const api = await load(`export * from './lib/reasoning-questions';
export * from './lib/upper-arm-reasoning';
export * from './lib/atlas-practice';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ReasoningFeedback } from './app/reasoning-feedback';`);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
same(await read(catalogPath), gitSource(catalogPath), 'Question authoring does not alter source catalogue');
const catalog = JSON.parse(await read(catalogPath));
const officialRows = (await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).slice(1).map(line => line.split('\t'));
const display = api.bodyDisplayCatalog(catalog);
const loaded = display.bundles.map(bundle => bundle.id);
const create = (scope = display.structures, extra = {}, bundles = loaded, random = () => 0.314159) => api.createPracticeSession(scope, bundles, { id: ++serial, mode: 'reason', sampling: 'all', count: 20, ...extra }, random);
const expected = [
  ['upper-arm-anconeus', ['FMA37705', 'right', 'FJ1485'], ['FMA37706', 'left', 'FJ1485M']],
  ['upper-arm-biceps-short', ['FMA37684', 'right', 'FJ1512'], ['FMA37685', 'left', 'FJ1512M']],
  ['upper-arm-triceps-medial', ['FMA37695', 'right', 'FJ1480'], ['FMA37696', 'left', 'FJ1480M']],
  ['upper-arm-triceps-lateral', ['FMA37697', 'right', 'FJ1477'], ['FMA37698', 'left', 'FJ1477M']],
  ['upper-arm-levator-scapulae', ['FMA32540', 'right', 'FJ1532'], ['FMA32541', 'left', 'FJ1532M']],
  ['upper-arm-rhomboid-major', ['FMA13381', 'right', 'FJ1536'], ['FMA13382', 'left', 'FJ1536M']],
  ['upper-arm-rhomboid-minor', ['FMA13383', 'right', 'FJ1537'], ['FMA13384', 'left', 'FJ1537M']],
];
same(baseline.reasoningConcepts.length, 146);
same(api.reasoningConcepts.slice(0, 146), baseline.reasoningConcepts, 'Exact ordered old146 concepts preserved');
same(api.reasoningConcepts.length, 158);
same(api.reasoningConcepts.slice(146,153), api.upperArmReasoningConcepts);
same(api.upperArmReasoningConcepts.map(c => c.key), expected.map(([key]) => key));
same(new Set(api.reasoningConcepts.map(c => c.key)).size, 158);
same(catalog.structures.filter(api.reasoningConceptFor).length, 292);
same(catalog.structures.filter(s => s.region === 'shoulder-arm' && api.reasoningConceptFor(s)).length, 46);
const targets = [];
const referenceWords = {};
for (const [key, ...bindings] of expected) {
  const concept = api.upperArmReasoningConcepts.find(c => c.key === key);
  same(concept.region, 'shoulder-arm');
  same(concept.sourceTissue, undefined, 'Existing default muscle source contract retained');
  same(concept.sourceTree ?? 'isa', 'isa');
  same(concept.sourceRegions ?? [concept.region], ['shoulder-arm']);
  same(concept.readiness, 'draft');
  same(concept.revision, 1);
  same(concept.bindings.map(b => [b.fma, b.side, b.file]), bindings);
  same(new Set(concept.distractors).size, 3);
  check(!concept.distractors.includes(key));
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
    check(source && target, 'Existing source and runtime display representations');
    targets.push(target);
    same([source.system, source.category, source.sourceTree, source.region, source.laterality], ['muscles', 'muscle', 'isa', 'shoulder-arm', side]);
    same(source.regions, ['shoulder-arm']);
    same(source.sources.map(part => part.file), [file]);
    same(api.reasoningConceptFor(source)?.key, key);
    same(api.reasoningConceptFor(target)?.key, key);
    same(api.reasoningConceptFor({ ...target, name: 'Changed display label', sourceName: 'Changed label' })?.key, key, 'Display names do not determine source binding');
    for (const mutation of [
      { fmaId: 'FMA0000' }, { laterality: side === 'right' ? 'left' : 'right' },
      { system: 'organs' }, { category: 'organ' }, { sourceTree: 'partof' },
      { region: 'forearm' }, { regions: [] }, { regions: ['forearm'] },
      { regions: ['shoulder-arm', 'spine'] }, { regions: ['shoulder-arm', 'shoulder-arm'] },
      { sources: [] }, { sources: [...target.sources, ...target.sources] },
      { sources: [{ ...target.sources[0], file: 'FJ0000' }] },
    ]) {
      negativeSourceCases++;
      const changed = { ...target, ...mutation };
      same(api.reasoningConceptFor(changed), undefined, 'Changed muscle identity/source/scope rejected');
      same(create([changed, ...display.structures.filter(s => s.id !== target.id)], { retryIds: [target.id] }), null, 'Rejected target cannot enter a retry');
    }
    for (const region of ['shoulder-arm', 'whole-body']) {
      const scope = display.structures.filter(s => region === 'whole-body' || s.regions.includes(region));
      const session = create(scope, { retryIds: [target.id] });
      same(session?.questions.length, 1, 'Every bilateral binding playable in each requested scope');
      const q = session.questions[0];
      same(q.target, target.id);
      same(q.reasoning.key, key);
      same(q.choices.length, 4, 'All three curated alternatives available');
      same(new Set(q.choices).size, 4);
      for (const id of q.choices) {
        const choice = scope.find(s => s.id === id);
        check(choice, 'Choice belongs to visible scope');
        same(choice.laterality, side);
        check(id === target.id || concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
      }
      same(create(scope, { retryIds: [target.id] }, loaded.filter(id => id !== target.bundle)), null, 'Unloaded target excluded');
      same(create(scope.filter(s => s.id !== target.id), { retryIds: [target.id] }), null, 'Hidden target excluded');
      same(create(scope, { sampling: 'focus', focusIds: [target.id], retryIds: [target.id] }), null, 'No single-answer focus question');
      same(create(scope, { sampling: 'focus', focusIds: q.choices, retryIds: [target.id] })?.questions[0].choices.length, 4);
      const wrongSideChoices = scope.filter(s => s.id === target.id || s.laterality !== side);
      same(create(wrongSideChoices, { retryIds: [target.id] }), null, 'Opposite-side alternatives cannot make target eligible');
      const render = state => renderToStaticMarkup(createElement(api.ReasoningFeedback, { session: state }));
      same(render(session), '', 'Explanation and citations hidden before answering');
      same(api.practiceReducer(session, { type: 'answer', sessionId: session.id + 1, index: 0, chosen: target.id }), session);
      same(api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen: 'foreign-pick' }), session);
      const wrongChoice = q.choices.find(id => id !== target.id);
      for (const chosen of [target.id, wrongChoice]) {
        const answered = api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen });
        same(answered.responses.length, 1);
        same(api.practiceScore(answered), Number(chosen === target.id));
        const markup = render(answered);
        for (const reference of concept.references) check(markup.includes(reference.url), 'Actual feedback supplies authored citation');
        check(markup.includes('review pending'), 'Draft radiologist/educator gate remains visible');
        check(markup.includes('Not') && markup.includes('validated assessment'));
        same(api.practiceReducer(answered, { type: 'answer', sessionId: session.id, index: 0, chosen: chosen === target.id ? wrongChoice : target.id }), answered, 'Second answer cannot replace first');
        const complete = api.practiceReducer(answered, { type: 'next', sessionId: session.id, index: 0 });
        same(complete.status, 'complete');
        same(api.missedPracticeIds(complete.responses), chosen === target.id ? [] : [target.id]);
      }
    }
    same(create([target], { retryIds: [target.id] }), null);
  }
}
same(targets.length, 14);
same(new Set(targets.map(s => s.id)).size, 14);
for (const [key, ...bindings] of expected) {
  same(api.practiceQuestionCount(display.structures, 'reason', targets.filter(s => bindings.some(([fma]) => fma === s.fmaId)).map(s => s.id)), 1, `Contralateral retry deduplicates ${key}`);
}
same(create(targets, {}, []), null, 'Unloaded new-only scope excluded');
same(create(display.structures, { retryIds: targets.map(s => s.id) })?.questions.length, 7, 'All fourteen targets provide seven concept questions');
for (const words of Object.values(referenceWords)) check(words <= 200, 'Each reference contributes at most 200 words across the seven concepts');
same(hash(api.reasoningConcepts.slice(0, 146)), hash(baseline.reasoningConcepts), 'Runtime checks do not mutate baseline concepts');
console.log(JSON.stringify({ checks, negativeSourceCases, concepts: api.reasoningConcepts.length, bindings: catalog.structures.filter(api.reasoningConceptFor).length, addedConcepts: 7, addedBindings: 14, baselineHead, baseline146Hash: hash(baseline.reasoningConcepts), referenceWords, boundaries: 'Draft teaching only; no clinical, spatial, browser or deployment validation.' }, null, 2));
