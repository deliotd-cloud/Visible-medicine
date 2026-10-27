import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = resolve(process.env.VM_WEBSITE_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const componentPath = resolve(process.env.VM_STUDIO_COMPONENT || join(sourceRoot, 'components/StudioCourseEditor.tsx'));
const ts = createRequire(join(sourceRoot, 'package.json'))('typescript');
const source = readFileSync(componentPath, 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const jsx = (type, props) => ({ type, props });
let slots = [], layouts = new Map(), cursor = 0;
const react = {
  useRef(initial) { const i = cursor++; return slots[i] ??= {current: initial}; },
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], () => {}]; },
  useMemo(factory, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, at) => !Object.is(value, old.deps[at]))) slots[i] = {deps, value: factory()}; return slots[i].value; },
  useEffect() { cursor++; },
  useLayoutEffect(effect, deps) { const i = cursor++, old = layouts.get(i); if (!old || deps.some((value, at) => !Object.is(value, old.deps[at]))) layouts.set(i, {deps, effect, cleanup: old?.cleanup, pending: true}); },
};
const mocks = {
  react,
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
  'next/link': { default: 'a' },
  'next/navigation': { useSearchParams: () => null },
  './StudioForms': { CreateWorkbookForm: 'create', DuplicateCourseButton: 'duplicate', EditCourseDetailsForm: 'details', ReleaseDraftForm: 'release' },
};
const loaded = { exports: {} };
new Function('require', 'module', 'exports', code)(name => {
  assert(Object.hasOwn(mocks, name), `Unexpected component dependency: ${name}`);
  return mocks[name];
}, loaded, loaded.exports);
const { projectSavedCourseOutline, StudioCourseEditor } = loaded.exports;
const course = { id: 'course-1', title: 'Course', code: 'C-1', description: 'Course description' };
const item = (id, title, status = 'draft', courseId = course.id) => ({ id, courseId, title, status, mode: 'lecture', caseCount: 0 });
const a = item('a', 'Same title'), b = item('b', 'Same title'), c = item('c', 'Third title');
const all = node => Array.isArray(node) ? node.flatMap(all) : node?.props ? [node, ...all(node.props.children)] : [];
const textOf = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : node?.props ? textOf(node.props.children) : '';
const render = (workbooks, releases) => {
  // Each structural projection is an independent mount.
  slots = []; layouts = new Map(); cursor = 0;
  const tree = StudioCourseEditor({ course, workbooks, releases, recoveryScope: { actorId: 'author', organizationId: 'school' } });
  for (const layout of layouts.values()) if (layout.pending) { layout.pending = false; layout.cleanup?.(); layout.cleanup = layout.effect(); }
  return all(tree);
};
const draft = workbookIds => ({ id: 'release-1', courseId: course.id, status: 'draft', workbookIds });

test('exact IDs project saved B→A order and leave C unnumbered without mutating inputs', () => {
  const workbooks = [a, b, c], order = [b.id, a.id];
  const beforeWorkbooks = structuredClone(workbooks), beforeOrder = [...order];
  const result = projectSavedCourseOutline(course.id, workbooks, order);
  assert.equal(result.hasSavedOrder, true);
  assert.deepEqual(result.selected, [b, a]);
  assert.deepEqual(result.unselected, [c]);
  assert.deepEqual(workbooks, beforeWorkbooks);
  assert.deepEqual(order, beforeOrder);
  const nodes = render(workbooks, [draft(order)]);
  const selected = nodes.find(node => node.type === 'ol' && node.props['aria-label'] === 'Last saved release draft order');
  const unused = nodes.find(node => node.type === 'ul' && node.props['aria-label'] === 'Not in this release draft');
  assert.deepEqual(selected.props.children.map(row => all(row).find(child => child.type === 'a')?.props.href), ['/studio/workbooks/b/builder', '/studio/workbooks/a/builder']);
  assert.equal(unused.props.children.length, 1);
  assert.equal(all(unused).some(node => node.props?.className === 'course-item-number'), false);
  assert.match(textOf(nodes), /Last saved release draft order/);
});

test('no editable saved draft shows an unordered content list, not a learner sequence', () => {
  const result = projectSavedCourseOutline(course.id, [a, b], null);
  assert.equal(result.hasSavedOrder, false);
  assert.deepEqual(result.selected, []);
  assert.deepEqual(result.unselected, [a, b]);
  const nodes = render([a, b], []);
  assert(nodes.some(node => node.type === 'ul' && node.props['aria-label'] === 'Course content list'));
  assert(!nodes.some(node => node.type === 'ol' && node.props.className === 'course-outline'));
  assert.match(textOf(nodes), /No learner order is saved in an editable release draft/);
  assert(!textOf(nodes).includes('Last saved release draft order'));
});

test('invalid, duplicate, missing and foreign saved IDs keep generic unavailable slots', () => {
  const foreign = item('foreign', 'Private other course', 'draft', 'other-course');
  const withdrawn = item('retired', 'Retired title', 'withdrawn');
  const result = projectSavedCourseOutline(course.id, [a, b, foreign, withdrawn], [b.id, b.id, 42, 'missing', foreign.id, withdrawn.id]);
  assert.deepEqual(result.selected, [b, null, null, null, null, withdrawn]);
  assert.deepEqual(result.unselected, [a]);
  const nodes = render([a, b, foreign, withdrawn], [draft([b.id, b.id, 42, 'missing', foreign.id, withdrawn.id])]);
  const selected = nodes.find(node => node.type === 'ol' && node.props['aria-label'] === 'Last saved release draft order');
  assert.equal(selected.props.children.length, 6);
  assert.equal(selected.props.children.filter(row => textOf(row).includes('Selected item unavailable')).length, 4);
  assert(!textOf(nodes).includes(foreign.title));
  assert.match(textOf(nodes), /Retired title.*withdrawn.*unavailable to learners/);
  const scoped = render([a, b], [{ ...draft([b.id]), id: 'foreign-release', courseId: 'other-course' }, draft([a.id])]);
  const scopedOrder = scoped.find(node => node.type === 'ol' && node.props['aria-label'] === 'Last saved release draft order');
  assert.equal(all(scopedOrder).find(node => node.type === 'a')?.props.href, '/studio/workbooks/a/builder');
});
