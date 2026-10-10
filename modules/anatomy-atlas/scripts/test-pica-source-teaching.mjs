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
const baseline = '55b0e548c6552de3ef6c4e8f432e71d60690e843';
const study = 'cranial-artery-components';
const parents = new Map([
  ['right', { id: 'vm:anatomy:body:head-neck:right:vessel:right-posterior-inferior-cerebellar-artery', fma: 'FMA50519' }],
  ['left', { id: 'vm:anatomy:body:head-neck:left:vessel:left-posterior-inferior-cerebellar-artery', fma: 'FMA50520' }],
]);
const files = [...Array.from({ length: 12 }, (_, index) => `FJ${1700 + index}`), 'FJ1715'];
const expected = new Map([...parents].flatMap(([side, parent]) => files.map((file, index) => {
  const supplied = side === 'left' ? `${file}M` : file;
  return [`${parent.fma.toLowerCase()}-${supplied.toLowerCase()}`,
    { side, file: supplied, order: index + 1, conceptId: `pica-source-${supplied.toLowerCase()}` }];
})));
const entry = `export { bodyDisplayCatalog } from './lib/body-display-catalog';
 export { nestedStudyTargets, nestedPartsFor } from './lib/nested-anatomy';
 export { nestedTeachingFor, nestedTopicLesson, nestedTeachingReferences } from './lib/nested-teaching';
 export { nestedConcepts } from './content/nested-teaching';
 export { picaSourceConcepts, picaSourceTeachingReferences } from './content/pica-source-teaching';
 export { NestedTeaching } from './app/nested-teaching';`;

async function compiledApi(atBaseline = false) {
  const replacements = atBaseline
    ? ['lib/nested-teaching.ts', 'content/nested-teaching.ts'].map(path => ({
        path,
        source: execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' }),
      }))
    : [];
  const result = await build({
    stdin: { contents: atBaseline ? entry.replace(
      " export { picaSourceConcepts, picaSourceTeachingReferences } from './content/pica-source-teaching';", '',
    ) : entry, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: replacements.length ? [{
      name: 'immutable-pre-pica-teaching',
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
const pins = JSON.parse(await readFile('content/pica-source-teaching-bindings.v1.json', 'utf8'));
const catalog = api.bodyDisplayCatalog(raw);
const oldCatalog = old.bodyDisplayCatalog(raw);
const targets = api.nestedStudyTargets(catalog);
same(targets, old.nestedStudyTargets(oldCatalog), 'All source/navigation records match the immutable baseline');
assert.equal(targets.length, 108);
const pica = targets.filter(target => target.study === study && [...parents.values()].some(parent => parent.id === target.parentId));
assert.equal(pica.length, 26);
assert.equal(expected.size, 26);
same(pica.map(target => target.structure.id.split(':').at(-1)).sort(), [...expected.keys()].sort(),
  'Exactly the supplied 26 PICA files');
assert.equal(api.picaSourceConcepts.length, 26, 'Exactly 26 authored PICA concepts');
same(api.picaSourceConcepts.map(concept => concept.id).sort(),
  [...expected.values()].map(value => value.conceptId).sort(), 'No omitted or extra PICA concepts');
assert.equal(pins.schemaVersion, 1);
assert.equal(pins.parents.length, 2);
assert.equal(pins.bindings.length, 26);
same(pins.bindings.map(binding => binding.structure.id).sort(), pica.map(target => target.structureId).sort(),
  'Pins cover each PICA selection once');
for (const [side, info] of parents) {
  const parent = catalog.structures.find(item => item.id === info.id);
  assert(parent && parent.fmaId === info.fma && parent.laterality === side);
  same(pins.parents.find(item => item.id === info.id), parent, `${side} full parent pin`);
}

let unchanged = 0;
for (const target of targets) {
  const parent = catalog.structures.find(item => item.id === target.parentId);
  const now = api.nestedTeachingFor(parent, target.study, target.structure);
  const before = old.nestedTeachingFor(oldCatalog.structures.find(item => item.id === target.parentId), target.study, target.structure);
  if (pica.some(item => item.structureId === target.structureId)) {
    assert.equal(before, null, 'PICA part had no teaching at baseline');
    const identity = expected.get(target.structure.id.split(':').at(-1));
    assert.equal(now?.id, identity.conceptId, `Source-specific PICA lesson for ${identity.file}`);
  } else {
    same(now, before, `Other nested teaching unchanged: ${target.study}/${target.structureId}`);
    unchanged++;
  }
}
assert.equal(unchanged, 82, 'All 82 other nested lessons match baseline');

for (const target of pica) {
  const selected = target.structure;
  const identity = expected.get(selected.id.split(':').at(-1));
  const { side, file, order, conceptId } = identity;
  const parent = catalog.structures.find(item => item.id === target.parentId);
  assert.equal(target.parentId, parents.get(side).id);
  assert.equal(selected.fmaId, parents.get(side).fma);
  assert.equal(selected.parentFmaId, parents.get(side).fma);
  assert.equal(selected.parentId, parent.id);
  assert.equal(selected.laterality, side);
  assert.equal(selected.sourceOrder, order);
  assert.equal(selected.sourcePartCount, 13);
  assert.equal(selected.role, 'source-part');
  assert.equal(selected.sources.length, 1);
  assert.equal(selected.sources[0].file, file);
  assert.match(selected.sources[0].sha256, /^[a-f0-9]{64}$/);
  const binding = pins.bindings.find(item => item.structure.id === selected.id);
  assert.equal(binding.conceptId, conceptId);
  assert.equal(binding.study, study);
  assert.equal(binding.parentId, parent.id);
  assert.equal(binding.parentHash, target.parentHash);
  assert.equal(binding.sourceHash, target.sourceHash);
  same(binding.structure, selected, `Full ${file} source record pin`);

  const concept = api.nestedTeachingFor(parent, study, selected);
  assert.equal(concept.id, conceptId);
  same(concept.fmaIds, [parent.fmaId]);
  assert.equal(concept.study, study);
  assert.equal(concept.quiz.basis, 'model-scope');
  same(concept.quiz.references, []);
  assert(concept.quiz.question.trim() && concept.quiz.answer.trim());
  assert.match(concept.modelLimit, /source/i);
  for (const [topic, readiness] of Object.entries({
    anatomy: 'draft', function: 'pending', clinical: 'pending', pathology: 'pending',
    ct: 'draft', mri: 'draft', xray: 'pending', ultrasound: 'pending', quiz: 'draft',
  })) {
    const lesson = api.nestedTopicLesson(concept, topic);
    assert.equal(lesson.readiness, readiness, `${file}/${topic} readiness`);
    assert(lesson.body.trim(), `${file}/${topic} body`);
    if (['anatomy', 'ct', 'mri'].includes(topic)) {
      assert(lesson.citations?.length > 0, `${file}/${topic} cited`);
      for (const url of lesson.citations) assert.equal(new URL(url).protocol, 'https:');
    } else assert.equal(lesson.citations?.length ?? 0, 0, `${file}/${topic} has no borrowed citations`);
  }
  assert(!concept.imaging?.xray && !concept.imaging?.ultrasound);
  for (const section of [...Object.values(concept.sections), ...Object.values(concept.imaging ?? {})]) {
    for (const key of section.references) {
      const reference = api.picaSourceTeachingReferences[key];
      same(api.nestedTeachingReferences[key], reference, `${file}: original PICA reference ${key}`);
      assert(reference?.title && new URL(reference.url).protocol === 'https:');
    }
    if (section.readiness === 'pending') same(section.references, []);
  }

  const original = JSON.stringify(concept);
  concept.sections.anatomy.body = 'mutated';
  concept.quiz.answer = 'mutated';
  concept.imaging.ct.references.pop();
  assert.equal(JSON.stringify(api.nestedTeachingFor(parent, study, selected)), original, 'Returned lesson is detached');

  for (const mutate of [
    value => { value.name += ' changed'; },
    value => { value.laterality = side === 'right' ? 'left' : 'right'; },
    value => { value.sources[0].sha256 = '0'.repeat(64); },
    value => { value.sources.push(copy(value.sources[0])); },
    value => { value.bounds.min[0] += 1; },
    value => { value.center[0] += 1; },
    value => { value.anchor[0] += 1; },
  ]) {
    const badParent = copy(parent); mutate(badParent);
    assert.equal(api.nestedTeachingFor(badParent, study, selected), null, `${file}: changed parent denied`);
    const badSelected = copy(selected); mutate(badSelected);
    assert.equal(api.nestedTeachingFor(parent, study, badSelected), null, `${file}: changed source denied`);
  }
  for (const mutate of [
    value => { value.id += '-other'; },
    value => { value.parentId = parents.get(side === 'right' ? 'left' : 'right').id; },
    value => { value.parentFmaId = 'FMA50082'; },
    value => { value.sourceOrder += 1; },
    value => { value.sourcePartCount += 1; },
    value => { value.nodeName += '_other'; },
    value => { value.bundle = 'other-bundle'; },
  ]) {
    const bad = copy(selected); mutate(bad);
    assert.equal(api.nestedTeachingFor(parent, study, bad), null, `${file}: altered child binding denied`);
  }
  for (const sibling of pica.filter(item => item.parentId === parent.id && item.structureId !== selected.id)) {
    assert.equal(api.nestedTeachingFor(parent, study, { ...selected, id: sibling.structureId }), null,
      `${file}: sibling ID cannot borrow source record`);
  }
  assert.equal(api.nestedTeachingFor(parent, 'eye', selected), null, 'Foreign study denied');
  assert.equal(api.nestedTeachingFor(parent, study, parent), null, 'Whole parent is not a source lesson');

  const props = { parent, study, selected, reviewAvailable: false };
  const html = renderToStaticMarkup(React.createElement(api.NestedTeaching, props));
  assert.match(html, /<details[^>]*class="nested-teaching"(?![^>]*\bopen\b)/, 'Teaching stays folded by default');
  assert(html.includes('Teaching draft · specialist review pending'));
  assert(html.includes('Anatomy self-check'));
  assert(html.includes('Reveal answer'));
  assert(html.includes(api.nestedTopicLesson(api.nestedTeachingFor(parent, study, selected), 'anatomy').body));
  assert(html.includes(api.nestedTeachingFor(parent, study, selected).quiz.question));
  assert(html.includes(api.nestedTeachingFor(parent, study, selected).quiz.answer));
  assert(html.includes(file), 'Rendered lesson identifies its supplied source file');
  assert(!html.includes('Review this structure'), 'No approval UI without review availability');
  const tree = api.NestedTeaching(props);
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  assert(nodes(tree).filter(node => node.props?.children === 'Content pending').length >= 4,
    'Pending topics stay pending in actual component tree');
  for (const topic of ['ct', 'mri']) {
    const topicHtml = renderToStaticMarkup(React.createElement(api.NestedTeaching, { ...props, initialTopic: topic }));
    assert(topicHtml.includes(api.nestedTopicLesson(api.nestedTeachingFor(parent, study, selected), topic).body),
      `${file}/${topic} renders in the selected imaging topic`);
  }
}
same(JSON.stringify(catalog), JSON.stringify(api.bodyDisplayCatalog(raw)), 'Teaching cannot mutate source catalog');
assert.equal(execFileSync('git', ['diff', '--name-only', baseline, '--', 'public/models', 'content/sources', 'content/source-holds.json'],
  { encoding: 'utf8' }).trim(), '', 'Supplied models and source records unchanged');
console.log(JSON.stringify({ passed: true, newConcepts: 26, otherSelectionsBaselineCompared: unchanged,
  exactPins: true, sourceGuards: true, foldedSsr: true, clinicalApproval: false, browserAcceptance: false }));
