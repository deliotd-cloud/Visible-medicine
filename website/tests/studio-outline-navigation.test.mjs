import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadOutlineHelper} from './studio-outline-helper-loader.mjs';

const website = resolve(process.env.VM_WEBSITE_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const ts = createRequire(resolve(website, 'package.json'))('typescript');
const helper = loadOutlineHelper(ts, fileURLToPath(new URL('../components/StudioCourseEditor.tsx', import.meta.url)));
const {readCourseOutlineFilter, courseOutlineReturnPath, workbookBuilderPath, clearCourseOutlineParams} = helper;

const pageSource = readFileSync(new URL('../app/studio/workbooks/[workbookId]/builder/page.tsx', import.meta.url), 'utf8');
const pageCode = ts.transpileModule(pageSource, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
const jsx = (type, props) => ({type, props});
const workbooks = [{id: 'lecture-1', courseId: 'course-1', courseTitle: 'Course', mode: 'lecture'}, {id: 'teaching-1', courseId: 'course-1', courseTitle: 'Course', mode: 'teaching'}, {id: 'assessment-1', courseId: 'course-1', courseTitle: 'Course', mode: 'assessment'}];
const pageMocks = {
  'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
  '@/components/EducationRuntime': {EducationRuntime: 'runtime'},
  '../../../../chatgpt-auth': {requireChatGPTUser: async () => ({userId: 'author', email: 'author@example.test', displayName: 'Author'})},
  '@/lib/education-platform': {getStudioSnapshot: async () => ({organization: {id: 'org'}, workbooks})},
  'next/navigation': {notFound: () => {throw Error('not found');}},
  '@/components/LectureEditor': {LectureEditor: 'lecture'},
  'next/link': {default: 'a'},
  '@/lib/lecture-repository': {getLectureStudio: async () => ({})},
  '@/components/SiteFrame': {WorkspaceContextBar: 'bar'},
  '@/lib/studio-outline-navigation': helper,
  '../../../../learn/runtime.css': {},
};
const pageModule = {exports: {}};
new Function('require', 'module', 'exports', pageCode)(name => {assert(Object.hasOwn(pageMocks, name), name); return pageMocks[name];}, pageModule, pageModule.exports);
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value?.props ? [value, ...nodes(value.props.children)] : [];

test('bounded course filter round trips through a builder URL', () => {
  const filter = {courseId: 'course-1', query: 'Brain & MRI', kind: 'lecture'};
  const builder = workbookBuilderPath('lecture/1', filter);
  assert.equal(builder.startsWith('/studio/workbooks/lecture%2F1/builder?'), true);
  assert.deepEqual(readCourseOutlineFilter('course-1', new URL(builder, 'https://example.test').searchParams), filter);
  assert.equal(courseOutlineReturnPath('course-1', new URL(builder, 'https://example.test').searchParams), '/studio/courses/course-1?outlineCourse=course-1&outlineQuery=Brain+%26+MRI&outlineKind=lecture');
  assert.equal(workbookBuilderPath('lecture/1', {courseId: 'course-1', query: '', kind: 'all'}), '/studio/workbooks/lecture%2F1/builder');
});

test('invalid, duplicate, oversized and foreign context returns to bare verified course', () => {
  for (const raw of ['', '?outlineCourse=course-2&outlineQuery=brain&outlineKind=lecture', '?outlineCourse=course-1&outlineQuery=brain&outlineKind=bad', '?outlineCourse=course-1&outlineQuery=one&outlineQuery=two&outlineKind=lecture', '?outlineCourse=course-1&outlineQuery=brain&outlineKind=lecture&outlineKind=lecture', `?outlineCourse=course-1&outlineQuery=${'x'.repeat(81)}&outlineKind=all`, '?outlineCourse=course-1&outlineQuery=%00&outlineKind=all']) {
    assert.equal(courseOutlineReturnPath('course-1', new URLSearchParams(raw)), '/studio/courses/course-1', raw);
  }
  assert.equal(courseOutlineReturnPath('course-1', {outlineCourse: ['course-1', 'course-1'], outlineQuery: 'brain', outlineKind: 'lecture'}), '/studio/courses/course-1');
});

test('clear removes only outline values and preserves tab and unrelated context', () => {
  const params = new URLSearchParams('pane=content&keep=1&outlineCourse=course-1&outlineQuery=brain&outlineKind=all');
  clearCourseOutlineParams(params);
  assert.equal(String(params), 'pane=content&keep=1');
});

test('lecture breadcrumb and teaching or assessment runtime return use verified course context', async () => {
  const query = {outlineCourse: 'course-1', outlineQuery: 'Brain', outlineKind: 'assessment'};
  const expected = '/studio/courses/course-1?outlineCourse=course-1&outlineQuery=Brain&outlineKind=assessment';
  const lecture = await pageModule.exports.default({params: Promise.resolve({workbookId: 'lecture-1'}), searchParams: Promise.resolve(query)});
  assert.equal(nodes(lecture).find(node => node.props.href?.startsWith('/studio/courses/') && node.props.children === 'Course').props.href, expected);
  for (const workbookId of ['teaching-1', 'assessment-1']) {
    const tree = await pageModule.exports.default({params: Promise.resolve({workbookId}), searchParams: Promise.resolve(query)});
    assert.equal(tree.props.returnTo, expected);
    const invalid = await pageModule.exports.default({params: Promise.resolve({workbookId}), searchParams: Promise.resolve({...query, outlineCourse: 'course-2'})});
    assert.equal(invalid.props.returnTo, '/studio/courses/course-1');
  }
});

test('direct builder entry needs no outline context and keeps authoring scope', async () => {
  for (const workbookId of ['lecture-1', 'teaching-1', 'assessment-1']) {
    const tree = await pageModule.exports.default({params: Promise.resolve({workbookId})});
    if (workbookId === 'lecture-1') {
      assert.equal(nodes(tree).find(node => node.props.href?.startsWith('/studio/courses/')).props.href, '/studio/courses/course-1');
      assert.deepEqual(nodes(tree).find(node => node.type === 'lecture').props.expectedStudioContext, {actorId: 'edu:author', organizationId: 'org'});
    } else {
      assert.equal(tree.props.returnTo, '/studio/courses/course-1');
      assert.equal(tree.props.accessMode, 'authoring');
      assert.equal(tree.props.studioAuthorityKey, JSON.stringify(['author', 'org']));
    }
  }
});

test('outline params cannot bypass sign-in or disclose an unavailable workbook', async () => {
  const query = {outlineCourse: 'course-1', outlineQuery: 'Brain', outlineKind: 'lecture', returnTo: 'https://outside.invalid/'};
  const auth = pageMocks['../../../../chatgpt-auth'].requireChatGPTUser;
  const snapshot = pageMocks['@/lib/education-platform'].getStudioSnapshot;
  let calls = 0;
  pageMocks['@/lib/education-platform'].getStudioSnapshot = async (...args) => {calls++; return snapshot(...args);};
  pageMocks['../../../../chatgpt-auth'].requireChatGPTUser = async () => {throw Error('sign-in required');};
  try {
    await assert.rejects(pageModule.exports.default({params: Promise.resolve({workbookId: 'lecture-1'}), searchParams: Promise.resolve(query)}), /sign-in required/);
    assert.equal(calls, 0);
  } finally {
    pageMocks['../../../../chatgpt-auth'].requireChatGPTUser = auth;
    pageMocks['@/lib/education-platform'].getStudioSnapshot = snapshot;
  }
  await assert.rejects(pageModule.exports.default({params: Promise.resolve({workbookId: 'unavailable'}), searchParams: Promise.resolve(query)}), /not found/);
  assert.equal(new URL(courseOutlineReturnPath('course-1', query), 'https://visible.invalid').origin, 'https://visible.invalid');
});
