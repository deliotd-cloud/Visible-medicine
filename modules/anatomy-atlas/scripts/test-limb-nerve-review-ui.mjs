import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
import {limbNerveQuizQuestions} from '../content/limb-nerve-quiz.ts';

const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const compiled = await build({
  stdin: {contents: "export {BodyReviewDetails} from './app/review/body/review-dashboard';", resolveDir: process.cwd(), loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const reactShim = {...React};
const scope = {exports: {}};
runInNewContext(compiled.outputFiles[0].text, {
  module: scope, exports: scope.exports, console,
  require: name => name === 'react' ? reactShim
    : name === 'next/link' ? ({children, ...props}) => React.createElement('a', props, children)
    : name === 'next/image' ? ({unoptimized: _unoptimized, ...props}) => React.createElement('img', props)
    : require(name),
});
const {BodyReviewDetails} = scope.exports;
const walk = (node, found = []) => {
  if (React.isValidElement(node)) {
    found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, found));
  }
  return found;
};
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const note = 'Original factual relationship check; revision-bound radiologist review pending. Muscle surface only, not nerve geometry.';
const checks = Object.entries(limbNerveQuizQuestions).map(([key, question]) => ({
  key, body: question.body, bullets: [...question.choices],
  correctAnswer: question.correctAnswer, explanation: question.explanation,
  citations: [...question.references], note,
}));
assert.equal(checks.length, 8);
const primary = {
  tab: 'quiz', readiness: 'draft', title: 'Primary quiz title',
  body: 'Primary quiz prompt', bullets: ['Primary first choice', 'Primary second choice'],
  correctAnswer: 'Primary second choice', explanation: 'Primary explanation',
  note: 'Primary limitation', citations: ['https://example.org/primary'],
};
function worksheet(topic) {
  return {
    source: {structure: {
      id: 'synthetic-review-muscle', name: 'Synthetic review muscle', fmaId: 'FMA1',
      laterality: 'right', sources: [], sourceTree: 'Synthetic',
    }, bundle: {sha256: 'a'.repeat(64)}, credit: 'Synthetic test source',
    licence: 'Synthetic', sourceVersion: 'test'},
    materialHash: 'b'.repeat(64), atlasLink: null, limits: [],
    topics: [topic], guidedTours: [], reasoning: null, checklist: {},
  };
}
function details(topic) {
  const element = React.createElement(BodyReviewDetails, {material: worksheet(topic)});
  return {html: render(element), tree: BodyReviewDetails({material: worksheet(topic)})};
}
const old = details(primary);
const absent = details({...primary, additionalChecks: undefined});
assert.equal(absent.html, old.html, 'A worksheet without supplemental checks keeps identical output');
assert(!old.html.includes('Supplemental draft questions'));
for (const value of [primary.title, primary.body, ...primary.bullets,
  primary.correctAnswer, primary.explanation, primary.note, primary.citations[0]]) {
  assert(old.html.includes(value), `Existing primary field dropped: ${value}`);
}
assert(walk(old.tree).some(node => node.type === 'a' && node.props.href === primary.citations[0]));

for (const check of checks) {
  const {html, tree} = details({...primary, additionalChecks: [check]});
  const supplement = walk(tree).find(node => node.type === 'section' &&
    node.props['aria-label'] === 'Supplemental draft questions');
  assert(supplement, `Review section missing: ${check.key}`);
  const rendered = words(supplement);
  for (const value of [check.key, check.body, ...check.bullets,
    check.correctAnswer, check.explanation, check.note]) {
    assert(rendered.includes(value), `${check.key}: review text missing ${value}`);
    assert(html.includes(value.replaceAll('&', '&amp;')), `${check.key}: HTML missing ${value}`);
  }
  const links = walk(supplement).filter(node => node.type === 'a');
  assert.deepEqual(links.map(link => link.props.href), check.citations, `${check.key}: source links`);
  for (const link of links) {
    assert.equal(link.props.target, '_blank');
    assert.equal(link.props.rel, 'noopener noreferrer');
    assert(html.includes(link.props.href.replaceAll('&', '&amp;')));
  }
  for (const value of [primary.title, primary.body, ...primary.bullets,
    primary.correctAnswer, primary.explanation, primary.note, primary.citations[0]]) {
    assert(html.includes(value), `${check.key}: primary field dropped: ${value}`);
  }
  assert.equal(walk(tree).filter(node => node.type === 'section' &&
    node.props['aria-label'] === 'Supplemental draft questions').length, 1);
}
const all = details({...primary, additionalChecks: checks});
assert.equal(walk(all.tree).filter(node => node.type === 'h5').length, checks.length);
for (const check of checks) assert(all.html.includes(check.body), check.key);
console.log(JSON.stringify({passed: true, reviewedGroups: checks.length, primaryPreserved: true, untouchedWorksheetIdentical: true}));
