/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component event harness delegates SSR to React */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const proposalRoot=fileURLToPath(new URL('../',import.meta.url));
const sourceRoot=resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposalRoot);
const sourceRequire=createRequire(join(sourceRoot,'package.json'));
const ts=sourceRequire('typescript');
const transpile=file=>ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const helperModule={exports:{}};
runInNewContext(transpile(join(proposalRoot,'lib/quick-check-choice-order.ts')),{module:helperModule,exports:helperModule.exports});
const {orderQuickCheckChoices}=helperModule.exports;

const require = sourceRequire;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
let effects = [], feedbackTextAtFocus = null, radioCheckedAtFocus = null;
const document = { activeElement: null, hidden: false, body: {} };
const shim = { ...React,
  useId: () => active ? 'quick-check' : React.useId(),
  useState(initial) {
    if (!active) return React.useState(initial);
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
  useLayoutEffect(callback) { if (!active) return React.useLayoutEffect(callback); effects.push(callback); },
  useRef(initial) {
    if (!active) return React.useRef(initial);
    const index = refCursor++;
    return refs[index] ?? (refs[index] = { current: initial });
  },
};
const compiled = transpile(join(proposalRoot,'app/structure-quick-check.tsx'));
const scope = { exports: {} };
runInNewContext(compiled, { module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : id === './structure-quick-check.css' ? {} : id === '../lib/quick-check-choice-order' ? helperModule.exports : require(id), console, document });
const { StructureQuickCheck } = scope.exports;
const props = { question: 'Choose the example.', choices: ['Example A', 'Example B'],
  correctAnswer: 'Example B', explanation: 'Example B is the keyed example.' };
let tree, attemptKey;
function render(next = props) {
  const attempt = StructureQuickCheck(next);
  if (attempt.key !== attemptKey) { states = []; refs = []; attemptKey = attempt.key; }
  cursor = 0; refCursor = 0; effects = []; active = true;
  tree = attempt.type(attempt.props); active = false;
  for (const node of walk(tree)) if (node.props.ref) {
    node.props.ref.current = { focus(options) {
      assert.equal(options.preventScroll, true);
      if (node.type === 'input') radioCheckedAtFocus = node.props.checked;
      else feedbackTextAtFocus = text(node);
      document.activeElement = node.type === 'input' ? 'first-radio' : 'feedback';
    } };
  }
  for (const effect of effects) effect();
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
const shownChoices = () => walk(tree).filter(node => node.type === 'label').map(text);
function choiceIndex(label) { const index=shownChoices().indexOf(label); assert(index>=0,'Visible answer exists: '+label); return index; }
function answer(label, next=props) { radios()[choiceIndex(label)].props.onChange(); render(next); button('Check answer').props.onClick(); render(next); }
render();
assert.equal(button('Check answer').props.disabled, true);
const initialOrder=shownChoices();
assert.deepEqual(initialOrder,structuredClone(orderQuickCheckChoices(props.question,props.choices)));
render();assert.deepEqual(shownChoices(),initialOrder,'Rerender must not move choices');
answer('Example B');
assert.match(text(tree), /Correct\. Correct answer: Example B/);
assert.match(text(tree), /keyed example/);
assert.match(feedbackTextAtFocus, /Correct\. Correct answer: Example B.*keyed example/, 'Feedback is populated at the moment focus arrives');
assert.equal(document.activeElement, 'feedback');
assert.equal(button('Try again'), undefined, 'success must not suggest a wrong answer');
button('Practise again').props.onClick(); render();
assert.equal(document.activeElement, 'first-radio');
assert.deepEqual(shownChoices(),initialOrder,'Retry must not reorder choices while focus moves');
assert(radios().every(node => !node.props.checked));
assert.equal(button('Try again'), undefined);
assert.equal(button('Practise again'), undefined);
answer('Example A');
assert.match(text(tree), /Incorrect\. Correct answer: Example B/);
assert(button('Try again'), 'incorrect answers offer retry');
assert.equal(button('Practise again'), undefined);
button('Try again').props.onClick(); render();
assert.equal(document.activeElement, 'first-radio');
assert.equal(radioCheckedAtFocus, false, 'Retry focuses the already-cleared first choice');
assert(radios().every(node => !node.props.checked));
answer('Example A');
radios()[choiceIndex('Example B')].props.onChange(); render();
assert.equal(button('Try again'), undefined, 'changed choice clears prior marking');
for (const next of [
  { ...props, question: 'A changed question.' },
  { ...props, choices: ['Example C', 'Example B'] },
  { ...props, correctAnswer: 'Example A' },
  { ...props, explanation: 'Revised explanation with unchanged labels.' },
]) {
  render(); answer('Example B'); render(next);
  assert(radios().every(node => !node.props.checked));
  assert.equal(button('Try again'), undefined, 'content revision clears feedback');
  assert.equal(button('Practise again'), undefined, 'content revision clears successful retry');
}
const differentKey={...props,correctAnswer:'Example A'};
render(differentKey);
assert.deepEqual(shownChoices(),initialOrder,'The answer key cannot influence display order');
answer('Example A',differentKey);
assert.match(text(tree),/Correct\. Correct answer: Example A/,'Grade by the selected displayed label after a key revision');
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
const htmlLabels=[...html.matchAll(/<span>(.*?)<\/span>/g)].map(match=>match[1]);
assert.deepEqual(htmlLabels,initialOrder,'SSR and client use identical choice order');
const names = [...html.matchAll(/name="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(names).size, 1, 'native radios share one keyboard group');
assert(!/role="radio"|onkeydown|tabindex="0"/i.test(html), 'native radio semantics retained');
assert.match(html, /aria-live="polite"/);
console.log(JSON.stringify({correctAndWrongAnswers:true,retryFocus:true,feedbackFocus:true,contentRevisionReset:true,malformedDraftsFailClosed:true,stableRerenderAndRetry:true,ssrParity:true,nativeRadioSemantics:true,domBrowserAcceptance:false}));
