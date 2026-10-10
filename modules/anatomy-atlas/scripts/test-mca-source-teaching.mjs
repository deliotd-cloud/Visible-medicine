import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const copy = value => JSON.parse(JSON.stringify(value));
const same = (actual, expected, reason) => assert.deepEqual(copy(actual), copy(expected), reason);
const study = 'cranial-artery-components';
const parentId = 'vm:anatomy:body:head-neck:right:vessel:right-middle-cerebral-artery';
const expected = new Map([
  ['fma50082-fj1662', 'mca-source-fj1662'],
  ['fma50082-fj1663', 'mca-source-fj1663'],
  ['fma50082-fj1692', 'mca-source-fj1692'],
]);
const baseline = 'bdc245713386d043aad45792a1476ab1af8955b0';
const entry = `export { bodyDisplayCatalog } from './lib/body-display-catalog';
 export { nestedStudyTargets, nestedPartsFor } from './lib/nested-anatomy';
 export { nestedTeachingFor, nestedTopicLesson, nestedTeachingReferences } from './lib/nested-teaching';
 export { nestedConcepts } from './content/nested-teaching';
 export { NestedTeaching } from './app/nested-teaching';`;

async function compiledApi(atBaseline = false) {
  // Replay the exact MCA admission epoch; the live PICA regression separately
  // proves every later source/teaching record, including these unchanged MCA files.
  const epoch=atBaseline?baseline:'55b0e548c6552de3ef6c4e8f432e71d60690e843';
  const replacements = ['lib/nested-teaching.ts', 'content/nested-teaching.ts'].map(path => ({
        path,
        source: execFileSync('git', ['show', `${epoch}:${path}`], { encoding: 'utf8' }),
      }));
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    plugins: replacements.length ? [{
      name: 'exact-baseline-teaching',
      setup(builder) {
        builder.onLoad({ filter: /[\\/](?:lib[\\/]nested-teaching|content[\\/]nested-teaching)\.ts$/, namespace: 'component-test' }, args => {
          const item = replacements.find(entry => args.path.replaceAll('\\', '/').endsWith(entry.path));
          return item ? { contents: item.source, loader: 'ts' } : undefined;
        });
      },
    }] : [],
  });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, URL, URLSearchParams,
  });
  return module.exports;
}

const api = await compiledApi();
const old = await compiledApi(true);
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const catalog = api.bodyDisplayCatalog(raw);
const parent = catalog.structures.find(item => item.id === parentId);
assert(parent && parent.fmaId === 'FMA50082' && parent.laterality === 'right');
const targets = api.nestedStudyTargets(catalog);
const oldTargets = old.nestedStudyTargets(old.bodyDisplayCatalog(raw));
same(targets, oldTargets, 'Navigation targets and source records stay byte-equivalent to baseline');
const cranial = targets.filter(item => item.study === study);
assert.equal(cranial.length, 29);
const mca = cranial.filter(item => item.parentId === parentId);
assert.equal(mca.length, 3);
const pica = cranial.filter(item => item.parentId !== parentId);
assert.equal(pica.length, 26);
same(mca.map(item => item.structure.sourceOrder), [1, 2, 3]);
assert.equal(new Set(mca.map(item => item.structure.sources[0].sha256)).size, 3);

let checks = 0;
for (const target of targets) {
  const actualParent = catalog.structures.find(item => item.id === target.parentId);
  const before = old.nestedTeachingFor(actualParent, target.study, target.structure);
  const now = api.nestedTeachingFor(actualParent, target.study, target.structure);
  if (mca.some(item => item.structureId === target.structureId && item.study === target.study)) {
    const suffix = target.structureId.split(':').at(-1);
    assert.equal(now?.id, expected.get(suffix), `Exact MCA source concept: ${suffix}`);
    assert.equal(before, null, 'MCA source part had no baseline teaching');
  } else {
    same(now, before, `Unchanged teaching for ${target.study}/${target.structureId}`);
    checks++;
  }
}
assert.equal(checks, targets.length - 3, 'Every other nested selection compared to exact baseline build');
for (const target of pica) {
  const actualParent = catalog.structures.find(item => item.id === target.parentId);
  assert.equal(api.nestedTeachingFor(actualParent, study, target.structure), null, 'PICA remains unavailable');
}

const refs = api.nestedTeachingReferences;
for (const target of mca) {
  const selected = target.structure;
  const concept = api.nestedTeachingFor(parent, study, selected);
  const id = expected.get(selected.id.split(':').at(-1));
  assert.equal(concept.id, id);
  same(concept.fmaIds, ['FMA50082']);
  assert.equal(concept.study, study);
  assert.equal(concept.quiz.basis, 'model-scope');
  same(concept.quiz.references, []);
  assert(concept.quiz.question.trim() && concept.quiz.answer.trim());
  assert(concept.modelLimit.includes('source') || concept.modelLimit.includes('Source'));
  for (const [topic, readiness] of Object.entries({
    anatomy: 'draft', function: 'pending', clinical: 'pending', pathology: 'pending',
    ct: 'draft', mri: 'draft', xray: 'pending', ultrasound: 'pending', quiz: 'draft',
  })) {
    const lesson = api.nestedTopicLesson(concept, topic);
    assert.equal(lesson.readiness, readiness, `${id}/${topic} readiness`);
    assert(lesson.body.trim(), `${id}/${topic} body`);
    if (['anatomy', 'ct', 'mri'].includes(topic)) {
      assert(lesson.citations?.length > 0, `${id}/${topic} citations`);
      for (const url of lesson.citations) assert.equal(new URL(url).protocol, 'https:');
    } else assert.equal(lesson.citations?.length ?? 0, 0, `${id}/${topic} has no borrowed references`);
  }
  assert(!concept.imaging?.xray && !concept.imaging?.ultrasound);
  for (const section of [...Object.values(concept.sections), ...Object.values(concept.imaging ?? {})]) {
    for (const key of section.references) assert(refs[key]?.title && refs[key]?.url, `${id}: valid ${key}`);
    if (section.readiness === 'pending') same(section.references, []);
  }

  const original = JSON.stringify(concept);
  concept.sections.anatomy.body = 'mutated';
  concept.quiz.answer = 'mutated';
  concept.imaging.ct.references.pop();
  assert.equal(JSON.stringify(api.nestedTeachingFor(parent, study, selected)), original, 'Returned lesson is detached');

  const mutations = [
    value => { value.name += ' changed'; },
    value => { value.laterality = 'left'; },
    value => { value.sources[0].sha256 = '0'.repeat(64); },
    value => { value.sources.push(copy(value.sources[0])); },
    value => { value.bounds.min[0] += 1; },
    value => { value.center[0] += 1; },
  ];
  for (const mutate of mutations) {
    const badParent = copy(parent); mutate(badParent);
    assert.equal(api.nestedTeachingFor(badParent, study, selected), null, 'Full parent mutation is denied');
    const badSelected = copy(selected); mutate(badSelected);
    assert.equal(api.nestedTeachingFor(parent, study, badSelected), null, 'Full selected record mutation is denied');
  }
  const badOrder = copy(selected); badOrder.sourceOrder += 1;
  assert.equal(api.nestedTeachingFor(parent, study, badOrder), null);
  for (const sibling of mca.filter(item => item.structureId !== selected.id)) {
    assert.equal(api.nestedTeachingFor(parent, study, { ...selected, id: sibling.structureId }), null, 'No sibling fallback');
  }
  assert.equal(api.nestedTeachingFor(parent, 'eye', selected), null, 'No study fallback');
  assert.equal(api.nestedTeachingFor(parent, study, parent), null, 'No parent lesson fallback');

  const props = { parent, study, selected, reviewAvailable: false };
  const html = renderToStaticMarkup(React.createElement(api.NestedTeaching, props));
  assert(html.includes('Teaching draft · specialist review pending'));
  assert(html.includes('Anatomy self-check'));
  assert(html.includes('Reveal answer'));
  assert(html.includes(api.nestedTopicLesson(api.nestedTeachingFor(parent, study, selected), 'anatomy').body));
  assert(html.includes(api.nestedTeachingFor(parent, study, selected).quiz.question));
  assert(html.includes(api.nestedTeachingFor(parent, study, selected).quiz.answer));
  assert(html.includes(selected.nodeName.slice(-6)), 'Rendered anatomy identifies matching source file');
  const tree = api.NestedTeaching(props);
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  assert(nodes(tree).filter(node => node.props?.children === 'Content pending').length >= 4,
    'Pending topics remain in the actual teaching component tree');
  for (const topic of ['ct', 'mri']) {
    const topicHtml = renderToStaticMarkup(React.createElement(api.NestedTeaching, { ...props, initialTopic: topic }));
    assert(topicHtml.includes(api.nestedTopicLesson(api.nestedTeachingFor(parent, study, selected), topic).body),
      `${id}/${topic} renders in the matching imaging topic`);
  }
  assert(!html.includes('Review this structure'), 'No approval UI without review availability');
}
assert.equal(new Set(mca.map(item => api.nestedTeachingFor(parent, study, item.structure).quiz.question)).size, 3, 'Distinct model-scope questions');
same(JSON.stringify(catalog), JSON.stringify(api.bodyDisplayCatalog(raw)), 'Teaching never changes catalog data');
console.log(JSON.stringify({ passed: true, newConcepts: 3, picaStillUnavailable: 26, otherSelectionsBaselineCompared: checks, sourceGuards: true, ssr: true, clinicalApproval: false, browserAcceptance: false }));
