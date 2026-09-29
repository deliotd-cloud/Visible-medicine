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
async function load(contents, resolveDir = fileURLToPath(root)) {
  const result = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { require, module, exports: module.exports });
  return module.exports;
}
const api = await load(`export * from './lib/reasoning-questions';
export * from './lib/atlas-practice';
export * from './lib/thoracic-vessel-reasoning';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ReasoningFeedback } from './app/reasoning-feedback';`);
// Capture the baseline from Git rather than trusting the edited live definitions.
// Imported historical modules must also still be identical to this source head.
const baselineSource = execFileSync('git', ['show', 'af56c6a:lib/reasoning-questions.ts'], { cwd: fileURLToPath(root), encoding: 'utf8' });
for (const [, relative] of baselineSource.matchAll(/from '([^']+reasoning)'/g)) {
  const path = `lib/${relative.slice(2)}.ts`;
  assert.equal(await readFile(new URL(path, root), 'utf8'), execFileSync('git', ['show', `af56c6a:${path}`], { cwd: fileURLToPath(root), encoding: 'utf8' }));
}
const baseline = await load(baselineSource, fileURLToPath(new URL('lib/', root)));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
let checks = 0;
const same = (actual, expected, message) => { checks++; assert.deepEqual(structuredClone(actual), structuredClone(expected), message); };
const check = (value, message) => { checks++; assert(value, message); };
same(baseline.reasoningConcepts.length, 140);
same(hash(baseline.reasoningConcepts), '2b5f7d7e84abdb80f494c0e0a6d3b371e8cb122abf46b9da69b8d555a9eebe66');
same(api.reasoningConcepts.slice(0, 140), baseline.reasoningConcepts, 'Exact ordered old140 records preserved');
same(api.reasoningConcepts.length, 158);
const catalog = JSON.parse(await readFile(new URL('public/models/bodyparts3d/full-body/catalog.json', root), 'utf8'));
const all = catalog.structures;
same(all.filter(api.reasoningConceptFor).length, 292);
const display = api.bodyDisplayCatalog(catalog);
const loaded = display.bundles.map(b => b.id);
const expected = ['FMA3736', 'FMA3768', 'FMA87217', 'FMA4720', 'FMA4838', 'FMA4944'];
const six = expected.map(fma => display.structures.find(s => s.fmaId === fma));
const concepts = api.reasoningConcepts.slice(140, 146);
same(concepts.map(c => c.key), ['thoracic-ascending-aorta', 'thoracic-aortic-arch', 'thoracic-descending-aorta', 'thoracic-superior-vena-cava', 'thoracic-azygos', 'thoracic-hemiazygos']);
let serial = 0, negatives = 0;
const create = (scope = six, extra = {}, bundles = loaded, random = () => 0.314159) => api.createPracticeSession(scope, bundles, { id: ++serial, mode: 'reason', sampling: 'all', count: 20, ...extra }, random);
const words = {};
for (const target of six) {
  check(target);
  const c = api.reasoningConceptFor(target);
  same(c.sourceTissue, 'vessel');
  same(c.readiness, 'draft');
  same(c.revision, 1);
  same(c.bindings.length, 1);
  same(c.bindings[0].side, target.laterality);
  same(c.distractors.length, 3);
  same(new Set(c.distractors).size, 3);
  same(c.distractors.filter(key => concepts.find(other => other.key === key).bindings[0].side === target.laterality).length, 2);
  check(c.explanation.includes('does not prove lumen continuity or patency'));
  const url = c.references[0].url;
  check(['https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html', 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html'].includes(url));
  words[url] = (words[url] ?? 0) + (c.prompt + ' ' + c.explanation).split(/\s+/).length;
  same(api.reasoningConceptFor({ ...target, name: 'Display label changed', sourceName: 'Display label changed' })?.key, c.key);
  for (const mutation of [
    { id: target.id + '-changed' }, { fmaId: 'FMA0000' }, { nodeName: 'wrong-node' },
    { bundle: 'wrong-bundle' }, { laterality: target.laterality === 'midline' ? 'unspecified' : 'midline' },
    { system: 'muscles' }, { category: 'organ' }, { sourceTree: 'partof' },
    { region: 'abdomen' }, { regions: [] }, { regions: ['thorax', 'abdomen'] },
    { regions: ['abdomen', 'thorax'] }, { regions: ['thorax', 'thorax'] },
    { sources: [] }, { sources: [...target.sources, ...target.sources] },
    { sources: [{ ...target.sources[0], file: 'FJ0000' }] },
    { sources: [{ ...target.sources[0], sha256: '0'.repeat(64) }] },
  ]) {
    negatives++;
    same(api.reasoningConceptFor({ ...target, ...mutation }), undefined, 'Altered vessel pin rejected');
    same(api.thoracicVesselReasoningSourceMatches({ ...target, ...mutation }, c.key), false);
  }
  for (const region of ['thorax', 'whole-body']) {
    const scope = display.structures.filter(s => region === 'whole-body' || s.regions.includes(region));
    const session = create(scope, { retryIds: [target.id] });
    same(session?.questions.length, 1);
    const q = session.questions[0];
    same(q.target, target.id);
    same(q.choices.length, 3);
    same(new Set(q.choices).size, 3);
    for (const id of q.choices) {
      const choice = scope.find(s => s.id === id);
      same(choice.laterality, target.laterality);
      check(id === target.id || c.distractors.includes(api.reasoningConceptFor(choice)?.key));
    }
    same(create(scope, { sampling: 'focus', focusIds: q.choices, retryIds: [target.id] })?.questions[0].choices.length, 3);
    same(create(scope, { sampling: 'focus', focusIds: [target.id] }), null);
    same(create(scope.filter(s => s.id !== target.id), { retryIds: [target.id] }), null);
    same(create(scope, { retryIds: [target.id] }, loaded.filter(id => id !== target.bundle)), null);
  }
  const partner = six.find(s => s.id !== target.id && s.laterality === target.laterality);
  const pair = [target, partner];
  same(create(pair)?.questions.length, 2);
  same(create(pair)?.questions.every(q => q.choices.length === 2), true);
  same(create(display.structures, { sampling: 'focus', focusIds: pair.map(s => s.id), retryIds: [target.id] })?.questions[0].choices.length, 2);
  same(api.practiceCanStart([target], 'reason'), false);
  same(create([target]), null);
  same(create([target], { retryIds: [target.id] }), null);
  const session = create(six, { retryIds: [target.id] });
  const render = state => renderToStaticMarkup(createElement(api.ReasoningFeedback, { session: state }));
  same(render(session), '', 'No explanation or citations before answer');
  same(api.practiceReducer(session, { type: 'answer', sessionId: session.id + 1, index: 0, chosen: target.id }), session);
  same(api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen: 'foreign-pick' }), session);
  for (const chosen of [target.id, partner.id]) {
    const answered = api.practiceReducer(session, { type: 'answer', sessionId: session.id, index: 0, chosen });
    same(answered.responses.length, 1);
    same(api.practiceScore(answered), Number(chosen === target.id));
    check(render(answered).includes(url), 'Actual SSR includes attributed source after answer');
    check(render(answered).includes('patency'));
    check(render(answered).includes('review pending'));
    same(api.practiceReducer(answered, { type: 'answer', sessionId: session.id, index: 0, chosen }), answered, 'Answer once');
    const complete = api.practiceReducer(answered, { type: 'next', sessionId: session.id, index: 0 });
    same(complete.status, 'complete');
    const missed = api.missedPracticeIds(complete.responses);
    same(missed, chosen === target.id ? [] : [target.id]);
    const retry = create(six, { retryIds: missed });
    same(retry?.questions.length ?? 0, chosen === target.id ? 0 : 1);
    if (retry) same(api.practiceReducer(complete, { type: 'start', session: retry }).questions[0].target, target.id);
  }
}
same(create()?.questions.length, 6);
same(create()?.questions.every(q => q.choices.length === 3), true);
same(create(six, {}, []), null);
same(create(six, { sampling: 'focus', focusIds: [] }), null);
same(create(six, { retryIds: [] }), null);
same(create(six, { retryIds: ['unknown'] }), null);
same(create(six, { id: 111 }).questions, create(six, { id: 111 }).questions, 'Deterministic random produces identical questions');
for (const value of [NaN, Infinity, -Infinity, -1, 0, 1, 20]) same(create(six, {}, loaded, () => value)?.questions.length, 6);
for (const count of Object.values(words)) check(count < 180, 'Each table contributes fewer than180 words across its three questions');
same(all.filter(s => s.system === 'vessels' && api.reasoningConceptFor(s)).map(s => s.fmaId).sort(), [...expected].sort(), 'No broad vessel admission');
same(hash(api.reasoningConcepts.slice(0, 140)), hash(baseline.reasoningConcepts));
console.log(JSON.stringify({ checks, negativeSourceCases: negatives, concepts: api.reasoningConcepts.length, bindings: all.filter(api.reasoningConceptFor).length, baseline140Hash: hash(baseline.reasoningConcepts), referenceWords: words, boundaries: 'Draft teaching only; no browser, spatial, clinical, or deployment validation.' }, null, 2));
