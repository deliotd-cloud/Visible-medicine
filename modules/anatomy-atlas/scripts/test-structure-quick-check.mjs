/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component event harness delegates SSR to React */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const document = { activeElement: null };
const shim = { ...React,
  useId: () => active ? 'quick-check' : React.useId(),
  useState(initial) {
    if (!active) return React.useState(initial);
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
  useRef(initial) {
    if (!active) return React.useRef(initial);
    const index = refCursor++;
    return refs[index] ?? (refs[index] = { current: initial });
  },
};
const built = await build({ entryPoints: ['app/structure-quick-check.tsx'], bundle: true,
  platform: 'node', format: 'cjs', write: false, external: ['react', 'react/*'] });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : require(id), console });
const { StructureQuickCheck } = scope.exports;
const props = { question: 'Choose the example.', choices: ['Example A', 'Example B'],
  correctAnswer: 'Example B', explanation: 'Example B is the keyed example.' };
let tree, attemptKey;
function render(next = props) {
  const attempt = StructureQuickCheck(next);
  if (attempt.key !== attemptKey) { states = []; refs = []; attemptKey = attempt.key; }
  cursor = 0; refCursor = 0; active = true;
  tree = attempt.type(attempt.props); active = false;
  for (const node of walk(tree)) if (node.props.ref) {
    node.props.ref.current = { focus(options) {
      assert.equal(options.preventScroll, true);
      document.activeElement = node.type === 'input' ? 'first-radio' : 'feedback';
    } };
  }
}
function walk(node, found = []) {
  if (React.isValidElement(node)) {
    found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, found));
  }
  return found;
}
const text = node => typeof node === 'string' ? node : !node ? ''
  : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const radios = () => walk(tree).filter(node => node.type === 'input');
const button = label => walk(tree).find(node => node.type === 'button' && text(node) === label);
function answer(index) { radios()[index].props.onChange(); render(); button('Check answer').props.onClick(); render(); }
render();
assert.equal(button('Check answer').props.disabled, true);
answer(1);
assert.match(text(tree), /Correct\. Correct answer: Example B/);
assert.match(text(tree), /keyed example/);
assert.equal(document.activeElement, 'feedback');
button('Try again').props.onClick(); render();
assert.equal(document.activeElement, 'first-radio');
assert(radios().every(node => !node.props.checked));
assert.equal(button('Try again'), undefined);
answer(0);
assert.match(text(tree), /Incorrect\. Correct answer: Example B/);
radios()[1].props.onChange(); render();
assert.equal(button('Try again'), undefined, 'changed choice clears prior marking');
for (const next of [
  { ...props, question: 'A changed question.' },
  { ...props, choices: ['Example C', 'Example B'] },
  { ...props, correctAnswer: 'Example A' },
  { ...props, explanation: 'Revised explanation with unchanged labels.' },
]) {
  render(); answer(1); render(next);
  assert(radios().every(node => !node.props.checked));
  assert.equal(button('Try again'), undefined, 'content revision clears feedback');
}
for (const next of [
  { ...props, correctAnswer: null }, { ...props, correctAnswer: 'Missing choice' },
  { ...props, choices: ['Example B', 'Example B'] },
  { ...props, choices: ['Example B', ' Example B '] },
  { ...props, choices: ['Example B', ''] },
]) {
  render(next);
  assert.match(text(tree), /cannot be marked/);
  assert.equal(button('Check answer'), undefined);
  assert.equal(radios().length, next.choices.length, 'draft choices remain readable');
}
const html = renderToStaticMarkup(React.createElement(StructureQuickCheck, props));
assert.match(html, /<fieldset[^>]*><legend>Choose the example\.<\/legend>/);
assert.equal((html.match(/type="radio"/g) || []).length, 2);
const names = [...html.matchAll(/name="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(names).size, 1, 'native radios share one keyboard group');
assert(!/role="radio"|onkeydown|tabindex="0"/i.test(html), 'native radio semantics retained');
assert.match(html, /aria-live="polite"/);
console.log('Structure quick check: correct/wrong/reset/revisions/fail-closed and native semantics pass (component event + SSR harness; no DOM/browser claim).');
