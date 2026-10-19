import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const sourcePath = new URL('../components/StudioCourseEditor.tsx', import.meta.url);
const requireSite = createRequire(import.meta.url);
const ts = requireSite('typescript');
const source = readFileSync(sourcePath, 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const jsx = (type, props) => ({type, props});
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];

function fixture() {
  let course = {id: 'first', title: 'First course'}, location = new URL('https://example.test/studio/courses/first?pane=review');
  let cursor = 0, effectCursor = 0, dirty = false, tree, pushes = 0;
  const slots = [], effects = [];
  const window = {
    get location() {return location;},
    history: {state: {host: 'retained'}, pushState(_data, _title, path) {location = new URL(path, location); pushes++;}},
    addEventListener() {}, removeEventListener() {},
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], update => {
        const next = typeof update === 'function' ? update(slots[i]) : update;
        if (!Object.is(next, slots[i])) {slots[i] = next; dirty = true;}
      }];
    },
    useEffect(fn, deps) {
      const i = effectCursor++, old = effects[i];
      if (!old || deps.some((x, k) => !Object.is(x, old.deps[k]))) effects[i] = {fn, deps, pending: true, cleanup: old?.cleanup};
    },
  };
  const mocks = {
    react, 'react/jsx-runtime': {jsx, jsxs: jsx}, 'next/link': 'a',
    'next/navigation': {useSearchParams: () => new URLSearchParams(location.search)},
    './StudioForms': {CreateWorkbookForm: 'create', DuplicateCourseButton: 'duplicate', EditCourseDetailsForm: 'edit', ReleaseDraftForm: 'release'},
  };
  const module = {exports: {}};
  new Function('require', 'module', 'exports', 'window', code)((name) => {assert(Object.hasOwn(mocks, name), name); return mocks[name];}, module, module.exports, window);
  function render() {
    for (let pass = 0; pass < 8; pass++) {
      dirty = false; cursor = 0; effectCursor = 0;
      tree = module.exports.StudioCourseEditor({course, workbooks: [], releases: [], recoveryScope: {actorId: 'synthetic', organizationId: 'synthetic'}});
      for (const effect of effects) if (effect?.pending) {effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn();}
      if (!dirty) return tree;
    }
    throw Error('Unstable render');
  }
  const find = predicate => {const found = nodes(tree).find(predicate); assert(found); return found;};
  render();
  return {
    render, find, get pushes() {return pushes;},
    details() {return find(n => n.props.id === 'course-details-editor');},
    optionsToggle() {return nodes(find(n => n.props.className === 'course-options')).find(n => n.type === 'button' && n.props['aria-controls'] === 'course-details-editor');},
    changeCourse() {course = {id: 'second', title: 'Second course'}; location = new URL('https://example.test/studio/courses/second?pane=review'); render();},
  };
}

test('details disclosure is scoped to the course across same-instance navigation', () => {
  const app = fixture();
  assert.equal(app.details().props.hidden, true);
  assert.equal(app.find(n => n.props.id === 'course-review').props.hidden, false);
  const oldToggle = app.optionsToggle().props.onClick;
  oldToggle(); app.render();
  assert.equal(app.details().props.hidden, false);
  assert.equal(app.details().props.children.props.course.id, 'first');
  const oldRecovery = app.details().props.children.props.onDraftRecoveryChange;
  oldRecovery('recovered'); app.render();
  assert(app.find(n => n.props.id === 'course-details-draft-status'));
  app.changeCourse();
  assert.equal(app.details().props.children.props.course.id, 'second');
  assert.equal(app.details().props.hidden, true, 'New course must not expose details opened for the previous course');
  assert.equal(app.optionsToggle().props.children, 'Edit course details');
  assert(!nodes(app.render()).some(n => n.props.id === 'course-details-draft-status'), 'Previous course recovery is not shown');
  oldRecovery('attention'); app.render();
  assert(!nodes(app.render()).some(n => n.props.id === 'course-details-draft-status'), 'Old recovery callback remains inert');
  oldToggle(); app.render();
  assert.equal(app.details().props.hidden, true, 'Stale course action must not reveal the new course');
  app.optionsToggle().props.onClick(); app.render();
  assert.equal(app.details().props.hidden, false, 'Current course action still opens details');
  assert.equal(app.find(n => n.props.id === 'course-review').props.hidden, false);
  assert.equal(app.pushes, 0, 'Details recovery does not mutate pane history');
});
