import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const bundled = await build({
  stdin: {contents: "export {SupplementalQuizChecks} from './app/supplemental-quiz-checks';", resolveDir: process.cwd(), loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const states = {panel: [], quiz: []}, refs = {panel: [], quiz: []};
let mode = null, cursor = 0, refCursor = 0;
const shim = {...React,
  useState(initial) {
    if (!mode) return React.useState(initial);
    const owner = mode;
    const position = cursor++;
    if (!(position in states[owner])) states[owner][position] = initial;
    return [states[owner][position], value => { states[owner][position] = value; }];
  },
  useRef(initial) {
    if (!mode) return React.useRef(initial);
    const position = refCursor++;
    return refs[mode][position] ?? (refs[mode][position] = {current: initial});
  },
  useId: () => mode ? 'supplemental-test-id' : React.useId(),
};
function load(react) {
  const scope = {exports: {}};
  runInNewContext(bundled.outputFiles[0].text, {
    module: scope, exports: scope.exports, URL,
    require: id => id === 'react' ? react : require(id), console,
  });
  return scope.exports;
}
const actual = load(React), events = load(shim);
const nodes = (node, result = []) => {
  if (React.isValidElement(node)) {
    result.push(node);
    React.Children.forEach(node.props.children, child => nodes(child, result));
  }
  return result;
};
const words = node => typeof node === 'string' ? node : !node ? ''
  : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && words(node) === label);
const fixture = index => ({
  key: `nerve-${index}`, body: `Which relationship is shown in question ${index + 1}?`,
  bullets: [`A${index}`, `B${index}`, `C${index}`, `D${index}`],
  correctAnswer: [`A${index}`, `B${index}`, `C${index}`, `D${index}`][index % 4],
  explanation: `Explanation for relationship ${index + 1}.`,
  citations: [`https://example.org/anatomy/${index + 1}`],
  note: `Source limitation ${index + 1}.`,
});
const checks = Array.from({length: 8}, (_, i) => fixture(i));
assert.equal(render(React.createElement(actual.SupplementalQuizChecks, {checks: []})), '');
assert.equal(events.SupplementalQuizChecks({checks: []}), null);

const closed = render(React.createElement(actual.SupplementalQuizChecks, {checks}));
assert.match(closed, /^<details class="supplemental-quiz-checks">/);
assert(!closed.includes('<details class="supplemental-quiz-checks" open'));
assert.match(closed, /More checks · Nerve relationships/);
assert.equal((closed.match(/type="radio"/g) || []).length, 4);
assert(closed.includes(checks[0].body));
assert(!closed.includes(checks[1].body));
assert(!closed.includes(checks[0].correctAnswer + '</p>'));
assert(!closed.includes(checks[0].explanation));
assert(!closed.includes(checks[1].citations[0]));
const single = render(React.createElement(actual.SupplementalQuizChecks, {checks: checks.slice(0, 1)}));
assert(single.includes(checks[0].body));
assert(!single.includes('Question 1 of 1'));

let wrapper = events.SupplementalQuizChecks({checks});
assert.equal(wrapper.key, JSON.stringify(checks));
function drawPanel() {
  mode = 'panel'; cursor = 0; refCursor = 0;
  const tree = wrapper.type(wrapper.props);
  mode = null;
  return tree;
}
let panel = drawPanel();
const currentQuiz = () => nodes(panel).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
const currentRegion = () => nodes(panel).find(node => node.props.className === 'supplemental-quiz-checks-question');
assert.equal(currentQuiz().props.question, checks[0].body);
assert.equal(button(panel, 'Previous').props.disabled, true);
assert.equal(button(panel, 'Next').props.disabled, false);
const focus = [];
function followFocus() {
  currentRegion().props.ref({focus(options) {
    assert.equal(options.preventScroll, true);
    focus.push(words(currentRegion().props['aria-label']));
  }});
}
button(panel, 'Previous').props.onClick();
panel = drawPanel();
assert.equal(currentQuiz().props.question, checks[0].body);
button(panel, 'Next').props.onClick();
panel = drawPanel(); followFocus();
assert.equal(currentQuiz().props.question, checks[1].body);
assert(!words(panel).includes(checks[0].body));
assert(!words(panel).includes(checks[0].note));
assert.equal(nodes(panel).filter(node => node.type === 'a')[0].props.href, checks[1].citations[0]);
assert.equal(focus.length, 1);
for (let i = 2; i < checks.length; i++) {
  button(panel, 'Next').props.onClick(); panel = drawPanel(); followFocus();
  assert.equal(currentQuiz().props.question, checks[i].body);
}
assert.equal(button(panel, 'Next').props.disabled, true);
button(panel, 'Next').props.onClick(); panel = drawPanel();
assert.equal(currentQuiz().props.question, checks[7].body);
button(panel, 'Previous').props.onClick(); panel = drawPanel(); followFocus();
assert.equal(currentQuiz().props.question, checks[6].body);
assert.equal(focus.length, 8);

// Exercise each inherited quick check with all four answer positions and both outcomes.
function mark(check, correct) {
  states.panel = []; refs.panel = [];
  states.quiz = []; refs.quiz = [];
  const quiz = events.SupplementalQuizChecks({checks: [check]}).type;
  mode = 'panel'; cursor = 0; refCursor = 0;
  const singlePanel = quiz({checks: [check]});
  mode = null;
  const quick = nodes(singlePanel).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
  const attempt = quick.type(quick.props);
  let tree;
  const redraw = () => {
    mode = 'quiz'; cursor = 0; refCursor = 0;
    tree = attempt.type(attempt.props);
    mode = null;
    for (const node of nodes(tree)) if (node.props.ref) node.props.ref.current = {focus(options) { assert.equal(options.preventScroll, true); }};
  };
  redraw();
  assert(!words(tree).includes(check.explanation));
  const answerIndex = check.bullets.indexOf(check.correctAnswer);
  const pick = correct ? answerIndex : (answerIndex + 1) % check.bullets.length;
  nodes(tree).filter(node => node.type === 'input')[pick].props.onChange(); redraw();
  button(tree, 'Check answer').props.onClick(); redraw();
  assert(words(tree).includes((correct ? 'Correct.' : 'Incorrect.') + ' Correct answer: ' + check.correctAnswer));
  assert(words(tree).includes(check.explanation));
  button(tree, correct ? 'Practise again' : 'Try again').props.onClick(); redraw();
  assert(!words(tree).includes(check.explanation));
  assert.equal(button(tree, 'Check answer').props.disabled, true);
}
for (const check of checks) { mark(check, true); mark(check, false); }

const revision = checks.map(check => ({...check, bullets: [...check.bullets], citations: [...check.citations]}));
revision[0].citations[0] += '?revision=2';
const changed = events.SupplementalQuizChecks({checks: revision});
assert.notEqual(changed.key, wrapper.key);
wrapper = changed;
states.panel = []; refs.panel = [];
panel = drawPanel();
assert.equal(currentQuiz().props.question, checks[0].body);
assert.equal(button(panel, 'Previous').props.disabled, true);
revision[0].body += ' Revised';
assert.notEqual(events.SupplementalQuizChecks({checks: revision}).key, changed.key);

const unavailable = cases => {
  const html = render(React.createElement(actual.SupplementalQuizChecks, {checks: cases}));
  assert.match(html, /supplemental check is unavailable/);
  assert(!html.includes('Check answer'));
  assert(!html.includes(cases[0]?.explanation ?? '__never__'));
};
unavailable([{...checks[0], correctAnswer: 'not a choice'}]);
unavailable([{...checks[0], bullets: ['same', 'same'], correctAnswer: 'same'}]);
unavailable([{...checks[0], citations: ['https://user:secret@example.org/'] }]);
unavailable([{...checks[0], citations: ['http://example.org/'] }]);
unavailable([{...checks[0], citations: []}]);
unavailable([{...checks[0], key: ''}]);
unavailable([{...checks[0], key: checks[0].key}, {...checks[1], key: checks[0].key}]);
console.log(JSON.stringify({passed: true, questions: checks.length, marks: checks.length * 2, navigationFocuses: focus.length}));
