import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const website = resolve(process.env.VM_WEBSITE_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const component = resolve(process.env.VM_STUDIO_COMPONENT || fileURLToPath(new URL('../components/StudioCourseEditor.tsx', import.meta.url)));
const ts = createRequire(resolve(website, 'package.json'))('typescript');
const code = ts.transpileModule(readFileSync(component, 'utf8'), {compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
}}).outputText;
const jsx = (type, props) => ({type, props});
const slots = [];
const effects = new Map();
let cursor = 0;
const mocks = {
  react: {
    useRef: initial => {const at=cursor++; if (!(at in slots)) slots[at]={current:initial}; return slots[at];},
    useEffect: (effect, deps) => {const at = cursor++, previous = effects.get(at);
      if (!previous || deps.some((value, index) => value !== previous[index])) {effects.set(at, deps); if (deps.length === 1) effect();}},
    useState: initial => {const at = cursor++; if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial;
      return [slots[at], value => {slots[at] = typeof value === 'function' ? value(slots[at]) : value;}];},
  },
  'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
  'next/link': {default: 'a'},
  'next/navigation': {useSearchParams: () => null},
  './StudioForms': {CreateWorkbookForm: 'create-form', DuplicateCourseButton: 'duplicate', EditCourseDetailsForm: 'details-form', ReleaseDraftForm: 'release-form'},
};
const loaded = {exports: {}};
new Function('require', 'module', 'exports', code)(name => {
  assert(Object.hasOwn(mocks, name), `Unexpected dependency: ${name}`);
  return mocks[name];
}, loaded, loaded.exports);
const {StudioCourseEditor, projectSavedCourseOutline} = loaded.exports;
const courses = [{id: 'course-1'}, {id: 'course-2'}];
const item = (id, title, mode = 'lecture', courseId = courses[0].id) => ({id, courseId, title, mode, status: 'draft', caseCount: 0});
const a = item('a', 'Brain lecture'), b = item('b', 'Chest imaging', 'teaching'), c = item('c', 'Brain quiz', 'assessment');
const foreign = item('private-id', 'Hidden other course title', 'lecture', courses[1].id);
const draft = (ids, courseId = courses[0].id) => ({id: 'draft', courseId, status: 'draft', workbookIds: ids});
const all = node => Array.isArray(node) ? node.flatMap(all) : node?.props ? [node, ...all(node.props.children)] : [];
const textOf = node => Array.isArray(node) ? node.map(textOf).join('') : node?.props ? textOf(node.props.children) : node == null ? '' : String(node);
function harness(workbooks = [a, b, c, foreign], releases = [draft(['b', 'missing', 'b', 'a'])]) {
  slots.length = 0; effects.clear();
  let course = courses[0], tree;
  const flush = () => {cursor = 0; tree = StudioCourseEditor({course, workbooks, releases, recoveryScope: {actorId: 'author', organizationId: 'school'}}); return tree;};
  const find = predicate => {const node = all(tree).find(predicate); assert(node, 'Expected node'); return node;};
  const list = label => all(tree).find(node => (node.type === 'ul' || node.type === 'ol') && node.props['aria-label'] === label);
  const search = value => {find(node => node.type === 'input' && node.props.type === 'search').props.onChange({currentTarget: {value}}); flush();};
  const kind = value => {find(node => node.type === 'select' && node.props.id === 'course-outline-kind').props.onChange({currentTarget: {value}}); flush();};
  flush();
  return {find, list, search, kind, get tree() {return tree;}, get text() {return textOf(tree);},
    get rows() {return list('Last saved release draft order')?.props.children ?? [];},
    switchCourse(next) {course = next; flush();}, clear() {find(node => node.type === 'button' && textOf(node) === 'Clear filters').props.onClick(); flush();},
  };
}

test('query and kind intersect on title only, keep saved position numbers and all generic unavailable slots', () => {
  const h = harness();
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.maxLength, 80);
  assert(all(h.tree).some(node => node.type === 'label' && node.props.htmlFor === 'course-outline-title-search'));
  assert(all(h.tree).some(node => node.type === 'label' && node.props.htmlFor === 'course-outline-kind'));
  assert.deepEqual(all(h.tree).filter(node => node.type === 'option').map(textOf), ['All content', 'Lectures', 'Imaging teaching', 'Assessments']);
  h.search('  bRaIn  ');
  assert.match(h.text, /2 of 3 available items match · 2 unavailable saved positions shown/);
  assert.deepEqual(h.rows.map(textOf).map(value => value.slice(0, 1)), ['2', '3', '4']);
  assert.equal(h.list('Not in this release draft')?.props.children.length, 1);
  h.kind('lecture');
  assert.match(h.text, /1 of 3 available items match · 2 unavailable saved positions shown/);
  assert.deepEqual(h.rows.map(textOf).map(value => value.slice(0, 1)), ['2', '3', '4']);
  assert.equal(h.list('Not in this release draft'), undefined);
  assert.doesNotMatch(h.text, /Hidden other course title|private-id|missing/);
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.value, '  bRaIn  ');
  h.search('private-id');
  assert.match(h.text, /0 of 3 available items match · 2 unavailable saved positions shown/);
  assert.equal(h.rows.length, 2);
});

test('each content kind filters available items without reordering or changing the saved projection', () => {
  const h = harness();
  const before = projectSavedCourseOutline(courses[0].id, [a, b, c, foreign], ['b', 'missing', 'b', 'a']);
  h.kind('teaching');
  assert.match(h.text, /1 of 3 available items match/);
  assert.deepEqual(h.rows.map(textOf).map(value => value.slice(0, 1)), ['1', '2', '3']);
  h.kind('assessment');
  assert.match(h.text, /1 of 3 available items match/);
  assert.deepEqual(h.rows.map(textOf).map(value => value.slice(0, 1)), ['2', '3']);
  assert.match(textOf(h.list('Not in this release draft')), /Brain quiz/);
  assert.deepEqual(projectSavedCourseOutline(courses[0].id, [a, b, c, foreign], ['b', 'missing', 'b', 'a']), before);
});

test('empty results count available items separately, clear restores rows, and forms remain mounted', () => {
  const h = harness();
  h.search('none');
  assert.match(h.text, /0 of 3 available items match · 2 unavailable saved positions shown/);
  assert.match(h.text, /No available items match these filters/);
  assert.equal(h.rows.length, 2);
  for (const form of ['create-form', 'details-form', 'release-form']) assert(all(h.tree).some(node => node.type === form));
  h.clear();
  assert.match(h.text, /3 available items · 2 unavailable saved positions shown/);
  assert.equal(h.rows.length, 4);
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.value, '');
  assert.equal(h.find(node => node.type === 'select' && node.props.id === 'course-outline-kind').props.value, 'all');
  assert.equal(h.find(node => node.type === 'button' && textOf(node) === 'Clear filters').props.disabled, true);
});

test('course switch makes earlier query and kind ineffective without touching forms', () => {
  const h = harness([a, b, c, foreign], [draft(['a']), draft([foreign.id], courses[1].id)]);
  h.search('brain'); h.kind('assessment');
  h.switchCourse(courses[1]);
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.value, '');
  assert.equal(h.find(node => node.type === 'select' && node.props.id === 'course-outline-kind').props.value, 'all');
  assert.match(h.text, /1 available items/);
  assert.match(h.text, /Hidden other course title/);
  assert.equal(h.find(node => node.type === 'button' && textOf(node) === 'Clear filters').props.disabled, true);
  h.switchCourse(courses[0]);
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.value, '');
  assert.equal(h.find(node => node.type === 'select' && node.props.id === 'course-outline-kind').props.value, 'all');
  for (const form of ['create-form', 'details-form', 'release-form']) assert(all(h.tree).some(node => node.type === form));
});


test('whitespace-only search can still be cleared without changing the outline', () => {
  const h = harness();
  h.search('   ');
  assert.match(h.text, /3 available items/);
  assert.equal(h.find(node => node.type === 'button' && textOf(node) === 'Clear filters').props.disabled, false);
  h.clear();
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'search').props.value, '');
  assert.equal(h.rows.length, 4);
});


test('clearing filters returns focus to the search rather than the disabled clear button', () => {
 const h=harness();let focused=0;
 h.find(node=>node.type==='input'&&node.props.type==='search').props.ref.current={focus(){focused++;}};
 h.search('brain');h.clear();assert.equal(focused,1);
 assert.equal(h.find(node=>node.type==='input'&&node.props.type==='search').props.value,'');
});
